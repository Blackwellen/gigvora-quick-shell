/**
 * Domain 65 — Internal Admin Login Terminal hooks (web).
 *
 * Surfaces: overview KPIs + insights, environments, operators, the login flow
 * (login → step-up → switch env), session list/revoke, attempts + audit.
 */
import { useCallback, useEffect, useState } from 'react';

export type RiskBand = 'low'|'medium'|'high'|'critical';
export type OperatorRole = 'operator'|'moderator'|'finance'|'trust_safety'|'super_admin';
export type SessionStatus = 'active'|'stepup_pending'|'expired'|'revoked';
export type AttemptOutcome = 'success'|'invalid_credentials'|'mfa_failed'|'locked'|'env_forbidden'|'ip_forbidden'|'inactive'|'unknown';

export interface IaltEnvironment {
  id: string; slug: string; label: string; riskBand: RiskBand;
  status: 'active'|'paused'|'archived'; requiresStepUp: boolean;
  ipAllowlist: string[]; bannerText: string|null;
  meta: Record<string, unknown>; createdAt: string; updatedAt: string;
}
export interface IaltOperator {
  id: string; identityId: string; email: string; role: OperatorRole;
  status: 'active'|'paused'|'revoked'; mfaEnrolled: boolean;
  allowedEnvs: string[]; lastLoginAt: string|null;
  meta: Record<string, unknown>; createdAt: string; updatedAt: string;
}
export interface IaltSession {
  id: string; operatorId: string; environmentSlug: string;
  status: SessionStatus; stepUpVerifiedAt: string|null;
  ip: string|null; userAgent: string|null;
  issuedAt: string; expiresAt: string; revokedAt: string|null;
  meta: Record<string, unknown>;
}
export interface IaltAttempt {
  id: string; identityId: string|null; email: string|null;
  environmentSlug: string|null; outcome: AttemptOutcome;
  ip: string|null; userAgent: string|null; reason: string|null;
  attemptedAt: string; meta: Record<string, unknown>;
}
export interface IaltAudit {
  id: string; operatorId: string|null; identityId: string|null;
  action: string; environmentSlug: string|null;
  targetType: string|null; targetId: string|null;
  diff: Record<string, unknown>; ip: string|null; userAgent: string|null;
  createdAt: string;
}
export interface IaltOverview {
  kpis: {
    environments: number; operators: number; activeOperators: number;
    mfaEnrolled: number; failures24h: number;
  };
  recentAttempts: IaltAttempt[]; recentAudit: IaltAudit[];
  insights: { id: string; severity: 'info'|'success'|'warn'|'critical'; title: string; body?: string }[];
  computedAt: string;
}

const API = '/api/v1/internal-admin-login-terminal';

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) throw new Error(`request failed: ${res.status} ${await res.text().catch(() => '')}`);
  return res.json() as Promise<T>;
}
function jsonBody(method: string, body: unknown): RequestInit {
  return { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}

const DEMO_OVERVIEW: IaltOverview = {
  kpis: { environments: 0, operators: 0, activeOperators: 0, mfaEnrolled: 0, failures24h: 0 },
  recentAttempts: [], recentAudit: [],
  insights: [{ id: 'demo', severity: 'info', title: 'Demo mode', body: 'Terminal data will appear once wired.' }],
  computedAt: new Date().toISOString(),
};

export function useIaltOverview(opts?: { demoMode?: boolean }) {
  const [data, setData] = useState<IaltOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setData(DEMO_OVERVIEW); return; }
      setData(await getJson<IaltOverview>(`${API}/overview`));
    } catch (e) { setError(e as Error); if (opts?.demoMode !== false) setData(DEMO_OVERVIEW); }
    finally { setLoading(false); }
  }, [opts?.demoMode]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useIaltEnvironments() {
  const [items, setItems] = useState<IaltEnvironment[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try { setItems(await getJson<IaltEnvironment[]>(`${API}/environments`)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: Partial<IaltEnvironment>) => {
    const r = await getJson<IaltEnvironment>(`${API}/environments`, jsonBody('POST', dto));
    await reload(); return r;
  }, [reload]);
  const update = useCallback(async (id: string, dto: Partial<IaltEnvironment>) => {
    await getJson(`${API}/environments/${id}`, jsonBody('PATCH', dto));
    await reload();
  }, [reload]);
  return { items, loading, reload, create, update };
}

export function useIaltOperators() {
  const [items, setItems] = useState<IaltOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try { setItems(await getJson<IaltOperator[]>(`${API}/operators`)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: Partial<IaltOperator>) => {
    const r = await getJson<IaltOperator>(`${API}/operators`, jsonBody('POST', dto));
    await reload(); return r;
  }, [reload]);
  const update = useCallback(async (id: string, dto: Partial<IaltOperator>) => {
    await getJson(`${API}/operators/${id}`, jsonBody('PATCH', dto));
    await reload();
  }, [reload]);
  return { items, loading, reload, create, update };
}

/** Login + step-up + env switch primitives. Returns the latest session row. */
export function useIaltLogin() {
  const [session, setSession] = useState<IaltSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const login = useCallback(async (dto: { email: string; environmentSlug: string; credentialVerified: boolean; mfaCode?: string }) => {
    setLoading(true); setError(null);
    try { const r = await getJson<IaltSession>(`${API}/login`, jsonBody('POST', dto)); setSession(r); return r; }
    catch (e) { setError(e as Error); throw e; }
    finally { setLoading(false); }
  }, []);
  const stepUp = useCallback(async (dto: { sessionId: string; mfaCode: string }) => {
    setLoading(true); setError(null);
    try { const r = await getJson<IaltSession>(`${API}/step-up`, jsonBody('POST', dto)); setSession(r); return r; }
    catch (e) { setError(e as Error); throw e; }
    finally { setLoading(false); }
  }, []);
  const switchEnv = useCallback(async (dto: { sessionId: string; environmentSlug: string }) => {
    setLoading(true); setError(null);
    try { const r = await getJson<IaltSession>(`${API}/switch-environment`, jsonBody('POST', dto)); setSession(r); return r; }
    catch (e) { setError(e as Error); throw e; }
    finally { setLoading(false); }
  }, []);
  return { session, loading, error, login, stepUp, switchEnv };
}

export function useIaltMySessions() {
  const [items, setItems] = useState<IaltSession[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try { setItems(await getJson<IaltSession[]>(`${API}/sessions/mine`)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  const revoke = useCallback(async (id: string) => {
    await getJson(`${API}/sessions/${id}/revoke`, { method: 'PATCH' });
    await reload();
  }, [reload]);
  return { items, loading, reload, revoke };
}

export function useIaltForensics() {
  const [attempts, setAttempts] = useState<IaltAttempt[]>([]);
  const [audit, setAudit] = useState<IaltAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [a, u] = await Promise.all([
        getJson<IaltAttempt[]>(`${API}/attempts`),
        getJson<IaltAudit[]>(`${API}/audit`),
      ]);
      setAttempts(a); setAudit(u);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { attempts, audit, loading, reload };
}
