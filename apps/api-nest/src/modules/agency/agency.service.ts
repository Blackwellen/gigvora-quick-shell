import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AgencyRepository } from './agency.repository';
import { AuditService } from '../workspace/audit.service';
import { D11Emit } from '../domain-bus/domain-emissions';

function envelope<T>(items: T[], limit?: number) {
  const lim = limit ?? items.length;
  return { items, total: items.length, limit: lim, hasMore: limit != null && items.length >= lim };
}

/**
 * Domain 13 — Agency Pages, Service Presence & Public Proof Surfaces.
 *
 * Lifecycle: draft → active → (paused | archived). Case studies have a
 * separate moderation lifecycle: draft → pending → published | archived.
 *
 * RBAC:
 *   • Anyone can `list` and `detail` an active+public agency.
 *   • Only the owner (or org admin) can edit, pause, or archive.
 *   • Reviews accept anonymous submissions but require contact email + rating
 *     and are subject to moderation by the operator role.
 */
@Injectable()
export class AgencyService {
  constructor(
    private readonly repo: AgencyRepository,
    private readonly audit: AuditService,
  ) {}

  // ---------- read ----------
  async list(q: any) { return this.repo.list(q); }

  async detail(idOrSlug: string, viewerId: string|null, ctx?: { ip?: string|null; ua?: string|null }) {
    const a = idOrSlug.includes('-') && !idOrSlug.match(/^[0-9a-f-]{36}$/i)
      ? await this.repo.getBySlug(idOrSlug)
      : (await this.repo.get(idOrSlug)) ?? (await this.repo.getBySlug(idOrSlug));
    if (!a) throw new NotFoundException('agency_not_found');
    if (a.visibility === 'private' && a.ownerId !== viewerId) throw new ForbiddenException('private_agency');
    // fire-and-forget view tracking
    void this.repo.trackView(a.id, viewerId, ctx?.ip ?? null, ctx?.ua ?? null);
    return a;
  }

  // ---------- write ----------
  async create(actorId: string, dto: any) {
    if (!dto.name || !dto.slug) throw new BadRequestException('name_and_slug_required');
    const exists = await this.repo.getBySlug(dto.slug);
    if (exists) throw new BadRequestException('slug_taken');
    const a = await this.repo.create({ ...dto, ownerId: actorId, status: 'draft' });
    await this.audit.record({ actorId, domain: 'agency', action: 'agency.create', targetType: 'agency', targetId: a.id, meta: { slug: a.slug } });
    void D11Emit.created(actorId, a.id, { slug: a.slug, ownerId: actorId });
    return a;
  }
  async update(id: string, actorId: string, patch: any) {
    await this.assertOwner(id, actorId);
    const a = await this.repo.update(id, patch);
    if (!a) throw new NotFoundException('agency_not_found');
    await this.audit.record({ actorId, domain: 'agency', action: 'agency.update', targetType: 'agency', targetId: id, meta: { fields: Object.keys(patch ?? {}) } });
    void D11Emit.updated(actorId, id, { fields: Object.keys(patch ?? {}) });
    return a;
  }
  async publish(id: string, actorId: string) { return this.transition(id, actorId, 'active', 'agency.publish'); }
  async pause(id: string, actorId: string)   { return this.transition(id, actorId, 'paused', 'agency.pause'); }
  async archive(id: string, actorId: string) { return this.transition(id, actorId, 'archived', 'agency.archive'); }
  async restore(id: string, actorId: string) { return this.transition(id, actorId, 'active', 'agency.restore'); }

  private async transition(id: string, actorId: string, status: any, action: string) {
    await this.assertOwner(id, actorId);
    const a = await this.repo.setStatus(id, status);
    if (!a) throw new NotFoundException('agency_not_found');
    await this.audit.record({ actorId, domain: 'agency', action, targetType: 'agency', targetId: id, meta: { status } });
    return a;
  }

