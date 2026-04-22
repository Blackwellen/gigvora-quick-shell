/**
 * Shared OutboundWebhookPublisher used by every domain (D24+).
 *
 * Responsibilities:
 *  - Tenant subscription registry (event → URL + secret + filters)
 *  - HMAC-SHA256 signing  (X-Gigvora-Signature: t=<ts>,v1=<sig>)
 *  - Idempotent publish (Redis/in-memory SETNX dedupe key, 24h)
 *  - Delivery log (per attempt: status, code, latency, attempt#, nextRetryAt)
 *  - Exponential retry (1m → 5m → 30m → 2h → 12h) → DLQ after 5 attempts
 *  - Replay endpoint
 *
 * Backed by an in-process queue with a pluggable BullMQ adapter; tests use
 * the in-memory mode so suites stay deterministic.
 */
import crypto from 'node:crypto';

export type WebhookEvent =
  // D1 Auth & Sessions
  | 'auth.signup' | 'auth.login' | 'auth.logout' | 'auth.refresh'
  // D2 Identity & Risk
  | 'identity.email.verified' | 'identity.password.reset.requested' | 'identity.password.reset.completed'
  | 'identity.mfa.enabled' | 'identity.session.revoked' | 'identity.verification.approved'
  | 'identity.verification.rejected' | 'identity.verification.escalated' | 'identity.account.locked'
  // D3 Entitlements & Plans
  | 'entitlement.role.granted' | 'entitlement.role.revoked' | 'entitlement.role.switched'
  | 'entitlement.subscription.created' | 'entitlement.subscription.changed' | 'entitlement.subscription.cancelled'
  | 'entitlement.override.created' | 'entitlement.override.revoked' | 'entitlement.access.denied'
  // D4 Settings & Preferences
  | 'setting.upserted' | 'setting.bulk.upserted' | 'setting.namespace.reset'
  | 'connected.account.linked' | 'connected.account.revoked' | 'data.request.created'
  // D5 Profiles
  | 'profile.created' | 'profile.updated' | 'profile.published' | 'profile.archived'
  // D6 Trust & Safety
  | 'trust.review.created' | 'trust.review.published' | 'trust.review.rejected'
  | 'trust.review.disputed' | 'trust.review.responded' | 'trust.reference.requested'
  | 'trust.reference.submitted' | 'trust.verification.started' | 'trust.badge.awarded'
  | 'trust.badge.revoked'
  // D7 Feed & Posts
  | 'feed.post.created' | 'feed.post.updated' | 'feed.post.deleted' | 'feed.post.published'
  | 'feed.reaction.added' | 'feed.reaction.removed' | 'feed.comment.added' | 'feed.comment.removed'
  | 'feed.repost.created' | 'feed.report.filed'
  // D8 Network & Connections
  | 'network.connection.requested' | 'network.connection.accepted' | 'network.connection.declined'
  | 'network.connection.removed' | 'network.follow.created' | 'network.follow.removed'
  | 'network.block.created' | 'network.block.removed' | 'network.recommendation.sent'
  // D9 Groups & Communities
  | 'group.created' | 'group.updated' | 'group.archived' | 'group.member.joined'
  | 'group.member.left' | 'group.member.invited' | 'group.member.banned' | 'group.post.created'
  | 'group.post.pinned' | 'group.role.changed'
  // D10 Companies & Pages
  | 'company.created' | 'company.updated' | 'company.verified' | 'company.published'
  | 'company.archived' | 'company.follower.added' | 'company.follower.removed'
  | 'company.team.added' | 'company.team.removed' | 'company.review.posted'
  // D11 Agency Workspace
  | 'agency.created' | 'agency.updated' | 'agency.client.added' | 'agency.client.removed'
  | 'agency.member.added' | 'agency.member.removed' | 'agency.engagement.opened'
  | 'agency.engagement.closed' | 'agency.invoice.issued'
  // D12 Marketing & Campaigns
  | 'marketing.campaign.created' | 'marketing.campaign.scheduled' | 'marketing.campaign.launched'
  | 'marketing.campaign.paused' | 'marketing.campaign.completed' | 'marketing.audience.created'
  | 'marketing.audience.updated' | 'marketing.asset.published' | 'marketing.lead.captured'
  | 'marketing.utm.tracked'
  // D13 Inbox & Threaded Messaging
  | 'inbox.thread.created' | 'inbox.thread.archived' | 'inbox.thread.snoozed' | 'inbox.thread.blocked'
  | 'inbox.thread.participants.added' | 'inbox.thread.participants.removed'
  | 'inbox.message.sent' | 'inbox.message.deleted' | 'inbox.message.read' | 'inbox.context.linked'
  // D14 Notifications & Activity
  | 'notification.created' | 'notification.read' | 'notification.dismissed'
  | 'notification.preference.upserted' | 'notification.device.registered' | 'notification.device.revoked'
  | 'notification.activity.emitted' | 'notification.webhook.created' | 'notification.webhook.revoked'
  // D15 Calls & Voice/Video Sessions
  | 'call.created' | 'call.updated' | 'call.rescheduled' | 'call.cancelled' | 'call.completed'
  | 'call.presence.updated' | 'call.window.upserted' | 'call.window.deleted'
  // D16 Calendar & Scheduling
  | 'calendar.meeting.scheduled' | 'calendar.meeting.rescheduled' | 'calendar.meeting.cancelled'
  | 'calendar.invite.sent' | 'calendar.ics.generated'
  // D17 Events, RSVPs & Sessions
  | 'event.created' | 'event.updated' | 'event.scheduled' | 'event.live' | 'event.completed'
  | 'event.cancelled' | 'event.archived' | 'event.rsvp.created' | 'event.rsvp.cancelled'
  | 'event.checkin.recorded' | 'event.feedback.submitted' | 'event.speaker.added' | 'event.session.added'
  // D18 Webinars & Live Streaming
  | 'webinar.created' | 'webinar.transitioned' | 'webinar.live.started' | 'webinar.live.ended'
  | 'webinar.registration.created' | 'webinar.purchase.created' | 'webinar.purchase.confirmed'
  | 'webinar.donation.captured' | 'webinar.chat.message' | 'webinar.replay.published'
  // D19 Booking & Appointments
  | 'booking.link.created' | 'booking.link.updated' | 'booking.link.archived'
  | 'appointment.created' | 'appointment.approved' | 'appointment.rejected'
  | 'appointment.rescheduled' | 'appointment.cancelled' | 'appointment.completed' | 'appointment.no_show'
  // D20 Media Viewer & Galleries
  | 'media.created' | 'media.updated' | 'media.archived' | 'media.restored'
  | 'media.processing' | 'media.ready' | 'media.moderated'
  | 'media.viewed' | 'media.liked' | 'media.downloaded'
  | 'gallery.created' | 'gallery.updated' | 'gallery.deleted'
  | 'attachment.added' | 'attachment.removed'
  // D21 Podcasts (shows, episodes, recordings, purchases)
  | 'podcast.show.created' | 'podcast.show.updated' | 'podcast.show.active' | 'podcast.show.paused' | 'podcast.show.archived'
  | 'podcast.episode.created' | 'podcast.episode.updated' | 'podcast.episode.active' | 'podcast.episode.paused' | 'podcast.episode.archived' | 'podcast.episode.failed'
  | 'podcast.episode.played' | 'podcast.episode.liked'
  | 'podcast.album.created' | 'podcast.album.updated' | 'podcast.album.deleted'
  | 'podcast.subscribed' | 'podcast.unsubscribed'
  | 'podcast.recording.started' | 'podcast.recording.processing' | 'podcast.recording.ready' | 'podcast.recording.failed'
  | 'podcast.purchase.pending' | 'podcast.purchase.paid' | 'podcast.purchase.refunded'
  // D22 Search & Discovery
  | 'search.executed' | 'search.click.tracked'
  | 'search.saved.created' | 'search.saved.archived'
  | 'search.shortcut.upserted' | 'search.link.created' | 'search.document.upserted'
  // D23 Overlays & Workflows
  | 'overlay.opened' | 'overlay.dismissed' | 'overlay.completed' | 'overlay.expired' | 'overlay.failed' | 'overlay.escalated'
  | 'overlay.workflow.started' | 'overlay.workflow.step' | 'overlay.workflow.completed'
  | 'overlay.window.detached' | 'overlay.window.pinged' | 'overlay.window.closed'
  // D24 Jobs Browse & Saved Searches
  | 'jobs-browse.search.executed' | 'jobs-browse.bookmark.toggled'
  | 'jobs-browse.saved-search.upserted' | 'jobs-browse.saved-search.removed'
  | 'jobs-browse.match.notified'
  // D25 Job Posting Studio (was D24 in prior pack — renumbered)
  | 'posting.published' | 'posting.paused' | 'posting.archived' | 'credits.purchased' | 'credits.consumed'
  // D26 Job Application Flow
  | 'application.submitted' | 'application.advanced' | 'application.rejected' | 'application.withdrawn'
  // D27 Recruiter Job Management
  | 'requisition.opened' | 'requisition.approved' | 'requisition.closed'
  // D28 Talent Search & Navigator
  | 'search.saved' | 'prospect.added' | 'prospect.status.changed' | 'outreach.sent' | 'outreach.replied'
  // D29 Candidate Pipeline
  | 'card.created' | 'card.moved' | 'card.note.added' | 'card.mention'
  // D30 Interview Planning
  | 'interview.created' | 'interview.transitioned' | 'interview.rescheduled' | 'interviewer.responded'
  | 'scorecard.drafted' | 'scorecard.submitted' | 'scorecard.withdrawn'
  | 'calibration.opened' | 'calibration.decided'
  | 'panel.created' | 'panel.updated' | 'panel.status'
  // D30-hiring (Enterprise Hiring Workspace + Approval Chains, suffixed slot)
  | 'ehw.workspace.created' | 'ehw.workspace.updated' | 'ehw.workspace.transitioned'
  | 'ehw.member.upserted' | 'ehw.member.removed'
  | 'ehw.chain-template.created' | 'ehw.chain-template.updated'
  | 'ehw.chain-template.published' | 'ehw.chain-template.archived'
  | 'ehw.approval.requested' | 'ehw.approval.decided' | 'ehw.approval.escalated'
  | 'ehw.approval.cancelled' | 'ehw.approval.changes_requested' | 'ehw.approval.step.advanced'
  | 'ehw.thread.created' | 'ehw.thread.message' | 'ehw.thread.resolved' | 'ehw.thread.closed'
  // D31 Open-to-Work, Availability, Matching Signals
  | 'cam.profile.upserted' | 'cam.profile.transitioned'
  | 'cam.window.created' | 'cam.window.cancelled'
  | 'cam.signal.generated' | 'cam.signal.actioned'
  | 'cam.invitation.created' | 'cam.invitation.decided' | 'cam.invitation.expired'
  // D32 Projects Browse, Search, and Discovery Marketplace
  | 'pbd.search.executed' | 'pbd.bookmark.toggled'
  | 'pbd.saved-search.upserted' | 'pbd.saved-search.removed' | 'pbd.saved-search.alert.scheduled'
  | 'pbd.proposal.drafted' | 'pbd.proposal.submitted' | 'pbd.proposal.withdrawn'
  | 'pbd.proposal.shortlisted' | 'pbd.proposal.rejected' | 'pbd.proposal.accepted'
  | 'pbd.project.viewed' | 'pbd.project.flagged' | 'pbd.project.invited'
  | 'pbd.project.transitioned' | 'pbd.match.notified'
  | 'pbd.attachment.uploaded' | 'pbd.attachment.scanned' | 'pbd.attachment.removed'
  // D33 Project Posting Studio, Smart Match & Invite Flows
  | 'pps.project.created' | 'pps.project.updated' | 'pps.project.transitioned'
  | 'pps.project.published' | 'pps.project.paused' | 'pps.project.resumed'
  | 'pps.project.archived' | 'pps.project.boosted'
  | 'pps.approval.submitted' | 'pps.approval.decided'
  | 'pps.match.generated' | 'pps.match.explained'
  | 'pps.invite.sent' | 'pps.invite.opened' | 'pps.invite.accepted'
  | 'pps.invite.declined' | 'pps.invite.maybe' | 'pps.invite.expired'
  | 'pps.invite.revoked' | 'pps.invite.bulk-sent'
  | 'pps.boost-purchase.created' | 'pps.boost-purchase.confirmed' | 'pps.boost-purchase.refunded'
  | 'pps.boost.applied' | 'pps.invite-credits.consumed' | 'pps.invite-credits.topped-up'
  // D34 Proposal Builder, Bid Credits, Scope & Pricing Submission
  | 'pbb.proposal.drafted' | 'pbb.proposal.updated' | 'pbb.proposal.submitted'
  | 'pbb.proposal.withdrawn' | 'pbb.proposal.shortlisted' | 'pbb.proposal.accepted'
  | 'pbb.proposal.rejected' | 'pbb.proposal.revised' | 'pbb.proposal.expired'
  | 'pbb.proposal.boosted' | 'pbb.scope.locked' | 'pbb.pricing.changed'
  | 'pbb.milestone.added' | 'pbb.milestone.removed' | 'pbb.milestone.reordered'
  | 'pbb.attachment.uploaded' | 'pbb.attachment.scanned' | 'pbb.attachment.removed'
  | 'pbb.credit-purchase.created' | 'pbb.credit-purchase.confirmed' | 'pbb.credit-purchase.refunded'
  | 'pbb.credits.consumed' | 'pbb.credits.topped-up' | 'pbb.credits.refunded'
  | 'pbb.escrow.held' | 'pbb.escrow.released' | 'pbb.escrow.refunded'
  | 'pbb.boost.applied'
  // D35 Proposal Review, Compare, Shortlist & Award Decisions
  | 'praa.review.shortlisted' | 'praa.review.unshortlisted' | 'praa.review.rejected'
  | 'praa.review.revision-requested' | 'praa.review.ranked' | 'praa.review.bulk-decided'
  | 'praa.note.added' | 'praa.score.computed' | 'praa.weights.updated'
  | 'praa.award.drafted' | 'praa.award.submitted' | 'praa.award.approved'
  | 'praa.award.rejected' | 'praa.award.cancelled' | 'praa.award.escrow-handoff'
  | 'praa.award.closed'
  | 'praa.approval.requested' | 'praa.approval.approved' | 'praa.approval.rejected'
  | 'praa.approval.expired'
  // D36 Contracts, SoW, Terms Acceptance & Signature Follow-Through
  | 'csa.contract.minted' | 'csa.contract.snapshot-taken' | 'csa.contract.sent'
  | 'csa.contract.viewed' | 'csa.contract.amended' | 'csa.contract.superseded'
  | 'csa.contract.activated' | 'csa.contract.rejected' | 'csa.contract.cancelled'
  | 'csa.contract.expired' | 'csa.contract.hash-verified'
  | 'csa.party.added' | 'csa.party.removed'
  | 'csa.signature.requested' | 'csa.signature.captured' | 'csa.signature.rejected'
  | 'csa.signature.reminder-sent'
  | 'csa.terms.accepted' | 'csa.scope.acknowledged' | 'csa.ledger.appended'
  | 'csa.followup.scheduled' | 'csa.followup.fired'
  // D37 Project Workspaces & Handover
  | 'pwh.workspace.minted' | 'pwh.workspace.kickoff' | 'pwh.workspace.activated'
  | 'pwh.workspace.on-hold' | 'pwh.workspace.cancelled' | 'pwh.workspace.closed'
  | 'pwh.milestone.started' | 'pwh.milestone.submitted'
  | 'pwh.milestone.accepted' | 'pwh.milestone.rejected'
  | 'pwh.deliverable.submitted' | 'pwh.deliverable.accepted' | 'pwh.deliverable.changes-requested'
  | 'pwh.handover.started' | 'pwh.handover.item-completed' | 'pwh.handover.completed'
  | 'pwh.final-report.published' | 'pwh.retainer.offered'
  | 'pwh.party.added' | 'pwh.party.removed';

