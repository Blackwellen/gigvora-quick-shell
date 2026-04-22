/**
 * Shared transport for the NestJS Gigvora API. All domain API modules
 * (feed, inbox, search, notifications, calendar, …) build on top of `req`.
 *
 * Base URL comes from `VITE_GIGVORA_API_URL`; when unset, calls fail fast
 * and consumers fall back to preview/mock state.
 */
export const API_BASE = ((import.meta as any).env?.VITE_GIGVORA_API_URL?.replace(/\/$/, '') || '');

export const apiConfigured = (): boolean => !!(import.meta as any).env?.VITE_GIGVORA_API_URL;

export function authHeaders(extra?: HeadersInit): HeadersInit {
  const h: Record<string, string> = { 'content-type': 'application/json' };
  try {
    const t = localStorage.getItem('gigvora.token');
    if (t) h['authorization'] = `Bearer ${t}`;
  } catch {/* noop */}
  if (extra) Object.assign(h, extra as Record<string, string>);
  return h;
}

export async function req<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  if (!apiConfigured()) throw new Error('api_not_configured');
  const r = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
  });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`api ${r.status}: ${text || r.statusText}`);
  }
  // Some endpoints return 204 / empty body
  const ctype = r.headers.get('content-type') ?? '';
  if (!ctype.includes('application/json')) return undefined as unknown as T;
  return r.json() as Promise<T>;
}
