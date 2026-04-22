/**
 * Domain 37 — Project Workspaces & Handover API client + React Query hooks.
 *
 * Backend: apps/api-nest/src/modules/project-workspaces-handover/*
 * Base path: /api/v1/project-workspaces-handover
 *
 * The base URL comes from VITE_GIGVORA_API_URL; when unset, calls fail fast
 * and the consumer falls back to its mock view (preview-only). A bearer
 * token, when present in localStorage as 'gigvora.token', is attached.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const BASE =
  ((import.meta as any).env?.VITE_GIGVORA_API_URL?.replace(/\/$/, '') || '') +
  '/api/v1/project-workspaces-handover';

export const pwhApiConfigured = (): boolean =>
  !!(import.meta as any).env?.VITE_GIGVORA_API_URL;

function authHeaders(): HeadersInit {
  const h: Record<string, string> = { 'content-type': 'application/json' };
  try {
    const t = localStorage.getItem('gigvora.token');
    if (t) h['authorization'] = `Bearer ${t}`;
  } catch {
    /* noop */
  }
  return h;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  if (!pwhApiConfigured()) throw new Error('api_not_configured');
  const r = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
  });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`pwh ${r.status}: ${text || r.statusText}`);
  }
  return r.json() as Promise<T>;
}

// ---------- Domain types (loose; backend is the source of truth) ----------
export type WorkspaceStatus =
  | 'draft' | 'kickoff' | 'in-progress' | 'on-hold'
  | 'in-review' | 'handover' | 'closed' | 'cancelled';

export interface Workspace {
  id: string;
  projectId: string;
  contractId: string | null;
  title: string;
  status: WorkspaceStatus;
  startedAt?: string | null;
  closedAt?: string | null;
  parties?: Array<{ identityId: string; role: string; name?: string; avatar?: string }>;
  milestones?: Milestone[];
  deliverables?: Deliverable[];
  checklist?: ChecklistItem[];
  updates?: ActivityUpdate[];
  budget?: { totalCents: number; spentCents: number; currency: string };
  meta?: Record<string, unknown>;
}

export interface Milestone {
  id: string;
  title: string;
  amountCents: number;
  currency?: string;
  dueAt: string | null;
  status: 'pending' | 'funded' | 'in-progress' | 'in-review' | 'released' | 'disputed';
  progress: number;
  version: number;
  taskCount?: number;
}

export interface Deliverable {
  id: string;
  workspaceId: string;
  milestoneId: string;
  title: string;
  url: string;
  notes?: string;
  status: 'submitted' | 'approved' | 'changes-requested' | 'rejected';
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ChecklistItem {
  id: string; label: string; completed: boolean;
  completedAt?: string | null; note?: string | null;
}

export interface ActivityUpdate {
  id: string; author: string; text: string; type: string; at: string;
}

// ---------- Query keys ----------
export const pwhKeys = {
  all: ['pwh'] as const,
  list: (filters: Record<string, unknown>) => [...pwhKeys.all, 'list', filters] as const,
  detail: (id: string) => [...pwhKeys.all, 'detail', id] as const,
  insights: (projectId?: string) => [...pwhKeys.all, 'insights', projectId ?? 'all'] as const,
};

// ---------- Queries ----------
export function useWorkspaces(filters: { projectId?: string; contractId?: string; status?: WorkspaceStatus[] } = {}) {
  return useQuery({
    queryKey: pwhKeys.list(filters),
    queryFn: () => {
      const qs = new URLSearchParams();
      if (filters.projectId) qs.set('projectId', filters.projectId);
      if (filters.contractId) qs.set('contractId', filters.contractId);
      filters.status?.forEach((s) => qs.append('status', s));
      return req<Workspace[]>(`/workspaces?${qs.toString()}`);
    },
    enabled: pwhApiConfigured(),
    retry: 1,
    staleTime: 15_000,
  });
}

export function useWorkspaceDetail(id: string | undefined) {
  return useQuery({
    queryKey: id ? pwhKeys.detail(id) : ['pwh', 'detail', 'none'],
    queryFn: () => req<Workspace>(`/workspaces/${id}`),
    enabled: !!id && pwhApiConfigured(),
    retry: 1,
    staleTime: 10_000,
  });
}

export function useWorkspaceInsights(projectId?: string) {
  return useQuery({
    queryKey: pwhKeys.insights(projectId),
    queryFn: () => {
      const qs = new URLSearchParams();
      if (projectId) qs.set('projectId', projectId);
      return req<Record<string, unknown>>(`/insights?${qs.toString()}`);
    },
    enabled: pwhApiConfigured(),
    staleTime: 30_000,
  });
}

// ---------- Mutations ----------
function useInvalidate(workspaceId?: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: pwhKeys.all });
    if (workspaceId) qc.invalidateQueries({ queryKey: pwhKeys.detail(workspaceId) });
  };
}

