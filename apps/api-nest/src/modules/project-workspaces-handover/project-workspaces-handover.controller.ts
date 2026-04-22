/**
 * D37 — public REST surface.
 *
 *   GET  /api/v1/project-workspaces-handover/workspaces
 *   GET  /api/v1/project-workspaces-handover/workspaces/:id
 *   POST /api/v1/project-workspaces-handover/workspaces/from-contract
 *   POST /api/v1/project-workspaces-handover/workspaces/:id/kickoff
 *   POST /api/v1/project-workspaces-handover/milestones/transition
 *   POST /api/v1/project-workspaces-handover/deliverables/submit
 *   POST /api/v1/project-workspaces-handover/deliverables/review
 *   POST /api/v1/project-workspaces-handover/handover/start
 *   POST /api/v1/project-workspaces-handover/handover/complete-item
 *   POST /api/v1/project-workspaces-handover/workspaces/close
 *   POST /api/v1/project-workspaces-handover/workspaces/hold
 *   POST /api/v1/project-workspaces-handover/workspaces/cancel
 *   GET  /api/v1/project-workspaces-handover/insights
 */
import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ProjectWorkspacesHandoverService } from './project-workspaces-handover.service';
import { ProjectWorkspacesHandoverAnalyticsService } from './project-workspaces-handover.analytics.service';
import {
  ListWorkspacesSchema, CreateFromContractSchema, UpdateMilestoneStatusSchema,
  SubmitDeliverableSchema, ReviewDeliverableSchema, StartHandoverSchema,
  CompleteChecklistItemSchema, CloseWorkspaceSchema, HoldOrCancelSchema,
} from './dto';

@Controller('api/v1/project-workspaces-handover')
export class ProjectWorkspacesHandoverController {
  constructor(
    private readonly svc: ProjectWorkspacesHandoverService,
    private readonly analytics: ProjectWorkspacesHandoverAnalyticsService,
  ) {}

  private actor(req: any) { return req?.identityId ?? req?.user?.id ?? 'demo-user'; }
  private tenant(req: any) { return req?.tenantId ?? 'tenant-demo'; }

  @Get('workspaces')
  list(@Query() raw: any, @Req() req: any) {
    const f = ListWorkspacesSchema.parse({ ...raw, page: raw.page ? Number(raw.page) : undefined, pageSize: raw.pageSize ? Number(raw.pageSize) : undefined });
    return this.svc.list(this.tenant(req), { projectId: f.projectId, contractId: f.contractId, status: f.status });
  }

  @Get('workspaces/:id') detail(@Param('id') id: string) { return this.svc.detail(id); }

  @Post('workspaces/from-contract')
  fromContract(@Body() body: any, @Req() req: any) {
    const dto = CreateFromContractSchema.parse(body);
    return this.svc.mintFromContract({
      tenantId: this.tenant(req),
      contractId: dto.contractId,
      projectId: dto.projectId,
      title: dto.title,
      milestones: dto.milestones.map((m) => ({ title: m.title, amountCents: m.amountCents, dueAt: m.dueAt ?? null })),
      parties: dto.parties,
      idempotencyKey: dto.idempotencyKey,
      actor: this.actor(req),
    });
  }

  @Post('workspaces/:id/kickoff') kickoff(@Param('id') id: string, @Req() req: any) {
    return this.svc.kickoff(id, this.actor(req));
  }

  @Post('milestones/transition')
  transition(@Body() body: any, @Req() req: any) {
    const dto = UpdateMilestoneStatusSchema.parse(body);
    return this.svc.updateMilestone(dto.workspaceId, dto.milestoneId, dto.toStatus, dto.expectedVersion, this.actor(req), dto.note);
  }

  @Post('deliverables/submit')
  submitDeliverable(@Body() body: any, @Req() req: any) {
    const dto = SubmitDeliverableSchema.parse(body);
    return this.svc.submitDeliverable({
      workspaceId: dto.workspaceId, milestoneId: dto.milestoneId,
      title: dto.title, url: dto.url, notes: dto.notes,
      idempotencyKey: dto.idempotencyKey, actor: this.actor(req),
    });
  }

  @Post('deliverables/review')
  reviewDeliverable(@Body() body: any, @Req() req: any) {
    const dto = ReviewDeliverableSchema.parse(body);
    return this.svc.reviewDeliverable(dto.workspaceId, dto.deliverableId, dto.decision, dto.feedback, this.actor(req));
  }

  @Post('handover/start')
  startHandover(@Body() body: any, @Req() req: any) {
    const dto = StartHandoverSchema.parse(body);
    return this.svc.startHandover(dto.workspaceId, this.actor(req));
  }

  @Post('handover/complete-item')
  completeItem(@Body() body: any, @Req() req: any) {
    const dto = CompleteChecklistItemSchema.parse(body);
    return this.svc.completeChecklistItem(dto.workspaceId, dto.itemId, this.actor(req), dto.note);
  }

  @Post('workspaces/close')
  close(@Body() body: any, @Req() req: any) {
    const dto = CloseWorkspaceSchema.parse(body);
    return this.svc.closeWorkspace(dto.workspaceId, dto.finalReportMd, dto.idempotencyKey, this.actor(req));
  }

  @Post('workspaces/hold')
  hold(@Body() body: any, @Req() req: any) {
    const dto = HoldOrCancelSchema.parse(body);
    return this.svc.hold(dto.workspaceId, dto.reason, this.actor(req));
  }

  @Post('workspaces/cancel')
  cancel(@Body() body: any, @Req() req: any) {
    const dto = HoldOrCancelSchema.parse(body);
    return this.svc.cancel(dto.workspaceId, dto.reason, this.actor(req));
  }

  @Get('insights')
  insights(@Query('projectId') projectId: string | undefined, @Req() req: any) {
    return this.analytics.insights(this.tenant(req), projectId);
  }
}
