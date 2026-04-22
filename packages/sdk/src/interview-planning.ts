/**
 * Typed SDK for Domain 29 — Interview Planning, Scheduling, Scorecards & Panels.
 */
export type InterviewStatus =
  | 'draft' | 'scheduled' | 'confirmed' | 'in_progress'
  | 'completed' | 'rescheduled' | 'cancelled' | 'no_show';
export type ScorecardStatus = 'pending' | 'in_progress' | 'submitted' | 'calibrated' | 'withdrawn';
export type PanelStatus = 'draft' | 'published' | 'archived';
export type InterviewKind =
  | 'phone_screen' | 'recruiter_screen' | 'technical' | 'system_design'
  | 'behavioural' | 'culture' | 'panel' | 'final_round';
export type Recommendation = 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';
export type CalibrationDecision = 'hire' | 'no_hire' | 'hold' | 'escalate';

export interface PanelRound {
  id: string; name: string; kind: InterviewKind;
  durationMin: number; competencies: string[]; interviewerRoles: string[];
}
export interface RubricItem { competency: string; description: string; weight: number }

export interface PanelTemplate {
  id: string; tenantId: string;
  name: string; description: string; jobFamily: string;
  rounds: PanelRound[]; rubric: RubricItem[]; status: PanelStatus;
  createdAt: string; updatedAt: string; version: number; createdBy: string;
}

export interface Interviewer {
  userId: string; name: string; role: string; isLead: boolean;
  responseStatus: 'pending' | 'accepted' | 'declined' | 'tentative';
  respondedAt: string | null;
}

export interface Interview {
  id: string; tenantId: string;
  candidateId: string; candidateName: string;
  jobId: string; jobTitle: string;
  panelTemplateId: string | null;
  kind: InterviewKind; roundName: string;
  startAt: string; durationMin: number; timezone: string;
  location: 'video' | 'onsite' | 'phone'; meetingUrl: string | null;
  interviewers: Interviewer[];
  notes: string; competencies: string[];
  status: InterviewStatus; rescheduleCount: number; conflictFlags: string[];
  cancelReason: string | null; completedAt: string | null;
  createdBy: string; createdAt: string; updatedAt: string; version: number;
}

export interface Scorecard {
  id: string; tenantId: string;
  interviewId: string; candidateId: string;
  interviewerId: string; interviewerName: string;
  status: ScorecardStatus;
  ratings: Array<{ competency: string; score: number; note: string }>;
  averageScore: number | null;
  recommendation: Recommendation | null;
  strengths: string; concerns: string;
  followUps: string[]; privateNotes: string;
  submittedAt: string | null; dueAt: string;
  createdAt: string; updatedAt: string; version: number;
}

export interface Calibration {
  id: string; tenantId: string;
  candidateId: string; jobId: string;
  interviewIds: string[]; facilitatorId: string;
  scheduledAt: string | null;
  status: 'open' | 'decided';
  decision: CalibrationDecision | null;
  rationale: string | null;
  voteSummary: Array<{ userId: string; vote: Recommendation }>;
  nextSteps: string[];
  decidedAt: string | null;
  createdAt: string; updatedAt: string;
}

export interface InterviewListFilters {
  status?: InterviewStatus[]; jobId?: string; candidateId?: string;
  interviewerId?: string; kind?: InterviewKind[]; q?: string;
  from?: string; to?: string;
  page?: number; pageSize?: number;
  sort?: 'startAt' | 'updated' | 'created';
}

export interface PanelListFilters {
  status?: PanelStatus[]; jobFamily?: string; q?: string;
  page?: number; pageSize?: number;
}

export interface InterviewPlanningClient {
  // Panels
  listPanels(f: PanelListFilters): Promise<{ items: PanelTemplate[]; total: number; page: number; pageSize: number }>;
  panelDetail(id: string): Promise<PanelTemplate & { audit: any[] }>;
  createPanel(p: Partial<PanelTemplate> & { name: string; jobFamily: string; rounds: any[] }): Promise<PanelTemplate>;
  updatePanel(id: string, expectedVersion: number, patch: Partial<PanelTemplate>): Promise<PanelTemplate>;
  setPanelStatus(id: string, status: PanelStatus): Promise<PanelTemplate>;

