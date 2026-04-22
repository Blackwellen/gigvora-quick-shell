import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EnterpriseConnectRepository } from './enterprise-connect.repository';

type ReqMeta = { ip?: string; userAgent?: string };

/**
 * Enterprise Connect service — covers org profiles, directory, partners,
 * procurement briefs, intros, rooms, events, and the Startup Showcase.
 *
 * Deterministic partner-match scorer ships in this file (industry-overlap +
 * geo-bonus + capability-jaccard + complementary-stage). The ML adapter at
 * `enterprise-connect.ml.service.ts` may override scores when available, but
 * the deterministic path is always defensible by an operator.
 */
@Injectable()
export class EnterpriseConnectService {
  constructor(private readonly repo: EnterpriseConnectRepository) {}

  // ───── Overview / Bootstrap ─────────────────────────────────────────
  async overview(actorId: string) {
    const org = await this.repo.getOrgByOwner(actorId);
    if (!org) {
      return {
        hasOrg: false,
        org: null,
        counts: { partners: 0, briefs: 0, intros: 0, rooms: 0, events: 0 },
        meta: { source: 'enterprise-connect', model: 'overview-v1' },
      };
    }
    const [partners, briefs, intros, rooms, events] = await Promise.all([
      this.repo.listPartners(org.id),
      this.repo.listBriefs(org.id, { limit: 5 }),
      this.repo.listIntros(actorId, 'requester'),
      this.repo.listRooms(org.id),
      this.repo.listEvents(org.id, { limit: 5 }),
    ]);
    return {
      hasOrg: true,
      org,
      counts: {
        partners: partners.length, briefs: briefs.length, intros: intros.length,
        rooms: rooms.length, events: events.length,
      },
      meta: { source: 'enterprise-connect', model: 'overview-v1' },
    };
  }

  // ───── Org profiles ─────────────────────────────────────────────────
  async myOrg(actorId: string) {
    return this.repo.getOrgByOwner(actorId);
  }
  async orgByHandle(handle: string) {
    const org = await this.repo.getOrgByHandle(handle);
    if (!org) throw new NotFoundException({ code: 'org_not_found' });
    return org;
  }
  async createOrg(actorId: string, dto: any, role: string, meta: ReqMeta) {
    const existing = await this.repo.getOrgByOwner(actorId);
    if (existing) throw new ForbiddenException({ code: 'org_exists' });
    const handleTaken = await this.repo.getOrgByHandle(dto.handle);
    if (handleTaken) throw new ForbiddenException({ code: 'handle_taken' });
    const created = await this.repo.createOrg(actorId, dto);
    await this.refreshDirectory(created);
    await this.repo.audit(actorId, role, 'org', created.id, 'create', null, created, meta.ip, meta.userAgent);
    return created;
  }
  async updateOrg(actorId: string, patch: any, role: string, meta: ReqMeta) {
    const before = await this.repo.getOrgByOwner(actorId);
    if (!before) throw new NotFoundException({ code: 'org_not_found' });
    const after = await this.repo.updateOrg(before.id, patch);
    await this.refreshDirectory(after);
    await this.repo.audit(actorId, role, 'org', after.id, 'update', before, after, meta.ip, meta.userAgent);
    return after;
  }
  async transitionOrg(actorId: string, status: string, role: string, meta: ReqMeta) {
    const before = await this.repo.getOrgByOwner(actorId);
    if (!before) throw new NotFoundException({ code: 'org_not_found' });
    const next = this.nextOrgStatus(before.status, status);
    const after = await this.repo.transitionOrg(before.id, next);
    await this.refreshDirectory(after);
    await this.repo.audit(actorId, role, 'org', after.id, 'transition', { status: before.status }, { status: next }, meta.ip, meta.userAgent);
    return after;
  }

  // ───── Directory ────────────────────────────────────────────────────
  async directory(q?: string, region?: string) {
    const rows = await this.repo.searchDirectory(q, region, 60);
    return { items: rows, meta: { source: 'enterprise-connect', model: 'directory-v1', count: rows.length } };
  }
  private async refreshDirectory(org: any) {
    if (!org) return;
    const tags = [
      ...(Array.isArray(org.capabilities) ? org.capabilities : []),
      ...(Array.isArray(org.certifications) ? org.certifications : []),
    ].filter(Boolean);
    const vector = [org.legal_name, org.display_name, org.tagline, org.about, org.industry, org.hq_city, org.hq_country, ...tags].filter(Boolean).join(' ').toLowerCase();
    const region = org.hq_country ?? null;
    const highlights = [org.funding_stage, org.size_band].filter(Boolean);
    await this.repo.upsertDirectory(org.id, vector, tags as string[], region, highlights);
  }

