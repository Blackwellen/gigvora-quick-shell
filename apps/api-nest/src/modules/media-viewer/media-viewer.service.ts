import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MediaViewerRepository } from './media-viewer.repository';
import { MediaViewerMlService } from './media-viewer.ml.service';
import { MediaViewerAnalyticsService } from './media-viewer.analytics.service';
import { AuditService } from '../workspace/audit.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { D20Emit } from '../domain-bus/domain-emissions';
import {
  MediaAsset, SignedUrl,
  CreateMediaDto, UpdateMediaDto, CreateGalleryDto, UpdateGalleryDto, AttachDto,
} from './dto';

const SIGN_TTL_SEC = 900;

@Injectable()
export class MediaViewerService {
  constructor(
    private readonly repo: MediaViewerRepository,
    private readonly ml: MediaViewerMlService,
    private readonly analytics: MediaViewerAnalyticsService,
    private readonly audit: AuditService,
    private readonly realtime: NotificationsGateway,
  ) {}

  private emitAsset(event: string, asset: MediaAsset) {
    this.realtime.emitToUser(asset.ownerId, event, { id: asset.id, status: asset.status });
    this.realtime.emitToEntity('media', asset.id, event, asset);
  }

  /* ── Assets ───────────────────────────────────────── */
  list(actor: string, q: any = {}) {
    const items = this.repo.listAssets({ ownerId: q.ownerId ?? actor, kind: q.kind, status: q.status, q: q.q, tag: q.tag });
    return { items, total: items.length };
  }
  detail(id: string) {
    const a = this.repo.getAsset(id);
    if (!a) throw new NotFoundException('media asset not found');
    return a;
  }
  async create(actor: string, dto: CreateMediaDto) {
    if (!dto.filename || !dto.mimeType || !dto.sizeBytes) throw new BadRequestException('filename, mimeType, sizeBytes required');
    const asset = this.repo.createAsset(actor, dto);
    await this.audit.record({ actor, action: 'media.create', entity: 'media', entityId: asset.id, payload: { kind: dto.kind, sizeBytes: dto.sizeBytes } });
    this.emitAsset('media.created', asset);
    void D20Emit.created(actor, asset.id, { ownerId: actor, kind: dto.kind, mimeType: asset.mimeType, sizeBytes: dto.sizeBytes });
    // ML moderation hint (non-blocking)
    this.ml.moderationHint({ assetId: asset.id, mimeType: asset.mimeType, tags: asset.tags, filename: asset.filename })
      .then((hint) => {
        if (hint?.verdict && hint.verdict !== 'unknown') {
          const next = this.repo.setAssetStatus(asset.id, hint.verdict === 'blocked' ? 'escalated' : 'active', { moderation: { verdict: hint.verdict, scannedAt: new Date().toISOString() } });
          if (next) {
            this.emitAsset('media.moderated', next);
            void D20Emit.moderated(actor, asset.id, { verdict: hint.verdict, status: next.status });
          }
        }
      }).catch(() => undefined);
    return asset;
  }
  async update(actor: string, id: string, dto: UpdateMediaDto) {
    const next = this.repo.updateAsset(id, dto);
    if (!next) throw new NotFoundException('media asset not found');
    await this.audit.record({ actor, action: 'media.update', entity: 'media', entityId: id, payload: dto });
    this.emitAsset('media.updated', next);
    void D20Emit.updated(actor, id, { fields: Object.keys(dto ?? {}) });
    return next;
  }
  async archive(actor: string, id: string) {
    const next = this.repo.setAssetStatus(id, 'archived');
    if (!next) throw new NotFoundException('media asset not found');
    await this.audit.record({ actor, action: 'media.archive', entity: 'media', entityId: id });
    this.emitAsset('media.archived', next);
    void D20Emit.archived(actor, id, {});
    return next;
  }
  async restore(actor: string, id: string) {
    const next = this.repo.setAssetStatus(id, 'active');
    if (!next) throw new NotFoundException('media asset not found');
    await this.audit.record({ actor, action: 'media.restore', entity: 'media', entityId: id });
    this.emitAsset('media.restored', next);
    void D20Emit.restored(actor, id, {});
    return next;
  }
  async retryProcessing(actor: string, id: string) {
    const next = this.repo.setAssetStatus(id, 'processing');
    if (!next) throw new NotFoundException('media asset not found');
    await this.audit.record({ actor, action: 'media.retry', entity: 'media', entityId: id });
    this.emitAsset('media.processing', next);
    void D20Emit.processing(actor, id, {});
    // Simulated worker completion
    setTimeout(() => {
      const done = this.repo.setAssetStatus(id, 'active');
      if (done) {
        this.emitAsset('media.ready', done);
        void D20Emit.ready(actor, id, {});
      }
    }, 1500).unref?.();
    return next;
  }

