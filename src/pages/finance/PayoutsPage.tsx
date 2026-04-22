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
  Banknote, Search, Clock, AlertCircle, ChevronRight, MoreHorizontal,
  History, Plus, CreditCard, Building2, Shield, Download, Eye,
  RefreshCw, AlertTriangle, CheckCircle2, XCircle, ArrowUpRight,
  Landmark, Send, Wallet, TrendingUp, Filter, Lock, X,
  DollarSign, FileText, ExternalLink, Copy, Edit, Trash2,
  Smartphone, Users, Settings, Layers, Globe, Percent,
  ArrowDownRight, Calendar, Package, BarChart3, Zap, Star,
  Scale, Flag, MessageSquare, ShieldAlert, Unlock, Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

// ── Types ──
type PTab = 'payouts' | 'escrow' | 'holds' | 'release' | 'refunds' | 'history' | 'risk' | 'mobile';
type PayoutStatus = 'paid' | 'processing' | 'requested' | 'failed' | 'on_hold' | 'canceled';
type EscrowStatus = 'funded' | 'partial' | 'releasing' | 'disputed' | 'released' | 'refunded';
type HoldReason = 'verification' | 'dispute' | 'policy' | 'fraud-review' | 'compliance';
type RefundStatus = 'approved' | 'pending' | 'processing' | 'completed' | 'denied';
type MethodType = 'bank' | 'paypal' | 'wise' | 'stripe';

interface Payout {
  id: string; amount: string; net: string; fee: string; status: PayoutStatus;
  method: MethodType; destination: string; requestedAt: string; paidAt?: string;
  batchId?: string; note?: string; holdReason?: string;
}
interface EscrowRecord {
  id: string; project: string; client: string; clientAvatar: string; provider: string;
  amount: string; funded: string; released: string; status: EscrowStatus;
  milestones: number; completedMs: number; createdAt: string;
}
interface HoldRecord {
  id: string; type: HoldReason; amount: string; entity: string; entityAvatar: string;
  reason: string; since: string; reviewer?: string; severity: 'low' | 'medium' | 'high' | 'critical';
  linkedPayout?: string;
}
interface RefundRecord {
  id: string; originalTx: string; amount: string; requester: string; requesterAvatar: string;
  reason: string; status: RefundStatus; requestedAt: string; processedAt?: string;
}
interface RiskNote {
  id: string; entity: string; entityAvatar: string; severity: 'info' | 'warning' | 'critical';
  note: string; author: string; createdAt: string; linkedHold?: string;
}
interface PayoutMethod {
  id: string; type: MethodType; label: string; detail: string;
  isDefault: boolean; verified: boolean; lastUsed?: string;
}

// ── Mock Data ──
const PAYOUTS: Payout[] = [
  { id: 'PO-1001', amount: '$3,500.00', net: '$3,465.00', fee: '$35.00', status: 'paid', method: 'bank', destination: 'Chase ****4821', requestedAt: 'Apr 5', paidAt: 'Apr 7', batchId: 'BATCH-088' },
  { id: 'PO-1002', amount: '$1,200.00', net: '$1,188.00', fee: '$12.00', status: 'processing', method: 'bank', destination: 'Chase ****4821', requestedAt: 'Apr 9', batchId: 'BATCH-091' },
  { id: 'PO-1003', amount: '$750.00', net: '$742.50', fee: '$7.50', status: 'requested', method: 'paypal', destination: 'alex@email.com', requestedAt: 'Apr 10' },
  { id: 'PO-1004', amount: '$2,100.00', net: '$0.00', fee: '$0.00', status: 'failed', method: 'bank', destination: 'BofA ****9102', requestedAt: 'Apr 3', note: 'Bank account details invalid. Update your payout method and retry.' },
  { id: 'PO-1005', amount: '$4,800.00', net: '$0.00', fee: '$0.00', status: 'on_hold', method: 'wise', destination: 'Wise ****7733', requestedAt: 'Apr 1', holdReason: 'Under review — identity verification required.' },
  { id: 'PO-1006', amount: '$600.00', net: '$594.00', fee: '$6.00', status: 'paid', method: 'paypal', destination: 'alex@email.com', requestedAt: 'Mar 28', paidAt: 'Mar 30', batchId: 'BATCH-085' },
  { id: 'PO-1007', amount: '$950.00', net: '$0.00', fee: '$0.00', status: 'canceled', method: 'bank', destination: 'Chase ****4821', requestedAt: 'Mar 25', note: 'Canceled by user.' },
];

const ESCROW_RECORDS: EscrowRecord[] = [
  { id: 'ESC-401', project: 'SaaS Platform Build', client: 'TechCorp', clientAvatar: 'TC', provider: 'Alex K.', amount: '$12,000', funded: '$12,000', released: '$8,000', status: 'funded', milestones: 4, completedMs: 3, createdAt: 'Mar 1' },
  { id: 'ESC-402', project: 'Brand Redesign', client: 'DesignHub', clientAvatar: 'DH', provider: 'Studio Nine', amount: '$5,500', funded: '$2,750', released: '$0', status: 'partial', milestones: 2, completedMs: 0, createdAt: 'Mar 20' },
  { id: 'ESC-403', project: 'E-Commerce Migration', client: 'CloudScale', clientAvatar: 'CS', provider: 'DevTeam', amount: '$8,000', funded: '$8,000', released: '$4,000', status: 'disputed', milestones: 3, completedMs: 1, createdAt: 'Feb 15' },
  { id: 'ESC-404', project: 'SEO Campaign', client: 'GrowthEngine', clientAvatar: 'GE', provider: 'MarketPro', amount: '$3,200', funded: '$3,200', released: '$3,200', status: 'released', milestones: 2, completedMs: 2, createdAt: 'Jan 10' },
  { id: 'ESC-405', project: 'App MVP', client: 'AppWorks', clientAvatar: 'AW', provider: 'Alex K.', amount: '$6,000', funded: '$6,000', released: '$2,000', status: 'releasing', milestones: 3, completedMs: 1, createdAt: 'Mar 5' },
];

