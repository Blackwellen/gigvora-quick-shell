import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  BarChart3, Users, TrendingUp, MessageSquare, Star,
  ArrowUp, ArrowDown, DollarSign, Clock, Download, Eye, ThumbsUp,
} from 'lucide-react';

export default function WebinarAnalyticsPage() {
  const [period, setPeriod] = useState<'event' | '30d' | '90d'>('event');

  const topStrip = (
    <>
      <BarChart3 className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Webinar Analytics</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['event', '30d', '90d'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={cn('px-2.5 py-1 rounded-lg text-[9px] font-medium transition-colors', period === p ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{p === 'event' ? 'This Webinar' : p}</button>
        ))}
      </div>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Revenue" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Ticket Sales</span><span className="font-semibold">$4,850</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Donations</span><span className="font-semibold">$260</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Replay Sales</span><span className="font-semibold">$580</span></div>
          <div className="border-t pt-1 flex justify-between font-bold"><span>Total</span><span>$5,690</span></div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-44">
      <KPIBand className="mb-3">
        <KPICard label="Registrations" value="500" change="100% capacity" className="!rounded-2xl" />
        <KPICard label="Attendance" value="455" change="91% show rate" className="!rounded-2xl" />
        <KPICard label="Peak Concurrent" value="423" change="At 14:23" className="!rounded-2xl" />
        <KPICard label="Avg Watch Time" value="68 min" change="76% of total" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <SectionCard title="Engagement" icon={<TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2.5">
            {[
              { label: 'Chat Messages', value: '1,204', pct: 92, change: '+38%' },
              { label: 'Questions Asked', value: '89', pct: 72, change: '+15%' },
              { label: 'Poll Responses', value: '312', pct: 85, change: '+22%' },
              { label: 'Reactions', value: '2,450', pct: 95, change: '+45%' },
              { label: 'Hand Raises', value: '34', pct: 40, change: '+8%' },
            ].map(m => (
              <div key={m.label}>
                <div className="flex items-center justify-between text-[9px] mb-1">
                  <span className="font-medium">{m.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">{m.value}</span>
                    <span className={cn('text-[8px] flex items-center gap-0.5', 'text-[hsl(var(--state-healthy))]')}>
                      <ArrowUp className="h-2 w-2" />{m.change}
                    </span>
                  </div>
                </div>
                <Progress value={m.pct} className="h-1.5 rounded-full" />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Audience" icon={<Users className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2.5">
            {[
              { label: 'By Ticket', items: [{ n: 'Professional', v: 280, p: 56 }, { n: 'Free', v: 175, p: 35 }, { n: 'Team', v: 45, p: 9 }] },
              { label: 'By Source', items: [{ n: 'Email', v: 200, p: 40 }, { n: 'Direct', v: 150, p: 30 }, { n: 'Social', v: 100, p: 20 }, { n: 'Referral', v: 50, p: 10 }] },
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
            { label: 'Overall Rating', value: '4.8/5', icon: Star, color: 'text-[hsl(var(--gigvora-amber))]' },
            { label: 'Would Recommend', value: '95%', icon: ThumbsUp, color: 'text-[hsl(var(--state-healthy))]' },
            { label: 'Content Quality', value: '4.9/5', icon: Eye, color: 'text-accent' },
            { label: 'NPS Score', value: '+78', icon: TrendingUp, color: 'text-[hsl(var(--state-healthy))]' },
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
}
