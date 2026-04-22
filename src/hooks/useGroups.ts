/**
 * Domain 14 — TanStack Query hooks for groups envelopes.
 * Pages overlay these on top of their existing fixtures so the UI is
 * preserved exactly. When no API is configured, queries are disabled.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { groupsApi, groupsApiAvailable, type GroupEnvelope } from '@/lib/api/groups';

const k = {
  list:     (q: object) => ['groups', 'list', q] as const,
  detail:   (id: string) => ['groups', 'detail', id] as const,
  members:  (id: string) => ['groups', 'members', id] as const,
  posts:    (id: string, ch?: string) => ['groups', 'posts', id, ch ?? null] as const,
  channels: (id: string) => ['groups', 'channels', id] as const,
  events:   (id: string) => ['groups', 'events', id] as const,
  requests: (id: string) => ['groups', 'requests', id] as const,
};

export const groupsEnabled = groupsApiAvailable();

export const useGroupsList = (q: Parameters<typeof groupsApi.list>[0] = {}) =>
  useQuery({ queryKey: k.list(q), queryFn: () => groupsApi.list(q), enabled: groupsEnabled, staleTime: 30_000 });

export const useGroup = (idOrSlug: string | undefined) =>
  useQuery({ queryKey: k.detail(idOrSlug ?? ''), queryFn: () => groupsApi.detail(idOrSlug!), enabled: groupsEnabled && !!idOrSlug, staleTime: 30_000 });

export const useGroupMembers = (id: string | undefined) =>
  useQuery({ queryKey: k.members(id ?? ''), queryFn: () => groupsApi.members(id!), enabled: groupsEnabled && !!id });

export const useGroupChannels = (id: string | undefined) =>
  useQuery({ queryKey: k.channels(id ?? ''), queryFn: () => groupsApi.channels(id!), enabled: groupsEnabled && !!id });

export const useGroupPosts = (id: string | undefined, channelId?: string) =>
  useQuery({ queryKey: k.posts(id ?? '', channelId), queryFn: () => groupsApi.posts(id!, channelId), enabled: groupsEnabled && !!id });

export const useGroupEvents = (id: string | undefined) =>
  useQuery({ queryKey: k.events(id ?? ''), queryFn: () => groupsApi.events(id!), enabled: groupsEnabled && !!id });

export const useGroupRequests = (id: string | undefined) =>
  useQuery({ queryKey: k.requests(id ?? ''), queryFn: () => groupsApi.requests(id!), enabled: groupsEnabled && !!id });

export function useJoinGroup(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message?: string) => groupsApi.join(id!, message),
    onSuccess: () => { if (id) qc.invalidateQueries({ queryKey: k.detail(id) }); },
  });
}
export function useLeaveGroup(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => groupsApi.leave(id!),
    onSuccess: () => { if (id) qc.invalidateQueries({ queryKey: k.detail(id) }); },
  });
}
export function useDecideJoinRequest(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { requestId: string; decision: 'approve'|'reject'; reason?: string }) =>
      groupsApi.decideRequest(id!, v.requestId, v.decision, v.reason),
    onSuccess: () => { if (id) qc.invalidateQueries({ queryKey: k.requests(id) }); },
  });
}
export function useUpdateGroup(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<GroupEnvelope>) => groupsApi.update(id!, patch),
    onSuccess: () => { if (id) qc.invalidateQueries({ queryKey: k.detail(id) }); },
  });
}
