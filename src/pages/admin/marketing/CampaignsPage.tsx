/**
 * Marketing Campaigns — internal & external campaign records.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Megaphone, Search, Plus, ArrowLeft, TrendingUp, Calendar,
  DollarSign, Target, MoreHorizontal,
} from 'lucide-react';

type CampaignStatus = 'live' | 'scheduled' | 'paused' | 'ended' | 'draft';
type CampaignType = 'internal' | 'paid_acquisition' | 'lifecycle' | 'partner';

interface Campaign {
  id: string; name: string; type: CampaignType; status: CampaignStatus;
  owner: string; budget: number; spent: number; impressions: number;
  clicks: number; conversions: number; ctr: number; cpa: number;
  startDate: string; endDate: string;
}

const CAMPAIGNS: Campaign[] = [
  { id: 'C-1201', name: 'Spring Hiring Surge', type: 'paid_acquisition', status: 'live', owner: 'Lin Park', budget: 12000, spent: 8420, impressions: 482000, clicks: 14820, conversions: 614, ctr: 3.07, cpa: 13.71, startDate: 'Mar 12', endDate: 'Apr 30' },
  { id: 'C-1200', name: 'New Designer Onboarding', type: 'lifecycle', status: 'live', owner: 'Maya Chen', budget: 4500, spent: 3110, impressions: 89000, clicks: 4220, conversions: 891, ctr: 4.74, cpa: 3.49, startDate: 'Mar 01', endDate: 'Ongoing' },
  { id: 'C-1199', name: 'Enterprise Sales Q2', type: 'paid_acquisition', status: 'live', owner: 'Marcus Rivera', budget: 28000, spent: 11340, impressions: 184000, clicks: 5210, conversions: 142, ctr: 2.83, cpa: 79.86, startDate: 'Apr 01', endDate: 'Jun 30' },
  { id: 'C-1198', name: 'Reactivate Dormant Sellers', type: 'lifecycle', status: 'scheduled', owner: 'Sarah Kim', budget: 2800, spent: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0, cpa: 0, startDate: 'Apr 22', endDate: 'May 22' },
  { id: 'C-1197', name: 'AI Tools Launch', type: 'internal', status: 'live', owner: 'Priya Patel', budget: 8000, spent: 4920, impressions: 142000, clicks: 7800, conversions: 1240, ctr: 5.49, cpa: 3.97, startDate: 'Apr 08', endDate: 'May 08' },
  { id: 'C-1196', name: 'Partner Co-marketing — Stripe', type: 'partner', status: 'live', owner: 'Marcus Rivera', budget: 6000, spent: 2400, impressions: 38000, clicks: 1820, conversions: 78, ctr: 4.79, cpa: 30.77, startDate: 'Apr 10', endDate: 'May 10' },
  { id: 'C-1195', name: 'Winter Holiday Promo', type: 'paid_acquisition', status: 'ended', owner: 'Lin Park', budget: 18000, spent: 17840, impressions: 612000, clicks: 22400, conversions: 1840, ctr: 3.66, cpa: 9.70, startDate: 'Dec 01', endDate: 'Dec 31' },
  { id: 'C-1194', name: 'Mobile App Beta', type: 'internal', status: 'paused', owner: 'Alex Kim', budget: 3000, spent: 1240, impressions: 42000, clicks: 1680, conversions: 320, ctr: 4.00, cpa: 3.88, startDate: 'Mar 20', endDate: 'Apr 20' },
];

const STATUS_BADGE: Record<CampaignStatus, string> = {
  live: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  scheduled: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  paused: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  ended: 'bg-muted text-muted-foreground',
  draft: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
};

const CampaignsPage: React.FC = () => {
  const [tab, setTab] = useState<'all' | CampaignStatus>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return CAMPAIGNS
      .filter((c) => tab === 'all' || c.status === tab)
      .filter((c) => !query || c.name.toLowerCase().includes(query.toLowerCase()));
  }, [tab, query]);

  const totals = {
    spend: filtered.reduce((s, c) => s + c.spent, 0),
    conversions: filtered.reduce((s, c) => s + c.conversions, 0),
    impressions: filtered.reduce((s, c) => s + c.impressions, 0),
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-8 py-8">
      <Link to="/admin/marketing" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketing
      </Link>

      <div className="flex items-end justify-between gap-6 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Megaphone className="h-3.5 w-3.5" /> Marketing · Campaigns
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Active campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">All internal and external campaign records, budgets, and performance.</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-1.5" /> New campaign</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Megaphone, label: 'Active campaigns', value: CAMPAIGNS.filter((c) => c.status === 'live').length },
          { icon: DollarSign, label: 'Total spend (filtered)', value: `£${totals.spend.toLocaleString()}` },
          { icon: Target, label: 'Conversions (filtered)', value: totals.conversions.toLocaleString() },
          { icon: TrendingUp, label: 'Impressions (filtered)', value: `${(totals.impressions / 1000).toFixed(1)}K` },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-xl border bg-card p-4">
              <Icon className="h-4 w-4 text-muted-foreground mb-2" />
              <div className="text-xl font-semibold tabular-nums">{k.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
            </div>
          );
        })}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="live">Live</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
            <TabsTrigger value="ended">Ended</TabsTrigger>
          </TabsList>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search campaigns" className="pl-9 h-9" />
          </div>
        </div>

        <TabsContent value={tab} className="mt-0">
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Campaign</th>
                  <th className="text-left px-4 py-3">Owner</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Spend / Budget</th>
                  <th className="text-right px-4 py-3">Impr.</th>
                  <th className="text-right px-4 py-3">CTR</th>
                  <th className="text-right px-4 py-3">Conv.</th>
                  <th className="text-right px-4 py-3">CPA</th>
                  <th className="text-left px-4 py-3">Schedule</th>
                  <th className="px-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={10} className="px-4 py-12 text-center text-muted-foreground text-sm">No campaigns match.</td></tr>
                )}
                {filtered.map((c) => {
                  const pct = c.budget > 0 ? (c.spent / c.budget) * 100 : 0;
                  return (
                    <tr key={c.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground font-mono capitalize">{c.id} · {c.type.replace('_', ' ')}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{c.owner}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className={cn('text-[10px] capitalize border-0', STATUS_BADGE[c.status])}>{c.status}</Badge></td>
                      <td className="px-4 py-3 min-w-[180px]">
                        <div className="text-sm tabular-nums">£{c.spent.toLocaleString()} <span className="text-muted-foreground">/ £{c.budget.toLocaleString()}</span></div>
                        <Progress value={pct} className="h-1 mt-1.5" />
                      </td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums">{(c.impressions / 1000).toFixed(1)}K</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums">{c.ctr.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums">{c.conversions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums">{c.cpa > 0 ? `£${c.cpa.toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground"><Calendar className="h-3 w-3 inline mr-1" />{c.startDate} → {c.endDate}</td>
                      <td className="px-2 py-3"><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignsPage;
