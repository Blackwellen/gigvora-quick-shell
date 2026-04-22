/** FD-13 — analytics rollups + reporting hooks for live page data. */
import { useQuery } from '@tanstack/react-query';

const BASE = (import.meta as any).env?.VITE_GIGVORA_API_URL ?? '';

export interface MetricSeriesPoint { bucket_at: string; metric: string; value: number }

/** Read raw analytics_rollups for one or more metric keys. */
export function useAnalyticsRollups(metrics: string[], opts: { bucket?: 'hour'|'day'|'week'|'month'; days?: number } = {}) {
  const bucket = opts.bucket ?? 'day';
  const days   = opts.days   ?? 30;
  return useQuery<MetricSeriesPoint[]>({
    queryKey: ['analytics-rollups', metrics, bucket, days],
    queryFn: async () => {
      if (!BASE) return [];
      const url = `${BASE}/api/v1/reporting/reports/inline/run?metrics=${encodeURIComponent(metrics.join(','))}&bucket=${bucket}&days=${days}`;
      const r = await fetch(url, { credentials: 'include' });
      if (!r.ok) return [];
      const data = await r.json();
      // Reshape pivoted columns/rows into long form
      const cols: string[] = data.columns ?? [];
      const out: MetricSeriesPoint[] = [];
      for (const row of data.rows ?? []) {
        const at = row[0];
        for (let i = 1; i < cols.length; i++) {
          if (row[i] != null) out.push({ bucket_at: at, metric: cols[i], value: Number(row[i]) });
        }
      }
      return out;
    },
    staleTime: 60_000,
  });
}

/** Group totals into a funnel ordering. */
export function bucketSum(points: MetricSeriesPoint[], metric: string): number {
  return points.filter((p) => p.metric === metric).reduce((acc, p) => acc + p.value, 0);
}

/** Group by bucket_at preserving order. */
export function pivotByBucket(points: MetricSeriesPoint[], metrics: string[]) {
  const map = new Map<string, Record<string, number>>();
  for (const p of points) {
    if (!map.has(p.bucket_at)) map.set(p.bucket_at, {});
    map.get(p.bucket_at)![p.metric] = p.value;
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucket_at, vals]) => ({ bucket_at, ...Object.fromEntries(metrics.map((m) => [m, vals[m] ?? 0])) }));
}
