import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Thin repository over raw SQL (TypeORM DataSource).
 * Returns plain rows; the service is responsible for shaping envelopes.
 */
@Injectable()
export class EnterpriseConnectRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ── Orgs ────────────────────────────────────────────────────────────
  async getOrgByOwner(ownerId: string) {
    const r = await this.ds.query(`SELECT * FROM ec_org_profiles WHERE owner_identity_id=$1 LIMIT 1`, [ownerId]);
    return r[0] ?? null;
  }
  async getOrgByHandle(handle: string) {
    const r = await this.ds.query(`SELECT * FROM ec_org_profiles WHERE handle=$1 LIMIT 1`, [handle]);
    return r[0] ?? null;
  }
  async getOrgById(id: string) {
    const r = await this.ds.query(`SELECT * FROM ec_org_profiles WHERE id=$1 LIMIT 1`, [id]);
    return r[0] ?? null;
  }
  async createOrg(ownerId: string, dto: any) {
    const r = await this.ds.query(
      `INSERT INTO ec_org_profiles
        (owner_identity_id, kind, handle, legal_name, display_name, tagline, about,
         industry, hq_country, hq_city, size_band, funding_stage, website_url,
         logo_url, banner_url, capabilities, certifications, contacts, visibility)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17::jsonb,$18::jsonb,$19)
       RETURNING *`,
      [
        ownerId, dto.kind, dto.handle, dto.legalName, dto.displayName, dto.tagline ?? '', dto.about ?? '',
        dto.industry ?? null, dto.hqCountry ?? null, dto.hqCity ?? null, dto.sizeBand ?? null, dto.fundingStage ?? null,
        dto.websiteUrl ?? null, dto.logoUrl ?? null, dto.bannerUrl ?? null,
        JSON.stringify(dto.capabilities ?? []), JSON.stringify(dto.certifications ?? []),
        JSON.stringify(dto.contacts ?? []), dto.visibility ?? 'public',
      ],
    );
    return r[0];
  }
  async updateOrg(id: string, patch: any) {
    const fields: string[] = []; const vals: any[] = []; let i = 1;
    const map: Record<string, string> = {
      legalName: 'legal_name', displayName: 'display_name', tagline: 'tagline', about: 'about',
      industry: 'industry', hqCountry: 'hq_country', hqCity: 'hq_city', sizeBand: 'size_band',
      fundingStage: 'funding_stage', websiteUrl: 'website_url', logoUrl: 'logo_url', bannerUrl: 'banner_url',
      visibility: 'visibility', kind: 'kind',
    };
    for (const [k, col] of Object.entries(map)) {
      if (patch[k] !== undefined) { fields.push(`${col}=$${i++}`); vals.push(patch[k]); }
    }
    for (const k of ['capabilities', 'certifications', 'contacts'] as const) {
      if (patch[k] !== undefined) { fields.push(`${k}=$${i++}::jsonb`); vals.push(JSON.stringify(patch[k])); }
    }
    if (!fields.length) return this.getOrgById(id);
    fields.push(`updated_at=now()`);
    vals.push(id);
    const r = await this.ds.query(`UPDATE ec_org_profiles SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, vals);
    return r[0];
  }
  async transitionOrg(id: string, status: string) {
    const r = await this.ds.query(`UPDATE ec_org_profiles SET status=$1, updated_at=now() WHERE id=$2 RETURNING *`, [status, id]);
    return r[0];
  }

  // ── Directory ───────────────────────────────────────────────────────
  async upsertDirectory(orgId: string, vector: string, tags: string[], region: string | null, highlights: any[]) {
    await this.ds.query(
      `INSERT INTO ec_directory_entries (org_id, search_vector, tags, region, highlights, last_indexed_at)
       VALUES ($1,$2,$3::jsonb,$4,$5::jsonb, now())
       ON CONFLICT (org_id) DO UPDATE
       SET search_vector=EXCLUDED.search_vector, tags=EXCLUDED.tags, region=EXCLUDED.region,
           highlights=EXCLUDED.highlights, last_indexed_at=now()`,
      [orgId, vector, JSON.stringify(tags), region, JSON.stringify(highlights)],
    );
  }
  async searchDirectory(q: string | undefined, region: string | undefined, limit = 50) {
    const where: string[] = []; const vals: any[] = []; let i = 1;
    if (q) { where.push(`d.search_vector ILIKE $${i++}`); vals.push(`%${q}%`); }
    if (region) { where.push(`d.region=$${i++}`); vals.push(region); }
    where.push(`o.status='active'`);
    where.push(`o.visibility IN ('public','network')`);
    vals.push(limit);
    const sql = `
      SELECT o.id, o.handle, o.display_name, o.kind, o.industry, o.hq_country, o.hq_city,
             o.logo_url, o.tagline, o.size_band, o.funding_stage, d.tags, d.highlights, d.region
        FROM ec_directory_entries d
        JOIN ec_org_profiles o ON o.id=d.org_id
       WHERE ${where.join(' AND ')}
       ORDER BY o.updated_at DESC
       LIMIT $${i}`;
    return this.ds.query(sql, vals);
  }

  // ── Partners ────────────────────────────────────────────────────────
  async listPartners(orgId: string) {
    return this.ds.query(
      `SELECT p.*, oa.display_name AS a_name, oa.logo_url AS a_logo,
              ob.display_name AS b_name, ob.logo_url AS b_logo
         FROM ec_partners p
         JOIN ec_org_profiles oa ON oa.id=p.org_id_a
         JOIN ec_org_profiles ob ON ob.id=p.org_id_b
        WHERE (p.org_id_a=$1 OR p.org_id_b=$1)
        ORDER BY p.match_score DESC, p.created_at DESC LIMIT 200`,
      [orgId],
    );
  }
  async createPartner(a: string, b: string, kind: string, score: number, reason: any) {
    const r = await this.ds.query(
      `INSERT INTO ec_partners (org_id_a, org_id_b, relation_kind, match_score, match_reason, started_at)
       VALUES ($1,$2,$3,$4,$5::jsonb, now())
       ON CONFLICT (org_id_a, org_id_b, relation_kind)
       DO UPDATE SET match_score=EXCLUDED.match_score, match_reason=EXCLUDED.match_reason
       RETURNING *`,
      [a, b, kind, score, JSON.stringify(reason)],
    );
    return r[0];
  }
  async candidateOrgsForPartner(myOrgId: string, limit = 100) {
    return this.ds.query(
      `SELECT o.id, o.display_name, o.industry, o.hq_country,
              COALESCE((SELECT array_agg(c) FROM jsonb_array_elements_text(o.capabilities) c), '{}') AS capabilities
         FROM ec_org_profiles o
        WHERE o.id<>$1 AND o.status='active' AND o.visibility IN ('public','network')
        LIMIT $2`,
      [myOrgId, limit],
    );
  }

  // ── Procurement ─────────────────────────────────────────────────────
  async listBriefs(buyerOrgId: string | null, opts: { status?: string; category?: string; limit?: number }) {
    const where: string[] = []; const vals: any[] = []; let i = 1;
    if (buyerOrgId) { where.push(`buyer_org_id=$${i++}`); vals.push(buyerOrgId); }
    if (opts.status) { where.push(`status=$${i++}`); vals.push(opts.status); }
    if (opts.category) { where.push(`category=$${i++}`); vals.push(opts.category); }
    if (!where.length) where.push('1=1');
    vals.push(opts.limit ?? 100);
    return this.ds.query(`SELECT * FROM ec_procurement_briefs WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT $${i}`, vals);
  }
  async createBrief(ownerId: string, dto: any) {
    const r = await this.ds.query(
      `INSERT INTO ec_procurement_briefs
        (buyer_org_id, owner_identity_id, title, summary, category, budget_minor, currency,
         due_at, requirements, visibility, invited_org_ids)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11::jsonb)
       RETURNING *`,
      [
        dto.buyerOrgId, ownerId, dto.title, dto.summary ?? '', dto.category ?? null,
        dto.budgetMinor ?? null, dto.currency ?? 'GBP',
        dto.dueAt ?? null, JSON.stringify(dto.requirements ?? []),
        dto.visibility ?? 'network', JSON.stringify(dto.invitedOrgIds ?? []),
      ],
    );
    return r[0];
  }
  async transitionBrief(id: string, status: string) {
    const r = await this.ds.query(
      `UPDATE ec_procurement_briefs SET status=$1, updated_at=now() WHERE id=$2 RETURNING *`,
      [status, id],
    );
    return r[0];
  }
  async getBriefById(id: string) {
    const r = await this.ds.query(`SELECT * FROM ec_procurement_briefs WHERE id=$1 LIMIT 1`, [id]);
    return r[0] ?? null;
  }

  // ── Intros ──────────────────────────────────────────────────────────
  async listIntros(identityId: string, role: 'requester' | 'broker' | 'target') {
    const col = { requester: 'requester_identity_id', broker: 'broker_identity_id', target: 'target_identity_id' }[role];
    return this.ds.query(`SELECT * FROM ec_intros WHERE ${col}=$1 ORDER BY created_at DESC LIMIT 200`, [identityId]);
  }
  async createIntro(requesterId: string, dto: any) {
    const expires = new Date(Date.now() + (dto.expiresInDays ?? 14) * 86_400_000).toISOString();
    const r = await this.ds.query(
      `INSERT INTO ec_intros
        (requester_identity_id, broker_identity_id, target_identity_id, context_org_id,
         reason, message, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [requesterId, dto.brokerIdentityId, dto.targetIdentityId, dto.contextOrgId ?? null,
       dto.reason, dto.message ?? '', expires],
    );
    return r[0];
  }
  async decideIntro(id: string, decision: string, declineReason: string | null) {
    const r = await this.ds.query(
      `UPDATE ec_intros SET status=$1, decline_reason=$2,
         decided_at=CASE WHEN $1 IN ('accepted','declined','cancelled') THEN now() ELSE decided_at END,
         completed_at=CASE WHEN $1='completed' THEN now() ELSE completed_at END
       WHERE id=$3 RETURNING *`,
      [decision, declineReason, id],
    );
    return r[0];
  }
  async getIntroById(id: string) {
    const r = await this.ds.query(`SELECT * FROM ec_intros WHERE id=$1 LIMIT 1`, [id]);
    return r[0] ?? null;
  }

  // ── Rooms ───────────────────────────────────────────────────────────
  async listRooms(ownerOrgId: string) {
    return this.ds.query(`SELECT * FROM ec_rooms WHERE owner_org_id=$1 ORDER BY COALESCE(starts_at, created_at) DESC LIMIT 100`, [ownerOrgId]);
  }
  async createRoom(ownerId: string, dto: any) {
    const videoRoomId = `gv-${dto.videoProvider}-${crypto.randomUUID().slice(0, 8)}`;
    const r = await this.ds.query(
      `INSERT INTO ec_rooms
         (owner_org_id, owner_identity_id, kind, title, agenda, starts_at, ends_at,
          video_provider, video_room_id, capacity, invited_identity_ids, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb, CASE WHEN $6 IS NOT NULL THEN 'scheduled' ELSE 'draft' END)
       RETURNING *`,
      [dto.ownerOrgId, ownerId, dto.kind, dto.title, dto.agenda ?? '',
       dto.startsAt ?? null, dto.endsAt ?? null,
       dto.videoProvider, videoRoomId, dto.capacity, JSON.stringify(dto.invitedIdentityIds ?? [])],
    );
    return r[0];
  }
  async transitionRoom(id: string, status: string) {
    const r = await this.ds.query(`UPDATE ec_rooms SET status=$1, updated_at=now() WHERE id=$2 RETURNING *`, [status, id]);
    return r[0];
  }
  async getRoomById(id: string) {
    const r = await this.ds.query(`SELECT * FROM ec_rooms WHERE id=$1 LIMIT 1`, [id]);
    return r[0] ?? null;
  }

  // ── Events ──────────────────────────────────────────────────────────
  async listEvents(hostOrgId: string | null, opts: { status?: string; limit?: number }) {
    const where: string[] = []; const vals: any[] = []; let i = 1;
    if (hostOrgId) { where.push(`host_org_id=$${i++}`); vals.push(hostOrgId); }
    if (opts.status) { where.push(`status=$${i++}`); vals.push(opts.status); }
    if (!where.length) where.push('1=1');
    vals.push(opts.limit ?? 100);
    return this.ds.query(`SELECT * FROM ec_events WHERE ${where.join(' AND ')} ORDER BY starts_at DESC LIMIT $${i}`, vals);
  }
  async createEvent(ownerId: string, dto: any) {
    const r = await this.ds.query(
      `INSERT INTO ec_events (host_org_id, owner_identity_id, title, summary, starts_at, ends_at, format, visibility, capacity)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [dto.hostOrgId, ownerId, dto.title, dto.summary ?? '', dto.startsAt, dto.endsAt ?? null,
       dto.format, dto.visibility, dto.capacity],
    );
    return r[0];
  }
  async transitionEvent(id: string, status: string) {
    const r = await this.ds.query(`UPDATE ec_events SET status=$1 WHERE id=$2 RETURNING *`, [status, id]);
    return r[0];
  }
  async getEventById(id: string) {
    const r = await this.ds.query(`SELECT * FROM ec_events WHERE id=$1 LIMIT 1`, [id]);
    return r[0] ?? null;
  }

  // ── Startups ────────────────────────────────────────────────────────
  async listStartups(opts: { featured?: boolean; limit?: number }) {
    const where: string[] = ['o.status=$1', `o.kind IN ('startup','scaleup')`]; const vals: any[] = ['active']; let i = 2;
    if (opts.featured) { where.push(`s.featured=$${i++}`); vals.push(true); }
    vals.push(opts.limit ?? 50);
    return this.ds.query(
      `SELECT s.*, o.display_name, o.handle, o.tagline, o.industry, o.logo_url, o.banner_url,
              o.hq_country, o.hq_city, o.funding_stage
         FROM ec_startups s
         JOIN ec_org_profiles o ON o.id=s.org_id
        WHERE ${where.join(' AND ')}
        ORDER BY s.featured DESC, s.showcase_rank DESC, s.updated_at DESC LIMIT $${i}`,
      vals,
    );
  }
  async getStartup(id: string) {
    const r = await this.ds.query(
      `SELECT s.*, o.display_name, o.handle, o.tagline, o.about, o.industry, o.logo_url,
              o.banner_url, o.hq_country, o.hq_city, o.funding_stage, o.website_url
         FROM ec_startups s JOIN ec_org_profiles o ON o.id=s.org_id WHERE s.id=$1`,
      [id],
    );
    return r[0] ?? null;
  }
  async upsertStartup(dto: any) {
    const r = await this.ds.query(
      `INSERT INTO ec_startups (org_id, pitch_one_liner, pitch_deck_url, product_demo_url,
                                fundraising, traction, team, featured)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8)
       ON CONFLICT (org_id) DO UPDATE SET
         pitch_one_liner=EXCLUDED.pitch_one_liner,
         pitch_deck_url=EXCLUDED.pitch_deck_url,
         product_demo_url=EXCLUDED.product_demo_url,
         fundraising=EXCLUDED.fundraising,
         traction=EXCLUDED.traction,
         team=EXCLUDED.team,
         featured=EXCLUDED.featured,
         updated_at=now()
       RETURNING *`,
      [dto.orgId, dto.pitchOneLiner ?? '', dto.pitchDeckUrl ?? null, dto.productDemoUrl ?? null,
       JSON.stringify(dto.fundraising ?? {}), JSON.stringify(dto.traction ?? {}),
       JSON.stringify(dto.team ?? []), !!dto.featured],
    );
    return r[0];
  }
  async setStartupRank(orgId: string, rank: number) {
    await this.ds.query(`UPDATE ec_startups SET showcase_rank=$1, updated_at=now() WHERE org_id=$2`, [rank, orgId]);
  }

  // ── Audit ───────────────────────────────────────────────────────────
  async audit(actor: string, role: string, entity: string, entityId: string, action: string,
              before: any, after: any, ip?: string, ua?: string) {
    await this.ds.query(
      `INSERT INTO ec_audit (actor_identity_id, actor_role, entity, entity_id, action, before, after, ip, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9)`,
      [actor, role, entity, entityId, action,
       before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null,
       ip ?? null, ua ?? null],
    );
  }
}
