/**
 * Domain 15 — TanStack Query hooks for events envelopes.
 * Page-side overlay onto existing fixtures: when API is enabled, hooks
 * fetch live; otherwise they're disabled and pages stay on their mocks.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventsApi, eventsApiAvailable, type EventEnvelope, type EventStatus, type RsvpStatus } from '@/lib/api/events';

const k = {
  list:     (q: object) => ['events', 'list', q] as const,
  detail:   (id: string) => ['events', 'detail', id] as const,
  speakers: (id: string) => ['events', 'speakers', id] as const,
  sessions: (id: string) => ['events', 'sessions', id] as const,
  messages: (id: string, ch?: string) => ['events', 'messages', id, ch ?? null] as const,
  rsvps:    (id: string) => ['events', 'rsvps', id] as const,
  checkins: (id: string) => ['events', 'checkins', id] as const,
};

export const eventsEnabled = eventsApiAvailable();

export const useEventsList = (q: Parameters<typeof eventsApi.list>[0] = {}) =>
  useQuery({ queryKey: k.list(q), queryFn: () => eventsApi.list(q), enabled: eventsEnabled, staleTime: 30_000 });

export const useEvent = (idOrSlug: string | undefined) =>
  useQuery({ queryKey: k.detail(idOrSlug ?? ''), queryFn: () => eventsApi.detail(idOrSlug!), enabled: eventsEnabled && !!idOrSlug, staleTime: 30_000 });

export const useEventSpeakers = (id: string | undefined) =>
  useQuery({ queryKey: k.speakers(id ?? ''), queryFn: () => eventsApi.speakers(id!), enabled: eventsEnabled && !!id });

export const useEventSessions = (id: string | undefined) =>
  useQuery({ queryKey: k.sessions(id ?? ''), queryFn: () => eventsApi.sessions(id!), enabled: eventsEnabled && !!id });

export const useEventMessages = (id: string | undefined, channel?: 'lobby'|'live'|'qa'|'backstage') =>
  useQuery({ queryKey: k.messages(id ?? '', channel), queryFn: () => eventsApi.messages(id!, channel), enabled: eventsEnabled && !!id, refetchInterval: 5_000 });

export const useEventRsvps = (id: string | undefined) =>
  useQuery({ queryKey: k.rsvps(id ?? ''), queryFn: () => eventsApi.rsvps(id!), enabled: eventsEnabled && !!id });

export const useEventCheckins = (id: string | undefined) =>
  useQuery({ queryKey: k.checkins(id ?? ''), queryFn: () => eventsApi.checkins(id!), enabled: eventsEnabled && !!id });

export function useEventRsvp(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: RsvpStatus) => eventsApi.rsvp(id!, status),
    onSuccess: () => { if (id) { qc.invalidateQueries({ queryKey: k.detail(id) }); qc.invalidateQueries({ queryKey: k.rsvps(id) }); } },
  });
}
export function useCancelEventRsvp(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => eventsApi.cancelRsvp(id!),
    onSuccess: () => { if (id) qc.invalidateQueries({ queryKey: k.detail(id) }); },
  });
}
export function useEventCheckIn(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { method?: 'manual'|'qr'|'auto'|'badge'; code?: string }) => eventsApi.checkIn(id!, v.method ?? 'manual', v.code),
    onSuccess: () => { if (id) qc.invalidateQueries({ queryKey: k.checkins(id) }); },
  });
}
export function usePostEventMessage(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { channel: 'lobby'|'live'|'qa'|'backstage'; body: string }) => eventsApi.postMessage(id!, v),
    onSuccess: (_d, v) => { if (id) qc.invalidateQueries({ queryKey: k.messages(id, v.channel) }); },
  });
}
export function useEventTransition(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { to: EventStatus; reason?: string }) => eventsApi.transition(id!, v.to, v.reason),
    onSuccess: () => { if (id) qc.invalidateQueries({ queryKey: k.detail(id) }); },
  });
}
export function useUpdateEvent(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<EventEnvelope>) => eventsApi.update(id!, patch),
    onSuccess: () => { if (id) qc.invalidateQueries({ queryKey: k.detail(id) }); },
  });
}
