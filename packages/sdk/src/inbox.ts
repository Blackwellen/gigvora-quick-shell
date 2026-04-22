// Domain 17 — Inbox SDK namespace types.
// Use via `new GigvoraClient({ baseUrl }).inbox.*` once the SDK class is wired.
export type InboxThreadKind   = 'direct' | 'group' | 'support' | 'system';
export type InboxThreadState  = 'active' | 'archived' | 'snoozed' | 'blocked';
export type InboxPriority     = 'normal' | 'priority' | 'urgent';
export type InboxMessageKind  = 'text' | 'attachment' | 'system' | 'offer' | 'booking' | 'call_log' | 'voice';
export type InboxMessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type InboxContextKind  = 'project' | 'gig' | 'service' | 'job' | 'order' | 'milestone' | 'event' | 'company' | 'profile';

export interface InboxThreadContext { kind: InboxContextKind; id: string; label: string; pinnedAt: string }
export interface InboxParticipant {
  threadId: string; userId: string;
  role: 'owner' | 'member' | 'guest' | 'observer';
  joinedAt: string; lastReadAt?: string; lastReadMessageId?: string; muted: boolean;
}
export interface InboxAttachment { id: string; name: string; size: number; mime: string; url?: string; storageKey?: string }

export interface InboxThread {
  id: string;
  kind: InboxThreadKind;
  title?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  state: InboxThreadState;
  priority: InboxPriority;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  contexts: InboxThreadContext[];
  participants?: InboxParticipant[];
  unreadCount?: number;
  mentionCount?: number;
}

export interface InboxMessage {
  id: string;
  threadId: string;
  authorId: string;
  authorName?: string;
  authorAvatarKey?: string;
  kind: InboxMessageKind;
  body?: string;
  attachments: InboxAttachment[];
  replyToId?: string;
  payload?: Record<string, unknown>;
  status: InboxMessageStatus;
  reactions: Record<string, string[]>;
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
}

export interface InboxUnreadDigest {
  total: number;
  mentions: number;
  threads: { threadId: string; title?: string; unread: number; mentions: number; lastMessageAt?: string }[];
}
