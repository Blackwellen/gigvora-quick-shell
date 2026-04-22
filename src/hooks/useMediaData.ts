import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API = '/api/v1/media';

async function safeFetch<T>(url: string, init?: RequestInit, fallback?: T): Promise<T> {
  try {
    const r = await fetch(url, { headers: { 'content-type': 'application/json' }, ...init });
    if (!r.ok) throw new Error(`${r.status}`);
    return (await r.json()) as T;
  } catch (e) {
    if (fallback !== undefined) return fallback;
    throw e;
  }
}

export interface MediaAsset {
  id: string; ownerId: string; kind: 'image' | 'video' | 'audio' | 'document' | 'other';
  status: 'draft' | 'pending' | 'processing' | 'active' | 'paused' | 'archived' | 'failed' | 'escalated' | 'restricted';
  filename: string; title?: string; description?: string; tags: string[];
  mimeType: string; sizeBytes: number; durationSec?: number; width?: number; height?: number; pages?: number;
  thumbnailUrl?: string; posterUrl?: string;
  views: number; downloads: number; likes: number; comments: number;
  moderation: { verdict: string; reason?: string; scannedAt?: string };
  createdAt: string; updatedAt: string;
}

export interface MediaGallery {
  id: string; ownerId: string; title: string; slug: string;
  description?: string; visibility: 'private' | 'unlisted' | 'org' | 'public';
  status: 'draft' | 'active' | 'archived';
  itemIds: string[]; coverAssetId?: string; views: number;
  createdAt: string; updatedAt: string;
}

export interface MediaInsights {
  summary: { total: number; byKind: Record<string, number>; totalViews: number; totalDownloads: number;
    stuckProcessing: number; failed: number; moderationReview: number };
  topPerformers: { id: string; views: number; likes: number }[];
  anomalies: { code: string; severity: 'info' | 'warning' | 'critical'; message: string }[];
  source: string; generatedAt: string;
}

const EMPTY_INSIGHTS: MediaInsights = {
  summary: { total: 0, byKind: {}, totalViews: 0, totalDownloads: 0, stuckProcessing: 0, failed: 0, moderationReview: 0 },
  topPerformers: [], anomalies: [], source: 'empty', generatedAt: new Date().toISOString(),
};

export function useMediaAssets(filter: { kind?: string; status?: string; q?: string; tag?: string } = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v != null && v !== '') as [string, string][]).toString();
  return useQuery({
    queryKey: ['media', 'assets', filter],
    queryFn: () => safeFetch<{ items: MediaAsset[]; total: number }>(`${API}/assets${qs ? `?${qs}` : ''}`, undefined, { items: [], total: 0 }),
    staleTime: 30_000,
  });
}

export function useMediaAsset(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ['media', 'asset', id],
    queryFn: () => safeFetch<MediaAsset>(`${API}/assets/${encodeURIComponent(id!)}`),
  });
}

export function useGalleries(filter: { visibility?: string; q?: string } = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v != null && v !== '') as [string, string][]).toString();
  return useQuery({
    queryKey: ['media', 'galleries', filter],
    queryFn: () => safeFetch<{ items: MediaGallery[] }>(`${API}/galleries${qs ? `?${qs}` : ''}`, undefined, { items: [] }),
  });
}

export function useGallery(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ['media', 'gallery', id],
    queryFn: () => safeFetch<{ gallery: MediaGallery; items: MediaAsset[] }>(`${API}/galleries/${encodeURIComponent(id!)}`),
  });
}

export function usePublicGallery(slug: string | undefined) {
  return useQuery({
    enabled: !!slug,
    queryKey: ['media', 'public-gallery', slug],
    queryFn: () => safeFetch<{ gallery: MediaGallery; items: MediaAsset[] }>(`${API}/public/galleries/${encodeURIComponent(slug!)}`),
  });
}

export function useMediaAttachments(filter: { contextKind?: string; contextId?: string; assetId?: string } = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v != null && v !== '') as [string, string][]).toString();
  return useQuery({
    queryKey: ['media', 'attachments', filter],
    queryFn: () => safeFetch<{ items: any[] }>(`${API}/attachments${qs ? `?${qs}` : ''}`, undefined, { items: [] }),
  });
}

export function useMediaInsights() {
  return useQuery({
    queryKey: ['media', 'insights'],
    queryFn: () => safeFetch<MediaInsights>(`${API}/insights`, undefined, EMPTY_INSIGHTS),
    refetchInterval: 60_000,
  });
}

export function useCreateMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: any) => safeFetch<MediaAsset>(`${API}/assets`, { method: 'POST', body: JSON.stringify(b) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  });
}

export function useUpdateMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      safeFetch<MediaAsset>(`${API}/assets/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  });
}

export function useArchiveMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => safeFetch<MediaAsset>(`${API}/assets/${encodeURIComponent(id)}/archive`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  });
}

export function useRetryMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => safeFetch<MediaAsset>(`${API}/assets/${encodeURIComponent(id)}/retry`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  });
}

export function useSignMediaUpload() {
  return useMutation({
    mutationFn: (b: any) => safeFetch<{ asset: MediaAsset; upload: { url: string; method: string; expiresAt: string } }>(
      `${API}/sign/upload`, { method: 'POST', body: JSON.stringify(b) }
    ),
  });
}

export function useSignMediaDownload() {
  return useMutation({
    mutationFn: (id: string) => safeFetch<{ url: string; method: string; expiresAt: string }>(
      `${API}/sign/download/${encodeURIComponent(id)}`
    ),
  });
}

export function useAttachMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: { assetId: string; contextKind: string; contextId: string; pinned?: boolean }) =>
      safeFetch<any>(`${API}/attachments`, { method: 'POST', body: JSON.stringify(b) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media', 'attachments'] }),
  });
}

export function useDetachMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => safeFetch<{ ok: boolean }>(`${API}/attachments/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media', 'attachments'] }),
  });
}
