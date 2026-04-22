import React, { useState } from 'react';
import { KPIBand, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  FolderKanban, Clock, ChevronRight, Eye, FileText,
  CheckCircle2, AlertTriangle, DollarSign, Users, Target,
  Send, MessageSquare, Calendar,
} from 'lucide-react';

type ViewTab = 'projects' | 'proposals' | 'invites' | 'completed';

interface Project {
  id: string; title: string; client: string; budget: string; progress: number;
  milestones: string; due: string; status: 'active' | 'at-risk' | 'completed';
}

interface Proposal {
  id: string; title: string; budget: string; submitted: string;
  status: 'submitted' | 'shortlisted' | 'rejected' | 'won' | 'invited';
  match: string;
}

const PROJECTS: Project[] = [
  { id: 'p1', title: 'E-commerce Platform Redesign', client: 'Acme Corp', budget: '$8,000', progress: 65, milestones: '3/5', due: 'Apr 28', status: 'active' },
  { id: 'p2', title: 'Mobile App MVP', client: 'StartupXYZ', budget: '$15,000', progress: 30, milestones: '1/4', due: 'May 15', status: 'active' },
  { id: 'p3', title: 'Data Pipeline Migration', client: 'DataOps', budget: '$12,000', progress: 45, milestones: '2/6', due: 'Apr 30', status: 'at-risk' },
];

const PROPOSALS: Proposal[] = [
  { id: 'pr1', title: 'SaaS Dashboard UI', budget: '$5,000', submitted: 'Apr 12', status: 'shortlisted', match: '94%' },
  { id: 'pr2', title: 'Health App Prototype', budget: '$3,200', submitted: 'Apr 10', status: 'submitted', match: '87%' },
  { id: 'pr3', title: 'Fintech Landing Page', budget: '$1,800', submitted: 'Apr 8', status: 'submitted', match: '82%' },
  { id: 'pr4', title: 'CRM Integration', budget: '$4,500', submitted: 'Mar 28', status: 'rejected', match: '78%' },
  { id: 'pr5', title: 'Design System Consulting', budget: '$6,000', submitted: '—', status: 'invited', match: '91%' },
  { id: 'pr6', title: 'Mobile App v2', budget: '$8,000', submitted: 'Mar 15', status: 'won', match: '95%' },
];

const P_STATUS: Record<string, { badge: 'live' | 'caution' | 'healthy'; label: string }> = {
  active: { badge: 'live', label: 'Active' }, 'at-risk': { badge: 'caution', label: 'At Risk' }, completed: { badge: 'healthy', label: 'Completed' },
};

const PR_STATUS: Record<string, { badge: 'pending' | 'live' | 'blocked' | 'healthy' | 'caution'; label: string }> = {
  submitted: { badge: 'pending', label: 'Submitted' }, shortlisted: { badge: 'live', label: 'Shortlisted' },
  rejected: { badge: 'blocked', label: 'Rejected' }, won: { badge: 'healthy', label: 'Won' }, invited: { badge: 'caution', label: 'Invited' },
};

export default function ProProjectsProposalsPage() {
  const [tab, setTab] = useState<ViewTab>('projects');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><FolderKanban className="h-5 w-5 text-accent" /> Projects & Proposals</h1>
        <p className="text-[11px] text-muted-foreground">Track your active projects and manage your proposal pipeline</p>
      </div>

      <KPIBand>
        <KPICard label="Active Projects" value="3" />
        <KPICard label="Open Proposals" value="3" />
        <KPICard label="Win Rate" value="68%" change="+5% MTD" trend="up" />
        <KPICard label="Invites" value="1" change="New" trend="up" />
      </KPIBand>

      {/* Proposal Funnel */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="text-[10px] font-bold mb-2 flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-accent" />Proposal Funnel (Last 30 Days)</div>
        <div className="flex items-center gap-2">
          {[
            { label: 'Invited', count: 4, w: '100%' }, { label: 'Submitted', count: 3, w: '75%' },
            { label: 'Shortlisted', count: 2, w: '50%' }, { label: 'Won', count: 1, w: '25%' },
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
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['projects', 'proposals', 'invites', 'completed'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all capitalize',
            tab === t ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>{t}</button>
        ))}
      </div>

      {tab === 'projects' && (
        <div className="space-y-2">
          {PROJECTS.map(p => {
            const sm = P_STATUS[p.status];
            return (
              <div key={p.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-semibold group-hover:text-accent transition-colors">{p.title}</span>
                      <StatusBadge status={sm.badge} label={sm.label} />
                    </div>
                    <div className="text-[9px] text-muted-foreground flex items-center gap-3">
                      <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{p.client}</span>
                      <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{p.budget}</span>
                      <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />Due: {p.due}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={p.progress} className="h-1.5 flex-1" />
                  <span className="text-[8px] font-medium w-8 text-right">{p.progress}%</span>
                  <Badge variant="outline" className="text-[7px] rounded-lg">{p.milestones} milestones</Badge>
                </div>
                {p.status === 'at-risk' && (
                  <div className="mt-2 rounded-lg bg-[hsl(var(--state-caution)/0.05)] p-2 flex items-center gap-1.5 text-[8px] text-[hsl(var(--state-caution))]">
                    <AlertTriangle className="h-3 w-3" />Milestone overdue — client expects update
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {(tab === 'proposals' || tab === 'invites') && (
        <div className="space-y-2">
          {PROPOSALS.filter(pr => tab === 'invites' ? pr.status === 'invited' : pr.status !== 'invited').map(pr => {
            const sm = PR_STATUS[pr.status];
            return (
              <div key={pr.id} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer group">
                <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                  <FileText className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-semibold group-hover:text-accent transition-colors">{pr.title}</span>
                    <StatusBadge status={sm.badge} label={sm.label} />
                  </div>
                  <div className="text-[9px] text-muted-foreground">{pr.budget} · {pr.submitted !== '—' ? `Submitted ${pr.submitted}` : 'Awaiting your proposal'}</div>
                </div>
                <Badge className="text-[8px] bg-accent/10 text-accent border-0 rounded-lg">{pr.match} match</Badge>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      {tab === 'completed' && (
        <div className="rounded-2xl border-2 border-dashed p-12 text-center">
          <CheckCircle2 className="h-8 w-8 text-[hsl(var(--state-healthy))]/20 mx-auto mb-2" />
          <div className="text-xs font-semibold text-muted-foreground">Completed projects and won proposals will appear here</div>
        </div>
      )}
    </div>
  );
}
