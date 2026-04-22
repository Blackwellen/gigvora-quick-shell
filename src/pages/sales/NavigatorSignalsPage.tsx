import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Zap, Search, TrendingUp, Users, Building2, Star, Eye, Bookmark,
  ArrowUpRight, DollarSign, Briefcase, Activity, Bell, Filter,
  ChevronRight, Clock, UserPlus, Globe,
} from 'lucide-react';

type SignalType = 'buying' | 'hiring' | 'service_interest' | 'activity' | 'funding' | 'expansion';

interface Signal {
  id: string; entity: string; entityType: 'person' | 'company'; avatar: string;
  signal: string; type: SignalType; time: string; strength: 'strong' | 'moderate' | 'weak';
  detail: string;
}

const SIGNAL_COLORS: Record<SignalType, string> = {
  buying: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  hiring: 'bg-accent/10 text-accent',
  service_interest: 'bg-primary/10 text-primary',
  activity: 'bg-[hsl(var(--state-live))]/10 text-[hsl(var(--state-live))]',
  funding: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]',
  expansion: 'bg-[hsl(var(--gigvora-blue))]/10 text-[hsl(var(--gigvora-blue))]',
};

const STRENGTH_COLORS: Record<string, string> = {
  strong: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  moderate: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  weak: 'bg-muted text-muted-foreground',
};

const SIGNALS: Signal[] = [
  { id: 's1', entity: 'TechCorp', entityType: 'company', avatar: 'TC', signal: 'Posted 4 new engineering roles — likely scaling engineering org', type: 'hiring', time: '1h ago', strength: 'strong', detail: 'SaaS · 500-1K · San Francisco' },
  { id: 's2', entity: 'NexaFlow', entityType: 'company', avatar: 'NF', signal: 'Raised Series A ($12M) — likely entering growth phase', type: 'funding', time: '2h ago', strength: 'strong', detail: 'AI/ML · 10-50 · London' },
  { id: 's3', entity: 'Sarah Chen', entityType: 'person', avatar: 'SC', signal: 'Viewed 3 gig postings in design category', type: 'service_interest', time: '3h ago', strength: 'moderate', detail: 'VP Engineering · TechCorp' },
  { id: 's4', entity: 'CloudScale', entityType: 'company', avatar: 'CS', signal: 'Expanding to EMEA market — opening London office', type: 'expansion', time: '4h ago', strength: 'strong', detail: 'Cloud · 250-500 · Austin' },
  { id: 's5', entity: 'Marcus Johnson', entityType: 'person', avatar: 'MJ', signal: 'Engaged with platform content — liked 5 posts, shared 2', type: 'activity', time: '5h ago', strength: 'moderate', detail: 'Head of Talent · ScaleUp Inc' },
  { id: 's6', entity: 'DataFlow', entityType: 'company', avatar: 'DF', signal: 'Increased headcount by 20% in Q1 — buying signals detected', type: 'buying', time: '6h ago', strength: 'moderate', detail: 'Analytics · 1K-5K · Seattle' },
  { id: 's7', entity: 'Lisa Wang', entityType: 'person', avatar: 'LW', signal: 'Promoted to VP People — likely restructuring talent ops', type: 'hiring', time: '1d ago', strength: 'strong', detail: 'VP People · AppWorks' },
  { id: 's8', entity: 'Priya Sharma', entityType: 'person', avatar: 'PS', signal: 'Updated profile — added "Looking for services" flag', type: 'service_interest', time: '1d ago', strength: 'strong', detail: 'CEO · NexaFlow' },
  { id: 's9', entity: 'ScaleUp Inc', entityType: 'company', avatar: 'SI', signal: 'Funding round announced — $25M Series B', type: 'funding', time: '2d ago', strength: 'strong', detail: 'FinTech · 100-250 · New York' },
  { id: 's10', entity: 'AppWorks', entityType: 'company', avatar: 'AW', signal: 'Published 3 job postings in product and design', type: 'hiring', time: '2d ago', strength: 'moderate', detail: 'SaaS · 200-500 · Boston' },
];

