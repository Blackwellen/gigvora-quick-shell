import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Wallet, DollarSign, Lock, Shield, ArrowUpRight, ArrowDownLeft, Clock, Filter, Download } from 'lucide-react';

const LEDGER = [
  { id: 'ESC-5001', type: 'deposit' as const, project: 'MVP Build', counterparty: 'James R.', amount: '+$5,000', balance: '$12,500', date: 'Apr 12, 2026', status: 'completed' as const },
  { id: 'ESC-5002', type: 'release' as const, project: 'Logo Design', counterparty: 'Emma W.', amount: '-$200', balance: '$12,300', date: 'Apr 10, 2026', status: 'completed' as const },
  { id: 'ESC-5003', type: 'hold' as const, project: 'Brand Kit', counterparty: 'Tom H.', amount: '$800', balance: '-', date: 'Apr 14, 2026', status: 'held' as const },
  { id: 'ESC-5004', type: 'deposit' as const, project: 'API Integration', counterparty: 'David C.', amount: '+$3,000', balance: '$15,300', date: 'Apr 8, 2026', status: 'completed' as const },
  { id: 'ESC-5005', type: 'refund' as const, project: 'UI Audit', counterparty: 'Ana R.', amount: '-$150', balance: '$15,150', date: 'Apr 6, 2026', status: 'completed' as const },
];

const typeIcons = { deposit: ArrowDownLeft, release: ArrowUpRight, hold: Lock, refund: ArrowUpRight };
const statusMap = { completed: 'healthy', held: 'caution', pending: 'pending' } as const;

export default function EscrowLedgerPage() {
  const [tab, setTab] = useState('all');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Wallet className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Escrow Ledger</h1>
          <KPICard label="Total in Escrow" value="$15,150" />
          <KPICard label="On Hold" value="$800" change="1 dispute" />
          <KPICard label="Released (MTD)" value="$7,200" />
          <KPICard label="Funded (MTD)" value="$8,000" />
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Download className="h-3 w-3" /> Export</Button>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Protection" icon={<Shield className="h-3 w-3 text-accent" />}>
            <div className="space-y-1.5 text-[9px]">
              {['Bank-grade encryption', 'Milestone-based release', 'Dispute auto-hold', 'Instant refund eligible', 'Audit trail'].map(item => (
                <div key={item} className="flex items-center gap-1.5"><Lock className="h-2.5 w-2.5 text-accent" /><span>{item}</span></div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Quick Actions">
            <div className="space-y-1.5">
              <Button variant="outline" size="sm" className="w-full h-7 text-[10px]">Fund Project</Button>
              <Button variant="outline" size="sm" className="w-full h-7 text-[10px]">Request Release</Button>
              <Button variant="outline" size="sm" className="w-full h-7 text-[10px]">View Disputes</Button>
            </div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-48"
    >
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-8">
          <TabsTrigger value="all" className="text-[10px] px-3">All Transactions</TabsTrigger>
          <TabsTrigger value="deposit" className="text-[10px] px-3">Deposits</TabsTrigger>
          <TabsTrigger value="release" className="text-[10px] px-3">Releases</TabsTrigger>
          <TabsTrigger value="hold" className="text-[10px] px-3">Holds</TabsTrigger>
        </TabsList>
      </Tabs>

      <SectionCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] h-8">ID</TableHead>
              <TableHead className="text-[10px] h-8">Type</TableHead>
              <TableHead className="text-[10px] h-8">Project</TableHead>
              <TableHead className="text-[10px] h-8">Counterparty</TableHead>
              <TableHead className="text-[10px] h-8">Amount</TableHead>
              <TableHead className="text-[10px] h-8">Balance</TableHead>
              <TableHead className="text-[10px] h-8">Date</TableHead>
              <TableHead className="text-[10px] h-8">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(tab === 'all' ? LEDGER : LEDGER.filter(l => l.type === tab)).map(l => {
              const Icon = typeIcons[l.type];
              return (
                <TableRow key={l.id} className="cursor-pointer">
                  <TableCell className="text-[10px] font-mono py-2">{l.id}</TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1">
                      <Icon className={`h-3 w-3 ${l.type === 'deposit' ? 'text-[hsl(var(--state-healthy))]' : l.type === 'hold' ? 'text-[hsl(var(--gigvora-amber))]' : 'text-muted-foreground'}`} />
                      <span className="text-[10px] capitalize">{l.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] py-2">{l.project}</TableCell>
                  <TableCell className="text-[10px] py-2">{l.counterparty}</TableCell>
                  <TableCell className={`text-[10px] font-bold py-2 ${l.amount.startsWith('+') ? 'text-[hsl(var(--state-healthy))]' : l.amount.startsWith('-') ? 'text-muted-foreground' : ''}`}>{l.amount}</TableCell>
                  <TableCell className="text-[10px] py-2">{l.balance}</TableCell>
                  <TableCell className="text-[10px] py-2">{l.date}</TableCell>
                  <TableCell className="py-2"><StatusBadge status={statusMap[l.status]} label={l.status} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </SectionCard>
    </DashboardLayout>
  );
}
