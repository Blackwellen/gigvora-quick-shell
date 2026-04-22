/**
 * D31 application service — open-to-work, availability windows, talent
 * matching signals, recruiter invitations.
 *
 * Surfaces:
 *   - Profile upsert + transitions (draft/active/paused/archived)
 *   - Availability windows (create + cancel) with overlap-aware scheduling
 *   - Match signal generation (ML or fallback) + signal lifecycle actions
 *   - Recruiter invitations + decision flow + expiry sweep
 *   - Recruiter-side talent search consuming the signal index
 *   - Dashboard analytics with deterministic fallback
 *
 * Every meaningful write publishes a webhook + bus event via D31Emit and
 * emits Socket.IO realtime events through the optional notifications gateway.
 */
import { ForbiddenException, Inject, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { CandidateAvailabilityMatchingRepository } from './candidate-availability-matching.repository';
import { CandidateAvailabilityMatchingMlService, type JobInput } from './candidate-availability-matching.ml.service';
import { CandidateAvailabilityMatchingAnalyticsService } from './candidate-availability-matching.analytics.service';
import { D31Emit } from './candidate-availability-matching.emit';

const VIS_RANK = { private: 0, recruiters: 1, network: 2, public: 3 } as const;

@Injectable()
export class CandidateAvailabilityMatchingService {
  private readonly log = new Logger('CamSvc');
  constructor(
    private readonly repo: CandidateAvailabilityMatchingRepository,
    private readonly ml: CandidateAvailabilityMatchingMlService,
    private readonly analytics: CandidateAvailabilityMatchingAnalyticsService,
    @Optional() @Inject('NOTIFICATIONS_GATEWAY') private readonly gateway?: {
      emitToTopic: (t: string, e: string, p: any) => void;
      emitToUser: (u: string, e: string, p: any) => void;
      emitToEntity: (k: string, id: string, e: string, p: any) => void;
    },
  ) {}

  /* ── Profile ── */
  list(tenantId: string, f: any) { return this.repo.listProfiles(tenantId, f); }
  detail(id: string) {
    const p = this.repo.getProfile(id);
    if (!p) throw new NotFoundException('profile_not_found');
    return { profile: p, windows: this.repo.listWindows(id) };
  }
  myProfile(tenantId: string, userId: string) {
    return this.repo.getProfileForUser(tenantId, userId);
  }
  upsert(tenantId: string, userId: string, dto: any, actor: string) {
    const p = this.repo.upsertProfile(tenantId, userId, dto);
    this.repo.recordAudit({ tenantId, profileId: p.id, actor, action: 'profile.upsert', entity: 'profile', entityId: p.id, diff: { fields: Object.keys(dto) } });
    this.gateway?.emitToEntity('cam-profile', p.id, 'profile.upserted', p);
    void D31Emit.profileUpserted(tenantId, p.id, { userId, headline: p.headline });
    return p;
  }
  transition(id: string, next: string, actor: string, reason?: string) {
    const p = this.repo.getProfile(id);
    if (!p) throw new NotFoundException('profile_not_found');
    if (p.userId !== actor) throw new ForbiddenException('only_owner_can_transition');
    const updated = this.repo.transitionProfile(id, next as any);
    this.repo.recordAudit({ tenantId: p.tenantId, profileId: id, actor, action: `profile.${next}`, entity: 'profile', entityId: id, diff: { reason } });
    this.gateway?.emitToEntity('cam-profile', id, 'profile.transitioned', { from: p.status, to: next, reason });
    void D31Emit.profileTransitioned(p.tenantId, id, { from: p.status, to: next, reason: reason ?? null });
    return updated;
  }

  /* ── Windows ── */
  windows(profileId: string) { return { items: this.repo.listWindows(profileId) }; }
  createWindow(profileId: string, dto: any, actor: string) {
    const p = this.repo.getProfile(profileId);
    if (!p) throw new NotFoundException('profile_not_found');
    if (p.userId !== actor) throw new ForbiddenException('only_owner_can_create_window');
    const w = this.repo.createWindow(profileId, dto);
    this.repo.recordAudit({ tenantId: p.tenantId, profileId, actor, action: 'window.create', entity: 'window', entityId: w.id, diff: dto });
    this.gateway?.emitToEntity('cam-profile', profileId, 'window.created', w);
    void D31Emit.windowCreated(p.tenantId, w.id, { profileId, startsAt: w.startsAt, endsAt: w.endsAt });
    return w;
  }
  cancelWindow(profileId: string, windowId: string, actor: string, reason?: string) {
    const p = this.repo.getProfile(profileId);
    if (!p) throw new NotFoundException('profile_not_found');
    if (p.userId !== actor) throw new ForbiddenException('only_owner_can_cancel_window');
    const w = this.repo.cancelWindow(windowId, reason);
    if (!w) throw new NotFoundException('window_not_found');
    this.repo.recordAudit({ tenantId: p.tenantId, profileId, actor, action: 'window.cancel', entity: 'window', entityId: windowId, diff: { reason } });
    this.gateway?.emitToEntity('cam-profile', profileId, 'window.cancelled', w);
    void D31Emit.windowCancelled(p.tenantId, windowId, { profileId, reason: reason ?? null });
    return w;
  }

  /* ── Signals ── */
  listSignals(tenantId: string, f: any) { return this.repo.listSignals(tenantId, f); }
  async generateSignal(tenantId: string, profileId: string, job: JobInput) {
    const p = this.repo.getProfile(profileId);
    if (!p) throw new NotFoundException('profile_not_found');
    if (p.status !== 'active') return null;
    const score = await this.ml.scoreProfileForJob(p, job);
    const sig = this.repo.upsertSignal(tenantId, profileId, job.id, score.score, score.reasons);
    this.repo.setMatchScore(profileId, score.score, score.reasons);
    this.gateway?.emitToUser(p.userId, 'cam.signal.generated', { signalId: sig.id, jobId: job.id, score: sig.score });
    void D31Emit.signalGenerated(tenantId, sig.id, { profileId, jobId: job.id, score: sig.score, source: score.source });
    return sig;
  }
  actOnSignal(signalId: string, actor: string, dto: any) {
    const s = this.repo.getSignal(signalId);
    if (!s) throw new NotFoundException('signal_not_found');
    const p = this.repo.getProfile(s.profileId);
    if (!p) throw new NotFoundException('profile_not_found');
    const next = { ...s };
    if (dto.action === 'view') next.status = 'viewed';
    else if (dto.action === 'save') next.status = 'saved';
    else if (dto.action === 'dismiss') next.status = 'dismissed';
    else if (dto.action === 'convert') next.status = 'converted';
    next.note = dto.note ?? next.note;
    next.recruiterId = actor;
    const saved = this.repo.saveSignal(next);
    this.repo.recordAudit({ tenantId: s.tenantId, profileId: p.id, actor, action: `signal.${dto.action}`, entity: 'signal', entityId: signalId, diff: { note: dto.note } });
    this.gateway?.emitToEntity('cam-signal', signalId, 'signal.actioned', saved);
    void D31Emit.signalActioned(s.tenantId, signalId, { profileId: p.id, jobId: s.jobId, action: dto.action });
    return saved;
  }

  /* ── Invitations ── */
  listInvitations(tenantId: string, f: any) { return this.repo.listInvitations(tenantId, f); }
  createInvitation(tenantId: string, dto: any, actor: string) {
    const p = this.repo.getProfile(dto.profileId);
    if (!p) throw new NotFoundException('profile_not_found');
    if (p.status !== 'active') throw new ForbiddenException('profile_not_active');
    if (VIS_RANK[p.visibility] < VIS_RANK.recruiters) throw new ForbiddenException('profile_not_visible_to_recruiters');
    const inv = this.repo.createInvitation(tenantId, { ...dto, recruiterId: actor });
    this.repo.recordAudit({ tenantId, profileId: dto.profileId, actor, action: 'invitation.create', entity: 'invitation', entityId: inv.id, diff: { jobId: dto.jobId } });
    this.gateway?.emitToUser(p.userId, 'cam.invitation.received', { invitationId: inv.id, jobId: inv.jobId });
    void D31Emit.invitationCreated(tenantId, inv.id, { profileId: inv.profileId, jobId: inv.jobId, recruiterId: actor });
    return inv;
  }
  decideInvitation(id: string, actor: string, dto: any) {
    const inv = this.repo.getInvitation(id);
    if (!inv) throw new NotFoundException('invitation_not_found');
    const p = this.repo.getProfile(inv.profileId);
    if (!p || p.userId !== actor) throw new ForbiddenException('only_candidate_can_decide');
    if (inv.status !== 'pending') throw new ForbiddenException(`invitation_${inv.status}`);
    const next = this.repo.decideInvitation(id, dto.decision === 'accept' ? 'accepted' : 'declined', dto.note);
    this.repo.recordAudit({ tenantId: inv.tenantId, profileId: inv.profileId, actor, action: `invitation.${dto.decision}`, entity: 'invitation', entityId: id, diff: { note: dto.note } });
    this.gateway?.emitToUser(inv.recruiterId, 'cam.invitation.decided', next);
    void D31Emit.invitationDecided(inv.tenantId, id, { profileId: inv.profileId, jobId: inv.jobId, decision: dto.decision });
    return next;
  }
  expireInvitations() {
    const expired = this.repo.expireInvitations();
    if (expired) this.log.log(`expired ${expired} invitations`);
    return { expired };
  }

  /* ── Talent search (recruiter view) ── */
  talentSearch(tenantId: string, f: any) {
    const minVis = VIS_RANK[f.visibilityMin as keyof typeof VIS_RANK];
    const all = this.repo.listProfiles(tenantId, { page: 1, pageSize: 200, sort: 'matchScore' }).items
      .filter((p) => p.status === 'active' && VIS_RANK[p.visibility] >= minVis);
    let items = all;
    if (f.q) {
      const q = String(f.q).toLowerCase();
      items = items.filter((p) => p.headline.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q) || p.preferredSkills.some((s) => s.toLowerCase().includes(q)));
    }
    if (f.skills?.length) items = items.filter((p) => f.skills.some((s: string) => p.preferredSkills.map((x) => x.toLowerCase()).includes(s.toLowerCase())));
    if (f.workType?.length) items = items.filter((p) => p.workTypes.some((w) => f.workType.includes(w)));
    if (f.remote?.length) items = items.filter((p) => f.remote.includes(p.remote));
    if (f.locations?.length) items = items.filter((p) => p.locations.some((l) => f.locations.some((x: string) => l.toLowerCase().includes(x.toLowerCase()))));
    if (f.maxNoticeDays != null) items = items.filter((p) => p.noticePeriodDays <= f.maxNoticeDays);
    if (f.salaryGbpMax != null) items = items.filter((p) => p.desiredSalaryGbpMin == null || p.desiredSalaryGbpMin <= f.salaryGbpMax);
    const total = items.length;
    const start = (f.page - 1) * f.pageSize;
    return { items: items.slice(start, start + f.pageSize), total, page: f.page, pageSize: f.pageSize };
  }

  /* ── Dashboard + audit ── */
  async dashboard(tenantId: string) {
    const profiles = this.repo.listProfiles(tenantId, { page: 1, pageSize: 200, sort: 'updated' }).items;
    const signals = this.repo.listSignals(tenantId, { page: 1, pageSize: 500 }).items;
    const invitations = this.repo.listInvitations(tenantId, { page: 1, pageSize: 500 }).items;
    const windows = profiles.flatMap((p) => this.repo.listWindows(p.id));
    const insights = await this.analytics.insights({ profiles, signals, invitations, windows });
    return { generatedAt: new Date().toISOString(), insights };
  }
  audit(profileId: string, limit = 100) { return { items: this.repo.listAudit(profileId, limit) }; }
}
