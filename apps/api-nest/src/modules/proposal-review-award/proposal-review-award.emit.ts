/**
 * D35 emit helpers — outbound webhooks + cross-domain bus + adapter map.
 */
import { outboundWebhooks, type WebhookEvent } from '../outbound-webhooks/outbound-webhooks.publisher';
import { domainBus } from '../domain-bus/domain-bus';

const T = (t: string) => t || 'tenant-demo';
function emit(event: WebhookEvent, entityType: string, entityId: string, payload: any, tenantId: string) {
  void outboundWebhooks.publish({ tenantId, event, entityType, entityId, payload });
  domainBus.emit(event, { tenantId, entityType, entityId, payload });
}

export const D35Emit = {
  reviewShortlisted:  (t: string, id: string, p: any) => emit('praa.review.shortlisted',  'praa-review',  id, p, T(t)),
  reviewUnshortlisted:(t: string, id: string, p: any) => emit('praa.review.unshortlisted','praa-review',  id, p, T(t)),
  reviewRejected:     (t: string, id: string, p: any) => emit('praa.review.rejected',     'praa-review',  id, p, T(t)),
  reviewRevisionAsked:(t: string, id: string, p: any) => emit('praa.review.revision-requested','praa-review', id, p, T(t)),
  reviewRanked:       (t: string, id: string, p: any) => emit('praa.review.ranked',       'praa-review',  id, p, T(t)),
  reviewBulkDecided:  (t: string, id: string, p: any) => emit('praa.review.bulk-decided', 'praa-review',  id, p, T(t)),
  noteAdded:          (t: string, id: string, p: any) => emit('praa.note.added',          'praa-note',    id, p, T(t)),
  scoreComputed:      (t: string, id: string, p: any) => emit('praa.score.computed',      'praa-score',   id, p, T(t)),
  weightsUpdated:     (t: string, id: string, p: any) => emit('praa.weights.updated',     'praa-score',   id, p, T(t)),
  awardDrafted:       (t: string, id: string, p: any) => emit('praa.award.drafted',       'praa-award',   id, p, T(t)),
  awardSubmitted:     (t: string, id: string, p: any) => emit('praa.award.submitted',     'praa-award',   id, p, T(t)),
  awardApproved:      (t: string, id: string, p: any) => emit('praa.award.approved',      'praa-award',   id, p, T(t)),
  awardRejected:      (t: string, id: string, p: any) => emit('praa.award.rejected',      'praa-award',   id, p, T(t)),
  awardCancelled:     (t: string, id: string, p: any) => emit('praa.award.cancelled',     'praa-award',   id, p, T(t)),
  awardEscrowHandoff: (t: string, id: string, p: any) => emit('praa.award.escrow-handoff','praa-award',   id, p, T(t)),
  awardClosed:        (t: string, id: string, p: any) => emit('praa.award.closed',        'praa-award',   id, p, T(t)),
  approvalRequested:  (t: string, id: string, p: any) => emit('praa.approval.requested',  'praa-approval',id, p, T(t)),
  approvalApproved:   (t: string, id: string, p: any) => emit('praa.approval.approved',   'praa-approval',id, p, T(t)),
  approvalRejected:   (t: string, id: string, p: any) => emit('praa.approval.rejected',   'praa-approval',id, p, T(t)),
  approvalExpired:    (t: string, id: string, p: any) => emit('praa.approval.expired',    'praa-approval',id, p, T(t)),
};

export const D35Adapters = {
  payments: ['stripe', 'paddle', 'wise'],            // award → escrow handoff to D34
  email: ['resend', 'ses', 'smtp'],                  // shortlist + award notifications
  smsPush: ['twilio', 'expo', 'fcm', 'apns'],        // mobile award alerts
  storage: ['s3', 'gcs', 'azure-blob', 'r2'],        // attachments referenced in compare
  ml: ['internal-python', 'openai', 'cohere'],       // scoring + anomaly hints
  crm: ['hubspot', 'salesforce', 'pipedrive'],       // award handoff to client CRM
  calendar: ['google', 'microsoft', 'apple'],        // kickoff scheduling on award
  invoicing: ['stripe-invoicing', 'xero', 'quickbooks'],
  sso: ['okta', 'azure-ad', 'google-workspace'],     // approver identity
  webhooks: { outbound: 'D35Emit', inbound: 'apps/webhook-gateway' },
} as const;
