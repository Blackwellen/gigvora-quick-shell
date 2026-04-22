/**
 * D36 emit helpers — outbound webhooks + cross-domain bus + adapter map.
 */
import { outboundWebhooks, type WebhookEvent } from '../outbound-webhooks/outbound-webhooks.publisher';
import { domainBus } from '../domain-bus/domain-bus';

const T = (t: string) => t || 'tenant-demo';
function emit(event: WebhookEvent, entityType: string, entityId: string, payload: any, tenantId: string) {
  void outboundWebhooks.publish({ tenantId, event, entityType, entityId, payload });
  domainBus.emit(event, { tenantId, entityType, entityId, payload });
}

export const D36Emit = {
  contractMinted:        (t: string, id: string, p: any) => emit('csa.contract.minted',         'csa-contract', id, p, T(t)),
  contractSnapshotTaken: (t: string, id: string, p: any) => emit('csa.contract.snapshot-taken', 'csa-contract', id, p, T(t)),
  contractSent:          (t: string, id: string, p: any) => emit('csa.contract.sent',           'csa-contract', id, p, T(t)),
  contractViewed:        (t: string, id: string, p: any) => emit('csa.contract.viewed',         'csa-contract', id, p, T(t)),
  contractAmended:       (t: string, id: string, p: any) => emit('csa.contract.amended',        'csa-contract', id, p, T(t)),
  contractSuperseded:    (t: string, id: string, p: any) => emit('csa.contract.superseded',     'csa-contract', id, p, T(t)),
  contractActivated:     (t: string, id: string, p: any) => emit('csa.contract.activated',      'csa-contract', id, p, T(t)),
  contractRejected:      (t: string, id: string, p: any) => emit('csa.contract.rejected',       'csa-contract', id, p, T(t)),
  contractCancelled:     (t: string, id: string, p: any) => emit('csa.contract.cancelled',      'csa-contract', id, p, T(t)),
  contractExpired:       (t: string, id: string, p: any) => emit('csa.contract.expired',        'csa-contract', id, p, T(t)),
  contractHashVerified:  (t: string, id: string, p: any) => emit('csa.contract.hash-verified',  'csa-contract', id, p, T(t)),
  partyAdded:            (t: string, id: string, p: any) => emit('csa.party.added',             'csa-party',    id, p, T(t)),
  partyRemoved:          (t: string, id: string, p: any) => emit('csa.party.removed',           'csa-party',    id, p, T(t)),
  signatureRequested:    (t: string, id: string, p: any) => emit('csa.signature.requested',     'csa-signature',id, p, T(t)),
  signatureCaptured:     (t: string, id: string, p: any) => emit('csa.signature.captured',      'csa-signature',id, p, T(t)),
  signatureRejected:     (t: string, id: string, p: any) => emit('csa.signature.rejected',      'csa-signature',id, p, T(t)),
  signatureReminderSent: (t: string, id: string, p: any) => emit('csa.signature.reminder-sent', 'csa-signature',id, p, T(t)),
  termsAccepted:         (t: string, id: string, p: any) => emit('csa.terms.accepted',          'csa-terms',    id, p, T(t)),
  scopeAcknowledged:     (t: string, id: string, p: any) => emit('csa.scope.acknowledged',      'csa-terms',    id, p, T(t)),
  ledgerAppended:        (t: string, id: string, p: any) => emit('csa.ledger.appended',         'csa-ledger',   id, p, T(t)),
  followUpScheduled:     (t: string, id: string, p: any) => emit('csa.followup.scheduled',      'csa-followup', id, p, T(t)),
  followUpFired:         (t: string, id: string, p: any) => emit('csa.followup.fired',          'csa-followup', id, p, T(t)),
};

export const D36Adapters = {
  email: ['resend', 'ses', 'smtp'],                     // signature requests + reminders
  smsPush: ['twilio', 'expo', 'fcm', 'apns'],           // mobile signing prompts
  storage: ['s3', 'gcs', 'azure-blob', 'r2'],           // signed PDF + snapshot artefacts
  pdf: ['internal-renderer', 'pdfmake', 'wkhtmltopdf'], // contract → PDF
  hashing: ['sha-256-native'],                          // ledger fingerprint
  identity: ['session', 'sso', 'magic-link'],           // signer identity
  audit: ['internal-audit-trail', 'datadog', 'splunk'],
  webhooks: { outbound: 'D36Emit', inbound: 'apps/webhook-gateway' },
} as const;
