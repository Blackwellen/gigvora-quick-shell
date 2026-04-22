/**
 * Domain 17 — Linked Context index. Aggregates pinned cross-domain contexts
 * (project, milestone, order, invoice, contract, gig) across the viewer's
 * active threads. Uses the inbox.listThreads + per-thread `contexts` array.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link2, FolderKanban, FileText, Milestone, ShoppingBag, DollarSign, Eye, Plus } from 'lucide-react';
import { DataState, deriveStatus } from '@/components/state/DataState';
import { sdk, sdkReady } from '@/lib/gigvora-sdk';

const ICONS: Record<string, React.ReactNode> = {
  project: <FolderKanban className="h-3.5 w-3.5 text-accent" />,
  milestone: <Milestone className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />,
  order: <ShoppingBag className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />,
  invoice: <DollarSign className="h-3.5 w-3.5 text-[hsl(var(--gigvora-blue))]" />,
  contract: <FileText className="h-3.5 w-3.5 text-muted-foreground" />,
  gig: <ShoppingBag className="h-3.5 w-3.5 text-accent" />,
  service: <FolderKanban className="h-3.5 w-3.5 text-accent" />,
  job: <FileText className="h-3.5 w-3.5 text-muted-foreground" />,
  event: <Milestone className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />,
  company: <FolderKanban className="h-3.5 w-3.5 text-accent" />,
  profile: <FolderKanban className="h-3.5 w-3.5 text-accent" />,
};

const FALLBACK = [
  { type: 'project', icon: ICONS.project, name: 'E-commerce Platform Redesign', id: 'PRJ-2401', status: 'Active', thread: 'Sarah Chen', linkedDate: 'Apr 10' },
  { type: 'milestone', icon: ICONS.milestone, name: 'Design Phase Completion', id: 'MS-002', status: 'In Progress', thread: 'Sarah Chen', linkedDate: 'Apr 10' },
  { type: 'order', icon: ICONS.order, name: 'Logo Design Package', id: 'ORD-1842', status: 'Delivered', thread: 'James Wilson', linkedDate: 'Apr 8' },
];

const statusColors: Record<string, string> = { Active: 'text-[hsl(var(--state-healthy))]', 'In Progress': 'text-[hsl(var(--gigvora-amber))]', Delivered: 'text-accent', Paid: 'text-[hsl(var(--state-healthy))]' };

export default function ChatLinkedContextPage() {
  const live = sdkReady();
  const threadsQ = useQuery({
    queryKey: ['inbox', 'threads', 'with-contexts'],
    queryFn: () => sdk.inbox.listThreads({ pageSize: 50 }),
    enabled: live,
    staleTime: 60_000,
  });

  const fallback = !live || threadsQ.isError;
  const live_rows = (threadsQ.data?.items ?? []).flatMap(t =>
    (t.contexts ?? []).map(c => ({
      type: c.kind,
      icon: ICONS[c.kind] ?? <Link2 className="h-3.5 w-3.5 text-muted-foreground" />,
      name: c.label,
      id: c.id,
      status: 'Active',
      thread: t.title ?? t.id,
      linkedDate: new Date(c.pinnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })),
  );
  const linked = fallback ? FALLBACK : live_rows;

  const status = deriveStatus({
    isLoading: live && threadsQ.isLoading,
    isError: false,
    isEmpty: linked.length === 0,
  });

  return (
    <DashboardLayout topStrip={<><Link2 className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Linked Context</span><div className="flex-1" /><Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Plus className="h-3 w-3" />Link Item</Button></>}>
      <div className="flex flex-wrap gap-1 mb-3">{['All', 'Projects', 'Orders', 'Invoices', 'Contracts', 'Gigs'].map(f => <Button key={f} variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">{f}</Button>)}</div>
      <DataState status={status} empty={<div className="py-12 text-center text-xs text-muted-foreground">No linked items yet — pin a project, order, or contract from any thread.</div>}>
        <div className="space-y-2">
          {linked.map((l, i) => (
            <SectionCard key={`${l.type}-${l.id}-${i}`} className="!rounded-2xl cursor-pointer hover:border-accent/30 transition-all" data-testid={`linked-${l.type}-${l.id}`}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-muted/30 flex items-center justify-center shrink-0">{l.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold">{l.name}</span>
                    <Badge variant="outline" className="text-[7px] rounded-md capitalize">{l.type}</Badge>
                    <Badge variant="outline" className="text-[7px] font-mono rounded-md">{l.id}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[8px] text-muted-foreground">
                    <span className={`font-medium ${statusColors[l.status] || ''}`}>{l.status}</span>
                    <span>Thread: {l.thread}</span>
                    <span>Linked {l.linkedDate}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Eye className="h-2.5 w-2.5" />Open</Button>
              </div>
            </SectionCard>
          ))}
        </div>
      </DataState>
    </DashboardLayout>
  );
}
