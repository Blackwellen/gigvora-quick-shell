/**
 * D34 — public REST surface.
 *
 *   GET    /api/v1/proposal-builder-bid-credits/proposals
 *   GET    /api/v1/proposal-builder-bid-credits/proposals/:id
 *   GET    /api/v1/proposal-builder-bid-credits/projects/:projectId/proposals
 *   POST   /api/v1/proposal-builder-bid-credits/proposals
 *   PUT    /api/v1/proposal-builder-bid-credits/proposals/:id
 *   POST   /api/v1/proposal-builder-bid-credits/proposals/submit
 *   POST   /api/v1/proposal-builder-bid-credits/proposals/withdraw
 *   POST   /api/v1/proposal-builder-bid-credits/proposals/revise
 *   POST   /api/v1/proposal-builder-bid-credits/proposals/decision
 *
 *   GET    /api/v1/proposal-builder-bid-credits/credits/packs
 *   GET    /api/v1/proposal-builder-bid-credits/credits/wallet
 *   POST   /api/v1/proposal-builder-bid-credits/credits/purchases
 *   POST   /api/v1/proposal-builder-bid-credits/credits/purchases/:id/confirm
 *   POST   /api/v1/proposal-builder-bid-credits/credits/purchases/:id/refund
 *
 *   GET    /api/v1/proposal-builder-bid-credits/escrows
 *   POST   /api/v1/proposal-builder-bid-credits/escrows/hold
 *   POST   /api/v1/proposal-builder-bid-credits/escrows/release
 *   POST   /api/v1/proposal-builder-bid-credits/escrows/refund
 *
 *   GET    /api/v1/proposal-builder-bid-credits/insights
 *   POST   /api/v1/proposal-builder-bid-credits/pricing-advice
 */
import { Body, Controller, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ProposalBuilderBidCreditsService } from './proposal-builder-bid-credits.service';
import {
  ProposalDraftSchema, ProposalUpdateSchema, ListFiltersSchema,
  SubmitProposalSchema, WithdrawSchema, ReviseSchema, ClientDecisionSchema,
  CreditPurchaseCreateSchema, CreditPurchaseConfirmSchema, CreditRefundSchema,
  EscrowHoldSchema, EscrowReleaseSchema, EscrowRefundSchema, PricingAdviceSchema,
} from './dto';

@Controller('api/v1/proposal-builder-bid-credits')
export class ProposalBuilderBidCreditsController {
  constructor(private readonly svc: ProposalBuilderBidCreditsService) {}

  private actor(req: any) { return req?.identityId ?? req?.user?.id ?? 'demo-user'; }
  private tenant(req: any) { return req?.tenantId ?? 'tenant-demo'; }
  private displayName(req: any) { return req?.user?.displayName ?? req?.user?.name ?? 'You'; }

  // ─── Proposals ───────────────────────────────────────────────────────
  @Get('proposals')
  list(@Query() raw: any, @Req() req: any) {
    const f = ListFiltersSchema.parse({ ...raw, page: raw.page ? Number(raw.page) : undefined, pageSize: raw.pageSize ? Number(raw.pageSize) : undefined });
    return this.svc.list(this.tenant(req), { status: f.status, projectId: f.projectId });
  }
  @Get('proposals/:id') detail(@Param('id') id: string) { return this.svc.detail(id); }
  @Get('projects/:projectId/proposals') byProject(@Param('projectId') projectId: string) { return this.svc.forProject(projectId); }

  @Post('proposals')
  draft(@Body() body: any, @Req() req: any) {
    return this.svc.draft(this.tenant(req), this.actor(req), this.displayName(req), ProposalDraftSchema.parse(body));
  }
  @Put('proposals/:id')
  update(@Param('id') id: string, @Body() body: { expectedVersion: number; patch: any }, @Req() req: any) {
    return this.svc.update(id, body.expectedVersion, ProposalUpdateSchema.parse(body.patch), this.actor(req));
  }
  @Post('proposals/submit')
  submit(@Body() body: any, @Req() req: any) {
    const dto = SubmitProposalSchema.parse(body);
    return this.svc.submit(dto.proposalId, dto.idempotencyKey, this.actor(req));
  }
  @Post('proposals/withdraw')
  withdraw(@Body() body: any, @Req() req: any) {
    const dto = WithdrawSchema.parse(body);
    return this.svc.withdraw(dto.proposalId, this.actor(req), dto.reason);
  }
  @Post('proposals/revise')
  revise(@Body() body: any, @Req() req: any) {
    const dto = ReviseSchema.parse(body);
    return this.svc.revise(dto.proposalId, dto.patch, dto.idempotencyKey, this.actor(req));
  }
  @Post('proposals/decision')
  decide(@Body() body: any, @Req() req: any) {
    const dto = ClientDecisionSchema.parse(body);
    return this.svc.clientDecide(dto.proposalId, dto.decision, this.actor(req), dto.note);
  }

  // ─── Bid credit packs ────────────────────────────────────────────────
  @Get('credits/packs')  packs()                  { return this.svc.packs(); }
  @Get('credits/wallet') wallet(@Req() req: any)  { return this.svc.walletBalance(this.tenant(req)); }

  @Post('credits/purchases')
  createPurchase(@Body() body: any, @Req() req: any) {
    const dto = CreditPurchaseCreateSchema.parse(body);
    return this.svc.createPurchase(this.tenant(req), this.actor(req), dto.packId);
  }
  @Post('credits/purchases/:id/confirm')
  confirmPurchase(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const dto = CreditPurchaseConfirmSchema.parse({ ...body, purchaseId: id });
    return this.svc.confirmPurchase(dto.purchaseId, dto.idempotencyKey, this.actor(req));
  }
  @Post('credits/purchases/:id/refund')
  refundPurchase(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const dto = CreditRefundSchema.parse({ ...body, purchaseId: id });
    return this.svc.refundPurchase(dto.purchaseId, dto.reason, this.actor(req));
  }

  // ─── Escrow ──────────────────────────────────────────────────────────
  @Get('escrows') escrows(@Req() req: any) { return this.svc.escrows(this.tenant(req)); }

  @Post('escrows/hold')
  hold(@Body() body: any, @Req() req: any) {
    const dto = EscrowHoldSchema.parse(body);
    return this.svc.holdEscrow(this.tenant(req), this.actor(req), dto.proposalId, dto.amountCents, dto.currency, dto.paymentMethod, dto.idempotencyKey);
  }
  @Post('escrows/release')
  release(@Body() body: any, @Req() req: any) {
    const dto = EscrowReleaseSchema.parse(body);
    return this.svc.releaseEscrow(dto.escrowId, dto.amountCents, dto.milestoneId, dto.idempotencyKey, this.actor(req));
  }
  @Post('escrows/refund')
  refund(@Body() body: any, @Req() req: any) {
    const dto = EscrowRefundSchema.parse(body);
    return this.svc.refundEscrow(dto.escrowId, dto.amountCents, dto.reason, dto.idempotencyKey, this.actor(req));
  }

  @Get('insights') insights(@Req() req: any) { return this.svc.insights(this.tenant(req)); }
  @Post('pricing-advice')
  pricingAdvice(@Body() body: any) {
    const dto = PricingAdviceSchema.parse(body);
    return this.svc.pricingAdvice(dto.projectId, dto.proposedAmountCents);
  }
}
