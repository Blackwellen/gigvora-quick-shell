import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { WebinarsService } from './webinars.service';
import {
  DiscoveryFiltersSchema, WebinarCreateSchema, RegisterSchema, DonateSchema,
  PurchaseCreateSchema, PurchaseConfirmSchema,
} from './dto';

/**
 * Domain 22 — public REST surface (/api/v1/webinars/*).
 *  GET  /discover                  — search + filter + ML rank
 *  GET  /recommend                 — personalised rail
 *  GET  /insights                  — host/right-rail analytics
 *  GET  /:id                       — detail (with donation feed)
 *  GET  /:id/live                  — Jitsi room descriptor
 *  GET  /:id/chat                  — recent chat (last 200)
 *  POST /:id/chat                  — post chat message
 *  POST /                          — create webinar
 *  POST /:id/transition            — { next: status }
 *  POST /:id/register              — register attendee
 *  POST /purchases                 — multi-step: create
 *  POST /purchases/:id/confirm     — multi-step: confirm
 *  GET  /purchases                 — buyer's purchases
 *  POST /:id/donate                — capture donation
 */
@Controller('api/v1/webinars')
export class WebinarsController {
  constructor(private readonly svc: WebinarsService) {}
  private idOf(req: any) { return req?.identityId ?? req?.user?.id ?? 'anonymous'; }
  private nameOf(req: any) { return req?.user?.name ?? 'Host'; }

  @Get('discover')
  discover(@Query() raw: any, @Req() req: any) {
    const f = DiscoveryFiltersSchema.parse({
      ...raw,
      page: raw.page ? Number(raw.page) : undefined,
      pageSize: raw.pageSize ? Number(raw.pageSize) : undefined,
      status: raw.status ? (Array.isArray(raw.status) ? raw.status : [raw.status]) : undefined,
      topic: raw.topic ? (Array.isArray(raw.topic) ? raw.topic : [raw.topic]) : undefined,
    });
    return this.svc.discover(f, this.idOf(req));
  }

  @Get('recommend')
  recommend(@Req() req: any) { return this.svc.recommend(this.idOf(req)); }

  @Get('insights')
  insights(@Req() req: any) { return this.svc.insights(this.idOf(req)); }

  @Get(':id') detail(@Param('id') id: string) { return this.svc.detail(id) ?? { error: 'not_found' }; }

  @Get(':id/live') live(@Param('id') id: string) { return this.svc.liveRoom(id) ?? { error: 'not_found' }; }

  @Get(':id/chat') chat(@Param('id') id: string) { return this.svc.chat(id); }
  @Post(':id/chat') postChat(@Param('id') id: string, @Body() body: { text: string }, @Req() req: any) {
    const text = String(body?.text ?? '').trim().slice(0, 280);
    if (!text) return { error: 'empty' };
    return this.svc.postChat(id, this.idOf(req), text);
  }

  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.svc.create(this.idOf(req), this.nameOf(req), WebinarCreateSchema.parse(body));
  }

  @Post(':id/transition')
  transition(@Param('id') id: string, @Body() body: { next: any }) {
    return this.svc.transition(id, body.next) ?? { error: 'not_found' };
  }

  @Post(':id/register')
  register(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    RegisterSchema.parse({ webinarId: id, ...body });
    return this.svc.register(id, this.idOf(req));
  }

  @Post('purchases')
  createPurchase(@Body() body: any, @Req() req: any) {
    const p = PurchaseCreateSchema.parse(body);
    return this.svc.createPurchase(p.webinarId, this.idOf(req), p.quantity);
  }
  @Post('purchases/:id/confirm')
  confirmPurchase(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    PurchaseConfirmSchema.parse({ purchaseId: id, ...body });
    return this.svc.confirmPurchase(id, this.idOf(req));
  }
  @Get('purchases')
  listPurchases(@Req() req: any) { return this.svc.listPurchases(this.idOf(req)); }

  @Post(':id/donate')
  donate(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const d = DonateSchema.parse({ webinarId: id, ...body });
    return this.svc.donate(id, d.anonymous ? null : this.idOf(req), d.amountCents, d.currency, d.message, d.anonymous);
  }
}
