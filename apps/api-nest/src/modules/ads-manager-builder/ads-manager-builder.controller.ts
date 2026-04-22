import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdsManagerBuilderService } from './ads-manager-builder.service';
import {
  CreateCampaignSchema, UpdateCampaignSchema, TransitionCampaignSchema, ListCampaignsQuerySchema,
  CreateCreativeSchema, UpdateCreativeSchema, TransitionCreativeSchema,
  CreateAdGroupSchema, TransitionAdGroupSchema, AttachCreativeSchema,
  RoutingRuleSchema, SearchQuerySchema, WebhookEventSchema, ModerationDecisionSchema,
} from './dto';

@Controller('api/v1/ads-manager-builder')
@UseGuards(AuthGuard('jwt'))
export class AdsManagerBuilderController {
  constructor(private readonly svc: AdsManagerBuilderService) {}
  private reqMeta(req: any) { return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] }; }
  private ownerOf(req: any): string { return req.user.orgId ?? req.user.sub; }
  private actorOf(req: any): string { return req.user.sub; }
  private roleOf(req: any): string { return req.user.role ?? 'owner'; }

  @Get('overview') overview(@Req() req: any) { return this.svc.overview(this.ownerOf(req)); }

  // Campaigns
  @Get('campaigns') listCampaigns(@Req() req: any, @Query() q: any) {
    return this.svc.listCampaigns(this.ownerOf(req), ListCampaignsQuerySchema.parse(q));
  }
  @Get('campaigns/:id') getCampaign(@Req() req: any, @Param('id') id: string) {
    const role = this.roleOf(req);
    return this.svc.getCampaign(this.ownerOf(req), id, { admin: role === 'admin' || role === 'operator' || role === 'moderator' });
  }
  @Post('campaigns') createCampaign(@Req() req: any, @Body() body: any) {
    return this.svc.createCampaign(this.ownerOf(req), CreateCampaignSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('campaigns/:id') updateCampaign(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateCampaign(this.ownerOf(req), id, UpdateCampaignSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('campaigns/:id/status') transitionCampaign(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const dto = TransitionCampaignSchema.parse(body);
    return this.svc.transitionCampaign(this.ownerOf(req), id, dto.status, dto.reason, this.actorOf(req), this.roleOf(req), this.reqMeta(req));
  }

  // Ad groups
  @Get('campaigns/:id/ad-groups') listAdGroups(@Req() req: any, @Param('id') id: string) {
    return this.svc.listAdGroups(this.ownerOf(req), id);
  }
  @Post('campaigns/:id/ad-groups') createAdGroup(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.createAdGroup(this.ownerOf(req), id, CreateAdGroupSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('ad-groups/:id/status') transitionAdGroup(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const dto = TransitionAdGroupSchema.parse(body);
    return this.svc.transitionAdGroup(this.ownerOf(req), id, dto.status, dto.reason, this.actorOf(req), this.roleOf(req), this.reqMeta(req));
  }
  @Get('campaigns/:cid/ad-groups/:agid/creatives') listAdGroupCreatives(@Req() req: any, @Param('cid') cid: string, @Param('agid') agid: string) {
    return this.svc.listAdGroupCreatives(this.ownerOf(req), cid, agid);
  }
  @Post('campaigns/:cid/ad-groups/:agid/creatives') attachCreative(@Req() req: any, @Param('cid') cid: string, @Param('agid') agid: string, @Body() body: any) {
    return this.svc.attachCreative(this.ownerOf(req), cid, agid, AttachCreativeSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Delete('campaigns/:cid/ad-groups/:agid/creatives/:crid') detachCreative(@Req() req: any, @Param('cid') cid: string, @Param('agid') agid: string, @Param('crid') crid: string) {
    return this.svc.detachCreative(this.ownerOf(req), cid, agid, crid, this.actorOf(req), this.reqMeta(req));
  }

  // Routing
  @Get('campaigns/:id/routing-rules') listRoutingRules(@Req() req: any, @Param('id') id: string) {
    return this.svc.listRoutingRules(this.ownerOf(req), id);
  }
  @Post('campaigns/:id/routing-rules') createRoutingRule(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.createRoutingRule(this.ownerOf(req), id, RoutingRuleSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Delete('campaigns/:cid/routing-rules/:rid') deleteRoutingRule(@Req() req: any, @Param('cid') cid: string, @Param('rid') rid: string) {
    return this.svc.deleteRoutingRule(this.ownerOf(req), cid, rid, this.actorOf(req), this.reqMeta(req));
  }

  // Metrics
  @Get('campaigns/:id/metrics') metrics(@Req() req: any, @Param('id') id: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.metrics(this.ownerOf(req), id, from, to);
  }

  // Creatives
  @Get('creatives') listCreatives(@Req() req: any, @Query('format') format?: string, @Query('status') status?: string, @Query('q') q?: string) {
    return this.svc.listCreatives(this.ownerOf(req), { format, status, q });
  }
  @Get('creatives/:id') getCreative(@Req() req: any, @Param('id') id: string) {
    const role = this.roleOf(req);
    return this.svc.getCreative(this.ownerOf(req), id, { admin: role === 'admin' || role === 'operator' || role === 'moderator' });
  }
  @Post('creatives') createCreative(@Req() req: any, @Body() body: any) {
    return this.svc.createCreative(this.ownerOf(req), CreateCreativeSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('creatives/:id') updateCreative(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateCreative(this.ownerOf(req), id, UpdateCreativeSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('creatives/:id/status') transitionCreative(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const dto = TransitionCreativeSchema.parse(body);
    return this.svc.transitionCreative(this.ownerOf(req), id, dto.status, dto.reason, this.actorOf(req), this.roleOf(req), this.reqMeta(req));
  }

  // Search + audit
  @Get('search') search(@Req() req: any, @Query() q: any) {
    return this.svc.search(this.ownerOf(req), SearchQuerySchema.parse(q));
  }
  @Get('audit') audit(@Req() req: any, @Query('limit') limit?: string) {
    return this.svc.audit(this.ownerOf(req), Math.min(500, Math.max(1, Number(limit) || 200)));
  }
}

@Controller('api/v1/admin/ads-manager-builder')
@UseGuards(AuthGuard('jwt'))
export class AdsManagerBuilderModerationController {
  constructor(private readonly svc: AdsManagerBuilderService) {}
  private actorOf(req: any): string { return req.user.sub; }
  private roleOf(req: any): string { return req.user.role ?? 'owner'; }

  @Get('moderation/:subjectType/:subjectId')
  list(@Param('subjectType') subjectType: string, @Param('subjectId') subjectId: string) {
    return this.svc.listModeration(subjectType, subjectId);
  }
  @Post('moderation')
  decide(@Req() req: any, @Body() body: any) {
    return this.svc.recordModerationDecision(this.actorOf(req), this.roleOf(req), ModerationDecisionSchema.parse(body), { ip: req.ip, userAgent: req.headers?.['user-agent'] });
  }
}

@Controller('api/v1/ads-manager-builder/webhook')
export class AdsManagerBuilderWebhookController {
  constructor(private readonly svc: AdsManagerBuilderService) {}
  @Post(':provider')
  receive(@Param('provider') provider: string, @Req() req: any, @Body() body: any) {
    const evt = WebhookEventSchema.parse(body);
    const signatureValid = !!req.headers?.['x-webhook-signature'] || process.env.NODE_ENV !== 'production';
    return this.svc.handleWebhook(provider, evt, signatureValid, { ip: req.ip, userAgent: req.headers?.['user-agent'] });
  }
}
