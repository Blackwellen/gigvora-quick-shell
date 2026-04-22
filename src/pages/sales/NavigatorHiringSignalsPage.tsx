import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Briefcase, TrendingUp, Building2, MapPin, Clock, Eye, Bookmark,
  Filter, Bell, Zap, Users, ArrowUpRight, Target, BarChart3,
} from 'lucide-react';

interface HiringSignal {
  id: string; company: string; companyInitials: string; location: string;
  signal: string; category: 'headcount-surge' | 'new-role' | 'team-expansion' | 'leadership-change' | 'layoff-rebound';
  strength: 'strong' | 'moderate' | 'early'; timestamp: string;
  openRoles: number; growthRate: number; details: string;
  departments: string[];
}

const SIGNALS: HiringSignal[] = [
  { id: 'HS1', company: 'Acme Corp', companyInitials: 'AC', location: 'San Francisco, CA', signal: 'Engineering headcount surge — 23 new roles in 7 days', category: 'headcount-surge', strength: 'strong', timestamp: '2h ago', openRoles: 47, growthRate: 34, details: 'Rapid engineering expansion likely tied to Series C announcement last week.', departments: ['Engineering', 'DevOps', 'QA'] },
  { id: 'HS2', company: 'Quantum Labs', companyInitials: 'QL', location: 'Austin, TX', signal: 'New VP of Product role posted', category: 'leadership-change', strength: 'strong', timestamp: '5h ago', openRoles: 12, growthRate: 15, details: 'VP-level hire signals product direction shift — possible new product line.', departments: ['Product', 'Design'] },
  { id: 'HS3', company: 'NovaTech', companyInitials: 'NT', location: 'New York, NY', signal: 'Sales team expanding into EMEA', category: 'team-expansion', strength: 'moderate', timestamp: '1d ago', openRoles: 28, growthRate: 22, details: 'Multiple EMEA sales roles posted. International expansion play.', departments: ['Sales', 'Marketing', 'CS'] },
  { id: 'HS4', company: 'Brightwave', companyInitials: 'BW', location: 'Seattle, WA', signal: 'Post-layoff hiring rebound — 15 new roles', category: 'layoff-rebound', strength: 'moderate', timestamp: '2d ago', openRoles: 15, growthRate: 8, details: 'Company laid off 20% in Q1, now rehiring in core product areas.', departments: ['Engineering', 'Product'] },
  { id: 'HS5', company: 'DataForge', companyInitials: 'DF', location: 'Remote', signal: 'New AI/ML team being built from scratch', category: 'new-role', strength: 'early', timestamp: '3d ago', openRoles: 6, growthRate: 45, details: 'First-ever ML engineering hires. Building in-house AI capability.', departments: ['AI/ML', 'Data'] },
];

const STRENGTH_COLORS: Record<string, string> = {
  strong: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  moderate: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  early: 'bg-muted text-muted-foreground',
};

const CATEGORY_LABELS: Record<string, string> = {
  'headcount-surge': 'Headcount Surge',
  'new-role': 'New Role Type',
  'team-expansion': 'Team Expansion',
  'leadership-change': 'Leadership Change',
  'layoff-rebound': 'Layoff Rebound',
};

const NavigatorHiringSignalsPage: React.FC = () => {
  const [strength, setStrength] = useState<'all' | 'strong' | 'moderate' | 'early'>('all');
  const filtered = SIGNALS.filter(s => strength === 'all' || s.strength === strength);

  const topStrip = (
    <>
      <Briefcase className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Navigator — Hiring Signals</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['all', 'strong', 'moderate', 'early'] as const).map(f => (
          <button key={f} onClick={() => setStrength(f)} className={cn('px-2.5 py-1 rounded-lg text-[9px] font-medium transition-colors capitalize', strength === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{f}</button>
        ))}
      </div>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Bell className="h-3 w-3" />Alerts</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Signal Breakdown" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <div key={k} className="flex justify-between"><span className="text-muted-foreground">{v}</span><span className="font-semibold">{SIGNALS.filter(s => s.category === k).length}</span></div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Top Departments" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {['Engineering', 'Sales', 'Product', 'AI/ML', 'Design'].map(dept => (
            <div key={dept} className="flex justify-between"><span className="text-muted-foreground">{dept}</span><span className="font-semibold">{SIGNALS.filter(s => s.departments.includes(dept)).length}</span></div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Active Signals" value={String(SIGNALS.length)} change="Last 7 days" className="!rounded-2xl" />
        <KPICard label="Companies Hiring" value={String(new Set(SIGNALS.map(s => s.company)).size)} change="Tracked" className="!rounded-2xl" />
        <KPICard label="Open Roles" value={String(SIGNALS.reduce((s, sig) => s + sig.openRoles, 0))} change="Across signals" className="!rounded-2xl" />
        <KPICard label="Strong Signals" value={String(SIGNALS.filter(s => s.strength === 'strong').length)} change="Act now" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {filtered.map(sig => (
          <div key={sig.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3 mb-2.5">
              <Avatar className="h-10 w-10 rounded-2xl"><AvatarFallback className="rounded-2xl text-[10px] font-bold bg-accent/10 text-accent">{sig.companyInitials}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold">{sig.company}</span>
                  <Badge className={cn('text-[7px] border-0 rounded-lg', STRENGTH_COLORS[sig.strength])}>{sig.strength}</Badge>
                  <Badge variant="outline" className="text-[7px] h-3.5 rounded-lg">{CATEGORY_LABELS[sig.category]}</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{sig.location}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{sig.timestamp}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Eye className="h-3 w-3" />View</Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-xl"><Bookmark className="h-3 w-3" /></Button>
              </div>
            </div>

            <div className="rounded-xl bg-muted/30 p-3 mb-2.5">
              <div className="flex items-start gap-2">
                <Zap className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] mt-0.5 shrink-0" />
                <div>
                  <div className="text-[10px] font-semibold">{sig.signal}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed">{sig.details}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[9px]">
                <Target className="h-3 w-3 text-muted-foreground" />
                <span className="font-semibold">{sig.openRoles}</span>
                <span className="text-muted-foreground">open roles</span>
              </div>
              <div className="flex items-center gap-1 text-[9px]">
                <TrendingUp className="h-3 w-3 text-[hsl(var(--state-healthy))]" />
                <span className="font-semibold text-[hsl(var(--state-healthy))]">+{sig.growthRate}%</span>
                <span className="text-muted-foreground">growth</span>
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-1 flex-wrap">
                {sig.departments.map(d => (
                  <Badge key={d} variant="outline" className="text-[7px] h-3.5 rounded-lg">{d}</Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default NavigatorHiringSignalsPage;
