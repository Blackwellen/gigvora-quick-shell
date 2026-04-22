/**
 * Per-domain emission helpers. Each domain service imports its helper and
 * calls it after every state transition. The helper publishes to:
 *   - DomainEventBus (which fans to outbound webhooks + cross-domain handlers)
 *   - Socket.IO is emitted separately by each domain's existing gateway adapter
 *
 * Backfill schedule: D1–D24 in groups of 6; legacy D24–D29 renumbered to D25–D30.
 */
import { domainBus } from '../domain-bus/domain-bus';
import type { WebhookEvent } from '../outbound-webhooks/outbound-webhooks.publisher';

function emit(event: WebhookEvent, entityType: string, entityId: string, payload: any, tenantId: string) {
  return domainBus.publish({ event, entityType, entityId, payload, tenantId });
}

const T = (id?: string | null) => id ?? 'tenant-demo';

// ---- D1 Auth & Sessions ----
export const D1Emit = {
  signup:  (tenantId: string, id: string, p: any) => emit('auth.signup',  'identity', id, p, T(tenantId)),
  login:   (tenantId: string, id: string, p: any) => emit('auth.login',   'identity', id, p, T(tenantId)),
  logout:  (tenantId: string, id: string, p: any) => emit('auth.logout',  'identity', id, p, T(tenantId)),
  refresh: (tenantId: string, id: string, p: any) => emit('auth.refresh', 'identity', id, p, T(tenantId)),
};

// ---- D2 Identity & Risk ----
export const D2Emit = {
  emailVerified:        (tenantId: string, id: string, p: any) => emit('identity.email.verified',          'identity',     id, p, T(tenantId)),
  pwResetRequested:     (tenantId: string, id: string, p: any) => emit('identity.password.reset.requested','identity',     id, p, T(tenantId)),
  pwResetCompleted:     (tenantId: string, id: string, p: any) => emit('identity.password.reset.completed','identity',     id, p, T(tenantId)),
  mfaEnabled:           (tenantId: string, id: string, p: any) => emit('identity.mfa.enabled',             'identity',     id, p, T(tenantId)),
  sessionRevoked:       (tenantId: string, id: string, p: any) => emit('identity.session.revoked',         'session',      id, p, T(tenantId)),
  accountLocked:        (tenantId: string, id: string, p: any) => emit('identity.account.locked',          'identity',     id, p, T(tenantId)),
  verificationApproved: (tenantId: string, id: string, p: any) => emit('identity.verification.approved',   'verification', id, p, T(tenantId)),
  verificationRejected: (tenantId: string, id: string, p: any) => emit('identity.verification.rejected',   'verification', id, p, T(tenantId)),
  verificationEscalated:(tenantId: string, id: string, p: any) => emit('identity.verification.escalated',  'verification', id, p, T(tenantId)),
};

// ---- D3 Entitlements & Plans ----
export const D3Emit = {
  roleGranted:          (tenantId: string, id: string, p: any) => emit('entitlement.role.granted',          'role-grant',   id, p, T(tenantId)),
  roleRevoked:          (tenantId: string, id: string, p: any) => emit('entitlement.role.revoked',          'role-grant',   id, p, T(tenantId)),
  roleSwitched:         (tenantId: string, id: string, p: any) => emit('entitlement.role.switched',         'identity',     id, p, T(tenantId)),
  subscriptionCreated:  (tenantId: string, id: string, p: any) => emit('entitlement.subscription.created',  'subscription', id, p, T(tenantId)),
  subscriptionChanged:  (tenantId: string, id: string, p: any) => emit('entitlement.subscription.changed',  'subscription', id, p, T(tenantId)),
  subscriptionCancelled:(tenantId: string, id: string, p: any) => emit('entitlement.subscription.cancelled','subscription', id, p, T(tenantId)),
  overrideCreated:      (tenantId: string, id: string, p: any) => emit('entitlement.override.created',      'override',     id, p, T(tenantId)),
  overrideRevoked:      (tenantId: string, id: string, p: any) => emit('entitlement.override.revoked',      'override',     id, p, T(tenantId)),
  accessDenied:         (tenantId: string, id: string, p: any) => emit('entitlement.access.denied',         'identity',     id, p, T(tenantId)),
};

// ---- D4 Settings & Preferences ----
export const D4Emit = {
  upserted:        (tenantId: string, id: string, p: any) => emit('setting.upserted',         'setting',           id, p, T(tenantId)),
  bulkUpserted:    (tenantId: string, id: string, p: any) => emit('setting.bulk.upserted',    'setting',           id, p, T(tenantId)),
  namespaceReset:  (tenantId: string, id: string, p: any) => emit('setting.namespace.reset',  'setting-namespace', id, p, T(tenantId)),
  accountLinked:   (tenantId: string, id: string, p: any) => emit('connected.account.linked', 'connected-account', id, p, T(tenantId)),
  accountRevoked:  (tenantId: string, id: string, p: any) => emit('connected.account.revoked','connected-account', id, p, T(tenantId)),
  dataRequest:     (tenantId: string, id: string, p: any) => emit('data.request.created',     'data-request',      id, p, T(tenantId)),
};