  // ───── Partners (with deterministic match ranker) ───────────────────
  async partners(actorId: string) {
    const org = await this.repo.getOrgByOwner(actorId);
    if (!org) return { items: [], meta: { source: 'enterprise-connect', model: 'partners-v1', count: 0 } };
    const rows = await this.repo.listPartners(org.id);
    return { items: rows, meta: { source: 'enterprise-connect', model: 'partners-v1', count: rows.length } };
  }
  async partnerCandidates(actorId: string) {
    const org = await this.repo.getOrgByOwner(actorId);
    if (!org) throw new NotFoundException({ code: 'org_not_found' });
    const candidates = await this.repo.candidateOrgsForPartner(org.id);
    const myCaps = new Set<string>((org.capabilities ?? []).map((s: string) => s.toLowerCase()));
    const ranked = candidates.map((c: any) => {
      const theirCaps = new Set<string>((c.capabilities ?? []).map((s: string) => String(s).toLowerCase()));
      const intersection = [...myCaps].filter((x) => theirCaps.has(x));
      const union = new Set([...myCaps, ...theirCaps]);
      const jaccard = union.size ? intersection.length / union.size : 0;
      const industryMatch = org.industry && c.industry === org.industry ? 1 : 0;
      const geoMatch = org.hq_country && c.hq_country === org.hq_country ? 1 : 0;
      // Complementary-stage bonus: enterprise + startup is preferred to enterprise + enterprise
      const stageBonus = 0; // future: pull from kind/funding_stage
      const score = Math.round(100 * (0.45 * jaccard + 0.25 * industryMatch + 0.20 * geoMatch + 0.10 * stageBonus));
      return {
        candidate: c,
        score,
        reason: { jaccard, industryMatch, geoMatch, sharedCapabilities: intersection },
      };
    });
    ranked.sort((a, b) => b.score - a.score);
    return {
      items: ranked.slice(0, 50),
      meta: { source: 'enterprise-connect', model: 'ec-partner-match-v1-deterministic', count: ranked.length },
    };
  }
  async createPartner(actorId: string, dto: any, role: string, meta: ReqMeta) {
    const org = await this.repo.getOrgByOwner(actorId);
    if (!org) throw new NotFoundException({ code: 'org_not_found' });
    const ranked = await this.partnerCandidates(actorId);
    const found = (ranked.items as any[]).find((r) => r.candidate.id === dto.orgIdB);
    const score = found?.score ?? 0;
    const reason = found?.reason ?? {};
    const row = await this.repo.createPartner(org.id, dto.orgIdB, dto.relationKind, score, reason);
    await this.repo.audit(actorId, role, 'partner', row.id, 'create', null, row, meta.ip, meta.userAgent);
    return row;
  }

  // ───── Procurement ──────────────────────────────────────────────────
  async briefs(actorId: string, scope: 'mine' | 'open', opts: { status?: string; category?: string }) {
    if (scope === 'mine') {
      const org = await this.repo.getOrgByOwner(actorId);
      if (!org) return { items: [], meta: { count: 0 } };
      const items = await this.repo.listBriefs(org.id, { status: opts.status, category: opts.category, limit: 100 });
      return { items, meta: { count: items.length, source: 'enterprise-connect', scope } };
    }
    const items = await this.repo.listBriefs(null, { status: opts.status ?? 'open', category: opts.category, limit: 100 });
    return { items, meta: { count: items.length, source: 'enterprise-connect', scope } };
  }
  async createBrief(actorId: string, dto: any, role: string, meta: ReqMeta) {
    const org = await this.repo.getOrgByOwner(actorId);
    if (!org || org.id !== dto.buyerOrgId) throw new ForbiddenException({ code: 'not_buyer_owner' });
    const row = await this.repo.createBrief(actorId, dto);
    await this.repo.audit(actorId, role, 'brief', row.id, 'create', null, row, meta.ip, meta.userAgent);
    return row;
  }
  async transitionBrief(actorId: string, id: string, status: string, role: string, meta: ReqMeta) {
    const org = await this.repo.getOrgByOwner(actorId);
    if (!org) throw new ForbiddenException({ code: 'no_org' });
    const before = await this.repo.getBriefById(id);
    if (!before) throw new NotFoundException({ code: 'brief_not_found' });
    if (before.buyer_org_id !== org.id) throw new ForbiddenException({ code: 'not_brief_owner' });
    const next = this.nextBriefStatus(before.status, status);
    const after = await this.repo.transitionBrief(id, next);
    await this.repo.audit(actorId, role, 'brief', id, 'transition', { status: before.status }, { status: next }, meta.ip, meta.userAgent);
    return after;
  }

