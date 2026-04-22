// Domain 18 — Live data hooks for Calls / Video / Presence / Contact Windows.
// Wraps the SDK and falls back gracefully so the existing CallsVideoPage UI
// can opt into live data without rewriting its presentational components.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  SdkCallRecord, SdkPresenceSnapshot, SdkContactWindow, SdkCallInsights,
} from '@/../packages/sdk/src/calls';

const API = '/api/v1/calls';

async function safeFetch<T>(url: string, init?: RequestInit, fallback?: T): Promise<T> {
  try {
    const r = await fetch(url, { headers: { 'content-type': 'application/json' }, ...init });
    if (!r.ok) throw new Error(`${r.status}`);
    return (await r.json()) as T;
  } catch {
    if (fallback !== undefined) return fallback;
    throw new Error('offline');
  }
}

export function useCallsList(filter: { status?: string; kind?: string; q?: string } = {}) {
  const qs = new URLSearchParams(filter as Record<string, string>).toString();
  return useQuery({
    queryKey: ['calls', 'list', filter],
    queryFn: () => safeFetch<{ items: SdkCallRecord[]; source: string }>(
      `${API}${qs ? `?${qs}` : ''}`, undefined, { items: [], source: 'fallback' },
    ),
    staleTime: 30_000,
  });
}

export function useCallInsights() {
  return useQuery({
    queryKey: ['calls', 'insights'],
    queryFn: () => safeFetch<SdkCallInsights>(`${API}/insights`, undefined, {
      source: 'fallback', cards: [], anomalies: [],
    }),
    staleTime: 60_000,
  });
}

export function usePresence(userIds: string[]) {
  return useQuery({
    queryKey: ['calls', 'presence', userIds.join(',')],
    queryFn: () => safeFetch<SdkPresenceSnapshot[]>(
      `${API}/presence/snapshot?userIds=${encodeURIComponent(userIds.join(','))}`,
      undefined, userIds.map(id => ({ userId: id, state: 'offline' as const, lastSeenAt: new Date(0).toISOString() })),
    ),
    enabled: userIds.length > 0,
    refetchInterval: 30_000,
  });
}

export function useContactWindows() {
  return useQuery({
    queryKey: ['calls', 'windows'],
    queryFn: () => safeFetch<SdkContactWindow[]>(`${API}/windows/list`, undefined, []),
  });
}

export function useCreateCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => safeFetch<SdkCallRecord>(`${API}`, {
      method: 'POST', body: JSON.stringify(body),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calls', 'list'] }),
  });
}

export function useEndCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, durationSeconds, recordingUrl }: { id: string; durationSeconds: number; recordingUrl?: string }) =>
      safeFetch<SdkCallRecord>(`${API}/${encodeURIComponent(id)}/end`, {
        method: 'POST', body: JSON.stringify({ durationSeconds, recordingUrl }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calls'] }),
  });
}

export function useRescheduleCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scheduledAt, reason }: { id: string; scheduledAt: string; reason?: string }) =>
      safeFetch<SdkCallRecord>(`${API}/${encodeURIComponent(id)}/reschedule`, {
        method: 'POST', body: JSON.stringify({ scheduledAt, reason }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calls'] }),
  });
}
