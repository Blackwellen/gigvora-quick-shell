/**
 * Cross-domain context hook — given any entityId, returns adjacent context
 * (related interview, pipeline card, application, prospect) so workbenches
 * can preview cross-section state without deep navigation.
 *
 * Backed by a single endpoint that walks the DomainEventCatalog.
 */
import { useQuery } from '@tanstack/react-query';

export interface CrossDomainContext {
  application?: { id: string; status: string; jobId: string };
  pipelineCard?: { id: string; stage: string; boardId: string };
  interview?: { id: string; status: string; startAt?: string };
  prospect?: { id: string; status: string; listId: string };
  outreach?: { id: string; status: string; sentAt?: string };
}

export function useCrossDomainContext(entityId: string | undefined) {
  return useQuery({
    queryKey: ['cross-domain-context', entityId],
    queryFn: async (): Promise<CrossDomainContext> => {
      if (!entityId) return {};
      try {
        const r = await fetch(`/api/v1/domain-bus/context/${entityId}`);
        if (!r.ok) return {};
        return r.json();
      } catch { return {}; }
    },
    enabled: !!entityId,
    staleTime: 30_000,
  });
}
