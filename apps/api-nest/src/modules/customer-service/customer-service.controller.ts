import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomerServiceService } from './customer-service.service';
import {
  CreateTicketSchema, UpdateTicketSchema, TransitionTicketSchema,
  PostMessageSchema, ListTicketsSchema,
  CreateTaskSchema, UpdateTaskSchema, ListTasksSchema,
} from './dto';

@Controller('api/v1/customer-service')
@UseGuards(AuthGuard('jwt'))
export class CustomerServiceController {
  constructor(private readonly svc: CustomerServiceService) {}
  private actor(req: any): string { return req.user.sub; }
  private role(req: any): string { return req.user.csRole ?? req.user.role ?? 'customer'; }
  private meta(req: any) { return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] }; }

  @Get('overview') overview(@Req() req: any) { return this.svc.overview(this.role(req)); }

  @Get('tickets') list(@Req() req: any, @Query() q: any) {
    return this.svc.list(this.role(req), this.actor(req), ListTicketsSchema.parse({
      ...q, page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 25,
    }));
  }
  @Get('tickets/:id') detail(@Req() req: any, @Param('id') id: string) {
    return this.svc.detail(this.role(req), this.actor(req), id);
  }
  @Post('tickets') create(@Req() req: any, @Body() body: any) {
    return this.svc.create(this.actor(req), this.role(req), CreateTicketSchema.parse(body), this.meta(req));
  }
  @Patch('tickets') update(@Req() req: any, @Body() body: any) {
    return this.svc.update(this.actor(req), this.role(req), UpdateTicketSchema.parse(body), this.meta(req));
  }
  @Patch('tickets/transition') transition(@Req() req: any, @Body() body: any) {
    return this.svc.transition(this.actor(req), this.role(req), TransitionTicketSchema.parse(body), this.meta(req));
  }
  @Post('messages') postMessage(@Req() req: any, @Body() body: any) {
    return this.svc.postMessage(this.actor(req), this.role(req), PostMessageSchema.parse(body), this.meta(req));
  }
  @Get('macros') macros(@Req() req: any) { return this.svc.macros(this.role(req)); }
  @Post('suggest-priority') suggest(@Body() body: { subject: string; body?: string }) {
    return this.svc.suggestPriority(String(body.subject ?? ''), String(body.body ?? ''));
  }

  // ── Delegated tasks ───────────────────────────────
  @Get('tasks') listTasks(@Req() req: any, @Query() q: any) {
    return this.svc.listTasks(this.role(req), ListTasksSchema.parse({
      ...q, page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 50,
    }));
  }
  @Post('tasks') createTask(@Req() req: any, @Body() body: any) {
    return this.svc.createTask(this.actor(req), this.role(req), CreateTaskSchema.parse(body));
  }
  @Patch('tasks') updateTask(@Req() req: any, @Body() body: any) {
    return this.svc.updateTask(this.actor(req), this.role(req), UpdateTaskSchema.parse(body));
  }
}
