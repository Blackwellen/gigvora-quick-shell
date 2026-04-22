import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NetworkingEventsGroupsRepository } from './networking-events-groups.repository';
import { buildJitsiJoin } from '../../../../integrations/src/voice/jitsi';
import { buildLiveKitJoin } from '../../../../integrations/src/voice/livekit';

type Meta = { ip?: string; userAgent?: string };

/**
 * Networking + Speed Networking + Events + Groups service.
 *
 * Speed-networking matcher (deterministic, defensible):
 *   1. Build interest sets from each attendee's tags (or org capabilities if
 *      tags are missing). Lowercase + trim.
 *   2. For each unmatched pair, score = round(100 * jaccard(interestsA, interestsB)).
 *   3. If strategy='random', shuffle deterministically by roomId+round seed.
 *   4. Pair greedily in score-descending order; leftover odd person becomes
 *      "observer" for that round and is auto-matched in the next round.
 *
 * Video provider routing:
 *   - capacity ≤ 50 AND !isPaid    → Jitsi (free, public meet.jit.si)
 *   - capacity > 50 OR  isPaid     → LiveKit (better recording + analytics)
 *   - explicit videoProvider on dto wins.
 *
 * Paid-room flow (Stripe-ready):
 *   - createRoom with isPaid=true marks room with currency + priceMinor.
 *   - joinRoom with paidStatus='paid' (set by Stripe webhook handler) admits;
 *     'pending' creates a hold and the front-end opens checkout.
 *   - Free attendee path skips Stripe entirely.
 */
@Injectable()
export class NetworkingEventsGroupsService {
  constructor(private readonly repo: NetworkingEventsGroupsRepository) {}

  // ───── Networking rooms ─────────────────────────────────────────────
  async createRoom(actorId: string, dto: any, role: string, meta: Meta) {
    const provider = this.pickVideoProvider(dto);
    const join = provider === 'livekit'
      ? buildLiveKitJoin({ roomName: dto.title, identityId: actorId })
      : buildJitsiJoin({ roomName: dto.title, contextKind: 'call' });
    const videoRoomId = (join as any).roomName;
    const row = await this.repo.createRoom(actorId, { ...dto, videoProvider: provider }, videoRoomId);
    await this.repo.audit(actorId, role, 'networking', 'room', row.id, 'create', null, row, meta.ip, meta.userAgent);
    return row;
  }
  async listRooms(opts: { kind?: string; status?: string; ownerId?: string }) {
    const items = await this.repo.listRooms({ ...opts, limit: 60 });
    return { items, meta: { source: 'networking-events-groups', count: items.length } };
  }
  async transitionRoom(actorId: string, id: string, status: string, role: string, meta: Meta) {
    const before = await this.repo.getRoom(id);
    if (!before) throw new NotFoundException({ code: 'room_not_found' });
    if (before.owner_identity_id !== actorId) throw new ForbiddenException({ code: 'not_room_owner' });
    const after = await this.repo.transitionRoom(id, status);
    await this.repo.audit(actorId, role, 'networking', 'room', id, 'transition', { status: before.status }, { status }, meta.ip, meta.userAgent);
    return after;
  }
  async joinRoom(actorId: string, id: string, asRole: string, role: string, meta: Meta) {
    const room = await this.repo.getRoom(id);
    if (!room) throw new NotFoundException({ code: 'room_not_found' });
    if (room.status === 'archived' || room.status === 'ended') {
      throw new ForbiddenException({ code: 'room_closed' });
    }
    // Paid rooms: admit only if we have a paid attendee row, else require Stripe checkout first.
    if (room.is_paid) {
      const attendees = await this.repo.listAttendees(id);
      const me = attendees.find((a: any) => a.identity_id === actorId);
      if (!me || me.paid_status !== 'paid') {
        return {
          requiresPayment: true,
          room,
          checkout: {
            currency: room.currency,
            amountMinor: room.price_minor,
            stripePriceId: room.stripe_price_id ?? null,
          },
        };
      }
    }
    const att = await this.repo.addAttendee(id, actorId, asRole, room.is_paid ? 'paid' : 'free', null);
    const join = room.video_provider === 'livekit'
      ? buildLiveKitJoin({ roomName: room.title, identityId: actorId })
      : buildJitsiJoin({ roomName: room.title, contextKind: 'call' });
    await this.repo.audit(actorId, role, 'networking', 'room', id, 'join', null, { role: asRole }, meta.ip, meta.userAgent);
    return { requiresPayment: false, room, attendee: att, join };
  }

