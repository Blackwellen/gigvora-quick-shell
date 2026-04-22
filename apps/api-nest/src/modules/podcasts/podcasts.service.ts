import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PodcastsRepository } from './podcasts.repository';
import { PodcastsMlService } from './podcasts.ml.service';
import { PodcastsAnalyticsService } from './podcasts.analytics.service';
import { AuditService } from '../workspace/audit.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { D21Emit } from '../domain-bus/domain-emissions';
import {
  CreateShowDto, UpdateShowDto, CreateEpisodeDto, UpdateEpisodeDto,
  CreateAlbumDto, UpdateAlbumDto, PurchaseDto, RecordingStartDto, RecordingFinishDto,
  SignedUrl,
} from './dto';

const SIGN_TTL_SEC = 900;
const AUDIO_BUCKET = process.env.MEDIA_AUDIO_BUCKET ?? 'gigvora-podcast-audio';

@Injectable()
export class PodcastsService {
  constructor(
    private readonly repo: PodcastsRepository,
    private readonly ml: PodcastsMlService,
    private readonly analytics: PodcastsAnalyticsService,
    private readonly audit: AuditService,
    private readonly realtime: NotificationsGateway,
  ) {}

  /* ── Helpers ─── */
  private emitShow(event: string, payload: any) {
    this.realtime.emitToTopic('podcasts', event, payload);
    if (payload?.id) this.realtime.emitToEntity('podcast', payload.id, event, payload);
  }
  private emitUser(userId: string, event: string, payload: any) { this.realtime.emitToUser(userId, event, payload); }

  /* ── Shows ─── */
  async listShows(actor: string, q: any = {}) {
    const items = this.repo.listShows({ ownerId: q.mine ? actor : undefined, status: q.status, q: q.q, category: q.category });
    return { items, total: items.length };
  }
  async showDetail(idArg: string) {
    const show = this.repo.getShow(idArg) ?? this.repo.getShowBySlug(idArg);
    if (!show) throw new NotFoundException('show not found');
    const episodes = this.repo.listEpisodes({ showId: show.id });
    return { show, episodes };
  }
  async createShow(actor: string, dto: CreateShowDto) {
    if (!dto.title) throw new BadRequestException('title required');
    const show = this.repo.createShow(actor, dto);
    await this.audit.record({ actor, action: 'podcast.show.create', entity: 'podcast.show', entityId: show.id, payload: { title: show.title } });
    this.emitShow('podcast.show.created', show);
    void D21Emit.showCreated(actor, show.id, { ownerId: actor, title: show.title });
    return show;
  }
  async updateShow(actor: string, id: string, dto: UpdateShowDto) {
    const next = this.repo.updateShow(id, dto);
    if (!next) throw new NotFoundException('show not found');
    await this.audit.record({ actor, action: 'podcast.show.update', entity: 'podcast.show', entityId: id, payload: dto });
    this.emitShow('podcast.show.updated', next);
    void D21Emit.showUpdated(actor, id, { fields: Object.keys(dto ?? {}) });
    return next;
  }
  async transitionShow(actor: string, id: string, status: 'active' | 'paused' | 'archived') {
    const next = this.repo.setShowStatus(id, status);
    if (!next) throw new NotFoundException('show not found');
    await this.audit.record({ actor, action: `podcast.show.${status}`, entity: 'podcast.show', entityId: id });
    this.emitShow(`podcast.show.${status}`, next);
    void D21Emit.showStatus(actor, id, status, { status });
    return next;
  }

