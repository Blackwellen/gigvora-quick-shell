import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { z } from 'zod';
import { MlPipelineService } from './ml-pipeline.service';

const PerfSchema = z.object({
  model: z.string().min(1).max(64),
  version: z.string().min(1).max(32),
  kind: z.string().min(1).max(32),
  precision: z.number().min(0).max(1),
  recall: z.number().min(0).max(1),
  latency_p95_ms: z.number().int().min(0),
  uptime_pct: z.number().min(0).max(1),
  sample_size: z.number().int().min(0).optional(),
});

const ScoreSchema = z.object({
  model: z.string().min(1).max(64),
  version: z.string().max(32).optional(),
  kind: z.string().max(32).optional(),
  subjectKind: z.string().min(1).max(32),
  subjectId: z.string().min(1).max(128),
  score: z.number().min(0).max(1),
  band: z.string().min(1).max(32),
  flag: z.string().min(1).max(64),
  components: z.unknown().optional(),
  reason: z.unknown().optional(),
});

const ToggleSchema = z.object({ enabled: z.boolean() });
const SecretSchema = z.object({
  secret: z.string().min(1).max(4096).nullable(),
  configPublic: z.record(z.string(), z.unknown()).optional(),
});

@Controller('api/v1/ml-pipeline')
@UseGuards(AuthGuard('jwt'))
export class MlPipelineController {
  constructor(private readonly svc: MlPipelineService) {}
  private actor(r: any) { return r.user.sub; }
  private role(r: any)  { return r.user.tsmlRole ?? r.user.adminRole ?? r.user.role ?? 'viewer'; }
  private ip(r: any)    { return r.ip ?? r.headers?.['x-forwarded-for']; }
  private ua(r: any)    { return r.headers?.['user-agent']; }

  @Get('health')
  health() { return this.svc.pipelineHealth(); }

  @Post('performance')
  ingestPerf(@Req() r: any, @Body() body: any) {
    return this.svc.ingestPerformanceSample(this.role(r), PerfSchema.parse(body));
  }

  @Post('scores')
  writeScore(@Req() r: any, @Body() body: any) {
    return this.svc.writeScore(this.role(r), ScoreSchema.parse(body));
  }

  @Get('scores')
  readScores(@Query('subjectKind') subjectKind: string, @Query('ids') ids: string) {
    const list = (ids ?? '').split(',').filter(Boolean).slice(0, 200);
    return this.svc.scoresFor(subjectKind, list);
  }

  // ── ID-Verifier connectors ─────────────────────────────
  @Get('id-verify/connectors')
  listConnectors() { return this.svc.listConnectors(); }

  @Post('id-verify/connectors/:id/toggle')
  toggleConnector(@Req() r: any, @Param('id') id: string, @Body() body: any) {
    const { enabled } = ToggleSchema.parse(body);
    return this.svc.toggleConnector(this.role(r), this.actor(r), id, enabled, this.ip(r), this.ua(r));
  }

  @Post('id-verify/connectors/:id/secret')
  rotateConnectorSecret(@Req() r: any, @Param('id') id: string, @Body() body: any) {
    const { secret, configPublic } = SecretSchema.parse(body);
    return this.svc.rotateConnectorSecret(this.role(r), this.actor(r), id, secret, configPublic, this.ip(r), this.ua(r));
  }

  @Get('id-verify/connectors/:id/events')
  connectorEvents(@Req() r: any, @Param('id') id: string) {
    return this.svc.connectorEvents(this.role(r), id);
  }
}
