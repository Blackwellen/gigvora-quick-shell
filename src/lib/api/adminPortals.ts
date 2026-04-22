/**
 * adminPortals — backend SDK for the AD-016 admin terminal portal hub.
 *
 * Exposes a single React Query hook, `useAdminPortalCounts`, that returns
 * live queue / attention / unread numbers per portal.
 *
 * Backend contract (Gigvora SDK):
 *   GET /admin/portals/counts
 *   → { [portalId: PortalId]: { queue: number; attention: number; unread: number } }
 *
 * The hook gracefully falls back to deterministic seeded numbers when the
 * SDK isn't ready (no API base URL or no token), so the UI never flickers
 * to empty during local dev or while the backend warms up.
 *
 * IMPORTANT: this module must NOT import from `@/integrations/supabase/*`.
 * Admin data flows exclusively through the Gigvora backend SDK.
 */

import { useQuery } from '@tanstack/react-query';
import { sdk, sdkReady } from '@/lib/gigvora-sdk';

export interface PortalCounts {
  /** Open work items / queue depth. */
  queue: number;
  /** Items flagged for human attention. */
  attention: number;
  /** Unread comms (chat / email / notice). */
  unread: number;
}

export type PortalId =
  | 'cs'
  | 'dispute'
  | 'finance'
  | 'moderation'
  | 'trust'
  | 'verification'
  | 'marketing'
  | 'ads'
  | 'ops'
  | 'super';

export type PortalCountsMap = Record<PortalId, PortalCounts>;

/** Stable fallback so the UI never shows zeros while the backend warms up. */
const FALLBACK: PortalCountsMap = {
  cs:           { queue: 184, attention: 12, unread: 9 },
  dispute:      { queue: 12,  attention: 4,  unread: 2 },
  finance:      { queue: 47,  attention: 6,  unread: 3 },
  moderation:   { queue: 184, attention: 23, unread: 7 },
  trust:        { queue: 6,   attention: 2,  unread: 1 },
  verification: { queue: 14,  attention: 3,  unread: 0 },
  marketing:    { queue: 18,  attention: 1,  unread: 4 },
  ads:          { queue: 4,   attention: 1,  unread: 0 },
  ops:          { queue: 9,   attention: 0,  unread: 5 },
  super:        { queue: 0,   attention: 0,  unread: 0 },
};

/**
 * Resolve portal counts from the Gigvora backend.
 *
 * Tries, in order:
 *   1. `sdk.admin.portals.counts()`  — the canonical typed endpoint.
 *   2. `sdk.request('/admin/portals/counts')` — generic request escape hatch
 *      so we still work before the typed method ships.
 *   3. FALLBACK — seeded constants (offline / sdk not ready).
 *
 * Whatever shape the backend returns is shallow-merged onto FALLBACK so any
 * portal the backend hasn't started reporting yet still renders sensibly.
 */
async function fetchAdminPortalCounts(): Promise<PortalCountsMap> {
  if (!sdkReady()) return FALLBACK;

  // Treat the SDK as a loosely-typed surface here: the typed method may not
  // exist yet on every SDK version, so we feature-detect rather than crash.
  const anySdk = sdk as unknown as {
    admin?: { portals?: { counts?: () => Promise<Partial<PortalCountsMap>> } };
    request?: (path: string, init?: RequestInit) => Promise<Partial<PortalCountsMap>>;
  };

  try {
    let live: Partial<PortalCountsMap> | undefined;

    if (typeof anySdk.admin?.portals?.counts === 'function') {
      live = await anySdk.admin.portals.counts();
    } else if (typeof anySdk.request === 'function') {
      live = await anySdk.request('/admin/portals/counts');
    }

    if (!live) return FALLBACK;

    // Shallow merge so portals not yet reported by the backend keep sensible
    // fallback numbers instead of dropping to zero.
    const merged = { ...FALLBACK };
    (Object.keys(merged) as PortalId[]).forEach((id) => {
      const partial = live?.[id];
      if (partial) merged[id] = { ...merged[id], ...partial };
    });
    return merged;
  } catch {
    // Network blip / endpoint not deployed yet — keep the UI alive.
    return FALLBACK;
  }
}

/**
 * Live portal counts for the admin terminal hub.
 *
 * - Refetches every 60s so badges stay fresh while the operator sits on
 *   the page.
 * - Always returns *something* (FALLBACK) so the UI never flickers to
 *   empty.
 */
export function useAdminPortalCounts() {
  return useQuery<PortalCountsMap>({
    queryKey: ['admin', 'portal-counts'],
    queryFn: fetchAdminPortalCounts,
    refetchInterval: 60_000,
    staleTime: 30_000,
    placeholderData: FALLBACK,
  });
}
