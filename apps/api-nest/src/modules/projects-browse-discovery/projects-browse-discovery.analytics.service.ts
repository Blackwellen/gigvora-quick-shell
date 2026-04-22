/**
 * Domain 32 — Analytics / insight service.
 *
 * Powers the right-rail KPI band, anomaly notes, and the prioritised
 * "Hot categories" tile. Pure functions over the in-memory fixtures so
 * the workbench stays interactive even when the analytics worker is paused.
 */
import { Injectable } from '@nestjs/common';
import { ProjectsBrowseDiscoveryRepository } from './projects-browse-discovery.repository';

@Injectable()
export class ProjectsBrowseDiscoveryAnalyticsService {
  constructor(private readonly repo: ProjectsBrowseDiscoveryRepository) {}

  insights(_identityId?: string) {
    const all = this.repo.list();
    const open = all.filter((p) => p.status === 'open');
    const newToday = open.filter((p) => Date.now() - Date.parse(p.postedAt) < 86_400_000).length;
    const remoteShare = open.length ? Math.round((open.filter((p) => p.remote === 'remote').length / open.length) * 100) : 0;
    const avgBudget = open.length ? Math.round(open.reduce((s, p) => s + (p.budgetMin + p.budgetMax) / 2, 0) / open.length) : 0;
    const avgProposals = open.length ? Math.round(open.reduce((s, p) => s + p.proposals, 0) / open.length) : 0;
    const skillCount = new Map<string, number>();
    open.forEach((p) => p.skills.forEach((s) => skillCount.set(s, (skillCount.get(s) ?? 0) + 1)));
    const hotSkills = [...skillCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([s]) => s);
    const lowProposals = open.filter((p) => p.proposals < 5).length;
    const anomalyNote = lowProposals > 4
      ? `${lowProposals} open projects have under 5 proposals — submit early for better signal-to-noise.`
      : null;
    return {
      totalOpen: open.length,
      newToday,
      remoteShare,
      avgBudget,
      avgProposals,
      hotSkills,
      anomalyNote,
      generatedAt: new Date().toISOString(),
      mode: 'fallback',
    };
  }
}
