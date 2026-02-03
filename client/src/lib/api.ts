const API_BASE = "/api";

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `API error: ${res.status}`);
  }
  return data;
}

export async function fetchSettings() {
  const res = await fetch(`${API_BASE}/settings`);
  return handleResponse<Record<string, string>>(res);
}

export async function updateSetting(key: string, value: string) {
  const res = await fetch(`${API_BASE}/settings/${key}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });
  return handleResponse<{ success: boolean }>(res);
}

export async function getColleagues() {
  const res = await fetch(`${API_BASE}/colleagues`);
  return handleResponse<any[]>(res);
}

export async function getColleague(id: string) {
  const res = await fetch(`${API_BASE}/colleagues/${id}`);
  return handleResponse<any>(res);
}

export async function importColleagues(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/colleagues/import`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<{ imported: number; skipped: number; total: number }>(res);
}

export async function enrichColleague(id: string) {
  const res = await fetch(`${API_BASE}/colleagues/${id}/enrich`, { method: "POST" });
  return handleResponse<{ success: boolean; count: number }>(res);
}

export async function deleteColleague(id: string) {
  const res = await fetch(`${API_BASE}/colleagues/${id}`, { method: "DELETE" });
  return handleResponse<{ success: boolean }>(res);
}

export async function createCandidate(linkedinUrl: string) {
  const res = await fetch(`${API_BASE}/candidates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ linkedin_url: linkedinUrl }),
  });
  return handleResponse<{ id: string; name: string; history: any[]; existing?: boolean }>(res);
}

export async function getCandidates() {
  const res = await fetch(`${API_BASE}/candidates`);
  return handleResponse<any[]>(res);
}

export async function getCandidate(id: string) {
  const res = await fetch(`${API_BASE}/candidates/${id}`);
  return handleResponse<any>(res);
}

export async function getCandidateOverlaps(id: string) {
  const res = await fetch(`${API_BASE}/candidates/${id}/overlaps`);
  return handleResponse<any[]>(res);
}

export async function deleteCandidate(id: string) {
  const res = await fetch(`${API_BASE}/candidates/${id}`, { method: "DELETE" });
  return handleResponse<{ success: boolean }>(res);
}
