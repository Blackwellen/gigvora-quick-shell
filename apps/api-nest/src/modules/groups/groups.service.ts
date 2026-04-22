import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { GroupsRepository } from './groups.repository';
import { AuditService } from '../workspace/audit.service';
import { D9Emit } from '../domain-bus/domain-emissions';

function envelope<T>(items: T[], limit?: number) {
  const lim = limit ?? items.length;
  return { items, total: items.length, limit: lim, hasMore: limit != null && items.length >= lim };
}

/**
 * Domain 14 — Groups, Community Hubs & Member Conversations.
 *
 * Lifecycle: draft → active → (paused | archived).
 * Membership: invited → active → (left | banned), or open-policy direct active.
 * Posts: active → (hidden | deleted) via moderation.
 *
 * RBAC:
 *   • Public groups: anyone can list/detail; only members can post/comment.
 *   • Private groups: detail visible, content gated to members.
 *   • Secret groups: invisible to non-members entirely.
 *   • Owners/admins: edit group, manage members, moderate content.
 *   • Moderators: hide/unhide/delete posts, pin, lock; cannot edit group.
 */
@Injectable()
export class GroupsService {
  constructor(
    private readonly repo: GroupsRepository,
    private readonly audit: AuditService,
  ) {}

  // ---------- discovery ----------
  async list(viewerId: string|null, q: any) { return this.repo.list({ ...q, viewerId }); }

  async detail(idOrSlug: string, viewerId: string|null) {
    const g = idOrSlug.match(/^[0-9a-f-]{36}$/i)
      ? (await this.repo.get(idOrSlug)) ?? (await this.repo.getBySlug(idOrSlug))
      : (await this.repo.getBySlug(idOrSlug)) ?? (await this.repo.get(idOrSlug));
    if (!g) throw new NotFoundException('group_not_found');
    const membership = viewerId ? await this.repo.getMembership(g.id, viewerId) : null;
    if (g.type === 'secret' && membership?.status !== 'active') throw new NotFoundException('group_not_found');
    return { ...g, viewerMembership: membership, joined: membership?.status === 'active' };
  }

  // ---------- group CRUD ----------
  async create(actorId: string, dto: any) {
    if (await this.repo.getBySlug(dto.slug)) throw new BadRequestException('slug_taken');
    const g = await this.repo.create({ ...dto, ownerId: actorId });
    await this.repo.upsertMember(g.id, actorId, { role: 'owner', status: 'active' });
    await this.audit.record({ actorId, domain: 'groups', action: 'group.create', targetType: 'group', targetId: g.id, meta: { slug: g.slug, type: g.type } });
    void D9Emit.created(actorId, g.id, { slug: g.slug, type: g.type, ownerId: actorId });
    return g;
  }
  async update(id: string, actorId: string, patch: any) {
    await this.assertRole(id, actorId, ['owner', 'admin']);
    const g = await this.repo.update(id, patch);
    if (!g) throw new NotFoundException('group_not_found');
    await this.audit.record({ actorId, domain: 'groups', action: 'group.update', targetType: 'group', targetId: id, meta: { fields: Object.keys(patch ?? {}) } });
    void D9Emit.updated(actorId, id, { fields: Object.keys(patch ?? {}) });
    return g;
  }
  async pause(id: string, actorId: string)   { return this.transition(id, actorId, 'paused', 'group.pause'); }
  async archive(id: string, actorId: string) { return this.transition(id, actorId, 'archived', 'group.archive'); }
  async restore(id: string, actorId: string) { return this.transition(id, actorId, 'active', 'group.restore'); }

  private async transition(id: string, actorId: string, status: any, action: string) {
    await this.assertRole(id, actorId, ['owner']);
    const g = await this.repo.setStatus(id, status);
    if (!g) throw new NotFoundException('group_not_found');
    await this.audit.record({ actorId, domain: 'groups', action, targetType: 'group', targetId: id, meta: { status } });
    if (status === 'archived') void D9Emit.archived(actorId, id, { status });
    else void D9Emit.updated(actorId, id, { status });
    return g;
  }