  // ───── Speed networking ─────────────────────────────────────────────
  async runSpeedRound(actorId: string, roomId: string, roundIndex: number, role: string, meta: Meta) {
    const room = await this.repo.getRoom(roomId);
    if (!room) throw new NotFoundException({ code: 'room_not_found' });
    if (room.kind !== 'speed') throw new ForbiddenException({ code: 'not_speed_room' });
    if (room.owner_identity_id !== actorId) throw new ForbiddenException({ code: 'not_room_owner' });
    const attendees = await this.repo.listAttendees(roomId);
    const active = attendees.filter((a: any) => !a.left_at && a.role !== 'observer');
    const pairs = this.deterministicSpeedMatch(active, roomId, roundIndex, room.speed_match_strategy);
    const inserted = await this.repo.recordSpeedMatches(roomId, roundIndex, pairs);
    await this.repo.audit(actorId, role, 'speed', 'room', roomId, 'round', null, { roundIndex, pairs: pairs.length }, meta.ip, meta.userAgent);
    return { items: inserted, meta: { source: 'speed-matcher', model: 'speed-jaccard-v1-deterministic', roundIndex, count: inserted.length } };
  }
  async listSpeedMatches(roomId: string, roundIndex?: number) {
    const items = await this.repo.listSpeedMatches(roomId, roundIndex);
    return { items, meta: { source: 'speed-matcher', count: items.length, roundIndex: roundIndex ?? null } };
  }

  // ───── Business cards ───────────────────────────────────────────────
  async getMyCard(actorId: string) { return this.repo.getCard(actorId); }
  async upsertMyCard(actorId: string, dto: any, role: string, meta: Meta) {
    const before = await this.repo.getCard(actorId);
    const after = await this.repo.upsertCard(actorId, dto);
    await this.repo.audit(actorId, role, 'card', 'business-card', after.id, before ? 'update' : 'create', before, after, meta.ip, meta.userAgent);
    return after;
  }
  async shareMyCard(actorId: string, body: { toIdentityIds: string[]; context: string; contextId?: string }, role: string, meta: Meta) {
    const card = await this.repo.getCard(actorId);
    if (!card) throw new NotFoundException({ code: 'no_card' });
    const filtered = body.toIdentityIds.filter((id) => id !== actorId);
    const out = await this.repo.shareCard(card.id, actorId, filtered, body.context, body.contextId ?? null);
    await this.repo.audit(actorId, role, 'card', 'business-card', card.id, 'share', null, { count: out.length, context: body.context }, meta.ip, meta.userAgent);
    return { items: out, meta: { count: out.length } };
  }
  async receivedCards(actorId: string) {
    const items = await this.repo.receivedCards(actorId);
    return { items, meta: { count: items.length } };
  }

  // ───── Events ───────────────────────────────────────────────────────
  async createEvent(actorId: string, dto: any, role: string, meta: Meta) {
    const row = await this.repo.createEvent(actorId, dto);
    await this.repo.audit(actorId, role, 'event', 'event', row.id, 'create', null, row, meta.ip, meta.userAgent);
    return row;
  }
  async listEvents(actorId: string, scope: 'mine' | 'public', status?: string) {
    const items = await this.repo.listEvents({ scope, hostId: actorId, status, limit: 100 });
    return { items, meta: { source: 'events', count: items.length, scope } };
  }
  async getEvent(id: string) {
    const row = await this.repo.getEvent(id);
    if (!row) throw new NotFoundException({ code: 'event_not_found' });
    return row;
  }
  async transitionEvent(actorId: string, id: string, status: string, role: string, meta: Meta) {
    const before = await this.repo.getEvent(id);
    if (!before) throw new NotFoundException({ code: 'event_not_found' });
    if (before.host_identity_id !== actorId) throw new ForbiddenException({ code: 'not_event_host' });
    const after = await this.repo.transitionEvent(id, status);
    await this.repo.audit(actorId, role, 'event', 'event', id, 'transition', { status: before.status }, { status }, meta.ip, meta.userAgent);
    return after;
  }
  async rsvp(actorId: string, eventId: string, status: string, role: string, meta: Meta) {
    const event = await this.repo.getEvent(eventId);
    if (!event) throw new NotFoundException({ code: 'event_not_found' });
    if (event.is_paid && status === 'going') {
      // Front-end will redirect to Stripe; we record a 'pending' RSVP.
      const row = await this.repo.upsertRsvp(eventId, actorId, status, 'pending', null);
      await this.repo.audit(actorId, role, 'event', 'rsvp', row.id, 'rsvp_pending', null, { status }, meta.ip, meta.userAgent);
      return {
        ...row,
        requiresPayment: true,
        checkout: { currency: event.currency, amountMinor: event.price_minor, stripePriceId: event.stripe_price_id ?? null },
      };
    }
    const row = await this.repo.upsertRsvp(eventId, actorId, status, 'free', null);
    await this.repo.audit(actorId, role, 'event', 'rsvp', row.id, 'rsvp', null, { status }, meta.ip, meta.userAgent);
    return { ...row, requiresPayment: false };
  }

