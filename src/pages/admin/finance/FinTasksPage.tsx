import React from 'react';
import { FinPageShell, FinPageHeader, FinBackLink, FinTable } from './_shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const TASKS = [
  { id: 'TASK-4012', title: 'Reconcile July Stripe payouts', assignee: 'A. Reyes', team: 'Finance', due: 'Today', status: 'in_progress' },
  { id: 'TASK-4011', title: 'Review high-value refund queue', assignee: 'M. Khan', team: 'Finance', due: 'Tomorrow', status: 'open' },
  { id: 'TASK-4010', title: 'Sign off Q3 commission report', assignee: 'L. Smith', team: 'Finance / Exec', due: 'In 3 days', status: 'open' },
  { id: 'TASK-4009', title: 'Investigate FX mismatch on EUR invoices', assignee: 'A. Park', team: 'Finance', due: 'Today', status: 'in_progress' },
  { id: 'TASK-4008', title: 'Approve commission rate change for Pro tier', assignee: 'Super Admin', team: 'Exec', due: '—', status: 'blocked' },
];

const FinTasksPage: React.FC = () => (
  <FinPageShell>
    <FinBackLink />
    <FinPageHeader
      eyebrow="Delegated Tasks"
      title="Finance delegated tasks"
      subtitle="Reconciliations, signoffs, escalations across the finance ops team."
      right={<Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" /> New task</Button>}
    />
    <FinTable
      headers={['Task', 'Title', 'Assignee', 'Team', 'Due', 'Status']}
      rows={TASKS.map((t) => [
        <span className="font-mono text-xs">{t.id}</span>,
        <span className="font-medium">{t.title}</span>,
        <span>{t.assignee}</span>,
        <span className="text-muted-foreground text-xs">{t.team}</span>,
        <span className="text-xs">{t.due}</span>,
        <Badge variant={t.status === 'blocked' ? 'destructive' : 'secondary'} className="capitalize text-[10px]">{t.status.replace('_', ' ')}</Badge>,
      ])}
    />
  </FinPageShell>
);
export default FinTasksPage;
