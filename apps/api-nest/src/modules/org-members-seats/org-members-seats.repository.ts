import { Injectable, Inject } from '@nestjs/common';
import { and, eq, desc, sql, or, ilike, isNull } from 'drizzle-orm';
import {
  omsRoles, omsMembers, omsSeats, omsInvitations, omsAuditEvents,
} from '@gigvora/db/schema/org-members-seats';

export type DrizzleDb = any;

@Injectable()
export class OrgMembersSeatsRepository {
  constructor(@Inject('DRIZZLE_DB') private readonly db: DrizzleDb) {}

  // Roles
  listRoles(orgId: string) {
    return this.db.select().from(omsRoles).where(eq(omsRoles.orgIdentityId, orgId)).orderBy(omsRoles.key);
  }
  async getRoleByKey(orgId: string, key: string) {
    const rows = await this.db.select().from(omsRoles)
      .where(and(eq(omsRoles.orgIdentityId, orgId), eq(omsRoles.key, key))).limit(1);
    return rows[0] ?? null;
  }
  async upsertRole(orgId: string, dto: { key: string; name: string; description?: string; permissions: string[] }) {
    const existing = await this.getRoleByKey(orgId, dto.key);
    if (existing) {
      if (existing.isSystem) throw new Error('cannot modify system role');
      const [row] = await this.db.update(omsRoles)
        .set({ name: dto.name, description: dto.description ?? null, permissions: dto.permissions })
        .where(eq(omsRoles.id, existing.id)).returning();
      return row;
    }
    const [row] = await this.db.insert(omsRoles).values({
      orgIdentityId: orgId, key: dto.key, name: dto.name,
      description: dto.description ?? null, permissions: dto.permissions, isSystem: false,
    }).returning();
    return row;
  }
  async deleteRole(orgId: string, key: string) {
    const existing = await this.getRoleByKey(orgId, key);
    if (!existing) return null;
    if (existing.isSystem) throw new Error('cannot delete system role');
    await this.db.delete(omsRoles).where(eq(omsRoles.id, existing.id));
    return existing;
  }

  // Members
  async listMembers(orgId: string, q: any) {
    const conds = [eq(omsMembers.orgIdentityId, orgId)];
    if (q.status) conds.push(eq(omsMembers.status, q.status));
    if (q.roleKey) conds.push(eq(omsMembers.roleKey, q.roleKey));
    if (q.search) conds.push(or(ilike(omsMembers.fullName, `%${q.search}%`), ilike(omsMembers.email, `%${q.search}%`))!);
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(omsMembers).where(and(...conds))
      .orderBy(desc(omsMembers.joinedAt)).limit(q.pageSize).offset(offset);
    const totalRow = await this.db.execute(
      sql`SELECT COUNT(*)::int AS c FROM oms_members WHERE org_identity_id = ${orgId}
          ${q.status ? sql` AND status = ${q.status}` : sql``}
          ${q.roleKey ? sql` AND role_key = ${q.roleKey}` : sql``}`
    );
    const total = Number(((totalRow as any).rows ?? totalRow)[0]?.c ?? 0);
    return { items, page: q.page, pageSize: q.pageSize, total };
  }
  async getMember(orgId: string, id: string) {
    const rows = await this.db.select().from(omsMembers)
      .where(and(eq(omsMembers.id, id), eq(omsMembers.orgIdentityId, orgId))).limit(1);
    return rows[0] ?? null;
  }
  async updateMemberStatus(id: string, status: string, removedAt?: Date | null) {
    const patch: any = { status };
    if (status === 'removed') patch.removedAt = removedAt ?? new Date();
    const [row] = await this.db.update(omsMembers).set(patch)
      .where(eq(omsMembers.id, id)).returning();
    return row;
  }
  async updateMemberRole(id: string, roleKey: string) {
    const [row] = await this.db.update(omsMembers).set({ roleKey })
      .where(eq(omsMembers.id, id)).returning();
    return row;
  }
  async assignSeatToMember(memberId: string, seatId: string | null) {
    const [row] = await this.db.update(omsMembers).set({ seatId })
      .where(eq(omsMembers.id, memberId)).returning();
    return row;
  }
  async countByRole(orgId: string) {
    const rows = await this.db.execute(sql`
      SELECT role_key, COUNT(*)::int AS count FROM oms_members
      WHERE org_identity_id = ${orgId} AND status = 'active'
      GROUP BY role_key`);
    return (rows as any).rows ?? rows;
  }

