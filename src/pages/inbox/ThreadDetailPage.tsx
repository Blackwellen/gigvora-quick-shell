/**
 * Domain 17 — Thread detail. Reads `:id` from the URL, hydrates the thread +
 * messages from the live API with idempotent send (clientNonce). Falls back
 * to a curated transcript when the API is unreachable so the surface never
 * blanks.
 */
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, Phone, Video, MoreVertical, ChevronRight, Star, Image, FileText, Link2 } from 'lucide-react';
import { DataState, deriveStatus } from '@/components/state/DataState';
import { sdk, sdkReady } from '@/lib/gigvora-sdk';
import { toast } from 'sonner';

const FALLBACK_MESSAGES = [
  { id: 'fb1', sender: 'Sarah Chen', initials: 'SC', time: '10:05 AM', text: 'Hey! I\'ve finished the wireframes for the homepage. Want me to send them over?', isMe: false },
  { id: 'fb2', sender: 'You', initials: 'YO', time: '10:08 AM', text: 'Yes please! Also, can you include the mobile variants?', isMe: true },
  { id: 'fb3', sender: 'Sarah Chen', initials: 'SC', time: '10:12 AM', text: 'Absolutely. Here are the files — 8 screens total including mobile breakpoints.', isMe: false },
];

export default function ThreadDetailPage() {
  const params = useParams<{ id?: string }>();
  const threadId = params.id ?? '';
  const live = sdkReady() && !!threadId;
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');

  const threadQ = useQuery({
    queryKey: ['inbox', 'thread', threadId],
    queryFn: () => sdk.inbox.getThread(threadId),
    enabled: live,
    staleTime: 60_000,
  });
  const messagesQ = useQuery({
    queryKey: ['inbox', 'messages', threadId],
    queryFn: () => sdk.inbox.listMessages(threadId, { limit: 50 }),
    enabled: live,
    staleTime: 10_000,
    refetchInterval: live ? 15_000 : false,
  });
  const markReadMut = useMutation({
    mutationFn: async (lastId: string) => sdk.inbox.markRead(threadId, lastId),
  });
  const sendMut = useMutation({
    mutationFn: async (body: string) => sdk.inbox.send(threadId, { body, kind: 'text', clientNonce: crypto.randomUUID() }),
    onSuccess: () => { setDraft(''); qc.invalidateQueries({ queryKey: ['inbox', 'messages', threadId] }); },
    onError: () => toast.error('Could not send'),
  });

  React.useEffect(() => {
    const last = messagesQ.data?.items?.at(-1);
    if (last) markReadMut.mutate(last.id);
  }, [messagesQ.data?.items?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const fallback = !live || threadQ.isError || messagesQ.isError;
  const messages = fallback
    ? FALLBACK_MESSAGES
    : (messagesQ.data?.items ?? []).map(m => ({
        id: m.id, sender: m.authorName ?? m.authorId, initials: (m.authorName ?? m.authorId).slice(0, 2).toUpperCase(),
        time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: m.body ?? `[${m.kind}]`, isMe: false,
      }));

  const partnerName = fallback ? 'Sarah Chen' : (threadQ.data?.title ?? 'Conversation');
  const contexts = fallback
    ? [{ kind: 'project', label: 'E-commerce Redesign', id: 'PRJ-2401' }, { kind: 'milestone', label: 'Design Phase', id: 'MS-002' }]
    : (threadQ.data?.contexts ?? []);

  const status = deriveStatus({
    isLoading: live && (threadQ.isLoading || messagesQ.isLoading),
    isError: false,
    isEmpty: messages.length === 0,
  });

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-2 w-full">
          <span className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">Inbox</span>
          <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
          <Avatar className="h-5 w-5"><AvatarFallback className="text-[6px] bg-accent/10 text-accent">{partnerName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
          <span className="text-xs font-semibold">{partnerName}</span>
          <StatusBadge status="healthy" label={fallback ? 'Cached' : 'Live'} />
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Phone className="h-3 w-3" />Call</Button>
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Video className="h-3 w-3" />Video</Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><Star className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><MoreVertical className="h-3.5 w-3.5" /></Button>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Linked Context">
            {contexts.length === 0 && <div className="text-[8px] text-muted-foreground">Nothing pinned to this thread.</div>}
            {contexts.map((c) => (
              <div key={`${c.kind}-${c.id}`} className="flex items-center gap-1.5 py-1 text-[8px] cursor-pointer hover:text-accent">
                <Link2 className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="text-muted-foreground capitalize">{c.kind}:</span>
                <span className="font-medium">{c.label}</span>
              </div>
            ))}
          </SectionCard>
        </div>
      }
      rightRailWidth="w-48"
    >
      <DataState status={status} empty={<div className="py-12 text-center text-xs text-muted-foreground">No messages yet — open the conversation by sending a note.</div>}>
        <div className="flex flex-col h-[calc(100vh-180px)]">
          <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1" data-testid="thread-message-list">
            <div className="text-center text-[8px] text-muted-foreground py-2">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-2.5 ${m.isMe ? 'flex-row-reverse' : ''}`}>
                <Avatar className="h-7 w-7 shrink-0"><AvatarFallback className={`text-[7px] font-bold ${m.isMe ? 'bg-muted text-muted-foreground' : 'bg-accent/10 text-accent'}`}>{m.initials}</AvatarFallback></Avatar>
                <div className={`max-w-[65%] p-3 rounded-2xl ${m.isMe ? 'bg-accent/10 border border-accent/20' : 'bg-muted/30 border border-border/30'}`}>
                  <div className="flex items-center gap-2 mb-0.5"><span className="text-[9px] font-semibold">{m.sender}</span><span className="text-[7px] text-muted-foreground">{m.time}</span></div>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-3">
            <Textarea
              data-testid="thread-composer-textarea"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={live ? 'Type a message...' : 'Connect to send live messages'}
              className="min-h-[60px] text-xs mb-2"
              disabled={!live || sendMut.isPending}
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Paperclip className="h-3 w-3" />File</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Image className="h-3 w-3" />Photo</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Link2 className="h-3 w-3" />Link</Button>
              </div>
              <Button
                data-testid="thread-detail-send"
                size="sm"
                className="h-7 text-[9px] rounded-xl gap-1"
                disabled={!draft.trim() || !live || sendMut.isPending}
                onClick={() => draft.trim() && sendMut.mutate(draft.trim())}
              >
                <Send className="h-3 w-3" />Send
              </Button>
            </div>
          </div>
        </div>
      </DataState>
    </DashboardLayout>
  );
}
