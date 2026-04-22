import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { KpiRegistryRepository } from './kpi-registry.repository';
import { KpiEvaluatorService } from './kpi-evaluator.service';
import { KpiAssignZ, KpiCreateZ, KpiUpdateZ } from './dto';

@Controller('api/v1/kpi-registry')
@UseGuards(AuthGuard('jwt'))
export class KpiRegistryController {
  constructor(
    private readonly repo: KpiRegistryRepository,
    private readonly evaluator: KpiEvaluatorService,
  ) {}

  @Get()
  list(@Query('portal') portal?: string, @Query('status') status?: string,
       @Query('tenantId') tenantId = 'global') {
    return this.repo.list({ portal, status, tenantId });
  }

  @Get('portal/:portal/cards')
  cards(@Param('portal') portal: string) { return this.repo.portalCards(portal); }

  @Get(':id')
  byId(@Param('id') id: string) { return this.repo.byId(id); }

  @Get(':id/series')
  series(@Param('id') id: string,
         @Query('bucket') bucket: 'hour'|'day'|'week'|'month' = 'day',
         @Query('limit') limit = 90) {
    return this.repo.series(id, bucket, Number(limit));
  }

  @Get(':id/evaluate')
  async evaluate(@Param('id') id: string) {
    const def = await this.repo.byId(id);
    if (!def) return { error: 'not_found' };
    const r = await this.evaluator.evaluate(def);
    return { def, ...r };
  }

  @Post()
  async create(@Body() body: unknown, @Req() req: any) {
    const input = KpiCreateZ.parse(body);
    const out = await this.repo.create(input, req.user?.sub ?? null, req.user?.tenantId ?? 'global');
    await this.repo.audit('kpi.create', out.id, req.user?.sub ?? null, null, out, req.ip);
    return out;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown, @Req() req: any) {
    const before = await this.repo.byId(id);
    const patch = KpiUpdateZ.parse(body);
    const out = await this.repo.update(id, patch);
    await this.repo.audit('kpi.update', id, req.user?.sub ?? null, before, out, req.ip);
    return out;
  }

  @Post(':id/assign')
  async assign(@Param('id') id: string, @Body() body: unknown, @Req() req: any) {
    const a = KpiAssignZ.parse(body);
    const out = await this.repo.assign(id, a, req.user?.sub ?? null);
    await this.repo.audit('kpi.assign', id, req.user?.sub ?? null, null, out, req.ip);
    return out;
  }

  @Delete(':id/assign/:portal')
  async unassign(@Param('id') id: string, @Param('portal') portal: string, @Req() req: any) {
    const out = await this.repo.unassign(id, portal);
    await this.repo.audit('kpi.unassign', id, req.user?.sub ?? null, { portal }, null, req.ip);
    return out;
  }

  @Post('evaluate-all')
  async evaluateAll(@Req() req: any) {
    const out = await this.evaluator.evaluateAllAndPersist();
    await this.repo.audit('kpi.evaluate_all', null, req.user?.sub ?? null, null, out, req.ip);
    return out;
  }
}