  // Seats
  async listSeats(orgId: string, q: any) {
    const conds = [eq(omsSeats.orgIdentityId, orgId)];
    if (q.status) conds.push(eq(omsSeats.status, q.status));
    if (q.seatType) conds.push(eq(omsSeats.seatType, q.seatType));
    return this.db.select().from(omsSeats).where(and(...conds)).orderBy(desc(omsSeats.createdAt)).limit(500);
  }
  async getSeat(orgId: string, id: string) {
    const rows = await this.db.select().from(omsSeats)
      .where(and(eq(omsSeats.id, id), eq(omsSeats.orgIdentityId, orgId))).limit(1);
    return rows[0] ?? null;
  }
  async getAvailableSeat(orgId: string, seatType: string) {
    const rows = await this.db.select().from(omsSeats)
      .where(and(eq(omsSeats.orgIdentityId, orgId), eq(omsSeats.status, 'available'),
        eq(omsSeats.seatType, seatType), isNull(omsSeats.assignedMemberId))).limit(1);
    return rows[0] ?? null;
  }
  async assignSeat(seatId: string, memberId: string) {
    const [row] = await this.db.update(omsSeats)
      .set({ status: 'assigned', assignedMemberId: memberId, assignedAt: new Date() })
      .where(eq(omsSeats.id, seatId)).returning();
    return row;
  }
  async releaseSeat(seatId: string) {
    const [row] = await this.db.update(omsSeats)
      .set({ status: 'available', assignedMemberId: null, assignedAt: null })
      .where(eq(omsSeats.id, seatId)).returning();
    return row;
  }
  async createSeats(orgId: string, count: number, seatType: string, plan: string, costCents = 4900) {
    const values = Array.from({ length: count }, () => ({
      orgIdentityId: orgId, plan, seatType, status: 'available' as const, costCents,
    }));
    return this.db.insert(omsSeats).values(values).returning();
  }
  async seatTotals(orgId: string) {
    const rows = await this.db.execute(sql`
      SELECT status, seat_type, COUNT(*)::int AS count, SUM(cost_cents)::bigint AS total_cost_cents
      FROM oms_seats WHERE org_identity_id = ${orgId}
      GROUP BY status, seat_type`);
    return (rows as any).rows ?? rows;
  }

  // Invitations
  async listInvitations(orgId: string, status?: string) {
    const conds = [eq(omsInvitations.orgIdentityId, orgId)];
    if (status) conds.push(eq(omsInvitations.status, status));
    return this.db.select().from(omsInvitations).where(and(...conds))
      .orderBy(desc(omsInvitations.createdAt)).limit(200);
  }
  async getInvitation(orgId: string, id: string) {
    const rows = await this.db.select().from(omsInvitations)
      .where(and(eq(omsInvitations.id, id), eq(omsInvitations.orgIdentityId, orgId))).limit(1);
    return rows[0] ?? null;
  }
  async createInvitation(values: any) {
    const [row] = await this.db.insert(omsInvitations).values(values).returning();
    return row;
  }
  async revokeInvitation(id: string) {
    const [row] = await this.db.update(omsInvitations)
      .set({ status: 'revoked', revokedAt: new Date() })
      .where(eq(omsInvitations.id, id)).returning();
    return row;
  }

  // Audit
  async recordAudit(orgId: string, actorId: string | null, action: string,
                    target: { type?: string; id?: string } = {}, diff: any = {},
                    req?: { ip?: string; userAgent?: string }) {
    await this.db.insert(omsAuditEvents).values({
      orgIdentityId: orgId, actorIdentityId: actorId ?? null, action,
      targetType: target.type ?? null, targetId: target.id ?? null, diff,
      ip: req?.ip ?? null, userAgent: req?.userAgent ?? null,
    });
  }
  listAudit(orgId: string, limit = 100) {
    return this.db.select().from(omsAuditEvents)
      .where(eq(omsAuditEvents.orgIdentityId, orgId))
      .orderBy(desc(omsAuditEvents.createdAt)).limit(limit);
  }
}
