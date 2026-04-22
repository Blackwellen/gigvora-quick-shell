import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CompaniesRepository } from './companies.repository';
import { AuditService } from '../workspace/audit.service';
import { D10Emit } from '../domain-bus/domain-emissions';

const WRITE_ROLES = new Set(['owner','admin','editor']);
const ADMIN_ROLES = new Set(['owner','admin']);

export interface PageEnvelope<T> { items: T[]; total: number; limit: number; hasMore: boolean; }

@Injectable()
export class CompaniesService {
  constructor(
    private readonly repo: CompaniesRepository,
    private readonly audit: AuditService,
  ) {}

  async list(q: any): Promise<PageEnvelope<any>> {
    const raw: any = await this.repo.list(q);
    const items: any[] = Array.isArray(raw) ? raw : (raw?.items ?? []);
    const limit = Number(q?.pageSize ?? q?.limit ?? items.length);
    return { items, total: items.length, limit, hasMore: items.length >= limit };
  }

  async detail(idOrSlug: string, viewerId: string | null) {
    const c = (await this.repo.get(idOrSlug)) ?? (await this.repo.getBySlug(idOrSlug));
    if (!c) throw new NotFoundException('Company not found');
    if (c.visibility === 'private') {
      const member = viewerId ? await this.repo.findMember(c.id, viewerId) : null;
      if (!member) throw new ForbiddenException('Private company');
    }
    const [members, locations, links, brand, posts, isFollowing] = await Promise.all([
      this.repo.listMembers(c.id),
      this.repo.listLocations(c.id),
      this.repo.listLinks(c.id),
      this.repo.getBrand(c.id),
      this.repo.listPosts(c.id, 20),
      viewerId ? this.repo.isFollowing(c.id, viewerId) : Promise.resolve(false),
    ]);
    if (viewerId) await this.repo.logView(c.id, viewerId, 'direct');
    return {
      company: c,
      members: members.filter((m: any) => m.isPublic && m.status === 'active'),
      locations, links, brand, posts,
      viewer: { isFollowing, role: viewerId ? (await this.repo.findMember(c.id, viewerId))?.role ?? null : null },
    };
  }

  async create(actorId: string, body: any) {
    if (await this.repo.getBySlug(body.slug)) throw new ForbiddenException('Slug already taken');
    const company = await this.repo.create({ ...body, createdBy: actorId });
    await this.repo.addMember(company.id, { identityId: actorId, role: 'owner', title: 'Founder' });
    await this.audit.record({ actorId, domain: 'companies', action: 'company.create', targetType: 'company', targetId: company.id, meta: { slug: body.slug } });
    void D10Emit.created(actorId, company.id, { slug: body.slug, ownerId: actorId });
    return company;
  }

  private async assertWrite(companyId: string, actorId: string) {
    const m = await this.repo.findMember(companyId, actorId);
    if (!m || !WRITE_ROLES.has(m.role)) throw new ForbiddenException('Insufficient role');
    return m;
  }
  private async assertAdmin(companyId: string, actorId: string) {
    const m = await this.repo.findMember(companyId, actorId);
    if (!m || !ADMIN_ROLES.has(m.role)) throw new ForbiddenException('Admin role required');
    return m;
  }

  async update(companyId: string, actorId: string, patch: any) {
    await this.assertWrite(companyId, actorId);
    const r = await this.repo.update(companyId, patch, actorId);
    await this.audit.record({ actorId, domain: 'companies', action: 'company.update', targetType: 'company', targetId: companyId, meta: { fields: Object.keys(patch ?? {}) } });
    void D10Emit.updated(actorId, companyId, { fields: Object.keys(patch ?? {}) });
    if (patch?.verified === true) void D10Emit.verified(actorId, companyId, {});
    if (patch?.status === 'published' || patch?.published === true) void D10Emit.published(actorId, companyId, {});
    return r;
  }

  async archive(companyId: string, actorId: string) {
    await this.assertAdmin(companyId, actorId);
    const r = await this.repo.archive(companyId, actorId);
    await this.audit.record({ actorId, domain: 'companies', action: 'company.archive', targetType: 'company', targetId: companyId });
    void D10Emit.archived(actorId, companyId, {});
    return r;
  }

