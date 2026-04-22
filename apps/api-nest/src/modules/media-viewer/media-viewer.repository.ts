import { Injectable } from '@nestjs/common';
import {
  MediaAsset, Gallery, AttachmentRef,
  CreateMediaDto, UpdateMediaDto, CreateGalleryDto, UpdateGalleryDto, AttachDto,
} from './dto';

const ID = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const NOW = () => new Date().toISOString();

/**
 * In-memory repository for Domain 20 (Media Viewer & Attachments).
 * Mirrors the production-shaped API while persistence is being wired.
 * Seeds realistic demo records so the frontend renders believable states.
 */
@Injectable()
export class MediaViewerRepository {
  private assets = new Map<string, MediaAsset>();
  private galleries = new Map<string, Gallery>();
  private attachments = new Map<string, AttachmentRef>();

  constructor() { this.seed(); }

  /* ── Assets ───────────────────────────────────────── */
  listAssets(filter: { ownerId?: string; kind?: string; status?: string; q?: string; tag?: string } = {}): MediaAsset[] {
    let rows = [...this.assets.values()];
    if (filter.ownerId) rows = rows.filter(r => r.ownerId === filter.ownerId);
    if (filter.kind) rows = rows.filter(r => r.kind === filter.kind);
    if (filter.status) rows = rows.filter(r => r.status === filter.status);
    if (filter.tag) rows = rows.filter(r => r.tags.includes(filter.tag!));
    if (filter.q) {
      const q = filter.q.toLowerCase();
      rows = rows.filter(r =>
        r.filename.toLowerCase().includes(q) ||
        (r.title ?? '').toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q),
      );
    }
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  getAsset(id: string) { return this.assets.get(id) ?? null; }
  createAsset(ownerId: string, dto: CreateMediaDto): MediaAsset {
    const id = ID('media');
    const now = NOW();
    const rec: MediaAsset = {
      id, ownerId, orgId: dto.orgId ?? null,
      kind: dto.kind, status: 'pending',
      storageKey: `media/${ownerId}/${id}/${dto.filename}`,
      mimeType: dto.mimeType, sizeBytes: dto.sizeBytes,
      filename: dto.filename, title: dto.title, description: dto.description,
      tags: dto.tags ?? [], altText: dto.altText,
      moderation: { verdict: 'unknown' },
      views: 0, downloads: 0, likes: 0, comments: 0,
      createdAt: now, updatedAt: now,
    };
    this.assets.set(id, rec);
    return rec;
  }
  updateAsset(id: string, dto: UpdateMediaDto): MediaAsset | null {
    const cur = this.assets.get(id); if (!cur) return null;
    const next: MediaAsset = { ...cur, ...dto, tags: dto.tags ?? cur.tags, updatedAt: NOW() };
    this.assets.set(id, next); return next;
  }
  setAssetStatus(id: string, status: MediaAsset['status'], extra?: Partial<MediaAsset>): MediaAsset | null {
    const cur = this.assets.get(id); if (!cur) return null;
    const next = { ...cur, ...extra, status, updatedAt: NOW() };
    this.assets.set(id, next); return next;
  }
  bumpCounter(id: string, key: 'views' | 'downloads' | 'likes' | 'comments', delta = 1) {
    const cur = this.assets.get(id); if (!cur) return null;
    const next = { ...cur, [key]: Math.max(0, cur[key] + delta), updatedAt: NOW() };
    this.assets.set(id, next); return next;
  }
  deleteAsset(id: string) { return this.assets.delete(id); }

