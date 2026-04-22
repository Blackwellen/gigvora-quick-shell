/**
 * MlPipelineService — enterprise-grade backend for:
 *   • ML Pipeline Health card (aggregated per-model uptime/precision/recall)
 *   • Per-subject ML score lookups (used by TS / Moderator dashboards to
 *     replace hard-coded mlScore literals on each row)
 *   • Sample ingestion from the FastAPI ML service (so health card reflects
 *     live numbers, not seed data)
 *   • ID-Verifier connector matrix CRUD with envelope-encrypted secrets,
 *     append-only audit log, and graceful health probing.
 *
 * Wires through the global MlClient → calls FastAPI `/ml/pipeline-health` for
 * deterministic aggregation, falls back to in-process aggregation if the
 * Python service is down (16 GB-VPS rule: never blank).
 */
import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';
import { MlPipelineRepository } from './ml-pipeline.repository';
import { sealSecret, openSecret, secretFingerprint } from './ml-pipeline.crypto';

const ML_BASE = process.env.ML_PYTHON_URL ?? 'http://localhost:8088';

const HealthEnvelope = z.object({
  data: z.object({
    models: z.array(z.object({
      model: z.string(), version: z.string(),
      precision: z.number(), recall: z.number(),
      uptime_pct: z.number(), latency_p95_ms: z.number(),
      samples: z.number(), band: z.enum(['green', 'amber', 'red']),
    })),
    overall: z.object({
      uptime_pct: z.number(), precision: z.number(),
      recall: z.number(), models: z.number(),
    }),
  }),
  meta: z.object({ model: z.string(), version: z.string(), latency_ms: z.number() }),
});

export type MlModelHealth = {
  model: string; version: string;
  precision: number; recall: number;
  uptime_pct: number; latency_p95_ms: number;
  band: 'green' | 'amber' | 'red';
};

const ADMIN_ROLES = new Set([
  'sa_admin', 'tsml_admin', 'ts_admin', 'mod_admin', 'super_admin',
]);

function isAdmin(role: string): boolean { return ADMIN_ROLES.has(role); }
function band(p: number, r: number, up: number): 'green' | 'amber' | 'red' {
  if (up < 0.95 || p < 0.7 || r < 0.6) return 'red';
  if (up < 0.99 || p < 0.85 || r < 0.8) return 'amber';
  return 'green';
}

@Injectable()
export class MlPipelineService {
  private readonly log = new Logger(MlPipelineService.name);

  constructor(
    private readonly repo: MlPipelineRepository,
    private readonly mlClient: MlClient,
  ) {}

  // ── Health card ────────────────────────────────────────
  async pipelineHealth(): Promise<{ data: MlModelHealth[]; meta: { source: string; latency_ms: number; fallback: boolean } }> {
    const recent = await this.repo.recentPerformance(200);

    if (!recent.length) {
      // No samples yet — return seeded models with neutral metrics so card never blanks.
      const models = await this.repo.listActiveModels();
      return {
        data: models.map((m) => ({
          model: m.name, version: m.version,
          precision: 0, recall: 0, uptime_pct: 0, latency_p95_ms: 0, band: 'amber' as const,
        })),
        meta: { source: 'seed', latency_ms: 0, fallback: true },
      };
    }

    const observations = recent.map((r) => ({
      model: r.model, version: r.version,
      precision: r.precision, recall: r.recall,
      latency_p95_ms: r.latency_p95_ms, uptime_pct: r.uptime_pct,
      sampled_at: r.sampled_at,
    }));

    const result = await this.mlClient.withFallback({
      endpoint: 'ml.pipeline-health',
      url: `${ML_BASE}/ml/pipeline-health`,
      body: { observations },
      schema: HealthEnvelope,
      timeoutMs: 1500,
    }, () => this.aggregateLocally(observations));

    const data: MlModelHealth[] = (result.data as any).data?.models
      ? (result.data as any).data.models.map((m: any) => ({
          model: m.model, version: m.version,
          precision: m.precision, recall: m.recall,
          uptime_pct: m.uptime_pct, latency_p95_ms: m.latency_p95_ms, band: m.band,
        }))
      : (result.data as any) as MlModelHealth[];

    return { data, meta: result.meta };
  }

