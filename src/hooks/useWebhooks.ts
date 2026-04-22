/**
 * Shared React hooks for the "Webhooks" tab every domain workbench must
 * surface (per outbound-webhooks-rule). Backed by TanStack Query + Socket.IO
 * invalidation when delivery events fire.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createWebhooksClient, type WebhookEvent, type DeliveryLog } from '@gigvora/sdk/webhooks';
import { useRealtimeEvent } from '@/lib/realtime/socket';

const client = createWebhooksClient(fetch);
const KEY = ['webhooks'];

export function useWebhookSubscriptions(tenantId = 'tenant-demo') {
  const qc = useQueryClient();
  useRealtimeEvent('webhook.subscription.changed', () => qc.invalidateQueries({ queryKey: KEY }));
  return useQuery({
    queryKey: [...KEY, 'subs', tenantId],
    queryFn: () => client.listSubscriptions(tenantId).catch(() => []),
    staleTime: 30_000,
  });
}

export function useCreateWebhookSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { tenantId?: string; url: string; events?: WebhookEvent[] }) => client.createSubscription(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
export function useRotateWebhookSecret() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => client.rotateSecret(id), onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) });
}
export function useDeactivateWebhookSubscription() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => client.deactivate(id), onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) });
}

export function useWebhookDeliveries(filters: { event?: WebhookEvent; status?: DeliveryLog['status'] } = {}) {
  const qc = useQueryClient();
  useRealtimeEvent('webhook.delivery.updated', () => qc.invalidateQueries({ queryKey: KEY }));
  return useQuery({
    queryKey: [...KEY, 'deliveries', filters],
    queryFn: () => client.listDeliveries(filters).catch(() => []),
    refetchInterval: 15_000,
  });
}
export function useReplayWebhookDelivery() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => client.replay(id), onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) });
}

/** One-stop hook a domain workbench can drop in to power its Webhooks tab. */
export function useDomainWebhookTab(opts: { tenantId?: string; events: WebhookEvent[] }) {
  return {
    subs: useWebhookSubscriptions(opts.tenantId),
    deliveries: useWebhookDeliveries({}),
    create: useCreateWebhookSubscription(),
    rotate: useRotateWebhookSecret(),
    deactivate: useDeactivateWebhookSubscription(),
    replay: useReplayWebhookDelivery(),
    catalog: opts.events,
  };
}
