/** FD-14 — frontend hook reading `/api/v1/realtime/counters` + live deltas. */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { realtime, useRealtimeEvent } from '@/lib/realtime/socket';

const BASE = (import.meta as any).env?.VITE_GIGVORA_API_URL ?? '';
const URL  = BASE ? `${BASE}/api/v1/realtime/counters` : '';

export interface CountersSnapshot { counters: Record<string, number>; ts: number }

const FX: CountersSnapshot = { counters: { 'inbox.unread': 0, 'feed.new': 0, 'queue.depth.notifications': 0 }, ts: Date.now() };

export function useRealtimeCounters(identityId?: string) {
  const [counters, setCounters] = useState<Record<string, number>>({});

  // Open the singleton socket once an identity is known.
  useEffect(() => {
    if (!identityId) return;
    realtime.connect(identityId).catch(() => null);
    realtime.joinTopic('global');
    return () => { /* keep socket open across pages */ };
  }, [identityId]);

  // Snapshot from REST.
  const snap = useQuery<CountersSnapshot>({
    queryKey: ['realtime-counters', identityId ?? 'anon'],
    queryFn: async () => {
      if (!URL) return FX;
      const r = await fetch(URL, { credentials: 'include' });
      if (!r.ok) throw new Error(`http_${r.status}`);
      return r.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  useEffect(() => { if (snap.data?.counters) setCounters(snap.data.counters); }, [snap.data]);

  // Live deltas
  useRealtimeEvent<{ key: string; value: number }>('counter.update', (p) => {
    setCounters((prev) => ({ ...prev, [p.key]: p.value }));
  });

  return { counters, isLoading: snap.isLoading, isError: snap.isError };
}

/** Singular counter convenience (e.g. inbox badge). */
export function useRealtimeCounter(key: string, identityId?: string) {
  const { counters, ...rest } = useRealtimeCounters(identityId);
  return { value: counters[key] ?? 0, ...rest };
}
