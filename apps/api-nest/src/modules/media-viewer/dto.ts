/**
 * Domain 20 — Media Viewer, File Preview, Gallery & Interactive Attachments.
 * Shared DTO/types used by controller, service, repo, ML and analytics.
 */

export type MediaKind = 'image' | 'video' | 'audio' | 'document' | 'other';
export type MediaStatus =
  | 'draft'
  | 'pending'        // queued for transcoding/scan
  | 'processing'     // worker is touching the asset
  | 'active'         // ready to serve
  | 'paused'         // owner paused publishing
  | 'archived'
  | 'failed'         // transcoding/scan failure
  | 'escalated'      // moderation flagged
  | 'restricted';    // signed-url + entitlement gate

export type ModerationVerdict = 'clean' | 'review' | 'blocked' | 'unknown';
export type GalleryVisibility = 'private' | 'unlisted' | 'org' | 'public';

export interface MediaAsset {
  id: string;
  ownerId: string;
  orgId?: string | null;
  kind: MediaKind;
  status: MediaStatus;
  storageKey: string;          // bucket key, never returned raw to public clients
  mimeType: string;
  sizeBytes: number;
  durationSec?: number;        // video/audio
  width?: number;
  height?: number;
  pages?: number;              // documents
  filename: string;
  title?: string;
  description?: string;
  tags: string[];
  thumbnailUrl?: string;
  posterUrl?: string;
  altText?: string;
  checksum?: string;
  moderation: { verdict: ModerationVerdict; reason?: string; scannedAt?: string };
  views: number;
  downloads: number;
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
}

export interface Gallery {
  id: string;
  ownerId: string;
  orgId?: string | null;
  title: string;
  slug: string;
  description?: string;
  visibility: GalleryVisibility;
  status: 'draft' | 'active' | 'archived';
  itemIds: string[];
  coverAssetId?: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentRef {
  id: string;
  assetId: string;
  contextKind: 'message' | 'project' | 'gig' | 'order' | 'profile' | 'review' | 'other';
  contextId: string;
  pinned: boolean;
  createdAt: string;
}

export interface SignedUrl {
  url: string;
  method: 'GET' | 'PUT';
  expiresAt: string;
  headers?: Record<string, string>;
}

export interface CreateMediaDto {
  kind: MediaKind;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  title?: string;
  description?: string;
  tags?: string[];
  altText?: string;
  orgId?: string | null;
}
export interface UpdateMediaDto {
  title?: string;
  description?: string;
  tags?: string[];
  altText?: string;
  status?: 'active' | 'paused' | 'archived';
}
export interface CreateGalleryDto {
  title: string;
  description?: string;
  visibility?: GalleryVisibility;
  itemIds?: string[];
  coverAssetId?: string;
}
export interface UpdateGalleryDto extends Partial<CreateGalleryDto> {
  status?: 'draft' | 'active' | 'archived';
}
export interface AttachDto {
  assetId: string;
  contextKind: AttachmentRef['contextKind'];
  contextId: string;
  pinned?: boolean;
}
