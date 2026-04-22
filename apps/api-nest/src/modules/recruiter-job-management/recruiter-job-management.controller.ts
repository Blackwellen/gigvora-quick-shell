import { Body, Controller, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { RecruiterJobManagementService } from './recruiter-job-management.service';
import {
  ApprovalDecisionSchema, AssignSchema, BulkRequisitionSchema,
  JobListFiltersSchema, JobTransitionSchema, ListFiltersSchema,
  PublishToJobSchema, RequisitionCreateSchema, RequisitionUpdateSchema,
  TransitionSchema,
} from './dto';

/**
 * Domain 26 — REST surface (/api/v1/recruiter-job-management/*).
 *
 *   GET    /requisitions
 *   POST   /requisitions
 *   GET    /requisitions/:id
 *   PUT    /requisitions/:id                       (optimistic concurrency)
 *   POST   /requisitions/:id/transition
 *   POST   /requisitions/:id/approval
 *   POST   /requisitions/:id/assign
 *   POST   /requisitions/:id/publish               (idempotent)
 *   POST   /requisitions/bulk
 *
 *   GET    /jobs
 *   POST   /jobs/:id/transition
 *
 *   GET    /dashboard
 */
@Controller('api/v1/recruiter-job-management')
export class RecruiterJobManagementController {
  constructor(private readonly svc: RecruiterJobManagementService) {}
  private actor(req: any) { return req?.identityId ?? req?.user?.id ?? 'rec-alex'; }
  private tenant(req: any) { return req?.user?.tenantId ?? 'tenant-demo'; }

  @Get('requisitions')
  list(@Query() raw: any, @Req() req: any) {
    const f = ListFiltersSchema.parse({
      ...raw,
      page: raw.page ? Number(raw.page) : undefined,
      pageSize: raw.pageSize ? Number(raw.pageSize) : undefined,
      status: raw.status ? (Array.isArray(raw.status) ? raw.status : [raw.status]) : undefined,
    });
    return this.svc.list(this.tenant(req), f);
  }

  @Post('requisitions')
  create(@Body() body: any, @Req() req: any) {
    return this.svc.create(this.tenant(req), this.actor(req), RequisitionCreateSchema.parse(body));
  }

  @Get('requisitions/:id')
  detail(@Param('id') id: string) { return this.svc.detail(id) ?? { error: 'not_found' }; }

  @Put('requisitions/:id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const expectedVersion = Number(body.expectedVersion ?? 1);
    return this.svc.update(id, expectedVersion, RequisitionUpdateSchema.parse(body.patch ?? body), this.actor(req));
  }

  @Post('requisitions/:id/transition')
  transition(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const t = TransitionSchema.parse(body);
    return this.svc.transition(id, t.next, this.actor(req), t.reason);
  }

  @Post('requisitions/:id/approval')
  approval(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const d = ApprovalDecisionSchema.parse(body);
    return this.svc.decideApproval(id, this.actor(req), d.decision, d.note);
  }

  @Post('requisitions/:id/assign')
  assign(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const a = AssignSchema.parse(body);
    return this.svc.assign(id, a.recruiterIds, this.actor(req));
  }

  @Post('requisitions/:id/publish')
  publish(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const p = PublishToJobSchema.parse(body);
    return this.svc.publish(id, p.idempotencyKey, p.postingChannels, this.actor(req));
  }

  @Post('requisitions/bulk')
  bulk(@Body() body: any, @Req() req: any) {
    const b = BulkRequisitionSchema.parse(body);
    return this.svc.bulk(this.tenant(req), b.ids, b.action, this.actor(req), b.reason);
  }

  @Get('jobs')
  listJobs(@Query() raw: any, @Req() req: any) {
    const f = JobListFiltersSchema.parse({
      ...raw,
      page: raw.page ? Number(raw.page) : undefined,
      pageSize: raw.pageSize ? Number(raw.pageSize) : undefined,
      status: raw.status ? (Array.isArray(raw.status) ? raw.status : [raw.status]) : undefined,
    });
    return this.svc.listJobs(this.tenant(req), f);
  }

  @Post('jobs/:id/transition')
  jobTransition(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const t = JobTransitionSchema.parse(body);
    return this.svc.transitionJob(id, t.next, this.actor(req));
  }

  @Get('dashboard')
  dashboard(@Req() req: any) { return this.svc.dashboard(this.tenant(req)); }
}