  // Interviews
  listInterviews(f: InterviewListFilters): Promise<{ items: Interview[]; total: number; page: number; pageSize: number }>;
  interviewDetail(id: string): Promise<Interview & { scorecards: Scorecard[]; summary: any; audit: any[] }>;
  createInterview(p: any, idempotencyKey?: string): Promise<Interview & { slotScore: number }>;
  updateInterview(id: string, expectedVersion: number, patch: any): Promise<Interview>;
  transitionInterview(id: string, next: InterviewStatus, reason?: string): Promise<Interview>;
  reschedule(id: string, body: { startAt: string; idempotencyKey: string; reason?: string; notifyAttendees?: boolean }): Promise<Interview>;
  rsvp(id: string, response: 'accepted' | 'declined' | 'tentative'): Promise<Interview>;

  // Scorecards
  listScorecards(f: { interviewId?: string; candidateId?: string; interviewerId?: string; status?: ScorecardStatus[] }): Promise<{ items: Scorecard[] }>;
  scorecardDetail(id: string): Promise<Scorecard & { audit: any[] }>;
  draftScorecard(id: string, body: any & { expectedVersion: number }): Promise<Scorecard>;
  submitScorecard(id: string, body: any & { idempotencyKey: string }): Promise<Scorecard>;
  withdrawScorecard(id: string): Promise<Scorecard>;

  // Calibrations
  listCalibrations(f: { candidateId?: string; jobId?: string; status?: 'open' | 'decided' }): Promise<{ items: Calibration[] }>;
  calibrationDetail(id: string): Promise<Calibration & { audit: any[] }>;
  openCalibration(p: { candidateId: string; jobId: string; interviewIds: string[]; facilitatorId: string; scheduledAt?: string }): Promise<Calibration>;
  decideCalibration(id: string, body: { decision: CalibrationDecision; rationale: string; voteSummary?: any[]; nextSteps?: string[] }): Promise<Calibration>;

  // Dashboard
  dashboard(): Promise<any>;
}

export const createInterviewPlanningClient = (
  fetcher: typeof fetch, base = '/api/v1/interview-planning',
): InterviewPlanningClient => {
  const j = async (p: string, init?: RequestInit) => {
    const r = await fetcher(`${base}${p}`, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } });
    if (!r.ok) throw new Error(`interview-planning ${p} ${r.status}`);
    return r.json();
  };
  const qs = (f: Record<string, unknown>) => {
    const u = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v !== undefined && (Array.isArray(v) ? v.forEach((x) => u.append(k, String(x))) : u.set(k, String(v))));
    return u.toString();
  };
  return {
    listPanels: (f) => j(`/panels?${qs(f as any)}`),
    panelDetail: (id) => j(`/panels/${id}`),
    createPanel: (p) => j('/panels', { method: 'POST', body: JSON.stringify(p) }),
    updatePanel: (id, v, patch) => j(`/panels/${id}`, { method: 'PUT', body: JSON.stringify({ expectedVersion: v, patch }) }),
    setPanelStatus: (id, status) => j(`/panels/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),

    listInterviews: (f) => j(`/interviews?${qs(f as any)}`),
    interviewDetail: (id) => j(`/interviews/${id}`),
    createInterview: (p, idempotencyKey) => j('/interviews', {
      method: 'POST', body: JSON.stringify(p),
      headers: idempotencyKey ? { 'idempotency-key': idempotencyKey } : undefined,
    }),
    updateInterview: (id, v, patch) => j(`/interviews/${id}`, { method: 'PUT', body: JSON.stringify({ expectedVersion: v, patch }) }),
    transitionInterview: (id, next, reason) => j(`/interviews/${id}/transition`, { method: 'POST', body: JSON.stringify({ next, reason }) }),
    reschedule: (id, body) => j(`/interviews/${id}/reschedule`, { method: 'POST', body: JSON.stringify(body) }),
    rsvp: (id, response) => j(`/interviews/${id}/rsvp`, { method: 'POST', body: JSON.stringify({ response }) }),

    listScorecards: (f) => j(`/scorecards?${qs(f as any)}`),
    scorecardDetail: (id) => j(`/scorecards/${id}`),
    draftScorecard: (id, body) => j(`/scorecards/${id}/draft`, { method: 'PUT', body: JSON.stringify(body) }),
    submitScorecard: (id, body) => j(`/scorecards/${id}/submit`, { method: 'POST', body: JSON.stringify(body) }),
    withdrawScorecard: (id) => j(`/scorecards/${id}/withdraw`, { method: 'POST' }),

    listCalibrations: (f) => j(`/calibrations?${qs(f as any)}`),
    calibrationDetail: (id) => j(`/calibrations/${id}`),
    openCalibration: (p) => j('/calibrations', { method: 'POST', body: JSON.stringify(p) }),
    decideCalibration: (id, body) => j(`/calibrations/${id}/decide`, { method: 'POST', body: JSON.stringify(body) }),

    dashboard: () => j('/dashboard'),
  };
};
