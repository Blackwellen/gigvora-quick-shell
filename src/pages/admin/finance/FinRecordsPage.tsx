import React from 'react';
import { FinPageShell, FinPageHeader, FinBackLink, FinTable } from './_shared';
import { Badge } from '@/components/ui/badge';

const RECORDS = [
  { ref: 'PRJ-7821', kind: 'Project', title: 'Brand refresh', total: '£18,000', paid: '£13,500', balance: '£4,500', status: 'in_progress' },
  { ref: 'GIG-9012', kind: 'Gig', title: 'Logo set', total: '£780', paid: '£780', balance: '£0', status: 'paid' },
  { ref: 'SVC-2210', kind: 'Service', title: 'SEO audit', total: '£1,200', paid: '£1,200', balance: '£0', status: 'paid' },
  { ref: 'JOB-4082', kind: 'Job', title: 'Senior React contractor', total: '£8,400', paid: '£4,200', balance: '£4,200', status: 'in_progress' },
  { ref: 'PRJ-7805', kind: 'Project', title: 'Site copy', total: '£3,640', paid: '£1,820', balance: '£1,820', status: 'disputed' },
];

const FinRecordsPage: React.FC = () => (
  <FinPageShell>
    <FinBackLink />
    <FinPageHeader eyebrow="Records" title="Project / Gig / Payment records" subtitle="Cross-object payment trail per booking. Tracks total, paid, and balance." />
    <FinTable
      headers={['Reference', 'Kind', 'Title', 'Total', 'Paid', 'Balance', 'Status']}
      rows={RECORDS.map((r) => [
        <span className="font-mono text-xs">{r.ref}</span>,
        <Badge variant="outline" className="text-[10px]">{r.kind}</Badge>,
        <span className="font-medium">{r.title}</span>,
        <span className="tabular-nums">{r.total}</span>,
        <span className="tabular-nums">{r.paid}</span>,
        <span className="tabular-nums font-medium">{r.balance}</span>,
        <Badge variant={r.status === 'disputed' ? 'destructive' : 'secondary'} className="capitalize text-[10px]">{r.status.replace('_', ' ')}</Badge>,
      ])}
    />
  </FinPageShell>
);
export default FinRecordsPage;
