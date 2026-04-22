import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingRepository } from './booking.repository';
import { BookingAnalyticsService } from './booking.analytics.service';
import { BookingMlService } from './booking.ml.service';
import { CalendarService } from '../calendar/calendar.service';
import { AuditService } from '../workspace/audit.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { D19Emit } from '../domain-bus/domain-emissions';
import {
  Appointment, BookingLink, TimeSlot, AvailabilityQuery,
  CreateAppointmentDto, CreateBookingLinkDto, UpdateBookingLinkDto,
  RescheduleAppointmentDto, CancelAppointmentDto,
} from './dto';

@Injectable()
export class BookingService {
  constructor(
    private readonly repo: BookingRepository,
    private readonly analytics: BookingAnalyticsService,
    private readonly ml: BookingMlService,
    private readonly calendar: CalendarService,
    private readonly audit: AuditService,
    private readonly realtime: NotificationsGateway,
  ) {}

  private emitAppt(event: string, appt: Appointment) {
    this.realtime.emitToUser(appt.ownerId, event, { id: appt.id, status: appt.status, startAt: appt.startAt });
    this.realtime.emitToEntity('appointment', appt.id, event, appt);
    this.realtime.emitToTopic(`booking-link:${appt.linkId}`, event, { id: appt.id, status: appt.status });
  }

  /* ── ML ─── */
  rankSlots(input: { inviteeTimezone?: string; preferMorning?: boolean; slots: { id: string; startAt: string; hourLocal: number }[] }) {
    return this.ml.rankSlots(input);
  }
  cancellationRisk(id: string) {
    const a = this.repo.getAppointment(id);
    if (!a) throw new NotFoundException('Appointment not found');
    const leadTimeHours = (Date.parse(a.startAt) - Date.now()) / 3_600_000;
    return this.ml.cancellationRisk({ appointmentId: id, rescheduleCount: a.rescheduleCount, leadTimeHours });
  }

  /* ── Booking links ─── */
  listLinks(ownerId: string) { return this.repo.listLinks(ownerId); }
  getLink(id: string) {
    const l = this.repo.getLink(id);
    if (!l) throw new NotFoundException('Booking link not found');
    return l;
  }
  publicLink(slug: string) {
    const l = this.repo.getLinkBySlug(slug);
    if (!l || l.status !== 'active') throw new NotFoundException('Booking link not available');
    return l;
  }
  createLink(actorId: string, dto: CreateBookingLinkDto) {
    if (dto.durationMinutes < 5 || dto.durationMinutes > 480) {
      throw new BadRequestException('durationMinutes must be 5–480');
    }
    const link = this.repo.createLink(actorId, dto);
    this.audit.record({ actor: actorId, action: 'booking-link.create', target: link.id });
    void D19Emit.linkCreated(actorId, link.id, { ownerId: actorId, slug: (link as any).slug, durationMinutes: link.durationMinutes });
    return link;
  }
  updateLink(actorId: string, id: string, dto: UpdateBookingLinkDto) {
    const link = this.repo.updateLink(id, dto);
    if (!link) throw new NotFoundException('Booking link not found');
    this.audit.record({ actor: actorId, action: 'booking-link.update', target: id, meta: dto });
    void D19Emit.linkUpdated(actorId, id, { fields: Object.keys(dto ?? {}) });
    return link;
  }
  archiveLink(actorId: string, id: string) {
    const link = this.repo.archiveLink(id);
    if (!link) throw new NotFoundException('Booking link not found');
    this.audit.record({ actor: actorId, action: 'booking-link.archive', target: id });
    void D19Emit.linkArchived(actorId, id, {});
    return link;
  }

