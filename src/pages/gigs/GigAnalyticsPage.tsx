import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Eye, ShoppingCart, DollarSign, TrendingUp, Users, Star, Clock } from 'lucide-react';

export default function GigAnalyticsPage() {
  const [period, setPeriod] = useState('30d');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <BarChart3 className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Gig Analytics</h1>
          <KPICard label="Impressions" value="8.4K" change="+18%" trend="up" />
          <KPICard label="Clicks" value="1.2K" change="+12%" trend="up" />
          <KPICard label="Orders" value="24" change="+6" trend="up" />
          <KPICard label="Revenue" value="$4,800" change="+32%" trend="up" />
          <div className="flex-1" />
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList className="h-7">
              <TabsTrigger value="7d" className="text-[10px] h-5 px-2">7D</TabsTrigger>
              <TabsTrigger value="30d" className="text-[10px] h-5 px-2">30D</TabsTrigger>
              <TabsTrigger value="90d" className="text-[10px] h-5 px-2">90D</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <SectionCard title="Views & Clicks" icon={<Eye className="h-3 w-3 text-muted-foreground" />}>
          <div className="h-44 bg-muted/30 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">[Chart: Views & click trend]</div>
        </SectionCard>
        <SectionCard title="Orders & Revenue" icon={<DollarSign className="h-3 w-3 text-muted-foreground" />}>
          <div className="h-44 bg-muted/30 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">[Chart: Orders & revenue]</div>
        </SectionCard>
        <SectionCard title="Conversion Funnel" icon={<TrendingUp className="h-3 w-3 text-muted-foreground" />}>
          <div className="space-y-2 py-2">
            {[
              { label: 'Impressions', value: '8,400', pct: 100 },
              { label: 'Page Views', value: '1,200', pct: 14 },
              { label: 'Inquiries', value: '180', pct: 15 },
              { label: 'Orders', value: '24', pct: 13 },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-[9px]">
                <span className="w-20 text-muted-foreground">{s.label}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${s.pct}%` }} /></div>
                <span className="font-semibold w-12 text-right">{s.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Buyer Demographics" icon={<Users className="h-3 w-3 text-muted-foreground" />}>
          <div className="h-44 bg-muted/30 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">[Chart: Demographics]</div>
        </SectionCard>
        <SectionCard title="Rating Distribution" icon={<Star className="h-3 w-3 text-muted-foreground" />}>
          <div className="space-y-1.5 py-2">
            {[5, 4, 3, 2, 1].map(r => (
              <div key={r} className="flex items-center gap-2 text-[9px]">
                <span className="w-4 text-muted-foreground">{r}★</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-[hsl(var(--gigvora-amber))] rounded-full" style={{ width: `${r === 5 ? 72 : r === 4 ? 20 : r === 3 ? 5 : 2}%` }} /></div>
                <span className="w-6 text-right">{r === 5 ? 18 : r === 4 ? 5 : r === 3 ? 1 : 0}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Response & Delivery" icon={<Clock className="h-3 w-3 text-muted-foreground" />}>
          <div className="space-y-2 text-[9px] py-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Avg Response Time</span><span className="font-semibold">1.2 hours</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Avg Delivery Time</span><span className="font-semibold">2.8 days</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">On-Time Rate</span><span className="font-semibold text-accent">96%</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Revision Rate</span><span className="font-semibold">28%</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cancellation Rate</span><span className="font-semibold text-accent">2%</span></div>
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
