import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  DollarSign, Settings, TrendingUp, Target, BarChart3, Clock,
  Zap, AlertTriangle, ChevronRight, Edit,
} from 'lucide-react';

interface BidRule {
  id: string; name: string; strategy: string; maxBid: string;
  dailyBudget: string; lifetimeBudget: string; pacing: 'standard' | 'accelerated';
  status: 'active' | 'paused'; performance: string;
}

const BID_RULES: BidRule[] = [
  { id: 'BR-1', name: 'Q2 Brand — Auto Bid', strategy: 'Lowest Cost', maxBid: 'Auto', dailyBudget: '$167', lifetimeBudget: '$5,000', pacing: 'standard', status: 'active', performance: 'CPC $0.73 — below target' },
  { id: 'BR-2', name: 'Recruiter Pro — Target CPA', strategy: 'Target CPA', maxBid: '$40', dailyBudget: '$267', lifetimeBudget: '$8,000', pacing: 'standard', status: 'active', performance: 'CPA $33.50 — exceeding target' },
  { id: 'BR-3', name: 'Retargeting — Max Clicks', strategy: 'Max Clicks', maxBid: '$1.50', dailyBudget: '$100', lifetimeBudget: '$3,000', pacing: 'accelerated', status: 'paused', performance: 'CPC $1.00 — at cap' },
  { id: 'BR-4', name: 'Enterprise ABM — ROAS', strategy: 'Target ROAS', maxBid: '$5.00', dailyBudget: '$400', lifetimeBudget: '$12,000', pacing: 'standard', status: 'active', performance: 'ROAS 4.8x — above target' },
];

const AdsBidBudgetPage: React.FC = () => {
  const topStrip = (
    <>
      <DollarSign className="h-4 w-4 text-[hsl(var(--gigvora-amber))]" />
      <span className="text-xs font-semibold">Ads — Bid & Budget Controls</span>
      <div className="flex-1" />
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Settings className="h-3 w-3" />Global Rules</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Budget Allocation" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div><div className="flex justify-between mb-0.5"><span>Monthly Total</span><span className="font-semibold">$28,000</span></div><Progress value={66} className="h-1" /></div>
          <div><div className="flex justify-between mb-0.5"><span>Spent MTD</span><span className="font-semibold">$18,460</span></div></div>
          <div><div className="flex justify-between mb-0.5"><span>Remaining</span><span className="font-semibold text-[hsl(var(--state-healthy))]">$9,540</span></div></div>
        </div>
      </SectionCard>
      <SectionCard title="Strategies" className="!rounded-2xl">
        <div className="space-y-1 text-[9px] text-muted-foreground">
          <div><span className="font-medium text-foreground">Lowest Cost</span> — auto-optimize for cheapest results</div>
          <div><span className="font-medium text-foreground">Target CPA</span> — maintain specific cost per action</div>
          <div><span className="font-medium text-foreground">Target ROAS</span> — optimize for return on ad spend</div>
          <div><span className="font-medium text-foreground">Max Clicks</span> — maximize clicks within budget</div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52">
      <KPIBand className="mb-3">
        <KPICard label="Active Rules" value={String(BID_RULES.filter(r => r.status === 'active').length)} className="!rounded-2xl" />
        <KPICard label="Monthly Budget" value="$28K" className="!rounded-2xl" />
        <KPICard label="Avg CPC" value="$0.91" change="-$0.12" trend="up" className="!rounded-2xl" />
        <KPICard label="Budget Util." value="66%" change="On pace" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {BID_RULES.map(r => (
          <div key={r.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('h-2.5 w-2.5 rounded-full', r.status === 'active' ? 'bg-[hsl(var(--state-healthy))] animate-pulse' : 'bg-muted-foreground/30')} />
              <span className="text-[12px] font-bold">{r.name}</span>
              <Badge variant="secondary" className="text-[7px]">{r.strategy}</Badge>
              <div className="flex-1" />
              <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Edit className="h-2.5 w-2.5" />Edit</Button>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center text-[9px]">
              {[
                { l: 'Max Bid', v: r.maxBid },
                { l: 'Daily Budget', v: r.dailyBudget },
                { l: 'Lifetime Budget', v: r.lifetimeBudget },
                { l: 'Pacing', v: r.pacing },
                { l: 'Status', v: r.status },
              ].map(m => (
                <div key={m.l} className="rounded-xl bg-muted/30 p-2">
                  <div className="text-[10px] font-bold capitalize">{m.v}</div>
                  <div className="text-[7px] text-muted-foreground">{m.l}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t flex items-center gap-1.5 text-[9px]">
              <Zap className="h-3 w-3 text-accent" />
              <span className="text-muted-foreground">{r.performance}</span>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdsBidBudgetPage;
