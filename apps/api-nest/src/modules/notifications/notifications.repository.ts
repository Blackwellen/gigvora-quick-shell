import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { CreateNotificationDto, ListNotificationsDto, NotificationChannel } from './dto';

/**
 * Hot-path queries for the bell icon, the activity feed, the delivery-log
 * operator console, and badge counters. Every query is bounded and indexed.
 */
@Injectable()
export class NotificationsRepository {
  constructor(private readonly ds: DataSource) {}

  // ---------- notifications ----------
  create(dto: CreateNotificationDto) {
    return this.ds.query(
      `INSERT INTO notifications
         (identity_id, topic, title, body, priority, entity_type, entity_id,
          action_url, category, group_key, data, status)
       VALUES ($1,$2,$3,$4,COALESCE($5,'normal')::notification_priority,
               $6,$7,$8,$9,$10,COALESCE($11::jsonb,'{}'::jsonb),'sent'::notification_status)
       RETURNING *`,
      [dto.identityId, dto.topic, dto.title, dto.body ?? null, dto.priority ?? null,
       dto.entityType ?? null, dto.entityId ?? null, dto.actionUrl ?? null,
       dto.category ?? null, dto.groupKey ?? null,
       dto.data ? JSON.stringify(dto.data) : null],
    ).then(r => r[0]);
  }

  list(identityId: string, opts: ListNotificationsDto) {
    const limit = Math.min(opts.limit ?? 50, 200);
    const where = [`identity_id = $1`];
    const args: unknown[] = [identityId];
    if (opts.unreadOnly) where.push(`read_at IS NULL AND dismissed_at IS NULL`);
    if (opts.topic)  { args.push(opts.topic);  where.push(`topic = $${args.length}`); }
    if (opts.status) { args.push(opts.status); where.push(`status = $${args.length}::notification_status`); }
    if (opts.cursor) { args.push(opts.cursor); where.push(`created_at < $${args.length}::timestamptz`); }
    args.push(limit);
    return this.ds.query(
      `SELECT * FROM notifications WHERE ${where.join(' AND ')}
        ORDER BY created_at DESC LIMIT $${args.length}`,
      args,
    );
  }

  unreadCount(identityId: string) {
    return this.ds.query(
      `SELECT count(*)::int AS c FROM notifications
        WHERE identity_id = $1 AND read_at IS NULL AND dismissed_at IS NULL`,
      [identityId],
    ).then(r => r[0]?.c ?? 0);
  }

  markRead(identityId: string, ids: string[]) {
    return this.ds.query(
      `UPDATE notifications SET read_at = now(), status = 'read'::notification_status
        WHERE identity_id = $1 AND id = ANY($2::uuid[]) AND read_at IS NULL
        RETURNING id`,
      [identityId, ids],
    );
  }

  markAllRead(identityId: string) {
    return this.ds.query(
      `UPDATE notifications SET read_at = now(), status = 'read'::notification_status
        WHERE identity_id = $1 AND read_at IS NULL RETURNING id`,
      [identityId],
    );
  }

  dismiss(identityId: string, id: string) {
    return this.ds.query(
      `UPDATE notifications SET dismissed_at = now(), status = 'dismissed'::notification_status
        WHERE identity_id = $1 AND id = $2 RETURNING *`,
      [identityId, id],
    ).then(r => r[0]);
  }

  // ---------- deliveries ----------
  recordDelivery(notificationId: string, channel: NotificationChannel, status: string, provider?: string, error?: string) {
    return this.ds.query(
      `INSERT INTO notification_deliveries
         (notification_id, channel, status, provider, attempts, last_attempt_at, delivered_at, error)
       VALUES ($1,$2::notification_channel,$3::delivery_status,$4,1,now(),
               CASE WHEN $3 = 'delivered' THEN now() ELSE NULL END, $5)
       RETURNING *`,
      [notificationId, channel, status, provider ?? null, error ?? null],
    ).then(r => r[0]);
  }

  listDeliveries(notificationId: string) {
    return this.ds.query(
      `SELECT * FROM notification_deliveries WHERE notification_id = $1 ORDER BY last_attempt_at DESC`,
      [notificationId],
    );
  }

  // ---------- preferences ----------
  listPreferences(identityId: string) {
    return this.ds.query(
      `SELECT * FROM notification_preferences WHERE identity_id = $1 ORDER BY topic`,
      [identityId],
    );
  }

