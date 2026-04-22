/** Typed SDK for Domain 70 — Moderator Dashboard. */

export type ModRole = 'viewer' | 'moderator' | 'senior_moderator' | 'trust_safety_admin';
export type ItemStatus = 'open' | 'triaging' | 'holding' | 'escalated' | 'actioned' | 'dismissed' | 'closed';
export type ItemQueue  = 'triage' | 'review' | 'escalation' | 'messaging_incident' | 'closed';
export type Surface    =
  | 'post' | 'profile' | 'message' | 'media' | 'comment' | 'review'
  | 'project' | 'gig' | 'service' | 'job' | 'dm_thread';
export type ReasonCode =
  | 'spam' | 'harassment' | 'hate' | 'csam' | 'illegal'
  | 'impersonation' | 'intellectual_property' | 'self_harm' | 'nsfw' | 'scam' | 'other';
export type Severity = 'low' | 'normal' | 'high' | 'critical';
export type ModAction =
  | 'warn' | 'hide' | 'remove' | 'quarantine' | 'suspend' | 'ban'
  | 'escalate_legal' | 'escalate_trust_safety' | 'dismiss' | 'restore' | 'none';
export type IncidentSignal =
  | 'keyword' | 'rate_limit' | 'phishing' | 'solicitation' | 'grooming'
  | 'self_harm' | 'threat' | 'spam' | 'user_report' | 'automation' | 'other';
export type IncidentStatus = 'pending' | 'reviewed' | 'actioned' | 'dismissed' | 'escalated';

export interface ModItem {
  id: string; reference: string; surface: Surface; target_id: string;
  reason_code: ReasonCode; reason_detail?: string | null;
  reporter_id?: string | null; evidence: Array<{ url: string; label: string }>;
  severity: Severity; ml_score: number; ml_band: 'normal' | 'elevated' | 'high' | 'critical';
  ml_reasons: string[]; status: ItemStatus; queue: ItemQueue;
  assigned_to?: string | null; sla_due_at?: string | null;
  meta: Record<string, unknown>; created_at: string; updated_at: string;
}
export interface ModActionRow {
  id: string; item_id: string; actor_id: string; action: ModAction;
  rationale: string; duration_h?: number | null; appealable: 'yes' | 'no';
  meta: Record<string, unknown>; created_at: string;
}
export interface ModEvent {
  id: string; item_id?: string | null; incident_id?: string | null;
  actor_id?: string | null; action: string;
  from_state?: string | null; to_state?: string | null;
  diff: Record<string, unknown>; created_at: string;
}
export interface MessagingIncident {
  id: string; item_id?: string | null; thread_id: string;
  participants: Array<{ userId: string; role?: string }>;
  signal: IncidentSignal; excerpt?: string | null;
  ml_score: number; ml_band: string; status: IncidentStatus;
  reviewed_by?: string | null; reviewed_at?: string | null;
  meta: Record<string, unknown>; created_at: string;
}
export interface ModMacro { id: string; slug: string; label: string; action: ModAction; template: string; meta: Record<string, unknown>; created_at: string }

export interface ModKpis {
  byStatus: Partial<Record<ItemStatus, number>>;
  byQueue: Partial<Record<ItemQueue, number>>;
  bySeverity: Partial<Record<Severity, number>>;
  slaBreached: number;
  messagingByStatus: Partial<Record<IncidentStatus, number>>;
}
export interface ModInsight { id: string; severity: 'success' | 'info' | 'warn' | 'critical'; title: string }
export interface ModRiskScore { score: number; band: 'normal' | 'elevated' | 'high' | 'critical'; model: string; factors: Record<string, number> }
export interface ModOverview {
  kpis: ModKpis;
  queues: { triage: ModItem[]; review: ModItem[]; escalation: ModItem[] };
  messagingIncidents: MessagingIncident[];
  insights: ModInsight[]; riskScore: ModRiskScore; computedAt: string;
}
export interface ModItemDetail { item: ModItem; actions: ModActionRow[]; events: ModEvent[] }
export interface ModList<T> { items: T[]; total: number; meta: { source: string; role: ModRole; page: number; pageSize: number } }
