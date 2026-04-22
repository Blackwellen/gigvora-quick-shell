import { Body, Controller, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { InterviewPlanningService } from './interview-planning.service';
import {
  CalibrationDecideSchema, CalibrationOpenSchema,
  InterviewCreateSchema, InterviewListFiltersSchema, InterviewTransitionSchema,
  InterviewUpdateSchema, PanelListFiltersSchema, PanelTemplateCreateSchema,
  PanelTemplateUpdateSchema, RescheduleSchema, ScorecardDraftSchema,
  ScorecardSubmitSchema,
} from './dto';
import { z } from 'zod';

const RsvpSchema = z.object({ response: z.enum(['accepted', 'declined', 'tentative']) });
const PanelStatusSchema = z.object({ status: z.enum(['draft', 'published', 'archived']) });

/**
 * Domain 29 — REST surface (/api/v1/interview-planning/*).
 *
 *   GET    /panels                          POST   /panels
 *   GET    /panels/:id                      PUT    /panels/:id
 *   POST   /panels/:id/status
 *
 *   GET    /interviews                      POST   /interviews         (idempotent)
 *   GET    /interviews/:id                  PUT    /interviews/:id
 *   POST   /interviews/:id/transition
 *   POST   /interviews/:id/reschedule       (idempotent)
 *   POST   /interviews/:id/rsvp
 *
 *   GET    /scorecards
 *   GET    /scorecards/:id
 *   PUT    /scorecards/:id/draft            (autosave)
 *   POST   /scorecards/:id/submit           (idempotent)
 *   POST   /scorecards/:id/withdraw
 *
 *   GET    /calibrations                    POST   /calibrations
 *   GET    /calibrations/:id
 *   POST   /calibrations/:id/decide
 *
 *   GET    /dashboard
 */
@Controller('api/v1/interview-planning')
export class InterviewPlanningController {
  constructor(private readonly svc: InterviewPlanningService) {}
  private actor(req: any) { return req?.identityId ?? req?.user?.id ?? 'rec-alex'; }
  private tenant(req: any) { return req?.user?.tenantId ?? 'tenant-demo'; }

  // ---- Panels
  @Get('panels')
  listPanels(@Query() raw: any, @Req() req: any) {
    const f = PanelListFiltersSchema.parse({
      ...raw,
      page: raw.page ? Number(raw.page) : undefined,
      pageSize: raw.pageSize ? Number(raw.pageSize) : undefined,
      status: raw.status ? (Array.isArray(raw.status) ? raw.status : [raw.status]) : undefined,
    });
    return this.svc.listPanels(this.tenant(req), f);
  }
  @Post('panels')
  createPanel(@Body() body: any, @Req() req: any) {
    return this.svc.createPanel(this.tenant(req), this.actor(req), PanelTemplateCreateSchema.parse(body));
  }
  @Get('panels/:id')
  panelDetail(@Param('id') id: string) { return this.svc.panelDetail(id) ?? { error: 'not_found' }; }
  @Put('panels/:id')
  updatePanel(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const expectedVersion = Number(body.expectedVersion ?? 1);
    return this.svc.updatePanel(id, expectedVersion, PanelTemplateUpdateSchema.parse(body.patch ?? body), this.actor(req));
  }
  @Post('panels/:id/status')
  setPanelStatus(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const p = PanelStatusSchema.parse(body);
    return this.svc.setPanelStatus(id, p.status, this.actor(req));
  }

  // ---- Interviews
  @Get('interviews')
  listInterviews(@Query() raw: any, @Req() req: any) {
    const f = InterviewListFiltersSchema.parse({
      ...raw,
      page: raw.page ? Number(raw.page) : undefined,
      pageSize: raw.pageSize ? Number(raw.pageSize) : undefined,
      status: raw.status ? (Array.isArray(raw.status) ? raw.status : [raw.status]) : undefined,
      kind: raw.kind ? (Array.isArray(raw.kind) ? raw.kind : [raw.kind]) : undefined,
    });
    return this.svc.listInterviews(this.tenant(req), f);
  }
  @Post('interviews')
  createInterview(@Body() body: any, @Req() req: any) {
    const idempotencyKey = req.headers?.['idempotency-key'] as string | undefined;
    return this.svc.createInterview(this.tenant(req), this.actor(req), InterviewCreateSchema.parse(body), idempotencyKey);
  }
  @Get('interviews/:id')
  interviewDetail(@Param('id') id: string) { return this.svc.interviewDetail(id); }
  @Put('interviews/:id')
  updateInterview(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const expectedVersion = Number(body.expectedVersion ?? 1);
    return this.svc.updateInterview(id, expectedVersion, InterviewUpdateSchema.parse(body.patch ?? body), this.actor(req));
  }
  @Post('interviews/:id/transition')
  transition(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const t = InterviewTransitionSchema.parse(body);
    return this.svc.transitionInterview(id, t.next, this.actor(req), t.reason);
  }
  @Post('interviews/:id/reschedule')
  reschedule(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const r = RescheduleSchema.parse(body);
    return this.svc.reschedule(id, r.startAt, r.idempotencyKey, this.actor(req), r.reason);
  }
  @Post('interviews/:id/rsvp')
  rsvp(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const r = RsvpSchema.parse(body);
    return this.svc.rsvp(id, this.actor(req), r.response);
  }

  // ---- Scorecards
  @Get('scorecards')
  listScorecards(@Query() raw: any, @Req() req: any) {
    return this.svc.listScorecards(this.tenant(req), {
      interviewId: raw.interviewId, candidateId: raw.candidateId, interviewerId: raw.interviewerId,
      status: raw.status ? (Array.isArray(raw.status) ? raw.status : [raw.status]) : undefined,
    });
  }
  @Get('scorecards/:id')
  scorecardDetail(@Param('id') id: string) { return this.svc.scorecardDetail(id) ?? { error: 'not_found' }; }
  @Put('scorecards/:id/draft')
  draftScorecard(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const d = ScorecardDraftSchema.parse(body);
    const { expectedVersion, ...patch } = d;
    return this.svc.draftScorecard(id, expectedVersion, patch, this.actor(req));
  }
  @Post('scorecards/:id/submit')
  submitScorecard(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const s = ScorecardSubmitSchema.parse(body);
    return this.svc.submitScorecard(id, s, s.idempotencyKey, this.actor(req));
  }
  @Post('scorecards/:id/withdraw')
  withdrawScorecard(@Param('id') id: string, @Req() req: any) {
    return this.svc.withdrawScorecard(id, this.actor(req));
  }

  // ---- Calibrations
  @Get('calibrations')
  listCalibrations(@Query() raw: any, @Req() req: any) {
    return this.svc.listCalibrations(this.tenant(req), {
      candidateId: raw.candidateId, jobId: raw.jobId,
      status: raw.status as 'open' | 'decided' | undefined,
    });
  }
  @Post('calibrations')
  openCalibration(@Body() body: any, @Req() req: any) {
    return this.svc.openCalibration(this.tenant(req), this.actor(req), CalibrationOpenSchema.parse(body));
  }
  @Get('calibrations/:id')
  calibrationDetail(@Param('id') id: string) { return this.svc.calibrationDetail(id) ?? { error: 'not_found' }; }
  @Post('calibrations/:id/decide')
  decideCalibration(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.decideCalibration(id, CalibrationDecideSchema.parse(body), this.actor(req));
  }

  // ---- Dashboard
  @Get('dashboard')
  dashboard(@Req() req: any) { return this.svc.dashboard(this.tenant(req)); }
}
