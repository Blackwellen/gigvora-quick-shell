import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { OrgMembersSeatsRepository } from './org-members-seats.repository';
import {
  MEMBER_TRANSITIONS, INVITATION_TRANSITIONS,
  MemberStatus, InvitationStatus,
  InviteMemberDto, TransitionMemberDto, ChangeRoleDto, UpsertRoleDto,
} from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';

@Injectable()
export class OrgMembersSeatsService {
  private readonly logger = new Logger(OrgMembersSeatsService.name);
  constructor(private readonly repo: OrgMembersSeatsRepository) {}

  async overview(orgId: string) {
    const [members, seats, invitations, roles, byRole, seatTotals] = await Promise.all([
      this.repo.listMembers(orgId, { page: 1, pageSize: 25 }),
      this.repo.listSeats(orgId, {}),
      this.repo.listInvitations(orgId),
      this.repo.listRoles(orgId),
      this.repo.countByRole(orgId).catch(() => []),
      this.repo.seatTotals(orgId).catch(() => []),
    ]);

    const activeMembers = members.items.filter((m: any) => m.status === 'active').length;
    const suspended = members.items.filter((m: any) => m.status === 'suspended').length;
    const pendingInvites = invitations.filter((i: any) => i.status === 'pending').length;
    const seatsAvailable = seats.filter((s: any) => s.status === 'available').length;
    const seatsAssigned = seats.filter((s: any) => s.status === 'assigned').length;
    const seatsLocked = seats.filter((s: any) => s.status === 'locked').length;
    const totalSeatCostCents = seats.reduce((s: number, x: any) => s + (x.costCents || 0), 0);

    const insights = await this.fetchInsights(orgId, {
      activeMembers, suspended, pendingInvites, seatsAvailable, seatsAssigned,
      seatUtilization: seats.length ? seatsAssigned / seats.length : 0,
      ownerCount: members.items.filter((m: any) => m.roleKey === 'owner').length,
    }).catch((e) => {
      this.logger.warn(`analytics insights fallback: ${(e as Error).message}`);
      return this.fallbackInsights({ pendingInvites, seatsAvailable, seatsAssigned, seatsLocked });
    });

    return {
      kpis: {
        activeMembers, suspended,
        pendingInvitations: pendingInvites,
        seats: { total: seats.length, assigned: seatsAssigned, available: seatsAvailable, locked: seatsLocked },
        totalSeatCostCents,
        rolesCount: roles.length,
      },
      members: members.items.slice(0, 12),
      seats: seats.slice(0, 12),
      invitations: invitations.slice(0, 12),
      roles,
      countsByRole: byRole,
      seatTotals,
      insights,
      computedAt: new Date().toISOString(),
    };
  }

