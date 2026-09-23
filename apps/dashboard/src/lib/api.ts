export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
export const DEMO = process.env.NEXT_PUBLIC_DEMO_AUTH === 'true';

export function token(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cg_token');
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  const t = token();
  if (t) headers.set('authorization', `Bearer ${t}`);
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}
