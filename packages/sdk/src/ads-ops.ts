/** Typed SDK for Domain 72 — Ads Ops / Policy Review / Geo+Keyword Moderation / Campaign Controls. */

export type AdsOpsRole = 'viewer' | 'ads_reviewer' | 'ads_lead' | 'ads_admin';
export type ReviewStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'holding' | 'escalated' | 'archived';
export type ReviewQueue  = 'triage' | 'review' | 'escalation' | 'closed';
export type CreativeKind = 'image' | 'video' | 'carousel' | 'text' | 'native' | 'audio';
export type Severity     = 'low' | 'normal' | 'high' | 'critical';
export type Scope        = 'global' | 'advertiser' | 'campaign';
export type GeoRule      = 'block' | 'allow' | 'restrict_age' | 'restrict_category';
export type KwRule       = 'block' | 'review' | 'allow';
export type KwMatch      = 'exact' | 'phrase' | 'regex' | 'substring';
export type Decision =
  | 'approve' | 'approve_with_edits' | 'reject' | 'request_changes' | 'hold' | 'escalate' | 'dismiss'
  | 'pause_campaign' | 'resume_campaign' | 'disable_creative' | 'geo_restrict' | 'keyword_restrict';
export type CampaignControlStatus = 'active' | 'paused' | 'disabled' | 'restricted';
export type Band = 'normal' | 'elevated' | 'high' | 'critical';

export interface AdsOpsFlag { code: string; severity: Severity; source: string }
export interface AdsOpsReview {
  id: string; reference: string; campaign_id: string; advertiser_id: string;
  creative_kind: CreativeKind; headline?: string | null; body?: string | null; landing_url?: string | null;
  geos: string[]; keywords: string[];
  policy_score: number; policy_band: Band;
  status: ReviewStatus; queue: ReviewQueue; assigned_to?: string | null; sla_due_at?: string | null;
  flags: AdsOpsFlag[]; reasons: string[]; meta: Record<string, unknown>;
  created_at: string; updated_at: string;
}
export interface AdsOpsDecision {
  id: string; review_id: string; actor_id: string; decision: Decision;
  rationale: string; edits: Record<string, unknown>; appealable: 'yes' | 'no';
  meta: Record<string, unknown>; created_at: string;
}
export interface AdsOpsEvent {
  id: string; review_id?: string | null; campaign_id?: string | null; actor_id?: string | null;
  action: string; from_state?: string | null; to_state?: string | null;
  diff: Record<string, unknown>; created_at: string;
}
export interface AdsOpsCampaignControl {
  id: string; campaign_id: string; status: CampaignControlStatus;
  reason?: string | null; set_by?: string | null; set_at: string; meta: Record<string, unknown>;
}
export interface AdsOpsGeoRule {
  id: string; scope: Scope; scope_id?: string | null; geo_code: string;
  rule: GeoRule; category?: string | null; reason: string;
  added_by?: string | null; expires_at?: string | null; created_at: string;
}
export interface AdsOpsKeywordRule {
  id: string; scope: Scope; scope_id?: string | null; keyword: string; match: KwMatch;
  rule: KwRule; severity: Severity; reason: string;
  added_by?: string | null; expires_at?: string | null; created_at: string;
}
export interface AdsOpsKpis {
  reviewsByStatus: Partial<Record<ReviewStatus, number>>;
  reviewsByQueue: Partial<Record<ReviewQueue, number>>;
  reviewsByBand: Partial<Record<Band, number>>;
  slaBreached: number;
  campaignControls: Partial<Record<CampaignControlStatus, number>>;
  geoRules: number; keywordRules: number;
}
export interface AdsOpsInsight { id: string; severity: 'success' | 'info' | 'warn' | 'critical'; title: string }
export interface AdsOpsOverview {
  kpis: AdsOpsKpis;
  queues: { triage: AdsOpsReview[]; review: AdsOpsReview[]; escalation: AdsOpsReview[] };
  campaignControls: AdsOpsCampaignControl[];
  insights: AdsOpsInsight[]; computedAt: string;
}
export interface AdsOpsReviewDetail {
  review: AdsOpsReview; decisions: AdsOpsDecision[]; events: AdsOpsEvent[]; control: AdsOpsCampaignControl | null;
}
export interface AdsOpsList<T> { items: T[]; total: number; meta: { source: string; role: AdsOpsRole; page: number; pageSize: number } }
