import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkspaceService } from './workspace.service';
import { TrackRecentDto } from './dto';

@Controller('api/v1/recents')
@UseGuards(AuthGuard('jwt'))
export class RecentItemsController {
  constructor(private readonly svc: WorkspaceService) {}

  @Get() list(@Req() req: any) { return this.svc.listRecents(req.user.sub); }

  @Post() track(@Req() req: any, @Body() dto: TrackRecentDto) {
    return this.svc.trackRecent(req.user.sub, dto);
  }
}
