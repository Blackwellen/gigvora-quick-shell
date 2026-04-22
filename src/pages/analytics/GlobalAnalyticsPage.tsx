import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3, TrendingUp, Users, Eye, MousePointer,
  FileText, Briefcase, Store, Layers, Megaphone,
  Calendar, Globe, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

const OVERVIEW_STATS = [
  { label: 'Profile Views', value: '12.4K', change: '+18%', trend: 'up' },
  { label: 'Content Impressions', value: '89.2K', change: '+24%', trend: 'up' },
  { label: 'Engagement Rate', value: '4.8%', change: '+0.3%', trend: 'up' },
  { label: 'Connections Made', value: '142', change: '+12', trend: 'up' },
  { label: 'Revenue (MTD)', value: '$8,450', change: '+15%', trend: 'up' },
  { label: 'Active Orders', value: '8', change: '-2', trend: 'down' },
];

const CHANNEL_METRICS = [
  { channel: 'Gigs', views: '23.4K', conversions: 42, revenue: '$3,200', rate: '1.8%', icon: Layers },
  { channel: 'Services', views: '18.9K', conversions: 28, revenue: '$4,100', rate: '1.5%', icon: Store },
  { channel: 'Jobs Posted', views: '12.1K', applicants: 156, hires: 3, rate: '1.9%', icon: Briefcase },
  { channel: 'Content', views: '34.8K', engagement: '4.2K', shares: 890, rate: '12.1%', icon: FileText },
  { channel: 'Ads', views: '45.2K', clicks: '2.1K', spend: '$320', rate: '4.6%', icon: Megaphone },
  { channel: 'Events', views: '8.5K', registrations: 124, attendance: 89, rate: '71.8%', icon: Calendar },
];

export default function GlobalAnalyticsPage() {
  const [period, setPeriod] = useState('30d');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <BarChart3 className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Analytics</h1>
          {OVERVIEW_STATS.slice(0, 4).map(s => (
            <KPICard key={s.label} label={s.label} value={s.value} change={s.change} trend={s.trend as any} />
          ))}
        </div>
      }
    >
      <SectionBackNav homeRoute="/dashboard" homeLabel="Dashboard" currentLabel="Analytics" icon={<BarChart3 className="h-3 w-3" />} />

      <div className="flex items-center gap-2 mb-4">
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList className="h-7">
            <TabsTrigger value="7d" className="text-[10px] h-5 px-2">7 Days</TabsTrigger>
            <TabsTrigger value="30d" className="text-[10px] h-5 px-2">30 Days</TabsTrigger>
            <TabsTrigger value="90d" className="text-[10px] h-5 px-2">90 Days</TabsTrigger>
            <TabsTrigger value="12m" className="text-[10px] h-5 px-2">12 Months</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {OVERVIEW_STATS.map(s => (
          <SectionCard key={s.label} className="!rounded-2xl text-center">
            <div className="text-[9px] text-muted-foreground mb-1">{s.label}</div>
            <div className="text-lg font-bold">{s.value}</div>
            <div className={`text-[9px] font-medium flex items-center justify-center gap-0.5 ${s.trend === 'up' ? 'text-[hsl(var(--state-healthy))]' : 'text-[hsl(var(--state-critical))]'}`}>
              {s.trend === 'up' ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
              {s.change}
            </div>
          </SectionCard>
        ))}
      </div>

      {/* Channel Performance */}
      <SectionCard title="Channel Performance" icon={<TrendingUp className="h-3 w-3 text-accent" />} className="!rounded-2xl">
        <div className="space-y-2">
          {CHANNEL_METRICS.map(ch => (
            <div key={ch.channel} className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:bg-accent/5 transition-colors">
              <ch.icon className="h-4 w-4 text-accent shrink-0" />
              <div className="w-24 shrink-0">
                <div className="text-[11px] font-bold">{ch.channel}</div>
              </div>
              <div className="flex-1 grid grid-cols-4 gap-4 text-[10px]">
                <div><span className="text-muted-foreground">Views</span><div className="font-semibold">{ch.views}</div></div>
                <div><span className="text-muted-foreground">{ch.channel === 'Ads' ? 'Clicks' : ch.channel === 'Content' ? 'Engagement' : ch.channel === 'Events' ? 'Registrations' : ch.channel === 'Jobs Posted' ? 'Applicants' : 'Conversions'}</span><div className="font-semibold">{'conversions' in ch ? ch.conversions : 'clicks' in ch ? (ch as any).clicks : 'engagement' in ch ? (ch as any).engagement : 'applicants' in ch ? (ch as any).applicants : (ch as any).registrations}</div></div>
                <div><span className="text-muted-foreground">{ch.channel === 'Ads' ? 'Spend' : ch.channel === 'Content' ? 'Shares' : ch.channel === 'Events' ? 'Attendance' : ch.channel === 'Jobs Posted' ? 'Hires' : 'Revenue'}</span><div className="font-semibold">{'revenue' in ch ? ch.revenue : 'spend' in ch ? (ch as any).spend : 'shares' in ch ? (ch as any).shares : 'hires' in ch ? (ch as any).hires : (ch as any).attendance}</div></div>
                <div><span className="text-muted-foreground">Rate</span><div className="font-semibold">{ch.rate}</div></div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
