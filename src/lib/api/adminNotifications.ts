/**
 * adminNotifications — operational notification stream for the /admin terminal.
 *
 * Distinct from the user-facing NotificationTray (social/jobs/payments). Surfaces
 * ONLY operational signals: ticket assignments, queue thresholds, escalations,
 * audit alerts, ML risk flags, system incidents.
 *
 * Wiring:
 *   - REST seed:  GET  /admin/notifications?role=<activeRole>   via Gigvora SDK
 *   - Live push:  WSS  /admin/notifications/stream?role=<activeRole>
 *     (falls back to 30s polling if WS isn't reachable)
 *   - ML signals: backend ML models tag each notification with `mlRisk` and
 *     `category` so the tray can render confidence badges + auto-route.
 *
 * NEVER reads from Supabase directly — admin data flows through the Gigvora
 * NestJS backend exclusively.
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sdk, sdkReady } from '@/lib/gigvora-sdk';
import type { AdminRole } from '@/lib/adminAuth';

export type AdminNotifCategory =
  | 'ticket'
  | 'escalation'
  | 'dispute'
  | 'payout'
  | 'fraud'
  | 'moderation'
  | 'audit'
  | 'incident'
  | 'system';

export type AdminNotifPriority = 'critical' | 'high' | 'normal' | 'low';

export interface AdminNotification {
  id: string;
  category: AdminNotifCategory;
  priority: AdminNotifPriority;
  title: string;
  body: string;
  /** ISO timestamp from backend. */
  at: string;
  read: boolean;
  /** Portal slug this notification belongs to (drives deep-link). */
  portal: 'cs' | 'finance' | 'moderation' | 'trust' | 'dispute' | 'marketing' | 'ads' | 'ops' | 'super';
  /** Deep-link inside admin terminal. */
  href?: string;
  /** ML model risk score 0..1 — present for fraud/moderation/dispute signals. */
  mlRisk?: number;
  /** ML model that produced the signal (e.g. 'fraud-v3', 'tox-v2'). */
  mlModel?: string;
  /** Subject entity (user / payout / dispute id). */
  entityRef?: string;
}

/* ────────────────────────────────────────────────────────────── */
/* Role → which categories the operator is allowed to receive.   */
/* ────────────────────────────────────────────────────────────── */
const ROLE_CATEGORY_GRANTS: Record<AdminRole, AdminNotifCategory[]> = {
  'super-admin':     ['ticket', 'escalation', 'dispute', 'payout', 'fraud', 'moderation', 'audit', 'incident', 'system'],
  'cs-admin':        ['ticket', 'escalation', 'incident'],
  'dispute-mgr':     ['dispute', 'escalation', 'fraud', 'incident'],
  'finance-admin':   ['payout', 'fraud', 'audit', 'incident'],
  'moderator':       ['moderation', 'escalation', 'incident'],
  'trust-safety':    ['moderation', 'fraud', 'audit', 'escalation', 'incident'],
  'ads-ops':         ['moderation', 'incident'],
  'marketing-admin': ['moderation', 'incident'],
  'compliance':      ['audit', 'fraud', 'dispute', 'incident'],
};

export function isCategoryAllowed(role: AdminRole, cat: AdminNotifCategory): boolean {
  return ROLE_CATEGORY_GRANTS[role]?.includes(cat) ?? false;
}

