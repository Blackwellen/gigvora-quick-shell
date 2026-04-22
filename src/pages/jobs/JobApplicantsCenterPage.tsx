import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Users, Eye, MessageSquare, Star, Clock, MapPin, ChevronRight, Filter, ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react';

const APPLICANTS = [
  { name: 'Marcus Thompson', role: 'Senior React Developer', location: 'San Francisco', experience: '7 years', match: 92, stage: 'Screening', applied: '2h ago', source: 'Gigvora', starred: true },
  { name: 'Priya Ramanathan', role: 'Full-Stack Engineer', location: 'Remote', experience: '5 years', match: 88, stage: 'Interview', applied: '1d ago', source: 'LinkedIn', starred: true },
  { name: 'James Kim', role: 'Frontend Developer', location: 'New York', experience: '4 years', match: 76, stage: 'New', applied: '3h ago', source: 'Indeed', starred: false },
  { name: 'Sarah Laurent', role: 'React/Node Developer', location: 'London', experience: '6 years', match: 85, stage: 'Offer', applied: '5d ago', source: 'Referral', starred: true },
  { name: 'Tom Wright', role: 'Software Engineer', location: 'Austin', experience: '3 years', match: 64, stage: 'Rejected', applied: '2d ago', source: 'Indeed', starred: false },
];

const STAGE_CONFIG: Record<string, { badge: string; status: 'healthy' | 'caution' | 'pending' | 'blocked' | 'review' }> = {
  'New': { badge: 'bg-muted text-muted-foreground', status: 'pending' },
  'Screening': { badge: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]', status: 'caution' },
  'Interview': { badge: 'bg-accent/10 text-accent', status: 'review' },
  'Offer': { badge: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]', status: 'healthy' },
  'Rejected': { badge: 'bg-[hsl(var(--state-critical)/0.1)] text-[hsl(var(--state-critical))]', status: 'blocked' },
};

export default function JobApplicantsCenterPage() {
  const [stageFilter, setStageFilter] = useState('all');
  const stages = ['all', 'New', 'Screening', 'Interview', 'Offer', 'Rejected'];

  return (
    <DashboardLayout topStrip={<><Users className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Applicants Center</span><div className="flex-1" /><div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">{stages.map(s => (<button key={s} onClick={() => setStageFilter(s)} className={cn('px-2 py-1 rounded-lg text-[8px] font-medium capitalize transition-colors', stageFilter === s ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground')}>{s}</button>))}</div></>}>
      <KPIBand className="mb-3">
        <KPICard label="Total Applicants" value="45" className="!rounded-2xl" />
        <KPICard label="New (Unreviewed)" value="12" className="!rounded-2xl" />
        <KPICard label="In Pipeline" value="24" className="!rounded-2xl" />
        <KPICard label="Avg Match Score" value="78%" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2">
        {APPLICANTS.map((a, i) => {
          const cfg = STAGE_CONFIG[a.stage] || STAGE_CONFIG['New'];
          return (
            <SectionCard key={i} className="!rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0">{a.name.split(' ').map(n => n[0]).join('')}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-bold">{a.name}</span>
                    {a.starred && <Star className="h-3 w-3 text-[hsl(var(--gigvora-amber))] fill-[hsl(var(--gigvora-amber))]" />}
                    <Badge className={cn('text-[7px] border-0 rounded-lg', cfg.badge)}>{a.stage}</Badge>
                    <div className={cn('px-1.5 py-0.5 rounded-md text-[7px] font-bold', a.match >= 80 ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : a.match >= 60 ? 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]' : 'bg-muted text-muted-foreground')}>{a.match}% match</div>
                  </div>
                  <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                    <span>{a.role}</span>
                    <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{a.location}</span>
                    <span>{a.experience}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{a.applied}</span>
                    <span>via {a.source}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {a.stage === 'New' && <><Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><ThumbsDown className="h-3 w-3" />Reject</Button><Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><ArrowRight className="h-3 w-3" />Screen</Button></>}
                  {a.stage === 'Screening' && <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><ArrowRight className="h-3 w-3" />To Interview</Button>}
                  <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Eye className="h-3 w-3" />Profile</Button>
                </div>
              </div>
            </SectionCard>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
