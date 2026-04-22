import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Activity, CheckCircle2, Clock, FileText,
  Briefcase, Layers, Store, Calendar, Target,
  ChevronRight, Flag, BadgeCheck,
} from 'lucide-react';

const TASKS = [
  { id: 't1', title: 'Review homepage mockups', source: 'E-commerce Redesign', sourceType: 'project', priority: 'high' as const, status: 'in-progress' as const, due: 'Today', assignee: 'You' },
  { id: 't2', title: 'Deliver logo concepts', source: 'Brand Identity Gig', sourceType: 'gig', priority: 'high' as const, status: 'pending' as const, due: 'Tomorrow', assignee: 'You' },
  { id: 't3', title: 'Submit proposal revision', source: 'CRM Integration', sourceType: 'project', priority: 'medium' as const, status: 'pending' as const, due: 'Apr 16', assignee: 'You' },
  { id: 't4', title: 'Complete SEO audit', source: 'SEO Retainer', sourceType: 'service', priority: 'medium' as const, status: 'in-progress' as const, due: 'Apr 18', assignee: 'You' },
  { id: 't5', title: 'Send final invoice', source: 'Mobile App Build', sourceType: 'project', priority: 'low' as const, status: 'pending' as const, due: 'Apr 20', assignee: 'You' },
  { id: 't6', title: 'Schedule follow-up interview', source: 'Senior Engineer Hire', sourceType: 'job', priority: 'high' as const, status: 'pending' as const, due: 'Today', assignee: 'You' },
  { id: 't7', title: 'Review candidate portfolio', source: 'Designer Posting', sourceType: 'job', priority: 'medium' as const, status: 'completed' as const, due: 'Apr 12', assignee: 'You' },
];

const MILESTONES = [
  { id: 'm1', title: 'Phase 1 Delivery', project: 'E-commerce Redesign', due: 'Apr 18', progress: 75, status: 'on-track' as const, amount: '$2,500' },
  { id: 'm2', title: 'Final Deliverables', project: 'Brand Identity Gig', due: 'Apr 22', progress: 40, status: 'at-risk' as const, amount: '$800' },
  { id: 'm3', title: 'Sprint 3 Review', project: 'CRM Integration', due: 'Apr 25', progress: 20, status: 'on-track' as const, amount: '$4,000' },
  { id: 'm4', title: 'Monthly Report', project: 'SEO Retainer', due: 'Apr 30', progress: 10, status: 'on-track' as const, amount: '$1,200' },
];

const APPROVALS = [
  { id: 'a1', title: 'Homepage Design v3', project: 'E-commerce Redesign', type: 'Design', requestedBy: 'Sarah C.', requestedAt: '2h ago', status: 'pending' as const },
  { id: 'a2', title: 'API Integration Specs', project: 'CRM Integration', type: 'Document', requestedBy: 'Mike R.', requestedAt: '1d ago', status: 'pending' as const },
  { id: 'a3', title: 'Logo Final Selection', project: 'Brand Identity Gig', type: 'Deliverable', requestedBy: 'Client', requestedAt: '3h ago', status: 'pending' as const },
  { id: 'a4', title: 'Budget Increase Request', project: 'Mobile App Build', type: 'Financial', requestedBy: 'Ops Team', requestedAt: '2d ago', status: 'approved' as const },
];

const priorityColor = (p: string) => p === 'high' ? 'text-[hsl(var(--state-critical))]' : p === 'medium' ? 'text-[hsl(var(--gigvora-amber))]' : 'text-muted-foreground';
const sourceIcon = (t: string) => t === 'project' ? FileText : t === 'gig' ? Layers : t === 'service' ? Store : Briefcase;

