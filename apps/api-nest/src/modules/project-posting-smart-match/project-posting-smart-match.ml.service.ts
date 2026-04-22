/** Domain 33 — Project Posting Smart Match. Refactored (FD-12). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';
import { ProjectPostingSmartMatchRepository, type ProjectStudioRow, type CandidateRow } from './project-posting-smart-match.repository';

export type MatchScore = { candidate: CandidateRow; matchScore: number; reasons: string[] };

const Schema = z.object({
  items: z.array(z.object({ candidateId: z.string(), matchScore: z.number(), reasons: z.array(z.string()) })),
}).passthrough();

@Injectable()
export class ProjectPostingSmartMatchMlService {
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';
  constructor(
    private readonly repo: ProjectPostingSmartMatchRepository,
    private readonly ml: MlClient,
  ) {}

  async match(project: ProjectStudioRow, opts: { topK: number; diversify: boolean; minScore: number; excludeInvited: boolean }): Promise<{ items: MatchScore[]; mode: 'ml' | 'fallback' }> {
    const invitedSet = new Set(this.repo.invitesForProject(project.id).map((i) => i.candidateId));
    const pool = this.repo.candidatePool().filter((c) => !opts.excludeInvited || !invitedSet.has(c.id));

    const r = await this.ml.withFallback(
      {
        endpoint: 'project-match.match',
        url: `${this.base}/project-posting/match`,
        body: { project, candidates: pool, opts },
        schema: Schema,
        timeoutMs: 800,
      },
      () => {
        const scored = pool.map((c) => this.scoreCandidate(project, c)).filter((s) => s.matchScore >= opts.minScore);
        const sorted = (opts.diversify ? this.diversifyByCategory(scored.sort((a, b) => b.matchScore - a.matchScore)) : scored.sort((a, b) => b.matchScore - a.matchScore)).slice(0, opts.topK);
        return { items: sorted.map((s) => ({ candidateId: s.candidate.id, matchScore: s.matchScore, reasons: s.reasons })) };
      },
    );

    const byId = new Map(pool.map((c) => [c.id, c]));
    const items: MatchScore[] = (r.data as any).items
      .map((it: any) => byId.get(it.candidateId) ? { candidate: byId.get(it.candidateId)!, matchScore: it.matchScore, reasons: it.reasons } : null)
      .filter(Boolean)
      .slice(0, opts.topK);
    return { items, mode: r.meta.fallback ? 'fallback' : 'ml' };
  }

  private scoreCandidate(project: ProjectStudioRow, c: CandidateRow): MatchScore {
    const reasons: string[] = [];
    const projectSkills = project.skills.map((s) => s.toLowerCase());
    const candSkills = c.skills.map((s) => s.toLowerCase());
    const overlapCount = candSkills.filter((s) => projectSkills.includes(s)).length;
    const overlap = projectSkills.length ? overlapCount / projectSkills.length : 0.4;
    if (overlapCount > 0) reasons.push(`${overlapCount}/${projectSkills.length} skills match`);
    const expFit = c.experienceLevel === project.experienceLevel ? 1 : (Math.abs(this.expRank(c.experienceLevel) - this.expRank(project.experienceLevel)) === 1 ? 0.6 : 0.2);
    if (expFit >= 0.6) reasons.push(`Experience aligned (${c.experienceLevel})`);
    const workplaceFit = c.workplaces.includes(project.workplace) ? 1 : 0.4;
    if (workplaceFit === 1) reasons.push(`${project.workplace} ready`);
    const ratingFit = Math.min(1, c.rating / 5);
    if (c.rating >= 4.7) reasons.push(`Top rated (${c.rating})`);
    const availFit = c.availability === 'open' ? 1 : c.availability === 'limited' ? 0.6 : 0.2;
    if (c.availability === 'open') reasons.push('Available now');
    const score = Math.round(((overlap * 0.45) + (expFit * 0.18) + (workplaceFit * 0.12) + (ratingFit * 0.13) + (availFit * 0.12)) * 100);
    return { candidate: c, matchScore: Math.max(0, Math.min(100, score)), reasons };
  }

  private expRank(level: 'entry' | 'intermediate' | 'expert') { return level === 'entry' ? 0 : level === 'intermediate' ? 1 : 2; }

  private diversifyByCategory(scored: MatchScore[]): MatchScore[] {
    const buckets = new Map<string, MatchScore[]>();
    scored.forEach((s) => {
      const key = s.candidate.categories[0] ?? 'other';
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(s);
    });
    const out: MatchScore[] = [];
    let added = true;
    while (added) {
      added = false;
      for (const arr of buckets.values()) {
        const next = arr.shift();
        if (next) { out.push(next); added = true; }
      }
    }
    return out;
  }
}
