import { Inject, Injectable, Logger } from '@nestjs/common';
import { auditEvents, type Db } from '@gigvora/db';
import { DB } from './db.provider';

export interface AuditWrite {
  actorId?: string | null;
  domain: string;
  action: string;
  targetType?: string;
  targetId?: string;
  diff?: Record<string, unknown> | null;
  requestId?: string;
  ip?: string;
}

@Injectable()
export class AuditService {
  private readonly log = new Logger('Audit');
  constructor(@Inject(DB) private readonly db: Db) {}

  async write(ev: AuditWrite): Promise<void> {
    try {
      await this.db.insert(auditEvents).values({
        actorId: ev.actorId ?? null,
        domain: ev.domain,
        action: ev.action,
        targetType: ev.targetType ?? null,
        targetId: ev.targetId ?? null,
        diff: ev.diff ?? null,
        requestId: ev.requestId ?? null,
        ip: ev.ip ?? null,
      });
      this.log.log(JSON.stringify({ kind: 'audit', ...ev }));
    } catch (err) {
      // Never let audit failures break the request — log and move on.
      this.log.error(`audit write failed: ${(err as Error).message}`);
    }
  }
}
