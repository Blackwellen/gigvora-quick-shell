import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AgencyManagementDashboardService } from './agency-management-dashboard.service';
import {
  OverviewQuerySchema, ListEngagementsQuerySchema, TransitionEngagementSchema,
  ListDeliverablesQuerySchema, TransitionDeliverableSchema,
  UtilizationQuerySchema, ListInvoicesQuerySchema, TransitionInvoiceSchema,
} from './dto';

@Controller('api/v1/agency-management-dashboard')
@UseGuards(AuthGuard('jwt'))
export class AgencyManagementDashboardController {
  constructor(private readonly svc: AgencyManagementDashboardService) {}

  @Get('overview')
  overview(@Req() req: any, @Query() q: any) {
    const parsed = OverviewQuerySchema.parse(q);
    return this.svc.overview(req.user.sub, parsed.windowDays);
  }

  @Get('engagements')
  listEngagements(@Req() req: any, @Query() q: any) {
    return this.svc.listEngagements(req.user.sub, ListEngagementsQuerySchema.parse(q));
  }

  @Patch('engagements/:id/status')
  transitionEngagement(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionEngagement(req.user.sub, id, TransitionEngagementSchema.parse(body), req.user.sub);
  }

  @Get('deliverables')
  listDeliverables(@Req() req: any, @Query() q: any) {
    return this.svc.listDeliverables(req.user.sub, ListDeliverablesQuerySchema.parse(q));
  }

  @Patch('deliverables/:id/status')
  transitionDeliverable(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionDeliverable(req.user.sub, id, TransitionDeliverableSchema.parse(body), req.user.sub);
  }

  @Get('utilization')
  utilization(@Req() req: any, @Query() q: any) {
    return this.svc.utilization(req.user.sub, UtilizationQuerySchema.parse(q));
  }

  @Get('utilization/summary')
  utilizationSummary(@Req() req: any, @Query() q: any) {
    const parsed = UtilizationQuerySchema.parse(q);
    return this.svc.utilizationSummary(req.user.sub, parsed.windowDays);
  }

  @Get('invoices')
  listInvoices(@Req() req: any, @Query() q: any) {
    return this.svc.listInvoices(req.user.sub, ListInvoicesQuerySchema.parse(q));
  }

  @Patch('invoices/:id/status')
  transitionInvoice(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionInvoice(req.user.sub, id, TransitionInvoiceSchema.parse(body), req.user.sub);
  }
}
