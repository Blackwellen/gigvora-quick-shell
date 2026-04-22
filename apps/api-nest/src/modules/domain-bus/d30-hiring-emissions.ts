/**
 * D30-hiring (Enterprise Hiring Workspace + Approval Chains) emit helpers.
 * Suffixed slot — does not collide with the unsuffixed D30 (Cross-Cutting
 * Integrations) pack. Each helper publishes an outbound webhook + emits onto
 * the cross-domain bus so downstream consumers (notifications, calendar,
 * audit) can react.
 *
 * Required by every D30-hiring service write per the Webhook + Cross-Section
 * rule (see mem://tech/webhook-and-cross-section-rule).
 */
import { outboundWebhooks, type WebhookEvent } from '../outbound-webhooks/outbound-webhooks.publisher';
import { domainBus } from './domain-bus';

const T = (tenantId: string) => tenantId || 'tenant-demo';

function emit(event: WebhookEvent, entityType: string, entityId: string, payload: any, tenantId: string) {
  void outboundWebhooks.publish({ tenantId, event, entityType, entityId, payload });
  domainBus.emit(event, { tenantId, entityType, entityId, payload });
}

export const D30HiringEmit = {
  workspaceCreated:        (t: string, id: string, p: any) => emit('ehw.workspace.created',          'ehw-workspace', id, p, T(t)),
  workspaceUpdated:        (t: string, id: string, p: any) => emit('ehw.workspace.updated',          'ehw-workspace', id, p, T(t)),
  workspaceTransitioned:   (t: string, id: string, p: any) => emit('ehw.workspace.transitioned',     'ehw-workspace', id, p, T(t)),
  memberUpserted:          (t: string, id: string, p: any) => emit('ehw.member.upserted',            'ehw-member',    id, p, T(t)),
  memberRemoved:           (t: string, id: string, p: any) => emit('ehw.member.removed',             'ehw-member',    id, p, T(t)),
  chainTemplateCreated:    (t: string, id: string, p: any) => emit('ehw.chain-template.created',     'ehw-template',  id, p, T(t)),
  chainTemplateUpdated:    (t: string, id: string, p: any) => emit('ehw.chain-template.updated',     'ehw-template',  id, p, T(t)),
  chainTemplatePublished:  (t: string, id: string, p: any) => emit('ehw.chain-template.published',   'ehw-template',  id, p, T(t)),
  chainTemplateArchived:   (t: string, id: string, p: any) => emit('ehw.chain-template.archived',    'ehw-template',  id, p, T(t)),
  approvalRequested:       (t: string, id: string, p: any) => emit('ehw.approval.requested',         'ehw-request',   id, p, T(t)),
  approvalDecided:         (t: string, id: string, p: any) => emit('ehw.approval.decided',           'ehw-request',   id, p, T(t)),
  approvalEscalated:       (t: string, id: string, p: any) => emit('ehw.approval.escalated',         'ehw-request',   id, p, T(t)),
  approvalCancelled:       (t: string, id: string, p: any) => emit('ehw.approval.cancelled',         'ehw-request',   id, p, T(t)),
  approvalChangesRequested:(t: string, id: string, p: any) => emit('ehw.approval.changes_requested', 'ehw-request',   id, p, T(t)),
  approvalStepAdvanced:    (t: string, id: string, p: any) => emit('ehw.approval.step.advanced',     'ehw-request',   id, p, T(t)),
  threadCreated:           (t: string, id: string, p: any) => emit('ehw.thread.created',             'ehw-thread',    id, p, T(t)),
  threadMessage:           (t: string, id: string, p: any) => emit('ehw.thread.message',             'ehw-thread',    id, p, T(t)),
  threadResolved:          (t: string, id: string, p: any) => emit('ehw.thread.resolved',            'ehw-thread',    id, p, T(t)),
  threadClosed:            (t: string, id: string, p: any) => emit('ehw.thread.closed',              'ehw-thread',    id, p, T(t)),
};