// ---- D5 Profiles ----
export const D5Emit = {
  created:   (tenantId: string, id: string, p: any) => emit('profile.created',   'profile', id, p, T(tenantId)),
  updated:   (tenantId: string, id: string, p: any) => emit('profile.updated',   'profile', id, p, T(tenantId)),
  published: (tenantId: string, id: string, p: any) => emit('profile.published', 'profile', id, p, T(tenantId)),
  archived:  (tenantId: string, id: string, p: any) => emit('profile.archived',  'profile', id, p, T(tenantId)),
};

// ---- D6 Trust & Safety ----
export const D6Emit = {
  reviewCreated:        (tenantId: string, id: string, p: any) => emit('trust.review.created',        'review',       id, p, T(tenantId)),
  reviewPublished:      (tenantId: string, id: string, p: any) => emit('trust.review.published',      'review',       id, p, T(tenantId)),
  reviewRejected:       (tenantId: string, id: string, p: any) => emit('trust.review.rejected',       'review',       id, p, T(tenantId)),
  reviewDisputed:       (tenantId: string, id: string, p: any) => emit('trust.review.disputed',       'review',       id, p, T(tenantId)),
  reviewResponded:      (tenantId: string, id: string, p: any) => emit('trust.review.responded',      'review',       id, p, T(tenantId)),
  referenceRequested:   (tenantId: string, id: string, p: any) => emit('trust.reference.requested',   'reference',    id, p, T(tenantId)),
  referenceSubmitted:   (tenantId: string, id: string, p: any) => emit('trust.reference.submitted',   'reference',    id, p, T(tenantId)),
  verificationStarted:  (tenantId: string, id: string, p: any) => emit('trust.verification.started',  'verification', id, p, T(tenantId)),
  badgeAwarded:         (tenantId: string, id: string, p: any) => emit('trust.badge.awarded',         'badge',        id, p, T(tenantId)),
  badgeRevoked:         (tenantId: string, id: string, p: any) => emit('trust.badge.revoked',         'badge',        id, p, T(tenantId)),
};

// ---- D7 Feed & Posts ----
export const D7Emit = {
  postCreated:     (tenantId: string, id: string, p: any) => emit('feed.post.created',     'post',    id, p, T(tenantId)),
  postUpdated:     (tenantId: string, id: string, p: any) => emit('feed.post.updated',     'post',    id, p, T(tenantId)),
  postDeleted:     (tenantId: string, id: string, p: any) => emit('feed.post.deleted',     'post',    id, p, T(tenantId)),
  postPublished:   (tenantId: string, id: string, p: any) => emit('feed.post.published',   'post',    id, p, T(tenantId)),
  reactionAdded:   (tenantId: string, id: string, p: any) => emit('feed.reaction.added',   'reaction',id, p, T(tenantId)),
  reactionRemoved: (tenantId: string, id: string, p: any) => emit('feed.reaction.removed', 'reaction',id, p, T(tenantId)),
  commentAdded:    (tenantId: string, id: string, p: any) => emit('feed.comment.added',    'comment', id, p, T(tenantId)),
  commentRemoved:  (tenantId: string, id: string, p: any) => emit('feed.comment.removed',  'comment', id, p, T(tenantId)),
  repostCreated:   (tenantId: string, id: string, p: any) => emit('feed.repost.created',   'repost',  id, p, T(tenantId)),
  reportFiled:     (tenantId: string, id: string, p: any) => emit('feed.report.filed',     'report',  id, p, T(tenantId)),
};

// ---- D8 Network & Connections ----
export const D8Emit = {
  connectionRequested: (tenantId: string, id: string, p: any) => emit('network.connection.requested', 'connection',     id, p, T(tenantId)),
  connectionAccepted:  (tenantId: string, id: string, p: any) => emit('network.connection.accepted',  'connection',     id, p, T(tenantId)),
  connectionDeclined:  (tenantId: string, id: string, p: any) => emit('network.connection.declined',  'connection',     id, p, T(tenantId)),
  connectionRemoved:   (tenantId: string, id: string, p: any) => emit('network.connection.removed',   'connection',     id, p, T(tenantId)),
  followCreated:       (tenantId: string, id: string, p: any) => emit('network.follow.created',       'follow',         id, p, T(tenantId)),
  followRemoved:       (tenantId: string, id: string, p: any) => emit('network.follow.removed',       'follow',         id, p, T(tenantId)),
  blockCreated:        (tenantId: string, id: string, p: any) => emit('network.block.created',        'block',          id, p, T(tenantId)),
  blockRemoved:        (tenantId: string, id: string, p: any) => emit('network.block.removed',        'block',          id, p, T(tenantId)),
  recommendationSent:  (tenantId: string, id: string, p: any) => emit('network.recommendation.sent',  'recommendation', id, p, T(tenantId)),
};

