import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ModeratorDashboardService } from './moderator-dashboard.service';
import {
  CreateItemSchema, ListItemsSchema, TransitionSchema, AssignSchema,
  ActSchema, BulkActSchema, IncidentReviewSchema,
} from './dto';

@Controller('api/v1/moderator-dashboard')
@UseGuards(AuthGuard('jwt'))
export class ModeratorDashboardController {
  constructor(private readonly svc: ModeratorDashboardService) {}
  private actor(req: any) { return req.user.sub; }
  private role(req: any)  { return req.user.modRole ?? req.user.role ?? 'viewer'; }
  private meta(req: any)  { return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] }; }

  @Get('overview') overview(@Req() req: any) { return this.svc.overview(this.role(req)); }
  @Get('items') list(@Req() req: any, @Query() q: any) {
    return this.svc.listItems(this.role(req), ListItemsSchema.parse({
      ...q, page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 25,
    }));
  }
  @Get('items/:id') detail(@Req() req: any, @Param('id') id: string) { return this.svc.itemDetail(this.role(req), id); }
  @Post('items') create(@Req() req: any, @Body() body: any) {
    return this.svc.createItem(this.actor(req), this.role(req), CreateItemSchema.parse(body), this.meta(req));
  }
  @Patch('items/transition') transition(@Req() req: any, @Body() body: any) {
    return this.svc.transition(this.actor(req), this.role(req), TransitionSchema.parse(body), this.meta(req));
  }
  @Patch('items/assign') assign(@Req() req: any, @Body() body: any) {
    return this.svc.assign(this.actor(req), this.role(req), AssignSchema.parse(body));
  }
  @Post('items/claim-next') claim(@Req() req: any, @Body() body: { queue: string }) {
    return this.svc.claimNext(this.actor(req), this.role(req), body?.queue ?? 'triage');
  }
  @Post('items/act') act(@Req() req: any, @Body() body: any) {
    return this.svc.act(this.actor(req), this.role(req), ActSchema.parse(body));
  }
  @Post('items/bulk-act') bulkAct(@Req() req: any, @Body() body: any) {
    return this.svc.bulkAct(this.actor(req), this.role(req), BulkActSchema.parse(body));
  }
  @Get('messaging-incidents') listIncidents(@Req() req: any, @Query() q: any) {
    return this.svc.listIncidents(this.role(req), {
      status: q.status, signal: q.signal,
      page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 25,
    });
  }
  @Patch('messaging-incidents/review') reviewIncident(@Req() req: any, @Body() body: any) {
    return this.svc.reviewIncident(this.actor(req), this.role(req), IncidentReviewSchema.parse(body));
  }
  @Get('macros') macros(@Req() req: any) { return this.svc.macros(this.role(req)); }
}
