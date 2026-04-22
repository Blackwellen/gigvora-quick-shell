// Domain 19 — Booking SDK types. Used via `new GigvoraClient().booking.*`.
export type BookingLinkStatus = 'active' | 'paused' | 'archived';
export type AppointmentStatus =
  | 'pending' | 'confirmed' | 'rescheduled' | 'cancelled'
  | 'completed' | 'no_show' | 'failed';
export type SlotState = 'open' | 'held' | 'booked' | 'blocked';

export interface SdkAvailabilityRule {
  day: number;
  from: string;
  to: string;
}

export interface SdkBookingLink {
  id: string;
  ownerId: string;
  slug: string;
  title: string;
  description?: string;
  durationMinutes: number;
  bufferMinutes: number;
  timezone: string;
  status: BookingLinkStatus;
  weekly: SdkAvailabilityRule[];
  blackouts: { date: string; reason?: string }[];
  maxPerDay?: number;
  requiresApproval: boolean;
  meetingProvider?: 'internal' | 'google' | 'microsoft' | 'zoom';
  createdAt: string;
  updatedAt: string;
}

export interface SdkTimeSlot {
  id: string;
  linkId: string;
  startAt: string;
  endAt: string;
  state: SlotState;
  holderId?: string;
  appointmentId?: string;
}

export interface SdkAppointment {
  id: string;
  linkId: string;
  ownerId: string;
  inviteeName: string;
  inviteeEmail: string;
  inviteeTimezone: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  meetingId?: string;
  joinUrl?: string;
  notes?: string;
  rescheduleCount: number;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SdkBookingInsights {
  source: 'python' | 'fallback';
  cards: { id: string; title: string; value: number; unit: string; trend: 'up' | 'down' | 'neutral' }[];
  anomalies: string[];
  generatedAt?: string;
}
