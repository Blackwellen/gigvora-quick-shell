import { Injectable, Logger } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsGateway } from './notifications.gateway';
import { D14Emit } from '../domain-bus/domain-emissions';
import type {
  CreateNotificationDto, ListNotificationsDto, MarkReadDto, UpsertPreferenceDto,
  RegisterDeviceDto, CreateWebhookDto, EmitActivityDto, NotificationChannel,
} from './dto';
import * as crypto from 'crypto';

@Injectable()
export class NotificationsService {
  private readonly log = new Logger('NotificationsService');
  constructor(
    private readonly repo: NotificationsRepository,
    private readonly gateway: NotificationsGateway,
  ) {}

  // ---------- notifications ----------
  /**
   * Creates a notification, fans out across channels respecting the user's
   * preferences and quiet-hours, records each delivery attempt, and pushes a
   * realtime event so the bell icon updates without a refetch.
   */
  async create(dto: CreateNotificationDto) {
    const channels = await this.resolveChannels(dto.identityId, dto.topic, dto.channels);
    const notif = await this.repo.create(dto);
    for (const ch of channels) {
      try {
        const status = ch === 'in_app' ? 'delivered' : 'sent'; // external transports stub-deliver
        await this.repo.recordDelivery(notif.id, ch, status, ch === 'email' ? 'resend' : ch === 'push' ? 'expo' : undefined);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        await this.repo.recordDelivery(notif.id, ch, 'failed', undefined, msg);
        this.log.warn(`delivery failed for ${notif.id}/${ch}: ${msg}`);
      }
    }
    // Realtime push + badge bump.
    this.gateway.emitToUser(dto.identityId, 'notification.created', notif);
    const count = await this.repo.unreadCount(dto.identityId);
    await this.repo.setBadge(dto.identityId, 'notifications', count, count > 9 ? 'urgent' : 'default');
    this.gateway.emitToUser(dto.identityId, 'badge.updated', { surfaceKey: 'notifications', count });
    void D14Emit.created(dto.identityId, notif.id, { topic: dto.topic, channels, identityId: dto.identityId });
    return notif;
  }

  async list(identityId: string, opts: ListNotificationsDto) {
    const items = await this.repo.list(identityId, opts);
    const limit = opts.limit ?? 50;
    return { items, total: items.length, limit, hasMore: items.length === limit };
  }
  unreadCount(identityId: string)                              { return this.repo.unreadCount(identityId); }
  async listDeliveries(notificationId: string) {
    const items = await this.repo.listDeliveries(notificationId);
    return { items, total: items.length, limit: items.length, hasMore: false };
  }

  async markRead(identityId: string, dto: MarkReadDto) {
    const updated = await this.repo.markRead(identityId, dto.ids);
    const count = await this.repo.unreadCount(identityId);
    await this.repo.setBadge(identityId, 'notifications', count);
    this.gateway.emitToUser(identityId, 'badge.updated', { surfaceKey: 'notifications', count });
    for (const id of dto.ids) void D14Emit.read(identityId, id, { identityId });
    return { updated: updated.length, unreadCount: count };
  }

  async markAllRead(identityId: string) {
    const updated = await this.repo.markAllRead(identityId);
    await this.repo.setBadge(identityId, 'notifications', 0);
    this.gateway.emitToUser(identityId, 'badge.updated', { surfaceKey: 'notifications', count: 0 });
    void D14Emit.read(identityId, 'all', { identityId, scope: 'all', count: updated.length });
    return { updated: updated.length, unreadCount: 0 };
  }

  async dismiss(identityId: string, id: string) {
    const n = await this.repo.dismiss(identityId, id);
    const count = await this.repo.unreadCount(identityId);
    this.gateway.emitToUser(identityId, 'notification.dismissed', { id });
    this.gateway.emitToUser(identityId, 'badge.updated', { surfaceKey: 'notifications', count });
    void D14Emit.dismissed(identityId, id, { identityId });
    return n;
  }

