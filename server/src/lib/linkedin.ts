import puppeteer, { Browser, Page } from 'puppeteer';
import { queryOne } from '../db';
import { parseLinkedInHtml } from './ai';

let browser: Browser | null = null;
let lastRequestTime = 0;

export interface ScrapedProfile {
  name: string;
  profile_image_url: string | null;
  headline: string | null;
  experiences: {
    company: string;
    title: string | null;
    start_year: number | null;
    start_month: number | null;
    end_year: number | null;
    end_month: number | null;
    isCurrent: boolean;
  }[];
}

async function getBrowser(): Promise<Browser> {
  // Check if existing browser is still connected
  if (browser && !browser.connected) {
    try { await browser.close(); } catch { }
    browser = null;
  }

  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'shell',  // Use the new headless mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });
  }
  return browser;
}

export async function scrapeProfile(url: string): Promise<ScrapedProfile> {
  const cookie = await getSetting('li_at_cookie');
  if (!cookie) throw new Error('SESSION_EXPIRED');

  // Rate limiting
  const now = Date.now();
  const delay = parseInt(await getSetting('rate_limit_ms') || '2000', 10);
  const elapsed = now - lastRequestTime;
  if (elapsed < delay) {
    await new Promise(r => setTimeout(r, delay - elapsed));
  }
  lastRequestTime = Date.now();

  const b = await getBrowser();
  const page = await b.newPage();

  try {
    // Set LinkedIn session cookie
    await page.setCookie({
      name: 'li_at',
      value: cookie,
      domain: '.linkedin.com',
      path: '/',
      httpOnly: true,
      secure: true
    });

    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Navigate to profile
    console.log(`Scraper: Navigating to ${url}`);
    // Use load event instead of networkidle - LinkedIn keeps making requests indefinitely
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });

    // Wait a bit for dynamic content
    await new Promise(r => setTimeout(r, 3000));

    // Check if logged in
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/checkpoint')) {
      throw new Error('SESSION_EXPIRED');
    }

    // Scroll to load dynamic content
    await autoScroll(page);

    // Wait a bit for content to settle
    await new Promise(r => setTimeout(r, 2000));

    // Extract text content using page.evaluate for reliable extraction
    const textContent = await page.evaluate(() => {
      // Remove script and style elements first
      const scripts = document.querySelectorAll('script, style, noscript');
      scripts.forEach(el => el.remove());

      // Get the main profile content
      const mainContent = document.querySelector('main') || document.body;
      return mainContent.innerText || '';
    });

    const html = textContent.slice(0, 30000);
    console.log(`Scraper: Extracted ${html.length} chars of text, first 500: ${html.slice(0, 500)}`);

    if (html.length < 100) {
      // Try alternative extraction if main content is empty
      const altContent = await page.evaluate(() => {
        return document.body.innerText || '';
      });
      const altHtml = altContent.slice(0, 30000);
      console.log(`Scraper: Alternative extraction got ${altHtml.length} chars`);

      if (altHtml.length < 100) {
        throw new Error('Failed to extract page content - page may not have loaded properly');
      }

      // Parse with AI using alternative content
      const parsed = await parseLinkedInHtml(altHtml);
      console.log(`Scraper: AI extracted ${parsed.experiences.length} experiences`);

      return {
        name: parsed.name || 'Unknown',
        profile_image_url: null,
        headline: parsed.headline,
        experiences: parsed.experiences.map(e => ({
          company: e.company_name,
          title: e.title,
          start_year: e.start_year,
          start_month: e.start_month,
          end_year: e.end_year,
          end_month: e.end_month,
          isCurrent: e.is_current
        }))
      };
    }

    // Parse with AI
    const parsed = await parseLinkedInHtml(html);
    console.log(`Scraper: AI extracted ${parsed.experiences.length} experiences`);

    return {
      name: parsed.name || 'Unknown',
      profile_image_url: null,
      headline: parsed.headline,
      experiences: parsed.experiences.map(e => ({
        company: e.company_name,
        title: e.title,
        start_year: e.start_year,
        start_month: e.start_month,
        end_year: e.end_year,
        end_month: e.end_month,
        isCurrent: e.is_current
      }))
    };
  } catch (error: any) {
    if (error.message === 'SESSION_EXPIRED') {
      throw error;
    }
    console.error('Scraper error:', error);
    throw error;
  } finally {
    await page.close();
  }
}

async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight || totalHeight > 5000) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
  // Wait for any lazy-loaded content
  await new Promise(r => setTimeout(r, 1000));
}

export async function closeScraper(): Promise<void> {
  if (browser) {
    try { await browser.close(); } catch { }
    browser = null;
  }
}

export async function validateSession(cookie: string): Promise<boolean> {
  try {
    const res = await fetch('https://www.linkedin.com/feed/', {
      headers: { 'Cookie': `li_at=${cookie}` },
      redirect: 'manual'  // Don't follow redirects - login redirect means invalid
    });
    // 200 = valid session, 3xx redirect to login = invalid
    return res.status === 200;
  } catch {
    return false;
  }
}

async function getSetting(key: string): Promise<string | null> {
  const row = queryOne<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

// Cleanup on exit
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => { await closeScraper(); process.exit(0); });
  process.on('SIGTERM', async () => { await closeScraper(); process.exit(0); });
  process.on('beforeExit', async () => { await closeScraper(); });
}
