import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Download, Eye, Users, TrendingUp, Globe, Clock, Star } from 'lucide-react';

const TRAFFIC = [
  { source: 'Direct', visits: 1240, pct: 42 },
  { source: 'Search', visits: 860, pct: 29 },
  { source: 'Social', visits: 520, pct: 18 },
  { source: 'Referral', visits: 320, pct: 11 },
];

const WEEKLY = [
  { week: 'W1', views: 680, visitors: 420, actions: 32 },
  { week: 'W2', views: 920, visitors: 560, actions: 48 },
  { week: 'W3', views: 780, visitors: 490, actions: 38 },
  { week: 'W4', views: 1040, visitors: 640, actions: 56 },
];

const TOP_CONTENT = [
  { title: 'Profile Overview', views: 1840, ctr: '12%' },
  { title: 'Services Tab', views: 960, ctr: '24%' },
  { title: 'Reviews Tab', views: 720, ctr: '18%' },
  { title: 'Gigs Tab', views: 580, ctr: '22%' },
  { title: 'Portfolio / Media', views: 420, ctr: '8%' },
];

export default function PageAnalyticsPage() {
  return (
    <DashboardLayout topStrip={<><BarChart3 className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Page Analytics</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Page Views" value="3,420" change="+18% vs last month" className="!rounded-2xl" />
        <KPICard label="Unique Visitors" value="2,110" className="!rounded-2xl" />
        <KPICard label="Avg Time" value="2m 34s" className="!rounded-2xl" />
        <KPICard label="Action Rate" value="5.1%" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <SectionCard title="Traffic Sources" icon={<Globe className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2">
            {TRAFFIC.map(t => (
              <div key={t.source}>
                <div className="flex justify-between text-[9px] mb-0.5"><span className="font-medium">{t.source}</span><span className="font-bold">{t.visits.toLocaleString()} ({t.pct}%)</span></div>
                <Progress value={t.pct} className="h-1.5 rounded-full" />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Weekly Trend" className="!rounded-2xl">
          <div className="space-y-2.5">
            {WEEKLY.map(w => (
              <div key={w.week} className="flex items-center gap-3">
                <span className="text-[9px] font-bold w-6">{w.week}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-[8px] mb-0.5"><span>Views</span><span className="font-semibold">{w.views}</span></div>
                  <Progress value={(w.views / 1200) * 100} className="h-1 rounded-full mb-1" />
                  <div className="flex justify-between text-[8px] mb-0.5"><span>Actions</span><span className="font-semibold">{w.actions}</span></div>
                  <Progress value={(w.actions / 60) * 100} className="h-1 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Top Content" className="!rounded-2xl">
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-2 text-[8px] font-medium text-muted-foreground border-b pb-1"><span>Section</span><span>Views</span><span>CTR</span></div>
          {TOP_CONTENT.map(c => (
            <div key={c.title} className="grid grid-cols-3 gap-2 text-[9px] py-1.5 border-b border-border/20 last:border-0">
              <span className="font-semibold">{c.title}</span><span>{c.views.toLocaleString()}</span><span className="font-semibold">{c.ctr}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
