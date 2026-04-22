/**
 * Domain 29 repository — Interview Planning, Scheduling, Scorecards, Panels.
 *
 * In-memory + seeded persistence aligned with future Drizzle tables:
 *   interview_panels, interview_panel_rounds,
 *   interviews, interview_interviewers,
 *   interview_scorecards, interview_scorecard_ratings,
 *   interview_calibrations, interview_audit.
 *
 * State machines enforced here:
 *   Interview:  draft → scheduled → confirmed → in_progress → completed
 *                                ↘ rescheduled → scheduled
 *                                ↘ cancelled | no_show
 *   Scorecard:  pending → in_progress → submitted → calibrated | withdrawn
 *   Calibration: open → decided
 *   Panel:      draft → published → archived
 */
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  InterviewStatus, ScorecardStatus, PanelStatus,
  InterviewKind, CalibrationDecision,
} from './dto';

export type PanelRoundRow = {
  id: string; name: string; kind: InterviewKind;
  durationMin: number; competencies: string[]; interviewerRoles: string[];
};

export type RubricRow = { competency: string; description: string; weight: number };

export type PanelTemplateRow = {
  id: string; tenantId: string;
  name: string; description: string; jobFamily: string;
  rounds: PanelRoundRow[]; rubric: RubricRow[];
  status: PanelStatus;
  createdAt: string; updatedAt: string; version: number; createdBy: string;
};

export type InterviewerRow = {
  userId: string; name: string; role: string; isLead: boolean;
  responseStatus: 'pending' | 'accepted' | 'declined' | 'tentative';
  respondedAt: string | null;
};

export type InterviewRow = {
  id: string; tenantId: string;
  candidateId: string; candidateName: string;
  jobId: string; jobTitle: string;
  panelTemplateId: string | null;
  kind: InterviewKind; roundName: string;
  startAt: string; durationMin: number; timezone: string;
  location: 'video' | 'onsite' | 'phone';
  meetingUrl: string | null;
  interviewers: InterviewerRow[];
  notes: string; competencies: string[];
  status: InterviewStatus;
  rescheduleCount: number;
  conflictFlags: string[];
  cancelReason: string | null;
  completedAt: string | null;
  createdBy: string;
  createdAt: string; updatedAt: string; version: number;
};

export type ScorecardRatingRow = { competency: string; score: number; note: string };

export type ScorecardRow = {
  id: string; tenantId: string;
  interviewId: string; candidateId: string;
  interviewerId: string; interviewerName: string;
  status: ScorecardStatus;
  ratings: ScorecardRatingRow[];
  averageScore: number | null;
  recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire' | null;
  strengths: string; concerns: string;
  followUps: string[]; privateNotes: string;
  submittedAt: string | null;
  dueAt: string;
  createdAt: string; updatedAt: string; version: number;
};

