// Domain 16 — Trust SDK namespace types.
// Use via `new GigvoraClient({ baseUrl }).trust.*` — see packages/sdk/src/index.ts.
export type TrustSubjectKind = 'user' | 'agency' | 'company' | 'gig' | 'service' | 'project' | 'job';
export type TrustReviewStatus = 'draft' | 'pending' | 'published' | 'disputed' | 'rejected' | 'archived';
export type TrustBadgeKey =
  | 'top_rated' | 'verified_pro' | 'fast_responder' | 'trusted_seller'
  | 'community_leader' | 'rising_star' | 'enterprise_ready' | 'long_tenured';
export interface TrustReview {
  id: string;
  authorId: string;
  authorName?: string;
  subjectKind: TrustSubjectKind;
  subjectId: string;
  rating: number;
  title: string;
  body: string;
  pros: string[];
  cons: string[];
  status: TrustReviewStatus;
  helpful: number;
  unhelpful: number;
  responseBody?: string;
  disputeReason?: string;
  createdAt: string;
  updatedAt: string;
}
export interface TrustSummary {
  count: number;
  avg: number;
  distribution: Record<1|2|3|4|5, number>;
}
export interface TrustScore {
  score: {
    overall: number;
    band: 'platinum' | 'gold' | 'silver' | 'bronze' | 'new';
    dimensions: { key: string; label: string; score: number; trend: 'up'|'down'|'neutral' }[];
  };
  summary: TrustSummary;
  verifications: number;
  badges: number;
}
