/**
 * D33 emit helpers — outbound webhooks + cross-domain bus.
 *
 * Per mem://tech/webhook-and-cross-section-rule, every domain ships an emit
 * helper publishing one outbound webhook per meaningful state transition AND
 * emitting onto the cross-domain bus, plus a `DNAdapters` declaring the
 * third-party integration surface.
 */
import { outboundWebhooks, type WebhookEvent } from '../outbound-webhooks/outbound-webhooks.publisher';
import { domainBus } from '../domain-bus/domain-bus';

const T = (tenantId: string) => tenantId || 'tenant-demo';
function emit(event: WebhookEvent, entityType: string, entityId: string, payload: any, tenantId: string) {
  void outboundWebhooks.publish({ tenantId, event, entityType, entityId, payload });
  domainBus.emit(event, { tenantId, entityType, entityId, payload });
}

export const D33Emit = {
  // Project lifecycle
  projectCreated:        (t: string, id: string, p: any) => emit('pps.project.created',          'pps-project',   id, p, T(t)),
  projectUpdated:        (t: string, id: string, p: any) => emit('pps.project.updated',          'pps-project',   id, p, T(t)),
  projectTransitioned:   (t: string, id: string, p: any) => emit('pps.project.transitioned',     'pps-project',   id, p, T(t)),
  projectPublished:      (t: string, id: string, p: any) => emit('pps.project.published',        'pps-project',   id, p, T(t)),
  projectPaused:         (t: string, id: string, p: any) => emit('pps.project.paused',           'pps-project',   id, p, T(t)),
  projectResumed:        (t: string, id: string, p: any) => emit('pps.project.resumed',          'pps-project',   id, p, T(t)),
  projectArchived:       (t: string, id: string, p: any) => emit('pps.project.archived',         'pps-project',   id, p, T(t)),
  projectBoosted:        (t: string, id: string, p: any) => emit('pps.project.boosted',          'pps-project',   id, p, T(t)),
  // Approval
  approvalSubmitted:     (t: string, id: string, p: any) => emit('pps.approval.submitted',       'pps-approval',  id, p, T(t)),
  approvalDecided:       (t: string, id: string, p: any) => emit('pps.approval.decided',         'pps-approval',  id, p, T(t)),
  // Smart match
  matchGenerated:        (t: string, id: string, p: any) => emit('pps.match.generated',          'pps-match',     id, p, T(t)),
  matchExplained:        (t: string, id: string, p: any) => emit('pps.match.explained',          'pps-match',     id, p, T(t)),
  // Invites
  inviteSent:            (t: string, id: string, p: any) => emit('pps.invite.sent',              'pps-invite',    id, p, T(t)),
  inviteOpened:          (t: string, id: string, p: any) => emit('pps.invite.opened',            'pps-invite',    id, p, T(t)),
  inviteAccepted:        (t: string, id: string, p: any) => emit('pps.invite.accepted',          'pps-invite',    id, p, T(t)),
  inviteDeclined:        (t: string, id: string, p: any) => emit('pps.invite.declined',          'pps-invite',    id, p, T(t)),
  inviteMaybe:           (t: string, id: string, p: any) => emit('pps.invite.maybe',             'pps-invite',    id, p, T(t)),
  inviteExpired:         (t: string, id: string, p: any) => emit('pps.invite.expired',           'pps-invite',    id, p, T(t)),
  inviteRevoked:         (t: string, id: string, p: any) => emit('pps.invite.revoked',           'pps-invite',    id, p, T(t)),
  inviteBulkSent:        (t: string, id: string, p: any) => emit('pps.invite.bulk-sent',         'pps-invite',    id, p, T(t)),
  // Boost-credit checkout (multi-step)
  boostPurchaseCreated:  (t: string, id: string, p: any) => emit('pps.boost-purchase.created',   'pps-purchase',  id, p, T(t)),
  boostPurchaseConfirmed:(t: string, id: string, p: any) => emit('pps.boost-purchase.confirmed', 'pps-purchase',  id, p, T(t)),
  boostPurchaseRefunded: (t: string, id: string, p: any) => emit('pps.boost-purchase.refunded',  'pps-purchase',  id, p, T(t)),
  boostApplied:          (t: string, id: string, p: any) => emit('pps.boost.applied',            'pps-boost',     id, p, T(t)),
  inviteCreditsConsumed: (t: string, id: string, p: any) => emit('pps.invite-credits.consumed',  'pps-credit',    id, p, T(t)),
  inviteCreditsTopped:   (t: string, id: string, p: any) => emit('pps.invite-credits.topped-up', 'pps-credit',    id, p, T(t)),
};

/**
 * Third-party / cross-platform adapter map for D33.
 * (mem://tech/third-party-integration-rule — every domain pack must declare it.)
 */
export const D33Adapters = {
  payments: ['stripe', 'paddle', 'wise'],            // boost + invite credit checkout
  email: ['resend', 'ses', 'smtp'],                  // invite delivery, weekly digest
  smsPush: ['twilio', 'expo', 'fcm', 'apns'],        // invite alerts, accept/decline pings
  storage: ['s3', 'gcs', 'azure-blob', 'r2'],        // brief attachments, NDA PDFs
  avScanning: ['clamav', 'virustotal'],              // attachment scanning
  search: ['opensearch', 'algolia', 'typesense'],    // candidate-pool ranking + re-rank
  ml: ['internal-python', 'openai', 'cohere'],       // smart-match (with deterministic fallback)
  crm: ['hubspot', 'salesforce', 'pipedrive'],       // client-side handoff
  calendar: ['google', 'microsoft', 'apple'],        // invite confirmation slots
  webhooks: { outbound: 'D33Emit', inbound: 'apps/webhook-gateway' },
} as const;
