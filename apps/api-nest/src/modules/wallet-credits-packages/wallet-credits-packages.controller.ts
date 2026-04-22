import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WalletCreditsPackagesService } from './wallet-credits-packages.service';
import {
  ListPackagesQuerySchema, CreatePackageSchema, UpdatePackageSchema, TransitionPackageSchema,
  ListPurchasesQuerySchema, CreatePurchaseSchema, ConfirmPurchaseSchema, FailPurchaseSchema, RefundPurchaseSchema,
  SpendCreditsSchema, GrantCreditsSchema, CreatePayoutSchema, WebhookEventSchema,
} from './dto';

@Controller('api/v1/wallet-credits-packages')
@UseGuards(AuthGuard('jwt'))
export class WalletCreditsPackagesController {
  constructor(private readonly svc: WalletCreditsPackagesService) {}

  private reqMeta(req: any) { return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] }; }
  private ownerOf(req: any): string { return req.user.orgId ?? req.user.sub; }
  private actorOf(req: any): string { return req.user.sub; }

  @Get('overview')
  overview(@Req() req: any) { return this.svc.overview(this.ownerOf(req)); }

  @Get('wallet')
  wallet(@Req() req: any) { return this.svc.wallet(this.ownerOf(req)); }

  @Get('wallet/ledger')
  ledger(@Req() req: any, @Query('limit') limit?: string) {
    return this.svc.ledger(this.ownerOf(req), Math.min(500, Math.max(1, Number(limit) || 200)));
  }

  @Get('wallet/reconcile')
  reconcile(@Req() req: any) { return this.svc.reconcile(this.ownerOf(req)); }

  // ─── Packages ──────────
  @Get('packages')
  listPackages(@Req() req: any, @Query() q: any) {
    return this.svc.listPackagesForOwner(this.ownerOf(req), ListPackagesQuerySchema.parse(q));
  }
  @Get('packages/catalog')
  catalog(@Query() q: any) { return this.svc.listActivePackages(ListPackagesQuerySchema.parse(q)); }
  @Post('packages')
  createPackage(@Req() req: any, @Body() body: any) {
    return this.svc.createPackage(this.ownerOf(req), CreatePackageSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Get('packages/:id')
  getPackage(@Param('id') id: string) { return this.svc.getPackage(id); }
  @Patch('packages/:id')
  updatePackage(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updatePackage(this.ownerOf(req), id, UpdatePackageSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('packages/:id/status')
  transitionPackage(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const { status } = TransitionPackageSchema.parse(body);
    return this.svc.transitionPackage(this.ownerOf(req), id, status, this.actorOf(req), this.reqMeta(req));
  }

  // ─── Purchases ─────────
  @Get('purchases')
  listPurchases(@Req() req: any, @Query() q: any) {
    return this.svc.listPurchases(this.actorOf(req), ListPurchasesQuerySchema.parse(q));
  }
  @Post('purchases')
  createPurchase(@Req() req: any, @Body() body: any) {
    return this.svc.createPurchase(this.actorOf(req), CreatePurchaseSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Get('purchases/:id')
  getPurchase(@Req() req: any, @Param('id') id: string) {
    return this.svc.getPurchase(this.actorOf(req), id);
  }
  @Post('purchases/:id/confirm')
  confirmPurchase(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.confirmPurchase(this.actorOf(req), id, ConfirmPurchaseSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Post('purchases/:id/fail')
  failPurchase(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const { reason } = FailPurchaseSchema.parse(body);
    return this.svc.failPurchase(this.actorOf(req), id, reason, this.actorOf(req), this.reqMeta(req));
  }
  @Post('purchases/:id/cancel')
  cancelPurchase(@Req() req: any, @Param('id') id: string) {
    return this.svc.cancelPurchase(this.actorOf(req), id, this.actorOf(req), this.reqMeta(req));
  }
  @Post('purchases/:id/refund')
  refundPurchase(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const dto = RefundPurchaseSchema.parse(body);
    return this.svc.refundPurchase(this.actorOf(req), id, dto.amountMinor, dto.reason, this.actorOf(req), this.reqMeta(req));
  }

  // ─── Credits ───────────
  @Post('credits/spend')
  spendCredits(@Req() req: any, @Body() body: any) {
    return this.svc.spendCredits(this.ownerOf(req), SpendCreditsSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Post('credits/grant')
  grantCredits(@Req() req: any, @Body() body: any) {
    // Admin-only in real RBAC; guard reserved for governance layer.
    return this.svc.grantCredits(this.actorOf(req), GrantCreditsSchema.parse(body), this.reqMeta(req));
  }

  // ─── Payouts ───────────
  @Get('payouts')
  listPayouts(@Req() req: any) { return this.svc.listPayouts(this.ownerOf(req)); }
  @Post('payouts')
  createPayout(@Req() req: any, @Body() body: any) {
    return this.svc.createPayout(this.ownerOf(req), CreatePayoutSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }

  // ─── Audit ─────────────
  @Get('audit')
  audit(@Req() req: any, @Query('limit') limit?: string) {
    return this.svc.audit(this.ownerOf(req), Math.min(500, Math.max(1, Number(limit) || 100)));
  }
}

// Provider webhook lives outside the JWT-guarded controller.
@Controller('api/v1/wallet-credits-packages/webhook')
export class WalletCreditsPackagesWebhookController {
  constructor(private readonly svc: WalletCreditsPackagesService) {}
  @Post(':provider')
  receive(@Param('provider') provider: string, @Req() req: any, @Body() body: any) {
    const evt = WebhookEventSchema.parse(body);
    // Real signature verification would inspect req.rawBody and provider secret.
    const signatureValid = !!req.headers?.['x-webhook-signature'] || process.env.NODE_ENV !== 'production';
    return this.svc.handleWebhook(provider, evt, signatureValid, { ip: req.ip, userAgent: req.headers?.['user-agent'] });
  }
}
