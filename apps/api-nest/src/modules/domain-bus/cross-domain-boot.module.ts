/**
 * Boot-time cross-domain wiring + a single endpoint that returns adjacent
 * context (interview ↔ pipeline card ↔ application ↔ prospect ↔ outreach)
 * for the cross-domain context preview in every workbench.
 *
 * Handlers are intentionally thin and best-effort — domain modules expose
 * narrow helper functions called by the wiring; if a module is absent the
 * link silently no-ops (per cross-domain-bus-rule hop limit).
 */
import { Module, OnModuleInit, Controller, Get, Param } from '@nestjs/common';
import { wireCrossDomain } from './cross-domain-wiring';
import { domainBus } from './domain-bus';

// In-memory adjacency index — populated as cross-domain events flow.
// In production this is replaced by a Postgres view across the domain tables.
const adjacency = new Map<string, any>();

@Controller('domain-bus')
class CrossDomainContextController {
  @Get('context/:entityId') context(@Param('entityId') id: string) {
    return adjacency.get(id) ?? {};
  }
}

@Module({ controllers: [CrossDomainContextController] })
export class CrossDomainBootModule implements OnModuleInit {
  onModuleInit() {
    const remember = (id: string, patch: any) =>
      adjacency.set(id, { ...(adjacency.get(id) ?? {}), ...patch });

    wireCrossDomain({
      applicationOpenChannel: async (e) => remember(e.entityId, { application: { id: e.entityId, status: 'open', jobId: e.payload?.jobId } }),
      requisitionBump:        async (e) => remember(e.payload?.requisitionId ?? e.entityId, { application: { id: e.entityId, status: 'submitted', jobId: e.payload?.jobId } }),
      pipelineCreateCard:     async (e) => {
        const cardId = `card-${e.entityId}`;
        remember(e.entityId, { pipelineCard: { id: cardId, stage: 'sourced', boardId: e.payload?.boardId ?? 'default' } });
        await domainBus.publish({ event: 'card.created', entityType: 'card', entityId: cardId,
          tenantId: e.tenantId, payload: { sourceEvent: e.event, sourceId: e.entityId } });
      },
      pipelinePromptMove:     async (e) => remember(e.entityId, { pipelineCard: { id: `card-${e.entityId}`, stage: 'awaiting-decision', boardId: 'default' } }),
      interviewSuggestSlots:  async (e) => remember(e.entityId, { interview: { id: `iv-${e.entityId}`, status: 'draft' } }),
      prospectingScore:       async (e) => remember(e.payload?.candidateId ?? e.entityId, { prospect: { id: e.entityId, status: 'scored', listId: e.payload?.listId ?? 'default' } }),
      applicationReferralHint:async (e) => remember(e.payload?.candidateId ?? e.entityId, { outreach: { id: e.entityId, status: 'sent', sentAt: new Date().toISOString() } }),
    });
  }
}
