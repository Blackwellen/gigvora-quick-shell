import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  GitBranch, Users, Eye, MessageSquare, UserPlus, ArrowRight,
  Shield, Star, Clock, Filter, Handshake,
} from 'lucide-react';

interface IntroRequest {
  id: string; fromName: string; fromInitials: string; fromHeadline: string;
  toName: string; toInitials: string; toHeadline: string;
  mutualCount: number; mutualNames: string[];
  reason: string; status: 'pending' | 'accepted' | 'declined' | 'suggested';
  timestamp: string; strength: 'strong' | 'moderate' | 'weak';
}

const INTROS: IntroRequest[] = [
  { id: 'I1', fromName: 'You', fromInitials: 'YO', fromHeadline: '', toName: 'Sarah Chen', toInitials: 'SC', toHeadline: 'Staff Engineer at Stripe', mutualCount: 12, mutualNames: ['Marcus J.', 'Lisa P.', 'Tom W.'], reason: 'Exploring partnership on platform engineering initiative', status: 'pending', timestamp: '2h ago', strength: 'strong' },
  { id: 'I2', fromName: 'Alex Rivera', fromInitials: 'AR', fromHeadline: 'CTO at DataForge', toName: 'You', toInitials: 'YO', toHeadline: '', mutualCount: 5, mutualNames: ['Priya P.', 'James K.'], reason: 'Would like to discuss your recent article on distributed systems', status: 'pending', timestamp: '1d ago', strength: 'moderate' },
  { id: 'I3', fromName: 'You', fromInitials: 'YO', fromHeadline: '', toName: 'Priya Patel', toInitials: 'PP', toHeadline: 'AI/ML Researcher', mutualCount: 3, mutualNames: ['Alex R.'], reason: 'Interested in collaborating on ML infrastructure', status: 'accepted', timestamp: '3d ago', strength: 'moderate' },
  { id: 'I4', fromName: 'System', fromInitials: 'AI', fromHeadline: 'Smart Match', toName: 'James Kim', toInitials: 'JK', toHeadline: 'VP Sales at NovaTech', mutualCount: 8, mutualNames: ['Tom W.', 'Lisa P.', 'Sarah C.'], reason: 'Strong mutual path detected — 8 shared connections in enterprise sales', status: 'suggested', timestamp: '5h ago', strength: 'strong' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  accepted: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  declined: 'bg-destructive/10 text-destructive',
  suggested: 'bg-accent/10 text-accent',
};
const STRENGTH_COLORS: Record<string, string> = {
  strong: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  moderate: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  weak: 'bg-muted text-muted-foreground',
};

const IntroductionsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'declined' | 'suggested'>('all');
  const filtered = INTROS.filter(i => statusFilter === 'all' || i.status === statusFilter);

  const topStrip = (
    <>
      <GitBranch className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Introductions & Mutual Paths</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['all', 'pending', 'accepted', 'suggested'] as const).map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} className={cn('px-2.5 py-1 rounded-lg text-[9px] font-medium transition-colors capitalize', statusFilter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{f}</button>
        ))}
      </div>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Handshake className="h-3 w-3" />Request Intro</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Intro Stats" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {(['pending', 'accepted', 'declined', 'suggested'] as const).map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <Badge className={cn('text-[7px] border-0 capitalize w-16 justify-center rounded-lg', STATUS_COLORS[s])}>{s}</Badge>
              <span className="font-semibold">{INTROS.filter(i => i.status === s).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Mutual Path Tips" className="!rounded-2xl">
        <div className="text-[9px] text-muted-foreground space-y-1 leading-relaxed">
          <p>• Strong paths (3+ mutual) have 4x acceptance rate</p>
          <p>• Include a clear reason for higher success</p>
          <p>• AI-suggested intros are based on activity signals</p>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Total Intros" value={String(INTROS.length)} change="All time" className="!rounded-2xl" />
        <KPICard label="Pending" value={String(INTROS.filter(i => i.status === 'pending').length)} change="Awaiting response" className="!rounded-2xl" />
        <KPICard label="Acceptance Rate" value="75%" change="↑ 12% vs avg" className="!rounded-2xl" />
        <KPICard label="AI Suggested" value={String(INTROS.filter(i => i.status === 'suggested').length)} change="Smart matches" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {filtered.map(intro => (
          <div key={intro.id} className={cn('rounded-2xl border bg-card p-4 hover:shadow-sm transition-all', intro.status === 'pending' && 'border-l-2 border-l-[hsl(var(--state-caution))]', intro.status === 'suggested' && 'border-l-2 border-l-accent')}>
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="h-9 w-9 rounded-2xl"><AvatarFallback className="rounded-2xl text-[9px] font-bold bg-accent/10 text-accent">{intro.fromInitials}</AvatarFallback></Avatar>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Avatar className="h-9 w-9 rounded-2xl"><AvatarFallback className="rounded-2xl text-[9px] font-bold bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]">{intro.toInitials}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold">{intro.fromName}</span>
                  <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-[11px] font-bold">{intro.toName}</span>
                </div>
                {intro.toHeadline && <div className="text-[9px] text-muted-foreground truncate">{intro.toHeadline}</div>}
              </div>
              <div className="flex items-center gap-1.5">
                <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', STATUS_COLORS[intro.status])}>{intro.status}</Badge>
                <Badge className={cn('text-[7px] border-0 rounded-lg', STRENGTH_COLORS[intro.strength])}>{intro.strength}</Badge>
              </div>
            </div>

            <div className="text-[10px] bg-muted/30 rounded-xl p-2.5 mb-2.5 leading-relaxed">{intro.reason}</div>

            <div className="flex items-center gap-3 text-[9px]">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="font-semibold">{intro.mutualCount}</span>
                <span className="text-muted-foreground">mutual:</span>
                <span className="text-muted-foreground truncate max-w-[200px]">{intro.mutualNames.join(', ')}</span>
              </div>
              <div className="flex-1" />
              <span className="text-[8px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{intro.timestamp}</span>
            </div>

            {intro.status === 'pending' && intro.toName === 'You' && (
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t">
                <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1 flex-1"><UserPlus className="h-3 w-3" />Accept</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1 flex-1"><MessageSquare className="h-3 w-3" />Message First</Button>
                <Button variant="ghost" size="sm" className="h-7 text-[9px] rounded-xl text-destructive">Decline</Button>
              </div>
            )}
            {intro.status === 'suggested' && (
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t">
                <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1 flex-1"><Handshake className="h-3 w-3" />Request Intro</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1 flex-1"><Eye className="h-3 w-3" />View Profile</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default IntroductionsPage;
