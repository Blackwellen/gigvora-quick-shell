/** Shared domain types. Keep frontend & backend invariants aligned here. */
export type Role = 'user' | 'professional' | 'enterprise' | 'admin';
export type PlanTier = 'free' | 'pro' | 'team' | 'enterprise';

export const ROLES: Role[] = ['user', 'professional', 'enterprise', 'admin'];

export interface AuditEvent {
  id: string;
  actorId: string;
  action: string;
  target?: { type: string; id: string };
  at: string;
  meta?: Record<string, unknown>;
}