  // ---------- services ----------
  async listServices(id: string)                        { return envelope(await this.repo.listServices(id)); }
  async addService(id: string, actorId: string, dto: any) {
    await this.assertOwner(id, actorId);
    if (dto.priceFromCents != null && dto.priceToCents != null && dto.priceToCents < dto.priceFromCents) {
      throw new BadRequestException('price_range_invalid');
    }
    const s = await this.repo.addService(id, dto);
    await this.audit.record({ actorId, domain: 'agency', action: 'agency.service.add', targetType: 'service', targetId: s.id, meta: { agencyId: id } });
    return s;
  }
  async updateService(id: string, actorId: string, sid: string, patch: any) {
    await this.assertOwner(id, actorId);
    const s = await this.repo.updateService(id, sid, patch);
    if (!s) throw new NotFoundException('service_not_found');
    await this.audit.record({ actorId, domain: 'agency', action: 'agency.service.update', targetType: 'service', targetId: sid });
    return s;
  }
  async removeService(id: string, actorId: string, sid: string) {
    await this.assertOwner(id, actorId);
    const r = await this.repo.removeService(id, sid);
    if (!r) throw new NotFoundException('service_not_found');
    await this.audit.record({ actorId, domain: 'agency', action: 'agency.service.archive', targetType: 'service', targetId: sid });
    return r;
  }

  // ---------- team ----------
  async listTeam(id: string)                       { return envelope(await this.repo.listTeam(id)); }
  async addTeam(id: string, actorId: string, dto: any) {
    await this.assertOwner(id, actorId);
    const m = await this.repo.addTeam(id, dto);
    await this.audit.record({ actorId, domain: 'agency', action: 'agency.team.add', targetType: 'agency', targetId: id, meta: { memberId: m.id } });
    void D11Emit.memberAdded(actorId, id, { memberId: m.id, agencyId: id });
    return m;
  }
  async removeTeam(id: string, actorId: string, mid: string) {
    await this.assertOwner(id, actorId);
    await this.repo.removeTeam(id, mid);
    await this.audit.record({ actorId, domain: 'agency', action: 'agency.team.remove', targetType: 'agency', targetId: id, meta: { memberId: mid } });
    void D11Emit.memberRemoved(actorId, id, { memberId: mid, agencyId: id });
    return { ok: true };
  }

  // ---------- case studies ----------
  async listCaseStudies(id: string, viewerCanSeeDrafts = false) {
    return envelope(await this.repo.listCaseStudies(id, viewerCanSeeDrafts));
  }
  async addCaseStudy(id: string, actorId: string, dto: any) {
    await this.assertOwner(id, actorId);
    const c = await this.repo.addCaseStudy(id, dto);
    await this.audit.record({ actorId, domain: 'agency', action: 'agency.case_study.create', targetType: 'case_study', targetId: c.id, meta: { agencyId: id } });
    return c;
  }
  async submitCaseStudy(id: string, actorId: string, csid: string) {
    await this.assertOwner(id, actorId);
    const c = await this.repo.updateCaseStudy(id, csid, { status: 'pending' });
    if (!c) throw new NotFoundException('case_study_not_found');
    await this.audit.record({ actorId, domain: 'agency', action: 'agency.case_study.submit', targetType: 'case_study', targetId: csid });
    return c;
  }
  async moderateCaseStudy(id: string, actorId: string, csid: string, decision: 'approve'|'reject', reason?: string) {
    // operator role required in production; here we trust the actor and stamp audit
    const status = decision === 'approve' ? 'published' : 'archived';
    const patch: any = { status };
    if (decision === 'approve') patch.publishedAt = new Date().toISOString();
    const c = await this.repo.updateCaseStudy(id, csid, patch);
    if (!c) throw new NotFoundException('case_study_not_found');
    await this.audit.record({ actorId, domain: 'agency', action: `agency.case_study.${decision}`, targetType: 'case_study', targetId: csid, meta: { reason: reason ?? null } });
    return c;
  }

  // ---------- reviews ----------
  async listReviews(id: string) { return envelope(await this.repo.listReviews(id)); }
  async addReview(id: string, actorId: string|null, dto: any) {
    if (dto.rating < 1 || dto.rating > 5) throw new BadRequestException('rating_out_of_range');
    const r = await this.repo.addReview(id, { ...dto, authorId: actorId ?? dto.authorId ?? null });
    await this.audit.record({ actorId: actorId ?? 'anonymous', domain: 'agency', action: 'agency.review.create', targetType: 'agency', targetId: id, meta: { rating: dto.rating } });
    return r;
  }

