/**
 * Typed SDK for Domain 33 — Project Posting Studio, Smart Match & Invite Flows.
 *
 * Mirrors the controller envelopes 1:1. Multi-step boost-credit checkout
 * (createBoostPurchase → confirmBoostPurchase) follows the platform-wide
 * payment-checkout-pattern rule. Smart match returns explainable reasons[]
 * so the UI can render "why this matches" tooltips.
 */
export type Engagement = 'fixed' | 'hourly' | 'milestone' | 'retainer';
export type Workplace = 'remote' | 'hybrid' | 'onsite';
export type ProjectStudioStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'expired' | 'archived' | 'rejected' | 'awarded' | 'cancelled';
export type PromotionTier = 'none' | 'standard' | 'featured' | 'spotlight';
export type InviteChannel = 'inapp' | 'email' | 'sms' | 'inapp+email';
export type InviteStatus = 'pending' | 'sent' | 'opened' | 'accepted' | 'declined' | 'maybe' | 'expired' | 'revoked';
export type BoostPackId = 'boost_starter_5' | 'boost_growth_25' | 'invite_pack_25' | 'invite_pack_100';

export interface Milestone { id?: string; title: string; amountCents: number; dueAt?: string }
export interface Screener  { id?: string; text: string; required: boolean; knockout: boolean }

export interface ProjectStudioDraft {
  title: string; summary?: string; description?: string;
  engagement?: Engagement; workplace?: Workplace; location?: string;
  budgetMinCents?: number; budgetMaxCents?: number; currency?: 'GBP' | 'USD' | 'EUR';
  durationDays?: number; startWindow?: 'immediate' | 'this_week' | 'this_month' | 'flexible';
  skills?: string[]; categories?: string[];
  experienceLevel?: 'entry' | 'intermediate' | 'expert';
  scopeSize?: 'small' | 'medium' | 'large' | 'enterprise';
  launchpadFlags?: string[];
  visibility?: 'public' | 'private' | 'invite_only' | 'partner_network';
  promotionTier?: PromotionTier;
  ndaRequired?: boolean;
  attachmentIds?: string[];
  milestones?: Milestone[]; screeners?: Screener[];
}

export interface ProjectStudioRowPublic {
  id: string; tenantId: string; owner: { id: string; name: string };
  title: string; summary: string; description: string;
  engagement: Engagement; workplace: Workplace; location: string;
  budget: { minCents: number; maxCents: number; currency: string } | null;
  durationDays: number | null; startWindow: string;
  skills: string[]; categories: string[]; experienceLevel: string; scopeSize: string;
  launchpadFlags: string[]; visibility: string; promotionTier: PromotionTier; ndaRequired: boolean;
  attachmentIds: string[]; milestones: Milestone[]; screeners: Screener[];
  status: ProjectStudioStatus; channels: string[]; inviteCap: number;
  invitesSent: number; matchesGenerated: number;
  publishedAt: string | null; expiresAt: string | null;
  createdAt: string; updatedAt: string; version: number;
}

export interface SmartMatchItem {
  candidateId: string; displayName: string; avatar: string; headline: string;
  location: string; hourlyRateCents: number; rating: number; jobsCompleted: number;
  skills: string[]; availability: 'open' | 'busy' | 'limited';
  matchScore: number; reasons: string[];
}

export interface InviteRow {
  id: string; projectId: string; tenantId: string; candidateId: string;
  sentBy: string; channel: InviteChannel; message: string | null;
  status: InviteStatus;
  sentAt: string; openedAt: string | null; respondedAt: string | null;
  expiresAt: string; decisionNote: string | null;
}

export interface BoostPack { id: BoostPackId; label: string; kind: 'boost' | 'invite_credits'; postings: number; invites: number; priceCents: number; currency: 'GBP' }
export interface BoostPurchase { id: string; tenantId: string; buyerId: string; packId: string; kind: 'boost' | 'invite_credits'; postings: number; invites: number; amountCents: number; currency: string; status: 'pending' | 'paid' | 'failed' | 'refunded'; createdAt: string; confirmedAt: string | null; receiptUrl: string | null }

export interface PpsInsights {
  drafts: number; active: number; pending: number;
  totalInvitesSent: number; accepted: number; declined: number; acceptRate: number;
  boostBalance: number; inviteBalance: number;
  anomalyNote: string | null; generatedAt: string; mode: string;
}

