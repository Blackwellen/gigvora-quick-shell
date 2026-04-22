import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventsRepository } from './events.repository';
import { AuditService } from '../workspace/audit.service';
import { D17Emit } from '../domain-bus/domain-emissions';

function envelope<T>(items: T[], limit?: number) {
  const lim = limit ?? items.length;
  return { items, total: items.length, limit: lim, hasMore: limit != null && items.length >= lim };
}

/**
 * Domain 15 — Events, Networking Sessions, RSVPs & Social Meetups.
 *
 * Lifecycle: draft → scheduled → live → completed (or cancelled / archived).
 * RSVP machine: going ⇄ interested ⇄ waitlist; capacity-gated promotions on
 *   cancel; check-in promotes going → attended; missed → no_show post-event.
 *
 * RBAC:
 *   • Public events: anyone can list/detail. RSVP requires auth.
 *   • Private events: detail/RSVP only via direct host invite (hostId match).
 *   • Enterprise-only: enforced by an upstream guard at the route level.
 *   • Hosts/cohosts: edit, transition, manage speakers/sessions, moderate.
 *   • Speakers: appear in the speaker list and can post in `live` channel.
 */
@Injectable()
export class EventsService {
  constructor(
    private readonly repo: EventsRepository,
    private readonly audit: AuditService,
  ) {}

  // ---------- discovery ----------
  async list(viewerId: string|null, q: any) { return this.repo.list({ ...q, viewerId }); }

  async detail(idOrSlug: string, viewerId: string|null) {
    const e = idOrSlug.match(/^[0-9a-f-]{36}$/i)
      ? (await this.repo.get(idOrSlug)) ?? (await this.repo.getBySlug(idOrSlug))
      : (await this.repo.getBySlug(idOrSlug)) ?? (await this.repo.get(idOrSlug));
    if (!e) throw new NotFoundException('event_not_found');
    if (e.visibility === 'private' && e.hostId !== viewerId) throw new NotFoundException('event_not_found');
    const myRsvp = viewerId ? await this.repo.getRsvp(e.id, viewerId) : null;
    return { ...e, viewerRsvp: myRsvp };
  }

  // ---------- host CRUD ----------
  async create(actorId: string, dto: any) {
    if (await this.repo.getBySlug(dto.slug)) throw new BadRequestException('slug_taken');
    if (dto.endsAt && new Date(dto.endsAt) <= new Date(dto.startsAt)) throw new BadRequestException('endsAt_must_be_after_startsAt');
    const e = await this.repo.create({ ...dto, hostId: actorId });
    await this.audit.record({ actorId, domain: 'events', action: 'event.create', targetType: 'event', targetId: e.id, meta: { slug: e.slug, type: e.type, visibility: e.visibility } });
    void D17Emit.created(actorId, e.id, { slug: e.slug, type: e.type, visibility: e.visibility, hostId: actorId, startsAt: e.startsAt });
    return e;
  }
  async update(id: string, actorId: string, patch: any) {
    const e = await this.assertHost(id, actorId);
    if (patch.endsAt && patch.startsAt && new Date(patch.endsAt) <= new Date(patch.startsAt)) throw new BadRequestException('endsAt_must_be_after_startsAt');
    if (e.status === 'completed' || e.status === 'archived') throw new BadRequestException('event_locked');
    const next = await this.repo.update(id, patch);
    await this.audit.record({ actorId, domain: 'events', action: 'event.update', targetType: 'event', targetId: id, meta: { fields: Object.keys(patch ?? {}) } });
    void D17Emit.updated(actorId, id, { fields: Object.keys(patch ?? {}) });
    return next;
  }
  async transition(id: string, actorId: string, to: 'scheduled'|'live'|'completed'|'cancelled', reason?: string) {
    const e = await this.assertHost(id, actorId);
    const valid: Record<string, string[]> = {
      draft: ['scheduled', 'cancelled'],
      scheduled: ['live', 'cancelled'],
      live: ['completed', 'cancelled'],
      completed: [],
      cancelled: ['scheduled'],
      archived: [],
    };
    if (!valid[e.status]?.includes(to)) throw new BadRequestException(`invalid_transition:${e.status}->${to}`);
    const next = await this.repo.setStatus(id, to);
    await this.audit.record({ actorId, domain: 'events', action: `event.${to}`, targetType: 'event', targetId: id, meta: { from: e.status, reason: reason ?? null } });
    if (to === 'scheduled') void D17Emit.scheduled(actorId, id, { from: e.status });
    else if (to === 'live') void D17Emit.live(actorId, id, { from: e.status });
    else if (to === 'completed') void D17Emit.completed(actorId, id, { from: e.status });
    else if (to === 'cancelled') void D17Emit.cancelled(actorId, id, { from: e.status, reason: reason ?? null });
    return next;
  }
  async archive(id: string, actorId: string) {
    await this.assertHost(id, actorId);
    const next = await this.repo.setStatus(id, 'archived');
    await this.audit.record({ actorId, domain: 'events', action: 'event.archive', targetType: 'event', targetId: id });
    void D17Emit.archived(actorId, id, {});
    return next;
  }

