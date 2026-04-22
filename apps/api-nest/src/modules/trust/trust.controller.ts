import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TrustService } from './trust.service';
import {
  BadgeAwardDto, CreateReviewDto, DisputeReviewDto, HelpfulVoteDto, ListReviewsQuery,
  ModerationDecisionDto, ReferenceRequestDto, ReferenceSubmitDto, ReviewResponseDto,
  TrustScoreQuery, UpdateReviewDto, VerificationStartDto,
} from './dto';

@Controller('api/v1/trust')
export class TrustController {
  constructor(private readonly svc: TrustService) {}

  // ---------- public discovery ----------
  @Get('reviews')
  listReviews(@Query() q: any, @Req() req: any) {
    return this.svc.listReviews(req.user?.userId ?? null, ListReviewsQuery.parse(q));
  }
  @Get('reviews/:id')
  getReview(@Param('id') id: string, @Req() req: any) {
    return this.svc.getReview(id, req.user?.userId ?? null);
  }
  @Get('summary')
  summary(@Query('subjectKind') subjectKind: string, @Query('subjectId') subjectId: string) {
    TrustScoreQuery.parse({ subjectKind, subjectId });
    return this.svc.ratingSummary(subjectKind, subjectId);
  }
  @Get('score')
  score(@Query('subjectKind') subjectKind: string, @Query('subjectId') subjectId: string) {
    TrustScoreQuery.parse({ subjectKind, subjectId });
    return this.svc.trustScore(subjectKind, subjectId);
  }
  @Get('badges')
  listBadges(@Query('subjectKind') subjectKind: string, @Query('subjectId') subjectId: string) {
    TrustScoreQuery.parse({ subjectKind, subjectId });
    return this.svc.listBadges(subjectKind, subjectId);
  }

  // ---------- review write ----------
  @UseGuards(AuthGuard('jwt')) @Post('reviews')
  createReview(@Body() body: any, @Req() req: any) {
    return this.svc.createReview(req.user.userId, CreateReviewDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt')) @Patch('reviews/:id')
  updateReview(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.updateReview(id, req.user.userId, UpdateReviewDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt')) @Post('reviews/:id/respond')
  respond(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const dto = ReviewResponseDto.parse(body);
    return this.svc.respondToReview(id, req.user.userId, dto.body);
  }
  @UseGuards(AuthGuard('jwt')) @Post('reviews/:id/dispute')
  dispute(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const dto = DisputeReviewDto.parse(body);
    return this.svc.disputeReview(id, req.user.userId, dto.reason);
  }
  @UseGuards(AuthGuard('jwt')) @Post('reviews/:id/helpful')
  helpful(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const dto = HelpfulVoteDto.parse(body);
    return this.svc.voteHelpful(id, req.user.userId, dto.helpful);
  }

  // ---------- moderation (operator-only at deploy; gated here by JWT minimum) ----------
  @UseGuards(AuthGuard('jwt')) @Get('moderation/queue')
  modQueue(@Req() req: any) { return this.svc.moderationQueue(req.user.userId); }
  @UseGuards(AuthGuard('jwt')) @Post('moderation/:id')
  modDecide(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const dto = ModerationDecisionDto.parse(body);
    return this.svc.moderate(id, req.user.userId, dto.action as any, dto.notes);
  }

  // ---------- references ----------
  @UseGuards(AuthGuard('jwt')) @Get('references')
  listReferences(@Req() req: any) { return this.svc.listReferences(req.user.userId); }
  @UseGuards(AuthGuard('jwt')) @Post('references')
  requestReference(@Body() body: any, @Req() req: any) {
    return this.svc.requestReference(req.user.userId, ReferenceRequestDto.parse(body));
  }
  @Post('references/submit')  // public: referee uses tokenised link
  submitReference(@Body() body: any) {
    const dto = ReferenceSubmitDto.parse(body);
    return this.svc.submitReference(dto.token, dto.body, dto.rating);
  }

  // ---------- verifications ----------
  @UseGuards(AuthGuard('jwt')) @Get('verifications')
  listVer(@Req() req: any) { return this.svc.listVerifications(req.user.userId); }
  @UseGuards(AuthGuard('jwt')) @Post('verifications')
  startVer(@Body() body: any, @Req() req: any) {
    const dto = VerificationStartDto.parse(body);
    return this.svc.startVerification(req.user.userId, dto.kind, dto.evidence);
  }

  // ---------- badges (admin/system in production) ----------
  @UseGuards(AuthGuard('jwt')) @Post('badges')
  award(@Body() body: any, @Req() req: any) {
    return this.svc.awardBadge(req.user.userId, BadgeAwardDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt')) @Delete('badges/:id')
  revoke(@Param('id') id: string, @Req() req: any) { return this.svc.revokeBadge(id, req.user.userId); }
}
