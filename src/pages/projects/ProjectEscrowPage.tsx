import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, CheckCircle2, Shield, Loader2, WifiOff, AlertCircle } from 'lucide-react';
import { useProjectWorkspace } from '@/hooks/useProjectWorkspace';
import type { Milestone as ApiMilestone } from '@/lib/api/projectWorkspaces';
import { toast } from 'sonner';

const FALLBACK = [
  { id: 'f1', milestone: 'Design Phase', amount: '$2,500', status: 'released' as const, released: 'Apr 5, 2026', rawStatus: 'released' as ApiMilestone['status'], version: 0 },
  { id: 'f2', milestone: 'Frontend Development', amount: '$5,000', status: 'funded' as const, released: '-', rawStatus: 'funded' as ApiMilestone['status'], version: 0 },
  { id: 'f3', milestone: 'Backend Integration', amount: '$5,000', status: 'funded' as const, released: '-', rawStatus: 'funded' as ApiMilestone['status'], version: 0 },
  { id: 'f4', milestone: 'Testing & QA', amount: '$2,000', status: 'pending' as const, released: '-', rawStatus: 'pending' as ApiMilestone['status'], version: 0 },
];

const fmtMoney = (cents: number, c = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(cents / 100);

const statusMap = { released: 'healthy', funded: 'caution', pending: 'pending' } as const;
const apiToView = (s: ApiMilestone['status']): 'released' | 'funded' | 'pending' =>
  s === 'released' ? 'released' : s === 'funded' || s === 'in-progress' || s === 'in-review' ? 'funded' : 'pending';

export default function ProjectEscrowPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { apiOn, workspace, workspaceId, isFetching, error, mutations } = useProjectWorkspace(projectId);

  const items = useMemo(() => {
    if (workspace?.milestones?.length) {
      return workspace.milestones.map((m) => ({
        id: m.id,
        milestone: m.title,
        amount: fmtMoney(m.amountCents, m.currency),
        amountCents: m.amountCents,
        status: apiToView(m.status),
        rawStatus: m.status,
        version: m.version,
        released: m.status === 'released' ? 'Released' : '-',
      }));
    }
    return FALLBACK.map((f) => ({ ...f, amountCents: 0 }));
  }, [workspace]);

  const total = items.reduce((a, i) => a + (i.amountCents || 0), 0);
  const released = items.filter((i) => i.status === 'released').reduce((a, i) => a + (i.amountCents || 0), 0);
  const funded = items.filter((i) => i.status === 'funded').reduce((a, i) => a + (i.amountCents || 0), 0);
  const pending = total - released - funded;

  const releasedPct = total ? Math.round((released / total) * 100) : 17;
  const fundedPct = total ? Math.round((funded / total) * 100) : 66;

  const onAction = (item: typeof items[number], to: ApiMilestone['status']) => {
    if (!workspaceId) { toast.error('No workspace bound'); return; }
    mutations.transitionMilestone.mutate({ milestoneId: item.id, toStatus: to, expectedVersion: item.version });
  };

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Wallet className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Escrow & Funding</h1>
          <KPICard label="Total Budget" value={total ? fmtMoney(total) : '$15,000'} />
          <KPICard label="Funded" value={total ? fmtMoney(funded + released) : '$12,500'} />
          <KPICard label="Released" value={total ? fmtMoney(released) : '$2,500'} />
          <KPICard label="Remaining" value={total ? fmtMoney(pending) : '$2,500'} />
          {isFetching && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          <div className="flex-1" />
          {!apiOn && <Badge variant="secondary" className="gap-1 text-[8px]"><WifiOff className="h-2.5 w-2.5" />Preview data</Badge>}
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Protection" icon={<Shield className="h-3 w-3 text-accent" />}>
            <div className="space-y-1.5 text-[9px]">
              {['Funds held in escrow', 'Milestone-based release', 'Dispute protection', 'Refund guarantee'].map(item => (
                <div key={item} className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-accent" /><span>{item}</span></div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Actions">
            <div className="space-y-1.5">
              <Button variant="outline" size="sm" className="w-full h-7 text-[10px]" onClick={() => toast.info('Funding flow opens via the contract page')}>Add Funds</Button>
              <Button variant="outline" size="sm" className="w-full h-7 text-[10px]"
                disabled={!workspaceId || mutations.startHandover.isPending}
                onClick={() => mutations.startHandover.mutate()}>
                Start Handover
              </Button>
            </div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-48"
    >
      {error && (
        <div className="mb-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-[10px] text-destructive flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5" />Failed to load escrow: {error.message}
        </div>
      )}
      <SectionCard title="Milestone Funding">
        {items.map((f, i) => (
          <div key={f.id} className="flex items-center gap-4 p-3 rounded-xl border border-border/40 mb-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold truncate">{f.milestone}</div>
              <div className="text-[9px] text-muted-foreground">
                {f.status === 'released' ? `Released: ${f.released}` : f.status === 'funded' ? 'Awaiting milestone completion' : 'Not yet funded'}
              </div>
            </div>
            <div className="text-[11px] font-bold shrink-0">{f.amount}</div>
            <StatusBadge status={statusMap[f.status]} label={f.status} />
            {f.status === 'funded' && (
              <Button size="sm" className="h-6 text-[9px]"
                disabled={mutations.transitionMilestone.isPending}
                onClick={() => onAction(f, 'released')}>
                Release
              </Button>
            )}
            {f.status === 'pending' && workspaceId && (
              <Button size="sm" variant="outline" className="h-6 text-[9px]"
                disabled={mutations.transitionMilestone.isPending}
                onClick={() => onAction(f, 'funded')}>
                Fund
              </Button>
            )}
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Funding Progress" className="mt-4">
        <div className="h-4 bg-muted rounded-full overflow-hidden flex">
          <div className="h-full bg-accent" style={{ width: `${releasedPct}%` }} />
          <div className="h-full bg-[hsl(var(--gigvora-amber))]" style={{ width: `${fundedPct}%` }} />
        </div>
        <div className="flex justify-between text-[8px] text-muted-foreground mt-1">
          <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-accent" /> Released: {total ? fmtMoney(released) : '$2,500'}</span>
          <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-[hsl(var(--gigvora-amber))]" /> In Escrow: {total ? fmtMoney(funded) : '$10,000'}</span>
          <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-muted-foreground/20" /> Pending: {total ? fmtMoney(pending) : '$2,500'}</span>
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