  /* ── Counters / interactions ──────────────────────── */
  view(id: string)     { const a = this.repo.bumpCounter(id, 'views'); if (!a) throw new NotFoundException(); this.emitAsset('media.viewed', a); return a; }
  like(id: string)     { const a = this.repo.bumpCounter(id, 'likes'); if (!a) throw new NotFoundException(); this.emitAsset('media.liked', a); return a; }
  unlike(id: string)   { const a = this.repo.bumpCounter(id, 'likes', -1); if (!a) throw new NotFoundException(); this.emitAsset('media.unliked', a); return a; }
  download(id: string) { const a = this.repo.bumpCounter(id, 'downloads'); if (!a) throw new NotFoundException(); this.emitAsset('media.downloaded', a); return a; }

  /* ── Signed URLs (stub: integrates with media-pipeline via S3 adapter) ── */
  async signUpload(actor: string, dto: CreateMediaDto): Promise<{ asset: MediaAsset; upload: SignedUrl }> {
    const asset = await this.create(actor, dto);
    const upload: SignedUrl = {
      url: `/_signed/upload/${asset.id}?key=${encodeURIComponent(asset.storageKey)}`,
      method: 'PUT',
      expiresAt: new Date(Date.now() + SIGN_TTL_SEC * 1000).toISOString(),
      headers: { 'content-type': asset.mimeType },
    };
    return { asset, upload };
  }
  signDownload(id: string): SignedUrl {
    const a = this.repo.getAsset(id);
    if (!a) throw new NotFoundException('media asset not found');
    if (a.status !== 'active' && a.status !== 'paused') {
      throw new BadRequestException(`asset not downloadable in state ${a.status}`);
    }
    return {
      url: `/_signed/download/${a.id}?key=${encodeURIComponent(a.storageKey)}`,
      method: 'GET',
      expiresAt: new Date(Date.now() + SIGN_TTL_SEC * 1000).toISOString(),
    };
  }

