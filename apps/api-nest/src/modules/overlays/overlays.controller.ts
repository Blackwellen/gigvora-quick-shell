import {
  Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OverlaysService } from './overlays.service';
import {
  OpenOverlayDto, PatchOverlayDto, StartWorkflowDto, AdvanceWorkflowDto,
  DetachWindowDto, WindowPingDto,
} from './dto';

interface AuthedReq { user: { sub: string } }

/**
 * /api/v1/overlays — every drawer/wizard/popout/inspector posts here on open
 * and patches here on dismiss/complete so the journey survives a refresh and
 * cross-domain handoffs (e.g. checkout → review prompt).
 */
@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/overlays')
export class OverlaysController {
  constructor(private readonly svc: OverlaysService) {}

  @Post()                                open(@Req() r: AuthedReq, @Body() dto: OpenOverlayDto) { return this.svc.open(r.user.sub, dto); }
  @Get()                                 listOpen(@Req() r: AuthedReq) { return this.svc.listOpen(r.user.sub); }
  @Get(':id')                            get(@Param('id') id: string)  { return this.svc.get(id); }
  @Patch(':id')                          patch(@Req() r: AuthedReq, @Param('id') id: string, @Body() dto: PatchOverlayDto) { return this.svc.patch(r.user.sub, id, dto); }

  @Post('workflows')                     startWf(@Req() r: AuthedReq, @Body() dto: StartWorkflowDto)  { return this.svc.startWorkflow(r.user.sub, dto); }
  @Get('workflows')                      listWf(@Req() r: AuthedReq)                                  { return this.svc.listWorkflows(r.user.sub); }
  @Get('workflows/:id')                  getWf(@Param('id') id: string)                               { return this.svc.getWorkflow(id); }
  @Post('workflows/:id/advance')         advanceWf(@Req() r: AuthedReq, @Param('id') id: string, @Body() dto: AdvanceWorkflowDto) { return this.svc.advanceWorkflow(r.user.sub, id, dto); }

  @Post('windows')                       detach(@Req() r: AuthedReq, @Body() dto: DetachWindowDto)    { return this.svc.detach(r.user.sub, dto); }
  @Get('windows')                        listWindows(@Req() r: AuthedReq)                             { return this.svc.listWindows(r.user.sub); }
  @Post('windows/:channel/ping')         ping(@Req() r: AuthedReq, @Param('channel') c: string, @Body() dto: WindowPingDto) { return this.svc.pingWindow(r.user.sub, c, dto); }
  @Delete('windows/:channel')            close(@Req() r: AuthedReq, @Param('channel') c: string)     { return this.svc.closeWindow(r.user.sub, c); }
}