  /* ── Episodes ─── */
  async listEpisodes(_actor: string, q: any = {}) {
    const items = this.repo.listEpisodes({ showId: q.showId, status: q.status, access: q.access, q: q.q });
    return { items, total: items.length };
  }
  async episodeDetail(id: string) {
    const ep = this.repo.getEpisode(id);
    if (!ep) throw new NotFoundException('episode not found');
    const show = this.repo.getShow(ep.showId);
    return { episode: ep, show };
  }
  async createEpisode(actor: string, dto: CreateEpisodeDto) {
    if (!dto.title || !dto.showId) throw new BadRequestException('title + showId required');
    const ep = this.repo.createEpisode(dto);
    if (!ep) throw new NotFoundException('show not found');
    await this.audit.record({ actor, action: 'podcast.episode.create', entity: 'podcast.episode', entityId: ep.id, payload: { showId: dto.showId } });
    this.emitShow('podcast.episode.created', ep);
    void D21Emit.episodeCreated(actor, ep.id, { showId: dto.showId, title: dto.title });
    return ep;
  }
  async updateEpisode(actor: string, id: string, dto: UpdateEpisodeDto) {
    const next = this.repo.updateEpisode(id, dto);
    if (!next) throw new NotFoundException('episode not found');
    await this.audit.record({ actor, action: 'podcast.episode.update', entity: 'podcast.episode', entityId: id, payload: dto });
    this.emitShow('podcast.episode.updated', next);
    void D21Emit.episodeUpdated(actor, id, { fields: Object.keys(dto ?? {}) });
    return next;
  }
  async transitionEpisode(actor: string, id: string, status: 'active' | 'paused' | 'archived' | 'failed') {
    const next = this.repo.setEpisodeStatus(id, status);
    if (!next) throw new NotFoundException('episode not found');
    await this.audit.record({ actor, action: `podcast.episode.${status}`, entity: 'podcast.episode', entityId: id });
    this.emitShow(`podcast.episode.${status}`, next);
    void D21Emit.episodeStatus(actor, id, status, { status });
    return next;
  }
  async play(id: string, actor: string) {
    const next = this.repo.bumpEpisode(id, 'plays', 1);
    if (!next) throw new NotFoundException('episode not found');
    this.realtime.emitToEntity('podcast.episode', id, 'podcast.episode.played', { id, actor, at: new Date().toISOString() });
    void D21Emit.episodePlayed(actor, id, { listenerId: actor, plays: next.plays });
    return { ok: true, plays: next.plays };
  }
  async like(id: string) { const e = this.repo.bumpEpisode(id, 'likes', 1); if (!e) throw new NotFoundException('episode not found'); this.emitShow('podcast.episode.liked', e); void D21Emit.episodeLiked('system', id, { likes: e.likes }); return { ok: true, likes: e.likes }; }
  async unlike(id: string) { const e = this.repo.bumpEpisode(id, 'likes', -1); if (!e) throw new NotFoundException('episode not found'); return { ok: true, likes: e.likes }; }
  async comment(id: string) { const e = this.repo.bumpEpisode(id, 'comments', 1); if (!e) throw new NotFoundException('episode not found'); return { ok: true, comments: e.comments }; }

  /* ── Signed URLs (audio upload/download) ─── */
  signUpload(actor: string, dto: { filename: string; mimeType: string; sizeBytes: number }): SignedUrl {
    if (!dto.filename || !dto.mimeType) throw new BadRequestException('filename + mimeType required');
    const key = `podcasts/${actor}/${Date.now()}_${dto.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    return { url: `https://signed.s3.${AUDIO_BUCKET}/${encodeURIComponent(key)}?upload=${Date.now()}`, method: 'PUT', expiresAt: new Date(Date.now() + SIGN_TTL_SEC * 1000).toISOString(), key };
  }
  signDownload(episodeId: string): SignedUrl {
    const ep = this.repo.getEpisode(episodeId);
    if (!ep) throw new NotFoundException('episode not found');
    const key = ep.audioKey ?? `podcasts/${ep.showId}/${ep.id}.mp3`;
    return { url: `https://cdn.${AUDIO_BUCKET}/${encodeURIComponent(key)}?sig=${Date.now()}`, method: 'GET', expiresAt: new Date(Date.now() + SIGN_TTL_SEC * 1000).toISOString(), key };
  }

