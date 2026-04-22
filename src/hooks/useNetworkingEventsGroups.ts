/**
 * React Query hooks for Networking + Speed Networking + Events + Groups.
 * Defaults to live API; falls back to deterministic fixtures so the UI never
 * shows a blank-white state in dev preview.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API = (import.meta as any).env?.VITE_API_BASE_URL ?? '/api/v1';
const ROOT = `${API}/networking-events-groups`;

async function get<T>(path: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(`${ROOT}${path}`, { credentials: 'include' });
    if (!r.ok) return fallback;
    return (await r.json()) as T;
  } catch { return fallback; }
}
async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${ROOT}${path}`, {
    method: 'POST', credentials: 'include',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`POST ${path} ${r.status}`);
  return r.json() as Promise<T>;
}
async function patch<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${ROOT}${path}`, {
    method: 'PATCH', credentials: 'include',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PATCH ${path} ${r.status}`);
  return r.json() as Promise<T>;
}

// Rooms
export const useNegRooms = (kind?: string, status?: string) =>
  useQuery({
    queryKey: ['neg', 'rooms', kind, status],
    queryFn: () => get(`/rooms?${new URLSearchParams({ ...(kind && { kind }), ...(status && { status }) })}`,
                       { items: [] as any[], meta: { count: 0 } }),
  });
export const useNegMyRooms = () =>
  useQuery({ queryKey: ['neg', 'rooms', 'mine'], queryFn: () => get(`/rooms/mine`, { items: [] as any[], meta: {} }) });
export const useCreateNegRoom = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: any) => post(`/rooms`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['neg', 'rooms'] }) });
};
export const useTransitionNegRoom = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => patch(`/rooms/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['neg', 'rooms'] }) });
};
export const useJoinNegRoom = () =>
  useMutation({ mutationFn: ({ id, asRole = 'attendee' }: { id: string; asRole?: string }) => post(`/rooms/${id}/join`, { asRole }) });

// Speed
export const useRunSpeedRound = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, roundIndex }: { id: string; roundIndex: number }) => post(`/rooms/${id}/speed-round`, { roundIndex }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['neg', 'speed-matches', v.id] }) });
};
export const useSpeedMatches = (roomId: string, round?: number) =>
  useQuery({
    queryKey: ['neg', 'speed-matches', roomId, round],
    queryFn: () => get(`/rooms/${roomId}/speed-matches${round != null ? `?round=${round}` : ''}`, { items: [], meta: {} }),
    enabled: !!roomId,
  });

// Cards
export const useMyBusinessCard = () =>
  useQuery({ queryKey: ['neg', 'card', 'me'], queryFn: () => get(`/cards/me`, null as any) });
export const useUpsertBusinessCard = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: any) => post(`/cards`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['neg', 'card'] }) });
};
export const useShareBusinessCard = () =>
  useMutation({ mutationFn: (body: any) => post(`/cards/share`, body) });
export const useReceivedCards = () =>
  useQuery({ queryKey: ['neg', 'card', 'received'], queryFn: () => get(`/cards/received`, { items: [], meta: {} }) });

// Events
export const usePublicEvents = (status?: string) =>
  useQuery({ queryKey: ['neg', 'events', 'public', status],
    queryFn: () => get(`/events/public${status ? `?status=${status}` : ''}`, { items: [], meta: {} }) });
export const useMyEvents = (status?: string) =>
  useQuery({ queryKey: ['neg', 'events', 'mine', status],
    queryFn: () => get(`/events/mine${status ? `?status=${status}` : ''}`, { items: [], meta: {} }) });
export const useEvent = (id: string) =>
  useQuery({ queryKey: ['neg', 'event', id], queryFn: () => get(`/events/${id}`, null as any), enabled: !!id });
export const useCreateEvent = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: any) => post(`/events`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['neg', 'events'] }) });
};
export const useTransitionEvent = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => patch(`/events/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['neg', 'events'] }) });
};
export const useRsvp = () =>
  useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => post(`/events/${id}/rsvp`, { status }) });

// Groups
export const useGroups = (q?: string, mine?: boolean) =>
  useQuery({ queryKey: ['neg', 'groups', q, mine],
    queryFn: () => get(`/groups?${new URLSearchParams({ ...(q && { q }), ...(mine && { mine: '1' }) })}`,
                       { items: [], meta: {} }) });
export const useGroup = (id: string) =>
  useQuery({ queryKey: ['neg', 'group', id], queryFn: () => get(`/groups/${id}`, null as any), enabled: !!id });
export const useCreateGroup = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: any) => post(`/groups`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['neg', 'groups'] }) });
};
export const useJoinGroup = () =>
  useMutation({ mutationFn: (id: string) => post(`/groups/${id}/join`, {}) });
export const useGroupMembers = (id: string) =>
  useQuery({ queryKey: ['neg', 'group', id, 'members'], queryFn: () => get(`/groups/${id}/members`, { items: [], meta: {} }), enabled: !!id });
export const useGroupPosts = (id: string) =>
  useQuery({ queryKey: ['neg', 'group', id, 'posts'], queryFn: () => get(`/groups/${id}/posts`, { items: [], meta: {} }), enabled: !!id });
export const useCreateGroupPost = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, body }: { id: string; body: any }) => post(`/groups/${id}/posts`, body),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['neg', 'group', v.id, 'posts'] }) });
};
