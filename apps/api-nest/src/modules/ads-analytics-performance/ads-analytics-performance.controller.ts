import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdsAnalyticsPerformanceService } from './ads-analytics-performance.service';
import {
  QuerySchema, SavedReportSchema, SavedReportTransitionSchema,
  AlertSchema, AlertTransitionSchema, ExportSchema, AnomalyTransitionSchema,
  CreativeScoreQuerySchema,
} from './dto';

@Controller('api/v1/ads-analytics-performance')
@UseGuards(AuthGuard('jwt'))
export class AdsAnalyticsPerformanceController {
  constructor(private readonly svc: AdsAnalyticsPerformanceService) {}
  private reqMeta(req: any) { return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] }; }
  private ownerOf(req: any): string { return req.user.orgId ?? req.user.sub; }
  private actorOf(req: any): string { return req.user.sub; }
  private roleOf(req: any): string { return req.user.role ?? 'owner'; }

  @Get('overview') overview(@Req() req: any) { return this.svc.overview(this.ownerOf(req)); }

  @Post('query') query(@Req() req: any, @Body() body: any) {
    return this.svc.query(this.ownerOf(req), QuerySchema.parse(body));
  }

  // Creative scores
  @Get('creative-scores') listCreativeScores(@Req() req: any, @Query() q: any) {
    return this.svc.listCreativeScores(this.ownerOf(req), CreativeScoreQuerySchema.parse(q));
  }
  @Post('creative-scores/:creativeId/recompute')
  recomputeCreativeScore(@Req() req: any, @Param('creativeId') creativeId: string, @Query('windowDays') windowDays?: string) {
    const w = Number(windowDays) || 7;
    if (![7,14,30].includes(w)) throw new Error('windowDays must be 7|14|30');
    return this.svc.recomputeCreativeScore(this.ownerOf(req), creativeId, w);
  }

  // Saved reports
  @Get('saved-reports') listSavedReports(@Req() req: any, @Query('status') status?: string) {
    return this.svc.listSavedReports(this.ownerOf(req), status);
  }
  @Get('saved-reports/:id') getSavedReport(@Req() req: any, @Param('id') id: string) {
    return this.svc.getSavedReport(this.ownerOf(req), id);
  }
  @Post('saved-reports') createSavedReport(@Req() req: any, @Body() body: any) {
    return this.svc.createSavedReport(this.ownerOf(req), SavedReportSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('saved-reports/:id') updateSavedReport(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateSavedReport(this.ownerOf(req), id, SavedReportSchema.partial().parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('saved-reports/:id/status') transitionSavedReport(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const dto = SavedReportTransitionSchema.parse(body);
    return this.svc.transitionSavedReport(this.ownerOf(req), id, dto.status, this.actorOf(req), this.reqMeta(req));
  }

  // Alerts
  @Get('alerts') listAlerts(@Req() req: any, @Query('status') status?: string) {
    return this.svc.listAlerts(this.ownerOf(req), status);
  }
  @Get('alerts/:id') getAlert(@Req() req: any, @Param('id') id: string) { return this.svc.getAlert(this.ownerOf(req), id); }
  @Post('alerts') createAlert(@Req() req: any, @Body() body: any) {
    return this.svc.createAlert(this.ownerOf(req), AlertSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('alerts/:id') updateAlert(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateAlert(this.ownerOf(req), id, AlertSchema.partial().parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('alerts/:id/status') transitionAlert(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const dto = AlertTransitionSchema.parse(body);
    return this.svc.transitionAlert(this.ownerOf(req), id, dto.status, dto.reason, this.actorOf(req), this.roleOf(req), this.reqMeta(req));
  }
  @Get('alerts/:id/events') alertEvents(@Param('id') id: string) { return this.svc.alertEvents(id); }

  // Exports
  @Get('exports') listExports(@Req() req: any, @Query('status') status?: string) {
    return this.svc.listExports(this.ownerOf(req), status);
  }
  @Post('exports') createExport(@Req() req: any, @Body() body: any) {
    return this.svc.createExport(this.ownerOf(req), ExportSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Delete('exports/:id') cancelExport(@Req() req: any, @Param('id') id: string) {
    return this.svc.cancelExport(this.ownerOf(req), id, this.actorOf(req), this.reqMeta(req));
  }

  // Anomalies
  @Get('anomalies') listAnomalies(@Req() req: any, @Query('status') status?: string) {
    return this.svc.listAnomalies(this.ownerOf(req), status);
  }
  @Patch('anomalies/:id/status') transitionAnomaly(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const dto = AnomalyTransitionSchema.parse(body);
    return this.svc.transitionAnomaly(this.ownerOf(req), id, dto.status, this.actorOf(req), this.roleOf(req), this.reqMeta(req));
  }
  @Post('anomalies/detect') detectAnomalies(@Req() req: any) { return this.svc.detectAnomalies(this.ownerOf(req)); }

  @Get('audit') audit(@Req() req: any, @Query('limit') limit?: string) {
    return this.svc.audit(this.ownerOf(req), Math.min(500, Math.max(1, Number(limit) || 200)));
  }
}
