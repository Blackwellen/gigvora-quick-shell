import React from 'react';
import { FinPageShell, FinPageHeader, FinBackLink, FinTable, FinKpiCard } from './_shared';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, AlertTriangle, Users } from 'lucide-react';

const SUBS = [
  { id: 'SUB-12001', customer: 'Belmont Ltd', plan: 'Enterprise', mrr: '£499', status: 'active', renews: 'in 12d' },
  { id: 'SUB-12000', customer: 'Studio Lin', plan: 'Team', mrr: '£199', status: 'active', renews: 'in 4d' },
  { id: 'SUB-11999', customer: 'Northwind', plan: 'Pro', mrr: '£59', status: 'past_due', renews: 'overdue 2d' },
  { id: 'SUB-11998', customer: 'Sarah Chen', plan: 'Pro', mrr: '£59', status: 'active', renews: 'in 21d' },
  { id: 'SUB-11997', customer: 'Kraftworks', plan: 'Team', mrr: '£199', status: 'cancelled', renews: '—' },
  { id: 'SUB-11996', customer: 'Mira Singh', plan: 'Pro', mrr: '£59', status: 'trialing', renews: 'trial ends 6d' },
];

const FinSubscriptionsPage: React.FC = () => (
  <FinPageShell>
    <FinBackLink />
    <FinPageHeader eyebrow="Subscriptions" title="Recurring subscriptions" subtitle="All active, trialing, past-due, and cancelled customer subscriptions." />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <FinKpiCard label="MRR" value="£184,200" delta="+4.1%" positive icon={TrendingUp} />
      <FinKpiCard label="Active subs" value="4,106" delta="+58" positive icon={Users} />
      <FinKpiCard label="Past due" value="42" delta="+8" positive={false} icon={AlertTriangle} />
      <FinKpiCard label="Churn (30d)" value="1.8%" delta="−0.2pp" positive icon={RefreshCw} />
    </div>
    <FinTable
      headers={['Subscription', 'Customer', 'Plan', 'MRR', 'Status', 'Renews']}
      rows={SUBS.map((s) => [
        <span className="font-mono text-xs">{s.id}</span>,
        <span className="font-medium">{s.customer}</span>,
        <Badge variant="outline" className="text-[10px]">{s.plan}</Badge>,
        <span className="tabular-nums">{s.mrr}</span>,
        <Badge variant={s.status === 'past_due' ? 'destructive' : s.status === 'cancelled' ? 'outline' : 'secondary'} className="capitalize text-[10px]">{s.status.replace('_', ' ')}</Badge>,
        <span className="text-xs text-muted-foreground">{s.renews}</span>,
      ])}
    />
  </FinPageShell>
);
export default FinSubscriptionsPage;
