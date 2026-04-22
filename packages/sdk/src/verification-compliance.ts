/** Typed SDK for Domain 73 — Verification, Compliance, and Identity Review Dashboard. */

export type VcRole       = 'viewer' | 'vc_analyst' | 'vc_lead' | 'vc_admin';
export type CaseStatus   = 'pending' | 'reviewing' | 'holding' | 'approved' | 'rejected' | 'escalated' | 'expired' | 'archived';
export type CaseQueue    = 'triage' | 'review' | 'escalation' | 'closed';
export type Program      = 'kyc' | 'kyb' | 'aml' | 'sanctions' | 'address' | 'tax' | 'accreditation' | 'right_to_work' | 'professional_licence';
export type SubjectKind  = 'user' | 'professional' | 'enterprise' | 'agency';
export type DocKind      = 'passport' | 'national_id' | 'driving_licence' | 'utility_bill' | 'bank_statement' | 'selfie' | 'company_reg' | 'tax_id' | 'licence' | 'other';
export type CheckType    = 'document' | 'facial_similarity' | 'watchlist' | 'pep' | 'sanctions' | 'address' | 'company_reg' | 'aml' | 'tax' | 'adverse_media';
export type CheckResult  = 'pending' | 'clear' | 'consider' | 'rejected' | 'error';
export type Decision     = 'approve' | 'reject' | 'request_more_info' | 'step_up' | 'hold' | 'escalate' | 'dismiss' | 'expire' | 'renew';
export type Severity     = 'low' | 'normal' | 'high' | 'critical';
export type Band         = 'normal' | 'elevated' | 'high' | 'critical';

export interface VcFlag { code: string; severity: Severity; source: string }

export interface VcCase {
  id: string; reference: string;
  subject_id: string; subject_kind: SubjectKind;
  program: Program; jurisdiction: string;
  risk_score: number; risk_band: Band;
  status: CaseStatus; queue: CaseQueue;
  assigned_to?: string | null;
  sla_due_at?: string | null; expires_at?: string | null;
  reasons: string[]; flags: VcFlag[];
  meta: Record<string, unknown>;
  created_at: string; updated_at: string;
}
export interface VcDocument {
  id: string; case_id: string; kind: DocKind;
  filename: string; storage_url: string;
  mime_type?: string | null; bytes?: number | null;
  hash_sha256?: string | null; ocr_text?: string | null;
  ocr_fields: Record<string, unknown>;
  liveness_score?: number | null; match_score?: number | null;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  uploaded_at: string;
  reviewed_by?: string | null; reviewed_at?: string | null;
}
export interface VcCheck {
  id: string; case_id: string; provider: string;
  check_type: CheckType; result: CheckResult; score?: number | null;
  payload: Record<string, unknown>; external_id?: string | null;
  created_at: string; completed_at?: string | null;
}
export interface VcDecision {
  id: string; case_id: string; actor_id: string;
  decision: Decision; rationale: string;
  duration_days?: number | null;
  appealable: 'yes' | 'no'; meta: Record<string, unknown>;
  created_at: string;
}
export interface VcEvent {
  id: string; case_id?: string | null; subject_id?: string | null;
  actor_id?: string | null; action: string;
  from_state?: string | null; to_state?: string | null;
  diff: Record<string, unknown>; ip?: string | null; created_at: string;
}
export interface VcWatchlistEntry {
  id: string; subject_id: string; subject_kind: SubjectKind;
  reason: string; severity: Severity;
  added_by?: string | null; expires_at?: string | null;
  meta: Record<string, unknown>; created_at: string;
}
export interface VcKpis {
  casesByStatus:  Partial<Record<CaseStatus, number>>;
  casesByQueue:   Partial<Record<CaseQueue, number>>;
  casesByBand:    Partial<Record<Band, number>>;
  casesByProgram: Partial<Record<Program, number>>;
  slaBreached:    number;
  expiringSoon:   number;
  watchlist:      number;
}
export interface VcInsight  { id: string; severity: 'success' | 'info' | 'warn' | 'critical'; title: string }
export interface VcDeskRisk { score: number; band: Band; model: string; factors: Record<string, number> }
export interface VcOverview {
  kpis: VcKpis;
  queues: { triage: VcCase[]; review: VcCase[]; escalation: VcCase[] };
  watchlist: VcWatchlistEntry[];
  insights: VcInsight[]; deskRisk: VcDeskRisk; computedAt: string;
}
export interface VcCaseDetail {
  case: VcCase; documents: VcDocument[]; checks: VcCheck[];
  decisions: VcDecision[]; events: VcEvent[];
}
export interface VcList<T> { items: T[]; total: number; meta: { source: string; role: VcRole; page: number; pageSize: number } }
