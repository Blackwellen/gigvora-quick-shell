import { Injectable } from '@nestjs/common';

/**
 * Domain 16 — Ratings, Reviews, Trust Badges & Social Proof Systems.
 *
 * In-memory repository following the established Gigvora pattern (see
 * AgencyRepository, CompaniesRepository). Method shape is the contract a
 * Drizzle/Postgres-backed implementation must satisfy when wired in via the
 * `TRUST_REPO` provider; keep signatures stable. Tests can swap a stub.
 *
 * The state machine for reviews is:
 *   draft → pending → (published | rejected | disputed) → archived
 *
 * Trust score is recomputed lazily on read so the repo stays free of
 * background-job coupling at this layer.
 */
type Review = {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatarKey?: string;
  authorRole?: string;
  subjectKind: string;
  subjectId: string;
  rating: number;
  title: string;
  body: string;
  pros: string[];
  cons: string[];
  projectRef?: string;
  status: 'draft' | 'pending' | 'published' | 'disputed' | 'rejected' | 'archived';
  helpful: number;
  unhelpful: number;
  responseBody?: string;
  responseAt?: string;
  disputeReason?: string;
  disputedAt?: string;
  moderationNotes?: string;
  contactEmail?: string;
  createdAt: string;
  updatedAt: string;
};

type Reference = {
  id: string;
  requesterId: string;
  refereeName: string;
  refereeEmail: string;
  refereeRole?: string;
  relationship?: string;
  message?: string;
  body?: string;
  rating?: number;
  status: 'pending' | 'verified' | 'expired' | 'declined';
  token: string;
  createdAt: string;
  verifiedAt?: string;
};

