import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { CsBackLink, CsPageHeader, CsPageShell } from './_shared';

const KPIS = [
  { label: 'Tickets (7d)', value: '1,284', delta: '+8.4%', positive: true },
  { label: 'Avg first response', value: '6m 14s', delta: '−42s', positive: true },
  { label: 'Avg resolution', value: '4h 22m', delta: '−18m', positive: true },
  { label: 'CSAT (7d)', value: '4.62 / 5', delta: '+0.08', positive: true },
  { label: 'Reopen rate', value: '6.8%', delta: '+0.4pp', positive: false },
  { label: 'SLA breach rate', value: '2.1%', delta: '−0.3pp', positive: true },
];

const VOLUME = [120, 142, 168, 134, 198, 220, 184, 156, 178, 204, 232, 210, 188, 244];

const QUEUES = [
  { name: 'Billing', open: 64, sla: '99.1%' },
  { name: 'Account', open: 41, sla: '98.4%' },
  { name: 'Technical', open: 32, sla: '99.6%' },
  { name: 'Trust & Safety', open: 18, sla: '96.2%' },
  { name: 'Disputes', open: 14, sla: '97.0%' },
  { name: 'Enterprise', open: 9, sla: '99.8%' },
];

const AGENTS = [
  { name: 'Park', resolved: 38, csat: 4.78, response: '4m 12s' },
  { name: 'Lin', resolved: 34, csat: 4.71, response: '5m 04s' },
  { name: 'Rivera', resolved: 31, csat: 4.66, response: '6m 38s' },
  { name: 'Chen', resolved: 28, csat: 4.62, response: '7m 11s' },
  { name: 'Kim', resolved: 24, csat: 4.55, response: '8m 02s' },
];

const CsAnalyticsPage: React.FC = () => (
  <CsPageShell>
    <CsBackLink />
    <CsPageHeader eyebrow="Stats & Analytics" title="Customer service performance" subtitle="Volume, response, CSAT, queue and agent leaderboards (last 7 days)." />

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {KPIS.map((k) => (
        <div key={k.label} className="rounded-xl border bg-card p-4">
          <div className="text-xl font-semibold tracking-tight tabular-nums">{k.value}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{k.label}</div>
          <div className={cn('mt-1 text-[10px] inline-flex items-center gap-0.5 tabular-nums',
            k.positive ? 'text-emerald-600' : 'text-rose-600')}>
            {k.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {k.delta}
          </div>
        </div>
      ))}
    </div>

    <div className="rounded-xl border bg-card p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-2"><BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Ticket volume — last 14 days</h3></div>
        <Badge variant="secondary" className="text-[10px] border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Trending up</Badge>
      </div>
      <div className="flex items-end gap-1.5 h-32">
        {VOLUME.map((v, i) => (
          <div key={i} className="flex-1 bg-primary/70 rounded-sm hover:bg-primary transition-colors" style={{ height: `${(v / 244) * 100}%` }} title={`${v} tickets`} />
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-3 border-b bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Queues</div>
        <div className="divide-y">
          {QUEUES.map((q) => (
            <div key={q.name} className="p-3 grid grid-cols-[1fr_80px_80px] gap-3 items-center text-sm">
              <div className="font-medium">{q.name}</div>
              <div className="text-xs text-muted-foreground tabular-nums text-right">{q.open} open</div>
              <div className="text-xs tabular-nums text-right text-emerald-600">{q.sla}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-3 border-b bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Agent leaderboard</div>
        <div className="divide-y">
          {AGENTS.map((a, i) => (
            <div key={a.name} className="p-3 grid grid-cols-[24px_1fr_70px_60px_80px] gap-3 items-center text-sm">
              <div className="text-xs text-muted-foreground tabular-nums">#{i + 1}</div>
              <div className="font-medium">{a.name}</div>
              <div className="text-xs text-muted-foreground tabular-nums text-right">{a.resolved}</div>
              <div className="text-xs tabular-nums text-right">{a.csat}</div>
              <div className="text-xs text-muted-foreground tabular-nums text-right">{a.response}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </CsPageShell>
);

export default CsAnalyticsPage;
