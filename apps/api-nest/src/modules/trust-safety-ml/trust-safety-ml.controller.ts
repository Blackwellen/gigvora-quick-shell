import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TrustSafetyMlService } from './trust-safety-ml.service';
import {
  CreateSignalSchema, ListSignalsSchema, CreateCaseSchema, ListCasesSchema,
  TransitionSchema, AssignSchema, DecideSchema, MlReviewSchema, WatchlistSchema,
} from './dto';

@Controller('api/v1/trust-safety-ml')
@UseGuards(AuthGuard('jwt'))
export class TrustSafetyMlController {
  constructor(private readonly svc: TrustSafetyMlService) {}
  private actor(r: any) { return r.user.sub; }
  private role(r: any)  { return r.user.tsmlRole ?? r.user.role ?? 'viewer'; }
  private meta(r: any)  { return { ip: r.ip ?? r.headers?.['x-forwarded-for'], userAgent: r.headers?.['user-agent'] }; }

  @Get('overview') overview(@Req() r: any) { return this.svc.overview(this.role(r)); }

  @Get('signals') listSignals(@Req() r: any, @Query() q: any) {
    return this.svc.listSignals(this.role(r), ListSignalsSchema.parse({
      ...q, page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 25,
    }));
  }
  @Post('signals') createSignal(@Req() r: any, @Body() body: any) {
    return this.svc.createSignal(this.actor(r), this.role(r), CreateSignalSchema.parse(body), this.meta(r));
  }

  @Get('cases') listCases(@Req() r: any, @Query() q: any) {
    return this.svc.listCases(this.role(r), ListCasesSchema.parse({
      ...q, page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 25,
    }));
  }
  @Get('cases/:id') caseDetail(@Req() r: any, @Param('id') id: string) { return this.svc.caseDetail(this.role(r), id); }
  @Post('cases') createCase(@Req() r: any, @Body() body: any) {
    return this.svc.createCase(this.actor(r), this.role(r), CreateCaseSchema.parse(body), this.meta(r));
  }
  @Patch('cases/transition') transition(@Req() r: any, @Body() body: any) {
    return this.svc.transition(this.actor(r), this.role(r), TransitionSchema.parse(body));
  }
  @Patch('cases/assign') assign(@Req() r: any, @Body() body: any) {
    return this.svc.assign(this.actor(r), this.role(r), AssignSchema.parse(body));
  }
  @Post('cases/claim-next') claim(@Req() r: any, @Body() body: { queue?: string }) {
    return this.svc.claimNext(this.actor(r), this.role(r), body?.queue ?? 'triage');
  }
  @Post('cases/decide') decide(@Req() r: any, @Body() body: any) {
    return this.svc.decide(this.actor(r), this.role(r), DecideSchema.parse(body));
  }
  @Post('cases/ml-review') mlReview(@Req() r: any, @Body() body: any) {
    return this.svc.mlReview(this.actor(r), this.role(r), MlReviewSchema.parse(body));
  }

  @Get('watchlist') listWatch(@Req() r: any, @Query() q: any) {
    return this.svc.listWatchlist(this.role(r), { listKind: q.listKind, subjectKind: q.subjectKind });
  }
  @Post('watchlist') addWatch(@Req() r: any, @Body() body: any) {
    return this.svc.addWatchlist(this.actor(r), this.role(r), WatchlistSchema.parse(body));
  }
  @Delete('watchlist/:id') removeWatch(@Req() r: any, @Param('id') id: string) {
    return this.svc.removeWatchlist(this.actor(r), this.role(r), id);
  }
}
