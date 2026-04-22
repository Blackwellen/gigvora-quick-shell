/**
 * React Query hooks for Pass 4 domains.
 * Defaults to live API; degrades gracefully to empty envelopes so the UI never blanks.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API = (import.meta as any).env?.VITE_API_BASE_URL ?? '/api/v1';

const get = async <T>(path: string, fallback: T): Promise<T> => {
  try {
    const r = await fetch(`${API}${path}`, { credentials: 'include' });
    if (!r.ok) return fallback;
    return (await r.json()) as T;
  } catch { return fallback; }
};
const send = async <T>(path: string, method: string, body?: unknown): Promise<T> => {
  const r = await fetch(`${API}${path}`, {
    method, credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`${method} ${path} ${r.status}`);
  return r.json() as Promise<T>;
};

const qsParams = (params: Record<string, any>) =>
  new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== '').reduce<Record<string, string>>((a, [k, v]) => {
      a[k] = String(v); return a;
    }, {}),
  ).toString();

// ── Experience Launchpad ──
const LP = '/experience-launchpad';
export const useLpOverview = () =>
  useQuery({ queryKey: ['lp', 'overview'], queryFn: () => get(`${LP}/overview`, { data: {}, meta: {} }) });
export const useLpDiscover = (interests: string[] = []) =>
  useQuery({ queryKey: ['lp', 'discover', interests],
    queryFn: () => get(`${LP}/discover?interests=${encodeURIComponent(interests.join(','))}`, { data: { pathways: [], recommended_mentors: [], opportunities: [], challenges: [] } }) });
export const useLpPathways = (filters: Record<string, any> = {}) =>
  useQuery({ queryKey: ['lp', 'pathways', filters], queryFn: () => get(`${LP}/pathways?${qsParams(filters)}`, { items: [] }) });
export const useLpPathway = (id: string) =>
  useQuery({ queryKey: ['lp', 'pathway', id], queryFn: () => get(`${LP}/pathways/${id}`, null as any), enabled: !!id });
export const useLpEnroll = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (pathway_id: string) => send(`${LP}/enroll`, 'POST', { pathway_id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lp'] }) });
};
export const useLpProgress = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: { pathway_id: string; progress_pct: number }) => send(`${LP}/progress`, 'POST', b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lp'] }) });
};
export const useLpMyEnrollments = () =>
  useQuery({ queryKey: ['lp', 'enrollments'], queryFn: () => get(`${LP}/my/enrollments`, { items: [] }) });
export const useLpMentors = (filters: Record<string, any> = {}) =>
  useQuery({ queryKey: ['lp', 'mentors', filters], queryFn: () => get(`${LP}/mentors?${qsParams(filters)}`, { items: [] }) });
export const useLpBookMentor = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: any) => send(`${LP}/mentors/book`, 'POST', b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lp'] }) });
};
export const useLpChallenges = (status?: string) =>
  useQuery({ queryKey: ['lp', 'challenges', status], queryFn: () => get(`${LP}/challenges${status ? `?status=${status}` : ''}`, { items: [] }) });
export const useLpSubmit = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: any) => send(`${LP}/challenges/submit`, 'POST', b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lp', 'challenges'] }) });
};
export const useLpOpportunities = (filters: Record<string, any> = {}) =>
  useQuery({ queryKey: ['lp', 'opps', filters], queryFn: () => get(`${LP}/opportunities?${qsParams(filters)}`, { items: [] }) });

// ── Creation Studio ──
const CS = '/creation-studio';
export const useStudioDrafts = (filters: Record<string, any> = {}) =>
  useQuery({ queryKey: ['studio', 'drafts', filters], queryFn: () => get(`${CS}/drafts?${qsParams(filters)}`, { items: [] }) });
export const useStudioDraft = (id: string) =>
  useQuery({ queryKey: ['studio', 'draft', id], queryFn: () => get(`${CS}/drafts/${id}`, null as any), enabled: !!id });
export const useStudioCreateDraft = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: any) => send(`${CS}/drafts`, 'POST', b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studio', 'drafts'] }) });
};
export const useStudioPatchDraft = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, body }: { id: string; body: any }) => send(`${CS}/drafts/${id}`, 'PATCH', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studio'] }) });
};
export const useStudioPublish = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => send(`${CS}/drafts/${id}/publish`, 'POST', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studio'] }) });
};
export const useStudioAssets = (kind?: string) =>
  useQuery({ queryKey: ['studio', 'assets', kind], queryFn: () => get(`${CS}/assets${kind ? `?kind=${kind}` : ''}`, { items: [] }) });

// ── Tasks ──
const TL = '/task-list';
export const useTaskLists = (archived = false) =>
  useQuery({ queryKey: ['tasks', 'lists', archived], queryFn: () => get(`${TL}/lists?archived=${archived}`, { items: [] }) });
export const useCreateTaskList = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: any) => send(`${TL}/lists`, 'POST', b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', 'lists'] }) });
};
export const useTaskItems = (filters: Record<string, any> = {}) =>
  useQuery({ queryKey: ['tasks', 'items', filters], queryFn: () => get(`${TL}/items?${qsParams(filters)}`, { items: [] }) });
export const useCreateTaskItem = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: any) => send(`${TL}/items`, 'POST', b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', 'items'] }) });
};
export const usePatchTaskItem = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, body }: { id: string; body: any }) => send(`${TL}/items/${id}`, 'PATCH', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }) });
};

// ── Team Management ──
const TM = '/team-management';
export const useTeamMembers = (workspaceId?: string, status?: string) =>
  useQuery({ queryKey: ['team', 'members', workspaceId, status],
    queryFn: () => get(`${TM}/members?${qsParams({ workspace_id: workspaceId, status })}`, { items: [] }),
    enabled: !!workspaceId });
export const usePatchMember = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, body }: { id: string; body: any }) => send(`${TM}/members/${id}`, 'PATCH', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }) });
};
export const useTeamInvites = (workspaceId?: string, status?: string) =>
  useQuery({ queryKey: ['team', 'invites', workspaceId, status],
    queryFn: () => get(`${TM}/invites?${qsParams({ workspace_id: workspaceId, status })}`, { items: [] }),
    enabled: !!workspaceId });
export const useInviteMember = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: any) => send(`${TM}/invites`, 'POST', b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team', 'invites'] }) });
};
