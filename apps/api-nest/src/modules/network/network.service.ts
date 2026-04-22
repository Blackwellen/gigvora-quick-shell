import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NetworkRepository } from './network.repository';
import { AuditService } from '../workspace/audit.service';
import { D8Emit } from '../domain-bus/domain-emissions';
import type { CreateRequestDto, RespondRequestDto, SuggestionsQueryDto } from './dto';

/**
 * Service-level rules:
 *   • cannot send a request to yourself
 *   • cannot send a request to someone you've blocked or who has blocked you
 *   • cannot re-send while a pending request already exists in either direction
 *   • on accept → materialise canonical connection + recompute degree caches
 *     for both sides (bounded to 2°)
 *   • on remove/block → recompute caches for both sides
 *   • every state change is audited
 */
@Injectable()
export class NetworkService {
  constructor(
    private readonly repo: NetworkRepository,
    private readonly audit: AuditService,
  ) {}

  // ---------- requests ----------
  async send(requesterId: string, dto: CreateRequestDto) {
    if (requesterId === dto.recipientId) throw new BadRequestException('cannot connect to yourself');
    const blocks = await this.repo.listBlocks(requesterId);
    if (blocks.some((b: any) => b.blocked_id === dto.recipientId)) {
      throw new ForbiddenException('recipient is blocked');
    }
    const row = await this.repo.createRequest(requesterId, dto.recipientId, dto.message);
    if (!row) throw new BadRequestException('a pending request already exists');
    await this.audit.record({
      actorId: requesterId, domain: 'network', action: 'network.request.send',
      targetType: 'identity', targetId: dto.recipientId, meta: { requestId: row.id },
    });
    void D8Emit.connectionRequested(requesterId, row.id, { requesterId, recipientId: dto.recipientId });
    return row;
  }

  async respond(recipientId: string, id: string, dto: RespondRequestDto) {
    const row = await this.repo.respond(recipientId, id, dto.decision);
    if (!row) throw new NotFoundException('request not found or not actionable');
    if (dto.decision === 'accept') {
      await Promise.all([
        this.repo.recomputeEdges(row.requester_id),
        this.repo.recomputeEdges(row.recipient_id),
      ]);
    }
    await this.audit.record({
      actorId: recipientId, domain: 'network',
      action: dto.decision === 'accept' ? 'network.request.accept' : 'network.request.decline',
      targetType: 'connection_request', targetId: id,
      meta: { requesterId: row.requester_id },
    });
    if (dto.decision === 'accept') {
      void D8Emit.connectionAccepted(recipientId, id, { requesterId: row.requester_id, recipientId });
    } else {
      void D8Emit.connectionDeclined(recipientId, id, { requesterId: row.requester_id, recipientId });
    }
    return row;
  }

  async withdraw(requesterId: string, id: string) {
    const row = await this.repo.withdraw(requesterId, id);
    if (!row) throw new NotFoundException('request not found or not pending');
    await this.audit.record({
      actorId: requesterId, domain: 'network', action: 'network.request.withdraw',
      targetType: 'connection_request', targetId: id,
    });
    void D8Emit.connectionRemoved(requesterId, id, { reason: 'withdraw' });
    return row;
  }

  async incoming(userId: string, status?: string, limit?: number) {
    const items = await this.repo.listIncoming(userId, status, limit);
    return { items, total: items.length, limit: limit ?? 20, hasMore: items.length === (limit ?? 20) };
  }
  async outgoing(userId: string, status?: string, limit?: number) {
    const items = await this.repo.listOutgoing(userId, status, limit);
    return { items, total: items.length, limit: limit ?? 20, hasMore: items.length === (limit ?? 20) };
  }

  // ---------- connections ----------
  async remove(viewerId: string, otherId: string) {
    const removed = await this.repo.removeConnection(viewerId, otherId);
    if (removed.length) {
      await Promise.all([this.repo.recomputeEdges(viewerId), this.repo.recomputeEdges(otherId)]);
      await this.audit.record({
        actorId: viewerId, domain: 'network', action: 'network.connection.remove',
        targetType: 'identity', targetId: otherId,
      });
      void D8Emit.connectionRemoved(viewerId, otherId, { viewerId, otherId });
    }
    return { removed: removed.length > 0 };
  }
  async list(viewerId: string, limit?: number) {
    const items = await this.repo.connectionsOf(viewerId, limit);
    return { items, total: items.length, limit: limit ?? 100, hasMore: items.length === (limit ?? 100) };
  }
  count(viewerId: string)                 { return this.repo.countConnections(viewerId); }

  // ---------- blocks ----------
  async block(blockerId: string, blockedId: string, reason?: string) {
    if (blockerId === blockedId) throw new BadRequestException('cannot block yourself');
    await this.repo.block(blockerId, blockedId, reason);
    await this.repo.removeConnection(blockerId, blockedId);
    await Promise.all([this.repo.recomputeEdges(blockerId), this.repo.recomputeEdges(blockedId)]);
    await this.audit.record({
      actorId: blockerId, domain: 'network', action: 'network.block',
      targetType: 'identity', targetId: blockedId, meta: { reason: reason ?? null },
    });
    void D8Emit.blockCreated(blockerId, blockedId, { blockerId, blockedId, reason: reason ?? null });
    return { ok: true };
  }
  async unblock(blockerId: string, blockedId: string) {
    const r = await this.repo.unblock(blockerId, blockedId);
    await this.audit.record({
      actorId: blockerId, domain: 'network', action: 'network.unblock',
      targetType: 'identity', targetId: blockedId,
    });
    void D8Emit.blockRemoved(blockerId, blockedId, { blockerId, blockedId });
    return r;
  }
  async blocks(blockerId: string)                { const items = await this.repo.listBlocks(blockerId); return { items, total: items.length, limit: items.length, hasMore: false }; }

  // ---------- degree / mutual / suggestions ----------
  async degree(viewerId: string, targetId: string) {
    if (viewerId === targetId) return { degree: 0, mutual_count: 0 };
    return (await this.repo.degree(viewerId, targetId)) ?? { degree: null, mutual_count: 0 };
  }
  mutuals(viewerId: string, targetId: string, limit?: number) { return this.repo.mutuals(viewerId, targetId, limit); }
  async suggestions(viewerId: string, q: SuggestionsQueryDto) {
    const items = await this.repo.suggestions(viewerId, q.maxDegree ?? 2, q.limit ?? 12);
    return { items, total: items.length, limit: q.limit ?? 12, hasMore: false };
  }

  /** Manual override (admin / GDPR refresh). */
  async recompute(viewerId: string) {
    await this.repo.recomputeEdges(viewerId);
    await this.audit.record({
      actorId: viewerId, domain: 'network', action: 'network.recompute',
      targetType: 'identity', targetId: viewerId,
    });
    return { ok: true };
  }
}
