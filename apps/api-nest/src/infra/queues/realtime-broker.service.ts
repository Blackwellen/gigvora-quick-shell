import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotificationsGateway } from '../../modules/notifications/notifications.gateway';

type Scope = 'global' | 'user' | 'org';

/**
 * FD-14 — central broker that worker handlers + Nest services call to:
 *   1. Persist a counter delta in `realtime_counters`
 *   2. Fan it out via Socket.IO room (user / topic / global)
 *
 * No Supabase Realtime — pure Socket.IO over our own gateway.
 */
@Injectable()
export class RealtimeBrokerService {
  private readonly log = new Logger('RealtimeBroker');
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly gw: NotificationsGateway,
  ) {}

  /** Increment a counter and broadcast the new value. */
  async bump(scope: Scope, scopeId: string, key: string, delta = 1) {
    const r = await this.ds.query(
      `INSERT INTO realtime_counters (scope, scope_id, key, value, updated_at)
       VALUES ($1,$2,$3,$4, now())
       ON CONFLICT (scope, scope_id, key)
       DO UPDATE SET value = realtime_counters.value + EXCLUDED.value, updated_at = now()
       RETURNING value`,
      [scope, scopeId, key, delta],
    ).catch(() => [{ value: delta }]);
    const value = Number(r[0]?.value ?? delta);
    this.broadcast(scope, scopeId, key, value);
    return value;
  }

  /** Set absolute value (used by analytics rollups). */
  async set(scope: Scope, scopeId: string, key: string, value: number) {
    await this.ds.query(
      `INSERT INTO realtime_counters (scope, scope_id, key, value, updated_at)
       VALUES ($1,$2,$3,$4, now())
       ON CONFLICT (scope, scope_id, key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()`,
      [scope, scopeId, key, value],
    ).catch(() => null);
    this.broadcast(scope, scopeId, key, value);
  }

  /** Read snapshot for the /counters endpoint. */
  async snapshot(scope: Scope, scopeId = 'global'): Promise<Record<string, number>> {
    const rows = await this.ds.query(
      `SELECT key, value FROM realtime_counters WHERE scope=$1 AND scope_id=$2`,
      [scope, scopeId],
    ).catch(() => []);
    return Object.fromEntries(rows.map((r: any) => [r.key, Number(r.value)]));
  }

  /** Direct event fan-out without counter persistence (for realtime feeds). */
  emit(scope: Scope, scopeId: string, event: string, payload: unknown) {
    if (scope === 'user')   return this.gw.emitToUser(scopeId, event, payload);
    if (scope === 'org')    return this.gw.emitToTopic(`org:${scopeId}`, event, payload);
    this.gw.emitToTopic('global', event, payload);
  }

  private broadcast(scope: Scope, scopeId: string, key: string, value: number) {
    const payload = { key, value, ts: Date.now() };
    if (scope === 'user') this.gw.emitToUser(scopeId, 'counter.update', payload);
    else if (scope === 'org') this.gw.emitToTopic(`org:${scopeId}`, 'counter.update', payload);
    else this.gw.emitToTopic('global', 'counter.update', payload);
  }
}
