/**
 * Domain 33 — Analytics / insight service. Powers the studio's right-rail KPIs
 * (drafts, invites sent / accepted, boost balance) plus an anomaly note for
 * projects with no responses inside the SLA window.
 */
import { Injectable } from '@nestjs/common';
import { ProjectPostingSmartMatchRepository } from './project-posting-smart-match.repository';

@Injectable()
export class ProjectPostingSmartMatchAnalyticsService {
  constructor(private readonly repo: ProjectPostingSmartMatchRepository) {}

  insights(tenantId: string) {
    const projects = this.repo.list(tenantId);
    const drafts = projects.filter((p) => p.status === 'draft').length;
    const active = projects.filter((p) => p.status === 'active').length;
    const pending = projects.filter((p) => p.status === 'pending_review').length;
    const totalInvitesSent = projects.reduce((s, p) => s + p.invitesSent, 0);
    const allInvites = projects.flatMap((p) => this.repo.invitesForProject(p.id));
    const accepted = allInvites.filter((i) => i.status === 'accepted').length;
    const declined = allInvites.filter((i) => i.status === 'declined').length;
    const acceptRate = totalInvitesSent ? Math.round((accepted / totalInvitesSent) * 100) : 0;
    const stalledProjects = projects.filter((p) => {
      if (p.status !== 'active') return false;
      const sentInvites = this.repo.invitesForProject(p.id).filter((i) => i.status === 'sent' || i.status === 'opened');
      const oldestSent = sentInvites.sort((a, b) => Date.parse(a.sentAt) - Date.parse(b.sentAt))[0];
      if (!oldestSent) return false;
      return Date.now() - Date.parse(oldestSent.sentAt) > 5 * 86_400_000;
    });
    const anomalyNote = stalledProjects.length
      ? `${stalledProjects.length} active project${stalledProjects.length === 1 ? '' : 's'} have invites with no response after 5 days — consider widening the match.`
      : null;
    return {
      drafts, active, pending,
      totalInvitesSent, accepted, declined, acceptRate,
      boostBalance: this.repo.boostBalanceOf(tenantId),
      inviteBalance: this.repo.inviteBalanceOf(tenantId),
      anomalyNote, generatedAt: new Date().toISOString(), mode: 'fallback',
    };
  }
}
