import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Megaphone, Target, Users, Image, Globe, BarChart3, DollarSign,
  Layers, Hash, Sparkles, ArrowRight, Activity, TrendingUp, Settings,
  Search, Eye, MousePointer, Zap, Shield, FileText, PieChart,
  Lightbulb, CreditCard, Plus, Clock,
} from 'lucide-react';

const NAV_SECTIONS = [
  { id: 'campaigns', label: 'Campaign List', icon: Megaphone, route: '/ads/campaigns', desc: 'All campaigns with status, pacing, and performance', color: 'bg-accent/10 text-accent', count: '8 active' },
  { id: 'adset', label: 'Ad Set Builder', icon: Layers, route: '/ads/adset-builder', desc: 'Create and manage ad sets with targeting rules', color: 'bg-primary/10 text-primary', count: '14 sets' },
  { id: 'creative', label: 'Creative Builder', icon: Image, route: '/ads/creative-builder', desc: 'Design ads with placement preview and variations', color: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]', count: '23 creatives' },
  { id: 'assets', label: 'Asset Library', icon: FileText, route: '/ads/assets', desc: 'Images, video, audio, carousels, and reusable creatives', color: 'bg-accent/10 text-accent', count: '156 assets' },
  { id: 'audience', label: 'Audience Builder', icon: Users, route: '/ads/audience-builder', desc: 'Custom, lookalike, retargeting with exclusions and overlaps', color: 'bg-[hsl(var(--gigvora-blue))]/10 text-[hsl(var(--gigvora-blue))]', count: '9 segments' },
  { id: 'keywords', label: 'Keyword Builder', icon: Hash, route: '/ads/keyword-builder', desc: 'Keyword targeting, negatives, and match types', color: 'bg-primary/10 text-primary', count: '342 keywords' },
  { id: 'geo', label: 'Geo Targeting Map', icon: Globe, route: '/ads/geo-targeting', desc: 'Map views for geo targeting, exclusions, spend distribution', color: 'bg-[hsl(var(--gigvora-blue))]/10 text-[hsl(var(--gigvora-blue))]', count: '12 regions' },
  { id: 'forecast', label: 'Forecasting', icon: Lightbulb, route: '/ads/forecasting', desc: 'Reach estimation, spend modeling, and scenario planning', color: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]', count: '3 models' },
  { id: 'bids', label: 'Bid & Budget Controls', icon: DollarSign, route: '/ads/bid-budget', desc: 'Bidding strategies, budget allocation, and pacing rules', color: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]', count: '5 rules' },
  { id: 'billing', label: 'Billing & Spend', icon: CreditCard, route: '/ads/billing', desc: 'Invoicing, thresholds, payment recovery, and spend center', color: 'bg-muted text-muted-foreground', count: '$18.4K MTD' },
  { id: 'analytics', label: 'Ads Analytics', icon: BarChart3, route: '/ads/analytics', desc: 'CPC, CPM, CPI, CPA, CTR, conversion, frequency, fatigue', color: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]', count: 'Live' },
  { id: 'compare', label: 'Creative Comparison', icon: PieChart, route: '/ads/creative-compare', desc: 'A/B test results, variation performance, winner analysis', color: 'bg-accent/10 text-accent', count: '4 tests' },
  { id: 'attribution', label: 'Attribution & Events', icon: Zap, route: '/ads/attribution', desc: 'Conversion event mapping, multi-touch attribution models', color: 'bg-[hsl(var(--state-live))]/10 text-[hsl(var(--state-live))]', count: '8 events' },
  { id: 'ops', label: 'Ads Ops Queue', icon: Shield, route: '/ads/ops', desc: 'Review queue, policy diagnostics, quality checks', color: 'bg-destructive/10 text-destructive', count: '5 pending' },
];

const RECENT_ACTIVITY = [
  { action: 'Campaign "Q2 Brand Awareness" reached 145K impressions', time: '2h ago', type: 'milestone' },
  { action: 'Creative "Hero Banner v3" approved for all placements', time: '4h ago', type: 'approval' },
  { action: 'Budget increased on "Recruiter Pro Launch" to $8,000', time: '1d ago', type: 'budget' },
  { action: 'Audience "Tech Decision Makers" updated — 45K reach', time: '1d ago', type: 'audience' },
  { action: 'Geo exclusion added: Russia, Belarus for all campaigns', time: '2d ago', type: 'geo' },
];

const AdsHomePage: React.FC = () => {
  const topStrip = (
    <>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Megaphone className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Gigvora Ads</span>
        <Badge className="bg-accent/10 text-accent text-[7px] h-4 rounded-lg border-0">Ad Platform</Badge>
      </div>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input placeholder="Search campaigns, creatives..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[10px] w-56 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
      </div>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />New Campaign</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Quick Stats" className="!rounded-2xl">
        <div className="space-y-2">
          {[
            { l: 'Active Campaigns', v: '8', color: 'text-accent' },
            { l: 'Total Spend MTD', v: '$18.4K', color: 'text-[hsl(var(--gigvora-amber))]' },
            { l: 'Avg CTR', v: '3.2%', color: 'text-[hsl(var(--state-healthy))]' },
            { l: 'Total Conversions', v: '456', color: 'text-primary' },
          ].map(s => (
            <div key={s.l} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <div className="text-[9px] text-muted-foreground">{s.l}</div>
              <div className={cn('text-sm font-bold', s.color)}>{s.v}</div>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Budget Health" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[
            { l: 'Monthly Budget', used: 18400, limit: 30000 },
            { l: 'Daily Pacing', used: 612, limit: 1000 },
          ].map(u => (
            <div key={u.l}>
              <div className="flex justify-between mb-0.5"><span className="text-muted-foreground">{u.l}</span><span className="font-semibold">${u.used.toLocaleString()}/${u.limit.toLocaleString()}</span></div>
              <div className="h-1 rounded-full bg-muted overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${(u.used / u.limit) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-4">
      <div className="text-[11px] font-bold mb-2.5 flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-accent" />Recent Activity</div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {RECENT_ACTIVITY.map((a, i) => (
          <div key={i} className="shrink-0 rounded-2xl border bg-card px-3.5 py-2.5 min-w-[240px] hover:shadow-sm cursor-pointer transition-all">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-[7px] capitalize rounded-lg">{a.type}</Badge>
              <span className="text-[8px] text-muted-foreground ml-auto">{a.time}</span>
            </div>
            <p className="text-[9px] text-muted-foreground">{a.action}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      <KPIBand className="mb-4">
        <KPICard label="Active Campaigns" value="8" change="+2 this week" trend="up" className="!rounded-2xl" />
        <KPICard label="Total Spend" value="$18.4K" change="MTD" className="!rounded-2xl" />
        <KPICard label="Avg CTR" value="3.2%" change="+0.4%" trend="up" className="!rounded-2xl" />
        <KPICard label="ROAS" value="4.1x" change="Blended" className="!rounded-2xl" />
      </KPIBand>

      <div className="mb-4">
        <div className="text-[12px] font-bold mb-2.5">Ads Workbenches</div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
          {NAV_SECTIONS.map(s => (
            <Link key={s.id} to={s.route} className="rounded-2xl border bg-card p-3.5 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all group">
              <div className="flex items-start gap-3">
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110', s.color)}>
                  <s.icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold group-hover:text-accent transition-colors flex items-center gap-1.5">
                    {s.label}<ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{s.desc}</div>
                  <Badge variant="secondary" className="text-[7px] h-3.5 rounded-lg mt-1.5">{s.count}</Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdsHomePage;
