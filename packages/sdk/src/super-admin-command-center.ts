/** Typed SDK for Domain 74 — Super Admin Command Center, Feature Flags, Audit, Platform Overrides. */

export type SaRole          = 'viewer' | 'sa_operator' | 'sa_admin' | 'sa_root';
export type FlagStatus      = 'draft' | 'active' | 'paused' | 'archived';
export type OverrideScope   = 'platform' | 'tenant' | 'user' | 'feature' | 'route' | 'domain';
export type OverrideKind    = 'rate_limit' | 'maintenance' | 'config' | 'entitlement' | 'kill_switch' | 'dark_launch' | 'cost_cap' | 'rollout';
export type OverrideStatus  = 'active' | 'paused' | 'expired' | 'archived';
export type IncidentSeverity= 'sev1' | 'sev2' | 'sev3' | 'sev4';
export type IncidentStatus  = 'open' | 'mitigated' | 'resolved' | 'postmortem' | 'archived';

export interface FlagSegment { kind: string; value: string }
export interface FlagVariant { key: string; weight: number; payload: Record<string, unknown> }

export interface FeatureFlag {
  id: string; key: string; name: string; description: string;
  enabled: boolean; rollout_pct: number; status: FlagStatus;
  environments: string[]; segments: FlagSegment[]; variants: FlagVariant[];
  owner_id?: string | null; created_by?: string | null;
  created_at: string; updated_at: string;
}
export interface PlatformOverride {
  id: string; scope: OverrideScope; scope_id?: string | null;
  kind: OverrideKind; value: Record<string, unknown>;
  reason: string; status: OverrideStatus;
  created_by?: string | null; expires_at?: string | null;
  created_at: string; updated_at: string;
}
export interface PlatformIncident {
  id: string; title: string; severity: IncidentSeverity; status: IncidentStatus;
  scope: string; commander?: string | null;
  opened_at: string; mitigated_at?: string | null; resolved_at?: string | null;
  notes: string; meta: Record<string, unknown>;
}
export interface SaAuditEvent {
  id: string; actor_id?: string | null; domain: string;
  target_id?: string | null; action: string;
  from_state?: string | null; to_state?: string | null;
  diff: Record<string, unknown>; ip?: string | null; user_agent?: string | null;
  created_at: string;
}
export interface SaKpis {
  flagsByStatus:     Partial<Record<FlagStatus, number>>;
  overridesByStatus: Partial<Record<OverrideStatus, number>>;
  overridesByKind:   Partial<Record<OverrideKind, number>>;
  incidentsByStatus: Partial<Record<IncidentStatus, number>>;
  openIncidentsBySev:Partial<Record<IncidentSeverity, number>>;
  auditEvents24h:    number;
  killSwitchesActive:number;
}
export interface SaInsight { id: string; severity: 'success' | 'info' | 'warn' | 'critical'; title: string }
export interface SaOverview {
  kpis: SaKpis;
  flagsActive: FeatureFlag[];
  overridesActive: PlatformOverride[];
  openIncidents: PlatformIncident[];
  recentAudit: SaAuditEvent[];
  insights: SaInsight[];
  computedAt: string;
}
export interface SaList<T> { items: T[]; total: number; meta: { source: string; role: SaRole; page: number; pageSize: number } }
