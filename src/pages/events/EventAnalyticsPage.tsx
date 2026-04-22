import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  BarChart3, Users, TrendingUp, Calendar, Clock, Target,
  ThumbsUp, MessageSquare, Star, Download, Filter,
  ArrowUp, ArrowDown,
} from 'lucide-react';

const EventAnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<'event' | 'month' | 'quarter'>('event');

  const topStrip = (
    <>
      <BarChart3 className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Event Analytics</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['event', 'month', 'quarter'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={cn('px-2.5 py-1 rounded-lg text-[9px] font-medium transition-colors capitalize', period === p ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{p === 'event' ? 'This Event' : p}</button>
        ))}
      </div>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Top Moments" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[
            { time: '15:23', label: 'Peak attendance', value: '203' },
            { time: '42:10', label: 'Most chat activity', value: '28 msg/min' },
            { time: '60:00', label: 'Most hand raises', value: '15' },
          ].map(m => (
            <div key={m.time} className="flex items-center gap-1.5">
              <span className="text-[8px] font-mono text-muted-foreground w-8">{m.time}</span>
              <div className="flex-1"><div className="font-medium">{m.label}</div></div>
              <span className="font-semibold">{m.value}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Registrations" value="200" change="100% capacity" className="!rounded-2xl" />
        <KPICard label="Attendance" value="187" change="93.5% show rate" className="!rounded-2xl" />
        <KPICard label="Peak Concurrent" value="203" change="At 15:23" className="!rounded-2xl" />
        <KPICard label="Avg Duration" value="52 min" change="of 90 min total" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <SectionCard title="Engagement Metrics" icon={<TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2.5">
            {[
              { label: 'Chat Messages', value: '342', pct: 85, change: '+24%' },
              { label: 'Questions Asked', value: '47', pct: 65, change: '+12%' },
              { label: 'Reactions', value: '1,204', pct: 92, change: '+38%' },
              { label: 'Hand Raises', value: '28', pct: 45, change: '-5%' },
              { label: 'Poll Responses', value: '156', pct: 78, change: '+15%' },
            ].map(m => (
              <div key={m.label}>
                <div className="flex items-center justify-between text-[9px] mb-1">
                  <span className="font-medium">{m.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">{m.value}</span>
                    <span className={cn('text-[8px] flex items-center gap-0.5', m.change.startsWith('+') ? 'text-[hsl(var(--state-healthy))]' : 'text-destructive')}>
                      {m.change.startsWith('+') ? <ArrowUp className="h-2 w-2" /> : <ArrowDown className="h-2 w-2" />}{m.change}
                    </span>
                  </div>
                </div>
                <Progress value={m.pct} className="h-1.5 rounded-full" />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Audience Breakdown" icon={<Users className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2.5">
            {[
              { label: 'By Ticket', items: [{ n: 'VIP', v: 42, p: 22 }, { n: 'Professional', v: 98, p: 52 }, { n: 'General', v: 47, p: 26 }] },
              { label: 'By Source', items: [{ n: 'Direct', v: 78, p: 42 }, { n: 'Email', v: 56, p: 30 }, { n: 'Social', v: 34, p: 18 }, { n: 'Referral', v: 19, p: 10 }] },
            ].map(section => (
              <div key={section.label}>
                <div className="text-[9px] font-semibold mb-1.5">{section.label}</div>
                {section.items.map(item => (
                  <div key={item.n} className="mb-1">
                    <div className="flex justify-between text-[8px] mb-0.5"><span className="text-muted-foreground">{item.n}</span><span>{item.v} ({item.p}%)</span></div>
                    <Progress value={item.p} className="h-1 rounded-full" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Satisfaction" icon={<Star className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Overall Rating', value: '4.7/5', icon: Star, color: 'text-[hsl(var(--gigvora-amber))]' },
            { label: 'Would Recommend', value: '92%', icon: ThumbsUp, color: 'text-[hsl(var(--state-healthy))]' },
            { label: 'Content Quality', value: '4.8/5', icon: Target, color: 'text-accent' },
            { label: 'NPS Score', value: '+72', icon: TrendingUp, color: 'text-[hsl(var(--state-healthy))]' },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-muted/30 p-3 text-center">
              <s.icon className={cn('h-4 w-4 mx-auto mb-1', s.color)} />
              <div className="text-[14px] font-bold">{s.value}</div>
              <div className="text-[8px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
};

export default EventAnalyticsPage;
