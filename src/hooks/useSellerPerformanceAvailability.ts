/**
 * Domain 46 hooks — Seller Performance, Capacity, Availability, and Offer Optimization.
 * Demo-mode fallback keeps existing UI alive when the NestJS backend is unreachable.
 */
import { useCallback, useEffect, useState } from 'react';

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? '';

export type AvailabilityStatus = 'online' | 'away' | 'vacation' | 'paused';

export interface GigCapacityRow {
  id: string;
  gig_id: string;
  status: 'active' | 'paused' | 'archived';
  queue_depth: number;
  max_queue: number;
  paused_reason?: string | null;
}

export interface OptimizationRow {
  id: string;
  suggestion_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
  expected_lift?: string | null;
  status: 'open' | 'dismissed' | 'applied';
}

export interface SellerOverview {
  availability: {
    status: AvailabilityStatus;
    timezone: string;
    max_concurrent_orders: number;
    auto_pause_threshold: number;
    response_target_hours: number;
    vacation_start?: string | null;
    vacation_end?: string | null;
    working_hours: Record<string, { enabled: boolean; start: string | null; end: string | null }>;
  };
  capacity: GigCapacityRow[];
  snapshot: {
    orders_completed: number;
    on_time_rate: string;
    response_rate: string;
    rating: string;
    avg_response_minutes: number;
    earnings: string;
  };
  optimizations: OptimizationRow[];
  derived: { totalQueue: number; activeGigs: number; pausedGigs: number };
}

const DEMO_OVERVIEW: SellerOverview = {
  availability: {
    status: 'online',
    timezone: 'UTC',
    max_concurrent_orders: 5,
    auto_pause_threshold: 8,
    response_target_hours: 2,
    vacation_start: null,
    vacation_end: null,
    working_hours: {
      mon: { enabled: true, start: '09:00', end: '18:00' },
      tue: { enabled: true, start: '09:00', end: '18:00' },
      wed: { enabled: true, start: '09:00', end: '18:00' },
      thu: { enabled: true, start: '09:00', end: '18:00' },
      fri: { enabled: true, start: '09:00', end: '18:00' },
      sat: { enabled: false, start: null, end: null },
      sun: { enabled: false, start: null, end: null },
    },
  },
  capacity: [
    { id: 'demo-1', gig_id: 'logo-design', status: 'active', queue_depth: 3, max_queue: 5 },
    { id: 'demo-2', gig_id: 'brand-identity', status: 'active', queue_depth: 1, max_queue: 3 },
    { id: 'demo-3', gig_id: 'ux-audit', status: 'paused', queue_depth: 0, max_queue: 2 },
  ],
  snapshot: {
    orders_completed: 24, on_time_rate: '0.96', response_rate: '0.92',
    rating: '4.9', avg_response_minutes: 47, earnings: '4250.00',
  },
  optimizations: [
    {
      id: 'opt-1', suggestion_type: 'pricing', severity: 'info',
      title: 'Test a premium tier', detail: 'Buyers in your category convert 18% on premium when offered.',
      status: 'open',
    },
  ],
  derived: { totalQueue: 4, activeGigs: 2, pausedGigs: 1 },
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export function useSellerOverview(sellerId: string) {
  const [data, setData] = useState<SellerOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api<SellerOverview>(`/api/seller-performance/${sellerId}/overview`);
      setData(r);
      setDemoMode(false);
      setError(null);
    } catch (e) {
      setData(DEMO_OVERVIEW);
      setDemoMode(true);
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, error, demoMode, refresh };
}

export function useSellerActions(sellerId: string, onChange?: () => void) {
  const updateAvailability = useCallback(async (patch: Partial<SellerOverview['availability']> & { workingHours?: any }) => {
    try {
      await api(`/api/seller-performance/${sellerId}/availability`, {
        method: 'PUT', body: JSON.stringify(patch),
      });
    } finally { onChange?.(); }
  }, [sellerId, onChange]);

  const scheduleVacation = useCallback(async (start: string, end: string, message?: string) => {
    try {
      await api(`/api/seller-performance/${sellerId}/vacation`, {
        method: 'POST', body: JSON.stringify({ start, end, message }),
      });
    } finally { onChange?.(); }
  }, [sellerId, onChange]);

  const pauseAll = useCallback(async () => {
    try { await api(`/api/seller-performance/${sellerId}/pause-all`, { method: 'POST' }); }
    finally { onChange?.(); }
  }, [sellerId, onChange]);

  const setGigStatus = useCallback(async (gigId: string, status: 'active' | 'paused' | 'archived', reason?: string) => {
    try {
      await api(`/api/seller-performance/${sellerId}/gigs/${gigId}/capacity`, {
        method: 'PUT', body: JSON.stringify({ status, pausedReason: reason }),
      });
    } finally { onChange?.(); }
  }, [sellerId, onChange]);

  const actOnOptimization = useCallback(async (id: string, action: 'dismiss' | 'apply') => {
    try {
      await api(`/api/seller-performance/${sellerId}/optimizations/${id}`, {
        method: 'POST', body: JSON.stringify({ action }),
      });
    } finally { onChange?.(); }
  }, [sellerId, onChange]);

  return { updateAvailability, scheduleVacation, pauseAll, setGigStatus, actOnOptimization };
}