  // ---------- membership ----------
  async listMembers(id: string, viewerId: string|null) {
    const g = await this.repo.get(id); if (!g) throw new NotFoundException('group_not_found');
    if (g.type !== 'public') await this.assertMember(id, viewerId);
    return envelope(await this.repo.listMembers(id));
  }
  async join(id: string, identityId: string, message?: string) {
    const g = await this.repo.get(id); if (!g) throw new NotFoundException('group_not_found');
    if (g.joinPolicy === 'invite_only') throw new ForbiddenException('invite_only');
    if (g.joinPolicy === 'request') {
      const r = await this.repo.createJoinRequest(id, identityId, message);
      await this.audit.record({ actorId: identityId, domain: 'groups', action: 'group.join.request', targetType: 'group', targetId: id });
      return { status: 'pending', request: r };
    }
    const m = await this.repo.upsertMember(id, identityId, { role: 'member', status: 'active' });
    await this.audit.record({ actorId: identityId, domain: 'groups', action: 'group.join', targetType: 'group', targetId: id });
    void D9Emit.memberJoined(identityId, id, { identityId, groupId: id });
    return { status: 'active', membership: m };
  }
  async leave(id: string, identityId: string) {
    await this.repo.removeMember(id, identityId);
    await this.audit.record({ actorId: identityId, domain: 'groups', action: 'group.leave', targetType: 'group', targetId: id });
    void D9Emit.memberLeft(identityId, id, { identityId, groupId: id });
    return { ok: true };
  }
  async setRole(id: string, actorId: string, identityId: string, role: 'owner'|'admin'|'moderator'|'member') {
    await this.assertRole(id, actorId, ['owner', 'admin']);
    if (role === 'owner') await this.assertRole(id, actorId, ['owner']); // only owner promotes owners
    const m = await this.repo.upsertMember(id, identityId, { role });
    await this.audit.record({ actorId, domain: 'groups', action: 'group.member.role', targetType: 'group', targetId: id, meta: { identityId, role } });
    void D9Emit.roleChanged(actorId, id, { identityId, role });
    return m;
  }
  async removeMember(id: string, actorId: string, identityId: string) {
    await this.assertRole(id, actorId, ['owner', 'admin']);
    await this.repo.removeMember(id, identityId);
    await this.audit.record({ actorId, domain: 'groups', action: 'group.member.remove', targetType: 'group', targetId: id, meta: { identityId } });
    void D9Emit.memberBanned(actorId, id, { identityId, groupId: id });
    return { ok: true };
  }

  // ---------- join requests ----------
  async listJoinRequests(id: string, actorId: string) {
    await this.assertRole(id, actorId, ['owner', 'admin', 'moderator']);
    return envelope(await this.repo.listJoinRequests(id));
  }
  async decideJoinRequest(id: string, actorId: string, requestId: string, decision: 'approve'|'reject', reason?: string) {
    await this.assertRole(id, actorId, ['owner', 'admin', 'moderator']);
    const r = await this.repo.decideJoinRequest(id, requestId, decision);
    if (!r) throw new NotFoundException('request_not_found');
    await this.audit.record({ actorId, domain: 'groups', action: `group.request.${decision}`, targetType: 'group', targetId: id, meta: { requestId, reason: reason ?? null } });
    return r;
  }

  // ---------- channels ----------
  async listChannels(id: string, viewerId: string|null) {
    const g = await this.repo.get(id); if (!g) throw new NotFoundException('group_not_found');
    if (g.type !== 'public') await this.assertMember(id, viewerId);
    return envelope(await this.repo.listChannels(id));
  }
  async addChannel(id: string, actorId: string, dto: any) {
    await this.assertRole(id, actorId, ['owner', 'admin']);
    const c = await this.repo.addChannel(id, dto);
    await this.audit.record({ actorId, domain: 'groups', action: 'group.channel.add', targetType: 'group', targetId: id, meta: { channelId: c.id } });
    return c;
  }

