import { Hono } from "hono";
import { scrapeProfile } from "../lib/linkedin";
import { normalizeCompanyName, fuzzyMatch } from "../lib/company-normalizer";
import { isValidLinkedInUrl, normalizeLinkedInUrl } from "../lib/validation";
import { calculateTemporalOverlap } from "../lib/overlap";
import { query, run, queryOne } from "../db";

const app = new Hono();

app.get("/api/candidates", async (c) => {
  const candidates = query("SELECT * FROM candidates ORDER BY created_at DESC");
  return c.json(candidates);
});

app.post("/api/candidates", async (c) => {
  const { linkedin_url } = await c.req.json();
  if (!linkedin_url) return c.json({ error: "linkedin_url required" }, 400);

  if (!isValidLinkedInUrl(linkedin_url)) {
    return c.json({ error: "Invalid LinkedIn URL. Expected format: linkedin.com/in/username" }, 400);
  }

  const normalizedUrl = normalizeLinkedInUrl(linkedin_url);
  const existing = queryOne("SELECT * FROM candidates WHERE linkedin_url = ?", [normalizedUrl]);
  if (existing) {
    const history = query("SELECT * FROM candidate_history WHERE candidate_id = ?", [existing.id]);
    return c.json({ ...existing, history, existing: true });
  }

  try {
    const profile = await scrapeProfile(normalizedUrl);
    const candidateId = crypto.randomUUID();

    run(
      "INSERT INTO candidates (id, name, linkedin_url, profile_image_url, source) VALUES (?, ?, ?, ?, ?)",
      [candidateId, profile.name, normalizedUrl, profile.profile_image_url || null, "linkedin"]
    );

    for (const exp of profile.experiences) {
      run(
        "INSERT INTO candidate_history (id, candidate_id, company_name, title, start_year, start_month, end_year, end_month, is_current) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          crypto.randomUUID(),
          candidateId,
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

    const history = query("SELECT * FROM candidate_history WHERE candidate_id = ?", [candidateId]);
    return c.json({ id: candidateId, name: profile.name, history });
  } catch (error: any) {
    if (error.message === 'SESSION_EXPIRED') {
      return c.json({ error: "SESSION_EXPIRED", message: "LinkedIn session expired" }, 401);
    }
    return c.json({ error: error.message }, 500);
  }
});

app.get("/api/candidates/:id", async (c) => {
  const id = c.req.param("id");
  const candidate = queryOne("SELECT * FROM candidates WHERE id = ?", [id]);
  if (!candidate) return c.json({ error: "Not found" }, 404);
  const history = query("SELECT * FROM candidate_history WHERE candidate_id = ?", [id]);
  return c.json({ ...candidate, history });
});

app.get("/api/candidates/:id/overlaps", async (c) => {
  const candidateId = c.req.param("id");
  const candidateJobs = query("SELECT * FROM candidate_history WHERE candidate_id = ?", [candidateId]);

  const overlaps: any[] = [];

  for (const job of candidateJobs) {
    const colleagueJobs = query(
      `SELECT c.id as colleague_id, c.name, c.linkedin_url, c.profile_image_url, c.current_title,
       w.title as their_title, w.company_name, w.start_year as their_start_year,
       w.start_month as their_start_month, w.end_year as their_end_year, w.end_month as their_end_month
       FROM work_history w
       JOIN colleagues c ON c.id = w.colleague_id`
    );

    for (const match of colleagueJobs) {
      if (fuzzyMatch(job.company_name, match.company_name)) {
        const overlap = calculateTemporalOverlap(
          { startYear: job.start_year, startMonth: job.start_month, endYear: job.end_year, endMonth: job.end_month },
          { startYear: match.their_start_year, startMonth: match.their_start_month, endYear: match.their_end_year, endMonth: match.their_end_month }
        );

        if (overlap.months !== 0) { // -1 means unknown dates, >0 means actual overlap
          overlaps.push({
            colleague: {
              id: match.colleague_id,
              name: match.name,
              linkedin_url: match.linkedin_url,
              profile_image_url: match.profile_image_url,
              current_title: match.current_title,
            },
            company: match.company_name,
            candidate_title: job.title,
            colleague_title: match.their_title,
            overlap_months: overlap.months > 0 ? overlap.months : null, // null for unknown
            overlap_period: overlap.period,
            type: "work",
          });
        }
      }
    }
  }

  const seen = new Set();
  const deduped = overlaps
    .sort((a, b) => (b.overlap_months ?? -1) - (a.overlap_months ?? -1))
    .filter((o) => {
      const key = `${o.colleague.id}-${o.company}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return c.json(deduped);
});

app.delete("/api/candidates/:id", async (c) => {
  const id = c.req.param("id");
  run("DELETE FROM candidates WHERE id = ?", [id]);
  return c.json({ success: true });
});

export default app;
