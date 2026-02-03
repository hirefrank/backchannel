import { Hono } from "hono";
import { parse } from "papaparse";
import { scrapeProfile } from "../lib/linkedin";
import { normalizeCompanyName } from "../lib/company-normalizer";
import { query, run, queryOne } from "../db";

interface LinkedInCSVRow {
  "First Name": string;
  "Last Name": string;
  URL: string;
  "Email Address": string;
  Company: string;
  Position: string;
  "Connected On": string;
}

const app = new Hono();

app.get("/api/colleagues", async (c) => {
  const colleagues = query("SELECT * FROM colleagues ORDER BY name");
  return c.json(colleagues);
});

app.get("/api/colleagues/:id", async (c) => {
  const id = c.req.param("id");
  const colleague = queryOne("SELECT * FROM colleagues WHERE id = ?", [id]);
  if (!colleague) return c.json({ error: "Not found" }, 404);
  const workHistory = query("SELECT * FROM work_history WHERE colleague_id = ?", [id]);
  return c.json({ ...colleague, work_history: workHistory });
});

app.post("/api/colleagues/import", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  let text = await file.text();

  // LinkedIn CSVs have a "Notes:" section at the top - skip it by finding the header row
  const lines = text.split('\n');
  const headerIndex = lines.findIndex(line => line.startsWith('First Name,'));
  if (headerIndex > 0) {
    text = lines.slice(headerIndex).join('\n');
  }

  const rows: LinkedInCSVRow[] = parse(text, { header: true, transformHeader: (h) => h.trim(), skipEmptyLines: true }).data as LinkedInCSVRow[];

  const currentCompanySetting = queryOne<{ value: string }>("SELECT value FROM settings WHERE key = ?", ["current_company"]);
  const filter = currentCompanySetting?.value?.toLowerCase().trim() || "";

  // If filter is empty, import all; otherwise filter by company
  const filtered = filter
    ? rows.filter((row: LinkedInCSVRow) => row.Company?.toLowerCase().includes(filter))
    : rows;

  let imported = 0;
  let skipped = 0;

  for (const row of filtered) {
    const linkedinUrl = row.URL?.trim();
    if (!linkedinUrl) continue;

    const exists = queryOne("SELECT id FROM colleagues WHERE linkedin_url = ?", [linkedinUrl]);
    if (exists) {
      skipped++;
      continue;
    }

    const firstName = row["First Name"] || "";
    const lastName = row["Last Name"] || "";
    const id = crypto.randomUUID();
    run(
      "INSERT INTO colleagues (id, name, linkedin_url, current_title, current_company) VALUES (?, ?, ?, ?, ?)",
      [id, `${firstName} ${lastName}`.trim(), linkedinUrl, row.Position || null, row.Company || null]
    );
    imported++;
  }

  return c.json({
    imported,
    skipped,
    total: rows.length,
    filtered_out: rows.length - filtered.length,
    filter: filter || "(none - importing all)"
  });
});

app.post("/api/colleagues/:id/enrich", async (c) => {
  const id = c.req.param("id");
  const colleague = queryOne<{ linkedin_url: string | null }>("SELECT linkedin_url FROM colleagues WHERE id = ?", [id]);
  if (!colleague) return c.json({ error: "Not found" }, 404);
  if (!colleague.linkedin_url) return c.json({ error: "No LinkedIn URL" }, 400);

  try {
    const profile = await scrapeProfile(colleague.linkedin_url);

    // Don't mark as enriched if we couldn't extract any experiences
    if (profile.experiences.length === 0) {
      return c.json({
        success: false,
        error: "EXTRACTION_FAILED",
        message: "Could not extract work history. The AI may have timed out or the profile may be private."
      }, 422);
    }

    // Clear existing work history before inserting fresh data
    run("DELETE FROM work_history WHERE colleague_id = ?", [id]);

    for (const exp of profile.experiences) {
      run(
        "INSERT INTO work_history (id, colleague_id, company_name, title, start_year, start_month, end_year, end_month, is_current) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          crypto.randomUUID(),
          id,
          normalizeCompanyName(exp.company),
          exp.title,
          exp.start_year,
          exp.start_month,
          exp.end_year,
          exp.end_month,
          exp.isCurrent ? 1 : 0
        ]
      );
    }

    run("UPDATE colleagues SET enriched_at = datetime('now'), current_title = ? WHERE id = ?", [profile.headline, id]);
    return c.json({ success: true, name: profile.name, count: profile.experiences.length });
  } catch (error: any) {
    if (error.message === 'SESSION_EXPIRED') {
      return c.json({ error: "SESSION_EXPIRED", message: "LinkedIn session expired. Please update your session cookie." }, 401);
    }
    console.error("Enrich error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/api/colleagues/:id", async (c) => {
  const id = c.req.param("id");
  run("DELETE FROM colleagues WHERE id = ?", [id]);
  return c.json({ success: true });
});

export default app;
