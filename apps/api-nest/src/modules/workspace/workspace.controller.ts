import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkspaceService } from './workspace.service';

@Controller('api/v1/shell')
@UseGuards(AuthGuard('jwt'))
export class WorkspaceController {
  constructor(private readonly svc: WorkspaceService) {}

  /** Single bootstrap payload powering the entire shell on app load. */
  @Get('bootstrap')
  bootstrap(@Req() req: any) {
    return this.svc.bootstrap(req.user.sub);
  }
}
