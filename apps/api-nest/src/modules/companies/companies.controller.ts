import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompaniesService } from './companies.service';
import { BrandDto, CreateCompanyDto, InviteMemberDto, LinkDto, ListQuery, LocationDto, PostDto, UpdateCompanyDto } from './dto';

@Controller('api/v1/companies')
export class CompaniesController {
  constructor(private readonly svc: CompaniesService) {}

  @Get()
  list(@Query() q: any) { return this.svc.list(ListQuery.parse(q)); }

  @Get(':idOrSlug')
  detail(@Param('idOrSlug') id: string, @Req() req: any) {
    return this.svc.detail(id, req.user?.userId ?? null);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.svc.create(req.user.userId, CreateCompanyDto.parse(body));
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.update(id, req.user.userId, UpdateCompanyDto.parse(body));
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  archive(@Param('id') id: string, @Req() req: any) {
    return this.svc.archive(id, req.user.userId);
  }

  // Members
  @Get(':id/members') members(@Param('id') id: string) { return this.svc.listMembers(id); }
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/members')
  invite(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.invite(id, req.user.userId, InviteMemberDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/members/:identityId')
  setRole(@Param('id') id: string, @Param('identityId') uid: string, @Body() body: { role: string }, @Req() req: any) {
    return this.svc.setRole(id, req.user.userId, uid, body.role);
  }
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/members/:identityId')
  removeMember(@Param('id') id: string, @Param('identityId') uid: string, @Req() req: any) {
    return this.svc.removeMember(id, req.user.userId, uid);
  }

  // Locations
  @Get(':id/locations') locations(@Param('id') id: string) { return this.svc.listLocations(id); }
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/locations')
  addLocation(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.addLocation(id, req.user.userId, LocationDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/locations/:locId')
  removeLocation(@Param('id') id: string, @Param('locId') locId: string, @Req() req: any) {
    return this.svc.removeLocation(id, req.user.userId, locId);
  }

  // Links
  @Get(':id/links') links(@Param('id') id: string) { return this.svc.listLinks(id); }
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/links')
  upsertLink(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.upsertLink(id, req.user.userId, LinkDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/links/:kind')
  removeLink(@Param('id') id: string, @Param('kind') kind: string, @Req() req: any) {
    return this.svc.removeLink(id, req.user.userId, kind);
  }

  // Followers
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/follow') follow(@Param('id') id: string, @Req() req: any) { return this.svc.follow(id, req.user.userId); }
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/follow') unfollow(@Param('id') id: string, @Req() req: any) { return this.svc.unfollow(id, req.user.userId); }

  // Posts
  @Get(':id/posts') posts(@Param('id') id: string) { return this.svc.listPosts(id); }
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/posts')
  addPost(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.addPost(id, req.user.userId, PostDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/posts/:postId')
  updatePost(@Param('id') id: string, @Param('postId') pid: string, @Body() body: any, @Req() req: any) {
    return this.svc.updatePost(id, req.user.userId, pid, PostDto.partial().parse(body));
  }
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/posts/:postId')
  removePost(@Param('id') id: string, @Param('postId') pid: string, @Req() req: any) {
    return this.svc.removePost(id, req.user.userId, pid);
  }

  // Brand
  @Get(':id/brand') brand(@Param('id') id: string) { return this.svc.getBrand(id); }
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/brand')
  setBrand(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.setBrand(id, req.user.userId, BrandDto.parse(body));
  }

  // Audit
  @UseGuards(AuthGuard('jwt'))
  @Get(':id/audit') audit(@Param('id') id: string) { return this.svc.listAudit(id); }
}
