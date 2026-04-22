/**
 * Domain 14 — Groups, Community Hubs & Member Conversations.
 * Typed envelope client for the live NestJS endpoints in
 * apps/api-nest/src/modules/groups. Pages call this through useGroups
 * hooks; when no API base is configured, hooks are disabled and pages
 * keep their existing fixture UI.
 */

const baseUrl =
  ((import.meta as any).env?.VITE_GIGVORA_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  try {
    const tok = localStorage.getItem('gigvora.token');
    if (tok) headers.set('Authorization', `Bearer ${tok}`);
  } catch { /* SSR */ }
  const r = await fetch(`${baseUrl}${path}`, { ...init, headers });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json() as Promise<T>;
}
const qs = (q: Record<string, unknown>) => {
  const p = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => { if (v != null && v !== '') p.set(k, String(v)); });
  const s = p.toString(); return s ? `?${s}` : '';
};

export type GroupType = 'public' | 'private' | 'secret';
export type GroupStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface GroupEnvelope {
  id: string; ownerId: string; slug: string; name: string;
  category?: string | null; description?: string | null; rules?: string | null;
  type: GroupType; status: GroupStatus;
  coverUrl?: string | null; iconUrl?: string | null; tags: string[];
  joinPolicy: 'open' | 'request' | 'invite_only';
  postingPolicy: 'anyone' | 'members' | 'mods_only';
  memberCount: number; postsLast7d: number;
  createdAt: string; updatedAt: string;
  joined?: boolean; role?: 'owner' | 'admin' | 'moderator' | 'member';
}
export interface GroupMember {
  groupId: string; identityId: string; role: 'owner'|'admin'|'moderator'|'member';
  status: 'active'|'pending'|'invited'|'banned'|'left';
  displayName?: string | null; avatarUrl?: string | null; joinedAt: string;
}
export interface GroupPost {
  id: string; groupId: string; channelId?: string | null; authorId: string;
  body: string; attachments: Array<{ url: string; kind: string; name?: string }>;
  status: 'active'|'pending'|'hidden'|'deleted';
  pinned: boolean; locked: boolean;
  reactionCount: number; commentCount: number;
  createdAt: string; updatedAt: string;
}
export interface GroupChannel {
  id: string; groupId: string; name: string; slug: string;
  description?: string | null; type: 'discussion'|'announcement'|'voice'|'event';
  position: number; private: boolean;
}
export interface GroupJoinRequest {
  id: string; groupId: string; identityId: string; message?: string | null;
  status: 'pending'|'approved'|'rejected'; createdAt: string; decidedAt?: string | null;
}
export interface ListEnvelope<T> { items: T[]; total: number; page?: number; pageSize?: number; hasMore: boolean }

export const groupsApi = {
  list: (q: Partial<{ q: string; category: string; type: GroupType; joined: boolean; page: number; pageSize: number; sort: string }> = {}) =>
    req<ListEnvelope<GroupEnvelope>>(`/api/v1/groups${qs(q)}`),
  detail:   (idOrSlug: string)               => req<GroupEnvelope>(`/api/v1/groups/${encodeURIComponent(idOrSlug)}`),
  members:  (id: string)                     => req<ListEnvelope<GroupMember>>(`/api/v1/groups/${id}/members`),
  channels: (id: string)                     => req<ListEnvelope<GroupChannel>>(`/api/v1/groups/${id}/channels`),
  posts:    (id: string, channelId?: string) => req<ListEnvelope<GroupPost>>(`/api/v1/groups/${id}/posts${qs({ channelId })}`),
  events:   (id: string)                     => req<ListEnvelope<{ id: string; title: string; startsAt: string; endsAt?: string; location?: string; rsvpCount: number; status: string }>>(`/api/v1/groups/${id}/events`),
  requests: (id: string)                     => req<ListEnvelope<GroupJoinRequest>>(`/api/v1/groups/${id}/requests`),

  create:   (body: Partial<GroupEnvelope>) => req<GroupEnvelope>(`/api/v1/groups`, { method: 'POST', body: JSON.stringify(body) }),
  update:   (id: string, patch: Partial<GroupEnvelope>) => req<GroupEnvelope>(`/api/v1/groups/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  pause:    (id: string) => req<GroupEnvelope>(`/api/v1/groups/${id}/pause`,   { method: 'POST' }),
  archive:  (id: string) => req<{ ok: true }>(`/api/v1/groups/${id}`,           { method: 'DELETE' }),
  restore:  (id: string) => req<GroupEnvelope>(`/api/v1/groups/${id}/restore`, { method: 'POST' }),

  join:     (id: string, message?: string) => req<{ status: 'joined' | 'requested' }>(`/api/v1/groups/${id}/join`,  { method: 'POST', body: JSON.stringify({ message }) }),
  leave:    (id: string)                   => req<{ ok: true }>(`/api/v1/groups/${id}/leave`, { method: 'POST' }),
  decideRequest: (id: string, requestId: string, decision: 'approve'|'reject', reason?: string) =>
    req<GroupJoinRequest>(`/api/v1/groups/${id}/requests/${requestId}/decide`, { method: 'POST', body: JSON.stringify({ decision, reason }) }),

  addPost:  (id: string, body: Partial<GroupPost>) => req<GroupPost>(`/api/v1/groups/${id}/posts`, { method: 'POST', body: JSON.stringify(body) }),
  react:    (id: string, postId: string, emoji: string) => req<{ count: number; reacted: boolean }>(`/api/v1/groups/${id}/posts/${postId}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) }),
};

export const groupsApiAvailable = (): boolean => baseUrl.length > 0;
