import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsKpiCard } from './_shared';
import { Users, Activity, Globe, TrendingUp } from 'lucide-react';

export default function OpsAnalyticsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Analytics" title="Stats & Analytics" subtitle="Cross-portal admin metrics: platform usage, growth, region mix, and reliability." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <OpsKpiCard label="Daily active users" value="48,210" delta="+4.1%" positive icon={Users} />
        <OpsKpiCard label="Sessions / DAU" value="3.7" delta="+0.2" positive icon={Activity} />
        <OpsKpiCard label="Countries served" value="62" delta="+1" positive icon={Globe} />
        <OpsKpiCard label="Uptime 30d" value="99.98%" delta="0.0pp" icon={TrendingUp} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="text-[13px] font-medium mb-3">Domain mix (DAU)</div>
          {[['Marketplace', 38], ['Hiring', 22], ['Mentorship', 14], ['Media', 18], ['Networking', 8]].map(([k, v]) => (
            <div key={k as string} className="mb-2">
              <div className="flex justify-between text-[12px] mb-1"><span className="text-muted-foreground">{k}</span><span className="tabular-nums">{v}%</span></div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${v as number}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="text-[13px] font-medium mb-3">Top regions (DAU)</div>
          <ul className="divide-y text-[13px]">
            {[['UK', '14,820'], ['US', '11,402'], ['DE', '4,210'], ['IN', '3,981'], ['IE', '2,118']].map(([r, n]) => (
              <li key={r as string} className="py-2 flex items-center justify-between">
                <span>{r}</span>
                <span className="text-muted-foreground tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </OpsPageShell>
  );
}
