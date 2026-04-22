/**
 * Domain 51 — Recruiter Dashboard hooks.
 *
 * Provides demoMode fallbacks so existing UI keeps rendering during the
 * mock → live transition. Hooks: overview, pipelines (with status transitions),
 * outreach (with ML reply probability), velocity series, tasks (with snooze /
 * complete / dismiss).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

export type PipelineStatus = 'draft' | 'active' | 'paused' | 'archived';
export type OutreachStatus = 'queued' | 'sent' | 'opened' | 'replied' | 'bounced' | 'unsubscribed';
export type TaskStatus = 'open' | 'in_progress' | 'done' | 'snoozed' | 'dismissed';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface RecruiterKpis {
  activePipelines: number;
  totalActiveCandidates: number;
  totalHired: number;
  responseRate: number;
  avgDaysToFill: number;
  openTasks: number;
  urgentTasks: number;
}

export interface RecruiterPipeline {
  id: string;
  name: string;
  status: PipelineStatus;
  totalCandidates: number;
  activeCandidates: number;
  hiredCount: number;
  rejectedCount: number;
  stageCounts: Record<string, number>;
  averageDaysToFill: number | null;
  lastActivityAt: string | null;
}

export interface RecruiterOutreachRow {
  id: string;
  pipelineId: string | null;
  candidateIdentityId: string;
  channel: 'email' | 'inmail' | 'sms' | 'call';
  subject: string | null;
  status: OutreachStatus;
  sentAt: string | null;
  openedAt: string | null;
  repliedAt: string | null;
  responseTimeHours: number | null;
  replyProbability?: number | null;
  createdAt: string;
}

export interface RecruiterVelocityRow {
  capturedOn: string;
  daysToFirstResponse: number | null;
  daysToShortlist: number | null;
  daysToOffer: number | null;
  daysToHire: number | null;
  responseRate: number | null;
  conversionRate: number | null;
}

export interface RecruiterTask {
  id: string;
  pipelineId: string | null;
  candidateIdentityId: string | null;
  kind: 'followup' | 'review' | 'interview' | 'offer' | 'reference' | 'admin';
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt: string | null;
  snoozedUntil: string | null;
  completedAt: string | null;
}

export interface RecruiterOverview {
  windowDays: number;
  kpis: RecruiterKpis;
  pipelines: RecruiterPipeline[];
  funnel: Record<string, { count: number; avgResponseHours: number | null }>;
  tasks: RecruiterTask[];
  insights: { id: string; severity: 'info' | 'success' | 'warn' | 'error'; title: string; body?: string }[];
  computedAt: string;
}

const API = '/api/v1/recruiter-dashboard';

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

const DEMO_OVERVIEW: RecruiterOverview = {
  windowDays: 30,
  kpis: {
    activePipelines: 3,
    totalActiveCandidates: 39,
    totalHired: 4,
    responseRate: 22.5,
    avgDaysToFill: 31.7,
    openTasks: 8,
    urgentTasks: 2,
  },
  pipelines: [
    { id: 'pl1', name: 'Senior Frontend Engineer', status: 'active', totalCandidates: 48, activeCandidates: 22, hiredCount: 3, rejectedCount: 18, stageCounts: { sourced: 12, screen: 6, interview: 3, offer: 1 }, averageDaysToFill: 28.4, lastActivityAt: new Date().toISOString() },
    { id: 'pl2', name: 'Staff Backend Engineer', status: 'active', totalCandidates: 31, activeCandidates: 14, hiredCount: 1, rejectedCount: 12, stageCounts: { sourced: 8, screen: 4, interview: 2 }, averageDaysToFill: 35.0, lastActivityAt: new Date().toISOString() },
    { id: 'pl3', name: 'Head of Design', status: 'paused', totalCandidates: 14, activeCandidates: 3, hiredCount: 0, rejectedCount: 9, stageCounts: { sourced: 2, screen: 1 }, averageDaysToFill: null, lastActivityAt: new Date().toISOString() },
  ],
  funnel: {
    sent: { count: 124, avgResponseHours: null },
    opened: { count: 71, avgResponseHours: 14.2 },
    replied: { count: 28, avgResponseHours: 22.6 },
    bounced: { count: 4, avgResponseHours: null },
  },
  tasks: [
    { id: 't1', pipelineId: 'pl1', candidateIdentityId: null, kind: 'followup', title: 'Chase 3 stalled candidates', priority: 'high', status: 'open', dueAt: null, snoozedUntil: null, completedAt: null },
    { id: 't2', pipelineId: 'pl1', candidateIdentityId: null, kind: 'interview', title: 'Confirm panel for tech round', priority: 'urgent', status: 'open', dueAt: null, snoozedUntil: null, completedAt: null },
  ],
  insights: [{ id: 'demo', severity: 'info', title: 'Demo mode', body: 'Live signals will replace this once the API is wired.' }],
  computedAt: new Date().toISOString(),
};

export function useRecruiterOverview(opts?: { demoMode?: boolean; windowDays?: number }) {
  const windowDays = opts?.windowDays ?? 30;
  const [data, setData] = useState<RecruiterOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setData(DEMO_OVERVIEW); return; }
      const res = await getJson<RecruiterOverview>(`${API}/overview?windowDays=${windowDays}`);
      setData(res);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setData(DEMO_OVERVIEW);
    } finally {
      setLoading(false);
    }
  }, [opts?.demoMode, windowDays]);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useRecruiterPipelines(filter: { status?: PipelineStatus } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<RecruiterPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems(DEMO_OVERVIEW.pipelines); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      const res = await getJson<{ items: RecruiterPipeline[] }>(`${API}/pipelines?${params.toString()}`);
      setItems(res.items);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems(DEMO_OVERVIEW.pipelines);
    } finally {
      setLoading(false);
    }
  }, [filter.status, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const transition = useCallback(async (id: string, status: PipelineStatus, reason?: string) => {
    await getJson(`${API}/pipelines/${id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    });
    await reload();
  }, [reload]);

  return { items, loading, error, reload, transition };
}

export function useRecruiterOutreach(filter: { status?: OutreachStatus; pipelineId?: string } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<RecruiterOutreachRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.pipelineId) params.set('pipelineId', filter.pipelineId);
      const res = await getJson<{ items: RecruiterOutreachRow[] }>(`${API}/outreach?${params.toString()}`);
      setItems(res.items);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [filter.status, filter.pipelineId, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);
  return { items, loading, error, reload };
}

export function useRecruiterVelocity(filter: { pipelineId?: string; windowDays?: number } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<RecruiterVelocityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      if (opts?.demoMode) { setItems([]); return; }
      const params = new URLSearchParams();
      if (filter.pipelineId) params.set('pipelineId', filter.pipelineId);
      if (filter.windowDays) params.set('windowDays', String(filter.windowDays));
      const res = await getJson<RecruiterVelocityRow[]>(`${API}/velocity?${params.toString()}`);
      setItems(res);
    } catch { /* noop */ } finally { setLoading(false); }
  }, [filter.pipelineId, filter.windowDays, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);
  return { items, loading, reload };
}

