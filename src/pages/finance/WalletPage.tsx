import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import {
  Wallet, CreditCard, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight,
  Plus, Download, Search, CheckCircle2, Clock, Coins, BarChart3, Eye, Send,
  RefreshCw, Lock, AlertTriangle, AlertCircle, ChevronRight, MoreHorizontal,
  Copy, Shield, Sparkles, Banknote, History, Zap, Gift,
  X, Package, Receipt, ExternalLink, Tag, Percent, ShoppingCart,
  PieChart, Activity, FileText, ArrowRight, RotateCcw, Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

// ── Types ──
type TxType = 'credit' | 'debit' | 'topup' | 'payout' | 'credit-purchase' | 'escrow-hold' | 'escrow-release' | 'refund' | 'commission' | 'bonus';
type TxStatus = 'completed' | 'pending' | 'failed' | 'held' | 'reversed';
type WalletScope = 'personal' | 'org';
type WTab = 'balance' | 'packages' | 'history' | 'purchase' | 'insights' | 'promos' | 'refunds' | 'mobile';

interface Transaction {
  id: string; desc: string; amount: string; type: TxType; status: TxStatus;
  date: string; counterparty: string; ref?: string;
}
interface CreditPack {
  id: string; name: string; credits: number; price: string; bonus?: number; popular?: boolean;
}
interface Promo {
  id: string; code: string; discount: string; validUntil: string; status: 'active' | 'expired' | 'used';
  desc: string; minPurchase?: string;
}
interface RefundRecord {
  id: string; original: string; amount: string; reason: string; status: 'approved' | 'pending' | 'denied' | 'processing';
  date: string; resolvedBy?: string;
}

// ── Mock Data ──
const TRANSACTIONS: Transaction[] = [
  { id: 'tx1', desc: 'Milestone 1 — SaaS Platform', amount: '+$5,000.00', type: 'escrow-release', status: 'completed', date: 'Apr 10', counterparty: 'TechCorp', ref: 'ESC-2041' },
  { id: 'tx2', desc: 'Credit Pack — Pro 500', amount: '-$45.00', type: 'credit-purchase', status: 'completed', date: 'Apr 9', counterparty: 'Gigvora', ref: 'CR-1892' },
  { id: 'tx3', desc: 'Wallet top-up via card ••6789', amount: '+$2,000.00', type: 'topup', status: 'completed', date: 'Apr 8', counterparty: 'Bank ••6789' },
  { id: 'tx4', desc: 'Platform commission — Order #ORD-445', amount: '-$250.00', type: 'commission', status: 'completed', date: 'Apr 7', counterparty: 'Platform Fee', ref: 'ORD-445' },
  { id: 'tx5', desc: 'Payout to bank ••1234', amount: '-$3,000.00', type: 'payout', status: 'pending', date: 'Apr 7', counterparty: 'Bank ••1234' },
  { id: 'tx6', desc: 'Escrow hold — Mobile App Redesign', amount: '-$5,000.00', type: 'escrow-hold', status: 'held', date: 'Apr 5', counterparty: 'Escrow', ref: 'ESC-2038' },
  { id: 'tx7', desc: 'Welcome bonus credits', amount: '+50 credits', type: 'bonus', status: 'completed', date: 'Apr 1', counterparty: 'Gigvora' },
  { id: 'tx8', desc: 'Gig order — Logo Design', amount: '+$150.00', type: 'credit', status: 'completed', date: 'Mar 30', counterparty: 'DesignHub', ref: 'GIG-892' },
  { id: 'tx9', desc: 'Refund — Order #ORD-089', amount: '+$75.00', type: 'refund', status: 'completed', date: 'Mar 28', counterparty: 'Client Refund', ref: 'ORD-089' },
  { id: 'tx10', desc: 'Recruiter Pro subscription', amount: '-$99.00', type: 'debit', status: 'completed', date: 'Mar 25', counterparty: 'Gigvora', ref: 'SUB-301' },
  { id: 'tx11', desc: 'Failed payout — insufficient balance', amount: '-$1,500.00', type: 'payout', status: 'failed', date: 'Mar 22', counterparty: 'Bank ••1234' },
  { id: 'tx12', desc: 'Credit usage — Job boost', amount: '-25 credits', type: 'debit', status: 'completed', date: 'Mar 20', counterparty: 'Jobs', ref: 'JOB-118' },
];

const CREDIT_PACKS: CreditPack[] = [
  { id: 'cp1', name: 'Starter', credits: 100, price: '$9.99' },
  { id: 'cp2', name: 'Pro', credits: 500, price: '$39.99', bonus: 50, popular: true },
  { id: 'cp3', name: 'Business', credits: 2000, price: '$149.99', bonus: 300 },
  { id: 'cp4', name: 'Enterprise', credits: 10000, price: '$699.99', bonus: 2000 },
];

const PROMOS: Promo[] = [
  { id: 'p1', code: 'SPRING25', discount: '25% off', validUntil: 'Apr 30', status: 'active', desc: '25% off any credit pack purchase', minPurchase: '$20' },
  { id: 'p2', code: 'WELCOME50', discount: '50 bonus credits', validUntil: 'May 15', status: 'active', desc: '50 bonus credits on first purchase' },
  { id: 'p3', code: 'LOYALTY10', discount: '10% off', validUntil: 'Mar 31', status: 'expired', desc: '10% off for returning customers' },
  { id: 'p4', code: 'TEAM2024', discount: '15% off', validUntil: 'Feb 28', status: 'used', desc: '15% off team credit packs' },
];

const REFUNDS: RefundRecord[] = [
  { id: 'rf1', original: 'ORD-089', amount: '$75.00', reason: 'Service not delivered within SLA', status: 'approved', date: 'Mar 28', resolvedBy: 'System' },
  { id: 'rf2', original: 'ORD-112', amount: '$320.00', reason: 'Duplicate charge', status: 'processing', date: 'Apr 8' },
  { id: 'rf3', original: 'GIG-445', amount: '$50.00', reason: 'Quality dispute — partial refund', status: 'pending', date: 'Apr 11' },
  { id: 'rf4', original: 'SUB-290', amount: '$99.00', reason: 'Subscription cancelled within trial', status: 'denied', date: 'Mar 15', resolvedBy: 'Finance Team' },
];

const USAGE_DATA = [
  { category: 'Job Boosts', credits: 120, pct: 32 },
  { category: 'Featured Listings', credits: 85, pct: 23 },
  { category: 'Recruiter Actions', credits: 65, pct: 17 },
  { category: 'Ad Campaigns', credits: 55, pct: 15 },
  { category: 'Premium Visibility', credits: 35, pct: 9 },
  { category: 'Other', credits: 15, pct: 4 },
];

const ACTIVITY = [
  { actor: 'System', action: 'Payout of $3,000 initiated to bank ••1234', time: '2h ago', type: 'payout' },
  { actor: 'Alex K.', action: 'Escrow released for Milestone 1 — $5,000', time: '5h ago', type: 'release' },
  { actor: 'System', action: 'Credit pack Pro 500 purchased — 550 credits added', time: '1d ago', type: 'purchase' },
  { actor: 'System', action: 'Commission of $250 deducted from Order #ORD-445', time: '2d ago', type: 'commission' },
  { actor: 'Platform', action: 'Welcome bonus: 50 credits added to account', time: '10d ago', type: 'bonus' },
];

const TX_TYPE_CONFIG: Record<TxType, { icon: React.ElementType; color: string }> = {
  credit: { icon: ArrowDownRight, color: 'text-[hsl(var(--state-healthy))]' },
  debit: { icon: ArrowUpRight, color: 'text-destructive' },
  topup: { icon: Plus, color: 'text-[hsl(var(--state-healthy))]' },
  payout: { icon: Send, color: 'text-[hsl(var(--gigvora-purple))]' },
  'credit-purchase': { icon: Coins, color: 'text-accent' },
  'escrow-hold': { icon: Lock, color: 'text-[hsl(var(--gigvora-amber))]' },
  'escrow-release': { icon: CheckCircle2, color: 'text-[hsl(var(--state-healthy))]' },
  refund: { icon: RefreshCw, color: 'text-accent' },
  commission: { icon: Receipt, color: 'text-muted-foreground' },
  bonus: { icon: Gift, color: 'text-[hsl(var(--gigvora-purple))]' },
};
const TX_STATUS_MAP: Record<TxStatus, 'healthy' | 'pending' | 'blocked' | 'caution' | 'degraded'> = {
  completed: 'healthy', pending: 'pending', failed: 'blocked', held: 'caution', reversed: 'degraded',
};
const REFUND_STATUS_MAP: Record<string, 'healthy' | 'pending' | 'blocked' | 'caution'> = {
  approved: 'healthy', processing: 'pending', pending: 'caution', denied: 'blocked',
};
const PROMO_STATUS_MAP: Record<string, 'healthy' | 'pending' | 'blocked'> = {
  active: 'healthy', expired: 'blocked', used: 'pending',
};

// ── Sub-components ──
const TxDetailDrawer: React.FC<{ tx: Transaction | null; open: boolean; onClose: () => void }> = ({ tx, open, onClose }) => {
  if (!tx) return null;
  const tc = TX_TYPE_CONFIG[tx.type]; const Icon = tc.icon;
  const isPositive = tx.amount.startsWith('+');
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[440px] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Icon className={cn('h-4 w-4', tc.color)} />Transaction Detail</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="text-center py-3">
            <div className={cn('text-2xl font-bold', isPositive ? 'text-[hsl(var(--state-healthy))]' : 'text-foreground')}>{tx.amount}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{tx.desc}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Status', value: <StatusBadge status={TX_STATUS_MAP[tx.status]} label={tx.status} /> },
              { label: 'Type', value: tx.type.replace(/-/g, ' ') },
              { label: 'Date', value: tx.date },
              { label: 'Counterparty', value: tx.counterparty },
              ...(tx.ref ? [{ label: 'Reference', value: tx.ref }] : []),
            ].map(m => (
              <div key={m.label} className="rounded-xl border p-2">
                <div className="text-[7px] text-muted-foreground mb-0.5">{m.label}</div>
                <div className="text-[9px] font-medium">{m.value}</div>
              </div>
            ))}
          </div>
          {tx.status === 'failed' && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-center gap-1.5 text-destructive text-[10px] font-semibold mb-1"><AlertCircle className="h-3 w-3" />Transaction Failed</div>
              <p className="text-[8px] text-muted-foreground">Insufficient balance at time of processing. Please ensure adequate funds and retry.</p>
              <Button size="sm" className="h-6 text-[9px] gap-1 mt-2 rounded-xl"><RefreshCw className="h-2.5 w-2.5" />Retry</Button>
            </div>
          )}
          {tx.status === 'held' && (
            <div className="rounded-xl border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 p-3">
              <div className="flex items-center gap-1.5 text-[hsl(var(--gigvora-amber))] text-[10px] font-semibold mb-1"><Lock className="h-3 w-3" />Funds Held in Escrow</div>
              <p className="text-[8px] text-muted-foreground">Funds will be released upon milestone completion and buyer approval.</p>
            </div>
          )}
          {tx.status === 'pending' && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
              <div className="flex items-center gap-1.5 text-accent text-[10px] font-semibold mb-1"><Clock className="h-3 w-3" />Processing</div>
              <p className="text-[8px] text-muted-foreground">This transaction is being processed. Payouts typically take 1-3 business days.</p>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Copied')}><Copy className="h-2.5 w-2.5" />Copy ID</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Downloading receipt')}><Download className="h-2.5 w-2.5" />Receipt</Button>
            {tx.ref && <Link to="/invoices"><Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><ExternalLink className="h-2.5 w-2.5" />View Source</Button></Link>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const AddFundsDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Sheet open={open} onOpenChange={onClose}>
    <SheetContent className="w-[440px] overflow-y-auto">
      <SheetHeader><SheetTitle className="text-sm">Add Funds</SheetTitle></SheetHeader>
      <div className="mt-4 space-y-3">
        <div>
          <label className="text-[9px] font-medium mb-1 block">Amount</label>
          <div className="relative"><DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><input type="number" placeholder="0.00" className="w-full h-8 rounded-xl border bg-background pl-8 pr-3 text-sm font-semibold" /></div>
        </div>
        <div className="flex gap-1.5">{['$50', '$100', '$500', '$1,000'].map(a => <Button key={a} variant="outline" size="sm" className="h-6 text-[9px] flex-1 rounded-xl">{a}</Button>)}</div>
        <div><label className="text-[9px] font-medium mb-1 block">Payment Method</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>Card ending ••6789</option><option>Bank account ••1234</option><option>Add new method...</option></select></div>
        <div><label className="text-[9px] font-medium mb-1 block">Wallet</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>Personal Wallet</option><option>Organization Wallet</option></select></div>
        <div className="rounded-xl border bg-muted/30 p-2 text-[8px] text-muted-foreground"><div className="flex items-center gap-1 mb-1"><Shield className="h-2.5 w-2.5 text-accent" /><span className="font-medium text-foreground">Secure Transaction</span></div>Funds are processed securely and will be available immediately.</div>
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { onClose(); toast.success('Funds added successfully'); }}><Plus className="h-3 w-3" />Add Funds</Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
);

const BuyCreditsDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Sheet open={open} onOpenChange={onClose}>
    <SheetContent className="w-[480px] overflow-y-auto">
      <SheetHeader><SheetTitle className="text-sm">Buy Credits</SheetTitle></SheetHeader>
      <div className="mt-4 space-y-3">
        <p className="text-[9px] text-muted-foreground">Credits are used for job boosts, featured listings, recruiter actions, and premium visibility across the platform.</p>
        <div className="grid grid-cols-2 gap-2">
          {CREDIT_PACKS.map(p => (
            <div key={p.id} className={cn('rounded-2xl border p-3 cursor-pointer hover:border-accent/50 transition-all hover:shadow-sm relative', p.popular && 'border-accent/40 bg-accent/5')}>
              {p.popular && <Badge className="absolute -top-1.5 right-2 text-[6px] h-3.5 px-1">Popular</Badge>}
              <div className="text-[10px] font-semibold">{p.name}</div>
              <div className="text-lg font-bold mt-1">{p.credits.toLocaleString()}</div>
              <div className="text-[8px] text-muted-foreground">credits</div>
              {p.bonus && <div className="text-[8px] text-[hsl(var(--state-healthy))] font-medium mt-0.5">+{p.bonus} bonus</div>}
              <div className="text-[10px] font-semibold mt-2">{p.price}</div>
              <Button size="sm" className="w-full h-6 text-[8px] mt-2 rounded-xl">Select</Button>
            </div>
          ))}
        </div>
        <div className="rounded-xl border bg-muted/30 p-2 text-[8px] text-muted-foreground">Credits never expire. Bonus credits are added instantly upon purchase.</div>
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { onClose(); toast.success('Credits purchased!'); }}><Coins className="h-3 w-3" />Purchase</Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
);

