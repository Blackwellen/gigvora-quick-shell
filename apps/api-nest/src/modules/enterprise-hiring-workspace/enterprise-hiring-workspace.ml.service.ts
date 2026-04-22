/**
 * Domain 30-hiring ML bridge — approval-risk scoring.
 * FD-12: canonical MlClient.withFallback + Zod envelope.
 */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';
import type { ApprovalRequestRow, ChainTemplateRow } from './enterprise-hiring-workspace.repository';

export interface ApprovalRiskInput {
  request: Pick<ApprovalRequestRow, 'urgency' | 'subjectKind' | 'context' | 'dueAt' | 'createdAt'>;
  template: Pick<ChainTemplateRow, 'steps'>;
}
export interface ApprovalRiskResult {
  score: number; reasons: string[];
  source: 'ml' | 'fallback'; modelVersion: string; fallback?: boolean;
}

const Schema = z.object({
  data: z.object({ score: z.number(), reasons: z.array(z.string()), modelVersion: z.string().optional() }),
  meta: z.object({ model: z.string(), version: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});

@Injectable()
export class EnterpriseHiringWorkspaceMlService {
  private readonly base = process.env.ML_PY_URL ?? process.env.ML_PYTHON_URL ?? 'http://localhost:8001';
  constructor(private readonly ml: MlClient) {}

  async scoreApproval(input: ApprovalRiskInput, requestId?: string): Promise<ApprovalRiskResult> {
    const r = await this.ml.withFallback(
      {
        endpoint: 'ehw.score-approval',
        url: `${this.base}/ml/enterprise-hiring/score`,
        body: input,
        schema: Schema,
        requestId,
      },
      () => this.fallback(input),
    );
    if (r.meta.fallback) {
      const f = r.data as ApprovalRiskResult;
      return { ...f, source: 'fallback', fallback: true };
    }
    const d = (r.data as any).data;
    return { score: d.score, reasons: d.reasons, source: 'ml', modelVersion: d.modelVersion ?? 'ehw-1.0', fallback: false };
  }

  private fallback(input: ApprovalRiskInput): ApprovalRiskResult {
    const reasons: string[] = [];
    let score = 20;
    if (input.request.urgency === 'urgent') { score += 35; reasons.push('Urgent flag set'); }
    else if (input.request.urgency === 'high') { score += 20; reasons.push('High urgency'); }
    if (input.template.steps.length >= 4) { score += 15; reasons.push('Long approval chain'); }
    const ctx = input.request.context as Record<string, any>;
    if (ctx?.budgetIncrease && Number(ctx.budgetIncrease) > 0) { score += 10; reasons.push('Budget increase requested'); }
    if (ctx?.headcount && Number(ctx.headcount) > 3) { score += 10; reasons.push('Multi-headcount request'); }
    if (input.request.dueAt) {
      const hours = (Date.parse(input.request.dueAt) - Date.parse(input.request.createdAt)) / 36e5;
      if (hours < 24) { score += 15; reasons.push('Tight SLA (<24h)'); }
    }
    return { score: Math.max(0, Math.min(100, score)), reasons, source: 'fallback', modelVersion: 'ehw-fallback-1.0' };
  }
}
