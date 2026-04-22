import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { JobApplicationFlowService } from './job-application-flow.service';
import {
  ApplicationDraftSchema, ApplicationUpdateSchema, ApplicationSubmitSchema,
  BulkActionSchema, FormTemplateCreateSchema, FormTemplateUpdateSchema,
  ListFiltersSchema, ReviewDecisionSchema, WithdrawSchema,
} from './dto';

/**
 * Domain 25 — public REST surface (/api/v1/job-application-flow/*).
 *
 *   GET    /templates                              — list (filter by jobId)
 *   POST   /templates                              — create draft
 *   GET    /templates/:id                          — detail
 *   PUT    /templates/:id                          — patch
 *   POST   /templates/:id/publish                  — publish
 *   POST   /templates/:id/archive                  — archive
 *
 *   GET    /applications                           — recruiter list (filter/sort/page)
 *   POST   /applications                           — candidate creates draft
 *   GET    /applications/:id                       — detail (+reviews +audit)
 *   PUT    /applications/:id                       — candidate edits draft
 *   POST   /applications/:id/submit                — idempotent submission
 *   POST   /applications/:id/withdraw              — candidate withdraw
 *
 *   GET    /reviews/queue                          — recruiter queue
 *   POST   /applications/:id/decision              — reviewer decision
 *   POST   /applications/bulk                      — bulk recruiter action
 *
 *   GET    /insights                               — pipeline analytics
 */
@Controller('api/v1/job-application-flow')
export class JobApplicationFlowController {
  constructor(private readonly svc: JobApplicationFlowService) {}
  private actor(req: any) { return req?.identityId ?? req?.user?.id ?? 'anonymous'; }
  private name(req: any) { return req?.user?.name ?? 'Candidate'; }
  private email(req: any) { return req?.user?.email ?? 'candidate@example.com'; }
  private tenant(req: any) { return req?.user?.tenantId ?? 'tenant-demo'; }

  // ---- Templates ----
  @Get('templates')
  listTemplates(@Query('jobId') jobId: string | undefined, @Req() req: any) {
    return { items: this.svc.listTemplates(this.tenant(req), jobId) };
  }
  @Post('templates')
  createTemplate(@Body() body: any, @Req() req: any) {
    return this.svc.createTemplate(this.tenant(req), FormTemplateCreateSchema.parse(body));
  }
  @Get('templates/:id')
  templateDetail(@Param('id') id: string) { return this.svc.template(id) ?? { error: 'not_found' }; }
  @Put('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateTemplate(id, FormTemplateUpdateSchema.parse(body));
  }
  @Post('templates/:id/publish') publishTemplate(@Param('id') id: string) { return this.svc.publishTemplate(id); }
  @Post('templates/:id/archive') archiveTemplate(@Param('id') id: string) { return this.svc.archiveTemplate(id); }

  // ---- Applications ----
  @Get('applications')
  list(@Query() raw: any, @Req() req: any) {
    const f = ListFiltersSchema.parse({
      ...raw,
      page: raw.page ? Number(raw.page) : undefined,
      pageSize: raw.pageSize ? Number(raw.pageSize) : undefined,
      status: raw.status ? (Array.isArray(raw.status) ? raw.status : [raw.status]) : undefined,
    });
    return this.svc.list(this.tenant(req), f);
  }

  @Post('applications')
  createDraft(@Body() body: any, @Req() req: any) {
    return this.svc.createDraft(
      this.tenant(req), this.actor(req), this.name(req), this.email(req),
      ApplicationDraftSchema.parse(body),
    );
  }

  @Get('applications/:id')
  detail(@Param('id') id: string) { return this.svc.detail(id) ?? { error: 'not_found' }; }

  @Put('applications/:id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const expectedVersion = Number(body.expectedVersion ?? 1);
    return this.svc.update(id, expectedVersion, ApplicationUpdateSchema.parse(body.patch ?? body), this.actor(req));
  }

  @Post('applications/:id/submit')
  async submit(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const p = ApplicationSubmitSchema.parse({ applicationId: id, idempotencyKey: body.idempotencyKey });
    return this.svc.submit(id, p.idempotencyKey, this.actor(req));
  }

  @Post('applications/:id/withdraw')
  withdraw(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const p = WithdrawSchema.parse(body ?? {});
    return this.svc.withdraw(id, this.actor(req), p.reason);
  }

  // ---- Reviews ----
  @Get('reviews/queue')
  queue(@Req() req: any) { return { items: this.svc.reviewQueue(this.tenant(req)) }; }

  @Post('applications/:id/decision')
  decide(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const d = ReviewDecisionSchema.parse(body);
    return this.svc.decide(id, this.actor(req), this.name(req), {
      decision: d.decision as any, stage: d.stage, note: d.note, scorecard: d.scorecard,
    });
  }

  @Post('applications/bulk')
  bulk(@Body() body: any, @Req() req: any) {
    const b = BulkActionSchema.parse(body);
    return this.svc.bulk(this.tenant(req), this.actor(req), b.ids, b.action, b.note);
  }

  // ---- Insights ----
  @Get('insights')
  insights(@Query('jobId') jobId: string | undefined, @Req() req: any) {
    return this.svc.insights(this.tenant(req), jobId);
  }
}
