import { Body, Controller, Delete, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ReportingRepository } from './reporting.repository';
import { ReportingService } from './reporting.service';
import { ReportCreateZ, ScheduleCreateZ } from './dto';

@Controller('api/v1/reporting')
@UseGuards(AuthGuard('jwt'))
export class ReportingController {
  constructor(
    private readonly repo: ReportingRepository,
    private readonly svc: ReportingService,
  ) {}

  @Get('reports')
  list(@Req() req: any, @Query('tenantId') tenantId = 'global') {
    return this.repo.list(tenantId, req.user?.sub ?? null);
  }

  @Get('reports/:id') byId(@Param('id') id: string) { return this.repo.byId(id); }

  @Post('reports')
  create(@Body() body: unknown, @Req() req: any, @Query('tenantId') tenantId = 'global') {
    return this.repo.create(ReportCreateZ.parse(body), req.user?.sub ?? null, tenantId);
  }

  @Delete('reports/:id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.repo.delete(id, req.user?.sub ?? null);
  }

  @Get('reports/:id/run') run(@Param('id') id: string) { return this.svc.run(id); }

  @Get('reports/:id/run.csv')
  async runCsv(@Param('id') id: string, @Res() res: Response) {
    const data = await this.svc.run(id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="report-${id}.csv"`);
    res.send(this.svc.toCsv(data));
  }

  @Get('reports/:id/runs') runs(@Param('id') id: string) { return this.repo.runs(id); }

  @Get('reports/:id/schedules') schedules(@Param('id') id: string) { return this.repo.schedules(id); }
  @Post('reports/:id/schedules')
  createSchedule(@Param('id') id: string, @Body() body: unknown) {
    return this.repo.createSchedule(id, ScheduleCreateZ.parse(body));
  }
}
