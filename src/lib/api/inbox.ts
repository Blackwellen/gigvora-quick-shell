/**
 * Inbox API client + React Query hooks.
 * Backend: apps/api-nest/src/modules/inbox (mounted at /api/v1/inbox).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { req, apiConfigured } from './gigvora';

export const inboxApiConfigured = apiConfigured;

export interface InboxThread {
  id: string;
  subject?: string | null;
  state: 'inbox' | 'archived' | 'snoozed' | 'requested';
  priority: 'normal' | 'high' | 'urgent';
  participants: Array<{ userId: string; name?: string; avatar?: string }>;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount: number;
}

export interface InboxMessage {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  attachments?: Array<{ name: string; url: string; mime: string; sizeBytes?: number }>;
  reactions?: Array<{ userId: string; emoji: string }>;
  createdAt: string;
  editedAt?: string | null;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export function useInboxThreads(view: 'inbox' | 'starred' | 'requests' | 'archived' = 'inbox') {
  return useQuery({
    queryKey: ['inbox', 'threads', view],
    queryFn: () => req<{ items: InboxThread[] }>(`/api/v1/inbox/threads?view=${view}`),
    enabled: inboxApiConfigured(),
    staleTime: 15_000,
  });
}

export function useThreadMessages(threadId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ['inbox', 'messages', threadId, limit],
    queryFn: () => req<{ items: InboxMessage[] }>(`/api/v1/inbox/threads/${threadId}/messages?limit=${limit}`),
    enabled: !!threadId && inboxApiConfigured(),
    staleTime: 5_000,
    refetchInterval: 10_000, // polling — replace w/ realtime in next pass
  });
}

export function useSendMessage(threadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { body: string; attachments?: InboxMessage['attachments'] }) =>
      req<InboxMessage>(`/api/v1/inbox/threads/${threadId}/messages`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inbox', 'messages', threadId] });
      qc.invalidateQueries({ queryKey: ['inbox', 'threads'] });
    },
    onError: (e: Error) => toast.error(`Send failed: ${e.message}`),
  });
}

export function useMarkRead(threadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => req(`/api/v1/inbox/threads/${threadId}/read`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox', 'threads'] }),
  });
}

export function useReactToMessage(threadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      req(`/api/v1/inbox/threads/${threadId}/messages/${messageId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox', 'messages', threadId] }),
  });
}

export function useUpdateThreadState(threadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (state: InboxThread['state']) =>
      req(`/api/v1/inbox/threads/${threadId}/state`, { method: 'PATCH', body: JSON.stringify({ state }) }),
    onSuccess: () => {
      toast.success('Thread updated');
      qc.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

export function useUnreadDigest() {
  return useQuery({
    queryKey: ['inbox', 'unread'],
    queryFn: () => req<{ totalUnread: number; threads: Array<{ id: string; unreadCount: number }> }>(`/api/v1/inbox/digest/unread`),
    enabled: inboxApiConfigured(),
    refetchInterval: 30_000,
  });
}
