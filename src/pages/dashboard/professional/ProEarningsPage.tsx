import React from 'react';
import { KPIBand, KPICard, SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign, TrendingUp, Wallet, ArrowUpRight, Clock,
  AlertTriangle, BarChart3, ChevronRight,
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TREND = [
  { month: 'Nov', earnings: 5200 }, { month: 'Dec', earnings: 6100 }, { month: 'Jan', earnings: 5800 },
  { month: 'Feb', earnings: 7230 }, { month: 'Mar', earnings: 7800 }, { month: 'Apr', earnings: 8420 },
];

const BY_SOURCE = [
  { source: 'Gigs', amount: 4800 }, { source: 'Services', amount: 2400 },
  { source: 'Projects', amount: 1200 }, { source: 'Bookings', amount: 420 },
];

const PAYOUTS = [
  { id: 'pay1', amount: '$3,200', date: 'Apr 15', status: 'scheduled' },
  { id: 'pay2', amount: '$2,700', date: 'Apr 1', status: 'completed' },
  { id: 'pay3', amount: '$1,800', date: 'Mar 15', status: 'completed' },
];

export default function ProEarningsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><DollarSign className="h-5 w-5 text-accent" /> Earnings</h1>
        <p className="text-[11px] text-muted-foreground">Revenue overview, payout tracking, and earnings analytics</p>
      </div>

      <KPIBand className="grid-cols-2 md:grid-cols-5">
        <KPICard label="This Month" value="$8,420" change="+16%" trend="up" />
        <KPICard label="Pending" value="$2,100" change="3 orders" />
        <KPICard label="Available" value="$3,200" change="Next payout Apr 15" />
        <KPICard label="YTD Total" value="$34,800" change="+22% vs last year" trend="up" />
        <KPICard label="Avg Order" value="$620" change="+$80" trend="up" />
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Earnings Trend */}
        <SectionCard title="Earnings Trend" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Earnings']} contentStyle={{ fontSize: 10, borderRadius: 12 }} />
                <Area type="monotone" dataKey="earnings" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Revenue by Source */}
        <SectionCard title="Revenue by Source" icon={<BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BY_SOURCE}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="source" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} contentStyle={{ fontSize: 10, borderRadius: 12 }} />
                <Bar dataKey="amount" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* Payouts */}
      <SectionCard title="Payouts" icon={<Wallet className="h-3.5 w-3.5 text-muted-foreground" />} action={<Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">View All</Button>} className="!rounded-2xl">
        <div className="space-y-1.5">
          {PAYOUTS.map(p => (
            <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0">
              <div className="h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center"><DollarSign className="h-3.5 w-3.5 text-muted-foreground" /></div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold">{p.amount}</div>
                <div className="text-[8px] text-muted-foreground">{p.date}</div>
              </div>
              <Badge variant="outline" className={`text-[7px] rounded-lg ${p.status === 'scheduled' ? 'border-accent/30 text-accent' : ''}`}>{p.status}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Top Earners */}
      <SectionCard title="Top Earning Listings" icon={<ArrowUpRight className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {[
            { title: 'Brand Identity Kit', revenue: '$7,200', orders: 12 },
            { title: 'Logo Design Package', revenue: '$4,800', orders: 24 },
            { title: 'Social Media Graphics Pack', revenue: '$2,700', orders: 18 },
          ].map((l, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0 hover:bg-muted/20 rounded-lg px-1 cursor-pointer group">
              <span className="text-[10px] font-bold text-muted-foreground w-4">#{i + 1}</span>
              <div className="flex-1"><div className="text-[10px] font-semibold group-hover:text-accent transition-colors">{l.title}</div></div>
              <span className="text-[10px] font-bold">{l.revenue}</span>
              <span className="text-[8px] text-muted-foreground">{l.orders} orders</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
