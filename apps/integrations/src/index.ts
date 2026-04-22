/**
 * Integration adapter registry.
 * Each adapter exposes: { id, healthcheck(), config schema, normalized error mapping }.
 * Concrete adapters live under ./payments, ./email, ./sms, ./auth, ./storage, ./ai, ./calendar, ./billing.
 */
export interface Adapter<Cfg = unknown> {
  id: string;
  category: 'payments' | 'email' | 'sms' | 'auth' | 'storage' | 'ai' | 'calendar' | 'billing' | 'analytics' | 'voice';
  configure(cfg: Cfg): void;
  healthcheck(): Promise<{ ok: boolean; detail?: string }>;
}

const registry = new Map<string, Adapter>();
export const register = (a: Adapter) => registry.set(a.id, a);
export const get = (id: string) => registry.get(id);
export const list = (category?: Adapter['category']) =>
  [...registry.values()].filter((a) => !category || a.category === category);