  /* ── Albums ─── */
  listAlbums(actor: string, q: any = {}) { return { items: this.repo.listAlbums(q.mine ? actor : undefined) }; }
  getAlbum(id: string) { const a = this.repo.getAlbum(id); if (!a) throw new NotFoundException('album not found'); return a; }
  async createAlbum(actor: string, dto: CreateAlbumDto) {
    if (!dto.title || !dto.episodeIds?.length) throw new BadRequestException('title + episodeIds required');
    const a = this.repo.createAlbum(actor, dto);
    await this.audit.record({ actor, action: 'podcast.album.create', entity: 'podcast.album', entityId: a.id });
    this.emitShow('podcast.album.created', a);
    return a;
  }
  async updateAlbum(actor: string, id: string, dto: UpdateAlbumDto) {
    const next = this.repo.updateAlbum(id, dto);
    if (!next) throw new NotFoundException('album not found');
    await this.audit.record({ actor, action: 'podcast.album.update', entity: 'podcast.album', entityId: id, payload: dto });
    this.emitShow('podcast.album.updated', next);
    return next;
  }
  async deleteAlbum(actor: string, id: string) {
    const ok = this.repo.deleteAlbum(id);
    if (!ok) throw new NotFoundException('album not found');
    await this.audit.record({ actor, action: 'podcast.album.delete', entity: 'podcast.album', entityId: id });
    this.emitShow('podcast.album.deleted', { id });
    return { ok: true };
  }

  /* ── Library / Subscriptions / Queue ─── */
  library(userId: string) { return { items: this.repo.libraryFor(userId) }; }
  async subscribe(userId: string, showId: string) {
    const item = this.repo.setSubscription(userId, showId, true);
    await this.audit.record({ actor: userId, action: 'podcast.subscribe', entity: 'podcast.show', entityId: showId });
    this.emitUser(userId, 'podcast.subscribed', item);
    void D21Emit.subscribed(userId, `${userId}:${showId}`, { userId, showId });
    return item;
  }
  async unsubscribe(userId: string, showId: string) {
    const item = this.repo.setSubscription(userId, showId, false);
    await this.audit.record({ actor: userId, action: 'podcast.unsubscribe', entity: 'podcast.show', entityId: showId });
    this.emitUser(userId, 'podcast.unsubscribed', item);
    void D21Emit.unsubscribed(userId, `${userId}:${showId}`, { userId, showId });
    return item;
  }
  favourite(userId: string, showId: string) { const item = this.repo.toggleFavourite(userId, showId); this.emitUser(userId, 'podcast.favourite.toggled', item); return item; }

  queue(userId: string) { return { items: this.repo.queueFor(userId) }; }
  enqueue(userId: string, episodeId: string) {
    if (!this.repo.getEpisode(episodeId)) throw new NotFoundException('episode not found');
    const item = this.repo.enqueue(userId, episodeId);
    this.emitUser(userId, 'podcast.queue.added', item); return item;
  }
  dequeue(userId: string, queueItemId: string) {
    const ok = this.repo.dequeue(queueItemId);
    if (!ok) throw new NotFoundException('queue item not found');
    this.emitUser(userId, 'podcast.queue.removed', { id: queueItemId }); return { ok: true };
  }
  reorderQueue(userId: string, ids: string[]) {
    const items = this.repo.reorderQueue(userId, ids);
    this.emitUser(userId, 'podcast.queue.reordered', { items });
    return { items };
  }

