/**
 * Domain 54 — Org Members, Seats, Roles & Permissions hooks.
 *
 * Hooks: overview, members (with status + role transitions), invitations
 * (create + revoke), seats (assign/release/purchase), roles (upsert/delete),
 * audit log. All hooks support `demoMode` for UI stability during the
 * mock → live transition.
 */
import { useCallback, useEffect, useState } from 'react';

export type MemberStatus = 'active' | 'suspended' | 'removed';
export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';
export type SeatStatus = 'available' | 'assigned' | 'locked';
export type SeatType = 'full' | 'viewer' | 'guest';

export interface OmsMember {
  id: string;
  memberIdentityId: string;
  fullName: string;
  email: string;
  roleKey: string;
  status: MemberStatus;
  seatId: string | null;
  lastActiveAt: string | null;
  joinedAt: string;
  removedAt: string | null;
}

export interface OmsSeat {
  id: string;
  plan: string;
  seatType: SeatType;
  status: SeatStatus;
  assignedMemberId: string | null;
  assignedAt: string | null;
  costCents: number;
}

export interface OmsInvitation {
  id: string;
  email: string;
  roleKey: string;
  seatType: SeatType;
  status: InvitationStatus;
  invitedBy: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface OmsRole {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
}

export interface OmsOverview {
  kpis: {
    activeMembers: number;
    suspended: number;
    pendingInvitations: number;
    seats: { total: number; assigned: number; available: number; locked: number };
    totalSeatCostCents: number;
    rolesCount: number;
  };
  members: OmsMember[];
  seats: OmsSeat[];
  invitations: OmsInvitation[];
  roles: OmsRole[];
  countsByRole: { role_key: string; count: number }[];
  seatTotals: { status: string; seat_type: string; count: number; total_cost_cents: number }[];
  insights: { id: string; severity: 'info' | 'success' | 'warn' | 'error'; title: string; body?: string }[];
  computedAt: string;
}

const API = '/api/v1/org-members-seats';

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`request failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

const DEMO: OmsOverview = {
  kpis: {
    activeMembers: 2, suspended: 0, pendingInvitations: 1,
    seats: { total: 4, assigned: 2, available: 2, locked: 0 },
    totalSeatCostCents: 16_600, rolesCount: 5,
  },
  members: [
    { id: 'm1', memberIdentityId: 'mi1', fullName: 'Priya Patel', email: 'priya@example.com', roleKey: 'owner', status: 'active', seatId: 's1', lastActiveAt: new Date().toISOString(), joinedAt: new Date().toISOString(), removedAt: null },
    { id: 'm2', memberIdentityId: 'mi2', fullName: 'Marco Rossi', email: 'marco@example.com', roleKey: 'admin', status: 'active', seatId: 's2', lastActiveAt: new Date().toISOString(), joinedAt: new Date().toISOString(), removedAt: null },
  ],
  seats: [
    { id: 's1', plan: 'team', seatType: 'full',   status: 'assigned',  assignedMemberId: 'm1', assignedAt: null, costCents: 4900 },
    { id: 's2', plan: 'team', seatType: 'full',   status: 'assigned',  assignedMemberId: 'm2', assignedAt: null, costCents: 4900 },
    { id: 's3', plan: 'team', seatType: 'full',   status: 'available', assignedMemberId: null, assignedAt: null, costCents: 4900 },
    { id: 's4', plan: 'team', seatType: 'viewer', status: 'available', assignedMemberId: null, assignedAt: null, costCents: 1900 },
  ],
  invitations: [
    { id: 'i1', email: 'newhire@example.com', roleKey: 'member', seatType: 'full', status: 'pending', invitedBy: 'm1', expiresAt: new Date(Date.now() + 7 * 86400_000).toISOString(), acceptedAt: null, revokedAt: null, createdAt: new Date().toISOString() },
  ],
  roles: [
    { id: 'r1', key: 'owner',   name: 'Owner',   description: 'Full control',          isSystem: true,  permissions: ['org:*','members:*','billing:*'] },
    { id: 'r2', key: 'admin',   name: 'Admin',   description: 'Manage members + seats', isSystem: true, permissions: ['members:*','seats:*'] },
    { id: 'r3', key: 'manager', name: 'Manager', description: 'Manage own team',        isSystem: true, permissions: ['members:read','members:invite'] },
    { id: 'r4', key: 'member',  name: 'Member',  description: 'Standard collaborator',  isSystem: true, permissions: ['members:read'] },
    { id: 'r5', key: 'viewer',  name: 'Viewer',  description: 'Read-only',              isSystem: true, permissions: ['members:read'] },
  ],
  countsByRole: [{ role_key: 'owner', count: 1 }, { role_key: 'admin', count: 1 }],
  seatTotals: [],
  insights: [{ id: 'demo', severity: 'info', title: 'Demo mode', body: 'Live signals will replace this once the API is wired.' }],
  computedAt: new Date().toISOString(),
};

export function useOmsOverview(opts?: { demoMode?: boolean }) {
  const [data, setData] = useState<OmsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setData(DEMO); return; }
      setData(await getJson<OmsOverview>(`${API}/overview`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setData(DEMO);
    } finally { setLoading(false); }
  }, [opts?.demoMode]);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useOmsMembers(filter: { status?: MemberStatus; roleKey?: string; search?: string } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<OmsMember[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems(DEMO.members); setTotal(DEMO.members.length); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.roleKey) params.set('roleKey', filter.roleKey);
      if (filter.search) params.set('search', filter.search);
      const res = await getJson<{ items: OmsMember[]; total: number }>(`${API}/members?${params.toString()}`);
      setItems(res.items); setTotal(res.total);
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) { setItems(DEMO.members); setTotal(DEMO.members.length); }
    } finally { setLoading(false); }
  }, [filter.status, filter.roleKey, filter.search, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const transition = useCallback(async (id: string, status: MemberStatus, reason?: string) => {
    await getJson(`${API}/members/${id}/status`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    });
    await reload();
  }, [reload]);

  const changeRole = useCallback(async (id: string, roleKey: string) => {
    await getJson(`${API}/members/${id}/role`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ roleKey }),
    });
    await reload();
  }, [reload]);

  const suspend = useCallback((id: string, reason: string) => transition(id, 'suspended', reason), [transition]);
  const reinstate = useCallback((id: string) => transition(id, 'active'), [transition]);
  const remove = useCallback((id: string, reason: string) => transition(id, 'removed', reason), [transition]);

  return { items, total, loading, error, reload, transition, changeRole, suspend, reinstate, remove };
}

export function useOmsInvitations(status?: InvitationStatus, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<OmsInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems(DEMO.invitations); return; }
      const params = status ? `?status=${status}` : '';
      setItems(await getJson<OmsInvitation[]>(`${API}/invitations${params}`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems(DEMO.invitations);
    } finally { setLoading(false); }
  }, [status, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const invite = useCallback(async (dto: { email: string; roleKey?: string; seatType?: SeatType; message?: string }) => {
    await getJson(`${API}/invitations`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(dto),
    });
    await reload();
  }, [reload]);

  const revoke = useCallback(async (id: string, reason?: string) => {
    await getJson(`${API}/invitations/${id}/status`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'revoked', reason }),
    });
    await reload();
  }, [reload]);

  return { items, loading, error, reload, invite, revoke };
}

export function useOmsSeats(filter: { status?: SeatStatus; seatType?: SeatType } = {}, opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<OmsSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems(DEMO.seats); return; }
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.seatType) params.set('seatType', filter.seatType);
      setItems(await getJson<OmsSeat[]>(`${API}/seats?${params.toString()}`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems(DEMO.seats);
    } finally { setLoading(false); }
  }, [filter.status, filter.seatType, opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const assign = useCallback(async (seatId: string, memberId: string) => {
    await getJson(`${API}/seats/${seatId}/assign`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ memberId }),
    });
    await reload();
  }, [reload]);

  const release = useCallback(async (seatId: string) => {
    await getJson(`${API}/seats/${seatId}/release`, { method: 'POST' });
    await reload();
  }, [reload]);

  const purchase = useCallback(async (count: number, seatType: SeatType = 'full', plan = 'team') => {
    await getJson(`${API}/seats/purchase`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ count, seatType, plan }),
    });
    await reload();
  }, [reload]);

  return { items, loading, error, reload, assign, release, purchase };
}

export function useOmsRoles(opts?: { demoMode?: boolean }) {
  const [items, setItems] = useState<OmsRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setItems(DEMO.roles); return; }
      setItems(await getJson<OmsRole[]>(`${API}/roles`));
    } catch (e) {
      setError(e as Error);
      if (opts?.demoMode !== false) setItems(DEMO.roles);
    } finally { setLoading(false); }
  }, [opts?.demoMode]);

  useEffect(() => { reload(); }, [reload]);

  const upsert = useCallback(async (dto: { key: string; name: string; description?: string; permissions: string[] }) => {
    await getJson(`${API}/roles`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(dto),
    });
    await reload();
  }, [reload]);

  const remove = useCallback(async (key: string) => {
    await getJson(`${API}/roles/${encodeURIComponent(key)}`, { method: 'DELETE' });
    await reload();
  }, [reload]);

  return { items, loading, error, reload, upsert, remove };
}