// ---- D9 Groups & Communities ----
export const D9Emit = {
  created:        (tenantId: string, id: string, p: any) => emit('group.created',         'group',         id, p, T(tenantId)),
  updated:        (tenantId: string, id: string, p: any) => emit('group.updated',         'group',         id, p, T(tenantId)),
  archived:       (tenantId: string, id: string, p: any) => emit('group.archived',        'group',         id, p, T(tenantId)),
  memberJoined:   (tenantId: string, id: string, p: any) => emit('group.member.joined',   'group-member',  id, p, T(tenantId)),
  memberLeft:     (tenantId: string, id: string, p: any) => emit('group.member.left',     'group-member',  id, p, T(tenantId)),
  memberInvited:  (tenantId: string, id: string, p: any) => emit('group.member.invited',  'group-invite',  id, p, T(tenantId)),
  memberBanned:   (tenantId: string, id: string, p: any) => emit('group.member.banned',   'group-member',  id, p, T(tenantId)),
  postCreated:    (tenantId: string, id: string, p: any) => emit('group.post.created',    'group-post',    id, p, T(tenantId)),
  postPinned:     (tenantId: string, id: string, p: any) => emit('group.post.pinned',     'group-post',    id, p, T(tenantId)),
  roleChanged:    (tenantId: string, id: string, p: any) => emit('group.role.changed',    'group-member',  id, p, T(tenantId)),
};

// ---- D10 Companies & Pages ----
export const D10Emit = {
  created:        (tenantId: string, id: string, p: any) => emit('company.created',         'company',          id, p, T(tenantId)),
  updated:        (tenantId: string, id: string, p: any) => emit('company.updated',         'company',          id, p, T(tenantId)),
  verified:       (tenantId: string, id: string, p: any) => emit('company.verified',        'company',          id, p, T(tenantId)),
  published:      (tenantId: string, id: string, p: any) => emit('company.published',       'company',          id, p, T(tenantId)),
  archived:       (tenantId: string, id: string, p: any) => emit('company.archived',        'company',          id, p, T(tenantId)),
  followerAdded:  (tenantId: string, id: string, p: any) => emit('company.follower.added',  'company-follower', id, p, T(tenantId)),
  followerRemoved:(tenantId: string, id: string, p: any) => emit('company.follower.removed','company-follower', id, p, T(tenantId)),
  teamAdded:      (tenantId: string, id: string, p: any) => emit('company.team.added',      'company-team',     id, p, T(tenantId)),
  teamRemoved:    (tenantId: string, id: string, p: any) => emit('company.team.removed',    'company-team',     id, p, T(tenantId)),
  reviewPosted:   (tenantId: string, id: string, p: any) => emit('company.review.posted',   'company-review',   id, p, T(tenantId)),
};

// ---- D11 Agency Workspace ----
export const D11Emit = {
  created:          (tenantId: string, id: string, p: any) => emit('agency.created',           'agency',            id, p, T(tenantId)),
  updated:          (tenantId: string, id: string, p: any) => emit('agency.updated',           'agency',            id, p, T(tenantId)),
  clientAdded:      (tenantId: string, id: string, p: any) => emit('agency.client.added',      'agency-client',     id, p, T(tenantId)),
  clientRemoved:    (tenantId: string, id: string, p: any) => emit('agency.client.removed',    'agency-client',     id, p, T(tenantId)),
  memberAdded:      (tenantId: string, id: string, p: any) => emit('agency.member.added',      'agency-member',     id, p, T(tenantId)),
  memberRemoved:    (tenantId: string, id: string, p: any) => emit('agency.member.removed',    'agency-member',     id, p, T(tenantId)),
  engagementOpened: (tenantId: string, id: string, p: any) => emit('agency.engagement.opened', 'agency-engagement', id, p, T(tenantId)),
  engagementClosed: (tenantId: string, id: string, p: any) => emit('agency.engagement.closed', 'agency-engagement', id, p, T(tenantId)),
  invoiceIssued:    (tenantId: string, id: string, p: any) => emit('agency.invoice.issued',    'agency-invoice',    id, p, T(tenantId)),
};