  private async fetchInsights(orgId: string, signals: any) {
    try {
      const res = await fetch(`${ANALYTICS_BASE}/org-members-seats/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, signals }), signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return (await res.json()).insights ?? [];
    } catch (e) { this.logger.warn(`analytics down: ${(e as Error).message}`); }
    return this.fallbackInsights(signals);
  }

  private fallbackInsights(s: { pendingInvites: number; seatsAvailable: number; seatsAssigned: number; seatsLocked: number }) {
    const out: any[] = [];
    if (s.pendingInvites > 0) out.push({ id: 'pending-invites', severity: 'info', title: `${s.pendingInvites} pending invitation(s)`, body: 'Follow up or revoke.' });
    if (s.seatsAvailable === 0 && s.seatsAssigned > 0) out.push({ id: 'no-seats', severity: 'warn', title: 'No seats available', body: 'Purchase additional seats to invite more members.' });
    if (s.seatsLocked > 0) out.push({ id: 'locked', severity: 'warn', title: `${s.seatsLocked} seat(s) locked`, body: 'Locked seats cannot be assigned. Review billing.' });
    if (!out.length) out.push({ id: 'all-clear', severity: 'success', title: 'Org member controls healthy', body: 'No outstanding signals.' });
    return out;
  }

  // Members
  listMembers(orgId: string, q: any) { return this.repo.listMembers(orgId, q); }

  async transitionMember(orgId: string, id: string, dto: TransitionMemberDto, actorId: string, req?: { ip?: string; userAgent?: string }) {
    const current = await this.repo.getMember(orgId, id);
    if (!current) throw new NotFoundException('member not found');
    const allowed = MEMBER_TRANSITIONS[current.status as MemberStatus] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`invalid transition: ${current.status} → ${dto.status}`);
    }
    if (current.roleKey === 'owner' && dto.status === 'removed') {
      const all = await this.repo.listMembers(orgId, { page: 1, pageSize: 100 });
      const owners = all.items.filter((m: any) => m.roleKey === 'owner' && m.status === 'active').length;
      if (owners <= 1) throw new ConflictException('cannot remove the last owner');
    }
    const row = await this.repo.updateMemberStatus(id, dto.status);
    if (dto.status === 'removed' && current.seatId) {
      await this.repo.releaseSeat(current.seatId);
      await this.repo.assignSeatToMember(id, null);
    }
    await this.repo.recordAudit(orgId, actorId, `member.${dto.status}`,
      { type: 'member', id }, { from: current.status, to: dto.status, reason: dto.reason }, req);
    return row;
  }

  async changeMemberRole(orgId: string, id: string, dto: ChangeRoleDto, actorId: string, req?: any) {
    const [member, role] = await Promise.all([this.repo.getMember(orgId, id), this.repo.getRoleByKey(orgId, dto.roleKey)]);
    if (!member) throw new NotFoundException('member not found');
    if (!role) throw new BadRequestException(`role not found: ${dto.roleKey}`);
    if (member.roleKey === 'owner' && dto.roleKey !== 'owner') {
      const all = await this.repo.listMembers(orgId, { page: 1, pageSize: 100 });
      const owners = all.items.filter((m: any) => m.roleKey === 'owner' && m.status === 'active').length;
      if (owners <= 1) throw new ConflictException('cannot demote the last owner');
    }
    const row = await this.repo.updateMemberRole(id, dto.roleKey);
    await this.repo.recordAudit(orgId, actorId, 'member.role_changed',
      { type: 'member', id }, { from: member.roleKey, to: dto.roleKey }, req);
    return row;
  }

  // Invitations
  listInvitations(orgId: string, status?: InvitationStatus) { return this.repo.listInvitations(orgId, status); }

  async invite(orgId: string, dto: InviteMemberDto, actorId: string, req?: any) {
    const role = await this.repo.getRoleByKey(orgId, dto.roleKey);
    if (!role) throw new BadRequestException(`role not found: ${dto.roleKey}`);
    const seat = await this.repo.getAvailableSeat(orgId, dto.seatType);
    if (!seat) throw new ConflictException(`no available seats of type ${dto.seatType}`);
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 86400_000);
    const row = await this.repo.createInvitation({
      orgIdentityId: orgId, email: dto.email, roleKey: dto.roleKey, seatType: dto.seatType,
      status: 'pending', invitedBy: actorId, token, expiresAt, meta: { message: dto.message ?? null },
    });
    await this.repo.recordAudit(orgId, actorId, 'invitation.created',
      { type: 'invitation', id: row.id }, { email: dto.email, roleKey: dto.roleKey, seatType: dto.seatType }, req);
    return row;
  }

  async revokeInvitation(orgId: string, id: string, actorId: string, req?: any) {
    const current = await this.repo.getInvitation(orgId, id);
    if (!current) throw new NotFoundException('invitation not found');
    const allowed = INVITATION_TRANSITIONS[current.status as InvitationStatus] ?? [];
    if (!allowed.includes('revoked')) {
      throw new BadRequestException(`cannot revoke from status: ${current.status}`);
    }
    const row = await this.repo.revokeInvitation(id);
    await this.repo.recordAudit(orgId, actorId, 'invitation.revoked',
      { type: 'invitation', id }, { from: current.status, to: 'revoked' }, req);
    return row;
  }

  // Seats
  listSeats(orgId: string, q: any) { return this.repo.listSeats(orgId, q); }

  async assignSeat(orgId: string, seatId: string, memberId: string, actorId: string, req?: any) {
    const [seat, member] = await Promise.all([this.repo.getSeat(orgId, seatId), this.repo.getMember(orgId, memberId)]);
    if (!seat) throw new NotFoundException('seat not found');
    if (!member) throw new NotFoundException('member not found');
    if (seat.status !== 'available') throw new ConflictException(`seat is ${seat.status}`);
    if (member.seatId) await this.repo.releaseSeat(member.seatId);
    await this.repo.assignSeat(seatId, memberId);
    const row = await this.repo.assignSeatToMember(memberId, seatId);
    await this.repo.recordAudit(orgId, actorId, 'seat.assigned',
      { type: 'seat', id: seatId }, { memberId }, req);
    return row;
  }

  async releaseSeat(orgId: string, seatId: string, actorId: string, req?: any) {
    const seat = await this.repo.getSeat(orgId, seatId);
    if (!seat) throw new NotFoundException('seat not found');
    if (seat.assignedMemberId) await this.repo.assignSeatToMember(seat.assignedMemberId, null);
    const row = await this.repo.releaseSeat(seatId);
    await this.repo.recordAudit(orgId, actorId, 'seat.released',
      { type: 'seat', id: seatId }, { previousMember: seat.assignedMemberId }, req);
    return row;
  }

  async purchaseSeats(orgId: string, count: number, seatType: string, plan: string, actorId: string, req?: any) {
    const cost = seatType === 'viewer' ? 1900 : seatType === 'guest' ? 0 : 4900;
    const rows = await this.repo.createSeats(orgId, count, seatType, plan, cost);
    await this.repo.recordAudit(orgId, actorId, 'seats.purchased',
      { type: 'seat' }, { count, seatType, plan, costCents: cost * count }, req);
    return rows;
  }

  // Roles
  listRoles(orgId: string) { return this.repo.listRoles(orgId); }

  async upsertRole(orgId: string, dto: UpsertRoleDto, actorId: string, req?: any) {
    const before = await this.repo.getRoleByKey(orgId, dto.key);
    try {
      const row = await this.repo.upsertRole(orgId, dto);
      await this.repo.recordAudit(orgId, actorId, before ? 'role.updated' : 'role.created',
        { type: 'role', id: row.id },
        before ? { from: before.permissions, to: dto.permissions } : { permissions: dto.permissions }, req);
      return row;
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }

  async deleteRole(orgId: string, key: string, actorId: string, req?: any) {
    try {
      const row = await this.repo.deleteRole(orgId, key);
      if (!row) throw new NotFoundException('role not found');
      await this.repo.recordAudit(orgId, actorId, 'role.deleted',
        { type: 'role', id: row.id }, { key }, req);
      return row;
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new BadRequestException((e as Error).message);
    }
  }

  // Audit
  listAudit(orgId: string, limit = 100) { return this.repo.listAudit(orgId, limit); }
}