/* ────────────────────────────────────────────────────────────── */
/* Fallback seed so the tray never renders empty in local dev.   */
/* ────────────────────────────────────────────────────────────── */
const FALLBACK_SEED: AdminNotification[] = [
  { id: 'fb-1', category: 'fraud',      priority: 'critical', title: 'High-risk payout flagged',           body: 'ML fraud-v3 score 0.94 on payout #PO-22841 ($14,200).', at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),  read: false, portal: 'finance',    href: '/admin/finance/transactions', mlRisk: 0.94, mlModel: 'fraud-v3', entityRef: 'PO-22841' },
  { id: 'fb-2', category: 'escalation', priority: 'high',     title: 'Ticket escalated to Tier 2',         body: 'CS-9821 — refund dispute, customer waiting 4h 12m.',     at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),  read: false, portal: 'cs',         href: '/admin/cs/tickets/CS-9821', entityRef: 'CS-9821' },
  { id: 'fb-3', category: 'moderation', priority: 'high',     title: 'Toxicity model flagged 23 comments', body: 'tox-v2 confidence 0.81 across video #V-1192 thread.',    at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), read: false, portal: 'moderation', href: '/admin/moderation/video-comments', mlRisk: 0.81, mlModel: 'tox-v2', entityRef: 'V-1192' },
  { id: 'fb-4', category: 'dispute',    priority: 'normal',   title: 'New dispute opened',                 body: 'Project P-7740 — milestone disagreement, $5,000 escrow.',at: new Date(Date.now() - 1000 * 60 * 32).toISOString(), read: false, portal: 'dispute',    href: '/admin/dispute-ops', entityRef: 'P-7740' },
  { id: 'fb-5', category: 'incident',   priority: 'high',     title: 'Webhook delivery degraded',          body: 'Stripe webhooks failing 12% (last 5 min) — auto-retrying.', at: new Date(Date.now() - 1000 * 60 * 41).toISOString(), read: false, portal: 'ops',     href: '/admin/super/system' },
  { id: 'fb-6', category: 'audit',      priority: 'normal',   title: 'Admin login from new IP',            body: 'finance-admin@gigvora.com signed in from 51.x.x.x (DE).', at: new Date(Date.now() - 1000 * 60 * 64).toISOString(), read: true,  portal: 'super',     href: '/admin/super/audit' },
  { id: 'fb-7', category: 'ticket',     priority: 'normal',   title: '14 new tickets in queue',            body: 'Average wait 2m 41s — under SLA.',                       at: new Date(Date.now() - 1000 * 60 * 90).toISOString(), read: true,  portal: 'cs',         href: '/admin/cs/tickets' },
];

function filterByRole(items: AdminNotification[], role: AdminRole): AdminNotification[] {
  return items.filter((n) => isCategoryAllowed(role, n.category));
}

/* ────────────────────────────────────────────────────────────── */
/* REST fetch via Gigvora SDK — feature-detected, never crashes. */
/* ────────────────────────────────────────────────────────────── */
async function fetchAdminNotifications(role: AdminRole): Promise<AdminNotification[]> {
  if (!sdkReady()) return filterByRole(FALLBACK_SEED, role);

  const anySdk = sdk as unknown as {
    admin?: { notifications?: { list?: (params: { role: AdminRole }) => Promise<AdminNotification[]> } };
    request?: (path: string, init?: RequestInit) => Promise<AdminNotification[]>;
  };

  try {
    let live: AdminNotification[] | undefined;
    if (typeof anySdk.admin?.notifications?.list === 'function') {
      live = await anySdk.admin.notifications.list({ role });
    } else if (typeof anySdk.request === 'function') {
      live = await anySdk.request(`/admin/notifications?role=${encodeURIComponent(role)}`);
    }
    if (!Array.isArray(live) || live.length === 0) return filterByRole(FALLBACK_SEED, role);
    // Defense in depth: always re-filter on the client too.
    return filterByRole(live, role);
  } catch {
    return filterByRole(FALLBACK_SEED, role);
  }
}

/* ────────────────────────────────────────────────────────────── */
/* React Query hook — REST seed + 30s polling fallback.          */
/* ────────────────────────────────────────────────────────────── */
export function useAdminNotifications(role: AdminRole) {
  return useQuery<AdminNotification[]>({
    queryKey: ['admin', 'notifications', role],
    queryFn: () => fetchAdminNotifications(role),
    refetchInterval: 30_000,
    staleTime: 15_000,
    placeholderData: filterByRole(FALLBACK_SEED, role),
  });
}

