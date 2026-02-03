import { Database } from "bun:sqlite";
import { join } from "path";

// DB is in project root, server is started from project root
const DB_PATH = join(process.cwd(), "network.db");

const db = new Database(DB_PATH);
db.exec("PRAGMA foreign_keys = ON");

export function query<T>(sql: string, params?: any[]): T[] {
  const stmt = db.prepare(sql);
  return stmt.all(...(params || [])) as T[];
}

export function queryOne<T>(sql: string, params?: any[]): T | null {
  const stmt = db.prepare(sql);
  return (stmt.get(...(params || [])) as T | null) || null;
}

export function run(sql: string, params?: any[]): void {
  const stmt = db.prepare(sql);
  stmt.run(...(params || []));
}

export function getDb() {
  return db;
}

export default db;
