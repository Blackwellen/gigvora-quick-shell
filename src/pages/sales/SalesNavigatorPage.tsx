import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Compass, Search, Target, Users, Building2, Zap, MapPin, BarChart3,
  Mail, ListPlus, Brain, Network, Globe, Settings, Shield, BookOpen,
  TrendingUp, ArrowRight, Clock, Star, Eye, Bookmark, ChevronRight,
  Activity, Sparkles, Plus, Filter, UserPlus, Hash, Crown, Layers,
} from 'lucide-react';
import { toast } from 'sonner';

/* ── Nav Tiles ── */
const NAV_SECTIONS = [
  { id: 'leads', label: 'Lead Search', icon: Target, route: '/navigator/leads', desc: 'Find and qualify prospects with AI scoring', color: 'bg-accent/10 text-accent', count: '156 leads' },
  { id: 'talent', label: 'Talent Search', icon: Users, route: '/navigator/talent', desc: 'Source candidates with intent signals', color: 'bg-primary/10 text-primary', count: '89 matches' },
  { id: 'accounts', label: 'Account Search', icon: Building2, route: '/navigator/accounts', desc: 'Company intelligence and buying signals', color: 'bg-[hsl(var(--gigvora-blue))]/10 text-[hsl(var(--gigvora-blue))]', count: '43 accounts' },
  { id: 'intel', label: 'Company Intel', icon: Brain, route: '/navigator/company-intel', desc: 'Deep company profiles and org charts', color: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]', count: '28 tracked' },
  { id: 'saved', label: 'Saved Lists', icon: Bookmark, route: '/navigator/saved-lists', desc: 'Manual prospect and talent lists', color: 'bg-accent/10 text-accent', count: '12 lists' },
  { id: 'smart', label: 'Smart Lists', icon: Sparkles, route: '/navigator/smart-lists', desc: 'AI-curated dynamic prospect lists', color: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]', count: '6 active' },
  { id: 'outreach', label: 'Outreach Workspace', icon: Mail, route: '/navigator/outreach', desc: 'Templates, sequences, and conversion tracking', color: 'bg-primary/10 text-primary', count: '3 active' },
  { id: 'graph', label: 'Relationship Graph', icon: Network, route: '/navigator/graph', desc: 'Connection paths and mutual introductions', color: 'bg-accent/10 text-accent', count: '1.2K mapped' },
  { id: 'geo', label: 'Region / Geo View', icon: Globe, route: '/navigator/geo', desc: 'Map view of prospect clusters and accounts', color: 'bg-[hsl(var(--gigvora-blue))]/10 text-[hsl(var(--gigvora-blue))]', count: '8 regions' },
  { id: 'signals', label: 'Signal View', icon: Zap, route: '/navigator/signals', desc: 'Buying, hiring, and activity signals feed', color: 'bg-[hsl(var(--state-live))]/10 text-[hsl(var(--state-live))]', count: '24 new' },
  { id: 'analytics', label: 'Navigator Analytics', icon: BarChart3, route: '/navigator/analytics', desc: 'Pipeline, conversion, and performance metrics', color: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]', count: 'Live' },
  { id: 'seats', label: 'Seat Management', icon: Shield, route: '/navigator/seats', desc: 'Team seats, roles, and usage quotas', color: 'bg-muted text-muted-foreground', count: '4 seats' },
];

const RECENT_SIGNALS = [
  { id: 1, signal: 'NexaFlow raised Series A ($12M)', type: 'funding', time: '2h ago', icon: TrendingUp },
  { id: 2, signal: 'TechCorp posted 4 new engineering roles', type: 'hiring', time: '4h ago', icon: Users },
  { id: 3, signal: 'Sarah Chen promoted to VP Engineering', type: 'new_role', time: '1d ago', icon: Star },
  { id: 4, signal: 'CloudScale expanding to EMEA market', type: 'expanding', time: '1d ago', icon: Globe },
  { id: 5, signal: 'DataFlow increased headcount by 20%', type: 'expanding', time: '3d ago', icon: Activity },
];

const SAVED_SEARCHES = [
  { name: 'CTOs at Series B+ SaaS', results: 34, updated: '1h ago' },
  { name: 'ML Engineers, Open to Work, Bay Area', results: 18, updated: '3h ago' },
  { name: 'VP Sales at FinTech, 200+ employees', results: 12, updated: '1d ago' },
  { name: 'Design Directors, Enterprise', results: 21, updated: '2d ago' },
];

