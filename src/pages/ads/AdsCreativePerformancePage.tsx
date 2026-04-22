import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Image, BarChart3, TrendingUp, TrendingDown, Eye, MousePointer,
  AlertTriangle, RefreshCw, Clock, Filter, MoreHorizontal, Zap,
} from 'lucide-react';

interface Creative {
  id: string; name: string; format: 'image' | 'video' | 'carousel' | 'text';
  impressions: number; clicks: number; ctr: number; conversions: number;
  spend: number; fatigue: number; // 0-100, >70 = fatigued
  status: 'active' | 'paused' | 'fatigued'; age: string;
  variants: number; bestVariant?: string;
}

const CREATIVES: Creative[] = [
  { id: 'C1', name: 'Enterprise Platform Hero — V3', format: 'image', impressions: 342000, clicks: 8550, ctr: 2.5, conversions: 342, spend: 5985, fatigue: 23, status: 'active', age: '12d', variants: 4, bestVariant: 'Dark mode variant' },
  { id: 'C2', name: 'Product Demo — 30s Cut', format: 'video', impressions: 189000, clicks: 5670, ctr: 3.0, conversions: 227, spend: 3969, fatigue: 45, status: 'active', age: '21d', variants: 2 },
  { id: 'C3', name: 'Customer Testimonial Carousel', format: 'carousel', impressions: 156000, clicks: 3900, ctr: 2.5, conversions: 156, spend: 2730, fatigue: 67, status: 'active', age: '34d', variants: 3, bestVariant: 'Slide order B' },
  { id: 'C4', name: 'Q1 Promo Banner', format: 'image', impressions: 98000, clicks: 1470, ctr: 1.5, conversions: 44, spend: 1029, fatigue: 82, status: 'fatigued', age: '56d', variants: 2 },
  { id: 'C5', name: 'Thought Leadership Text Ad', format: 'text', impressions: 67000, clicks: 1340, ctr: 2.0, conversions: 40, spend: 670, fatigue: 15, status: 'active', age: '7d', variants: 1 },
  { id: 'C6', name: 'Hiring Campaign — Paused', format: 'image', impressions: 45000, clicks: 675, ctr: 1.5, conversions: 14, spend: 473, fatigue: 0, status: 'paused', age: '45d', variants: 1 },
];

const FORMAT_COLORS: Record<string, string> = {
  image: 'bg-accent/10 text-accent',
  video: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]',
  carousel: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  text: 'bg-muted text-muted-foreground',
};

const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
const fmtD = (n: number) => `$${n.toLocaleString()}`;

const AdsCreativePerformancePage: React.FC = () => {
  const [sortBy, setSortBy] = useState<'ctr' | 'conversions' | 'fatigue'>('ctr');
  const sorted = [...CREATIVES].sort((a, b) => sortBy === 'fatigue' ? b.fatigue - a.fatigue : sortBy === 'ctr' ? b.ctr - a.ctr : b.conversions - a.conversions);

  const topStrip = (
    <>
      <Image className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Ads — Creative Performance Center</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 text-[9px]">
        <span className="text-muted-foreground">Sort:</span>
        {(['ctr', 'conversions', 'fatigue'] as const).map(s => (
          <button key={s} onClick={() => setSortBy(s)} className={cn('px-2 py-1 rounded-lg font-medium transition-colors capitalize', sortBy === s ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{s === 'ctr' ? 'CTR' : s}</button>
        ))}
      </div>
    </>
  );

  const fatigued = CREATIVES.filter(c => c.fatigue > 70);

  const rightRail = (
    <div className="space-y-3">
      {fatigued.length > 0 && (
        <SectionCard title="⚠ Fatigue Alerts" className="!rounded-2xl border-[hsl(var(--state-caution)/0.3)]">
          <div className="space-y-1.5 text-[9px]">
            {fatigued.map(c => (
              <div key={c.id} className="flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-[hsl(var(--state-caution))]" />
                <span className="truncate flex-1">{c.name}</span>
                <Badge className="bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))] text-[7px] border-0 rounded-lg">{c.fatigue}%</Badge>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full h-6 text-[8px] rounded-xl gap-1 mt-1"><RefreshCw className="h-2.5 w-2.5" />Rotate Creatives</Button>
          </div>
        </SectionCard>
      )}
      <SectionCard title="Format Mix" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {(['image', 'video', 'carousel', 'text'] as const).map(f => (
            <div key={f} className="flex items-center gap-2">
              <Badge className={cn('text-[7px] border-0 capitalize w-14 justify-center rounded-lg', FORMAT_COLORS[f])}>{f}</Badge>
              <span className="font-semibold">{CREATIVES.filter(c => c.format === f).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Active Creatives" value={String(CREATIVES.filter(c => c.status === 'active').length)} change={`of ${CREATIVES.length}`} className="!rounded-2xl" />
        <KPICard label="Top CTR" value={`${Math.max(...CREATIVES.map(c => c.ctr))}%`} change={CREATIVES.sort((a, b) => b.ctr - a.ctr)[0]?.name.slice(0, 20)} className="!rounded-2xl" />
        <KPICard label="Total Conversions" value={String(CREATIVES.reduce((s, c) => s + c.conversions, 0))} change="All creatives" className="!rounded-2xl" />
        <KPICard label="Fatigued" value={String(fatigued.length)} change="Need rotation" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {sorted.map(cr => (
          <div key={cr.id} className={cn('rounded-2xl border bg-card p-4 transition-all', cr.status !== 'paused' ? 'hover:shadow-sm' : 'opacity-60')}>
            <div className="flex items-center gap-3 mb-2.5">
              <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', FORMAT_COLORS[cr.format])}>
                <Image className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold truncate">{cr.name}</span>
                  <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', FORMAT_COLORS[cr.format])}>{cr.format}</Badge>
                  <StatusBadge status={cr.status === 'active' ? 'healthy' : cr.status === 'fatigued' ? 'caution' : 'pending'} label={cr.status} />
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{cr.age} old</span>
                  <span>·</span>
                  <span>{cr.variants} variant{cr.variants > 1 ? 's' : ''}</span>
                  {cr.bestVariant && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 text-accent"><Zap className="h-2.5 w-2.5" />{cr.bestVariant}</span>
                    </>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
            </div>

            <div className="grid grid-cols-5 gap-2 mb-2">
              {[
                { l: 'Impressions', v: fmt(cr.impressions) },
                { l: 'Clicks', v: fmt(cr.clicks) },
                { l: 'CTR', v: `${cr.ctr}%` },
                { l: 'Conversions', v: String(cr.conversions) },
                { l: 'Spend', v: fmtD(cr.spend) },
              ].map(m => (
                <div key={m.l} className="rounded-xl bg-muted/30 p-2">
                  <div className="text-[8px] text-muted-foreground mb-0.5">{m.l}</div>
                  <div className="text-[10px] font-bold">{m.v}</div>
                </div>
              ))}
            </div>

            {/* Fatigue bar */}
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-muted-foreground w-14">Fatigue</span>
              <Progress value={cr.fatigue} className={cn('h-1.5 flex-1', cr.fatigue > 70 ? '[&>div]:bg-[hsl(var(--state-caution))]' : '')} />
              <span className={cn('text-[9px] font-semibold', cr.fatigue > 70 ? 'text-[hsl(var(--state-caution))]' : '')}>{cr.fatigue}%</span>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdsCreativePerformancePage;
