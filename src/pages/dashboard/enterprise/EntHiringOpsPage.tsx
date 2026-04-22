import React, { useState } from 'react';
import { KPIBand, KPICard, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  UserCheck, ChevronRight, Clock, Eye, Users, Briefcase,
  AlertTriangle, Target, TrendingUp, Filter, ExternalLink,
  MessageSquare, MapPin, Building2,
} from 'lucide-react';

type JobStatus = 'open' | 'interviewing' | 'offer' | 'filled' | 'paused';

interface Job {
  id: string; title: string; dept: string; status: JobStatus;
  candidates: number; shortlisted: number; daysOpen: number;
  owner: string; location: string; urgency: 'high' | 'medium' | 'low';
}

const JOBS: Job[] = [
  { id: '1', title: 'Senior Product Designer', dept: 'Design', status: 'interviewing', candidates: 42, shortlisted: 6, daysOpen: 18, owner: 'Sarah K.', location: 'Remote', urgency: 'high' },
  { id: '2', title: 'Backend Engineer', dept: 'Engineering', status: 'open', candidates: 78, shortlisted: 0, daysOpen: 5, owner: 'Mike T.', location: 'NYC', urgency: 'medium' },
  { id: '3', title: 'Growth Marketing Lead', dept: 'Marketing', status: 'offer', candidates: 35, shortlisted: 3, daysOpen: 32, owner: 'Lisa M.', location: 'Remote', urgency: 'high' },
  { id: '4', title: 'Data Analyst', dept: 'Analytics', status: 'open', candidates: 23, shortlisted: 0, daysOpen: 3, owner: 'Dave R.', location: 'London', urgency: 'low' },
  { id: '5', title: 'DevOps Engineer', dept: 'Engineering', status: 'paused', candidates: 12, shortlisted: 2, daysOpen: 45, owner: 'Mike T.', location: 'Hybrid', urgency: 'low' },
  { id: '6', title: 'Head of Sales', dept: 'Sales', status: 'interviewing', candidates: 18, shortlisted: 4, daysOpen: 28, owner: 'CEO', location: 'NYC', urgency: 'high' },
];

const STATUS_MAP: Record<JobStatus, { badge: 'live' | 'caution' | 'healthy' | 'pending' | 'blocked'; label: string }> = {
  open: { badge: 'live', label: 'Open' },
  interviewing: { badge: 'caution', label: 'Interviewing' },
  offer: { badge: 'healthy', label: 'Offer Stage' },
  filled: { badge: 'healthy', label: 'Filled' },
  paused: { badge: 'pending', label: 'Paused' },
};

const FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' }, { value: 'open', label: 'Open' }, { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' }, { value: 'paused', label: 'Paused' }, { value: 'urgent', label: 'Urgent' },
];

export default function EntHiringOpsPage() {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Job | null>(null);

  const filtered = JOBS.filter(j => {
    if (filter === 'all') return true;
    if (filter === 'urgent') return j.urgency === 'high';
    return j.status === filter;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><UserCheck className="h-5 w-5 text-accent" /> Hiring Ops</h1>
        <p className="text-[11px] text-muted-foreground">Monitor enterprise hiring activity, pipelines, and recruiter performance</p>
      </div>

      <KPIBand className="grid-cols-2 md:grid-cols-5">
        <KPICard label="Open Roles" value="4" change="+2 this month" trend="up" />
        <KPICard label="Total Candidates" value="208" change="+34 MTD" trend="up" />
        <KPICard label="In Interview" value="10" />
        <KPICard label="Offer Stage" value="3" change="Action needed" trend="up" />
        <KPICard label="Avg Time to Fill" value="24d" change="-3d" trend="up" />
      </KPIBand>

      {/* Pipeline Summary */}
      <SectionCard title="Hiring Pipeline" icon={<Target className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="flex items-center gap-2">
          {[
            { label: 'Applied', count: 208, w: '100%' }, { label: 'Screened', count: 85, w: '41%' },
            { label: 'Interviewing', count: 28, w: '13%' }, { label: 'Shortlisted', count: 15, w: '7%' },
            { label: 'Offer', count: 3, w: '1.5%' },
          ].map(s => (
            <div key={s.label} className="flex-1">
              <div className="text-[8px] text-muted-foreground mb-0.5">{s.label}</div>
              <div className="h-6 rounded-lg bg-accent/10 relative overflow-hidden">
                <div className="h-full bg-accent/30 rounded-lg" style={{ width: s.w }} />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">{s.count}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all',
            filter === f.value ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>{f.label}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(job => {
          const sm = STATUS_MAP[job.status];
          return (
            <div key={job.id} onClick={() => setSelected(job)} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer group">
              <div className={cn('h-2 w-2 rounded-full shrink-0', job.urgency === 'high' ? 'bg-[hsl(var(--state-blocked))]' : job.urgency === 'medium' ? 'bg-[hsl(var(--state-caution))]' : 'bg-muted-foreground/30')} />
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                <Briefcase className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold truncate group-hover:text-accent transition-colors">{job.title}</span>
                  <StatusBadge status={sm.badge} label={sm.label} />
                </div>
                <div className="text-[9px] text-muted-foreground flex items-center gap-3">
                  <span className="flex items-center gap-0.5"><Building2 className="h-2.5 w-2.5" />{job.dept}</span>
                  <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{job.location}</span>
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{job.candidates} applicants</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{job.daysOpen}d open</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <Badge variant="outline" className="text-[7px] rounded-lg">{job.owner}</Badge>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
            </div>
          );
        })}
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[420px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Role Detail</SheetTitle></SheetHeader>
          {selected && (
            <div className="p-4 space-y-4">
              <h3 className="text-[12px] font-bold">{selected.title}</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: 'Department', v: selected.dept }, { l: 'Location', v: selected.location },
                  { l: 'Candidates', v: String(selected.candidates) }, { l: 'Shortlisted', v: String(selected.shortlisted) },
                  { l: 'Days Open', v: `${selected.daysOpen}d` }, { l: 'Owner', v: selected.owner },
                ].map(d => (
                  <div key={d.l} className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">{d.l}</div><div className="text-[10px] font-semibold">{d.v}</div></div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Eye className="h-3 w-3" />View Job</Button>
                <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Users className="h-3 w-3" />Applicants</Button>
                <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><ExternalLink className="h-3 w-3" />Recruiter Pro</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
