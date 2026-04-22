/**
 * D34 — Proposal pricing-advice ML service.
 * FD-12: canonical MlClient.withFallback. The deterministic peer-band path is
 * the fallback; when the Python service is wired with a learned price model
 * (gradient-boosted on closed-won proposals) it returns the same envelope.
 */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';
import { ProposalBuilderBidCreditsRepository } from './proposal-builder-bid-credits.repository';

const Schema = z.object({
  data: z.object({
    projectId: z.string(),
    bandCents: z.object({ min: z.number(), mid: z.number(), max: z.number() }),
    currency: z.string(),
    positionLabel: z.enum(['below', 'mid', 'above']),
    competitiveScore: z.number(),
    peerCount: z.number(),
    reasons: z.array(z.string()),
  }),
  meta: z.object({ model: z.string(), version: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});

@Injectable()
export class ProposalBuilderBidCreditsMlService {
  private readonly base = process.env.ML_PY_URL ?? process.env.ML_PYTHON_URL ?? 'http://localhost:8001';
  constructor(
    private readonly repo: ProposalBuilderBidCreditsRepository,
    private readonly ml: MlClient,
  ) {}

  async pricingAdvice(projectId: string, proposedAmountCents?: number, requestId?: string) {
    const r = await this.ml.withFallback(
      {
        endpoint: 'proposal.pricing-advice',
        url: `${this.base}/proposals/pricing-advice`,
        body: { projectId, proposedAmountCents },
        schema: Schema,
        requestId,
      },
      () => this.fallback(projectId, proposedAmountCents),
    );
    const base = r.meta.fallback ? r.data as any : (r.data as any).data;
    return { ...base, mode: r.meta.fallback ? 'fallback' as const : 'ml' as const, fallback: r.meta.fallback, generatedAt: new Date().toISOString() };
  }

  private fallback(projectId: string, proposedAmountCents?: number) {
    const peers = this.repo.byProject(projectId).filter((p) => p.bidAmountCents != null);
    let minCents: number, midCents: number, maxCents: number;
    if (peers.length >= 2) {
      const sorted = peers.map((p) => p.bidAmountCents!).sort((a, b) => a - b);
      minCents = sorted[0]; maxCents = sorted[sorted.length - 1]; midCents = sorted[Math.floor(sorted.length / 2)];
    } else {
      const anchor = proposedAmountCents ?? 25_000_00;
      minCents = Math.round(anchor * 0.75); maxCents = Math.round(anchor * 1.4); midCents = Math.round(anchor * 1.05);
    }
    const reasons: string[] = [];
    let positionLabel: 'below' | 'mid' | 'above' = 'mid';
    if (proposedAmountCents != null) {
      if (proposedAmountCents < minCents) { positionLabel = 'below'; reasons.push('Bid is below competitor floor — risk of "too cheap" signal'); }
      else if (proposedAmountCents > maxCents) { positionLabel = 'above'; reasons.push('Bid exceeds competitor ceiling — clarify scope premium'); }
      else if (proposedAmountCents > midCents) { reasons.push(`Above the median (${(midCents / 100).toFixed(0)})`); }
      else { reasons.push(`Within competitive band (${(minCents / 100).toFixed(0)}–${(maxCents / 100).toFixed(0)})`); }
    } else {
      reasons.push('Provide a bid amount for personalised positioning.');
    }
    if (peers.length === 0) reasons.push('Synthetic band — no peer bids yet on this project.');
    if (peers.length >= 5) reasons.push(`${peers.length} peer bids analysed`);
    const competitiveScore = proposedAmountCents == null ? 50 : Math.max(0, Math.min(100, 100 - Math.round(Math.abs(proposedAmountCents - midCents) / midCents * 100)));
    return {
      projectId,
      bandCents: { min: minCents, mid: midCents, max: maxCents },
      currency: 'GBP',
      positionLabel,
      competitiveScore,
      peerCount: peers.length,
      reasons,
    };
  }
}
