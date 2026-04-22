import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EnterpriseConnectService } from './enterprise-connect.service';
import {
  OrgProfileSchema, StatusBody, PartnerCreateSchema,
  ProcurementBriefSchema, ProcurementStatusBody,
  IntroRequestSchema, IntroDecisionBody,
  RoomSchema, RoomStatusBody,
  EventSchema, EventStatusBody,
  StartupSchema,
} from './dto';

@Controller('api/v1/enterprise-connect')
@UseGuards(AuthGuard('jwt'))
export class EnterpriseConnectController {
  constructor(private readonly svc: EnterpriseConnectService) {}
  private meta(req: any) { return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] }; }
  private actor(req: any): string { return req.user.sub; }
  private role(req: any): string { return req.user.role ?? 'user'; }

  // Bootstrap
  @Get('overview') overview(@Req() req: any) { return this.svc.overview(this.actor(req)); }

  // Org profile
  @Get('org/me') myOrg(@Req() req: any) { return this.svc.myOrg(this.actor(req)); }
  @Get('org/by-handle/:handle') orgByHandle(@Param('handle') h: string) { return this.svc.orgByHandle(h); }
  @Post('org') createOrg(@Req() req: any, @Body() body: any) {
    return this.svc.createOrg(this.actor(req), OrgProfileSchema.parse(body), this.role(req), this.meta(req));
  }
  @Patch('org') updateOrg(@Req() req: any, @Body() body: any) {
    return this.svc.updateOrg(this.actor(req), OrgProfileSchema.partial().parse(body), this.role(req), this.meta(req));
  }
  @Patch('org/status') transitionOrg(@Req() req: any, @Body() body: any) {
    return this.svc.transitionOrg(this.actor(req), StatusBody.parse(body).status, this.role(req), this.meta(req));
  }

  // Directory
  @Get('directory') directory(@Query('q') q?: string, @Query('region') region?: string) {
    return this.svc.directory(q, region);
  }

  // Partners
  @Get('partners') partners(@Req() req: any) { return this.svc.partners(this.actor(req)); }
  @Get('partners/candidates') candidates(@Req() req: any) { return this.svc.partnerCandidates(this.actor(req)); }
  @Post('partners') createPartner(@Req() req: any, @Body() body: any) {
    return this.svc.createPartner(this.actor(req), PartnerCreateSchema.parse(body), this.role(req), this.meta(req));
  }

  // Procurement
  @Get('procurement/mine') myBriefs(@Req() req: any, @Query('status') s?: string, @Query('category') c?: string) {
    return this.svc.briefs(this.actor(req), 'mine', { status: s, category: c });
  }
  @Get('procurement/discover') discoverBriefs(@Req() req: any, @Query('status') s?: string, @Query('category') c?: string) {
    return this.svc.briefs(this.actor(req), 'open', { status: s, category: c });
  }
  @Post('procurement') createBrief(@Req() req: any, @Body() body: any) {
    return this.svc.createBrief(this.actor(req), ProcurementBriefSchema.parse(body), this.role(req), this.meta(req));
  }
  @Patch('procurement/:id/status') transitionBrief(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionBrief(this.actor(req), id, ProcurementStatusBody.parse(body).status, this.role(req), this.meta(req));
  }

  // Intros
  @Get('intros') intros(@Req() req: any, @Query('role') role: 'requester' | 'broker' | 'target' = 'requester') {
    return this.svc.intros(this.actor(req), role);
  }
  @Post('intros') request(@Req() req: any, @Body() body: any) {
    return this.svc.requestIntro(this.actor(req), IntroRequestSchema.parse(body), this.role(req), this.meta(req));
  }
  @Patch('intros/:id') decide(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.decideIntro(this.actor(req), id, IntroDecisionBody.parse(body), this.role(req), this.meta(req));
  }

  // Rooms
  @Get('rooms') rooms(@Req() req: any) { return this.svc.rooms(this.actor(req)); }
  @Post('rooms') createRoom(@Req() req: any, @Body() body: any) {
    return this.svc.createRoom(this.actor(req), RoomSchema.parse(body), this.role(req), this.meta(req));
  }
  @Patch('rooms/:id/status') transitionRoom(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionRoom(this.actor(req), id, RoomStatusBody.parse(body).status, this.role(req), this.meta(req));
  }

  // Events
  @Get('events/mine') myEvents(@Req() req: any, @Query('status') s?: string) {
    return this.svc.events(this.actor(req), 'mine', { status: s });
  }
  @Get('events/public') publicEvents(@Req() req: any, @Query('status') s?: string) {
    return this.svc.events(this.actor(req), 'public', { status: s });
  }
  @Post('events') createEvent(@Req() req: any, @Body() body: any) {
    return this.svc.createEvent(this.actor(req), EventSchema.parse(body), this.role(req), this.meta(req));
  }
  @Patch('events/:id/status') transitionEvent(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionEvent(this.actor(req), id, EventStatusBody.parse(body).status, this.role(req), this.meta(req));
  }

  // Startups
  @Get('startups') startups(@Query('featured') featured?: string) {
    return this.svc.startups({ featured: featured === '1' || featured === 'true' });
  }
  @Get('startups/:id') startup(@Param('id') id: string) { return this.svc.startup(id); }
  @Post('startups') upsertStartup(@Req() req: any, @Body() body: any) {
    return this.svc.upsertStartup(this.actor(req), StartupSchema.parse(body), this.role(req), this.meta(req));
  }
}
