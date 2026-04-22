/**
 * FD-12 — Sync the Python `/registry` manifest into `ml_models`.
 *
 * Runs at boot and on a 5-minute interval. Idempotent: marks rows that have
 * disappeared from the Python manifest as `active=false` and inserts/updates
 * everything else. The bridge therefore always exposes a truthful registry
 * without depending on the worker.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { z } from 'zod';
import { MlClient } from './ml-client';

const Schema = z.object({
  data: z.array(z.object({
    name: z.string(), version: z.string(), kind: z.string(),
    sha256: z.string(), loaded_at: z.number(),
  })),
  meta: z.object({ model: z.string(), version: z.string(), latency_ms: z.number() }),
});

@Injectable()
export class MlRegistrySyncService implements OnModuleInit {
  private readonly log = new Logger('MlRegistrySync');
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';
  constructor(private readonly ml: MlClient) {}

  async onModuleInit() {
    // Don't block boot if the Python service is still warming up.
    setTimeout(() => { this.sync().catch(() => null); }, 3000);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sync(): Promise<{ synced: number; deactivated: number } | null> {
    const r = await this.ml.call({
      endpoint: 'registry.list',
      url: `${this.base}/registry`,
      body: {},
      schema: Schema,
      timeoutMs: 1500,
    });
    if (!r.ok || !r.data) {
      this.log.debug('registry sync skipped — Python ML offline');
      return null;
    }

    // Lazy require so we don't hard-couple every process to pg.
    let pool: any;
    try { pool = await this.openPool(); } catch { return null; }

    let synced = 0;
    const seen: string[] = [];
    for (const m of r.data.data) {
      seen.push(m.name);
      try {
        await pool.query(
          `INSERT INTO ml_models (name, version, kind, active)
           VALUES ($1,$2,$3,true)
           ON CONFLICT (name, version) DO UPDATE SET kind=EXCLUDED.kind, active=true`,
          [m.name, m.version, m.kind],
        );
        synced++;
      } catch { /* table may not exist on a fresh env */ }
    }
    let deactivated = 0;
    if (seen.length) {
      try {
        const res = await pool.query(
          `UPDATE ml_models SET active=false WHERE active=true AND name <> ALL($1::text[]) RETURNING 1`,
          [seen],
        );
        deactivated = res.rowCount ?? 0;
      } catch { /* schema optional */ }
    }
    this.log.log(`registry sync: ${synced} live, ${deactivated} deactivated`);
    return { synced, deactivated };
  }

  private async openPool(): Promise<any> {
    const dsn = process.env.DATABASE_URL;
    if (!dsn) throw new Error('no DATABASE_URL');
    const { Pool } = await import('pg');
    return new Pool({ connectionString: dsn, max: 2 });
  }
}
