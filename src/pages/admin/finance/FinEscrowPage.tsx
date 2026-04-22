import React from 'react';
import { FinPageShell, FinPageHeader, FinBackLink, FinTable, FinKpiCard } from './_shared';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Clock, AlertTriangle, Lock } from 'lucide-react';

const ESCROW = [
  { id: 'ESC-3812', project: 'PRJ-7821 — Brand refresh', client: 'Belmont Ltd', professional: 'Sarah Chen', amount: '£4,500', heldSince: '14d', milestone: '3 of 4', status: 'active' },
  { id: 'ESC-3811', project: 'GIG-9012 — Logo set', client: 'Northwind', professional: 'James Patel', amount: '£780', heldSince: '3d', milestone: 'Final', status: 'pending_release' },
  { id: 'ESC-3810', project: 'PRJ-7811 — Mobile app', client: 'Kraftworks', professional: 'Mira Singh', amount: '£12,400', heldSince: '21d', milestone: '2 of 5', status: 'active' },
  { id: 'ESC-3809', project: 'PRJ-7805 — Site copy', client: 'Studio Lin', professional: 'A. Reyes', amount: '£1,820', heldSince: '32d', milestone: 'Disputed', status: 'disputed' },
];

const FinEscrowPage: React.FC = () => (
  <FinPageShell>
    <FinBackLink />
    <FinPageHeader eyebrow="Escrow" title="Escrow records" subtitle="All funds currently held against active project milestones." />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <FinKpiCard label="Total held" value="£1.42M" icon={Lock} />
      <FinKpiCard label="Active" value="312" icon={ShieldCheck} />
      <FinKpiCard label="Pending release" value="18" delta="+4" positive={false} icon={Clock} />
      <FinKpiCard label="Disputed" value="3" delta="+1" positive={false} icon={AlertTriangle} />
    </div>
    <FinTable
      headers={['Escrow', 'Project', 'Client', 'Professional', 'Amount', 'Held', 'Milestone', 'Status']}
      rows={ESCROW.map((e) => [
        <span className="font-mono text-xs">{e.id}</span>,
        <span className="font-medium">{e.project}</span>,
        <span>{e.client}</span>,
        <span className="text-muted-foreground">{e.professional}</span>,
        <span className="tabular-nums">{e.amount}</span>,
        <span className="text-xs text-muted-foreground">{e.heldSince}</span>,
        <span className="text-xs">{e.milestone}</span>,
        <Badge variant={e.status === 'disputed' ? 'destructive' : 'secondary'} className="capitalize text-[10px]">{e.status.replace('_', ' ')}</Badge>,
      ])}
    />
  </FinPageShell>
);
export default FinEscrowPage;
