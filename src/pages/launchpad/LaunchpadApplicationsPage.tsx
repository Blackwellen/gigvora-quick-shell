import React from 'react';
import { LaunchpadShell } from '@/components/launchpad/LaunchpadShell';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  FileText, Clock, CheckCircle2, AlertCircle, XCircle,
  ChevronRight, Building2, MapPin, Eye, MessageSquare,
  MoreHorizontal,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type AppStatus = 'applied' | 'screening' | 'interview' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';

interface Application {
  id: string; title: string; company: string; avatar: string; type: string;
  status: AppStatus; applied: string; updated: string; nextStep?: string;
  notes?: string;
}

const APPLICATIONS: Application[] = [
  { id: 'a1', title: 'Junior Frontend Developer', company: 'TechCorp', avatar: 'TC', type: 'Entry Level', status: 'interview', applied: '5 days ago', updated: '1 day ago', nextStep: 'Technical interview on Apr 18' },
  { id: 'a2', title: 'Software Engineering Intern', company: 'ScaleUp Inc', avatar: 'SI', type: 'Internship', status: 'applied', applied: '3 days ago', updated: '3 days ago' },
  { id: 'a3', title: 'UX Design Apprenticeship', company: 'DesignFlow', avatar: 'DF', type: 'Apprenticeship', status: 'screening', applied: '1 week ago', updated: '2 days ago', nextStep: 'Portfolio review pending' },
  { id: 'a4', title: 'Marketing Trainee Pathway', company: 'GrowthLab', avatar: 'GL', type: 'Trainee', status: 'shortlisted', applied: '2 weeks ago', updated: '3 days ago', nextStep: 'Final interview scheduled' },
  { id: 'a5', title: 'Data Science Bootcamp', company: 'DataSphere', avatar: 'DS', type: 'Bootcamp', status: 'accepted', applied: '3 weeks ago', updated: '1 week ago', notes: 'Starts May 1 — complete onboarding' },
  { id: 'a6', title: 'Design Sprint Challenge', company: 'Gigvora', avatar: 'GV', type: 'Challenge', status: 'applied', applied: '1 day ago', updated: '1 day ago' },
];

const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; icon: React.ElementType }> = {
  applied: { label: 'Applied', color: 'bg-accent/10 text-accent', icon: FileText },
  screening: { label: 'In Review', color: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]', icon: Eye },
  interview: { label: 'Interview', color: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]', icon: MessageSquare },
  shortlisted: { label: 'Shortlisted', color: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]', icon: CheckCircle2 },
  accepted: { label: 'Accepted', color: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]', icon: CheckCircle2 },
  rejected: { label: 'Not Selected', color: 'bg-destructive/10 text-destructive', icon: XCircle },
  withdrawn: { label: 'Withdrawn', color: 'bg-muted text-muted-foreground', icon: AlertCircle },
};

const STATUS_TABS: AppStatus[] = ['applied', 'screening', 'interview', 'shortlisted', 'accepted', 'rejected'];

export default function LaunchpadApplicationsPage() {
  return (
    <LaunchpadShell>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold">Applications</h1>
          <p className="text-[11px] text-muted-foreground">Track your launchpad applications and progress</p>
        </div>
      </div>

      <KPIBand className="mb-4">
        <KPICard label="Total Applications" value={String(APPLICATIONS.length)} className="!rounded-2xl" />
        <KPICard label="Active" value={String(APPLICATIONS.filter(a => !['rejected', 'withdrawn'].includes(a.status)).length)} className="!rounded-2xl" />
        <KPICard label="Interviews" value={String(APPLICATIONS.filter(a => a.status === 'interview').length)} className="!rounded-2xl" />
        <KPICard label="Accepted" value={String(APPLICATIONS.filter(a => a.status === 'accepted').length)} trend="up" className="!rounded-2xl" />
      </KPIBand>

      {/* Pipeline */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_TABS.map(s => {
          const config = STATUS_CONFIG[s];
          const count = APPLICATIONS.filter(a => a.status === s).length;
          return (
            <Badge key={s} variant="outline" className={cn('text-[9px] rounded-xl px-3 py-1.5 cursor-pointer shrink-0', count > 0 ? config.color : 'opacity-50')}>
              <config.icon className="h-2.5 w-2.5 mr-1" />{config.label} ({count})
            </Badge>
          );
        })}
      </div>

      <div className="space-y-2.5">
        {APPLICATIONS.map(a => {
          const config = STATUS_CONFIG[a.status];
          return (
            <div key={a.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all cursor-pointer group">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 rounded-xl shrink-0"><AvatarFallback className="rounded-xl bg-accent/10 text-accent text-[9px] font-bold">{a.avatar}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[12px] font-bold">{a.title}</span>
                    <Badge className={cn('text-[7px] border-0 rounded-lg', config.color)}>
                      <config.icon className="h-2 w-2 mr-0.5" />{config.label}
                    </Badge>
                  </div>
                  <div className="text-[9px] text-muted-foreground mb-1">{a.company} · {a.type}</div>
                  <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                    <span>Applied {a.applied}</span>
                    <span>Updated {a.updated}</span>
                  </div>
                  {a.nextStep && (
                    <div className="mt-2 p-2 rounded-xl bg-accent/5 border border-accent/10 text-[9px] text-accent flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 shrink-0" /> {a.nextStep}
                    </div>
                  )}
                  {a.notes && (
                    <div className="mt-2 p-2 rounded-xl bg-[hsl(var(--state-healthy))]/5 border border-[hsl(var(--state-healthy))]/10 text-[9px] text-[hsl(var(--state-healthy))] flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 shrink-0" /> {a.notes}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg shrink-0"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          );
        })}
      </div>
    </LaunchpadShell>
  );
}
