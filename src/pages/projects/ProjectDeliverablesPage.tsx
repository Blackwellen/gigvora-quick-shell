import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Package, Upload, Eye, Download, CheckCircle, Clock, MessageSquare, FileText, Image, Film, Code, Loader2, WifiOff, AlertCircle, X } from 'lucide-react';
import { useProjectWorkspace } from '@/hooks/useProjectWorkspace';
import type { Deliverable as ApiDeliverable } from '@/lib/api/projectWorkspaces';
import { toast } from 'sonner';

const FALLBACK: ApiDeliverable[] = [
  { id: 'DEL-1', workspaceId: 'demo', milestoneId: 'MS-1', title: 'Brand Guidelines v3', url: '#', status: 'approved', submittedBy: 'demo', submittedAt: new Date().toISOString() },
  { id: 'DEL-2', workspaceId: 'demo', milestoneId: 'MS-1', title: 'Homepage Mockup', url: '#', status: 'submitted', submittedBy: 'demo', submittedAt: new Date().toISOString() },
];

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  approved: { label: 'Approved', badge: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' },
  submitted: { label: 'Pending Review', badge: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]' },
  'changes-requested': { label: 'Revision Requested', badge: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]' },
  rejected: { label: 'Rejected', badge: 'bg-destructive/10 text-destructive' },
};

export default function ProjectDeliverablesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { apiOn, workspace, workspaceId, isFetching, error, mutations } = useProjectWorkspace(projectId);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'revision'>('all');

  const deliverables = workspace?.deliverables?.length ? workspace.deliverables : FALLBACK;

  const filtered = useMemo(() => {
    if (filter === 'all') return deliverables;
    if (filter === 'pending') return deliverables.filter((d) => d.status === 'submitted');
    if (filter === 'approved') return deliverables.filter((d) => d.status === 'approved');
    return deliverables.filter((d) => d.status === 'changes-requested');
  }, [deliverables, filter]);

  const counts = {
    total: deliverables.length,
    approved: deliverables.filter((d) => d.status === 'approved').length,
    pending: deliverables.filter((d) => d.status === 'submitted').length,
    revision: deliverables.filter((d) => d.status === 'changes-requested').length,
  };

  const onApprove = (d: ApiDeliverable) => {
    if (!workspaceId) { toast.error('No workspace'); return; }
    mutations.reviewDeliverable.mutate({ deliverableId: d.id, decision: 'approve' });
  };
  const onRequestChanges = (d: ApiDeliverable) => {
    if (!workspaceId) { toast.error('No workspace'); return; }
    const feedback = window.prompt('Feedback for revision?');
    if (!feedback) return;
    mutations.reviewDeliverable.mutate({ deliverableId: d.id, decision: 'request-changes', feedback });
  };
  const onReject = (d: ApiDeliverable) => {
    if (!workspaceId) { toast.error('No workspace'); return; }
    const feedback = window.prompt('Reason for rejection?');
    if (!feedback) return;
    mutations.reviewDeliverable.mutate({ deliverableId: d.id, decision: 'reject', feedback });
  };
  const onUpload = () => {
    if (!workspaceId) { toast.error('No workspace bound to this project'); return; }
    const milestoneId = workspace?.milestones?.[0]?.id;
    if (!milestoneId) { toast.error('Create a milestone first'); return; }
    const title = window.prompt('Deliverable title?');
    if (!title) return;
    const url = window.prompt('Deliverable URL?');
    if (!url) return;
    mutations.submitDeliverable.mutate({ milestoneId, title, url });
  };

  return (
    <DashboardLayout topStrip={
      <>
        <Package className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Deliverables</span>
        <Badge variant="outline" className="text-[9px] rounded-lg ml-2">{workspace?.title ?? 'Project'}</Badge>
        {isFetching && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        <div className="flex-1" />
        {!apiOn && <Badge variant="secondary" className="gap-1 text-[8px]"><WifiOff className="h-2.5 w-2.5" />Preview data</Badge>}
        <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
          {(['all', 'pending', 'approved', 'revision'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={cn('px-2 py-1 rounded-lg text-[8px] font-medium capitalize transition-colors', filter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground')}>{f}</button>
          ))}
        </div>
        <Button size="sm" className="h-7 text-[10px] rounded-xl gap-1" onClick={onUpload} disabled={mutations.submitDeliverable.isPending}>
          <Upload className="h-3 w-3" />Upload
        </Button>
      </>
    }>
      {error && (
        <div className="mb-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-[10px] text-destructive flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5" />Failed to load deliverables: {error.message}
        </div>
      )}
      <KPIBand className="mb-3">
        <KPICard label="Total" value={String(counts.total)} className="!rounded-2xl" />
        <KPICard label="Approved" value={String(counts.approved)} className="!rounded-2xl" />
        <KPICard label="Pending Review" value={String(counts.pending)} className="!rounded-2xl" />
        <KPICard label="Needs Revision" value={String(counts.revision)} className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {filtered.length === 0 && (
          <SectionCard className="!rounded-2xl">
            <div className="text-center py-8 text-[11px] text-muted-foreground">No deliverables yet. Click Upload to submit one.</div>
          </SectionCard>
        )}
        {filtered.map(d => {
          const cfg = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.submitted;
          return (
            <SectionCard key={d.id} className="!rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[8px] text-muted-foreground font-mono">{d.id.slice(0, 8)}</span>
                    <span className="text-[11px] font-bold">{d.title}</span>
                    <Badge className={cn('text-[7px] border-0 rounded-lg', cfg.badge)}>{cfg.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[8px] text-muted-foreground flex-wrap">
                    <span>Milestone: <span className="font-medium text-foreground">{d.milestoneId.slice(0, 8)}</span></span>
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{new Date(d.submittedAt).toLocaleDateString()}</span>
                    {d.notes && <span className="truncate max-w-[200px]">{d.notes}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5" asChild>
                    <a href={d.url} target="_blank" rel="noopener noreferrer"><Eye className="h-3 w-3" />Preview</a>
                  </Button>
                  {d.status === 'approved' && (
                    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5" asChild>
                      <a href={d.url} download><Download className="h-3 w-3" />Download</a>
                    </Button>
                  )}
                  {d.status === 'submitted' && (
                    <>
                      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"
                        disabled={mutations.reviewDeliverable.isPending}
                        onClick={() => onApprove(d)}>
                        <CheckCircle className="h-3 w-3" />Approve
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"
                        disabled={mutations.reviewDeliverable.isPending}
                        onClick={() => onRequestChanges(d)}>
                        <MessageSquare className="h-3 w-3" />Changes
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5 text-destructive"
                        disabled={mutations.reviewDeliverable.isPending}
                        onClick={() => onReject(d)}>
                        <X className="h-3 w-3" />Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SectionCard>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
