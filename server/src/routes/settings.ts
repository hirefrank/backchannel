import { Hono } from "hono";
import { query, run } from "../db";
import { validateSession, closeScraper } from "../lib/linkedin";

const app = new Hono();

app.get("/api/settings", async (c) => {
  const settings = query<{ key: string; value: string }>("SELECT key, value FROM settings");
  const result: Record<string, string> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }

  // Check LinkedIn session validity
  const cookie = result.li_at_cookie;
  let linkedinSessionValid = false;
  if (cookie) {
    linkedinSessionValid = await validateSession(cookie);
  }

  return c.json({
    ...result,
    linkedin_session_valid: linkedinSessionValid
  });
});

app.post("/api/settings/test-linkedin", async (c) => {
  const settings = query<{ key: string; value: string }>("SELECT key, value FROM settings WHERE key = 'li_at_cookie'");
  const cookie = settings[0]?.value;
  if (!cookie) {
    return c.json({ valid: false, error: "No cookie set" });
  }
  const valid = await validateSession(cookie);
  return c.json({ valid });
});

app.put("/api/settings/:key", async (c) => {
  const key = c.req.param("key");
  const { value } = await c.req.json();
  run(
    "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",
    [key, value]
  );

  // Invalidate scraper if updating li_at_cookie
  if (key === 'li_at_cookie') {
    await closeScraper();
  }

  return c.json({ success: true });
});

export default app;
