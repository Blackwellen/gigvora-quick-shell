import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BillingInvoicesTaxService } from './billing-invoices-tax.service';
import {
  CommercialProfileSchema, TaxRateSchema, ComputeTaxSchema,
  ListInvoicesQuerySchema, CreateInvoiceSchema, UpdateInvoiceSchema, TransitionInvoiceSchema,
  RecordPaymentSchema, RefundInvoiceSchema, CreateSubscriptionSchema, TransitionSubSchema,
  OpenDisputeSchema, TransitionDisputeSchema, WebhookEventSchema,
} from './dto';

@Controller('api/v1/billing-invoices-tax')
@UseGuards(AuthGuard('jwt'))
export class BillingInvoicesTaxController {
  constructor(private readonly svc: BillingInvoicesTaxService) {}

  private reqMeta(req: any) { return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] }; }
  private ownerOf(req: any): string { return req.user.orgId ?? req.user.sub; }
  private actorOf(req: any): string { return req.user.sub; }

  @Get('overview') overview(@Req() req: any) { return this.svc.overview(this.ownerOf(req)); }

  // ─── Commercial profile ─────
  @Get('profile') getProfile(@Req() req: any) { return this.svc.getProfile(this.ownerOf(req)); }
  @Post('profile') saveProfile(@Req() req: any, @Body() body: any) {
    return this.svc.saveProfile(this.ownerOf(req), CommercialProfileSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }

  // ─── Tax ────────────────────
  @Get('tax-rates') listTaxRates(@Req() req: any) { return this.svc.listTaxRates(this.ownerOf(req)); }
  @Post('tax-rates') createTaxRate(@Req() req: any, @Body() body: any) {
    return this.svc.createTaxRate(this.ownerOf(req), TaxRateSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Post('tax/compute') computeTax(@Req() req: any, @Body() body: any) {
    return this.svc.computeTax(this.ownerOf(req), ComputeTaxSchema.parse(body));
  }

  // ─── Invoices ───────────────
  @Get('invoices') listInvoices(@Req() req: any, @Query() q: any) {
    return this.svc.listInvoices(this.ownerOf(req), ListInvoicesQuerySchema.parse(q));
  }
  @Get('invoices/mine') myInvoices(@Req() req: any) { return this.svc.listMyInvoices(this.actorOf(req)); }
  @Post('invoices') createInvoice(@Req() req: any, @Body() body: any) {
    return this.svc.createInvoice(this.ownerOf(req), CreateInvoiceSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Get('invoices/:id') getInvoice(@Req() req: any, @Param('id') id: string) {
    return this.svc.getInvoice(this.ownerOf(req), id);
  }
  @Patch('invoices/:id') updateInvoice(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateInvoice(this.ownerOf(req), id, UpdateInvoiceSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('invoices/:id/status') transitionInvoice(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const { status, reason } = TransitionInvoiceSchema.parse(body);
    return this.svc.transitionInvoice(this.ownerOf(req), id, status, reason, this.actorOf(req), this.reqMeta(req));
  }
  @Post('invoices/:id/payments') recordPayment(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.recordPayment(this.ownerOf(req), id, RecordPaymentSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Post('invoices/:id/refund') refund(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const dto = RefundInvoiceSchema.parse(body);
    return this.svc.refundInvoice(this.ownerOf(req), id, dto.amountMinor, dto.reason, this.actorOf(req), this.reqMeta(req));
  }
  @Post('invoices/:id/remind') remind(@Req() req: any, @Param('id') id: string) {
    return this.svc.sendReminder(this.ownerOf(req), id, this.actorOf(req), this.reqMeta(req));
  }
  @Get('invoices/:id/risk') risk(@Req() req: any, @Param('id') id: string) {
    return this.svc.assessInvoice(this.ownerOf(req), id);
  }

  // ─── Subscriptions ──────────
  @Get('subscriptions') listSubs(@Req() req: any, @Query('status') status?: string) {
    return this.svc.listSubscriptions(this.ownerOf(req), status);
  }
  @Get('subscriptions/mine') mySubs(@Req() req: any) { return this.svc.listMySubscriptions(this.actorOf(req)); }
  @Post('subscriptions') createSub(@Req() req: any, @Body() body: any) {
    return this.svc.createSubscription(this.ownerOf(req), CreateSubscriptionSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('subscriptions/:id/status') transitionSub(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const { status, reason } = TransitionSubSchema.parse(body);
    return this.svc.transitionSubscription(this.ownerOf(req), id, status, reason, this.actorOf(req), this.reqMeta(req));
  }

  // ─── Disputes ───────────────
  @Get('disputes') listDisputes(@Req() req: any) { return this.svc.listDisputes(this.ownerOf(req)); }
  @Post('disputes') openDispute(@Req() req: any, @Body() body: any) {
    return this.svc.openDispute(this.ownerOf(req), OpenDisputeSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('disputes/:id/status') transitionDispute(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const { status, reason } = TransitionDisputeSchema.parse(body);
    return this.svc.transitionDispute(this.ownerOf(req), id, status, reason, this.actorOf(req), this.reqMeta(req));
  }

  // ─── Audit ──────────────────
  @Get('audit') audit(@Req() req: any, @Query('limit') limit?: string) {
    return this.svc.audit(this.ownerOf(req), Math.min(500, Math.max(1, Number(limit) || 100)));
  }
}

@Controller('api/v1/billing-invoices-tax/webhook')
export class BillingInvoicesTaxWebhookController {
  constructor(private readonly svc: BillingInvoicesTaxService) {}
  @Post(':provider')
  receive(@Param('provider') provider: string, @Req() req: any, @Body() body: any) {
    const evt = WebhookEventSchema.parse(body);
    const signatureValid = !!req.headers?.['x-webhook-signature'] || process.env.NODE_ENV !== 'production';
    return this.svc.handleWebhook(provider, evt, signatureValid, { ip: req.ip, userAgent: req.headers?.['user-agent'] });
  }
}
