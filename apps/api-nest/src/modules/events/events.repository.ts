import { Injectable } from '@nestjs/common';

/**
 * Domain 15 — In-memory repository for Events, Networking Sessions, RSVPs &
 * Social Meetups. Mirrors the AgencyRepository / GroupsRepository pattern;
 * swap to Drizzle/Postgres in production by binding the same method shape
 * against `packages/db/src/schema/events.ts`.
 */
@Injectable()
export class EventsRepository {
  private events    = new Map<string, any>();
  private rsvps     = new Map<string, Map<string, any>>(); // eventId -> identityId -> rsvp
  private speakers  = new Map<string, any[]>();
  private sessions  = new Map<string, any[]>();
  private messages  = new Map<string, any[]>();            // eventId -> chat messages
  private checkins  = new Map<string, Map<string, any>>(); // eventId -> identityId -> checkin
  private feedback  = new Map<string, any[]>();
  private waitlists = new Map<string, string[]>();         // eventId -> [identityId,...] FIFO

  // ---------- list / detail ----------
  async list(q: any) {
    let arr = Array.from(this.events.values()).filter(e => e.status !== 'archived');
    if (q.viewerId == null) arr = arr.filter(e => e.visibility === 'public');
    else                    arr = arr.filter(e => e.visibility !== 'private' || e.hostId === q.viewerId);

    if (q.q) {
      const n = q.q.toLowerCase();
      arr = arr.filter(e => e.title?.toLowerCase().includes(n) || e.description?.toLowerCase().includes(n) || (e.tags ?? []).some((t: string) => t.toLowerCase().includes(n)));
    }
    if (q.type)       arr = arr.filter(e => e.type === q.type);
    if (q.format)     arr = arr.filter(e => e.format === q.format);
    if (q.status)     arr = arr.filter(e => e.status === q.status);
    if (q.visibility) arr = arr.filter(e => e.visibility === q.visibility);
    if (q.hostId)     arr = arr.filter(e => e.hostId === q.hostId);
    if (q.groupId)    arr = arr.filter(e => e.groupId === q.groupId);
    if (q.hostedByMe && q.viewerId) arr = arr.filter(e => e.hostId === q.viewerId);
    if (q.rsvpedByMe && q.viewerId) arr = arr.filter(e => this.rsvps.get(e.id)?.has(q.viewerId));

    const now = Date.now();
    if (q.upcoming) arr = arr.filter(e => new Date(e.startsAt).getTime() > now);
    if (q.past)     arr = arr.filter(e => new Date(e.startsAt).getTime() < now);

    if (q.sort === 'starts_at')  arr.sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));
    if (q.sort === 'recent')     arr.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    if (q.sort === 'popularity') arr.sort((a, b) => (b.rsvpCount ?? 0) - (a.rsvpCount ?? 0));

    const total = arr.length;
    const start = (q.page - 1) * q.pageSize;
    const items = arr.slice(start, start + q.pageSize).map(e => ({
      ...e,
      viewerRsvp: q.viewerId ? this.rsvps.get(e.id)?.get(q.viewerId) ?? null : null,
    }));
    return { items, total, limit: q.pageSize, hasMore: start + items.length < total };
  }

  async get(id: string)        { return this.events.get(id) ?? null; }
  async getBySlug(slug: string) {
    for (const e of this.events.values()) if (e.slug === slug) return e;
    return null;
  }
  async create(e: any) {
    const id = e.id ?? crypto.randomUUID();
    const now = new Date().toISOString();
    const next = {
      id, status: 'scheduled', visibility: 'public', format: 'virtual',
      rsvpCount: 0, attendedCount: 0, waitlistCount: 0,
      createdAt: now, updatedAt: now, ...e,
    };
    this.events.set(id, next);
    return next;
  }
  async update(id: string, patch: any) {
    const prev = this.events.get(id); if (!prev) return null;
    const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
    this.events.set(id, next);
    return next;
  }
  async setStatus(id: string, status: any) { return this.update(id, { status, statusChangedAt: new Date().toISOString() }); }

  // ---------- rsvp ----------
  async upsertRsvp(eventId: string, identityId: string, dto: any) {
    const ev = this.events.get(eventId); if (!ev) return null;
    const map = this.rsvps.get(eventId) ?? new Map();
    const prev = map.get(identityId);
    let status = dto.status;
    // capacity gate: promote to waitlist if full
    if (status === 'going' && ev.capacity && this.countByStatus(eventId, 'going') >= ev.capacity && prev?.status !== 'going') {
      if (ev.waitlistEnabled) {
        status = 'waitlist';
        const wl = this.waitlists.get(eventId) ?? [];
        if (!wl.includes(identityId)) wl.push(identityId);
        this.waitlists.set(eventId, wl);
      } else {
        return { error: 'capacity_full' };
      }
    }
    const rsvp = { identityId, status, guests: dto.guests ?? 0, note: dto.note ?? null, createdAt: prev?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() };
    map.set(identityId, rsvp);
    this.rsvps.set(eventId, map);
    this.recountRsvps(eventId);
    return rsvp;
  }
  async cancelRsvp(eventId: string, identityId: string) {
    const map = this.rsvps.get(eventId); if (!map) return { ok: true };
    map.delete(identityId);
    const wl = this.waitlists.get(eventId) ?? [];
    this.waitlists.set(eventId, wl.filter(x => x !== identityId));
    this.recountRsvps(eventId);
    // promote first waitlisted into going (if capacity allows)
    const ev = this.events.get(eventId);
    if (ev && ev.waitlistEnabled) {
      const remainingWl = this.waitlists.get(eventId) ?? [];
      const promoted = remainingWl.shift();
      if (promoted && (!ev.capacity || this.countByStatus(eventId, 'going') < ev.capacity)) {
        const m2 = this.rsvps.get(eventId) ?? new Map();
        const r = m2.get(promoted);
        if (r) { r.status = 'going'; r.updatedAt = new Date().toISOString(); m2.set(promoted, r); this.rsvps.set(eventId, m2); }
        this.waitlists.set(eventId, remainingWl);
        this.recountRsvps(eventId);
        return { ok: true, promoted };
      }
    }
    return { ok: true };
  }
  async listRsvps(eventId: string)  { return Array.from(this.rsvps.get(eventId)?.values() ?? []); }
  async getRsvp(eventId: string, identityId: string) { return this.rsvps.get(eventId)?.get(identityId) ?? null; }
  private countByStatus(eventId: string, status: string) { return Array.from(this.rsvps.get(eventId)?.values() ?? []).filter(r => r.status === status).length; }
  private recountRsvps(eventId: string) {
    const ev = this.events.get(eventId); if (!ev) return;
    const arr = Array.from(this.rsvps.get(eventId)?.values() ?? []);
    ev.rsvpCount = arr.filter(r => r.status === 'going').length;
    ev.waitlistCount = arr.filter(r => r.status === 'waitlist').length;
    ev.attendedCount = arr.filter(r => r.status === 'attended').length;
    this.events.set(eventId, ev);
  }

  // ---------- speakers / sessions ----------
  async listSpeakers(eventId: string) { return this.speakers.get(eventId) ?? []; }
  async addSpeaker(eventId: string, dto: any) {
    const next = { id: crypto.randomUUID(), eventId, ...dto, createdAt: new Date().toISOString() };
    this.speakers.set(eventId, [...(this.speakers.get(eventId) ?? []), next]);
    return next;
  }
  async listSessions(eventId: string) { return (this.sessions.get(eventId) ?? []).slice().sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt))); }
  async addSession(eventId: string, dto: any) {
    const next = { id: crypto.randomUUID(), eventId, ...dto, createdAt: new Date().toISOString() };
    this.sessions.set(eventId, [...(this.sessions.get(eventId) ?? []), next]);
    return next;
  }

  // ---------- live room ----------
  async listMessages(eventId: string, channel?: string) {
    let arr = this.messages.get(eventId) ?? [];
    if (channel) arr = arr.filter(m => m.channel === channel);
    return arr.slice(-200);
  }
  async addMessage(eventId: string, authorId: string, dto: any) {
    const next = { id: crypto.randomUUID(), eventId, authorId, channel: dto.channel ?? 'lobby', body: dto.body, createdAt: new Date().toISOString() };
    this.messages.set(eventId, [...(this.messages.get(eventId) ?? []), next]);
    return next;
  }
  async removeMessage(eventId: string, messageId: string) {
    const arr = this.messages.get(eventId) ?? [];
    this.messages.set(eventId, arr.filter(m => m.id !== messageId));
    return { ok: true };
  }

  // ---------- check-in ----------
  async checkIn(eventId: string, identityId: string, method: string) {
    const map = this.checkins.get(eventId) ?? new Map();
    const next = { identityId, method, checkedInAt: new Date().toISOString() };
    map.set(identityId, next);
    this.checkins.set(eventId, map);
    // also promote rsvp to attended
    const r = this.rsvps.get(eventId)?.get(identityId);
    if (r) { r.status = 'attended'; r.updatedAt = next.checkedInAt; this.rsvps.get(eventId)!.set(identityId, r); this.recountRsvps(eventId); }
    return next;
  }
  async listCheckins(eventId: string) { return Array.from(this.checkins.get(eventId)?.values() ?? []); }

  // ---------- feedback ----------
  async addFeedback(eventId: string, identityId: string, dto: any) {
    const next = { id: crypto.randomUUID(), eventId, identityId, ...dto, createdAt: new Date().toISOString() };
    this.feedback.set(eventId, [...(this.feedback.get(eventId) ?? []), next]);
    return next;
  }
  async listFeedback(eventId: string) { return this.feedback.get(eventId) ?? []; }

  // ---------- search export ----------
  async denormForSearch(eventId: string) {
    const e = this.events.get(eventId); if (!e) return null;
    return {
      id: e.id, slug: e.slug, title: e.title, type: e.type, format: e.format, visibility: e.visibility,
      startsAt: e.startsAt, endsAt: e.endsAt, location: e.location ?? null, tags: e.tags ?? [],
      hostId: e.hostId ?? null, groupId: e.groupId ?? null, status: e.status,
      rsvpCount: e.rsvpCount ?? 0, attendedCount: e.attendedCount ?? 0,
      capacity: e.capacity ?? null, priceCents: e.priceCents ?? 0,
    };
  }

  async seed(record: any) { return this.create(record); }
}