  /* ── Galleries ────────────────────────────────────── */
  listGalleries(filter: { ownerId?: string; visibility?: string; q?: string } = {}): Gallery[] {
    let rows = [...this.galleries.values()];
    if (filter.ownerId) rows = rows.filter(r => r.ownerId === filter.ownerId);
    if (filter.visibility) rows = rows.filter(r => r.visibility === filter.visibility);
    if (filter.q) {
      const q = filter.q.toLowerCase();
      rows = rows.filter(r => r.title.toLowerCase().includes(q));
    }
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  getGallery(id: string) { return this.galleries.get(id) ?? null; }
  getGalleryBySlug(slug: string) {
    return [...this.galleries.values()].find(g => g.slug === slug) ?? null;
  }
  createGallery(ownerId: string, dto: CreateGalleryDto): Gallery {
    const id = ID('gal');
    const now = NOW();
    const slug = dto.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || id;
    const rec: Gallery = {
      id, ownerId, orgId: null, title: dto.title, slug,
      description: dto.description, visibility: dto.visibility ?? 'private',
      status: 'draft', itemIds: dto.itemIds ?? [], coverAssetId: dto.coverAssetId,
      views: 0, createdAt: now, updatedAt: now,
    };
    this.galleries.set(id, rec);
    return rec;
  }
  updateGallery(id: string, dto: UpdateGalleryDto): Gallery | null {
    const cur = this.galleries.get(id); if (!cur) return null;
    const next: Gallery = { ...cur, ...dto, updatedAt: NOW() };
    this.galleries.set(id, next); return next;
  }
  deleteGallery(id: string) { return this.galleries.delete(id); }

  /* ── Attachments ──────────────────────────────────── */
  listAttachments(filter: { contextKind?: string; contextId?: string; assetId?: string } = {}): AttachmentRef[] {
    let rows = [...this.attachments.values()];
    if (filter.contextKind) rows = rows.filter(r => r.contextKind === filter.contextKind);
    if (filter.contextId) rows = rows.filter(r => r.contextId === filter.contextId);
    if (filter.assetId) rows = rows.filter(r => r.assetId === filter.assetId);
    return rows.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt));
  }
  attach(dto: AttachDto): AttachmentRef {
    const id = ID('att');
    const rec: AttachmentRef = {
      id, assetId: dto.assetId, contextKind: dto.contextKind, contextId: dto.contextId,
      pinned: dto.pinned ?? false, createdAt: NOW(),
    };
    this.attachments.set(id, rec);
    return rec;
  }
  detach(id: string) { return this.attachments.delete(id); }
  setPinned(id: string, pinned: boolean): AttachmentRef | null {
    const cur = this.attachments.get(id); if (!cur) return null;
    const next = { ...cur, pinned };
    this.attachments.set(id, next); return next;
  }

  /* ── Seed ─────────────────────────────────────────── */
  private seed() {
    const owner = 'demo_user';
    const samples: Array<Partial<MediaAsset> & Pick<MediaAsset, 'kind' | 'mimeType' | 'sizeBytes' | 'filename'>> = [
      { kind: 'image', mimeType: 'image/jpeg', sizeBytes: 2_400_000, filename: 'Brand_Hero.jpg', title: 'Brand Hero', tags: ['brand', 'hero'], width: 1920, height: 1080, status: 'active' },
      { kind: 'video', mimeType: 'video/mp4', sizeBytes: 18_200_000, filename: 'Walkthrough.mp4', title: 'Process Walkthrough', durationSec: 142, tags: ['video', 'walkthrough'], status: 'active' },
      { kind: 'document', mimeType: 'application/pdf', sizeBytes: 4_200_000, filename: 'Guidelines.pdf', title: 'Brand Guidelines v3', pages: 24, tags: ['pdf', 'brand'], status: 'active' },
      { kind: 'image', mimeType: 'image/png', sizeBytes: 1_100_000, filename: 'Logo_Sample.png', title: 'Logo Sample', tags: ['logo'], width: 1200, height: 800, status: 'active' },
      { kind: 'audio', mimeType: 'audio/mpeg', sizeBytes: 6_500_000, filename: 'Podcast_Ep01.mp3', title: 'Podcast — Episode 1', durationSec: 1820, tags: ['podcast'], status: 'active' },
      { kind: 'video', mimeType: 'video/mp4', sizeBytes: 84_000_000, filename: 'Reel_Backup.mp4', title: 'Reel Master', durationSec: 32, tags: ['reel'], status: 'processing' },
      { kind: 'image', mimeType: 'image/jpeg', sizeBytes: 3_600_000, filename: 'Before_After.jpg', title: 'Before / After', tags: ['portfolio'], width: 2400, height: 1200, status: 'escalated' },
    ];
    const created: MediaAsset[] = [];
    for (const s of samples) {
      const id = ID('media');
      const now = NOW();
      const rec: MediaAsset = {
        id, ownerId: owner, orgId: null,
        kind: s.kind, status: s.status ?? 'active',
        storageKey: `media/${owner}/${id}/${s.filename}`,
        mimeType: s.mimeType, sizeBytes: s.sizeBytes,
        durationSec: s.durationSec, width: s.width, height: s.height, pages: s.pages,
        filename: s.filename, title: s.title, tags: s.tags ?? [],
        moderation: { verdict: s.status === 'escalated' ? 'review' : 'clean', scannedAt: now },
        views: Math.floor(Math.random() * 400),
        downloads: Math.floor(Math.random() * 80),
        likes: Math.floor(Math.random() * 60),
        comments: Math.floor(Math.random() * 12),
        createdAt: now, updatedAt: now,
      };
      this.assets.set(id, rec);
      created.push(rec);
    }
    const gid = ID('gal'); const now = NOW();
    this.galleries.set(gid, {
      id: gid, ownerId: owner, orgId: null,
      title: 'Portfolio Showcase', slug: 'portfolio-showcase',
      description: 'Highlight reel for client previews.',
      visibility: 'unlisted', status: 'active',
      itemIds: created.filter(c => c.kind === 'image' || c.kind === 'video').slice(0, 4).map(c => c.id),
      coverAssetId: created[0]?.id,
      views: 128, createdAt: now, updatedAt: now,
    });
    const att = ID('att');
    this.attachments.set(att, {
      id: att, assetId: created[2].id,
      contextKind: 'project', contextId: 'demo_project',
      pinned: true, createdAt: now,
    });
  }
}
