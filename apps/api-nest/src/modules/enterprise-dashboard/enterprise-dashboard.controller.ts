import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EnterpriseDashboardService } from './enterprise-dashboard.service';
import {
  OverviewQuerySchema, ListRequisitionsQuerySchema, TransitionRequisitionSchema,
  ListPurchaseOrdersQuerySchema, TransitionPurchaseOrderSchema,
  ListTeamMembersQuerySchema, ListTasksQuerySchema, TransitionTaskSchema,
  SpendQuerySchema,
} from './dto';

@Controller('api/v1/enterprise-dashboard')
@UseGuards(AuthGuard('jwt'))
export class EnterpriseDashboardController {
  constructor(private readonly svc: EnterpriseDashboardService) {}

  @Get('overview')
  overview(@Req() req: any, @Query() q: any) {
    const parsed = OverviewQuerySchema.parse(q);
    return this.svc.overview(req.user.sub, parsed.windowDays);
  }

  @Get('requisitions')
  listRequisitions(@Req() req: any, @Query() q: any) {
    return this.svc.listRequisitions(req.user.sub, ListRequisitionsQuerySchema.parse(q));
  }

  @Patch('requisitions/:id/status')
  transitionRequisition(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionRequisition(req.user.sub, id, TransitionRequisitionSchema.parse(body), req.user.sub);
  }

  @Get('purchase-orders')
  listPurchaseOrders(@Req() req: any, @Query() q: any) {
    return this.svc.listPurchaseOrders(req.user.sub, ListPurchaseOrdersQuerySchema.parse(q));
  }

  @Patch('purchase-orders/:id/status')
  transitionPurchaseOrder(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionPurchaseOrder(req.user.sub, id, TransitionPurchaseOrderSchema.parse(body), req.user.sub);
  }

  @Get('team/members')
  listTeamMembers(@Req() req: any, @Query() q: any) {
    return this.svc.listTeamMembers(req.user.sub, ListTeamMembersQuerySchema.parse(q));
  }

  @Get('team/tasks')
  listTasks(@Req() req: any, @Query() q: any) {
    return this.svc.listTasks(req.user.sub, ListTasksQuerySchema.parse(q));
  }

  @Patch('team/tasks/:id/status')
  transitionTask(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionTask(req.user.sub, id, TransitionTaskSchema.parse(body), req.user.sub);
  }

  @Get('spend')
  spend(@Req() req: any, @Query() q: any) {
    return this.svc.spend(req.user.sub, SpendQuerySchema.parse(q));
  }

  @Get('spend/by-category')
  spendByCategory(@Req() req: any, @Query() q: any) {
    const parsed = SpendQuerySchema.parse(q);
    return this.svc.spendByCategory(req.user.sub, parsed.windowDays);
  }
}
