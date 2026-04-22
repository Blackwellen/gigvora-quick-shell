/** Domain 12 — Companies ML bridge. Hardened via shared MlClient (Group 2). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';

export interface CompanyDoc {
  id: string;
  name?: string;
  description?: string;
  industries?: string[];
  keywords?: string[];
  size_band?: 'micro' | 'sme' | 'mid' | 'large' | 'enterprise' | 'unknown';
  region?: string | null;
  public?: boolean;
}
export interface SimilarCompany { id: string; score: number; cosine?: number; industry_overlap?: number; }
export interface Competitor { id: string; score: number; shared_industries: string[]; }
export interface MlEnvelope<T> { data: T; meta: { model: string; version: string; latency_ms: number; fallback?: boolean }; }

const SimSchema = z.object({
  data: z.array(z.object({ id: z.string(), score: z.number(), cosine: z.number().optional(), industry_overlap: z.number().optional() })),
  meta: z.object({ model: z.string(), version: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});
const CompSchema = z.object({
  data: z.array(z.object({ id: z.string(), score: z.number(), shared_industries: z.array(z.string()) })),
  meta: z.object({ model: z.string(), version: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});

@Injectable()
export class CompaniesMlService {
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';
  constructor(private readonly ml: MlClient) {}

  async similar(target: CompanyDoc, candidates: CompanyDoc[], limit = 20, requestId?: string): Promise<MlEnvelope<SimilarCompany[]>> {
    const r = await this.ml.withFallback(
      { endpoint: 'companies.similar', url: `${this.base}/companies/similar`, body: { target, candidates, limit }, schema: SimSchema, requestId },
      () => {
        const ti = new Set(target.industries ?? []);
        return candidates
          .filter((c) => c.id !== target.id)
          .map((c) => ({ id: c.id, score: (c.industries ?? []).filter((x) => ti.has(x)).length, industry_overlap: (c.industries ?? []).filter((x) => ti.has(x)).length }))
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
      },
    );
    if (r.meta.fallback) return { data: r.data as SimilarCompany[], meta: { model: 'fallback-industry-overlap', version: '0', latency_ms: r.meta.latency_ms, fallback: true } };
    return r.data as MlEnvelope<SimilarCompany[]>;
  }

  async competitors(target: CompanyDoc, universe: CompanyDoc[], limit = 10, requestId?: string): Promise<MlEnvelope<Competitor[]>> {
    const r = await this.ml.withFallback(
      { endpoint: 'companies.competitors', url: `${this.base}/companies/competitors`, body: { target, universe, limit }, schema: CompSchema, requestId },
      () => {
        const ti = new Set(target.industries ?? []);
        return universe
          .filter((c) => c.id !== target.id && (c.industries ?? []).some((x) => ti.has(x)))
          .map((c) => ({ id: c.id, score: 1, shared_industries: (c.industries ?? []).filter((x) => ti.has(x)) }))
          .slice(0, limit);
      },
    );
    if (r.meta.fallback) return { data: r.data as Competitor[], meta: { model: 'fallback-industry-overlap', version: '0', latency_ms: r.meta.latency_ms, fallback: true } };
    return r.data as MlEnvelope<Competitor[]>;
  }
}
