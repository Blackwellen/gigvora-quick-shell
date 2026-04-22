import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Sparkles, Plus, Eye, Users, TrendingUp, Zap, Clock,
  Settings, RefreshCw, BarChart3, Target, Building2,
} from 'lucide-react';

interface SmartList {
  id: string; name: string; criteria: string; count: number; newThisWeek: number;
  lastRefresh: string; conversion: string; status: 'active' | 'paused';
}

const SMART_LISTS: SmartList[] = [
  { id: 'SM-1', name: 'High-Intent CTOs', criteria: 'CTO/VP Eng at Series B+ · Hiring signals · 2nd degree', count: 34, newThisWeek: 6, lastRefresh: '1h ago', conversion: '18%', status: 'active' },
  { id: 'SM-2', name: 'Expanding FinTech', criteria: 'FinTech companies · 100+ employees · Funding or expansion signals', count: 18, newThisWeek: 3, lastRefresh: '3h ago', conversion: '24%', status: 'active' },
  { id: 'SM-3', name: 'Design Leaders West Coast', criteria: 'VP/Director Design · SF/LA/Seattle · Active last 7d', count: 12, newThisWeek: 2, lastRefresh: '6h ago', conversion: '15%', status: 'active' },
  { id: 'SM-4', name: 'Enterprise Buyers', criteria: 'VP+ at 1K+ companies · Buying signals · Service interest', count: 28, newThisWeek: 4, lastRefresh: '2h ago', conversion: '22%', status: 'active' },
  { id: 'SM-5', name: 'ML Talent Pipeline', criteria: 'ML/AI Engineers · Open to work · 5+ yrs experience', count: 21, newThisWeek: 8, lastRefresh: '30m ago', conversion: '31%', status: 'active' },
  { id: 'SM-6', name: 'Churned Accounts Revival', criteria: 'Former clients · New funding or hiring signals', count: 9, newThisWeek: 1, lastRefresh: '1d ago', conversion: '12%', status: 'paused' },
];

const NavigatorSmartListsPage: React.FC = () => {
  const topStrip = (
    <>
      <Sparkles className="h-4 w-4 text-[hsl(var(--state-healthy))]" />
      <span className="text-xs font-semibold">Navigator — Smart Lists</span>
      <Badge className="bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] text-[7px] border-0">AI-Powered</Badge>
      <div className="flex-1" />
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />Create Smart List</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Smart List Stats" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {[
            { l: 'Active Lists', v: String(SMART_LISTS.filter(l => l.status === 'active').length) },
            { l: 'Total Matches', v: String(SMART_LISTS.reduce((s, l) => s + l.count, 0)) },
            { l: 'New This Week', v: String(SMART_LISTS.reduce((s, l) => s + l.newThisWeek, 0)) },
            { l: 'Avg Conversion', v: '20%' },
          ].map(s => (
            <div key={s.l} className="flex justify-between py-1 border-b last:border-0">
              <span className="text-muted-foreground">{s.l}</span>
              <span className="font-semibold">{s.v}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Active Smart Lists" value={String(SMART_LISTS.filter(l => l.status === 'active').length)} className="!rounded-2xl" />
        <KPICard label="Total Matches" value={String(SMART_LISTS.reduce((s, l) => s + l.count, 0))} className="!rounded-2xl" />
        <KPICard label="New This Week" value={String(SMART_LISTS.reduce((s, l) => s + l.newThisWeek, 0))} trend="up" className="!rounded-2xl" />
        <KPICard label="Avg Conversion" value="20%" change="+3%" trend="up" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {SMART_LISTS.map(l => (
          <div key={l.id} className="rounded-2xl border bg-card p-4 hover:shadow-md cursor-pointer transition-all group">
            <div className="flex items-start gap-3">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', l.status === 'active' ? 'bg-[hsl(var(--state-healthy))]/10' : 'bg-muted')}>
                <Sparkles className={cn('h-4 w-4', l.status === 'active' ? 'text-[hsl(var(--state-healthy))]' : 'text-muted-foreground')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold group-hover:text-accent transition-colors">{l.name}</span>
                  <Badge variant={l.status === 'active' ? 'default' : 'secondary'} className="text-[7px] capitalize">{l.status}</Badge>
                  {l.newThisWeek > 0 && <Badge className="bg-accent/10 text-accent text-[7px] border-0">+{l.newThisWeek} new</Badge>}
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{l.criteria}</div>
                <div className="flex items-center gap-3 mt-1.5 text-[8px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{l.count} matches</span>
                  <span className="flex items-center gap-0.5"><RefreshCw className="h-2.5 w-2.5" />Refreshed {l.lastRefresh}</span>
                  <span className="flex items-center gap-0.5"><Target className="h-2.5 w-2.5" />{l.conversion} conversion</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Eye className="h-2.5 w-2.5" />View</Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Settings className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default NavigatorSmartListsPage;
