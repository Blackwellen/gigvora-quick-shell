import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { BarChart3, Users, TrendingUp, Download, ArrowUp, Star, Headphones, Clock, DollarSign } from 'lucide-react';

export default function PodcastAnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const topStrip = (
    <>
      <BarChart3 className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Podcast Analytics</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['7d', '30d', '90d'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={cn('px-2.5 py-1 rounded-lg text-[9px] font-medium transition-colors', period === p ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground')}>{p}</button>
        ))}
      </div>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Revenue" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[['Subscriptions', '$420'], ['Donations', '$180'], ['Purchases', '$350'], ['Sponsorships', '$1,200']].map(([k, v]) => (
            <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-semibold">{v}</span></div>
          ))}
          <div className="border-t pt-1.5 flex justify-between font-bold"><span>Total</span><span>$2,150</span></div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-44">
      <KPIBand className="mb-3">
        <KPICard label="Total Plays" value="24.5K" change="+18%" className="!rounded-2xl" />
        <KPICard label="Unique Listeners" value="8,420" change="+12%" className="!rounded-2xl" />
        <KPICard label="Avg Listen Time" value="28 min" change="+3 min" className="!rounded-2xl" />
        <KPICard label="Completion Rate" value="72%" change="+5%" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <SectionCard title="Top Episodes" icon={<Headphones className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          {[
            { title: 'Why AI Agents Will Replace SaaS', plays: 4200, completion: 83 },
            { title: 'The State of LLM Fine-Tuning', plays: 3100, completion: 78 },
            { title: 'React 21 Deep Dive', plays: 2800, completion: 91 },
            { title: 'Salary Negotiation Tips', plays: 2400, completion: 85 },
          ].map((ep, i) => (
            <div key={i} className="py-2 border-b border-border/30 last:border-0">
              <div className="flex justify-between text-[9px] mb-0.5"><span className="font-medium">{ep.title}</span><span className="flex items-center gap-0.5 text-[hsl(var(--state-healthy))]"><ArrowUp className="h-2 w-2" />{ep.plays.toLocaleString()}</span></div>
              <Progress value={ep.completion} className="h-1 rounded-full" />
              <div className="text-[7px] text-muted-foreground mt-0.5">{ep.completion}% avg completion</div>
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Listener Demographics" icon={<Users className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          {[
            { label: 'By Platform', items: [{ n: 'Web', p: 45 }, { n: 'iOS', p: 30 }, { n: 'Android', p: 20 }, { n: 'Other', p: 5 }] },
            { label: 'By Source', items: [{ n: 'Direct', p: 40 }, { n: 'Search', p: 25 }, { n: 'Social', p: 20 }, { n: 'Referral', p: 15 }] },
          ].map(section => (
            <div key={section.label} className="mb-2.5">
              <div className="text-[9px] font-semibold mb-1">{section.label}</div>
              {section.items.map(item => (
                <div key={item.n} className="mb-1">
                  <div className="flex justify-between text-[8px] mb-0.5"><span className="text-muted-foreground">{item.n}</span><span>{item.p}%</span></div>
                  <Progress value={item.p} className="h-1 rounded-full" />
                </div>
              ))}
            </div>
          ))}
        </SectionCard>
      </div>

      <SectionCard title="Growth Trend" icon={<TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Subscriber Growth', value: '+340', icon: Users, color: 'text-accent' },
            { label: 'Avg Rating', value: '4.8', icon: Star, color: 'text-[hsl(var(--gigvora-amber))]' },
            { label: 'Downloads', value: '12.3K', icon: Download, color: 'text-[hsl(var(--state-healthy))]' },
            { label: 'Revenue', value: '$2.1K', icon: DollarSign, color: 'text-[hsl(var(--state-healthy))]' },
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
