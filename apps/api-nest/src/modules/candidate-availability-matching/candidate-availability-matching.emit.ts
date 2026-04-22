/**
 * D31 emit helpers — outbound webhooks + cross-domain bus.
 * Each meaningful state transition publishes a webhook AND emits onto the bus
 * so consumers (notifications, recruiter pipeline, calendar) react.
 */
import { outboundWebhooks, type WebhookEvent } from '../outbound-webhooks/outbound-webhooks.publisher';
import { domainBus } from '../domain-bus/domain-bus';

const T = (tenantId: string) => tenantId || 'tenant-demo';
function emit(event: WebhookEvent, entityType: string, entityId: string, payload: any, tenantId: string) {
  void outboundWebhooks.publish({ tenantId, event, entityType, entityId, payload });
  domainBus.emit(event, { tenantId, entityType, entityId, payload });
}

export const D31Emit = {
  profileUpserted:    (t: string, id: string, p: any) => emit('cam.profile.upserted',    'cam-profile',    id, p, T(t)),
  profileTransitioned:(t: string, id: string, p: any) => emit('cam.profile.transitioned','cam-profile',    id, p, T(t)),
  windowCreated:      (t: string, id: string, p: any) => emit('cam.window.created',      'cam-window',     id, p, T(t)),
  windowCancelled:    (t: string, id: string, p: any) => emit('cam.window.cancelled',    'cam-window',     id, p, T(t)),
  signalGenerated:    (t: string, id: string, p: any) => emit('cam.signal.generated',    'cam-signal',     id, p, T(t)),
  signalActioned:     (t: string, id: string, p: any) => emit('cam.signal.actioned',     'cam-signal',     id, p, T(t)),
  invitationCreated:  (t: string, id: string, p: any) => emit('cam.invitation.created',  'cam-invitation', id, p, T(t)),
  invitationDecided:  (t: string, id: string, p: any) => emit('cam.invitation.decided',  'cam-invitation', id, p, T(t)),
  invitationExpired:  (t: string, id: string, p: any) => emit('cam.invitation.expired',  'cam-invitation', id, p, T(t)),
};
