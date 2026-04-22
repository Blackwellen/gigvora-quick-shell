/** Typed SDK for Enterprise Connect & Startup Showcase. */
export type EcOrgKind = 'enterprise' | 'startup' | 'scaleup' | 'sme';
export type EcOrgStatus = 'draft' | 'active' | 'paused' | 'archived';
export type EcVisibility = 'public' | 'network' | 'private';
export type EcBriefStatus = 'draft' | 'open' | 'shortlisting' | 'awarded' | 'closed' | 'archived';
export type EcIntroStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'completed' | 'cancelled';
export type EcRoomStatus = 'draft' | 'scheduled' | 'live' | 'ended' | 'archived';
export type EcEventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface EcOrgProfile {
  id: string;
  ownerIdentityId: string;
  kind: EcOrgKind;
  status: EcOrgStatus;
  handle: string;
  legalName: string;
  displayName: string;
  tagline: string;
  about: string;
  industry?: string | null;
  hqCountry?: string | null;
  hqCity?: string | null;
  sizeBand?: string | null;
  fundingStage?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  capabilities: string[];
  certifications: string[];
  contacts: { role: string; name: string; email?: string; phone?: string }[];
  visibility: EcVisibility;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EcDirectoryItem {
  id: string;
  handle: string;
  display_name: string;
  kind: EcOrgKind;
  industry?: string | null;
  hq_country?: string | null;
  hq_city?: string | null;
  logo_url?: string | null;
  tagline: string;
  size_band?: string | null;
  funding_stage?: string | null;
  tags: string[];
  highlights: string[];
  region?: string | null;
}

export interface EcPartner {
  id: string;
  org_id_a: string;
  org_id_b: string;
  relation_kind: 'partner' | 'supplier' | 'reseller' | 'technology';
  status: 'proposed' | 'active' | 'paused' | 'ended';
  match_score: number;
  match_reason: Record<string, unknown>;
  a_name: string; a_logo?: string | null;
  b_name: string; b_logo?: string | null;
  created_at: string;
}

export interface EcProcurementBrief {
  id: string;
  buyer_org_id: string;
  owner_identity_id: string;
  title: string;
  summary: string;
  category?: string | null;
  budget_minor?: number | null;
  currency: string;
  status: EcBriefStatus;
  due_at?: string | null;
  requirements: string[];
  visibility: 'public' | 'network' | 'invited';
  invited_org_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface EcIntro {
  id: string;
  requester_identity_id: string;
  broker_identity_id: string;
  target_identity_id: string;
  context_org_id?: string | null;
  status: EcIntroStatus;
  reason: string;
  message: string;
  decline_reason?: string | null;
  expires_at?: string | null;
  decided_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface EcRoom {
  id: string;
  owner_org_id: string;
  owner_identity_id: string;
  kind: 'boardroom' | 'dealroom' | 'private' | 'event';
  status: EcRoomStatus;
  title: string;
  agenda: string;
  starts_at?: string | null;
  ends_at?: string | null;
  video_provider: 'jitsi' | 'livekit' | 'daily';
  video_room_id?: string | null;
  capacity: number;
  invited_identity_ids: string[];
  recording_url?: string | null;
}

export interface EcEvent {
  id: string;
  host_org_id: string;
  owner_identity_id: string;
  title: string;
  summary: string;
  status: EcEventStatus;
  starts_at: string;
  ends_at?: string | null;
  format: 'virtual' | 'in_person' | 'hybrid';
  visibility: 'public' | 'network' | 'invited';
  capacity: number;
  rsvp_count: number;
}

export interface EcStartup {
  id: string;
  org_id: string;
  display_name: string;
  handle: string;
  tagline: string;
  industry?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  hq_country?: string | null;
  hq_city?: string | null;
  funding_stage?: string | null;
  pitch_one_liner: string;
  pitch_deck_url?: string | null;
  product_demo_url?: string | null;
  fundraising: Record<string, unknown>;
  traction: Record<string, unknown>;
  team: { name: string; role: string; linkedinUrl?: string }[];
  showcase_rank: number;
  computed_rank?: number;
  featured: boolean;
}

export interface EcEnvelope<T> { items: T[]; meta?: { source?: string; model?: string; count?: number } }
export interface EcOverview {
  hasOrg: boolean;
  org: EcOrgProfile | null;
  counts: { partners: number; briefs: number; intros: number; rooms: number; events: number };
  meta: { source: string; model: string };
}