  // ---------- posts ----------
  async listPosts(id: string, viewerId: string|null, opts: { channelId?: string|null; limit?: number; cursor?: string|null }) {
    const g = await this.repo.get(id); if (!g) throw new NotFoundException('group_not_found');
    if (g.type !== 'public') await this.assertMember(id, viewerId);
    return this.repo.listPosts(id, { channelId: opts.channelId, limit: opts.limit ?? 20, cursor: opts.cursor ?? null });
  }
  async addPost(id: string, actorId: string, dto: any) {
    const g = await this.repo.get(id); if (!g) throw new NotFoundException('group_not_found');
    const m = await this.repo.getMembership(id, actorId);
    if (g.postingPolicy === 'mods_only' && !['owner', 'admin', 'moderator'].includes(m?.role)) throw new ForbiddenException('posting_restricted');
    if (g.postingPolicy === 'members'   && m?.status !== 'active') throw new ForbiddenException('members_only');
    const p = await this.repo.addPost(id, actorId, dto);
    await this.audit.record({ actorId, domain: 'groups', action: 'group.post.create', targetType: 'post', targetId: p.id, meta: { groupId: id } });
    void D9Emit.postCreated(actorId, p.id, { groupId: id, authorId: actorId });
    return p;
  }
  async updatePost(id: string, actorId: string, postId: string, patch: any) {
    const post = await this.repo.getPost(postId); if (!post) throw new NotFoundException('post_not_found');
    if (post.authorId !== actorId) await this.assertRole(id, actorId, ['owner', 'admin', 'moderator']);
    const p = await this.repo.updatePost(id, postId, patch);
    await this.audit.record({ actorId, domain: 'groups', action: 'group.post.update', targetType: 'post', targetId: postId });
    if (patch?.pinned === true) void D9Emit.postPinned(actorId, postId, { groupId: id });
    return p;
  }
  async moderatePost(id: string, actorId: string, postId: string, action: string, reason?: string) {
    await this.assertRole(id, actorId, ['owner', 'admin', 'moderator']);
    const patch: any = {};
    if (action === 'hide')    patch.status = 'hidden';
    if (action === 'unhide')  patch.status = 'active';
    if (action === 'delete')  patch.status = 'deleted';
    if (action === 'pin')     patch.pinned = true;
    if (action === 'unpin')   patch.pinned = false;
    if (action === 'lock')    patch.locked = true;
    if (action === 'unlock')  patch.locked = false;
    const p = await this.repo.updatePost(id, postId, patch);
    if (!p) throw new NotFoundException('post_not_found');
    await this.audit.record({ actorId, domain: 'groups', action: `group.post.${action}`, targetType: 'post', targetId: postId, meta: { reason: reason ?? null } });
    return p;
  }

  // ---------- reactions / comments ----------
  async toggleReaction(postId: string, userId: string, emoji: string) { return this.repo.toggleReaction(postId, userId, emoji); }
  async listComments(postId: string)                                  { return envelope(await this.repo.listComments(postId)); }
  async addComment(id: string, actorId: string, postId: string, dto: any) {
    const post = await this.repo.getPost(postId); if (!post) throw new NotFoundException('post_not_found');
    if (post.locked) throw new ForbiddenException('post_locked');
    await this.assertMember(id, actorId);
    const c = await this.repo.addComment(postId, actorId, dto);
    await this.audit.record({ actorId, domain: 'groups', action: 'group.comment.create', targetType: 'comment', targetId: c.id, meta: { postId } });
    return c;
  }

