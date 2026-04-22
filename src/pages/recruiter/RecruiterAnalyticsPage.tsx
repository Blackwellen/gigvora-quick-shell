import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, Clock, Target, TrendingUp, Mail, Briefcase, ArrowUp, ArrowDown } from 'lucide-react';

const PIPELINE_STAGES = [
  { stage: 'Applied', count: 234, conversion: 100 },
  { stage: 'Screened', count: 145, conversion: 62 },
  { stage: 'Phone Interview', count: 78, conversion: 54 },
  { stage: 'Technical', count: 42, conversion: 54 },
  { stage: 'Final Round', count: 18, conversion: 43 },
  { stage: 'Offer', count: 8, conversion: 44 },
  { stage: 'Hired', count: 5, conversion: 63 },
];

const SOURCE_QUALITY = [
  { source: 'Outreach', candidates: 120, hires: 3, quality: 'high', conversionRate: 2.5 },
  { source: 'Referral', candidates: 45, hires: 2, quality: 'high', conversionRate: 4.4 },
  { source: 'Job Board', candidates: 340, hires: 4, quality: 'medium', conversionRate: 1.2 },
  { source: 'Career Page', candidates: 180, hires: 2, quality: 'medium', conversionRate: 1.1 },
  { source: 'Agency', candidates: 28, hires: 1, quality: 'low', conversionRate: 3.6 },
];

export default function RecruiterAnalyticsPage() {
  const [period, setPeriod] = useState('30d');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <BarChart3 className="h-4 w-4 text-[hsl(var(--gigvora-blue))]" />
          <h1 className="text-sm font-bold mr-4">Recruiter Analytics</h1>
          <KPICard label="Time to Hire" value="23d" change="-4d" trend="down" />
          <KPICard label="Offer Acceptance" value="83%" change="+5%" trend="up" />
          <KPICard label="Outreach Reply" value="34%" change="+6%" trend="up" />
          <KPICard label="Total Hires" value="5" change="this month" trend="up" />
          <KPICard label="Cost per Hire" value="$4,200" change="-$800" trend="down" />
        </div>
      }
    >
      <div className="flex items-center justify-end mb-4">
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList className="h-7">
            <TabsTrigger value="7d" className="text-[10px] h-5 px-2">7d</TabsTrigger>
            <TabsTrigger value="30d" className="text-[10px] h-5 px-2">30d</TabsTrigger>
            <TabsTrigger value="90d" className="text-[10px] h-5 px-2">90d</TabsTrigger>
            <TabsTrigger value="1y" className="text-[10px] h-5 px-2">1y</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Pipeline Funnel">
          <div className="space-y-2">
            {PIPELINE_STAGES.map((s, i) => (
              <div key={s.stage} className="flex items-center gap-3">
                <span className="text-[10px] font-medium w-28 shrink-0">{s.stage}</span>
                <div className="flex-1 h-6 bg-muted/30 rounded-lg overflow-hidden relative">
                  <div className="h-full bg-[hsl(var(--state-healthy)/0.15)] rounded-lg transition-all" style={{ width: `${(s.count / PIPELINE_STAGES[0].count) * 100}%` }} />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium">{s.count}</span>
                </div>
                {i > 0 && <span className="text-[9px] text-muted-foreground w-10 text-right">{s.conversion}%</span>}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Source Quality">
          <div className="space-y-2">
            {SOURCE_QUALITY.map(s => (
              <div key={s.source} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/30">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium">{s.source}</span>
                    <Badge variant={s.quality === 'high' ? 'default' : 'secondary'} className="text-[7px] h-3.5">{s.quality}</Badge>
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{s.candidates} candidates · {s.hires} hires</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{s.conversionRate}%</div>
                  <div className="text-[8px] text-muted-foreground">conversion</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Time-to-Hire by Role">
          {[
            { role: 'Frontend Engineer', days: 18, change: -3 },
            { role: 'Engineering Manager', days: 32, change: +2 },
            { role: 'ML Engineer', days: 25, change: -5 },
            { role: 'Product Designer', days: 21, change: -1 },
            { role: 'DevOps Engineer', days: 15, change: -4 },
          ].map(r => (
            <div key={r.role} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <Briefcase className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] font-medium flex-1">{r.role}</span>
              <span className="text-xs font-semibold">{r.days}d</span>
              <span className={`text-[9px] flex items-center gap-0.5 ${r.change < 0 ? 'text-[hsl(var(--state-healthy))]' : 'text-[hsl(var(--state-risk))]'}`}>
                {r.change < 0 ? <ArrowDown className="h-2.5 w-2.5" /> : <ArrowUp className="h-2.5 w-2.5" />}
                {Math.abs(r.change)}d
              </span>
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Recruiter Performance">
          {[
            { name: 'Mike Liu', hires: 3, pipeline: 28, replyRate: 38 },
            { name: 'David Chen', hires: 2, pipeline: 34, replyRate: 31 },
            { name: 'Sarah Kim', hires: 2, pipeline: 15, replyRate: 42 },
          ].map(r => (
            <div key={r.name} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <span className="text-[11px] font-medium flex-1">{r.name}</span>
              <div className="text-[9px] text-muted-foreground text-right">
                <span className="font-medium text-foreground">{r.hires}</span> hires · <span className="font-medium text-foreground">{r.pipeline}</span> pipeline · <span className="font-medium text-foreground">{r.replyRate}%</span> reply
              </div>
            </div>
          ))}
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
