import { Injectable } from '@nestjs/common';
import {
  Show, Episode, Album, LibraryItem, QueueItem, Recording, Purchase,
  CreateShowDto, UpdateShowDto, CreateEpisodeDto, UpdateEpisodeDto,
  CreateAlbumDto, UpdateAlbumDto,
} from './dto';

const now = () => new Date().toISOString();
const id = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);

@Injectable()
export class PodcastsRepository {
  private shows = new Map<string, Show>();
  private episodes = new Map<string, Episode>();
  private albums = new Map<string, Album>();
  private library = new Map<string, LibraryItem>();
  private queues = new Map<string, QueueItem>();
  private recordings = new Map<string, Recording>();
  private purchases = new Map<string, Purchase>();

  constructor() { this.seed(); }

  private seed() {
    const owner = 'demo_user';
    const s1: Show = {
      id: 'show_ai_frontiers', ownerId: owner,
      title: 'AI Frontiers', slug: 'ai-frontiers',
      description: 'Conversations on agentic AI, infra, and product strategy.',
      category: 'Technology', tags: ['ai', 'agents', 'infra'],
      status: 'active', access: 'free', language: 'en',
      episodes: 0, subscribers: 18420, totalPlays: 412000,
      rating: 4.9, ratingsCount: 312,
      createdAt: now(), updatedAt: now(),
    };
    const s2: Show = {
      id: 'show_design_hustle', ownerId: owner,
      title: 'The Design Hustle', slug: 'the-design-hustle',
      description: 'Pricing, positioning, and operations for product designers.',
      category: 'Design', tags: ['design', 'freelance'],
      status: 'active', access: 'premium', language: 'en',
      episodes: 0, subscribers: 12400, totalPlays: 188000,
      rating: 4.8, ratingsCount: 211,
      createdAt: now(), updatedAt: now(),
    };
    [s1, s2].forEach((s) => this.shows.set(s.id, s));

    const eps: Array<Partial<Episode> & Pick<Episode, 'showId' | 'title'>> = [
      { showId: s1.id, title: 'Why AI Agents Will Replace SaaS', durationSec: 2535, plays: 18400, access: 'free', number: 78, status: 'active' },
      { showId: s1.id, title: 'Multi-Agent Orchestration in Practice', durationSec: 2280, plays: 9100, access: 'free', number: 77, status: 'active' },
      { showId: s2.id, title: 'How to Price Your Design Work', durationSec: 1980, plays: 6400, access: 'premium', number: 142, status: 'active', priceCents: 499 },
    ];
    eps.forEach((e) => {
      const epId = id('ep');
      const ep: Episode = {
        id: epId, showId: e.showId, title: e.title!,
        description: 'Auto-seeded episode for development.',
        durationSec: e.durationSec ?? 1800, plays: e.plays ?? 0,
        status: (e.status ?? 'active') as Episode['status'],
        access: e.access ?? 'free', number: e.number, likes: 0, comments: 0,
        chapters: [{ time: 0, title: 'Intro' }, { time: 600, title: 'Core' }, { time: 1500, title: 'Wrap' }],
        transcript: [],
        priceCents: e.priceCents,
        createdAt: now(), updatedAt: now(), publishedAt: now(),
      };
      this.episodes.set(epId, ep);
      const sh = this.shows.get(e.showId)!; sh.episodes += 1;
    });
  }