  // ---------- events ----------
  async listEvents(id: string, viewerId: string|null) {
    const g = await this.repo.get(id); if (!g) throw new NotFoundException('group_not_found');
    if (g.type !== 'public') await this.assertMember(id, viewerId);
    return envelope(await this.repo.listEvents(id));
  }
  async addEvent(id: string, actorId: string, dto: any) {
    await this.assertRole(id, actorId, ['owner', 'admin', 'moderator']);
    const e = await this.repo.addEvent(id, dto);
    await this.audit.record({ actorId, domain: 'groups', action: 'group.event.create', targetType: 'event', targetId: e.id, meta: { groupId: id } });
    return e;
  }
  async rsvp(id: string, actorId: string, eventId: string, status: 'going'|'interested'|'declined') {
    await this.assertMember(id, actorId);
    return this.repo.rsvp(eventId, actorId, status);
  }

  // ---------- invites ----------
  async createInvites(id: string, actorId: string, dto: any) {
    await this.assertRole(id, actorId, ['owner', 'admin', 'moderator']);
    const arr = await this.repo.createInvites(id, actorId, dto);
    await this.audit.record({ actorId, domain: 'groups', action: 'group.invite.create', targetType: 'group', targetId: id, meta: { count: arr.length } });
    for (const inv of arr) void D9Emit.memberInvited(actorId, (inv as any).id ?? id, { groupId: id, invite: inv });
    return envelope(arr);
  }
  async listInvites(id: string, actorId: string) {
    await this.assertRole(id, actorId, ['owner', 'admin', 'moderator']);
    return envelope(await this.repo.listInvites(id));
  }

  // ---------- reports / moderation ----------
  async createReport(id: string, reporterId: string, targetType: 'post'|'comment'|'member', targetId: string, dto: any) {
    const r = await this.repo.createReport(id, reporterId, targetType, targetId, dto);
    await this.audit.record({ actorId: reporterId, domain: 'groups', action: 'group.report.create', targetType, targetId, meta: { reason: dto.reason, groupId: id } });
    return r;
  }
  async listReports(id: string, actorId: string, status: 'open'|'all' = 'open') {
    await this.assertRole(id, actorId, ['owner', 'admin', 'moderator']);
    return envelope(await this.repo.listReports(id, status));
  }
  async resolveReport(id: string, actorId: string, reportId: string, status: 'resolved'|'dismissed') {
    await this.assertRole(id, actorId, ['owner', 'admin', 'moderator']);
    const r = await this.repo.resolveReport(id, reportId, status);
    if (!r) throw new NotFoundException('report_not_found');
    await this.audit.record({ actorId, domain: 'groups', action: `group.report.${status}`, targetType: 'report', targetId: reportId });
    return r;
  }

  // ---------- analytics summary ----------
  async summary(id: string, actorId: string) {
    await this.assertRole(id, actorId, ['owner', 'admin', 'moderator']);
    const g = await this.repo.get(id); if (!g) throw new NotFoundException('group_not_found');
    const members  = await this.repo.listMembers(id);
    const posts    = await this.repo.listPosts(id, { limit: 1000, cursor: null });
    const events   = await this.repo.listEvents(id);
    const reports  = await this.repo.listReports(id, 'open');
    const requests = await this.repo.listJoinRequests(id);
    const now = Date.now();
    const activePosts7d = posts.items.filter((p: any) => now - new Date(p.createdAt).getTime() < 7 * 86400 * 1000).length;
    return {
      members: members.length,
      activeMembers7d: new Set(posts.items.filter((p: any) => now - new Date(p.createdAt).getTime() < 7 * 86400 * 1000).map((p: any) => p.authorId)).size,
      posts: posts.total,
      posts7d: activePosts7d,
      events: events.length,
      pendingRequests: requests.length,
      openReports: reports.length,
    };
  }

  // ---------- guards ----------
  private async assertMember(id: string, identityId: string|null) {
    if (!identityId) throw new ForbiddenException('not_a_member');
    const m = await this.repo.getMembership(id, identityId);
    if (!m || m.status !== 'active') throw new ForbiddenException('not_a_member');
  }
  private async assertRole(id: string, identityId: string, roles: string[]) {
    const m = await this.repo.getMembership(id, identityId);
    if (!m || m.status !== 'active' || !roles.includes(m.role)) throw new ForbiddenException('insufficient_role');
  }
}
