import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CallsRepository } from './calls.repository';
import { CallsAnalyticsService } from './calls.analytics.service';
import { CallsMlService } from './calls.ml.service';
import { AuditService } from '../workspace/audit.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { D15Emit } from '../domain-bus/domain-emissions';
import {
  CreateCallDto, UpdateCallDto, RescheduleDto,
  PresenceUpdateDto, ContactWindowUpsertDto,
} from './dto';

@Injectable()
export class CallsService {
  constructor(
    private readonly repo: CallsRepository,
    private readonly analytics: CallsAnalyticsService,
    private readonly ml: CallsMlService,
    private readonly audit: AuditService,
    private readonly realtime: NotificationsGateway,
  ) {}

  private emitCall(event: string, call: any) {
    this.realtime.emitToTopic('calls', event, { id: call.id, status: call.status, ts: Date.now() });
    if (call.id) this.realtime.emitToEntity('call', call.id, event, call);
    for (const pid of call.participantIds ?? []) this.realtime.emitToUser(pid, event, { id: call.id, status: call.status });
  }

  /* ── ML ─── */
  scoreQuality(input: { callId: string; bitrateKbps?: number; packetLossPct?: number; jitterMs?: number; rttMs?: number; durationSec?: number }) {
    return this.ml.scoreQuality(input);
  }
  noShowRisk(input: { appointmentId: string; minutesUntil: number; rescheduleCount?: number; inviteeConfirmed?: boolean; pastNoShows?: number }) {
    return this.ml.noShowRisk(input);
  }

  /* ── Calls ─── */
  list(actorId: string, filter: any) {
    return { items: this.repo.listCalls({ ...filter, hostId: actorId }), source: 'live' as const };
  }
  detail(id: string) {
    const c = this.repo.getCall(id);
    if (!c) throw new NotFoundException('Call not found');
    return c;
  }
  create(actorId: string, dto: CreateCallDto) {
    if (!dto.participantIds?.length) throw new BadRequestException('participantIds required');
    const rec = this.repo.createCall(actorId, dto);
    this.audit.record({ actor: actorId, action: 'call.create', target: rec.id, meta: { kind: rec.kind } });
    this.emitCall('call.created', rec);
    void D15Emit.created(actorId, rec.id, { kind: rec.kind, hostId: actorId, participantIds: rec.participantIds, scheduledAt: rec.scheduledAt });
    return rec;
  }
  update(actorId: string, id: string, dto: UpdateCallDto) {
    const rec = this.repo.updateCall(id, dto);
    if (!rec) throw new NotFoundException('Call not found');
    this.audit.record({ actor: actorId, action: 'call.update', target: id, meta: dto });
    this.emitCall('call.updated', rec);
    if ((dto as any).status === 'completed') void D15Emit.completed(actorId, id, { durationSeconds: (dto as any).durationSeconds, recordingUrl: (dto as any).recordingUrl });
    else void D15Emit.updated(actorId, id, { fields: Object.keys(dto ?? {}) });
    return rec;
  }
  reschedule(actorId: string, id: string, dto: RescheduleDto) {
    const rec = this.repo.reschedule(id, dto);
    if (!rec) throw new NotFoundException('Call not found');
    this.audit.record({ actor: actorId, action: 'call.reschedule', target: id, meta: dto });
    this.emitCall('call.rescheduled', rec);
    void D15Emit.rescheduled(actorId, id, { startsAt: (dto as any).startsAt, endsAt: (dto as any).endsAt });
    return rec;
  }
  cancel(actorId: string, id: string) {
    const rec = this.repo.cancelCall(id);
    if (!rec) throw new NotFoundException('Call not found');
    this.audit.record({ actor: actorId, action: 'call.cancel', target: id });
    this.emitCall('call.cancelled', rec);
    void D15Emit.cancelled(actorId, id, { callId: id });
    return rec;
  }
  end(actorId: string, id: string, durationSeconds: number, recordingUrl?: string) {
    return this.update(actorId, id, { status: 'completed', durationSeconds, recordingUrl, endedAt: new Date().toISOString() });
  }

  /* ── Presence ─── */
  presence(userIds: string[]) { return this.repo.getPresence(userIds); }
  setPresence(userId: string, dto: PresenceUpdateDto) {
    const rec = this.repo.updatePresence(userId, dto);
    this.realtime.emitToTopic('presence', 'presence.updated', { userId, status: dto.status, ts: Date.now() });
    void D15Emit.presence(userId, userId, { userId, status: dto.status });
    return rec;
  }

  /* ── Windows ─── */
  windows(ownerId: string) { return this.repo.listWindows(ownerId); }
  upsertWindow(actorId: string, id: string | null, dto: ContactWindowUpsertDto) {
    const rec = this.repo.upsertWindow(actorId, id, dto);
    this.audit.record({ actor: actorId, action: id ? 'contact-window.update' : 'contact-window.create', target: rec.id });
    void D15Emit.windowUpserted(actorId, rec.id, { ownerId: actorId, ...dto });
    return rec;
  }
  deleteWindow(actorId: string, id: string) {
    const ok = this.repo.deleteWindow(id);
    if (!ok) throw new NotFoundException('Contact window not found');
    this.audit.record({ actor: actorId, action: 'contact-window.delete', target: id });
    void D15Emit.windowDeleted(actorId, id, { ownerId: actorId });
    return { ok: true };
  }

  /* ── Insights ─── */
  insights(actorId: string) { return this.analytics.insights(this.repo.listCalls({ hostId: actorId })); }
}
