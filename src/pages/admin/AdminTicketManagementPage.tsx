import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Ticket, Search, Clock, CheckCircle2, MessageSquare, ChevronRight,
  ArrowUp, AlertCircle, Send, User, Shield, Loader2, XCircle,
  Filter, RefreshCw, MoreHorizontal, Paperclip, Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TStatus = 'open' | 'in-progress' | 'waiting' | 'resolved' | 'escalated' | 'closed';

interface AdminTicket {
  id: string; subject: string; user: string; userEmail: string; category: string;
  status: TStatus; priority: 'low' | 'medium' | 'high' | 'urgent';
  created: string; updated: string; assignee: string; messages: number;
}

const STATUS_CLS: Record<TStatus, string> = {
  open: 'bg-accent/10 text-accent', 'in-progress': 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  waiting: 'bg-muted text-muted-foreground', resolved: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  escalated: 'bg-destructive/10 text-destructive', closed: 'bg-muted text-muted-foreground',
};

const TICKETS: AdminTicket[] = [
  { id: 'TKT-4821', subject: 'Payment failed — user locked out', user: 'Jordan K.', userEmail: 'jordan@email.com', category: 'Billing', status: 'open', priority: 'urgent', created: '12 min ago', updated: '12 min ago', assignee: 'Unassigned', messages: 1 },
  { id: 'TKT-4818', subject: 'Cannot access premium content after upgrade', user: 'Alex M.', userEmail: 'alex@email.com', category: 'Access', status: 'in-progress', priority: 'high', created: '1 hour ago', updated: '20 min ago', assignee: 'M. Chen', messages: 4 },
  { id: 'TKT-4815', subject: 'Profile verification stuck in review for 5 days', user: 'Casey D.', userEmail: 'casey@email.com', category: 'Account', status: 'waiting', priority: 'medium', created: '3 days ago', updated: '1 day ago', assignee: 'Verification Team', messages: 6 },
  { id: 'TKT-4810', subject: 'Mentor session recording missing from library', user: 'Riley S.', userEmail: 'riley@email.com', category: 'Media', status: 'escalated', priority: 'urgent', created: '5 hours ago', updated: '1 hour ago', assignee: 'Engineering', messages: 8 },
  { id: 'TKT-4808', subject: 'Refund not processed after event cancellation', user: 'Morgan L.', userEmail: 'morgan@email.com', category: 'Billing', status: 'resolved', priority: 'high', created: '2 days ago', updated: '4 hours ago', assignee: 'Finance', messages: 5 },
];

const THREAD = [
  { id: 1, author: 'Jordan K.', role: 'user', time: '12 min ago', text: 'I tried to purchase a webinar ticket and my payment failed. Now my account is showing a locked state and I cannot access anything. Please help urgently.' },
  { id: 2, author: 'System', role: 'system', time: '12 min ago', text: 'Ticket auto-created from failed payment event. Payment method: Visa ending 4242. Error code: insufficient_funds.' },
  { id: 3, author: 'M. Chen', role: 'agent', time: '8 min ago', text: 'Hi Jordan, I can see the failed payment attempt. Let me unlock your account right away and investigate the charge. One moment please.' },
];

