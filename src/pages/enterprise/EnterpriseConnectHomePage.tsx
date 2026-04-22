import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Building2, Users, Search, Handshake, Globe, BarChart3, Rocket,
  ShoppingCart, Calendar, MessageSquare, Shield, Target,
  ArrowRight, Activity, Plus, Sparkles, FileText, Bookmark,
  UserPlus, TrendingUp, Lock,
} from 'lucide-react';

const WORKBENCHES = [
  { id: 'directory', label: 'Enterprise Directory', icon: Building2, route: '/enterprise-connect/directory', desc: 'Browse and filter verified enterprises by sector, region, and trust level', color: 'bg-accent/10 text-accent', count: '2,340 orgs' },
  { id: 'profile', label: 'Enterprise Profile', icon: FileText, route: '/enterprise-connect/profile', desc: 'Deep org profiles with procurement signals, partnerships, and team', color: 'bg-primary/10 text-primary', count: 'Your org' },
  { id: 'partners', label: 'Partner Discovery', icon: Handshake, route: '/enterprise-connect/partners', desc: 'Find strategic partners by service alignment, region, and trust tier', color: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]', count: '156 matches' },
  { id: 'procurement', label: 'Procurement Discovery', icon: ShoppingCart, route: '/enterprise-connect/procurement', desc: 'Browse procurement opportunities, RFPs, and vendor requirements', color: 'bg-[hsl(var(--gigvora-blue))]/10 text-[hsl(var(--gigvora-blue))]', count: '45 active' },
  { id: 'intros', label: 'Enterprise Intros', icon: UserPlus, route: '/enterprise-connect/intros', desc: 'Request warm introductions with internal routing and approval workflows', color: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]', count: '12 pending' },
  { id: 'events', label: 'Enterprise Events', icon: Calendar, route: '/enterprise-connect/events', desc: 'Exclusive enterprise-only events, roundtables, and executive briefings', color: 'bg-[hsl(var(--state-live))]/10 text-[hsl(var(--state-live))]', count: '8 upcoming' },
  { id: 'rooms', label: 'Enterprise Rooms', icon: MessageSquare, route: '/enterprise-connect/rooms', desc: 'Private discussion rooms for enterprise collaboration and deal flow', color: 'bg-accent/10 text-accent', count: '5 active' },
  { id: 'analytics', label: 'Enterprise Analytics', icon: BarChart3, route: '/enterprise-connect/analytics', desc: 'Engagement tracking, intro conversion, and partnership pipeline metrics', color: 'bg-primary/10 text-primary', count: 'Live' },
  { id: 'startups', label: 'Startup Showcase', icon: Rocket, route: '/enterprise-connect/startups', desc: 'Featured startups, ranking, and investor-ready discovery', color: 'bg-[hsl(var(--state-live))]/10 text-[hsl(var(--state-live))]', count: 'Ranked live' },
  { id: 'saved', label: 'Saved Lists', icon: Bookmark, route: '/enterprise-connect/saved', desc: 'Your saved enterprises, watch lists, and follow workflows', color: 'bg-muted text-muted-foreground', count: '34 saved' },
];

const SIGNALS = [
  { text: 'Acme Corp posted 3 new procurement opportunities', time: '2h ago', type: 'procurement' },
  { text: 'TechVentures accepted your intro request', time: '4h ago', type: 'intro' },
  { text: 'Enterprise roundtable "AI in Supply Chain" starts tomorrow', time: '6h ago', type: 'event' },
  { text: 'CloudScale upgraded their partnership tier to Gold', time: '1d ago', type: 'partner' },
];

const EnterpriseConnectHomePage: React.FC = () => {
  const topStrip = (
    <>
      <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Building2 className="h-3.5 w-3.5 text-accent" /></div>
      <span className="text-xs font-bold">Enterprise Connect</span>
      <Badge className="bg-accent/10 text-accent text-[7px] h-4 rounded-lg border-0">Business Network</Badge>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input placeholder="Search enterprises, partners..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[10px] w-56 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
      </div>
      <Button asChild size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Link to="/enterprise-connect/intros"><Plus className="h-3 w-3" />Request Intro</Link></Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Your Enterprise" className="!rounded-2xl">
        <div className="space-y-2">
          {[
            { l: 'Trust Tier', v: 'Gold', color: 'text-[hsl(var(--gigvora-amber))]' },
            { l: 'Connections', v: '89', color: 'text-accent' },
            { l: 'Active Partners', v: '12', color: 'text-primary' },
            { l: 'Pending Intros', v: '5', color: 'text-[hsl(var(--state-live))]' },
          ].map(s => (
            <div key={s.l} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <div className="text-[9px] text-muted-foreground">{s.l}</div>
              <div className={cn('text-sm font-bold', s.color)}>{s.v}</div>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Trust Score" className="!rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="h-14 w-14 rounded-full bg-[hsl(var(--gigvora-amber))]/10 flex items-center justify-center">
            <span className="text-lg font-bold text-[hsl(var(--gigvora-amber))]">92</span>
          </div>
          <div className="text-[9px] text-muted-foreground">
            <div>Verified identity</div>
            <div>3+ years on platform</div>
            <div>12 completed partnerships</div>
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-4">
      <div className="text-[11px] font-bold mb-2.5 flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-accent" />Enterprise Signals</div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {SIGNALS.map((s, i) => (
          <div key={i} className="shrink-0 rounded-2xl border bg-card px-3.5 py-2.5 min-w-[240px] hover:shadow-sm cursor-pointer transition-all">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-[7px] capitalize rounded-lg">{s.type}</Badge>
              <span className="text-[8px] text-muted-foreground ml-auto">{s.time}</span>
            </div>
            <p className="text-[9px] text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      <KPIBand className="mb-4">
        <KPICard label="Enterprise Network" value="2,340" change="+18 this week" trend="up" className="!rounded-2xl" />
        <KPICard label="Active Partnerships" value="12" change="+3 MTD" trend="up" className="!rounded-2xl" />
        <KPICard label="Intro Success Rate" value="78%" change="+4%" trend="up" className="!rounded-2xl" />
        <KPICard label="Procurement Pipeline" value="$2.4M" change="Active" className="!rounded-2xl" />
      </KPIBand>

      <div className="mb-4">
        <div className="text-[12px] font-bold mb-2.5">Enterprise Workbenches</div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
          {WORKBENCHES.map(w => (
            <Link key={w.id} to={w.route} className="rounded-2xl border bg-card p-3.5 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all group">
              <div className="flex items-start gap-3">
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110', w.color)}>
                  <w.icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold group-hover:text-accent transition-colors flex items-center gap-1.5">
                    {w.label}<ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{w.desc}</div>
                  <Badge variant="secondary" className="text-[7px] h-3.5 rounded-lg mt-1.5">{w.count}</Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EnterpriseConnectHomePage;
