/**
 * Networking + Speed Networking + Events + Groups SDK namespace.
 * Use via `new GigvoraClient({ baseUrl }).networkingEventsGroups.<method>(...)`.
 */

export type RoomKind = 'open' | 'private' | 'speed' | 'event';
export type RoomStatus = 'draft' | 'scheduled' | 'live' | 'ended' | 'archived';
export type VideoProvider = 'jitsi' | 'livekit' | 'daily';
export type GroupVisibility = 'public' | 'private' | 'secret';
export type GroupJoinPolicy = 'open' | 'request' | 'invite_only';
export type EventStatus = 'draft' | 'published' | 'live' | 'completed' | 'cancelled';

export interface NetRoom {
  id: string;
  owner_identity_id: string;
  kind: RoomKind;
  status: RoomStatus;
  title: string;
  topic: string;
  starts_at: string | null;
  ends_at: string | null;
  capacity: number;
  video_provider: VideoProvider;
  is_paid: boolean;
  price_minor: number;
  currency: string;
  speed_round_seconds: number;
  speed_match_strategy: 'interest_overlap' | 'random' | 'industry';
  tags: string[];
}

export interface NetAttendee {
  id: string; room_id: string; identity_id: string;
  role: 'host' | 'cohost' | 'attendee' | 'observer';
  paid_status: 'free' | 'pending' | 'paid' | 'refunded';
  card_shared: boolean;
}

export interface SpeedMatch {
  id: string; room_id: string; round_index: number;
  identity_a: string; identity_b: string; score: number; reason: any;
}

export interface BusinessCard {
  id: string; owner_identity_id: string;
  display_name: string; headline: string;
  email?: string; phone?: string; website?: string;
  links: Array<{ label: string; url: string }>;
  avatar_url?: string; accent_color: string;
  visibility: 'public' | 'connections' | 'private';
  share_count: number;
}

export interface EventRow {
  id: string; host_identity_id: string;
  title: string; summary: string; status: EventStatus;
  starts_at: string; ends_at: string | null;
  format: 'virtual' | 'in_person' | 'hybrid';
  visibility: 'public' | 'network' | 'invited';
  capacity: number; rsvp_count: number;
  is_paid: boolean; price_minor: number; currency: string;
  cover_image_url: string | null;
  tags: string[];
}

export interface GroupRow {
  id: string; handle: string; display_name: string; about: string;
  visibility: GroupVisibility; join_policy: GroupJoinPolicy;
  member_count: number; post_count: number;
  status: 'active' | 'archived' | 'suspended';
  tags: string[];
}
