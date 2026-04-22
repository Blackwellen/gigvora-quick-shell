/** Sales Navigator SDK — typed envelopes shared by web + mobile. */

export type SnLeadStatus = 'new'|'researching'|'contacted'|'engaged'|'qualified'|'opportunity'|'won'|'lost'|'unresponsive'|'disqualified';
export type SnSeniority = 'intern'|'ic'|'senior'|'lead'|'manager'|'director'|'vp'|'c_level'|'founder';
export type SnSignalKind = 'funding'|'hiring_surge'|'exec_change'|'tech_adoption'|'office_expansion'|'layoffs'|'acquisition'|'partnership'|'product_launch'|'press_mention'|'intent_score'|'geo_expansion';

export interface SnLead {
  id: string; owner_identity_id: string; workspace_id?: string | null;
  full_name: string; headline: string; email?: string | null; phone?: string | null;
  company_id?: string | null; company_name?: string | null;
  title?: string | null; seniority?: SnSeniority | null; function_area?: string | null;
  industry?: string | null; hq_country?: string | null; hq_city?: string | null; region?: string | null;
  linkedin_url?: string | null; source: string;
  intent_score: number; fit_score: number; tags: string[];
  status: SnLeadStatus; saved: boolean; notes: string;
  enrichment: Record<string, unknown>;
  last_activity_at?: string | null; created_at: string; updated_at: string;
}

export interface SnList {
  id: string; name: string; kind: 'static'|'smart'|'saved_search';
  query: Record<string, unknown>; member_count: number; pinned: boolean;
}

export interface SnSequence {
  id: string; name: string; channel: 'email'|'linkedin'|'call'|'sms'|'mixed';
  status: 'draft'|'active'|'paused'|'archived';
  steps: Array<{ day: number; channel: string; subject?: string; body: string }>;
}

export interface SnActivity {
  id: string; lead_id: string; sequence_id?: string | null;
  step_index: number; channel: string; direction: 'outbound'|'inbound';
  status: string; subject?: string | null; body?: string | null;
  scheduled_at?: string | null; sent_at?: string | null; reply_at?: string | null;
}

export interface SnSignal {
  id: string; company_id: string; company_name?: string; company_logo?: string | null;
  kind: SnSignalKind; severity: number; title: string; body: string;
  source_url?: string | null; source_label?: string | null;
  detected_at: string; metadata: Record<string, unknown>;
}

export interface SnSeat {
  id: string; workspace_id: string; identity_id: string;
  role: 'owner'|'admin'|'manager'|'member'|'viewer';
  status: 'active'|'suspended'|'revoked';
  monthly_credit_quota: number; monthly_credit_used: number;
}

export interface SnGoal {
  id: string; title: string; lead_id?: string | null; account_company_id?: string | null;
  cadence_days: number; next_touch_at?: string | null; last_touch_at?: string | null;
  status: 'active'|'paused'|'completed'|'abandoned'; notes: string;
}

export interface SnEnvelope<T> { items: T[]; meta?: { count?: number; page?: number; page_size?: number } }
