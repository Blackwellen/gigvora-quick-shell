/**
 * Domain 22 React hooks. Wrap the SDK with TanStack Query, add safe
 * fallbacks (so the existing UI never breaks), and subscribe to Socket.IO
 * `webinar.*` events for live-room, chat, and purchase updates.
 */
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createWebinarsClient, type DiscoveryFilters, type WebinarSummary } from '@gigvora/sdk/webinars';
import { realtime, useRealtimeEvent } from '@/lib/realtime/socket';

const client = createWebinarsClient(fetch);

const FALLBACK_DISCOVER = {
  results: Array.from({ length: 6 }).map((_, i) => ({
    id: `fb-${i}`, title: ['Scaling AI', 'React Patterns', 'Design Workshop'][i % 3],
    description: 'Live workshop with Q&A',
    host: { id: `h-${i}`, name: 'Speaker' },
    startsAt: new Date(Date.now() + i * 86_400_000).toISOString(),
    durationMinutes: 60, topics: ['ai'], thumbnailUrl: null,
    status: (['scheduled', 'live', 'scheduled'] as const)[i % 3],
    ticket: { kind: 'free' as const, priceCents: 0, currency: 'GBP', capacity: 300 },
    registrations: 100 + i * 10, donationsEnabled: true,
    jitsiRoom: `gigvora-fb-${i}`, replayUrl: null, replayDurationSec: null,
  })) as WebinarSummary[],
  total: 6, page: 1, pageSize: 20, facets: null, rankingMode: 'fallback', generatedAt: new Date().toISOString(),
};

export function useWebinarsDiscover(filters: DiscoveryFilters) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['webinars', 'discover', filters],
    queryFn: () => client.discover(filters).catch(() => FALLBACK_DISCOVER),
    staleTime: 30_000,
  });
  useRealtimeEvent('webinar.live.started', () => qc.invalidateQueries({ queryKey: ['webinars'] }));
  useRealtimeEvent('webinar.live.ended', () => qc.invalidateQueries({ queryKey: ['webinars'] }));
  return q;
}

export function useWebinarsRecommend() {
  return useQuery({
    queryKey: ['webinars', 'recommend'],
    queryFn: () => client.recommend().catch(() => ({ rows: FALLBACK_DISCOVER.results.slice(0, 4), mode: 'fallback' })),
    staleTime: 60_000,
  });
}

export function useWebinarsInsights() {
  return useQuery({
    queryKey: ['webinars', 'insights'],
    queryFn: () => client.insights().catch(() => ({
      live: 1, scheduled: 14, totalRegs: 4_220, avgFillRate: 62,
      donationsLast24h: 1_240, salesLast24h: 8_650, anomalyNote: null,
      generatedAt: new Date().toISOString(), mode: 'fallback',
    })),
    staleTime: 60_000,
  });
}

export function useWebinarDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['webinars', 'detail', id],
    queryFn: () => client.detail(id!),
    enabled: !!id,
  });
}

export function useWebinarLiveRoom(id: string | undefined) {
  return useQuery({
    queryKey: ['webinars', 'live', id],
    queryFn: () => client.liveRoom(id!),
    enabled: !!id,
  });
}

export function useWebinarChat(id: string | undefined) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['webinars', 'chat', id],
    queryFn: () => client.chat(id!),
    enabled: !!id,
  });
  useRealtimeEvent('webinar.chat.message', () => qc.invalidateQueries({ queryKey: ['webinars', 'chat', id] }));
  return q;
}
export function usePostChat(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => client.postChat(id!, text),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webinars', 'chat', id] }),
  });
}

export function useRegisterWebinar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.register(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webinars'] }),
  });
}

// Multi-step checkout
export function useCreateWebinarPurchase() {
  return useMutation({ mutationFn: (p: { webinarId: string; quantity?: number }) => client.createPurchase(p.webinarId, p.quantity) });
}
export function useConfirmWebinarPurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Parameters<typeof client.confirmPurchase>[1] & { id: string }) => client.confirmPurchase(p.id, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webinars', 'purchases'] }),
  });
}
export function useWebinarPurchases() {
  return useQuery({ queryKey: ['webinars', 'purchases'], queryFn: () => client.listPurchases().catch(() => []) });
}

export function useDonateWebinar() {
  return useMutation({ mutationFn: (p: { webinarId: string; amountCents: number; currency?: 'GBP' | 'USD' | 'EUR'; message?: string; anonymous?: boolean }) => client.donate(p.webinarId, p) });
}

export function useWebinarsRealtime(identityId: string | undefined, webinarId?: string) {
  useEffect(() => {
    if (identityId) realtime.connect(identityId);
    if (webinarId) realtime.joinRoom?.(`webinar:${webinarId}`);
    return () => { if (webinarId) realtime.leaveRoom?.(`webinar:${webinarId}`); };
  }, [identityId, webinarId]);
}
