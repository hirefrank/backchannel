import { queryOne, query, run } from '../db';

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await queryOne<Setting>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const settings = await query<Setting>('SELECT key, value FROM settings');
  return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
}

export async function setSetting(key: string, value: string): Promise<void> {
  run(
    'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime("now"))',
    [key, value]
  );
}

export async function deleteSetting(key: string): Promise<void> {
  run('DELETE FROM settings WHERE key = ?', [key]);
}