  // ---------- rsvp ----------
  async rsvp(id: string, identityId: string, dto: any) {
    const e = await this.repo.get(id); if (!e) throw new NotFoundException('event_not_found');
    if (e.status === 'cancelled' || e.status === 'archived') throw new BadRequestException('event_closed');
    if (e.visibility === 'private' && e.hostId !== identityId) throw new ForbiddenException('private_event');
    const r = await this.repo.upsertRsvp(id, identityId, dto);
    if (r && (r as any).error) throw new BadRequestException((r as any).error);
    await this.audit.record({ actorId: identityId, domain: 'events', action: 'event.rsvp', targetType: 'event', targetId: id, meta: { status: (r as any).status } });
    void D17Emit.rsvpCreated(identityId, `${id}:${identityId}`, { eventId: id, identityId, status: (r as any).status });
    return r;
  }
  async cancelRsvp(id: string, identityId: string) {
    const r = await this.repo.cancelRsvp(id, identityId);
    await this.audit.record({ actorId: identityId, domain: 'events', action: 'event.rsvp.cancel', targetType: 'event', targetId: id });
    void D17Emit.rsvpCancelled(identityId, `${id}:${identityId}`, { eventId: id, identityId });
    return r;
  }
  async listRsvps(id: string, actorId: string) {
    await this.assertHost(id, actorId);
    return envelope(await this.repo.listRsvps(id));
  }

  // ---------- speakers / sessions ----------
  async listSpeakers(id: string)  { return envelope(await this.repo.listSpeakers(id)); }
  async addSpeaker(id: string, actorId: string, dto: any) {
    await this.assertHost(id, actorId);
    const s = await this.repo.addSpeaker(id, dto);
    await this.audit.record({ actorId, domain: 'events', action: 'event.speaker.add', targetType: 'event', targetId: id, meta: { speakerId: s.id, name: s.name } });
    void D17Emit.speakerAdded(actorId, s.id, { eventId: id, name: s.name });
    return s;
  }
  async listSessions(id: string)  { return envelope(await this.repo.listSessions(id)); }
  async addSession(id: string, actorId: string, dto: any) {
    await this.assertHost(id, actorId);
    const s = await this.repo.addSession(id, dto);
    await this.audit.record({ actorId, domain: 'events', action: 'event.session.add', targetType: 'event', targetId: id, meta: { sessionId: s.id } });
    void D17Emit.sessionAdded(actorId, s.id, { eventId: id });
    return s;
  }

