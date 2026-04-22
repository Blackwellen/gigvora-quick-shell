/* Domain 21 — Podcasts DTOs & domain types */

export type ShowStatus = 'draft' | 'pending' | 'active' | 'paused' | 'archived';
export type EpisodeStatus = 'draft' | 'processing' | 'active' | 'paused' | 'archived' | 'failed';
export type RecordingStatus = 'draft' | 'recording' | 'processing' | 'ready' | 'published' | 'failed';
export type PurchaseStatus = 'pending' | 'paid' | 'refunded' | 'failed' | 'disputed';
export type AccessTier = 'free' | 'premium' | 'subscribed' | 'purchased';

export interface Show {
  id: string; ownerId: string;
  title: string; slug: string; description: string;
  category: string; tags: string[]; coverUrl?: string;
  status: ShowStatus; access: AccessTier;
  rssUrl?: string; language: string;
  episodes: number; subscribers: number; totalPlays: number;
  rating: number; ratingsCount: number;
  createdAt: string; updatedAt: string;
}

export interface Episode {
  id: string; showId: string;
  title: string; description: string;
  audioKey?: string; durationSec: number;
  status: EpisodeStatus; access: AccessTier;
  number?: number; season?: number;
  publishAt?: string; publishedAt?: string;
  plays: number; likes: number; comments: number;
  chapters: Array<{ time: number; title: string }>;
  transcript?: Array<{ time: number; speaker?: string; text: string }>;
  priceCents?: number;
  createdAt: string; updatedAt: string;
}

export interface Album {
  id: string; ownerId: string;
  title: string; description: string;
  episodeIds: string[]; coverUrl?: string;
  visibility: 'private' | 'unlisted' | 'public';
  createdAt: string; updatedAt: string;
}

export interface LibraryItem {
  id: string; userId: string; showId: string;
  subscribed: boolean; favourite: boolean; lastPlayedAt?: string;
}

export interface QueueItem {
  id: string; userId: string; episodeId: string; position: number; addedAt: string;
}

export interface Recording {
  id: string; ownerId: string; showId?: string;
  title: string; status: RecordingStatus;
  durationSec: number; audioKey?: string;
  startedAt: string; finishedAt?: string;
  errorMessage?: string;
}

export interface Purchase {
  id: string; userId: string;
  kind: 'episode' | 'show' | 'album' | 'subscription' | 'donation';
  refId: string;
  amountCents: number; currency: string;
  status: PurchaseStatus;
  provider: 'stripe' | 'paddle' | 'manual';
  providerRef?: string;
  createdAt: string;
}

export interface SignedUrl { url: string; method: 'GET' | 'PUT'; expiresAt: string; key: string; }

/* DTO inputs */
export interface CreateShowDto { title: string; description?: string; category?: string; tags?: string[]; access?: AccessTier; language?: string; coverUrl?: string; rssUrl?: string; }
export interface UpdateShowDto extends Partial<CreateShowDto> { status?: ShowStatus; }
export interface CreateEpisodeDto { showId: string; title: string; description?: string; audioKey?: string; durationSec?: number; access?: AccessTier; priceCents?: number; chapters?: Array<{ time: number; title: string }>; transcript?: Array<{ time: number; speaker?: string; text: string }>; publishAt?: string; }
export interface UpdateEpisodeDto extends Partial<Omit<CreateEpisodeDto, 'showId'>> { status?: EpisodeStatus; }
export interface CreateAlbumDto { title: string; description?: string; episodeIds: string[]; visibility?: Album['visibility']; coverUrl?: string; }
export interface UpdateAlbumDto extends Partial<CreateAlbumDto> {}
export interface PurchaseDto { kind: Purchase['kind']; refId: string; amountCents: number; currency?: string; provider?: Purchase['provider']; }
export interface RecordingStartDto { title: string; showId?: string; }
export interface RecordingFinishDto { durationSec: number; audioKey: string; }
