import React, { useState } from 'react';
import { KPIBand, KPICard, SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  BarChart3, TrendingUp, Eye, Users, DollarSign,
  Calendar, Download, Filter,
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const VIEWS_DATA = [
  { day: 'Mon', views: 120 }, { day: 'Tue', views: 180 }, { day: 'Wed', views: 150 },
  { day: 'Thu', views: 220 }, { day: 'Fri', views: 290 }, { day: 'Sat', views: 180 }, { day: 'Sun', views: 140 },
];

const SOURCE_DATA = [
  { name: 'Search', value: 42 }, { name: 'Direct', value: 28 },
  { name: 'Feed', value: 18 }, { name: 'Referral', value: 12 },
];

const CONVERSION_DATA = [
  { stage: 'Profile Views', count: 1200 }, { stage: 'Gig Views', count: 680 },
  { stage: 'Inquiries', count: 140 }, { stage: 'Orders', count: 62 },
];

const COLORS = ['hsl(var(--accent))', 'hsl(var(--gigvora-purple))', 'hsl(var(--gigvora-amber))', 'hsl(var(--state-healthy))'];

export default function ProAnalyticsPage() {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2"><BarChart3 className="h-5 w-5 text-accent" /> Analytics</h1>
          <p className="text-[11px] text-muted-foreground">Deep analytics, conversion insights, and audience data</p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)} className={cn(
              'px-3 py-1.5 rounded-xl text-[9px] font-medium transition-all',
              range === r ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}>{r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}</button>
          ))}
          <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button>
        </div>
      </div>

      <KPIBand className="grid-cols-2 md:grid-cols-5">
        <KPICard label="Profile Views" value="1.2K" change="+18%" trend="up" />
        <KPICard label="Gig/Service Views" value="680" change="+24%" trend="up" />
        <KPICard label="Inquiries" value="140" change="+12%" trend="up" />
        <KPICard label="Conversion" value="5.2%" change="+0.8%" trend="up" />
        <KPICard label="Avg Session" value="3m 42s" change="+15s" trend="up" />
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Views Trend */}
        <SectionCard title="Views Over Time" icon={<Eye className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={VIEWS_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12 }} />
                <Area type="monotone" dataKey="views" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Traffic Sources */}
        <SectionCard title="Traffic Sources" icon={<Users className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="h-48 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={SOURCE_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                    {SOURCE_DATA.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {SOURCE_DATA.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-[9px] text-muted-foreground flex-1">{s.name}</span>
                  <span className="text-[10px] font-bold">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Conversion Funnel */}
      <SectionCard title="Conversion Funnel" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={CONVERSION_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 9 }} width={90} />
              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12 }} />
              <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* Category Performance */}
      <SectionCard title="Category Performance" icon={<BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-2">
          {[
            { cat: 'Logo & Branding', views: 420, orders: 24, revenue: '$4,800', rate: '5.7%' },
            { cat: 'UI/UX Design', views: 310, orders: 12, revenue: '$7,200', rate: '3.9%' },
            { cat: 'Web Development', views: 180, orders: 8, revenue: '$2,400', rate: '4.4%' },
            { cat: 'Social Media', views: 140, orders: 18, revenue: '$2,700', rate: '12.8%' },
          ].map(c => (
            <div key={c.cat} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
              <div className="flex-1"><div className="text-[10px] font-semibold">{c.cat}</div></div>
              <div className="text-[9px] text-muted-foreground">{c.views} views</div>
              <div className="text-[9px] text-muted-foreground">{c.orders} orders</div>
              <div className="text-[10px] font-bold">{c.revenue}</div>
              <div className="text-[9px] text-accent font-medium">{c.rate} conv</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
