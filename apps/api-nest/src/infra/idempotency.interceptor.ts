import { CallHandler, ConflictException, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { createHash } from 'node:crypto';
import { Observable, from, of, switchMap, tap } from 'rxjs';

/**
 * Replay-safe POST/PUT/PATCH/DELETE handler.
 * Clients send `Idempotency-Key: <uuid>`. Same actor+route+key+body
 * returns the cached response; same key with a different body → 409.
 *
 * Storage: `idempotency_keys` table. Falls back to in-memory map if the
 * table does not exist yet (dev), so the API stays usable.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly log = new Logger('Idempotency');
  private readonly mem = new Map<string, { hash: string; body: unknown; at: number }>();
  private readonly TTL_MS = 24 * 3600 * 1000;

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const method = String(req?.method ?? 'GET').toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return next.handle();
    const key = req.headers?.['idempotency-key'];
    if (!key || typeof key !== 'string') return next.handle();

    const actorId = req.user?.sub ?? req.ip ?? 'anon';
    const scope = `${method} ${req.route?.path ?? req.url}`;
    const hash = createHash('sha256').update(JSON.stringify(req.body ?? null)).digest('hex');
    const composite = `${actorId}::${scope}::${key}`;

    return from(this.lookup(actorId, scope, key)).pipe(
      switchMap((existing) => {
        if (existing) {
          if (existing.hash !== hash) throw new ConflictException('idempotency_key_reused_with_different_body');
          return of(existing.body);
        }
        const memHit = this.mem.get(composite);
        if (memHit) {
          if (memHit.hash !== hash) throw new ConflictException('idempotency_key_reused_with_different_body');
          return of(memHit.body);
        }
        return next.handle().pipe(
          tap((body) => {
            this.mem.set(composite, { hash, body, at: Date.now() });
            this.persist(actorId, scope, key, hash, body).catch(() => undefined);
            this.gcMem();
          }),
        );
      }),
    );
  }

  private async lookup(actorId: string, scope: string, key: string): Promise<{ hash: string; body: unknown } | null> {
    try {
      const rows = await this.ds.query(
        `SELECT request_hash, response_body FROM idempotency_keys
          WHERE actor_id=$1 AND scope=$2 AND key=$3 AND expires_at > now() LIMIT 1`,
        [actorId, scope, key],
      );
      if (!rows[0]) return null;
      return { hash: rows[0].request_hash, body: rows[0].response_body };
    } catch {
      return null;
    }
  }

  private async persist(actorId: string, scope: string, key: string, hash: string, body: unknown) {
    try {
      await this.ds.query(
        `INSERT INTO idempotency_keys (actor_id, scope, key, request_hash, response_status, response_body, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6, now() + interval '24 hours')
         ON CONFLICT (actor_id, scope, key) DO NOTHING`,
        [actorId, scope, key, hash, 200, body ?? null],
      );
    } catch (err) {
      this.log.debug(`persist skipped: ${(err as Error).message}`);
    }
  }

  private gcMem() {
    if (this.mem.size < 1000) return;
    const cutoff = Date.now() - this.TTL_MS;
    for (const [k, v] of this.mem) if (v.at < cutoff) this.mem.delete(k);
  }
}
