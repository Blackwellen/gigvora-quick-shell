import React from 'react';
import { FinPageShell, FinPageHeader, FinBackLink, FinTable, FinKpiCard } from './_shared';
import { Badge } from '@/components/ui/badge';
import { Coins, Lock, Wallet, RefreshCw } from 'lucide-react';

const WALLETS = [
  { id: 'W-2014', owner: 'Belmont Ltd', balance: '£4,820.00', held: '£200.00', currency: 'GBP', lastTopup: '4d ago' },
  { id: 'W-2013', owner: 'Studio Lin', balance: '£1,240.00', held: '£0.00', currency: 'GBP', lastTopup: '12d ago' },
  { id: 'W-2012', owner: 'Sarah Chen', balance: '£820.50', held: '£124.50', currency: 'GBP', lastTopup: '2d ago' },
  { id: 'W-2011', owner: 'Kraftworks', balance: '£3,180.00', held: '£800.00', currency: 'GBP', lastTopup: '7d ago' },
  { id: 'W-2010', owner: 'Mira Singh', balance: '£148.00', held: '£0.00', currency: 'GBP', lastTopup: '1d ago' },
];

const FinCreditsPage: React.FC = () => (
  <FinPageShell>
    <FinBackLink />
    <FinPageHeader eyebrow="Credits" title="Credits & held credits" subtitle="Wallet balances, held credits, and adjustments across all customers." />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <FinKpiCard label="Total credits" value="£428,400" icon={Coins} />
      <FinKpiCard label="Held credits" value="£184,200" delta="−£6.1k" positive icon={Lock} />
      <FinKpiCard label="Active wallets" value="928" icon={Wallet} />
      <FinKpiCard label="Adjustments (24h)" value="14" delta="+3" positive={false} icon={RefreshCw} />
    </div>
    <FinTable
      headers={['Wallet', 'Owner', 'Balance', 'Held', 'Currency', 'Last top-up']}
      rows={WALLETS.map((w) => [
        <span className="font-mono text-xs">{w.id}</span>,
        <span className="font-medium">{w.owner}</span>,
        <span className="tabular-nums font-medium">{w.balance}</span>,
        <span className="tabular-nums text-amber-600 dark:text-amber-400">{w.held}</span>,
        <Badge variant="outline" className="text-[10px]">{w.currency}</Badge>,
        <span className="text-xs text-muted-foreground">{w.lastTopup}</span>,
      ])}
    />
  </FinPageShell>
);
export default FinCreditsPage;