  /* Shows */
  listShows(filter: { ownerId?: string; status?: string; q?: string; category?: string } = {}): Show[] {
    return [...this.shows.values()]
      .filter((s) => (filter.ownerId ? s.ownerId === filter.ownerId : true))
      .filter((s) => (filter.status ? s.status === filter.status : s.status !== 'archived'))
      .filter((s) => (filter.category ? s.category.toLowerCase() === filter.category.toLowerCase() : true))
      .filter((s) => (filter.q ? (s.title + ' ' + s.description + ' ' + s.tags.join(' ')).toLowerCase().includes(filter.q.toLowerCase()) : true))
      .sort((a, b) => b.subscribers - a.subscribers);
  }
  getShow(id: string) { return this.shows.get(id); }
  getShowBySlug(slug: string) { return [...this.shows.values()].find((s) => s.slug === slug); }
  createShow(ownerId: string, dto: CreateShowDto): Show {
    const sid = id('show');
    const show: Show = {
      id: sid, ownerId,
      title: dto.title, slug: slugify(dto.title) || sid,
      description: dto.description ?? '',
      category: dto.category ?? 'General',
      tags: dto.tags ?? [],
      coverUrl: dto.coverUrl, rssUrl: dto.rssUrl,
      status: 'draft', access: dto.access ?? 'free',
      language: dto.language ?? 'en',
      episodes: 0, subscribers: 0, totalPlays: 0,
      rating: 0, ratingsCount: 0,
      createdAt: now(), updatedAt: now(),
    };
    this.shows.set(sid, show);
    return show;
  }
  updateShow(idArg: string, dto: UpdateShowDto): Show | undefined {
    const s = this.shows.get(idArg); if (!s) return;
    Object.assign(s, dto, { updatedAt: now() });
    if (dto.title) s.slug = slugify(dto.title) || s.slug;
    return s;
  }
  setShowStatus(idArg: string, status: Show['status']) {
    const s = this.shows.get(idArg); if (!s) return; s.status = status; s.updatedAt = now(); return s;
  }

