/**
 * D34 emit helpers — outbound webhooks + cross-domain bus + adapter map.
 *
 * Per mem://tech/webhook-and-cross-section-rule, every domain pack ships an
 * emit helper publishing one outbound webhook per meaningful state transition
 * AND emitting onto the cross-domain bus, plus a `DNAdapters` const declaring
 * the third-party integration surface.
 */
import { outboundWebhooks, type WebhookEvent } from '../outbound-webhooks/outbound-webhooks.publisher';
import { domainBus } from '../domain-bus/domain-bus';

const T = (tenantId: string) => tenantId || 'tenant-demo';
function emit(event: WebhookEvent, entityType: string, entityId: string, payload: any, tenantId: string) {
  void outboundWebhooks.publish({ tenantId, event, entityType, entityId, payload });
  domainBus.emit(event, { tenantId, entityType, entityId, payload });
}

export const D34Emit = {
  // Proposal lifecycle
  proposalDrafted:     (t: string, id: string, p: any) => emit('pbb.proposal.drafted',     'pbb-proposal', id, p, T(t)),
  proposalUpdated:     (t: string, id: string, p: any) => emit('pbb.proposal.updated',     'pbb-proposal', id, p, T(t)),
  proposalSubmitted:   (t: string, id: string, p: any) => emit('pbb.proposal.submitted',   'pbb-proposal', id, p, T(t)),
  proposalWithdrawn:   (t: string, id: string, p: any) => emit('pbb.proposal.withdrawn',   'pbb-proposal', id, p, T(t)),
  proposalShortlisted: (t: string, id: string, p: any) => emit('pbb.proposal.shortlisted', 'pbb-proposal', id, p, T(t)),
  proposalAccepted:    (t: string, id: string, p: any) => emit('pbb.proposal.accepted',    'pbb-proposal', id, p, T(t)),
  proposalRejected:    (t: string, id: string, p: any) => emit('pbb.proposal.rejected',    'pbb-proposal', id, p, T(t)),
  proposalRevised:     (t: string, id: string, p: any) => emit('pbb.proposal.revised',     'pbb-proposal', id, p, T(t)),
  proposalExpired:     (t: string, id: string, p: any) => emit('pbb.proposal.expired',     'pbb-proposal', id, p, T(t)),
  proposalBoosted:     (t: string, id: string, p: any) => emit('pbb.proposal.boosted',     'pbb-proposal', id, p, T(t)),
  // Scope + pricing + milestones
  scopeLocked:         (t: string, id: string, p: any) => emit('pbb.scope.locked',         'pbb-proposal', id, p, T(t)),
  pricingChanged:      (t: string, id: string, p: any) => emit('pbb.pricing.changed',      'pbb-proposal', id, p, T(t)),
  milestoneAdded:      (t: string, id: string, p: any) => emit('pbb.milestone.added',      'pbb-proposal', id, p, T(t)),
  milestoneRemoved:    (t: string, id: string, p: any) => emit('pbb.milestone.removed',    'pbb-proposal', id, p, T(t)),
  milestoneReordered:  (t: string, id: string, p: any) => emit('pbb.milestone.reordered',  'pbb-proposal', id, p, T(t)),
  // Attachments
  attachmentUploaded:  (t: string, id: string, p: any) => emit('pbb.attachment.uploaded',  'pbb-attachment', id, p, T(t)),
  attachmentScanned:   (t: string, id: string, p: any) => emit('pbb.attachment.scanned',   'pbb-attachment', id, p, T(t)),
  attachmentRemoved:   (t: string, id: string, p: any) => emit('pbb.attachment.removed',   'pbb-attachment', id, p, T(t)),
  // Bid-credit checkout (multi-step)
  creditPurchaseCreated:   (t: string, id: string, p: any) => emit('pbb.credit-purchase.created',   'pbb-purchase', id, p, T(t)),
  creditPurchaseConfirmed: (t: string, id: string, p: any) => emit('pbb.credit-purchase.confirmed', 'pbb-purchase', id, p, T(t)),
  creditPurchaseRefunded:  (t: string, id: string, p: any) => emit('pbb.credit-purchase.refunded',  'pbb-purchase', id, p, T(t)),
  creditsConsumed:    (t: string, id: string, p: any) => emit('pbb.credits.consumed',  'pbb-credit', id, p, T(t)),
  creditsToppedUp:    (t: string, id: string, p: any) => emit('pbb.credits.topped-up', 'pbb-credit', id, p, T(t)),
  creditsRefunded:    (t: string, id: string, p: any) => emit('pbb.credits.refunded',  'pbb-credit', id, p, T(t)),
  boostApplied:       (t: string, id: string, p: any) => emit('pbb.boost.applied',     'pbb-boost',  id, p, T(t)),
  // Escrow
  escrowHeld:         (t: string, id: string, p: any) => emit('pbb.escrow.held',     'pbb-escrow', id, p, T(t)),
  escrowReleased:     (t: string, id: string, p: any) => emit('pbb.escrow.released', 'pbb-escrow', id, p, T(t)),
  escrowRefunded:     (t: string, id: string, p: any) => emit('pbb.escrow.refunded', 'pbb-escrow', id, p, T(t)),
};

/**
 * Third-party / cross-platform adapter map for D34.
 * (mem://tech/third-party-integration-rule — every domain pack must declare it.)
 */
export const D34Adapters = {
  payments: ['stripe', 'paddle', 'wise'],            // bid-credit checkout + escrow holds
  email: ['resend', 'ses', 'smtp'],                  // proposal receipts, escrow notices
  smsPush: ['twilio', 'expo', 'fcm', 'apns'],        // shortlist + accept alerts
  storage: ['s3', 'gcs', 'azure-blob', 'r2'],        // proposal attachments, cover-letter PDFs
  avScanning: ['clamav', 'virustotal'],              // attachment scanning
  search: ['opensearch', 'algolia', 'typesense'],    // proposal browse / shortlist filtering
  ml: ['internal-python', 'openai', 'cohere'],       // pricing advice (with deterministic fallback)
  crm: ['hubspot', 'salesforce', 'pipedrive'],       // client-side handoff
  calendar: ['google', 'microsoft', 'apple'],        // milestone scheduling
  invoicing: ['stripe-invoicing', 'xero', 'quickbooks'], // escrow release invoices
  webhooks: { outbound: 'D34Emit', inbound: 'apps/webhook-gateway' },
} as const;