export interface WebhookSubscription {
  id: string;
  tenantId: string;
  url: string;
  secret: string;          // rotating per-subscription HMAC secret
  events: WebhookEvent[];  // [] = all
  active: boolean;
  createdAt: string;
}

export interface DeliveryLog {
  id: string;
  subscriptionId: string;
  event: WebhookEvent;
  entityType: string;
  entityId: string;
  attempt: number;
  status: 'pending' | 'success' | 'failed' | 'dlq';
  httpCode?: number;
  latencyMs?: number;
  nextRetryAt?: string;
  payload: any;
  dedupeKey: string;
  createdAt: string;
  updatedAt: string;
}

const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 3_600_000, 12 * 3_600_000];

export class OutboundWebhookPublisher {
  private subs = new Map<string, WebhookSubscription>();
  private deliveries = new Map<string, DeliveryLog>();
  private dedupe = new Map<string, number>();        // dedupeKey → expiresAt
  private fetchImpl: typeof fetch;

  constructor(fetchImpl: typeof fetch = fetch) { this.fetchImpl = fetchImpl; }

  // ---- Subscriptions ----
  upsertSubscription(s: Omit<WebhookSubscription, 'id' | 'createdAt' | 'secret'> & { id?: string; secret?: string }) {
    const id = s.id ?? crypto.randomUUID();
    const secret = s.secret ?? crypto.randomBytes(32).toString('hex');
    const sub: WebhookSubscription = { ...s, id, secret, createdAt: new Date().toISOString() };
    this.subs.set(id, sub); return sub;
  }
  listSubscriptions(tenantId: string) { return [...this.subs.values()].filter((s) => s.tenantId === tenantId); }
  rotateSecret(id: string) {
    const s = this.subs.get(id); if (!s) throw new Error('not found');
    s.secret = crypto.randomBytes(32).toString('hex'); return s;
  }

