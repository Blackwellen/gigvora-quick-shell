import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkspaceService } from './workspace.service';
import { UpdateShellPrefsDto } from './dto';

@Controller('api/v1/shell/prefs')
@UseGuards(AuthGuard('jwt'))
export class ShellPrefsController {
  constructor(private readonly svc: WorkspaceService) {}

  @Get() get(@Req() req: any) { return this.svc.getPrefs(req.user.sub); }

  @Patch() update(@Req() req: any, @Body() dto: UpdateShellPrefsDto) {
    return this.svc.updatePrefs(req.user.sub, dto);
  }
}
