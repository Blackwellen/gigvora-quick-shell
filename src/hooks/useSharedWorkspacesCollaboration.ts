/**
 * Domain 55 — Shared Workspaces, Notes, Handoffs hooks.
 *
 * Hooks: overview, workspaces (CRUD + archive/restore), members (add/role/remove),
 * notes (CRUD + draft/publish/archive), handoffs (create + accept/reject/cancel/complete +
 * checklist), audit log. All hooks support `demoMode` for UI stability during the
 * mock → live transition.
 */
import { useCallback, useEffect, useState } from 'react';

export type WorkspaceStatus = 'active' | 'archived';
export type NoteStatus = 'draft' | 'published' | 'archived';
export type HandoffStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
export type HandoffPriority = 'low' | 'normal' | 'high' | 'urgent';
export type MemberRole = 'owner' | 'editor' | 'contributor' | 'viewer';

export interface SwcWorkspace {
  id: string; name: string; slug: string; description: string | null;
  visibility: 'team' | 'private' | 'org'; status: WorkspaceStatus;
  createdBy: string; archivedAt: string | null;
  createdAt: string; updatedAt: string;
}
export interface SwcMember {
  id: string; workspaceId: string; memberIdentityId: string; fullName: string;
  email: string; role: MemberRole; status: 'active' | 'removed'; joinedAt: string;
}
export interface SwcNote {
  id: string; workspaceId: string; authorId: string; title: string; body: string;
  tags: string[]; status: NoteStatus; pinned: boolean;
  publishedAt: string | null; archivedAt: string | null;
  createdAt: string; updatedAt: string;
}
export interface SwcHandoff {
  id: string; workspaceId: string; fromIdentityId: string; toIdentityId: string;
  fromTeam: string | null; toTeam: string | null; subject: string; context: string;
  checklist: { label: string; done: boolean }[];
  attachments: { name: string; url: string }[];
  priority: HandoffPriority; status: HandoffStatus;
  dueAt: string | null; acceptedAt: string | null; rejectedAt: string | null;
  rejectedReason: string | null; cancelledAt: string | null; completedAt: string | null;
  createdAt: string; updatedAt: string;
}
export interface SwcOverview {
  kpis: { activeWorkspaces: number; pendingHandoffsForMe: number; recentPublishedNotes: number };
  workspaces: SwcWorkspace[];
  pendingHandoffs: (SwcHandoff & { workspaceName: string })[];
  recentNotes: (SwcNote & { workspaceName: string })[];
  insights: { id: string; severity: 'info' | 'success' | 'warn' | 'error'; title: string; body?: string }[];
  computedAt: string;
}

const API = '/api/v1/shared-workspaces-collaboration';

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`request failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

const DEMO_WS: SwcWorkspace = {
  id: 'ws1', name: 'Acme · Delivery Ops', slug: 'delivery-ops',
  description: 'Cross-team workspace for delivery handoffs', visibility: 'team',
  status: 'active', createdBy: 'm1', archivedAt: null,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};
const DEMO_OVERVIEW: SwcOverview = {
  kpis: { activeWorkspaces: 1, pendingHandoffsForMe: 1, recentPublishedNotes: 1 },
  workspaces: [DEMO_WS],
  pendingHandoffs: [{
    id: 'h1', workspaceId: 'ws1', workspaceName: DEMO_WS.name,
    fromIdentityId: 'm1', toIdentityId: 'me', fromTeam: 'Sales', toTeam: 'Delivery',
    subject: 'New client kickoff — Northwind', context: 'Contract signed; please run kickoff this week.',
    checklist: [{ label: 'Read brief', done: false }, { label: 'Schedule kickoff', done: false }],
    attachments: [], priority: 'high', status: 'pending',
    dueAt: new Date(Date.now() + 3 * 86400_000).toISOString(),
    acceptedAt: null, rejectedAt: null, rejectedReason: null, cancelledAt: null, completedAt: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }],
  recentNotes: [{
    id: 'n1', workspaceId: 'ws1', workspaceName: DEMO_WS.name, authorId: 'm1',
    title: 'Onboarding playbook', body: 'Step-by-step onboarding for new delivery agents.',
    tags: ['onboarding', 'delivery'], status: 'published', pinned: true,
    publishedAt: new Date().toISOString(), archivedAt: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }],
  insights: [{ id: 'demo', severity: 'info', title: 'Demo mode', body: 'Live signals will replace this once the API is wired.' }],
  computedAt: new Date().toISOString(),
};

export function useSwcOverview(opts?: { demoMode?: boolean }) {
  const [data, setData] = useState<SwcOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setData(DEMO_OVERVIEW); return; }
      setData(await getJson<SwcOverview>(`${API}/overview`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setData(DEMO_OVERVIEW);
    } finally { setLoading(false); }
  }, [opts?.demoMode]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useSwcWorkspaces(filter: { status?: WorkspaceStatus; search?: string } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<SwcWorkspace[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([DEMO_WS]); setTotal(1); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.search) params.set('search', filter.search);
      const res = await getJson<{ items: SwcWorkspace[]; total: number }>(`${API}/workspaces?${params}`);
      setItems(res.items); setTotal(res.total);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) { setItems([DEMO_WS]); setTotal(1); }
    } finally { setLoading(false); }
  }, [filter.status, filter.search, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (dto: { name: string; slug: string; description?: string; visibility?: 'team' | 'private' | 'org' }) => {
    await getJson(`${API}/workspaces`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto),
    });
    await reload();
  }, [reload]);

  const archive = useCallback(async (id: string) => {
    await getJson(`${API}/workspaces/${id}/status`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'archived' }),
    });
    await reload();
  }, [reload]);
  const restore = useCallback(async (id: string) => {
    await getJson(`${API}/workspaces/${id}/status`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'active' }),
    });
    await reload();
  }, [reload]);
  const update = useCallback(async (id: string, patch: Partial<SwcWorkspace>) => {
    await getJson(`${API}/workspaces/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch),
    });
    await reload();
  }, [reload]);

  return { items, total, loading, error, reload, create, archive, restore, update };
}

