import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VerificationComplianceService } from './verification-compliance.service';
import {
  ListCasesSchema, CreateCaseSchema, TransitionSchema, AssignSchema, DecideSchema,
  AddDocumentSchema, ReviewDocumentSchema, RunCheckSchema, WatchlistAddSchema,
} from './dto';

@Controller('api/v1/verification-compliance')
@UseGuards(AuthGuard('jwt'))
export class VerificationComplianceController {
  constructor(private readonly svc: VerificationComplianceService) {}
  private actor(r: any) { return r.user.sub; }
  private role(r: any)  { return r.user.vcRole ?? r.user.role ?? 'viewer'; }
  private meta(r: any)  { return { ip: r.ip ?? r.headers?.['x-forwarded-for'], userAgent: r.headers?.['user-agent'] }; }

  @Get('overview') overview(@Req() r: any) { return this.svc.overview(this.role(r)); }

  @Get('cases') list(@Req() r: any, @Query() q: any) {
    return this.svc.listCases(this.role(r), ListCasesSchema.parse({
      ...q, page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 25,
    }));
  }
  @Get('cases/:id') detail(@Req() r: any, @Param('id') id: string) { return this.svc.caseDetail(this.role(r), id); }
  @Post('cases') create(@Req() r: any, @Body() body: any) {
    return this.svc.createCase(this.actor(r), this.role(r), CreateCaseSchema.parse(body), this.meta(r));
  }
  @Patch('cases/transition') transition(@Req() r: any, @Body() body: any) {
    return this.svc.transition(this.actor(r), this.role(r), TransitionSchema.parse(body), this.meta(r));
  }
  @Patch('cases/assign') assign(@Req() r: any, @Body() body: any) {
    return this.svc.assign(this.actor(r), this.role(r), AssignSchema.parse(body), this.meta(r));
  }
  @Post('cases/claim-next') claim(@Req() r: any, @Body() body: { queue?: string }) {
    return this.svc.claimNext(this.actor(r), this.role(r), body?.queue ?? 'triage', this.meta(r));
  }
  @Post('cases/decide') decide(@Req() r: any, @Body() body: any) {
    return this.svc.decide(this.actor(r), this.role(r), DecideSchema.parse(body), this.meta(r));
  }

  @Post('documents') addDoc(@Req() r: any, @Body() body: any) {
    return this.svc.addDocument(this.actor(r), this.role(r), AddDocumentSchema.parse(body), this.meta(r));
  }
  @Patch('documents/review') reviewDoc(@Req() r: any, @Body() body: any) {
    return this.svc.reviewDocument(this.actor(r), this.role(r), ReviewDocumentSchema.parse(body), this.meta(r));
  }

  @Post('checks/run') runCheck(@Req() r: any, @Body() body: any) {
    return this.svc.runCheck(this.actor(r), this.role(r), RunCheckSchema.parse(body), this.meta(r));
  }

  @Get('watchlist') listWl(@Req() r: any, @Query() q: any) {
    return this.svc.listWatchlist(this.role(r), { subjectKind: q.subjectKind, severity: q.severity });
  }
  @Post('watchlist') addWl(@Req() r: any, @Body() body: any) {
    return this.svc.addWatchlist(this.actor(r), this.role(r), WatchlistAddSchema.parse(body), this.meta(r));
  }
  @Delete('watchlist/:id') removeWl(@Req() r: any, @Param('id') id: string) {
    return this.svc.removeWatchlist(this.actor(r), this.role(r), id, this.meta(r));
  }
}
