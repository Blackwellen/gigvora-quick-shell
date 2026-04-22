import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SalesNavigatorService } from './sales-navigator.service';
import { SalesNavigatorRepository } from './sales-navigator.repository';
import {
  ActivityCreateSchema, GoalCreateSchema, LeadCreateSchema, LeadSearchSchema,
  LeadUpdateSchema, ListCreateSchema, SeatInviteSchema, SequenceCreateSchema, SignalCreateSchema,
} from './dto';

@Controller('api/v1/sales-navigator')
@UseGuards(JwtAuthGuard)
export class SalesNavigatorController {
  constructor(
    private readonly svc: SalesNavigatorService,
    private readonly repo: SalesNavigatorRepository,
  ) {}

  private id(req: any): string { return req.user?.identityId ?? req.user?.sub; }

  @Get('overview')
  overview(@Req() req: any) { return this.svc.overview(this.id(req)); }

  // Leads
  @Get('leads')
  leads(@Req() req: any, @Query() q: any) {
    const filters = LeadSearchSchema.parse({
      ...q,
      page: q.page ? Number(q.page) : 1,
      page_size: q.page_size ? Number(q.page_size) : 25,
      saved: q.saved === 'true',
      intent_min: q.intent_min ? Number(q.intent_min) : undefined,
      seniority: q.seniority ? (Array.isArray(q.seniority) ? q.seniority : [q.seniority]) : undefined,
    });
    return this.repo.listLeads(this.id(req), filters);
  }
  @Get('leads/:id')
  async lead(@Req() req: any, @Param('id') id: string) { return this.svc.ensureLead(this.id(req), id); }
  @Post('leads')
  async createLead(@Req() req: any, @Body() body: any) {
    return this.svc.createLead(this.id(req), LeadCreateSchema.parse(body));
  }
  @Patch('leads/:id')
  async updateLead(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    await this.svc.ensureLead(this.id(req), id);
    const lead = await this.repo.updateLead(this.id(req), id, LeadUpdateSchema.parse(body));
    await this.repo.audit(this.id(req), 'lead.update', 'lead', id, body);
    return lead;
  }
  @Delete('leads/:id')
  async removeLead(@Req() req: any, @Param('id') id: string) {
    await this.repo.audit(this.id(req), 'lead.delete', 'lead', id, {});
    return this.repo.deleteLead(this.id(req), id);
  }
  @Post('leads/:id/save')
  async saveLead(@Req() req: any, @Param('id') id: string) {
    await this.svc.ensureLead(this.id(req), id);
    return this.repo.updateLead(this.id(req), id, { saved: true });
  }

  // Lists
  @Get('lists')
  lists(@Req() req: any) { return { items: this.repo.listLeadLists(this.id(req)) }; }
  @Post('lists')
  createList(@Req() req: any, @Body() body: any) {
    return this.repo.createList(this.id(req), ListCreateSchema.parse(body));
  }
  @Post('lists/:id/add')
  addToList(@Req() req: any, @Param('id') id: string, @Body() body: { lead_ids: string[] }) {
    return this.repo.addToList(this.id(req), id, (body.lead_ids ?? []).slice(0, 500));
  }

  // Sequences & activities
  @Get('sequences')
  sequences(@Req() req: any) { return { items: this.repo.listSequences(this.id(req)) }; }
  @Post('sequences')
  createSeq(@Req() req: any, @Body() body: any) {
    return this.repo.createSequence(this.id(req), SequenceCreateSchema.parse(body));
  }
  @Get('activities')
  activities(@Req() req: any, @Query('lead_id') leadId?: string) {
    return { items: this.repo.listActivities(this.id(req), leadId) };
  }
  @Post('activities')
  async createActivity(@Req() req: any, @Body() body: any) {
    const data = ActivityCreateSchema.parse(body);
    await this.svc.ensureLead(this.id(req), data.lead_id);
    return this.repo.createActivity(this.id(req), data);
  }

  // Goals
  @Get('goals')
  goals(@Req() req: any) { return { items: this.repo.listGoals(this.id(req)) }; }
  @Post('goals')
  createGoal(@Req() req: any, @Body() body: any) {
    return this.repo.createGoal(this.id(req), GoalCreateSchema.parse(body));
  }

  // Signals
  @Get('signals')
  signals(@Query() q: any) {
    return {
      items: this.repo.listSignals({
        company_id: q.company_id, kind: q.kind,
        severity_min: q.severity_min ? Number(q.severity_min) : undefined,
        limit: q.limit ? Math.min(Number(q.limit), 200) : 100,
      }),
    };
  }
  @Post('signals')
  createSignal(@Body() body: any) { return this.repo.createSignal(SignalCreateSchema.parse(body)); }

  // Account search (reuses companies)
  @Get('accounts/search')
  accounts(@Query('q') q = '') { return { items: this.repo.accountSearch(q, 25) }; }

  // Seats
  @Get('seats')
  seats(@Query('workspace_id') wsId: string) { return { items: this.repo.listSeats(wsId) }; }
  @Post('seats')
  invite(@Body() body: any) { return this.repo.upsertSeat(SeatInviteSchema.parse(body)); }
}
