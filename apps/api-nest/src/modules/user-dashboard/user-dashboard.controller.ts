import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserDashboardService } from './user-dashboard.service';
import {
  CreateActionSchema, OverviewQuerySchema, ReorderWidgetsSchema,
  UpdateActionSchema, UpsertWidgetSchema,
} from './dto';

@Controller('api/v1/user-dashboard')
@UseGuards(AuthGuard('jwt'))
export class UserDashboardController {
  constructor(private readonly svc: UserDashboardService) {}

  @Get('overview')
  overview(@Req() req: any, @Query() q: any) {
    const parsed = OverviewQuerySchema.parse(q);
    return this.svc.overview(req.user.sub, parsed.role, parsed.refresh);
  }

  @Get('widgets')
  listWidgets(@Req() req: any, @Query('role') role = 'user') {
    return this.svc.listWidgets(req.user.sub, role);
  }

  @Post('widgets')
  upsertWidget(@Req() req: any, @Body() body: any) {
    return this.svc.upsertWidget(req.user.sub, UpsertWidgetSchema.parse(body));
  }

  @Patch('widgets/reorder')
  reorder(@Req() req: any, @Body() body: any) {
    return this.svc.reorderWidgets(req.user.sub, ReorderWidgetsSchema.parse(body));
  }

  @Delete('widgets/:id')
  deleteWidget(@Req() req: any, @Param('id') id: string) {
    return this.svc.deleteWidget(req.user.sub, id);
  }

  @Get('actions')
  listActions(@Req() req: any, @Query('role') role = 'user', @Query('status') status?: string) {
    return this.svc.listActions(req.user.sub, role, status);
  }

  @Post('actions')
  createAction(@Req() req: any, @Body() body: any) {
    return this.svc.createAction(req.user.sub, CreateActionSchema.parse(body));
  }

  @Patch('actions/:id')
  updateAction(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateAction(req.user.sub, id, UpdateActionSchema.parse(body));
  }

  @Post('actions/:id/complete')
  completeAction(@Req() req: any, @Param('id') id: string) {
    return this.svc.completeAction(req.user.sub, id);
  }

  @Post('actions/:id/dismiss')
  dismissAction(@Req() req: any, @Param('id') id: string) {
    return this.svc.dismissAction(req.user.sub, id);
  }
}
