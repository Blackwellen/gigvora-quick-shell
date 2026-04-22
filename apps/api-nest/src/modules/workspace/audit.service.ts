import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AuditService {
  private readonly log = new Logger('Audit');

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async record(p: {
    actorId: string;
    orgId?: string;
    domain?: string;
    action: string;
    targetType?: string;
    targetId?: string;
    meta?: Record<string, unknown>;
    ip?: string;
    ua?: string;
  }) {
    try {
      await this.ds.query(
        `INSERT INTO audit_events (actor_id, org_id, domain, action, target_type, target_id, meta, ip, ua)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [p.actorId, p.orgId ?? null, p.domain ?? 'shell', p.action,
         p.targetType ?? null, p.targetId ?? null, p.meta ?? {}, p.ip ?? null, p.ua ?? null],
      );
    } catch (err) {
      // Audit must never break the request
      this.log.error(`audit failed: ${(err as Error).message}`);
    }
  }
}
