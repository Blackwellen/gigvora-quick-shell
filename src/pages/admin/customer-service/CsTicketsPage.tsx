import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, Filter, ArrowRight, Clock } from 'lucide-react';
import { CsBackLink, CsPageHeader, CsPageShell } from './_shared';

interface Ticket {
  id: string; ref: string; subject: string; requester: string; priority: 'low'|'normal'|'high'|'urgent';
  status: 'pending'|'active'|'waiting_customer'|'escalated'|'resolved'; queue: string; assignee?: string; sla: string; updated: string;
}

const TICKETS: Ticket[] = [
  { id: '1', ref: 'CS-9201', subject: 'Refund request for cancelled gig', requester: 'sara.lin@…', priority: 'high', status: 'active', queue: 'Billing', assignee: 'Park', sla: '12m', updated: '2m' },
  { id: '2', ref: 'CS-9200', subject: 'Cannot withdraw — bank verification stuck', requester: 'mike.r@…', priority: 'urgent', status: 'escalated', queue: 'Trust & Safety', assignee: 'Rivera', sla: '−4m', updated: '3m' },
  { id: '3', ref: 'CS-9197', subject: 'Subscription downgrade not applied', requester: 'eva@…', priority: 'normal', status: 'waiting_customer', queue: 'Billing', assignee: 'Lin', sla: '4h', updated: '11m' },
  { id: '4', ref: 'CS-9192', subject: 'Two-factor lockout', requester: 'kai@…', priority: 'high', status: 'pending', queue: 'Account', sla: '28m', updated: '14m' },
  { id: '5', ref: 'CS-9189', subject: 'Project milestone disputed by client', requester: 'dev.t@…', priority: 'high', status: 'escalated', queue: 'Disputes', assignee: 'Chen', sla: '1h 12m', updated: '22m' },
  { id: '6', ref: 'CS-9181', subject: 'Email notifications broken', requester: 'amy@…', priority: 'low', status: 'pending', queue: 'Technical', sla: '6h', updated: '38m' },
  { id: '7', ref: 'CS-9176', subject: 'Profile shadow-banned wrongly', requester: 'leo@…', priority: 'urgent', status: 'escalated', queue: 'Trust & Safety', assignee: 'Park', sla: '−12m', updated: '44m' },
  { id: '8', ref: 'CS-9168', subject: 'Need invoice reissued in EUR', requester: 'aceltd@…', priority: 'normal', status: 'active', queue: 'Billing', assignee: 'Rivera', sla: '2h 40m', updated: '1h' },
];

const PRIORITY_TONE: Record<Ticket['priority'], string> = {
  low: 'bg-muted text-foreground/70',
  normal: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  high: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  urgent: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};
const STATUS_TONE: Record<Ticket['status'], string> = {
  pending: 'bg-muted text-foreground/70',
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  waiting_customer: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  escalated: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  resolved: 'bg-muted text-foreground/60',
};

const CsTicketsPage: React.FC = () => {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all'|'urgent'|'escalated'|'pending'>('all');

  const filtered = TICKETS.filter((t) => {
    if (filter === 'urgent' && t.priority !== 'urgent') return false;
    if (filter === 'escalated' && t.status !== 'escalated') return false;
    if (filter === 'pending' && t.status !== 'pending') return false;
    if (q && !`${t.ref} ${t.subject} ${t.requester}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <CsPageShell>
      <CsBackLink />
      <CsPageHeader eyebrow="Tickets" title="Ticket queue" subtitle="All open tickets across queues. Filter by status, priority, queue, or assignee." />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tickets…" className="pl-8 h-8 text-xs" />
        </div>
        {(['all', 'urgent', 'escalated', 'pending'] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'}
            className="h-8 text-xs capitalize" onClick={() => setFilter(f)}>{f}</Button>
        ))}
        <Button size="sm" variant="outline" className="h-8 text-xs ml-auto"><Filter className="h-3 w-3 mr-1" /> Advanced</Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="grid grid-cols-[100px_1fr_140px_110px_120px_100px_70px_40px] gap-3 px-4 py-2.5 border-b bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <div>Ref</div><div>Subject</div><div>Requester</div><div>Priority</div><div>Status</div><div>Queue</div><div>SLA</div><div></div>
        </div>
        {filtered.map((t) => (
          <Link key={t.id} to={`/admin/cs/tickets/${t.ref}`}
            className="grid grid-cols-[100px_1fr_140px_110px_120px_100px_70px_40px] gap-3 px-4 py-3 border-b last:border-0 items-center hover:bg-muted/30 transition-colors">
            <div className="text-xs font-mono text-muted-foreground">{t.ref}</div>
            <div className="text-sm font-medium truncate">{t.subject}</div>
            <div className="text-xs text-muted-foreground truncate">{t.requester}</div>
            <div><Badge variant="secondary" className={cn('text-[10px] capitalize border-0', PRIORITY_TONE[t.priority])}>{t.priority}</Badge></div>
            <div><Badge variant="secondary" className={cn('text-[10px] capitalize border-0', STATUS_TONE[t.status])}>{t.status.replace('_', ' ')}</Badge></div>
            <div className="text-xs text-muted-foreground">{t.queue}</div>
            <div className={cn('text-xs tabular-nums inline-flex items-center gap-1', t.sla.startsWith('−') ? 'text-rose-600' : 'text-muted-foreground')}>
              <Clock className="h-3 w-3" /> {t.sla}
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        ))}
        {filtered.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No tickets match.</div>}
      </div>
    </CsPageShell>
  );
};

export default CsTicketsPage;
