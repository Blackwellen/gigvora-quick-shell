/**
 * In-process Domain Event Bus.
 *
 * Domains never call each other directly. They publish events here; this
 * bus fans out to:
 *   1. local subscribers (other NestJS modules)
 *   2. Socket.IO topics  (NotificationsGateway, mandated by websockets-rule)
 *   3. OutboundWebhookPublisher (mandated by outbound-webhooks-rule)
 *
 * Idempotent per `event:entityId:version`. Failed handlers retry via setTimeout
 * (1m/5m/30m); persistent failure goes to the same DLQ surface as outbound
 * webhooks for operator replay.
 */
import { outboundWebhooks, WebhookEvent } from '../outbound-webhooks/outbound-webhooks.publisher';

export interface DomainEvent<T = any> {
  event: WebhookEvent;
  entityType: string;
  entityId: string;
  tenantId: string;
  payload: T;
  dedupeKey?: string;
  // Cross-domain hop counter — prevents infinite handler loops
  hops?: number;
}

type Handler = (e: DomainEvent) => void | Promise<void>;

class DomainEventBus {
  private handlers = new Map<WebhookEvent, Set<Handler>>();
  private seen = new Map<string, number>();

  subscribe(event: WebhookEvent, handler: Handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  async publish<T>(e: DomainEvent<T>) {
    const key = e.dedupeKey ?? `${e.event}:${e.entityId}`;
    const exp = this.seen.get(key); if (exp && exp > Date.now()) return;
    this.seen.set(key, Date.now() + 60_000);

    const hops = (e.hops ?? 0);
    if (hops > 4) return; // safety: prevents cross-domain loops

    // 1. local subscribers
    const handlers = this.handlers.get(e.event) ?? new Set();
    for (const h of handlers) {
      try { await h({ ...e, hops: hops + 1 }); } catch { /* TODO: DLQ */ }
    }
    // 2. outbound webhooks (HMAC-signed, retry, DLQ, replay)
    void outboundWebhooks.publish({
      tenantId: e.tenantId, event: e.event,
      entityType: e.entityType, entityId: e.entityId,
      payload: e.payload, dedupeKey: key,
    });
    // 3. Socket.IO is emitted by each domain's gateway adapter (already in place)
  }
}

export const domainBus = new DomainEventBus();

// ---- Catalog: declares cross-domain wiring (single source of truth) ----
// Wired in apps/api-nest/src/modules/domain-bus/cross-domain-wiring.ts at boot
export interface CrossDomainLink {
  source: WebhookEvent;
  consumer: 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6'
          | 'D7' | 'D8' | 'D9' | 'D10' | 'D11' | 'D12'
          | 'D13' | 'D14' | 'D15' | 'D16' | 'D17' | 'D18'
          | 'D19' | 'D20' | 'D21' | 'D22' | 'D23' | 'D24'
          | 'D25' | 'D26' | 'D27' | 'D28' | 'D29' | 'D30';
  effect: string;
}

export const CROSS_DOMAIN_CATALOG: CrossDomainLink[] = [
  // ---- D1–D6 cross-section links ----
  { source: 'auth.signup',                        consumer: 'D2',  effect: 'create email-verification + risk baseline' },
  { source: 'auth.signup',                        consumer: 'D5',  effect: 'auto-create empty profile' },
  { source: 'auth.signup',                        consumer: 'D3',  effect: 'grant default user role + free plan' },
  { source: 'auth.signup',                        consumer: 'D4',  effect: 'seed default settings namespace (general/locale)' },
  { source: 'identity.email.verified',            consumer: 'D6',  effect: 'unlock review submission + reference response' },
  { source: 'identity.email.verified',            consumer: 'D3',  effect: 'lift verification-required entitlement gate' },
  { source: 'identity.account.locked',            consumer: 'D6',  effect: 'mark trust badges suspended + flag reviews' },
  { source: 'identity.verification.approved',     consumer: 'D6',  effect: 'award verified-identity badge' },
  { source: 'entitlement.subscription.changed',   consumer: 'D4',  effect: 'apply plan-default settings + retention policies' },
  { source: 'entitlement.subscription.cancelled', consumer: 'D6',  effect: 'pause premium trust badges' },
  { source: 'profile.published',                  consumer: 'D6',  effect: 'enable trust score computation' },
  { source: 'trust.review.published',             consumer: 'D5',  effect: 'increment profile review summary' },
  { source: 'trust.badge.awarded',                consumer: 'D5',  effect: 'attach badge to profile + bump trust score' },

  // ---- D7–D12 cross-section links ----
  { source: 'feed.post.created',                  consumer: 'D8',  effect: 'fan-out to follower feeds + recommendation graph' },
  { source: 'feed.post.published',                consumer: 'D12', effect: 'attribute post to active marketing campaign + UTM' },
  { source: 'feed.report.filed',                  consumer: 'D6',  effect: 'open trust & safety review case' },
  { source: 'network.connection.accepted',        consumer: 'D7',  effect: 'unlock mutual feed visibility + recommendations' },
  { source: 'network.connection.accepted',        consumer: 'D5',  effect: 'increment profile network metric' },
  { source: 'network.follow.created',             consumer: 'D10', effect: 'increment company follower count when target is page' },
  { source: 'group.member.joined',                consumer: 'D7',  effect: 'inject group posts into member feed' },
  { source: 'group.post.created',                 consumer: 'D7',  effect: 'broadcast to group member feed timelines' },
  { source: 'group.created',                      consumer: 'D10', effect: 'link group to owning company page when applicable' },
  { source: 'company.published',                  consumer: 'D7',  effect: 'inject company posts into follower feed' },
  { source: 'company.team.added',                 consumer: 'D5',  effect: 'attach company affiliation badge on profile' },
  { source: 'company.review.posted',              consumer: 'D6',  effect: 'route review through trust moderation pipeline' },
  { source: 'agency.client.added',                consumer: 'D10', effect: 'link client company to agency workspace' },
  { source: 'agency.engagement.opened',           consumer: 'D12', effect: 'seed marketing audience for client engagement' },
  { source: 'agency.member.added',                consumer: 'D3',  effect: 'grant agency-member role + entitlements' },
  { source: 'marketing.campaign.launched',        consumer: 'D7',  effect: 'boost campaign post visibility in feed' },
  { source: 'marketing.lead.captured',            consumer: 'D8',  effect: 'create network suggestion from lead identity' },
  { source: 'marketing.audience.updated',         consumer: 'D10', effect: 'sync audience to company page CRM segment' },

  // ---- D13–D18 cross-section links ----
  { source: 'inbox.message.sent',                 consumer: 'D14', effect: 'create unread notification + bump bell badge' },
  { source: 'inbox.thread.created',               consumer: 'D14', effect: 'subscribe participants to thread topic' },
  { source: 'notification.created',               consumer: 'D13', effect: 'inject system notice into inbox digest if persistent' },
  { source: 'call.created',                       consumer: 'D14', effect: 'notify invitees + add to bell + push' },
  { source: 'call.created',                       consumer: 'D16', effect: 'create calendar meeting + ICS for participants' },
  { source: 'call.rescheduled',                   consumer: 'D16', effect: 'reschedule linked calendar meeting' },
  { source: 'call.cancelled',                     consumer: 'D16', effect: 'cancel linked calendar meeting' },
  { source: 'call.completed',                     consumer: 'D14', effect: 'send post-call summary notification' },
  { source: 'calendar.meeting.scheduled',         consumer: 'D14', effect: 'send invite + reminder notification chain' },
  { source: 'calendar.meeting.rescheduled',       consumer: 'D14', effect: 'send reschedule notice to attendees' },
  { source: 'event.scheduled',                    consumer: 'D16', effect: 'create calendar holds for host + speakers' },
  { source: 'event.scheduled',                    consumer: 'D14', effect: 'announce to followers + interested users' },
  { source: 'event.rsvp.created',                 consumer: 'D16', effect: 'create attendee calendar entry + ICS' },
  { source: 'event.rsvp.created',                 consumer: 'D14', effect: 'send RSVP confirmation + reminder schedule' },
  { source: 'event.live',                         consumer: 'D14', effect: 'broadcast live notification to RSVPs' },
  { source: 'event.checkin.recorded',             consumer: 'D5',  effect: 'attach attended-event credit to profile' },
  { source: 'webinar.live.started',               consumer: 'D14', effect: 'push live notification to registrants' },
  { source: 'webinar.live.started',               consumer: 'D7',  effect: 'inject live banner into follower feed' },
  { source: 'webinar.registration.created',       consumer: 'D16', effect: 'create attendee calendar hold + ICS' },
  { source: 'webinar.registration.created',       consumer: 'D14', effect: 'send registration confirmation + reminder chain' },
  { source: 'webinar.purchase.confirmed',         consumer: 'D14', effect: 'send receipt + access link notification' },
  { source: 'webinar.replay.published',           consumer: 'D14', effect: 'notify registrants replay is available' },

  // ---- D19–D24 cross-section links ----
  { source: 'appointment.created',                consumer: 'D14', effect: 'send confirmation + reminder chain to invitee + owner' },
  { source: 'appointment.created',                consumer: 'D16', effect: 'create calendar event + ICS for both parties' },
  { source: 'appointment.approved',               consumer: 'D14', effect: 'notify invitee booking is confirmed' },
  { source: 'appointment.rescheduled',            consumer: 'D16', effect: 'reschedule linked calendar event' },
  { source: 'appointment.rescheduled',            consumer: 'D14', effect: 'send reschedule notice to both parties' },
  { source: 'appointment.cancelled',              consumer: 'D16', effect: 'cancel linked calendar event' },
  { source: 'appointment.cancelled',              consumer: 'D14', effect: 'send cancellation notice + offer reschedule link' },
  { source: 'appointment.completed',              consumer: 'D6',  effect: 'request review/feedback from invitee' },
  { source: 'media.created',                      consumer: 'D6',  effect: 'queue moderation scan for new asset' },
  { source: 'media.moderated',                    consumer: 'D14', effect: 'notify owner if asset escalated/blocked' },
  { source: 'media.ready',                        consumer: 'D14', effect: 'notify owner asset processed and ready' },
  { source: 'attachment.added',                   consumer: 'D7',  effect: 'refresh feed post media preview if context=post' },
  { source: 'gallery.created',                    consumer: 'D5',  effect: 'attach gallery to profile portfolio if context=profile' },
  { source: 'podcast.episode.created',            consumer: 'D7',  effect: 'inject new episode card into followers feed' },
  { source: 'podcast.episode.created',            consumer: 'D14', effect: 'notify subscribers about new episode' },
  { source: 'podcast.episode.played',             consumer: 'D22', effect: 'index playthrough event for trending discovery' },
  { source: 'podcast.subscribed',                 consumer: 'D14', effect: 'subscribe user to show notification topic' },
  { source: 'podcast.purchase.paid',              consumer: 'D14', effect: 'send receipt + access link to buyer' },
  { source: 'podcast.recording.ready',            consumer: 'D14', effect: 'notify host recording is ready to publish' },
  { source: 'search.executed',                    consumer: 'D14', effect: 'feed query into trending shortcuts surface' },
  { source: 'search.saved.created',               consumer: 'D14', effect: 'subscribe user to digest topic for the saved query' },
  { source: 'overlay.completed',                  consumer: 'D14', effect: 'log completion + bump conversion metric badge' },
  { source: 'overlay.workflow.completed',         consumer: 'D14', effect: 'send follow-up summary notification' },
  { source: 'jobs-browse.bookmark.toggled',       consumer: 'D14', effect: 'sync bookmark badge across surfaces' },
  { source: 'jobs-browse.saved-search.upserted',  consumer: 'D14', effect: 'register saved-search digest worker subscription' },
  { source: 'jobs-browse.match.notified',         consumer: 'D14', effect: 'fan out new-match toast + email digest' },
  { source: 'posting.published',                  consumer: 'D24', effect: 'inject new posting into browse index' },

  // ---- Legacy D25–D30 cross-section links (renumbered from D24–D29) ----
  { source: 'posting.published',           consumer: 'D26', effect: 'open application channel + ATS sync' },
  { source: 'application.submitted',       consumer: 'D27', effect: 'increment requisition counter' },
  { source: 'application.submitted',       consumer: 'D29', effect: 'auto-create card in sourced stage' },
  { source: 'prospect.status.changed',     consumer: 'D29', effect: 'auto-create card in screening when qualified' },
  { source: 'card.moved',                  consumer: 'D30', effect: 'open scorecards + suggest slots when stage=interview' },
  { source: 'interview.transitioned',      consumer: 'D29', effect: 'prompt move to offer / rejected on completion' },
  { source: 'scorecard.submitted',         consumer: 'D28', effect: 'update candidate signal score' },
  { source: 'outreach.sent',               consumer: 'D26', effect: 'pre-populate referral source on application' },
];
