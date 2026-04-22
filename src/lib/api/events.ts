/**
 * Domain 15 — Events, Networking Sessions, RSVPs & Social Meetups.
 * Typed envelope client for the live NestJS endpoints in
 * apps/api-nest/src/modules/events. Mirrors the existing page mock shape
 * so wiring is mechanical and the UI stays unchanged.
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

export type EventStatus = 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled' | 'archived';
export type EventFormat = 'virtual' | 'in_person' | 'hybrid';
export type EventType = 'webinar'|'meetup'|'conference'|'workshop'|'networking'|'roundtable'|'briefing'|'summit'|'live_room'|'speed_networking';
export type RsvpStatus = 'going'|'interested'|'waitlist'|'cancelled'|'attended'|'no_show';

export interface EventEnvelope {
  id: string; hostId: string; groupId?: string | null; slug: string; title: string;
  type: EventType; format: EventFormat; status: EventStatus;
  visibility: 'public'|'unlisted'|'private'|'enterprise_only';
  description?: string | null;
  agenda: Array<{ title: string; startsAt: string; durationMin: number; speaker?: string }>;
  startsAt: string; endsAt?: string | null; timezone: string;
  location?: string | null; meetingUrl?: string | null; coverUrl?: string | null;
  tags: string[]; capacity?: number | null;
  priceCents: number; currency: string;
  rsvpCount: number; attendedCount: number;
  recordingUrl?: string | null;
  meetingHandleId?: string | null;
  createdAt: string; updatedAt: string;
  myRsvp?: RsvpStatus | null;
}
export interface EventRsvp { eventId: string; identityId: string; status: RsvpStatus; displayName?: string | null; email?: string | null; rsvpedAt: string }
export interface EventSpeaker { id: string; eventId: string; identityId?: string | null; name: string; title?: string | null; bio?: string | null; avatarUrl?: string | null; position: number }
export interface EventSession { id: string; eventId: string; title: string; description?: string | null; startsAt: string; durationMin: number; speakerId?: string | null; position: number }
export interface EventMessage { id: string; eventId: string; channel: 'lobby'|'live'|'qa'|'backstage'; authorId: string; body: string; status: 'visible'|'hidden'|'deleted'; createdAt: string }
export interface EventCheckin { eventId: string; identityId: string; method: 'manual'|'qr'|'auto'|'badge'; at: string }
export interface ListEnvelope<T> { items: T[]; total: number; page?: number; pageSize?: number; hasMore: boolean }

export const eventsApi = {
  list: (q: Partial<{ q: string; type: EventType; format: EventFormat; status: EventStatus; from: string; to: string; page: number; pageSize: number; sort: string }> = {}) =>
    req<ListEnvelope<EventEnvelope>>(`/api/v1/events${qs(q)}`),
  detail:    (idOrSlug: string) => req<EventEnvelope>(`/api/v1/events/${encodeURIComponent(idOrSlug)}`),
  speakers:  (id: string) => req<ListEnvelope<EventSpeaker>>(`/api/v1/events/${id}/speakers`),
  sessions:  (id: string) => req<ListEnvelope<EventSession>>(`/api/v1/events/${id}/sessions`),
  messages:  (id: string, channel?: 'lobby'|'live'|'qa'|'backstage') => req<ListEnvelope<EventMessage>>(`/api/v1/events/${id}/messages${qs({ channel })}`),
  rsvps:     (id: string) => req<ListEnvelope<EventRsvp>>(`/api/v1/events/${id}/rsvps`),
  checkins:  (id: string) => req<ListEnvelope<EventCheckin>>(`/api/v1/events/${id}/checkins`),

  create:    (body: Partial<EventEnvelope>) => req<EventEnvelope>(`/api/v1/events`, { method: 'POST', body: JSON.stringify(body) }),
  update:    (id: string, patch: Partial<EventEnvelope>) => req<EventEnvelope>(`/api/v1/events/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  transition:(id: string, to: EventStatus, reason?: string) => req<EventEnvelope>(`/api/v1/events/${id}/transition`, { method: 'POST', body: JSON.stringify({ to, reason }) }),
  archive:   (id: string) => req<{ ok: true }>(`/api/v1/events/${id}`, { method: 'DELETE' }),

  rsvp:       (id: string, status: RsvpStatus = 'going') => req<EventRsvp>(`/api/v1/events/${id}/rsvp`, { method: 'POST', body: JSON.stringify({ status }) }),
  cancelRsvp: (id: string) => req<{ ok: true }>(`/api/v1/events/${id}/rsvp`, { method: 'DELETE' }),
  postMessage:(id: string, body: { channel: EventMessage['channel']; body: string }) => req<EventMessage>(`/api/v1/events/${id}/messages`, { method: 'POST', body: JSON.stringify(body) }),
  checkIn:    (id: string, method: EventCheckin['method'] = 'manual', code?: string) => req<EventCheckin>(`/api/v1/events/${id}/checkin`, { method: 'POST', body: JSON.stringify({ method, code }) }),
};

export const eventsApiAvailable = (): boolean => baseUrl.length > 0;