// ---- D12 Marketing & Campaigns ----
export const D12Emit = {
  campaignCreated:   (tenantId: string, id: string, p: any) => emit('marketing.campaign.created',   'campaign', id, p, T(tenantId)),
  campaignScheduled: (tenantId: string, id: string, p: any) => emit('marketing.campaign.scheduled', 'campaign', id, p, T(tenantId)),
  campaignLaunched:  (tenantId: string, id: string, p: any) => emit('marketing.campaign.launched',  'campaign', id, p, T(tenantId)),
  campaignPaused:    (tenantId: string, id: string, p: any) => emit('marketing.campaign.paused',    'campaign', id, p, T(tenantId)),
  campaignCompleted: (tenantId: string, id: string, p: any) => emit('marketing.campaign.completed', 'campaign', id, p, T(tenantId)),
  audienceCreated:   (tenantId: string, id: string, p: any) => emit('marketing.audience.created',   'audience', id, p, T(tenantId)),
  audienceUpdated:   (tenantId: string, id: string, p: any) => emit('marketing.audience.updated',   'audience', id, p, T(tenantId)),
  assetPublished:    (tenantId: string, id: string, p: any) => emit('marketing.asset.published',    'asset',    id, p, T(tenantId)),
  leadCaptured:      (tenantId: string, id: string, p: any) => emit('marketing.lead.captured',      'lead',     id, p, T(tenantId)),
  utmTracked:        (tenantId: string, id: string, p: any) => emit('marketing.utm.tracked',        'utm',      id, p, T(tenantId)),
};

// ---- D13 Inbox & Threaded Messaging ----
export const D13Emit = {
  threadCreated:        (tenantId: string, id: string, p: any) => emit('inbox.thread.created',              'thread',  id, p, T(tenantId)),
  threadArchived:       (tenantId: string, id: string, p: any) => emit('inbox.thread.archived',             'thread',  id, p, T(tenantId)),
  threadSnoozed:        (tenantId: string, id: string, p: any) => emit('inbox.thread.snoozed',              'thread',  id, p, T(tenantId)),
  threadBlocked:        (tenantId: string, id: string, p: any) => emit('inbox.thread.blocked',              'thread',  id, p, T(tenantId)),
  participantsAdded:    (tenantId: string, id: string, p: any) => emit('inbox.thread.participants.added',   'thread',  id, p, T(tenantId)),
  participantsRemoved:  (tenantId: string, id: string, p: any) => emit('inbox.thread.participants.removed', 'thread',  id, p, T(tenantId)),
  messageSent:          (tenantId: string, id: string, p: any) => emit('inbox.message.sent',                'message', id, p, T(tenantId)),
  messageDeleted:       (tenantId: string, id: string, p: any) => emit('inbox.message.deleted',             'message', id, p, T(tenantId)),
  messageRead:          (tenantId: string, id: string, p: any) => emit('inbox.message.read',                'message', id, p, T(tenantId)),
  contextLinked:        (tenantId: string, id: string, p: any) => emit('inbox.context.linked',              'thread',  id, p, T(tenantId)),
};

// ---- D14 Notifications & Activity ----
export const D14Emit = {
  created:            (tenantId: string, id: string, p: any) => emit('notification.created',             'notification',  id, p, T(tenantId)),
  read:               (tenantId: string, id: string, p: any) => emit('notification.read',                'notification',  id, p, T(tenantId)),
  dismissed:          (tenantId: string, id: string, p: any) => emit('notification.dismissed',           'notification',  id, p, T(tenantId)),
  prefUpserted:       (tenantId: string, id: string, p: any) => emit('notification.preference.upserted', 'preference',    id, p, T(tenantId)),
  deviceRegistered:   (tenantId: string, id: string, p: any) => emit('notification.device.registered',   'device',        id, p, T(tenantId)),
  deviceRevoked:      (tenantId: string, id: string, p: any) => emit('notification.device.revoked',      'device',        id, p, T(tenantId)),
  activityEmitted:    (tenantId: string, id: string, p: any) => emit('notification.activity.emitted',    'activity',      id, p, T(tenantId)),
  webhookCreated:     (tenantId: string, id: string, p: any) => emit('notification.webhook.created',     'webhook-sub',   id, p, T(tenantId)),
  webhookRevoked:     (tenantId: string, id: string, p: any) => emit('notification.webhook.revoked',     'webhook-sub',   id, p, T(tenantId)),
};

// ---- D15 Calls & Voice/Video Sessions ----
export const D15Emit = {
  created:        (tenantId: string, id: string, p: any) => emit('call.created',           'call',            id, p, T(tenantId)),
  updated:        (tenantId: string, id: string, p: any) => emit('call.updated',           'call',            id, p, T(tenantId)),
  rescheduled:    (tenantId: string, id: string, p: any) => emit('call.rescheduled',       'call',            id, p, T(tenantId)),
  cancelled:      (tenantId: string, id: string, p: any) => emit('call.cancelled',         'call',            id, p, T(tenantId)),
  completed:      (tenantId: string, id: string, p: any) => emit('call.completed',         'call',            id, p, T(tenantId)),
  presence:       (tenantId: string, id: string, p: any) => emit('call.presence.updated',  'presence',        id, p, T(tenantId)),
  windowUpserted: (tenantId: string, id: string, p: any) => emit('call.window.upserted',   'contact-window',  id, p, T(tenantId)),
  windowDeleted:  (tenantId: string, id: string, p: any) => emit('call.window.deleted',    'contact-window',  id, p, T(tenantId)),
};

