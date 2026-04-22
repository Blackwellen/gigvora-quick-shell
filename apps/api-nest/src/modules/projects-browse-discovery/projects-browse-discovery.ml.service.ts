/** Domain 32 — Projects Browse Discovery ML bridge. Refactored (FD-12). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';
import { ProjectsBrowseDiscoveryRepository, type ProjectRow } from './projects-browse-discovery.repository';
import type { ProjectBrowseFilters } from './dto';

const Schema = z.object({ ranked: z.array(z.object({ id: z.string() }).passthrough()) }).passthrough();

@Injectable()
export class ProjectsBrowseDiscoveryMlService {
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';
  constructor(
    private readonly repo: ProjectsBrowseDiscoveryRepository,
    private readonly ml: MlClient,
  ) {}

  async rank(filters: ProjectBrowseFilters, identityId?: string): Promise<{ rows: ProjectRow[]; mode: 'ml' | 'fallback' | 'recency' }> {
    const candidates = this.repo.applyFilters(this.repo.list(), filters);
    const baseline = this.heuristic(candidates, filters, identityId);
    if (filters.sort && filters.sort !== 'match' && filters.sort !== 'relevance') {
      return { rows: baseline, mode: filters.sort === 'newest' ? 'recency' : 'fallback' };
    }
    const r = await this.ml.withFallback(
      { endpoint: 'projects-browse.rank', url: `${this.base}/projects-browse/rank`, body: { identityId, filters, candidates: candidates.slice(0, 200) }, schema: Schema, timeoutMs: 600 },
      () => ({ ranked: baseline.map((b) => ({ id: b.id })) }),
    );
    if (r.meta.fallback) return { rows: baseline, mode: 'fallback' };
    const ids: string[] = (r.data as any).ranked?.map((x: any) => x.id) ?? [];
    const byId = new Map(baseline.map((b) => [b.id, b]));
    const reordered = ids.map((id) => byId.get(id)).filter(Boolean) as ProjectRow[];
    const seen = new Set(reordered.map((g) => g.id));
    return { rows: [...reordered, ...baseline.filter((b) => !seen.has(b.id))], mode: 'ml' };
  }

  matchScore(row: ProjectRow, filters: ProjectBrowseFilters, _identityId?: string): number {
    const wantedSkills = (filters.skills ?? []).map((s) => s.toLowerCase());
    const overlap = wantedSkills.length
      ? row.skills.filter((s) => wantedSkills.includes(s.toLowerCase())).length / wantedSkills.length
      : 0.4;
    const recencyHours = Math.max(1, (Date.now() - Date.parse(row.postedAt)) / 3_600_000);
    const recencyScore = Math.max(0, 1 - Math.log10(recencyHours) / 3);
    const competition = Math.max(0, 1 - row.proposals / 50);
    const verified = row.clientVerified ? 0.1 : 0;
    const score = (overlap * 0.45) + (recencyScore * 0.25) + (competition * 0.2) + verified + 0.05;
    return Math.round(Math.min(1, Math.max(0, score)) * 100);
  }

  private heuristic(rows: ProjectRow[], filters: ProjectBrowseFilters, _identityId?: string): ProjectRow[] {
    const sort = filters.sort;
    const decorated = rows.map((r) => ({ r, s: this.matchScore(r, filters) }));
    switch (sort) {
      case 'newest': return [...rows].sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt));
      case 'budget_desc': return [...rows].sort((a, b) => b.budgetMax - a.budgetMax);
      case 'budget_asc': return [...rows].sort((a, b) => a.budgetMin - b.budgetMin);
      case 'proposals_asc': return [...rows].sort((a, b) => a.proposals - b.proposals);
      case 'ending_soon': return [...rows].sort((a, b) => a.proposals - b.proposals);
      default: return decorated.sort((a, b) => b.s - a.s).map((x) => x.r);
    }
  }
}
