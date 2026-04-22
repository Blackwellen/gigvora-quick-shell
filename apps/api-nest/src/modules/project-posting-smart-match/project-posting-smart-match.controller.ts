/**
 * Domain 33 — public REST surface.
 *
 *   GET    /api/v1/project-posting-smart-match/projects                       — list mine
 *   GET    /api/v1/project-posting-smart-match/projects/:id                   — detail
 *   POST   /api/v1/project-posting-smart-match/projects                       — create draft
 *   PUT    /api/v1/project-posting-smart-match/projects/:id                   — update (optimistic)
 *   POST   /api/v1/project-posting-smart-match/projects/:id/submit            — submit for review
 *   POST   /api/v1/project-posting-smart-match/projects/:id/decision          — approve / reject / request changes
 *   POST   /api/v1/project-posting-smart-match/projects/:id/publish           — publish + apply tier + idempotency
 *   POST   /api/v1/project-posting-smart-match/projects/:id/pause             — pause
 *   POST   /api/v1/project-posting-smart-match/projects/:id/resume            — resume
 *   POST   /api/v1/project-posting-smart-match/projects/:id/archive           — archive
 *   GET    /api/v1/project-posting-smart-match/approvals                      — recruiter queue
 *
 *   POST   /api/v1/project-posting-smart-match/match                          — smart match
 *   GET    /api/v1/project-posting-smart-match/projects/:id/invites           — list invites
 *   POST   /api/v1/project-posting-smart-match/invites                        — single invite
 *   POST   /api/v1/project-posting-smart-match/invites/bulk                   — bulk invite
 *   POST   /api/v1/project-posting-smart-match/invites/decision               — accept / decline / maybe
 *   DELETE /api/v1/project-posting-smart-match/invites/:id                    — revoke
 *
 *   GET    /api/v1/project-posting-smart-match/boost/packs                    — boost + invite-credit packs
 *   GET    /api/v1/project-posting-smart-match/boost/balance                  — wallet + ledger
 *   POST   /api/v1/project-posting-smart-match/boost/purchases                — create purchase (multi-step #1)
 *   POST   /api/v1/project-posting-smart-match/boost/purchases/:id/confirm    — confirm (multi-step #2)
 *   POST   /api/v1/project-posting-smart-match/boost/apply                    — apply boost to project
 *
 *   GET    /api/v1/project-posting-smart-match/insights                       — KPI band + anomaly
 */
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ProjectPostingSmartMatchService } from './project-posting-smart-match.service';
import {
  ProjectStudioDraftSchema, ProjectStudioUpdateSchema, ListFiltersSchema,
  PublishSchema, MatchRequestSchema, InviteCreateSchema, InviteBulkSchema, InviteDecisionSchema,
  BoostPurchaseCreateSchema, BoostPurchaseConfirmSchema, ApplyBoostSchema, ApprovalDecisionSchema,
} from './dto';

@Controller('api/v1/project-posting-smart-match')
export class ProjectPostingSmartMatchController {
  constructor(private readonly svc: ProjectPostingSmartMatchService) {}

  private actor(req: any): string { return req?.identityId ?? req?.user?.id ?? 'demo-user'; }
  private tenant(req: any): string { return req?.tenantId ?? 'tenant-demo'; }
  private displayName(req: any): string { return req?.user?.displayName ?? req?.user?.name ?? 'You'; }

