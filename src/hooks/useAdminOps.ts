/** FD-16 — Admin Ops master CRUD (companies / users / mentors). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const BASE = (import.meta as any).env?.VITE_GIGVORA_API_URL ?? '';
const ROOT = BASE ? `${BASE}/api/v1/admin-ops` : '';

export type AdminOpsEntity = 'companies' | 'users' | 'mentors';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!ROOT) throw new Error('api_unconfigured');
  const r = await fetch(`${ROOT}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    credentials: 'include',
  });
  if (!r.ok) throw new Error(`api_${r.status}`);
  return r.json() as Promise<T>;
}

const FX = {
  companies: [
    { id: 'fx-co-1', reference: 'co_220', name: 'Acme Co.',           verification: 'verified', plan: 'pro',  headcount: 128, region: 'UK',      status: 'active'    },
    { id: 'fx-co-2', reference: 'co_219', name: 'Lyra Labs',          verification: 'verified', plan: 'team', headcount: 42,  region: 'US',      status: 'watch'     },
    { id: 'fx-co-3', reference: 'co_217', name: 'Northwind Holdings', verification: 'pending',  plan: 'free', headcount: 18,  region: 'IE',      status: 'active'    },
  ],
  users: [
    { id: 'fx-u-1', reference: 'u_1182', handle: 'sarah_io',    plan: 'pro',  region: 'UK',      status: 'active',    joined_at: '2024-03-12' },
    { id: 'fx-u-2', reference: 'u_5510', handle: 'mark.k',      plan: 'free', region: 'US',      status: 'watch',     joined_at: '2024-08-04' },
    { id: 'fx-u-3', reference: 'u_8810', handle: 'anon_99',     plan: 'free', region: 'Unknown', status: 'suspended', joined_at: '2025-01-22' },
    { id: 'fx-u-4', reference: 'u_2210', handle: 'designcraft', plan: 'pro',  region: 'IE',      status: 'active',    joined_at: '2023-11-08' },
  ],
  mentors: [
    { id: 'fx-m-1', reference: 'mn_120', display_name: 'Sarah Iozzia', speciality: 'Product strategy',         rating: 4.90, sessions: 128, status: 'active' },
    { id: 'fx-m-2', reference: 'mn_118', display_name: 'Mark Kahan',   speciality: 'Engineering leadership',   rating: 4.80, sessions: 92,  status: 'active' },
    { id: 'fx-m-3', reference: 'mn_115', display_name: 'Aisha Fenton', speciality: 'Design systems',           rating: 4.95, sessions: 210, status: 'active' },
  ],
} as const;

export interface AdminOpsList<T> { items: T[]; total: number; meta: { source: string; role: string; entity: string; page: number; pageSize: number } }

export function useAdminOpsList<T = any>(entity: AdminOpsEntity, filter: Record<string, unknown> = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined && v !== '') as any);
  return useQuery<AdminOpsList<T>>({
    queryKey: ['admin-ops', entity, qs.toString()],
    queryFn: () => api<AdminOpsList<T>>(`/${entity}?${qs}`).catch(() => ({
      items: FX[entity] as any,
      total: FX[entity].length,
      meta: { source: 'fixture', role: 'viewer', entity, page: 1, pageSize: 50 },
    })),
  });
}

export function useAdminOpsUpsert(entity: AdminOpsEntity) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api(`/${entity}`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-ops', entity] }),
  });
}

export function useAdminOpsBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { entity: 'company'|'user'|'mentor'; ids: string[]; action: 'suspend'|'reinstate'|'archive'|'watch'|'verify'|'reject'; note?: string }) =>
      api('/bulk', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-ops'] }),
  });
}
