import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  BarChart3, Users, UserPlus, UserCheck, TrendingUp, Calendar,
  Clock, Zap, Target, ArrowUp, ArrowDown, Filter,
} from 'lucide-react';

interface WeekData { week: string; connections: number; messages: number; sessions: number; introsSent: number; }

const WEEKLY: WeekData[] = [
  { week: 'This Week', connections: 12, messages: 34, sessions: 3, introsSent: 5 },
  { week: 'Last Week', connections: 8, messages: 28, sessions: 2, introsSent: 3 },
  { week: '2 Weeks Ago', connections: 15, messages: 41, sessions: 4, introsSent: 7 },
  { week: '3 Weeks Ago', connections: 6, messages: 19, sessions: 1, introsSent: 2 },
];

interface SourceData { source: string; count: number; percentage: number; }

const SOURCES: SourceData[] = [
  { source: 'Speed Networking', count: 23, percentage: 35 },
  { source: 'Networking Rooms', count: 18, percentage: 27 },
  { source: 'Suggested Connections', count: 14, percentage: 21 },
  { source: 'Introductions', count: 8, percentage: 12 },
  { source: 'Direct Search', count: 3, percentage: 5 },
];

const NetworkingAnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const topStrip = (
    <>
      <BarChart3 className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Networking Analytics</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['week', 'month', 'quarter'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={cn('px-2.5 py-1 rounded-lg text-[9px] font-medium transition-colors capitalize', period === p ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{p}</button>
        ))}
      </div>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Goals" className="!rounded-2xl">
        <div className="space-y-2 text-[9px]">
          <div>
            <div className="flex justify-between mb-0.5"><span className="text-muted-foreground">Weekly connections</span><span className="font-semibold">12/15</span></div>
            <Progress value={80} className="h-1 rounded-full" />
          </div>
          <div>
            <div className="flex justify-between mb-0.5"><span className="text-muted-foreground">Monthly sessions</span><span className="font-semibold">9/10</span></div>
            <Progress value={90} className="h-1 rounded-full" />
          </div>
          <div>
            <div className="flex justify-between mb-0.5"><span className="text-muted-foreground">Response rate</span><span className="font-semibold">68%</span></div>
            <Progress value={68} className="h-1 rounded-full" />
          </div>
        </div>
      </SectionCard>
      <SectionCard title="Network Health" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Diversity Score</span><span className="font-semibold">8.2/10</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Engagement Rate</span><span className="font-semibold">42%</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Reciprocity</span><span className="font-semibold">73%</span></div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Total Connections" value="342" change="↑ 24 this month" className="!rounded-2xl" />
        <KPICard label="Messages Sent" value="122" change="↑ 15% vs last month" className="!rounded-2xl" />
        <KPICard label="Sessions Attended" value="10" change="This month" className="!rounded-2xl" />
        <KPICard label="Intros Made" value="17" change="75% accepted" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        <SectionCard title="Weekly Activity" icon={<Calendar className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2">
            {WEEKLY.map((w, i) => (
              <div key={w.week} className={cn('rounded-xl p-2.5', i === 0 ? 'bg-accent/5 border border-accent/10' : 'bg-muted/30')}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold">{w.week}</span>
                  {i === 0 && <Badge className="bg-accent/10 text-accent text-[7px] border-0 rounded-lg">Current</Badge>}
                </div>
                <div className="grid grid-cols-4 gap-2 text-[9px]">
                  <div><span className="text-muted-foreground block">Connections</span><span className="font-semibold">{w.connections}</span></div>
                  <div><span className="text-muted-foreground block">Messages</span><span className="font-semibold">{w.messages}</span></div>
                  <div><span className="text-muted-foreground block">Sessions</span><span className="font-semibold">{w.sessions}</span></div>
                  <div><span className="text-muted-foreground block">Intros</span><span className="font-semibold">{w.introsSent}</span></div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Connection Sources" icon={<Target className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2.5">
            {SOURCES.map(s => (
              <div key={s.source}>
                <div className="flex items-center justify-between text-[9px] mb-1">
                  <span className="font-medium">{s.source}</span>
                  <span className="text-muted-foreground">{s.count} ({s.percentage}%)</span>
                </div>
                <Progress value={s.percentage} className="h-1.5 rounded-full" />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Key Insights" icon={<Zap className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {[
            { title: 'Best Day', value: 'Tuesday', detail: '28% of connections made', icon: Calendar, trend: 'up' as const },
            { title: 'Avg Response Time', value: '4.2 hrs', detail: '↓ 1.3h vs last month', icon: Clock, trend: 'up' as const },
            { title: 'Top Industry', value: 'Enterprise SaaS', detail: '34% of network', icon: Users, trend: 'up' as const },
          ].map(insight => (
            <div key={insight.title} className="rounded-xl bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <insight.icon className="h-3 w-3 text-muted-foreground" />
                <span className="text-[9px] text-muted-foreground">{insight.title}</span>
              </div>
              <div className="text-[13px] font-bold">{insight.value}</div>
              <div className="text-[8px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                {insight.trend === 'up' ? <ArrowUp className="h-2 w-2 text-[hsl(var(--state-healthy))]" /> : <ArrowDown className="h-2 w-2 text-destructive" />}
                {insight.detail}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
};

export default NetworkingAnalyticsPage;
