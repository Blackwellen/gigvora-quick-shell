/**
 * Domain 17 — Inbox thread list / current-conversation surface.
 *
 * The route currently shows a single thread chat. We preserve the visual
 * pattern but back it with a live "first thread" pulled from
 * /api/v1/inbox/threads, with deterministic fallback messages so the surface
 * stays useful when the API is not configured.
 */
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, Video, Paperclip, Image, Smile, Send, MoreHorizontal, Star, FileText, Clock } from 'lucide-react';
import { DataState, deriveStatus } from '@/components/state/DataState';
import { sdk, sdkReady } from '@/lib/gigvora-sdk';
import { toast } from 'sonner';

const FALLBACK_MESSAGES = [
  { id: 1, sender: 'Sarah K.', avatar: 'SK', time: '10:00 AM', text: 'Hi! I just finished the homepage mockup. Let me know what you think.', self: false, read: true },
  { id: 2, sender: 'Sarah K.', avatar: 'SK', time: '10:01 AM', text: 'Attached: Homepage_v3.fig', self: false, read: true },
  { id: 3, sender: 'You', avatar: 'YO', time: '10:15 AM', text: 'This looks great! I love the hero section. Can we adjust the CTA color to be more prominent?', self: true, read: true },
  { id: 4, sender: 'Sarah K.', avatar: 'SK', time: '10:20 AM', text: 'Absolutely! Will update by EOD.', self: false, read: false },
];

export default function InboxThreadPage() {
  const [msg, setMsg] = useState('');
  const live = sdkReady();
  const qc = useQueryClient();

  const threadsQ = useQuery({
    queryKey: ['inbox', 'threads', 'first'],
    queryFn: () => sdk.inbox.listThreads({ sort: 'recent', pageSize: 1 }),
    enabled: live,
    staleTime: 30_000,
  });
  const firstThread = threadsQ.data?.items?.[0];
  const threadId = firstThread?.id;

  const messagesQ = useQuery({
    queryKey: ['inbox', 'messages', threadId],
    queryFn: () => sdk.inbox.listMessages(threadId!, { limit: 50 }),
    enabled: live && !!threadId,
    staleTime: 10_000,
    refetchInterval: live && threadId ? 15_000 : false,
  });

  const sendMut = useMutation({
    mutationFn: async (body: string) => sdk.inbox.send(threadId!, { body, kind: 'text', clientNonce: crypto.randomUUID() }),
    onSuccess: () => { setMsg(''); qc.invalidateQueries({ queryKey: ['inbox', 'messages', threadId] }); },
    onError: () => toast.error('Could not send'),
  });

  const fallback = !live || threadsQ.isError || !threadId;
  const messages = fallback
    ? FALLBACK_MESSAGES
    : (messagesQ.data?.items ?? []).map(m => ({
        id: m.id, sender: m.authorName ?? m.authorId, avatar: (m.authorName ?? m.authorId).slice(0, 2).toUpperCase(),
        time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: m.body ?? `[${m.kind}]`, self: false, read: m.status === 'read',
      }));

  const status = deriveStatus({
    isLoading: live && (threadsQ.isLoading || messagesQ.isLoading),
    isError: false,
    isEmpty: messages.length === 0,
  });

  const partnerName = fallback ? 'Sarah K.' : (firstThread?.title ?? 'Conversation');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <Avatar className="h-6 w-6"><AvatarFallback className="text-[8px] bg-accent/10 text-accent">{partnerName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
          <div>
            <div className="text-xs font-bold">{partnerName}</div>
            <div className="text-[8px] text-[hsl(var(--state-healthy))]">{fallback ? 'Cached' : 'Live'}</div>
          </div>
          {firstThread?.contexts?.[0] && <Badge variant="secondary" className="text-[8px] h-3.5">{firstThread.contexts[0].label}</Badge>}
          <div className="flex-1" />
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Phone className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Video className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Star className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Thread Context">
            <div className="space-y-1.5 text-[9px]">
              {(firstThread?.contexts ?? []).slice(0, 4).map(c => (
                <div key={`${c.kind}-${c.id}`} className="flex justify-between"><span className="text-muted-foreground capitalize">{c.kind}</span><span className="font-medium">{c.label}</span></div>
              ))}
              {fallback && <>
                <div className="flex justify-between"><span className="text-muted-foreground">Project</span><span className="font-medium">MVP Build</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Milestone</span><span className="font-medium">Design Phase</span></div>
              </>}
            </div>
          </SectionCard>
        </div>
      }
    >
      <DataState status={status} empty={<div className="py-12 text-center text-xs text-muted-foreground">No messages yet — say hi.</div>}>
        <div className="flex flex-col h-[calc(100vh-200px)]">
          <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1" data-testid="message-list">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-2 ${m.self ? 'flex-row-reverse' : ''}`}>
                <Avatar className="h-7 w-7 shrink-0"><AvatarFallback className={`text-[7px] font-bold ${m.self ? 'bg-muted' : 'bg-accent/10 text-accent'}`}>{m.avatar}</AvatarFallback></Avatar>
                <div className={`max-w-[65%] p-3 rounded-2xl ${m.self ? 'bg-accent/10 border border-accent/20' : 'bg-muted/30 border border-border/30'}`}>
                  <div className="flex items-center gap-2 mb-0.5"><span className="text-[9px] font-semibold">{m.sender}</span><span className="text-[7px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2 w-2" />{m.time}</span></div>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 flex items-end gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Paperclip className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Image className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Smile className="h-3.5 w-3.5" /></Button>
            <Input
              data-testid="thread-composer-input"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && msg.trim() && !sendMut.isPending && live && threadId) sendMut.mutate(msg.trim()); }}
              placeholder={live && threadId ? 'Type a message…' : 'Connect to send live messages'}
              className="flex-1 text-xs h-9 rounded-xl"
              disabled={!live || !threadId || sendMut.isPending}
            />
            <Button
              data-testid="thread-send-button"
              size="sm"
              className="h-9 px-3 rounded-xl gap-1"
              disabled={!msg.trim() || !live || !threadId || sendMut.isPending}
              onClick={() => msg.trim() && sendMut.mutate(msg.trim())}
            >
              <Send className="h-3.5 w-3.5" />Send
            </Button>
          </div>
        </div>
      </DataState>
    </DashboardLayout>
  );
}
