import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ReportingRepository } from './reporting.repository';

/**
 * FD-13 — Reporting service. Executes a report definition against
 * `analytics_rollups` (the canonical metric table) and returns a structured
 * dataset that the controller serialises to JSON, CSV, or XLSX.
 */
@Injectable()
export class ReportingService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly repo: ReportingRepository,
  ) {}

  async run(reportId: string): Promise<{
    columns: string[]; rows: any[][]; meta: { ranAt: string; bucket: string; rangeDays: number };
  }> {
    const def = await this.repo.byId(reportId);
    if (!def) throw new Error('not_found');
    const q = (def.query ?? {}) as { metric_keys: string[]; bucket: string; range_days: number };
    const bucket = q.bucket ?? 'day';
    const range  = Math.min(365, Math.max(1, q.range_days ?? 30));
    const metrics = (q.metric_keys ?? []).slice(0, 20);
    const rows = await this.ds.query(
      `SELECT bucket_at, metric, value
         FROM analytics_rollups
        WHERE bucket=$1 AND metric = ANY($2)
          AND bucket_at >= now() - ($3 || ' days')::interval
        ORDER BY bucket_at ASC`,
      [bucket, metrics, range],
    ).catch(() => []);

    // Pivot to [bucket_at, metric_a, metric_b, ...]
    const cols = ['bucket_at', ...metrics];
    const byBucket = new Map<string, Record<string, any>>();
    for (const r of rows) {
      const k = new Date(r.bucket_at).toISOString();
      if (!byBucket.has(k)) byBucket.set(k, { bucket_at: k });
      byBucket.get(k)![r.metric] = Number(r.value);
    }
    const out = Array.from(byBucket.values())
      .sort((a, b) => a.bucket_at.localeCompare(b.bucket_at))
      .map((row) => cols.map((c) => row[c] ?? null));

    await this.repo.recordRun(reportId, 'succeeded', out.length, null);
    return { columns: cols, rows: out, meta: { ranAt: new Date().toISOString(), bucket, rangeDays: range } };
  }

  /** CSV serialisation for download endpoints. */
  toCsv(data: { columns: string[]; rows: any[][] }): string {
    const esc = (v: any) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [data.columns.join(','), ...data.rows.map((r) => r.map(esc).join(','))].join('\n');
  }
}
