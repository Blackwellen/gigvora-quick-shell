import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { and, eq, idempotencyKeys, type Db } from '@gigvora/db';
import { DB } from './db.provider';

const TTL_HOURS = 24;

@Injectable()
export class IdempotencyService {
  constructor(@Inject(DB) private readonly db: Db) {}

  /**
   * Wrap a write handler with replay-safe semantics. If the same actor +
   * scope + key has been seen with an identical request body, return the
   * cached response instead of re-running the handler.
   */
  async run<T>(args: {
    actorId: string;
    scope: string;
    key: string | undefined;
    body: unknown;
    handler: () => Promise<T>;
  }): Promise<T> {
    if (!args.key) return args.handler();
    const hash = createHash('sha256')
      .update(JSON.stringify(args.body ?? null))
      .digest('hex');

    const existing = await this.db
      .select()
      .from(idempotencyKeys)
      .where(
        and(
          eq(idempotencyKeys.actorId, args.actorId),
          eq(idempotencyKeys.scope, args.scope),
          eq(idempotencyKeys.key, args.key),
        ),
      )
      .limit(1);

    if (existing[0]) {
      if (existing[0].requestHash !== hash) {
        // Same key, different body — RFC: must be rejected.
        const err = new Error('Idempotency-Key reused with different payload');
        (err as { status?: number }).status = 409;
        throw err;
      }
      return existing[0].responseBody as T;
    }

    const result = await args.handler();
    const expires = new Date(Date.now() + TTL_HOURS * 3600 * 1000);
    await this.db
      .insert(idempotencyKeys)
      .values({
        actorId: args.actorId,
        scope: args.scope,
        key: args.key,
        requestHash: hash,
        responseStatus: 200,
        responseBody: (result ?? null) as never,
        expiresAt: expires,
      })
      .onConflictDoNothing();
    return result;
  }
}
