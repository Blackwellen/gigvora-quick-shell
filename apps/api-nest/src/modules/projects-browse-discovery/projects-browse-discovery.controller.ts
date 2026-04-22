/**
 * Domain 32 — public REST surface.
 *
 *   GET    /api/v1/projects-browse/search                  — discovery feed
 *   GET    /api/v1/projects-browse/insights                — analytics card
 *   GET    /api/v1/projects-browse/projects/:id            — detail + proposals
 *   POST   /api/v1/projects-browse/projects/:id/save       — toggle bookmark
 *   GET    /api/v1/projects-browse/bookmarks               — bookmarked ids
 *   GET    /api/v1/projects-browse/saved                   — saved searches
 *   POST   /api/v1/projects-browse/saved                   — upsert saved
 *   DELETE /api/v1/projects-browse/saved/:id               — remove saved
 *   POST   /api/v1/projects-browse/proposals               — draft
 *   POST   /api/v1/projects-browse/proposals/:id/submit    — submit
 *   POST   /api/v1/projects-browse/proposals/:id/withdraw  — withdraw
 *   POST   /api/v1/projects-browse/proposals/decision      — shortlist/accept/reject
 *   GET    /api/v1/projects-browse/proposals/mine          — author view
 *   POST   /api/v1/projects-browse/projects/:id/transition — status change
 *   POST   /api/v1/projects-browse/flag                    — moderation flag
 *   POST   /api/v1/projects-browse/invite                  — invite to bid
 *   POST   /api/v1/projects-browse/attachments             — register upload
 *   DELETE /api/v1/projects-browse/projects/:pid/attachments/:aid
 */
import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ProjectsBrowseDiscoveryService } from './projects-browse-discovery.service';
import {
  ProjectBrowseFiltersSchema, SavedProjectSearchSchema, ProposalDraftSchema,
  ProposalDecisionSchema, ProjectFlagSchema, ProjectInviteSchema,
  AttachmentUploadCompleteSchema,
} from './dto';

@Controller('api/v1/projects-browse')
export class ProjectsBrowseDiscoveryController {
  constructor(private readonly svc: ProjectsBrowseDiscoveryService) {}

  private identityId(req: any): string | undefined { return req?.identityId ?? req?.user?.id; }
  private displayName(req: any): string { return req?.user?.displayName ?? req?.user?.name ?? 'You'; }
  private tenantId(req: any): string { return req?.tenantId ?? 'tenant-demo'; }

  @Get('search')
  search(@Query() raw: any, @Req() req: any) {
    const f = ProjectBrowseFiltersSchema.parse({
      ...raw,
      page: raw.page ? Number(raw.page) : undefined,
      pageSize: raw.pageSize ? Number(raw.pageSize) : undefined,
      budgetMin: raw.budgetMin ? Number(raw.budgetMin) : undefined,
      budgetMax: raw.budgetMax ? Number(raw.budgetMax) : undefined,
      proposalsBelow: raw.proposalsBelow ? Number(raw.proposalsBelow) : undefined,
      postedWithinDays: raw.postedWithinDays ? Number(raw.postedWithinDays) : undefined,
      engagement: raw.engagement ? (Array.isArray(raw.engagement) ? raw.engagement : [raw.engagement]) : undefined,
      skills: raw.skills ? (Array.isArray(raw.skills) ? raw.skills : [raw.skills]) : undefined,
      categories: raw.categories ? (Array.isArray(raw.categories) ? raw.categories : [raw.categories]) : undefined,
      durationBuckets: raw.durationBuckets ? (Array.isArray(raw.durationBuckets) ? raw.durationBuckets : [raw.durationBuckets]) : undefined,
      experienceLevel: raw.experienceLevel ? (Array.isArray(raw.experienceLevel) ? raw.experienceLevel : [raw.experienceLevel]) : undefined,
      status: raw.status ? (Array.isArray(raw.status) ? raw.status : [raw.status]) : undefined,
      clientVerified: raw.clientVerified === undefined ? undefined : raw.clientVerified === 'true' || raw.clientVerified === true,
      hasNda: raw.hasNda === undefined ? undefined : raw.hasNda === 'true' || raw.hasNda === true,
    });
    return this.svc.search(f, this.identityId(req), this.tenantId(req));
  }

