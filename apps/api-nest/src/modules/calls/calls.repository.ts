import { Injectable } from '@nestjs/common';
import {
  CallRecord, ContactWindow, PresenceSnapshot, CreateCallDto, UpdateCallDto,
  RescheduleDto, PresenceUpdateDto, ContactWindowUpsertDto,
} from './dto';

/**
 * In-memory repository for Domain 18 (Calls, Video, Presence, Contact Windows).
 * Mirrors the production-shaped API while the persistence layer is being wired.
 * Seeds realistic demo records so the frontend renders believable states.
 */
@Injectable()
export class CallsRepository {
  private calls = new Map<string, CallRecord>();
  private presence = new Map<string, PresenceSnapshot>();
  private windows = new Map<string, ContactWindow>();

  constructor() { this.seed(); }

  /* ── Calls ─────────────────────────────────────────── */
  listCalls(filter: { hostId?: string; status?: string; kind?: string; q?: string } = {}): CallRecord[] {
    let rows = [...this.calls.values()];
    if (filter.hostId) rows = rows.filter(r => r.hostId === filter.hostId || r.participantIds.includes(filter.hostId!));
    if (filter.status) rows = rows.filter(r => r.status === filter.status);
    if (filter.kind) rows = rows.filter(r => r.kind === filter.kind);
    if (filter.q) {
      const q = filter.q.toLowerCase();
      rows = rows.filter(r => (r.contextLabel ?? '').toLowerCase().includes(q) || (r.notes ?? '').toLowerCase().includes(q));
    }
    return rows.sort((a, b) => (b.scheduledAt ?? b.createdAt).localeCompare(a.scheduledAt ?? a.createdAt));
  }
  getCall(id: string) { return this.calls.get(id) ?? null; }
  createCall(hostId: string, dto: CreateCallDto): CallRecord {
    const id = `call_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const rec: CallRecord = {
      id, hostId, participantIds: dto.participantIds,
      kind: dto.kind, direction: 'outbound',
      status: dto.scheduledAt ? 'scheduled' : 'ringing',
      contextKind: dto.contextKind, contextId: dto.contextId, contextLabel: dto.contextLabel,
      scheduledAt: dto.scheduledAt, provider: dto.provider ?? 'gigvora',
      joinUrl: `https://meet.gigvora.com/${id}`, notes: dto.notes,
      createdAt: now, updatedAt: now,
    };
    this.calls.set(id, rec);
    return rec;
  }
  updateCall(id: string, dto: UpdateCallDto): CallRecord | null {
    const cur = this.calls.get(id); if (!cur) return null;
    const next: CallRecord = { ...cur, ...dto, updatedAt: new Date().toISOString() };
    if (dto.status === 'completed' && !next.endedAt) next.endedAt = new Date().toISOString();
    this.calls.set(id, next);
    return next;
  }
  reschedule(id: string, dto: RescheduleDto): CallRecord | null {
    const cur = this.calls.get(id); if (!cur) return null;
    const next: CallRecord = { ...cur, scheduledAt: dto.scheduledAt, status: 'scheduled', updatedAt: new Date().toISOString(), notes: dto.reason ? `[Rescheduled] ${dto.reason}` : cur.notes };
    this.calls.set(id, next);
    return next;
  }
  cancelCall(id: string): CallRecord | null { return this.updateCall(id, { status: 'cancelled' }); }

  /* ── Presence ──────────────────────────────────────── */
  getPresence(userIds: string[]): PresenceSnapshot[] {
    return userIds.map(id => this.presence.get(id) ?? { userId: id, state: 'offline', lastSeenAt: new Date(0).toISOString() });
  }
  updatePresence(userId: string, dto: PresenceUpdateDto): PresenceSnapshot {
    const snap: PresenceSnapshot = { userId, ...dto, lastSeenAt: new Date().toISOString() };
    this.presence.set(userId, snap);
    return snap;
  }

  /* ── Contact Windows ───────────────────────────────── */
  listWindows(ownerId: string): ContactWindow[] {
    return [...this.windows.values()].filter(w => w.ownerId === ownerId);
  }
  upsertWindow(ownerId: string, id: string | null, dto: ContactWindowUpsertDto): ContactWindow {
    const now = new Date().toISOString();
    const existing = id ? this.windows.get(id) : null;
    const rec: ContactWindow = {
      id: id ?? `cw_${Date.now().toString(36)}`,
      ownerId, label: dto.label, timezone: dto.timezone,
      status: dto.status ?? 'open',
      weekly: dto.weekly, exceptions: dto.exceptions ?? [],
      bufferMinutes: dto.bufferMinutes ?? 15,
      createdAt: existing?.createdAt ?? now, updatedAt: now,
    };
    this.windows.set(rec.id, rec);
    return rec;
  }
  deleteWindow(id: string): boolean { return this.windows.delete(id); }

  /* ── Seed data ─────────────────────────────────────── */
  private seed() {
    const now = Date.now();
    const mk = (i: number, kind: 'voice' | 'video', status: CallRecord['status'], minsAgo: number, p: string, ctx?: string): CallRecord => ({
      id: `seed_call_${i}`, hostId: 'demo_user', participantIds: [p],
      kind, direction: i % 2 ? 'inbound' : 'outbound', status,
      contextLabel: ctx, scheduledAt: new Date(now - minsAgo * 60_000).toISOString(),
      startedAt: status !== 'scheduled' ? new Date(now - minsAgo * 60_000).toISOString() : undefined,
      endedAt: status === 'completed' ? new Date(now - (minsAgo - 30) * 60_000).toISOString() : undefined,
      durationSeconds: status === 'completed' ? 60 * 30 : undefined,
      provider: 'gigvora', joinUrl: `https://meet.gigvora.com/seed_call_${i}`,
      createdAt: new Date(now - minsAgo * 60_000).toISOString(),
      updatedAt: new Date(now - minsAgo * 60_000).toISOString(),
    });
    [
      mk(1, 'video', 'completed', 120, 'sarah_chen', 'Project: Brand Refresh'),
      mk(2, 'voice', 'completed', 240, 'marcus_j', 'Hiring: Frontend Dev'),
      mk(3, 'video', 'missed', 300, 'elena_r'),
      mk(4, 'voice', 'declined', 1440, 'alex_kim'),
      mk(5, 'video', 'scheduled', -180, 'sarah_chen', 'Project Review'),
      mk(6, 'video', 'scheduled', -1440, 'alex_kim', 'Partnership Discussion'),
      mk(7, 'voice', 'failed', 2880, 'priya_p'),
    ].forEach(c => this.calls.set(c.id, c));

    ['sarah_chen', 'marcus_j', 'elena_r', 'alex_kim', 'priya_p'].forEach((u, i) => {
      const states: PresenceSnapshot['state'][] = ['online', 'busy', 'away', 'online', 'offline'];
      this.presence.set(u, { userId: u, state: states[i], lastSeenAt: new Date(now - i * 60_000).toISOString(), device: 'web' });
    });

    this.windows.set('cw_default', {
      id: 'cw_default', ownerId: 'demo_user', label: 'Standard hours',
      timezone: 'Europe/London', status: 'open',
      weekly: [1, 2, 3, 4, 5].map(d => ({ day: d, from: '09:00', to: '18:00' })),
      exceptions: [], bufferMinutes: 15,
      createdAt: new Date(now - 30 * 86_400_000).toISOString(),
      updatedAt: new Date(now).toISOString(),
    });
  }
}
