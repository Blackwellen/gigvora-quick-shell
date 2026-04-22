import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkspaceService } from './workspace.service';
import { CreateOrgDto } from './dto';

@Controller('api/v1/orgs')
@UseGuards(AuthGuard('jwt'))
export class OrgsController {
  constructor(private readonly svc: WorkspaceService) {}

  @Get() list(@Req() req: any) { return this.svc.listOrgs(req.user.sub); }

  @Post() create(@Req() req: any, @Body() dto: CreateOrgDto) {
    return this.svc.createOrg(req.user.sub, dto);
  }
}
