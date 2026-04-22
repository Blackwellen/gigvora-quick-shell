/** Typed SDK for Domain 71 — Trust & Safety / ML / Fraud / Risk Decisions. */

export type TsmlRole = 'viewer' | 'ts_analyst' | 'ts_lead' | 'ts_admin';
export type CaseStatus = 'open' | 'reviewing' | 'holding' | 'escalated' | 'decided' | 'closed';
export type CaseQueue  = 'triage' | 'review' | 'escalation' | 'closed';
export type CaseKind   = 'fraud' | 'abuse' | 'identity' | 'payment_risk' | 'content' | 'compliance' | 'other';
export type SubjectKind = 'user' | 'company' | 'agency' | 'order' | 'listing' | 'transaction' | 'device' | 'ip' | 'session';
export type Severity   = 'low' | 'normal' | 'high' | 'critical';
export type SignalSource =
  | 'payment' | 'login' | 'signup' | 'message' | 'listing' | 'review'
  | 'device' | 'velocity' | 'geo' | 'identity' | 'external_webhook' | 'manual';
export type SignalStatus = 'open' | 'reviewing' | 'actioned' | 'dismissed' | 'suppressed' | 'expired';
export type Decision =
  | 'allow' | 'allow_with_friction' | 'step_up_kyc' | 'hold_funds' | 'release_funds'
  | 'block_payment' | 'restrict_account' | 'suspend' | 'ban' | 'refund'
  | 'chargeback_accept' | 'chargeback_dispute' | 'escalate_legal' | 'escalate_compliance'
  | 'whitelist' | 'blacklist' | 'dismiss' | 'none';
export type ListKind = 'blocklist' | 'allowlist' | 'watchlist';
export type Band = 'normal' | 'elevated' | 'high' | 'critical';

export interface TsmlSignal {
  id: string; source: SignalSource; subject_kind: SubjectKind; subject_id: string;
  signal_code: string; severity: Severity; ml_score: number; ml_band: Band;
  features: Record<string, unknown>; reasons: string[]; status: SignalStatus;
  meta: Record<string, unknown>; created_at: string; updated_at: string;
}
export interface TsmlCase {
  id: string; reference: string; subject_kind: SubjectKind; subject_id: string;
  case_kind: CaseKind; risk_score: number; risk_band: Band;
  status: CaseStatus; queue: CaseQueue; assigned_to?: string | null;
  sla_due_at?: string | null;
  signals: Array<{ id: string; code: string; score: number; band: Band }>;
  features: Record<string, unknown>; reasons: string[]; meta: Record<string, unknown>;
  created_at: string; updated_at: string;
}
export interface TsmlDecision {
  id: string; case_id: string; actor_id: string; decision: Decision;
  rationale: string; duration_h?: number | null; appealable: 'yes' | 'no';
  meta: Record<string, unknown>; created_at: string;
}
export interface TsmlMlReview {
  id: string; case_id: string; signal_id?: string | null;
  model: string; version: string; score: number; band: Band;
  features: Record<string, unknown>; reasons: string[];
  agreed?: boolean | null; reviewer_id?: string | null;
  reviewed_at?: string | null; created_at: string;
}
export interface TsmlEvent {
  id: string; case_id?: string | null; signal_id?: string | null; actor_id?: string | null;
  action: string; from_state?: string | null; to_state?: string | null;
  diff: Record<string, unknown>; created_at: string;
}
export interface TsmlWatchlist {
  id: string; list_kind: ListKind; subject_kind: SubjectKind; subject_id: string;
  reason: string; added_by?: string | null; expires_at?: string | null;
  meta: Record<string, unknown>; created_at: string;
}
export interface TsmlKpis {
  casesByStatus: Partial<Record<CaseStatus, number>>;
  casesByQueue: Partial<Record<CaseQueue, number>>;
  casesByBand: Partial<Record<Band, number>>;
  signalsByBand: Partial<Record<Band, number>>;
  signalsOpen: number;
  slaBreached: number;
  watchlist: Partial<Record<ListKind, number>>;
}
export interface TsmlInsight { id: string; severity: 'success' | 'info' | 'warn' | 'critical'; title: string }
export interface TsmlRiskScore { score: number; band: Band; model: string; factors: Record<string, number> }
export interface TsmlOverview {
  kpis: TsmlKpis;
  queues: { triage: TsmlCase[]; review: TsmlCase[]; escalation: TsmlCase[] };
  openSignals: TsmlSignal[];
  watchlist: TsmlWatchlist[];
  insights: TsmlInsight[]; riskScore: TsmlRiskScore; computedAt: string;
}
export interface TsmlCaseDetail { case: TsmlCase; decisions: TsmlDecision[]; mlReviews: TsmlMlReview[]; events: TsmlEvent[] }
export interface TsmlList<T> { items: T[]; total: number; meta: { source: string; role: TsmlRole; page: number; pageSize: number } }
