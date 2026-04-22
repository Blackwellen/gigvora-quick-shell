/**
 * Domain 22 — Webinars repository.
 *
 * In-memory + seeded persistence for Discovery, Live Rooms, Replays, Donations
 * and Sales. Real persistence lives in Drizzle migrations
 * (webinars, webinar_registrations, webinar_donations, webinar_purchases,
 *  webinar_replays, webinar_chat_messages). This repository keeps a denormalised
 * view for fast facet/recommendation work and integrates with the local-first
 * storage adapter so thumbnails/replays default to the local bucket.
 *
 * State machines:
 *   Webinar:   draft → scheduled ↔ cancelled, scheduled → live → ended → archived
 *   Purchase:  pending → confirmed → paid | failed → refunded
 *   Donation:  pending → captured | failed → refunded
 */
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { WebinarCreate } from './dto';

export type WebinarRow = {
  id: string; title: string; description: string;
  hostId: string; hostName: string;
  startsAt: string; durationMinutes: number;
  topics: string[]; thumbnailUrl: string | null;
  status: 'draft' | 'scheduled' | 'live' | 'ended' | 'archived' | 'cancelled';
  ticketKind: 'free' | 'paid' | 'donation' | 'enterprise';
  priceCents: number; currency: 'GBP' | 'USD' | 'EUR';
  capacity: number; registrations: number;
  donationsEnabled: boolean;
  jitsiRoom: string;
  replayUrl: string | null; replayDurationSec: number | null;
  createdAt: string;
};

type PurchaseRow = {
  id: string; webinarId: string; buyerId: string; quantity: number;
  amountCents: number; currency: string;
  status: 'pending' | 'confirmed' | 'paid' | 'failed' | 'refunded';
  createdAt: string; confirmedAt: string | null; receiptUrl: string | null;
};

type DonationRow = {
  id: string; webinarId: string; donorId: string | null; amountCents: number;
  currency: string; message: string | null; anonymous: boolean;
  status: 'pending' | 'captured' | 'failed' | 'refunded';
  createdAt: string;
};

@Injectable()
export class WebinarsRepository {
  private readonly log = new Logger('WebinarsRepository');
  private webinars: WebinarRow[] = [];
  private registrations = new Map<string, Set<string>>(); // webinarId -> identityId[]
  private purchases = new Map<string, PurchaseRow>();
  private donations = new Map<string, DonationRow>();
  private chatLog = new Map<string, { id: string; from: string; text: string; at: string }[]>();

  constructor() { this.seed(); }

  private seed() {
    const titles = [
      'Scaling AI Infrastructure', 'Advanced React Patterns', 'Design Systems Workshop',
      'Fundraising Masterclass', 'Cloud Security Deep Dive', 'Product-Led Growth Strategies',
    ];
    const topics = [['ai', 'platform'], ['react'], ['design'], ['startup'], ['security'], ['product']];
    const now = Date.now();
    titles.forEach((t, i) => {
      const startsAt = new Date(now + (i - 1) * 86_400_000 * 2).toISOString();
      const isLive = i === 2;
      const isEnded = i === 0 && false;
      this.webinars.push({
        id: randomUUID(), title: t, description: `${t} — live workshop with Q&A`,
        hostId: `host-${i}`, hostName: ['Dr. Raj Patel', 'Mike Liu', 'Lisa Park', 'Ana Rodriguez', 'David Chen', 'Sarah Kim'][i],
        startsAt, durationMinutes: 60,
        topics: topics[i], thumbnailUrl: null,
        status: isLive ? 'live' : isEnded ? 'ended' : 'scheduled',
        ticketKind: i % 2 ? 'paid' : 'free',
        priceCents: i % 2 ? 2900 + i * 1000 : 0, currency: 'GBP',
        capacity: 300 + i * 50, registrations: 80 + i * 30,
        donationsEnabled: true,
        jitsiRoom: `gigvora-webinar-${i}-${randomUUID().slice(0, 8)}`,
        replayUrl: null, replayDurationSec: null,
        createdAt: new Date(now - 86_400_000 * (10 - i)).toISOString(),
      });
    });
    this.log.log(`seeded ${this.webinars.length} webinars`);
  }

  list(): WebinarRow[] { return this.webinars; }
  byId(id: string): WebinarRow | undefined { return this.webinars.find((w) => w.id === id); }

  filter(f: { q?: string; status?: string[]; price?: string; topic?: string[] }) {
    return this.webinars.filter((w) => {
      if (f.q && !`${w.title} ${w.description} ${w.topics.join(' ')}`.toLowerCase().includes(f.q.toLowerCase())) return false;
      if (f.status?.length && !f.status.includes(w.status)) return false;
      if (f.topic?.length && !f.topic.some((t) => w.topics.includes(t))) return false;
      if (f.price === 'free' && w.ticketKind !== 'free') return false;
      if (f.price === 'paid' && w.ticketKind !== 'paid') return false;
      if (f.price === 'donation' && !w.donationsEnabled) return false;
      return true;
    });
  }

