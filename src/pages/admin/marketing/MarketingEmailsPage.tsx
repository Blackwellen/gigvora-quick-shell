import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Plus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const TEMPLATES = [
  { id: 'tpl-001', name: 'Welcome — new buyer', sent: 8420, openRate: 62.4, clickRate: 18.2, status: 'active' },
  { id: 'tpl-002', name: 'Welcome — new seller', sent: 4280, openRate: 71.8, clickRate: 24.1, status: 'active' },
  { id: 'tpl-003', name: 'Spring promo announcement', sent: 142800, openRate: 28.4, clickRate: 4.2, status: 'active' },
  { id: 'tpl-004', name: 'Reactivate dormant — 30d', sent: 6420, openRate: 14.2, clickRate: 2.1, status: 'paused' },
  { id: 'tpl-005', name: 'Q2 product update', sent: 89200, openRate: 38.4, clickRate: 6.8, status: 'active' },
];

const RECENT = [
  { id: 'em-9201', recipient: 'a***@gmail.com', template: 'Spring promo announcement', status: 'delivered', time: '2m ago' },
  { id: 'em-9200', recipient: 'm***@outlook.com', template: 'Welcome — new buyer', status: 'delivered', time: '4m ago' },
  { id: 'em-9199', recipient: 'p***@company.io', template: 'Q2 product update', status: 'delivered', time: '6m ago' },
  { id: 'em-9198', recipient: 's***@example.com', template: 'Spring promo announcement', status: 'bounced', time: '8m ago' },
  { id: 'em-9197', recipient: 'k***@gmail.com', template: 'Welcome — new seller', status: 'delivered', time: '12m ago' },
];

const STATUS = {
  delivered: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  bounced: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  paused: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
};

const MarketingEmailsPage: React.FC = () => (
  <div className="mx-auto w-full max-w-[1500px] px-8 py-8">
    <Link to="/admin/marketing" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
      <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketing
    </Link>
    <div className="flex items-end justify-between gap-6 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"><Mail className="h-3.5 w-3.5" /> Marketing · Email Console</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Email console</h1>
        <p className="mt-1 text-sm text-muted-foreground">Outbound campaign & transactional templates with deliverability stats.</p>
      </div>
      <Button><Plus className="h-4 w-4 mr-1.5" /> New template</Button>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: 'Sent today', value: '23,184' },
        { label: 'Avg. open rate', value: '38.2%' },
        { label: 'Avg. click rate', value: '8.4%' },
        { label: 'Bounce rate', value: '0.8%' },
      ].map((k) => (
        <div key={k.label} className="rounded-xl border bg-card p-4">
          <div className="text-2xl font-semibold tabular-nums">{k.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b text-sm font-semibold">Active templates</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Template</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Sent</th>
              <th className="text-right px-4 py-3">Open</th>
              <th className="text-right px-4 py-3">Click</th>
              <th className="px-2"></th>
            </tr>
          </thead>
          <tbody>
            {TEMPLATES.map((t) => (
              <tr key={t.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{t.id}</div>
                </td>
                <td className="px-4 py-3"><Badge variant="outline" className={cn('text-[10px] capitalize border-0', STATUS[t.status as keyof typeof STATUS])}>{t.status}</Badge></td>
                <td className="px-4 py-3 text-right tabular-nums">{t.sent.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{t.openRate.toFixed(1)}%</td>
                <td className="px-4 py-3 text-right tabular-nums">{t.clickRate.toFixed(1)}%</td>
                <td className="px-2 py-3"><Button variant="ghost" size="sm"><ExternalLink className="h-3.5 w-3.5" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b text-sm font-semibold">Recent sends</div>
        <div className="divide-y">
          {RECENT.map((r) => (
            <div key={r.id} className="p-3.5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono text-muted-foreground">{r.id}</span>
                <Badge variant="outline" className={cn('text-[10px] capitalize border-0', STATUS[r.status as keyof typeof STATUS])}>{r.status}</Badge>
              </div>
              <div className="text-sm">{r.recipient}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{r.template} · {r.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default MarketingEmailsPage;