// ---- D16 Calendar & Scheduling ----
export const D16Emit = {
  scheduled:    (tenantId: string, id: string, p: any) => emit('calendar.meeting.scheduled',   'meeting', id, p, T(tenantId)),
  rescheduled:  (tenantId: string, id: string, p: any) => emit('calendar.meeting.rescheduled', 'meeting', id, p, T(tenantId)),
  cancelled:    (tenantId: string, id: string, p: any) => emit('calendar.meeting.cancelled',   'meeting', id, p, T(tenantId)),
  inviteSent:   (tenantId: string, id: string, p: any) => emit('calendar.invite.sent',         'invite',  id, p, T(tenantId)),
  icsGenerated: (tenantId: string, id: string, p: any) => emit('calendar.ics.generated',       'ics',     id, p, T(tenantId)),
};

// ---- D17 Events, RSVPs & Sessions ----
export const D17Emit = {
  created:           (tenantId: string, id: string, p: any) => emit('event.created',            'event',     id, p, T(tenantId)),
  updated:           (tenantId: string, id: string, p: any) => emit('event.updated',            'event',     id, p, T(tenantId)),
  scheduled:         (tenantId: string, id: string, p: any) => emit('event.scheduled',          'event',     id, p, T(tenantId)),
  live:              (tenantId: string, id: string, p: any) => emit('event.live',               'event',     id, p, T(tenantId)),
  completed:         (tenantId: string, id: string, p: any) => emit('event.completed',          'event',     id, p, T(tenantId)),
  cancelled:         (tenantId: string, id: string, p: any) => emit('event.cancelled',          'event',     id, p, T(tenantId)),
  archived:          (tenantId: string, id: string, p: any) => emit('event.archived',           'event',     id, p, T(tenantId)),
  rsvpCreated:       (tenantId: string, id: string, p: any) => emit('event.rsvp.created',       'rsvp',      id, p, T(tenantId)),
  rsvpCancelled:     (tenantId: string, id: string, p: any) => emit('event.rsvp.cancelled',     'rsvp',      id, p, T(tenantId)),
  checkinRecorded:   (tenantId: string, id: string, p: any) => emit('event.checkin.recorded',   'checkin',   id, p, T(tenantId)),
  feedbackSubmitted: (tenantId: string, id: string, p: any) => emit('event.feedback.submitted', 'feedback',  id, p, T(tenantId)),
  speakerAdded:      (tenantId: string, id: string, p: any) => emit('event.speaker.added',      'speaker',   id, p, T(tenantId)),
  sessionAdded:      (tenantId: string, id: string, p: any) => emit('event.session.added',      'session',   id, p, T(tenantId)),
};

// ---- D18 Webinars & Live Streaming ----
export const D18Emit = {
  created:              (tenantId: string, id: string, p: any) => emit('webinar.created',               'webinar',      id, p, T(tenantId)),
  transitioned:         (tenantId: string, id: string, p: any) => emit('webinar.transitioned',          'webinar',      id, p, T(tenantId)),
  liveStarted:          (tenantId: string, id: string, p: any) => emit('webinar.live.started',          'webinar',      id, p, T(tenantId)),
  liveEnded:            (tenantId: string, id: string, p: any) => emit('webinar.live.ended',            'webinar',      id, p, T(tenantId)),
  registrationCreated:  (tenantId: string, id: string, p: any) => emit('webinar.registration.created',  'registration', id, p, T(tenantId)),
  purchaseCreated:      (tenantId: string, id: string, p: any) => emit('webinar.purchase.created',      'purchase',     id, p, T(tenantId)),
  purchaseConfirmed:    (tenantId: string, id: string, p: any) => emit('webinar.purchase.confirmed',    'purchase',     id, p, T(tenantId)),
  donationCaptured:     (tenantId: string, id: string, p: any) => emit('webinar.donation.captured',     'donation',     id, p, T(tenantId)),
  chatMessage:          (tenantId: string, id: string, p: any) => emit('webinar.chat.message',          'chat-message', id, p, T(tenantId)),
  replayPublished:      (tenantId: string, id: string, p: any) => emit('webinar.replay.published',      'replay',       id, p, T(tenantId)),
};

// ---- D19 Booking & Appointments ----
export const D19Emit = {
  linkCreated:           (tenantId: string, id: string, p: any) => emit('booking.link.created',   'booking-link', id, p, T(tenantId)),
  linkUpdated:           (tenantId: string, id: string, p: any) => emit('booking.link.updated',   'booking-link', id, p, T(tenantId)),
  linkArchived:          (tenantId: string, id: string, p: any) => emit('booking.link.archived',  'booking-link', id, p, T(tenantId)),
  appointmentCreated:    (tenantId: string, id: string, p: any) => emit('appointment.created',     'appointment', id, p, T(tenantId)),
  appointmentApproved:   (tenantId: string, id: string, p: any) => emit('appointment.approved',    'appointment', id, p, T(tenantId)),
  appointmentRejected:   (tenantId: string, id: string, p: any) => emit('appointment.rejected',    'appointment', id, p, T(tenantId)),
  appointmentRescheduled:(tenantId: string, id: string, p: any) => emit('appointment.rescheduled', 'appointment', id, p, T(tenantId)),
  appointmentCancelled:  (tenantId: string, id: string, p: any) => emit('appointment.cancelled',   'appointment', id, p, T(tenantId)),
  appointmentCompleted:  (tenantId: string, id: string, p: any) => emit('appointment.completed',   'appointment', id, p, T(tenantId)),
  appointmentNoShow:     (tenantId: string, id: string, p: any) => emit('appointment.no_show',     'appointment', id, p, T(tenantId)),
};

