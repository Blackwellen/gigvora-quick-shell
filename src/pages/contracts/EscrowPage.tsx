import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Shield, DollarSign, AlertTriangle, Lock, Send, Clock,
  ChevronRight, History, Flag, ExternalLink, MessageSquare,
  Package, CheckCircle2, XCircle, ArrowDownRight, ArrowUpRight,
  Wallet, CreditCard, RotateCcw, Eye, Ban, Unlock,
  FileText, RefreshCw, Scale, TrendingUp, Info,
} from 'lucide-react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Data
   ═══════════════════════════════════════════════════════════ */
type EscrowStatus = 'held' | 'partially-released' | 'released' | 'disputed' | 'refunded';
type TxType = 'fund' | 'release' | 'hold' | 'refund' | 'dispute-hold' | 'fee';

interface EscrowMilestone {
  id: string; number: number; title: string; amount: number;
  status: EscrowStatus; fundedAt: string; releasedAt?: string;
  holdReason?: string;
}

interface Transaction {
  id: string; type: TxType; amount: number; description: string;
  actor: string; actorAvatar: string; timestamp: string;
  milestoneNum?: number; balanceAfter: number;
}

const CONTRACT = {
  id: 'c1', title: 'SaaS Platform Development',
  clientName: 'TechVentures Inc.', clientAvatar: 'TV',
  freelancerName: 'Alex Morgan', freelancerAvatar: 'AM',
  totalValue: 28000,
};

const ESCROW_MILESTONES: EscrowMilestone[] = [
  { id: 'em1', number: 1, title: 'Architecture & Auth', amount: 8000, status: 'released', fundedAt: 'Jan 15, 2026', releasedAt: 'Feb 1, 2026' },
  { id: 'em2', number: 2, title: 'Billing & Core Features', amount: 12000, status: 'held', fundedAt: 'Feb 2, 2026', holdReason: 'Awaiting deliverable approval' },
  { id: 'em3', number: 3, title: 'Dashboard & Polish', amount: 5000, status: 'held', fundedAt: 'Mar 1, 2026' },
  { id: 'em4', number: 4, title: 'Testing & Launch', amount: 3000, status: 'disputed', fundedAt: 'Mar 10, 2026', holdReason: 'Dispute #D-4821 under review' },
];

const TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'fund', amount: 8000, description: 'Milestone 1 funded to escrow', actor: 'TechVentures Inc.', actorAvatar: 'TV', timestamp: 'Jan 15, 10:00 AM', milestoneNum: 1, balanceAfter: 8000 },
  { id: 't2', type: 'fund', amount: 12000, description: 'Milestone 2 funded to escrow', actor: 'TechVentures Inc.', actorAvatar: 'TV', timestamp: 'Feb 2, 9:30 AM', milestoneNum: 2, balanceAfter: 20000 },
  { id: 't3', type: 'release', amount: 8000, description: 'Milestone 1 released to freelancer', actor: 'System', actorAvatar: 'SY', timestamp: 'Feb 1, 10:30 AM', milestoneNum: 1, balanceAfter: 12000 },
  { id: 't4', type: 'fee', amount: 400, description: 'Platform fee (5%)', actor: 'System', actorAvatar: 'SY', timestamp: 'Feb 1, 10:31 AM', milestoneNum: 1, balanceAfter: 11600 },
  { id: 't5', type: 'fund', amount: 5000, description: 'Milestone 3 funded to escrow', actor: 'TechVentures Inc.', actorAvatar: 'TV', timestamp: 'Mar 1, 8:00 AM', milestoneNum: 3, balanceAfter: 16600 },
  { id: 't6', type: 'fund', amount: 3000, description: 'Milestone 4 funded to escrow', actor: 'TechVentures Inc.', actorAvatar: 'TV', timestamp: 'Mar 10, 11:00 AM', milestoneNum: 4, balanceAfter: 19600 },
  { id: 't7', type: 'dispute-hold', amount: 3000, description: 'Funds frozen — Dispute #D-4821 opened', actor: 'TechVentures Inc.', actorAvatar: 'TV', timestamp: 'Mar 12, 2:00 PM', milestoneNum: 4, balanceAfter: 19600 },
];

