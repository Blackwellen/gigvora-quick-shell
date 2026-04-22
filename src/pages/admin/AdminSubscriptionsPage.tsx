import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreditCard, Search, Clock, CheckCircle2, ArrowUp, ArrowDown,
  Users, DollarSign, Zap, Star, TrendingUp, RefreshCw, XCircle,
  AlertTriangle, BarChart3, Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Subscription {
  id: string; user: string; plan: string; status: 'active' | 'trialing' | 'past-due' | 'cancelled' | 'expired';
  mrr: string; started: string; nextBilling: string; change?: string;
}

const PLAN_CLS: Record<string, string> = {
  Free: 'bg-muted text-muted-foreground', Professional: 'bg-accent/10 text-accent',
  Business: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]',
  Enterprise: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
};
const STATUS_CLS: Record<string, string> = {
  active: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  trialing: 'bg-accent/10 text-accent',
  'past-due': 'bg-destructive/10 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
  expired: 'bg-muted text-muted-foreground',
};

const SUBS: Subscription[] = [
  { id: 'SUB-1201', user: 'Sarah Chen', plan: 'Professional', status: 'active', mrr: '$29', started: 'Jan 15, 2026', nextBilling: 'May 15, 2026' },
  { id: 'SUB-1198', user: 'DevCraft Studio', plan: 'Business', status: 'active', mrr: '$79', started: 'Dec 1, 2025', nextBilling: 'May 1, 2026', change: 'Upgraded from Pro' },
  { id: 'SUB-1195', user: 'Alex Morgan', plan: 'Professional', status: 'trialing', mrr: '$0', started: 'Apr 10, 2026', nextBilling: 'Apr 24, 2026' },
  { id: 'SUB-1190', user: 'Growth Hackers', plan: 'Enterprise', status: 'active', mrr: '$299', started: 'Nov 1, 2025', nextBilling: 'May 1, 2026' },
  { id: 'SUB-1185', user: 'Jordan K.', plan: 'Professional', status: 'past-due', mrr: '$29', started: 'Feb 1, 2026', nextBilling: 'Overdue - Apr 1' },
  { id: 'SUB-1180', user: 'Lena Müller', plan: 'Professional', status: 'cancelled', mrr: '$0', started: 'Oct 15, 2025', nextBilling: 'Ends Apr 15, 2026', change: 'Downgraded to Free' },
];

export default function AdminSubscriptionsPage() {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = SUBS.filter(s => {
    if (tab !== 'all' && s.status !== tab) return false;
    if (search && !s.user.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <DashboardLayout topStrip={
      <>
        <CreditCard className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Subscription Management</span>
        <div className="flex-1" />
        <div className="relative w-44">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 text-[10px]" />
        </div>
      </>
    } rightRail={
      <div className="space-y-3">
        <SectionCard title="Plan Distribution">
          <div className="space-y-1.5">
            {[{ plan: 'Free', count: 8420, pct: 68 }, { plan: 'Professional', count: 2840, pct: 23 }, { plan: 'Business', count: 890, pct: 7 }, { plan: 'Enterprise', count: 245, pct: 2 }].map(p => (
              <div key={p.plan} className="flex items-center gap-2">
                <Badge className={cn('text-[7px] h-4 w-16 justify-center border-0', PLAN_CLS[p.plan])}>{p.plan}</Badge>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-accent/50 rounded-full" style={{ width: `${p.pct}%` }} /></div>
                <span className="text-[8px] text-muted-foreground w-10 text-right">{p.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Revenue Metrics">
          <div className="space-y-1.5 text-[9px]">
            <div className="flex justify-between"><span className="text-muted-foreground">MRR</span><span className="font-bold text-accent">$128.4K</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">ARR</span><span className="font-bold">$1.54M</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Churn Rate</span><span className="font-bold text-destructive">2.8%</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">ARPU</span><span className="font-bold">$10.34</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Trial→Paid</span><span className="font-bold text-[hsl(var(--state-healthy))]">34%</span></div>
          </div>
        </SectionCard>
      </div>
    } rightRailWidth="w-52">
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <KPICard label="Total Subs" value="12,395" />
        <KPICard label="Active" value="11,550" />
        <KPICard label="Trialing" value="245" />
        <KPICard label="Past Due" value="82" />
        <KPICard label="MRR" value="$128.4K" />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-3">
        <TabsList className="h-7">
          {['all', 'active', 'trialing', 'past-due', 'cancelled'].map(t => (
            <TabsTrigger key={t} value={t} className="text-[9px] h-5 px-2 capitalize">{t.replace('-', ' ')}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {filtered.map(s => (
          <div key={s.id} className="p-4 rounded-2xl border border-border/30 bg-card hover:border-accent/30 transition-all">
            <div className="flex items-center gap-3">
              <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', PLAN_CLS[s.plan])}>
                <Crown className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{s.user}</span>
                  <Badge className={cn('text-[7px] h-3.5 border-0', PLAN_CLS[s.plan])}>{s.plan}</Badge>
                  <Badge className={cn('text-[7px] h-3.5 border-0 capitalize', STATUS_CLS[s.status])}>{s.status.replace('-', ' ')}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                  <span className="font-mono">{s.id}</span>
                  <span>MRR: <strong className="text-foreground">{s.mrr}</strong></span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> Next: {s.nextBilling}</span>
                  {s.change && <Badge variant="outline" className="text-[6px] h-3">{s.change}</Badge>}
                </div>
              </div>
              <div className="flex gap-1">
                {s.status === 'past-due' && <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><RefreshCw className="h-3 w-3" /> Retry</Button>}
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl">Manage</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
