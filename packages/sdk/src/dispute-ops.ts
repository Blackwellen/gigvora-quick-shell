/** Typed SDK for Domain 69 — Dispute Operations. */

export type DisputeRole = 'viewer' | 'operator' | 'mediator' | 'arbitrator' | 'dispute_admin';
export type CaseStatus =
  | 'draft' | 'pending' | 'triaged' | 'mediation' | 'arbitration'
  | 'awaiting_response' | 'resolved' | 'dismissed' | 'escalated' | 'closed';
export type CaseQueue = 'triage' | 'mediation' | 'arbitration' | 'escalation' | 'closed';
export type CaseCategory =
  | 'service_quality' | 'non_delivery' | 'scope' | 'payment' | 'refund'
  | 'ip' | 'fraud' | 'chargeback' | 'other';
export type CaseSeverity = 'low' | 'normal' | 'high' | 'critical';
export type CaseOutcome  =
  | 'refund_full' | 'refund_partial' | 'rework' | 'dismissed'
  | 'split' | 'goodwill' | 'reversed' | 'none';

export interface DisputeCase {
  id: string; reference: string; subject: string; description: string;
  category: CaseCategory; severity: CaseSeverity;
  amount_minor: number; currency: string;
  claimant_id: string; respondent_id?: string | null;
  source_kind?: string | null; source_id?: string | null;
  status: CaseStatus; outcome?: CaseOutcome | null; outcome_amount_minor?: number | null;
  assignee_id?: string | null; queue: CaseQueue;
  priority_score: number;
  sla_due_at?: string | null; resolved_at?: string | null;
  meta: Record<string, unknown>; created_at: string; updated_at: string;
}
export interface DisputeMessage {
  id: string; case_id: string; author_id: string;
  author_role: 'claimant' | 'respondent' | 'mediator' | 'arbitrator' | 'operator' | 'system';
  body: string; attachments: Array<{ url: string; label: string }>;
  visibility: 'parties' | 'internal' | 'arbitration'; created_at: string;
}
export interface DisputeEvidence {
  id: string; case_id: string; uploaded_by: string;
  party: 'claimant' | 'respondent' | 'operator' | 'arbitrator';
  kind: 'file' | 'link' | 'message' | 'transaction' | 'screenshot' | 'contract' | 'other';
  label: string; url?: string | null; bytes?: number | null;
  meta: Record<string, unknown>; created_at: string;
}
export interface DisputeEvent {
  id: string; case_id?: string | null; actor_id?: string | null;
  action: string; from_state?: string | null; to_state?: string | null;
  diff: Record<string, unknown>; created_at: string;
}
export interface DisputeArbitration {
  id: string; case_id: string;
  panel: Array<{ userId: string; role: string }>;
  opened_by: string; opened_at: string;
  decided_at?: string | null; decided_by?: string | null;
  decision?: 'refund_full' | 'refund_partial' | 'rework' | 'dismissed' | 'split' | 'goodwill' | null;
  decision_amount_minor?: number | null; rationale?: string | null;
  meta: Record<string, unknown>;
}

export interface DisputeKpis {
  byStatus:    Partial<Record<CaseStatus, number>>;
  byQueue:     Partial<Record<CaseQueue,  number>>;
  bySeverity:  Partial<Record<CaseSeverity, number>>;
  slaBreached: number;
}
export interface DisputeInsight { id: string; severity: 'success' | 'info' | 'warn' | 'critical'; title: string }
export interface DisputeRiskScore {
  score: number; band: 'normal' | 'elevated' | 'high' | 'critical';
  model: string; factors: Record<string, number>;
}
export interface DisputeOverview {
  kpis: DisputeKpis;
  queues: { triage: DisputeCase[]; mediation: DisputeCase[]; arbitration: DisputeCase[] };
  insights: DisputeInsight[]; riskScore: DisputeRiskScore; computedAt: string;
}
export interface DisputeCaseDetail {
  case: DisputeCase; messages: DisputeMessage[];
  evidence: DisputeEvidence[]; events: DisputeEvent[];
  arbitration: DisputeArbitration[];
}
export interface DisputeList<T> {
  items: T[]; total: number;
  meta: { source: string; role: DisputeRole; page: number; pageSize: number };
}