  /* Episodes */
  listEpisodes(filter: { showId?: string; status?: string; access?: string; q?: string } = {}): Episode[] {
    return [...this.episodes.values()]
      .filter((e) => (filter.showId ? e.showId === filter.showId : true))
      .filter((e) => (filter.status ? e.status === filter.status : e.status !== 'archived'))
      .filter((e) => (filter.access ? e.access === filter.access : true))
      .filter((e) => (filter.q ? (e.title + ' ' + e.description).toLowerCase().includes(filter.q.toLowerCase()) : true))
      .sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt));
  }
  getEpisode(id: string) { return this.episodes.get(id); }
  createEpisode(dto: CreateEpisodeDto): Episode | undefined {
    const sh = this.shows.get(dto.showId); if (!sh) return;
    const eid = id('ep');
    const ep: Episode = {
      id: eid, showId: dto.showId,
      title: dto.title, description: dto.description ?? '',
      audioKey: dto.audioKey, durationSec: dto.durationSec ?? 0,
      status: dto.audioKey ? 'processing' : 'draft',
      access: dto.access ?? 'free',
      priceCents: dto.priceCents,
      chapters: dto.chapters ?? [], transcript: dto.transcript ?? [],
      publishAt: dto.publishAt,
      plays: 0, likes: 0, comments: 0,
      createdAt: now(), updatedAt: now(),
    };
    this.episodes.set(eid, ep);
    sh.episodes += 1; sh.updatedAt = now();
    return ep;
  }
  updateEpisode(idArg: string, dto: UpdateEpisodeDto): Episode | undefined {
    const e = this.episodes.get(idArg); if (!e) return;
    Object.assign(e, dto, { updatedAt: now() });
    if (dto.status === 'active' && !e.publishedAt) e.publishedAt = now();
    return e;
  }
  setEpisodeStatus(idArg: string, status: Episode['status']) {
    const e = this.episodes.get(idArg); if (!e) return;
    e.status = status; e.updatedAt = now();
    if (status === 'active' && !e.publishedAt) e.publishedAt = now();
    return e;
  }
  bumpEpisode(idArg: string, field: 'plays' | 'likes' | 'comments', delta = 1) {
    const e = this.episodes.get(idArg); if (!e) return;
    e[field] = Math.max(0, (e[field] ?? 0) + delta);
    if (field === 'plays') {
      const sh = this.shows.get(e.showId); if (sh) sh.totalPlays += delta;
    }
    return e;
  }

  /* Albums */
  listAlbums(ownerId?: string) {
    return [...this.albums.values()].filter((a) => (ownerId ? a.ownerId === ownerId : true));
  }
  getAlbum(id: string) { return this.albums.get(id); }
  createAlbum(ownerId: string, dto: CreateAlbumDto): Album {
    const aid = id('alb');
    const a: Album = { id: aid, ownerId, title: dto.title, description: dto.description ?? '', episodeIds: dto.episodeIds, visibility: dto.visibility ?? 'private', coverUrl: dto.coverUrl, createdAt: now(), updatedAt: now() };
    this.albums.set(aid, a); return a;
  }
  updateAlbum(idArg: string, dto: UpdateAlbumDto): Album | undefined {
    const a = this.albums.get(idArg); if (!a) return;
    Object.assign(a, dto, { updatedAt: now() }); return a;
  }
  deleteAlbum(idArg: string) { return this.albums.delete(idArg); }

  /* Library + subscriptions */
  libraryFor(userId: string) { return [...this.library.values()].filter((l) => l.userId === userId); }
  setSubscription(userId: string, showId: string, subscribed: boolean): LibraryItem {
    const key = `${userId}:${showId}`;
    let item = this.library.get(key);
    if (!item) {
      item = { id: id('lib'), userId, showId, subscribed, favourite: false };
      this.library.set(key, item);
    } else { item.subscribed = subscribed; }
    const s = this.shows.get(showId);
    if (s) s.subscribers = Math.max(0, s.subscribers + (subscribed ? 1 : -1));
    return item;
  }
  toggleFavourite(userId: string, showId: string): LibraryItem {
    const key = `${userId}:${showId}`;
    let item = this.library.get(key);
    if (!item) {
      item = { id: id('lib'), userId, showId, subscribed: false, favourite: true };
      this.library.set(key, item);
    } else { item.favourite = !item.favourite; }
    return item;
  }

  /* Queue */
  queueFor(userId: string) { return [...this.queues.values()].filter((q) => q.userId === userId).sort((a, b) => a.position - b.position); }
  enqueue(userId: string, episodeId: string): QueueItem {
    const list = this.queueFor(userId);
    const item: QueueItem = { id: id('q'), userId, episodeId, position: list.length, addedAt: now() };
    this.queues.set(item.id, item);
    return item;
  }
  dequeue(idArg: string) { return this.queues.delete(idArg); }
  reorderQueue(userId: string, ids: string[]) {
    ids.forEach((qid, idx) => { const q = this.queues.get(qid); if (q && q.userId === userId) q.position = idx; });
    return this.queueFor(userId);
  }

  /* Recordings */
  startRecording(ownerId: string, title: string, showId?: string): Recording {
    const r: Recording = { id: id('rec'), ownerId, title, showId, status: 'recording', durationSec: 0, startedAt: now() };
    this.recordings.set(r.id, r); return r;
  }
  finishRecording(idArg: string, durationSec: number, audioKey: string): Recording | undefined {
    const r = this.recordings.get(idArg); if (!r) return;
    r.durationSec = durationSec; r.audioKey = audioKey; r.status = 'processing'; r.finishedAt = now();
    return r;
  }
  setRecordingStatus(idArg: string, status: Recording['status'], err?: string) {
    const r = this.recordings.get(idArg); if (!r) return;
    r.status = status; if (err) r.errorMessage = err; return r;
  }
  listRecordings(ownerId: string) { return [...this.recordings.values()].filter((r) => r.ownerId === ownerId); }
  getRecording(idArg: string) { return this.recordings.get(idArg); }

  /* Purchases (immutable ledger) */
  listPurchases(userId: string) { return [...this.purchases.values()].filter((p) => p.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  createPurchase(userId: string, dto: { kind: Purchase['kind']; refId: string; amountCents: number; currency?: string; provider?: Purchase['provider']; }): Purchase {
    const p: Purchase = {
      id: id('pur'), userId, kind: dto.kind, refId: dto.refId,
      amountCents: dto.amountCents, currency: dto.currency ?? 'USD',
      status: 'pending', provider: dto.provider ?? 'stripe',
      createdAt: now(),
    };
    this.purchases.set(p.id, p); return p;
  }
  setPurchaseStatus(idArg: string, status: Purchase['status'], providerRef?: string) {
    const p = this.purchases.get(idArg); if (!p) return;
    p.status = status; if (providerRef) p.providerRef = providerRef; return p;
  }
  getPurchase(idArg: string) { return this.purchases.get(idArg); }

  /* Aggregates for analytics */
  totals() {
    return {
      shows: this.shows.size,
      episodes: this.episodes.size,
      recordings: this.recordings.size,
      purchases: this.purchases.size,
      totalPlays: [...this.shows.values()].reduce((acc, s) => acc + s.totalPlays, 0),
      revenueCents: [...this.purchases.values()].filter((p) => p.status === 'paid').reduce((acc, p) => acc + p.amountCents, 0),
    };
  }
}
