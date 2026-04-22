import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkspaceService } from './workspace.service';
import { CreateSavedViewDto, UpdateSavedViewDto } from './dto';

@Controller('api/v1/saved-views')
@UseGuards(AuthGuard('jwt'))
export class SavedViewsController {
  constructor(private readonly svc: WorkspaceService) {}

  @Get() list(@Req() req: any) { return this.svc.listSavedViews(req.user.sub); }

  @Post() create(@Req() req: any, @Body() dto: CreateSavedViewDto) {
    return this.svc.createSavedView(req.user.sub, dto);
  }

  @Patch(':id') update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateSavedViewDto) {
    return this.svc.updateSavedView(req.user.sub, id, dto);
  }

  @Delete(':id') remove(@Req() req: any, @Param('id') id: string) {
    return this.svc.deleteSavedView(req.user.sub, id);
  }
}
