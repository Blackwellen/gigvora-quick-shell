import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class NetworkingEventsGroupsRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ───── Rooms ────────────────────────────────────────────────────────
  async createRoom(ownerId: string, dto: any, videoRoomId: string) {
    const r = await this.ds.query(
      `INSERT INTO net_rooms
        (owner_identity_id, kind, title, topic, starts_at, ends_at, capacity,
         video_provider, video_room_id, is_paid, price_minor, currency,
         speed_round_seconds, speed_match_strategy, tags, invited_identity_ids, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16::jsonb,
               CASE WHEN $5 IS NOT NULL THEN 'scheduled' ELSE 'draft' END)
       RETURNING *`,
      [ownerId, dto.kind, dto.title, dto.topic ?? '', dto.startsAt ?? null, dto.endsAt ?? null,
       dto.capacity, dto.videoProvider, videoRoomId, !!dto.isPaid, dto.priceMinor ?? 0, dto.currency,
       dto.speedRoundSeconds, dto.speedMatchStrategy,
       JSON.stringify(dto.tags ?? []), JSON.stringify(dto.invitedIdentityIds ?? [])],
    );
    return r[0];
  }
  async getRoom(id: string) {
    const r = await this.ds.query(`SELECT * FROM net_rooms WHERE id=$1`, [id]);
    return r[0] ?? null;
  }
  async listRooms(opts: { kind?: string; status?: string; ownerId?: string; limit?: number }) {
    const where: string[] = []; const vals: any[] = []; let i = 1;
    if (opts.kind) { where.push(`kind=$${i++}`); vals.push(opts.kind); }
    if (opts.status) { where.push(`status=$${i++}`); vals.push(opts.status); }
    if (opts.ownerId) { where.push(`owner_identity_id=$${i++}`); vals.push(opts.ownerId); }
    if (!where.length) where.push('1=1');
    vals.push(opts.limit ?? 50);
    return this.ds.query(`SELECT * FROM net_rooms WHERE ${where.join(' AND ')}
      ORDER BY COALESCE(starts_at, created_at) DESC LIMIT $${i}`, vals);
  }
  async transitionRoom(id: string, status: string) {
    const r = await this.ds.query(`UPDATE net_rooms SET status=$1, updated_at=now() WHERE id=$2 RETURNING *`, [status, id]);
    return r[0];
  }
  async addAttendee(roomId: string, identityId: string, role: string, paidStatus: string, stripeSessionId: string | null) {
    const r = await this.ds.query(
      `INSERT INTO net_room_attendees (room_id, identity_id, role, paid_status, stripe_session_id, joined_at)
       VALUES ($1,$2,$3,$4,$5, now())
       ON CONFLICT (room_id, identity_id) DO UPDATE
         SET role=EXCLUDED.role, paid_status=EXCLUDED.paid_status, joined_at=now()
       RETURNING *`,
      [roomId, identityId, role, paidStatus, stripeSessionId],
    );
    return r[0];
  }
  async listAttendees(roomId: string) {
    return this.ds.query(`SELECT * FROM net_room_attendees WHERE room_id=$1 ORDER BY created_at ASC`, [roomId]);
  }
  async recordSpeedMatches(roomId: string, roundIndex: number, pairs: Array<{ a: string; b: string; score: number; reason: any }>) {
    if (!pairs.length) return [];
    const out: any[] = [];
    for (const p of pairs) {
      const r = await this.ds.query(
        `INSERT INTO net_speed_matches (room_id, round_index, identity_a, identity_b, score, reason)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb)
         ON CONFLICT (room_id, round_index, identity_a, identity_b) DO NOTHING
         RETURNING *`,
        [roomId, roundIndex, p.a, p.b, p.score, JSON.stringify(p.reason)],
      );
      if (r[0]) out.push(r[0]);
    }
    return out;
  }
  async listSpeedMatches(roomId: string, roundIndex?: number) {
    if (roundIndex == null) {
      return this.ds.query(`SELECT * FROM net_speed_matches WHERE room_id=$1 ORDER BY round_index, score DESC`, [roomId]);
    }
    return this.ds.query(`SELECT * FROM net_speed_matches WHERE room_id=$1 AND round_index=$2 ORDER BY score DESC`, [roomId, roundIndex]);
  }

  // ───── Business cards ───────────────────────────────────────────────
  async getCard(identityId: string) {
    const r = await this.ds.query(`SELECT * FROM net_business_cards WHERE owner_identity_id=$1`, [identityId]);
    return r[0] ?? null;
  }
  async upsertCard(identityId: string, dto: any) {
    const r = await this.ds.query(
      `INSERT INTO net_business_cards (owner_identity_id, display_name, headline, email, phone, website,
                                        links, avatar_url, accent_color, visibility)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10)
       ON CONFLICT (owner_identity_id) DO UPDATE SET
         display_name=EXCLUDED.display_name, headline=EXCLUDED.headline,
         email=EXCLUDED.email, phone=EXCLUDED.phone, website=EXCLUDED.website,
         links=EXCLUDED.links, avatar_url=EXCLUDED.avatar_url,
         accent_color=EXCLUDED.accent_color, visibility=EXCLUDED.visibility,
         updated_at=now()
       RETURNING *`,
      [identityId, dto.displayName, dto.headline ?? '', dto.email ?? null, dto.phone ?? null,
       dto.website ?? null, JSON.stringify(dto.links ?? []), dto.avatarUrl ?? null,
       dto.accentColor ?? 'oklch(0.5 0.18 240)', dto.visibility ?? 'connections'],
    );
    return r[0];
  }
  async shareCard(cardId: string, fromId: string, toIds: string[], context: string, contextId: string | null) {
    const out: any[] = [];
    for (const to of toIds) {
      const r = await this.ds.query(
        `INSERT INTO net_card_shares (card_id, from_identity_id, to_identity_id, context, context_id)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (card_id, to_identity_id, context_id) DO NOTHING
         RETURNING *`,
        [cardId, fromId, to, context, contextId],
      );
      if (r[0]) out.push(r[0]);
    }
    if (out.length) {
      await this.ds.query(`UPDATE net_business_cards SET share_count=share_count+$1 WHERE id=$2`, [out.length, cardId]);
    }
    return out;
  }
  async receivedCards(identityId: string) {
    return this.ds.query(
      `SELECT s.*, c.display_name, c.headline, c.avatar_url, c.accent_color, c.links
         FROM net_card_shares s JOIN net_business_cards c ON c.id=s.card_id
        WHERE s.to_identity_id=$1 ORDER BY s.created_at DESC LIMIT 200`,
      [identityId],
    );
  }

  // ───── Events ───────────────────────────────────────────────────────
  async createEvent(hostId: string, dto: any) {
    const r = await this.ds.query(
      `INSERT INTO evt_events (host_identity_id, host_org_id, title, summary, starts_at, ends_at,
         format, visibility, location_name, location_lat, location_lng, capacity,
         is_paid, price_minor, currency, cover_image_url, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb)
       RETURNING *`,
      [hostId, dto.hostOrgId ?? null, dto.title, dto.summary ?? '', dto.startsAt, dto.endsAt ?? null,
       dto.format, dto.visibility, dto.locationName ?? null, dto.locationLat ?? null, dto.locationLng ?? null,
       dto.capacity, !!dto.isPaid, dto.priceMinor ?? 0, dto.currency, dto.coverImageUrl ?? null,
       JSON.stringify(dto.tags ?? [])],
    );
    return r[0];
  }
  async listEvents(opts: { scope: 'mine' | 'public' | 'all'; hostId?: string; status?: string; limit?: number }) {
    const where: string[] = []; const vals: any[] = []; let i = 1;
    if (opts.scope === 'mine' && opts.hostId) { where.push(`host_identity_id=$${i++}`); vals.push(opts.hostId); }
    if (opts.scope === 'public') { where.push(`visibility='public'`); }
    if (opts.status) { where.push(`status=$${i++}`); vals.push(opts.status); }
    if (!where.length) where.push('1=1');
    vals.push(opts.limit ?? 100);
    return this.ds.query(`SELECT * FROM evt_events WHERE ${where.join(' AND ')} ORDER BY starts_at DESC LIMIT $${i}`, vals);
  }
  async getEvent(id: string) {
    const r = await this.ds.query(`SELECT * FROM evt_events WHERE id=$1`, [id]);
    return r[0] ?? null;
  }
  async transitionEvent(id: string, status: string) {
    const r = await this.ds.query(`UPDATE evt_events SET status=$1, updated_at=now() WHERE id=$2 RETURNING *`, [status, id]);
    return r[0];
  }
  async upsertRsvp(eventId: string, identityId: string, status: string, paidStatus: string, sessionId: string | null) {
    const r = await this.ds.query(
      `INSERT INTO evt_rsvps (event_id, identity_id, status, paid_status, stripe_session_id)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (event_id, identity_id) DO UPDATE SET status=EXCLUDED.status, paid_status=EXCLUDED.paid_status
       RETURNING *`,
      [eventId, identityId, status, paidStatus, sessionId],
    );
    await this.ds.query(`UPDATE evt_events SET rsvp_count=(SELECT COUNT(*) FROM evt_rsvps WHERE event_id=$1 AND status IN ('going','checked_in')) WHERE id=$1`, [eventId]);
    return r[0];
  }
  async listRsvps(eventId: string) {
    return this.ds.query(`SELECT * FROM evt_rsvps WHERE event_id=$1 ORDER BY rsvp_at ASC`, [eventId]);
  }

  // ───── Groups ───────────────────────────────────────────────────────
  async createGroup(ownerId: string, dto: any) {
    const r = await this.ds.query(
      `INSERT INTO grp_groups (owner_identity_id, handle, display_name, about, visibility,
                                join_policy, category, cover_image_url, tags, rules)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb)
       RETURNING *`,
      [ownerId, dto.handle, dto.displayName, dto.about ?? '', dto.visibility, dto.joinPolicy,
       dto.category ?? null, dto.coverImageUrl ?? null,
       JSON.stringify(dto.tags ?? []), JSON.stringify(dto.rules ?? [])],
    );
    await this.ds.query(
      `INSERT INTO grp_members (group_id, identity_id, role) VALUES ($1,$2,'owner')`,
      [r[0].id, ownerId],
    );
    await this.ds.query(`UPDATE grp_groups SET member_count=1 WHERE id=$1`, [r[0].id]);
    return r[0];
  }
  async listGroups(opts: { q?: string; mineOnly?: boolean; identityId?: string; limit?: number }) {
    if (opts.mineOnly && opts.identityId) {
      return this.ds.query(
        `SELECT g.* FROM grp_groups g JOIN grp_members m ON m.group_id=g.id
          WHERE m.identity_id=$1 AND g.status='active' ORDER BY g.updated_at DESC LIMIT $2`,
        [opts.identityId, opts.limit ?? 100],
      );
    }
    const where: string[] = [`status='active'`, `visibility IN ('public','private')`];
    const vals: any[] = []; let i = 1;
    if (opts.q) { where.push(`(display_name ILIKE $${i} OR about ILIKE $${i})`); vals.push(`%${opts.q}%`); i++; }
    vals.push(opts.limit ?? 100);
    return this.ds.query(`SELECT * FROM grp_groups WHERE ${where.join(' AND ')} ORDER BY member_count DESC, updated_at DESC LIMIT $${i}`, vals);
  }
  async getGroup(id: string) {
    const r = await this.ds.query(`SELECT * FROM grp_groups WHERE id=$1 OR handle=$1`, [id]);
    return r[0] ?? null;
  }
  async joinGroup(groupId: string, identityId: string, role: string) {
    const r = await this.ds.query(
      `INSERT INTO grp_members (group_id, identity_id, role) VALUES ($1,$2,$3)
       ON CONFLICT (group_id, identity_id) DO UPDATE SET role=EXCLUDED.role
       RETURNING *`,
      [groupId, identityId, role],
    );
    if (role !== 'pending') {
      await this.ds.query(`UPDATE grp_groups SET member_count=(SELECT COUNT(*) FROM grp_members WHERE group_id=$1 AND role<>'pending') WHERE id=$1`, [groupId]);
    }
    return r[0];
  }
  async listMembers(groupId: string) {
    return this.ds.query(`SELECT * FROM grp_members WHERE group_id=$1 ORDER BY joined_at ASC LIMIT 500`, [groupId]);
  }
  async createPost(groupId: string, authorId: string, dto: any) {
    const r = await this.ds.query(
      `INSERT INTO grp_posts (group_id, author_identity_id, body, attachments)
       VALUES ($1,$2,$3,$4::jsonb) RETURNING *`,
      [groupId, authorId, dto.body, JSON.stringify(dto.attachments ?? [])],
    );
    await this.ds.query(`UPDATE grp_groups SET post_count=post_count+1 WHERE id=$1`, [groupId]);
    return r[0];
  }
  async listPosts(groupId: string) {
    return this.ds.query(`SELECT * FROM grp_posts WHERE group_id=$1 AND status='published' ORDER BY pinned DESC, created_at DESC LIMIT 100`, [groupId]);
  }

  // ───── Audit ────────────────────────────────────────────────────────
  async audit(actor: string, role: string, domain: string, entity: string, entityId: string, action: string,
              before: any, after: any, ip?: string, ua?: string) {
    await this.ds.query(
      `INSERT INTO neg_audit (actor_identity_id, actor_role, domain, entity, entity_id, action, before, after, ip, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10)`,
      [actor, role, domain, entity, entityId, action,
       before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null,
       ip ?? null, ua ?? null],
    );
  }
}
