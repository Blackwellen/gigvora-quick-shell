/**
 * D35 — public REST surface.
 *
 *   GET    /api/v1/proposal-review-award/reviews
 *   GET    /api/v1/proposal-review-award/reviews/:id
 *   POST   /api/v1/proposal-review-award/reviews/decision
 *   POST   /api/v1/proposal-review-award/reviews/bulk-decision
 *   POST   /api/v1/proposal-review-award/reviews/rank
 *   POST   /api/v1/proposal-review-award/reviews/note
 *
 *   POST   /api/v1/proposal-review-award/compare
 *   POST   /api/v1/proposal-review-award/scoring/weights
 *   GET    /api/v1/proposal-review-award/scoring/:projectId
 *
 *   POST   /api/v1/proposal-review-award/awards
 *   GET    /api/v1/proposal-review-award/awards
 *   POST   /api/v1/proposal-review-award/awards/:id/cancel
 *   POST   /api/v1/proposal-review-award/awards/:id/approval
 *   POST   /api/v1/proposal-review-award/approvals/:id/decide
 *   GET    /api/v1/proposal-review-award/approvals
 *
 *   GET    /api/v1/proposal-review-award/insights
 */
import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ProposalReviewAwardService } from './proposal-review-award.service';
import {
  ListReviewSchema, CompareSchema, DecisionSchema, BulkDecisionSchema,
  AwardSchema, ApprovalRequestSchema, ApprovalDecideSchema, ScoringWeightsSchema, NoteSchema,
} from './dto';

@Controller('api/v1/proposal-review-award')
export class ProposalReviewAwardController {
  constructor(private readonly svc: ProposalReviewAwardService) {}

  private actor(req: any) { return req?.identityId ?? req?.user?.id ?? 'demo-user'; }
  private tenant(req: any) { return req?.tenantId ?? 'tenant-demo'; }

  @Get('reviews')
  list(@Query() raw: any, @Req() req: any) {
    const f = ListReviewSchema.parse({ ...raw, page: raw.page ? Number(raw.page) : undefined, pageSize: raw.pageSize ? Number(raw.pageSize) : undefined });
    return this.svc.list(this.tenant(req), { projectId: f.projectId, status: f.status });
  }
  @Get('reviews/:id') detail(@Param('id') id: string, @Req() req: any) { return this.svc.detail(id, this.actor(req)); }

  @Post('reviews/decision')
  decide(@Body() body: any, @Req() req: any) {
    const dto = DecisionSchema.parse(body);
    if (dto.decision === 'award' || dto.decision === 'unaward') throw new Error('use_award_endpoint');
    return this.svc.decide(dto.proposalId, dto.decision, this.actor(req), dto.note, dto.shortlistRank);
  }
  @Post('reviews/bulk-decision')
  bulk(@Body() body: any, @Req() req: any) {
    const dto = BulkDecisionSchema.parse(body);
    return this.svc.bulkDecide(dto.proposalIds, dto.decision, this.actor(req), dto.note);
  }
  @Post('reviews/rank')
  rank(@Body() body: { reviewId: string; rank: number | null }, @Req() req: any) {
    return this.svc.rank(body.reviewId, body.rank, this.actor(req));
  }
  @Post('reviews/note')
  note(@Body() body: any, @Req() req: any) {
    const dto = NoteSchema.parse(body);
    return this.svc.addNote(this.tenant(req), dto.proposalId, dto.body, dto.visibility, this.actor(req));
  }

  @Post('compare')
  compare(@Body() body: any) {
    const dto = CompareSchema.parse(body);
    return this.svc.compare(dto.projectId, dto.proposalIds, dto.weights);
  }
  @Post('scoring/weights')
  weights(@Body() body: any, @Req() req: any) {
    const dto = ScoringWeightsSchema.parse(body);
    return this.svc.setWeights(dto.projectId, dto.weights, this.actor(req));
  }
  @Get('scoring/:projectId')
  scoring(@Param('projectId') projectId: string) { return this.svc.scoreProject(projectId); }

  @Post('awards')
  draftAward(@Body() body: any, @Req() req: any) {
    const dto = AwardSchema.parse(body);
    return this.svc.draftAward({
      tenantId: this.tenant(req), reviewId: dto.proposalId, decidedBy: this.actor(req),
      amountCents: dto.amountCents, currency: dto.currency, paymentMethod: dto.paymentMethod,
      scopeAcknowledgement: dto.scopeAcknowledgement,
      triggerEscrow: dto.triggerEscrow, triggerApprovalChain: dto.triggerApprovalChain,
      idempotencyKey: dto.idempotencyKey,
    });
  }
  @Get('awards') awards(@Req() req: any) { return this.svc.decisionsFor(this.tenant(req)); }
  @Post('awards/:id/cancel') cancel(@Param('id') id: string, @Req() req: any) { return this.svc.cancelAward(id, this.actor(req)); }
  @Post('awards/:id/approval')
  requestApproval(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const dto = ApprovalRequestSchema.parse({ ...body, decisionId: id });
    return this.svc.requestApproval(dto.decisionId, dto.approverIds, dto.threshold, dto.note, this.actor(req));
  }
  @Post('approvals/:id/decide')
  decideApproval(@Param('id') id: string, @Body() body: any) {
    const dto = ApprovalDecideSchema.parse({ ...body, approvalId: id });
    return this.svc.decideApproval(dto.approvalId, dto.approverId, dto.decision, dto.note);
  }
  @Get('approvals') approvals(@Req() req: any) { return this.svc.approvalsFor(this.tenant(req)); }

  @Get('insights') insights(@Query('projectId') projectId: string | undefined, @Req() req: any) {
    return this.svc.insights(this.tenant(req), projectId);
  }
}
