import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FinanceAdminService } from './finance-admin.service';
import {
  CreateRefundSchema, TransitionRefundSchema, ListRefundsSchema,
  CreateHoldSchema, ReleaseHoldSchema, SetControlSchema,
} from './dto';

@Controller('api/v1/finance-admin')
@UseGuards(AuthGuard('jwt'))
export class FinanceAdminController {
  constructor(private readonly svc: FinanceAdminService) {}
  private actor(req: any) { return req.user.sub; }
  private role(req: any)  { return req.user.financeRole ?? req.user.role ?? 'viewer'; }
  private meta(req: any)  { return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] }; }

  @Get('overview') overview(@Req() req: any) { return this.svc.overview(this.role(req)); }

  @Get('refunds') listRefunds(@Req() req: any, @Query() q: any) {
    return this.svc.listRefunds(this.role(req), ListRefundsSchema.parse({
      ...q, page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 25,
    }));
  }
  @Get('refunds/:id') refundDetail(@Req() req: any, @Param('id') id: string) { return this.svc.refundDetail(this.role(req), id); }
  @Post('refunds')   createRefund(@Req() req: any, @Body() body: any) {
    return this.svc.createRefund(this.actor(req), this.role(req), CreateRefundSchema.parse(body), this.meta(req));
  }
  @Patch('refunds/transition') transitionRefund(@Req() req: any, @Body() body: any) {
    return this.svc.transitionRefund(this.actor(req), this.role(req), TransitionRefundSchema.parse(body), this.meta(req));
  }

  @Get('holds') listHolds(@Req() req: any, @Query('status') status?: string) { return this.svc.listHolds(this.role(req), status); }
  @Post('holds') createHold(@Req() req: any, @Body() body: any) {
    return this.svc.createHold(this.actor(req), this.role(req), CreateHoldSchema.parse(body), this.meta(req));
  }
  @Patch('holds/release') releaseHold(@Req() req: any, @Body() body: any) {
    return this.svc.releaseHold(this.actor(req), this.role(req), ReleaseHoldSchema.parse(body), this.meta(req));
  }

  @Get('controls') listControls(@Req() req: any) { return this.svc.listControls(this.role(req)); }
  @Post('controls') setControl(@Req() req: any, @Body() body: any) {
    return this.svc.setControl(this.actor(req), this.role(req), SetControlSchema.parse(body), this.meta(req));
  }

  @Get('ledger') ledger(@Req() req: any, @Query('account') account?: string) { return this.svc.ledger(this.role(req), account); }
}