type Verification = {
  id: string;
  identityId: string;
  kind: string;
  status: 'not_started' | 'pending' | 'verified' | 'failed';
  evidence?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type Badge = {
  id: string;
  subjectKind: string;
  subjectId: string;
  badge: string;
  reason?: string;
  awardedAt: string;
  awardedBy: string;
};

type HelpfulVote = { reviewId: string; voterId: string; helpful: boolean };

@Injectable()
export class TrustRepository {
  private reviews = new Map<string, Review>();
  private references = new Map<string, Reference>();
  private verifications = new Map<string, Verification>();
  private badges = new Map<string, Badge>();
  private votes = new Map<string, HelpfulVote>(); // key = reviewId|voterId

  // ---------- reviews ----------
  async listReviews(q: {
    subjectKind?: string; subjectId?: string; authorId?: string;
    direction?: 'received' | 'given'; status?: string; minRating?: number;
    q?: string; page: number; pageSize: number; sort: string; viewerId?: string | null;
  }) {
    let arr = Array.from(this.reviews.values());
    // The "given" direction filter uses the viewer as the implicit subject
    // boundary so unauth callers can't pivot it into a search vector.
    if (q.direction === 'given' && q.authorId) arr = arr.filter(r => r.authorId === q.authorId);
    if (q.direction === 'received' && q.subjectId) arr = arr.filter(r => r.subjectId === q.subjectId);
    if (q.subjectKind) arr = arr.filter(r => r.subjectKind === q.subjectKind);
    if (q.subjectId) arr = arr.filter(r => r.subjectId === q.subjectId);
    if (q.authorId) arr = arr.filter(r => r.authorId === q.authorId);
    if (q.status) arr = arr.filter(r => r.status === q.status);
    if (q.minRating) arr = arr.filter(r => r.rating >= q.minRating!);
    if (q.q) {
      const n = q.q.toLowerCase();
      arr = arr.filter(r => r.title.toLowerCase().includes(n) || r.body.toLowerCase().includes(n));
    }
    // Hide non-published unless the viewer authored it or owns the subject.
    arr = arr.filter(r => r.status === 'published' || r.status === 'disputed' || (q.viewerId && r.authorId === q.viewerId));

    if (q.sort === 'rating')  arr.sort((a, b) => b.rating - a.rating);
    if (q.sort === 'helpful') arr.sort((a, b) => b.helpful - a.helpful);
    if (q.sort === 'recent')  arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const total = arr.length;
    const start = (q.page - 1) * q.pageSize;
    const items = arr.slice(start, start + q.pageSize);
    return { items, total, page: q.page, pageSize: q.pageSize, hasMore: start + items.length < total };
  }

  async getReview(id: string) { return this.reviews.get(id) ?? null; }

  async createReview(authorId: string, dto: any) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const next: Review = {
      id, authorId,
      subjectKind: dto.subjectKind, subjectId: dto.subjectId,
      rating: dto.rating, title: dto.title, body: dto.body,
      pros: dto.pros ?? [], cons: dto.cons ?? [],
      projectRef: dto.projectRef,
      status: 'pending', helpful: 0, unhelpful: 0,
      contactEmail: dto.contactEmail,
      createdAt: now, updatedAt: now,
    };
    this.reviews.set(id, next);
    return next;
  }

  async updateReview(id: string, patch: Partial<Review>) {
    const prev = this.reviews.get(id); if (!prev) return null;
    const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
    this.reviews.set(id, next);
    return next;
  }

  async setReviewStatus(id: string, status: Review['status'], notes?: string) {
    return this.updateReview(id, { status, moderationNotes: notes });
  }

  async setReviewResponse(id: string, body: string) {
    return this.updateReview(id, { responseBody: body, responseAt: new Date().toISOString() });
  }

  async setReviewDispute(id: string, reason: string) {
    return this.updateReview(id, { status: 'disputed', disputeReason: reason, disputedAt: new Date().toISOString() });
  }

  async voteHelpful(reviewId: string, voterId: string, helpful: boolean) {
    const r = this.reviews.get(reviewId); if (!r) return null;
    const key = `${reviewId}|${voterId}`;
    const prior = this.votes.get(key);
    if (prior) {
      // Idempotent toggle — one vote per voter.
      if (prior.helpful === helpful) return r;
      if (prior.helpful) r.helpful = Math.max(0, r.helpful - 1);
      else r.unhelpful = Math.max(0, r.unhelpful - 1);
    }
    if (helpful) r.helpful += 1; else r.unhelpful += 1;
    this.votes.set(key, { reviewId, voterId, helpful });
    return this.updateReview(reviewId, { helpful: r.helpful, unhelpful: r.unhelpful });
  }

  async ratingSummary(subjectKind: string, subjectId: string) {
    const arr = Array.from(this.reviews.values())
      .filter(r => r.subjectKind === subjectKind && r.subjectId === subjectId && r.status === 'published');
    if (!arr.length) return { count: 0, avg: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1|2|3|4|5, number>;
    let sum = 0;
    for (const r of arr) { sum += r.rating; distribution[r.rating as 1|2|3|4|5] += 1; }
    return { count: arr.length, avg: Math.round((sum / arr.length) * 100) / 100, distribution };
  }

  async pendingModerationQueue(limit = 50) {
    return Array.from(this.reviews.values())
      .filter(r => r.status === 'pending' || r.status === 'disputed')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, limit);
  }

  // ---------- references ----------
  async listReferences(requesterId: string) {
    return Array.from(this.references.values())
      .filter(r => r.requesterId === requesterId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async requestReference(requesterId: string, dto: any) {
    const id = crypto.randomUUID();
    const token = crypto.randomUUID().replace(/-/g, '');
    const next: Reference = {
      id, requesterId,
      refereeName: dto.refereeName, refereeEmail: dto.refereeEmail,
      refereeRole: dto.refereeRole, relationship: dto.relationship, message: dto.message,
      status: 'pending', token, createdAt: new Date().toISOString(),
    };
    this.references.set(id, next);
    return next;
  }
  async submitReference(token: string, body: string, rating?: number) {
    const ref = Array.from(this.references.values()).find(r => r.token === token);
    if (!ref || ref.status !== 'pending') return null;
    ref.body = body; ref.rating = rating; ref.status = 'verified'; ref.verifiedAt = new Date().toISOString();
    this.references.set(ref.id, ref);
    return ref;
  }

  // ---------- verifications ----------
  async listVerifications(identityId: string) {
    return Array.from(this.verifications.values()).filter(v => v.identityId === identityId);
  }
  async startVerification(identityId: string, kind: string, evidence?: Record<string, unknown>) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const next: Verification = { id, identityId, kind, status: 'pending', evidence, createdAt: now, updatedAt: now };
    this.verifications.set(id, next);
    return next;
  }
  async setVerificationStatus(id: string, status: 'verified' | 'failed' | 'pending') {
    const v = this.verifications.get(id); if (!v) return null;
    const next = { ...v, status, updatedAt: new Date().toISOString() };
    this.verifications.set(id, next);
    return next;
  }

  // ---------- badges ----------
  async listBadges(subjectKind: string, subjectId: string) {
    return Array.from(this.badges.values()).filter(b => b.subjectKind === subjectKind && b.subjectId === subjectId);
  }
  async awardBadge(awardedBy: string, dto: { subjectKind: string; subjectId: string; badge: string; reason?: string }) {
    // Idempotent — one badge per (subject, key)
    const dup = Array.from(this.badges.values()).find(b =>
      b.subjectKind === dto.subjectKind && b.subjectId === dto.subjectId && b.badge === dto.badge);
    if (dup) return dup;
    const id = crypto.randomUUID();
    const next: Badge = {
      id, subjectKind: dto.subjectKind, subjectId: dto.subjectId,
      badge: dto.badge, reason: dto.reason, awardedAt: new Date().toISOString(), awardedBy,
    };
    this.badges.set(id, next);
    return next;
  }
  async revokeBadge(id: string) { return this.badges.delete(id); }

  // ---------- seed (used on bootstrap to keep TrustPage UI realistic) ----------
  async seed(authorId: string) {
    const seedReviews: Array<Partial<Review> & { rating: number; title: string; body: string }> = [
      { authorId: 'seed-sarah',  authorName: 'Sarah Chen',     authorAvatarKey: 'SC', authorRole: 'Client',     subjectKind: 'user', subjectId: authorId, rating: 5, title: 'Outstanding delivery', body: 'Delivered the full design system ahead of schedule. Communication was excellent throughout the engagement.', pros: ['Exceptional communication', 'Ahead of schedule'], cons: [], projectRef: 'FinVault Design System', status: 'published', helpful: 12 },
      { authorId,                authorName: 'You',            authorAvatarKey: 'YO', authorRole: 'Freelancer', subjectKind: 'user', subjectId: 'seed-marcus', rating: 4, title: 'Great client to work with', body: 'Clear requirements, timely feedback, and fair payment terms. Would work with again.', pros: ['Clear requirements'], cons: ['Slow initial onboarding'], projectRef: 'GreenGrid Dashboard', status: 'published', helpful: 5 },
      { authorId: 'seed-jordan', authorName: 'Jordan Lee',     authorAvatarKey: 'JL', authorRole: 'Agency Lead',subjectKind: 'user', subjectId: authorId, rating: 5, title: 'Top-tier engineering', body: 'Integrated seamlessly with our team. Deep TypeScript expertise and excellent code quality.', pros: ['TypeScript expertise', 'Code quality', 'Team integration'], cons: [], projectRef: 'Luma Patient Portal', status: 'published', helpful: 18 },
      { authorId,                authorName: 'You',            authorAvatarKey: 'YO', authorRole: 'Freelancer', subjectKind: 'agency', subjectId: 'apex-digital', rating: 3, title: 'Mixed experience', body: 'Good project management but scope changes were frequent and not always documented.', pros: ['Good PM'], cons: ['Frequent scope changes', 'Poor documentation'], projectRef: 'TradeLoop Rebuild', status: 'disputed', helpful: 2, disputeReason: 'Reviewer scope claim disputed by agency.', disputedAt: new Date(Date.now() - 86_400_000).toISOString() },
      { authorId: 'seed-elena',  authorName: 'Elena Rodriguez',authorAvatarKey: 'ER', authorRole: 'Recruiter',  subjectKind: 'user', subjectId: authorId, rating: 5, title: 'Highly recommended candidate', body: 'Professional, responsive, and delivered exceptional results. One of our best placements.', pros: ['Professional', 'Responsive'], cons: [], projectRef: 'Contract Placement', status: 'published', helpful: 9 },
    ];
    for (const r of seedReviews) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      this.reviews.set(id, { id, unhelpful: 0, createdAt: now, updatedAt: now, ...r } as Review);
    }
    const seedRefs: Reference[] = [
      { id: crypto.randomUUID(), requesterId: authorId, refereeName: 'David Park',     refereeEmail: 'david@greengrid.example',  refereeRole: 'CTO at GreenGrid',         relationship: 'Client',   status: 'verified', token: crypto.randomUUID().replace(/-/g,''), body: "One of the best engineers I've worked with.", rating: 5, createdAt: new Date(Date.now() - 30 * 86_400_000).toISOString(), verifiedAt: new Date(Date.now() - 28 * 86_400_000).toISOString() },
      { id: crypto.randomUUID(), requesterId: authorId, refereeName: 'Amy Zhang',      refereeEmail: 'amy@vercel.example',       refereeRole: 'VP Design at Vercel',      relationship: 'Colleague',status: 'verified', token: crypto.randomUUID().replace(/-/g,''), body: 'Exceptional cross-functional collaborator.', rating: 5, createdAt: new Date(Date.now() - 60 * 86_400_000).toISOString(), verifiedAt: new Date(Date.now() - 58 * 86_400_000).toISOString() },
      { id: crypto.randomUUID(), requesterId: authorId, refereeName: 'Ryan Mitchell',  refereeEmail: 'ryan@launchpad.example',   refereeRole: 'Founder at LaunchPad',     relationship: 'Client',   status: 'pending',  token: crypto.randomUUID().replace(/-/g,''),                              createdAt: new Date(Date.now() - 7  * 86_400_000).toISOString() },
    ];
    for (const r of seedRefs) this.references.set(r.id, r);
    const seedVer: Array<Partial<Verification>> = [
      { kind: 'identity',  status: 'verified' },
      { kind: 'email',     status: 'verified' },
      { kind: 'skills',    status: 'verified' },
      { kind: 'background',status: 'pending' },
      { kind: 'portfolio', status: 'verified' },
      { kind: 'payment',   status: 'not_started' },
    ];
    for (const v of seedVer) {
      const id = crypto.randomUUID(); const now = new Date().toISOString();
      this.verifications.set(id, { id, identityId: authorId, kind: v.kind!, status: v.status as any, createdAt: now, updatedAt: now });
    }
    const seedBadges: Array<{ badge: string; reason: string }> = [
      { badge: 'top_rated',     reason: 'Maintained 4.5+ rating for 6 months' },
      { badge: 'verified_pro',  reason: 'ID + skills + portfolio verified' },
      { badge: 'fast_responder',reason: 'Avg response time under 2h' },
    ];
    for (const b of seedBadges) {
      const id = crypto.randomUUID();
      this.badges.set(id, { id, subjectKind: 'user', subjectId: authorId, badge: b.badge, reason: b.reason, awardedAt: new Date().toISOString(), awardedBy: 'system' });
    }
  }
}