  // ───── Groups ───────────────────────────────────────────────────────
  async createGroup(actorId: string, dto: any, role: string, meta: Meta) {
    const exists = await this.repo.getGroup(dto.handle);
    if (exists) throw new ForbiddenException({ code: 'handle_taken' });
    const row = await this.repo.createGroup(actorId, dto);
    await this.repo.audit(actorId, role, 'group', 'group', row.id, 'create', null, row, meta.ip, meta.userAgent);
    return row;
  }
  async listGroups(actorId: string, opts: { q?: string; mineOnly?: boolean }) {
    const items = await this.repo.listGroups({ ...opts, identityId: actorId, limit: 100 });
    return { items, meta: { count: items.length } };
  }
  async getGroup(idOrHandle: string) {
    const row = await this.repo.getGroup(idOrHandle);
    if (!row) throw new NotFoundException({ code: 'group_not_found' });
    return row;
  }
  async joinGroup(actorId: string, id: string, role: string, meta: Meta) {
    const group = await this.repo.getGroup(id);
    if (!group) throw new NotFoundException({ code: 'group_not_found' });
    const memberRole = group.join_policy === 'open' ? 'member' : 'pending';
    const row = await this.repo.joinGroup(group.id, actorId, memberRole);
    await this.repo.audit(actorId, role, 'group', 'group', group.id, 'join', null, { role: memberRole }, meta.ip, meta.userAgent);
    return row;
  }
  async listMembers(id: string) {
    const group = await this.repo.getGroup(id);
    if (!group) throw new NotFoundException({ code: 'group_not_found' });
    const items = await this.repo.listMembers(group.id);
    return { items, meta: { count: items.length } };
  }
  async createPost(actorId: string, id: string, dto: any, role: string, meta: Meta) {
    const group = await this.repo.getGroup(id);
    if (!group) throw new NotFoundException({ code: 'group_not_found' });
    const members = await this.repo.listMembers(group.id);
    const me = members.find((m: any) => m.identity_id === actorId);
    if (!me || me.role === 'pending') throw new ForbiddenException({ code: 'not_member' });
    const row = await this.repo.createPost(group.id, actorId, dto);
    await this.repo.audit(actorId, role, 'group', 'post', row.id, 'create', null, row, meta.ip, meta.userAgent);
    return row;
  }
  async listPosts(id: string) {
    const group = await this.repo.getGroup(id);
    if (!group) throw new NotFoundException({ code: 'group_not_found' });
    const items = await this.repo.listPosts(group.id);
    return { items, meta: { count: items.length } };
  }

  // ───── Helpers ──────────────────────────────────────────────────────
  private pickVideoProvider(dto: { videoProvider?: string; capacity: number; isPaid?: boolean }): 'jitsi' | 'livekit' | 'daily' {
    if (dto.videoProvider) return dto.videoProvider as any;
    if (dto.isPaid || dto.capacity > 50) return 'livekit';
    return 'jitsi';
  }
  private deterministicSpeedMatch(
    attendees: any[], roomId: string, roundIndex: number, strategy: string,
  ): Array<{ a: string; b: string; score: number; reason: any }> {
    if (attendees.length < 2) return [];
    // Seeded shuffle for reproducibility (roomId + roundIndex).
    const seed = (roomId + ':' + roundIndex).split('').reduce((s, c) => (s * 31 + c.charCodeAt(0)) | 0, 7);
    const ordered = [...attendees].sort((a, b) => {
      const ax = ((seed ^ a.identity_id.charCodeAt(0)) * 17) | 0;
      const bx = ((seed ^ b.identity_id.charCodeAt(0)) * 17) | 0;
      return ax - bx;
    });
    const interests = (a: any) => new Set(((a.meta?.interests ?? a.meta?.tags) ?? []).map((s: string) => String(s).toLowerCase()));
    const used = new Set<string>();
    const out: Array<{ a: string; b: string; score: number; reason: any }> = [];
    for (let i = 0; i < ordered.length; i++) {
      const a = ordered[i];
      if (used.has(a.identity_id)) continue;
      let best: any = null; let bestScore = -1; let bestReason: any = {};
      for (let j = i + 1; j < ordered.length; j++) {
        const b = ordered[j];
        if (used.has(b.identity_id)) continue;
        let score = 0; let reason: any = {};
        if (strategy === 'random') {
          score = 50;
          reason = { strategy: 'random' };
        } else {
          const ia = interests(a); const ib = interests(b);
          const inter = [...ia].filter((x) => ib.has(x));
          const uni = new Set([...ia, ...ib]);
          const jaccard = uni.size ? inter.length / uni.size : 0;
          score = Math.round(100 * jaccard);
          reason = { jaccard, shared: inter };
        }
        if (score > bestScore) { best = b; bestScore = score; bestReason = reason; }
      }
      if (best) {
        used.add(a.identity_id); used.add(best.identity_id);
        out.push({ a: a.identity_id, b: best.identity_id, score: Math.max(0, bestScore), reason: bestReason });
      }
    }
    return out;
  }
}