export function useRecruiterTasks(filter: { status?: TaskStatus; pipelineId?: string; priority?: TaskPriority } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<RecruiterTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems(DEMO_OVERVIEW.tasks); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.pipelineId) params.set('pipelineId', filter.pipelineId);
      if (filter.priority) params.set('priority', filter.priority);
      const res = await getJson<RecruiterTask[]>(`${API}/tasks?${params.toString()}`);
      setItems(res);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems(DEMO_OVERVIEW.tasks);
    } finally {
      setLoading(false);
    }
  }, [filter.status, filter.pipelineId, filter.priority, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const transition = useCallback(async (id: string, status: TaskStatus, extra?: { snoozedUntil?: string; note?: string }) => {
    await getJson(`${API}/tasks/${id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    });
    await reload();
  }, [reload]);

  const complete = useCallback((id: string) => transition(id, 'done'), [transition]);
  const dismiss = useCallback((id: string) => transition(id, 'dismissed'), [transition]);
  const snooze = useCallback((id: string, snoozedUntil: string) => transition(id, 'snoozed', { snoozedUntil }), [transition]);
  const start = useCallback((id: string) => transition(id, 'in_progress'), [transition]);

  return useMemo(() => ({ items, loading, error, reload, transition, complete, dismiss, snooze, start }), [items, loading, error, reload, transition, complete, dismiss, snooze, start]);
}
