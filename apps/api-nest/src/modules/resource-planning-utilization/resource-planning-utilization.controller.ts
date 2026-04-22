import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ResourcePlanningUtilizationService } from './resource-planning-utilization.service';
import {
  ListResourcesQuerySchema, CreateResourceSchema, UpdateResourceSchema,
  ListProjectsQuerySchema, CreateProjectSchema, UpdateProjectSchema, TransitionProjectSchema,
  ListAssignmentsQuerySchema, CreateAssignmentSchema, UpdateAssignmentSchema, TransitionAssignmentSchema,
  CreateTimeOffSchema, UtilizationQuerySchema,
} from './dto';

@Controller('api/v1/resource-planning-utilization')
@UseGuards(AuthGuard('jwt'))
export class ResourcePlanningUtilizationController {
  constructor(private readonly svc: ResourcePlanningUtilizationService) {}

  private reqMeta(req: any) { return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] }; }
  private orgOf(req: any): string { return req.user.orgId ?? req.user.sub; }
  private idOf(req: any): string { return req.user.sub; }

  @Get('overview')
  overview(@Req() req: any) { return this.svc.overview(this.orgOf(req)); }

  @Get('utilization')
  utilization(@Req() req: any, @Query() q: any) {
    const parsed = UtilizationQuerySchema.parse(q);
    return this.svc.utilization(this.orgOf(req), parsed.from, parsed.to, parsed.resourceId, parsed.team);
  }

  @Get('recommend')
  recommend(@Req() req: any, @Query('projectId') projectId: string, @Query('role') role?: string) {
    return this.svc.recommendAssignment(this.orgOf(req), projectId, role);
  }

  // Resources
  @Get('resources')
  listResources(@Req() req: any, @Query() q: any) {
    return this.svc.listResources(this.orgOf(req), ListResourcesQuerySchema.parse(q));
  }
  @Post('resources')
  createResource(@Req() req: any, @Body() body: any) {
    return this.svc.createResource(this.orgOf(req), CreateResourceSchema.parse(body), this.idOf(req), this.reqMeta(req));
  }
  @Get('resources/:id')
  getResource(@Req() req: any, @Param('id') id: string) {
    return this.svc.getResource(this.orgOf(req), id);
  }
  @Patch('resources/:id')
  updateResource(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateResource(this.orgOf(req), id, UpdateResourceSchema.parse(body), this.idOf(req), this.reqMeta(req));
  }

  // Projects
  @Get('projects')
  listProjects(@Req() req: any, @Query() q: any) {
    return this.svc.listProjects(this.orgOf(req), ListProjectsQuerySchema.parse(q));
  }
  @Post('projects')
  createProject(@Req() req: any, @Body() body: any) {
    return this.svc.createProject(this.orgOf(req), CreateProjectSchema.parse(body), this.idOf(req), this.reqMeta(req));
  }
  @Get('projects/:id')
  getProject(@Req() req: any, @Param('id') id: string) {
    return this.svc.getProject(this.orgOf(req), id);
  }
  @Patch('projects/:id')
  updateProject(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateProject(this.orgOf(req), id, UpdateProjectSchema.parse(body), this.idOf(req), this.reqMeta(req));
  }
  @Patch('projects/:id/status')
  transitionProject(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const { status } = TransitionProjectSchema.parse(body);
    return this.svc.transitionProject(this.orgOf(req), id, status, this.idOf(req), this.reqMeta(req));
  }

  // Assignments
  @Get('assignments')
  listAssignments(@Req() req: any, @Query() q: any) {
    return this.svc.listAssignments(this.orgOf(req), ListAssignmentsQuerySchema.parse(q));
  }
  @Post('assignments')
  createAssignment(@Req() req: any, @Body() body: any) {
    return this.svc.createAssignment(this.orgOf(req), CreateAssignmentSchema.parse(body), this.idOf(req), this.reqMeta(req));
  }
  @Get('assignments/:id')
  getAssignment(@Req() req: any, @Param('id') id: string) {
    return this.svc.getAssignment(this.orgOf(req), id);
  }
  @Patch('assignments/:id')
  updateAssignment(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateAssignment(this.orgOf(req), id, UpdateAssignmentSchema.parse(body), this.idOf(req), this.reqMeta(req));
  }
  @Patch('assignments/:id/status')
  transitionAssignment(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = TransitionAssignmentSchema.parse(body);
    return this.svc.transitionAssignment(this.orgOf(req), id, parsed.status, parsed.reason, this.idOf(req), this.reqMeta(req));
  }

  // Time-off
  @Get('time-off')
  listTimeOff(@Req() req: any, @Query('resourceId') resourceId?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.listTimeOff(this.orgOf(req), resourceId, from, to);
  }
  @Post('time-off')
  createTimeOff(@Req() req: any, @Body() body: any) {
    return this.svc.createTimeOff(this.orgOf(req), CreateTimeOffSchema.parse(body), this.idOf(req), this.reqMeta(req));
  }
  @Delete('time-off/:id')
  deleteTimeOff(@Req() req: any, @Param('id') id: string) {
    return this.svc.deleteTimeOff(this.orgOf(req), id, this.idOf(req), this.reqMeta(req));
  }

  // Audit
  @Get('audit')
  audit(@Req() req: any, @Query('limit') limit?: string) {
    return this.svc.audit(this.orgOf(req), Math.min(500, Math.max(1, Number(limit) || 100)));
  }
}