const TxTable: React.FC<{ txs: Transaction[]; selectedId: string | null; onSelect: (t: Transaction) => void }> = ({ txs, selectedId, onSelect }) => (
  <div className="rounded-2xl border overflow-hidden">
    <table className="w-full">
      <thead className="bg-muted/30"><tr className="text-[9px] text-muted-foreground font-medium"><th className="text-left px-3 py-2">Transaction</th><th className="text-left px-3 py-2">Type</th><th className="text-left px-3 py-2">Status</th><th className="text-right px-3 py-2">Amount</th><th className="text-left px-3 py-2">Date</th><th className="text-left px-3 py-2 w-12"></th></tr></thead>
      <tbody>
        {txs.map(tx => {
          const tc = TX_TYPE_CONFIG[tx.type]; const Icon = tc.icon; const pos = tx.amount.startsWith('+');
          return (
            <tr key={tx.id} onClick={() => onSelect(tx)} className={cn('border-t hover:bg-muted/20 transition-colors cursor-pointer text-[9px]', selectedId === tx.id && 'bg-accent/5')}>
              <td className="px-3 py-2"><div className="flex items-center gap-2"><div className={cn('h-6 w-6 rounded-xl flex items-center justify-center bg-muted/50', tc.color)}><Icon className="h-3 w-3" /></div><div className="min-w-0"><div className="font-medium truncate">{tx.desc}</div><div className="text-[7px] text-muted-foreground">{tx.counterparty}{tx.ref && ` · ${tx.ref}`}</div></div></div></td>
              <td className="px-3 py-2 text-muted-foreground capitalize">{tx.type.replace(/-/g, ' ')}</td>
              <td className="px-3 py-2"><StatusBadge status={TX_STATUS_MAP[tx.status]} label={tx.status} /></td>
              <td className={cn('px-3 py-2 text-right font-semibold', pos ? 'text-[hsl(var(--state-healthy))]' : '')}>{tx.amount}</td>
              <td className="px-3 py-2 text-muted-foreground">{tx.date}</td>
              <td className="px-3 py-2"><Button variant="ghost" size="icon" className="h-5 w-5"><MoreHorizontal className="h-2.5 w-2.5" /></Button></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// ── Main Page ──
const WalletPage: React.FC = () => {
  const { activeRole } = useRole();
  const [tab, setTab] = useState<WTab>('balance');
  const [walletScope, setWalletScope] = useState<WalletScope>('personal');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [buyCreditsOpen, setBuyCreditsOpen] = useState(false);
  const [refundDrawer, setRefundDrawer] = useState(false);
  const [purchaseStep, setPurchaseStep] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = TRANSACTIONS.filter(tx => {
    const s = !search || tx.desc.toLowerCase().includes(search.toLowerCase()) || tx.counterparty.toLowerCase().includes(search.toLowerCase());
    const t = typeFilter === 'all' || tx.type === typeFilter;
    const st = statusFilter === 'all' || tx.status === statusFilter;
    return s && t && st;
  });

  const cashBalance = walletScope === 'personal' ? '$8,925.00' : '$42,310.00';
  const creditBalance = walletScope === 'personal' ? '475' : '3,200';
  const escrowHeld = '$17,000.00';
  const pendingPayout = '$3,000.00';

  const topStrip = (
    <>
      <Wallet className="h-3.5 w-3.5 text-accent" />
      <span className="text-[11px] font-semibold">Wallet · Credits · Purchases</span>
      <Badge variant="secondary" className="text-[7px] capitalize">{activeRole}</Badge>
      <div className="flex-1" />
      <div className="flex gap-0.5 bg-muted/50 rounded-xl p-0.5">
        {(['personal', 'org'] as WalletScope[]).map(s => (
          <button key={s} onClick={() => setWalletScope(s)} className={cn('px-2 py-0.5 rounded-lg text-[9px] transition-colors capitalize', walletScope === s ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground')}>
            {s === 'personal' ? 'Personal' : 'Organization'}
          </button>
        ))}
      </div>
      <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setAddFundsOpen(true)}><Plus className="h-3 w-3" />Add Funds</Button>
      <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setBuyCreditsOpen(true)}><Coins className="h-3 w-3" />Buy Credits</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Cash Balance" icon={<DollarSign className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />} className="!rounded-2xl">
        <div className="text-xl font-bold">{cashBalance}</div>
        <div className="text-[8px] text-muted-foreground mt-0.5">Available for payout</div>
        <div className="flex gap-1 mt-2">
          <Button size="sm" className="h-5 text-[7px] flex-1 gap-0.5 rounded-lg" onClick={() => setAddFundsOpen(true)}><Plus className="h-2 w-2" />Add</Button>
          <Button variant="outline" size="sm" className="h-5 text-[7px] flex-1 gap-0.5 rounded-lg" onClick={() => toast.info('Payout initiated')}><Send className="h-2 w-2" />Payout</Button>
        </div>
      </SectionCard>
      <SectionCard title="Credit Balance" icon={<Coins className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="flex items-baseline gap-1"><span className="text-xl font-bold">{creditBalance}</span><span className="text-[9px] text-muted-foreground">credits</span></div>
        <div className="text-[8px] text-muted-foreground mt-0.5">No expiry</div>
        <Button size="sm" className="w-full h-5 text-[7px] mt-2 gap-0.5 rounded-lg" onClick={() => setBuyCreditsOpen(true)}><Sparkles className="h-2 w-2" />Buy More</Button>
      </SectionCard>
      <SectionCard title="Escrow" icon={<Lock className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />} className="!rounded-2xl">
        <div className="text-lg font-bold">{escrowHeld}</div>
        <div className="text-[8px] text-muted-foreground">Held across 2 milestones</div>
        <div className="mt-1.5 space-y-1">
          <div className="flex justify-between text-[7px]"><span className="text-muted-foreground">SaaS Platform — M2</span><span className="font-medium">$12,000</span></div>
          <div className="flex justify-between text-[7px]"><span className="text-muted-foreground">Mobile App — Design</span><span className="font-medium">$5,000</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Pending" icon={<Clock className="h-3.5 w-3.5 text-[hsl(var(--gigvora-purple))]" />} className="!rounded-2xl">
        <div className="flex justify-between text-[8px]"><span>Payout processing</span><span className="font-medium">{pendingPayout}</span></div>
        <Progress value={60} className="h-1 mt-1" />
        <div className="text-[7px] text-muted-foreground mt-0.5">Est. 1-3 business days</div>
      </SectionCard>
      {TRANSACTIONS.some(t => t.status === 'failed') && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-2">
          <div className="flex items-center gap-1 text-destructive text-[8px] font-semibold"><AlertCircle className="h-2.5 w-2.5" />Failed Transaction</div>
          <p className="text-[7px] text-muted-foreground mt-0.5">1 transaction requires attention</p>
          <Button variant="outline" size="sm" className="h-4 text-[6px] mt-1.5 rounded-lg" onClick={() => setTab('history')}>View</Button>
        </div>
      )}
      <SectionCard title="Quick Links" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { label: 'Invoices', icon: Receipt, to: '/invoices' },
            { label: 'Billing', icon: CreditCard, to: '/billing' },
            { label: 'Payouts', icon: Banknote, to: '/payouts' },
            { label: 'Disputes', icon: AlertTriangle, to: '/disputes' },
          ].map(a => (
            <Link key={a.label} to={a.to}><button className="flex items-center gap-2 p-1.5 rounded-lg w-full text-left hover:bg-muted/30 transition-colors text-[8px]"><a.icon className="h-3 w-3 text-muted-foreground" /><span>{a.label}</span><ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" /></button></Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Financial Activity</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {ACTIVITY.map((a, i) => (
          <div key={i} className="shrink-0 rounded-2xl border bg-card px-3 py-2 min-w-[220px] hover:shadow-sm transition-all">
            <div className="flex items-center gap-1.5 mb-0.5"><Avatar className="h-4 w-4"><AvatarFallback className="text-[5px]">{a.actor[0]}</AvatarFallback></Avatar><span className="text-[9px] font-medium">{a.actor}</span><Badge variant="secondary" className="text-[6px] capitalize">{a.type}</Badge></div>
            <p className="text-[8px] text-muted-foreground line-clamp-2">{a.action}</p>
            <div className="text-[7px] text-muted-foreground mt-0.5">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      {/* Tab Nav */}
      <div className="flex items-center gap-1 mb-3 border-b pb-2 overflow-x-auto">
        {([
          { key: 'balance' as const, label: 'Balance', icon: Wallet },
          { key: 'packages' as const, label: 'Credit Packages', icon: Package },
          { key: 'history' as const, label: 'Transactions', icon: History },
          { key: 'purchase' as const, label: 'Purchase Flow', icon: ShoppingCart },
          { key: 'insights' as const, label: 'Usage Insights', icon: PieChart },
          { key: 'promos' as const, label: 'Promotions', icon: Tag },
          { key: 'refunds' as const, label: 'Refunds', icon: RotateCcw },
          { key: 'mobile' as const, label: 'Mobile Card', icon: Smartphone },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] transition-colors whitespace-nowrap shrink-0', tab === t.key ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30')}><t.icon className="h-3 w-3" />{t.label}</button>
        ))}
      </div>

      {/* ═══ BALANCE ═══ */}
      {tab === 'balance' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Cash Balance" value={cashBalance} change="Available" trend="up" />
            <KPICard label="Credits" value={creditBalance} change="No expiry" />
            <KPICard label="Escrow Held" value={escrowHeld} change="2 milestones" />
            <KPICard label="Pending Payout" value={pendingPayout} change="Processing" />
          </KPIBand>

          {/* Spend Trend */}
          <SectionCard title="30-Day Spend Trend" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="flex items-end gap-1 h-20">
              {[40, 55, 35, 70, 50, 80, 65, 90, 45, 75, 60, 85, 55, 70].map((v, i) => (
                <div key={i} className="flex-1 bg-accent/20 rounded-t-lg hover:bg-accent/40 transition-colors" style={{ height: `${v}%` }} />
              ))}
            </div>
            <div className="flex justify-between text-[7px] text-muted-foreground mt-1"><span>Mar 14</span><span>Apr 13</span></div>
          </SectionCard>

          {/* Recent Transactions */}
          <SectionCard title="Recent Transactions" icon={<History className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl" action={<Button variant="ghost" size="sm" className="h-5 text-[8px] gap-1 rounded-lg" onClick={() => setTab('history')}><Eye className="h-2.5 w-2.5" />View All</Button>}>
            <TxTable txs={TRANSACTIONS.slice(0, 5)} selectedId={selectedTx?.id || null} onSelect={setSelectedTx} />
          </SectionCard>

          {walletScope === 'org' && (
            <div className="rounded-2xl border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 p-3">
              <div className="flex items-center gap-1.5 text-[hsl(var(--gigvora-amber))] text-[10px] font-semibold mb-1"><AlertTriangle className="h-3 w-3" />Credit Settlement Pending</div>
              <p className="text-[8px] text-muted-foreground">Your organization has 1,200 credits in pending settlement. Auto-settles on the 15th.</p>
              <div className="flex gap-1.5 mt-2">
                <Button variant="outline" size="sm" className="h-5 text-[8px] rounded-lg">View Details</Button>
                <Button variant="outline" size="sm" className="h-5 text-[8px] rounded-lg" onClick={() => toast.success('Settlement initiated')}>Settle Now</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ CREDIT PACKAGES ═══ */}
      {tab === 'packages' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Current Balance" value={creditBalance} change="credits" />
            <KPICard label="This Month Used" value="125" change="-32%" />
            <KPICard label="Avg Monthly" value="180" />
            <KPICard label="Best Value" value="Enterprise" change="$0.07/credit" />
          </KPIBand>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {CREDIT_PACKS.map(p => (
              <div key={p.id} className={cn('rounded-2xl border p-4 hover:shadow-md transition-all cursor-pointer relative', p.popular && 'border-accent/40 bg-accent/5 shadow-sm')}>
                {p.popular && <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] h-4 px-2">Most Popular</Badge>}
                <div className="text-[11px] font-semibold">{p.name}</div>
                <div className="text-2xl font-bold mt-2">{p.credits.toLocaleString()}</div>
                <div className="text-[9px] text-muted-foreground">credits</div>
                {p.bonus && <div className="text-[9px] text-[hsl(var(--state-healthy))] font-medium mt-1">+{p.bonus} bonus credits</div>}
                <div className="text-[12px] font-bold mt-3">{p.price}</div>
                <div className="text-[7px] text-muted-foreground">${(parseFloat(p.price.replace('$', '')) / p.credits).toFixed(3)}/credit</div>
                <Button size="sm" className="w-full h-7 text-[9px] mt-3 rounded-xl gap-1" onClick={() => { setTab('purchase'); setPurchaseStep(0); }}><ShoppingCart className="h-3 w-3" />Purchase</Button>
              </div>
            ))}
          </div>
          <SectionCard title="Credit Usage History" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <TxTable txs={TRANSACTIONS.filter(t => ['credit-purchase', 'bonus'].includes(t.type) || t.amount.includes('credits'))} selectedId={selectedTx?.id || null} onSelect={setSelectedTx} />
          </SectionCard>
        </div>
      )}

      {/* ═══ TRANSACTION HISTORY ═══ */}
      {tab === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[160px] max-w-xs"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..." className="w-full h-7 rounded-xl border bg-background pl-7 pr-2 text-[9px]" /></div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px]"><option value="all">All types</option><option value="credit">Income</option><option value="debit">Expense</option><option value="topup">Top-up</option><option value="payout">Payout</option><option value="escrow-hold">Escrow</option><option value="credit-purchase">Credits</option><option value="refund">Refund</option></select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px]"><option value="all">All status</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="held">Held</option><option value="failed">Failed</option></select>
            {(search || typeFilter !== 'all' || statusFilter !== 'all') && <Button variant="ghost" size="sm" className="h-7 text-[8px] gap-1 rounded-xl" onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); }}><X className="h-3 w-3" />Clear</Button>}
            <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl ml-auto" onClick={() => toast.info('Exporting CSV')}><Download className="h-3 w-3" />Export</Button>
          </div>
          <TxTable txs={filtered} selectedId={selectedTx?.id || null} onSelect={setSelectedTx} />
        </div>
      )}

      {/* ═══ PURCHASE FLOW ═══ */}
      {tab === 'purchase' && (
        <div className="space-y-3">
          {/* Stepper */}
          <div className="flex items-center gap-2 mb-2">
            {['Select Package', 'Payment', 'Review', 'Confirmation'].map((s, i) => (
              <React.Fragment key={s}>
                {i > 0 && <div className={cn('flex-1 h-0.5 rounded', i <= purchaseStep ? 'bg-accent' : 'bg-muted')} />}
                <div className={cn('flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] border', i === purchaseStep ? 'bg-accent/10 border-accent/30 text-accent font-medium' : i < purchaseStep ? 'bg-[hsl(var(--state-healthy))]/10 border-[hsl(var(--state-healthy))]/30 text-[hsl(var(--state-healthy))]' : 'text-muted-foreground')}>
                  {i < purchaseStep ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-4 w-4 rounded-full border flex items-center justify-center text-[7px]">{i + 1}</span>}
                  <span className="hidden sm:inline">{s}</span>
                </div>
              </React.Fragment>
            ))}
          </div>

          {purchaseStep === 0 && (
            <div className="grid grid-cols-2 gap-3">
              {CREDIT_PACKS.map(p => (
                <div key={p.id} onClick={() => setPurchaseStep(1)} className={cn('rounded-2xl border p-4 cursor-pointer hover:border-accent/50 hover:shadow-sm transition-all', p.popular && 'border-accent/40 bg-accent/5')}>
                  <div className="flex justify-between items-start"><div className="text-[10px] font-semibold">{p.name}</div>{p.popular && <Badge className="text-[6px]">Best</Badge>}</div>
                  <div className="text-xl font-bold mt-1">{p.credits.toLocaleString()} <span className="text-[9px] font-normal text-muted-foreground">credits</span></div>
                  {p.bonus && <div className="text-[8px] text-[hsl(var(--state-healthy))]">+{p.bonus} bonus</div>}
                  <div className="text-[11px] font-bold mt-2">{p.price}</div>
                </div>
              ))}
            </div>
          )}

          {purchaseStep === 1 && (
            <SectionCard title="Payment Method" icon={<CreditCard className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-2">
                {[{ label: 'Card ••6789 (Visa)', default: true }, { label: 'Bank ••1234' }, { label: 'Wallet Balance ($8,925)' }].map(pm => (
                  <div key={pm.label} className={cn('rounded-xl border p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/20 transition-colors', pm.default && 'border-accent/30 bg-accent/5')}>
                    <div className={cn('h-4 w-4 rounded-full border-2', pm.default ? 'border-accent bg-accent' : 'border-muted-foreground')} />
                    <span className="text-[10px] font-medium flex-1">{pm.label}</span>
                    {pm.default && <Badge variant="secondary" className="text-[6px]">Default</Badge>}
                  </div>
                ))}
                <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl w-full" onClick={() => toast.info('Add payment method')}><Plus className="h-3 w-3" />Add New Method</Button>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setPurchaseStep(0)}>Back</Button>
                <Button size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setPurchaseStep(2)}>Continue</Button>
              </div>
            </SectionCard>
          )}

          {purchaseStep === 2 && (
            <SectionCard title="Review Purchase" icon={<Eye className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="rounded-xl border p-3 space-y-2">
                <div className="flex justify-between text-[9px]"><span className="text-muted-foreground">Package</span><span className="font-semibold">Pro — 500 credits</span></div>
                <div className="flex justify-between text-[9px]"><span className="text-muted-foreground">Bonus</span><span className="text-[hsl(var(--state-healthy))] font-medium">+50 credits</span></div>
                <div className="flex justify-between text-[9px]"><span className="text-muted-foreground">Payment</span><span>Card ••6789</span></div>
                <div className="flex justify-between text-[9px]"><span className="text-muted-foreground">Promo Code</span><input className="w-24 h-5 rounded-lg border bg-background px-1.5 text-[8px] text-right" placeholder="Enter code" /></div>
                <div className="border-t pt-2 flex justify-between text-[10px] font-bold"><span>Total</span><span>$39.99</span></div>
              </div>
              <div className="rounded-xl border bg-muted/30 p-2 text-[8px] text-muted-foreground mt-2"><Shield className="h-2.5 w-2.5 inline mr-1 text-accent" />Your payment is secured. Credits are added instantly upon successful charge.</div>
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setPurchaseStep(1)}>Back</Button>
                <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => setPurchaseStep(3)}><CheckCircle2 className="h-3 w-3" />Confirm Purchase</Button>
              </div>
            </SectionCard>
          )}

          {purchaseStep === 3 && (
            <div className="rounded-2xl border bg-card p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-[hsl(var(--state-healthy))]/10 flex items-center justify-center mx-auto mb-3"><CheckCircle2 className="h-6 w-6 text-[hsl(var(--state-healthy))]" /></div>
              <h3 className="text-[14px] font-bold">Purchase Complete!</h3>
              <p className="text-[10px] text-muted-foreground mt-1">550 credits have been added to your account.</p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="text-center"><div className="text-lg font-bold">{creditBalance}</div><div className="text-[8px] text-muted-foreground">Previous</div></div>
                <ArrowRight className="h-4 w-4 text-accent" />
                <div className="text-center"><div className="text-lg font-bold text-[hsl(var(--state-healthy))]">1,025</div><div className="text-[8px] text-muted-foreground">New Balance</div></div>
              </div>
              <div className="flex gap-2 mt-4 justify-center">
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => toast.info('Receipt downloaded')}><Download className="h-3 w-3" />Receipt</Button>
                <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => { setTab('balance'); setPurchaseStep(0); }}><Wallet className="h-3 w-3" />Go to Wallet</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ USAGE INSIGHTS ═══ */}
      {tab === 'insights' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Credits Used (30d)" value="375" change="-12% vs prior" />
            <KPICard label="Avg Daily" value="12.5" />
            <KPICard label="Top Category" value="Job Boosts" change="32%" />
            <KPICard label="Projected Monthly" value="380" change="Within budget" />
          </KPIBand>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <SectionCard title="Credit Usage by Category" icon={<PieChart className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-2">
                {USAGE_DATA.map(u => (
                  <div key={u.category} className="flex items-center gap-2">
                    <span className="text-[9px] w-28 truncate">{u.category}</span>
                    <div className="flex-1"><Progress value={u.pct} className="h-2" /></div>
                    <span className="text-[9px] font-semibold w-12 text-right">{u.credits}</span>
                    <span className="text-[7px] text-muted-foreground w-8 text-right">{u.pct}%</span>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Daily Usage (14 days)" icon={<Activity className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="flex items-end gap-1 h-24">
                {[8, 15, 12, 20, 10, 18, 14, 22, 9, 16, 11, 19, 13, 17].map((v, i) => (
                  <div key={i} className="flex-1 bg-accent/20 rounded-t-lg hover:bg-accent/40 transition-colors cursor-pointer" style={{ height: `${(v / 22) * 100}%` }} title={`${v} credits`} />
                ))}
              </div>
              <div className="flex justify-between text-[7px] text-muted-foreground mt-1"><span>Mar 31</span><span>Apr 13</span></div>
            </SectionCard>
          </div>
          <SectionCard title="Spend Efficiency" icon={<Zap className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border p-3"><div className="text-lg font-bold">4.2x</div><div className="text-[8px] text-muted-foreground">ROI on Job Boosts</div></div>
              <div className="rounded-xl border p-3"><div className="text-lg font-bold">$0.08</div><div className="text-[8px] text-muted-foreground">Cost per credit</div></div>
              <div className="rounded-xl border p-3"><div className="text-lg font-bold">92%</div><div className="text-[8px] text-muted-foreground">Credits utilized</div></div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ PROMOTIONS ═══ */}
      {tab === 'promos' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Promos" value={String(PROMOS.filter(p => p.status === 'active').length)} />
            <KPICard label="Savings Used" value="$24.50" change="This month" />
            <KPICard label="Available Codes" value={String(PROMOS.filter(p => p.status === 'active').length)} />
            <KPICard label="Total Saved" value="$89.00" change="All time" />
          </KPIBand>

          {/* Apply Promo */}
          <SectionCard title="Apply Promo Code" icon={<Tag className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="flex gap-2">
              <input className="flex-1 h-8 rounded-xl border bg-background px-3 text-[10px]" placeholder="Enter promo code..." />
              <Button size="sm" className="h-8 text-[10px] gap-1 rounded-xl px-4" onClick={() => toast.success('Promo applied!')}><Percent className="h-3 w-3" />Apply</Button>
            </div>
          </SectionCard>

          <div className="space-y-1.5">
            {PROMOS.map(p => (
              <div key={p.id} className={cn('rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all', p.status === 'active' && 'border-accent/20')}>
                <div className="flex items-center gap-3">
                  <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', p.status === 'active' ? 'bg-accent/10' : 'bg-muted')}>
                    <Tag className={cn('h-4 w-4', p.status === 'active' ? 'text-accent' : 'text-muted-foreground')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="text-[10px] font-bold font-mono">{p.code}</span><StatusBadge status={PROMO_STATUS_MAP[p.status]} label={p.status} /></div>
                    <div className="text-[8px] text-muted-foreground">{p.desc}</div>
                    <div className="text-[7px] text-muted-foreground mt-0.5">Valid until {p.validUntil}{p.minPurchase && ` · Min ${p.minPurchase}`}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-bold text-accent">{p.discount}</div>
                    {p.status === 'active' && <Button size="sm" className="h-5 text-[7px] mt-1 rounded-lg" onClick={() => toast.success(`Code ${p.code} applied`)}>Use</Button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ REFUNDS ═══ */}
      {tab === 'refunds' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Refunds" value={String(REFUNDS.length)} />
            <KPICard label="Approved" value={String(REFUNDS.filter(r => r.status === 'approved').length)} />
            <KPICard label="Pending" value={String(REFUNDS.filter(r => r.status === 'pending' || r.status === 'processing').length)} change="Review needed" />
            <KPICard label="Total Refunded" value="$444.00" />
          </KPIBand>

          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-[8px]">
              <thead><tr className="bg-muted/30 border-b"><th className="text-left py-2 px-3 font-medium">Order</th><th className="text-left py-2 px-2 font-medium">Reason</th><th className="text-center py-2 px-2 font-medium">Amount</th><th className="text-center py-2 px-2 font-medium">Status</th><th className="text-center py-2 px-2 font-medium">Date</th><th className="text-center py-2 px-2 font-medium">Actions</th></tr></thead>
              <tbody>
                {REFUNDS.map(r => (
                  <tr key={r.id} className={cn('border-b hover:bg-muted/10 cursor-pointer', r.status === 'denied' && 'opacity-60')}>
                    <td className="py-2 px-3 font-medium font-mono">{r.original}</td>
                    <td className="py-2 px-2 text-muted-foreground max-w-[200px] truncate">{r.reason}</td>
                    <td className="py-2 px-2 text-center font-semibold">{r.amount}</td>
                    <td className="py-2 px-2 text-center"><StatusBadge status={REFUND_STATUS_MAP[r.status]} label={r.status} /></td>
                    <td className="py-2 px-2 text-center text-muted-foreground">{r.date}</td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg" onClick={() => { setRefundDrawer(true); }}><Eye className="h-2.5 w-2.5" /></Button>
                        {r.status === 'pending' && <Button size="sm" className="h-5 text-[7px] rounded-lg" onClick={() => toast.success('Refund approved')}><CheckCircle2 className="h-2.5 w-2.5" /></Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => setRefundDrawer(true)}><Plus className="h-3 w-3" />Request Refund</Button>
        </div>
      )}

      {/* ═══ MOBILE CARD ═══ */}
      {tab === 'mobile' && (
        <div className="space-y-3 max-w-sm mx-auto">
          {/* Wallet Card */}
          <div className="rounded-3xl bg-gradient-to-br from-[hsl(var(--gigvora-purple))] to-accent text-white p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
            <div className="text-[9px] opacity-80 mb-1">Gigvora Wallet</div>
            <div className="text-2xl font-bold">{cashBalance}</div>
            <div className="text-[10px] opacity-70 mt-0.5">Cash Balance</div>
            <div className="flex items-center gap-4 mt-4">
              <div><div className="text-lg font-bold">{creditBalance}</div><div className="text-[8px] opacity-70">Credits</div></div>
              <div className="w-px h-8 bg-white/20" />
              <div><div className="text-lg font-bold">{escrowHeld}</div><div className="text-[8px] opacity-70">Escrow</div></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="secondary" size="sm" className="h-8 text-[10px] flex-1 rounded-xl" onClick={() => setAddFundsOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" />Add Funds</Button>
              <Button variant="secondary" size="sm" className="h-8 text-[10px] flex-1 rounded-xl" onClick={() => toast.info('Payout initiated')}><Send className="h-3.5 w-3.5 mr-1" />Payout</Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-12 text-[10px] gap-1.5 rounded-2xl flex-col" onClick={() => setBuyCreditsOpen(true)}><Coins className="h-4 w-4 text-accent" />Buy Credits</Button>
            <Button variant="outline" className="h-12 text-[10px] gap-1.5 rounded-2xl flex-col" onClick={() => setTab('history')}><History className="h-4 w-4 text-accent" />Transactions</Button>
            <Button variant="outline" className="h-12 text-[10px] gap-1.5 rounded-2xl flex-col" onClick={() => setTab('insights')}><PieChart className="h-4 w-4 text-accent" />Insights</Button>
            <Button variant="outline" className="h-12 text-[10px] gap-1.5 rounded-2xl flex-col" onClick={() => setTab('promos')}><Tag className="h-4 w-4 text-accent" />Promos</Button>
          </div>

          {/* Recent */}
          <SectionCard title="Recent" icon={<Activity className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            {TRANSACTIONS.slice(0, 4).map(tx => {
              const tc = TX_TYPE_CONFIG[tx.type]; const Icon = tc.icon; const pos = tx.amount.startsWith('+');
              return (
                <div key={tx.id} className="flex items-center gap-2 py-2 border-b last:border-0 cursor-pointer" onClick={() => setSelectedTx(tx)}>
                  <div className={cn('h-7 w-7 rounded-xl flex items-center justify-center bg-muted/50', tc.color)}><Icon className="h-3 w-3" /></div>
                  <div className="flex-1 min-w-0"><div className="text-[9px] font-medium truncate">{tx.desc}</div><div className="text-[7px] text-muted-foreground">{tx.date}</div></div>
                  <span className={cn('text-[10px] font-semibold', pos ? 'text-[hsl(var(--state-healthy))]' : '')}>{tx.amount}</span>
                </div>
              );
            })}
          </SectionCard>
        </div>
      )}

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        <div className="flex-1"><span className="text-[10px] font-semibold">{cashBalance}</span><div className="text-[8px] text-muted-foreground">{creditBalance} credits</div></div>
        <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-4" onClick={() => setAddFundsOpen(true)}><Plus className="h-3.5 w-3.5" />Add Funds</Button>
      </div>

      {/* Drawers */}
      <TxDetailDrawer tx={selectedTx} open={!!selectedTx} onClose={() => setSelectedTx(null)} />
      <AddFundsDrawer open={addFundsOpen} onClose={() => setAddFundsOpen(false)} />
      <BuyCreditsDrawer open={buyCreditsOpen} onClose={() => setBuyCreditsOpen(false)} />

      {/* Refund Request Drawer */}
      <Sheet open={refundDrawer} onOpenChange={setRefundDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm">Request Refund</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Order / Reference</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="e.g. ORD-123 or GIG-456" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Amount</label><div className="relative"><DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><input type="number" className="w-full h-7 rounded-xl border bg-background pl-6 pr-2 text-[9px]" placeholder="0.00" /></div></div>
            <div><label className="text-[9px] font-medium mb-1 block">Reason</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>Service not delivered</option><option>Quality issue</option><option>Duplicate charge</option><option>Cancelled within trial</option><option>Other</option></select></div>
            <div><label className="text-[9px] font-medium mb-1 block">Details</label><textarea className="w-full h-16 rounded-xl border bg-background px-2 py-1 text-[9px]" placeholder="Describe the issue..." /></div>
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-2 text-[8px] flex items-center gap-1.5"><Zap className="h-3 w-3 text-accent" /><span>Refunds are reviewed within 2-3 business days. You will be notified of the outcome.</span></div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setRefundDrawer(false)}>Cancel</Button>
              <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setRefundDrawer(false); toast.success('Refund request submitted'); }}><FileText className="h-3 w-3" />Submit</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default WalletPage;
