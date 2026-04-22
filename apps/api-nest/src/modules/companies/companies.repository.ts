import { Injectable } from '@nestjs/common';

@Injectable()
export class CompaniesRepository {
  private companies = new Map<string, any>();
  private members = new Map<string, any[]>();
  private locations = new Map<string, any[]>();
  private links = new Map<string, any[]>();
  private followers = new Map<string, Set<string>>();
  private posts = new Map<string, any[]>();
  private brand = new Map<string, any>();
  private views = new Map<string, any[]>();
  private audit: any[] = [];

  async list(q?: { q?: string; industry?: string; page: number; pageSize: number }) {
    let arr = Array.from(this.companies.values()).filter(c => c.status === 'active' && c.visibility !== 'private');
    if (q?.q) {
      const needle = q.q.toLowerCase();
      arr = arr.filter(c => c.name.toLowerCase().includes(needle) || c.slug.includes(needle));
    }
    if (q?.industry) arr = arr.filter(c => c.industry === q.industry);
    const total = arr.length;
    const start = ((q?.page ?? 1) - 1) * (q?.pageSize ?? 20);
    return { items: arr.slice(start, start + (q?.pageSize ?? 20)), total };
  }
  async get(id: string) { return this.companies.get(id) ?? null; }
  async getBySlug(slug: string) {
    for (const c of this.companies.values()) if (c.slug === slug) return c;
    return null;
  }
  async create(c: any) {
    const id = c.id ?? crypto.randomUUID();
    const now = new Date().toISOString();
    const next = {
      id, status: 'active', visibility: 'public', verified: false,
      followerCount: 0, employeeCount: 0, openRolesCount: 0,
      createdAt: now, updatedAt: now, ...c,
    };
    this.companies.set(id, next);
    this.audit.push({ companyId: id, actorId: c.createdBy, action: 'company.create', occurredAt: now });
    return next;
  }
  async update(id: string, patch: any, actorId?: string) {
    const prev = this.companies.get(id); if (!prev) return null;
    const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
    this.companies.set(id, next);
    this.audit.push({ companyId: id, actorId, action: 'company.update', diff: patch, occurredAt: next.updatedAt });
    return next;
  }
  async archive(id: string, actorId?: string) { return this.update(id, { status: 'archived' }, actorId); }

  // Members
  async listMembers(companyId: string) { return this.members.get(companyId) ?? []; }
  async findMember(companyId: string, identityId: string) {
    return (this.members.get(companyId) ?? []).find(m => m.identityId === identityId) ?? null;
  }
  async addMember(companyId: string, m: any) {
    const list = this.members.get(companyId) ?? [];
    if (list.find(x => x.identityId === m.identityId)) return list;
    list.push({ id: crypto.randomUUID(), status: 'active', joinedAt: new Date().toISOString(), isPublic: true, ...m, companyId });
    this.members.set(companyId, list);
    const c = this.companies.get(companyId); if (c) c.employeeCount = list.filter(x => x.status === 'active').length;
    return list;
  }
  async removeMember(companyId: string, identityId: string) {
    const list = (this.members.get(companyId) ?? []).filter(m => m.identityId !== identityId);
    this.members.set(companyId, list);
    const c = this.companies.get(companyId); if (c) c.employeeCount = list.filter(x => x.status === 'active').length;
    return list;
  }
  async updateMemberRole(companyId: string, identityId: string, role: string) {
    const m = await this.findMember(companyId, identityId);
    if (m) m.role = role;
    return m;
  }

  // Locations
  async listLocations(companyId: string) { return this.locations.get(companyId) ?? []; }
  async addLocation(companyId: string, loc: any) {
    const list = this.locations.get(companyId) ?? [];
    list.push({ id: crypto.randomUUID(), position: list.length, ...loc });
    this.locations.set(companyId, list);
    return list;
  }
  async removeLocation(companyId: string, id: string) {
    const list = (this.locations.get(companyId) ?? []).filter(l => l.id !== id);
    this.locations.set(companyId, list);
    return list;
  }

  // Links
  async listLinks(companyId: string) { return this.links.get(companyId) ?? []; }
  async upsertLink(companyId: string, link: any) {
    const list = this.links.get(companyId) ?? [];
    const i = list.findIndex(l => l.kind === link.kind);
    if (i >= 0) list[i] = { ...list[i], ...link }; else list.push({ id: crypto.randomUUID(), ...link });
    this.links.set(companyId, list);
    return list;
  }
  async removeLink(companyId: string, kind: string) {
    const list = (this.links.get(companyId) ?? []).filter(l => l.kind !== kind);
    this.links.set(companyId, list);
    return list;
  }

  // Followers
  async follow(companyId: string, followerId: string) {
    const set = this.followers.get(companyId) ?? new Set<string>();
    set.add(followerId); this.followers.set(companyId, set);
    const c = this.companies.get(companyId); if (c) c.followerCount = set.size;
    return { following: true, followerCount: set.size };
  }
  async unfollow(companyId: string, followerId: string) {
    const set = this.followers.get(companyId) ?? new Set<string>();
    set.delete(followerId); this.followers.set(companyId, set);
    const c = this.companies.get(companyId); if (c) c.followerCount = set.size;
    return { following: false, followerCount: set.size };
  }
  async isFollowing(companyId: string, followerId: string) {
    return (this.followers.get(companyId) ?? new Set()).has(followerId);
  }

  // Posts
  async listPosts(companyId: string, limit = 20) {
    return (this.posts.get(companyId) ?? []).slice(0, limit);
  }
  async addPost(companyId: string, p: any) {
    const list = this.posts.get(companyId) ?? [];
    const next = { id: crypto.randomUUID(), publishedAt: new Date().toISOString(), reactionCount: 0, status: 'published', media: [], ...p, companyId };
    list.unshift(next); this.posts.set(companyId, list);
    return next;
  }
  async updatePost(companyId: string, id: string, patch: any) {
    const list = this.posts.get(companyId) ?? [];
    const i = list.findIndex(p => p.id === id);
    if (i < 0) return null;
    list[i] = { ...list[i], ...patch }; return list[i];
  }
  async removePost(companyId: string, id: string) {
    const list = (this.posts.get(companyId) ?? []).filter(p => p.id !== id);
    this.posts.set(companyId, list); return list;
  }

  // Brand
  async getBrand(companyId: string) { return this.brand.get(companyId) ?? null; }
  async setBrand(companyId: string, b: any) {
    const next = { companyId, updatedAt: new Date().toISOString(), ...(this.brand.get(companyId) ?? {}), ...b };
    this.brand.set(companyId, next); return next;
  }

  // Views + audit
  async logView(companyId: string, viewerId: string | null, source?: string) {
    const list = this.views.get(companyId) ?? [];
    list.unshift({ id: crypto.randomUUID(), viewerId, source, occurredAt: new Date().toISOString() });
    this.views.set(companyId, list.slice(0, 1000));
  }
  async listAudit(companyId: string, limit = 50) {
    return this.audit.filter(a => a.companyId === companyId).slice(0, limit);
  }
}
