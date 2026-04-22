import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProfilesRepository } from './profiles.repository';
import { AuditService } from '../workspace/audit.service';
import { D5Emit } from '../domain-bus/domain-emissions';

export interface PageEnvelope<T> { items: T[]; total: number; limit: number; hasMore: boolean; }
function envelope<T>(items: T[], limit?: number): PageEnvelope<T> {
  const lim = limit ?? items.length;
  return { items, total: items.length, limit: lim, hasMore: limit != null && items.length >= lim };
}

/**
 * Reputation scoring (deterministic fallback when ML/analytics is offline).
 * components: reviews(0..5), completion(0..1), verifications(count), activity(0..1), endorsements(count)
 *   score = 30*reviews/5 + 20*completion + min(verifications,5)*4 + 15*activity + min(endorsements,100)*0.15
 *   bands: 0-29 new, 30-59 rising, 60-79 trusted, 80-100 top
 */
function scoreFromComponents(c: any): { score: number; band: 'new'|'rising'|'trusted'|'top' } {
  const reviews = Number(c.reviews ?? 0);
  const completion = Number(c.completion ?? 0);
  const verifications = Number(c.verifications ?? 0);
  const activity = Number(c.activity ?? 0);
  const endorsements = Number(c.endorsements ?? 0);
  const raw = (30 * reviews) / 5 + 20 * completion + Math.min(verifications, 5) * 4 + 15 * activity + Math.min(endorsements, 100) * 0.15;
  const score = Math.max(0, Math.min(100, Math.round(raw * 10) / 10));
  const band = score >= 80 ? 'top' : score >= 60 ? 'trusted' : score >= 30 ? 'rising' : 'new';
  return { score, band };
}

@Injectable()
export class ProfilesService {
  constructor(
    private readonly repo: ProfilesRepository,
    private readonly audit: AuditService,
  ) {}

  async getFullProfile(identityId: string, viewerId: string | null) {
    const p = await this.repo.getProfile(identityId);
    if (!p) throw new NotFoundException('Profile not found');
    if (p.visibility === 'private' && viewerId !== identityId) throw new ForbiddenException('Profile is private');
    const [skills, experience, education, portfolio, reviews, badges, verifications, reputation] = await Promise.all([
      this.repo.listSkills(identityId),
      this.repo.listExperience(identityId),
      this.repo.listEducation(identityId),
      this.repo.listPortfolio(identityId),
      this.repo.listReviews(identityId),
      this.repo.listBadges(identityId),
      this.repo.listVerifications(identityId),
      this.repo.getReputation(identityId),
    ]);
    if (viewerId && viewerId !== identityId) await this.repo.logView(identityId, viewerId, 'direct');
    return {
      profile: p,
      tabs: {
        overview: { headline: p.headline, summary: p.summary },
        activity: [],                          // sourced from feed module
        services: [],                          // sourced from services module
        gigs: [],                              // sourced from gigs module
        projects: [],                          // sourced from projects module
        reviews,
        media: portfolio,
        experience,
        education,
        skills,
        endorsements: skills.flatMap((s: any) => Array.from(s.endorsers ?? []).map((e: any) => ({ skillId: s.id, endorserId: e }))),
      },
      badges,
      verifications,
      reputation,
    };
  }

  async upsertProfile(identityId: string, patch: any) {
    const existing = await this.repo.getProfile(identityId);
    const updated = await this.repo.upsertProfile(identityId, patch);
    await this.audit.record({
      actorId: identityId, domain: 'profiles', action: 'profile.upsert',
      targetType: 'profile', targetId: identityId,
      meta: { fields: Object.keys(patch ?? {}) },
    });
    if (!existing) D5Emit.created('tenant-demo', identityId, { identityId, fields: Object.keys(patch ?? {}) });
    else D5Emit.updated('tenant-demo', identityId, { identityId, fields: Object.keys(patch ?? {}) });
    if (patch?.visibility === 'public' || patch?.published === true) {
      D5Emit.published('tenant-demo', identityId, { identityId, headline: updated?.headline });
    }
    if (patch?.archived === true) {
      D5Emit.archived('tenant-demo', identityId, { identityId });
    }
    return updated;
  }

  // Skills + endorsements
  async listSkills(identityId: string) { return envelope(await this.repo.listSkills(identityId)); }
  async addSkill(identityId: string, body: any) {
    const r = await this.repo.addSkill(identityId, body);
    await this.audit.record({ actorId: identityId, domain: 'profiles', action: 'profile.skill.add', targetType: 'profile', targetId: identityId, meta: { skill: body.skill } });
    return r;
  }
  async removeSkill(identityId: string, skillId: string) {
    const r = await this.repo.removeSkill(identityId, skillId);
    await this.audit.record({ actorId: identityId, domain: 'profiles', action: 'profile.skill.remove', targetType: 'skill', targetId: skillId });
    return r;
  }
  async endorseSkill(identityId: string, skillId: string, endorserId: string) {
    if (endorserId === identityId) throw new ForbiddenException('Cannot endorse your own skill');
    const r = await this.repo.endorseSkill(identityId, skillId, endorserId);
    await this.audit.record({ actorId: endorserId, domain: 'profiles', action: 'profile.skill.endorse', targetType: 'skill', targetId: skillId, meta: { subjectId: identityId } });
    return r;
  }

