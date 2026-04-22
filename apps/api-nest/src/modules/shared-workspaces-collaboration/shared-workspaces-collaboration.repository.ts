import { Injectable, Inject } from '@nestjs/common';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import {
  swcWorkspaces, swcMembers, swcNotes, swcHandoffs, swcAuditEvents,
} from '@gigvora/db/schema/shared-workspaces-collaboration';

export type DrizzleDb = any;

@Injectable()
export class SharedWorkspacesCollaborationRepository {
  constructor(@Inject('DRIZZLE_DB') private readonly db: DrizzleDb) {}

  // Workspaces
  async listWorkspaces(orgId: string, q: any) {
    const conds = [eq(swcWorkspaces.orgIdentityId, orgId)];
    if (q.status) conds.push(eq(swcWorkspaces.status, q.status));
    if (q.search) conds.push(or(ilike(swcWorkspaces.name, `%${q.search}%`), ilike(swcWorkspaces.slug, `%${q.search}%`))!);
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(swcWorkspaces).where(and(...conds))
      .orderBy(desc(swcWorkspaces.updatedAt)).limit(q.pageSize).offset(offset);
    const totalRow = await this.db.execute(
      sql`SELECT COUNT(*)::int AS c FROM swc_workspaces WHERE org_identity_id = ${orgId}
          ${q.status ? sql` AND status = ${q.status}` : sql``}`
    );
    const total = Number(((totalRow as any).rows ?? totalRow)[0]?.c ?? 0);
    return { items, page: q.page, pageSize: q.pageSize, total };
  }
  async getWorkspace(orgId: string, id: string) {
    const rows = await this.db.select().from(swcWorkspaces)
      .where(and(eq(swcWorkspaces.id, id), eq(swcWorkspaces.orgIdentityId, orgId))).limit(1);
    return rows[0] ?? null;
  }
  async getWorkspaceBySlug(orgId: string, slug: string) {
    const rows = await this.db.select().from(swcWorkspaces)
      .where(and(eq(swcWorkspaces.slug, slug), eq(swcWorkspaces.orgIdentityId, orgId))).limit(1);
    return rows[0] ?? null;
  }
  async createWorkspace(values: any) {
    const [row] = await this.db.insert(swcWorkspaces).values(values).returning();
    return row;
  }
  async updateWorkspace(id: string, patch: any) {
    const [row] = await this.db.update(swcWorkspaces)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(swcWorkspaces.id, id)).returning();
    return row;
  }
  async setWorkspaceStatus(id: string, status: string) {
    const patch: any = { status, updatedAt: new Date() };
    if (status === 'archived') patch.archivedAt = new Date();
    if (status === 'active') patch.archivedAt = null;
    const [row] = await this.db.update(swcWorkspaces).set(patch).where(eq(swcWorkspaces.id, id)).returning();
    return row;
  }

  // Members
  listMembers(workspaceId: string) {
    return this.db.select().from(swcMembers)
      .where(and(eq(swcMembers.workspaceId, workspaceId), eq(swcMembers.status, 'active')))
      .orderBy(desc(swcMembers.joinedAt));
  }
  async getMember(workspaceId: string, memberIdentityId: string) {
    const rows = await this.db.select().from(swcMembers)
      .where(and(eq(swcMembers.workspaceId, workspaceId), eq(swcMembers.memberIdentityId, memberIdentityId))).limit(1);
    return rows[0] ?? null;
  }
  async addMember(values: any) {
    const [row] = await this.db.insert(swcMembers).values(values).returning();
    return row;
  }
  async updateMemberRole(id: string, role: string) {
    const [row] = await this.db.update(swcMembers).set({ role }).where(eq(swcMembers.id, id)).returning();
    return row;
  }
  async removeMember(id: string) {
    const [row] = await this.db.update(swcMembers)
      .set({ status: 'removed', removedAt: new Date() })
      .where(eq(swcMembers.id, id)).returning();
    return row;
  }

  // Notes
  async listNotes(workspaceId: string, q: any) {
    const conds = [eq(swcNotes.workspaceId, workspaceId)];
    if (q.status) conds.push(eq(swcNotes.status, q.status));
    if (q.search) conds.push(or(ilike(swcNotes.title, `%${q.search}%`), ilike(swcNotes.body, `%${q.search}%`))!);
    if (typeof q.pinned === 'boolean') conds.push(eq(swcNotes.pinned, q.pinned));
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(swcNotes).where(and(...conds))
      .orderBy(desc(swcNotes.pinned), desc(swcNotes.updatedAt)).limit(q.pageSize).offset(offset);
    const totalRow = await this.db.execute(
      sql`SELECT COUNT(*)::int AS c FROM swc_notes WHERE workspace_id = ${workspaceId}
          ${q.status ? sql` AND status = ${q.status}` : sql``}`
    );
    const total = Number(((totalRow as any).rows ?? totalRow)[0]?.c ?? 0);
    return { items, page: q.page, pageSize: q.pageSize, total };
  }
  async getNote(workspaceId: string, id: string) {
    const rows = await this.db.select().from(swcNotes)
      .where(and(eq(swcNotes.id, id), eq(swcNotes.workspaceId, workspaceId))).limit(1);
    return rows[0] ?? null;
  }
  async createNote(values: any) {
    const [row] = await this.db.insert(swcNotes).values(values).returning();
    return row;
  }
  async updateNote(id: string, patch: any) {
    const [row] = await this.db.update(swcNotes).set({ ...patch, updatedAt: new Date() })
      .where(eq(swcNotes.id, id)).returning();
    return row;
  }
  async setNoteStatus(id: string, status: string) {
    const patch: any = { status, updatedAt: new Date() };
    if (status === 'published') patch.publishedAt = new Date();
    if (status === 'archived') patch.archivedAt = new Date();
    const [row] = await this.db.update(swcNotes).set(patch).where(eq(swcNotes.id, id)).returning();
    return row;
  }

  // Handoffs
  async listHandoffs(workspaceId: string, q: any, currentIdentityId?: string) {
    const conds = [eq(swcHandoffs.workspaceId, workspaceId)];
    if (q.status) conds.push(eq(swcHandoffs.status, q.status));
    if (q.priority) conds.push(eq(swcHandoffs.priority, q.priority));
    if (q.toMe && currentIdentityId) conds.push(eq(swcHandoffs.toIdentityId, currentIdentityId));
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(swcHandoffs).where(and(...conds))
      .orderBy(desc(swcHandoffs.updatedAt)).limit(q.pageSize).offset(offset);
    const totalRow = await this.db.execute(
      sql`SELECT COUNT(*)::int AS c FROM swc_handoffs WHERE workspace_id = ${workspaceId}
          ${q.status ? sql` AND status = ${q.status}` : sql``}`
    );
    const total = Number(((totalRow as any).rows ?? totalRow)[0]?.c ?? 0);
    return { items, page: q.page, pageSize: q.pageSize, total };
  }
  async getHandoff(workspaceId: string, id: string) {
    const rows = await this.db.select().from(swcHandoffs)
      .where(and(eq(swcHandoffs.id, id), eq(swcHandoffs.workspaceId, workspaceId))).limit(1);
    return rows[0] ?? null;
  }
  async createHandoff(values: any) {
    const [row] = await this.db.insert(swcHandoffs).values(values).returning();
    return row;
  }
  async updateHandoff(id: string, patch: any) {
    const [row] = await this.db.update(swcHandoffs).set({ ...patch, updatedAt: new Date() })
      .where(eq(swcHandoffs.id, id)).returning();
    return row;
  }
  async setHandoffStatus(id: string, status: string, extra: any = {}) {
    const patch: any = { status, updatedAt: new Date(), ...extra };
    if (status === 'accepted') patch.acceptedAt = new Date();
    if (status === 'rejected') patch.rejectedAt = new Date();
    if (status === 'cancelled') patch.cancelledAt = new Date();
    if (status === 'completed') patch.completedAt = new Date();
    const [row] = await this.db.update(swcHandoffs).set(patch).where(eq(swcHandoffs.id, id)).returning();
    return row;
  }

  // Audit
  async recordAudit(workspaceId: string, actorId: string | null, action: string,
                     target: { type?: string; id?: string } = {}, diff: any = {},
                     req?: { ip?: string; userAgent?: string }) {
    await this.db.insert(swcAuditEvents).values({
      workspaceId, actorIdentityId: actorId ?? null, action,
      targetType: target.type ?? null, targetId: target.id ?? null, diff,
      ip: req?.ip ?? null, userAgent: req?.userAgent ?? null,
    });
  }
  listAudit(workspaceId: string, limit = 100) {
    return this.db.select().from(swcAuditEvents)
      .where(eq(swcAuditEvents.workspaceId, workspaceId))
      .orderBy(desc(swcAuditEvents.createdAt)).limit(limit);
  }
}
