/**
 * D31 ML bridge — explainable talent-match scoring.
 * FD-12: canonical MlClient.withFallback + Zod envelope.
 */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';
import type { ProfileRow } from './candidate-availability-matching.repository';

export interface JobInput {
  id: string; title: string;
  skills: string[]; remote: string; workType: string;
  location?: string; salaryGbpMin?: number; salaryGbpMax?: number;
}

export interface MatchScoreResult {
  score: number; reasons: string[];
  source: 'ml' | 'fallback'; modelVersion: string; fallback?: boolean;
}

const Schema = z.object({
  data: z.object({
    score: z.number(),
    reasons: z.array(z.string()),
    modelVersion: z.string().optional(),
  }),
  meta: z.object({ model: z.string(), version: z.string(), latency_ms: z.number(), fallback: z.boolean().optional() }),
});

@Injectable()
export class CandidateAvailabilityMatchingMlService {
  private readonly base = process.env.ML_PY_URL ?? process.env.ML_PYTHON_URL ?? 'http://localhost:8001';
  constructor(private readonly ml: MlClient) {}

  async scoreProfileForJob(profile: ProfileRow, job: JobInput, requestId?: string): Promise<MatchScoreResult> {
    const r = await this.ml.withFallback(
      {
        endpoint: 'cam.score',
        url: `${this.base}/ml/availability-matching/score`,
        body: { profile, job },
        schema: Schema,
        requestId,
      },
      () => this.fallback(profile, job),
    );
    if (r.meta.fallback) {
      const f = r.data as MatchScoreResult;
      return { ...f, source: 'fallback', fallback: true };
    }
    const d = (r.data as any).data;
    return { score: d.score, reasons: d.reasons, source: 'ml', modelVersion: d.modelVersion ?? 'cam-1.0', fallback: false };
  }

  private fallback(profile: ProfileRow, job: JobInput): MatchScoreResult {
    const reasons: string[] = [];
    let score = 30;
    const skillMatches = job.skills.filter((s) => profile.preferredSkills.map((x) => x.toLowerCase()).includes(s.toLowerCase()));
    if (skillMatches.length) { score += Math.min(35, skillMatches.length * 8); reasons.push(`${skillMatches.length} skill match(es): ${skillMatches.slice(0, 3).join(', ')}`); }
    if (profile.workTypes.includes(job.workType as any)) { score += 10; reasons.push(`Work type match (${job.workType})`); }
    if (profile.remote === job.remote || (profile.remote === 'remote_global' && job.remote === 'remote')) { score += 10; reasons.push(`Remote posture match (${job.remote})`); }
    if (job.location && profile.locations.some((l) => l.toLowerCase().includes(job.location!.toLowerCase()))) { score += 5; reasons.push(`Location match (${job.location})`); }
    if (job.salaryGbpMax != null && profile.desiredSalaryGbpMin != null && job.salaryGbpMax >= profile.desiredSalaryGbpMin) { score += 10; reasons.push('Salary band aligned'); }
    if (profile.status === 'active') { score += 5; reasons.push('Profile active'); }
    if (profile.noticePeriodDays === 0) { score += 5; reasons.push('Available immediately'); }
    return { score: Math.max(0, Math.min(100, score)), reasons, source: 'fallback', modelVersion: 'cam-fallback-1.0' };
  }
}
