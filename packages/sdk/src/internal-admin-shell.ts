/**
 * Typed SDK for Domain 66 — Internal Admin Shell.
 * Consumed by the web admin shell, mobile, and connector tools.
 */

export type IasRole = 'operator' | 'moderator' | 'finance' | 'trust_safety' | 'super_admin';
export type IasStatus = 'active' | 'paused' | 'archived';
export type IasRisk = 'low' | 'medium' | 'high' | 'critical';
export type IasHealth = 'healthy' | 'caution' | 'degraded' | 'blocked';
export type IasItemState = 'pending' | 'active' | 'escalated' | 'blocked' | 'completed' | 'failed' | 'refunded' | 'archived';
export type IasPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface IasWorkspace {
  id: string;
  slug: string;
  label: string;
  description: string;
  icon: string;
  route: string;
  required_role: IasRole;
  risk_band: IasRisk;
  status: IasStatus;
  position: number;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface IasQueue {
  id: string;
  workspace_id: string | null;
  workspace_slug?: string | null;
  workspace_label?: string | null;
  slug: string;
  label: string;
  domain: string;
  status: IasStatus;
  sla_minutes: number;
  health: IasHealth;
  depth: number;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface IasQueueItem {
  id: string;
  queue_id: string;
  reference: string;
  subject: string;
  priority: IasPriority;
  state: IasItemState;
  assignee_id?: string | null;
  due_at?: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface IasShortcut {
  id: string;
  combo: string;
  label: string;
  action: 'navigate' | 'open_drawer' | 'toggle_command' | 'queue_jump' | 'custom';
  payload: Record<string, unknown>;
  scope: 'global' | 'workspace' | 'queue';
  required_role: IasRole;
  enabled: boolean;
}

export interface IasAuditEvent {
  id: string;
  operator_id?: string | null;
  identity_id?: string | null;
  action: string;
  workspace_slug?: string | null;
  queue_slug?: string | null;
  target_type?: string | null;
  target_id?: string | null;
  diff: Record<string, unknown>;
  ip?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface IasInsight { id: string; severity: 'success' | 'info' | 'warn' | 'critical'; title: string }

export interface IasOverview {
  kpis: {
    workspaces: number;
    visibleWorkspaces: number;
    queues: number;
    totalDepth: number;
    healthBreakdown: Record<IasHealth, number>;
  };
  workspaces: IasWorkspace[];
  queues: IasQueue[];
  recentAudit: IasAuditEvent[];
  insights: IasInsight[];
  computedAt: string;
}

export interface IasEnvelope<T> {
  items: T[];
  meta: { source: string; model?: string; role?: IasRole; count?: number; queue?: string };
}

export interface IasQueueJumpResult {
  item: IasQueueItem | null;
  meta: { source: string; model: string; reason?: 'no_pending_items' };
}
