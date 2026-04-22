import { Injectable } from '@nestjs/common';

/**
 * Domain 17 — Inbox repository.
 *
 * In-memory store following the established Gigvora pattern (see TrustRepository,
 * AgencyRepository). Method shape is the contract a Drizzle/Postgres repo must
 * satisfy when wired in. Idempotency keys live in `nonces` so /messages POSTs
 * are replay-safe at the data layer regardless of the HTTP retry strategy.
 *
 * State machine:
 *   thread.state: active → snoozed → archived (blocked is terminal one-way)
 *   message.status: sent → delivered → read (failed = terminal sad path)
 */
export type Participant = {
  threadId: string;
  userId: string;
  role: 'owner' | 'member' | 'guest' | 'observer';
  joinedAt: string;
  lastReadAt?: string;
  lastReadMessageId?: string;
  muted: boolean;
};

export type ThreadContext = {
  kind: string;
  id: string;
  label: string;
  pinnedAt: string;
};

export type Thread = {
  id: string;
  kind: 'direct' | 'group' | 'support' | 'system';
  title?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  state: 'active' | 'archived' | 'snoozed' | 'blocked';
  priority: 'normal' | 'priority' | 'urgent';
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadHint?: number;
  contexts: ThreadContext[];
};

export type Attachment = {
  id: string;
  name: string;
  size: number;
  mime: string;
  url?: string;
  storageKey?: string;
};

export type Message = {
  id: string;
  threadId: string;
  authorId: string;
  authorName?: string;
  authorAvatarKey?: string;
  kind: 'text' | 'attachment' | 'system' | 'offer' | 'booking' | 'call_log' | 'voice';
  body?: string;
  attachments: Attachment[];
  replyToId?: string;
  payload?: Record<string, unknown>;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  reactions: Record<string, string[]>; // emoji → [userId]
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
};

@Injectable()
export class InboxRepository {
  private threads = new Map<string, Thread>();
  private participants = new Map<string, Participant[]>(); // threadId → list
  private messages = new Map<string, Message[]>();          // threadId → list (asc by createdAt)
  private nonces = new Map<string, string>();               // clientNonce → messageId
  private presence = new Map<string, { online: boolean; lastSeen: string; typingIn: Set<string> }>();

  // ---------- threads ----------
  async listThreads(viewerId: string, q: any) {
    let arr = Array.from(this.threads.values()).filter(t => this.isParticipant(t.id, viewerId));
    if (q.state)    arr = arr.filter(t => t.state === q.state);
    else            arr = arr.filter(t => t.state !== 'archived'); // archived hidden by default
    if (q.kind)     arr = arr.filter(t => t.kind === q.kind);
    if (q.priority) arr = arr.filter(t => t.priority === q.priority);
    if (q.participantId) arr = arr.filter(t => this.isParticipant(t.id, q.participantId));
    if (q.q) {
      const n = q.q.toLowerCase();
      arr = arr.filter(t => (t.title ?? '').toLowerCase().includes(n) || (t.lastMessagePreview ?? '').toLowerCase().includes(n));
    }
    if (q.read === 'unread')   arr = arr.filter(t => this.unreadCount(t.id, viewerId) > 0);
    if (q.read === 'mentions') arr = arr.filter(t => this.unreadMentions(t.id, viewerId) > 0);

    const enriched = arr.map(t => ({
      ...t,
      participants: this.participants.get(t.id) ?? [],
      unreadCount: this.unreadCount(t.id, viewerId),
      mentionCount: this.unreadMentions(t.id, viewerId),
    }));

    if (q.sort === 'unread')   enriched.sort((a, b) => b.unreadCount - a.unreadCount);
    if (q.sort === 'priority') enriched.sort((a, b) => this.prioRank(b.priority) - this.prioRank(a.priority));
    if (q.sort === 'recent')   enriched.sort((a, b) => (b.lastMessageAt ?? b.createdAt).localeCompare(a.lastMessageAt ?? a.createdAt));

    const total = enriched.length;
    const start = (q.page - 1) * q.pageSize;
    const items = enriched.slice(start, start + q.pageSize);
    return { items, total, page: q.page, pageSize: q.pageSize, hasMore: start + items.length < total };
  }

  async getThread(id: string, viewerId: string) {
    const t = this.threads.get(id); if (!t) return null;
    if (!this.isParticipant(id, viewerId)) return null;
    return {
      ...t,
      participants: this.participants.get(id) ?? [],
      unreadCount: this.unreadCount(id, viewerId),
      mentionCount: this.unreadMentions(id, viewerId),
    };
  }