const STATUS_CFG: Record<EscrowStatus, { badge: 'healthy' | 'caution' | 'blocked' | 'pending' | 'live' | 'review'; label: string }> = {
  held: { badge: 'caution', label: 'Held' },
  'partially-released': { badge: 'review', label: 'Partial Release' },
  released: { badge: 'healthy', label: 'Released' },
  disputed: { badge: 'blocked', label: 'Disputed' },
  refunded: { badge: 'pending', label: 'Refunded' },
};

const TX_ICON: Record<TxType, React.ReactNode> = {
  fund: <ArrowDownRight className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />,
  release: <ArrowUpRight className="h-3.5 w-3.5 text-accent" />,
  hold: <Lock className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]" />,
  refund: <RotateCcw className="h-3.5 w-3.5 text-[hsl(var(--state-blocked))]" />,
  'dispute-hold': <Flag className="h-3.5 w-3.5 text-[hsl(var(--state-blocked))]" />,
  fee: <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />,
};

/* ═══════════════════════════════════════════════════════════
   Release Confirmation Modal
   ═══════════════════════════════════════════════════════════ */
const ReleaseModal: React.FC<{ milestone: EscrowMilestone | null; onClose: () => void }> = ({ milestone, onClose }) => {
  if (!milestone) return null;
  const fee = milestone.amount * 0.05;
  const net = milestone.amount - fee;
  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative flex justify-center items-start pt-[8vh] px-4">
        <div className="w-full max-w-sm bg-card rounded-2xl border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-sm flex items-center gap-2"><Unlock className="h-4 w-4 text-accent" />Release Funds</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="text-[10px] font-medium">Milestone {milestone.number}: {milestone.title}</div>
            </div>
            <div className="space-y-1.5 text-[10px]">
              {[
                { l: 'Escrow Amount', v: `$${milestone.amount.toLocaleString()}`, bold: true },
                { l: 'Platform Fee (5%)', v: `-$${fee.toLocaleString()}` },
                { l: 'Net to Freelancer', v: `$${net.toLocaleString()}`, bold: true },
              ].map(r => (
                <div key={r.l} className="flex justify-between"><span className="text-muted-foreground">{r.l}</span><span className={r.bold ? 'font-bold' : 'font-medium'}>{r.v}</span></div>
              ))}
            </div>
            <div className="rounded-md border border-accent/30 bg-accent/5 p-2.5 text-[9px] flex gap-2">
              <Info className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
              <span>Releasing funds is irreversible. The freelancer will receive payment within 1-3 business days. This action is logged for audit.</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t">
            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={onClose}>Cancel</Button>
            <Button size="sm" className="h-7 text-[10px] gap-1" onClick={() => { toast.success(`$${net.toLocaleString()} released to ${CONTRACT.freelancerName}`); onClose(); }}><Unlock className="h-3 w-3" />Confirm Release</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Refund Request Modal
   ═══════════════════════════════════════════════════════════ */
const RefundModal: React.FC<{ milestone: EscrowMilestone | null; onClose: () => void }> = ({ milestone, onClose }) => {
  if (!milestone) return null;
  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative flex justify-center items-start pt-[8vh] px-4">
        <div className="w-full max-w-sm bg-card rounded-2xl border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-sm flex items-center gap-2"><RotateCcw className="h-4 w-4 text-[hsl(var(--state-blocked))]" />Request Refund</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="text-[10px] font-medium">Milestone {milestone.number}: {milestone.title}</div>
              <div className="text-[9px] text-muted-foreground">${milestone.amount.toLocaleString()} in escrow</div>
            </div>
            <div>
              <label className="text-[11px] font-semibold mb-1 block">Reason for refund</label>
              <textarea className="w-full h-20 rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none" placeholder="Explain why you're requesting a refund..." />
            </div>
            <div className="rounded-md border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-2.5 text-[9px] flex gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))] shrink-0 mt-0.5" />
              <span>Refund requests require freelancer consent or admin mediation. Funds remain held during review.</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t">
            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={onClose}>Cancel</Button>
            <Button variant="destructive" size="sm" className="h-7 text-[10px] gap-1" onClick={() => { toast.info('Refund request submitted for review'); onClose(); }}><RotateCcw className="h-3 w-3" />Submit Request</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const EscrowPage: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const [selectedMs, setSelectedMs] = useState<EscrowMilestone | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<EscrowMilestone | null>(null);
  const [refundTarget, setRefundTarget] = useState<EscrowMilestone | null>(null);
  const [txFilter, setTxFilter] = useState<TxType | 'all'>('all');

  const totalFunded = ESCROW_MILESTONES.reduce((s, m) => s + m.amount, 0);
  const totalReleased = ESCROW_MILESTONES.filter(m => m.status === 'released').reduce((s, m) => s + m.amount, 0);
  const totalHeld = ESCROW_MILESTONES.filter(m => m.status === 'held' || m.status === 'disputed').reduce((s, m) => s + m.amount, 0);
  const totalDisputed = ESCROW_MILESTONES.filter(m => m.status === 'disputed').reduce((s, m) => s + m.amount, 0);

  const filteredTx = txFilter === 'all' ? TRANSACTIONS : TRANSACTIONS.filter(t => t.type === txFilter);

  const topStrip = (
    <>
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold truncate max-w-[180px]">{CONTRACT.title}</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs font-semibold">Escrow</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1" asChild><Link to={`/contracts`}><ExternalLink className="h-3 w-3" />Contract</Link></Button>
        <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1" asChild><Link to={`/contracts/${contractId}/milestones`}><Package className="h-3 w-3" />Milestones</Link></Button>
        <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><MessageSquare className="h-3 w-3" />Message</Button>
      </div>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      {/* Escrow Summary */}
      <SectionCard title="Escrow Summary" icon={<Wallet className="h-3.5 w-3.5 text-accent" />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Released</span>
            <span className="font-bold">{Math.round((totalReleased / totalFunded) * 100)}%</span>
          </div>
          <Progress value={(totalReleased / totalFunded) * 100} className="h-2" />
          <div className="grid grid-cols-2 gap-1.5 text-[9px]">
            {[
              { l: 'Funded', v: `$${(totalFunded / 1000).toFixed(0)}K`, c: '' },
              { l: 'Released', v: `$${(totalReleased / 1000).toFixed(0)}K`, c: 'text-[hsl(var(--state-healthy))]' },
              { l: 'Held', v: `$${(totalHeld / 1000).toFixed(0)}K`, c: 'text-[hsl(var(--state-caution))]' },
              { l: 'Disputed', v: `$${(totalDisputed / 1000).toFixed(0)}K`, c: 'text-[hsl(var(--state-blocked))]' },
            ].map(r => (
              <div key={r.l} className="rounded-lg border p-1.5 text-center">
                <div className={cn('font-bold text-[11px]', r.c)}>{r.v}</div>
                <div className="text-muted-foreground">{r.l}</div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Parties */}
      <SectionCard title="Parties">
        <div className="space-y-2">
          {[
            { label: 'Client (Payer)', name: CONTRACT.clientName, avatar: CONTRACT.clientAvatar },
            { label: 'Freelancer (Payee)', name: CONTRACT.freelancerName, avatar: CONTRACT.freelancerAvatar },
          ].map(p => (
            <div key={p.label} className="flex items-center gap-2">
              <Avatar className="h-6 w-6"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{p.avatar}</AvatarFallback></Avatar>
              <div>
                <div className="text-[10px] font-medium">{p.name}</div>
                <div className="text-[8px] text-muted-foreground">{p.label}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Protection */}
      <SectionCard title="Protection" icon={<Scale className="h-3.5 w-3.5 text-accent" />}>
        <div className="space-y-1.5 text-[9px]">
          <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /><span>Escrow-protected contract</span></div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /><span>Dispute resolution available</span></div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /><span>Milestone-based releases</span></div>
          <div className="flex items-center gap-1.5"><Shield className="h-3 w-3 text-accent" /><span>Platform-mediated refunds</span></div>
        </div>
      </SectionCard>

      {/* Alerts */}
      {totalDisputed > 0 && (
        <div className="rounded-lg border border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.05)] p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[hsl(var(--state-blocked))] mb-1"><Flag className="h-3.5 w-3.5" />Active Dispute</div>
          <div className="text-[9px] text-muted-foreground">$3,000 frozen under Dispute #D-4821. Resolution pending admin review.</div>
          <Button variant="outline" size="sm" className="h-5 text-[8px] mt-2 w-full">View Dispute</Button>
        </div>
      )}
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] font-semibold flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Transaction Ledger</div>
        <div className="flex items-center gap-1">
          {(['all', 'fund', 'release', 'refund', 'dispute-hold', 'fee'] as const).map(f => (
            <Button key={f} variant={txFilter === f ? 'secondary' : 'ghost'} size="sm" className="h-5 text-[8px] px-2" onClick={() => setTxFilter(f)}>
              {f === 'all' ? 'All' : f === 'dispute-hold' ? 'Disputes' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-0">
        {/* Header */}
        <div className="grid grid-cols-[24px_1fr_80px_80px_80px_100px] gap-2 px-2 py-1.5 text-[8px] font-semibold text-muted-foreground border-b">
          <span />
          <span>Description</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Balance</span>
          <span>Actor</span>
          <span className="text-right">Time</span>
        </div>
        {filteredTx.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map(tx => (
          <div key={tx.id} className="grid grid-cols-[24px_1fr_80px_80px_80px_100px] gap-2 px-2 py-1.5 text-[10px] border-b border-border/50 hover:bg-muted/10">
            <div className="flex items-center justify-center">{TX_ICON[tx.type]}</div>
            <div className="truncate">{tx.description}</div>
            <div className={cn('text-right font-medium', tx.type === 'fund' ? 'text-[hsl(var(--state-healthy))]' : tx.type === 'release' ? 'text-accent' : tx.type === 'fee' ? 'text-muted-foreground' : 'text-[hsl(var(--state-blocked))]')}>
              {tx.type === 'fund' ? '+' : '-'}${tx.amount.toLocaleString()}
            </div>
            <div className="text-right font-medium">${tx.balanceAfter.toLocaleString()}</div>
            <div className="truncate text-muted-foreground">{tx.actor}</div>
            <div className="text-right text-[9px] text-muted-foreground">{tx.timestamp}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      {/* KPI Band */}
      <KPIBand className="mb-3">
        <KPICard label="Total Funded" value={`$${(totalFunded / 1000).toFixed(0)}K`} />
        <KPICard label="Released" value={`$${(totalReleased / 1000).toFixed(0)}K`} change={`${Math.round((totalReleased / totalFunded) * 100)}%`} trend="up" />
        <KPICard label="Held in Escrow" value={`$${(totalHeld / 1000).toFixed(0)}K`} />
        <KPICard label="Disputed" value={`$${(totalDisputed / 1000).toFixed(0)}K`} change={totalDisputed > 0 ? 'Active' : '—'} trend={totalDisputed > 0 ? 'down' : 'neutral'} />
      </KPIBand>

      {/* Milestone Escrow Cards */}
      <div className="space-y-2">
        {ESCROW_MILESTONES.map(m => {
          const cfg = STATUS_CFG[m.status];
          return (
            <div key={m.id} className={cn(
              'rounded-lg border bg-card transition-all',
              m.status === 'disputed' ? 'border-[hsl(var(--state-blocked)/0.4)]' : '',
              m.status === 'held' ? 'border-[hsl(var(--state-caution)/0.3)]' : '',
            )}>
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/10" onClick={() => setSelectedMs(m)}>
                <div className="h-7 w-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold shrink-0">{m.number}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold">{m.title}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">Funded {m.fundedAt}{m.releasedAt ? ` · Released ${m.releasedAt}` : ''}</div>
                </div>
                <div className="text-right shrink-0 mr-2">
                  <div className="text-[12px] font-bold">${m.amount.toLocaleString()}</div>
                </div>
                <StatusBadge status={cfg.badge} label={cfg.label} />
              </div>

              {/* Action bar */}
              {m.status !== 'released' && m.status !== 'refunded' && (
                <div className="flex items-center gap-1.5 px-4 py-2 border-t bg-muted/5">
                  {m.status === 'held' && (
                    <>
                      <Button size="sm" className="h-6 text-[9px] gap-1" onClick={() => setReleaseTarget(m)}><Unlock className="h-3 w-3" />Release Funds</Button>
                      <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1" onClick={() => setRefundTarget(m)}><RotateCcw className="h-3 w-3" />Request Refund</Button>
                      <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1 text-[hsl(var(--state-blocked))]" onClick={() => toast.warning('Dispute opened for Milestone ' + m.number)}><Flag className="h-3 w-3" />Open Dispute</Button>
                    </>
                  )}
                  {m.status === 'disputed' && (
                    <div className="flex items-center gap-2 text-[9px]">
                      <Flag className="h-3.5 w-3.5 text-[hsl(var(--state-blocked))]" />
                      <span className="text-[hsl(var(--state-blocked))] font-medium">Funds frozen — dispute under review</span>
                      <Button variant="outline" size="sm" className="h-5 text-[8px] ml-auto">View Dispute</Button>
                    </div>
                  )}
                </div>
              )}

              {/* Hold banner */}
              {m.holdReason && m.status !== 'released' && (
                <div className={cn(
                  'mx-4 mb-3 rounded-md p-2.5 flex items-center gap-2 text-[10px]',
                  m.status === 'disputed' ? 'border border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.05)]' : 'border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)]',
                )}>
                  {m.status === 'disputed' ? <Flag className="h-3.5 w-3.5 text-[hsl(var(--state-blocked))] shrink-0" /> : <Clock className="h-3.5 w-3.5 text-[hsl(var(--state-caution))] shrink-0" />}
                  <span>{m.holdReason}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Release & Refund Modals */}
      <ReleaseModal milestone={releaseTarget} onClose={() => setReleaseTarget(null)} />
      <RefundModal milestone={refundTarget} onClose={() => setRefundTarget(null)} />

      {/* Detail Drawer */}
      <Sheet open={!!selectedMs} onOpenChange={() => setSelectedMs(null)}>
        <SheetContent className="w-[420px] sm:w-[460px] overflow-y-auto">
          {selectedMs && (() => {
            const m = selectedMs;
            const cfg = STATUS_CFG[m.status];
            const msTx = TRANSACTIONS.filter(t => t.milestoneNum === m.number).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
            const fee = m.amount * 0.05;
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="text-sm flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold shrink-0">{m.number}</div>
                    {m.title} — Escrow
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={cfg.badge} label={cfg.label} />
                  </div>

                  {/* Breakdown */}
                  <div className="rounded-lg border p-3 text-[10px] space-y-1.5">
                    {[
                      { l: 'Escrow Amount', v: `$${m.amount.toLocaleString()}` },
                      { l: 'Platform Fee (5%)', v: `$${fee.toLocaleString()}` },
                      { l: 'Net to Freelancer', v: `$${(m.amount - fee).toLocaleString()}` },
                      { l: 'Funded', v: m.fundedAt },
                      { l: 'Released', v: m.releasedAt || '—' },
                    ].map(r => (
                      <div key={r.l} className="flex justify-between"><span className="text-muted-foreground">{r.l}</span><span className="font-medium">{r.v}</span></div>
                    ))}
                  </div>

                  {/* Milestone Transactions */}
                  <div>
                    <h4 className="text-[11px] font-semibold mb-2">Transactions</h4>
                    {msTx.length === 0 ? (
                      <div className="rounded-lg border p-4 text-center text-[10px] text-muted-foreground">No transactions</div>
                    ) : (
                      <div className="space-y-1.5">
                        {msTx.map(tx => (
                          <div key={tx.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted/20 transition-colors">
                            {TX_ICON[tx.type]}
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-medium truncate">{tx.description}</div>
                              <div className="text-[8px] text-muted-foreground">{tx.actor} · {tx.timestamp}</div>
                            </div>
                            <span className={cn('text-[10px] font-bold', tx.type === 'fund' ? 'text-[hsl(var(--state-healthy))]' : 'text-muted-foreground')}>
                              {tx.type === 'fund' ? '+' : '-'}${tx.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    {m.status === 'held' && (
                      <>
                        <Button size="sm" className="h-7 text-[10px] flex-1 gap-1" onClick={() => { setReleaseTarget(m); setSelectedMs(null); }}><Unlock className="h-3 w-3" />Release</Button>
                        <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 gap-1" onClick={() => { setRefundTarget(m); setSelectedMs(null); }}><RotateCcw className="h-3 w-3" />Refund</Button>
                      </>
                    )}
                    {m.status === 'disputed' && (
                      <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 gap-1"><Flag className="h-3 w-3" />View Dispute</Button>
                    )}
                    {m.status === 'released' && (
                      <div className="flex items-center gap-1.5 text-[10px] text-[hsl(var(--state-healthy))]"><CheckCircle2 className="h-3.5 w-3.5" />Funds released successfully</div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default EscrowPage;
