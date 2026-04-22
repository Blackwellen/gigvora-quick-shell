import { Injectable } from '@nestjs/common';

/**
 * In-memory repository for Domain 13 — Agency Pages, Service Presence,
 * and Public Proof Surfaces. Mirrors the CompaniesRepository pattern; swap
 * to Drizzle/Postgres in production by binding the same method shape.
 */
@Injectable()
export class AgencyRepository {
  private agencies = new Map<string, any>();
  private services = new Map<string, any[]>();
  private team = new Map<string, any[]>();
  private caseStudies = new Map<string, any[]>();
  private reviews = new Map<string, any[]>();
  private proofs = new Map<string, any[]>();
  private inquiries = new Map<string, any[]>();
  private followers = new Map<string, Set<string>>();
  private views = new Map<string, any[]>();
  private audit: any[] = [];

  // ---------- agency CRUD ----------
  async list(q: { q?: string; industry?: string; acceptingProjects?: boolean; page: number; pageSize: number; sort: string }) {
    let arr = Array.from(this.agencies.values()).filter(a => a.status === 'active' && a.visibility !== 'private');
    if (q.q) {
      const n = q.q.toLowerCase();
      arr = arr.filter(a => a.name?.toLowerCase().includes(n) || a.slug?.includes(n) || a.tagline?.toLowerCase().includes(n));
    }
    if (q.industry) arr = arr.filter(a => a.industry === q.industry);
    if (q.acceptingProjects !== undefined) arr = arr.filter(a => !!a.acceptingProjects === q.acceptingProjects);

    if (q.sort === 'rating')   arr.sort((x, y) => (y.ratingAvg ?? 0) - (x.ratingAvg ?? 0));
    if (q.sort === 'recent')   arr.sort((x, y) => String(y.updatedAt).localeCompare(String(x.updatedAt)));
    if (q.sort === 'projects') arr.sort((x, y) => (y.completedProjects ?? 0) - (x.completedProjects ?? 0));

    const total = arr.length;
    const start = (q.page - 1) * q.pageSize;
    const items = arr.slice(start, start + q.pageSize);
    return { items, total, limit: q.pageSize, hasMore: start + items.length < total };
  }
  async get(id: string) { return this.agencies.get(id) ?? null; }
  async getBySlug(slug: string) {
    for (const a of this.agencies.values()) if (a.slug === slug) return a;
    return null;
  }
  async create(a: any) {
    const id = a.id ?? crypto.randomUUID();
    const now = new Date().toISOString();
    const next = {
      id, status: 'draft', visibility: 'public', verified: false,
      acceptingProjects: true, followerCount: 0, ratingAvg: 0, ratingCount: 0,
      completedProjects: 0, createdAt: now, updatedAt: now, ...a,
    };
    this.agencies.set(id, next);
    return next;
  }
  async update(id: string, patch: any) {
    const prev = this.agencies.get(id); if (!prev) return null;
    const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
    this.agencies.set(id, next);
    return next;
  }
  async setStatus(id: string, status: 'draft'|'active'|'paused'|'archived') { return this.update(id, { status }); }

