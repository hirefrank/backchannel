import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { queryOne } from "../db";

// Default model - can be overridden via settings
const DEFAULT_MODEL = "gemini-3-flash-preview";

function getAIConfig() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    queryOne<{ value: string }>("SELECT value FROM settings WHERE key = ?", ["gemini_api_key"])?.value;

  const modelName = process.env.AI_MODEL ||
    queryOne<{ value: string }>("SELECT value FROM settings WHERE key = ?", ["ai_model"])?.value ||
    DEFAULT_MODEL;

  return { apiKey, modelName };
}

function cleanHtml(html: string): string {
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
    .replace(/\s(style|data-[a-z-]+)="[^"]*"/gi, '')
    .replace(/\sclass="[^"]*"/gi, '')
    .replace(/\s+/g, ' ');
  return cleaned.slice(0, 50000);
}

export interface ParsedExperience {
  company_name: string;
  title: string | null;
  start_year: number | null;
  start_month: number | null;
  end_year: number | null;
  end_month: number | null;
  is_current: boolean;
}

export interface ParsedEducation {
  school_name: string;
  degree: string | null;
  field_of_study: string | null;
  start_year: number | null;
  end_year: number | null;
}

export interface ParsedLinkedInProfile {
  name: string | null;
  headline: string | null;
  experiences: ParsedExperience[];
  education: ParsedEducation[];
}

export interface ParsedResume {
  experiences: ParsedExperience[];
  education: ParsedEducation[];
}

export async function parseLinkedInHtml(pageText: string): Promise<ParsedLinkedInProfile> {
  const emptyResult = { name: null, headline: null, experiences: [], education: [] };

  try {
    const { apiKey, modelName } = getAIConfig();
    if (!apiKey) {
      console.error("AI: No API key configured");
      return emptyResult;
    }

    const google = createGoogleGenerativeAI({ apiKey });
    // Truncate to reasonable size for API
    const truncatedText = pageText.slice(0, 30000);
    console.log(`AI: Using model ${modelName}, text size: ${truncatedText.length}`);

    const { text } = await generateText({
      model: google(modelName),
      maxRetries: 2,
      abortSignal: AbortSignal.timeout(60000), // 60 second timeout
      prompt: `Extract the person's profile information from this LinkedIn profile page text. Return ONLY valid JSON:
{
  "name": "Full Name",
  "headline": "Their job title/headline",
  "experiences": [{"company_name": "Company", "title": "Job Title", "start_year": 2020, "start_month": 1, "end_year": 2023, "end_month": 12, "is_current": false}],
  "education": [{"school_name": "University", "degree": "Degree", "field_of_study": "Field", "start_year": 2016, "end_year": 2020}]
}

Rules:
- Extract ALL work experiences you can find
- For current jobs, set is_current: true and end_year/end_month to null
- If month is unknown, use 1 for start_month and 12 for end_month
- Return empty arrays if no data found

Page text:
${truncatedText}`,
    });

    console.log("AI: Response (first 300):", text.slice(0, 300));
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        name: parsed.name || null,
        headline: parsed.headline || null,
        experiences: parsed.experiences || [],
        education: parsed.education || [],
      };
    }
    return emptyResult;
  } catch (error) {
    console.error("AI LinkedIn parsing error:", error);
    return emptyResult;
  }
}

export async function parseResumeText(resumeText: string): Promise<ParsedResume> {
  const emptyResult = { experiences: [], education: [] };

  try {
    const { apiKey, modelName } = getAIConfig();
    if (!apiKey) {
      console.error("AI: No API key configured");
      return emptyResult;
    }

    const google = createGoogleGenerativeAI({ apiKey });

    const { text } = await generateText({
      model: google(modelName),
      maxRetries: 2,
      abortSignal: AbortSignal.timeout(60000), // 60 second timeout
      prompt: `Extract employment history AND education from this resume. Return ONLY valid JSON:
{
  "experiences": [{"company_name": "Company", "title": "Job Title", "start_year": 2020, "start_month": 1, "end_year": 2023, "end_month": 12, "is_current": false}],
  "education": [{"school_name": "University Name", "degree": "Bachelor of Science", "field_of_study": "Computer Science", "start_year": 2016, "end_year": 2020}]
}

Resume:
${resumeText}`,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        experiences: parsed.experiences || [],
        education: parsed.education || [],
      };
    }
    return emptyResult;
  } catch (error) {
    console.error("AI resume parsing error:", error);
    return emptyResult;
  }
}