const HOLD_RECORDS: HoldRecord[] = [
  { id: 'HLD-201', type: 'verification', amount: '$4,800', entity: 'Alex K.', entityAvatar: 'AK', reason: 'Identity verification incomplete — govt ID required before payout release.', since: '9d ago', severity: 'high', linkedPayout: 'PO-1005' },
  { id: 'HLD-202', type: 'dispute', amount: '$8,000', entity: 'CloudScale', entityAvatar: 'CS', reason: 'Active dispute on ESC-403 — funds held pending resolution.', since: '14d ago', reviewer: 'Trust Team', severity: 'critical' },
  { id: 'HLD-203', type: 'policy', amount: '$1,500', entity: 'NewVendor', entityAvatar: 'NV', reason: 'First-time payout — 7-day policy hold for new accounts.', since: '3d ago', severity: 'low' },
  { id: 'HLD-204', type: 'fraud-review', amount: '$3,200', entity: 'QuickShop', entityAvatar: 'QS', reason: 'Flagged by automated fraud detection — unusual transaction pattern.', since: '2d ago', reviewer: 'Risk Team', severity: 'high' },
  { id: 'HLD-205', type: 'compliance', amount: '$10,000', entity: 'GlobalTrade', entityAvatar: 'GT', reason: 'KYC/AML check pending — large transaction threshold exceeded.', since: '5d ago', severity: 'medium' },
];

const REFUND_RECORDS: RefundRecord[] = [
  { id: 'REF-301', originalTx: 'INV-2025-010', amount: '$2,500', requester: 'CloudScale', requesterAvatar: 'CS', reason: 'Milestone M2 not delivered — partial refund requested.', status: 'pending', requestedAt: 'Apr 8' },
  { id: 'REF-302', originalTx: 'ORD-8891', amount: '$750', requester: 'Nexus Ltd', requesterAvatar: 'NL', reason: 'Duplicate charge — confirmed by billing team.', status: 'approved', requestedAt: 'Apr 5', processedAt: 'Apr 6' },
  { id: 'REF-303', originalTx: 'INV-2025-007', amount: '$750', requester: 'Nexus Ltd', requesterAvatar: 'NL', reason: 'Service not rendered.', status: 'completed', requestedAt: 'Mar 18', processedAt: 'Mar 20' },
  { id: 'REF-304', originalTx: 'ORD-8872', amount: '$320', requester: 'DataFlow', requesterAvatar: 'DF', reason: 'Quality dispute — below agreed standard.', status: 'denied', requestedAt: 'Mar 25', processedAt: 'Mar 28' },
  { id: 'REF-305', originalTx: 'ESC-403', amount: '$4,000', requester: 'CloudScale', requesterAvatar: 'CS', reason: 'Escrow dispute escalated — awaiting arbitration.', status: 'processing', requestedAt: 'Apr 2' },
];

const RISK_NOTES: RiskNote[] = [
  { id: 'RN-01', entity: 'QuickShop', entityAvatar: 'QS', severity: 'critical', note: 'Multiple chargebacks in 30 days. Account flagged for enhanced monitoring. Recommend payout suspension until resolved.', author: 'Risk Team', createdAt: 'Apr 9', linkedHold: 'HLD-204' },
  { id: 'RN-02', entity: 'CloudScale', entityAvatar: 'CS', severity: 'warning', note: 'Active dispute on ESC-403. Client has disputed 2 of 5 projects historically. Watch pattern.', author: 'Trust Team', createdAt: 'Apr 5', linkedHold: 'HLD-202' },
  { id: 'RN-03', entity: 'GlobalTrade', entityAvatar: 'GT', severity: 'warning', note: 'Large transaction pattern — first $10K+ transaction. Standard KYC/AML review triggered.', author: 'Compliance', createdAt: 'Apr 4', linkedHold: 'HLD-205' },
  { id: 'RN-04', entity: 'Alex K.', entityAvatar: 'AK', severity: 'info', note: 'Identity verification docs submitted Apr 10. Pending manual review. Expected clearance within 48h.', author: 'Ops', createdAt: 'Apr 10' },
];

const METHODS: PayoutMethod[] = [
  { id: 'pm-1', type: 'bank', label: 'Chase Checking', detail: '****4821', isDefault: true, verified: true, lastUsed: 'Apr 7' },
  { id: 'pm-2', type: 'paypal', label: 'PayPal', detail: 'alex@email.com', isDefault: false, verified: true, lastUsed: 'Mar 30' },
  { id: 'pm-3', type: 'wise', label: 'Wise USD', detail: '****7733', isDefault: false, verified: false },
  { id: 'pm-4', type: 'bank', label: 'Bank of America', detail: '****9102', isDefault: false, verified: false },
];

const HISTORY_EVENTS = [
  { id: 'ev1', action: 'Payout PO-1001 deposited — $3,465 net', actor: 'System', time: 'Apr 7, 2:14 PM', type: 'payout', status: 'completed' },
  { id: 'ev2', action: 'Payout PO-1005 placed on hold — verification required', actor: 'Trust Team', time: 'Apr 1, 9:30 AM', type: 'hold', status: 'active' },
  { id: 'ev3', action: 'Escrow ESC-403 disputed by CloudScale', actor: 'CloudScale', time: 'Mar 28, 4:15 PM', type: 'dispute', status: 'active' },
  { id: 'ev4', action: 'Refund REF-303 completed — $750 to Nexus Ltd', actor: 'System', time: 'Mar 20, 11:00 AM', type: 'refund', status: 'completed' },
  { id: 'ev5', action: 'Payout PO-1004 failed — invalid bank details', actor: 'System', time: 'Apr 3, 6:00 AM', type: 'failure', status: 'failed' },
  { id: 'ev6', action: 'Escrow ESC-401 milestone M3 released — $2,000', actor: 'TechCorp', time: 'Apr 2, 3:00 PM', type: 'release', status: 'completed' },
  { id: 'ev7', action: 'Risk note added for QuickShop — multiple chargebacks', actor: 'Risk Team', time: 'Apr 9, 10:22 AM', type: 'risk', status: 'active' },
  { id: 'ev8', action: 'Payout method Wise ****7733 added — pending verification', actor: 'Alex K.', time: 'Mar 15, 2:00 PM', type: 'config', status: 'pending' },
];

