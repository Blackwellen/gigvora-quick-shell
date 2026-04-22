import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { EnterpriseHiringWorkspaceService } from './enterprise-hiring-workspace.service';
import {
  ApprovalDecisionSchema, ApprovalRequestCancelSchema, ApprovalRequestCreateSchema,
  ApprovalRequestListFiltersSchema, ChainTemplateCreateSchema, ChainTemplateListFiltersSchema,
  ChainTemplateUpdateSchema, MembershipBulkSchema, MembershipUpsertSchema,
  ThreadCreateSchema, ThreadListFiltersSchema, ThreadMessageSchema, ThreadStatusSchema,
  TransitionWorkspaceSchema, WorkspaceBulkSchema, WorkspaceCreateSchema,
  WorkspaceListFiltersSchema, WorkspaceUpdateSchema,
} from './dto';

/**
 * Domain 30-hiring REST surface (`/api/v1/enterprise-hiring-workspace/*`).
 *
 *   GET    /workspaces                         list (filters, pagination)
 *   POST   /workspaces                         create
 *   GET    /workspaces/:id                     detail (workspace + members)
 *   PUT    /workspaces/:id                     update (optimistic concurrency)
 *   POST   /workspaces/:id/transition          activate/archive
 *   POST   /workspaces/bulk                    archive/activate many
 *
 *   GET    /workspaces/:id/members             list members
 *   POST   /workspaces/:id/members             upsert member
 *   POST   /workspaces/:id/members/bulk        upsert many
 *   DELETE /workspaces/:id/members/:userId     remove member
 *
 *   GET    /chain-templates                    list (filters)
 *   POST   /chain-templates                    create (draft)
 *   GET    /chain-templates/:id                detail
 *   PUT    /chain-templates/:id                update (draft only)
 *   POST   /chain-templates/:id/publish        publish (becomes selectable)
 *   POST   /chain-templates/:id/archive        archive
 *
 *   GET    /approval-requests                  list (workspace, status, urgency)
 *   POST   /approval-requests                  create from template
 *   GET    /approval-requests/:id              detail (steps + decisions)
 *   POST   /approval-requests/:id/decision     approve/reject/escalate/request_changes
 *   POST   /approval-requests/:id/cancel       cancel (requester only)
 *   POST   /approval-requests/expire-due       sweep expired due dates
 *
 *   GET    /threads                            list collaboration threads
 *   POST   /threads                            create thread + first message
 *   GET    /threads/:id                        detail (messages)
 *   POST   /threads/:id/message                post message + mentions
 *   POST   /threads/:id/status                 resolve / close / reopen
 *
 *   GET    /dashboard                          insights + risk overview
 *   GET    /workspaces/:id/audit               audit trail
 */
@Controller('api/v1/enterprise-hiring-workspace')
export class EnterpriseHiringWorkspaceController {
  constructor(private readonly svc: EnterpriseHiringWorkspaceService) {}
  private actor(req: any) { return req?.identityId ?? req?.user?.id ?? 'rec-alex'; }
  private tenant(req: any) { return req?.user?.tenantId ?? 'tenant-demo'; }

  /* ── Workspaces ─── */
  @Get('workspaces')
  listWorkspaces(@Query() raw: any, @Req() req: any) {
    const f = WorkspaceListFiltersSchema.parse({
      ...raw,
      page: raw.page ? Number(raw.page) : undefined,
      pageSize: raw.pageSize ? Number(raw.pageSize) : undefined,
      status: raw.status ? (Array.isArray(raw.status) ? raw.status : [raw.status]) : undefined,
    });
    return this.svc.list(this.tenant(req), f);
  }
  @Post('workspaces')
  createWorkspace(@Body() body: any, @Req() req: any) {
    return this.svc.create(this.tenant(req), this.actor(req), WorkspaceCreateSchema.parse(body));
  }
  @Get('workspaces/:id')
  detailWorkspace(@Param('id') id: string) { return this.svc.detail(id); }
  @Put('workspaces/:id')
  updateWorkspace(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const expectedVersion = Number(body.expectedVersion ?? 1);
    return this.svc.update(id, expectedVersion, WorkspaceUpdateSchema.parse(body.patch ?? body), this.actor(req));
  }
  @Post('workspaces/:id/transition')
  transitionWorkspace(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const t = TransitionWorkspaceSchema.parse(body);
    return this.svc.transitionWorkspace(id, t.next, this.actor(req), t.reason);
  }
  @Post('workspaces/bulk')
  bulkWorkspaces(@Body() body: any, @Req() req: any) {
    return this.svc.bulk(this.tenant(req), this.actor(req), WorkspaceBulkSchema.parse(body));
  }