  // ───── Intros ───────────────────────────────────────────────────────
  async intros(actorId: string, role: 'requester' | 'broker' | 'target') {
    const items = await this.repo.listIntros(actorId, role);
    return { items, meta: { count: items.length, source: 'enterprise-connect', role } };
  }
  async requestIntro(actorId: string, dto: any, role: string, meta: ReqMeta) {
    if (dto.brokerIdentityId === actorId) throw new ForbiddenException({ code: 'broker_self' });
    if (dto.targetIdentityId === actorId) throw new ForbiddenException({ code: 'target_self' });
    const row = await this.repo.createIntro(actorId, dto);
    await this.repo.audit(actorId, role, 'intro', row.id, 'create', null, row, meta.ip, meta.userAgent);
    return row;
  }
  async decideIntro(actorId: string, id: string, body: { decision: string; declineReason?: string }, role: string, meta: ReqMeta) {
    const before = await this.repo.getIntroById(id);
    if (!before) throw new NotFoundException({ code: 'intro_not_found' });
    if (![before.requester_identity_id, before.broker_identity_id, before.target_identity_id].includes(actorId)) {
      throw new ForbiddenException({ code: 'not_intro_participant' });
    }
    const next = this.nextIntroStatus(before.status, body.decision, actorId, before);
    const after = await this.repo.decideIntro(id, next, body.declineReason ?? null);
    await this.repo.audit(actorId, role, 'intro', id, 'transition', { status: before.status }, { status: next }, meta.ip, meta.userAgent);
    return after;
  }

  // ───── Rooms ────────────────────────────────────────────────────────
  async rooms(actorId: string) {
    const org = await this.repo.getOrgByOwner(actorId);
    if (!org) return { items: [], meta: { count: 0 } };
    const items = await this.repo.listRooms(org.id);
    return { items, meta: { count: items.length, source: 'enterprise-connect' } };
  }
  async createRoom(actorId: string, dto: any, role: string, meta: ReqMeta) {
    const org = await this.repo.getOrgByOwner(actorId);
    if (!org || org.id !== dto.ownerOrgId) throw new ForbiddenException({ code: 'not_room_owner' });
    const row = await this.repo.createRoom(actorId, dto);
    await this.repo.audit(actorId, role, 'room', row.id, 'create', null, row, meta.ip, meta.userAgent);
    return row;
  }
  async transitionRoom(actorId: string, id: string, status: string, role: string, meta: ReqMeta) {
    const org = await this.repo.getOrgByOwner(actorId);
    if (!org) throw new ForbiddenException({ code: 'no_org' });
    const before = await this.repo.getRoomById(id);
    if (!before) throw new NotFoundException({ code: 'room_not_found' });
    if (before.owner_org_id !== org.id && before.owner_identity_id !== actorId) throw new ForbiddenException({ code: 'not_room_owner' });
    const next = this.nextRoomStatus(before.status, status);
    const after = await this.repo.transitionRoom(id, next);
    await this.repo.audit(actorId, role, 'room', id, 'transition', { status: before.status }, { status: next }, meta.ip, meta.userAgent);
    return after;
  }

  // ───── Events ───────────────────────────────────────────────────────
  async events(actorId: string, scope: 'mine' | 'public', opts: { status?: string }) {
    if (scope === 'public') {
      const items = await this.repo.listEvents(null, { status: opts.status ?? 'published', limit: 100 });
      return { items, meta: { count: items.length, source: 'enterprise-connect', scope } };
    }
    const org = await this.repo.getOrgByOwner(actorId);
    if (!org) return { items: [], meta: { count: 0 } };
    const items = await this.repo.listEvents(org.id, { status: opts.status, limit: 100 });
    return { items, meta: { count: items.length, source: 'enterprise-connect', scope } };
  }
  async createEvent(actorId: string, dto: any, role: string, meta: ReqMeta) {
    const org = await this.repo.getOrgByOwner(actorId);
    if (!org || org.id !== dto.hostOrgId) throw new ForbiddenException({ code: 'not_event_host' });
    const row = await this.repo.createEvent(actorId, dto);
    await this.repo.audit(actorId, role, 'event', row.id, 'create', null, row, meta.ip, meta.userAgent);
    return row;
  }
  async transitionEvent(actorId: string, id: string, status: string, role: string, meta: ReqMeta) {
    const org = await this.repo.getOrgByOwner(actorId);
    if (!org) throw new ForbiddenException({ code: 'no_org' });
    const before = await this.repo.getEventById(id);
    if (!before) throw new NotFoundException({ code: 'event_not_found' });
    if (before.host_org_id !== org.id && before.owner_identity_id !== actorId) throw new ForbiddenException({ code: 'not_event_host' });
    const next = this.nextEventStatus(before.status, status);
    const after = await this.repo.transitionEvent(id, next);
    await this.repo.audit(actorId, role, 'event', id, 'transition', { status: before.status }, { status: next }, meta.ip, meta.userAgent);
    return after;
  }

