import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  BarChart3, TrendingUp, Users, Mail, Target, DollarSign, CheckCircle2,
  ArrowUpRight, Clock, Star, Eye, Calendar,
} from 'lucide-react';

const NavigatorAnalyticsPage: React.FC = () => {
  const topStrip = (
    <>
      <BarChart3 className="h-4 w-4 text-[hsl(var(--gigvora-purple))]" />
      <span className="text-xs font-semibold">Navigator — Analytics</span>
      <div className="flex-1" />
      <select className="h-7 rounded-xl border bg-background px-2 text-[9px]">
        <option>Last 30 Days</option>
        <option>Last 90 Days</option>
        <option>This Quarter</option>
        <option>This Year</option>
      </select>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Performance Score" className="!rounded-2xl">
        <div className="text-center">
          <div className="text-3xl font-bold text-accent">87</div>
          <div className="text-[9px] text-muted-foreground">Navigator Health Score</div>
          <Progress value={87} className="h-1.5 mt-2" />
        </div>
      </SectionCard>
      <SectionCard title="Benchmarks" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[
            { l: 'Reply Rate', yours: '31%', avg: '18%', better: true },
            { l: 'Acceptance', yours: '42%', avg: '35%', better: true },
            { l: 'Conversion', yours: '18%', avg: '22%', better: false },
            { l: 'Avg Deal Size', yours: '$20.4K', avg: '$15K', better: true },
          ].map(b => (
            <div key={b.l} className="flex justify-between py-1 border-b last:border-0">
              <span className="text-muted-foreground">{b.l}</span>
              <div className="flex gap-2">
                <span className={cn('font-semibold', b.better ? 'text-[hsl(var(--state-healthy))]' : 'text-[hsl(var(--gigvora-amber))]')}>{b.yours}</span>
                <span className="text-muted-foreground/50">{b.avg}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52">
      <KPIBand className="mb-4">
        <KPICard label="Pipeline Value" value="$245K" change="+18%" trend="up" className="!rounded-2xl" />
        <KPICard label="Closed Won" value="$89K" change="This quarter" className="!rounded-2xl" />
        <KPICard label="Win Rate" value="32%" change="+4%" trend="up" className="!rounded-2xl" />
        <KPICard label="Avg Deal Time" value="12 days" change="-3 days" trend="up" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Pipeline Funnel */}
        <SectionCard title="Pipeline Funnel" className="!rounded-2xl">
          <div className="space-y-2">
            {[
              { stage: 'Prospects', count: 156, value: '$245K', pct: 100 },
              { stage: 'Qualified', count: 43, value: '$120K', pct: 49 },
              { stage: 'Proposal', count: 18, value: '$78K', pct: 32 },
              { stage: 'Negotiation', count: 8, value: '$45K', pct: 18 },
              { stage: 'Closed Won', count: 5, value: '$89K', pct: 36 },
            ].map(s => (
              <div key={s.stage}>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="font-medium">{s.stage}</span>
                  <span className="text-muted-foreground">{s.count} · {s.value}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-accent rounded-full transition-all" style={{ width: `${s.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Outreach Metrics */}
        <SectionCard title="Outreach Performance" className="!rounded-2xl">
          <div className="grid grid-cols-2 gap-2">
            {[
              { l: 'Sent', v: '248', icon: Mail },
              { l: 'Opened', v: '138 (56%)', icon: Eye },
              { l: 'Replied', v: '59 (24%)', icon: CheckCircle2 },
              { l: 'Meetings', v: '19 (8%)', icon: Calendar },
            ].map(m => (
              <div key={m.l} className="rounded-xl bg-muted/30 p-2.5 text-center">
                <m.icon className="h-4 w-4 mx-auto text-accent mb-1" />
                <div className="text-sm font-bold">{m.v}</div>
                <div className="text-[8px] text-muted-foreground">{m.l}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* List Conversion */}
        <SectionCard title="List Conversion Rates" className="!rounded-2xl">
          <div className="space-y-1.5">
            {[
              { name: 'Q2 Target CTOs', sent: 24, replied: 8, meetings: 3 },
              { name: 'FinTech Hiring Signals', sent: 18, replied: 5, meetings: 2 },
              { name: 'Enterprise Prospects', sent: 42, replied: 14, meetings: 5 },
              { name: 'Warm Intros Pipeline', sent: 11, replied: 6, meetings: 4 },
            ].map(l => (
              <div key={l.name} className="rounded-xl border p-2.5">
                <div className="text-[10px] font-semibold mb-1">{l.name}</div>
                <div className="flex gap-2 text-[9px]">
                  <span className="text-muted-foreground">Sent: {l.sent}</span>
                  <span className="text-accent">Replied: {l.replied} ({Math.round(l.replied / l.sent * 100)}%)</span>
                  <span className="text-[hsl(var(--state-healthy))]">Meetings: {l.meetings}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Revenue Attribution */}
        <SectionCard title="Revenue Attribution" className="!rounded-2xl">
          <div className="space-y-2">
            {[
              { source: 'Lead Search', value: '$42K', pct: 47 },
              { source: 'Smart Lists', value: '$23K', pct: 26 },
              { source: 'Referrals', value: '$15K', pct: 17 },
              { source: 'Signal Alerts', value: '$9K', pct: 10 },
            ].map(s => (
              <div key={s.source}>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="font-medium">{s.source}</span>
                  <span className="font-bold text-accent">{s.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${s.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
};

export default NavigatorAnalyticsPage;
