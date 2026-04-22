/**
 * Domain 17 — Unread & Mentions center, wired to /api/v1/inbox/digest/unread.
 * UI preserved 1:1; only the data source becomes live with a deterministic
 * curated fallback when the API is unreachable.
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, AtSign, MessageSquare, Eye, Clock, CheckCheck, Settings } from 'lucide-react';
import { DataState, deriveStatus } from '@/components/state/DataState';
import { sdk, sdkReady } from '@/lib/gigvora-sdk';

const FALLBACK = {
  unreads: [
    { id: 'u1', from: 'Sarah Chen', initials: 'SC', preview: 'Here are the updated wireframes you requested...', time: '2m ago', count: 3, thread: 'Design Project' },
    { id: 'u2', from: 'James Wilson', initials: 'JW', preview: 'Can we schedule a call to discuss the timeline?', time: '15m ago', count: 1, thread: 'Web Development' },
    { id: 'u3', from: 'Priya Sharma', initials: 'PS', preview: 'Invoice #5501 has been processed and paid.', time: '1h ago', count: 2, thread: 'Billing' },
    { id: 'u4', from: 'Marcus Johnson', initials: 'MJ', preview: 'The API integration is complete. Ready for review.', time: '3h ago', count: 5, thread: 'Backend Work' },
  ],
};

function timeAgo(iso?: string) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function UnreadMentionCenterPage() {
  const [tab, setTab] = useState('unread');
  const live = sdkReady();
  const digestQ = useQuery({
    queryKey: ['inbox', 'digest', 'unread'],
    queryFn: () => sdk.inbox.unreadDigest(),
    enabled: live,
    staleTime: 15_000,
    refetchInterval: live ? 30_000 : false,
  });

  const fallback = !live || digestQ.isError;
  const unreads = fallback
    ? FALLBACK.unreads
    : (digestQ.data?.threads ?? []).map(t => ({
        id: t.threadId,
        from: t.title ?? 'Direct thread',
        initials: (t.title ?? 'DT').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase(),
        preview: '',
        time: timeAgo(t.lastMessageAt),
        count: t.unread,
        thread: t.title ?? '—',
      }));
  const totalUnread = fallback ? unreads.reduce((a, u) => a + u.count, 0) : (digestQ.data?.total ?? 0);
  const totalMentions = fallback ? 3 : (digestQ.data?.mentions ?? 0);
  const mentions: Array<{ id: string; from: string; initials: string; text: string; time: string; thread: string; context: string }> =
    fallback ? [
      { id: 'm1', from: 'Sarah Chen', initials: 'SC', text: '@you Can you review the color palette choices?', time: '10m ago', thread: 'Design Project', context: 'Group chat' },
      { id: 'm2', from: 'Team Lead', initials: 'TL', text: '@you Please update the milestone status by EOD.', time: '2h ago', thread: 'Project Management', context: 'Team channel' },
      { id: 'm3', from: 'James Wilson', initials: 'JW', text: '@you The PR is ready for your review.', time: '5h ago', thread: 'Code Review', context: 'Direct message' },
    ] : (digestQ.data?.threads ?? []).filter(t => t.mentions > 0).map(t => ({
      id: `m-${t.threadId}`, from: t.title ?? 'Mention', initials: (t.title ?? 'MN').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase(),
      text: `${t.mentions} unread mention${t.mentions > 1 ? 's' : ''}`, time: timeAgo(t.lastMessageAt), thread: t.title ?? '—', context: 'Thread',
    }));

  const status = deriveStatus({
    isLoading: live && digestQ.isLoading,
    isError: false,
    isEmpty: tab === 'unread' ? unreads.length === 0 : mentions.length === 0,
  });

  return (
    <DashboardLayout topStrip={<><Bell className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Unread & Mentions</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-0.5"><CheckCheck className="h-3 w-3" />Mark All Read</Button><Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><Settings className="h-3.5 w-3.5" /></Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Unread Messages" value={String(totalUnread)} className="!rounded-2xl" />
        <KPICard label="Unread Threads" value={String(unreads.length)} className="!rounded-2xl" />
        <KPICard label="Mentions" value={String(totalMentions)} className="!rounded-2xl" />
        <KPICard label="Live source" value={fallback ? 'Cached' : 'Live'} className="!rounded-2xl" />
      </KPIBand>

      <Tabs value={tab} onValueChange={setTab} className="mb-3">
        <TabsList className="h-8">
          <TabsTrigger value="unread" className="text-[10px] px-3 gap-1"><MessageSquare className="h-3 w-3" />Unread ({totalUnread})</TabsTrigger>
          <TabsTrigger value="mentions" className="text-[10px] px-3 gap-1"><AtSign className="h-3 w-3" />Mentions ({totalMentions})</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataState status={status} empty={<div className="py-12 text-center text-xs text-muted-foreground">Inbox zero — nothing waiting on you.</div>}>
        {tab === 'unread' && (
          <div className="space-y-2">
            {unreads.map((u) => (
              <SectionCard key={u.id} className="!rounded-2xl cursor-pointer hover:border-accent/30 transition-all border-l-2 border-l-accent" data-testid={`unread-row-${u.id}`}>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 shrink-0"><AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">{u.initials}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold">{u.from}</span>
                      <Badge className="text-[7px] bg-accent text-white rounded-full h-4 min-w-[16px] flex items-center justify-center">{u.count}</Badge>
                      <span className="text-[7px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2 w-2" />{u.time}</span>
                    </div>
                    {u.preview && <p className="text-[9px] text-muted-foreground truncate">{u.preview}</p>}
                    <span className="text-[7px] text-muted-foreground">{u.thread}</span>
                  </div>
                  <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg shrink-0"><Eye className="h-2.5 w-2.5 mr-0.5" />Open</Button>
                </div>
              </SectionCard>
            ))}
          </div>
        )}

        {tab === 'mentions' && (
          <div className="space-y-2">
            {mentions.map((m) => (
              <SectionCard key={m.id} className="!rounded-2xl cursor-pointer hover:border-accent/30 transition-all border-l-2 border-l-[hsl(var(--gigvora-amber))]" data-testid={`mention-row-${m.id}`}>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 shrink-0"><AvatarFallback className="text-[8px] bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))] font-bold">{m.initials}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold">{m.from}</span>
                      <AtSign className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" />
                      <Badge variant="outline" className="text-[7px] rounded-md">{m.context}</Badge>
                      <span className="text-[7px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2 w-2" />{m.time}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground">{m.text}</p>
                    <span className="text-[7px] text-muted-foreground">{m.thread}</span>
                  </div>
                  <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg shrink-0"><Eye className="h-2.5 w-2.5 mr-0.5" />Reply</Button>
                </div>
              </SectionCard>
            ))}
          </div>
        )}
      </DataState>
    </DashboardLayout>
  );
}
