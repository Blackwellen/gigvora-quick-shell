/**
 * Domain 29 application service — Interview Planning.
 *
 * Surfaces:
 *   - panel template CRUD + publish/archive
 *   - interview CRUD with conflict detection + idempotent reschedule
 *   - state-machine transitions
 *   - interviewer RSVP
 *   - scorecard draft (autosave) + idempotent submit
 *   - calibration open + decide (cascades scorecards → calibrated)
 *   - workbench dashboard (analytics) + ML scorecard summary
 *
 * Realtime events through NotificationsGateway:
 *   interview.created, interview.updated, interview.transitioned, interview.rescheduled,
 *   interviewer.responded, scorecard.drafted, scorecard.submitted, scorecard.withdrawn,
 *   calibration.opened, calibration.decided, panel.created, panel.updated, panel.status
 */
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import {
  InterviewPlanningRepository,
  type InterviewRow, type ScorecardRow, type PanelTemplateRow, type CalibrationRow,
} from './interview-planning.repository';
import { InterviewPlanningMlService } from './interview-planning.ml.service';
import { InterviewPlanningAnalyticsService } from './interview-planning.analytics.service';
import { D29Emit } from '../domain-bus/domain-emissions';
import type { InterviewStatus, PanelStatus, ScorecardStatus } from './dto';

@Injectable()
export class InterviewPlanningService {
  private readonly log = new Logger('InterviewPlanning');
  constructor(
    private readonly repo: InterviewPlanningRepository,
    private readonly ml: InterviewPlanningMlService,
    private readonly analytics: InterviewPlanningAnalyticsService,
    @Optional() @Inject('NOTIFICATIONS_GATEWAY') private readonly gateway?: {
      emitToTopic: (t: string, e: string, p: any) => void;
      emitToUser: (u: string, e: string, p: any) => void;
    },
  ) {}

  // -------- Panels --------
  listPanels(tenantId: string, f: any) {
    const rows = this.repo.listPanels(tenantId, f);
    const start = (f.page - 1) * f.pageSize;
    return { items: rows.slice(start, start + f.pageSize).map(this.publicPanel), total: rows.length, page: f.page, pageSize: f.pageSize };
  }
  panelDetail(id: string) {
    const p = this.repo.getPanel(id); if (!p) return null;
    return { ...this.publicPanel(p), audit: this.repo.auditFor('panel', id) };
  }
  createPanel(tenantId: string, actorId: string, payload: any) {
    const p = this.repo.createPanel(tenantId, actorId, payload);
    this.gateway?.emitToTopic(`tenant:${tenantId}:interviews`, 'panel.created', { id: p.id });
    D29Emit.panelCreated(tenantId, p.id, { panelId: p.id, actorId, status: p.status, name: p.name });
    return this.publicPanel(p);
  }
  updatePanel(id: string, version: number, patch: any, actorId: string) {
    const p = this.repo.updatePanel(id, version, patch, actorId);
    this.gateway?.emitToTopic(`tenant:${p.tenantId}:interviews`, 'panel.updated', { id });
    D29Emit.panelUpdated(p.tenantId, id, { panelId: id, actorId, version: p.version, patch });
    return this.publicPanel(p);
  }
  setPanelStatus(id: string, status: PanelStatus, actorId: string) {
    const p = this.repo.setPanelStatus(id, status, actorId);
    this.gateway?.emitToTopic(`tenant:${p.tenantId}:interviews`, 'panel.status', { id, status });
    D29Emit.panelStatus(p.tenantId, id, { panelId: id, actorId, status });
    return this.publicPanel(p);
  }

  // -------- Interviews --------
  listInterviews(tenantId: string, f: any) {
    const rows = this.repo.listInterviews(tenantId, f);
    const sorted = [...rows].sort((a, b) => {
      switch (f.sort) {
        case 'created': return +new Date(b.createdAt) - +new Date(a.createdAt);
        case 'updated': return +new Date(b.updatedAt) - +new Date(a.updatedAt);
        default: return +new Date(a.startAt) - +new Date(b.startAt);
      }
    });
    const start = (f.page - 1) * f.pageSize;
    return { items: sorted.slice(start, start + f.pageSize).map(this.publicInterview), total: sorted.length, page: f.page, pageSize: f.pageSize };
  }

  async interviewDetail(id: string) {
    const iv = this.repo.getInterview(id); if (!iv) return null;
    const scorecards = this.repo.listScorecards(iv.tenantId, { interviewId: id });
    const summary = await this.ml.summariseInterview(iv, scorecards);
    return {
      ...this.publicInterview(iv),
      scorecards: scorecards.map(this.publicScorecard),
      summary,
      audit: this.repo.auditFor('interview', id),
    };
  }