  @Get('insights')
  insights(@Req() req: any) { return this.svc.insights(this.identityId(req)); }

  @Get('projects/:id')
  detail(@Param('id') id: string, @Req() req: any) { return this.svc.detail(id, this.identityId(req), this.tenantId(req)); }

  @Post('projects/:id/save')
  bookmark(@Param('id') id: string, @Req() req: any) {
    const me = this.identityId(req); if (!me) return { projectId: id, saved: false };
    return this.svc.toggleBookmark(me, id, this.tenantId(req));
  }

  @Get('bookmarks')
  bookmarks(@Req() req: any) { const me = this.identityId(req); return me ? this.svc.bookmarkIds(me) : []; }

  @Get('saved')
  listSaved(@Req() req: any) { const me = this.identityId(req); return me ? this.svc.listSaved(me) : []; }

  @Post('saved')
  upsertSaved(@Body() body: any, @Req() req: any) {
    const me = this.identityId(req) ?? 'anonymous';
    return this.svc.upsertSaved(me, SavedProjectSearchSchema.parse(body), this.tenantId(req));
  }

  @Delete('saved/:id')
  removeSaved(@Param('id') id: string, @Req() req: any) {
    const me = this.identityId(req) ?? 'anonymous';
    return this.svc.removeSaved(me, id, this.tenantId(req));
  }

  @Post('proposals')
  draftProposal(@Body() body: any, @Req() req: any) {
    const me = this.identityId(req) ?? 'anonymous';
    return this.svc.draftProposal(me, this.displayName(req), ProposalDraftSchema.parse(body), this.tenantId(req));
  }

  @Post('proposals/:id/submit')
  submitProposal(@Param('id') id: string, @Req() req: any) {
    return this.svc.submitProposal(id, this.tenantId(req));
  }

  @Post('proposals/:id/withdraw')
  withdrawProposal(@Param('id') id: string, @Req() req: any) {
    const me = this.identityId(req) ?? 'anonymous';
    return this.svc.withdrawProposal(id, me, this.tenantId(req));
  }

  @Post('proposals/decision')
  decideProposal(@Body() body: any, @Req() req: any) {
    return this.svc.decideProposal(ProposalDecisionSchema.parse(body), this.tenantId(req));
  }

  @Get('proposals/mine')
  myProposals(@Req() req: any) { const me = this.identityId(req); return me ? this.svc.myProposals(me) : []; }

  @Post('projects/:id/transition')
  transition(@Param('id') id: string, @Body() body: { status: any }, @Req() req: any) {
    const me = this.identityId(req) ?? 'anonymous';
    return this.svc.transitionProject(id, body.status, me, this.tenantId(req));
  }

  @Post('flag')
  flag(@Body() body: any, @Req() req: any) {
    const me = this.identityId(req) ?? 'anonymous';
    return this.svc.flagProject(me, ProjectFlagSchema.parse(body), this.tenantId(req));
  }

  @Post('invite')
  invite(@Body() body: any, @Req() req: any) {
    const me = this.identityId(req) ?? 'anonymous';
    return this.svc.inviteToProject(me, ProjectInviteSchema.parse(body), this.tenantId(req));
  }

  @Post('attachments')
  registerAttachment(@Body() body: any, @Req() req: any) {
    return this.svc.registerAttachmentUpload(AttachmentUploadCompleteSchema.parse(body), this.tenantId(req));
  }

  @Delete('projects/:pid/attachments/:aid')
  removeAttachment(@Param('pid') pid: string, @Param('aid') aid: string, @Req() req: any) {
    return this.svc.removeAttachment(pid, aid, this.tenantId(req));
  }
}