// ---- D20 Media Viewer & Galleries ----
export const D20Emit = {
  created:           (tenantId: string, id: string, p: any) => emit('media.created',     'media',      id, p, T(tenantId)),
  updated:           (tenantId: string, id: string, p: any) => emit('media.updated',     'media',      id, p, T(tenantId)),
  archived:          (tenantId: string, id: string, p: any) => emit('media.archived',    'media',      id, p, T(tenantId)),
  restored:          (tenantId: string, id: string, p: any) => emit('media.restored',    'media',      id, p, T(tenantId)),
  processing:        (tenantId: string, id: string, p: any) => emit('media.processing',  'media',      id, p, T(tenantId)),
  ready:             (tenantId: string, id: string, p: any) => emit('media.ready',       'media',      id, p, T(tenantId)),
  moderated:         (tenantId: string, id: string, p: any) => emit('media.moderated',   'media',      id, p, T(tenantId)),
  viewed:            (tenantId: string, id: string, p: any) => emit('media.viewed',      'media',      id, p, T(tenantId)),
  liked:             (tenantId: string, id: string, p: any) => emit('media.liked',       'media',      id, p, T(tenantId)),
  downloaded:        (tenantId: string, id: string, p: any) => emit('media.downloaded',  'media',      id, p, T(tenantId)),
  galleryCreated:    (tenantId: string, id: string, p: any) => emit('gallery.created',   'gallery',    id, p, T(tenantId)),
  galleryUpdated:    (tenantId: string, id: string, p: any) => emit('gallery.updated',   'gallery',    id, p, T(tenantId)),
  galleryDeleted:    (tenantId: string, id: string, p: any) => emit('gallery.deleted',   'gallery',    id, p, T(tenantId)),
  attachmentAdded:   (tenantId: string, id: string, p: any) => emit('attachment.added',  'attachment', id, p, T(tenantId)),
  attachmentRemoved: (tenantId: string, id: string, p: any) => emit('attachment.removed','attachment', id, p, T(tenantId)),
};

// ---- D21 Podcasts ----
export const D21Emit = {
  showCreated:    (tenantId: string, id: string, p: any) => emit('podcast.show.created',    'podcast.show',    id, p, T(tenantId)),
  showUpdated:    (tenantId: string, id: string, p: any) => emit('podcast.show.updated',    'podcast.show',    id, p, T(tenantId)),
  showStatus:     (tenantId: string, id: string, status: 'active'|'paused'|'archived', p: any) => emit(`podcast.show.${status}` as any, 'podcast.show', id, p, T(tenantId)),
  episodeCreated: (tenantId: string, id: string, p: any) => emit('podcast.episode.created', 'podcast.episode', id, p, T(tenantId)),
  episodeUpdated: (tenantId: string, id: string, p: any) => emit('podcast.episode.updated', 'podcast.episode', id, p, T(tenantId)),
  episodeStatus:  (tenantId: string, id: string, status: 'active'|'paused'|'archived'|'failed', p: any) => emit(`podcast.episode.${status}` as any, 'podcast.episode', id, p, T(tenantId)),
  episodePlayed:  (tenantId: string, id: string, p: any) => emit('podcast.episode.played',  'podcast.episode', id, p, T(tenantId)),
  episodeLiked:   (tenantId: string, id: string, p: any) => emit('podcast.episode.liked',   'podcast.episode', id, p, T(tenantId)),
  albumCreated:   (tenantId: string, id: string, p: any) => emit('podcast.album.created',   'podcast.album',   id, p, T(tenantId)),
  albumUpdated:   (tenantId: string, id: string, p: any) => emit('podcast.album.updated',   'podcast.album',   id, p, T(tenantId)),
  albumDeleted:   (tenantId: string, id: string, p: any) => emit('podcast.album.deleted',   'podcast.album',   id, p, T(tenantId)),
  subscribed:     (tenantId: string, id: string, p: any) => emit('podcast.subscribed',      'subscription',    id, p, T(tenantId)),
  unsubscribed:   (tenantId: string, id: string, p: any) => emit('podcast.unsubscribed',    'subscription',    id, p, T(tenantId)),
  recordingStarted:    (tenantId: string, id: string, p: any) => emit('podcast.recording.started',    'recording', id, p, T(tenantId)),
  recordingProcessing: (tenantId: string, id: string, p: any) => emit('podcast.recording.processing', 'recording', id, p, T(tenantId)),
  recordingReady:      (tenantId: string, id: string, p: any) => emit('podcast.recording.ready',      'recording', id, p, T(tenantId)),
  recordingFailed:     (tenantId: string, id: string, p: any) => emit('podcast.recording.failed',     'recording', id, p, T(tenantId)),
  purchasePending:     (tenantId: string, id: string, p: any) => emit('podcast.purchase.pending',  'podcast.purchase', id, p, T(tenantId)),
  purchasePaid:        (tenantId: string, id: string, p: any) => emit('podcast.purchase.paid',     'podcast.purchase', id, p, T(tenantId)),
  purchaseRefunded:    (tenantId: string, id: string, p: any) => emit('podcast.purchase.refunded', 'podcast.purchase', id, p, T(tenantId)),
};