const SalesNavigatorPage: React.FC = () => {
  const topStrip = (
    <>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center">
          <Compass className="h-3.5 w-3.5 text-accent" />
        </div>
        <span className="text-xs font-bold">Gigvora Navigator</span>
        <Badge className="bg-accent/10 text-accent text-[7px] h-4 rounded-lg border-0">Premium</Badge>
      </div>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input placeholder="Search leads, talent, accounts..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[10px] w-56 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
      </div>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Settings className="h-3 w-3" />Settings</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Quick Stats" className="!rounded-2xl">
        <div className="space-y-2">
          {[
            { l: 'Active Leads', v: '156', c: '+12 this week', color: 'text-accent' },
            { l: 'Pipeline Value', v: '$245K', c: '12 opportunities', color: 'text-[hsl(var(--state-healthy))]' },
            { l: 'Reply Rate', v: '31%', c: '+5% vs last month', color: 'text-primary' },
            { l: 'Outreach Sent', v: '135', c: '3 sequences active', color: 'text-[hsl(var(--gigvora-amber))]' },
          ].map(s => (
            <div key={s.l} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <div>
                <div className="text-[9px] text-muted-foreground">{s.l}</div>
                <div className={cn('text-sm font-bold', s.color)}>{s.v}</div>
              </div>
              <span className="text-[8px] text-muted-foreground">{s.c}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Saved Searches" className="!rounded-2xl" action={<Button variant="ghost" size="sm" className="h-5 text-[8px] rounded-lg"><Plus className="h-2 w-2 mr-0.5" />New</Button>}>
        <div className="space-y-1">
          {SAVED_SEARCHES.map(s => (
            <button key={s.name} className="flex items-center gap-1.5 p-1.5 rounded-xl w-full text-left hover:bg-muted/30 transition-colors text-[9px]">
              <Search className="h-3 w-3 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{s.name}</div>
                <div className="text-[8px] text-muted-foreground">{s.results} results · {s.updated}</div>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Usage This Month" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[
            { l: 'Searches', used: 234, limit: 500 },
            { l: 'Profile Views', used: 89, limit: 200 },
            { l: 'InMails Sent', used: 18, limit: 50 },
            { l: 'Exports', used: 3, limit: 10 },
          ].map(u => (
            <div key={u.l}>
              <div className="flex justify-between mb-0.5">
                <span className="text-muted-foreground">{u.l}</span>
                <span className="font-semibold">{u.used}/{u.limit}</span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${(u.used / u.limit) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-4">
      <div className="text-[11px] font-bold mb-2.5 flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-accent" />Live Signal Feed</div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {RECENT_SIGNALS.map(s => (
          <div key={s.id} className="shrink-0 rounded-2xl border bg-card px-3.5 py-2.5 min-w-[240px] hover:shadow-sm cursor-pointer transition-all">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-lg bg-accent/10 flex items-center justify-center">
                <s.icon className="h-3 w-3 text-accent" />
              </div>
              <Badge variant="secondary" className="text-[7px] capitalize rounded-lg">{s.type.replace('_', ' ')}</Badge>
              <span className="text-[8px] text-muted-foreground ml-auto">{s.time}</span>
            </div>
            <p className="text-[9px] text-muted-foreground">{s.signal}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      {/* KPI Band */}
      <KPIBand className="mb-4">
        <KPICard label="Pipeline Value" value="$245K" change="+18% this month" trend="up" className="!rounded-2xl" />
        <KPICard label="Active Leads" value="156" change="+12 this week" trend="up" className="!rounded-2xl" />
        <KPICard label="Reply Rate" value="31%" change="+5% vs last month" trend="up" className="!rounded-2xl" />
        <KPICard label="Conversion" value="18%" change="Lead to Opp" className="!rounded-2xl" />
      </KPIBand>

      {/* Navigator Workbenches Grid */}
      <div className="mb-4">
        <div className="text-[12px] font-bold mb-2.5">Navigator Workbenches</div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
          {NAV_SECTIONS.map(s => (
            <Link key={s.id} to={s.route} className="rounded-2xl border bg-card p-3.5 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all group">
              <div className="flex items-start gap-3">
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110', s.color)}>
                  <s.icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold group-hover:text-accent transition-colors flex items-center gap-1.5">
                    {s.label}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{s.desc}</div>
                  <Badge variant="secondary" className="text-[7px] h-3.5 rounded-lg mt-1.5">{s.count}</Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <SectionCard title="Recent Navigator Activity" className="!rounded-2xl">
        <div className="space-y-1.5">
          {[
            { action: 'Saved Elena Rodriguez (CTO, CloudScale) to "Q2 Target CTOs"', time: '4h ago', type: 'save' },
            { action: 'Exported 18 leads from "FinTech Hiring Signals" list', time: '1d ago', type: 'export' },
            { action: 'Sent InMail to Marcus Johnson (ScaleUp Inc)', time: '2d ago', type: 'outreach' },
            { action: 'Created smart list: "Series B+ CTOs, West Coast"', time: '3d ago', type: 'list' },
            { action: 'Viewed company intel: NexaFlow (AI/ML)', time: '3d ago', type: 'view' },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer">
              <Badge variant="secondary" className="text-[7px] capitalize rounded-lg shrink-0">{a.type}</Badge>
              <span className="text-[9px] flex-1 min-w-0 truncate">{a.action}</span>
              <span className="text-[8px] text-muted-foreground shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
};

export default SalesNavigatorPage;
