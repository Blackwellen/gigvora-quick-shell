import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import IORedis from 'ioredis';

const FANOUT_CHANNEL = 'realtime:fanout';

/**
 * Real-time delivery for in-app notifications, badge updates, and activity
 * stream. Each authenticated socket joins:
 *   - `user:{identityId}` for personal notifications/badges
 *   - `topic:{topic}` for global broadcast (status, maintenance)
 *   - `entity:{type}:{id}` for granular co-edit / co-view updates
 *
 * FD-14: also subscribes to Redis channel `realtime:fanout` so worker
 * processes can fan events back to the right rooms without holding a
 * Socket.IO connection themselves.
 */
@WebSocketGateway({ namespace: '/realtime', cors: { origin: true, credentials: true } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer() server!: Server;
  private readonly log = new Logger('RealtimeGateway');
  private sub?: IORedis;

  afterInit() {
    try {
      this.sub = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', { maxRetriesPerRequest: null });
      this.sub.subscribe(FANOUT_CHANNEL).catch((err) => this.log.warn(`fanout subscribe failed: ${err?.message}`));
      this.sub.on('message', (_chan, raw) => {
        try {
          const msg = JSON.parse(raw);
          if (msg.kind === 'counter.update') {
            const ev = 'counter.update';
            const payload = { key: msg.key, value: msg.value, ts: Date.now() };
            if (msg.scope === 'user')      this.emitToUser(msg.scopeId, ev, payload);
            else if (msg.scope === 'org')  this.emitToTopic(`org:${msg.scopeId}`, ev, payload);
            else                           this.emitToTopic('global', ev, payload);
          } else if (msg.kind === 'event') {
            if (msg.scope === 'user')      this.emitToUser(msg.scopeId, msg.event, msg.payload);
            else if (msg.scope === 'org')  this.emitToTopic(`org:${msg.scopeId}`, msg.event, msg.payload);
            else                           this.emitToTopic('global', msg.event, msg.payload);
          }
        } catch (err) { this.log.warn(`fanout parse failed: ${(err as Error).message}`); }
      });
    } catch (err) { this.log.warn(`fanout init skipped: ${(err as Error).message}`); }
  }

  handleConnection(client: Socket) {
    const identityId = (client.handshake.auth?.identityId
      ?? client.handshake.query?.identityId
      ?? '') as string;
    if (identityId) {
      client.join(`user:${identityId}`);
      client.data.identityId = identityId;
      this.log.log(`socket ${client.id} → user:${identityId}`);
    }
    client.join('topic:global');
    client.emit('hello', { socketId: client.id, ts: Date.now() });
  }

  handleDisconnect(client: Socket) {
    this.log.log(`socket ${client.id} disconnected`);
  }

  @SubscribeMessage('subscribe.topic')
  onSubscribeTopic(@ConnectedSocket() client: Socket, @MessageBody() data: { topic: string }) {
    if (!data?.topic) return { ok: false };
    client.join(`topic:${data.topic}`);
    return { ok: true };
  }

  @SubscribeMessage('unsubscribe.topic')
  onUnsubscribeTopic(@ConnectedSocket() client: Socket, @MessageBody() data: { topic: string }) {
    if (!data?.topic) return { ok: false };
    client.leave(`topic:${data.topic}`);
    return { ok: true };
  }

  @SubscribeMessage('subscribe.entity')
  onSubscribeEntity(@ConnectedSocket() client: Socket, @MessageBody() data: { entityType: string; entityId: string }) {
    if (!data?.entityType || !data?.entityId) return { ok: false };
    client.join(`entity:${data.entityType}:${data.entityId}`);
    return { ok: true };
  }

  /** Server-side broadcast helpers, used by NotificationsService + RealtimeBroker. */
  emitToUser(identityId: string, event: string, payload: unknown)        { this.server?.to(`user:${identityId}`).emit(event, payload); }
  emitToTopic(topic: string, event: string, payload: unknown)            { this.server?.to(`topic:${topic}`).emit(event, payload); }
  emitToEntity(type: string, id: string, event: string, payload: unknown){ this.server?.to(`entity:${type}:${id}`).emit(event, payload); }

  presenceCount(identityId: string): number {
    const room = this.server?.sockets?.adapter?.rooms?.get(`user:${identityId}`);
    return room?.size ?? 0;
  }
}