  // ---------- services ----------
  async listServices(agencyId: string) { return (this.services.get(agencyId) ?? []).filter(s => s.status !== 'archived').sort((a, b) => (a.position ?? 0) - (b.position ?? 0)); }
  async addService(agencyId: string, s: any) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const next = { id, agencyId, status: 'active', currency: 'USD', popular: false, createdAt: now, updatedAt: now, ...s };
    this.services.set(agencyId, [...(this.services.get(agencyId) ?? []), next]);
    return next;
  }
  async updateService(agencyId: string, id: string, patch: any) {
    const arr = this.services.get(agencyId) ?? [];
    const i = arr.findIndex(s => s.id === id); if (i === -1) return null;
    arr[i] = { ...arr[i], ...patch, updatedAt: new Date().toISOString() };
    this.services.set(agencyId, arr);
    return arr[i];
  }
  async removeService(agencyId: string, id: string) { return this.updateService(agencyId, id, { status: 'archived' }); }

  // ---------- team ----------
  async listTeam(agencyId: string) { return (this.team.get(agencyId) ?? []).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)); }
  async addTeam(agencyId: string, m: any) {
    const id = crypto.randomUUID();
    const next = { id, agencyId, available: true, ...m };
    this.team.set(agencyId, [...(this.team.get(agencyId) ?? []), next]);
    return next;
  }
  async removeTeam(agencyId: string, id: string) {
    const arr = this.team.get(agencyId) ?? [];
    this.team.set(agencyId, arr.filter(m => m.id !== id));
    return { ok: true };
  }

  // ---------- case studies ----------
  async listCaseStudies(agencyId: string, includeDrafts = false) {
    const arr = (this.caseStudies.get(agencyId) ?? []);
    return includeDrafts ? arr : arr.filter(c => c.status === 'published');
  }
  async addCaseStudy(agencyId: string, c: any) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const next = { id, agencyId, status: 'draft', views: 0, createdAt: now, updatedAt: now, ...c };
    this.caseStudies.set(agencyId, [...(this.caseStudies.get(agencyId) ?? []), next]);
    return next;
  }
  async updateCaseStudy(agencyId: string, id: string, patch: any) {
    const arr = this.caseStudies.get(agencyId) ?? [];
    const i = arr.findIndex(c => c.id === id); if (i === -1) return null;
    arr[i] = { ...arr[i], ...patch, updatedAt: new Date().toISOString() };
    this.caseStudies.set(agencyId, arr);
    return arr[i];
  }

  // ---------- reviews ----------
  async listReviews(agencyId: string) { return (this.reviews.get(agencyId) ?? []).slice().reverse(); }
  async addReview(agencyId: string, r: any) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const next = { id, agencyId, status: 'visible', createdAt: now, ...r };
    this.reviews.set(agencyId, [...(this.reviews.get(agencyId) ?? []), next]);
    // recompute rating
    const a = this.agencies.get(agencyId);
    if (a) {
      const all = this.reviews.get(agencyId) ?? [];
      a.ratingAvg = +(all.reduce((s, x) => s + (x.rating ?? 0), 0) / Math.max(1, all.length)).toFixed(2);
      a.ratingCount = all.length;
      this.agencies.set(agencyId, a);
    }
    return next;
  }

  // ---------- proofs ----------
  async listProofs(agencyId: string) { return this.proofs.get(agencyId) ?? []; }
  async addProof(agencyId: string, p: any) {
    const id = crypto.randomUUID();
    const next = { id, agencyId, verified: false, ...p };
    this.proofs.set(agencyId, [...(this.proofs.get(agencyId) ?? []), next]);
    return next;
  }
  async setProofVerified(agencyId: string, id: string, verified: boolean) {
    const arr = this.proofs.get(agencyId) ?? [];
    const i = arr.findIndex(p => p.id === id); if (i === -1) return null;
    arr[i] = { ...arr[i], verified, verifiedAt: verified ? new Date().toISOString() : null };
    this.proofs.set(agencyId, arr);
    return arr[i];
  }

  // ---------- inquiries ----------
  async listInquiries(agencyId: string) { return (this.inquiries.get(agencyId) ?? []).slice().reverse(); }
  async createInquiry(agencyId: string, i: any) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const next = { id, agencyId, status: 'new', createdAt: now, ...i };
    this.inquiries.set(agencyId, [...(this.inquiries.get(agencyId) ?? []), next]);
    return next;
  }

  // ---------- followers / views ----------
  async follow(agencyId: string, followerId: string) {
    const set = this.followers.get(agencyId) ?? new Set();
    set.add(followerId); this.followers.set(agencyId, set);
    const a = this.agencies.get(agencyId); if (a) { a.followerCount = set.size; this.agencies.set(agencyId, a); }
    return { followed: true, followerCount: set.size };
  }
  async unfollow(agencyId: string, followerId: string) {
    const set = this.followers.get(agencyId) ?? new Set();
    set.delete(followerId); this.followers.set(agencyId, set);
    const a = this.agencies.get(agencyId); if (a) { a.followerCount = set.size; this.agencies.set(agencyId, a); }
    return { followed: false, followerCount: set.size };
  }
  async trackView(agencyId: string, viewerId: string|null, ip?: string|null, ua?: string|null) {
    this.views.set(agencyId, [...(this.views.get(agencyId) ?? []), { viewerId, ip, ua, at: new Date().toISOString() }]);
    return { ok: true };
  }
  async listViews(agencyId: string) { return this.views.get(agencyId) ?? []; }

  // seed convenience for demo / first-render parity with existing UI
  async seed(record: any) {
    const a = await this.create(record);
    return a;
  }
}
