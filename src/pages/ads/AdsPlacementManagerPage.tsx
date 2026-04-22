import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Layout, BarChart3, Eye, DollarSign, MousePointer, TrendingUp,
  Settings, MoreHorizontal, Monitor, Smartphone, Globe,
} from 'lucide-react';

interface Placement {
  id: string; name: string; location: string; device: 'all' | 'desktop' | 'mobile';
  impressions: number; clicks: number; ctr: number; spend: number; conversions: number;
  cpc: number; enabled: boolean; quality: 'high' | 'medium' | 'low';
}

const PLACEMENTS: Placement[] = [
  { id: 'P1', name: 'Feed — In-Stream Card', location: 'Main Feed', device: 'all', impressions: 245000, clicks: 4900, ctr: 2.0, spend: 3420, conversions: 147, cpc: 0.70, enabled: true, quality: 'high' },
  { id: 'P2', name: 'Profile Sidebar', location: 'Profile Page', device: 'desktop', impressions: 89000, clicks: 1780, ctr: 2.0, spend: 1246, conversions: 53, cpc: 0.70, enabled: true, quality: 'high' },
  { id: 'P3', name: 'Job Search Results', location: 'Jobs Discovery', device: 'all', impressions: 156000, clicks: 3900, ctr: 2.5, spend: 2730, conversions: 98, cpc: 0.70, enabled: true, quality: 'high' },
  { id: 'P4', name: 'Messaging Sponsored', location: 'Inbox', device: 'all', impressions: 67000, clicks: 1340, ctr: 2.0, spend: 2010, conversions: 67, cpc: 1.50, enabled: true, quality: 'medium' },
  { id: 'P5', name: 'Gig Discovery Banner', location: 'Gigs Marketplace', device: 'all', impressions: 112000, clicks: 2240, ctr: 2.0, spend: 1568, conversions: 45, cpc: 0.70, enabled: true, quality: 'medium' },
  { id: 'P6', name: 'Mobile Interstitial', location: 'App Navigation', device: 'mobile', impressions: 34000, clicks: 340, ctr: 1.0, spend: 510, conversions: 8, cpc: 1.50, enabled: false, quality: 'low' },
];

const QUALITY_COLORS: Record<string, string> = {
  high: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  medium: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  low: 'bg-[hsl(var(--state-blocked)/0.1)] text-[hsl(var(--state-blocked))]',
};

const AdsPlacementManagerPage: React.FC = () => {
  const [placements, setPlacements] = useState(PLACEMENTS);
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
  const fmtD = (n: number) => `$${n.toLocaleString()}`;

  const topStrip = (
    <>
      <Layout className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Ads — Placement Manager</span>
      <div className="flex-1" />
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Settings className="h-3 w-3" />Settings</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="By Device" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[{ d: 'All', icon: Globe }, { d: 'Desktop', icon: Monitor }, { d: 'Mobile', icon: Smartphone }].map(({ d, icon: Icon }) => (
            <div key={d} className="flex items-center gap-1.5">
              <Icon className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground flex-1">{d}</span>
              <span className="font-semibold">{placements.filter(p => p.device === d.toLowerCase() || (d === 'All' && p.device === 'all')).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Quality Mix" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {(['high', 'medium', 'low'] as const).map(q => (
            <div key={q} className="flex items-center gap-2">
              <Badge className={cn('text-[7px] border-0 capitalize w-14 justify-center rounded-lg', QUALITY_COLORS[q])}>{q}</Badge>
              <span className="font-semibold">{placements.filter(p => p.quality === q).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const totalSpend = placements.filter(p => p.enabled).reduce((s, p) => s + p.spend, 0);
  const totalConversions = placements.filter(p => p.enabled).reduce((s, p) => s + p.conversions, 0);

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Active Placements" value={String(placements.filter(p => p.enabled).length)} change={`of ${placements.length}`} className="!rounded-2xl" />
        <KPICard label="Total Spend" value={fmtD(totalSpend)} change="Active placements" className="!rounded-2xl" />
        <KPICard label="Conversions" value={String(totalConversions)} change="All placements" className="!rounded-2xl" />
        <KPICard label="Avg CPC" value={`$${(totalSpend / placements.filter(p => p.enabled).reduce((s, p) => s + p.clicks, 0)).toFixed(2)}`} change="Blended" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {placements.map((pl, idx) => (
          <div key={pl.id} className={cn('rounded-2xl border bg-card p-4 transition-all', pl.enabled ? 'hover:shadow-sm' : 'opacity-60')}>
            <div className="flex items-center gap-3 mb-2.5">
              <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
                <Layout className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold truncate">{pl.name}</span>
                  <Badge className={cn('text-[7px] border-0 rounded-lg', QUALITY_COLORS[pl.quality])}>{pl.quality} quality</Badge>
                  <Badge variant="outline" className="text-[7px] h-3.5 rounded-lg capitalize">{pl.device}</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{pl.location}</div>
              </div>
              <Switch checked={pl.enabled} onCheckedChange={v => setPlacements(ps => ps.map((p, i) => i === idx ? { ...p, enabled: v } : p))} />
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[
                { l: 'Impressions', v: fmt(pl.impressions), icon: Eye },
                { l: 'Clicks', v: fmt(pl.clicks), icon: MousePointer },
                { l: 'CTR', v: `${pl.ctr}%`, icon: TrendingUp },
                { l: 'Spend', v: fmtD(pl.spend), icon: DollarSign },
                { l: 'Conversions', v: String(pl.conversions), icon: BarChart3 },
              ].map(m => (
                <div key={m.l} className="rounded-xl bg-muted/30 p-2">
                  <div className="flex items-center gap-1 text-[8px] text-muted-foreground mb-0.5"><m.icon className="h-2.5 w-2.5" />{m.l}</div>
                  <div className="text-[10px] font-bold">{m.v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdsPlacementManagerPage;
