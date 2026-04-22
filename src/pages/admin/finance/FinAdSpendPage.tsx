import React from 'react';
import { FinPageShell, FinPageHeader, FinBackLink, FinTable, FinKpiCard } from './_shared';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Activity, TrendingUp, MousePointerClick } from 'lucide-react';

const ADS = [
  { id: 'AD-2014', advertiser: 'Belmont Ltd', campaign: 'Q3 Brand Refresh — Sponsored', spent: '£8,420', remaining: '£1,580', impressions: '1.2M', cpm: '£7.02', status: 'active' },
  { id: 'AD-2013', advertiser: 'Studio Lin', campaign: 'Logo gigs promo', spent: '£1,240', remaining: '£0', impressions: '184k', cpm: '£6.74', status: 'completed' },
  { id: 'AD-2012', advertiser: 'Northwind', campaign: 'Pro plan upsell', spent: '£3,820', remaining: '£2,180', impressions: '512k', cpm: '£7.46', status: 'active' },
  { id: 'AD-2011', advertiser: 'Kraftworks', campaign: 'Q3 hiring push', spent: '£12,400', remaining: '£3,600', impressions: '1.8M', cpm: '£6.89', status: 'active' },
];

const FinAdSpendPage: React.FC = () => (
  <FinPageShell>
    <FinBackLink />
    <FinPageHeader eyebrow="Ad Spend" title="On-site ad spend" subtitle="Advertiser campaigns, spend, remaining budget, and reconciliation." />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <FinKpiCard label="Spend (30d)" value="£48,600" delta="+£3.2k" positive={false} icon={Megaphone} />
      <FinKpiCard label="Active campaigns" value="42" icon={Activity} />
      <FinKpiCard label="Avg CPM" value="£7.04" delta="−£0.12" positive icon={TrendingUp} />
      <FinKpiCard label="CTR" value="2.4%" delta="+0.1pp" positive icon={MousePointerClick} />
    </div>
    <FinTable
      headers={['Campaign', 'Advertiser', 'Title', 'Spent', 'Remaining', 'Impressions', 'CPM', 'Status']}
      rows={ADS.map((a) => [
        <span className="font-mono text-xs">{a.id}</span>,
        <span className="font-medium">{a.advertiser}</span>,
        <span className="text-muted-foreground">{a.campaign}</span>,
        <span className="tabular-nums font-medium">{a.spent}</span>,
        <span className="tabular-nums">{a.remaining}</span>,
        <span className="tabular-nums text-xs text-muted-foreground">{a.impressions}</span>,
        <span className="tabular-nums">{a.cpm}</span>,
        <Badge variant={a.status === 'completed' ? 'outline' : 'secondary'} className="capitalize text-[10px]">{a.status}</Badge>,
      ])}
    />
  </FinPageShell>
);
export default FinAdSpendPage;