  /* ── Galleries ────────────────────────────────────── */
  listGalleries(actor: string, q: any = {}) {
    const items = this.repo.listGalleries({ ownerId: q.ownerId ?? actor, visibility: q.visibility, q: q.q });
    return { items };
  }
  getGallery(id: string) {
    const g = this.repo.getGallery(id);
    if (!g) throw new NotFoundException('gallery not found');
    const items = g.itemIds.map(i => this.repo.getAsset(i)).filter(Boolean);
    return { gallery: g, items };
  }
  publicGallery(slug: string) {
    const g = this.repo.getGalleryBySlug(slug);
    if (!g) throw new NotFoundException('gallery not found');
    if (g.visibility === 'private') throw new BadRequestException('gallery is private');
    const items = g.itemIds.map(i => this.repo.getAsset(i)).filter(Boolean);
    return { gallery: g, items };
  }
  async createGallery(actor: string, dto: CreateGalleryDto) {
    const g = this.repo.createGallery(actor, dto);
    await this.audit.record({ actor, action: 'gallery.create', entity: 'gallery', entityId: g.id });
    this.realtime.emitToUser(actor, 'gallery.created', { id: g.id, slug: g.slug });
    void D20Emit.galleryCreated(actor, g.id, { ownerId: actor, slug: g.slug });
    return g;
  }
  async updateGallery(actor: string, id: string, dto: UpdateGalleryDto) {
    const g = this.repo.updateGallery(id, dto);
    if (!g) throw new NotFoundException('gallery not found');
    await this.audit.record({ actor, action: 'gallery.update', entity: 'gallery', entityId: id, payload: dto });
    this.realtime.emitToEntity('gallery', g.id, 'gallery.updated', g);
    void D20Emit.galleryUpdated(actor, id, { fields: Object.keys(dto ?? {}) });
    return g;
  }
  async deleteGallery(actor: string, id: string) {
    const ok = this.repo.deleteGallery(id);
    if (!ok) throw new NotFoundException('gallery not found');
    await this.audit.record({ actor, action: 'gallery.delete', entity: 'gallery', entityId: id });
    this.realtime.emitToUser(actor, 'gallery.deleted', { id });
    void D20Emit.galleryDeleted(actor, id, {});
    return { ok: true };
  }

  /* ── Attachments ──────────────────────────────────── */
  listAttachments(q: any = {}) { return { items: this.repo.listAttachments(q) }; }
  async attach(actor: string, dto: AttachDto) {
    const asset = this.repo.getAsset(dto.assetId);
    if (!asset) throw new NotFoundException('asset not found');
    const att = this.repo.attach(dto);
    await this.audit.record({ actor, action: 'media.attach', entity: 'attachment', entityId: att.id, payload: dto });
    this.realtime.emitToTopic(`${dto.contextKind}:${dto.contextId}`, 'attachment.added', att);
    void D20Emit.attachmentAdded(actor, att.id, { assetId: dto.assetId, contextKind: dto.contextKind, contextId: dto.contextId });
    return att;
  }
  async detach(actor: string, id: string) {
    const ok = this.repo.detach(id);
    if (!ok) throw new NotFoundException('attachment not found');
    await this.audit.record({ actor, action: 'media.detach', entity: 'attachment', entityId: id });
    void D20Emit.attachmentRemoved(actor, id, {});
    return { ok: true };
  }
  async setPinned(actor: string, id: string, pinned: boolean) {
    const next = this.repo.setPinned(id, pinned);
    if (!next) throw new NotFoundException('attachment not found');
    await this.audit.record({ actor, action: pinned ? 'media.pin' : 'media.unpin', entity: 'attachment', entityId: id });
    return next;
  }

  /* ── Insights & ML ────────────────────────────────── */
  insights(actor: string) {
    const assets = this.repo.listAssets({ ownerId: actor });
    return this.analytics.insights(assets);
  }
  scoreQuality(b: { assetId: string; bitrateKbps?: number }) {
    const a = this.repo.getAsset(b.assetId);
    if (!a) throw new NotFoundException('asset not found');
    return this.ml.scoreQuality({ assetId: a.id, kind: a.kind, sizeBytes: a.sizeBytes, width: a.width, height: a.height, durationSec: a.durationSec, bitrateKbps: b.bitrateKbps });
  }
  rankGallery(galleryId: string) {
    const g = this.repo.getGallery(galleryId);
    if (!g) throw new NotFoundException('gallery not found');
    const items = g.itemIds.map(id => this.repo.getAsset(id)).filter(Boolean) as MediaAsset[];
    return this.ml.rankGallery({ items: items.map(a => ({ id: a.id, kind: a.kind, views: a.views, likes: a.likes, downloads: a.downloads })) });
  }
  moderationHint(id: string) {
    const a = this.repo.getAsset(id);
    if (!a) throw new NotFoundException('asset not found');
    return this.ml.moderationHint({ assetId: a.id, mimeType: a.mimeType, tags: a.tags, filename: a.filename });
  }
}
