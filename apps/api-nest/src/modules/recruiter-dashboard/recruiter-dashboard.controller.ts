import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RecruiterDashboardService } from './recruiter-dashboard.service';
import {
  ListPipelinesQuerySchema, ListTasksQuerySchema, OutreachQuerySchema,
  OverviewQuerySchema, TransitionPipelineSchema, TransitionTaskSchema,
  VelocityQuerySchema,
} from './dto';

@Controller('api/v1/recruiter-dashboard')
@UseGuards(AuthGuard('jwt'))
export class RecruiterDashboardController {
  constructor(private readonly svc: RecruiterDashboardService) {}

  @Get('overview')
  overview(@Req() req: any, @Query() q: any) {
    const parsed = OverviewQuerySchema.parse(q);
    return this.svc.overview(req.user.sub, parsed.windowDays);
  }

  @Get('pipelines')
  listPipelines(@Req() req: any, @Query() q: any) {
    return this.svc.listPipelines(req.user.sub, ListPipelinesQuerySchema.parse(q));
  }

  @Patch('pipelines/:id/status')
  transitionPipeline(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionPipeline(req.user.sub, id, TransitionPipelineSchema.parse(body), req.user.sub);
  }

  @Get('outreach')
  outreach(@Req() req: any, @Query() q: any) {
    return this.svc.outreach(req.user.sub, OutreachQuerySchema.parse(q));
  }

  @Get('velocity')
  velocity(@Req() req: any, @Query() q: any) {
    return this.svc.velocity(req.user.sub, VelocityQuerySchema.parse(q));
  }

  @Get('tasks')
  listTasks(@Req() req: any, @Query() q: any) {
    return this.svc.listTasks(req.user.sub, ListTasksQuerySchema.parse(q));
  }

  @Patch('tasks/:id/status')
  transitionTask(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionTask(req.user.sub, id, TransitionTaskSchema.parse(body), req.user.sub);
  }
}