  // Members
  async listMembers(companyId: string) { const items = await this.repo.listMembers(companyId); return { items, total: items.length, limit: items.length, hasMore: false }; }
  async invite(companyId: string, actorId: string, body: any) {
    await this.assertAdmin(companyId, actorId);
    const r = await this.repo.addMember(companyId, body);
    await this.audit.record({ actorId, domain: 'companies', action: 'company.member.invite', targetType: 'company', targetId: companyId, meta: { identityId: body.identityId, role: body.role } });
    void D10Emit.teamAdded(actorId, companyId, { identityId: body.identityId, role: body.role });
    return r;
  }
  async setRole(companyId: string, actorId: string, identityId: string, role: string) {
    await this.assertAdmin(companyId, actorId);
    if (identityId === actorId && role !== 'owner') throw new ForbiddenException('Cannot demote yourself');
    const r = await this.repo.updateMemberRole(companyId, identityId, role);
    await this.audit.record({ actorId, domain: 'companies', action: 'company.member.role.change', targetType: 'company', targetId: companyId, meta: { identityId, role } });
    return r;
  }
  async removeMember(companyId: string, actorId: string, identityId: string) {
    if (identityId !== actorId) await this.assertAdmin(companyId, actorId);
    const r = await this.repo.removeMember(companyId, identityId);
    await this.audit.record({ actorId, domain: 'companies', action: identityId === actorId ? 'company.member.leave' : 'company.member.remove', targetType: 'company', targetId: companyId, meta: { identityId } });
    void D10Emit.teamRemoved(actorId, companyId, { identityId });
    return r;
  }

  // Locations
  async listLocations(id: string) { const items = await this.repo.listLocations(id); return { items, total: items.length, limit: items.length, hasMore: false }; }
  async addLocation(id: string, actorId: string, body: any) {
    await this.assertWrite(id, actorId);
    const r = await this.repo.addLocation(id, body);
    await this.audit.record({ actorId, domain: 'companies', action: 'company.location.add', targetType: 'company', targetId: id, meta: { city: body.city } });
    return r;
  }
  async removeLocation(id: string, actorId: string, locId: string) {
    await this.assertWrite(id, actorId);
    const r = await this.repo.removeLocation(id, locId);
    await this.audit.record({ actorId, domain: 'companies', action: 'company.location.remove', targetType: 'location', targetId: locId });
    return r;
  }

  // Links
  async listLinks(id: string) { const items = await this.repo.listLinks(id); return { items, total: items.length, limit: items.length, hasMore: false }; }
  async upsertLink(id: string, actorId: string, body: any) {
    await this.assertWrite(id, actorId);
    const r = await this.repo.upsertLink(id, body);
    await this.audit.record({ actorId, domain: 'companies', action: 'company.link.upsert', targetType: 'company', targetId: id, meta: { kind: body.kind } });
    return r;
  }
  async removeLink(id: string, actorId: string, kind: string) {
    await this.assertWrite(id, actorId);
    const r = await this.repo.removeLink(id, kind);
    await this.audit.record({ actorId, domain: 'companies', action: 'company.link.remove', targetType: 'company', targetId: id, meta: { kind } });
    return r;
  }

  // Followers
  async follow(companyId: string, followerId: string) {
    const r = await this.repo.follow(companyId, followerId);
    await this.audit.record({ actorId: followerId, domain: 'companies', action: 'company.follow', targetType: 'company', targetId: companyId });
    void D10Emit.followerAdded(followerId, companyId, { followerId, companyId });
    return r;
  }
  async unfollow(companyId: string, followerId: string) {
    const r = await this.repo.unfollow(companyId, followerId);
    await this.audit.record({ actorId: followerId, domain: 'companies', action: 'company.unfollow', targetType: 'company', targetId: companyId });
    void D10Emit.followerRemoved(followerId, companyId, { followerId, companyId });
    return r;
  }

  // Posts
  async listPosts(companyId: string, limit = 20) { const items = await this.repo.listPosts(companyId, limit); return { items, total: items.length, limit, hasMore: items.length >= limit }; }
  async addPost(companyId: string, actorId: string, body: any) {
    await this.assertWrite(companyId, actorId);
    const r = await this.repo.addPost(companyId, { ...body, authorId: actorId });
    await this.audit.record({ actorId, domain: 'companies', action: 'company.post.create', targetType: 'company', targetId: companyId, meta: { postId: r?.id } });
    return r;
  }
  async updatePost(companyId: string, actorId: string, id: string, patch: any) {
    await this.assertWrite(companyId, actorId);
    const r = await this.repo.updatePost(companyId, id, patch);
    await this.audit.record({ actorId, domain: 'companies', action: 'company.post.update', targetType: 'post', targetId: id, meta: { fields: Object.keys(patch ?? {}) } });
    return r;
  }
  async removePost(companyId: string, actorId: string, id: string) {
    await this.assertWrite(companyId, actorId);
    const r = await this.repo.removePost(companyId, id);
    await this.audit.record({ actorId, domain: 'companies', action: 'company.post.remove', targetType: 'post', targetId: id });
    return r;
  }

  // Brand
  getBrand(id: string) { return this.repo.getBrand(id); }
  async setBrand(id: string, actorId: string, body: any) {
    await this.assertWrite(id, actorId);
    const r = await this.repo.setBrand(id, body);
    await this.audit.record({ actorId, domain: 'companies', action: 'company.brand.update', targetType: 'company', targetId: id, meta: { fields: Object.keys(body ?? {}) } });
    return r;
  }

  async listAudit(id: string) { const items = await this.repo.listAudit(id); return { items, total: items.length, limit: items.length, hasMore: false }; }
}
