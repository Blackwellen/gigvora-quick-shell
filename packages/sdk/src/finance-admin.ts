/** Typed SDK for Domain 68 — Finance Admin Dashboard. */

export type FinanceRole = 'viewer' | 'operator' | 'finance_admin' | 'super_admin';
export type RefundStatus =
  | 'draft' | 'pending' | 'approved' | 'processing'
  | 'succeeded' | 'failed' | 'rejected' | 'reversed';
export type RefundCategory =
  | 'duplicate' | 'fraud' | 'dispute' | 'goodwill'
  | 'service_failure' | 'cancelled' | 'partial';
export type FinProvider = 'stripe' | 'paddle' | 'wallet' | 'manual';
export type HoldReason = 'kyc' | 'risk_review' | 'dispute' | 'fraud' | 'manual' | 'compliance';
export type HoldStatus = 'active' | 'released' | 'expired';

export interface FinRefund {
  id: string; reference: string; invoice_id?: string | null; payment_ref?: string | null;
  customer_id: string; amount_minor: number; currency: string;
  reason: string; category: RefundCategory; provider: FinProvider; status: RefundStatus;
  requested_by?: string | null; approved_by?: string | null;
  approved_at?: string | null; processed_at?: string | null; failure_reason?: string | null;
  meta: Record<string, unknown>; created_at: string; updated_at: string;
}
export interface FinHold {
  id: string; owner_id: string; amount_minor: number; currency: string;
  reason: HoldReason; status: HoldStatus; expires_at?: string | null;
  released_at?: string | null; released_by?: string | null; notes?: string | null;
  meta: Record<string, unknown>; created_at: string;
}
export interface FinControl {
  id: string; scope: 'global' | 'customer' | 'plan' | 'region';
  scope_key: string; control_key: string; value: Record<string, unknown>; enabled: boolean;
  updated_by?: string | null; updated_at: string;
}
export interface FinLedgerEntry {
  id: string; occurred_at: string; account: string; owner_id?: string | null;
  ref_kind: string; ref_id?: string | null; direction: 'credit' | 'debit';
  amount_minor: number; currency: string; description?: string | null;
  actor_id?: string | null; meta: Record<string, unknown>;
}

export interface FinKpis {
  refunds: Partial<Record<RefundStatus, { count: number; amountMinor: number }>>;
  holds:   Partial<Record<HoldStatus,   { count: number; amountMinor: number }>>;
  ledger30d: Array<{ account: string; direction: 'credit' | 'debit'; amountMinor: number }>;
}
export interface FinInsight { id: string; severity: 'success' | 'info' | 'warn' | 'critical'; title: string }
export interface FinRiskScore {
  score: number; band: 'normal' | 'elevated' | 'high' | 'critical';
  model: string; factors: Record<string, number>;
}
export interface FinOverview {
  kpis: FinKpis; controls: FinControl[]; recentRefunds: FinRefund[]; holds: FinHold[];
  insights: FinInsight[]; riskScore: FinRiskScore; computedAt: string;
}
export interface FinList<T> { items: T[]; total: number; meta: { source: string; role: FinanceRole; page: number; pageSize: number } }
