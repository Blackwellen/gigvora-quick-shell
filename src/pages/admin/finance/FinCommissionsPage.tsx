import React from 'react';
import { FinPageShell, FinPageHeader, FinBackLink, FinTable, FinKpiCard } from './_shared';
import { Badge } from '@/components/ui/badge';
import { PiggyBank, TrendingUp, Users, Activity } from 'lucide-react';

const COMMISSIONS = [
  { tier: 'Free', range: '£0–£1k/mo', rate: '20%', earners: 1842, gross: '£42,400' },
  { tier: 'Pro', range: '£1k–£5k/mo', rate: '15%', earners: 612, gross: '£128,800' },
  { tier: 'Team', range: '£5k–£20k/mo', rate: '10%', earners: 184, gross: '£412,400' },
  { tier: 'Enterprise', range: '£20k+/mo', rate: '7%', earners: 28, gross: '£612,200' },
];

const FinCommissionsPage: React.FC = () => (
  <FinPageShell>
    <FinBackLink />
    <FinPageHeader eyebrow="Commissions" title="Commission breakdown" subtitle="Platform commission rates, take, and earner distribution by tier." />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <FinKpiCard label="Commissions (30d)" value="£94,800" delta="+12.1%" positive icon={PiggyBank} />
      <FinKpiCard label="Avg commission" value="13.0%" delta="−0.1pp" positive icon={TrendingUp} />
      <FinKpiCard label="Earners" value="2,666" delta="+184" positive icon={Users} />
      <FinKpiCard label="Adjustments" value="6" delta="+2" positive={false} icon={Activity} />
    </div>
    <FinTable
      headers={['Tier', 'Earnings band', 'Commission rate', 'Earners', 'Gross billed']}
      rows={COMMISSIONS.map((c) => [
        <Badge variant="outline" className="text-[10px]">{c.tier}</Badge>,
        <span className="text-xs text-muted-foreground">{c.range}</span>,
        <span className="font-medium tabular-nums">{c.rate}</span>,
        <span className="tabular-nums">{c.earners.toLocaleString()}</span>,
        <span className="tabular-nums">{c.gross}</span>,
      ])}
    />
  </FinPageShell>
);
export default FinCommissionsPage;
