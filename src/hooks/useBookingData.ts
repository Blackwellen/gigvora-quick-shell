// Domain 19 — Calendar Booking data hooks.
// Wraps the booking REST surface and degrades gracefully so the existing
// CalendarPage UI stays intact when the API is offline.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  SdkBookingLink, SdkTimeSlot, SdkAppointment, SdkBookingInsights,
} from '@/../packages/sdk/src/booking';

const API = '/api/v1/booking';

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

export function useBookingLinks() {
  return useQuery({
    queryKey: ['booking', 'links'],
    queryFn: () => safeFetch<{ items: SdkBookingLink[] }>(`${API}/links`, undefined, { items: [] }),
    staleTime: 60_000,
  });
}

export function useAppointments(filter: { linkId?: string; status?: string } = {}) {
  const qs = new URLSearchParams(filter as Record<string, string>).toString();
  return useQuery({
    queryKey: ['booking', 'appointments', filter],
    queryFn: () => safeFetch<{ items: SdkAppointment[]; source: string }>(
      `${API}/appointments${qs ? `?${qs}` : ''}`, undefined, { items: [], source: 'fallback' },
    ),
    staleTime: 30_000,
  });
}

export function useAvailability(linkId: string, from: string, to: string) {
  return useQuery({
    queryKey: ['booking', 'availability', linkId, from, to],
    queryFn: () => safeFetch<{ items: SdkTimeSlot[] }>(
      `${API}/availability?linkId=${encodeURIComponent(linkId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      undefined, { items: [] },
    ),
    enabled: Boolean(linkId && from && to),
  });
}

export function useBookingInsights() {
  return useQuery({
    queryKey: ['booking', 'insights'],
    queryFn: () => safeFetch<SdkBookingInsights>(`${API}/insights`, undefined, {
      source: 'fallback', cards: [], anomalies: [],
    }),
    staleTime: 60_000,
  });
}

export function useBookAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: any) => safeFetch<SdkAppointment>(`${API}/appointments`, {
      method: 'POST', body: JSON.stringify(b),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['booking'] }),
  });
}

export function useRescheduleAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, startAt, reason }: { id: string; startAt: string; reason?: string }) =>
      safeFetch<SdkAppointment>(`${API}/appointments/${encodeURIComponent(id)}/reschedule`, {
        method: 'POST', body: JSON.stringify({ startAt, reason }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['booking'] }),
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      safeFetch<SdkAppointment>(`${API}/appointments/${encodeURIComponent(id)}/cancel`, {
        method: 'POST', body: JSON.stringify({ reason }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['booking'] }),
  });
}

export function useApproveAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => safeFetch<SdkAppointment>(`${API}/appointments/${encodeURIComponent(id)}/approve`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['booking'] }),
  });
}
