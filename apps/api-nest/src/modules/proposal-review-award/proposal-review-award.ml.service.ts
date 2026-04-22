/**
 * D35 — Comparative scoring matrix.
 * FD-12: canonical MlClient.withFallback. Deterministic local scorer is the
 * fallback path; learned LTR variant on the Python side substitutes behind the
 * same envelope when wired.
 */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';
import { ProposalReviewAwardRepository, type ReviewRow } from './proposal-review-award.repository';

export type AxisExplain = { axis: 'price' | 'timeline' | 'fit' | 'risk'; score: number; weight: number; weighted: number; note: string };
export type ScoredRow = {
  reviewId: string; proposalId: string; ownerName: string; bidAmountCents: number; timelineWeeks: number;
  scoreFit: number; scoreRisk: number; status: string;
  total: number; axes: AxisExplain[]; isRecommended: boolean;
};

const Schema = z.object({
  data: z.object({
    projectId: z.string(),
    weights: z.object({ price: z.number(), timeline: z.number(), fit: z.number(), risk: z.number() }),
    rows: z.array(z.any()),
  }),
  meta: z.object({ model: z.string(), version: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});

@Injectable()
export class ProposalReviewAwardMlService {
  private readonly base = process.env.ML_PY_URL ?? process.env.ML_PYTHON_URL ?? 'http://localhost:8001';
  constructor(
    private readonly repo: ProposalReviewAwardRepository,
    private readonly ml: MlClient,
  ) {}

  async scoreProject(projectId: string, weightsOverride?: { price: number; timeline: number; fit: number; risk: number }, proposalIdsFilter?: string[], requestId?: string) {
    const r = await this.ml.withFallback(
      {
        endpoint: 'proposal.score-project',
        url: `${this.base}/proposals/score-project`,
        body: { projectId, weightsOverride, proposalIdsFilter },
        schema: Schema,
        requestId,
      },
      () => this.fallback(projectId, weightsOverride, proposalIdsFilter),
    );
    const base = r.meta.fallback ? r.data as any : (r.data as any).data;
    return { ...base, mode: r.meta.fallback ? 'fallback' as const : 'ml' as const, fallback: r.meta.fallback, generatedAt: new Date().toISOString() };
  }

  private fallback(projectId: string, weightsOverride?: { price: number; timeline: number; fit: number; risk: number }, proposalIdsFilter?: string[]) {
    const cohort = this.repo.byProject(projectId);
    if (!cohort.length) return { projectId, weights: weightsOverride ?? this.repo.weightsFor(projectId), rows: [] as ScoredRow[] };
    const weights = weightsOverride ?? this.repo.weightsFor(projectId);
    const sumW = weights.price + weights.timeline + weights.fit + weights.risk || 1;
    const norm = { price: weights.price / sumW, timeline: weights.timeline / sumW, fit: weights.fit / sumW, risk: weights.risk / sumW };
    const minPrice = Math.min(...cohort.map((c) => c.bidAmountCents));
    const maxPrice = Math.max(...cohort.map((c) => c.bidAmountCents));
    const minWeeks = Math.min(...cohort.map((c) => c.timelineWeeks));
    const maxWeeks = Math.max(...cohort.map((c) => c.timelineWeeks));
    const score = (r: ReviewRow): ScoredRow => {
      const priceScore = maxPrice === minPrice ? 80 : Math.round(100 - ((r.bidAmountCents - minPrice) / (maxPrice - minPrice)) * 100);
      const timelineScore = maxWeeks === minWeeks ? 80 : Math.round(100 - ((r.timelineWeeks - minWeeks) / (maxWeeks - minWeeks)) * 100);
      const fitScore = r.scoreFit;
      const riskScore = 100 - r.scoreRisk;
      const axes: AxisExplain[] = [
        { axis: 'price',    score: priceScore,    weight: norm.price,    weighted: Math.round(priceScore * norm.price * 100) / 100,    note: `£${(r.bidAmountCents / 100).toFixed(0)} vs cohort £${(minPrice / 100).toFixed(0)}–${(maxPrice / 100).toFixed(0)}` },
        { axis: 'timeline', score: timelineScore, weight: norm.timeline, weighted: Math.round(timelineScore * norm.timeline * 100) / 100, note: `${r.timelineWeeks}w vs cohort ${minWeeks}–${maxWeeks}w` },
        { axis: 'fit',      score: fitScore,      weight: norm.fit,      weighted: Math.round(fitScore * norm.fit * 100) / 100,      note: `Skill + portfolio overlap ${fitScore}/100` },
        { axis: 'risk',     score: riskScore,     weight: norm.risk,     weighted: Math.round(riskScore * norm.risk * 100) / 100,     note: `Risk (${r.scoreRisk}/100) inverted; lower-risk wins` },
      ];
      const total = Math.round(axes.reduce((s, a) => s + a.weighted, 0) * 10) / 10;
      return { reviewId: r.id, proposalId: r.proposalId, ownerName: r.ownerName, bidAmountCents: r.bidAmountCents, timelineWeeks: r.timelineWeeks, scoreFit: r.scoreFit, scoreRisk: r.scoreRisk, status: r.status, total, axes, isRecommended: false };
    };
    let rows = cohort.map(score).sort((a, b) => b.total - a.total);
    if (proposalIdsFilter?.length) rows = rows.filter((r) => proposalIdsFilter.includes(r.proposalId));
    if (rows.length) rows[0].isRecommended = true;
    return { projectId, weights: norm, rows };
  }
}
