import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BASE = (import.meta as any).env?.VITE_API_URL ?? '';

async function safeFetch<T>(path: string, init?: RequestInit, fallback?: T): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, { headers: { 'content-type': 'application/json' }, ...init });
    if (!res.ok) throw new Error(`${res.status}`);
    return (await res.json()) as T;
  } catch (e) {
    if (fallback !== undefined) return fallback;
    throw e;
  }
}

const qs = (q: Record<string, any>) => {
  const p = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, String(v)); });
  const s = p.toString(); return s ? `?${s}` : '';
};

/* Discovery / shows */
export const useDiscoverPodcasts = (q: Record<string, any> = {}) =>
  useQuery({
    queryKey: ['podcasts', 'discover', q],
    queryFn: () => safeFetch<{ items: any[]; ranking?: any }>(`/api/v1/podcasts/discover${qs(q)}`, undefined, { items: [] }),
    staleTime: 30_000,
  });

export const useShows = (q: Record<string, any> = {}) =>
  useQuery({
    queryKey: ['podcasts', 'shows', q],
    queryFn: () => safeFetch<{ items: any[]; total: number }>(`/api/v1/podcasts/shows${qs(q)}`, undefined, { items: [], total: 0 }),
    staleTime: 30_000,
  });

export const useShow = (idOrSlug?: string) =>
  useQuery({
    enabled: !!idOrSlug,
    queryKey: ['podcasts', 'show', idOrSlug],
    queryFn: () => safeFetch<{ show: any; episodes: any[] }>(`/api/v1/podcasts/shows/${encodeURIComponent(idOrSlug!)}`),
  });

/* Episodes */
export const useEpisodes = (q: Record<string, any> = {}) =>
  useQuery({
    queryKey: ['podcasts', 'episodes', q],
    queryFn: () => safeFetch<{ items: any[]; total: number }>(`/api/v1/podcasts/episodes${qs(q)}`, undefined, { items: [], total: 0 }),
    staleTime: 30_000,
  });

export const useEpisode = (id?: string) =>
  useQuery({
    enabled: !!id,
    queryKey: ['podcasts', 'episode', id],
    queryFn: () => safeFetch<{ episode: any; show: any }>(`/api/v1/podcasts/episodes/${encodeURIComponent(id!)}`),
  });

export const usePlayEpisode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => safeFetch<{ ok: boolean; plays: number }>(`/api/v1/podcasts/episodes/${encodeURIComponent(id)}/play`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['podcasts'] }),
  });
};

export const useSignDownload = () =>
  useMutation({
    mutationFn: (episodeId: string) => safeFetch<{ url: string; expiresAt: string }>(`/api/v1/podcasts/sign/download/${encodeURIComponent(episodeId)}`),
  });

/* Library & queue */
export const useLibrary = () =>
  useQuery({ queryKey: ['podcasts', 'library'], queryFn: () => safeFetch<{ items: any[] }>('/api/v1/podcasts/library', undefined, { items: [] }) });

export const useToggleSubscribe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ showId, subscribed }: { showId: string; subscribed: boolean }) =>
      safeFetch(`/api/v1/podcasts/library/${subscribed ? 'unsubscribe' : 'subscribe'}/${encodeURIComponent(showId)}`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['podcasts'] }); },
  });
};

export const useQueue = () =>
  useQuery({ queryKey: ['podcasts', 'queue'], queryFn: () => safeFetch<{ items: any[] }>('/api/v1/podcasts/queue', undefined, { items: [] }) });

export const useEnqueue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (episodeId: string) => safeFetch(`/api/v1/podcasts/queue/${encodeURIComponent(episodeId)}`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['podcasts', 'queue'] }),
  });
};

/* Recordings */
export const useRecordings = () =>
  useQuery({ queryKey: ['podcasts', 'recordings'], queryFn: () => safeFetch<{ items: any[] }>('/api/v1/podcasts/recordings', undefined, { items: [] }) });

export const useStartRecording = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: { title: string; showId?: string }) => safeFetch('/api/v1/podcasts/recordings/start', { method: 'POST', body: JSON.stringify(b) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['podcasts', 'recordings'] }),
  });
};

export const useFinishRecording = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, durationSec, audioKey }: { id: string; durationSec: number; audioKey: string }) =>
      safeFetch(`/api/v1/podcasts/recordings/${encodeURIComponent(id)}/finish`, { method: 'POST', body: JSON.stringify({ durationSec, audioKey }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['podcasts', 'recordings'] }),
  });
};

/* Purchases — multi-step (cart → review → confirm → success/failure) */
export const usePurchases = () =>
  useQuery({ queryKey: ['podcasts', 'purchases'], queryFn: () => safeFetch<{ items: any[] }>('/api/v1/podcasts/purchases', undefined, { items: [] }) });

export const useCreatePurchase = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: { kind: 'episode'|'show'|'album'|'subscription'|'donation'; refId: string; amountCents: number; currency?: string; provider?: 'stripe'|'paddle'|'manual' }) =>
      safeFetch<{ id: string; status: string }>('/api/v1/podcasts/purchases', { method: 'POST', body: JSON.stringify(b) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['podcasts', 'purchases'] }),
  });
};

export const useConfirmPurchase = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, providerRef }: { id: string; providerRef?: string }) =>
      safeFetch<{ id: string; status: string }>(`/api/v1/podcasts/purchases/${encodeURIComponent(id)}/confirm`, { method: 'POST', body: JSON.stringify({ providerRef }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['podcasts', 'purchases'] }),
  });
};

export const useRefundPurchase = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => safeFetch(`/api/v1/podcasts/purchases/${encodeURIComponent(id)}/refund`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['podcasts', 'purchases'] }),
  });
};

/* Albums */
export const useAlbums = (q: Record<string, any> = {}) =>
  useQuery({ queryKey: ['podcasts', 'albums', q], queryFn: () => safeFetch<{ items: any[] }>(`/api/v1/podcasts/albums${qs(q)}`, undefined, { items: [] }) });

export const useAlbum = (id?: string) =>
  useQuery({ enabled: !!id, queryKey: ['podcasts', 'album', id], queryFn: () => safeFetch<any>(`/api/v1/podcasts/albums/${encodeURIComponent(id!)}`) });

/* Insights */
export const usePodcastInsights = () =>
  useQuery({
    queryKey: ['podcasts', 'insights'],
    queryFn: () => safeFetch<any>('/api/v1/podcasts/insights', undefined, {
      generatedAt: new Date().toISOString(),
      totals: { shows: 0, episodes: 0, totalPlays: 0, revenueCents: 0 },
      summary: 'No insights yet — connect a show to see analytics.',
      anomalies: [],
      revenueBands: [],
    }),
    staleTime: 60_000,
  });

export const useRecommendNext = () =>
  useQuery({
    queryKey: ['podcasts', 'recommend-next'],
    queryFn: () => safeFetch<{ ranked: Array<{ id: string; score: number; showId?: string }>; reason: string }>('/api/v1/podcasts/ml/recommend-next', undefined, { ranked: [], reason: 'unavailable' }),
    staleTime: 60_000,
  });
