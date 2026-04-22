/**
 * D37 emit helpers — outbound webhooks + cross-domain bus + adapter map.
 */
import { outboundWebhooks, type WebhookEvent } from '../outbound-webhooks/outbound-webhooks.publisher';
import { domainBus } from '../domain-bus/domain-bus';

const T = (t: string) => t || 'tenant-demo';
function emit(event: WebhookEvent, entityType: string, entityId: string, payload: any, tenantId: string) {
  void outboundWebhooks.publish({ tenantId, event, entityType, entityId, payload });
  domainBus.emit(event, { tenantId, entityType, entityId, payload });
}

export const D37Emit = {
  workspaceMinted:        (t: string, id: string, p: any) => emit('pwh.workspace.minted',        'pwh-workspace',  id, p, T(t)),
  workspaceKickoff:       (t: string, id: string, p: any) => emit('pwh.workspace.kickoff',       'pwh-workspace',  id, p, T(t)),
  workspaceActivated:     (t: string, id: string, p: any) => emit('pwh.workspace.activated',     'pwh-workspace',  id, p, T(t)),
  workspaceOnHold:        (t: string, id: string, p: any) => emit('pwh.workspace.on-hold',       'pwh-workspace',  id, p, T(t)),
  workspaceCancelled:     (t: string, id: string, p: any) => emit('pwh.workspace.cancelled',     'pwh-workspace',  id, p, T(t)),
  workspaceClosed:        (t: string, id: string, p: any) => emit('pwh.workspace.closed',        'pwh-workspace',  id, p, T(t)),
  milestoneStarted:       (t: string, id: string, p: any) => emit('pwh.milestone.started',       'pwh-milestone',  id, p, T(t)),
  milestoneSubmitted:     (t: string, id: string, p: any) => emit('pwh.milestone.submitted',     'pwh-milestone',  id, p, T(t)),
  milestoneAccepted:      (t: string, id: string, p: any) => emit('pwh.milestone.accepted',      'pwh-milestone',  id, p, T(t)),
  milestoneRejected:      (t: string, id: string, p: any) => emit('pwh.milestone.rejected',      'pwh-milestone',  id, p, T(t)),
  deliverableSubmitted:   (t: string, id: string, p: any) => emit('pwh.deliverable.submitted',   'pwh-deliverable',id, p, T(t)),
  deliverableAccepted:    (t: string, id: string, p: any) => emit('pwh.deliverable.accepted',    'pwh-deliverable',id, p, T(t)),
  deliverableChanges:     (t: string, id: string, p: any) => emit('pwh.deliverable.changes-requested', 'pwh-deliverable', id, p, T(t)),
  handoverStarted:        (t: string, id: string, p: any) => emit('pwh.handover.started',        'pwh-handover',   id, p, T(t)),
  handoverItemCompleted:  (t: string, id: string, p: any) => emit('pwh.handover.item-completed', 'pwh-handover',   id, p, T(t)),
  handoverCompleted:      (t: string, id: string, p: any) => emit('pwh.handover.completed',      'pwh-handover',   id, p, T(t)),
  finalReportPublished:   (t: string, id: string, p: any) => emit('pwh.final-report.published',  'pwh-report',     id, p, T(t)),
  retainerOffered:        (t: string, id: string, p: any) => emit('pwh.retainer.offered',        'pwh-retainer',   id, p, T(t)),
  partyAdded:             (t: string, id: string, p: any) => emit('pwh.party.added',             'pwh-party',      id, p, T(t)),
  partyRemoved:           (t: string, id: string, p: any) => emit('pwh.party.removed',           'pwh-party',      id, p, T(t)),
};

export const D37Adapters = {
  storage: ['s3', 'gcs', 'azure-blob', 'r2'],            // deliverable artefacts + final report PDF
  pdf: ['internal-renderer', 'pdfmake', 'wkhtmltopdf'],  // final-report rendering
  notifications: ['inbox', 'email', 'push', 'webhook'],  // milestone + deliverable nudges
  scheduling: ['internal-scheduler', 'cron'],            // handover reminders
  audit: ['internal-audit-trail', 'datadog', 'splunk'],
  webhooks: { outbound: 'D37Emit', inbound: 'apps/webhook-gateway' },
} as const;
