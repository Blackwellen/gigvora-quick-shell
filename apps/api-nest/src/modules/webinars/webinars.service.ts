import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { WebinarsRepository, type WebinarRow } from './webinars.repository';
import { WebinarsMlService } from './webinars.ml.service';
import { WebinarsAnalyticsService } from './webinars.analytics.service';
import { D18Emit } from '../domain-bus/domain-emissions';
import type { DiscoveryFilters, WebinarCreate } from './dto';

/**
 * Domain 22 application service.
 *
 * Surfaces:
 *   - discovery (search + facets + ML rank)
 *   - lifecycle (create/transition/ended → replay)
 *   - registrations + multi-step purchase + donations
 *   - live room metadata (Jitsi room name + chat ring buffer)
 *   - replays (local-first storage URL by default; promotable to R2/S3 later)
 *
 * Emits Socket.IO events through NotificationsGateway:
 *   webinar.live.started, webinar.live.ended, webinar.chat.message,
 *   webinar.purchase.confirmed, webinar.donation.captured,
 *   webinar.registration.created
 */
@Injectable()
export class WebinarsService {
  private readonly log = new Logger('WebinarsService');
  constructor(
    private readonly repo: WebinarsRepository,
    private readonly ml: WebinarsMlService,
    private readonly analytics: WebinarsAnalyticsService,
    @Optional() @Inject('NOTIFICATIONS_GATEWAY') private readonly gateway?: {
      emitToTopic: (t: string, e: string, p: any) => void;
      emitToUser: (u: string, e: string, p: any) => void;
    },
  ) {}

  async discover(filters: DiscoveryFilters, identityId?: string) {
    const filtered = this.repo.filter({ q: filters.q, status: filters.status, topic: filters.topic, price: filters.price });
    const { rows, mode } = await this.ml.rank(filtered, filters, identityId);
    const start = (filters.page - 1) * filters.pageSize;
    const page = rows.slice(start, start + filters.pageSize).map(this.toPublic);
    const facets = filters.facetMode === 'none' ? null : this.repo.computeFacets(rows);
    return { results: page, total: rows.length, page: filters.page, pageSize: filters.pageSize, facets, rankingMode: mode, generatedAt: new Date().toISOString() };
  }

  async recommend(identityId?: string) {
    const { rows, mode } = await this.ml.recommend(identityId, this.repo.list());
    return { rows: rows.map(this.toPublic), mode };
  }

  insights(identityId?: string) { return this.analytics.insights(identityId); }

  detail(id: string) {
    const w = this.repo.byId(id); if (!w) return null;
    return { ...this.toPublic(w), donations: this.repo.donationsFor(id).slice(-25) };
  }

  create(hostId: string, hostName: string, payload: WebinarCreate) {
    const row = this.repo.create(hostId, hostName, payload);
    this.gateway?.emitToTopic('webinars', 'webinar.created', { id: row.id, title: row.title });
    void D18Emit.created(hostId, row.id, { title: row.title, hostId, startsAt: row.startsAt, ticketKind: row.ticketKind });
    return this.toPublic(row);
  }

  transition(id: string, next: WebinarRow['status']) {
    const w = this.repo.transition(id, next);
    if (w) {
      if (next === 'live') this.gateway?.emitToTopic(`webinar:${id}`, 'webinar.live.started', { id, jitsiRoom: w.jitsiRoom });
      if (next === 'ended') this.gateway?.emitToTopic(`webinar:${id}`, 'webinar.live.ended', { id, replayUrl: w.replayUrl });
      void D18Emit.transitioned(w.hostId, id, { status: next });
      if (next === 'live') void D18Emit.liveStarted(w.hostId, id, { jitsiRoom: w.jitsiRoom });
      if (next === 'ended') {
        void D18Emit.liveEnded(w.hostId, id, { replayUrl: w.replayUrl });
        if (w.replayUrl) void D18Emit.replayPublished(w.hostId, id, { replayUrl: w.replayUrl, replayDurationSec: w.replayDurationSec });
      }
    }
    return w ? this.toPublic(w) : null;
  }

  register(webinarId: string, identityId: string) {
    const out = this.repo.register(webinarId, identityId);
    if (out.ok) {
      this.gateway?.emitToTopic(`webinar:${webinarId}`, 'webinar.registration.created', { webinarId, identityId });
      void D18Emit.registrationCreated(identityId, `${webinarId}:${identityId}`, { webinarId, identityId });
    }
    return out;
  }

  // Multi-step purchase per payment-checkout-pattern rule
  createPurchase(webinarId: string, buyerId: string, quantity: number) {
    const p = this.repo.createPurchase(webinarId, buyerId, quantity);
    void D18Emit.purchaseCreated(buyerId, (p as any)?.id ?? `${webinarId}:${buyerId}`, { webinarId, buyerId, quantity });
    return p;
  }
  confirmPurchase(purchaseId: string, buyerId: string) {
    const p = this.repo.confirmPurchase(purchaseId, buyerId);
    this.gateway?.emitToUser(buyerId, 'webinar.purchase.confirmed', { id: p.id, webinarId: p.webinarId });
    void D18Emit.purchaseConfirmed(buyerId, p.id, { webinarId: p.webinarId, buyerId });
    return p;
  }
  listPurchases(buyerId: string) { return this.repo.listPurchases(buyerId); }

  donate(webinarId: string, donorId: string | null, amountCents: number, currency: string, message: string | undefined, anonymous: boolean) {
    const d = this.repo.donate(webinarId, donorId, amountCents, currency, message, anonymous);
    this.gateway?.emitToTopic(`webinar:${webinarId}`, 'webinar.donation.captured', { id: d.id, amountCents, anonymous });
    void D18Emit.donationCaptured(donorId ?? 'anonymous', d.id, { webinarId, amountCents, currency, anonymous });
    return d;
  }

  // Live chat
  postChat(webinarId: string, from: string, text: string) {
    const msg = this.repo.pushChat(webinarId, from, text);
    this.gateway?.emitToTopic(`webinar:${webinarId}`, 'webinar.chat.message', msg);
    void D18Emit.chatMessage(from, (msg as any)?.id ?? `${webinarId}:${Date.now()}`, { webinarId, from });
    return msg;
  }
  chat(webinarId: string) { return this.repo.chatFor(webinarId); }

  /** Returns the Jitsi room descriptor for the live player. */
  liveRoom(webinarId: string) {
    const w = this.repo.byId(webinarId); if (!w) return null;
    return { webinarId, jitsiRoom: w.jitsiRoom, jitsiDomain: 'meet.jit.si', status: w.status };
  }

  private toPublic(w: WebinarRow) {
    return {
      id: w.id, title: w.title, description: w.description,
      host: { id: w.hostId, name: w.hostName },
      startsAt: w.startsAt, durationMinutes: w.durationMinutes,
      topics: w.topics, thumbnailUrl: w.thumbnailUrl,
      status: w.status,
      ticket: { kind: w.ticketKind, priceCents: w.priceCents, currency: w.currency, capacity: w.capacity },
      registrations: w.registrations, donationsEnabled: w.donationsEnabled,
      jitsiRoom: w.jitsiRoom, replayUrl: w.replayUrl, replayDurationSec: w.replayDurationSec,
    };
  }
}