  /* ── Recordings ─── */
  async startRecording(actor: string, dto: RecordingStartDto) {
    if (!dto.title) throw new BadRequestException('title required');
    const r = this.repo.startRecording(actor, dto.title, dto.showId);
    await this.audit.record({ actor, action: 'podcast.recording.start', entity: 'podcast.recording', entityId: r.id });
    this.emitUser(actor, 'podcast.recording.started', r);
    void D21Emit.recordingStarted(actor, r.id, { ownerId: actor, showId: dto.showId, title: dto.title });
    return r;
  }
  async finishRecording(actor: string, id: string, dto: RecordingFinishDto) {
    if (!dto.audioKey || !dto.durationSec) throw new BadRequestException('audioKey + durationSec required');
    const r = this.repo.finishRecording(id, dto.durationSec, dto.audioKey);
    if (!r) throw new NotFoundException('recording not found');
    await this.audit.record({ actor, action: 'podcast.recording.finish', entity: 'podcast.recording', entityId: id });
    this.emitUser(actor, 'podcast.recording.processing', r);
    void D21Emit.recordingProcessing(actor, id, { durationSec: dto.durationSec });
    // Score quality (non-blocking)
    this.ml.scoreRecording({ durationSec: dto.durationSec, tags: [] }).then((q) => {
      const next = this.repo.setRecordingStatus(id, q.score >= 50 ? 'ready' : 'failed', q.score < 50 ? 'low quality' : undefined);
      if (next) {
        this.emitUser(actor, next.status === 'ready' ? 'podcast.recording.ready' : 'podcast.recording.failed', { ...next, qualityScore: q.score });
        if (next.status === 'ready') void D21Emit.recordingReady(actor, id, { qualityScore: q.score });
        else void D21Emit.recordingFailed(actor, id, { qualityScore: q.score });
      }
    }).catch(() => undefined);
    return r;
  }
  listRecordings(actor: string) { return { items: this.repo.listRecordings(actor) }; }

  /* ── Purchases ─── */
  async createPurchase(actor: string, dto: PurchaseDto) {
    if (!dto.refId || !dto.amountCents) throw new BadRequestException('refId + amountCents required');
    const p = this.repo.createPurchase(actor, dto);
    await this.audit.record({ actor, action: 'podcast.purchase.create', entity: 'podcast.purchase', entityId: p.id, payload: { kind: dto.kind, amountCents: dto.amountCents } });
    this.emitUser(actor, 'podcast.purchase.pending', p);
    void D21Emit.purchasePending(actor, p.id, { kind: dto.kind, amountCents: dto.amountCents, refId: dto.refId });
    return p;
  }
  async confirmPurchase(actor: string, id: string, providerRef?: string) {
    const p = this.repo.setPurchaseStatus(id, 'paid', providerRef);
    if (!p) throw new NotFoundException('purchase not found');
    await this.audit.record({ actor, action: 'podcast.purchase.confirm', entity: 'podcast.purchase', entityId: id });
    this.emitUser(actor, 'podcast.purchase.paid', p);
    void D21Emit.purchasePaid(actor, id, { providerRef: providerRef ?? null });
    return p;
  }
  async refundPurchase(actor: string, id: string) {
    const p = this.repo.setPurchaseStatus(id, 'refunded');
    if (!p) throw new NotFoundException('purchase not found');
    await this.audit.record({ actor, action: 'podcast.purchase.refund', entity: 'podcast.purchase', entityId: id });
    this.emitUser(actor, 'podcast.purchase.refunded', p);
    void D21Emit.purchaseRefunded(actor, id, {});
    return p;
  }
  listPurchases(actor: string) { return { items: this.repo.listPurchases(actor) }; }

  /* ── ML & Analytics surfaces ─── */
  async rankDiscovery(actor: string, q: any = {}) {
    const shows = this.repo.listShows({ q: q.q, category: q.category });
    const ranked = await this.ml.rankDiscovery({
      shows: shows.map((s) => ({ id: s.id, subscribers: s.subscribers, rating: s.rating, updatedAt: s.updatedAt, tags: s.tags })),
      userTags: q.tags ? String(q.tags).split(',') : undefined,
    });
    const order = new Map(ranked.ranked.map((r: any, i: number) => [r.id, i]));
    const items = shows.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
    return { items, ranking: ranked };
  }
  async recommendNext(_actor: string) {
    const eps = this.repo.listEpisodes({});
    return this.ml.recommendNext({ episodes: eps.map((e) => ({ id: e.id, showId: e.showId, plays: e.plays, publishedAt: e.publishedAt, access: e.access })) });
  }
  async insights(actor: string) { return this.analytics.insights(actor); }
}
