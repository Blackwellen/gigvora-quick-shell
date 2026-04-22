// Domain 19 — Calendar Booking, Scheduling & Time-Slot Management DTOs.
export type BookingLinkStatus = 'active' | 'paused' | 'archived';
export type AppointmentStatus =
  | 'pending' | 'confirmed' | 'rescheduled' | 'cancelled'
  | 'completed' | 'no_show' | 'failed';
export type SlotState = 'open' | 'held' | 'booked' | 'blocked';

export interface AvailabilityRule {
  day: number;          // 0-6
  from: string;         // "HH:mm"
  to: string;           // "HH:mm"
}

export interface BookingLink {
  id: string;
  ownerId: string;
  slug: string;
  title: string;
  description?: string;
  durationMinutes: number;
  bufferMinutes: number;
  timezone: string;
  status: BookingLinkStatus;
  weekly: AvailabilityRule[];
  blackouts: { date: string; reason?: string }[];
  maxPerDay?: number;
  requiresApproval: boolean;
  meetingProvider?: 'internal' | 'google' | 'microsoft' | 'zoom';
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  id: string;
  linkId: string;
  startAt: string;     // ISO
  endAt: string;
  state: SlotState;
  holderId?: string;
  appointmentId?: string;
}

export interface Appointment {
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

/* ── DTOs ────────────────────────────────────────────────── */
export interface CreateBookingLinkDto {
  slug: string;
  title: string;
  description?: string;
  durationMinutes: number;
  bufferMinutes?: number;
  timezone: string;
  weekly: AvailabilityRule[];
  blackouts?: BookingLink['blackouts'];
  maxPerDay?: number;
  requiresApproval?: boolean;
  meetingProvider?: BookingLink['meetingProvider'];
}

export interface UpdateBookingLinkDto extends Partial<CreateBookingLinkDto> {
  status?: BookingLinkStatus;
}

export interface CreateAppointmentDto {
  linkId: string;
  startAt: string;
  inviteeName: string;
  inviteeEmail: string;
  inviteeTimezone: string;
  notes?: string;
}

export interface RescheduleAppointmentDto {
  startAt: string;
  reason?: string;
}

export interface CancelAppointmentDto {
  reason?: string;
}

export interface AvailabilityQuery {
  linkId: string;
  from: string;        // ISO date
  to: string;          // ISO date
  inviteeTimezone?: string;
}