  // ───── Startup Showcase ─────────────────────────────────────────────
  async startups(opts: { featured?: boolean }) {
    const items = await this.repo.listStartups({ featured: opts.featured, limit: 60 });
    // Re-rank deterministically by traction + freshness so the showcase has signal
    // even before any model runs. ML may overwrite showcase_rank later.
    const ranked = items.map((s: any) => {
      const tr = s.traction ?? {};
      const mrr = Number(tr.mrrMinor ?? tr.mrr_minor ?? 0);
      const growth = Number(tr.growthMoM ?? tr.growth_mom ?? 0);
      const customers = Number(tr.customers ?? 0);
      const recencyDays = Math.max(1, (Date.now() - new Date(s.updated_at).getTime()) / 86_400_000);
      const score = Math.round(
        100 * (0.45 * Math.tanh(mrr / 500_000_00) + 0.30 * Math.tanh(growth) +
               0.15 * Math.tanh(customers / 1000) + 0.10 * Math.exp(-recencyDays / 30)),
      );
      return { ...s, computed_rank: Math.max(s.showcase_rank ?? 0, score) };
    });
    ranked.sort((a, b) => Number(b.featured) - Number(a.featured) || b.computed_rank - a.computed_rank);
    return { items: ranked, meta: { source: 'enterprise-connect', model: 'startup-rank-v1-deterministic', count: ranked.length } };
  }
  async startup(id: string) {
    const row = await this.repo.getStartup(id);
    if (!row) throw new NotFoundException({ code: 'startup_not_found' });
    return row;
  }
  async upsertStartup(actorId: string, dto: any, role: string, meta: ReqMeta) {
    const org = await this.repo.getOrgByOwner(actorId);
    if (!org || org.id !== dto.orgId) throw new ForbiddenException({ code: 'not_startup_owner' });
    const row = await this.repo.upsertStartup(dto);
    await this.repo.audit(actorId, role, 'startup', row.id, 'upsert', null, row, meta.ip, meta.userAgent);
    return row;
  }

  // ───── State machine helpers ────────────────────────────────────────
  private nextOrgStatus(curr: string, want: string) {
    const allowed: Record<string, string[]> = {
      draft: ['active', 'archived'],
      active: ['paused', 'archived'],
      paused: ['active', 'archived'],
      archived: ['active'],
    };
    if (!allowed[curr]?.includes(want)) {
      throw new ForbiddenException({ code: 'bad_transition', from: curr, to: want });
    }
    return want;
  }
  private nextBriefStatus(curr: string, want: string) {
    const allowed: Record<string, string[]> = {
      draft: ['open', 'archived'],
      open: ['shortlisting', 'closed', 'archived'],
      shortlisting: ['awarded', 'closed', 'archived'],
      awarded: ['closed', 'archived'],
      closed: ['archived'],
      archived: [],
    };
    if (!allowed[curr]?.includes(want)) {
      throw new ForbiddenException({ code: 'bad_transition', from: curr, to: want });
    }
    return want;
  }
  private nextIntroStatus(curr: string, want: string, actorId: string, intro: any) {
    const allowed: Record<string, string[]> = {
      pending: ['accepted', 'declined', 'cancelled'],
      accepted: ['completed', 'cancelled'],
      declined: [],
      expired: [],
      completed: [],
      cancelled: [],
    };
    if (!allowed[curr]?.includes(want)) throw new ForbiddenException({ code: 'bad_transition', from: curr, to: want });
    if ((want === 'accepted' || want === 'declined') && actorId !== intro.broker_identity_id && actorId !== intro.target_identity_id) {
      throw new ForbiddenException({ code: 'not_intro_decider' });
    }
    if ((want === 'completed' || want === 'cancelled') && ![intro.requester_identity_id, intro.broker_identity_id, intro.target_identity_id].includes(actorId)) {
      throw new ForbiddenException({ code: 'not_intro_participant' });
    }
    return want;
  }
  private nextRoomStatus(curr: string, want: string) {
    const allowed: Record<string, string[]> = {
      draft: ['scheduled', 'archived'],
      scheduled: ['live', 'ended', 'archived'],
      live: ['ended', 'archived'],
      ended: ['archived'],
      archived: [],
    };
    if (!allowed[curr]?.includes(want)) throw new ForbiddenException({ code: 'bad_transition', from: curr, to: want });
    return want;
  }
  private nextEventStatus(curr: string, want: string) {
    const allowed: Record<string, string[]> = {
      draft: ['published', 'cancelled'],
      published: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };
    if (!allowed[curr]?.includes(want)) throw new ForbiddenException({ code: 'bad_transition', from: curr, to: want });
    return want;
  }
}
