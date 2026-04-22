import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InboxRepository } from './inbox.repository';
import { InboxAnalyticsService } from './inbox.analytics.service';
import { AuditService } from '../workspace/audit.service';
import { D13Emit } from '../domain-bus/domain-emissions';

/**
 * Domain 17 — Inbox, Messaging & Context-Aware Threads.
 *
 * Lifecycle (threads):  active → snoozed → archived ; blocked is one-way terminal.
 * Lifecycle (messages): sent → delivered → read ; failed is terminal sad path.
 *
 * RBAC at this layer:
 *   • A user may only read/write a thread if they're a participant.
 *   • A message author may edit/delete their own message.
 *   • Mute/state/priority changes are scoped to the calling participant.
 *   • Adding participants is allowed for any current participant (for direct
 *     conversion → group); production should restrict to owners.
 *
 * Audit hooks fire on: thread.create / message.send / state change / dispute-
 * adjacent transitions, so the workspace audit log captures conversational
 * context handoffs to projects, orders, and gigs.
 */
@Injectable()
export class InboxService {
  constructor(
    private readonly repo: InboxRepository,
    private readonly analytics: InboxAnalyticsService,
    private readonly audit: AuditService,
  ) {}

  // ---------- threads ----------
  listThreads(viewerId: string, q: any) { return this.repo.listThreads(viewerId, q); }
  async getThread(id: string, viewerId: string) {
    const t = await this.repo.getThread(id, viewerId);
    if (!t) throw new NotFoundException('thread_not_found_or_forbidden');
    return t;
  }
  async createThread(creatorId: string, dto: any) {
    const t = await this.repo.createThread(creatorId, dto);
    if (dto.initialMessage) {
      await this.repo.sendMessage(t.id, creatorId, { body: dto.initialMessage, kind: 'text' });
    }
    await this.audit.record({
      actorId: creatorId, domain: 'inbox', action: 'thread.create', targetType: 'thread', targetId: t.id,
      meta: { kind: t.kind, participants: dto.participantIds.length, contextKind: dto.contextKind, contextId: dto.contextId },
    });
    void D13Emit.threadCreated(creatorId, t.id, { kind: t.kind, participantIds: dto.participantIds, contextKind: dto.contextKind, contextId: dto.contextId });
    return t;
  }
  async setThreadState(id: string, viewerId: string, state: any) {
    const t = await this.repo.setThreadState(id, viewerId, state);
    if (!t) throw new NotFoundException('thread_not_found_or_forbidden');
    await this.audit.record({ actorId: viewerId, domain: 'inbox', action: `thread.state.${state}`, targetType: 'thread', targetId: id });
    if (state === 'archived') void D13Emit.threadArchived(viewerId, id, { state });
    else if (state === 'snoozed') void D13Emit.threadSnoozed(viewerId, id, { state });
    else if (state === 'blocked') void D13Emit.threadBlocked(viewerId, id, { state });
    return t;
  }
  async setThreadPriority(id: string, viewerId: string, priority: any) {
    const t = await this.repo.setThreadPriority(id, viewerId, priority);
    if (!t) throw new NotFoundException('thread_not_found_or_forbidden');
    return t;
  }

  // ---------- participants ----------
  async addParticipants(threadId: string, actorId: string, participantIds: string[], role: any) {
    if (!this.repo.isParticipant(threadId, actorId)) throw new ForbiddenException('not_participant');
    const list = await this.repo.addParticipants(threadId, participantIds, role);
    await this.audit.record({ actorId, domain: 'inbox', action: 'thread.participants.add', targetType: 'thread', targetId: threadId, meta: { added: participantIds } });
    void D13Emit.participantsAdded(actorId, threadId, { added: participantIds, role });
    return list;
  }
  async removeParticipant(threadId: string, actorId: string, userId: string) {
    if (!this.repo.isParticipant(threadId, actorId)) throw new ForbiddenException('not_participant');
    const list = await this.repo.removeParticipant(threadId, userId);
    await this.audit.record({ actorId, domain: 'inbox', action: 'thread.participants.remove', targetType: 'thread', targetId: threadId, meta: { removed: userId } });
    void D13Emit.participantsRemoved(actorId, threadId, { removed: userId });
    return list;
  }
  setMute(threadId: string, userId: string, muted: boolean) {
    if (!this.repo.isParticipant(threadId, userId)) throw new ForbiddenException('not_participant');
    return this.repo.setMute(threadId, userId, muted);
  }

