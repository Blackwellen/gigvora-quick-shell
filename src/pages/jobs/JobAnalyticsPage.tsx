import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Download } from 'lucide-react';
import { useAnalyticsRollups, bucketSum, pivotByBucket } from '@/hooks/useAnalyticsRollups';
import { useKpiPortalCards, formatKpiValue } from '@/hooks/useKpiRegistry';

// Deterministic fallback (renders before API responds + when offline)
const FUNNEL_FB = [
  { stage: 'Views', count: 3200, metric: 'jobs.view' },
  { stage: 'Applications', count: 45, metric: 'jobs.application' },
  { stage: 'Screened', count: 24, metric: 'jobs.screened' },
  { stage: 'Interviewed', count: 8, metric: 'jobs.interviewed' },
  { stage: 'Offered', count: 2, metric: 'jobs.offered' },
  { stage: 'Hired', count: 1, metric: 'jobs.hired' },
];
const SOURCE_PERF = [
  { source: 'Gigvora', apps: 28, qualified: 18, cost: '$0', cpa: '$0' },
  { source: 'LinkedIn', apps: 12, qualified: 8, cost: '$150', cpa: '$12.50' },
  { source: 'Indeed', apps: 18, qualified: 10, cost: '$80', cpa: '$4.44' },
  { source: 'Referrals', apps: 4, qualified: 4, cost: '$0', cpa: '$0' },
];

export default function JobAnalyticsPage() {
  const { data: rollups = [] } = useAnalyticsRollups(
    FUNNEL_FB.map((f) => f.metric),
    { bucket: 'day', days: 30 },
  );
  const { data: cards = [] } = useKpiPortalCards('professional');

  // Build funnel from rollups; fall back to deterministic seed if no live data.
  const live = FUNNEL_FB.map((f) => {
    const sum = bucketSum(rollups, f.metric);
    return { ...f, count: sum > 0 ? sum : f.count };
  });
  const weekly = pivotByBucket(rollups, ['jobs.view', 'jobs.application']).slice(-4)
    .map((r, i) => ({ week: `W${i + 1}`, views: r['jobs.view'], apps: r['jobs.application'] }));

  // Pick the four jobs KPIs the super-admin assigned (or fallback labels).
  const jobsKpis = cards.filter((c) =>
    ['jobs.apply_rate', 'jobs.time_to_hire_days', 'jobs.cost_per_hire'].includes(c.metric_key),
  );

  return (
    <DashboardLayout topStrip={<><BarChart3 className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Job Analytics</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Total Views" value={bucketSum(rollups, 'jobs.view').toLocaleString() || '3,200'} change="+12% vs avg" className="!rounded-2xl" />
        {jobsKpis[0]
          ? <KPICard label={jobsKpis[0].title} value={formatKpiValue(jobsKpis[0])} className="!rounded-2xl" />
          : <KPICard label="Apply Rate" value="1.4%" className="!rounded-2xl" />}
        {jobsKpis[1]
          ? <KPICard label={jobsKpis[1].title} value={formatKpiValue(jobsKpis[1])} className="!rounded-2xl" />
          : <KPICard label="Time to Hire" value="18d" className="!rounded-2xl" />}
        {jobsKpis[2]
          ? <KPICard label={jobsKpis[2].title} value={formatKpiValue(jobsKpis[2])} className="!rounded-2xl" />
          : <KPICard label="Cost per Hire" value="$430" className="!rounded-2xl" />}
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <SectionCard title="Hiring Funnel" className="!rounded-2xl">
          <div className="space-y-2">
            {live.map((f, i) => (
              <div key={f.stage}>
                <div className="flex justify-between text-[9px] mb-0.5"><span className="font-medium">{f.stage}</span><span className="font-bold">{f.count.toLocaleString()}</span></div>
                <Progress value={(f.count / live[0].count) * 100} className="h-2 rounded-full" />
                {i > 0 && <div className="text-[7px] text-muted-foreground text-right">{((f.count / live[i - 1].count) * 100).toFixed(1)}% conversion</div>}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Weekly Trend" className="!rounded-2xl">
          <div className="space-y-2.5">
            {(weekly.length ? weekly : [
              { week: 'W1', views: 800, apps: 12 }, { week: 'W2', views: 1200, apps: 18 },
              { week: 'W3', views: 700, apps: 9 },  { week: 'W4', views: 500, apps: 6 },
            ]).map((w) => (
              <div key={w.week} className="flex items-center gap-3">
                <span className="text-[9px] font-bold w-6">{w.week}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-[8px] mb-0.5"><span>Views</span><span className="font-semibold">{w.views}</span></div>
                  <Progress value={(w.views / 1500) * 100} className="h-1 rounded-full mb-1" />
                  <div className="flex justify-between text-[8px] mb-0.5"><span>Apps</span><span className="font-semibold">{w.apps}</span></div>
                  <Progress value={(w.apps / 20) * 100} className="h-1 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Source Performance" className="!rounded-2xl">
        <div className="space-y-1.5">
          <div className="grid grid-cols-5 gap-2 text-[8px] font-medium text-muted-foreground border-b pb-1">
            <span>Source</span><span>Applications</span><span>Qualified</span><span>Cost</span><span>Cost/App</span>
          </div>
          {SOURCE_PERF.map(s => (
            <div key={s.source} className="grid grid-cols-5 gap-2 text-[9px] py-1 border-b border-border/20 last:border-0">
              <span className="font-semibold">{s.source}</span>
              <span>{s.apps}</span>
              <span>{s.qualified}</span>
              <span>{s.cost}</span>
              <span className="font-semibold">{s.cpa}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
