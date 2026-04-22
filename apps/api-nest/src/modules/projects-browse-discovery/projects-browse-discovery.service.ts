/**
 * Domain 32 — application service.
 *
 * Orchestrates the discovery workbench: search/rank, saved searches,
 * bookmarks, proposal lifecycle, project transitions, attachments, flags,
 * and invitations. Every meaningful write fans out via D32Emit (outbound
 * webhooks + cross-domain bus) AND realtime via the NotificationsGateway.
 */
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ProjectsBrowseDiscoveryRepository } from './projects-browse-discovery.repository';
import { ProjectsBrowseDiscoveryMlService } from './projects-browse-discovery.ml.service';
import { ProjectsBrowseDiscoveryAnalyticsService } from './projects-browse-discovery.analytics.service';
import { D32Emit } from './projects-browse-discovery.emit';
import type {
  ProjectBrowseFilters, SavedProjectSearch, ProposalDraft, ProposalDecision,
  ProjectFlag, ProjectInvite, AttachmentUploadComplete, ProjectStatus,
} from './dto';

@Injectable()
export class ProjectsBrowseDiscoveryService {
  private readonly log = new Logger('ProjectsBrowseDiscoveryService');
  constructor(
    private readonly repo: ProjectsBrowseDiscoveryRepository,
    private readonly ml: ProjectsBrowseDiscoveryMlService,
    private readonly analytics: ProjectsBrowseDiscoveryAnalyticsService,
    @Optional() @Inject('NOTIFICATIONS_GATEWAY') private readonly gateway?: {
      emitToTopic: (t: string, e: string, p: any) => void;
      emitToUser:  (u: string, e: string, p: any) => void;
      emitToEntity?: (entityType: string, entityId: string, e: string, p: any) => void;
    },
  ) {}

  // ─── Search + insights ────────────────────────────────────────────────
  async search(filters: ProjectBrowseFilters, identityId?: string, tenantId = 'tenant-demo') {
    const t0 = Date.now();
    const { rows, mode } = await this.ml.rank(filters, identityId);
    const start = (filters.page - 1) * filters.pageSize;
    const bookmarks = identityId ? new Set(this.repo.bookmarkIds(identityId)) : new Set<string>();
    const slice = rows.slice(start, start + filters.pageSize).map((r) => ({
      id: r.id, title: r.title, description: r.description,
      client: { id: r.clientId, name: r.clientName, verified: r.clientVerified },
      budget: { min: r.budgetMin, max: r.budgetMax, currency: r.currency },
      engagement: r.engagement, durationBucket: r.durationBucket,
      remote: r.remote, location: r.location, skills: r.skills, categories: r.categories,
      experienceLevel: r.experienceLevel, postedAt: r.postedAt, proposals: r.proposals,
      status: r.status, hasNda: r.hasNda, views: r.views,
      attachmentCount: r.attachments.length,
      saved: bookmarks.has(r.id),
      matchScore: this.ml.matchScore(r, filters, identityId),
    }));
    const facets = filters.facetMode === 'none' ? null : this.repo.computeFacets(rows);
    void D32Emit.searchExecuted(tenantId, identityId ?? 'anonymous', { filters, total: rows.length, mode });
    this.log.debug(`search ${rows.length} rows in ${Date.now() - t0}ms via ${mode}`);
    return {
      results: slice, total: rows.length, page: filters.page, pageSize: filters.pageSize,
      facets, rankingMode: mode, generatedAt: new Date().toISOString(),
    };
  }

  insights(identityId?: string) { return this.analytics.insights(identityId); }

  // ─── Detail + view tracking ───────────────────────────────────────────
  detail(projectId: string, identityId?: string, tenantId = 'tenant-demo') {
    const project = this.repo.trackView(projectId);
    if (!project) return null;
    void D32Emit.projectViewed(tenantId, projectId, { identityId });
    const proposals = this.repo.listProposalsForProject(projectId);
    return { project, proposals };
  }

  // ─── Saved searches ───────────────────────────────────────────────────
  listSaved(ownerId: string) { return this.repo.listSaved(ownerId); }
  upsertSaved(ownerId: string, payload: SavedProjectSearch, tenantId = 'tenant-demo') {
    const row = this.repo.upsertSaved(ownerId, payload);
    void D32Emit.savedSearchUpserted(tenantId, row.id!, { label: row.label, alertsEnabled: row.alertsEnabled, cadence: row.alertCadence });
    if (row.alertsEnabled && row.alertCadence !== 'off') {
      void D32Emit.savedSearchAlertScheduled(tenantId, row.id!, { cadence: row.alertCadence, channel: row.channel });
    }
    this.gateway?.emitToUser(ownerId, 'projects-browse.saved-search.upserted', { id: row.id, label: row.label });
    return row;
  }
  removeSaved(ownerId: string, id: string, tenantId = 'tenant-demo') {
    const ok = this.repo.removeSaved(ownerId, id);
    if (ok) {
      void D32Emit.savedSearchRemoved(tenantId, id, {});
      this.gateway?.emitToUser(ownerId, 'projects-browse.saved-search.removed', { id });
    }
    return { removed: ok };
  }