const ACTIVITY = [
  { actor: 'System', action: 'Payout PO-1001 deposited — $3,465 net', time: '3d ago', type: 'payout' },
  { actor: 'Alex K.', action: 'Requested payout PO-1003 — $750 via PayPal', time: '12h ago', type: 'request' },
  { actor: 'System', action: 'Payout PO-1004 failed — invalid bank details', time: '7d ago', type: 'alert' },
  { actor: 'Trust Team', action: 'Payout PO-1005 placed on hold — verification required', time: '9d ago', type: 'hold' },
  { actor: 'Risk Team', action: 'Risk note for QuickShop — chargebacks flagged', time: '1d ago', type: 'risk' },
];

const PO_MAP: Record<PayoutStatus, 'healthy' | 'pending' | 'blocked' | 'caution' | 'degraded' | 'review'> = {
  paid: 'healthy', processing: 'pending', requested: 'review', failed: 'blocked', on_hold: 'caution', canceled: 'degraded',
};
const ESC_MAP: Record<EscrowStatus, 'healthy' | 'pending' | 'live' | 'blocked' | 'caution' | 'degraded'> = {
  funded: 'healthy', partial: 'caution', releasing: 'live', disputed: 'blocked', released: 'degraded', refunded: 'degraded',
};
const REF_MAP: Record<RefundStatus, 'healthy' | 'pending' | 'live' | 'blocked' | 'degraded'> = {
  approved: 'healthy', pending: 'pending', processing: 'live', completed: 'degraded', denied: 'blocked',
};
const HOLD_SEV: Record<string, 'healthy' | 'caution' | 'blocked' | 'review'> = {
  low: 'healthy', medium: 'caution', high: 'blocked', critical: 'blocked',
};
const RISK_SEV: Record<string, 'healthy' | 'caution' | 'blocked'> = {
  info: 'healthy', warning: 'caution', critical: 'blocked',
};
const METHOD_ICON: Record<MethodType, typeof Landmark> = { bank: Landmark, paypal: Wallet, wise: ArrowUpRight, stripe: CreditCard };

// ── Payout Detail Drawer ──
const PayoutDrawer: React.FC<{ payout: Payout | null; open: boolean; onClose: () => void }> = ({ payout, open, onClose }) => {
  if (!payout) return null;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[440px] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Banknote className="h-4 w-4 text-accent" />{payout.id}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="text-center py-3">
            <div className="text-2xl font-bold">{payout.amount}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{payout.destination}</div>
            <StatusBadge status={PO_MAP[payout.status]} label={payout.status.replace('_', ' ')} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Net', value: payout.net }, { label: 'Fee', value: payout.fee },
              { label: 'Method', value: payout.method.toUpperCase() }, { label: 'Requested', value: payout.requestedAt },
              ...(payout.paidAt ? [{ label: 'Paid', value: payout.paidAt }] : []),
              ...(payout.batchId ? [{ label: 'Batch', value: payout.batchId }] : []),
            ].map(m => (
              <div key={m.label} className="rounded-xl border p-2">
                <div className="text-[7px] text-muted-foreground mb-0.5">{m.label}</div>
                <div className="text-[9px] font-medium">{m.value}</div>
              </div>
            ))}
          </div>
          {payout.status === 'failed' && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-center gap-1.5 text-destructive text-[10px] font-semibold mb-1"><XCircle className="h-3 w-3" />Failed</div>
              <p className="text-[8px] text-muted-foreground">{payout.note}</p>
              <div className="flex gap-1.5 mt-2">
                <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.success('Retrying')}><RefreshCw className="h-2.5 w-2.5" />Retry</Button>
                <Button variant="outline" size="sm" className="h-6 text-[9px] rounded-xl">Update Method</Button>
              </div>
            </div>
          )}
          {payout.status === 'on_hold' && (
            <div className="rounded-xl border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 p-3">
              <div className="flex items-center gap-1.5 text-[hsl(var(--gigvora-amber))] text-[10px] font-semibold mb-1"><Lock className="h-3 w-3" />On Hold</div>
              <p className="text-[8px] text-muted-foreground">{payout.holdReason}</p>
              <div className="flex gap-1.5 mt-2">
                <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Shield className="h-2.5 w-2.5" />Verify</Button>
                <Button variant="outline" size="sm" className="h-6 text-[9px] rounded-xl">Support</Button>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Downloading')}><Download className="h-2.5 w-2.5" />Receipt</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Eye className="h-2.5 w-2.5" />Audit</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Copied')}><Copy className="h-2.5 w-2.5" />Copy ID</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Main Page ──
