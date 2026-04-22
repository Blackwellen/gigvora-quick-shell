import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Ticket, Search, Clock, CheckCircle2, MessageSquare,
  ChevronRight, ArrowRight, Plus, ArrowUp, AlertCircle,
  FileText, Calendar, Shield, Loader2, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TicketStatus = 'open' | 'in-progress' | 'waiting' | 'resolved' | 'escalated' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

interface TicketItem {
  id: string; subject: string; category: string; status: TicketStatus;
  priority: TicketPriority; created: string; updated: string;
  messages: number; assignee?: string; linkedObject?: string;
}

const STATUS_MAP: Record<TicketStatus, { cls: string; icon: React.ElementType }> = {
  open: { cls: 'bg-accent/10 text-accent', icon: AlertCircle },
  'in-progress': { cls: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]', icon: Loader2 },
  waiting: { cls: 'bg-muted text-muted-foreground', icon: Clock },
  resolved: { cls: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]', icon: CheckCircle2 },
  escalated: { cls: 'bg-destructive/10 text-destructive', icon: ArrowUp },
  closed: { cls: 'bg-muted text-muted-foreground', icon: XCircle },
};

const PRIORITY_MAP: Record<TicketPriority, { cls: string }> = {
  low: { cls: 'text-muted-foreground' },
  medium: { cls: 'text-[hsl(var(--gigvora-amber))]' },
  high: { cls: 'text-[hsl(var(--state-live))]' },
  urgent: { cls: 'text-destructive' },
};

const TICKETS: TicketItem[] = [
  { id: 'TKT-2026-0142', subject: 'Payment failed for webinar registration', category: 'Billing', status: 'in-progress', priority: 'high', created: 'Apr 12', updated: '2 hours ago', messages: 4, assignee: 'Support Team', linkedObject: 'Webinar #WBN-042' },
  { id: 'TKT-2026-0138', subject: 'Cannot access premium content after upgrade', category: 'Access', status: 'open', priority: 'medium', created: 'Apr 10', updated: '1 day ago', messages: 2, linkedObject: 'Subscription' },
  { id: 'TKT-2026-0135', subject: 'Profile verification stuck in review', category: 'Account', status: 'waiting', priority: 'low', created: 'Apr 8', updated: '3 days ago', messages: 3, assignee: 'Verification Team' },
  { id: 'TKT-2026-0130', subject: 'Mentor session recording missing', category: 'Media', status: 'escalated', priority: 'urgent', created: 'Apr 5', updated: '5 hours ago', messages: 7, assignee: 'Engineering', linkedObject: 'Session #MTR-089' },
  { id: 'TKT-2026-0125', subject: 'Group invite link expired prematurely', category: 'Community', status: 'resolved', priority: 'medium', created: 'Apr 2', updated: 'Apr 9', messages: 5, assignee: 'Support Team' },
  { id: 'TKT-2026-0120', subject: 'Refund request for cancelled event', category: 'Billing', status: 'resolved', priority: 'high', created: 'Mar 28', updated: 'Apr 3', messages: 6, assignee: 'Finance', linkedObject: 'Event #EVT-015' },
  { id: 'TKT-2026-0115', subject: 'Two-factor authentication issue', category: 'Security', status: 'closed', priority: 'high', created: 'Mar 25', updated: 'Mar 28', messages: 4, assignee: 'Security Team' },
  { id: 'TKT-2026-0110', subject: 'Job application status not updating', category: 'Jobs', status: 'closed', priority: 'low', created: 'Mar 20', updated: 'Mar 24', messages: 3 },
];

export default function MyTicketsPage() {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = TICKETS.filter(t => {
    if (tab === 'active') return ['open', 'in-progress', 'waiting', 'escalated'].includes(t.status);
    if (tab === 'resolved') return ['resolved', 'closed'].includes(t.status);
    if (tab !== 'all' && t.status !== tab) return false;
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Quick Actions">
        <div className="space-y-1.5">
          <Link to="/help/submit"><Button size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><Plus className="h-3 w-3" /> New Ticket</Button></Link>
          <Link to="/help"><Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><FileText className="h-3 w-3" /> Help Center</Button></Link>
          <Link to="/help/search"><Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><Search className="h-3 w-3" /> Search Articles</Button></Link>
          <Link to="/help/escalations"><Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start text-destructive"><ArrowUp className="h-3 w-3" /> Escalations</Button></Link>
        </div>
      </SectionCard>
      <SectionCard title="Avg. Response Time">
        <div className="text-center py-2">
          <div className="text-2xl font-bold text-accent">4.2h</div>
          <div className="text-[9px] text-muted-foreground">First response</div>
          <div className="text-xl font-bold mt-2">1.8d</div>
          <div className="text-[9px] text-muted-foreground">Resolution time</div>
        </div>
      </SectionCard>
      <SectionCard title="Need Urgent Help?">
        <p className="text-[9px] text-muted-foreground mb-2">For critical account or payment issues, escalate directly.</p>
        <Link to="/help/escalations"><Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1"><Shield className="h-3 w-3" /> Open Escalation</Button></Link>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={
      <>
        <Ticket className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">My Support Tickets</span>
        <div className="flex-1" />
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 text-[10px]" />
        </div>
        <Link to="/help/submit"><Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Plus className="h-3 w-3" /> New Ticket</Button></Link>
      </>
    } rightRail={rightRail} rightRailWidth="w-52">
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <KPICard label="Total Tickets" value={String(TICKETS.length)} />
        <KPICard label="Active" value={String(TICKETS.filter(t => ['open', 'in-progress', 'waiting', 'escalated'].includes(t.status)).length)} />
        <KPICard label="Resolved" value={String(TICKETS.filter(t => t.status === 'resolved').length)} />
        <KPICard label="Escalated" value={String(TICKETS.filter(t => t.status === 'escalated').length)} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-7">
          {['all', 'active', 'open', 'in-progress', 'escalated', 'resolved'].map(t => (
            <TabsTrigger key={t} value={t} className="text-[9px] h-5 px-2 capitalize">{t.replace('-', ' ')}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {filtered.map(t => {
          const st = STATUS_MAP[t.status];
          const pr = PRIORITY_MAP[t.priority];
          const StIcon = st.icon;
          return (
            <Link key={t.id} to={`/help/tickets/${t.id}`} className="block">
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-border/30 hover:border-accent/30 transition-all group bg-card">
                <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', st.cls)}>
                  <StIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-bold truncate group-hover:text-accent transition-colors">{t.subject}</span>
                    <Badge className={cn('text-[7px] h-3.5 border-0 capitalize', st.cls)}>{t.status.replace('-', ' ')}</Badge>
                    <Badge variant="outline" className={cn('text-[7px] h-3.5 capitalize', pr.cls)}>{t.priority}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                    <span className="font-mono">{t.id}</span>
                    <span>{t.category}</span>
                    <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{t.created}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{t.updated}</span>
                    <span className="flex items-center gap-0.5"><MessageSquare className="h-2.5 w-2.5" />{t.messages}</span>
                    {t.assignee && <span className="text-foreground font-medium">→ {t.assignee}</span>}
                    {t.linkedObject && <Badge variant="outline" className="text-[6px] h-3">{t.linkedObject}</Badge>}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-accent transition-colors shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
