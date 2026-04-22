import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SuperAdminCommandCenterService } from './super-admin-command-center.service';
import {
  ListFlagsSchema, CreateFlagSchema, UpdateFlagSchema, ToggleFlagSchema, RolloutFlagSchema, FlagStatusSchema,
  ListOverridesSchema, CreateOverrideSchema, UpdateOverrideSchema,
  CreateIncidentSchema, TransitionIncidentSchema, ListAuditSchema,
} from './dto';

@Controller('api/v1/super-admin-command-center')
@UseGuards(AuthGuard('jwt'))
export class SuperAdminCommandCenterController {
  constructor(private readonly svc: SuperAdminCommandCenterService) {}
  private actor(r: any) { return r.user.sub; }
  private role(r: any)  { return r.user.saRole ?? r.user.role ?? 'viewer'; }
  private meta(r: any)  { return { ip: r.ip ?? r.headers?.['x-forwarded-for'], userAgent: r.headers?.['user-agent'] }; }

  @Get('overview') overview(@Req() r: any) { return this.svc.overview(this.role(r)); }

  @Get('flags') listFlags(@Req() r: any, @Query() q: any) {
    return this.svc.listFlags(this.role(r), ListFlagsSchema.parse({
      ...q, page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 25,
    }));
  }
  @Get('flags/:id') flagById(@Req() r: any, @Param('id') id: string) { return this.svc.flagById(this.role(r), id); }
  @Post('flags')               createFlag(@Req() r: any, @Body() b: any) { return this.svc.createFlag(this.actor(r), this.role(r), CreateFlagSchema.parse(b), this.meta(r)); }
  @Patch('flags')              updateFlag(@Req() r: any, @Body() b: any) { return this.svc.updateFlag(this.actor(r), this.role(r), UpdateFlagSchema.parse(b), this.meta(r)); }
  @Patch('flags/toggle')       toggleFlag(@Req() r: any, @Body() b: any) { return this.svc.toggleFlag(this.actor(r), this.role(r), ToggleFlagSchema.parse(b), this.meta(r)); }
  @Patch('flags/rollout')      rolloutFlag(@Req() r: any, @Body() b: any){ return this.svc.rolloutFlag(this.actor(r), this.role(r), RolloutFlagSchema.parse(b), this.meta(r)); }
  @Patch('flags/status')       statusFlag(@Req() r: any, @Body() b: any) { return this.svc.setFlagStatus(this.actor(r), this.role(r), FlagStatusSchema.parse(b), this.meta(r)); }

  @Get('overrides') listOverrides(@Req() r: any, @Query() q: any) {
    return this.svc.listOverrides(this.role(r), ListOverridesSchema.parse({
      ...q, page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 25,
    }));
  }
  @Post('overrides')  createOverride(@Req() r: any, @Body() b: any) { return this.svc.createOverride(this.actor(r), this.role(r), CreateOverrideSchema.parse(b), this.meta(r)); }
  @Patch('overrides') updateOverride(@Req() r: any, @Body() b: any) { return this.svc.updateOverride(this.actor(r), this.role(r), UpdateOverrideSchema.parse(b), this.meta(r)); }

  @Get('incidents') listIncidents(@Req() r: any, @Query('status') status?: string) { return this.svc.listIncidents(this.role(r), status); }
  @Post('incidents') createIncident(@Req() r: any, @Body() b: any) { return this.svc.createIncident(this.actor(r), this.role(r), CreateIncidentSchema.parse(b), this.meta(r)); }
  @Patch('incidents/transition') transitionIncident(@Req() r: any, @Body() b: any) { return this.svc.transitionIncident(this.actor(r), this.role(r), TransitionIncidentSchema.parse(b), this.meta(r)); }

  @Get('audit') listAudit(@Req() r: any, @Query() q: any) {
    return this.svc.listAudit(this.role(r), ListAuditSchema.parse({
      ...q, page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 50,
    }));
  }
}