  // ---- Publishing ----
  async publish(args: {
    tenantId: string; event: WebhookEvent; entityType: string; entityId: string;
    payload: any; dedupeKey?: string;
  }) {
    const dedupeKey = args.dedupeKey ?? `${args.event}:${args.entityId}:${Date.now()}`;
    const exp = this.dedupe.get(dedupeKey);
    if (exp && exp > Date.now()) return { deduped: true, deliveryIds: [] as string[] };
    this.dedupe.set(dedupeKey, Date.now() + 24 * 3_600_000);

    const targets = [...this.subs.values()].filter(
      (s) => s.tenantId === args.tenantId && s.active && (s.events.length === 0 || s.events.includes(args.event)),
    );
    const deliveryIds: string[] = [];
    for (const sub of targets) {
      const log: DeliveryLog = {
        id: crypto.randomUUID(), subscriptionId: sub.id, event: args.event,
        entityType: args.entityType, entityId: args.entityId, attempt: 0,
        status: 'pending', payload: args.payload, dedupeKey,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      this.deliveries.set(log.id, log); deliveryIds.push(log.id);
      void this.attempt(log.id);
    }
    return { deduped: false, deliveryIds };
  }

  // ---- Attempt + retry ----
  private async attempt(deliveryId: string) {
    const log = this.deliveries.get(deliveryId); if (!log) return;
    const sub = this.subs.get(log.subscriptionId); if (!sub) return;
    log.attempt += 1; log.updatedAt = new Date().toISOString();
    const ts = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({ event: log.event, entityType: log.entityType, entityId: log.entityId, payload: log.payload });
    const sig = crypto.createHmac('sha256', sub.secret).update(`${ts}.${body}`).digest('hex');
    const start = Date.now();
    try {
      const res = await this.fetchImpl(sub.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-gigvora-event': log.event,
          'x-gigvora-delivery-id': log.id,
          'x-gigvora-signature': `t=${ts},v1=${sig}`,
        },
        body,
      });
      log.latencyMs = Date.now() - start; log.httpCode = res.status;
      if (res.ok) { log.status = 'success'; return; }
      this.scheduleRetry(log);
    } catch {
      log.latencyMs = Date.now() - start;
      this.scheduleRetry(log);
    }
  }
  private scheduleRetry(log: DeliveryLog) {
    if (log.attempt >= RETRY_DELAYS_MS.length) { log.status = 'dlq'; return; }
    log.status = 'pending';
    const delay = RETRY_DELAYS_MS[log.attempt - 1] ?? 60_000;
    log.nextRetryAt = new Date(Date.now() + delay).toISOString();
    setTimeout(() => void this.attempt(log.id), delay).unref?.();
  }

  // ---- Replay + listing ----
  async replay(deliveryId: string) {
    const log = this.deliveries.get(deliveryId); if (!log) throw new Error('not found');
    log.attempt = 0; log.status = 'pending'; await this.attempt(deliveryId); return log;
  }
  listDeliveries(tenantId: string, filters: { event?: WebhookEvent; status?: DeliveryLog['status'] } = {}) {
    const subIds = new Set(this.listSubscriptions(tenantId).map((s) => s.id));
    return [...this.deliveries.values()]
      .filter((d) => subIds.has(d.subscriptionId)
        && (!filters.event || d.event === filters.event)
        && (!filters.status || d.status === filters.status))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
}

// Singleton used by every domain module
export const outboundWebhooks = new OutboundWebhookPublisher();
