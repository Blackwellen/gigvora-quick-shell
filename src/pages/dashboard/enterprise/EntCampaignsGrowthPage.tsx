import React, { useState } from 'react';
import { KPIBand, KPICard, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Megaphone, ChevronRight, Eye, DollarSign, TrendingUp,
  BarChart3, Pause, Play, AlertTriangle, Target, Users, ExternalLink,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SPEND_TREND = [
  { day: 'Mon', spend: 420 }, { day: 'Tue', spend: 580 }, { day: 'Wed', spend: 510 },
  { day: 'Thu', spend: 690 }, { day: 'Fri', spend: 720 }, { day: 'Sat', spend: 380 }, { day: 'Sun', spend: 290 },
];

interface Campaign {
  id: string; name: string; status: 'active' | 'paused' | 'completed' | 'underperforming';
  spend: string; impressions: string; clicks: string; conversions: number; objective: string;
}

const CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Q2 Talent Acquisition', status: 'active', spend: '$4,200', impressions: '128K', clicks: '3.2K', conversions: 42, objective: 'Hiring' },
  { id: '2', name: 'Enterprise Brand Awareness', status: 'active', spend: '$8,500', impressions: '450K', clicks: '12K', conversions: 85, objective: 'Brand' },
  { id: '3', name: 'Service Marketplace Push', status: 'underperforming', spend: '$3,100', impressions: '45K', clicks: '890', conversions: 8, objective: 'Growth' },
  { id: '4', name: 'Webinar Series Promo', status: 'paused', spend: '$1,200', impressions: '28K', clicks: '1.5K', conversions: 22, objective: 'Events' },
  { id: '5', name: 'Q1 Lead Gen', status: 'completed', spend: '$12,000', impressions: '680K', clicks: '18K', conversions: 156, objective: 'Leads' },
];

const STATUS_MAP: Record<string, { badge: 'live' | 'caution' | 'healthy' | 'pending'; label: string }> = {
  active: { badge: 'live', label: 'Active' }, paused: { badge: 'pending', label: 'Paused' },
  completed: { badge: 'healthy', label: 'Completed' }, underperforming: { badge: 'caution', label: 'Underperforming' },
};

export default function EntCampaignsGrowthPage() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? CAMPAIGNS : CAMPAIGNS.filter(c => c.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2"><Megaphone className="h-5 w-5 text-accent" /> Campaigns & Growth</h1>
          <p className="text-[11px] text-muted-foreground">Monitor ad campaigns, growth initiatives, and marketing performance</p>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><ExternalLink className="h-3.5 w-3.5" />Ads Manager</Button>
      </div>

      <KPIBand className="grid-cols-2 md:grid-cols-5">
        <KPICard label="Active Campaigns" value="2" />
        <KPICard label="Monthly Spend" value="$15.8K" change="+12%" trend="up" />
        <KPICard label="Total Impressions" value="651K" change="+28%" trend="up" />
        <KPICard label="Conversions" value="157" change="+22%" trend="up" />
        <KPICard label="Avg CPA" value="$42" change="-$8" trend="up" />
      </KPIBand>

      <SectionCard title="Spend Trend (7 Days)" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={SPEND_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v: number) => [`$${v}`, 'Spend']} contentStyle={{ fontSize: 10, borderRadius: 12 }} />
              <Area type="monotone" dataKey="spend" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {['all', 'active', 'underperforming', 'paused', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all capitalize',
            filter === f ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>{f}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(c => {
          const sm = STATUS_MAP[c.status];
          return (
            <div key={c.id} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer group">
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                <Megaphone className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold group-hover:text-accent transition-colors">{c.name}</span>
                  <StatusBadge status={sm.badge} label={sm.label} />
                  <Badge variant="outline" className="text-[7px] rounded-lg">{c.objective}</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground flex items-center gap-3">
                  <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{c.spend}</span>
                  <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{c.impressions}</span>
                  <span className="flex items-center gap-0.5"><Target className="h-2.5 w-2.5" />{c.conversions} conv</span>
                </div>
              </div>
              {c.status === 'underperforming' && <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))] shrink-0" />}
              <div className="flex gap-1 shrink-0">
                {c.status === 'active' && <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-0.5"><Pause className="h-2.5 w-2.5" />Pause</Button>}
                {c.status === 'paused' && <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-0.5"><Play className="h-2.5 w-2.5" />Resume</Button>}
                <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-0.5"><BarChart3 className="h-2.5 w-2.5" />Analytics</Button>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
