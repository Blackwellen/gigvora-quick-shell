/**
 * D36 analytics — contract velocity, signing funnel, and integrity health.
 * Pure in-process aggregation; mirrors the D35 analytics shape.
 */
import { Injectable } from '@nestjs/common';
import { ContractsSowAcceptanceRepository } from './contracts-sow-acceptance.repository';

@Injectable()
export class ContractsSowAcceptanceAnalyticsService {
  constructor(private readonly repo: ContractsSowAcceptanceRepository) {}

  insights(tenantId: string, projectId?: string) {
    const rows = this.repo.list(tenantId, { projectId });
    const total = rows.length;
    const buckets = { draft: 0, sent: 0, partiallySigned: 0, signed: 0, active: 0, rejected: 0, cancelled: 0, expired: 0, superseded: 0 };
    let signTotalMs = 0; let signSamples = 0;
    let integrityOk = 0;
    for (const r of rows) {
      switch (r.status) {
        case 'draft': buckets.draft++; break;
        case 'sent': buckets.sent++; break;
        case 'partially-signed': buckets.partiallySigned++; break;
        case 'signed': buckets.signed++; break;
        case 'active': buckets.active++; break;
        case 'rejected': buckets.rejected++; break;
        case 'cancelled': buckets.cancelled++; break;
        case 'expired': buckets.expired++; break;
        case 'superseded': buckets.superseded++; break;
      }
      if (r.activatedAt) {
        signTotalMs += new Date(r.activatedAt).getTime() - new Date(r.createdAt).getTime();
        signSamples++;
      }
      const verify = this.repo.verifyHash(r.id);
      if (verify.ok) integrityOk++;
    }
    return {
      ...buckets,
      total,
      avgTimeToSignHours: signSamples ? Math.round((signTotalMs / signSamples) / 3_600_000 * 10) / 10 : 0,
      integrityOkPct: total ? Math.round((integrityOk / total) * 100) : 100,
      generatedAt: new Date().toISOString(),
      mode: 'in-process',
    };
  }
}