// ---- D22 Search & Discovery ----
export const D22Emit = {
  executed:         (tenantId: string, id: string, p: any) => emit('search.executed',          'search-query', id, p, T(tenantId)),
  clickTracked:     (tenantId: string, id: string, p: any) => emit('search.click.tracked',     'search-click', id, p, T(tenantId)),
  savedCreated:     (tenantId: string, id: string, p: any) => emit('search.saved.created',     'saved-search', id, p, T(tenantId)),
  savedArchived:    (tenantId: string, id: string, p: any) => emit('search.saved.archived',    'saved-search', id, p, T(tenantId)),
  shortcutUpserted: (tenantId: string, id: string, p: any) => emit('search.shortcut.upserted', 'shortcut',     id, p, T(tenantId)),
  linkCreated:      (tenantId: string, id: string, p: any) => emit('search.link.created',      'cross-link',   id, p, T(tenantId)),
  documentUpserted: (tenantId: string, id: string, p: any) => emit('search.document.upserted', 'document',     id, p, T(tenantId)),
};

// ---- D23 Overlays & Workflows ----
export const D23Emit = {
  opened:            (tenantId: string, id: string, p: any) => emit('overlay.opened',             'overlay',  id, p, T(tenantId)),
  status:            (tenantId: string, id: string, status: 'dismissed'|'completed'|'expired'|'failed'|'escalated', p: any) => emit(`overlay.${status}` as any, 'overlay', id, p, T(tenantId)),
  workflowStarted:   (tenantId: string, id: string, p: any) => emit('overlay.workflow.started',   'workflow', id, p, T(tenantId)),
  workflowStep:      (tenantId: string, id: string, p: any) => emit('overlay.workflow.step',      'workflow', id, p, T(tenantId)),
  workflowCompleted: (tenantId: string, id: string, p: any) => emit('overlay.workflow.completed', 'workflow', id, p, T(tenantId)),
  windowDetached:    (tenantId: string, id: string, p: any) => emit('overlay.window.detached',    'window',   id, p, T(tenantId)),
  windowPinged:      (tenantId: string, id: string, p: any) => emit('overlay.window.pinged',      'window',   id, p, T(tenantId)),
  windowClosed:      (tenantId: string, id: string, p: any) => emit('overlay.window.closed',      'window',   id, p, T(tenantId)),
};

// ---- D24 Jobs Browse & Saved Searches ----
export const D24EmitJobsBrowse = {
  searchExecuted:     (tenantId: string, id: string, p: any) => emit('jobs-browse.search.executed',         'search-query', id, p, T(tenantId)),
  bookmarkToggled:    (tenantId: string, id: string, p: any) => emit('jobs-browse.bookmark.toggled',        'bookmark',     id, p, T(tenantId)),
  savedSearchUpserted:(tenantId: string, id: string, p: any) => emit('jobs-browse.saved-search.upserted',   'saved-search', id, p, T(tenantId)),
  savedSearchRemoved: (tenantId: string, id: string, p: any) => emit('jobs-browse.saved-search.removed',    'saved-search', id, p, T(tenantId)),
  matchNotified:      (tenantId: string, id: string, p: any) => emit('jobs-browse.match.notified',          'match',        id, p, T(tenantId)),
};

// =====================================================================
// Legacy D24–D29 → renumbered D25–D30. Aliases kept so existing imports
// (D24Emit/D25Emit/D26Emit/D29Emit currently used in services) continue
// to compile; new code should prefer D25Emit/D26Emit/D27Emit/D30Emit.
// =====================================================================