  // ─── Bookmarks ────────────────────────────────────────────────────────
  toggleBookmark(identityId: string, projectId: string, tenantId = 'tenant-demo') {
    const saved = this.repo.toggleBookmark(identityId, projectId);
    void D32Emit.bookmarkToggled(tenantId, projectId, { identityId, saved });
    this.gateway?.emitToUser(identityId, 'projects-browse.bookmark.toggled', { projectId, saved });
    return { projectId, saved };
  }
  bookmarkIds(identityId: string) { return this.repo.bookmarkIds(identityId); }

  // ─── Proposals ────────────────────────────────────────────────────────
  draftProposal(authorId: string, authorName: string, dto: ProposalDraft, tenantId = 'tenant-demo') {
    const row = this.repo.draftProposal(authorId, authorName, dto);
    void D32Emit.proposalDrafted(tenantId, row.id, { projectId: row.projectId, amount: row.proposedAmount });
    return row;
  }
  submitProposal(id: string, tenantId = 'tenant-demo') {
    const row = this.repo.submitProposal(id);
    if (!row) return null;
    void D32Emit.proposalSubmitted(tenantId, row.id, { projectId: row.projectId, amount: row.proposedAmount });
    this.gateway?.emitToTopic(`project:${row.projectId}`, 'projects-browse.proposal.submitted', { id: row.id });
    return row;
  }
  decideProposal(decision: ProposalDecision, tenantId = 'tenant-demo') {
    const row = this.repo.decideProposal(decision.proposalId, decision.decision, decision.note);
    if (!row) return null;
    if (decision.decision === 'shortlist') void D32Emit.proposalShortlisted(tenantId, row.id, { projectId: row.projectId });
    if (decision.decision === 'reject')    void D32Emit.proposalRejected(tenantId, row.id, { projectId: row.projectId, note: decision.note ?? null });
    if (decision.decision === 'accept')    void D32Emit.proposalAccepted(tenantId, row.id, { projectId: row.projectId, amount: row.proposedAmount });
    this.gateway?.emitToUser(row.authorId, 'projects-browse.proposal.decided', { id: row.id, status: row.status });
    return row;
  }
  withdrawProposal(id: string, authorId: string, tenantId = 'tenant-demo') {
    const row = this.repo.withdrawProposal(id, authorId);
    if (!row) return null;
    void D32Emit.proposalWithdrawn(tenantId, row.id, { projectId: row.projectId });
    return row;
  }
  myProposals(authorId: string) { return this.repo.listProposalsForAuthor(authorId); }

  // ─── Project transitions ──────────────────────────────────────────────
  transitionProject(id: string, next: ProjectStatus, _actorId: string, tenantId = 'tenant-demo') {
    const row = this.repo.transitionProject(id, next);
    if (!row) return null;
    void D32Emit.projectTransitioned(tenantId, id, { status: next });
    this.gateway?.emitToTopic(`project:${id}`, 'projects-browse.project.transitioned', { id, status: next });
    return row;
  }

  // ─── Flags + invites + attachments ────────────────────────────────────
  flagProject(reporterId: string, dto: ProjectFlag, tenantId = 'tenant-demo') {
    const f = this.repo.flagProject(reporterId, dto.projectId, dto.reason, dto.detail);
    void D32Emit.projectFlagged(tenantId, dto.projectId, { reporterId, reason: dto.reason });
    return f;
  }
  inviteToProject(fromIdentityId: string, dto: ProjectInvite, tenantId = 'tenant-demo') {
    const inv = this.repo.inviteToProject(fromIdentityId, dto.projectId, dto.toIdentityId, dto.message);
    void D32Emit.projectInvited(tenantId, dto.projectId, { fromIdentityId, toIdentityId: dto.toIdentityId });
    this.gateway?.emitToUser(dto.toIdentityId, 'projects-browse.project.invited', { projectId: dto.projectId, message: dto.message });
    return inv;
  }
  registerAttachmentUpload(dto: AttachmentUploadComplete, tenantId = 'tenant-demo') {
    const att = this.repo.attachUpload(dto);
    if (!att) return null;
    void D32Emit.attachmentUploaded(tenantId, att.id, { projectId: dto.projectId, name: att.name, size: att.size, mime: att.mime });
    // Av-scan would be triggered here in production; we synthesise the scanned event.
    void D32Emit.attachmentScanned(tenantId, att.id, { projectId: dto.projectId, status: 'clean' });
    return att;
  }
  removeAttachment(projectId: string, attachmentId: string, tenantId = 'tenant-demo') {
    const ok = this.repo.removeAttachment(projectId, attachmentId);
    if (ok) void D32Emit.attachmentRemoved(tenantId, attachmentId, { projectId });
    return { removed: ok };
  }
}
