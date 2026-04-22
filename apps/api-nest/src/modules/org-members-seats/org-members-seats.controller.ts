import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrgMembersSeatsService } from './org-members-seats.service';
import {
  ListMembersQuerySchema, InviteMemberSchema, TransitionMemberSchema, ChangeRoleSchema,
  TransitionInvitationSchema, ListSeatsQuerySchema, AssignSeatSchema, PurchaseSeatsSchema,
  UpsertRoleSchema, InvitationStatusEnum,
} from './dto';

@Controller('api/v1/org-members-seats')
@UseGuards(AuthGuard('jwt'))
export class OrgMembersSeatsController {
  constructor(private readonly svc: OrgMembersSeatsService) {}

  private reqMeta(req: any) {
    return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] };
  }

  @Get('overview')
  overview(@Req() req: any) { return this.svc.overview(req.user.sub); }

  // Members
  @Get('members')
  listMembers(@Req() req: any, @Query() q: any) {
    return this.svc.listMembers(req.user.sub, ListMembersQuerySchema.parse(q));
  }
  @Patch('members/:id/status')
  transitionMember(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionMember(req.user.sub, id, TransitionMemberSchema.parse(body), req.user.sub, this.reqMeta(req));
  }
  @Patch('members/:id/role')
  changeRole(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.changeMemberRole(req.user.sub, id, ChangeRoleSchema.parse(body), req.user.sub, this.reqMeta(req));
  }

  // Invitations
  @Get('invitations')
  listInvitations(@Req() req: any, @Query('status') status?: string) {
    return this.svc.listInvitations(req.user.sub, status ? InvitationStatusEnum.parse(status) : undefined);
  }
  @Post('invitations')
  invite(@Req() req: any, @Body() body: any) {
    return this.svc.invite(req.user.sub, InviteMemberSchema.parse(body), req.user.sub, this.reqMeta(req));
  }
  @Patch('invitations/:id/status')
  transitionInvitation(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    TransitionInvitationSchema.parse(body);
    return this.svc.revokeInvitation(req.user.sub, id, req.user.sub, this.reqMeta(req));
  }

  // Seats
  @Get('seats')
  listSeats(@Req() req: any, @Query() q: any) {
    return this.svc.listSeats(req.user.sub, ListSeatsQuerySchema.parse(q));
  }
  @Post('seats/:id/assign')
  assignSeat(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const { memberId } = AssignSeatSchema.parse(body);
    return this.svc.assignSeat(req.user.sub, id, memberId, req.user.sub, this.reqMeta(req));
  }
  @Post('seats/:id/release')
  releaseSeat(@Req() req: any, @Param('id') id: string) {
    return this.svc.releaseSeat(req.user.sub, id, req.user.sub, this.reqMeta(req));
  }
  @Post('seats/purchase')
  purchaseSeats(@Req() req: any, @Body() body: any) {
    const dto = PurchaseSeatsSchema.parse(body);
    return this.svc.purchaseSeats(req.user.sub, dto.count, dto.seatType, dto.plan, req.user.sub, this.reqMeta(req));
  }

  // Roles
  @Get('roles')
  listRoles(@Req() req: any) { return this.svc.listRoles(req.user.sub); }
  @Post('roles')
  upsertRole(@Req() req: any, @Body() body: any) {
    return this.svc.upsertRole(req.user.sub, UpsertRoleSchema.parse(body), req.user.sub, this.reqMeta(req));
  }
  @Delete('roles/:key')
  deleteRole(@Req() req: any, @Param('key') key: string) {
    return this.svc.deleteRole(req.user.sub, key, req.user.sub, this.reqMeta(req));
  }

  // Audit
  @Get('audit')
  audit(@Req() req: any, @Query('limit') limit?: string) {
    return this.svc.listAudit(req.user.sub, Math.min(500, Math.max(1, Number(limit) || 100)));
  }
}
