import React from 'react';
import { FinPageShell, FinPageHeader, FinBackLink, FinKpiCard } from './_shared';
import { TrendingUp, RefreshCw, Activity, PiggyBank, Users, BarChart3 } from 'lucide-react';

const FinAnalyticsPage: React.FC = () => (
  <FinPageShell>
    <FinBackLink />
    <FinPageHeader eyebrow="Analytics" title="Finance stats & analytics" subtitle="Volume, revenue, refund rate, churn, FX impact, and trend lines." />
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
      <FinKpiCard label="Revenue (30d)" value="£612,400" delta="+9.4%" positive icon={TrendingUp} />
      <FinKpiCard label="Refund rate" value="1.8%" delta="−0.1pp" positive icon={RefreshCw} />
      <FinKpiCard label="Chargeback rate" value="0.3%" delta="+0.05pp" positive={false} icon={Activity} />
      <FinKpiCard label="Avg take rate" value="10.3%" delta="+0.2pp" positive icon={PiggyBank} />
      <FinKpiCard label="Paying customers" value="6,812" delta="+184" positive icon={Users} />
      <FinKpiCard label="FX impact (30d)" value="−£2,140" delta="−£420" positive={false} icon={BarChart3} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">Revenue trend (90d)</h3>
        <div className="h-48 flex items-end gap-1">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="flex-1 bg-primary/60 rounded-sm" style={{ height: `${30 + Math.sin(i / 3) * 25 + i * 1.5}%` }} />
          ))}
        </div>
        <div className="text-[11px] text-muted-foreground mt-2">Daily net revenue, last 30 days</div>
      </div>
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">Refund rate trend</h3>
        <div className="h-48 flex items-end gap-1">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="flex-1 bg-rose-500/60 rounded-sm" style={{ height: `${20 + Math.cos(i / 4) * 15 + Math.random() * 10}%` }} />
          ))}
        </div>
        <div className="text-[11px] text-muted-foreground mt-2">Daily refund rate, last 30 days</div>
      </div>
    </div>
  </FinPageShell>
);
export default FinAnalyticsPage;