export function useKickoffWorkspace(workspaceId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: () => req<Workspace>(`/workspaces/${workspaceId}/kickoff`, { method: 'POST' }),
    onSuccess: () => { invalidate(); toast.success('Kickoff confirmed'); },
    onError: (e: Error) => toast.error(`Kickoff failed: ${e.message}`),
  });
}

export function useTransitionMilestone(workspaceId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (input: { milestoneId: string; toStatus: Milestone['status']; expectedVersion: number; note?: string }) =>
      req<Milestone>(`/milestones/transition`, {
        method: 'POST', body: JSON.stringify({ workspaceId, ...input }),
      }),
    onSuccess: () => { invalidate(); toast.success('Milestone updated'); },
    onError: (e: Error) => toast.error(`Transition failed: ${e.message}`),
  });
}

export function useSubmitDeliverable(workspaceId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (input: { milestoneId: string; title: string; url: string; notes?: string }) =>
      req<Deliverable>(`/deliverables/submit`, {
        method: 'POST',
        body: JSON.stringify({
          workspaceId, ...input,
          idempotencyKey: `pwh-deliv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        }),
      }),
    onSuccess: () => { invalidate(); toast.success('Deliverable submitted'); },
    onError: (e: Error) => toast.error(`Submit failed: ${e.message}`),
  });
}

export function useReviewDeliverable(workspaceId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (input: { deliverableId: string; decision: 'approve' | 'request-changes' | 'reject'; feedback?: string }) =>
      req<Deliverable>(`/deliverables/review`, {
        method: 'POST', body: JSON.stringify({ workspaceId, ...input }),
      }),
    onSuccess: () => { invalidate(); toast.success('Review submitted'); },
    onError: (e: Error) => toast.error(`Review failed: ${e.message}`),
  });
}

export function useCompleteChecklistItem(workspaceId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (input: { itemId: string; note?: string }) =>
      req<ChecklistItem>(`/handover/complete-item`, {
        method: 'POST', body: JSON.stringify({ workspaceId, ...input }),
      }),
    onSuccess: () => { invalidate(); toast.success('Item completed'); },
    onError: (e: Error) => toast.error(`Update failed: ${e.message}`),
  });
}

export function useStartHandover(workspaceId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: () => req<Workspace>(`/handover/start`, {
      method: 'POST', body: JSON.stringify({ workspaceId }),
    }),
    onSuccess: () => { invalidate(); toast.success('Handover started'); },
    onError: (e: Error) => toast.error(`Handover failed: ${e.message}`),
  });
}

export function useHoldWorkspace(workspaceId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (reason: string) => req<Workspace>(`/workspaces/hold`, {
      method: 'POST', body: JSON.stringify({ workspaceId, reason }),
    }),
    onSuccess: () => { invalidate(); toast.success('Workspace held'); },
    onError: (e: Error) => toast.error(`Hold failed: ${e.message}`),
  });
}

export function useCancelWorkspace(workspaceId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (reason: string) => req<Workspace>(`/workspaces/cancel`, {
      method: 'POST', body: JSON.stringify({ workspaceId, reason }),
    }),
    onSuccess: () => { invalidate(); toast.success('Workspace cancelled'); },
    onError: (e: Error) => toast.error(`Cancel failed: ${e.message}`),
  });
}

export function useCloseWorkspace(workspaceId: string) {
  const invalidate = useInvalidate(workspaceId);
  return useMutation({
    mutationFn: (input: { finalReportMd: string }) => req<Workspace>(`/workspaces/close`, {
      method: 'POST',
      body: JSON.stringify({
        workspaceId, finalReportMd: input.finalReportMd,
        idempotencyKey: `pwh-close-${workspaceId}-${Date.now()}`,
      }),
    }),
    onSuccess: () => { invalidate(); toast.success('Workspace closed'); },
    onError: (e: Error) => toast.error(`Close failed: ${e.message}`),
  });
}
