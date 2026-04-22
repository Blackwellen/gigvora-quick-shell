import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { LayoutDashboard, AlertTriangle, Eye, EyeOff, Activity } from 'lucide-react';

const HEALTH_INDICATORS = [
  { label: 'Schedule', status: 'healthy' as const, detail: 'On track — 2 days ahead' },
  { label: 'Budget', status: 'caution' as const, detail: '87% consumed — $1,950 remaining' },
  { label: 'Scope', status: 'healthy' as const, detail: 'No scope creep detected' },
  { label: 'Quality', status: 'healthy' as const, detail: 'All deliverables approved' },
  { label: 'Risk', status: 'blocked' as const, detail: '2 blockers unresolved' },
];

const BLOCKERS = [
  { id: 'BLK-1', title: 'API integration delayed — vendor unresponsive', severity: 'blocked' as const, assignee: 'James M.', age: '3 days', blocking: ['Task-24', 'Task-25'] },
  { id: 'BLK-2', title: 'Design assets pending client approval', severity: 'caution' as const, assignee: 'Sarah K.', age: '1 day', blocking: ['Task-18'] },
];

const RECENT_ACTIVITY = [
  { action: 'Task completed', detail: 'Homepage wireframe approved', actor: 'Priya R.', time: '12m ago' },
  { action: 'Deliverable uploaded', detail: 'Brand_Guide_v3.pdf', actor: 'Sarah K.', time: '45m ago' },
  { action: 'Milestone reached', detail: 'Design Phase Complete', actor: 'System', time: '2h ago' },
  { action: 'Comment added', detail: 'Feedback on API spec', actor: 'James M.', time: '3h ago' },
  { action: 'Risk escalated', detail: 'Vendor delay → critical', actor: 'Tom W.', time: '5h ago' },
];

const DEPENDENCIES = [
  { from: 'Design Phase', to: 'Frontend Dev', status: 'resolved' as const },
  { from: 'API Spec', to: 'Backend Dev', status: 'blk' as const },
  { from: 'Frontend Dev', to: 'Integration Testing', status: 'pending' as const },
  { from: 'Backend Dev', to: 'Integration Testing', status: 'pending' as const },
];

export default function ProjectDashboardPage() {
  const [viewMode, setViewMode] = useState<'internal' | 'client'>('internal');

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="View Mode" className="!rounded-2xl">
        <div className="flex gap-1 bg-muted/40 rounded-xl p-0.5">
          <button onClick={() => setViewMode('internal')} className={cn('flex-1 px-2 py-1 rounded-lg text-[8px] font-medium flex items-center justify-center gap-1 transition-colors', viewMode === 'internal' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground')}><Eye className="h-2.5 w-2.5" />Internal</button>
          <button onClick={() => setViewMode('client')} className={cn('flex-1 px-2 py-1 rounded-lg text-[8px] font-medium flex items-center justify-center gap-1 transition-colors', viewMode === 'client' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground')}><EyeOff className="h-2.5 w-2.5" />Client</button>
        </div>
        <div className="text-[7px] text-muted-foreground mt-1">{viewMode === 'internal' ? 'Showing all data including internal notes and risks' : 'Client-safe view — sensitive data hidden'}</div>
      </SectionCard>
      <SectionCard title="Quick Stats" className="!rounded-2xl">
        <div className="space-y-1.5 text-[8px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Tasks</span><span className="font-semibold">18/32 done</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Milestones</span><span className="font-semibold">2/4 complete</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Deliverables</span><span className="font-semibold">6/10 approved</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Team</span><span className="font-semibold">5 members</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Days remaining</span><span className="font-semibold">18</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Dependencies" className="!rounded-2xl">
        <div className="space-y-1.5">
          {DEPENDENCIES.map((d, i) => (
            <div key={i} className="flex items-center gap-1 text-[8px]">
              <span className="truncate flex-1">{d.from}</span>
              <span className="text-muted-foreground">→</span>
              <span className="truncate flex-1">{d.to}</span>
              <StatusBadge status={d.status === 'resolved' ? 'healthy' : d.status === 'blk' ? 'blocked' : 'pending'} label={d.status === 'blk' ? 'blocked' : d.status} />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout
      topStrip={<><LayoutDashboard className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Project Dashboard</span><Badge variant="outline" className="text-[9px] rounded-lg ml-2">Website Redesign</Badge><div className="flex-1" /><Badge className={cn('text-[8px] border-0 rounded-lg', viewMode === 'client' ? 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]' : 'bg-accent/10 text-accent')}>{viewMode === 'internal' ? 'Internal View' : 'Client View'}</Badge></>}
      rightRail={rightRail}
      rightRailWidth="w-52"
    >
      <KPIBand className="mb-3">
        <KPICard label="Completion" value="56%" change="+8% this week" className="!rounded-2xl" />
        <KPICard label="Budget Used" value="$13,050" change="87% of $15K" className="!rounded-2xl" />
        <KPICard label="On-Time Rate" value="82%" className="!rounded-2xl" />
        <KPICard label="Blockers" value="2" change="Critical" className="!rounded-2xl" />
      </KPIBand>

      <SectionCard title="Health Indicators" className="!rounded-2xl mb-3">
        <div className="grid grid-cols-5 gap-2">
          {HEALTH_INDICATORS.map(h => (
            <div key={h.label} className="rounded-xl border p-2.5 text-center">
              <StatusBadge status={h.status} label={h.status} />
              <div className="text-[10px] font-bold mt-1">{h.label}</div>
              <div className="text-[7px] text-muted-foreground mt-0.5">{h.detail}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {viewMode === 'internal' && (
        <SectionCard title="Active Blockers" icon={<AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-critical))]" />} className="!rounded-2xl mb-3">
          <div className="space-y-2">
            {BLOCKERS.map(b => (
              <div key={b.id} className="p-2.5 rounded-xl border border-[hsl(var(--state-critical)/0.2)] bg-[hsl(var(--state-critical)/0.02)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8px] font-mono text-muted-foreground">{b.id}</span>
                  <span className="text-[10px] font-bold flex-1">{b.title}</span>
                  <StatusBadge status={b.severity} label={b.severity} />
                </div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span>Assigned: <span className="font-medium text-foreground">{b.assignee}</span></span>
                  <span>Age: {b.age}</span>
                  <span>Blocking: {b.blocking.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Progress" className="!rounded-2xl mb-3">
        <div className="space-y-2">
          {[{ label: 'Design', progress: 100 }, { label: 'Frontend', progress: 65 }, { label: 'Backend', progress: 40 }, { label: 'Testing', progress: 10 }].map(p => (
            <div key={p.label}>
              <div className="flex justify-between text-[9px] mb-0.5"><span className="font-medium">{p.label}</span><span className="font-bold">{p.progress}%</span></div>
              <Progress value={p.progress} className="h-1.5 rounded-full" />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Recent Activity" icon={<Activity className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {RECENT_ACTIVITY.map((a, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/20 last:border-0">
              <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-semibold">{a.action}</span>
                <span className="text-[8px] text-muted-foreground"> — {a.detail}</span>
              </div>
              <span className="text-[7px] text-muted-foreground shrink-0">{a.actor} · {a.time}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
