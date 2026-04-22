import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProfilesService } from './profiles.service';
import { EducationDto, ExperienceDto, PortfolioDto, ReviewDto, SkillDto, UpsertProfileDto, VerificationRequestDto } from './dto';

@Controller('api/v1/profiles')
export class ProfilesController {
  constructor(private readonly svc: ProfilesService) {}

  // Public profile detail (auth optional → viewer logging)
  @Get(':identityId')
  detail(@Param('identityId') id: string, @Req() req: any) {
    const viewerId = req.user?.userId ?? null;
    return this.svc.getFullProfile(id, viewerId);
  }

  // ───────── Authenticated owner endpoints ─────────
  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  upsertMine(@Body() body: any, @Req() req: any) {
    const patch = UpsertProfileDto.partial().parse(body);
    return this.svc.upsertProfile(req.user.userId, patch);
  }

  // Experience
  @UseGuards(AuthGuard('jwt'))
  @Post('me/experience')
  addExperience(@Body() body: any, @Req() req: any) {
    return this.svc.addExperience(req.user.userId, ExperienceDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt'))
  @Delete('me/experience/:id')
  removeExperience(@Param('id') id: string, @Req() req: any) {
    return this.svc.removeExperience(req.user.userId, id);
  }

  // Education
  @UseGuards(AuthGuard('jwt'))
  @Post('me/education')
  addEducation(@Body() body: any, @Req() req: any) {
    return this.svc.addEducation(req.user.userId, EducationDto.parse(body));
  }

  // Skills
  @UseGuards(AuthGuard('jwt'))
  @Post('me/skills')
  addSkill(@Body() body: any, @Req() req: any) {
    return this.svc.addSkill(req.user.userId, SkillDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt'))
  @Delete('me/skills/:id')
  removeSkill(@Param('id') id: string, @Req() req: any) {
    return this.svc.removeSkill(req.user.userId, id);
  }
  @UseGuards(AuthGuard('jwt'))
  @Post(':identityId/skills/:skillId/endorse')
  endorse(@Param('identityId') id: string, @Param('skillId') sid: string, @Req() req: any) {
    return this.svc.endorseSkill(id, sid, req.user.userId);
  }

  // Portfolio
  @UseGuards(AuthGuard('jwt'))
  @Post('me/portfolio')
  addPortfolio(@Body() body: any, @Req() req: any) {
    return this.svc.addPortfolio(req.user.userId, PortfolioDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt'))
  @Patch('me/portfolio/:id')
  updatePortfolio(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.updatePortfolio(req.user.userId, id, PortfolioDto.partial().parse(body));
  }
  @UseGuards(AuthGuard('jwt'))
  @Delete('me/portfolio/:id')
  removePortfolio(@Param('id') id: string, @Req() req: any) {
    return this.svc.removePortfolio(req.user.userId, id);
  }

  // Reviews
  @Get(':identityId/reviews')
  reviews(@Param('identityId') id: string) { return this.svc.listReviews(id); }
  @UseGuards(AuthGuard('jwt'))
  @Post('reviews')
  addReview(@Body() body: any, @Req() req: any) {
    return this.svc.addReview(req.user.userId, ReviewDto.parse(body));
  }

  // Verifications
  @UseGuards(AuthGuard('jwt'))
  @Get('me/verifications')
  myVerifications(@Req() req: any) { return this.svc.listVerifications(req.user.userId); }
  @UseGuards(AuthGuard('jwt'))
  @Post('me/verifications')
  requestVerification(@Body() body: any, @Req() req: any) {
    return this.svc.requestVerification(req.user.userId, VerificationRequestDto.parse(body));
  }

  // Badges + reputation read paths
  @Get(':identityId/badges') badges(@Param('identityId') id: string) { return this.svc.listBadges(id); }
  @Get(':identityId/reputation') rep(@Param('identityId') id: string) { return this.svc.getReputation(id); }

  @UseGuards(AuthGuard('jwt'))
  @Post('me/reputation/recompute')
  recompute(@Req() req: any) { return this.svc.recomputeReputation(req.user.userId); }
}
