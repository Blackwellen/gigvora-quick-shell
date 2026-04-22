import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { KpiRegistryRepository } from './kpi-registry.repository';

/**
 * FD-13 — KPI runtime evaluator.
 * Materialises the four binding fields (target_type / value_mode / unset_state)
 * into a single computed value per KPI. Called by the analytics-rollup worker
 * via the KpiSnapshotService and on-demand by the read controller.
 */
@Injectable()
export class KpiEvaluatorService {
  private readonly log = new Logger('KpiEvaluator');
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly repo: KpiRegistryRepository,
  ) {}

  /**
   * Evaluate a single KPI definition. Returns the headline number plus the
   * resolved unset_state when the source returns nothing.
   */
  async evaluate(def: any, opts: { bucket?: 'hour'|'day'|'week'|'month' } = {}): Promise<{
    value: number | null; prev: number | null; isUnset: boolean;
    unsetState: string; bucket: string; bucketAt: Date;
  }> {
    const bucket = opts.bucket ?? this.bucketFor(def.value_mode);
    const bucketAt = this.bucketStart(bucket);

    const cur  = await this.fetchValue(def, bucketAt, bucket);
    const prev = await this.fetchValue(def, this.shiftBucket(bucketAt, bucket, -1), bucket);

    let value: number | null = cur;
    if (def.value_mode === 'delta'         && cur != null && prev != null) value = cur - prev;
    else if (def.value_mode === 'signed_change' && cur != null && prev != null) value = cur - prev;
    else if (def.value_mode === 'rolling_avg') value = await this.rollingAvg(def, bucket, 7);
    else if (def.value_mode === 'target_progress' && def.target_value)
      value = cur != null ? Math.min(100, (cur / Number(def.target_value)) * 100) : null;

    const isUnset = value == null;
    return {
      value: isUnset ? this.unsetFallback(def, prev) : value,
      prev, isUnset, unsetState: def.unset_state, bucket, bucketAt,
    };
  }

  /** Evaluate every live KPI and persist a snapshot row. */
  async evaluateAllAndPersist() {
    const rows = await this.ds.query(
      `SELECT * FROM kpi_definitions WHERE status='live'`,
    ).catch(() => []);
    let written = 0;
    for (const def of rows) {
      try {
        const r = await this.evaluate(def);
        if (r.value != null) {
          await this.repo.writeSnapshot(def.id, r.bucket, r.bucketAt, Number(r.value),
            r.prev != null ? Number(r.prev) : undefined);
          written++;
        }
      } catch (err) { this.log.warn(`evaluate ${def.id} failed: ${(err as Error).message}`); }
    }
    return { evaluated: rows.length, written };
  }

  // ---- internals -----------------------------------------------------------

  private bucketFor(mode: string): 'hour'|'day'|'week'|'month' {
    if (mode === 'rolling_avg') return 'day';
    return 'hour';
  }

  private bucketStart(bucket: string, ref = new Date()): Date {
    const d = new Date(ref);
    d.setSeconds(0, 0);
    if (bucket === 'hour')  d.setMinutes(0);
    if (bucket === 'day')   { d.setHours(0); d.setMinutes(0); }
    if (bucket === 'week')  { const dow = d.getDay(); d.setDate(d.getDate() - dow); d.setHours(0); d.setMinutes(0); }
    if (bucket === 'month') { d.setDate(1); d.setHours(0); d.setMinutes(0); }
    return d;
  }

  private shiftBucket(d: Date, bucket: string, n: number): Date {
    const x = new Date(d);
    if (bucket === 'hour')  x.setHours(x.getHours() + n);
    if (bucket === 'day')   x.setDate(x.getDate() + n);
    if (bucket === 'week')  x.setDate(x.getDate() + 7 * n);
    if (bucket === 'month') x.setMonth(x.getMonth() + n);
    return x;
  }

  private async fetchValue(def: any, bucketAt: Date, bucket: string): Promise<number | null> {
    if (def.source === 'analytics_rollups') {
      const r = await this.ds.query(
        `SELECT value FROM analytics_rollups WHERE bucket=$1 AND metric=$2 AND bucket_at=$3 LIMIT 1`,
        [bucket, def.metric_key, bucketAt],
      ).catch(() => []);
      return r[0]?.value != null ? Number(r[0].value) : null;
    }
    if (def.source === 'analytics_events') {
      const r = await this.ds.query(
        `SELECT COUNT(*)::int c FROM analytics_events
          WHERE event_name=$1 AND occurred_at >= $2 AND occurred_at < $3`,
        [def.metric_key, bucketAt, this.shiftBucket(bucketAt, bucket, 1)],
      ).catch(() => [{ c: 0 }]);
      return Number(r[0]?.c ?? 0);
    }
    if (def.source === 'sql' && def.source_query) {
      // SAFETY: read-only, single-statement, must not touch sensitive schemas.
      if (!/^\s*select\b/i.test(def.source_query)) return null;
      if (/(^|\s)(insert|update|delete|drop|alter|grant|truncate)\s/i.test(def.source_query)) return null;
      const r = await this.ds.query(def.source_query).catch(() => []);
      const v = r[0] && Object.values(r[0])[0];
      return v != null ? Number(v) : null;
    }
    return null;
  }

  private async rollingAvg(def: any, bucket: string, n: number): Promise<number | null> {
    const r = await this.ds.query(
      `SELECT AVG(value)::numeric AS v FROM analytics_rollups
        WHERE bucket=$1 AND metric=$2
          AND bucket_at >= now() - ($3 || ' ' || $4)::interval`,
      [bucket, def.metric_key, n, bucket === 'hour' ? 'hours' : 'days'],
    ).catch(() => []);
    return r[0]?.v != null ? Number(r[0].v) : null;
  }

  /** unset_state policy — returns the value to render when source has nothing. */
  private unsetFallback(def: any, prev: number | null): number | null {
    switch (def.unset_state) {
      case 'zero':       return 0;
      case 'last_known': return prev;
      case 'hide':
      case 'dash':
      case 'placeholder':
      default:           return null;
    }
  }
}