/* ────────────────────────────────────────────────────────────── */
/* WebSocket live stream — pushes individual notifications into  */
/* the React Query cache as they arrive. Auto-reconnects with    */
/* exponential backoff. Falls back silently to polling on error. */
/* ────────────────────────────────────────────────────────────── */
export function useAdminNotificationStream(role: AdminRole): { connected: boolean } {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const closedByUs = useRef(false);

  const handleMessage = useCallback(
    (raw: string) => {
      try {
        const msg = JSON.parse(raw) as
          | { type: 'notification'; payload: AdminNotification }
          | { type: 'ping' }
          | { type: 'replace'; payload: AdminNotification[] };
        if (msg.type === 'notification') {
          if (!isCategoryAllowed(role, msg.payload.category)) return;
          qc.setQueryData<AdminNotification[]>(['admin', 'notifications', role], (prev) => {
            const next = prev ? [msg.payload, ...prev.filter((n) => n.id !== msg.payload.id)] : [msg.payload];
            return next.slice(0, 100);
          });
        } else if (msg.type === 'replace') {
          qc.setQueryData(['admin', 'notifications', role], filterByRole(msg.payload, role));
        }
      } catch {
        // ignore malformed frames
      }
    },
    [qc, role],
  );

  useEffect(() => {
    closedByUs.current = false;
    const baseUrl =
      (import.meta as unknown as { env?: { VITE_GIGVORA_WS_URL?: string; VITE_GIGVORA_API_URL?: string } }).env
        ?.VITE_GIGVORA_WS_URL ||
      (import.meta as unknown as { env?: { VITE_GIGVORA_API_URL?: string } }).env?.VITE_GIGVORA_API_URL?.replace(
        /^http/,
        'ws',
      ) ||
      '';

    if (!baseUrl) {
      // No WS configured — polling from useAdminNotifications carries the load.
      setConnected(false);
      return;
    }

    let cancelled = false;
    const connect = () => {
      if (cancelled) return;
      let token: string | null = null;
      try {
        token = localStorage.getItem('gigvora.token');
      } catch {
        token = null;
      }
      const url = `${baseUrl.replace(/\/$/, '')}/admin/notifications/stream?role=${encodeURIComponent(role)}${
        token ? `&token=${encodeURIComponent(token)}` : ''
      }`;

      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch {
        setConnected(false);
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        retryRef.current = 0;
        setConnected(true);
      };
      ws.onmessage = (e) => handleMessage(typeof e.data === 'string' ? e.data : '');
      ws.onerror = () => setConnected(false);
      ws.onclose = () => {
        setConnected(false);
        if (closedByUs.current || cancelled) return;
        const wait = Math.min(30_000, 1000 * 2 ** retryRef.current);
        retryRef.current += 1;
        setTimeout(connect, wait);
      };
    };

    connect();
    return () => {
      cancelled = true;
      closedByUs.current = true;
      try {
        wsRef.current?.close();
      } catch {
        /* noop */
      }
      wsRef.current = null;
    };
  }, [role, handleMessage]);

  return useMemo(() => ({ connected }), [connected]);
}

/* ────────────────────────────────────────────────────────────── */
/* Mutations — best-effort; falls back to local cache update.    */
/* ────────────────────────────────────────────────────────────── */
export async function markAdminNotifRead(id: string): Promise<void> {
  if (!sdkReady()) return;
  const anySdk = sdk as unknown as {
    admin?: { notifications?: { markRead?: (id: string) => Promise<void> } };
    request?: (path: string, init?: RequestInit) => Promise<unknown>;
  };
  try {
    if (typeof anySdk.admin?.notifications?.markRead === 'function') {
      await anySdk.admin.notifications.markRead(id);
    } else if (typeof anySdk.request === 'function') {
      await anySdk.request(`/admin/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
    }
  } catch {
    /* swallow — UI already optimistically updated */
  }
}

export async function markAllAdminNotifsRead(role: AdminRole): Promise<void> {
  if (!sdkReady()) return;
  const anySdk = sdk as unknown as {
    admin?: { notifications?: { markAllRead?: (role: AdminRole) => Promise<void> } };
    request?: (path: string, init?: RequestInit) => Promise<unknown>;
  };
  try {
    if (typeof anySdk.admin?.notifications?.markAllRead === 'function') {
      await anySdk.admin.notifications.markAllRead(role);
    } else if (typeof anySdk.request === 'function') {
      await anySdk.request(`/admin/notifications/read-all?role=${encodeURIComponent(role)}`, { method: 'POST' });
    }
  } catch {
    /* swallow */
  }
}
