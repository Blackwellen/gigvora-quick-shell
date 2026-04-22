import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DisputeOpsService } from './dispute-ops.service';
import {
  CreateCaseSchema, ListCasesSchema, TransitionCaseSchema, AssignCaseSchema,
  PostMessageSchema, AddEvidenceSchema, OpenArbitrationSchema, DecideArbitrationSchema,
} from './dto';

@Controller('api/v1/dispute-ops')
@UseGuards(AuthGuard('jwt'))
export class DisputeOpsController {
  constructor(private readonly svc: DisputeOpsService) {}
  private actor(req: any) { return req.user.sub; }
  private role(req: any)  { return req.user.disputeRole ?? req.user.role ?? 'viewer'; }
  private meta(req: any)  { return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] }; }

  @Get('overview') overview(@Req() req: any) { return this.svc.overview(this.role(req)); }

  @Get('cases') list(@Req() req: any, @Query() q: any) {
    return this.svc.listCases(this.role(req), ListCasesSchema.parse({
      ...q, page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 25,
    }));
  }
  @Get('cases/:id') detail(@Req() req: any, @Param('id') id: string) { return this.svc.caseDetail(this.role(req), id); }
  @Post('cases') create(@Req() req: any, @Body() body: any) {
    return this.svc.createCase(this.actor(req), this.role(req), CreateCaseSchema.parse(body), this.meta(req));
  }
  @Patch('cases/transition') transition(@Req() req: any, @Body() body: any) {
    return this.svc.transition(this.actor(req), this.role(req), TransitionCaseSchema.parse(body), this.meta(req));
  }
  @Patch('cases/assign') assign(@Req() req: any, @Body() body: any) {
    return this.svc.assign(this.actor(req), this.role(req), AssignCaseSchema.parse(body), this.meta(req));
  }
  @Post('cases/claim-next') claim(@Req() req: any, @Body() body: { queue: string }) {
    return this.svc.claimNext(this.actor(req), this.role(req), body?.queue ?? 'triage');
  }

  @Post('messages') postMessage(@Req() req: any, @Body() body: any) {
    return this.svc.postMessage(this.actor(req), this.role(req), PostMessageSchema.parse(body), this.meta(req));
  }
  @Post('evidence') addEvidence(@Req() req: any, @Body() body: any) {
    return this.svc.addEvidence(this.actor(req), this.role(req), AddEvidenceSchema.parse(body), this.meta(req));
  }

  @Post('arbitration/open') openArb(@Req() req: any, @Body() body: any) {
    return this.svc.openArbitration(this.actor(req), this.role(req), OpenArbitrationSchema.parse(body), this.meta(req));
  }
  @Post('arbitration/decide') decideArb(@Req() req: any, @Body() body: any) {
    return this.svc.decideArbitration(this.actor(req), this.role(req), DecideArbitrationSchema.parse(body), this.meta(req));
  }
}
