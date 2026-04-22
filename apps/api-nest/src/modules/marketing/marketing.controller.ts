import { Body, Controller, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { MarketingService } from './marketing.service';
import {
  CreateLeadDto, CtaEventDto, ListPagesQuery, NewsletterSubscribeDto, UpsertPageDto,
} from './dto';

/**
 * Public marketing surfaces. Most endpoints are unauthenticated by design (CMS reads, lead
 * capture, newsletter opt-in, CTA telemetry). Write endpoints for pages/leads admin should be
 * mounted behind an admin guard at the app level (left as TODO until Domain 03 ships auth).
 */
@Controller('public/marketing')
export class MarketingController {
  constructor(private readonly svc: MarketingService) {}

  // ----- Pages CMS (read = public, write = admin) -----
  @Get('pages')
  listPages(@Query() q: ListPagesQuery) { return this.svc.listPages(q); }

  @Get('pages/:slug')
  getPage(@Param('slug') slug: string) { return this.svc.getPage(slug); }

  @Put('pages')
  upsertPage(@Body() dto: UpsertPageDto, @Req() req: Request) {
    const actor = (req as any).user?.sub ?? null;
    return this.svc.upsertPage(dto, actor);
  }

  // ----- Leads -----
  @Post('leads')
  createLead(@Body() dto: CreateLeadDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null;
    const ua = (req.headers['user-agent'] as string) ?? null;
    return this.svc.createLead(dto, ip, ua);
  }

  @Get('leads')
  listLeads(@Query('limit') limit?: string, @Query('offset') offset?: string, @Query('status') status?: string) {
    return this.svc.listLeads(limit ? +limit : undefined, offset ? +offset : undefined, status);
  }

  // ----- Newsletter -----
  @Post('newsletter/subscribe')
  subscribe(@Body() dto: NewsletterSubscribeDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null;
    const ua = (req.headers['user-agent'] as string) ?? null;
    return this.svc.subscribe(dto, ip, ua);
  }

  @Get('newsletter/confirm/:token')
  confirm(@Param('token') token: string) { return this.svc.confirm(token); }

  @Get('newsletter/unsubscribe/:token')
  unsubscribe(@Param('token') token: string) { return this.svc.unsubscribe(token); }

  // ----- CTA experiments -----
  @Get('cta/experiments/:key')
  experiment(@Param('key') key: string) { return this.svc.getExperiment(key); }

  @Post('cta/events')
  recordEvent(@Body() dto: CtaEventDto) { return this.svc.recordCtaEvent(dto); }

  @Get('cta/experiments/:id/summary')
  summary(@Param('id') id: string) { return this.svc.ctaSummary(id); }
}