  async createThread(creatorId: string, dto: any) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const t: Thread = {
      id, kind: dto.kind ?? 'direct', title: dto.title, createdBy: creatorId,
      createdAt: now, updatedAt: now, state: 'active', priority: 'normal',
      contexts: dto.contextKind && dto.contextId ? [{ kind: dto.contextKind, id: dto.contextId, label: dto.contextId, pinnedAt: now }] : [],
    };
    this.threads.set(id, t);
    const ids = Array.from(new Set([creatorId, ...dto.participantIds]));
    this.participants.set(id, ids.map(uid => ({
      threadId: id, userId: uid, role: uid === creatorId ? 'owner' : 'member', joinedAt: now, muted: false,
    })));
    this.messages.set(id, []);
    return t;
  }

  async setThreadState(id: string, viewerId: string, state: Thread['state']) {
    const t = this.threads.get(id); if (!t || !this.isParticipant(id, viewerId)) return null;
    t.state = state; t.updatedAt = new Date().toISOString();
    return t;
  }
  async setThreadPriority(id: string, viewerId: string, priority: Thread['priority']) {
    const t = this.threads.get(id); if (!t || !this.isParticipant(id, viewerId)) return null;
    t.priority = priority; t.updatedAt = new Date().toISOString();
    return t;
  }

  // ---------- participants ----------
  isParticipant(threadId: string, userId: string | null | undefined): boolean {
    if (!userId) return false;
    const p = this.participants.get(threadId) ?? [];
    return p.some(x => x.userId === userId);
  }
  async addParticipants(threadId: string, ids: string[], role: Participant['role'] = 'member') {
    const list = this.participants.get(threadId) ?? [];
    const existing = new Set(list.map(p => p.userId));
    const now = new Date().toISOString();
    for (const uid of ids) {
      if (existing.has(uid)) continue;
      list.push({ threadId, userId: uid, role, joinedAt: now, muted: false });
    }
    this.participants.set(threadId, list);
    return list;
  }
  async removeParticipant(threadId: string, userId: string) {
    const list = (this.participants.get(threadId) ?? []).filter(p => p.userId !== userId);
    this.participants.set(threadId, list);
    return list;
  }
  async setMute(threadId: string, userId: string, muted: boolean) {
    const list = this.participants.get(threadId) ?? [];
    const me = list.find(p => p.userId === userId); if (!me) return null;
    me.muted = muted;
    return me;
  }

  // ---------- messages ----------
  async listMessages(threadId: string, viewerId: string, q: { cursor?: string; limit: number; direction: 'before' | 'after' }) {
    if (!this.isParticipant(threadId, viewerId)) return null;
    let msgs = (this.messages.get(threadId) ?? []).filter(m => !m.deletedAt);
    if (q.cursor) {
      const idx = msgs.findIndex(m => m.id === q.cursor);
      if (idx >= 0) msgs = q.direction === 'before' ? msgs.slice(0, idx) : msgs.slice(idx + 1);
    }
    const items = q.direction === 'before' ? msgs.slice(-q.limit) : msgs.slice(0, q.limit);
    const nextCursor = items.length ? (q.direction === 'before' ? items[0].id : items[items.length - 1].id) : null;
    return { items, nextCursor, hasMore: items.length === q.limit };
  }

  async sendMessage(threadId: string, authorId: string, dto: any) {
    if (!this.isParticipant(threadId, authorId)) return null;
    if (dto.clientNonce) {
      const existingId = this.nonces.get(dto.clientNonce);
      if (existingId) {
        const list = this.messages.get(threadId) ?? [];
        const m = list.find(x => x.id === existingId);
        if (m) return m;
      }
    }
    const t = this.threads.get(threadId)!;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const msg: Message = {
      id, threadId, authorId,
      kind: dto.kind ?? 'text',
      body: dto.body, attachments: dto.attachments ?? [],
      replyToId: dto.replyToId, payload: dto.payload,
      status: 'sent', reactions: {}, createdAt: now,
    };
    const list = this.messages.get(threadId) ?? [];
    list.push(msg);
    this.messages.set(threadId, list);
    if (dto.clientNonce) this.nonces.set(dto.clientNonce, id);
    t.lastMessageAt = now;
    t.lastMessagePreview = (dto.body ?? `[${msg.kind}]`).slice(0, 200);
    t.updatedAt = now;
    return msg;
  }

  async editMessage(threadId: string, messageId: string, authorId: string, body: string) {
    const list = this.messages.get(threadId) ?? [];
    const m = list.find(x => x.id === messageId); if (!m) return null;
    if (m.authorId !== authorId) return 'forbidden' as const;
    if (m.deletedAt) return null;
    m.body = body; m.editedAt = new Date().toISOString();
    return m;
  }
  async deleteMessage(threadId: string, messageId: string, authorId: string) {
    const list = this.messages.get(threadId) ?? [];
    const m = list.find(x => x.id === messageId); if (!m) return null;
    if (m.authorId !== authorId) return 'forbidden' as const;
    m.deletedAt = new Date().toISOString();
    return m;
  }
  async react(threadId: string, messageId: string, userId: string, emoji: string) {
    const list = this.messages.get(threadId) ?? [];
    const m = list.find(x => x.id === messageId); if (!m) return null;
    const set = new Set(m.reactions[emoji] ?? []);
    if (set.has(userId)) set.delete(userId); else set.add(userId);
    if (set.size) m.reactions[emoji] = Array.from(set); else delete m.reactions[emoji];
    return m;
  }

  // ---------- read receipts ----------
  async markRead(threadId: string, userId: string, uptoMessageId: string) {
    const list = this.participants.get(threadId) ?? [];
    const me = list.find(p => p.userId === userId); if (!me) return null;
    me.lastReadMessageId = uptoMessageId;
    me.lastReadAt = new Date().toISOString();
    // Bump message status to "read" for everyone whose author isn't the reader.
    const msgs = this.messages.get(threadId) ?? [];
    const idx = msgs.findIndex(m => m.id === uptoMessageId);
    if (idx >= 0) {
      for (let i = 0; i <= idx; i += 1) {
        const m = msgs[i];
        if (m.authorId !== userId && m.status !== 'read') m.status = 'read';
      }
    }
    return me;
  }
  unreadCount(threadId: string, userId: string): number {
    const list = this.participants.get(threadId) ?? [];
    const me = list.find(p => p.userId === userId); if (!me) return 0;
    const msgs = this.messages.get(threadId) ?? [];
    if (!me.lastReadMessageId) return msgs.filter(m => !m.deletedAt && m.authorId !== userId).length;
    const idx = msgs.findIndex(m => m.id === me.lastReadMessageId);
    return msgs.slice(idx + 1).filter(m => !m.deletedAt && m.authorId !== userId).length;
  }
  unreadMentions(threadId: string, userId: string): number {
    const me = (this.participants.get(threadId) ?? []).find(p => p.userId === userId);
    if (!me) return 0;
    const msgs = this.messages.get(threadId) ?? [];
    const fromIdx = me.lastReadMessageId ? msgs.findIndex(m => m.id === me.lastReadMessageId) + 1 : 0;
    const tag = `@${userId}`;
    return msgs.slice(fromIdx).filter(m => !m.deletedAt && (m.body ?? '').includes(tag)).length;
  }
  async unreadDigest(userId: string) {
    let total = 0; let mentions = 0; const threads: any[] = [];
    for (const t of this.threads.values()) {
      if (!this.isParticipant(t.id, userId)) continue;
      const u = this.unreadCount(t.id, userId);
      const m = this.unreadMentions(t.id, userId);
      total += u; mentions += m;
      if (u > 0) threads.push({ threadId: t.id, title: t.title, unread: u, mentions: m, lastMessageAt: t.lastMessageAt });
    }
    threads.sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''));
    return { total, mentions, threads: threads.slice(0, 50) };
  }

  // ---------- contexts ----------
  async linkContext(threadId: string, kind: string, id: string, label: string) {
    const t = this.threads.get(threadId); if (!t) return null;
    if (t.contexts.some(c => c.kind === kind && c.id === id)) return t;
    t.contexts.push({ kind, id, label, pinnedAt: new Date().toISOString() });
    return t;
  }
  async unlinkContext(threadId: string, kind: string, id: string) {
    const t = this.threads.get(threadId); if (!t) return null;
    t.contexts = t.contexts.filter(c => !(c.kind === kind && c.id === id));
    return t;
  }

  // ---------- presence + typing ----------
  setTyping(threadId: string, userId: string, isTyping: boolean) {
    const p = this.presence.get(userId) ?? { online: true, lastSeen: new Date().toISOString(), typingIn: new Set<string>() };
    if (isTyping) p.typingIn.add(threadId); else p.typingIn.delete(threadId);
    p.lastSeen = new Date().toISOString();
    this.presence.set(userId, p);
    return Array.from((this.participants.get(threadId) ?? [])
      .filter(x => x.userId !== userId && (this.presence.get(x.userId)?.online))
      .map(x => x.userId));
  }
  getPresence(userIds: string[]) {
    return userIds.map(uid => {
      const p = this.presence.get(uid);
      return { userId: uid, online: !!p?.online, lastSeen: p?.lastSeen ?? null };
    });
  }
  setOnline(userId: string, online: boolean) {
    const prev = this.presence.get(userId) ?? { online: false, lastSeen: new Date().toISOString(), typingIn: new Set<string>() };
    prev.online = online; prev.lastSeen = new Date().toISOString();
    this.presence.set(userId, prev);
  }

  // ---------- search ----------
  async searchMessages(viewerId: string, q: { q: string; threadId?: string; participantId?: string; limit: number }) {
    const needle = q.q.toLowerCase();
    const out: Array<Message & { threadTitle?: string }> = [];
    for (const t of this.threads.values()) {
      if (!this.isParticipant(t.id, viewerId)) continue;
      if (q.threadId && t.id !== q.threadId) continue;
      const msgs = this.messages.get(t.id) ?? [];
      for (const m of msgs) {
        if (m.deletedAt) continue;
        if (q.participantId && m.authorId !== q.participantId) continue;
        if (!(m.body ?? '').toLowerCase().includes(needle)) continue;
        out.push({ ...m, threadTitle: t.title });
        if (out.length >= q.limit) return out;
      }
    }
    return out;
  }

  // ---------- shared files (attachment digest) ----------
  async sharedFiles(threadId: string, viewerId: string) {
    if (!this.isParticipant(threadId, viewerId)) return null;
    const msgs = this.messages.get(threadId) ?? [];
    return msgs.flatMap(m => m.attachments.map(a => ({ ...a, messageId: m.id, sharedAt: m.createdAt, byUserId: m.authorId })));
  }

  private prioRank(p: string): number { return p === 'urgent' ? 3 : p === 'priority' ? 2 : 1; }

  // ---------- seed ----------
  async seed(viewerId: string) {
    const partner = (name: string) => ({ id: `seed-${name.toLowerCase().replace(/\s+/g, '-')}`, name });
    const sarah  = partner('Sarah Chen');
    const marcus = partner('Marcus Kim');
    const elena  = partner('Elena Rodriguez');
    const groupIds = [viewerId, sarah.id, marcus.id, elena.id];

    const t1 = await this.createThread(viewerId, { kind: 'direct', participantIds: [sarah.id], title: 'Sarah Chen', contextKind: 'project', contextId: 'PRJ-2401' });
    await this.linkContext(t1.id, 'milestone', 'MS-002', 'Design Phase');
    await this.linkContext(t1.id, 'order',     'ORD-1842', 'ORD-1842');

    const seedThread1: Array<Partial<Message> & { authorId: string; body: string }> = [
      { authorId: sarah.id,  body: "Hey! I've finished the wireframes for the homepage. Want me to send them over?" },
      { authorId: viewerId,  body: 'Yes please! Also, can you include the mobile variants?' },
      { authorId: sarah.id,  body: 'Absolutely. Here are the files — 8 screens total including mobile breakpoints.', kind: 'attachment', attachments: [{ id: crypto.randomUUID(), name: 'Homepage_Wireframes_v2.fig', size: 4_400_000, mime: 'application/figma' }] },
      { authorId: viewerId,  body: 'These look great! The hero section is exactly what we discussed. Let me share with the team.' },
      { authorId: sarah.id,  body: "Perfect. I'll start on the inner pages next. Should have those by Thursday." },
    ];
    for (const m of seedThread1) await this.sendMessage(t1.id, m.authorId, { body: m.body, kind: m.kind ?? 'text', attachments: m.attachments });
    t1.priority = 'priority';

    const t2 = await this.createThread(viewerId, { kind: 'direct', participantIds: [marcus.id], title: 'Marcus Kim' });
    await this.sendMessage(t2.id, marcus.id, { body: 'Quick question on the API contract for /orders' });
    await this.sendMessage(t2.id, viewerId,  { body: 'Sure — moved it to OpenAPI v2. Will share the spec link shortly.' });

    const t3 = await this.createThread(viewerId, { kind: 'group', participantIds: [sarah.id, marcus.id, elena.id], title: 'GreenGrid Launch Crew' });
    await this.sendMessage(t3.id, elena.id,  { body: `@${viewerId} please review the launch checklist before standup.` });
    await this.sendMessage(t3.id, sarah.id,  { body: 'I added the design QA column.' });

    const t4 = await this.createThread(viewerId, { kind: 'support', participantIds: ['seed-support'], title: 'Gigvora Support · Payout query' });
    await this.sendMessage(t4.id, 'seed-support', { body: 'Thanks for reaching out — your payout has been queued for next batch.' });
    t4.priority = 'urgent';

    // Mark t2 as fully read so unread counters look realistic.
    const last = (this.messages.get(t2.id) ?? []).at(-1);
    if (last) await this.markRead(t2.id, viewerId, last.id);

    // Presence
    this.setOnline(sarah.id, true);
    this.setOnline(marcus.id, false);
    this.setOnline(elena.id, true);
    this.setOnline(viewerId, true);
    void groupIds;
  }
}
