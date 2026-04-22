import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AgencyService } from './agency.service';
import {
  CaseStudyDto, CreateAgencyDto, InquiryDto, ListQuery, ModerationDecisionDto,
  ProofDto, ReviewDto, ServiceDto, TeamMemberDto, UpdateAgencyDto, UpdateCaseStudyDto, UpdateServiceDto,
} from './dto';

@Controller('api/v1/agencies')
export class AgencyController {
  constructor(private readonly svc: AgencyService) {}

  // ---------- public discovery ----------
  @Get()
  list(@Query() q: any) { return this.svc.list(ListQuery.parse(q)); }

  @Get(':idOrSlug')
  detail(@Param('idOrSlug') id: string, @Req() req: any) {
    return this.svc.detail(id, req.user?.userId ?? null, {
      ip: req.ip ?? req.socket?.remoteAddress ?? null,
      ua: req.headers?.['user-agent'] ?? null,
    });
  }

  // ---------- owner CRUD ----------
  @UseGuards(AuthGuard('jwt')) @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.svc.create(req.user.userId, CreateAgencyDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt')) @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.update(id, req.user.userId, UpdateAgencyDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt')) @Post(':id/publish')
  publish(@Param('id') id: string, @Req() req: any) { return this.svc.publish(id, req.user.userId); }
  @UseGuards(AuthGuard('jwt')) @Post(':id/pause')
  pause(@Param('id') id: string, @Req() req: any)   { return this.svc.pause(id, req.user.userId); }
  @UseGuards(AuthGuard('jwt')) @Delete(':id')
  archive(@Param('id') id: string, @Req() req: any) { return this.svc.archive(id, req.user.userId); }
  @UseGuards(AuthGuard('jwt')) @Post(':id/restore')
  restore(@Param('id') id: string, @Req() req: any) { return this.svc.restore(id, req.user.userId); }

  // ---------- services ----------
  @Get(':id/services') services(@Param('id') id: string) { return this.svc.listServices(id); }
  @UseGuards(AuthGuard('jwt')) @Post(':id/services')
  addService(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.addService(id, req.user.userId, ServiceDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt')) @Patch(':id/services/:sid')
  updateService(@Param('id') id: string, @Param('sid') sid: string, @Body() body: any, @Req() req: any) {
    return this.svc.updateService(id, req.user.userId, sid, UpdateServiceDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt')) @Delete(':id/services/:sid')
  removeService(@Param('id') id: string, @Param('sid') sid: string, @Req() req: any) {
    return this.svc.removeService(id, req.user.userId, sid);
  }

  // ---------- team ----------
  @Get(':id/team') team(@Param('id') id: string) { return this.svc.listTeam(id); }
  @UseGuards(AuthGuard('jwt')) @Post(':id/team')
  addTeam(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.addTeam(id, req.user.userId, TeamMemberDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt')) @Delete(':id/team/:mid')
  removeTeam(@Param('id') id: string, @Param('mid') mid: string, @Req() req: any) {
    return this.svc.removeTeam(id, req.user.userId, mid);
  }

  // ---------- case studies ----------
  @Get(':id/case-studies')
  caseStudies(@Param('id') id: string, @Req() req: any) {
    const includeDrafts = req.user?.userId ? true : false; // owner check happens deeper if needed
    return this.svc.listCaseStudies(id, includeDrafts);
  }
  @UseGuards(AuthGuard('jwt')) @Post(':id/case-studies')
  addCaseStudy(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.addCaseStudy(id, req.user.userId, CaseStudyDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt')) @Post(':id/case-studies/:csid/submit')
  submitCaseStudy(@Param('id') id: string, @Param('csid') csid: string, @Req() req: any) {
    return this.svc.submitCaseStudy(id, req.user.userId, csid);
  }
  @UseGuards(AuthGuard('jwt')) @Post(':id/case-studies/:csid/moderate')
  moderateCaseStudy(@Param('id') id: string, @Param('csid') csid: string, @Body() body: any, @Req() req: any) {
    const d = ModerationDecisionDto.parse(body);
    return this.svc.moderateCaseStudy(id, req.user.userId, csid, d.decision, d.reason);
  }

  // ---------- reviews ----------
  @Get(':id/reviews') reviews(@Param('id') id: string) { return this.svc.listReviews(id); }
  @Post(':id/reviews')
  addReview(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.addReview(id, req.user?.userId ?? null, ReviewDto.parse(body));
  }

  // ---------- proofs ----------
  @Get(':id/proofs') proofs(@Param('id') id: string) { return this.svc.listProofs(id); }
  @UseGuards(AuthGuard('jwt')) @Post(':id/proofs')
  addProof(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.addProof(id, req.user.userId, ProofDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt')) @Post(':id/proofs/:pid/verify')
  verifyProof(@Param('id') id: string, @Param('pid') pid: string, @Body() body: any, @Req() req: any) {
    return this.svc.verifyProof(id, req.user.userId, pid, body?.verified !== false);
  }

  // ---------- inquiries ----------
  @UseGuards(AuthGuard('jwt')) @Get(':id/inquiries')
  inquiries(@Param('id') id: string, @Req() req: any) { return this.svc.listInquiries(id, req.user.userId); }
  @Post(':id/inquiries')
  createInquiry(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.createInquiry(id, req.user?.userId ?? null, InquiryDto.parse(body), {
      ip: req.ip ?? null, ua: req.headers?.['user-agent'] ?? null,
    });
  }

  // ---------- follow ----------
  @UseGuards(AuthGuard('jwt')) @Post(':id/follow')
  follow(@Param('id') id: string, @Req() req: any)   { return this.svc.follow(id, req.user.userId); }
  @UseGuards(AuthGuard('jwt')) @Post(':id/unfollow')
  unfollow(@Param('id') id: string, @Req() req: any) { return this.svc.unfollow(id, req.user.userId); }

  // ---------- analytics ----------
  @UseGuards(AuthGuard('jwt')) @Get(':id/summary')
  summary(@Param('id') id: string, @Req() req: any) { return this.svc.summary(id, req.user.userId); }
}
