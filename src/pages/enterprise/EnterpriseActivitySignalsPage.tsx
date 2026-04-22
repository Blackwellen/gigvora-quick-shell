import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Activity, Bell, Eye, Building2, Zap, TrendingUp, Clock,
  Briefcase, Users, FileText, ShoppingCart, Bookmark, Filter,
} from 'lucide-react';

type SignalType = 'funding' | 'hiring' | 'procurement' | 'leadership' | 'expansion' | 'partnership';

interface ActivitySignal {
  id: string; company: string; companyInitials: string;
  type: SignalType; headline: string; detail: string;
  timestamp: string; strength: 'high' | 'medium' | 'low';
  actionable: boolean;
}

const SIGNALS: ActivitySignal[] = [
  { id: 'S1', company: 'Quantum Labs', companyInitials: 'QL', type: 'funding', headline: 'Closed $45M Series C', detail: 'Led by Sequoia Capital. Expanding into EMEA and APAC markets.', timestamp: '1h ago', strength: 'high', actionable: true },
  { id: 'S2', company: 'DataForge Inc', companyInitials: 'DF', type: 'procurement', headline: 'Published RFP for analytics platform', detail: 'Seeking enterprise analytics vendor. Budget: $200K-500K annually.', timestamp: '4h ago', strength: 'high', actionable: true },
  { id: 'S3', company: 'Brightwave', companyInitials: 'BW', type: 'leadership', headline: 'New CTO appointed', detail: 'Former VP Engineering at Stripe. Likely to re-evaluate tech stack.', timestamp: '1d ago', strength: 'medium', actionable: true },
  { id: 'S4', company: 'NovaTech', companyInitials: 'NT', type: 'hiring', headline: 'Posted 23 engineering roles', detail: 'Focused on platform and infrastructure. Headcount doubled from Q1.', timestamp: '2d ago', strength: 'medium', actionable: false },
  { id: 'S5', company: 'Acme Corp', companyInitials: 'AC', type: 'expansion', headline: 'Opened London office', detail: 'First European presence. Hiring local sales and CS teams.', timestamp: '3d ago', strength: 'medium', actionable: false },
  { id: 'S6', company: 'Quantum Labs', companyInitials: 'QL', type: 'partnership', headline: 'Announced integration with Salesforce', detail: 'New marketplace listing. Co-sell opportunity identified.', timestamp: '5d ago', strength: 'low', actionable: false },
];

const TYPE_ICONS: Record<SignalType, React.ElementType> = {
  funding: TrendingUp, hiring: Users, procurement: ShoppingCart,
  leadership: Briefcase, expansion: Building2, partnership: Zap,
};
const TYPE_COLORS: Record<SignalType, string> = {
  funding: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  hiring: 'bg-accent/10 text-accent',
  procurement: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  leadership: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]',
  expansion: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  partnership: 'bg-muted text-muted-foreground',
};
const STRENGTH_COLORS: Record<string, string> = {
  high: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  medium: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  low: 'bg-muted text-muted-foreground',
};

const EnterpriseActivitySignalsPage: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<'all' | SignalType>('all');
  const filtered = SIGNALS.filter(s => typeFilter === 'all' || s.type === typeFilter);

  const topStrip = (
    <>
      <Activity className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Enterprise Connect — Activity & Signals</span>
      <div className="flex-1" />
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Bell className="h-3 w-3" />Alert Rules</Button>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Filter className="h-3 w-3" />Filters</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Signal Types" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {(Object.keys(TYPE_ICONS) as SignalType[]).map(t => {
            const Icon = TYPE_ICONS[t];
            return (
              <button key={t} onClick={() => setTypeFilter(t === typeFilter ? 'all' : t)} className={cn('flex items-center gap-1.5 w-full px-1.5 py-1 rounded-lg transition-colors', typeFilter === t ? 'bg-accent/10' : 'hover:bg-muted/50')}>
                <Icon className="h-3 w-3 text-muted-foreground" />
                <span className="capitalize flex-1 text-left">{t}</span>
                <span className="font-semibold">{SIGNALS.filter(s => s.type === t).length}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>
      <SectionCard title="Actionable" className="!rounded-2xl">
        <div className="text-[9px] space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Needs action</span><span className="font-semibold text-accent">{SIGNALS.filter(s => s.actionable).length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Informational</span><span className="font-semibold">{SIGNALS.filter(s => !s.actionable).length}</span></div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Signals This Week" value={String(SIGNALS.length)} change="Across accounts" className="!rounded-2xl" />
        <KPICard label="High Strength" value={String(SIGNALS.filter(s => s.strength === 'high').length)} change="Act now" className="!rounded-2xl" />
        <KPICard label="Actionable" value={String(SIGNALS.filter(s => s.actionable).length)} change="Require follow-up" className="!rounded-2xl" />
        <KPICard label="Companies" value={String(new Set(SIGNALS.map(s => s.company)).size)} change="Active signals" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2">
        {filtered.map(sig => {
          const Icon = TYPE_ICONS[sig.type];
          return (
            <div key={sig.id} className={cn('rounded-2xl border bg-card p-4 hover:shadow-sm transition-all', sig.actionable && 'border-l-2 border-l-accent')}>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-2xl"><AvatarFallback className="rounded-2xl text-[10px] font-bold bg-accent/10 text-accent">{sig.companyInitials}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] font-bold">{sig.company}</span>
                    <Badge className={cn('text-[7px] border-0 capitalize rounded-lg gap-0.5', TYPE_COLORS[sig.type])}><Icon className="h-2 w-2" />{sig.type}</Badge>
                    <Badge className={cn('text-[7px] border-0 rounded-lg', STRENGTH_COLORS[sig.strength])}>{sig.strength}</Badge>
                    {sig.actionable && <Badge className="bg-accent/10 text-accent text-[7px] border-0 rounded-lg">Action needed</Badge>}
                  </div>
                  <div className="text-[10px] font-semibold">{sig.headline}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed">{sig.detail}</div>
                  <div className="text-[8px] text-muted-foreground mt-1 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{sig.timestamp}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg px-2"><Eye className="h-2.5 w-2.5 mr-0.5" />View</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg px-2"><Bookmark className="h-2.5 w-2.5 mr-0.5" />Save</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default EnterpriseActivitySignalsPage;