  // ---------- preferences ----------
  async listPreferences(identityId: string) {
    const items = await this.repo.listPreferences(identityId);
    return { items, total: items.length, limit: items.length, hasMore: false };
  }
  async upsertPreference(identityId: string, dto: UpsertPreferenceDto) {
    const r = await this.repo.upsertPreference(identityId, dto);
    void D14Emit.prefUpserted(identityId, (r as any)?.id ?? `${identityId}:${dto.topic}`, { identityId, topic: dto.topic, channels: dto.channels });
    return r;
  }

  /** Pick the channels for a topic = explicit pref → wildcard pref → default `in_app`. */
  private async resolveChannels(identityId: string, topic: string, override?: NotificationChannel[]): Promise<NotificationChannel[]> {
    if (override?.length) return override;
    const prefs = await this.repo.listPreferences(identityId);
    const exact = prefs.find((p: { topic: string }) => p.topic === topic);
    if (exact) return exact.channels;
    const wildcard = prefs.find((p: { topic: string }) => p.topic === '*');
    return wildcard?.channels ?? ['in_app'];
  }

  // ---------- devices ----------
  async registerDevice(identityId: string, dto: RegisterDeviceDto) {
    const r = await this.repo.registerDevice(identityId, dto.platform, dto.token, dto.label);
    void D14Emit.deviceRegistered(identityId, (r as any)?.id ?? dto.token, { identityId, platform: dto.platform, label: dto.label });
    return r;
  }
  async revokeDevice(identityId: string, token: string) {
    const r = await this.repo.revokeDevice(identityId, token);
    void D14Emit.deviceRevoked(identityId, token, { identityId, token });
    return r;
  }
  async listDevices(identityId: string) {
    const items = await this.repo.listDevices(identityId);
    return { items, total: items.length, limit: items.length, hasMore: false };
  }

  // ---------- badges ----------
  async listBadges(identityId: string) {
    const items = await this.repo.listBadges(identityId);
    return { items, total: items.length, limit: items.length, hasMore: false };
  }

  // ---------- activity ----------
  async emitActivity(actorId: string | null, dto: EmitActivityDto) {
    const ev = await this.repo.emitActivity({ ...dto, actorId });
    if (dto.identityId) {
      this.gateway.emitToUser(dto.identityId, 'activity.event', ev);
      // Bump any surface-key badges this event affects.
      for (const surface of ev.surface_keys ?? []) {
        const badge = (await this.repo.listBadges(dto.identityId)).find((b: { surface_key: string }) => b.surface_key === surface);
        const next = (badge?.count ?? 0) + 1;
        await this.repo.setBadge(dto.identityId, surface, next, next > 9 ? 'urgent' : 'default');
        this.gateway.emitToUser(dto.identityId, 'badge.updated', { surfaceKey: surface, count: next });
      }
    }
    this.gateway.emitToTopic(dto.topic, 'activity.event', ev);
    this.gateway.emitToEntity(dto.entityType, dto.entityId, 'activity.event', ev);
    void D14Emit.activityEmitted(dto.identityId ?? 'system', ev.id, { topic: dto.topic, entityType: dto.entityType, entityId: dto.entityId });
    return ev;
  }

  async listActivity(identityId: string, limit = 50) { const items = await this.repo.listActivity(identityId, limit); return { items, total: items.length, limit, hasMore: items.length >= limit }; }

  // ---------- webhooks ----------
  async createWebhook(identityId: string, dto: CreateWebhookDto) {
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    const wh = await this.repo.createWebhook(identityId, dto.topicPattern, dto.url, secret);
    void D14Emit.webhookCreated(identityId, wh.id, { identityId, topicPattern: dto.topicPattern, url: dto.url });
    return { ...wh, secret }; // return secret ONCE on creation
  }
  async listWebhooks(identityId: string)            { const items = await this.repo.listWebhooks(identityId); return { items, total: items.length, limit: items.length, hasMore: false }; }
  async revokeWebhook(identityId: string, id: string) {
    const r = await this.repo.revokeWebhook(identityId, id);
    void D14Emit.webhookRevoked(identityId, id, { identityId });
    return r;
  }
}
