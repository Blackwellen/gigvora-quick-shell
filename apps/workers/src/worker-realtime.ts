import type { Pool } from 'pg';
import IORedis from 'ioredis';

/**
 * FD-14 — worker-side realtime broker. Workers can't speak Socket.IO directly
 * (gateway lives in api-nest), so they:
 *   1. Persist counter delta in `realtime_counters`
 *   2. Publish a Redis pub/sub message; api-nest gateway subscribes to
 *      `realtime:fanout` and forwards to the matching room.
 */
const CHANNEL = 'realtime:fanout';

export class WorkerRealtime {
  constructor(private readonly pool: Pool, private readonly pub: IORedis) {}

  async bump(scope: 'global'|'user'|'org', scopeId: string, key: string, delta = 1) {
    let value = delta;
    try {
      const r = await this.pool.query(
        `INSERT INTO realtime_counters (scope, scope_id, key, value, updated_at)
         VALUES ($1,$2,$3,$4, now())
         ON CONFLICT (scope, scope_id, key)
         DO UPDATE SET value = realtime_counters.value + EXCLUDED.value, updated_at = now()
         RETURNING value`,
        [scope, scopeId, key, delta],
      );
      value = Number(r.rows[0]?.value ?? delta);
    } catch (err) { console.warn('[broker] bump failed', err); }
    await this.publish({ kind: 'counter.update', scope, scopeId, key, value });
    return value;
  }

  async set(scope: 'global'|'user'|'org', scopeId: string, key: string, value: number) {
    try {
      await this.pool.query(
        `INSERT INTO realtime_counters (scope, scope_id, key, value, updated_at)
         VALUES ($1,$2,$3,$4, now())
         ON CONFLICT (scope, scope_id, key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()`,
        [scope, scopeId, key, value],
      );
    } catch (err) { console.warn('[broker] set failed', err); }
    await this.publish({ kind: 'counter.update', scope, scopeId, key, value });
  }

  async emit(scope: 'global'|'user'|'org', scopeId: string, event: string, payload: unknown) {
    await this.publish({ kind: 'event', scope, scopeId, event, payload });
  }

  private async publish(msg: unknown) {
    try { await this.pub.publish(CHANNEL, JSON.stringify(msg)); }
    catch (err) { console.warn('[broker] publish failed', err); }
  }
}
