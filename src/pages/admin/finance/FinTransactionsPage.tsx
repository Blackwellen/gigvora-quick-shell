import React, { useState } from 'react';
import { FinPageShell, FinPageHeader, FinBackLink, FinTable, FinKpiCard } from './_shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, Receipt, TrendingUp, RefreshCw, ShieldAlert } from 'lucide-react';

const TXNS = [
  { id: 'TXN-90412', when: '12m ago', customer: 'Belmont Ltd', kind: 'charge', amount: '£312.00', method: 'Visa •••4242', status: 'succeeded' },
  { id: 'TXN-90411', when: '18m ago', customer: 'Studio Patel', kind: 'payout', amount: '£2,840.00', method: 'Bank GB •••1842', status: 'pending' },
  { id: 'TXN-90410', when: '34m ago', customer: 'Sarah Chen', kind: 'refund', amount: '−£124.50', method: 'Visa •••0019', status: 'succeeded' },
  { id: 'TXN-90409', when: '47m ago', customer: 'Northwind Co', kind: 'charge', amount: '£59.00', method: 'Mastercard •••8800', status: 'succeeded' },
  { id: 'TXN-90408', when: '1h ago', customer: 'Kraftworks', kind: 'chargeback', amount: '−£312.00', method: 'AmEx •••2001', status: 'disputed' },
  { id: 'TXN-90407', when: '1h ago', customer: 'Mira Singh', kind: 'charge', amount: '£148.00', method: 'Apple Pay', status: 'succeeded' },
];

const FinTransactionsPage: React.FC = () => {
  const [q, setQ] = useState('');
  const filtered = TXNS.filter((t) => t.id.toLowerCase().includes(q.toLowerCase()) || t.customer.toLowerCase().includes(q.toLowerCase()));
  return (
    <FinPageShell>
      <FinBackLink />
      <FinPageHeader
        eyebrow="Transactions"
        title="Transaction ledger"
        subtitle="All charges, refunds, payouts, and chargebacks across the platform."
        right={<Button size="sm" variant="outline"><Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV</Button>}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <FinKpiCard label="Charges (24h)" value="£42,840" delta="+8.1%" positive icon={Receipt} />
        <FinKpiCard label="Refunds (24h)" value="£1,420" delta="+£280" positive={false} icon={RefreshCw} />
        <FinKpiCard label="Net revenue" value="£41,420" delta="+7.2%" positive icon={TrendingUp} />
        <FinKpiCard label="Chargebacks (7d)" value="3" delta="+1" positive={false} icon={ShieldAlert} />
      </div>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID or customer…" className="pl-9 h-9" />
        </div>
      </div>
      <FinTable
        headers={['Transaction', 'When', 'Customer', 'Kind', 'Amount', 'Method', 'Status']}
        rows={filtered.map((t) => [
          <span className="font-mono text-xs">{t.id}</span>,
          <span className="text-xs text-muted-foreground">{t.when}</span>,
          <span>{t.customer}</span>,
          <Badge variant="outline" className="capitalize text-[10px]">{t.kind}</Badge>,
          <span className={`tabular-nums font-medium ${t.amount.startsWith('−') ? 'text-rose-600' : ''}`}>{t.amount}</span>,
          <span className="text-xs text-muted-foreground font-mono">{t.method}</span>,
          <Badge variant={t.status === 'disputed' ? 'destructive' : 'secondary'} className="capitalize text-[10px]">{t.status}</Badge>,
        ])}
      />
    </FinPageShell>
  );
};
export default FinTransactionsPage;