export default function WorkHubPage() {
  const [tab, setTab] = useState<'tasks' | 'milestones' | 'approvals'>('tasks');
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');

  const filteredTasks = TASKS.filter(t => taskFilter === 'all' || t.status === taskFilter);
  const pendingApprovals = APPROVALS.filter(a => a.status === 'pending');

  return (
    <DashboardLayout topStrip={
      <div className="flex items-center gap-4 w-full">
        <Activity className="h-4 w-4 text-accent" />
        <h1 className="text-sm font-bold">Work Hub</h1>
        <KPICard label="Open Tasks" value={String(TASKS.filter(t => t.status !== 'completed').length)} />
        <KPICard label="Due Today" value={String(TASKS.filter(t => t.due === 'Today').length)} change="urgent" trend="up" />
        <KPICard label="Milestones" value={String(MILESTONES.length)} />
        <KPICard label="Pending Approvals" value={String(pendingApprovals.length)} />
      </div>
    }>
      <SectionBackNav homeRoute="/dashboard" homeLabel="Dashboard" currentLabel="Work Hub" icon={<Activity className="h-3 w-3" />} />

      <Tabs value={tab} onValueChange={v => setTab(v as any)} className="mb-4">
        <TabsList className="h-8">
          <TabsTrigger value="tasks" className="text-[10px] h-6 px-3 gap-1"><CheckCircle2 className="h-3 w-3" />Tasks <Badge className="text-[7px] h-4 px-1 bg-accent/10 text-accent">{TASKS.length}</Badge></TabsTrigger>
          <TabsTrigger value="milestones" className="text-[10px] h-6 px-3 gap-1"><Target className="h-3 w-3" />Milestones <Badge className="text-[7px] h-4 px-1 bg-accent/10 text-accent">{MILESTONES.length}</Badge></TabsTrigger>
          <TabsTrigger value="approvals" className="text-[10px] h-6 px-3 gap-1"><BadgeCheck className="h-3 w-3" />Approvals <Badge className="text-[7px] h-4 px-1 bg-accent/10 text-accent">{pendingApprovals.length}</Badge></TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'tasks' && (
        <>
          <div className="flex items-center gap-1 mb-3">
            {(['all', 'pending', 'in-progress', 'completed'] as const).map(f => (
              <button key={f} onClick={() => setTaskFilter(f)} className={`px-2.5 py-1 rounded-lg text-[9px] font-medium capitalize transition-colors ${taskFilter === f ? 'bg-accent text-accent-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'}`}>{f === 'all' ? 'All' : f}</button>
            ))}
          </div>
          <div className="space-y-2">
            {filteredTasks.map(t => {
              const Icon = sourceIcon(t.sourceType);
              return (
                <SectionCard key={t.id} className="!rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${t.status === 'completed' ? 'bg-[hsl(var(--state-healthy))]' : t.status === 'in-progress' ? 'bg-accent' : 'bg-muted-foreground/40'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold ${t.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{t.title}</span>
                        <Flag className={`h-2.5 w-2.5 ${priorityColor(t.priority)}`} />
                        <StatusBadge status={t.status === 'completed' ? 'healthy' : t.status === 'in-progress' ? 'pending' : 'review'} label={t.status} />
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-0.5">
                        <Icon className="h-2.5 w-2.5" />
                        <span>{t.source}</span>
                        <Clock className="h-2.5 w-2.5" />
                        <span className={t.due === 'Today' ? 'text-[hsl(var(--state-critical))] font-semibold' : ''}>{t.due}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg"><ChevronRight className="h-3 w-3" /></Button>
                  </div>
                </SectionCard>
              );
            })}
          </div>
        </>
      )}

      {tab === 'milestones' && (
        <div className="space-y-2">
          {MILESTONES.map(m => (
            <SectionCard key={m.id} className="!rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold">{m.title}</span>
                    <StatusBadge status={m.status === 'on-track' ? 'healthy' : 'blocked'} label={m.status} />
                    <span className="text-[10px] font-bold text-accent ml-auto">{m.amount}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground mb-1.5">
                    <FileText className="h-2.5 w-2.5" /><span>{m.project}</span>
                    <Calendar className="h-2.5 w-2.5" /><span>Due {m.due}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={m.progress} className="h-1.5 flex-1" />
                    <span className="text-[8px] font-semibold text-muted-foreground">{m.progress}%</span>
                  </div>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      {tab === 'approvals' && (
        <div className="space-y-2">
          {APPROVALS.map(a => (
            <SectionCard key={a.id} className="!rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-bold">{a.title}</span>
                    <Badge variant="outline" className="text-[7px] h-3.5">{a.type}</Badge>
                    <StatusBadge status={a.status === 'pending' ? 'pending' : 'healthy'} label={a.status} />
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                    <FileText className="h-2.5 w-2.5" /><span>{a.project}</span>
                    <span>•</span><span>By {a.requestedBy}</span>
                    <span>•</span><span>{a.requestedAt}</span>
                  </div>
                </div>
                {a.status === 'pending' && (
                  <div className="flex gap-1">
                    <Button size="sm" className="h-6 text-[8px] rounded-lg">Approve</Button>
                    <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">Review</Button>
                  </div>
                )}
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
