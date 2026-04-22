import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Briefcase, Eye, EyeOff, MessageSquare, Users, Clock, FileText, Send, Settings, Activity } from 'lucide-react';

const PIPELINE = [
  { stage: 'New', count: 24, color: 'bg-muted-foreground/20' },
  { stage: 'Screening', count: 12, color: 'bg-[hsl(var(--gigvora-amber))]' },
  { stage: 'Interview', count: 6, color: 'bg-accent' },
  { stage: 'Offer', count: 2, color: 'bg-[hsl(var(--state-healthy))]' },
  { stage: 'Hired', count: 1, color: 'bg-[hsl(var(--state-healthy))]' },
];

const ACTIVITY = [
  { action: 'New application received', detail: 'Marcus T. — Senior React Developer', time: '15m ago' },
  { action: 'Interview scheduled', detail: 'Priya R. — Round 2 on Apr 22', time: '1h ago' },
  { action: 'Screening completed', detail: 'James K. — Score: 85/100', time: '3h ago' },
  { action: 'Offer sent', detail: 'Sarah L. — $140K base + equity', time: '5h ago' },
];

export default function JobWorkspacePage() {
  const [viewMode, setViewMode] = useState<'recruiter' | 'hiring-manager'>('recruiter');

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="View Mode" className="!rounded-2xl">
        <div className="flex gap-1 bg-muted/40 rounded-xl p-0.5">
          <button onClick={() => setViewMode('recruiter')} className={cn('flex-1 px-2 py-1 rounded-lg text-[8px] font-medium transition-colors', viewMode === 'recruiter' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground')}>Recruiter</button>
          <button onClick={() => setViewMode('hiring-manager')} className={cn('flex-1 px-2 py-1 rounded-lg text-[8px] font-medium transition-colors', viewMode === 'hiring-manager' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground')}>Hiring Mgr</button>
        </div>
      </SectionCard>
      <SectionCard title="Job Info" className="!rounded-2xl">
        <div className="space-y-1.5 text-[8px]">
          {[['Status', 'Active'], ['Posted', 'Apr 5, 2026'], ['Closes', 'May 5, 2026'], ['Department', 'Engineering'], ['Location', 'Remote'], ['Credits Used', '12/50']].map(([k, v]) => (
            <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-semibold">{v}</span></div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Hiring Team" className="!rounded-2xl">
        <div className="space-y-1 text-[8px]">
          {[['Recruiter', 'Alex R.'], ['Hiring Manager', 'Jordan M.'], ['Interviewer', 'Sam K.'], ['Coordinator', 'Dana P.']].map(([role, name]) => (
            <div key={role} className="flex justify-between"><span className="text-muted-foreground">{role}</span><span className="font-semibold">{name}</span></div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={<><Briefcase className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Job Workspace</span><Badge variant="outline" className="text-[9px] rounded-lg ml-2">Senior React Developer</Badge><div className="flex-1" /><Badge className={cn('text-[8px] border-0 rounded-lg', viewMode === 'recruiter' ? 'bg-accent/10 text-accent' : 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]')}>{viewMode === 'recruiter' ? 'Recruiter View' : 'Hiring Manager View'}</Badge></>} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Total Applicants" value="45" change="+8 this week" className="!rounded-2xl" />
        <KPICard label="In Pipeline" value="24" className="!rounded-2xl" />
        <KPICard label="Time to Hire" value="18d" change="avg" className="!rounded-2xl" />
        <KPICard label="Offer Rate" value="4.4%" className="!rounded-2xl" />
      </KPIBand>

      <SectionCard title="Pipeline" className="!rounded-2xl mb-3">
        <div className="flex gap-2">
          {PIPELINE.map(p => (
            <div key={p.stage} className="flex-1 text-center">
              <div className={cn('h-8 rounded-xl flex items-center justify-center text-[12px] font-black text-white mb-1', p.color)}>{p.count}</div>
              <div className="text-[8px] font-medium">{p.stage}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {viewMode === 'recruiter' && (
        <SectionCard title="Quick Actions" className="!rounded-2xl mb-3">
          <div className="flex flex-wrap gap-2">
            {[{ icon: Send, label: 'Source Candidates' }, { icon: Users, label: 'Review Applicants' }, { icon: MessageSquare, label: 'Send Messages' }, { icon: Settings, label: 'Edit Job' }].map(a => (
              <Button key={a.label} variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><a.icon className="h-3 w-3" />{a.label}</Button>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Recent Activity" icon={<Activity className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {ACTIVITY.map((a, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/20 last:border-0">
              <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
              <div className="flex-1"><span className="text-[9px] font-semibold">{a.action}</span><span className="text-[8px] text-muted-foreground"> — {a.detail}</span></div>
              <span className="text-[7px] text-muted-foreground shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
