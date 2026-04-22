/**
 * Lightweight Gigvora SDK singleton for the web app.
 * - Picks API base URL from VITE_GIGVORA_API_URL or falls back to '/api'.
 * - Reads bearer token from localStorage 'gigvora.token' (set by AuthContext when wired).
 * - Network failures bubble up; callers should fall back to mock data when offline.
 */
import { GigvoraClient } from '@gigvora/sdk';

const baseUrl =
  (import.meta as any).env?.VITE_GIGVORA_API_URL?.replace(/\/$/, '') || '';

export const sdk = new GigvoraClient({
  baseUrl,
  getToken: () => {
    try { return localStorage.getItem('gigvora.token'); } catch { return null; }
  },
});

/** True only when an API base URL is configured AND a token is present. */
export const sdkReady = (): boolean => {
  if (!baseUrl) return false;
  try { return !!localStorage.getItem('gigvora.token'); } catch { return false; }
};