  computeFacets(rows: WebinarRow[]) {
    const tally = (key: 'status' | 'ticketKind' | 'topics') => {
      const m = new Map<string, number>();
      rows.forEach((r) => {
        const v: any = (r as any)[key];
        (Array.isArray(v) ? v : [v]).forEach((x) => x && m.set(x, (m.get(x) ?? 0) + 1));
      });
      return [...m.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    };
    return { status: tally('status'), ticket: tally('ticketKind'), topics: tally('topics') };
  }

  create(hostId: string, hostName: string, payload: WebinarCreate): WebinarRow {
    const row: WebinarRow = {
      id: randomUUID(), title: payload.title, description: payload.description,
      hostId, hostName, startsAt: payload.startsAt, durationMinutes: payload.durationMinutes,
      topics: payload.topics, thumbnailUrl: payload.thumbnailUrl ?? null,
      status: 'scheduled',
      ticketKind: payload.ticket.kind, priceCents: payload.ticket.priceCents,
      currency: payload.ticket.currency, capacity: payload.ticket.capacity, registrations: 0,
      donationsEnabled: payload.donationsEnabled,
      jitsiRoom: payload.jitsiRoomHint ?? `gigvora-webinar-${randomUUID().slice(0, 8)}`,
      replayUrl: null, replayDurationSec: null, createdAt: new Date().toISOString(),
    };
    this.webinars.unshift(row);
    return row;
  }

  // State transitions
  transition(id: string, next: WebinarRow['status']): WebinarRow | null {
    const w = this.byId(id); if (!w) return null;
    const allowed: Record<WebinarRow['status'], WebinarRow['status'][]> = {
      draft: ['scheduled', 'cancelled'],
      scheduled: ['live', 'cancelled'],
      live: ['ended'],
      ended: ['archived'],
      archived: [], cancelled: [],
    };
    if (!allowed[w.status].includes(next)) throw new Error(`invalid transition ${w.status} → ${next}`);
    w.status = next;
    if (next === 'ended') { w.replayUrl = `local://webinar-replays/${w.id}.mp4`; w.replayDurationSec = w.durationMinutes * 60; }
    return w;
  }

  // Registrations
  register(webinarId: string, identityId: string): { ok: boolean; reason?: string } {
    const w = this.byId(webinarId); if (!w) return { ok: false, reason: 'not_found' };
    if (w.registrations >= w.capacity) return { ok: false, reason: 'sold_out' };
    const set = this.registrations.get(webinarId) ?? new Set();
    if (set.has(identityId)) return { ok: true };
    set.add(identityId); this.registrations.set(webinarId, set); w.registrations += 1;
    return { ok: true };
  }
  isRegistered(webinarId: string, identityId: string) { return !!this.registrations.get(webinarId)?.has(identityId); }

  // Multi-step purchase
  createPurchase(webinarId: string, buyerId: string, quantity: number): PurchaseRow {
    const w = this.byId(webinarId); if (!w) throw new Error('not_found');
    const row: PurchaseRow = {
      id: randomUUID(), webinarId, buyerId, quantity,
      amountCents: w.priceCents * quantity, currency: w.currency,
      status: 'pending', createdAt: new Date().toISOString(), confirmedAt: null, receiptUrl: null,
    };
    this.purchases.set(row.id, row); return row;
  }
  confirmPurchase(purchaseId: string, buyerId: string): PurchaseRow {
    const p = this.purchases.get(purchaseId);
    if (!p || p.buyerId !== buyerId) throw new Error('not_found');
    if (p.status !== 'pending') throw new Error(`invalid_state:${p.status}`);
    // Simulated payment success — real impl calls Stripe/Paddle adapter
    p.status = 'paid'; p.confirmedAt = new Date().toISOString();
    p.receiptUrl = `local://receipts/${p.id}.pdf`;
    this.register(p.webinarId, buyerId);
    return p;
  }
  listPurchases(buyerId: string) { return [...this.purchases.values()].filter((p) => p.buyerId === buyerId); }

  // Donations
  donate(webinarId: string, donorId: string | null, amountCents: number, currency: string, message: string | undefined, anonymous: boolean): DonationRow {
    const row: DonationRow = {
      id: randomUUID(), webinarId, donorId, amountCents, currency,
      message: message ?? null, anonymous,
      status: 'captured', createdAt: new Date().toISOString(),
    };
    this.donations.set(row.id, row); return row;
  }
  donationsFor(webinarId: string) { return [...this.donations.values()].filter((d) => d.webinarId === webinarId); }

  // Live chat ring buffer (per webinar, last 200)
  pushChat(webinarId: string, from: string, text: string) {
    const arr = this.chatLog.get(webinarId) ?? [];
    arr.push({ id: randomUUID(), from, text, at: new Date().toISOString() });
    if (arr.length > 200) arr.shift();
    this.chatLog.set(webinarId, arr);
    return arr[arr.length - 1];
  }
  chatFor(webinarId: string) { return this.chatLog.get(webinarId) ?? []; }
}