const PayoutsPage: React.FC = () => {
  const { activeRole } = useRole();
  const [tab, setTab] = useState<PTab>('payouts');
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowRecord | null>(null);
  const [selectedHold, setSelectedHold] = useState<HoldRecord | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [addMethodOpen, setAddMethodOpen] = useState(false);
  const [releaseStep, setReleaseStep] = useState(0);
  const [refundDrawerOpen, setRefundDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPayouts = PAYOUTS.filter(p => {
    const ms = !search || p.id.toLowerCase().includes(search.toLowerCase()) || p.destination.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === 'all' || p.status === statusFilter;
    return ms && mst;
  });

  const topStrip = (
    <>
      <Banknote className="h-3.5 w-3.5 text-accent" />
      <span className="text-[11px] font-semibold">Payouts · Escrow · Finance Ops · Holds</span>
      <Badge variant="secondary" className="text-[7px] capitalize">{activeRole}</Badge>
      <div className="flex-1" />
      <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setRequestOpen(true)}><Send className="h-3 w-3" />Request Payout</Button>
      <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Exporting')}><Download className="h-3 w-3" />Export</Button>
      <Link to="/finance"><Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Landmark className="h-3 w-3" />Finance Hub</Button></Link>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Available Balance" icon={<Wallet className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />} className="!rounded-2xl">
        <div className="text-lg font-bold">$6,250.00</div>
        <div className="text-[8px] text-muted-foreground">Ready to withdraw</div>
        <Button size="sm" className="h-6 text-[9px] w-full mt-2 gap-1 rounded-xl" onClick={() => setRequestOpen(true)}><Send className="h-2.5 w-2.5" />Withdraw</Button>
      </SectionCard>

      <SectionCard title="Escrow Summary" icon={<Scale className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1">
          <div className="flex justify-between text-[8px]"><span className="text-muted-foreground">Total in Escrow</span><span className="font-semibold">$34,700</span></div>
          <div className="flex justify-between text-[8px]"><span className="text-muted-foreground">Released</span><span className="font-semibold text-[hsl(var(--state-healthy))]">$17,200</span></div>
          <div className="flex justify-between text-[8px]"><span className="text-muted-foreground">Held / Disputed</span><span className="font-semibold text-destructive">$8,000</span></div>
        </div>
      </SectionCard>

      <SectionCard title="Payout Methods" icon={<CreditCard className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1">
          {METHODS.map(m => {
            const Icon = METHOD_ICON[m.type];
            return (
              <div key={m.id} className="flex items-center gap-1.5 p-1.5 rounded-xl border text-[8px]">
                <Icon className="h-3 w-3 text-muted-foreground" />
                <div className="flex-1 min-w-0"><div className="font-medium truncate">{m.label}</div><div className="text-[7px] text-muted-foreground">{m.detail}</div></div>
                <div className="flex flex-col items-end gap-0.5">
                  {m.isDefault && <Badge variant="secondary" className="text-[5px]">Default</Badge>}
                  {!m.verified && <Badge variant="outline" className="text-[5px] text-destructive border-destructive/30">Unverified</Badge>}
                </div>
              </div>
            );
          })}
        </div>
        <Button variant="outline" size="sm" className="h-5 text-[7px] w-full mt-1.5 gap-0.5 rounded-lg" onClick={() => setAddMethodOpen(true)}><Plus className="h-2 w-2" />Add Method</Button>
      </SectionCard>

      {HOLD_RECORDS.some(h => h.severity === 'critical') && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-2">
          <div className="flex items-center gap-1 text-destructive text-[8px] font-semibold"><ShieldAlert className="h-2.5 w-2.5" />Critical Holds</div>
          <p className="text-[7px] text-muted-foreground mt-0.5">{HOLD_RECORDS.filter(h => h.severity === 'critical').length} critical hold(s)</p>
          <Button variant="outline" size="sm" className="h-4 text-[6px] mt-1.5 rounded-lg" onClick={() => setTab('holds')}>Review</Button>
        </div>
      )}

      <SectionCard title="Quick Links" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { label: 'Wallet', icon: DollarSign, to: '/finance/wallet' },
            { label: 'Billing', icon: FileText, to: '/finance/billing' },
            { label: 'Invoices', icon: FileText, to: '/finance/invoices' },
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
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Finance Activity</div>
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
          { key: 'payouts' as const, label: 'Payout Queue', icon: Send },
          { key: 'escrow' as const, label: 'Escrow Ledger', icon: Scale },
          { key: 'holds' as const, label: 'Hold Review', icon: Lock },
          { key: 'release' as const, label: 'Release Flow', icon: Unlock },
          { key: 'refunds' as const, label: 'Refund Flow', icon: RefreshCw },
          { key: 'history' as const, label: 'Status History', icon: History },
          { key: 'risk' as const, label: 'Risk Notes', icon: ShieldAlert },
          { key: 'mobile' as const, label: 'Mobile Summary', icon: Smartphone },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] transition-colors whitespace-nowrap shrink-0', tab === t.key ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30')}><t.icon className="h-3 w-3" />{t.label}</button>
        ))}
      </div>

      {/* ═══ PAYOUT QUEUE ═══ */}
      {tab === 'payouts' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Available" value="$6,250" change="Ready" trend="up" />
            <KPICard label="Processing" value="$1,200" change="1 payout" />
            <KPICard label="Total Paid" value="$4,659" change="YTD" trend="up" />
            <KPICard label="On Hold" value="$4,800" change="1 payout" trend="down" />
          </KPIBand>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[160px] max-w-xs"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search payouts..." className="w-full h-7 rounded-xl border bg-background pl-7 pr-2 text-[9px]" /></div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px]"><option value="all">All status</option><option value="paid">Paid</option><option value="processing">Processing</option><option value="requested">Requested</option><option value="failed">Failed</option><option value="on_hold">On Hold</option></select>
            {(search || statusFilter !== 'all') && <Button variant="ghost" size="sm" className="h-7 text-[8px] gap-1 rounded-xl" onClick={() => { setSearch(''); setStatusFilter('all'); }}><X className="h-3 w-3" />Clear</Button>}
          </div>

          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30"><tr className="text-[9px] text-muted-foreground font-medium"><th className="text-left px-3 py-2">ID</th><th className="text-left px-3 py-2">Destination</th><th className="text-center px-3 py-2">Status</th><th className="text-right px-3 py-2">Amount</th><th className="text-right px-3 py-2">Net</th><th className="text-left px-3 py-2">Date</th><th className="w-8"></th></tr></thead>
              <tbody>
                {filteredPayouts.map(p => (
                  <tr key={p.id} onClick={() => setSelectedPayout(p)} className={cn('border-t hover:bg-muted/20 transition-colors cursor-pointer text-[9px]', selectedPayout?.id === p.id && 'bg-accent/5')}>
                    <td className="px-3 py-2 font-mono font-medium">{p.id}</td>
                    <td className="px-3 py-2">{p.destination}</td>
                    <td className="px-3 py-2 text-center"><StatusBadge status={PO_MAP[p.status]} label={p.status.replace('_', ' ')} /></td>
                    <td className="px-3 py-2 text-right font-semibold">{p.amount}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{p.net}</td>
                    <td className="px-3 py-2 text-muted-foreground">{p.requestedAt}</td>
                    <td className="px-3 py-2"><Button variant="ghost" size="icon" className="h-5 w-5"><MoreHorizontal className="h-2.5 w-2.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ ESCROW LEDGER ═══ */}
      {tab === 'escrow' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Escrow" value="$34,700" />
            <KPICard label="Released" value="$17,200" change="49.6%" trend="up" />
            <KPICard label="Disputed" value="$8,000" change="1 project" trend="down" />
            <KPICard label="Active Projects" value={String(ESCROW_RECORDS.filter(e => !['released', 'refunded'].includes(e.status)).length)} />
          </KPIBand>

          <div className="space-y-2">
            {ESCROW_RECORDS.map(esc => {
              const releasePct = esc.amount !== '$0' ? (parseInt(esc.released.replace(/[$,]/g, '')) / parseInt(esc.amount.replace(/[$,]/g, ''))) * 100 : 0;
              return (
                <div key={esc.id} className={cn('rounded-2xl border bg-card p-4 hover:shadow-sm transition-all cursor-pointer', esc.status === 'disputed' && 'border-destructive/20')} onClick={() => setSelectedEscrow(esc)}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9"><AvatarFallback className="text-[7px]">{esc.clientAvatar}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{esc.project}</span><StatusBadge status={ESC_MAP[esc.status]} label={esc.status} /><Badge variant="secondary" className="text-[6px] font-mono">{esc.id}</Badge></div>
                      <div className="text-[8px] text-muted-foreground mt-0.5">{esc.client} → {esc.provider} · {esc.completedMs}/{esc.milestones} milestones</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-bold">{esc.amount}</div>
                      <div className="text-[7px] text-muted-foreground">Funded: {esc.funded}</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Progress value={releasePct} className={cn('h-1.5', esc.status === 'disputed' && '[&>div]:bg-destructive')} />
                    <div className="flex justify-between text-[7px] text-muted-foreground mt-0.5"><span>Released: {esc.released}</span><span>{Math.round(releasePct)}%</span></div>
                  </div>
                  {esc.status === 'disputed' && (
                    <div className="mt-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2 flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
                      <span className="text-[8px]">Active dispute — funds held pending resolution</span>
                      <Link to="/disputes"><Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg ml-auto shrink-0">View Dispute</Button></Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ HOLD REVIEW ═══ */}
      {tab === 'holds' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Holds" value={String(HOLD_RECORDS.length)} />
            <KPICard label="Total Held" value="$27,500" />
            <KPICard label="Critical" value={String(HOLD_RECORDS.filter(h => h.severity === 'critical').length)} change="Needs action" trend="down" />
            <KPICard label="Avg Age" value="7d" />
          </KPIBand>

          <div className="space-y-2">
            {HOLD_RECORDS.map(h => (
              <div key={h.id} className={cn('rounded-2xl border bg-card p-4 hover:shadow-sm transition-all', h.severity === 'critical' && 'border-destructive/20', h.severity === 'high' && 'border-[hsl(var(--gigvora-amber))]/20')} onClick={() => setSelectedHold(h)}>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9"><AvatarFallback className="text-[7px]">{h.entityAvatar}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{h.entity}</span><StatusBadge status={HOLD_SEV[h.severity]} label={h.severity} /><Badge variant="secondary" className="text-[6px] capitalize">{h.type.replace('-', ' ')}</Badge></div>
                    <p className="text-[8px] text-muted-foreground mt-0.5 line-clamp-2">{h.reason}</p>
                    <div className="text-[7px] text-muted-foreground mt-0.5">Since {h.since}{h.reviewer && ` · Reviewer: ${h.reviewer}`}{h.linkedPayout && ` · ${h.linkedPayout}`}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-bold">{h.amount}</div>
                    <div className="flex gap-1 mt-1">
                      {h.severity !== 'critical' && <Button size="sm" className="h-5 text-[7px] gap-0.5 rounded-lg" onClick={e => { e.stopPropagation(); toast.success('Released'); }}><Unlock className="h-2.5 w-2.5" />Release</Button>}
                      <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e => { e.stopPropagation(); }}><Eye className="h-2.5 w-2.5" /></Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ RELEASE FLOW ═══ */}
      {tab === 'release' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Pending Release" value="$9,500" />
            <KPICard label="Milestones Ready" value="4" change="Across 3 projects" />
            <KPICard label="Released Today" value="$0" />
            <KPICard label="Avg Release Time" value="2.3d" />
          </KPIBand>

          <SectionCard title="Release Queue" icon={<Unlock className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl" action={<Badge variant="secondary" className="text-[6px]">4 pending</Badge>}>
            <div className="space-y-2">
              {ESCROW_RECORDS.filter(e => ['funded', 'releasing', 'partial'].includes(e.status) && e.completedMs > 0).map(esc => (
                <div key={esc.id} className="rounded-xl border p-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6"><AvatarFallback className="text-[5px]">{esc.clientAvatar}</AvatarFallback></Avatar>
                    <div className="flex-1"><div className="text-[9px] font-medium">{esc.project}</div><div className="text-[7px] text-muted-foreground">{esc.id} · {esc.client}</div></div>
                    <div className="text-[10px] font-bold">{esc.amount}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={(esc.completedMs / esc.milestones) * 100} className="h-1 flex-1" />
                    <span className="text-[7px] text-muted-foreground">{esc.completedMs}/{esc.milestones}</span>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <Button size="sm" className="h-6 text-[8px] gap-1 rounded-xl flex-1" onClick={() => { setReleaseStep(1); toast.success(`Releasing next milestone for ${esc.project}`); }}><Unlock className="h-2.5 w-2.5" />Release Next</Button>
                    <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl"><Eye className="h-2.5 w-2.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {releaseStep > 0 && (
            <SectionCard title="Release Confirmation" icon={<CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />} className="!rounded-2xl border-[hsl(var(--state-healthy))]/20">
              <div className="space-y-2">
                <div className="rounded-xl border bg-[hsl(var(--state-healthy))]/5 p-3 text-center">
                  <CheckCircle2 className="h-6 w-6 text-[hsl(var(--state-healthy))] mx-auto mb-1" />
                  <div className="text-[10px] font-semibold">Release Initiated</div>
                  <div className="text-[8px] text-muted-foreground">Funds will be available in 1-2 business days</div>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-6 text-[8px] flex-1 rounded-xl" onClick={() => setReleaseStep(0)}>Done</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[8px] flex-1 rounded-xl"><Download className="h-2.5 w-2.5 mr-1" />Receipt</Button>
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {/* ═══ REFUND FLOW ═══ */}
      {tab === 'refunds' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Pending Refunds" value={String(REFUND_RECORDS.filter(r => ['pending', 'processing'].includes(r.status)).length)} />
            <KPICard label="Total Pending" value="$7,250" />
            <KPICard label="Completed" value={String(REFUND_RECORDS.filter(r => r.status === 'completed').length)} />
            <KPICard label="Denied" value={String(REFUND_RECORDS.filter(r => r.status === 'denied').length)} />
          </KPIBand>

          <div className="flex items-center gap-2 mb-1">
            <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => setRefundDrawerOpen(true)}><Plus className="h-3 w-3" />New Refund Request</Button>
          </div>

          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30"><tr className="text-[9px] text-muted-foreground font-medium"><th className="text-left px-3 py-2">Refund</th><th className="text-left px-3 py-2">Requester</th><th className="text-left px-3 py-2">Original Tx</th><th className="text-center px-3 py-2">Status</th><th className="text-right px-3 py-2">Amount</th><th className="text-left px-3 py-2">Date</th><th className="w-10"></th></tr></thead>
              <tbody>
                {REFUND_RECORDS.map(r => (
                  <tr key={r.id} className="border-t hover:bg-muted/20 transition-colors text-[9px]">
                    <td className="px-3 py-2 font-mono font-medium">{r.id}</td>
                    <td className="px-3 py-2"><div className="flex items-center gap-1.5"><Avatar className="h-5 w-5"><AvatarFallback className="text-[5px]">{r.requesterAvatar}</AvatarFallback></Avatar>{r.requester}</div></td>
                    <td className="px-3 py-2 text-muted-foreground font-mono">{r.originalTx}</td>
                    <td className="px-3 py-2 text-center"><StatusBadge status={REF_MAP[r.status]} label={r.status} /></td>
                    <td className="px-3 py-2 text-right font-semibold">{r.amount}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.requestedAt}</td>
                    <td className="px-3 py-2">
                      {r.status === 'pending' && (
                        <div className="flex gap-0.5">
                          <Button size="sm" className="h-5 text-[7px] rounded-lg" onClick={() => toast.success('Approved')}><CheckCircle2 className="h-2.5 w-2.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg text-destructive" onClick={() => toast.info('Denied')}><XCircle className="h-2.5 w-2.5" /></Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ STATUS HISTORY ═══ */}
      {tab === 'history' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Events" value={String(HISTORY_EVENTS.length)} />
            <KPICard label="Active" value={String(HISTORY_EVENTS.filter(e => e.status === 'active').length)} />
            <KPICard label="Completed" value={String(HISTORY_EVENTS.filter(e => e.status === 'completed').length)} />
            <KPICard label="Failed" value={String(HISTORY_EVENTS.filter(e => e.status === 'failed').length)} />
          </KPIBand>

          <div className="space-y-1">
            {HISTORY_EVENTS.map((ev, i) => (
              <div key={ev.id} className="flex gap-3 items-start py-2.5 border-b last:border-0">
                <div className="flex flex-col items-center mt-0.5">
                  <div className={cn('h-2 w-2 rounded-full', ev.status === 'completed' ? 'bg-[hsl(var(--state-healthy))]' : ev.status === 'failed' ? 'bg-destructive' : 'bg-accent')} />
                  {i < HISTORY_EVENTS.length - 1 && <div className="w-px h-8 bg-border mt-0.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-medium">{ev.action}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[7px] text-muted-foreground">{ev.time}</span>
                    <Badge variant="secondary" className="text-[6px] capitalize">{ev.type}</Badge>
                    <span className="text-[7px] text-muted-foreground">by {ev.actor}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg shrink-0"><Eye className="h-2.5 w-2.5" /></Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ RISK NOTES ═══ */}
      {tab === 'risk' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Notes" value={String(RISK_NOTES.length)} />
            <KPICard label="Critical" value={String(RISK_NOTES.filter(r => r.severity === 'critical').length)} change="Needs attention" trend="down" />
            <KPICard label="Warning" value={String(RISK_NOTES.filter(r => r.severity === 'warning').length)} />
            <KPICard label="Info" value={String(RISK_NOTES.filter(r => r.severity === 'info').length)} />
          </KPIBand>

          <div className="space-y-2">
            {RISK_NOTES.map(rn => (
              <div key={rn.id} className={cn('rounded-2xl border bg-card p-4 hover:shadow-sm transition-all', rn.severity === 'critical' && 'border-destructive/20', rn.severity === 'warning' && 'border-[hsl(var(--gigvora-amber))]/20')}>
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-8 w-8"><AvatarFallback className="text-[6px]">{rn.entityAvatar}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{rn.entity}</span><StatusBadge status={RISK_SEV[rn.severity]} label={rn.severity} />{rn.linkedHold && <Badge variant="secondary" className="text-[6px] font-mono">{rn.linkedHold}</Badge>}</div>
                    <div className="text-[7px] text-muted-foreground">{rn.author} · {rn.createdAt}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="h-5 text-[7px] gap-0.5 rounded-lg"><Flag className="h-2.5 w-2.5" />Escalate</Button>
                    <Button variant="outline" size="sm" className="h-5 text-[7px] gap-0.5 rounded-lg"><MessageSquare className="h-2.5 w-2.5" />Note</Button>
                  </div>
                </div>
                <p className="text-[8px] text-muted-foreground leading-relaxed">{rn.note}</p>
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Add risk note')}><Plus className="h-3 w-3" />Add Risk Note</Button>
        </div>
      )}

      {/* ═══ MOBILE SUMMARY ═══ */}
      {tab === 'mobile' && (
        <div className="space-y-3 max-w-sm mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-accent to-[hsl(var(--gigvora-purple))] text-white p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
            <div className="text-[9px] opacity-80 mb-1">Finance Overview</div>
            <div className="text-2xl font-bold">$6,250</div>
            <div className="text-[10px] opacity-70">Available Balance</div>
            <div className="flex items-center gap-4 mt-4">
              <div><div className="text-lg font-bold">$34.7K</div><div className="text-[8px] opacity-70">In Escrow</div></div>
              <div className="w-px h-8 bg-white/20" />
              <div><div className="text-lg font-bold">$27.5K</div><div className="text-[8px] opacity-70">On Hold</div></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-12 text-[10px] gap-1.5 rounded-2xl flex-col" onClick={() => setTab('payouts')}><Send className="h-4 w-4 text-accent" />Payouts</Button>
            <Button variant="outline" className="h-12 text-[10px] gap-1.5 rounded-2xl flex-col" onClick={() => setTab('escrow')}><Scale className="h-4 w-4 text-accent" />Escrow</Button>
            <Button variant="outline" className="h-12 text-[10px] gap-1.5 rounded-2xl flex-col" onClick={() => setTab('holds')}><Lock className="h-4 w-4 text-accent" />Holds</Button>
            <Button variant="outline" className="h-12 text-[10px] gap-1.5 rounded-2xl flex-col" onClick={() => setTab('refunds')}><RefreshCw className="h-4 w-4 text-accent" />Refunds</Button>
          </div>

          <SectionCard title="Recent Payouts" icon={<Send className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            {PAYOUTS.slice(0, 4).map(p => (
              <div key={p.id} className="flex items-center gap-2 py-2 border-b last:border-0 cursor-pointer" onClick={() => setSelectedPayout(p)}>
                <div className="flex-1 min-w-0"><div className="text-[9px] font-medium truncate">{p.destination}</div><div className="text-[7px] text-muted-foreground">{p.id} · {p.requestedAt}</div></div>
                <div className="text-right shrink-0"><div className="text-[9px] font-semibold">{p.amount}</div><StatusBadge status={PO_MAP[p.status]} label={p.status.replace('_', ' ')} /></div>
              </div>
            ))}
          </SectionCard>

          {HOLD_RECORDS.filter(h => h.severity === 'critical' || h.severity === 'high').length > 0 && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3">
              <div className="flex items-center gap-1.5 text-destructive text-[9px] font-semibold mb-1"><ShieldAlert className="h-3 w-3" />Urgent Holds</div>
              {HOLD_RECORDS.filter(h => h.severity === 'critical' || h.severity === 'high').map(h => (
                <div key={h.id} className="flex items-center gap-2 py-1.5 border-t border-destructive/10 first:border-0">
                  <div className="flex-1"><div className="text-[8px] font-medium">{h.entity}</div><div className="text-[7px] text-muted-foreground">{h.amount}</div></div>
                  <StatusBadge status={HOLD_SEV[h.severity]} label={h.severity} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        <div className="flex-1"><span className="text-[10px] font-semibold">$6,250</span><div className="text-[8px] text-muted-foreground">Available</div></div>
        <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-4" onClick={() => setRequestOpen(true)}><Send className="h-3.5 w-3.5" />Request Payout</Button>
      </div>

      {/* Drawers */}
      <PayoutDrawer payout={selectedPayout} open={!!selectedPayout} onClose={() => setSelectedPayout(null)} />

      {/* Escrow Detail Drawer */}
      <Sheet open={!!selectedEscrow} onOpenChange={() => setSelectedEscrow(null)}>
        <SheetContent className="w-[440px] overflow-y-auto">
          {selectedEscrow && (
            <>
              <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Scale className="h-4 w-4 text-accent" />{selectedEscrow.id}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="text-center py-3">
                  <div className="text-2xl font-bold">{selectedEscrow.amount}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{selectedEscrow.project}</div>
                  <StatusBadge status={ESC_MAP[selectedEscrow.status]} label={selectedEscrow.status} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[{ label: 'Client', value: selectedEscrow.client }, { label: 'Provider', value: selectedEscrow.provider }, { label: 'Funded', value: selectedEscrow.funded }, { label: 'Released', value: selectedEscrow.released }, { label: 'Milestones', value: `${selectedEscrow.completedMs}/${selectedEscrow.milestones}` }, { label: 'Created', value: selectedEscrow.createdAt }].map(m => (
                    <div key={m.label} className="rounded-xl border p-2"><div className="text-[7px] text-muted-foreground mb-0.5">{m.label}</div><div className="text-[9px] font-medium">{m.value}</div></div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 border-t pt-3">
                  {selectedEscrow.status !== 'released' && <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.success('Release initiated')}><Unlock className="h-2.5 w-2.5" />Release Next</Button>}
                  <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Eye className="h-2.5 w-2.5" />View Project</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Download className="h-2.5 w-2.5" />Receipt</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Hold Detail Drawer */}
      <Sheet open={!!selectedHold} onOpenChange={() => setSelectedHold(null)}>
        <SheetContent className="w-[440px] overflow-y-auto">
          {selectedHold && (
            <>
              <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Lock className="h-4 w-4 text-[hsl(var(--gigvora-amber))]" />{selectedHold.id}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="text-center py-3">
                  <div className="text-2xl font-bold">{selectedHold.amount}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{selectedHold.entity}</div>
                  <StatusBadge status={HOLD_SEV[selectedHold.severity]} label={selectedHold.severity} className="mt-1" />
                </div>
                <div className="rounded-xl border p-3"><p className="text-[9px]">{selectedHold.reason}</p></div>
                <div className="grid grid-cols-2 gap-2">
                  {[{ label: 'Type', value: selectedHold.type.replace('-', ' ') }, { label: 'Since', value: selectedHold.since }, ...(selectedHold.reviewer ? [{ label: 'Reviewer', value: selectedHold.reviewer }] : []), ...(selectedHold.linkedPayout ? [{ label: 'Linked Payout', value: selectedHold.linkedPayout }] : [])].map(m => (
                    <div key={m.label} className="rounded-xl border p-2"><div className="text-[7px] text-muted-foreground mb-0.5">{m.label}</div><div className="text-[9px] font-medium capitalize">{m.value}</div></div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 border-t pt-3">
                  {selectedHold.severity !== 'critical' && <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => { setSelectedHold(null); toast.success('Released'); }}><Unlock className="h-2.5 w-2.5" />Release</Button>}
                  <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Flag className="h-2.5 w-2.5" />Escalate</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><MessageSquare className="h-2.5 w-2.5" />Add Note</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Request Payout Drawer */}
      <Sheet open={requestOpen} onOpenChange={setRequestOpen}>
        <SheetContent className="w-[440px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm">Request Payout</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border bg-muted/30 p-3 text-center"><div className="text-[8px] text-muted-foreground">Available Balance</div><div className="text-xl font-bold">$6,250.00</div></div>
            <div><label className="text-[9px] font-medium mb-1 block">Amount</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="$0.00" /><div className="flex gap-1 mt-1">{['$500', '$1,000', '$2,500', 'Max'].map(v => <Button key={v} variant="outline" size="sm" className="h-5 text-[7px] flex-1 rounded-lg">{v}</Button>)}</div></div>
            <div><label className="text-[9px] font-medium mb-1 block">Payout Method</label><div className="space-y-1">{METHODS.filter(m => m.verified).map(m => { const Icon = METHOD_ICON[m.type]; return (<label key={m.id} className="flex items-center gap-2 rounded-xl border p-2 cursor-pointer hover:bg-muted/30 transition-colors"><input type="radio" name="method" defaultChecked={m.isDefault} className="h-3 w-3" /><Icon className="h-3.5 w-3.5 text-muted-foreground" /><div className="flex-1"><div className="text-[9px] font-medium">{m.label}</div><div className="text-[7px] text-muted-foreground">{m.detail}</div></div>{m.isDefault && <Badge variant="secondary" className="text-[6px]">Default</Badge>}</label>); })}</div></div>
            <div><label className="text-[9px] font-medium mb-1 block">Note (optional)</label><textarea className="w-full h-12 rounded-xl border bg-background px-2 py-1 text-[9px] resize-none" placeholder="Reference..." /></div>
            <div className="rounded-xl border bg-muted/20 p-2 text-[8px] space-y-0.5"><div className="flex justify-between"><span className="text-muted-foreground">Fee (1%)</span><span>-$25.00</span></div><div className="flex justify-between font-semibold border-t pt-0.5"><span>You'll receive</span><span>$2,475.00</span></div></div>
            <div className="flex gap-2 pt-2 border-t"><Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setRequestOpen(false)}>Cancel</Button><Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setRequestOpen(false); toast.success('Payout requested'); }}><Send className="h-3 w-3" />Request</Button></div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Method Drawer */}
      <Sheet open={addMethodOpen} onOpenChange={setAddMethodOpen}>
        <SheetContent className="w-[440px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm">Add Payout Method</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Type</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>Bank Account (ACH)</option><option>PayPal</option><option>Wise</option><option>Stripe Connect</option></select></div>
            <div><label className="text-[9px] font-medium mb-1 block">Label</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="e.g. My Checking" /></div>
            <div className="grid grid-cols-2 gap-2"><div><label className="text-[9px] font-medium mb-1 block">Routing</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="021000021" /></div><div><label className="text-[9px] font-medium mb-1 block">Account</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="****" /></div></div>
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-2 text-[8px] text-muted-foreground flex items-start gap-1.5"><Shield className="h-3 w-3 text-accent mt-0.5 shrink-0" /><span>Encrypted and verified before your first payout.</span></div>
            <div className="flex gap-2 pt-2 border-t"><Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setAddMethodOpen(false)}>Cancel</Button><Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setAddMethodOpen(false); toast.success('Method added'); }}><Plus className="h-3 w-3" />Add</Button></div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Refund Request Drawer */}
      <Sheet open={refundDrawerOpen} onOpenChange={setRefundDrawerOpen}>
        <SheetContent className="w-[440px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm">New Refund Request</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Original Transaction</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="INV-XXXX or ORD-XXXX" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Amount</label><div className="relative"><DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><input type="number" className="w-full h-7 rounded-xl border bg-background pl-6 pr-2 text-[9px]" placeholder="0.00" /></div></div>
            <div><label className="text-[9px] font-medium mb-1 block">Reason</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>Service not rendered</option><option>Duplicate charge</option><option>Quality dispute</option><option>Milestone not delivered</option><option>Other</option></select></div>
            <div><label className="text-[9px] font-medium mb-1 block">Details</label><textarea className="w-full h-16 rounded-xl border bg-background px-2 py-1 text-[9px]" placeholder="Describe the refund reason..." /></div>
            <div className="flex gap-2 pt-2 border-t"><Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setRefundDrawerOpen(false)}>Cancel</Button><Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setRefundDrawerOpen(false); toast.success('Refund request submitted'); }}><Send className="h-3 w-3" />Submit</Button></div>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default PayoutsPage;