  upsertPreference(identityId: string, p: { topic: string; channels: NotificationChannel[]; digest?: string; quietHours?: Record<string, unknown> }) {
    return this.ds.query(
      `INSERT INTO notification_preferences (identity_id, topic, channels, digest, quiet_hours, updated_at)
       VALUES ($1,$2,$3::notification_channel[], COALESCE($4,'realtime'),
               COALESCE($5::jsonb,'{}'::jsonb), now())
       ON CONFLICT (identity_id, topic) DO UPDATE SET
         channels   = EXCLUDED.channels,
         digest     = EXCLUDED.digest,
         quiet_hours= EXCLUDED.quiet_hours,
         updated_at = now()
       RETURNING *`,
      [identityId, p.topic, p.channels, p.digest ?? null,
       p.quietHours ? JSON.stringify(p.quietHours) : null],
    ).then(r => r[0]);
  }

  // ---------- devices ----------
  registerDevice(identityId: string, platform: string, token: string, label?: string) {
    return this.ds.query(
      `INSERT INTO device_tokens (identity_id, platform, token, label, last_seen_at)
       VALUES ($1,$2,$3,$4, now())
       ON CONFLICT (identity_id, token) DO UPDATE SET
         platform = EXCLUDED.platform, label = EXCLUDED.label,
         last_seen_at = now(), revoked_at = NULL
       RETURNING *`,
      [identityId, platform, token, label ?? null],
    ).then(r => r[0]);
  }

  revokeDevice(identityId: string, token: string) {
    return this.ds.query(
      `UPDATE device_tokens SET revoked_at = now() WHERE identity_id = $1 AND token = $2 RETURNING *`,
      [identityId, token],
    ).then(r => r[0]);
  }

  listDevices(identityId: string) {
    return this.ds.query(
      `SELECT * FROM device_tokens WHERE identity_id = $1 AND revoked_at IS NULL ORDER BY last_seen_at DESC`,
      [identityId],
    );
  }

  // ---------- badges ----------
  listBadges(identityId: string) {
    return this.ds.query(
      `SELECT * FROM badge_counters WHERE identity_id = $1 ORDER BY surface_key`,
      [identityId],
    );
  }

  setBadge(identityId: string, surfaceKey: string, count: number, variant = 'default') {
    return this.ds.query(
      `INSERT INTO badge_counters (identity_id, surface_key, count, variant, updated_at)
       VALUES ($1,$2,$3,$4, now())
       ON CONFLICT (identity_id, surface_key) DO UPDATE SET
         count = EXCLUDED.count, variant = EXCLUDED.variant, updated_at = now()
       RETURNING *`,
      [identityId, surfaceKey, count, variant],
    ).then(r => r[0]);
  }

  // ---------- activity ----------
  emitActivity(row: { actorId?: string | null; identityId?: string | null; topic: string; verb: string; entityType: string; entityId: string; surfaceKeys?: string[]; data?: Record<string, unknown> }) {
    return this.ds.query(
      `INSERT INTO activity_events (actor_id, identity_id, topic, verb, entity_type, entity_id, surface_keys, data)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,'{}'::text[]), COALESCE($8::jsonb,'{}'::jsonb))
       RETURNING *`,
      [row.actorId ?? null, row.identityId ?? null, row.topic, row.verb,
       row.entityType, row.entityId, row.surfaceKeys ?? null,
       row.data ? JSON.stringify(row.data) : null],
    ).then(r => r[0]);
  }

  listActivity(identityId: string, limit = 50) {
    return this.ds.query(
      `SELECT * FROM activity_events
        WHERE identity_id = $1 OR identity_id IS NULL
        ORDER BY occurred_at DESC LIMIT $2`,
      [identityId, Math.min(limit, 200)],
    );
  }

  // ---------- webhooks ----------
  createWebhook(identityId: string, topicPattern: string, url: string, secret: string) {
    return this.ds.query(
      `INSERT INTO webhook_subscriptions (identity_id, topic_pattern, url, secret)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [identityId, topicPattern, url, secret],
    ).then(r => r[0]);
  }

  listWebhooks(identityId: string) {
    return this.ds.query(
      `SELECT id, identity_id, topic_pattern, url, active, created_at, last_delivered_at, failure_count
         FROM webhook_subscriptions WHERE identity_id = $1 ORDER BY created_at DESC`,
      [identityId],
    );
  }

  revokeWebhook(identityId: string, id: string) {
    return this.ds.query(
      `UPDATE webhook_subscriptions SET active = false WHERE id = $1 AND identity_id = $2 RETURNING id`,
      [id, identityId],
    );
  }
}
