import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flag, Plus, Clock, DollarSign, CheckCircle2, Upload, Loader2, WifiOff, AlertCircle } from 'lucide-react';
import { useProjectWorkspace } from '@/hooks/useProjectWorkspace';
import type { Milestone as ApiMilestone } from '@/lib/api/projectWorkspaces';
import { toast } from 'sonner';

const FALLBACK = [
  { id: 'MS-1', title: 'Design Phase Complete', amount: '$2,500', status: 'completed' as const, due: 'Apr 5, 2026', deliverables: 3, approved: true },
  { id: 'MS-2', title: 'Frontend Development', amount: '$5,000', status: 'in-progress' as const, due: 'Apr 20, 2026', deliverables: 5, approved: false },
  { id: 'MS-3', title: 'Backend Integration', amount: '$5,000', status: 'upcoming' as const, due: 'May 5, 2026', deliverables: 4, approved: false },
];

const fmtMoney = (cents: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const apiStatusToView = (s: ApiMilestone['status']) =>
  s === 'released' ? 'completed' : s === 'in-progress' || s === 'in-review' || s === 'funded' ? 'in-progress' : 'upcoming';
const statusMap = { completed: 'healthy', 'in-progress': 'caution', upcoming: 'pending' } as const;

export default function ProjectMilestonesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { apiOn, workspace, workspaceId, isFetching, error, mutations } = useProjectWorkspace(projectId);

  const milestones = useMemo(() => {
    if (workspace?.milestones?.length) {
      return workspace.milestones.map((m, i) => ({
        id: m.id,
        title: m.title,
        amount: fmtMoney(m.amountCents, m.currency),
        status: apiStatusToView(m.status),
        rawStatus: m.status,
        version: m.version,
        due: fmtDate(m.dueAt),
        deliverables: m.taskCount ?? 0,
        approved: m.status === 'released',
        index: i,
      }));
    }
    return FALLBACK.map((m, i) => ({ ...m, rawStatus: 'pending' as ApiMilestone['status'], version: 0, index: i }));
  }, [workspace]);

  const completed = milestones.filter((m) => m.status === 'completed').length;
  const totalBudget = workspace?.budget ? fmtMoney(workspace.budget.totalCents, workspace.budget.currency) : '$15,000';

  const onSubmitForReview = (m: typeof milestones[number]) => {
    if (!workspaceId) { toast.error('No workspace bound'); return; }
    mutations.transitionMilestone.mutate({ milestoneId: m.id, toStatus: 'in-review', expectedVersion: m.version });
  };
  const onUploadDeliverable = (m: typeof milestones[number]) => {
    if (!workspaceId) { toast.error('No workspace bound'); return; }
    const url = window.prompt('Deliverable URL?');
    if (!url) return;
    const title = window.prompt('Deliverable title?', `Deliverable for ${m.title}`) ?? `Deliverable for ${m.title}`;
    mutations.submitDeliverable.mutate({ milestoneId: m.id, title, url });
  };

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Flag className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Milestones</h1>
          <KPICard label="Total" value={String(milestones.length)} />
          <KPICard label="Completed" value={String(completed)} />
          <KPICard label="Budget" value={totalBudget} />
          {isFetching && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          <div className="flex-1" />
          {!apiOn && <Badge variant="secondary" className="gap-1 text-[8px]"><WifiOff className="h-2.5 w-2.5" />Preview data</Badge>}
          <Button size="sm" className="h-7 text-[10px] gap-1" onClick={() => toast.info('Add milestone via the workspace creation flow')}><Plus className="h-3 w-3" /> Add Milestone</Button>
        </div>
      }
    >
      {error && (
        <div className="mb-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-[10px] text-destructive flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5" />Failed to load milestones: {error.message}
        </div>
      )}
      <SectionCard>
        {milestones.map((ms, i) => (
          <div key={ms.id} className="p-4 rounded-xl border border-border/40 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${ms.status === 'completed' ? 'bg-accent text-accent-foreground' : 'bg-muted'}`}>{i + 1}</div>
              <span className="text-[11px] font-semibold">{ms.title}</span>
              <StatusBadge status={statusMap[ms.status]} label={ms.status} />
              {ms.approved && <Badge className="text-[7px] h-3.5 bg-accent/10 text-accent border-0">Approved</Badge>}
            </div>
            <div className="flex items-center gap-4 text-[9px] text-muted-foreground mb-3">
              <span><DollarSign className="h-2.5 w-2.5 inline" /> {ms.amount}</span>
              <span><Clock className="h-2.5 w-2.5 inline" /> Due: {ms.due}</span>
              <span>{ms.deliverables} deliverables</span>
            </div>
            {ms.status === 'in-progress' && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"
                  disabled={mutations.submitDeliverable.isPending}
                  onClick={() => onUploadDeliverable(ms)}>
                  <Upload className="h-3 w-3" /> Upload Deliverable
                </Button>
                <Button size="sm" className="h-7 text-[10px] gap-1"
                  disabled={mutations.transitionMilestone.isPending}
                  onClick={() => onSubmitForReview(ms)}>
                  <CheckCircle2 className="h-3 w-3" /> Submit for Review
                </Button>
              </div>
            )}
          </div>
        ))}
      </SectionCard>
    </DashboardLayout>
  );
}
