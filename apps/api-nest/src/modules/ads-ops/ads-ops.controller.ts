import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdsOpsService } from './ads-ops.service';
import {
  ListReviewsSchema, CreateReviewSchema, TransitionSchema, AssignSchema, DecideSchema,
  GeoRuleSchema, KeywordRuleSchema, CampaignControlSchema,
} from './dto';

@Controller('api/v1/ads-ops')
@UseGuards(AuthGuard('jwt'))
export class AdsOpsController {
  constructor(private readonly svc: AdsOpsService) {}
  private actor(r: any) { return r.user.sub; }
  private role(r: any)  { return r.user.adsOpsRole ?? r.user.role ?? 'viewer'; }
  private meta(r: any)  { return { ip: r.ip ?? r.headers?.['x-forwarded-for'], userAgent: r.headers?.['user-agent'] }; }

  @Get('overview') overview(@Req() r: any) { return this.svc.overview(this.role(r)); }

  @Get('reviews') list(@Req() r: any, @Query() q: any) {
    return this.svc.listReviews(this.role(r), ListReviewsSchema.parse({
      ...q, page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 25,
    }));
  }
  @Get('reviews/:id') detail(@Req() r: any, @Param('id') id: string) { return this.svc.reviewDetail(this.role(r), id); }
  @Post('reviews') create(@Req() r: any, @Body() body: any) {
    return this.svc.createReview(this.actor(r), this.role(r), CreateReviewSchema.parse(body), this.meta(r));
  }
  @Patch('reviews/transition') transition(@Req() r: any, @Body() body: any) {
    return this.svc.transition(this.actor(r), this.role(r), TransitionSchema.parse(body));
  }
  @Patch('reviews/assign') assign(@Req() r: any, @Body() body: any) {
    return this.svc.assign(this.actor(r), this.role(r), AssignSchema.parse(body));
  }
  @Post('reviews/claim-next') claim(@Req() r: any, @Body() body: { queue?: string }) {
    return this.svc.claimNext(this.actor(r), this.role(r), body?.queue ?? 'triage');
  }
  @Post('reviews/decide') decide(@Req() r: any, @Body() body: any) {
    return this.svc.decide(this.actor(r), this.role(r), DecideSchema.parse(body));
  }

  @Get('campaign-controls') controls(@Req() r: any) { return this.svc.listCampaignControls(this.role(r)); }
  @Post('campaign-controls') setControl(@Req() r: any, @Body() body: any) {
    return this.svc.setCampaignControl(this.actor(r), this.role(r), CampaignControlSchema.parse(body));
  }

  @Get('geo-rules') listGeo(@Req() r: any, @Query() q: any) {
    return this.svc.listGeoRules(this.role(r), { scope: q.scope, scopeId: q.scopeId });
  }
  @Post('geo-rules') addGeo(@Req() r: any, @Body() body: any) {
    return this.svc.addGeoRule(this.actor(r), this.role(r), GeoRuleSchema.parse(body));
  }
  @Delete('geo-rules/:id') removeGeo(@Req() r: any, @Param('id') id: string) {
    return this.svc.removeGeoRule(this.actor(r), this.role(r), id);
  }

  @Get('keyword-rules') listKw(@Req() r: any, @Query() q: any) {
    return this.svc.listKeywordRules(this.role(r), { scope: q.scope, scopeId: q.scopeId, q: q.q });
  }
  @Post('keyword-rules') addKw(@Req() r: any, @Body() body: any) {
    return this.svc.addKeywordRule(this.actor(r), this.role(r), KeywordRuleSchema.parse(body));
  }
  @Delete('keyword-rules/:id') removeKw(@Req() r: any, @Param('id') id: string) {
    return this.svc.removeKeywordRule(this.actor(r), this.role(r), id);
  }
}