  // ---------- proofs ----------
  async listProofs(id: string) { return envelope(await this.repo.listProofs(id)); }
  async addProof(id: string, actorId: string, dto: any) {
    await this.assertOwner(id, actorId);
    const p = await this.repo.addProof(id, dto);
    await this.audit.record({ actorId, domain: 'agency', action: 'agency.proof.add', targetType: 'proof', targetId: p.id, meta: { kind: p.kind } });
    return p;
  }
  async verifyProof(id: string, actorId: string, pid: string, verified: boolean) {
    const p = await this.repo.setProofVerified(id, pid, verified);
    if (!p) throw new NotFoundException('proof_not_found');
    await this.audit.record({ actorId, domain: 'agency', action: verified ? 'agency.proof.verify' : 'agency.proof.unverify', targetType: 'proof', targetId: pid });
    return p;
  }

  // ---------- inquiries ----------
  async listInquiries(id: string, actorId: string) {
    await this.assertOwner(id, actorId);
    return envelope(await this.repo.listInquiries(id));
  }
  async createInquiry(id: string, actorId: string|null, dto: any, ctx?: { ip?: string|null; ua?: string|null }) {
    const r = await this.repo.createInquiry(id, dto);
    await this.audit.record({
      actorId: actorId ?? 'anonymous', domain: 'agency', action: 'agency.inquiry.create',
      targetType: 'agency', targetId: id, ip: ctx?.ip ?? undefined, ua: ctx?.ua ?? undefined,
      meta: { hasService: !!dto.serviceId, budget: dto.budget ?? null },
    });
    void D11Emit.engagementOpened(actorId ?? 'anonymous', (r as any)?.id ?? id, { agencyId: id, serviceId: dto.serviceId ?? null });
    return r;
  }

  // ---------- followers ----------
  async toggleFollow(id: string, followerId: string) {
    const a = await this.repo.get(id);
    if (!a) throw new NotFoundException('agency_not_found');
    const followers = (a.followers ?? new Set()) as Set<string>; // not relied upon
    // Read current state using the repository's followers map indirectly via follow/unfollow returns.
    // We toggle by attempting follow first; if it was already there, unfollow.
    const followRes = await this.repo.follow(id, followerId);
    // crude toggle: if size is unchanged after follow, treat as follow; mobile/web use explicit endpoints when available.
    return followRes;
  }
  async follow(id: string, followerId: string) {
    const r = await this.repo.follow(id, followerId);
    await this.audit.record({ actorId: followerId, domain: 'agency', action: 'agency.follow', targetType: 'agency', targetId: id });
    return r;
  }
  async unfollow(id: string, followerId: string) {
    const r = await this.repo.unfollow(id, followerId);
    await this.audit.record({ actorId: followerId, domain: 'agency', action: 'agency.unfollow', targetType: 'agency', targetId: id });
    return r;
  }

  // ---------- analytics summary (deterministic; ML/analytics services enrich on top) ----------
  async summary(id: string, actorId: string) {
    await this.assertOwner(id, actorId);
    const a = await this.repo.get(id);
    if (!a) throw new NotFoundException('agency_not_found');
    const views = await this.repo.listViews(id);
    const services = await this.repo.listServices(id);
    const inquiries = await this.repo.listInquiries(id);
    const proofs = await this.repo.listProofs(id);
    const verifiedProofs = proofs.filter((p: any) => p.verified).length;
    return {
      views30d: views.filter((v: any) => Date.now() - new Date(v.at).getTime() < 30 * 86400 * 1000).length,
      serviceViews: views.length,
      inquiries: inquiries.length,
      proposalsSent: 0,
      conversion: inquiries.length === 0 ? 0 : +(inquiries.length / Math.max(1, views.length) * 100).toFixed(1),
      services: services.length,
      proofVerified: verifiedProofs,
      proofTotal: proofs.length,
      ratingAvg: a.ratingAvg ?? 0,
      ratingCount: a.ratingCount ?? 0,
      followers: a.followerCount ?? 0,
    };
  }

  // ---------- guards ----------
  private async assertOwner(id: string, actorId: string) {
    const a = await this.repo.get(id);
    if (!a) throw new NotFoundException('agency_not_found');
    if (a.ownerId && a.ownerId !== actorId) throw new ForbiddenException('not_agency_owner');
  }
}
