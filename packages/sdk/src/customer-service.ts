/**
 * Typed SDK for Domain 67 — Customer Service Dashboard, Tickets, Resolution.
 */

export type CsRole = 'customer' | 'agent' | 'lead' | 'trust_safety' | 'super_admin';
export type CsStatus =
  | 'draft' | 'pending' | 'active' | 'waiting_customer' | 'escalated'
  | 'resolved' | 'closed' | 'reopened' | 'refunded' | 'archived';
export type CsPriority = 'low' | 'normal' | 'high' | 'urgent';
export type CsCategory =
  | 'general' | 'billing' | 'dispute' | 'account' | 'technical'
  | 'trust_safety' | 'enterprise' | 'refund' | 'escalation';
export type CsChannel = 'web' | 'email' | 'chat' | 'phone' | 'api' | 'mobile';

export interface CsTicket {
  id: string;
  reference: string;
  requester_id: string;
  requester_email: string;
  requester_kind: 'user' | 'professional' | 'enterprise' | 'guest';
  subject: string;
  body: string;
  category: CsCategory;
  priority: CsPriority;
  channel: CsChannel;
  status: CsStatus;
  assignee_id?: string | null;
  queue_slug: string;
  sla_due_at?: string | null;
  resolved_at?: string | null;
  csat_score?: number | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CsTicketMessage {
  id: string;
  ticket_id: string;
  author_id: string;
  author_kind: 'agent' | 'customer' | 'system' | 'bot';
  body: string;
  visibility: 'public' | 'internal';
  attachments: Array<{ url: string; name: string; size?: number }>;
  created_at: string;
}

export interface CsTicketEvent {
  id: string;
  ticket_id: string;
  actor_id?: string | null;
  action: string;
  diff: Record<string, unknown>;
  created_at: string;
}

export interface CsMacro { id: string; slug: string; label: string; body: string; category: string; enabled: boolean }

export interface CsKpis {
  byStatus: Partial<Record<CsStatus, number>>;
  byPriority: Partial<Record<CsPriority, number>>;
  breaches: number;
  csat: { avg: number | null; count: number };
}
export interface CsInsight { id: string; severity: 'success' | 'info' | 'warn' | 'critical'; title: string }

export interface CsOverview {
  kpis: CsKpis;
  queues: Array<{ status: string; count: number }>;
  recent: CsTicket[];
  insights: CsInsight[];
  computedAt: string;
}

export interface CsList { items: CsTicket[]; total: number; meta: { source: string; role: CsRole; page: number; pageSize: number } }
export interface CsDetail { ticket: CsTicket; messages: CsTicketMessage[]; events: CsTicketEvent[] }
export interface CsPrioritySuggestion {
  priority: CsPriority; score: number; reasons: string[]; model: string;
}