  /* ── Members ─── */
  @Get('workspaces/:id/members')
  members(@Param('id') id: string) { return this.svc.members(id); }
  @Post('workspaces/:id/members')
  upsertMember(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.upsertMember(id, MembershipUpsertSchema.parse(body), this.actor(req));
  }
  @Post('workspaces/:id/members/bulk')
  upsertMembers(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const dto = MembershipBulkSchema.parse(body);
    return { items: dto.members.map((m) => this.svc.upsertMember(id, m, this.actor(req))) };
  }
  @Delete('workspaces/:id/members/:userId')
  removeMember(@Param('id') id: string, @Param('userId') userId: string, @Req() req: any) {
    return this.svc.removeMember(id, userId, this.actor(req));
  }

  /* ── Chain templates ─── */
  @Get('chain-templates')
  listTemplates(@Query() raw: any, @Req() req: any) {
    const f = ChainTemplateListFiltersSchema.parse({
      ...raw,
      page: raw.page ? Number(raw.page) : undefined,
      pageSize: raw.pageSize ? Number(raw.pageSize) : undefined,
      status: raw.status ? (Array.isArray(raw.status) ? raw.status : [raw.status]) : undefined,
    });
    return this.svc.listTemplates(this.tenant(req), f);
  }
  @Post('chain-templates')
  createTemplate(@Body() body: any, @Req() req: any) {
    return this.svc.createTemplate(this.tenant(req), this.actor(req), ChainTemplateCreateSchema.parse(body));
  }
  @Get('chain-templates/:id')
  templateDetail(@Param('id') id: string) { return this.svc.templateDetail(id); }
  @Put('chain-templates/:id')
  updateTemplate(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.updateTemplate(id, ChainTemplateUpdateSchema.parse(body), this.actor(req));
  }
  @Post('chain-templates/:id/publish')
  publishTemplate(@Param('id') id: string, @Req() req: any) {
    return this.svc.setTemplateStatus(id, 'published', this.actor(req));
  }
  @Post('chain-templates/:id/archive')
  archiveTemplate(@Param('id') id: string, @Req() req: any) {
    return this.svc.setTemplateStatus(id, 'archived', this.actor(req));
  }

  /* ── Approval requests ─── */
  @Get('approval-requests')
  listRequests(@Query() raw: any, @Req() req: any) {
    const f = ApprovalRequestListFiltersSchema.parse({
      ...raw,
      page: raw.page ? Number(raw.page) : undefined,
      pageSize: raw.pageSize ? Number(raw.pageSize) : undefined,
      status: raw.status ? (Array.isArray(raw.status) ? raw.status : [raw.status]) : undefined,
      subjectKind: raw.subjectKind ? (Array.isArray(raw.subjectKind) ? raw.subjectKind : [raw.subjectKind]) : undefined,
    });
    return this.svc.listRequests(this.tenant(req), f);
  }
  @Post('approval-requests')
  createRequest(@Body() body: any, @Req() req: any) {
    return this.svc.createRequest(this.tenant(req), this.actor(req), ApprovalRequestCreateSchema.parse(body));
  }
  @Get('approval-requests/:id')
  requestDetail(@Param('id') id: string) { return this.svc.requestDetail(id); }
  @Post('approval-requests/:id/decision')
  decide(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.decide(id, this.actor(req), ApprovalDecisionSchema.parse(body));
  }
  @Post('approval-requests/:id/cancel')
  cancelRequest(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const dto = ApprovalRequestCancelSchema.parse(body ?? {});
    return this.svc.cancelRequest(id, this.actor(req), dto.reason);
  }
  @Post('approval-requests/expire-due')
  expireDue() { return this.svc.expireDue(); }

  /* ── Threads ─── */
  @Get('threads')
  listThreads(@Query() raw: any, @Req() req: any) {
    const f = ThreadListFiltersSchema.parse({
      ...raw,
      page: raw.page ? Number(raw.page) : undefined,
      pageSize: raw.pageSize ? Number(raw.pageSize) : undefined,
      status: raw.status ? (Array.isArray(raw.status) ? raw.status : [raw.status]) : undefined,
    });
    return this.svc.listThreads(this.tenant(req), f);
  }
  @Post('threads')
  createThread(@Body() body: any, @Req() req: any) {
    return this.svc.createThread(this.tenant(req), this.actor(req), ThreadCreateSchema.parse(body));
  }
  @Get('threads/:id')
  threadDetail(@Param('id') id: string) { return this.svc.threadDetail(id); }
  @Post('threads/:id/message')
  postMessage(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.postMessage(id, this.actor(req), ThreadMessageSchema.parse(body));
  }
  @Post('threads/:id/status')
  threadStatus(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const t = ThreadStatusSchema.parse(body);
    return this.svc.setThreadStatus(id, t.next, this.actor(req), t.reason);
  }

  /* ── Dashboard + audit ─── */
  @Get('dashboard')
  dashboard(@Query('workspaceId') workspaceId: string | undefined, @Req() req: any) {
    return this.svc.dashboard(this.tenant(req), workspaceId);
  }
  @Get('workspaces/:id/audit')
  audit(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.svc.audit(id, limit ? Number(limit) : 100);
  }
}
