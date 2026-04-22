import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Zap, Building2, Users, MapPin, Shield, Star, Eye, MessageSquare,
  ArrowRight, Filter, TrendingUp, Target, Handshake, Clock,
} from 'lucide-react';

interface Match {
  id: string; company: string; initials: string; location: string;
  industry: string; size: string; fitScore: number;
  mutualConnections: number; partnerReady: boolean; procurementReady: boolean;
  signals: string[]; category: 'partner' | 'vendor' | 'client' | 'co-sell';
  lastActivity: string;
}

const MATCHES: Match[] = [
  { id: 'M1', company: 'Quantum Labs', initials: 'QL', location: 'Austin, TX', industry: 'Enterprise SaaS', size: '500-1000', fitScore: 94, mutualConnections: 12, partnerReady: true, procurementReady: true, signals: ['Expanding into EMEA', 'Hiring 15+ engineers', 'New VP Sales'], category: 'partner', lastActivity: '2h ago' },
  { id: 'M2', company: 'DataForge Inc', initials: 'DF', location: 'New York, NY', industry: 'Data Infrastructure', size: '200-500', fitScore: 87, mutualConnections: 8, partnerReady: true, procurementReady: false, signals: ['Series C closed', 'Looking for channel partners'], category: 'co-sell', lastActivity: '1d ago' },
  { id: 'M3', company: 'Brightwave', initials: 'BW', location: 'Seattle, WA', industry: 'MarTech', size: '100-200', fitScore: 81, mutualConnections: 5, partnerReady: false, procurementReady: true, signals: ['RFP published for platform vendor'], category: 'client', lastActivity: '3h ago' },
  { id: 'M4', company: 'NovaTech Solutions', initials: 'NT', location: 'London, UK', industry: 'FinTech', size: '1000-5000', fitScore: 76, mutualConnections: 3, partnerReady: true, procurementReady: true, signals: ['Regional expansion', 'New procurement cycle'], category: 'vendor', lastActivity: '5d ago' },
];

const CAT_COLORS: Record<string, string> = {
  partner: 'bg-accent/10 text-accent',
  'co-sell': 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]',
  client: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  vendor: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
};

const EnterpriseMatchmakingPage: React.FC = () => {
  const [catFilter, setCatFilter] = useState<'all' | 'partner' | 'co-sell' | 'client' | 'vendor'>('all');
  const filtered = MATCHES.filter(m => catFilter === 'all' || m.category === catFilter);

  const topStrip = (
    <>
      <Zap className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Enterprise Connect — Matchmaking</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['all', 'partner', 'co-sell', 'client', 'vendor'] as const).map(f => (
          <button key={f} onClick={() => setCatFilter(f)} className={cn('px-2.5 py-1 rounded-lg text-[9px] font-medium transition-colors capitalize', catFilter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{f === 'co-sell' ? 'Co-Sell' : f}</button>
        ))}
      </div>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Filter className="h-3 w-3" />Filters</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Match Quality" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Avg Fit Score</span><span className="font-semibold">{Math.round(MATCHES.reduce((s, m) => s + m.fitScore, 0) / MATCHES.length)}%</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Partner Ready</span><span className="font-semibold">{MATCHES.filter(m => m.partnerReady).length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Procurement Ready</span><span className="font-semibold">{MATCHES.filter(m => m.procurementReady).length}</span></div>
        </div>
      </SectionCard>
      <SectionCard title="By Category" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {(['partner', 'co-sell', 'client', 'vendor'] as const).map(c => (
            <div key={c} className="flex items-center gap-2">
              <Badge className={cn('text-[7px] border-0 capitalize w-14 justify-center rounded-lg', CAT_COLORS[c])}>{c}</Badge>
              <span className="font-semibold">{MATCHES.filter(m => m.category === c).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Matches Found" value={String(MATCHES.length)} change="This month" className="!rounded-2xl" />
        <KPICard label="Avg Fit Score" value={`${Math.round(MATCHES.reduce((s, m) => s + m.fitScore, 0) / MATCHES.length)}%`} change="↑ 5% vs last month" className="!rounded-2xl" />
        <KPICard label="Mutual Paths" value={String(MATCHES.reduce((s, m) => s + m.mutualConnections, 0))} change="Total connections" className="!rounded-2xl" />
        <KPICard label="Intros Sent" value="7" change="From matches" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {filtered.map(match => (
          <div key={match.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-11 w-11 rounded-2xl"><AvatarFallback className="rounded-2xl text-[10px] font-bold bg-accent/10 text-accent">{match.initials}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold">{match.company}</span>
                  <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', CAT_COLORS[match.category])}>{match.category}</Badge>
                  {match.partnerReady && <Badge className="bg-accent/10 text-accent text-[7px] border-0 rounded-lg gap-0.5"><Shield className="h-2 w-2" />Partner</Badge>}
                  {match.procurementReady && <Badge className="bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] text-[7px] border-0 rounded-lg gap-0.5"><Shield className="h-2 w-2" />Procurement</Badge>}
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{match.location}</span>
                  <span>·</span>
                  <span>{match.industry}</span>
                  <span>·</span>
                  <span>{match.size} employees</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  <Target className="h-3.5 w-3.5 text-accent" />
                  <span className="text-[14px] font-bold">{match.fitScore}%</span>
                </div>
                <span className="text-[8px] text-muted-foreground">fit score</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1 text-[9px]">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="font-semibold">{match.mutualConnections}</span>
                <span className="text-muted-foreground">mutual connections</span>
              </div>
              <div className="flex-1" />
              <span className="text-[8px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{match.lastActivity}</span>
            </div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {match.signals.map(sig => (
                <Badge key={sig} variant="outline" className="text-[8px] h-4 rounded-lg gap-0.5"><Zap className="h-2 w-2 text-[hsl(var(--gigvora-amber))]" />{sig}</Badge>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1 flex-1"><Eye className="h-3 w-3" />View Profile</Button>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1 flex-1"><Handshake className="h-3 w-3" />Request Intro</Button>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1 flex-1"><MessageSquare className="h-3 w-3" />Message</Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default EnterpriseMatchmakingPage;