export type CalibrationVoteRow = { userId: string; vote: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire' };

export type CalibrationRow = {
  id: string; tenantId: string;
  candidateId: string; jobId: string;
  interviewIds: string[];
  facilitatorId: string;
  scheduledAt: string | null;
  status: 'open' | 'decided';
  decision: CalibrationDecision | null;
  rationale: string | null;
  voteSummary: CalibrationVoteRow[];
  nextSteps: string[];
  decidedAt: string | null;
  createdAt: string; updatedAt: string;
};

type AuditRow = {
  id: string; tenantId: string; entity: 'interview' | 'scorecard' | 'panel' | 'calibration';
  entityId: string; actor: string; action: string; diff: any; at: string;
};

const INTERVIEW_ALLOWED: Record<InterviewStatus, InterviewStatus[]> = {
  draft:        ['scheduled', 'cancelled'],
  scheduled:    ['confirmed', 'rescheduled', 'cancelled', 'no_show'],
  confirmed:    ['in_progress', 'rescheduled', 'cancelled', 'no_show'],
  in_progress:  ['completed', 'cancelled'],
  completed:    [],
  rescheduled:  ['scheduled'],
  cancelled:    [],
  no_show:      [],
};

const SCORECARD_ALLOWED: Record<ScorecardStatus, ScorecardStatus[]> = {
  pending:      ['in_progress', 'withdrawn'],
  in_progress:  ['submitted', 'withdrawn'],
  submitted:    ['calibrated', 'withdrawn'],
  calibrated:   [],
  withdrawn:    [],
};

@Injectable()
export class InterviewPlanningRepository {
  private readonly log = new Logger('InterviewPlanningRepo');
  private panels = new Map<string, PanelTemplateRow>();
  private interviews = new Map<string, InterviewRow>();
  private scorecards = new Map<string, ScorecardRow>();
  private calibrations = new Map<string, CalibrationRow>();
  private audit: AuditRow[] = [];
  private idempotency = new Map<string, string>();

  constructor() { this.seed(); }

  private seed() {
    const tenantId = 'tenant-demo';
    const now = new Date();

    // ----- Panel templates -----
    const eng: PanelTemplateRow = {
      id: randomUUID(), tenantId,
      name: 'Senior Engineering Loop', description: 'Standard 4-round loop for senior engineers',
      jobFamily: 'Engineering', status: 'published',
      rounds: [
        { id: randomUUID(), name: 'Recruiter Screen', kind: 'recruiter_screen', durationMin: 30, competencies: ['communication', 'motivation'], interviewerRoles: ['Recruiter'] },
        { id: randomUUID(), name: 'Technical Deep Dive', kind: 'technical', durationMin: 60, competencies: ['coding', 'problem_solving'], interviewerRoles: ['Senior Engineer'] },
        { id: randomUUID(), name: 'System Design', kind: 'system_design', durationMin: 60, competencies: ['architecture', 'tradeoffs'], interviewerRoles: ['Staff Engineer'] },
        { id: randomUUID(), name: 'Hiring Manager', kind: 'behavioural', durationMin: 45, competencies: ['ownership', 'collaboration'], interviewerRoles: ['Hiring Manager'] },
      ],
      rubric: [
        { competency: 'coding', description: 'Quality, correctness, fluency', weight: 0.25 },
        { competency: 'problem_solving', description: 'Decomposition + recovery', weight: 0.20 },
        { competency: 'architecture', description: 'System design tradeoffs', weight: 0.20 },
        { competency: 'communication', description: 'Clarity + structure', weight: 0.15 },
        { competency: 'ownership', description: 'Drives outcomes end-to-end', weight: 0.20 },
      ],
      createdAt: now.toISOString(), updatedAt: now.toISOString(), version: 1, createdBy: 'rec-alex',
    };
    this.panels.set(eng.id, eng);

    const design: PanelTemplateRow = {
      ...eng,
      id: randomUUID(), name: 'Product Design Loop', jobFamily: 'Design',
      rounds: [
        { id: randomUUID(), name: 'Portfolio Review', kind: 'panel', durationMin: 60, competencies: ['craft', 'storytelling'], interviewerRoles: ['Lead Designer'] },
        { id: randomUUID(), name: 'Whiteboard Exercise', kind: 'system_design', durationMin: 60, competencies: ['process', 'craft'], interviewerRoles: ['Senior Designer'] },
        { id: randomUUID(), name: 'Cross-Functional', kind: 'behavioural', durationMin: 45, competencies: ['collaboration'], interviewerRoles: ['PM'] },
      ],
      rubric: [
        { competency: 'craft', description: 'Visual + interaction craft', weight: 0.35 },
        { competency: 'process', description: 'Discovery → delivery rigor', weight: 0.25 },
        { competency: 'collaboration', description: 'Works across PM/Eng', weight: 0.20 },
        { competency: 'storytelling', description: 'Frames decisions clearly', weight: 0.20 },
      ],
    };
    this.panels.set(design.id, design);

    // ----- Interviews + scorecards -----
    const interviewers = [
      { userId: 'eng-priya', name: 'Priya Patel', role: 'Senior Engineer' },
      { userId: 'eng-sam', name: 'Sam Okafor', role: 'Staff Engineer' },
      { userId: 'mgr-jordan', name: 'Jordan Hiring Manager', role: 'Hiring Manager' },
    ];
    const sampleStatuses: InterviewStatus[] = ['scheduled', 'confirmed', 'completed', 'completed', 'cancelled'];
    sampleStatuses.forEach((status, i) => {
      const id = randomUUID();
      const startAt = new Date(now.getTime() + (i - 2) * 86_400_000).toISOString();
      const row: InterviewRow = {
        id, tenantId,
        candidateId: `cand-${i + 1}`, candidateName: ['Ana Torres', 'David Kim', 'Priya Patel', 'James Chen', 'Lina Hassan'][i],
        jobId: `job-${(i % 2) + 1}`, jobTitle: i % 2 === 0 ? 'Senior Frontend Engineer' : 'Engineering Manager',
        panelTemplateId: eng.id, kind: 'technical', roundName: 'Technical Deep Dive',
        startAt, durationMin: 60, timezone: 'Europe/London', location: 'video',
        meetingUrl: 'https://meet.gigvora.dev/loop-' + id.slice(0, 8),
        interviewers: interviewers.slice(0, (i % 3) + 1).map((iv, idx) => ({
          ...iv, isLead: idx === 0,
          responseStatus: status === 'scheduled' ? 'pending' : 'accepted',
          respondedAt: status === 'scheduled' ? null : new Date(now.getTime() - 86_400_000).toISOString(),
        })),
        notes: '', competencies: ['coding', 'problem_solving'],
        status, rescheduleCount: 0, conflictFlags: [],
        cancelReason: status === 'cancelled' ? 'Candidate withdrew' : null,
        completedAt: status === 'completed' ? startAt : null,
        createdBy: 'rec-alex',
        createdAt: now.toISOString(), updatedAt: now.toISOString(), version: 1,
      };
      this.interviews.set(id, row);

      // Auto-create scorecards for each interviewer.
      row.interviewers.forEach((iv) => {
        const scId = randomUUID();
        const isCompleted = status === 'completed';
        const sc: ScorecardRow = {
          id: scId, tenantId,
          interviewId: id, candidateId: row.candidateId,
          interviewerId: iv.userId, interviewerName: iv.name,
          status: isCompleted ? 'submitted' : 'pending',
          ratings: isCompleted ? [
            { competency: 'coding', score: 4, note: 'Solid implementation' },
            { competency: 'problem_solving', score: 4, note: 'Good decomposition' },
          ] : [],
          averageScore: isCompleted ? 4.0 : null,
          recommendation: isCompleted ? 'hire' : null,
          strengths: isCompleted ? 'Clear thinker' : '', concerns: isCompleted ? 'Needs more system design depth' : '',
          followUps: [], privateNotes: '',
          submittedAt: isCompleted ? startAt : null,
          dueAt: new Date(new Date(startAt).getTime() + 24 * 60 * 60_000).toISOString(),
          createdAt: now.toISOString(), updatedAt: now.toISOString(), version: 1,
        };
        this.scorecards.set(scId, sc);
      });
    });

    this.log.log(`seeded ${this.panels.size} panels, ${this.interviews.size} interviews, ${this.scorecards.size} scorecards`);
  }

  // ---------------- Panels ----------------
  listPanels(tenantId: string, f: { status?: PanelStatus[]; jobFamily?: string; q?: string }) {
    return [...this.panels.values()].filter((p) => {
      if (p.tenantId !== tenantId) return false;
      if (f.status?.length && !f.status.includes(p.status)) return false;
      if (f.jobFamily && p.jobFamily !== f.jobFamily) return false;
      if (f.q && !`${p.name} ${p.description}`.toLowerCase().includes(f.q.toLowerCase())) return false;
      return true;
    });
  }
  getPanel(id: string) { return this.panels.get(id); }

  createPanel(tenantId: string, actorId: string, payload: any): PanelTemplateRow {
    const now = new Date().toISOString();
    const row: PanelTemplateRow = {
      id: randomUUID(), tenantId,
      name: payload.name, description: payload.description ?? '', jobFamily: payload.jobFamily,
      rounds: (payload.rounds ?? []).map((r: any) => ({ ...r, id: randomUUID() })),
      rubric: payload.rubric ?? [],
      status: 'draft',
      createdAt: now, updatedAt: now, version: 1, createdBy: actorId,
    };
    this.panels.set(row.id, row);
    this.audit.push({ id: randomUUID(), tenantId, entity: 'panel', entityId: row.id, actor: actorId, action: 'panel.created', diff: null, at: now });
    return row;
  }

  updatePanel(id: string, expectedVersion: number, patch: any, actorId: string) {
    const p = this.getPanel(id); if (!p) throw new Error('not_found');
    if (p.version !== expectedVersion) throw new Error('version_conflict');
    Object.assign(p, patch, { updatedAt: new Date().toISOString(), version: p.version + 1 });
    this.audit.push({ id: randomUUID(), tenantId: p.tenantId, entity: 'panel', entityId: id, actor: actorId, action: 'panel.updated', diff: patch, at: p.updatedAt });
    return p;
  }

  setPanelStatus(id: string, status: PanelStatus, actorId: string) {
    const p = this.getPanel(id); if (!p) throw new Error('not_found');
    p.status = status; p.updatedAt = new Date().toISOString(); p.version += 1;
    this.audit.push({ id: randomUUID(), tenantId: p.tenantId, entity: 'panel', entityId: id, actor: actorId, action: `panel.${status}`, diff: null, at: p.updatedAt });
    return p;
  }

  // ---------------- Interviews ----------------
  listInterviews(tenantId: string, f: any) {
    return [...this.interviews.values()].filter((iv) => {
      if (iv.tenantId !== tenantId) return false;
      if (f.status?.length && !f.status.includes(iv.status)) return false;
      if (f.jobId && iv.jobId !== f.jobId) return false;
      if (f.candidateId && iv.candidateId !== f.candidateId) return false;
      if (f.interviewerId && !iv.interviewers.some((i) => i.userId === f.interviewerId)) return false;
      if (f.kind?.length && !f.kind.includes(iv.kind)) return false;
      if (f.from && iv.startAt < f.from) return false;
      if (f.to && iv.startAt > f.to) return false;
      if (f.q) {
        const blob = `${iv.candidateName} ${iv.jobTitle} ${iv.roundName}`.toLowerCase();
        if (!blob.includes(f.q.toLowerCase())) return false;
      }
      return true;
    });
  }
  getInterview(id: string) { return this.interviews.get(id); }

  createInterview(tenantId: string, actorId: string, payload: any, idempotencyKey?: string): InterviewRow {
    if (idempotencyKey) {
      const existing = this.idempotency.get(`interview:${idempotencyKey}`);
      if (existing) {
        const row = this.interviews.get(existing); if (row) return row;
      }
    }
    const now = new Date().toISOString();
    const conflicts = this.detectConflicts(payload.startAt, payload.durationMin ?? 45, payload.interviewers.map((i: any) => i.userId));
    const row: InterviewRow = {
      id: randomUUID(), tenantId,
      candidateId: payload.candidateId, candidateName: payload.candidateName,
      jobId: payload.jobId, jobTitle: payload.jobTitle,
      panelTemplateId: payload.panelTemplateId ?? null,
      kind: payload.kind, roundName: payload.roundName,
      startAt: payload.startAt, durationMin: payload.durationMin ?? 45,
      timezone: payload.timezone ?? 'Europe/London',
      location: payload.location ?? 'video', meetingUrl: payload.meetingUrl ?? null,
      interviewers: payload.interviewers.map((iv: any) => ({
        ...iv, responseStatus: 'pending' as const, respondedAt: null,
      })),
      notes: payload.notes ?? '', competencies: payload.competencies ?? [],
      status: 'scheduled', rescheduleCount: 0,
      conflictFlags: conflicts,
      cancelReason: null, completedAt: null,
      createdBy: actorId,
      createdAt: now, updatedAt: now, version: 1,
    };
    this.interviews.set(row.id, row);
    if (idempotencyKey) this.idempotency.set(`interview:${idempotencyKey}`, row.id);

    // Auto-create scorecards.
    row.interviewers.forEach((iv) => {
      const scId = randomUUID();
      this.scorecards.set(scId, {
        id: scId, tenantId,
        interviewId: row.id, candidateId: row.candidateId,
        interviewerId: iv.userId, interviewerName: iv.name,
        status: 'pending',
        ratings: [], averageScore: null, recommendation: null,
        strengths: '', concerns: '', followUps: [], privateNotes: '',
        submittedAt: null,
        dueAt: new Date(new Date(row.startAt).getTime() + 24 * 60 * 60_000).toISOString(),
        createdAt: now, updatedAt: now, version: 1,
      });
    });

    this.audit.push({ id: randomUUID(), tenantId, entity: 'interview', entityId: row.id, actor: actorId, action: 'interview.created', diff: null, at: now });
    return row;
  }

  updateInterview(id: string, expectedVersion: number, patch: any, actorId: string) {
    const iv = this.getInterview(id); if (!iv) throw new Error('not_found');
    if (iv.version !== expectedVersion) throw new Error('version_conflict');
    if (iv.status === 'completed' || iv.status === 'cancelled' || iv.status === 'no_show') throw new Error('locked_for_edit');
    Object.assign(iv, patch, { updatedAt: new Date().toISOString(), version: iv.version + 1 });
    this.audit.push({ id: randomUUID(), tenantId: iv.tenantId, entity: 'interview', entityId: id, actor: actorId, action: 'interview.updated', diff: patch, at: iv.updatedAt });
    return iv;
  }

  reschedule(id: string, startAt: string, idempotencyKey: string, actorId: string, reason?: string): InterviewRow {
    const iv = this.getInterview(id); if (!iv) throw new Error('not_found');
    const cached = this.idempotency.get(`reschedule:${idempotencyKey}`);
    if (cached === id) return iv;
    if (!['scheduled', 'confirmed'].includes(iv.status)) throw new Error('cannot_reschedule');
    iv.startAt = startAt; iv.rescheduleCount += 1; iv.status = 'scheduled';
    iv.conflictFlags = this.detectConflicts(startAt, iv.durationMin, iv.interviewers.map((i) => i.userId), id);
    iv.interviewers = iv.interviewers.map((i) => ({ ...i, responseStatus: 'pending', respondedAt: null }));
    iv.updatedAt = new Date().toISOString(); iv.version += 1;
    this.idempotency.set(`reschedule:${idempotencyKey}`, id);
    this.audit.push({ id: randomUUID(), tenantId: iv.tenantId, entity: 'interview', entityId: id, actor: actorId, action: 'interview.rescheduled', diff: { startAt, reason }, at: iv.updatedAt });
    return iv;
  }

  transitionInterview(id: string, next: InterviewStatus, actorId: string, reason?: string) {
    const iv = this.getInterview(id); if (!iv) throw new Error('not_found');
    if (!INTERVIEW_ALLOWED[iv.status].includes(next)) throw new Error(`invalid_transition:${iv.status}->${next}`);
    iv.status = next; iv.updatedAt = new Date().toISOString(); iv.version += 1;
    if (next === 'completed') iv.completedAt = iv.updatedAt;
    if (next === 'cancelled') iv.cancelReason = reason ?? null;
    this.audit.push({ id: randomUUID(), tenantId: iv.tenantId, entity: 'interview', entityId: id, actor: actorId, action: `interview.${next}`, diff: { reason }, at: iv.updatedAt });
    return iv;
  }

  setInterviewerResponse(interviewId: string, userId: string, response: 'accepted' | 'declined' | 'tentative') {
    const iv = this.getInterview(interviewId); if (!iv) throw new Error('not_found');
    const i = iv.interviewers.find((x) => x.userId === userId);
    if (!i) throw new Error('not_interviewer');
    i.responseStatus = response; i.respondedAt = new Date().toISOString();
    if (response === 'accepted' && iv.status === 'scheduled' && iv.interviewers.every((x) => x.responseStatus === 'accepted')) {
      iv.status = 'confirmed';
    }
    iv.updatedAt = new Date().toISOString(); iv.version += 1;
    return iv;
  }

  detectConflicts(startAt: string, durationMin: number, userIds: string[], excludeId?: string): string[] {
    const start = +new Date(startAt); const end = start + durationMin * 60_000;
    const flags: string[] = [];
    for (const iv of this.interviews.values()) {
      if (iv.id === excludeId) continue;
      if (iv.status === 'cancelled' || iv.status === 'no_show') continue;
      const ivStart = +new Date(iv.startAt); const ivEnd = ivStart + iv.durationMin * 60_000;
      if (ivStart < end && ivEnd > start) {
        const overlap = iv.interviewers.find((x) => userIds.includes(x.userId));
        if (overlap) flags.push(`conflict:${overlap.userId}`);
      }
    }
    return Array.from(new Set(flags));
  }

  // ---------------- Scorecards ----------------
  listScorecards(tenantId: string, f: { interviewId?: string; candidateId?: string; interviewerId?: string; status?: ScorecardStatus[] }) {
    return [...this.scorecards.values()].filter((s) => {
      if (s.tenantId !== tenantId) return false;
      if (f.interviewId && s.interviewId !== f.interviewId) return false;
      if (f.candidateId && s.candidateId !== f.candidateId) return false;
      if (f.interviewerId && s.interviewerId !== f.interviewerId) return false;
      if (f.status?.length && !f.status.includes(s.status)) return false;
      return true;
    });
  }
  getScorecard(id: string) { return this.scorecards.get(id); }

  draftScorecard(id: string, expectedVersion: number, patch: any, actorId: string) {
    const s = this.getScorecard(id); if (!s) throw new Error('not_found');
    if (s.interviewerId !== actorId) throw new Error('forbidden');
    if (s.version !== expectedVersion) throw new Error('version_conflict');
    if (s.status === 'submitted' || s.status === 'calibrated' || s.status === 'withdrawn') throw new Error('locked');
    Object.assign(s, patch, { status: 'in_progress' as ScorecardStatus, updatedAt: new Date().toISOString(), version: s.version + 1 });
    this.audit.push({ id: randomUUID(), tenantId: s.tenantId, entity: 'scorecard', entityId: id, actor: actorId, action: 'scorecard.drafted', diff: patch, at: s.updatedAt });
    return s;
  }

  submitScorecard(id: string, payload: any, idempotencyKey: string, actorId: string) {
    const s = this.getScorecard(id); if (!s) throw new Error('not_found');
    if (s.interviewerId !== actorId) throw new Error('forbidden');
    const cached = this.idempotency.get(`scorecard:${idempotencyKey}`);
    if (cached === id) return s;
    if (!SCORECARD_ALLOWED[s.status].includes('submitted')) throw new Error('invalid_state');
    const avg = payload.ratings.reduce((acc: number, r: any) => acc + r.score, 0) / payload.ratings.length;
    Object.assign(s, payload, {
      status: 'submitted' as ScorecardStatus, averageScore: Math.round(avg * 100) / 100,
      submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: s.version + 1,
    });
    this.idempotency.set(`scorecard:${idempotencyKey}`, id);
    this.audit.push({ id: randomUUID(), tenantId: s.tenantId, entity: 'scorecard', entityId: id, actor: actorId, action: 'scorecard.submitted', diff: { recommendation: payload.recommendation, avg }, at: s.updatedAt });
    return s;
  }

  withdrawScorecard(id: string, actorId: string) {
    const s = this.getScorecard(id); if (!s) throw new Error('not_found');
    s.status = 'withdrawn'; s.updatedAt = new Date().toISOString(); s.version += 1;
    this.audit.push({ id: randomUUID(), tenantId: s.tenantId, entity: 'scorecard', entityId: id, actor: actorId, action: 'scorecard.withdrawn', diff: null, at: s.updatedAt });
    return s;
  }

  // ---------------- Calibrations ----------------
  listCalibrations(tenantId: string, f: { candidateId?: string; jobId?: string; status?: 'open' | 'decided' }) {
    return [...this.calibrations.values()].filter((c) => {
      if (c.tenantId !== tenantId) return false;
      if (f.candidateId && c.candidateId !== f.candidateId) return false;
      if (f.jobId && c.jobId !== f.jobId) return false;
      if (f.status && c.status !== f.status) return false;
      return true;
    });
  }
  getCalibration(id: string) { return this.calibrations.get(id); }

  openCalibration(tenantId: string, actorId: string, payload: any): CalibrationRow {
    const now = new Date().toISOString();
    const row: CalibrationRow = {
      id: randomUUID(), tenantId,
      candidateId: payload.candidateId, jobId: payload.jobId,
      interviewIds: payload.interviewIds, facilitatorId: payload.facilitatorId,
      scheduledAt: payload.scheduledAt ?? null,
      status: 'open', decision: null, rationale: null, voteSummary: [], nextSteps: [],
      decidedAt: null,
      createdAt: now, updatedAt: now,
    };
    this.calibrations.set(row.id, row);
    this.audit.push({ id: randomUUID(), tenantId, entity: 'calibration', entityId: row.id, actor: actorId, action: 'calibration.opened', diff: null, at: now });
    return row;
  }

  decideCalibration(id: string, payload: any, actorId: string): CalibrationRow {
    const c = this.getCalibration(id); if (!c) throw new Error('not_found');
    if (c.status !== 'open') throw new Error('already_decided');
    Object.assign(c, payload, {
      status: 'decided' as const, decidedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    // Mark related scorecards calibrated.
    [...this.scorecards.values()]
      .filter((s) => c.interviewIds.includes(s.interviewId) && s.status === 'submitted')
      .forEach((s) => { s.status = 'calibrated'; s.updatedAt = c.updatedAt; s.version += 1; });
    this.audit.push({ id: randomUUID(), tenantId: c.tenantId, entity: 'calibration', entityId: id, actor: actorId, action: `calibration.${payload.decision}`, diff: { rationale: payload.rationale }, at: c.updatedAt });
    return c;
  }

  // ---------------- Audit ----------------
  auditFor(entity: 'interview' | 'scorecard' | 'panel' | 'calibration', entityId: string) {
    return this.audit.filter((a) => a.entity === entity && a.entityId === entityId).slice(-50).reverse();
  }
}