const NavigatorSignalsPage: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<'all' | SignalType>('all');
  const [strengthFilter, setStrengthFilter] = useState('all');

  const filtered = SIGNALS.filter(s => {
    const mt = typeFilter === 'all' || s.type === typeFilter;
    const ms = strengthFilter === 'all' || s.strength === strengthFilter;
    return mt && ms;
  });

  const topStrip = (
    <>
      <Zap className="h-4 w-4 text-[hsl(var(--state-live))]" />
      <span className="text-xs font-semibold">Navigator — Signal View</span>
      <Badge className="bg-[hsl(var(--state-live))]/10 text-[hsl(var(--state-live))] text-[7px] border-0 gap-0.5"><Activity className="h-2.5 w-2.5" />Live</Badge>
      <div className="flex-1" />
      <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="h-7 rounded-xl border bg-background px-2 text-[9px]">
        <option value="all">All Signals</option>
        <option value="buying">Buying</option>
        <option value="hiring">Hiring</option>
        <option value="service_interest">Service Interest</option>
        <option value="funding">Funding</option>
        <option value="expansion">Expansion</option>
        <option value="activity">Activity</option>
      </select>
      <select value={strengthFilter} onChange={e => setStrengthFilter(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px]">
        <option value="all">All Strength</option>
        <option value="strong">Strong</option>
        <option value="moderate">Moderate</option>
        <option value="weak">Weak</option>
      </select>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Bell className="h-3 w-3" />Alert Rules</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Signal Distribution" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {(Object.entries({
            hiring: SIGNALS.filter(s => s.type === 'hiring').length,
            funding: SIGNALS.filter(s => s.type === 'funding').length,
            buying: SIGNALS.filter(s => s.type === 'buying').length,
            service_interest: SIGNALS.filter(s => s.type === 'service_interest').length,
            expansion: SIGNALS.filter(s => s.type === 'expansion').length,
            activity: SIGNALS.filter(s => s.type === 'activity').length,
          }) as [SignalType, number][]).map(([type, count]) => (
            <div key={type} className="flex items-center gap-2">
              <Badge className={cn('text-[7px] border-0 capitalize w-20', SIGNAL_COLORS[type])}>{type.replace('_', ' ')}</Badge>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${(count / SIGNALS.length) * 100}%` }} /></div>
              <span className="font-semibold w-4 text-right">{count}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Alert Rules" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {[
            { l: 'New funding rounds', active: true },
            { l: 'Hiring signals (5+ roles)', active: true },
            { l: 'Service interest flags', active: false },
            { l: 'Expansion announcements', active: true },
          ].map(r => (
            <div key={r.l} className="flex items-center gap-2 p-1.5 rounded-lg">
              <div className={cn('h-2 w-2 rounded-full', r.active ? 'bg-[hsl(var(--state-healthy))]' : 'bg-muted-foreground/30')} />
              <span className={r.active ? 'font-medium' : 'text-muted-foreground'}>{r.l}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52">
      <KPIBand className="mb-3">
        <KPICard label="Total Signals" value={String(SIGNALS.length)} change="Last 7 days" className="!rounded-2xl" />
        <KPICard label="Strong Signals" value={String(SIGNALS.filter(s => s.strength === 'strong').length)} change="High priority" trend="up" className="!rounded-2xl" />
        <KPICard label="Companies" value={String(new Set(SIGNALS.filter(s => s.entityType === 'company').map(s => s.entity)).size)} change="With signals" className="!rounded-2xl" />
        <KPICard label="People" value={String(new Set(SIGNALS.filter(s => s.entityType === 'person').map(s => s.entity)).size)} change="With signals" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2">
        {filtered.map(s => (
          <div key={s.id} className="rounded-2xl border bg-card p-3.5 hover:shadow-sm cursor-pointer transition-all group">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 rounded-xl"><AvatarFallback className={cn('rounded-xl text-[10px] font-bold', s.entityType === 'company' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary')}>{s.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[11px] font-bold group-hover:text-accent transition-colors">{s.entity}</span>
                  <Badge className={cn('text-[7px] border-0 capitalize', SIGNAL_COLORS[s.type])}>{s.type.replace('_', ' ')}</Badge>
                  <Badge className={cn('text-[7px] border-0 capitalize', STRENGTH_COLORS[s.strength])}>{s.strength}</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground">{s.signal}</div>
                <div className="text-[8px] text-muted-foreground mt-0.5">{s.detail}</div>
              </div>
              <span className="text-[8px] text-muted-foreground shrink-0">{s.time}</span>
            </div>
            <div className="flex gap-1.5 mt-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Eye className="h-2.5 w-2.5" />View</Button>
              <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Bookmark className="h-2.5 w-2.5" />Save</Button>
              <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><UserPlus className="h-2.5 w-2.5" />Add to List</Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default NavigatorSignalsPage;
