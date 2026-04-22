import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, DollarSign, Star, Eye, ShoppingCart, TrendingUp, Settings, BarChart3, Clock, Plus } from 'lucide-react';

const GIGS = [
  { title: 'Logo Design Package', status: 'active', orders: 24, revenue: '$4,800', rating: 4.9, views: '1.2K', queue: 3 },
  { title: 'Brand Identity Kit', status: 'active', orders: 12, revenue: '$7,200', rating: 4.8, views: '890', queue: 1 },
  { title: 'UI/UX Audit', status: 'paused', orders: 8, revenue: '$2,400', rating: 4.7, views: '340', queue: 0 },
];

export default function GigWorkspaceHomePage() {
  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Package className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Gig Workspace</h1>
          <KPICard label="Active Gigs" value="2" />
          <KPICard label="In Queue" value="4" />
          <KPICard label="Revenue (MTD)" value="$14,400" change="+32%" trend="up" />
          <KPICard label="Avg Rating" value="4.8" />
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Quick Actions">
            <div className="space-y-1.5">
              {[
                { label: 'Create New Gig', icon: Plus },
                { label: 'Manage Orders', icon: ShoppingCart },
                { label: 'Analytics', icon: BarChart3 },
                { label: 'Settings', icon: Settings },
              ].map(({ label, icon: Icon }) => (
                <Button key={label} variant="ghost" size="sm" className="w-full justify-start h-7 text-[10px] gap-2"><Icon className="h-3 w-3" />{label}</Button>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Performance">
            <div className="space-y-1.5 text-[9px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Response Rate</span><span className="font-semibold text-accent">98%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">On-Time Delivery</span><span className="font-semibold text-accent">96%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Order Completion</span><span className="font-semibold text-accent">100%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Repeat Buyers</span><span className="font-semibold">42%</span></div>
            </div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-48"
    >
      <SectionCard title="My Gigs" action={<Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" /> New Gig</Button>}>
        {GIGS.map((g, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-border/40 hover:border-accent/30 transition-all cursor-pointer mb-2">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">🎨</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-semibold">{g.title}</span>
                <StatusBadge status={g.status === 'active' ? 'healthy' : 'caution'} label={g.status} />
              </div>
              <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                <span><ShoppingCart className="h-2.5 w-2.5 inline" /> {g.orders} orders</span>
                <span><DollarSign className="h-2.5 w-2.5 inline" /> {g.revenue}</span>
                <span><Star className="h-2.5 w-2.5 inline fill-[hsl(var(--gigvora-amber))] text-[hsl(var(--gigvora-amber))]" /> {g.rating}</span>
                <span><Eye className="h-2.5 w-2.5 inline" /> {g.views}</span>
              </div>
            </div>
            {g.queue > 0 && <Badge className="text-[8px] h-4 bg-accent/10 text-accent border-0">{g.queue} in queue</Badge>}
            <Button variant="outline" size="sm" className="h-6 text-[9px]">Manage</Button>
          </div>
        ))}
      </SectionCard>
    </DashboardLayout>
  );
}
