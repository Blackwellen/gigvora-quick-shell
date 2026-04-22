import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Megaphone, Plus, Eye, Pause, Play, Trash2, DollarSign, Users, TrendingUp } from 'lucide-react';

const PROMOTIONS = [
  { title: '15% Off All Packages', gig: 'Logo & Brand Identity', type: 'Discount', status: 'active' as const, impressions: 3420, clicks: 218, orders: 14, spend: '$85', start: 'Apr 5', end: 'Apr 30' },
  { title: 'Featured Listing Boost', gig: 'Logo & Brand Identity', type: 'Boost', status: 'active' as const, impressions: 5800, clicks: 340, orders: 22, spend: '$150', start: 'Apr 1', end: 'Apr 21' },
  { title: 'Bundle: Logo + Guidelines', gig: 'Multiple Gigs', type: 'Bundle', status: 'paused' as const, impressions: 1200, clicks: 68, orders: 5, spend: '$60', start: 'Mar 20', end: 'Apr 15' },
  { title: 'New Seller Launch Promo', gig: 'Web Design', type: 'Discount', status: 'ended' as const, impressions: 4500, clicks: 290, orders: 18, spend: '$200', start: 'Mar 1', end: 'Mar 31' },
];

const STATUS_CLASS = {
  active: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  paused: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  ended: 'bg-muted text-muted-foreground',
};

export default function GigPromotionsPage() {
  return (
    <DashboardLayout topStrip={<><Megaphone className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Gig Promotions</span><div className="flex-1" /><Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Plus className="h-3 w-3" />Create Promotion</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Active Promos" value="2" className="!rounded-2xl" />
        <KPICard label="Total Impressions" value="14.9K" className="!rounded-2xl" />
        <KPICard label="Orders Generated" value="59" className="!rounded-2xl" />
        <KPICard label="ROI" value="3.2×" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {PROMOTIONS.map((p, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{p.title}</span>
                  <Badge className={cn('text-[7px] border-0 rounded-lg capitalize', STATUS_CLASS[p.status])}>{p.status}</Badge>
                  <Badge variant="outline" className="text-[7px] rounded-md">{p.type}</Badge>
                </div>
                <div className="text-[8px] text-muted-foreground mb-1.5">Gig: {p.gig} · {p.start} — {p.end}</div>
                <div className="flex items-center gap-4 text-[8px]">
                  <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5 text-muted-foreground" />{p.impressions.toLocaleString()} impressions</span>
                  <span className="flex items-center gap-0.5"><TrendingUp className="h-2.5 w-2.5 text-muted-foreground" />{p.clicks} clicks</span>
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5 text-muted-foreground" />{p.orders} orders</span>
                  <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5 text-muted-foreground" />{p.spend} spent</span>
                  <span className="font-semibold text-accent">{((p.orders / p.clicks) * 100).toFixed(1)}% CVR</span>
                </div>
              </div>
              <div className="flex gap-1">
                {p.status === 'active' && <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Pause className="h-2.5 w-2.5" />Pause</Button>}
                {p.status === 'paused' && <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Play className="h-2.5 w-2.5" />Resume</Button>}
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg text-destructive"><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
