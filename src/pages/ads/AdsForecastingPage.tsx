import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Lightbulb, TrendingUp, DollarSign, Users, Target, Eye, BarChart3,
  Zap, Globe, ChevronRight, Sparkles, Layers, Settings,
} from 'lucide-react';

interface ForecastScenario {
  id: string; name: string; budget: string; duration: string;
  estReach: string; estImpressions: string; estClicks: string;
  estCTR: string; estConversions: string; estCPA: string; estROAS: string;
  confidence: 'high' | 'medium' | 'low';
}

const SCENARIOS: ForecastScenario[] = [
  { id: 'F-1', name: 'Conservative — $5K/mo', budget: '$5,000', duration: '30 days', estReach: '1.2M - 1.8M', estImpressions: '180K - 240K', estClicks: '3.6K - 5.4K', estCTR: '2.0% - 2.3%', estConversions: '45 - 68', estCPA: '$73 - $111', estROAS: '2.8x - 3.4x', confidence: 'high' },
  { id: 'F-2', name: 'Moderate — $10K/mo', budget: '$10,000', duration: '30 days', estReach: '2.4M - 3.6M', estImpressions: '360K - 480K', estClicks: '7.2K - 10.8K', estCTR: '2.0% - 2.3%', estConversions: '90 - 135', estCPA: '$74 - $111', estROAS: '3.2x - 4.1x', confidence: 'high' },
  { id: 'F-3', name: 'Aggressive — $25K/mo', budget: '$25,000', duration: '30 days', estReach: '5.5M - 8.0M', estImpressions: '850K - 1.1M', estClicks: '17K - 25K', estCTR: '2.0% - 2.3%', estConversions: '200 - 310', estCPA: '$81 - $125', estROAS: '3.0x - 3.8x', confidence: 'medium' },
];

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  medium: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  low: 'bg-destructive/10 text-destructive',
};

const AdsForecastingPage: React.FC = () => {
  const topStrip = (
    <>
      <Lightbulb className="h-4 w-4 text-[hsl(var(--state-healthy))]" />
      <span className="text-xs font-semibold">Ads — Forecasting Workbench</span>
      <Badge className="bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] text-[7px] border-0">AI-Powered</Badge>
      <div className="flex-1" />
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Sparkles className="h-3 w-3" />New Forecast</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Forecast Inputs" className="!rounded-2xl">
        <div className="space-y-2 text-[9px]">
          {[
            { l: 'Objective', v: 'Conversions' },
            { l: 'Audience', v: 'Tech Decision Makers' },
            { l: 'Geo', v: 'US, UK, CA, AU' },
            { l: 'Placements', v: 'Feed, Stories, Sidebar' },
            { l: 'Creative Types', v: 'Image, Video' },
          ].map(m => (
            <div key={m.l} className="flex justify-between py-1 border-b last:border-0">
              <span className="text-muted-foreground">{m.l}</span>
              <span className="font-semibold">{m.v}</span>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full h-6 text-[8px] rounded-lg mt-1"><Settings className="h-2.5 w-2.5 mr-0.5" />Adjust Inputs</Button>
        </div>
      </SectionCard>
      <SectionCard title="Benchmarks" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {[
            { l: 'Industry Avg CTR', v: '1.8%' },
            { l: 'Industry Avg CPA', v: '$95' },
            { l: 'Your Avg CTR', v: '2.6%' },
            { l: 'Your Avg CPA', v: '$52' },
          ].map(b => (
            <div key={b.l} className="flex justify-between"><span className="text-muted-foreground">{b.l}</span><span className="font-semibold">{b.v}</span></div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52">
      <KPIBand className="mb-4">
        <KPICard label="Models Run" value={String(SCENARIOS.length)} change="This week" className="!rounded-2xl" />
        <KPICard label="Best Est. ROAS" value="4.1x" change="Moderate budget" className="!rounded-2xl" />
        <KPICard label="Optimal Budget" value="$10K/mo" change="AI recommended" className="!rounded-2xl" />
        <KPICard label="Confidence" value="High" change="85% accuracy" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-3">
        {SCENARIOS.map(s => (
          <div key={s.id} className="rounded-2xl border bg-card p-4 hover:shadow-md cursor-pointer transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-accent" />
                <span className="text-[12px] font-bold">{s.name}</span>
                <Badge className={cn('text-[7px] border-0 capitalize', CONFIDENCE_COLORS[s.confidence])}>{s.confidence} confidence</Badge>
              </div>
              <div className="text-[9px] text-muted-foreground">{s.duration}</div>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2 text-center text-[9px]">
              {[
                { l: 'Budget', v: s.budget },
                { l: 'Est. Reach', v: s.estReach },
                { l: 'Est. Impressions', v: s.estImpressions },
                { l: 'Est. Clicks', v: s.estClicks },
                { l: 'Est. CTR', v: s.estCTR },
                { l: 'Est. Conversions', v: s.estConversions },
                { l: 'Est. ROAS', v: s.estROAS },
              ].map(m => (
                <div key={m.l} className="rounded-xl bg-muted/30 p-2">
                  <div className="text-[10px] font-bold">{m.v}</div>
                  <div className="text-[7px] text-muted-foreground">{m.l}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdsForecastingPage;