  /* ── Availability ─── */
  availability(q: AvailabilityQuery): TimeSlot[] {
    const link = this.getLink(q.linkId);
    const from = new Date(q.from); const to = new Date(q.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException('Invalid from/to');
    }
    if (to.getTime() - from.getTime() > 31 * 86_400_000) {
      throw new BadRequestException('Window cannot exceed 31 days');
    }
    const slots: TimeSlot[] = [];
    const heldOrBooked = new Set([
      ...this.repo.heldSlotsFor(link.id).map(s => s.startAt),
      ...this.repo.listAppointments({ linkId: link.id })
        .filter(a => a.status !== 'cancelled' && a.status !== 'no_show')
        .map(a => a.startAt),
    ]);
    const blackoutDates = new Set(link.blackouts.map(b => b.date));
    const stepMs = (link.durationMinutes + link.bufferMinutes) * 60_000;
    const cursor = new Date(from);
    while (cursor < to) {
      const day = cursor.getUTCDay();
      const isoDate = cursor.toISOString().slice(0, 10);
      if (!blackoutDates.has(isoDate)) {
        const rules = link.weekly.filter(r => r.day === day);
        for (const rule of rules) {
          const [fh, fm] = rule.from.split(':').map(Number);
          const [th, tm] = rule.to.split(':').map(Number);
          const dayStart = new Date(cursor); dayStart.setUTCHours(fh, fm, 0, 0);
          const dayEnd = new Date(cursor); dayEnd.setUTCHours(th, tm, 0, 0);
          for (let t = dayStart.getTime(); t + link.durationMinutes * 60_000 <= dayEnd.getTime(); t += stepMs) {
            const startAt = new Date(t).toISOString();
            const endAt = new Date(t + link.durationMinutes * 60_000).toISOString();
            slots.push({
              id: `slot_${link.id}_${t}`, linkId: link.id, startAt, endAt,
              state: heldOrBooked.has(startAt) ? 'booked' : 'open',
            });
          }
        }
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      cursor.setUTCHours(0, 0, 0, 0);
    }
    return slots;
  }

  /* ── Appointments ─── */
  listAppointments(ownerId: string, filter: { linkId?: string; status?: string } = {}) {
    return { items: this.repo.listAppointments({ ownerId, ...filter }), source: 'live' as const };
  }
  detail(id: string) {
    const a = this.repo.getAppointment(id);
    if (!a) throw new NotFoundException('Appointment not found');
    return a;
  }

  book(actorId: string | null, dto: CreateAppointmentDto): Appointment {
    const link = this.getLink(dto.linkId);
    const startMs = Date.parse(dto.startAt);
    if (!Number.isFinite(startMs)) throw new BadRequestException('Invalid startAt');
    const endAt = new Date(startMs + link.durationMinutes * 60_000).toISOString();

    // Conflict check
    const conflict = this.repo.listAppointments({ linkId: link.id })
      .find(a => a.startAt === dto.startAt && a.status !== 'cancelled' && a.status !== 'no_show');
    if (conflict) throw new ConflictException('Slot already booked');

    const id = `appt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const meeting = this.calendar.schedule({
      domain: 'inquiry', refId: id, title: link.title,
      startAt: dto.startAt, endAt, timezone: link.timezone,
      organizerEmail: `${link.ownerId}@gigvora.local`,
      attendees: [dto.inviteeEmail],
      provider: link.meetingProvider,
      idempotencyKey: `${dto.linkId}|${dto.startAt}|${dto.inviteeEmail}`,
    });

    const appt: Appointment = {
      id, linkId: link.id, ownerId: link.ownerId,
      inviteeName: dto.inviteeName, inviteeEmail: dto.inviteeEmail,
      inviteeTimezone: dto.inviteeTimezone,
      startAt: dto.startAt, endAt,
      status: link.requiresApproval ? 'pending' : 'confirmed',
      meetingId: meeting.id, joinUrl: meeting.joinUrl,
      notes: dto.notes, rescheduleCount: 0,
      createdAt: now, updatedAt: now,
    };
    this.repo.saveAppointment(appt);
    this.audit.record({ actor: actorId ?? dto.inviteeEmail, action: 'appointment.create', target: id, meta: { linkId: link.id } });
    this.emitAppt('appointment.created', appt);
    void D19Emit.appointmentCreated(link.ownerId, appt.id, { linkId: link.id, ownerId: link.ownerId, inviteeEmail: dto.inviteeEmail, startAt: appt.startAt, status: appt.status });
    return appt;
  }

  approve(actorId: string, id: string) {
    const a = this.detail(id);
    if (a.status !== 'pending') throw new BadRequestException('Only pending appointments can be approved');
    const next = { ...a, status: 'confirmed' as const, updatedAt: new Date().toISOString() };
    this.repo.saveAppointment(next);
    this.audit.record({ actor: actorId, action: 'appointment.approve', target: id });
    this.emitAppt('appointment.approved', next);
    void D19Emit.appointmentApproved(actorId, id, { ownerId: a.ownerId, inviteeEmail: a.inviteeEmail });
    return next;
  }
  reject(actorId: string, id: string, reason?: string) {
    const a = this.detail(id);
    const next = { ...a, status: 'cancelled' as const, cancelReason: reason ?? 'Rejected by owner', updatedAt: new Date().toISOString() };
    this.repo.saveAppointment(next);
    if (a.meetingId) this.calendar.cancel(a.meetingId, reason);
    this.audit.record({ actor: actorId, action: 'appointment.reject', target: id });
    this.emitAppt('appointment.rejected', next);
    void D19Emit.appointmentRejected(actorId, id, { reason: reason ?? null });
    return next;
  }
  reschedule(actorId: string | null, id: string, dto: RescheduleAppointmentDto) {
    const a = this.detail(id);
    const link = this.getLink(a.linkId);
    const newEnd = new Date(Date.parse(dto.startAt) + link.durationMinutes * 60_000).toISOString();
    const next: Appointment = {
      ...a, startAt: dto.startAt, endAt: newEnd,
      status: 'rescheduled', rescheduleCount: a.rescheduleCount + 1,
      updatedAt: new Date().toISOString(),
      notes: dto.reason ? `[Rescheduled] ${dto.reason}\n${a.notes ?? ''}`.trim() : a.notes,
    };
    if (a.meetingId) this.calendar.reschedule(a.meetingId, dto.startAt, newEnd);
    this.repo.saveAppointment(next);
    this.audit.record({ actor: actorId ?? a.inviteeEmail, action: 'appointment.reschedule', target: id });
    this.emitAppt('appointment.rescheduled', next);
    void D19Emit.appointmentRescheduled(actorId ?? a.ownerId, id, { startAt: dto.startAt, endAt: newEnd, reason: dto.reason ?? null });
    return next;
  }
  cancel(actorId: string | null, id: string, dto: CancelAppointmentDto = {}) {
    const a = this.detail(id);
    const next: Appointment = { ...a, status: 'cancelled', cancelReason: dto.reason, updatedAt: new Date().toISOString() };
    if (a.meetingId) this.calendar.cancel(a.meetingId, dto.reason);
    this.repo.saveAppointment(next);
    this.audit.record({ actor: actorId ?? a.inviteeEmail, action: 'appointment.cancel', target: id, meta: dto });
    this.emitAppt('appointment.cancelled', next);
    void D19Emit.appointmentCancelled(actorId ?? a.ownerId, id, { reason: dto.reason ?? null });
    return next;
  }
  markCompleted(actorId: string, id: string) {
    const a = this.detail(id);
    const next: Appointment = { ...a, status: 'completed', updatedAt: new Date().toISOString() };
    this.repo.saveAppointment(next);
    this.audit.record({ actor: actorId, action: 'appointment.complete', target: id });
    this.emitAppt('appointment.completed', next);
    void D19Emit.appointmentCompleted(actorId, id, { ownerId: a.ownerId, inviteeEmail: a.inviteeEmail });
    return next;
  }
  markNoShow(actorId: string, id: string) {
    const a = this.detail(id);
    const next: Appointment = { ...a, status: 'no_show', updatedAt: new Date().toISOString() };
    this.repo.saveAppointment(next);
    this.audit.record({ actor: actorId, action: 'appointment.no_show', target: id });
    this.emitAppt('appointment.no_show', next);
    void D19Emit.appointmentNoShow(actorId, id, { ownerId: a.ownerId });
    return next;
  }

  insights(ownerId: string) {
    return this.analytics.insights(this.repo.listAppointments({ ownerId }));
  }
}
