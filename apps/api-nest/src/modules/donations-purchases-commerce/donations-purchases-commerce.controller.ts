import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DonationsPurchasesCommerceService } from './donations-purchases-commerce.service';
import {
  StorefrontSchema, ProductSchema, TierSchema, PledgeCreateSchema,
  OrderCreateSchema, DonationCreateSchema, StatusBody, RefundBody,
} from './dto';

@Controller('api/v1/donations-purchases-commerce')
@UseGuards(AuthGuard('jwt'))
export class DonationsPurchasesCommerceController {
  constructor(private readonly svc: DonationsPurchasesCommerceService) {}
  private reqMeta(req: any) { return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] }; }
  private actorOf(req: any): string { return req.user.sub; }
  private roleOf(req: any): string { return req.user.role ?? 'user'; }

  @Get('overview') overview(@Req() req: any) { return this.svc.overview(this.actorOf(req)); }

  // Storefront
  @Get('storefront/me') myStorefront(@Req() req: any) { return this.svc.myStorefront(this.actorOf(req)); }
  @Get('storefront/by-handle/:handle') public(@Param('handle') h: string) { return this.svc.publicStorefront(h); }
  @Post('storefront') createStorefront(@Req() req: any, @Body() body: any) {
    return this.svc.createStorefront(this.actorOf(req), StorefrontSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('storefront') updateStorefront(@Req() req: any, @Body() body: any) {
    return this.svc.updateStorefront(this.actorOf(req), StorefrontSchema.partial().parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('storefront/status') transitionStorefront(@Req() req: any, @Body() body: any) {
    return this.svc.transitionStorefront(this.actorOf(req), StatusBody.parse(body).status, this.actorOf(req), this.reqMeta(req));
  }

  // Products
  @Get('products') listProducts(@Req() req: any, @Query('status') s?: string) { return this.svc.listProducts(this.actorOf(req), s); }
  @Post('products') createProduct(@Req() req: any, @Body() body: any) {
    return this.svc.createProduct(this.actorOf(req), ProductSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('products/:id') updateProduct(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateProduct(this.actorOf(req), id, ProductSchema.partial().parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('products/:id/status') transitionProduct(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionProduct(this.actorOf(req), id, StatusBody.parse(body).status, this.actorOf(req), this.reqMeta(req));
  }

  // Tiers
  @Get('tiers') listTiers(@Req() req: any, @Query('status') s?: string) { return this.svc.listTiers(this.actorOf(req), s); }
  @Post('tiers') createTier(@Req() req: any, @Body() body: any) {
    return this.svc.createTier(this.actorOf(req), TierSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('tiers/:id') updateTier(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateTier(this.actorOf(req), id, TierSchema.partial().parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('tiers/:id/status') transitionTier(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionTier(this.actorOf(req), id, StatusBody.parse(body).status, this.actorOf(req), this.reqMeta(req));
  }

  // Pledges
  @Get('pledges/mine') myPledges(@Req() req: any, @Query('status') s?: string) { return this.svc.myPledges(this.actorOf(req), s); }
  @Get('pledges/creator') creatorPledges(@Req() req: any, @Query('status') s?: string) { return this.svc.creatorPledges(this.actorOf(req), s); }
  @Post('pledges') createPledge(@Req() req: any, @Body() body: any) {
    return this.svc.createPledge(this.actorOf(req), PledgeCreateSchema.parse(body), this.reqMeta(req));
  }
  @Patch('pledges/:id/status') transitionPledge(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionPledge(this.actorOf(req), id, StatusBody.parse(body).status, this.reqMeta(req));
  }

  // Orders
  @Get('orders/mine') myOrders(@Req() req: any, @Query('status') s?: string) { return this.svc.myOrders(this.actorOf(req), s); }
  @Get('orders/creator') creatorOrders(@Req() req: any, @Query('status') s?: string) { return this.svc.creatorOrders(this.actorOf(req), s); }
  @Get('orders/:id') getOrder(@Req() req: any, @Param('id') id: string) { return this.svc.getOrder(this.actorOf(req), id); }
  @Post('orders') createOrder(@Req() req: any, @Body() body: any) {
    return this.svc.createOrder(this.actorOf(req), OrderCreateSchema.parse(body), this.reqMeta(req));
  }
  @Post('orders/:id/confirm') confirmOrder(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const ref = String(body?.providerRef ?? '');
    if (!ref) throw new Error('providerRef required');
    return this.svc.confirmOrder(this.actorOf(req), id, ref, this.reqMeta(req));
  }
  @Post('orders/:id/fulfill') fulfillOrder(@Req() req: any, @Param('id') id: string) {
    return this.svc.fulfillOrder(this.actorOf(req), id, this.reqMeta(req));
  }
  @Post('orders/:id/cancel') cancelOrder(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.cancelOrder(this.actorOf(req), id, String(body?.reason ?? 'cancelled by user'), this.reqMeta(req));
  }
  @Post('orders/:id/refund') refundOrder(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.refundOrder(this.actorOf(req), id, RefundBody.parse(body), this.roleOf(req), this.reqMeta(req));
  }

  // Donations
  @Get('donations/mine') myDonations(@Req() req: any) { return this.svc.myDonations(this.actorOf(req)); }
  @Get('donations/creator') creatorDonations(@Req() req: any, @Query('status') s?: string) { return this.svc.creatorDonations(this.actorOf(req), s); }
  @Post('donations') createDonation(@Req() req: any, @Body() body: any) {
    return this.svc.createDonation(this.actorOf(req), DonationCreateSchema.parse(body), this.reqMeta(req));
  }
  @Post('donations/:id/confirm') confirmDonation(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const ref = String(body?.providerRef ?? '');
    if (!ref) throw new Error('providerRef required');
    return this.svc.confirmDonation(this.actorOf(req), id, ref, this.reqMeta(req));
  }
  @Post('donations/:id/refund') refundDonation(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.refundDonation(this.actorOf(req), id, RefundBody.parse(body), this.roleOf(req), this.reqMeta(req));
  }

  // Ledger
  @Get('ledger') ledger(@Req() req: any, @Query('limit') limit?: string) {
    return this.svc.ledger(this.actorOf(req), Math.min(500, Math.max(1, Number(limit) || 200)));
  }
}