  // ─── Projects ────────────────────────────────────────────────────────
  @Get('projects')
  list(@Query() raw: any, @Req() req: any) {
    ListFiltersSchema.parse({ ...raw, page: raw.page ? Number(raw.page) : undefined, pageSize: raw.pageSize ? Number(raw.pageSize) : undefined });
    return this.svc.list(this.tenant(req));
  }
  @Get('projects/:id') detail(@Param('id') id: string) { return this.svc.detail(id); }
  @Post('projects')
  create(@Body() body: any, @Req() req: any) {
    return this.svc.create(this.tenant(req), this.actor(req), this.displayName(req), ProjectStudioDraftSchema.parse(body));
  }
  @Put('projects/:id')
  update(@Param('id') id: string, @Body() body: { expectedVersion: number; patch: any }, @Req() req: any) {
    return this.svc.update(id, body.expectedVersion, ProjectStudioUpdateSchema.parse(body.patch), this.actor(req));
  }
  @Post('projects/:id/submit') submit(@Param('id') id: string, @Req() req: any) { return this.svc.submitForReview(id, this.actor(req)); }
  @Post('projects/:id/decision')
  decide(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const dto = ApprovalDecisionSchema.parse(body);
    return this.svc.decideApproval(id, dto.decision, this.actor(req), dto.note);
  }
  @Post('projects/:id/publish')
  publish(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.publish(id, this.actor(req), PublishSchema.parse(body));
  }
  @Post('projects/:id/pause')   pause  (@Param('id') id: string, @Req() req: any) { return this.svc.pause(id, this.actor(req)); }
  @Post('projects/:id/resume')  resume (@Param('id') id: string, @Req() req: any) { return this.svc.resume(id, this.actor(req)); }
  @Post('projects/:id/archive') archive(@Param('id') id: string, @Req() req: any) { return this.svc.archive(id, this.actor(req)); }
  @Get('approvals') queue(@Req() req: any) { return this.svc.approvalQueue(this.tenant(req)); }

  // ─── Smart Match + invites ───────────────────────────────────────────
  @Post('match')
  match(@Body() body: any) {
    const dto = MatchRequestSchema.parse(body);
    return this.svc.smartMatch(dto.projectId, { topK: dto.topK, diversify: dto.diversify, minScore: dto.minScore, excludeInvited: dto.excludeInvited });
  }
  @Get('projects/:id/invites') projectInvites(@Param('id') id: string) { return this.svc.invitesForProject(id); }
  @Post('invites')
  invite(@Body() body: any, @Req() req: any) {
    const dto = InviteCreateSchema.parse(body);
    return this.svc.invite(dto.projectId, dto.candidateId, this.actor(req), dto.channel, dto.message, dto.expiresInDays);
  }
  @Post('invites/bulk')
  inviteBulk(@Body() body: any, @Req() req: any) {
    const dto = InviteBulkSchema.parse(body);
    return this.svc.inviteBulk(dto.projectId, dto.candidateIds, this.actor(req), dto.channel, dto.message, dto.expiresInDays);
  }
  @Post('invites/decision')
  decideInvite(@Body() body: any) {
    const dto = InviteDecisionSchema.parse(body);
    return this.svc.decideInvite(dto.inviteId, dto.decision, dto.note);
  }
  @Delete('invites/:id') revoke(@Param('id') id: string, @Req() req: any) { return this.svc.revokeInvite(id, this.actor(req)); }

  // ─── Boost-credit checkout ───────────────────────────────────────────
  @Get('boost/packs')   packs()                  { return this.svc.boostPacks(); }
  @Get('boost/balance') balance(@Req() req: any) { return this.svc.boostBalance(this.tenant(req)); }
  @Post('boost/purchases')
  createPurchase(@Body() body: any, @Req() req: any) {
    const dto = BoostPurchaseCreateSchema.parse(body);
    return this.svc.createBoostPurchase(this.tenant(req), this.actor(req), dto.packId);
  }
  @Post('boost/purchases/:id/confirm')
  confirmPurchase(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const dto = BoostPurchaseConfirmSchema.parse({ ...body, purchaseId: id });
    return this.svc.confirmBoostPurchase(dto.purchaseId, dto.idempotencyKey, this.actor(req));
  }
  @Post('boost/apply')
  applyBoost(@Body() body: any, @Req() req: any) {
    const dto = ApplyBoostSchema.parse(body);
    return this.svc.applyBoost(dto.projectId, dto.promotionTier, dto.durationDays, dto.idempotencyKey, this.actor(req));
  }

  @Get('insights') insights(@Req() req: any) { return this.svc.insights(this.tenant(req)); }
}