export interface ProjectPostingSmartMatchClient {
  list(): Promise<ProjectStudioRowPublic[]>;
  detail(id: string): Promise<(ProjectStudioRowPublic & { invites: InviteRow[]; audit: any[]; approval: any | null }) | null>;
  create(d: ProjectStudioDraft): Promise<ProjectStudioRowPublic>;
  update(id: string, expectedVersion: number, patch: Partial<ProjectStudioDraft>): Promise<ProjectStudioRowPublic>;
  submit(id: string): Promise<any>;
  decide(id: string, decision: 'approve' | 'reject' | 'request_changes', note?: string): Promise<any>;
  publish(id: string, body: { promotionTier?: PromotionTier; durationDays?: number; channels?: string[]; inviteCap?: number; idempotencyKey: string }): Promise<ProjectStudioRowPublic>;
  pause(id: string): Promise<ProjectStudioRowPublic>;
  resume(id: string): Promise<ProjectStudioRowPublic>;
  archive(id: string): Promise<ProjectStudioRowPublic>;
  approvalQueue(): Promise<any[]>;

  smartMatch(body: { projectId: string; topK?: number; diversify?: boolean; minScore?: number; excludeInvited?: boolean }): Promise<{ projectId: string; mode: 'ml' | 'fallback'; generatedAt: string; items: SmartMatchItem[] }>;
  invites(projectId: string): Promise<InviteRow[]>;
  invite(b: { projectId: string; candidateId: string; channel?: InviteChannel; message?: string; expiresInDays?: number }): Promise<InviteRow>;
  inviteBulk(b: { projectId: string; candidateIds: string[]; channel?: InviteChannel; message?: string; expiresInDays?: number }): Promise<InviteRow[]>;
  decideInvite(b: { inviteId: string; decision: 'accept' | 'decline' | 'maybe'; note?: string }): Promise<InviteRow>;
  revokeInvite(id: string): Promise<InviteRow>;

  boostPacks(): Promise<BoostPack[]>;
  boostBalance(): Promise<{ boostBalance: number; inviteBalance: number; ledger: any[]; purchases: BoostPurchase[] }>;
  createBoostPurchase(packId: BoostPackId): Promise<BoostPurchase>;
  confirmBoostPurchase(purchaseId: string, body: { paymentMethod: 'card' | 'invoice' | 'wallet'; billing: { name: string; email: string; country: string; vatId?: string }; acceptTos: true; idempotencyKey: string }): Promise<BoostPurchase>;
  applyBoost(b: { projectId: string; promotionTier: PromotionTier; durationDays?: number; idempotencyKey: string }): Promise<ProjectStudioRowPublic>;

  insights(): Promise<PpsInsights>;
}

export const createProjectPostingSmartMatchClient = (
  fetcher: typeof fetch,
  base = '/api/v1/project-posting-smart-match',
): ProjectPostingSmartMatchClient => {
  const j = async (path: string, init?: RequestInit) => {
    const r = await fetcher(`${base}${path}`, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } });
    if (!r.ok) throw new Error(`pps ${path} ${r.status}`);
    return r.json();
  };
  return {
    list: () => j('/projects'),
    detail: (id) => j(`/projects/${id}`),
    create: (d) => j('/projects', { method: 'POST', body: JSON.stringify(d) }),
    update: (id, expectedVersion, patch) => j(`/projects/${id}`, { method: 'PUT', body: JSON.stringify({ expectedVersion, patch }) }),
    submit: (id) => j(`/projects/${id}/submit`, { method: 'POST', body: '{}' }),
    decide: (id, decision, note) => j(`/projects/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision, note }) }),
    publish: (id, body) => j(`/projects/${id}/publish`, { method: 'POST', body: JSON.stringify(body) }),
    pause: (id) => j(`/projects/${id}/pause`, { method: 'POST', body: '{}' }),
    resume: (id) => j(`/projects/${id}/resume`, { method: 'POST', body: '{}' }),
    archive: (id) => j(`/projects/${id}/archive`, { method: 'POST', body: '{}' }),
    approvalQueue: () => j('/approvals'),

    smartMatch: (body) => j('/match', { method: 'POST', body: JSON.stringify(body) }),
    invites: (projectId) => j(`/projects/${projectId}/invites`),
    invite: (b) => j('/invites', { method: 'POST', body: JSON.stringify(b) }),
    inviteBulk: (b) => j('/invites/bulk', { method: 'POST', body: JSON.stringify(b) }),
    decideInvite: (b) => j('/invites/decision', { method: 'POST', body: JSON.stringify(b) }),
    revokeInvite: (id) => j(`/invites/${id}`, { method: 'DELETE' }),

    boostPacks: () => j('/boost/packs'),
    boostBalance: () => j('/boost/balance'),
    createBoostPurchase: (packId) => j('/boost/purchases', { method: 'POST', body: JSON.stringify({ packId }) }),
    confirmBoostPurchase: (purchaseId, body) => j(`/boost/purchases/${purchaseId}/confirm`, { method: 'POST', body: JSON.stringify(body) }),
    applyBoost: (b) => j('/boost/apply', { method: 'POST', body: JSON.stringify(b) }),

    insights: () => j('/insights'),
  };
};