// ---- D25 Job Posting Studio ----
export const D25EmitJobPosting = {
  postingPublished: (tenantId: string, id: string, p: any) => emit('posting.published', 'posting',    id, p, T(tenantId)),
  postingPaused:    (tenantId: string, id: string, p: any) => emit('posting.paused',    'posting',    id, p, T(tenantId)),
  postingArchived:  (tenantId: string, id: string, p: any) => emit('posting.archived',  'posting',    id, p, T(tenantId)),
  creditsPurchased: (tenantId: string, id: string, p: any) => emit('credits.purchased', 'credits-tx', id, p, T(tenantId)),
  creditsConsumed:  (tenantId: string, id: string, p: any) => emit('credits.consumed',  'credits-tx', id, p, T(tenantId)),
};
export const D24Emit = D25EmitJobPosting; // legacy alias

// ---- D26 Job Application Flow ----
export const D26EmitApplications = {
  submitted: (tenantId: string, id: string, p: any) => emit('application.submitted', 'application', id, p, T(tenantId)),
  advanced:  (tenantId: string, id: string, p: any) => emit('application.advanced',  'application', id, p, T(tenantId)),
  rejected:  (tenantId: string, id: string, p: any) => emit('application.rejected',  'application', id, p, T(tenantId)),
  withdrawn: (tenantId: string, id: string, p: any) => emit('application.withdrawn', 'application', id, p, T(tenantId)),
};
export const D25Emit = D26EmitApplications; // legacy alias

// ---- D27 Recruiter Job Management ----
export const D27EmitRequisitions = {
  opened:   (tenantId: string, id: string, p: any) => emit('requisition.opened',   'requisition', id, p, T(tenantId)),
  approved: (tenantId: string, id: string, p: any) => emit('requisition.approved', 'requisition', id, p, T(tenantId)),
  closed:   (tenantId: string, id: string, p: any) => emit('requisition.closed',   'requisition', id, p, T(tenantId)),
};
export const D26Emit = D27EmitRequisitions; // legacy alias

// ---- D28 Talent Search & Navigator ----
export const D28EmitProspecting = {
  searchSaved:     (tenantId: string, id: string, p: any) => emit('search.saved',            'saved-search', id, p, T(tenantId)),
  prospectAdded:   (tenantId: string, id: string, p: any) => emit('prospect.added',          'prospect',     id, p, T(tenantId)),
  prospectStatus:  (tenantId: string, id: string, p: any) => emit('prospect.status.changed', 'prospect',     id, p, T(tenantId)),
  outreachSent:    (tenantId: string, id: string, p: any) => emit('outreach.sent',           'outreach',     id, p, T(tenantId)),
  outreachReplied: (tenantId: string, id: string, p: any) => emit('outreach.replied',        'outreach',     id, p, T(tenantId)),
};
export const D27Emit = D28EmitProspecting; // legacy alias

// ---- D29 Candidate Pipeline ----
export const D29EmitPipeline = {
  cardCreated: (tenantId: string, id: string, p: any) => emit('card.created',    'card', id, p, T(tenantId)),
  cardMoved:   (tenantId: string, id: string, p: any) => emit('card.moved',      'card', id, p, T(tenantId)),
  noteAdded:   (tenantId: string, id: string, p: any) => emit('card.note.added', 'card', id, p, T(tenantId)),
  mention:     (tenantId: string, id: string, p: any) => emit('card.mention',    'card', id, p, T(tenantId)),
};
export const D28Emit = D29EmitPipeline; // legacy alias

// ---- D30 Interview Planning ----
export const D30EmitInterviews = {
  ivCreated:      (tenantId: string, id: string, p: any) => emit('interview.created',      'interview',   id, p, T(tenantId)),
  ivTransitioned: (tenantId: string, id: string, p: any) => emit('interview.transitioned', 'interview',   id, p, T(tenantId)),
  ivRescheduled:  (tenantId: string, id: string, p: any) => emit('interview.rescheduled',  'interview',   id, p, T(tenantId)),
  ivResponded:    (tenantId: string, id: string, p: any) => emit('interviewer.responded',  'interview',   id, p, T(tenantId)),
  scDrafted:      (tenantId: string, id: string, p: any) => emit('scorecard.drafted',      'scorecard',   id, p, T(tenantId)),
  scSubmitted:    (tenantId: string, id: string, p: any) => emit('scorecard.submitted',    'scorecard',   id, p, T(tenantId)),
  scWithdrawn:    (tenantId: string, id: string, p: any) => emit('scorecard.withdrawn',    'scorecard',   id, p, T(tenantId)),
  calOpened:      (tenantId: string, id: string, p: any) => emit('calibration.opened',     'calibration', id, p, T(tenantId)),
  calDecided:     (tenantId: string, id: string, p: any) => emit('calibration.decided',    'calibration', id, p, T(tenantId)),
  panelCreated:   (tenantId: string, id: string, p: any) => emit('panel.created',          'panel',       id, p, T(tenantId)),
  panelUpdated:   (tenantId: string, id: string, p: any) => emit('panel.updated',          'panel',       id, p, T(tenantId)),
  panelStatus:    (tenantId: string, id: string, p: any) => emit('panel.status',           'panel',       id, p, T(tenantId)),
};
export const D29Emit = D30EmitInterviews; // legacy alias
