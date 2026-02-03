import db from "./index";

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS colleagues (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    linkedin_url TEXT UNIQUE,
    current_title TEXT,
    current_company TEXT,
    profile_image_url TEXT,
    enriched_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS work_history (
    id TEXT PRIMARY KEY,
    colleague_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    company_linkedin_url TEXT,
    title TEXT,
    start_year INTEGER,
    start_month INTEGER,
    end_year INTEGER,
    end_month INTEGER,
    is_current INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(colleague_id) REFERENCES colleagues(id) ON DELETE CASCADE
  )
`);



db.exec(`
  CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    name TEXT,
    linkedin_url TEXT UNIQUE,
    profile_image_url TEXT,
    source TEXT DEFAULT 'linkedin',
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS candidate_history (
    id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    company_linkedin_url TEXT,
    title TEXT,
    start_year INTEGER,
    start_month INTEGER,
    end_year INTEGER,
    end_month INTEGER,
    is_current INTEGER DEFAULT 0,
    FOREIGN KEY(candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS colleague_education (
    id TEXT PRIMARY KEY,
    colleague_id TEXT NOT NULL,
    school_name TEXT NOT NULL,
    school_linkedin_url TEXT,
    degree TEXT,
    field_of_study TEXT,
    start_year INTEGER,
    end_year INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(colleague_id) REFERENCES colleagues(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS candidate_education (
    id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    school_name TEXT NOT NULL,
    school_linkedin_url TEXT,
    degree TEXT,
    field_of_study TEXT,
    start_year INTEGER,
    end_year INTEGER,
    FOREIGN KEY(candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
  )
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_work_history_company ON work_history(company_name)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_work_history_company_url ON work_history(company_linkedin_url)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_candidate_history_company ON candidate_history(company_name)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_candidate_history_company_url ON candidate_history(company_linkedin_url)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_colleague_education_school ON colleague_education(school_name)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_colleague_education_school_url ON colleague_education(school_linkedin_url)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_candidate_education_school ON candidate_education(school_name)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_candidate_education_school_url ON candidate_education(school_linkedin_url)`);

const stmt = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
stmt.run("current_company", "Shopify");
stmt.run("li_at_cookie", "");
stmt.run("rate_limit_ms", "2000");

console.log("Database migrated successfully");
