import { Injectable } from '@nestjs/common';
import {
  BookingLink, TimeSlot, Appointment,
  CreateBookingLinkDto, UpdateBookingLinkDto,
} from './dto';

/**
 * In-memory store for Domain 19 (Calendar Booking & Time-Slot Management).
 * Mirrors production-shaped APIs while persistence is being wired.
 * Seeds realistic demo data so the frontend can render believable states.
 */
@Injectable()
export class BookingRepository {
  private links = new Map<string, BookingLink>();
  private appts = new Map<string, Appointment>();
  private slots = new Map<string, TimeSlot>();   // generated lazily by service

  constructor() { this.seed(); }

  /* ── Links ─── */
  listLinks(ownerId: string): BookingLink[] {
    return [...this.links.values()].filter(l => l.ownerId === ownerId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  getLink(id: string) { return this.links.get(id) ?? null; }
  getLinkBySlug(slug: string) {
    for (const l of this.links.values()) if (l.slug === slug) return l;
    return null;
  }
  createLink(ownerId: string, dto: CreateBookingLinkDto): BookingLink {
    const id = `bl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const link: BookingLink = {
      id, ownerId, slug: dto.slug, title: dto.title, description: dto.description,
      durationMinutes: dto.durationMinutes, bufferMinutes: dto.bufferMinutes ?? 10,
      timezone: dto.timezone, status: 'active',
      weekly: dto.weekly, blackouts: dto.blackouts ?? [],
      maxPerDay: dto.maxPerDay, requiresApproval: dto.requiresApproval ?? false,
      meetingProvider: dto.meetingProvider ?? 'internal',
      createdAt: now, updatedAt: now,
    };
    this.links.set(id, link);
    return link;
  }
  updateLink(id: string, dto: UpdateBookingLinkDto): BookingLink | null {
    const cur = this.links.get(id); if (!cur) return null;
    const next: BookingLink = { ...cur, ...dto, updatedAt: new Date().toISOString() };
    this.links.set(id, next);
    return next;
  }
  archiveLink(id: string) { return this.updateLink(id, { status: 'archived' }); }

  /* ── Appointments ─── */
  listAppointments(filter: { ownerId?: string; linkId?: string; status?: string } = {}): Appointment[] {
    let rows = [...this.appts.values()];
    if (filter.ownerId) rows = rows.filter(a => a.ownerId === filter.ownerId);
    if (filter.linkId) rows = rows.filter(a => a.linkId === filter.linkId);
    if (filter.status) rows = rows.filter(a => a.status === filter.status);
    return rows.sort((a, b) => a.startAt.localeCompare(b.startAt));
  }
  getAppointment(id: string) { return this.appts.get(id) ?? null; }
  saveAppointment(a: Appointment) { this.appts.set(a.id, a); return a; }

  /* ── Slot holds (in-memory) ─── */
  holdSlot(slot: TimeSlot) { this.slots.set(slot.id, slot); }
  releaseSlot(id: string) { this.slots.delete(id); }
  heldSlotsFor(linkId: string): TimeSlot[] {
    return [...this.slots.values()].filter(s => s.linkId === linkId);
  }

  /* ── Seed ─── */
  private seed() {
    const now = new Date();
    const link: BookingLink = {
      id: 'bl_demo', ownerId: 'demo_user', slug: 'intro-30',
      title: 'Intro call (30 min)', description: 'A quick intro to scope your project.',
      durationMinutes: 30, bufferMinutes: 10, timezone: 'Europe/London',
      status: 'active',
      weekly: [1, 2, 3, 4, 5].map(d => ({ day: d, from: '09:00', to: '17:00' })),
      blackouts: [], requiresApproval: false, meetingProvider: 'internal',
      createdAt: new Date(now.getTime() - 14 * 86_400_000).toISOString(),
      updatedAt: new Date(now.getTime() - 14 * 86_400_000).toISOString(),
    };
    this.links.set(link.id, link);

    const longLink: BookingLink = {
      ...link, id: 'bl_strategy', slug: 'strategy-60',
      title: 'Strategy session (60 min)', durationMinutes: 60,
      bufferMinutes: 15, requiresApproval: true,
    };
    this.links.set(longLink.id, longLink);

    // Seed a couple of appointments
    const day = (d: number, h: number) => {
      const t = new Date(now); t.setDate(t.getDate() + d); t.setHours(h, 0, 0, 0);
      return t.toISOString();
    };
    const seedAppt = (i: number, status: Appointment['status'], offset: number, h: number, name: string): Appointment => ({
      id: `appt_seed_${i}`, linkId: link.id, ownerId: 'demo_user',
      inviteeName: name, inviteeEmail: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      inviteeTimezone: 'Europe/London',
      startAt: day(offset, h), endAt: day(offset, h + 1),
      status, rescheduleCount: 0,
      joinUrl: `/m/seed_${i}`, meetingId: `meet_seed_${i}`,
      createdAt: day(-3, 10), updatedAt: day(-3, 10),
    });
    [
      seedAppt(1, 'confirmed', 1, 10, 'Sarah Chen'),
      seedAppt(2, 'pending', 2, 14, 'Marcus Johnson'),
      seedAppt(3, 'completed', -2, 11, 'Elena Ruiz'),
      seedAppt(4, 'cancelled', -1, 15, 'Alex Kim'),
    ].forEach(a => this.appts.set(a.id, a));
  }
}
