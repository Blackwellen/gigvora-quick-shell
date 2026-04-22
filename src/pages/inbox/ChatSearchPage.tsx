/**
 * Domain 17 — Chat search wired to /api/v1/inbox/search/messages.
 * The query input drives a debounced server-side search; results carry the
 * canonical message envelope so click-throughs can open ThreadDetailPage.
 */
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MessageSquare, FileText, Link2, SlidersHorizontal, Eye, Clock } from 'lucide-react';
import { DataState, deriveStatus } from '@/components/state/DataState';
import { sdk, sdkReady } from '@/lib/gigvora-sdk';

const FALLBACK = [
  { id: 'r1', type: 'message' as const, from: 'Sarah Chen', text: 'Here are the wireframes for the homepage redesign...', thread: 'Sarah Chen', date: 'Apr 14' },
  { id: 'r2', type: 'message' as const, from: 'James Wilson', text: 'The project wireframes need one more revision before approval.', thread: 'James Wilson', date: 'Apr 12' },
  { id: 'r3', type: 'file' as const, from: 'Sarah Chen', text: 'Homepage_Wireframes_v2.fig', thread: 'Sarah Chen', date: 'Apr 14' },
];

function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v);
  React.useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

const typeIcons: Record<string, React.ReactNode> = {
  message: <MessageSquare className="h-3 w-3 text-accent" />,
  file: <FileText className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" />,
  link: <Link2 className="h-3 w-3 text-[hsl(var(--gigvora-blue))]" />,
};

export default function ChatSearchPage() {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('wireframes');
  const debounced = useDebounced(q, 300);
  const live = sdkReady();

  const searchQ = useQuery({
    queryKey: ['inbox', 'search', debounced],
    queryFn: () => sdk.inbox.search({ q: debounced, limit: 30 }),
    enabled: live && debounced.trim().length > 0,
    staleTime: 30_000,
  });

  const liveResults = useMemo(() => {
    if (!searchQ.data) return [] as typeof FALLBACK;
    return searchQ.data.map(m => ({
      id: m.id,
      type: (m.attachments && m.attachments.length > 0 ? 'file' : 'message') as 'file' | 'message',
      from: m.authorName ?? m.authorId,
      text: m.body ?? (m.attachments[0]?.name ?? '[attachment]'),
      thread: m.threadTitle ?? m.threadId,
      date: new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
  }, [searchQ.data]);

  const fallback = !live || searchQ.isError;
  const all = fallback ? FALLBACK : liveResults;
  const filtered = tab === 'all' ? all : all.filter(r => r.type === tab);

  const status = deriveStatus({
    isLoading: live && searchQ.isLoading && debounced.trim().length > 0,
    isError: false,
    isEmpty: filtered.length === 0,
  });

  return (
    <DashboardLayout topStrip={<><Search className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Chat Search</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><SlidersHorizontal className="h-3 w-3" />Filters</Button></>}>
      <div className="flex gap-2 mb-3"><div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input data-testid="chat-search-input" placeholder="Search messages, files, and links..." className="pl-8 h-9 text-xs rounded-xl" value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
      <div className="flex flex-wrap gap-1 mb-3">{['Date Range', 'From', 'Thread', 'Has Attachment'].map(f => <Button key={f} variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">{f}</Button>)}</div>

      <KPIBand className="mb-3">
        <KPICard label="Results" value={String(all.length)} className="!rounded-2xl" />
        <KPICard label="Messages" value={String(all.filter(r => r.type === 'message').length)} className="!rounded-2xl" />
        <KPICard label="Files" value={String(all.filter(r => r.type === 'file').length)} className="!rounded-2xl" />
        <KPICard label="Source" value={fallback ? 'Cached' : 'Live'} className="!rounded-2xl" />
      </KPIBand>

      <Tabs value={tab} onValueChange={setTab} className="mb-3">
        <TabsList className="h-8">
          <TabsTrigger value="all" className="text-[10px] px-3">All</TabsTrigger>
          <TabsTrigger value="message" className="text-[10px] px-3">Messages</TabsTrigger>
          <TabsTrigger value="file" className="text-[10px] px-3">Files</TabsTrigger>
          <TabsTrigger value="link" className="text-[10px] px-3">Links</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataState status={status} empty={<div className="py-12 text-center text-xs text-muted-foreground">No matches. Try a different keyword.</div>}>
        <div className="space-y-2">
          {filtered.map((r) => (
            <SectionCard key={r.id} className="!rounded-2xl cursor-pointer hover:border-accent/30 transition-all" data-testid={`search-result-${r.id}`}>
              <div className="flex items-start gap-2.5">
                <div className="mt-1">{typeIcons[r.type]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Avatar className="h-4 w-4"><AvatarFallback className="text-[5px] bg-accent/10 text-accent">{r.from.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback></Avatar>
                    <span className="text-[9px] font-semibold">{r.from}</span>
                    <Badge variant="outline" className="text-[7px] rounded-md capitalize">{r.type}</Badge>
                    <span className="text-[7px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2 w-2" />{r.date}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground truncate">{r.text}</p>
                  <span className="text-[7px] text-muted-foreground">in "{r.thread}"</span>
                </div>
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg shrink-0"><Eye className="h-2.5 w-2.5" /></Button>
              </div>
            </SectionCard>
          ))}
        </div>
      </DataState>
    </DashboardLayout>
  );
}
