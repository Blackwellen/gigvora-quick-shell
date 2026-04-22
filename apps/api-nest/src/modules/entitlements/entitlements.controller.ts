import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import {
  CancelSubscriptionDto, ChangePlanDto, CheckAccessDto, CreateSubscriptionDto,
  GrantRoleDto, OverrideEntitlementDto, RevokeRoleDto, SwitchRoleDto, UpsertPlanDto,
} from './dto';
import { EntitlementsService } from './entitlements.service';

function ctx(req: Request) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null;
  const userAgent = (req.headers['user-agent'] as string) ?? null;
  return { ip, userAgent };
}
const uid = (req: Request) => (req as any).user?.userId as string;

@Controller('entitlements')
export class EntitlementsController {
  constructor(private readonly svc: EntitlementsService) {}

  // public catalogue
  @Get('plans') plans() { return this.svc.listPlans(); }

  // self
  @UseGuards(AuthGuard('jwt')) @Get('me')
  me(@Req() req: Request, @Query('orgId') orgId?: string) {
    return this.svc.resolve(uid(req), orgId ?? null);
  }
  @UseGuards(AuthGuard('jwt')) @Post('check')
  check(@Body() dto: CheckAccessDto, @Req() req: Request) {
    return this.svc.checkAccess(uid(req), dto, ctx(req));
  }
  @UseGuards(AuthGuard('jwt')) @Post('roles/switch')
  switch(@Body() dto: SwitchRoleDto, @Req() req: Request) {
    return this.svc.switchRole(uid(req), dto.role, dto.orgId ?? null, ctx(req));
  }
  @UseGuards(AuthGuard('jwt')) @Get('me/denials')
  denials(@Req() req: Request) { return this.svc.recentDenials(uid(req)); }

  // subscriptions (self or org)
  @UseGuards(AuthGuard('jwt')) @Get('subscriptions')
  subs(@Req() req: Request, @Query('orgId') orgId?: string) {
    return this.svc.listSubscriptions(orgId ? { orgId } : { identityId: uid(req) });
  }
  @UseGuards(AuthGuard('jwt')) @Post('subscriptions')
  createSub(@Body() dto: CreateSubscriptionDto, @Req() req: Request) {
    return this.svc.createSubscription({ ...dto, identityId: dto.identityId ?? uid(req) });
  }
  @UseGuards(AuthGuard('jwt')) @Post('subscriptions/change')
  change(@Body() dto: ChangePlanDto, @Req() req: Request) { return this.svc.changePlan(dto, uid(req)); }
  @UseGuards(AuthGuard('jwt')) @Post('subscriptions/cancel')
  cancel(@Body() dto: CancelSubscriptionDto) { return this.svc.cancelSubscription(dto); }

  // ---- admin (TODO: gate with admin role guard once Domain 04 admin guard is wired) ----
  @UseGuards(AuthGuard('jwt')) @Post('admin/plans') upsertPlan(@Body() dto: UpsertPlanDto) { return this.svc.upsertPlan(dto); }
  @UseGuards(AuthGuard('jwt')) @Post('admin/roles/grant') grant(@Body() dto: GrantRoleDto, @Req() req: Request) { return this.svc.grantRole(dto, uid(req)); }
  @UseGuards(AuthGuard('jwt')) @Post('admin/roles/revoke') revoke(@Body() dto: RevokeRoleDto) { return this.svc.revokeRole(dto); }
  @UseGuards(AuthGuard('jwt')) @Post('admin/overrides') override(@Body() dto: OverrideEntitlementDto, @Req() req: Request) { return this.svc.createOverride(dto, uid(req)); }
  @UseGuards(AuthGuard('jwt')) @Post('admin/overrides/:id/revoke') revokeOverride(@Param('id') id: string) { return this.svc.revokeOverride(id); }
}