export function useSwcNotes(workspaceId: string, filter: { status?: NoteStatus; search?: string; pinned?: boolean } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<SwcNote[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems(DEMO_OVERVIEW.recentNotes as SwcNote[]); setTotal(1); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.search) params.set('search', filter.search);
      if (typeof filter.pinned === 'boolean') params.set('pinned', String(filter.pinned));
      const res = await getJson<{ items: SwcNote[]; total: number }>(`${API}/workspaces/${workspaceId}/notes?${params}`);
      setItems(res.items); setTotal(res.total);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) { setItems(DEMO_OVERVIEW.recentNotes as SwcNote[]); setTotal(1); }
    } finally { setLoading(false); }
  }, [workspaceId, filter.status, filter.search, filter.pinned, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (dto: { title: string; body?: string; tags?: string[]; status?: NoteStatus; pinned?: boolean }) => {
    await getJson(`${API}/workspaces/${workspaceId}/notes`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto),
    });
    await reload();
  }, [workspaceId, reload]);

  const update = useCallback(async (id: string, patch: Partial<SwcNote>) => {
    await getJson(`${API}/workspaces/${workspaceId}/notes/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch),
    });
    await reload();
  }, [workspaceId, reload]);

  const transition = useCallback(async (id: string, status: NoteStatus) => {
    await getJson(`${API}/workspaces/${workspaceId}/notes/${id}/status`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }),
    });
    await reload();
  }, [workspaceId, reload]);

  return { items, total, loading, error, reload, create, update, transition };
}

export function useSwcHandoffs(workspaceId: string, filter: { status?: HandoffStatus; priority?: HandoffPriority; toMe?: boolean } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<SwcHandoff[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems(DEMO_OVERVIEW.pendingHandoffs as SwcHandoff[]); setTotal(1); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.priority) params.set('priority', filter.priority);
      if (filter.toMe) params.set('toMe', 'true');
      const res = await getJson<{ items: SwcHandoff[]; total: number }>(`${API}/workspaces/${workspaceId}/handoffs?${params}`);
      setItems(res.items); setTotal(res.total);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) { setItems(DEMO_OVERVIEW.pendingHandoffs as SwcHandoff[]); setTotal(1); }
    } finally { setLoading(false); }
  }, [workspaceId, filter.status, filter.priority, filter.toMe, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (dto: {
    toIdentityId: string; subject: string; context?: string;
    fromTeam?: string; toTeam?: string; priority?: HandoffPriority; dueAt?: string;
    checklist?: { label: string; done: boolean }[]; attachments?: { name: string; url: string }[];
  }) => {
    await getJson(`${API}/workspaces/${workspaceId}/handoffs`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto),
    });
    await reload();
  }, [workspaceId, reload]);

  const transition = useCallback(async (id: string, status: HandoffStatus, reason?: string) => {
    await getJson(`${API}/workspaces/${workspaceId}/handoffs/${id}/status`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status, reason }),
    });
    await reload();
  }, [workspaceId, reload]);

  const accept = useCallback((id: string) => transition(id, 'accepted'), [transition]);
  const reject = useCallback((id: string, reason: string) => transition(id, 'rejected', reason), [transition]);
  const cancel = useCallback((id: string) => transition(id, 'cancelled'), [transition]);
  const complete = useCallback((id: string) => transition(id, 'completed'), [transition]);

  const updateChecklist = useCallback(async (id: string, checklist: { label: string; done: boolean }[]) => {
    await getJson(`${API}/workspaces/${workspaceId}/handoffs/${id}/checklist`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ checklist }),
    });
    await reload();
  }, [workspaceId, reload]);

  return { items, total, loading, error, reload, create, transition, accept, reject, cancel, complete, updateChecklist };
}

export function useSwcMembers(workspaceId: string, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<SwcMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems([]); return; }
      setItems(await getJson<SwcMember[]>(`${API}/workspaces/${workspaceId}/members`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems([]);
    } finally { setLoading(false); }
  }, [workspaceId, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const add = useCallback(async (dto: { memberIdentityId: string; fullName: string; email: string; role?: MemberRole }) => {
    await getJson(`${API}/workspaces/${workspaceId}/members`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto),
    });
    await reload();
  }, [workspaceId, reload]);

  const changeRole = useCallback(async (memberId: string, role: MemberRole) => {
    await getJson(`${API}/workspaces/${workspaceId}/members/${memberId}/role`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role }),
    });
    await reload();
  }, [workspaceId, reload]);

  const remove = useCallback(async (memberId: string) => {
    await getJson(`${API}/workspaces/${workspaceId}/members/${memberId}`, { method: 'DELETE' });
    await reload();
  }, [workspaceId, reload]);

  return { items, loading, error, reload, add, changeRole, remove };
}
