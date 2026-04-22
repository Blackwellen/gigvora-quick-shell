import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import { CandidateAvailabilityMatchingService } from './candidate-availability-matching.service';
import {
  InvitationCreateSchema, InvitationDecisionSchema, InvitationListFiltersSchema,
  ProfileListFiltersSchema, ProfileTransitionSchema, ProfileUpsertSchema,
  SignalActionSchema, SignalListFiltersSchema, TalentSearchSchema,
  WindowCancelSchema, WindowUpsertSchema,
} from './dto';

/**
 * D31 REST surface (`/api/v1/candidate-availability-matching/*`).
 *
 *   GET    /profiles                              list
 *   GET    /profiles/me                           current user's profile (or 404)
 *   POST   /profiles                              upsert (create or update)
 *   GET    /profiles/:id                          detail (profile + windows)
 *   POST   /profiles/:id/transition               draft↔active↔paused↔archived
 *   GET    /profiles/:id/windows                  list windows
 *   POST   /profiles/:id/windows                  create window
 *   DELETE /profiles/:id/windows/:wid             cancel window
 *
 *   GET    /signals                               list (filters)
 *   POST   /signals/:id/action                    view / save / dismiss / convert
 *   POST   /signals/generate                      generate signal for (profile, job)
 *
 *   GET    /invitations                           list
 *   POST   /invitations                           create (recruiter only)
 *   POST   /invitations/:id/decision              accept / decline (candidate only)
 *   POST   /invitations/expire-due                sweep expired
 *
 *   POST   /talent-search                         recruiter-side search
 *   GET    /dashboard                             insights
 *   GET    /profiles/:id/audit                    audit trail
 */
@Controller('api/v1/candidate-availability-matching')
export class CandidateAvailabilityMatchingController {
  constructor(private readonly svc: CandidateAvailabilityMatchingService) {}
  private actor(req: any) { return req?.identityId ?? req?.user?.id ?? 'usr-demo'; }
  private tenant(req: any) { return req?.user?.tenantId ?? 'tenant-demo'; }

  /* ── Profiles ── */
  @Get('profiles')
  list(@Query() raw: any, @Req() req: any) {
    const f = ProfileListFiltersSchema.parse({
      ...raw,
      page: raw.page ? Number(raw.page) : undefined,
      pageSize: raw.pageSize ? Number(raw.pageSize) : undefined,
      status: raw.status ? (Array.isArray(raw.status) ? raw.status : [raw.status]) : undefined,
      visibility: raw.visibility ? (Array.isArray(raw.visibility) ? raw.visibility : [raw.visibility]) : undefined,
      workType: raw.workType ? (Array.isArray(raw.workType) ? raw.workType : [raw.workType]) : undefined,
      remote: raw.remote ? (Array.isArray(raw.remote) ? raw.remote : [raw.remote]) : undefined,
    });
    return this.svc.list(this.tenant(req), f);
  }
  @Get('profiles/me')
  me(@Req() req: any) { return this.svc.myProfile(this.tenant(req), this.actor(req)); }
  @Post('profiles')
  upsert(@Body() body: any, @Req() req: any) {
    return this.svc.upsert(this.tenant(req), this.actor(req), ProfileUpsertSchema.parse(body), this.actor(req));
  }
  @Get('profiles/:id')
  detail(@Param('id') id: string) { return this.svc.detail(id); }
  @Post('profiles/:id/transition')
  transition(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const t = ProfileTransitionSchema.parse(body);
    return this.svc.transition(id, t.next, this.actor(req), t.reason);
  }

  /* ── Windows ── */
  @Get('profiles/:id/windows')
  windows(@Param('id') id: string) { return this.svc.windows(id); }
  @Post('profiles/:id/windows')
  createWindow(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.createWindow(id, WindowUpsertSchema.parse(body), this.actor(req));
  }
  @Delete('profiles/:id/windows/:wid')
  cancelWindow(@Param('id') id: string, @Param('wid') wid: string, @Body() body: any, @Req() req: any) {
    const dto = WindowCancelSchema.parse(body ?? {});
    return this.svc.cancelWindow(id, wid, this.actor(req), dto.reason);
  }

  /* ── Signals ── */
  @Get('signals')
  listSignals(@Query() raw: any, @Req() req: any) {
    const f = SignalListFiltersSchema.parse({
      ...raw,
      page: raw.page ? Number(raw.page) : undefined,
      pageSize: raw.pageSize ? Number(raw.pageSize) : undefined,
      minScore: raw.minScore ? Number(raw.minScore) : undefined,
      status: raw.status ? (Array.isArray(raw.status) ? raw.status : [raw.status]) : undefined,
    });
    return this.svc.listSignals(this.tenant(req), f);
  }
  @Post('signals/:id/action')
  actOnSignal(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.actOnSignal(id, this.actor(req), SignalActionSchema.parse(body));
  }
  @Post('signals/generate')
  generateSignal(@Body() body: any, @Req() req: any) {
    const { profileId, job } = body ?? {};
    if (!profileId || !job?.id) throw new Error('profileId_and_job_required');
    return this.svc.generateSignal(this.tenant(req), profileId, job);
  }

  /* ── Invitations ── */
  @Get('invitations')
  listInvitations(@Query() raw: any, @Req() req: any) {
    const f = InvitationListFiltersSchema.parse({
      ...raw,
      page: raw.page ? Number(raw.page) : undefined,
      pageSize: raw.pageSize ? Number(raw.pageSize) : undefined,
      status: raw.status ? (Array.isArray(raw.status) ? raw.status : [raw.status]) : undefined,
    });
    return this.svc.listInvitations(this.tenant(req), f);
  }
  @Post('invitations')
  createInvitation(@Body() body: any, @Req() req: any) {
    return this.svc.createInvitation(this.tenant(req), InvitationCreateSchema.parse(body), this.actor(req));
  }
  @Post('invitations/:id/decision')
  decide(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.decideInvitation(id, this.actor(req), InvitationDecisionSchema.parse(body));
  }
  @Post('invitations/expire-due')
  expireDue() { return this.svc.expireInvitations(); }

  /* ── Talent search + dashboard + audit ── */
  @Post('talent-search')
  talentSearch(@Body() body: any, @Req() req: any) {
    return this.svc.talentSearch(this.tenant(req), TalentSearchSchema.parse(body ?? {}));
  }
  @Get('dashboard')
  dashboard(@Req() req: any) { return this.svc.dashboard(this.tenant(req)); }
  @Get('profiles/:id/audit')
  audit(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.svc.audit(id, limit ? Number(limit) : 100);
  }
}
