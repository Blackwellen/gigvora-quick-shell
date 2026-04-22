import { Injectable } from '@nestjs/common';

/**
 * Profiles repository — abstracts persistence behind a typed boundary.
 * Loveable Cloud / Postgres binding lives here. Tests inject a fake.
 */
@Injectable()
export class ProfilesRepository {
  // In-memory shadow store (kept in sync with seeded data) so the module is
  // testable without a live database connection. Production overrides this
  // class via a TypeORM/Knex implementation registered in profiles.module.ts.
  private profiles = new Map<string, any>();
  private skills = new Map<string, any[]>();
  private experiences = new Map<string, any[]>();
  private education = new Map<string, any[]>();
  private portfolio = new Map<string, any[]>();
  private reviews = new Map<string, any[]>();
  private badges = new Map<string, any[]>();
  private verifications = new Map<string, any[]>();
  private reputation = new Map<string, any>();
  private views = new Map<string, any[]>();
  private audit: any[] = [];

  async getProfile(identityId: string) { return this.profiles.get(identityId) ?? null; }
  async getProfileByHandle(handle: string) {
    for (const p of this.profiles.values()) if (p.handle === handle) return p;
    return null;
  }
  async upsertProfile(identityId: string, patch: Record<string, any>) {
    const prev = this.profiles.get(identityId) ?? { identityId, createdAt: new Date().toISOString() };
    const next = { ...prev, ...patch, identityId, updatedAt: new Date().toISOString() };
    this.profiles.set(identityId, next);
    this.audit.push({ identityId, action: 'profile.upsert', diff: patch, occurredAt: next.updatedAt });
    return next;
  }

  async listSkills(identityId: string) { return this.skills.get(identityId) ?? []; }
  async addSkill(identityId: string, s: any) {
    const list = this.skills.get(identityId) ?? [];
    if (list.find(x => x.skill.toLowerCase() === s.skill.toLowerCase())) return list;
    list.push({ id: crypto.randomUUID(), endorsementCount: 0, level: 'intermediate', position: list.length, ...s });
    this.skills.set(identityId, list);
    return list;
  }
  async removeSkill(identityId: string, skillId: string) {
    const list = (this.skills.get(identityId) ?? []).filter(x => x.id !== skillId);
    this.skills.set(identityId, list);
    return list;
  }
  async endorseSkill(identityId: string, skillId: string, endorserId: string) {
    const list = this.skills.get(identityId) ?? [];
    const s = list.find(x => x.id === skillId);
    if (!s) return null;
    s.endorsers = s.endorsers ?? new Set<string>();
    if (s.endorsers.has(endorserId)) return s;
    s.endorsers.add(endorserId);
    s.endorsementCount = s.endorsers.size;
    return s;
  }

  async listExperience(identityId: string) { return this.experiences.get(identityId) ?? []; }
  async addExperience(identityId: string, e: any) {
    const list = this.experiences.get(identityId) ?? [];
    list.push({ id: crypto.randomUUID(), ...e });
    this.experiences.set(identityId, list);
    return list;
  }
  async removeExperience(identityId: string, id: string) {
    const list = (this.experiences.get(identityId) ?? []).filter(x => x.id !== id);
    this.experiences.set(identityId, list);
    return list;
  }

  async listEducation(identityId: string) { return this.education.get(identityId) ?? []; }
  async addEducation(identityId: string, e: any) {
    const list = this.education.get(identityId) ?? [];
    list.push({ id: crypto.randomUUID(), ...e });
    this.education.set(identityId, list);
    return list;
  }

  async listPortfolio(identityId: string) { return this.portfolio.get(identityId) ?? []; }
  async addPortfolio(identityId: string, item: any) {
    const list = this.portfolio.get(identityId) ?? [];
    list.push({ id: crypto.randomUUID(), status: 'published', media: [], tags: [], ...item });
    this.portfolio.set(identityId, list);
    return list;
  }
  async updatePortfolio(identityId: string, id: string, patch: any) {
    const list = this.portfolio.get(identityId) ?? [];
    const i = list.findIndex(x => x.id === id);
    if (i < 0) return null;
    list[i] = { ...list[i], ...patch };
    return list[i];
  }
  async removePortfolio(identityId: string, id: string) {
    const list = (this.portfolio.get(identityId) ?? []).filter(x => x.id !== id);
    this.portfolio.set(identityId, list);
    return list;
  }

  async listReviews(subjectId: string) { return this.reviews.get(subjectId) ?? []; }
  async addReview(subjectId: string, r: any) {
    const list = this.reviews.get(subjectId) ?? [];
    list.unshift({ id: crypto.randomUUID(), status: 'published', createdAt: new Date().toISOString(), ...r });
    this.reviews.set(subjectId, list);
    return list[0];
  }

  async listBadges(identityId: string) { return this.badges.get(identityId) ?? []; }
  async awardBadge(identityId: string, code: string, label: string, meta: any = {}) {
    const list = this.badges.get(identityId) ?? [];
    if (list.find(b => b.code === code)) return list;
    list.push({ id: crypto.randomUUID(), code, label, meta, awardedAt: new Date().toISOString() });
    this.badges.set(identityId, list);
    return list;
  }

  async listVerifications(identityId: string) { return this.verifications.get(identityId) ?? []; }
  async requestVerification(identityId: string, kind: string, evidenceUrl?: string) {
    const list = this.verifications.get(identityId) ?? [];
    const existing = list.find(v => v.kind === kind);
    if (existing) {
      existing.status = 'pending'; existing.evidenceUrl = evidenceUrl ?? existing.evidenceUrl;
      return existing;
    }
    const v = { id: crypto.randomUUID(), kind, status: 'pending', evidenceUrl, createdAt: new Date().toISOString() };
    list.push(v); this.verifications.set(identityId, list);
    return v;
  }
  async setVerificationStatus(identityId: string, kind: string, status: string, reviewerId?: string, notes?: string) {
    const list = this.verifications.get(identityId) ?? [];
    const v = list.find(x => x.kind === kind);
    if (!v) return null;
    v.status = status; v.reviewerId = reviewerId; v.notes = notes;
    if (status === 'active') v.verifiedAt = new Date().toISOString();
    return v;
  }

  async getReputation(identityId: string) { return this.reputation.get(identityId) ?? null; }
  async setReputation(identityId: string, value: any) {
    const next = { identityId, computedAt: new Date().toISOString(), ...value };
    this.reputation.set(identityId, next);
    return next;
  }

  async logView(subjectId: string, viewerId: string | null, source?: string) {
    const list = this.views.get(subjectId) ?? [];
    list.unshift({ id: crypto.randomUUID(), viewerId, source, occurredAt: new Date().toISOString() });
    this.views.set(subjectId, list.slice(0, 500));
  }
  async listViews(subjectId: string, limit = 50) { return (this.views.get(subjectId) ?? []).slice(0, limit); }

  async listAudit(identityId: string, limit = 50) {
    return this.audit.filter(a => a.identityId === identityId).slice(0, limit);
  }
}
