import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MarketingAdminService } from './marketing-admin.service';
import {
  ListSchema, AdsDecisionSchema, ScoreCreativeSchema, TrafficWindowSchema,
  IpActionSchema, TaskCreateSchema, TaskUpdateSchema, NoticeUpsertSchema,
} from './dto';

@Controller('api/v1/marketing-admin')
@UseGuards(AuthGuard('jwt'))
export class MarketingAdminController {
  constructor(private readonly svc: MarketingAdminService) {}
  private actor(req: any): string | null { return req.user?.sub ?? null; }
  private role(req: any): string  { return req.user?.opsRole ?? req.user?.role ?? 'viewer'; }
  private meta(req: any) { return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] }; }

  // ── Ads moderation ─────
  @Get('ads') listAds(@Req() req: any, @Query() q: any) {
    return this.svc.listAds(this.role(req), ListSchema.parse({
      ...q, page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 50,
    }));
  }
  @Post('ads/score') scoreAd(@Req() req: any, @Body() body: any) {
    return this.svc.scoreAndUpsertAd(this.role(req), this.actor(req), ScoreCreativeSchema.parse(body), this.meta(req));
  }
  @Post('ads/decision') decideAds(@Req() req: any, @Body() body: any) {
    return this.svc.decideAds(this.role(req), this.actor(req), AdsDecisionSchema.parse(body), this.meta(req));
  }

  // ── Traffic ─────
  @Get('traffic') traffic(@Req() req: any, @Query() q: any) {
    return this.svc.traffic(this.role(req), TrafficWindowSchema.parse({
      windowHours: q.windowHours ? Number(q.windowHours) : 24, source: q.source, country: q.country,
    }));
  }

  // ── IP intel ─────
  @Get('ips') listIps(@Req() req: any, @Query() q: any) {
    return this.svc.listIps(this.role(req), ListSchema.parse({
      ...q, page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 50,
    }));
  }
  @Post('ips/action') ipAct(@Req() req: any, @Body() body: any) {
    return this.svc.ipAct(this.role(req), this.actor(req), IpActionSchema.parse(body), this.meta(req));
  }
  @Post('ips/score') scoreIp(@Req() req: any, @Body() body: any) {
    return this.svc.scoreIp(this.role(req), body);
  }

  // ── Tasks ─────
  @Get('tasks') listTasks(@Req() req: any, @Query() q: any) {
    return this.svc.listTasks(this.role(req), ListSchema.parse({
      ...q, page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 50,
    }));
  }
  @Post('tasks') createTask(@Req() req: any, @Body() body: any) {
    return this.svc.createTask(this.role(req), this.actor(req), TaskCreateSchema.parse(body), this.meta(req));
  }
  @Patch('tasks') updateTask(@Req() req: any, @Body() body: any) {
    return this.svc.updateTask(this.role(req), this.actor(req), TaskUpdateSchema.parse(body), this.meta(req));
  }

  // ── Notices ─────
  @Get('notices') listNotices(@Req() req: any, @Query() q: any) {
    return this.svc.listNotices(this.role(req), ListSchema.parse({
      ...q, page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 50,
    }));
  }
  @Post('notices') upsertNotice(@Req() req: any, @Body() body: any) {
    return this.svc.upsertNotice(this.role(req), this.actor(req), NoticeUpsertSchema.parse(body), this.meta(req));
  }
}
