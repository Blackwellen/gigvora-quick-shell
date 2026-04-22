import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PricingPromotionsMonetizationService } from './pricing-promotions-monetization.service';
import {
  PriceBookSchema, PriceEntrySchema, PackageSchema, PromotionSchema,
  QuoteCreateSchema, StatusBody, PreviewSchema,
} from './dto';

@Controller('api/v1/pricing-promotions-monetization')
@UseGuards(AuthGuard('jwt'))
export class PricingPromotionsMonetizationController {
  constructor(private readonly svc: PricingPromotionsMonetizationService) {}
  private reqMeta(req: any) { return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] }; }
  private actorOf(req: any): string { return req.user.sub; }

  @Get('overview') overview(@Req() req: any) { return this.svc.overview(this.actorOf(req)); }

  // Price books
  @Get('price-books') listBooks(@Req() req: any) { return this.svc.listBooks(this.actorOf(req)); }
  @Post('price-books') createBook(@Req() req: any, @Body() body: any) {
    return this.svc.createBook(this.actorOf(req), PriceBookSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('price-books/:id') updateBook(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateBook(this.actorOf(req), id, PriceBookSchema.partial().parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('price-books/:id/status') transitionBook(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionBook(this.actorOf(req), id, StatusBody.parse(body).status, this.actorOf(req), this.reqMeta(req));
  }

  // Price entries
  @Get('price-books/:id/entries') listEntries(@Req() req: any, @Param('id') id: string) {
    return this.svc.listEntries(this.actorOf(req), id);
  }
  @Post('price-entries') createEntry(@Req() req: any, @Body() body: any) {
    return this.svc.createEntry(this.actorOf(req), PriceEntrySchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Delete('price-entries/:id') deleteEntry(@Req() req: any, @Param('id') id: string) {
    return this.svc.deleteEntry(this.actorOf(req), id, this.actorOf(req), this.reqMeta(req));
  }

  // Packages
  @Get('packages') listPackages(@Req() req: any, @Query('status') s?: string) {
    return this.svc.listPackages(this.actorOf(req), s);
  }
  @Post('packages') createPackage(@Req() req: any, @Body() body: any) {
    return this.svc.createPackage(this.actorOf(req), PackageSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('packages/:id') updatePackage(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updatePackage(this.actorOf(req), id, PackageSchema.partial().parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('packages/:id/status') transitionPackage(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionPackage(this.actorOf(req), id, StatusBody.parse(body).status, this.actorOf(req), this.reqMeta(req));
  }

  // Promotions
  @Get('promotions') listPromos(@Req() req: any, @Query('status') s?: string) {
    return this.svc.listPromos(this.actorOf(req), s);
  }
  @Post('promotions') createPromo(@Req() req: any, @Body() body: any) {
    return this.svc.createPromo(this.actorOf(req), PromotionSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('promotions/:id') updatePromo(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updatePromo(this.actorOf(req), id, PromotionSchema.partial().parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('promotions/:id/status') transitionPromo(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionPromo(this.actorOf(req), id, StatusBody.parse(body).status, this.actorOf(req), this.reqMeta(req));
  }
  @Get('promotions/:id/redemptions') listRedemptions(@Req() req: any, @Param('id') id: string) {
    return this.svc.listRedemptions(this.actorOf(req), id);
  }

  // Preview (callable by any authenticated user — pricing calculator at checkout)
  @Post('preview') preview(@Body() body: any) { return this.svc.previewPrice(PreviewSchema.parse(body)); }

  // Quotes
  @Get('quotes/owner') quotesOwner(@Req() req: any, @Query('status') s?: string) {
    return this.svc.listQuotesByOwner(this.actorOf(req), s);
  }
  @Get('quotes/customer') quotesCustomer(@Req() req: any, @Query('status') s?: string) {
    return this.svc.listQuotesByCustomer(this.actorOf(req), s);
  }
  @Get('quotes/:id') getQuote(@Req() req: any, @Param('id') id: string) {
    return this.svc.getQuote(this.actorOf(req), id);
  }
  @Post('quotes') createQuote(@Req() req: any, @Body() body: any) {
    return this.svc.createQuote(this.actorOf(req), QuoteCreateSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('quotes/:id/status') transitionQuote(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionQuote(this.actorOf(req), id, StatusBody.parse(body).status, this.reqMeta(req));
  }
}
