import { Worker, QueueEvents, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { Pool } from 'pg';
import pino from 'pino';
import { ALL_QUEUES, QUEUES } from './queues.ts';
import { HANDLERS } from './handlers.ts';
import { recordJobRun } from './job-audit.ts';
import { WorkerRealtime } from './worker-realtime.ts';

const log = pino({ name: 'workers' });

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
const pubRedis   = new IORedis(redisUrl, { maxRetriesPerRequest: null });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, idleTimeoutMillis: 30000,
});

const broker = new WorkerRealtime(pool, pubRedis);
const ctx = { pool, broker };

for (const name of ALL_QUEUES) {
  const handler = HANDLERS[name];
  if (!handler) { log.warn({ name }, 'no handler bound — skipping'); continue; }

  const w = new Worker(name, async (job) => {
    const startedAt = new Date();
    try {
      const result = await handler({ name: job.name, ...(job.data ?? {}) }, ctx);
      const durationMs = Date.now() - startedAt.getTime();
      await recordJobRun(pool, {
        queue: name, jobId: String(job.id), jobName: job.name,
        payload: job.data, result, status: 'completed',
        durationMs, attemptsMade: job.attemptsMade ?? 1, startedAt,
      });
      // Bump queue depth counter (approx — refreshed precisely by cron)
      await broker.bump('global', 'global', `queue.processed.${name}`, 1);
      return result;
    } catch (err: any) {
      const durationMs = Date.now() - startedAt.getTime();
      await recordJobRun(pool, {
        queue: name, jobId: String(job.id), jobName: job.name,
        payload: job.data, status: 'failed',
        durationMs, attemptsMade: job.attemptsMade ?? 1,
        failedReason: err?.message ?? 'unknown', startedAt,
      });
      throw err;
    }
  }, { connection, concurrency: Number(process.env.WORKER_CONCURRENCY ?? 4) });

  w.on('failed',    (job, err) => log.error({ name, jobId: job?.id, err }, 'job failed'));
  w.on('completed', (job)      => log.debug({ name, jobId: job.id }, 'job done'));

  new QueueEvents(name, { connection });
  log.info({ queue: name }, 'worker started');
}

// Producer handles for ad-hoc enqueue via this process (e.g. tests, scripts)
export const queues = Object.fromEntries(
  ALL_QUEUES.map((n) => [n, new Queue(n, { connection })]),
) as Record<string, Queue>;
export { QUEUES };

const shutdown = async () => {
  log.info('shutting down workers');
  await Promise.all(Object.values(queues).map((q) => q.close().catch(() => null)));
  await connection.quit().catch(() => null);
  await pubRedis.quit().catch(() => null);
  await pool.end().catch(() => null);
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT',  shutdown);
