// Domain 18 — Calls, Video, Presence DTOs
export type CallKind = 'voice' | 'video';
export type CallDirection = 'inbound' | 'outbound';
export type CallStatus = 'scheduled' | 'ringing' | 'active' | 'completed' | 'missed' | 'declined' | 'failed' | 'cancelled';
export type PresenceState = 'online' | 'away' | 'busy' | 'offline' | 'do_not_disturb';
export type ContactWindowStatus = 'open' | 'closed' | 'paused';

export interface CallRecord {
  id: string;
  hostId: string;
  participantIds: string[];
  kind: CallKind;
  direction: CallDirection;
  status: CallStatus;
  contextKind?: string;
  contextId?: string;
  contextLabel?: string;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  recordingUrl?: string;
  joinUrl?: string;
  provider?: 'gigvora' | 'zoom' | 'meet' | 'teams' | 'webex';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledCall extends CallRecord {
  status: 'scheduled';
  scheduledAt: string;
  rescheduleCount: number;
}

export interface PresenceSnapshot {
  userId: string;
  state: PresenceState;
  customStatus?: string;
  lastSeenAt: string;
  device?: 'web' | 'mobile' | 'desktop';
}

export interface ContactWindow {
  id: string;
  ownerId: string;
  label: string;
  timezone: string;
  status: ContactWindowStatus;
  weekly: { day: number; from: string; to: string }[];
  exceptions: { date: string; closed: boolean; from?: string; to?: string }[];
  bufferMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCallDto {
  participantIds: string[];
  kind: CallKind;
  contextKind?: string;
  contextId?: string;
  contextLabel?: string;
  scheduledAt?: string;
  provider?: CallRecord['provider'];
  notes?: string;
}

export interface UpdateCallDto {
  status?: CallStatus;
  notes?: string;
  recordingUrl?: string;
  endedAt?: string;
  durationSeconds?: number;
}

export interface RescheduleDto {
  scheduledAt: string;
  reason?: string;
}

export interface PresenceUpdateDto {
  state: PresenceState;
  customStatus?: string;
  device?: PresenceSnapshot['device'];
}

export interface ContactWindowUpsertDto {
  label: string;
  timezone: string;
  weekly: ContactWindow['weekly'];
  exceptions?: ContactWindow['exceptions'];
  bufferMinutes?: number;
  status?: ContactWindowStatus;
}