  private aggregateLocally(obs: any[]): { data: { models: any[]; overall: any } } {
    const grouped = new Map<string, { p: number[]; r: number[]; up: number[]; lat: number[]; version: string; samples: number }>();
    for (const o of obs) {
      const g = grouped.get(o.model) ?? { p: [], r: [], up: [], lat: [], version: o.version, samples: 0 };
      g.p.push(Number(o.precision)); g.r.push(Number(o.recall));
      g.up.push(Number(o.uptime_pct)); g.lat.push(Number(o.latency_p95_ms));
      g.samples += 1;
      grouped.set(o.model, g);
    }
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
    const models = [...grouped.entries()].map(([model, g]) => {
      const p = +avg(g.p).toFixed(4), r = +avg(g.r).toFixed(4);
      const up = +avg(g.up).toFixed(4), lat = Math.round(avg(g.lat));
      return { model, version: g.version, precision: p, recall: r, uptime_pct: up, latency_p95_ms: lat, samples: g.samples, band: band(p, r, up) };
    });
    const overall = {
      uptime_pct: +avg(models.map((m) => m.uptime_pct)).toFixed(4),
      precision:  +avg(models.map((m) => m.precision )).toFixed(4),
      recall:     +avg(models.map((m) => m.recall    )).toFixed(4),
      models: models.length,
    };
    return { data: { models, overall } };
  }

  // ── Sample ingestion (called by FastAPI cron / NestJS scheduler) ──
  async ingestPerformanceSample(role: string, body: {
    model: string; version: string; kind: string;
    precision: number; recall: number;
    latency_p95_ms: number; uptime_pct: number; sample_size?: number;
  }): Promise<{ ok: true }> {
    if (!isAdmin(role) && role !== 'system') throw new ForbiddenException('admin or system only');
    const m = await this.repo.upsertModel(body.model, body.version, body.kind);
    await this.repo.insertPerformance({
      modelId: m.id,
      precision: body.precision, recall: body.recall,
      latencyP95Ms: body.latency_p95_ms, uptimePct: body.uptime_pct,
      sampleSize: body.sample_size,
    });
    return { ok: true };
  }

  // ── Score writes / reads ───────────────────────────────
  async writeScore(role: string, body: {
    model: string; version?: string; kind?: string;
    subjectKind: string; subjectId: string;
    score: number; band: string; flag: string;
    components?: unknown; reason?: unknown;
  }): Promise<{ ok: true }> {
    if (!isAdmin(role) && role !== 'system') throw new ForbiddenException('admin or system only');
    let model = await this.repo.findModelByName(body.model);
    if (!model) {
      model = await this.repo.upsertModel(body.model, body.version ?? '0.0.0', body.kind ?? 'other');
    }
    await this.repo.insertScore({
      modelId: model.id,
      subjectKind: body.subjectKind, subjectId: body.subjectId,
      score: body.score, band: body.band, flag: body.flag,
      components: body.components, reason: body.reason,
    });
    return { ok: true };
  }

  async scoresFor(subjectKind: string, subjectIds: string[]) {
    const rows = await this.repo.latestScoresFor(subjectKind, subjectIds);
    const out: Record<string, typeof rows[number]> = {};
    for (const r of rows) out[r.subject_id] = r;
    return out;
  }

  // ── ID-Verifier connectors ─────────────────────────────
  async listConnectors() {
    return this.repo.listConnectors();
  }

  async toggleConnector(role: string, actorId: string, id: string, enabled: boolean,
                        ip?: string, ua?: string) {
    if (!isAdmin(role)) throw new ForbiddenException('admin only');
    const c = await this.repo.getConnector(id);
    if (!c) throw new NotFoundException('connector not found');
    return this.repo.setConnectorEnabled(id, enabled, actorId, ip, ua);
  }

  async rotateConnectorSecret(role: string, actorId: string, id: string,
                              plaintextSecret: string | null,
                              configPublic: Record<string, unknown> | undefined,
                              ip?: string, ua?: string) {
    if (!isAdmin(role)) throw new ForbiddenException('admin only');
    const c = await this.repo.getConnector(id);
    if (!c) throw new NotFoundException('connector not found');
    const sealed = plaintextSecret ? sealSecret(plaintextSecret) : null;
    const res = await this.repo.setConnectorSecret(id, sealed, configPublic, actorId, ip, ua);
    if (plaintextSecret) {
      this.log.log(`connector ${c.provider} secret rotated by ${actorId} (fp=${secretFingerprint(plaintextSecret)})`);
    }
    return res;
  }

  /** Used by the NestJS verification flow to actually call the upstream provider. */
  async resolveConnectorSecret(connectorId: string): Promise<string | null> {
    const cipher = await this.repo.getConnectorSecretCipher(connectorId);
    if (!cipher) return null;
    return openSecret(cipher);
  }

  async connectorEvents(role: string, id: string) {
    if (!isAdmin(role)) throw new ForbiddenException('admin only');
    return this.repo.listConnectorEvents(id);
  }
}