  // ---------- live room / chat ----------
  async listMessages(id: string, channel?: string) { return envelope(await this.repo.listMessages(id, channel)); }
  async postMessage(id: string, actorId: string, dto: any) {
    const e = await this.repo.get(id); if (!e) throw new NotFoundException('event_not_found');
    if (e.status !== 'live' && e.status !== 'scheduled') throw new BadRequestException('chat_closed');
    const r = await this.repo.getRsvp(id, actorId);
    if (!r && e.hostId !== actorId) throw new ForbiddenException('not_attending');
    const m = await this.repo.addMessage(id, actorId, dto);
    return m;
  }
  async moderate(id: string, actorId: string, dto: any) {
    await this.assertHost(id, actorId);
    if (dto.action === 'remove_message') await this.repo.removeMessage(id, dto.targetId);
    await this.audit.record({ actorId, domain: 'events', action: `event.moderate.${dto.action}`, targetType: 'event', targetId: id, meta: { targetId: dto.targetId, reason: dto.reason ?? null } });
    return { ok: true };
  }

  // ---------- check-in / feedback ----------
  async checkIn(id: string, actorId: string, dto: any) {
    await this.assertHost(id, actorId);
    const c = await this.repo.checkIn(id, dto.identityId, dto.method);
    await this.audit.record({ actorId, domain: 'events', action: 'event.checkin', targetType: 'event', targetId: id, meta: { identityId: dto.identityId, method: dto.method } });
    void D17Emit.checkinRecorded(actorId, `${id}:${dto.identityId}`, { eventId: id, identityId: dto.identityId, method: dto.method });
    return c;
  }
  async listCheckins(id: string, actorId: string) {
    await this.assertHost(id, actorId);
    return envelope(await this.repo.listCheckins(id));
  }
  async submitFeedback(id: string, actorId: string, dto: any) {
    const r = await this.repo.getRsvp(id, actorId);
    if (!r || r.status !== 'attended') throw new ForbiddenException('attendance_required');
    const f = await this.repo.addFeedback(id, actorId, dto);
    void D17Emit.feedbackSubmitted(actorId, f.id, { eventId: id, identityId: actorId, rating: f.rating });
    return f;
  }
  async listFeedback(id: string, actorId: string) {
    await this.assertHost(id, actorId);
    return envelope(await this.repo.listFeedback(id));
  }

  // ---------- analytics summary ----------
  async summary(id: string, actorId: string) {
    await this.assertHost(id, actorId);
    const e = await this.repo.get(id); if (!e) throw new NotFoundException('event_not_found');
    const rsvps     = await this.repo.listRsvps(id);
    const checkins  = await this.repo.listCheckins(id);
    const feedback  = await this.repo.listFeedback(id);
    const sessions  = await this.repo.listSessions(id);
    const ratings   = feedback.map(f => f.rating).filter(Boolean);
    const npsScores = feedback.map(f => f.npsLikely).filter((n): n is number => typeof n === 'number');
    return {
      capacity: e.capacity ?? null,
      rsvps: { total: rsvps.length, going: rsvps.filter(r => r.status === 'going').length, waitlist: rsvps.filter(r => r.status === 'waitlist').length, declined: rsvps.filter(r => r.status === 'declined').length, attended: rsvps.filter(r => r.status === 'attended').length, no_show: rsvps.filter(r => r.status === 'no_show').length },
      checkInRate: rsvps.filter(r => r.status === 'going' || r.status === 'attended').length === 0 ? 0 : Number((checkins.length / rsvps.filter(r => r.status === 'going' || r.status === 'attended').length).toFixed(2)),
      avgRating: ratings.length ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)) : null,
      nps: npsScores.length ? Number(((npsScores.filter(n => n >= 9).length - npsScores.filter(n => n <= 6).length) / npsScores.length * 100).toFixed(0)) : null,
      sessionCount: sessions.length,
    };
  }

  // ---------- guards ----------
  private async assertHost(id: string, actorId: string) {
    const e = await this.repo.get(id); if (!e) throw new NotFoundException('event_not_found');
    if (e.hostId !== actorId) throw new ForbiddenException('host_only');
    return e;
  }
}
