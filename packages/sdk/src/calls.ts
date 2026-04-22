// Domain 18 — Calls / Video / Presence / Contact Windows SDK types.
// Used via `new GigvoraClient().calls.*` (see packages/sdk/src/index.ts).
export type CallKind = 'voice' | 'video';
export type CallDirection = 'inbound' | 'outbound';
export type CallStatus = 'scheduled' | 'ringing' | 'active' | 'completed' | 'missed' | 'declined' | 'failed' | 'cancelled';
export type PresenceState = 'online' | 'away' | 'busy' | 'offline' | 'do_not_disturb';
export type ContactWindowStatus = 'open' | 'closed' | 'paused';

export interface SdkCallRecord {
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

export interface SdkPresenceSnapshot {
  userId: string;
  state: PresenceState;
  customStatus?: string;
  lastSeenAt: string;
  device?: 'web' | 'mobile' | 'desktop';
}

export interface SdkContactWindow {
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

export interface SdkCallInsights {
  source: 'python' | 'fallback';
  cards: { id: string; title: string; value: number; unit: string; trend: 'up' | 'down' | 'neutral' }[];
  anomalies: string[];
  generatedAt?: string;
}