  async createInterview(tenantId: string, actorId: string, payload: any, idempotencyKey?: string) {
    const iv = this.repo.createInterview(tenantId, actorId, payload, idempotencyKey);
    const slot = await this.ml.scoreSlot({
      startAt: iv.startAt, conflictFlags: iv.conflictFlags, interviewerCount: iv.interviewers.length,
    });
    this.gateway?.emitToTopic(`tenant:${tenantId}:interviews`, 'interview.created', { id: iv.id, slotScore: slot.score });
    iv.interviewers.forEach((i) => {
      this.gateway?.emitToUser(i.userId, 'interview.invited', { interviewId: iv.id, candidateName: iv.candidateName, startAt: iv.startAt });
    });
    D29Emit.ivCreated(tenantId, iv.id, {
      interviewId: iv.id,
      actorId,
      candidateId: iv.candidateId,
      jobId: iv.jobId,
      startAt: iv.startAt,
      slotScore: slot.score,
      status: iv.status,
    });
    return { ...this.publicInterview(iv), slotScore: slot.score };
  }

  updateInterview(id: string, version: number, patch: any, actorId: string) {
    const iv = this.repo.updateInterview(id, version, patch, actorId);
    this.gateway?.emitToTopic(`tenant:${iv.tenantId}:interviews`, 'interview.updated', { id, version: iv.version });
    return this.publicInterview(iv);
  }

  reschedule(id: string, startAt: string, idempotencyKey: string, actorId: string, reason?: string) {
    const iv = this.repo.reschedule(id, startAt, idempotencyKey, actorId, reason);
    this.gateway?.emitToTopic(`tenant:${iv.tenantId}:interviews`, 'interview.rescheduled', { id, startAt });
    iv.interviewers.forEach((i) =>
      this.gateway?.emitToUser(i.userId, 'interview.rescheduled', { interviewId: id, startAt, reason }),
    );
    D29Emit.ivRescheduled(iv.tenantId, id, { interviewId: id, actorId, startAt, reason, candidateId: iv.candidateId, jobId: iv.jobId });
    return this.publicInterview(iv);
  }

  transitionInterview(id: string, next: InterviewStatus, actorId: string, reason?: string) {
    const iv = this.repo.transitionInterview(id, next, actorId, reason);
    this.gateway?.emitToTopic(`tenant:${iv.tenantId}:interviews`, 'interview.transitioned', { id, status: next });
    D29Emit.ivTransitioned(iv.tenantId, id, { interviewId: id, actorId, next, reason, candidateId: iv.candidateId, jobId: iv.jobId });
    return this.publicInterview(iv);
  }

  rsvp(interviewId: string, userId: string, response: 'accepted' | 'declined' | 'tentative') {
    const iv = this.repo.setInterviewerResponse(interviewId, userId, response);
    this.gateway?.emitToTopic(`tenant:${iv.tenantId}:interviews`, 'interviewer.responded', { interviewId, userId, response });
    D29Emit.ivResponded(iv.tenantId, interviewId, { interviewId, userId, response, candidateId: iv.candidateId, jobId: iv.jobId });
    return this.publicInterview(iv);
  }

  // -------- Scorecards --------
  listScorecards(tenantId: string, f: any) {
    return { items: this.repo.listScorecards(tenantId, f).map(this.publicScorecard) };
  }
  scorecardDetail(id: string) {
    const s = this.repo.getScorecard(id); if (!s) return null;
    return { ...this.publicScorecard(s), audit: this.repo.auditFor('scorecard', id) };
  }
  draftScorecard(id: string, version: number, patch: any, actorId: string) {
    const s = this.repo.draftScorecard(id, version, patch, actorId);
    this.gateway?.emitToTopic(`tenant:${s.tenantId}:interviews`, 'scorecard.drafted', { id, interviewId: s.interviewId });
    D29Emit.scDrafted(s.tenantId, id, { scorecardId: id, interviewId: s.interviewId, actorId, version: s.version });
    return this.publicScorecard(s);
  }
  submitScorecard(id: string, payload: any, idempotencyKey: string, actorId: string) {
    const s = this.repo.submitScorecard(id, payload, idempotencyKey, actorId);
    this.gateway?.emitToTopic(`tenant:${s.tenantId}:interviews`, 'scorecard.submitted', { id, interviewId: s.interviewId, recommendation: s.recommendation });
    D29Emit.scSubmitted(s.tenantId, id, {
      scorecardId: id,
      interviewId: s.interviewId,
      actorId,
      recommendation: s.recommendation,
      candidateId: s.candidateId,
      interviewerId: s.interviewerId,
    });
    return this.publicScorecard(s);
  }
  withdrawScorecard(id: string, actorId: string) {
    const s = this.repo.withdrawScorecard(id, actorId);
    this.gateway?.emitToTopic(`tenant:${s.tenantId}:interviews`, 'scorecard.withdrawn', { id });
    D29Emit.scWithdrawn(s.tenantId, id, { scorecardId: id, interviewId: s.interviewId, actorId, candidateId: s.candidateId });
    return this.publicScorecard(s);
  }

