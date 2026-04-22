/**
 * Cross-domain wiring registered at boot. Each subscription is idempotent and
 * carries a hop counter so a chain like D25→D28→D29→D28 cannot loop.
 *
 * Handlers are intentionally thin: they translate the event into a downstream
 * domain action by calling that domain's service via a narrow port (passed in
 * from the AppModule wiring, not imported directly to keep modules decoupled).
 */
import { domainBus, DomainEvent, CROSS_DOMAIN_CATALOG } from './domain-bus';

export interface CrossDomainPorts {
  pipelineCreateCard?: (e: DomainEvent) => Promise<void>;
  pipelinePromptMove?: (e: DomainEvent) => Promise<void>;
  interviewSuggestSlots?: (e: DomainEvent) => Promise<void>;
  applicationOpenChannel?: (e: DomainEvent) => Promise<void>;
  requisitionBump?: (e: DomainEvent) => Promise<void>;
  prospectingScore?: (e: DomainEvent) => Promise<void>;
  applicationReferralHint?: (e: DomainEvent) => Promise<void>;
}

export function wireCrossDomain(ports: CrossDomainPorts) {
  domainBus.subscribe('posting.published',       async (e) => ports.applicationOpenChannel?.(e));
  domainBus.subscribe('application.submitted',   async (e) => { await ports.requisitionBump?.(e); await ports.pipelineCreateCard?.(e); });
  domainBus.subscribe('prospect.status.changed', async (e) => { if (e.payload?.status === 'qualified') await ports.pipelineCreateCard?.(e); });
  domainBus.subscribe('card.moved',              async (e) => { if (e.payload?.toStage === 'interview') await ports.interviewSuggestSlots?.(e); });
  domainBus.subscribe('interview.transitioned',  async (e) => { if (e.payload?.next === 'completed') await ports.pipelinePromptMove?.(e); });
  domainBus.subscribe('scorecard.submitted',     async (e) => ports.prospectingScore?.(e));
  domainBus.subscribe('outreach.sent',           async (e) => ports.applicationReferralHint?.(e));
  return CROSS_DOMAIN_CATALOG;
}
