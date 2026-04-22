import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, DollarSign, Star, Users, Clock, Download, Calendar } from 'lucide-react';

const MONTHLY = [
  { month: 'Jan', revenue: 4200, orders: 8 },
  { month: 'Feb', revenue: 5800, orders: 11 },
  { month: 'Mar', revenue: 7200, orders: 14 },
  { month: 'Apr', revenue: 3600, orders: 7 },
];

const TOP_SERVICES = [
  { name: 'Brand Identity Design', revenue: '$12,400', orders: 18, rating: 4.9 },
  { name: 'Web Development', revenue: '$8,600', orders: 6, rating: 4.8 },
  { name: 'SEO Strategy', revenue: '$4,200', orders: 12, rating: 4.7 },
];

export default function ServiceAnalyticsPage() {
  return (
    <DashboardLayout topStrip={<><BarChart3 className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Service Analytics</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Total Revenue" value="$20,800" change="+24% vs last quarter" className="!rounded-2xl" />
        <KPICard label="Total Orders" value="40" change="+18%" className="!rounded-2xl" />
        <KPICard label="Avg Order Value" value="$520" className="!rounded-2xl" />
        <KPICard label="Avg Rating" value="4.8" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <SectionCard title="Revenue Trend" icon={<TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2">
            {MONTHLY.map(m => (
              <div key={m.month}>
                <div className="flex justify-between text-[9px] mb-0.5"><span className="font-medium">{m.month} 2026</span><span className="font-semibold">${m.revenue.toLocaleString()}</span></div>
                <Progress value={(m.revenue / 8000) * 100} className="h-1.5 rounded-full" />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Performance Metrics" className="!rounded-2xl">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Clock, label: 'Avg Delivery', value: '5.2 days', change: '-0.8d' },
              { icon: Star, label: 'Satisfaction', value: '96%', change: '+2%' },
              { icon: Users, label: 'Repeat Clients', value: '72%', change: '+5%' },
              { icon: DollarSign, label: 'Conversion', value: '34%', change: '+3%' },
            ].map(m => (
              <div key={m.label} className="p-2.5 rounded-xl bg-muted/30 text-center">
                <m.icon className="h-4 w-4 mx-auto text-accent mb-1" />
                <div className="text-[12px] font-black">{m.value}</div>
                <div className="text-[7px] text-muted-foreground">{m.label}</div>
                <div className="text-[7px] text-[hsl(var(--state-healthy))] font-medium">{m.change}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Top Services" className="!rounded-2xl">
        {TOP_SERVICES.map((s, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
            <div>
              <div className="text-[10px] font-bold">{s.name}</div>
              <div className="text-[8px] text-muted-foreground">{s.orders} orders · <Star className="h-2.5 w-2.5 inline text-[hsl(var(--gigvora-amber))]" /> {s.rating}</div>
            </div>
            <span className="text-[11px] font-bold text-accent">{s.revenue}</span>
          </div>
        ))}
      </SectionCard>
    </DashboardLayout>
  );
}