  // -------- Calibrations --------
  listCalibrations(tenantId: string, f: any) {
    return { items: this.repo.listCalibrations(tenantId, f).map(this.publicCalibration) };
  }
  calibrationDetail(id: string) {
    const c = this.repo.getCalibration(id); if (!c) return null;
    return { ...this.publicCalibration(c), audit: this.repo.auditFor('calibration', id) };
  }
  openCalibration(tenantId: string, actorId: string, payload: any) {
    const c = this.repo.openCalibration(tenantId, actorId, payload);
    this.gateway?.emitToTopic(`tenant:${tenantId}:interviews`, 'calibration.opened', { id: c.id, candidateId: c.candidateId });
    this.gateway?.emitToUser(c.facilitatorId, 'calibration.opened', { id: c.id, candidateId: c.candidateId });
    D29Emit.calOpened(tenantId, c.id, { calibrationId: c.id, actorId, candidateId: c.candidateId, jobId: c.jobId, interviewIds: c.interviewIds });
    return this.publicCalibration(c);
  }
  decideCalibration(id: string, payload: any, actorId: string) {
    const c = this.repo.decideCalibration(id, payload, actorId);
    this.gateway?.emitToTopic(`tenant:${c.tenantId}:interviews`, 'calibration.decided', { id, decision: c.decision });
    D29Emit.calDecided(c.tenantId, id, { calibrationId: id, actorId, candidateId: c.candidateId, decision: c.decision, nextSteps: c.nextSteps });
    return this.publicCalibration(c);
  }

  // -------- Dashboard --------
  dashboard(tenantId: string) { return this.analytics.dashboard(tenantId); }

  // -------- mappers --------
  private publicPanel = (p: PanelTemplateRow) => ({
    id: p.id, tenantId: p.tenantId,
    name: p.name, description: p.description, jobFamily: p.jobFamily,
    rounds: p.rounds, rubric: p.rubric, status: p.status,
    createdAt: p.createdAt, updatedAt: p.updatedAt, version: p.version, createdBy: p.createdBy,
  });

  private publicInterview = (iv: InterviewRow) => ({
    id: iv.id, tenantId: iv.tenantId,
    candidateId: iv.candidateId, candidateName: iv.candidateName,
    jobId: iv.jobId, jobTitle: iv.jobTitle,
    panelTemplateId: iv.panelTemplateId,
    kind: iv.kind, roundName: iv.roundName,
    startAt: iv.startAt, durationMin: iv.durationMin, timezone: iv.timezone,
    location: iv.location, meetingUrl: iv.meetingUrl,
    interviewers: iv.interviewers,
    notes: iv.notes, competencies: iv.competencies,
    status: iv.status, rescheduleCount: iv.rescheduleCount, conflictFlags: iv.conflictFlags,
    cancelReason: iv.cancelReason, completedAt: iv.completedAt,
    createdBy: iv.createdBy, createdAt: iv.createdAt, updatedAt: iv.updatedAt, version: iv.version,
  });

  private publicScorecard = (s: ScorecardRow) => ({
    id: s.id, tenantId: s.tenantId,
    interviewId: s.interviewId, candidateId: s.candidateId,
    interviewerId: s.interviewerId, interviewerName: s.interviewerName,
    status: s.status, ratings: s.ratings, averageScore: s.averageScore,
    recommendation: s.recommendation, strengths: s.strengths, concerns: s.concerns,
    followUps: s.followUps, privateNotes: s.privateNotes,
    submittedAt: s.submittedAt, dueAt: s.dueAt,
    createdAt: s.createdAt, updatedAt: s.updatedAt, version: s.version,
  });

  private publicCalibration = (c: CalibrationRow) => ({
    id: c.id, tenantId: c.tenantId,
    candidateId: c.candidateId, jobId: c.jobId,
    interviewIds: c.interviewIds, facilitatorId: c.facilitatorId,
    scheduledAt: c.scheduledAt, status: c.status, decision: c.decision,
    rationale: c.rationale, voteSummary: c.voteSummary, nextSteps: c.nextSteps,
    decidedAt: c.decidedAt, createdAt: c.createdAt, updatedAt: c.updatedAt,
  });
}
