/**
 * adminMessaging — admin → any user direct messaging via Gigvora NestJS backend.
 *
 * Endpoints (backend contract):
 *   GET  /api/v1/admin/users/search?q=<query>&limit=<n>
 *        → AdminUserResult[]
 *   POST /api/v1/admin/messages/compose
 *        body: { recipientId, body, channel?, asRole, banner?, attachments? }
 *        → { threadId, messageId }
 *
 * Every send is server-audited (admin id + active role + reason banner) so this
 * surface is safe to expose across all admin portals.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { req, apiConfigured } from './gigvora';
import type { AdminRole } from '@/lib/adminAuth';

export interface AdminUserResult {
  id: string;
  displayName: string;
  handle?: string;
  email?: string;
  avatarUrl?: string;
  /** 'user' | 'professional' | 'enterprise' | 'mentor' | 'admin' */
  type?: string;
  /** Suspended / restricted flag, if any. */
  status?: 'active' | 'suspended' | 'restricted' | 'deleted';
}

export interface ComposeAdminMessage {
  recipientId: string;
  body: string;
  /** Display channel — 'inbox' is normal DM, 'notice' renders as system banner. */
  channel?: 'inbox' | 'notice';
  /** Persisted on the message envelope for audit + recipient context. */
  asRole: AdminRole;
  /** Short label shown to recipient (e.g. "Customer Service · Refund follow-up"). */
  banner?: string;
}

export interface ComposeResult {
  threadId: string;
  messageId: string;
}

const FALLBACK_USERS: AdminUserResult[] = [
  { id: 'u_alex',  displayName: 'Alex Kim',      handle: '@alexkim',     email: 'alex@example.com',   type: 'professional', status: 'active' },
  { id: 'u_sara',  displayName: 'Sara Chen',     handle: '@sarachen',    email: 'sara@example.com',   type: 'enterprise',   status: 'active' },
  { id: 'u_jen',   displayName: 'Jennifer Park', handle: '@jenpark',     email: 'jen@example.com',    type: 'user',         status: 'active' },
  { id: 'u_rob',   displayName: 'Robert Chang',  handle: '@robchang',    email: 'rob@example.com',    type: 'professional', status: 'restricted' },
  { id: 'u_mira',  displayName: 'Mira Diallo',   handle: '@miradiallo',  email: 'mira@example.com',   type: 'mentor',       status: 'active' },
  { id: 'u_tom',   displayName: 'Tomás Rivera',  handle: '@tomasr',      email: 'tomas@example.com',  type: 'user',         status: 'suspended' },
];

/** Search any user on the platform from inside admin terminal. */
export function useAdminUserSearch(query: string, limit = 8) {
  const q = query.trim();
  return useQuery<AdminUserResult[]>({
    queryKey: ['admin', 'users', 'search', q, limit],
    queryFn: async () => {
      if (!apiConfigured()) {
        if (!q) return FALLBACK_USERS.slice(0, limit);
        const needle = q.toLowerCase();
        return FALLBACK_USERS.filter(
          (u) =>
            u.displayName.toLowerCase().includes(needle) ||
            u.handle?.toLowerCase().includes(needle) ||
            u.email?.toLowerCase().includes(needle) ||
            u.id.toLowerCase().includes(needle),
        ).slice(0, limit);
      }
      try {
        const r = await req<{ items: AdminUserResult[] }>(
          `/api/v1/admin/users/search?q=${encodeURIComponent(q)}&limit=${limit}`,
        );
        return r.items ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 10_000,
  });
}

/** Send a direct message from the admin operator to any user on the site. */
export function useAdminComposeMessage() {
  const qc = useQueryClient();
  return useMutation<ComposeResult, Error, ComposeAdminMessage>({
    mutationFn: async (input) => {
      if (!apiConfigured()) {
        // Local preview — emulate success so UX is testable without backend.
        await new Promise((res) => setTimeout(res, 350));
        return { threadId: `prev_${input.recipientId}`, messageId: `prev_${Date.now()}` };
      }
      return req<ComposeResult>('/api/v1/admin/messages/compose', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    onSuccess: (res, vars) => {
      toast.success(`Message sent to ${vars.recipientId.slice(0, 12)}`, {
        description: vars.channel === 'notice' ? 'Delivered as system notice.' : 'Delivered to inbox.',
      });
      qc.invalidateQueries({ queryKey: ['inbox'] });
    },
    onError: (e) => toast.error(`Send failed: ${e.message}`),
  });
}
