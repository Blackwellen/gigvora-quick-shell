import React, { useState } from 'react';
import { FinPageShell, FinPageHeader, FinBackLink, FinTable } from './_shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter } from 'lucide-react';

const TICKETS = [
  { id: 'FIN-9182', subject: 'Refund request — duplicate charge', customer: 'sarah.chen@gigvora.com', amount: '£124.50', priority: 'high', status: 'open', sla: '2h 14m' },
  { id: 'FIN-9181', subject: 'Payout missing for July', customer: 'm.patel@studio.io', amount: '£2,840.00', priority: 'urgent', status: 'open', sla: '47m' },
  { id: 'FIN-9180', subject: 'Disputed subscription charge', customer: 'james@kraftworks.co', amount: '£59.00', priority: 'medium', status: 'pending', sla: '4h 02m' },
  { id: 'FIN-9179', subject: 'Wrong VAT applied to invoice', customer: 'finance@belmont.uk', amount: '£14.20', priority: 'low', status: 'resolved', sla: '—' },
  { id: 'FIN-9178', subject: 'Currency conversion off by 2%', customer: 'lin@northwind.com', amount: '£312.00', priority: 'medium', status: 'open', sla: '1d 02h' },
];

const FinTicketsPage: React.FC = () => {
  const [q, setQ] = useState('');
  const filtered = TICKETS.filter((t) => t.id.toLowerCase().includes(q.toLowerCase()) || t.subject.toLowerCase().includes(q.toLowerCase()));
  return (
    <FinPageShell>
      <FinBackLink />
      <FinPageHeader
        eyebrow="Tickets"
        title="Finance ticket queue"
        subtitle="Refunds, payout queries, billing disputes, and subscription escalations."
        right={<Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" /> New ticket</Button>}
      />
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tickets…" className="pl-9 h-9" />
        </div>
        <Button variant="outline" size="sm"><Filter className="h-3.5 w-3.5 mr-1.5" /> Filters</Button>
      </div>
      <FinTable
        headers={['Ticket', 'Subject', 'Customer', 'Amount', 'Priority', 'Status', 'SLA']}
        rows={filtered.map((t) => [
          <span className="font-mono text-xs">{t.id}</span>,
          <span className="font-medium">{t.subject}</span>,
          <span className="text-muted-foreground">{t.customer}</span>,
          <span className="tabular-nums">{t.amount}</span>,
          <Badge variant={t.priority === 'urgent' ? 'destructive' : 'secondary'} className="capitalize text-[10px]">{t.priority}</Badge>,
          <Badge variant="outline" className="capitalize text-[10px]">{t.status}</Badge>,
          <span className="text-xs text-muted-foreground tabular-nums">{t.sla}</span>,
        ])}
      />
    </FinPageShell>
  );
};
export default FinTicketsPage;