  // Experience
  async listExperience(id: string) { return envelope(await this.repo.listExperience(id)); }
  async addExperience(id: string, body: any) {
    const r = await this.repo.addExperience(id, body);
    await this.audit.record({ actorId: id, domain: 'profiles', action: 'profile.experience.add', targetType: 'profile', targetId: id, meta: { title: body.title, company: body.company } });
    return r;
  }
  async removeExperience(id: string, expId: string) {
    const r = await this.repo.removeExperience(id, expId);
    await this.audit.record({ actorId: id, domain: 'profiles', action: 'profile.experience.remove', targetType: 'experience', targetId: expId });
    return r;
  }

  // Education
  async listEducation(id: string) { return envelope(await this.repo.listEducation(id)); }
  async addEducation(id: string, body: any) {
    const r = await this.repo.addEducation(id, body);
    await this.audit.record({ actorId: id, domain: 'profiles', action: 'profile.education.add', targetType: 'profile', targetId: id, meta: { institution: body.institution } });
    return r;
  }

  // Portfolio
  async listPortfolio(id: string) { return envelope(await this.repo.listPortfolio(id)); }
  async addPortfolio(id: string, body: any) {
    const r = await this.repo.addPortfolio(id, body);
    await this.audit.record({ actorId: id, domain: 'profiles', action: 'profile.portfolio.add', targetType: 'profile', targetId: id, meta: { title: body.title } });
    return r;
  }
  async updatePortfolio(id: string, itemId: string, body: any) {
    const r = await this.repo.updatePortfolio(id, itemId, body);
    await this.audit.record({ actorId: id, domain: 'profiles', action: 'profile.portfolio.update', targetType: 'portfolio', targetId: itemId, meta: { fields: Object.keys(body ?? {}) } });
    return r;
  }
  async removePortfolio(id: string, itemId: string) {
    const r = await this.repo.removePortfolio(id, itemId);
    await this.audit.record({ actorId: id, domain: 'profiles', action: 'profile.portfolio.remove', targetType: 'portfolio', targetId: itemId });
    return r;
  }

  // Reviews
  async listReviews(subjectId: string) { return envelope(await this.repo.listReviews(subjectId)); }
  async addReview(reviewerId: string, body: any) {
    if (reviewerId === body.subjectId) throw new ForbiddenException('Cannot self-review');
    const review = await this.repo.addReview(body.subjectId, { ...body, reviewerId });
    await this.audit.record({ actorId: reviewerId, domain: 'profiles', action: 'profile.review.add', targetType: 'profile', targetId: body.subjectId, meta: { rating: body.rating, context: body.context } });
    await this.recomputeReputation(body.subjectId);
    return review;
  }

  // Verifications
  async listVerifications(id: string) { return envelope(await this.repo.listVerifications(id)); }
  async requestVerification(id: string, body: any) {
    const r = await this.repo.requestVerification(id, body.kind, body.evidenceUrl);
    await this.audit.record({ actorId: id, domain: 'profiles', action: 'profile.verification.request', targetType: 'verification', targetId: r?.id, meta: { kind: body.kind } });
    return r;
  }
  async approveVerification(id: string, kind: string, reviewerId: string) {
    const v = await this.repo.setVerificationStatus(id, kind, 'active', reviewerId);
    if (v && kind === 'id_document') await this.repo.awardBadge(id, 'verified', 'ID Verified');
    await this.audit.record({ actorId: reviewerId, domain: 'profiles', action: 'profile.verification.approve', targetType: 'verification', targetId: v?.id, meta: { subjectId: id, kind } });
    await this.recomputeReputation(id);
    return v;
  }
  async rejectVerification(id: string, kind: string, reviewerId: string, notes?: string) {
    const v = await this.repo.setVerificationStatus(id, kind, 'failed', reviewerId, notes);
    await this.audit.record({ actorId: reviewerId, domain: 'profiles', action: 'profile.verification.reject', targetType: 'verification', targetId: v?.id, meta: { subjectId: id, kind, notes } });
    return v;
  }

  // Badges
  async listBadges(id: string) { return envelope(await this.repo.listBadges(id)); }
  async awardBadge(id: string, code: string, label: string) {
    const r = await this.repo.awardBadge(id, code, label);
    await this.audit.record({ actorId: id, domain: 'profiles', action: 'profile.badge.award', targetType: 'profile', targetId: id, meta: { code, label } });
    return r;
  }

  // Reputation (recomputes deterministically from on-platform signals)
  async recomputeReputation(identityId: string) {
    const [reviews, verifications, skills, portfolio] = await Promise.all([
      this.repo.listReviews(identityId),
      this.repo.listVerifications(identityId),
      this.repo.listSkills(identityId),
      this.repo.listPortfolio(identityId),
    ]);
    const avg = reviews.length ? reviews.reduce((a: number, r: any) => a + r.rating, 0) / reviews.length : 0;
    const activeVerif = verifications.filter((v: any) => v.status === 'active').length;
    const endorsementsTotal = skills.reduce((a: number, s: any) => a + (s.endorsementCount ?? 0), 0);
    const components = {
      reviews: avg,
      completion: portfolio.length > 0 ? 0.9 : 0.4,
      verifications: activeVerif,
      activity: Math.min(1, portfolio.length / 6),
      endorsements: endorsementsTotal,
    };
    const { score, band } = scoreFromComponents(components);
    const next = await this.repo.setReputation(identityId, { score, band, components });
    if (band === 'top') await this.repo.awardBadge(identityId, 'top_rated', 'Top Rated');
    return next;
  }

  getReputation(id: string) { return this.repo.getReputation(id); }
  async listViews(id: string) { return envelope(await this.repo.listViews(id)); }
  async listAudit(id: string) { return envelope(await this.repo.listAudit(id)); }
}
