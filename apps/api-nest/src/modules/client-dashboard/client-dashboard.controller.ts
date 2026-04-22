import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClientDashboardService } from './client-dashboard.service';
import {
  ApproveSchema, ListOversightQuerySchema, ListProposalsQuerySchema,
  OverviewQuerySchema, SaveItemSchema, SpendQuerySchema,
  TransitionOversightSchema, TransitionProposalSchema,
} from './dto';

@Controller('api/v1/client-dashboard')
@UseGuards(AuthGuard('jwt'))
export class ClientDashboardController {
  constructor(private readonly svc: ClientDashboardService) {}

  @Get('overview')
  overview(@Req() req: any, @Query() q: any) {
    const parsed = OverviewQuerySchema.parse(q);
    return this.svc.overview(req.user.sub, parsed.windowDays);
  }

  // Spend
  @Get('spend')
  spend(@Req() req: any, @Query() q: any) {
    return this.svc.spendList(req.user.sub, SpendQuerySchema.parse(q));
  }

  @Get('spend/totals')
  spendTotals(@Req() req: any, @Query('windowDays') windowDays = '30') {
    return this.svc.spendTotals(req.user.sub, Math.max(1, Math.min(365, parseInt(windowDays, 10) || 30)));
  }

  // Proposals
  @Get('proposals')
  listProposals(@Req() req: any, @Query() q: any) {
    return this.svc.listProposals(req.user.sub, ListProposalsQuerySchema.parse(q));
  }

  @Patch('proposals/:id/status')
  transitionProposal(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionProposal(req.user.sub, id, TransitionProposalSchema.parse(body), req.user.sub);
  }

  // Oversight
  @Get('oversight')
  listOversight(@Req() req: any, @Query() q: any) {
    return this.svc.listOversight(req.user.sub, ListOversightQuerySchema.parse(q));
  }

  @Patch('oversight/:id/status')
  transitionOversight(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionOversight(req.user.sub, id, TransitionOversightSchema.parse(body), req.user.sub);
  }

  // Saved items
  @Get('saved')
  listSaved(@Req() req: any) {
    return this.svc.listSaved(req.user.sub);
  }

  @Post('saved')
  saveItem(@Req() req: any, @Body() body: any) {
    return this.svc.saveItem(req.user.sub, SaveItemSchema.parse(body), req.user.sub);
  }

  @Delete('saved/:id')
  unsaveItem(@Req() req: any, @Param('id') id: string) {
    return this.svc.unsaveItem(req.user.sub, id, req.user.sub);
  }

  // Approvals
  @Get('approvals')
  listApprovals(@Req() req: any, @Query('status') status?: string) {
    return this.svc.listApprovals(req.user.sub, status);
  }

  @Patch('approvals/:id')
  decideApproval(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.decideApproval(req.user.sub, id, ApproveSchema.parse(body), req.user.sub);
  }
}
