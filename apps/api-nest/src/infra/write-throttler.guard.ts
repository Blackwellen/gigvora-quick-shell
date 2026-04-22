import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';

/**
 * Per-actor sliding-window rate limit on write requests.
 * Defaults: 60 writes / 60s per (actorId, route).
 * Memory store — fine for single-instance dev/CI; for multi-instance prod
 * back this with Redis (BullMQ connection is already available).
 */
@Injectable()
export class WriteThrottlerGuard implements CanActivate {
  private readonly hits = new Map<string, number[]>();
  private readonly windowMs = 60_000;
  private readonly limit = 60;

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const method = String(req?.method ?? 'GET').toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return true;
    const actor = req.user?.sub ?? req.ip ?? 'anon';
    const route = req.route?.path ?? req.url;
    const key = `${actor}::${method} ${route}`;
    const now = Date.now();
    const arr = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (arr.length >= this.limit) {
      throw new HttpException(
        { code: 'rate_limited', message: 'Too many writes, slow down' },
        429,
      );
    }
    arr.push(now);
    this.hits.set(key, arr);
    return true;
  }
}