export default function AdminTicketManagementPage() {
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState<AdminTicket | null>(TICKETS[0]);
  const [reply, setReply] = useState('');
  const [search, setSearch] = useState('');

  const filtered = TICKETS.filter(t => {
    if (tab === 'open') return ['open', 'in-progress', 'escalated'].includes(t.status);
    if (tab === 'waiting') return t.status === 'waiting';
    if (tab === 'resolved') return ['resolved', 'closed'].includes(t.status);
    return true;
  }).filter(t => !search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout topStrip={
      <>
        <Ticket className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Ticket Management</span>
        <div className="flex-1" />
        <div className="relative w-48">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 text-[10px]" />
        </div>
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Filter className="h-3 w-3" /> Filter</Button>
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><RefreshCw className="h-3 w-3" /> Refresh</Button>
      </>
    } rightRail={selected ? (
      <div className="space-y-3">
        <SectionCard title="Ticket Details">
          <div className="space-y-1.5 text-[9px]">
            <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono font-semibold">{selected.id}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">User</span><span className="font-semibold">{selected.user}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-semibold">{selected.userEmail}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{selected.category}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><Badge className={cn('text-[6px] h-3 border-0', selected.priority === 'urgent' ? 'bg-destructive/10 text-destructive' : 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]')}>{selected.priority}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Assignee</span><span>{selected.assignee}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{selected.created}</span></div>
          </div>
        </SectionCard>
        <SectionCard title="Actions">
          <div className="space-y-1.5">
            <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl justify-start gap-1"><User className="h-3 w-3" /> Reassign</Button>
            <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl justify-start gap-1"><ArrowUp className="h-3 w-3" /> Escalate</Button>
            <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl justify-start gap-1"><Tag className="h-3 w-3" /> Add Tag</Button>
            <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl justify-start gap-1"><CheckCircle2 className="h-3 w-3" /> Mark Resolved</Button>
            <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl justify-start gap-1 text-destructive"><XCircle className="h-3 w-3" /> Close</Button>
          </div>
        </SectionCard>
      </div>
    ) : undefined} rightRailWidth="w-52">
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <KPICard label="Total" value={String(TICKETS.length)} />
        <KPICard label="Open" value={String(TICKETS.filter(t => t.status === 'open').length)} />
        <KPICard label="Escalated" value={String(TICKETS.filter(t => t.status === 'escalated').length)} />
        <KPICard label="Avg Response" value="4.2h" />
        <KPICard label="CSAT" value="94%" />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-3">
        <TabsList className="h-7">
          {['all', 'open', 'waiting', 'resolved'].map(t => (
            <TabsTrigger key={t} value={t} className="text-[9px] h-5 px-2 capitalize">{t}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Ticket List */}
        <div className="space-y-1.5">
          {filtered.map(t => (
            <button key={t.id} onClick={() => setSelected(t)} className={cn(
              'w-full p-3 rounded-xl border text-left transition-all',
              selected?.id === t.id ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : 'border-border/30 hover:border-accent/30'
            )}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-mono text-muted-foreground">{t.id}</span>
                <Badge className={cn('text-[6px] h-3 border-0 capitalize', STATUS_CLS[t.status])}>{t.status}</Badge>
                <span className="text-[8px] text-muted-foreground ml-auto">{t.updated}</span>
              </div>
              <div className="text-[10px] font-semibold truncate">{t.subject}</div>
              <div className="text-[8px] text-muted-foreground">{t.user} · {t.category} · {t.messages} msgs</div>
            </button>
          ))}
        </div>

        {/* Thread View */}
        {selected && (
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b">
              <h3 className="text-[11px] font-bold flex-1">{selected.subject}</h3>
              <Badge className={cn('text-[7px] h-3.5 border-0 capitalize', STATUS_CLS[selected.status])}>{selected.status}</Badge>
            </div>
            <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
              {THREAD.map(m => (
                <div key={m.id} className={cn('flex gap-2', m.role === 'system' && 'opacity-60')}>
                  <Avatar className="h-6 w-6 rounded-lg shrink-0">
                    <AvatarFallback className={cn('rounded-lg text-[7px] font-bold',
                      m.role === 'agent' ? 'bg-accent/10 text-accent' : m.role === 'system' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                    )}>{m.role === 'system' ? 'SY' : m.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-semibold">{m.author}</span>
                      <Badge variant="outline" className="text-[6px] h-3 capitalize">{m.role}</Badge>
                      <span className="text-[7px] text-muted-foreground ml-auto">{m.time}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Reply Box */}
            <div className="border-t pt-3">
              <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your reply..." className="min-h-[80px] text-xs mb-2" />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Paperclip className="h-3 w-3" /> Attach</Button>
                <div className="flex-1" />
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl">Internal Note</Button>
                <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Send className="h-3 w-3" /> Reply</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
