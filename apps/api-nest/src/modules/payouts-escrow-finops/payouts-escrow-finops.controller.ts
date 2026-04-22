import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PayoutsEscrowFinopsService } from './payouts-escrow-finops.service';
import {
  PayoutAccountSchema, InitiatePayoutSchema, TransitionPayoutSchema, PayoutScheduleSchema,
  HoldEscrowSchema, ReleaseEscrowSchema, RefundEscrowSchema,
  OpenHoldSchema, TransitionHoldSchema, OpenDisputeSchema, TransitionDisputeSchema,
  ListPayoutsQuerySchema, ReconcileSchema, WebhookEventSchema,
} from './dto';

@Controller('api/v1/payouts-escrow-finops')
@UseGuards(AuthGuard('jwt'))
export class PayoutsEscrowFinopsController {
  constructor(private readonly svc: PayoutsEscrowFinopsService) {}
  private reqMeta(req: any) { return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] }; }
  private ownerOf(req: any): string { return req.user.orgId ?? req.user.sub; }
  private actorOf(req: any): string { return req.user.sub; }
  private roleOf(req: any): string { return req.user.role ?? 'owner'; }

  @Get('overview') overview(@Req() req: any) { return this.svc.overview(this.ownerOf(req)); }
  @Get('balance')  balance(@Req() req: any) { return this.svc.balance(this.ownerOf(req)); }
  @Get('ledger')   ledger(@Req() req: any, @Query('limit') limit?: string) {
    return this.svc.ledger(this.ownerOf(req), Math.min(1000, Math.max(1, Number(limit) || 200)));
  }

  // Accounts
  @Get('accounts') listAccounts(@Req() req: any) { return this.svc.listAccounts(this.ownerOf(req)); }
  @Post('accounts') createAccount(@Req() req: any, @Body() body: any) {
    return this.svc.createAccount(this.ownerOf(req), PayoutAccountSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Post('accounts/:id/default') setDefault(@Req() req: any, @Param('id') id: string) {
    return this.svc.setDefaultAccount(this.ownerOf(req), id, this.actorOf(req), this.reqMeta(req));
  }

  // Schedule
  @Get('schedule') getSchedule(@Req() req: any) { return this.svc.getSchedule(this.ownerOf(req)); }
  @Post('schedule') saveSchedule(@Req() req: any, @Body() body: any) {
    return this.svc.saveSchedule(this.ownerOf(req), PayoutScheduleSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }

  // Payouts
  @Get('payouts') listPayouts(@Req() req: any, @Query() q: any) {
    return this.svc.listPayouts(this.ownerOf(req), ListPayoutsQuerySchema.parse(q));
  }
  @Get('payouts/:id') getPayout(@Req() req: any, @Param('id') id: string) {
    const role = this.roleOf(req);
    return this.svc.getPayout(this.ownerOf(req), id, { admin: role === 'admin' || role === 'operator' });
  }
  @Post('payouts') initiate(@Req() req: any, @Body() body: any) {
    return this.svc.initiatePayout(this.ownerOf(req), InitiatePayoutSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('payouts/:id/status') transitionPayout(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const dto = TransitionPayoutSchema.parse(body);
    return this.svc.transitionPayout(this.ownerOf(req), id, dto.status, dto.reason, dto.externalRef, this.actorOf(req), this.roleOf(req), this.reqMeta(req));
  }

  // Escrows
  @Get('escrows') listEscrows(@Req() req: any, @Query('role') role?: 'payer' | 'payee', @Query('status') status?: string) {
    const me = this.actorOf(req);
    return this.svc.listEscrows(role === 'payer' ? { payerIdentityId: me, status } : { payeeIdentityId: me, status });
  }
  @Get('escrows/:id') getEscrow(@Req() req: any, @Param('id') id: string) {
    const role = this.roleOf(req);
    return this.svc.getEscrow(id, { id: this.actorOf(req), admin: role === 'admin' || role === 'operator' });
  }
  @Post('escrows/hold') hold(@Req() req: any, @Body() body: any) {
    return this.svc.holdEscrow(this.actorOf(req), HoldEscrowSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Post('escrows/:id/release') release(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.releaseEscrow(id, ReleaseEscrowSchema.parse(body), this.actorOf(req), this.roleOf(req), this.reqMeta(req));
  }
  @Post('escrows/:id/refund') refund(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.refundEscrow(id, RefundEscrowSchema.parse(body), this.actorOf(req), this.roleOf(req), this.reqMeta(req));
  }

  // Holds (open by owner; transitions admin/operator only)
  @Get('holds') listHolds(@Req() req: any, @Query('status') status?: string) {
    return this.svc.listHolds({ ownerIdentityId: this.ownerOf(req), status });
  }
  @Post('holds') openHold(@Req() req: any, @Body() body: any) {
    return this.svc.openHold(OpenHoldSchema.parse(body), this.actorOf(req), this.roleOf(req), this.reqMeta(req));
  }
  @Patch('holds/:id/status') transitionHold(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const dto = TransitionHoldSchema.parse(body);
    return this.svc.transitionHold(id, dto.status, dto.reason, this.actorOf(req), this.roleOf(req), this.reqMeta(req));
  }

  // Disputes
  @Get('disputes') listDisputes(@Query('status') status?: string) { return this.svc.listDisputes({ status }); }
  @Post('disputes') openDispute(@Req() req: any, @Body() body: any) {
    return this.svc.openDispute(this.actorOf(req), OpenDisputeSchema.parse(body), this.roleOf(req), this.reqMeta(req));
  }
  @Patch('disputes/:id/status') transitionDispute(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const dto = TransitionDisputeSchema.parse(body);
    return this.svc.transitionDispute(id, dto.status, dto.resolution, this.actorOf(req), this.roleOf(req), this.reqMeta(req));
  }

  // Audit
  @Get('audit') audit(@Req() req: any, @Query('limit') limit?: string) {
    return this.svc.audit(this.ownerOf(req), Math.min(500, Math.max(1, Number(limit) || 200)));
  }
}

@Controller('api/v1/admin/payouts-escrow-finops')
@UseGuards(AuthGuard('jwt'))
export class PayoutsEscrowFinopsAdminController {
  constructor(private readonly svc: PayoutsEscrowFinopsService) {}
  private actorOf(req: any): string { return req.user.sub; }
  private roleOf(req: any): string { return req.user.role ?? 'owner'; }

  @Get('queue') queue(@Query('status') status?: string) {
    return this.svc.listPayouts('00000000-0000-0000-0000-000000000000', { status, page: 1, pageSize: 200 });
  }
  @Get('audit') audit(@Req() req: any, @Query('limit') limit?: string) {
    return this.svc.adminAudit(Math.min(2000, Math.max(1, Number(limit) || 500)), this.roleOf(req));
  }
  @Get('reconciliation') listRecon(@Query('provider') provider?: string) { return this.svc.listRecon(provider); }
  @Post('reconciliation') runRecon(@Req() req: any, @Body() body: any) {
    return this.svc.runRecon(ReconcileSchema.parse(body), this.actorOf(req), this.roleOf(req), { ip: req.ip, userAgent: req.headers?.['user-agent'] });
  }
}

@Controller('api/v1/payouts-escrow-finops/webhook')
export class PayoutsEscrowFinopsWebhookController {
  constructor(private readonly svc: PayoutsEscrowFinopsService) {}
  @Post(':provider')
  receive(@Param('provider') provider: string, @Req() req: any, @Body() body: any) {
    const evt = WebhookEventSchema.parse(body);
    const signatureValid = !!req.headers?.['x-webhook-signature'] || process.env.NODE_ENV !== 'production';
    return this.svc.handleWebhook(provider, evt, signatureValid, { ip: req.ip, userAgent: req.headers?.['user-agent'] });
  }
}
