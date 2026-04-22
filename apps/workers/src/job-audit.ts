import type { Pool } from 'pg';

/**
 * FD-14 — record every job outcome in `job_runs` (append-only audit).
 * Errors here MUST never throw — auditing failures are logged not raised.
 */
export async function recordJobRun(pool: Pool, params: {
  queue: string; jobId: string; jobName: string; payload: unknown;
  result?: unknown; status: 'completed'|'failed'|'cancelled';
  durationMs: number; attemptsMade: number; failedReason?: string;
  startedAt: Date;
}) {
  try {
    await pool.query(
      `INSERT INTO job_runs (queue, job_id, job_name, payload, result, status, duration_ms,
         attempts_made, failed_reason, started_at)
       VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10)`,
      [params.queue, params.jobId, params.jobName,
       JSON.stringify(params.payload ?? {}), JSON.stringify(params.result ?? null),
       params.status, params.durationMs, params.attemptsMade, params.failedReason ?? null,
       params.startedAt],
    );
  } catch (err) {
    // never throw from audit
    console.warn('[job-audit] failed', err);
  }
}
