import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExperienceLaunchpadService } from './experience-launchpad.service';
import { ExperienceLaunchpadRepository } from './experience-launchpad.repository';
import {
  ChallengeCreateSchema, EnrollSchema, MentorBookingSchema, MentorUpsertSchema,
  OpportunityCreateSchema, PathwayCreateSchema, ProgressSchema, SubmissionCreateSchema,
} from './dto';

@Controller('api/v1/experience-launchpad')
@UseGuards(JwtAuthGuard)
export class ExperienceLaunchpadController {
  constructor(
    private readonly svc: ExperienceLaunchpadService,
    private readonly repo: ExperienceLaunchpadRepository,
  ) {}
  private id(req: any) { return req.user?.identityId ?? req.user?.sub; }

  @Get('overview')
  overview(@Req() req: any) { return this.svc.overview(this.id(req)); }

  // Discover
  @Get('discover')
  async discover(@Req() req: any, @Query('interests') interests = '') {
    const tags = interests.split(',').map((s) => s.trim()).filter(Boolean);
    const [pathways, mentors, opportunities, challenges] = await Promise.all([
      this.repo.listPathways({ limit: 12 }),
      this.repo.listMentors({ status: 'available', limit: 12 }),
      this.repo.listOpportunities({ tags, limit: 12 }),
      this.repo.listChallenges('open'),
    ]);
    return {
      data: {
        pathways,
        recommended_mentors: this.svc.rankMentors({ interests: tags }, mentors).slice(0, 8),
        opportunities,
        challenges,
      },
      meta: { computed_at: new Date().toISOString() },
    };
  }

  // Pathways
  @Get('pathways')
  pathways(@Query() q: any) {
    return { items: this.repo.listPathways({ domain: q.domain, level: q.level, q: q.q, limit: q.limit ? Number(q.limit) : 50 }) };
  }
  @Get('pathways/:id')
  pathway(@Param('id') id: string) { return this.repo.getPathway(id); }
  @Post('pathways')
  createPathway(@Req() req: any, @Body() body: any) {
    return this.repo.createPathway(PathwayCreateSchema.parse(body), this.id(req));
  }
  @Post('enroll')
  enroll(@Req() req: any, @Body() body: any) {
    const data = EnrollSchema.parse(body);
    return this.repo.enroll(this.id(req), data.pathway_id);
  }
  @Post('progress')
  progress(@Req() req: any, @Body() body: any) {
    const data = ProgressSchema.parse(body);
    return this.repo.setProgress(this.id(req), data.pathway_id, data.progress_pct);
  }
  @Get('my/enrollments')
  myEnrollments(@Req() req: any) { return { items: this.repo.myEnrollments(this.id(req)) }; }

  // Mentors
  @Get('mentors')
  mentors(@Query() q: any) {
    const expertise = q.expertise ? (Array.isArray(q.expertise) ? q.expertise : [q.expertise]) : undefined;
    return { items: this.repo.listMentors({ expertise, status: q.status, q: q.q, limit: q.limit ? Number(q.limit) : 50 }) };
  }
  @Post('mentors/me')
  upsertMentor(@Req() req: any, @Body() body: any) {
    return this.repo.upsertMentor(this.id(req), MentorUpsertSchema.parse(body));
  }
  @Post('mentors/book')
  book(@Req() req: any, @Body() body: any) {
    return this.repo.bookMentor(this.id(req), MentorBookingSchema.parse(body));
  }
  @Get('my/bookings')
  myBookings(@Req() req: any) { return { items: this.repo.myMentorBookings(this.id(req)) }; }

  // Challenges
  @Get('challenges')
  challenges(@Query('status') status?: string) { return { items: this.repo.listChallenges(status) }; }
  @Post('challenges')
  createChallenge(@Body() body: any) { return this.repo.createChallenge(ChallengeCreateSchema.parse(body)); }
  @Post('challenges/submit')
  submit(@Req() req: any, @Body() body: any) {
    return this.repo.submit(this.id(req), SubmissionCreateSchema.parse(body));
  }
  @Get('challenges/:id/leaderboard')
  leaderboard(@Param('id') id: string, @Query('limit') limit?: string) {
    return { items: this.repo.leaderboard(id, limit ? Number(limit) : 50) };
  }

  // Opportunities
  @Get('opportunities')
  opportunities(@Query() q: any) {
    const tags = q.tags ? (Array.isArray(q.tags) ? q.tags : [q.tags]) : undefined;
    return { items: this.repo.listOpportunities({ kind: q.kind, tags, q: q.q, limit: q.limit ? Number(q.limit) : 50 }) };
  }
  @Post('opportunities')
  createOpportunity(@Body() body: any) {
    return this.repo.createOpportunity(OpportunityCreateSchema.parse(body));
  }
}
