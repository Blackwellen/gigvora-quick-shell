import { Injectable } from '@nestjs/common';

/**
 * In-memory repository for Domain 14 — Groups, Community Hubs &
 * Member Conversations. Mirrors the AgencyRepository pattern; swap to
 * Drizzle/Postgres in production by binding the same method shape.
 */
@Injectable()
export class GroupsRepository {
  private groups       = new Map<string, any>();              // id -> group
  private members      = new Map<string, Map<string, any>>(); // groupId -> identityId -> membership
  private joinRequests = new Map<string, any[]>();            // groupId -> requests
  private channels     = new Map<string, any[]>();            // groupId -> channels
  private posts        = new Map<string, any[]>();            // groupId -> posts
  private comments     = new Map<string, any[]>();            // postId -> comments
  private reactions    = new Map<string, Map<string, Set<string>>>(); // postId -> emoji -> Set<userId>
  private events       = new Map<string, any[]>();            // groupId -> events
  private rsvps        = new Map<string, Map<string, string>>(); // eventId -> identityId -> status
  private invites      = new Map<string, any[]>();            // groupId -> invites
  private reports      = new Map<string, any[]>();            // groupId -> reports
  private notes: any[] = [];

  // ---------- group CRUD ----------
  async list(q: { q?: string; category?: string; type?: string; joined?: boolean; viewerId?: string|null; page: number; pageSize: number; sort: string }) {
    let arr = Array.from(this.groups.values()).filter(g => g.status !== 'archived');
    // hide secret groups from non-members
    arr = arr.filter(g => g.type !== 'secret' || (q.viewerId && this.members.get(g.id)?.has(q.viewerId)));
    if (q.q) {
      const n = q.q.toLowerCase();
      arr = arr.filter(g => g.name?.toLowerCase().includes(n) || g.slug?.includes(n) || g.description?.toLowerCase().includes(n));
    }
    if (q.category) arr = arr.filter(g => g.category === q.category);
    if (q.type)     arr = arr.filter(g => g.type === q.type);
    if (q.joined !== undefined && q.viewerId) {
      arr = arr.filter(g => {
        const has = this.members.get(g.id)?.get(q.viewerId!)?.status === 'active';
        return q.joined ? has : !has;
      });
    }

    if (q.sort === 'recent')   arr.sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt)));
    if (q.sort === 'members')  arr.sort((x, y) => (y.memberCount ?? 0) - (x.memberCount ?? 0));
    if (q.sort === 'activity') arr.sort((x, y) => (y.postsLast7d ?? 0) - (x.postsLast7d ?? 0));

    const total = arr.length;
    const start = (q.page - 1) * q.pageSize;
    const items = arr.slice(start, start + q.pageSize).map(g => ({
      ...g,
      joined: q.viewerId ? this.members.get(g.id)?.get(q.viewerId)?.status === 'active' : false,
    }));
    return { items, total, limit: q.pageSize, hasMore: start + items.length < total };
  }
  async get(id: string)              { return this.groups.get(id) ?? null; }
  async getBySlug(slug: string) {
    for (const g of this.groups.values()) if (g.slug === slug) return g;
    return null;
  }
  async create(g: any) {
    const id  = g.id ?? crypto.randomUUID();
    const now = new Date().toISOString();
    const next = {
      id, status: 'active', type: 'public', joinPolicy: 'open', postingPolicy: 'members',
      memberCount: 1, postsLast7d: 0, createdAt: now, updatedAt: now, ...g,
    };
    this.groups.set(id, next);
    return next;
  }
  async update(id: string, patch: any) {
    const prev = this.groups.get(id); if (!prev) return null;
    const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
    this.groups.set(id, next);
    return next;
  }
  async setStatus(id: string, status: 'draft'|'active'|'paused'|'archived') { return this.update(id, { status }); }

  // ---------- members ----------
  async listMembers(id: string) { return Array.from(this.members.get(id)?.values() ?? []); }
  async getMembership(id: string, identityId: string) { return this.members.get(id)?.get(identityId) ?? null; }
  async upsertMember(id: string, identityId: string, m: Partial<{ role: string; status: string; displayName?: string; avatarUrl?: string; joinedAt?: string }>) {
    const map = this.members.get(id) ?? new Map();
    const prev = map.get(identityId);
    const now  = new Date().toISOString();
    const next = { identityId, role: 'member', status: 'active', joinedAt: now, ...prev, ...m, updatedAt: now };
    map.set(identityId, next);
    this.members.set(id, map);
    const g = this.groups.get(id);
    if (g) {
      g.memberCount = Array.from(map.values()).filter(x => x.status === 'active').length;
      this.groups.set(id, g);
    }
    return next;
  }
  async removeMember(id: string, identityId: string) {
    const map = this.members.get(id);
    if (map) { map.delete(identityId); this.members.set(id, map); }
    const g = this.groups.get(id);
    if (g) {
      g.memberCount = Array.from(map?.values() ?? []).filter(x => x.status === 'active').length;
      this.groups.set(id, g);
    }
    return { ok: true };
  }

  // ---------- join requests ----------
  async listJoinRequests(id: string) { return (this.joinRequests.get(id) ?? []).filter(r => r.status === 'pending'); }
  async createJoinRequest(id: string, identityId: string, message?: string) {
    const arr = this.joinRequests.get(id) ?? [];
    if (arr.some(r => r.identityId === identityId && r.status === 'pending')) return arr.find(r => r.identityId === identityId && r.status === 'pending');
    const next = { id: crypto.randomUUID(), groupId: id, identityId, message: message ?? null, status: 'pending', createdAt: new Date().toISOString() };
    arr.push(next);
    this.joinRequests.set(id, arr);
    return next;
  }
  async decideJoinRequest(id: string, requestId: string, decision: 'approve'|'reject') {
    const arr = this.joinRequests.get(id) ?? [];
    const r = arr.find(x => x.id === requestId);
    if (!r) return null;
    r.status = decision === 'approve' ? 'approved' : 'rejected';
    r.decidedAt = new Date().toISOString();
    this.joinRequests.set(id, arr);
    if (decision === 'approve') await this.upsertMember(id, r.identityId, { role: 'member', status: 'active' });
    return r;
  }

  // ---------- channels ----------
  async listChannels(id: string) { return (this.channels.get(id) ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0)); }
  async addChannel(id: string, c: any) {
    const next = { id: crypto.randomUUID(), groupId: id, type: 'discussion', private: false, ...c, createdAt: new Date().toISOString() };
    this.channels.set(id, [...(this.channels.get(id) ?? []), next]);
    return next;
  }

  // ---------- posts ----------
  async listPosts(id: string, opts: { channelId?: string|null; limit: number; cursor?: string|null }) {
    let arr = (this.posts.get(id) ?? []).filter(p => p.status === 'active');
    if (opts.channelId !== undefined) arr = arr.filter(p => (p.channelId ?? null) === opts.channelId);
    arr.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || String(b.createdAt).localeCompare(String(a.createdAt)));
    let start = 0;
    if (opts.cursor) {
      const i = arr.findIndex(p => p.id === opts.cursor);
      start = i >= 0 ? i + 1 : 0;
    }
    const items = arr.slice(start, start + opts.limit);
    const nextCursor = start + items.length < arr.length ? items[items.length - 1]?.id ?? null : null;
    return { items, total: arr.length, limit: opts.limit, hasMore: !!nextCursor, nextCursor };
  }
  async getPost(postId: string): Promise<any|null> {
    for (const arr of this.posts.values()) {
      const p = arr.find(x => x.id === postId);
      if (p) return p;
    }
    return null;
  }
  async addPost(id: string, authorId: string, dto: any) {
    const now = new Date().toISOString();
    const next = {
      id: crypto.randomUUID(), groupId: id, authorId, status: 'active',
      attachments: [], pinned: false, locked: false,
      reactionCount: 0, commentCount: 0, createdAt: now, updatedAt: now, ...dto,
    };
    this.posts.set(id, [...(this.posts.get(id) ?? []), next]);
    const g = this.groups.get(id);
    if (g) { g.postsLast7d = (g.postsLast7d ?? 0) + 1; this.groups.set(id, g); }
    return next;
  }
  async updatePost(id: string, postId: string, patch: any) {
    const arr = this.posts.get(id) ?? [];
    const i = arr.findIndex(p => p.id === postId);
    if (i === -1) return null;
    arr[i] = { ...arr[i], ...patch, updatedAt: new Date().toISOString() };
    this.posts.set(id, arr);
    return arr[i];
  }
  async deletePost(id: string, postId: string) { return this.updatePost(id, postId, { status: 'deleted' }); }

  // ---------- reactions ----------
  async toggleReaction(postId: string, userId: string, emoji: string) {
    const map = this.reactions.get(postId) ?? new Map<string, Set<string>>();
    const set = map.get(emoji) ?? new Set<string>();
    const had = set.has(userId);
    if (had) set.delete(userId); else set.add(userId);
    map.set(emoji, set);
    this.reactions.set(postId, map);
    const post = await this.getPost(postId);
    if (post) {
      let total = 0;
      for (const s of map.values()) total += s.size;
      post.reactionCount = total;
    }
    return { reacted: !had, count: set.size, totals: this.reactionTotals(postId) };
  }
  reactionTotals(postId: string) {
    const map = this.reactions.get(postId) ?? new Map();
    return Array.from(map.entries()).map(([emoji, set]: any) => ({ emoji, count: set.size }));
  }

  // ---------- comments ----------
  async listComments(postId: string) {
    return (this.comments.get(postId) ?? []).slice().sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  }
  async addComment(postId: string, authorId: string, dto: any) {
    const next = { id: crypto.randomUUID(), postId, authorId, parentId: dto.parentId ?? null, body: dto.body, createdAt: new Date().toISOString() };
    this.comments.set(postId, [...(this.comments.get(postId) ?? []), next]);
    const post = await this.getPost(postId);
    if (post) post.commentCount = (post.commentCount ?? 0) + 1;
    return next;
  }

  // ---------- events ----------
  async listEvents(id: string) { return (this.events.get(id) ?? []).slice().sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt))); }
  async addEvent(id: string, dto: any) {
    const next = { id: crypto.randomUUID(), groupId: id, status: 'scheduled', rsvpCount: 0, createdAt: new Date().toISOString(), ...dto };
    this.events.set(id, [...(this.events.get(id) ?? []), next]);
    return next;
  }
  async rsvp(eventId: string, identityId: string, status: 'going'|'interested'|'declined') {
    const map = this.rsvps.get(eventId) ?? new Map();
    map.set(identityId, status);
    this.rsvps.set(eventId, map);
    // recompute count
    for (const arr of this.events.values()) {
      const ev = arr.find(e => e.id === eventId);
      if (ev) ev.rsvpCount = Array.from(map.values()).filter(s => s === 'going').length;
    }
    return { ok: true, status };
  }

  // ---------- invites ----------
  async createInvites(id: string, fromId: string, dto: any) {
    const arr = this.invites.get(id) ?? [];
    const created = [
      ...(dto.emails ?? []).map((email: string) => ({ id: crypto.randomUUID(), groupId: id, email, status: 'sent', invitedBy: fromId, createdAt: new Date().toISOString(), message: dto.message ?? null })),
      ...(dto.identityIds ?? []).map((identityId: string) => ({ id: crypto.randomUUID(), groupId: id, identityId, status: 'sent', invitedBy: fromId, createdAt: new Date().toISOString(), message: dto.message ?? null })),
    ];
    this.invites.set(id, [...arr, ...created]);
    // immediately mark invited identities as `invited` membership
    for (const c of created) {
      if (c.identityId) await this.upsertMember(id, c.identityId, { status: 'invited' });
    }
    return created;
  }
  async listInvites(id: string) { return this.invites.get(id) ?? []; }

  // ---------- reports ----------
  async createReport(id: string, reporterId: string, targetType: 'post'|'comment'|'member', targetId: string, dto: any) {
    const next = { id: crypto.randomUUID(), groupId: id, reporterId, targetType, targetId, reason: dto.reason, notes: dto.notes ?? null, status: 'open', createdAt: new Date().toISOString() };
    this.reports.set(id, [...(this.reports.get(id) ?? []), next]);
    return next;
  }
  async listReports(id: string, status: 'open'|'all' = 'open') {
    const arr = this.reports.get(id) ?? [];
    return status === 'all' ? arr : arr.filter(r => r.status === 'open');
  }
  async resolveReport(id: string, reportId: string, status: 'resolved'|'dismissed') {
    const arr = this.reports.get(id) ?? [];
    const r = arr.find(x => x.id === reportId); if (!r) return null;
    r.status = status; r.resolvedAt = new Date().toISOString();
    this.reports.set(id, arr);
    return r;
  }

  // ---------- seed convenience ----------
  async seed(record: any) { return this.create(record); }
}