  // ---------- messages ----------
  async listMessages(threadId: string, viewerId: string, q: any) {
    const r = await this.repo.listMessages(threadId, viewerId, q);
    if (!r) throw new ForbiddenException('not_participant');
    return r;
  }
  async sendMessage(threadId: string, authorId: string, dto: any) {
    const m = await this.repo.sendMessage(threadId, authorId, dto);
    if (!m) throw new ForbiddenException('not_participant');
    await this.audit.record({
      actorId: authorId, domain: 'inbox', action: 'message.send', targetType: 'message', targetId: m.id,
      meta: { threadId, kind: m.kind, attachments: m.attachments.length },
    });
    void D13Emit.messageSent(authorId, m.id, { threadId, kind: m.kind, authorId });
    return m;
  }
  async editMessage(threadId: string, messageId: string, authorId: string, body: string) {
    const r = await this.repo.editMessage(threadId, messageId, authorId, body);
    if (r === 'forbidden') throw new ForbiddenException('not_author');
    if (!r) throw new NotFoundException('message_not_found');
    return r;
  }
  async deleteMessage(threadId: string, messageId: string, authorId: string) {
    const r = await this.repo.deleteMessage(threadId, messageId, authorId);
    if (r === 'forbidden') throw new ForbiddenException('not_author');
    if (!r) throw new NotFoundException('message_not_found');
    await this.audit.record({ actorId: authorId, domain: 'inbox', action: 'message.delete', targetType: 'message', targetId: messageId });
    void D13Emit.messageDeleted(authorId, messageId, { threadId });
    return r;
  }
  async react(threadId: string, messageId: string, userId: string, emoji: string) {
    if (!this.repo.isParticipant(threadId, userId)) throw new ForbiddenException('not_participant');
    const m = await this.repo.react(threadId, messageId, userId, emoji);
    if (!m) throw new NotFoundException('message_not_found');
    return m;
  }

  // ---------- read receipts ----------
  async markRead(threadId: string, userId: string, uptoMessageId: string) {
    const r = await this.repo.markRead(threadId, userId, uptoMessageId);
    if (!r) throw new ForbiddenException('not_participant');
    void D13Emit.messageRead(userId, uptoMessageId, { threadId, userId });
    return r;
  }
  unreadDigest(userId: string) { return this.repo.unreadDigest(userId); }

  // ---------- contexts ----------
  async linkContext(threadId: string, actorId: string, dto: { kind: string; id: string; label: string }) {
    if (!this.repo.isParticipant(threadId, actorId)) throw new ForbiddenException('not_participant');
    const t = await this.repo.linkContext(threadId, dto.kind, dto.id, dto.label);
    if (!t) throw new NotFoundException('thread_not_found');
    await this.audit.record({ actorId, domain: 'inbox', action: 'thread.context.link', targetType: 'thread', targetId: threadId, meta: dto });
    void D13Emit.contextLinked(actorId, threadId, dto);
    return t;
  }
  async unlinkContext(threadId: string, actorId: string, kind: string, id: string) {
    if (!this.repo.isParticipant(threadId, actorId)) throw new ForbiddenException('not_participant');
    const t = await this.repo.unlinkContext(threadId, kind, id);
    if (!t) throw new NotFoundException('thread_not_found');
    return t;
  }

  // ---------- typing + presence ----------
  setTyping(threadId: string, userId: string, isTyping: boolean) {
    if (!this.repo.isParticipant(threadId, userId)) throw new ForbiddenException('not_participant');
    const recipients = this.repo.setTyping(threadId, userId, isTyping);
    return { ok: true, recipients };
  }
  getPresence(userIds: string[]) { return this.repo.getPresence(userIds); }

  // ---------- search + shared files ----------
  searchMessages(viewerId: string, q: any) { return this.repo.searchMessages(viewerId, q); }
  async sharedFiles(threadId: string, viewerId: string) {
    const r = await this.repo.sharedFiles(threadId, viewerId);
    if (!r) throw new ForbiddenException('not_participant');
    return r;
  }

  // ---------- insights ----------
  async insights(viewerId: string) {
    const digest = await this.repo.unreadDigest(viewerId);
    const threads = await this.repo.listThreads(viewerId, { read: 'all', page: 1, pageSize: 100, sort: 'recent' });
    const urgent = threads.items.filter((t: any) => t.priority === 'urgent').length;
    const oldest = threads.items
      .filter((t: any) => t.unreadCount > 0)
      .map((t: any) => t.lastMessageAt ? (Date.now() - new Date(t.lastMessageAt).getTime()) / 3_600_000 : 0)
      .reduce((a, b) => Math.max(a, b), 0);
    if (!digest) return [];
    if (typeof digest === 'object' && 'total' in digest) {
      return this.analytics.insights({
        unreadTotal: digest.total, mentionTotal: digest.mentions,
        urgentThreads: urgent, avgResponseHours: 4, oldestUnreadHours: Math.round(oldest),
      });
    }
    return [];
  }
}
