import React from 'react';
import { FinPageShell, FinPageHeader, FinBackLink, FinKpiCard, FinTable } from './_shared';
import { TrendingUp, PiggyBank, Activity, BarChart3 } from 'lucide-react';

const BREAKDOWN = [
  { source: 'Gigs', gmv: '£842,400', take: '£84,240', rate: '10.0%' },
  { source: 'Services', gmv: '£612,800', take: '£91,920', rate: '15.0%' },
  { source: 'Projects', gmv: '£1,840,200', take: '£184,020', rate: '10.0%' },
  { source: 'Jobs', gmv: '£412,100', take: '£82,420', rate: '20.0%' },
  { source: 'Subscriptions (MRR×12)', gmv: '£2,210,400', take: '£169,800', rate: '7.7%' },
];

const FinEarningsPage: React.FC = () => (
  <FinPageShell>
    <FinBackLink />
    <FinPageHeader eyebrow="Earnings" title="Site earnings" subtitle="Platform revenue, GMV, take rate, and trend across product lines." />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <FinKpiCard label="Revenue (30d)" value="£612,400" delta="+9.4%" positive icon={TrendingUp} />
      <FinKpiCard label="GMV (30d)" value="£5.92M" delta="+11.2%" positive icon={Activity} />
      <FinKpiCard label="Avg take rate" value="10.3%" delta="+0.2pp" positive icon={PiggyBank} />
      <FinKpiCard label="ARR" value="£7.34M" delta="+£0.6M" positive icon={BarChart3} />
    </div>
    <FinTable
      headers={['Product line', 'GMV', 'Platform take', 'Take rate']}
      rows={BREAKDOWN.map((b) => [
        <span className="font-medium">{b.source}</span>,
        <span className="tabular-nums">{b.gmv}</span>,
        <span className="tabular-nums font-medium">{b.take}</span>,
        <span className="tabular-nums text-muted-foreground">{b.rate}</span>,
      ])}
    />
  </FinPageShell>
);
export default FinEarningsPage;
