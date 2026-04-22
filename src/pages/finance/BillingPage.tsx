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
  CreditCard, DollarSign, TrendingUp, Plus, Download, Search,
  CheckCircle2, Clock, Receipt, Building2, BarChart3, Eye, RefreshCw, Lock,
  AlertTriangle, AlertCircle, ChevronRight, MoreHorizontal, Shield, Sparkles,
  Users, History, Zap, Star, Package, Crown, Settings, X,
  ArrowRight, Calendar, FileText, ExternalLink, Check, Layers,
  Send, Globe, Calculator, Edit, Trash2, Smartphone, Copy,
  Bell, Percent, ArrowUpRight, ArrowDownRight, Landmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

// ── Types ──
type BTab = 'invoices' | 'subscriptions' | 'tax' | 'methods' | 'admin' | 'downloads' | 'thresholds' | 'mobile';
type InvStatus = 'paid' | 'pending' | 'overdue' | 'draft' | 'void' | 'refunded';
type SubStatus = 'active' | 'trialing' | 'past-due' | 'canceled' | 'paused';

interface Invoice {
  id: string; client: string; avatar: string; amount: string; tax: string; status: InvStatus;
  date: string; due: string; plan?: string; project?: string;
}
interface Subscription {
  id: string; name: string; plan: string; price: string; cycle: string; status: SubStatus;
  nextBill: string; seats?: number; features: string[];
}
interface TaxEntry {
  jurisdiction: string; rate: string; collected: string; remitted: string;
  status: 'current' | 'due' | 'overdue'; period: string;
}
interface PaymentMethod {
  id: string; type: 'card' | 'bank' | 'wallet'; label: string; last4: string;
  expiry?: string; default: boolean; status: 'active' | 'expiring' | 'expired';
}
interface Threshold {
  id: string; metric: string; threshold: number; current: number; unit: string;
  action: string; status: 'ok' | 'warning' | 'critical';
}
interface DownloadRecord {
  id: string; name: string; type: string; date: string; size: string;
}

// ── Mock Data ──
const INVOICES: Invoice[] = [
  { id: 'INV-2025-012', client: 'TechCorp', avatar: 'TC', amount: '$5,250.00', tax: '$250.00', status: 'paid', date: 'Apr 6', due: 'Apr 6', project: 'SaaS Platform' },
  { id: 'INV-2025-011', client: 'DesignHub', avatar: 'DH', amount: '$2,520.00', tax: '$120.00', status: 'pending', date: 'Apr 2', due: 'Apr 16' },
  { id: 'INV-2025-010', client: 'CloudScale', avatar: 'CS', amount: '$8,925.00', tax: '$425.00', status: 'overdue', date: 'Mar 15', due: 'Mar 29', project: 'E-Commerce' },
  { id: 'INV-2025-009', client: 'AppWorks', avatar: 'AW', amount: '$1,260.00', tax: '$60.00', status: 'draft', date: 'Apr 8', due: '' },
  { id: 'INV-2025-008', client: 'GrowthEngine', avatar: 'GE', amount: '$3,937.50', tax: '$187.50', status: 'paid', date: 'Apr 7', due: 'Apr 21', project: 'SEO' },
  { id: 'INV-2025-007', client: 'Nexus Ltd', avatar: 'NL', amount: '$750.00', tax: '$0.00', status: 'refunded', date: 'Mar 20', due: 'Mar 20' },
  { id: 'INV-2025-006', client: 'DataFlow', avatar: 'DF', amount: '$4,200.00', tax: '$200.00', status: 'paid', date: 'Mar 10', due: 'Mar 24', plan: 'Team' },
];

const SUBSCRIPTIONS: Subscription[] = [
  { id: 'sub1', name: 'Gigvora Pro', plan: 'Pro', price: '$29/mo', cycle: 'Monthly', status: 'active', nextBill: 'May 1, 2025', seats: 1, features: ['Unlimited gigs', 'Advanced analytics', 'Priority support', 'API access'] },
  { id: 'sub2', name: 'Recruiter Pro', plan: 'Add-on', price: '$99/mo', cycle: 'Monthly', status: 'active', nextBill: 'May 1, 2025', features: ['Talent search', 'Pipeline tools', 'InMail credits'] },
  { id: 'sub3', name: 'Sales Navigator', plan: 'Add-on', price: '$79/mo', cycle: 'Monthly', status: 'trialing', nextBill: 'Apr 25, 2025', features: ['Lead recommendations', 'Advanced filters', 'CRM sync'] },
];

const TAX_ENTRIES: TaxEntry[] = [
  { jurisdiction: 'United States — Federal', rate: '0%', collected: '$0.00', remitted: '$0.00', status: 'current', period: 'Q1 2025' },
  { jurisdiction: 'California — State', rate: '7.25%', collected: '$1,242.50', remitted: '$1,242.50', status: 'current', period: 'Q1 2025' },
  { jurisdiction: 'EU — VAT', rate: '20%', collected: '$2,100.00', remitted: '$0.00', status: 'due', period: 'Q1 2025' },
  { jurisdiction: 'UK — VAT', rate: '20%', collected: '$840.00', remitted: '$840.00', status: 'current', period: 'Q4 2024' },
  { jurisdiction: 'New York — State', rate: '8%', collected: '$680.00', remitted: '$680.00', status: 'current', period: 'Q1 2025' },
];

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm1', type: 'card', label: 'Visa', last4: '4242', expiry: '08/27', default: true, status: 'active' },
  { id: 'pm2', type: 'card', label: 'Mastercard', last4: '8888', expiry: '03/26', default: false, status: 'expiring' },
  { id: 'pm3', type: 'bank', label: 'Chase Business', last4: '1234', default: false, status: 'active' },
];

const THRESHOLDS: Threshold[] = [
  { id: 'th1', metric: 'Monthly Spend', threshold: 5000, current: 3420, unit: '$', action: 'Email alert', status: 'ok' },
  { id: 'th2', metric: 'API Calls', threshold: 50000, current: 42000, unit: 'calls', action: 'Slack + Email', status: 'warning' },
  { id: 'th3', metric: 'Storage', threshold: 10, current: 9.2, unit: 'GB', action: 'Block uploads', status: 'critical' },
  { id: 'th4', metric: 'Team Seats', threshold: 5, current: 3, unit: 'seats', action: 'Email alert', status: 'ok' },
];

const DOWNLOADS: DownloadRecord[] = [
  { id: 'd1', name: 'Q1 2025 Invoice Bundle', type: 'PDF', date: 'Apr 1', size: '2.3 MB' },
  { id: 'd2', name: 'Tax Summary — 2024', type: 'PDF', date: 'Jan 15', size: '1.1 MB' },
  { id: 'd3', name: 'Transaction Export — Mar', type: 'CSV', date: 'Apr 1', size: '450 KB' },
  { id: 'd4', name: 'Subscription History', type: 'PDF', date: 'Mar 15', size: '320 KB' },
  { id: 'd5', name: 'W-9 Form', type: 'PDF', date: 'Jan 1', size: '89 KB' },
];

const ACTIVITY = [
  { actor: 'System', action: 'Invoice INV-2025-012 paid — $5,250', time: '4d ago', type: 'payment' },
  { actor: 'Alex K.', action: 'Payment method Visa ••4242 verified', time: '1w ago', type: 'update' },
  { actor: 'System', action: 'Pro plan renewed for Apr 2025', time: '10d ago', type: 'renewal' },
  { actor: 'System', action: 'EU VAT remittance due — $2,100', time: '2d ago', type: 'alert' },
  { actor: 'Alex K.', action: 'Spend threshold updated to $5,000', time: '2w ago', type: 'config' },
];

const INV_MAP: Record<InvStatus, 'healthy' | 'pending' | 'blocked' | 'caution' | 'degraded'> = {
  paid: 'healthy', pending: 'pending', overdue: 'blocked', draft: 'degraded', void: 'degraded', refunded: 'caution',
};
const SUB_MAP: Record<SubStatus, 'healthy' | 'live' | 'caution' | 'blocked' | 'degraded'> = {
  active: 'healthy', trialing: 'live', 'past-due': 'caution', canceled: 'blocked', paused: 'degraded',
};
const TAX_MAP: Record<string, 'healthy' | 'pending' | 'blocked'> = { current: 'healthy', due: 'pending', overdue: 'blocked' };
const TH_MAP: Record<string, 'healthy' | 'caution' | 'blocked'> = { ok: 'healthy', warning: 'caution', critical: 'blocked' };
const PM_MAP: Record<string, 'healthy' | 'caution' | 'blocked'> = { active: 'healthy', expiring: 'caution', expired: 'blocked' };

// ── Sub-components ──
const InvDrawer: React.FC<{ inv: Invoice | null; open: boolean; onClose: () => void }> = ({ inv, open, onClose }) => {
  if (!inv) return null;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[440px] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Receipt className="h-4 w-4 text-accent" />{inv.id}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="text-center py-3">
            <div className="text-2xl font-bold">{inv.amount}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{inv.client}{inv.project && ` · ${inv.project}`}</div>
            <StatusBadge status={INV_MAP[inv.status]} label={inv.status} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Client', value: inv.client },
              { label: 'Date', value: inv.date },
              { label: 'Due', value: inv.due || '—' },
              { label: 'Tax', value: inv.tax },
            ].map(m => (
              <div key={m.label} className="rounded-xl border p-2">
                <div className="text-[7px] text-muted-foreground mb-0.5">{m.label}</div>
                <div className="text-[9px] font-medium">{m.value}</div>
              </div>
            ))}
          </div>
          {inv.status === 'overdue' && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-center gap-1.5 text-destructive text-[10px] font-semibold mb-1"><AlertCircle className="h-3 w-3" />Overdue</div>
              <p className="text-[8px] text-muted-foreground">This invoice is past due. Send a reminder or escalate.</p>
              <div className="flex gap-1.5 mt-2">
                <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.success('Reminder sent')}><Send className="h-2.5 w-2.5" />Remind</Button>
                <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl">Escalate</Button>
              </div>
            </div>
          )}
          {inv.status === 'draft' && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
              <div className="flex items-center gap-1.5 text-accent text-[10px] font-semibold mb-1"><Edit className="h-3 w-3" />Draft</div>
              <p className="text-[8px] text-muted-foreground">Finalize and send to client.</p>
              <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl mt-2" onClick={() => toast.success('Invoice sent')}><Send className="h-2.5 w-2.5" />Send</Button>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Downloading')}><Download className="h-2.5 w-2.5" />PDF</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Copied')}><Copy className="h-2.5 w-2.5" />Copy ID</Button>
            <Link to="/finance/invoices"><Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><ExternalLink className="h-2.5 w-2.5" />Full View</Button></Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Main Page ──
const BillingPage: React.FC = () => {
  const { activeRole } = useRole();
  const [tab, setTab] = useState<BTab>('invoices');
  const [selectedInv, setSelectedInv] = useState<Invoice | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addMethodOpen, setAddMethodOpen] = useState(false);
  const [editThresholdOpen, setEditThresholdOpen] = useState(false);
  const [createInvOpen, setCreateInvOpen] = useState(false);

  const filteredInv = INVOICES.filter(i => {
    const s = !search || i.client.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase());
    const st = statusFilter === 'all' || i.status === statusFilter;
    return s && st;
  });

  const totalBilled = '$26,842.50';
  const totalPaid = '$13,387.50';
  const outstanding = '$11,445.00';
  const overdue = '$8,925.00';

  const topStrip = (
    <>
      <Receipt className="h-3.5 w-3.5 text-accent" />
      <span className="text-[11px] font-semibold">Billing · Invoices · Tax · Subscriptions</span>
      <Badge variant="secondary" className="text-[7px] capitalize">{activeRole}</Badge>
      <div className="flex-1" />
      <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setCreateInvOpen(true)}><Plus className="h-3 w-3" />New Invoice</Button>
      <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Exporting')}><Download className="h-3 w-3" />Export</Button>
      <Link to="/finance"><Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Landmark className="h-3 w-3" />Finance Hub</Button></Link>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Billing Summary" icon={<DollarSign className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          <div className="flex justify-between text-[8px]"><span className="text-muted-foreground">Total Billed</span><span className="font-semibold">{totalBilled}</span></div>
          <div className="flex justify-between text-[8px]"><span className="text-muted-foreground">Paid</span><span className="font-semibold text-[hsl(var(--state-healthy))]">{totalPaid}</span></div>
          <div className="flex justify-between text-[8px]"><span className="text-muted-foreground">Outstanding</span><span className="font-semibold">{outstanding}</span></div>
          <div className="flex justify-between text-[8px]"><span className="text-muted-foreground">Overdue</span><span className="font-semibold text-destructive">{overdue}</span></div>
        </div>
      </SectionCard>

      <SectionCard title="Active Plan" icon={<Crown className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="text-[11px] font-bold">Pro Plan</div>
        <div className="text-[8px] text-muted-foreground">$29/mo · Next bill May 1</div>
        <Progress value={60} className="h-1 mt-2" />
        <div className="text-[7px] text-muted-foreground mt-0.5">12 of 20 projects used</div>
        <div className="flex gap-1 mt-2">
          <Button variant="outline" size="sm" className="h-5 text-[7px] flex-1 rounded-lg">Change Plan</Button>
          <Button variant="outline" size="sm" className="h-5 text-[7px] flex-1 rounded-lg">Add Seats</Button>
        </div>
      </SectionCard>

      <SectionCard title="Payment Method" icon={<CreditCard className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="h-7 w-10 rounded-lg border flex items-center justify-center bg-muted/30"><CreditCard className="h-3.5 w-3.5" /></div>
          <div><div className="text-[9px] font-medium">Visa ••4242</div><div className="text-[7px] text-muted-foreground">Exp 08/27</div></div>
          <Badge variant="secondary" className="text-[6px] ml-auto">Default</Badge>
        </div>
        <Button variant="outline" size="sm" className="w-full h-5 text-[7px] mt-2 gap-0.5 rounded-lg" onClick={() => setTab('methods')}><Settings className="h-2 w-2" />Manage</Button>
      </SectionCard>

      {INVOICES.some(i => i.status === 'overdue') && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-2">
          <div className="flex items-center gap-1 text-destructive text-[8px] font-semibold"><AlertCircle className="h-2.5 w-2.5" />Overdue Invoice</div>
          <p className="text-[7px] text-muted-foreground mt-0.5">1 invoice needs attention</p>
          <Button variant="outline" size="sm" className="h-4 text-[6px] mt-1.5 rounded-lg" onClick={() => { setTab('invoices'); setStatusFilter('overdue'); }}>View</Button>
        </div>
      )}

      {TAX_ENTRIES.some(t => t.status === 'due') && (
        <div className="rounded-xl border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 p-2">
          <div className="flex items-center gap-1 text-[hsl(var(--gigvora-amber))] text-[8px] font-semibold"><Globe className="h-2.5 w-2.5" />Tax Remittance Due</div>
          <p className="text-[7px] text-muted-foreground mt-0.5">EU VAT — $2,100</p>
          <Button variant="outline" size="sm" className="h-4 text-[6px] mt-1.5 rounded-lg" onClick={() => setTab('tax')}>Review</Button>
        </div>
      )}

      <SectionCard title="Quick Links" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { label: 'Wallet', icon: DollarSign, to: '/finance/wallet' },
            { label: 'Payouts', icon: Send, to: '/finance/payouts' },
            { label: 'Invoices', icon: Receipt, to: '/finance/invoices' },
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
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Billing Activity</div>
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
          { key: 'invoices' as const, label: 'Invoices', icon: Receipt },
          { key: 'subscriptions' as const, label: 'Subscriptions', icon: Layers },
          { key: 'tax' as const, label: 'Tax / VAT', icon: Globe },
          { key: 'methods' as const, label: 'Payment Methods', icon: CreditCard },
          { key: 'admin' as const, label: 'Billing Admin', icon: Settings },
          { key: 'downloads' as const, label: 'Downloads', icon: Download },
          { key: 'thresholds' as const, label: 'Thresholds', icon: Bell },
          { key: 'mobile' as const, label: 'Mobile Stack', icon: Smartphone },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] transition-colors whitespace-nowrap shrink-0', tab === t.key ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30')}><t.icon className="h-3 w-3" />{t.label}</button>
        ))}
      </div>

      {/* ═══ INVOICES ═══ */}
      {tab === 'invoices' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Billed" value={totalBilled} change="+18% vs prior" trend="up" />
            <KPICard label="Paid" value={totalPaid} change="50% collected" />
            <KPICard label="Outstanding" value={outstanding} />
            <KPICard label="Overdue" value={overdue} change="1 invoice" trend="down" />
          </KPIBand>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[160px] max-w-xs"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..." className="w-full h-7 rounded-xl border bg-background pl-7 pr-2 text-[9px]" /></div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px]"><option value="all">All status</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="overdue">Overdue</option><option value="draft">Draft</option><option value="refunded">Refunded</option></select>
            {(search || statusFilter !== 'all') && <Button variant="ghost" size="sm" className="h-7 text-[8px] gap-1 rounded-xl" onClick={() => { setSearch(''); setStatusFilter('all'); }}><X className="h-3 w-3" />Clear</Button>}
            <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl ml-auto" onClick={() => toast.info('Exporting')}><Download className="h-3 w-3" />Export CSV</Button>
          </div>

          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30"><tr className="text-[9px] text-muted-foreground font-medium"><th className="text-left px-3 py-2">Invoice</th><th className="text-left px-3 py-2">Client</th><th className="text-center px-3 py-2">Status</th><th className="text-right px-3 py-2">Amount</th><th className="text-right px-3 py-2">Tax</th><th className="text-left px-3 py-2">Due</th><th className="text-left px-3 py-2 w-10"></th></tr></thead>
              <tbody>
                {filteredInv.map(inv => (
                  <tr key={inv.id} onClick={() => setSelectedInv(inv)} className={cn('border-t hover:bg-muted/20 transition-colors cursor-pointer text-[9px]', selectedInv?.id === inv.id && 'bg-accent/5')}>
                    <td className="px-3 py-2 font-medium font-mono">{inv.id}</td>
                    <td className="px-3 py-2"><div className="flex items-center gap-1.5"><Avatar className="h-5 w-5"><AvatarFallback className="text-[5px]">{inv.avatar}</AvatarFallback></Avatar><span>{inv.client}</span></div></td>
                    <td className="px-3 py-2 text-center"><StatusBadge status={INV_MAP[inv.status]} label={inv.status} /></td>
                    <td className="px-3 py-2 text-right font-semibold">{inv.amount}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{inv.tax}</td>
                    <td className="px-3 py-2 text-muted-foreground">{inv.due || '—'}</td>
                    <td className="px-3 py-2"><Button variant="ghost" size="icon" className="h-5 w-5"><MoreHorizontal className="h-2.5 w-2.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ SUBSCRIPTIONS ═══ */}
      {tab === 'subscriptions' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Subs" value={String(SUBSCRIPTIONS.filter(s => s.status === 'active').length)} />
            <KPICard label="Monthly Cost" value="$128" change="Pro + Add-ons" />
            <KPICard label="Next Billing" value="May 1" />
            <KPICard label="Annual Savings" value="$310" change="If switched" />
          </KPIBand>

          <div className="space-y-2">
            {SUBSCRIPTIONS.map(sub => (
              <div key={sub.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', sub.status === 'active' ? 'bg-accent/10' : sub.status === 'trialing' ? 'bg-[hsl(var(--state-healthy))]/10' : 'bg-muted')}>
                    {sub.plan === 'Pro' ? <Crown className="h-5 w-5 text-accent" /> : <Package className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="text-[11px] font-semibold">{sub.name}</span><StatusBadge status={SUB_MAP[sub.status]} label={sub.status} /><Badge variant="secondary" className="text-[6px]">{sub.plan}</Badge></div>
                    <div className="text-[8px] text-muted-foreground mt-0.5">{sub.price} · {sub.cycle}{sub.seats && ` · ${sub.seats} seat${sub.seats > 1 ? 's' : ''}`}</div>
                    <div className="text-[7px] text-muted-foreground">Next bill: {sub.nextBill}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="h-6 text-[8px] gap-1 rounded-xl"><Edit className="h-2.5 w-2.5" />Manage</Button>
                    {sub.status === 'trialing' && <Button size="sm" className="h-6 text-[8px] gap-1 rounded-xl" onClick={() => toast.success('Activated')}><CheckCircle2 className="h-2.5 w-2.5" />Activate</Button>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {sub.features.map(f => <Badge key={f} variant="secondary" className="text-[6px]"><Check className="h-2 w-2 mr-0.5" />{f}</Badge>)}
                </div>
              </div>
            ))}
          </div>

          <SectionCard title="Plan Comparison" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl" action={<Button variant="ghost" size="sm" className="h-5 text-[8px] rounded-lg">View All Plans</Button>}>
            <div className="grid grid-cols-4 gap-2 text-center text-[8px]">
              {['Free', 'Pro', 'Team', 'Enterprise'].map(p => (
                <div key={p} className={cn('rounded-xl border p-2', p === 'Pro' && 'border-accent/30 bg-accent/5')}>
                  <div className="font-semibold">{p}</div>
                  <div className="text-muted-foreground">{p === 'Free' ? '$0' : p === 'Pro' ? '$29' : p === 'Team' ? '$79' : '$249'}/mo</div>
                  {p === 'Pro' && <Badge className="text-[5px] mt-1">Current</Badge>}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ TAX / VAT ═══ */}
      {tab === 'tax' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Collected" value="$4,862.50" change="Q1 2025" />
            <KPICard label="Remitted" value="$2,762.50" />
            <KPICard label="Due" value="$2,100.00" change="EU VAT" trend="down" />
            <KPICard label="Jurisdictions" value="5" />
          </KPIBand>

          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-[8px]">
              <thead><tr className="bg-muted/30 border-b"><th className="text-left py-2 px-3 font-medium">Jurisdiction</th><th className="text-center py-2 px-2 font-medium">Rate</th><th className="text-right py-2 px-2 font-medium">Collected</th><th className="text-right py-2 px-2 font-medium">Remitted</th><th className="text-center py-2 px-2 font-medium">Status</th><th className="text-left py-2 px-2 font-medium">Period</th><th className="text-center py-2 px-2 font-medium">Actions</th></tr></thead>
              <tbody>
                {TAX_ENTRIES.map((t, i) => (
                  <tr key={i} className="border-b hover:bg-muted/10 transition-colors">
                    <td className="py-2 px-3 font-medium">{t.jurisdiction}</td>
                    <td className="py-2 px-2 text-center">{t.rate}</td>
                    <td className="py-2 px-2 text-right font-semibold">{t.collected}</td>
                    <td className="py-2 px-2 text-right">{t.remitted}</td>
                    <td className="py-2 px-2 text-center"><StatusBadge status={TAX_MAP[t.status]} label={t.status} /></td>
                    <td className="py-2 px-2 text-muted-foreground">{t.period}</td>
                    <td className="py-2 px-2 text-center">
                      {t.status === 'due' && <Button size="sm" className="h-5 text-[7px] rounded-lg" onClick={() => toast.success('Remittance initiated')}>Remit</Button>}
                      {t.status === 'current' && <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg"><Eye className="h-2.5 w-2.5" /></Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SectionCard title="Tax Settings" icon={<Calculator className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[9px] py-1.5 border-b"><span>Tax ID (EIN)</span><div className="flex items-center gap-1"><span className="font-mono font-medium">••-•••7890</span><Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg"><Edit className="h-2.5 w-2.5" /></Button></div></div>
              <div className="flex justify-between items-center text-[9px] py-1.5 border-b"><span>VAT Number</span><div className="flex items-center gap-1"><span className="font-mono font-medium">EU372•••••</span><Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg"><Edit className="h-2.5 w-2.5" /></Button></div></div>
              <div className="flex justify-between items-center text-[9px] py-1.5"><span>Auto-collect tax</span><Badge variant="secondary" className="text-[6px]">Enabled</Badge></div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ PAYMENT METHODS ═══ */}
      {tab === 'methods' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Methods" value={String(PAYMENT_METHODS.filter(p => p.status === 'active').length)} />
            <KPICard label="Default" value="Visa ••4242" />
            <KPICard label="Expiring Soon" value={String(PAYMENT_METHODS.filter(p => p.status === 'expiring').length)} change="Action needed" trend="down" />
            <KPICard label="Last Charge" value="$29.00" change="Apr 1" />
          </KPIBand>

          <div className="space-y-2">
            {PAYMENT_METHODS.map(pm => (
              <div key={pm.id} className={cn('rounded-2xl border bg-card p-4 hover:shadow-sm transition-all', pm.default && 'border-accent/20')}>
                <div className="flex items-center gap-3">
                  <div className={cn('h-10 w-14 rounded-xl border flex items-center justify-center', pm.type === 'card' ? 'bg-muted/30' : 'bg-accent/5')}>
                    {pm.type === 'card' ? <CreditCard className="h-5 w-5" /> : <Building2 className="h-5 w-5 text-accent" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{pm.label} ••{pm.last4}</span><StatusBadge status={PM_MAP[pm.status]} label={pm.status} />{pm.default && <Badge className="text-[6px]">Default</Badge>}</div>
                    {pm.expiry && <div className="text-[8px] text-muted-foreground">Expires {pm.expiry}</div>}
                  </div>
                  <div className="flex gap-1">
                    {!pm.default && <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl" onClick={() => toast.success('Set as default')}>Set Default</Button>}
                    <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl"><Edit className="h-2.5 w-2.5" /></Button>
                    {!pm.default && <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-xl text-destructive"><Trash2 className="h-2.5 w-2.5" /></Button>}
                  </div>
                </div>
                {pm.status === 'expiring' && (
                  <div className="mt-2 rounded-lg border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 p-2 flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-[hsl(var(--gigvora-amber))] shrink-0" />
                    <span className="text-[8px]">This card expires soon. Update to avoid payment failures.</span>
                    <Button size="sm" className="h-5 text-[7px] rounded-lg ml-auto shrink-0">Update</Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => setAddMethodOpen(true)}><Plus className="h-3 w-3" />Add Payment Method</Button>
        </div>
      )}

      {/* ═══ BILLING ADMIN ═══ */}
      {tab === 'admin' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Billing Contacts" value="2" />
            <KPICard label="Spending Authority" value="$10,000" change="Monthly limit" />
            <KPICard label="Auto-Pay" value="Enabled" />
            <KPICard label="Invoice Delivery" value="Email + Portal" />
          </KPIBand>

          <SectionCard title="Billing Configuration" icon={<Settings className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              {[
                { label: 'Company Name', value: 'Acme Corp', editable: true },
                { label: 'Billing Email', value: 'finance@acme.com', editable: true },
                { label: 'Billing Address', value: '123 Business Ave, SF CA 94102', editable: true },
                { label: 'Currency', value: 'USD ($)', editable: true },
                { label: 'Invoice Prefix', value: 'INV-', editable: true },
                { label: 'Auto-Pay', value: 'Enabled', editable: false },
                { label: 'Payment Terms', value: 'Net 15', editable: true },
              ].map(c => (
                <div key={c.label} className="flex justify-between items-center text-[9px] py-1.5 border-b last:border-0">
                  <span className="text-muted-foreground">{c.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{c.value}</span>
                    {c.editable && <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg" onClick={() => toast.info(`Edit ${c.label}`)}><Edit className="h-2.5 w-2.5" /></Button>}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Spending Controls" icon={<Shield className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[9px] py-1.5 border-b"><span>Monthly Spend Limit</span><span className="font-semibold">$10,000</span></div>
              <div className="flex justify-between items-center text-[9px] py-1.5 border-b"><span>Current Month Spend</span><span className="font-semibold">$3,420</span></div>
              <Progress value={34} className="h-1.5" />
              <div className="text-[7px] text-muted-foreground">34% of monthly limit used</div>
              <div className="flex justify-between items-center text-[9px] py-1.5 border-b"><span>Approval Required Above</span><span className="font-semibold">$1,000</span></div>
              <div className="flex justify-between items-center text-[9px] py-1.5"><span>Authorized Purchasers</span><span className="font-medium">3 users</span></div>
            </div>
          </SectionCard>

          <SectionCard title="Billing Contacts" icon={<Users className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {[
                { name: 'Alex K.', role: 'Billing Admin', email: 'alex@acme.com' },
                { name: 'Sarah C.', role: 'Finance', email: 'sarah@acme.com' },
              ].map(c => (
                <div key={c.name} className="flex items-center gap-2 py-1.5 border-b last:border-0">
                  <Avatar className="h-6 w-6"><AvatarFallback className="text-[6px]">{c.name[0]}</AvatarFallback></Avatar>
                  <div><div className="text-[9px] font-medium">{c.name}</div><div className="text-[7px] text-muted-foreground">{c.email}</div></div>
                  <Badge variant="secondary" className="text-[6px] ml-auto">{c.role}</Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full h-5 text-[7px] mt-2 gap-0.5 rounded-lg" onClick={() => toast.info('Add contact')}><Plus className="h-2 w-2" />Add Contact</Button>
          </SectionCard>
        </div>
      )}

      {/* ═══ DOWNLOADS ═══ */}
      {tab === 'downloads' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Available" value={String(DOWNLOADS.length)} />
            <KPICard label="Total Size" value="4.3 MB" />
            <KPICard label="Last Generated" value="Apr 1" />
            <KPICard label="Auto-Generate" value="Monthly" />
          </KPIBand>

          <div className="flex items-center gap-2 mb-1">
            <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Generating bundle')}><FileText className="h-3 w-3" />Generate Invoice Bundle</Button>
            <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Generating tax report')}><Globe className="h-3 w-3" />Generate Tax Report</Button>
          </div>

          <div className="space-y-1.5">
            {DOWNLOADS.map(d => (
              <div key={d.id} className="rounded-2xl border bg-card px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-all">
                <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0"><FileText className="h-4 w-4 text-accent" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium">{d.name}</div>
                  <div className="text-[7px] text-muted-foreground">{d.type} · {d.size} · {d.date}</div>
                </div>
                <Button variant="outline" size="sm" className="h-6 text-[8px] gap-1 rounded-xl shrink-0" onClick={() => toast.info(`Downloading ${d.name}`)}><Download className="h-2.5 w-2.5" />Download</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ THRESHOLDS ═══ */}
      {tab === 'thresholds' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Alerts" value={String(THRESHOLDS.length)} />
            <KPICard label="Warning" value={String(THRESHOLDS.filter(t => t.status === 'warning').length)} change="Near limit" trend="down" />
            <KPICard label="Critical" value={String(THRESHOLDS.filter(t => t.status === 'critical').length)} change="Action needed" trend="down" />
            <KPICard label="OK" value={String(THRESHOLDS.filter(t => t.status === 'ok').length)} />
          </KPIBand>

          <div className="space-y-2">
            {THRESHOLDS.map(th => {
              const pct = Math.min((th.current / th.threshold) * 100, 100);
              return (
                <div key={th.id} className={cn('rounded-2xl border bg-card p-4 hover:shadow-sm transition-all', th.status === 'critical' && 'border-destructive/20', th.status === 'warning' && 'border-[hsl(var(--gigvora-amber))]/20')}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{th.metric}</span><StatusBadge status={TH_MAP[th.status]} label={th.status} /></div>
                      <div className="text-[8px] text-muted-foreground mt-0.5">{th.unit === '$' ? `$${th.current.toLocaleString()}` : `${th.current.toLocaleString()} ${th.unit}`} of {th.unit === '$' ? `$${th.threshold.toLocaleString()}` : `${th.threshold.toLocaleString()} ${th.unit}`}</div>
                      <Progress value={pct} className={cn('h-1.5 mt-1.5', th.status === 'critical' && '[&>div]:bg-destructive', th.status === 'warning' && '[&>div]:bg-[hsl(var(--gigvora-amber))]')} />
                      <div className="text-[7px] text-muted-foreground mt-0.5">Action: {th.action}</div>
                    </div>
                    <Button variant="outline" size="sm" className="h-6 text-[8px] gap-1 rounded-xl shrink-0" onClick={() => setEditThresholdOpen(true)}><Edit className="h-2.5 w-2.5" />Edit</Button>
                  </div>
                </div>
              );
            })}
          </div>

          <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => setEditThresholdOpen(true)}><Plus className="h-3 w-3" />Add Threshold</Button>
        </div>
      )}

      {/* ═══ MOBILE STACK ═══ */}
      {tab === 'mobile' && (
        <div className="space-y-3 max-w-sm mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-accent to-[hsl(var(--gigvora-purple))] text-white p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
            <div className="text-[9px] opacity-80 mb-1">Billing Overview</div>
            <div className="text-2xl font-bold">$128/mo</div>
            <div className="text-[10px] opacity-70">Pro + Add-ons · Next bill May 1</div>
            <div className="flex items-center gap-4 mt-4">
              <div><div className="text-lg font-bold">{totalPaid}</div><div className="text-[8px] opacity-70">Paid</div></div>
              <div className="w-px h-8 bg-white/20" />
              <div><div className="text-lg font-bold">{outstanding}</div><div className="text-[8px] opacity-70">Outstanding</div></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-12 text-[10px] gap-1.5 rounded-2xl flex-col" onClick={() => setTab('invoices')}><Receipt className="h-4 w-4 text-accent" />Invoices</Button>
            <Button variant="outline" className="h-12 text-[10px] gap-1.5 rounded-2xl flex-col" onClick={() => setTab('subscriptions')}><Layers className="h-4 w-4 text-accent" />Subscriptions</Button>
            <Button variant="outline" className="h-12 text-[10px] gap-1.5 rounded-2xl flex-col" onClick={() => setTab('methods')}><CreditCard className="h-4 w-4 text-accent" />Payment</Button>
            <Button variant="outline" className="h-12 text-[10px] gap-1.5 rounded-2xl flex-col" onClick={() => setTab('downloads')}><Download className="h-4 w-4 text-accent" />Downloads</Button>
          </div>

          <SectionCard title="Recent Invoices" icon={<Receipt className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            {INVOICES.slice(0, 4).map(inv => (
              <div key={inv.id} className="flex items-center gap-2 py-2 border-b last:border-0 cursor-pointer" onClick={() => setSelectedInv(inv)}>
                <Avatar className="h-6 w-6"><AvatarFallback className="text-[5px]">{inv.avatar}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0"><div className="text-[9px] font-medium truncate">{inv.client}</div><div className="text-[7px] text-muted-foreground">{inv.id} · {inv.date}</div></div>
                <div className="text-right shrink-0"><div className="text-[9px] font-semibold">{inv.amount}</div><StatusBadge status={INV_MAP[inv.status]} label={inv.status} /></div>
              </div>
            ))}
          </SectionCard>
        </div>
      )}

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        <div className="flex-1"><span className="text-[10px] font-semibold">$128/mo</span><div className="text-[8px] text-muted-foreground">Pro Plan</div></div>
        <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-4" onClick={() => setCreateInvOpen(true)}><Plus className="h-3.5 w-3.5" />New Invoice</Button>
      </div>

      {/* Drawers */}
      <InvDrawer inv={selectedInv} open={!!selectedInv} onClose={() => setSelectedInv(null)} />

      {/* Add Payment Method Drawer */}
      <Sheet open={addMethodOpen} onOpenChange={setAddMethodOpen}>
        <SheetContent className="w-[440px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm">Add Payment Method</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">{['Card', 'Bank Account'].map(t => <Button key={t} variant="outline" size="sm" className="h-7 text-[9px] flex-1 rounded-xl">{t}</Button>)}</div>
            <div><label className="text-[9px] font-medium mb-1 block">Card Number</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="1234 5678 9012 3456" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[9px] font-medium mb-1 block">Expiry</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="MM/YY" /></div>
              <div><label className="text-[9px] font-medium mb-1 block">CVC</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="123" /></div>
            </div>
            <div><label className="text-[9px] font-medium mb-1 block">Name on Card</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="Full name" /></div>
            <div className="rounded-xl border bg-muted/30 p-2 text-[8px] text-muted-foreground flex items-center gap-1.5"><Shield className="h-2.5 w-2.5 text-accent" />Your payment details are encrypted and secure.</div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setAddMethodOpen(false)}>Cancel</Button>
              <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setAddMethodOpen(false); toast.success('Payment method added'); }}><Plus className="h-3 w-3" />Add</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Threshold Drawer */}
      <Sheet open={editThresholdOpen} onOpenChange={setEditThresholdOpen}>
        <SheetContent className="w-[440px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm">Configure Threshold</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Metric</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>Monthly Spend</option><option>API Calls</option><option>Storage</option><option>Team Seats</option></select></div>
            <div><label className="text-[9px] font-medium mb-1 block">Threshold Value</label><input type="number" className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="e.g. 5000" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Action</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>Email alert</option><option>Slack + Email</option><option>Block action</option><option>Require approval</option></select></div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setEditThresholdOpen(false)}>Cancel</Button>
              <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setEditThresholdOpen(false); toast.success('Threshold saved'); }}><CheckCircle2 className="h-3 w-3" />Save</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Invoice Drawer */}
      <Sheet open={createInvOpen} onOpenChange={setCreateInvOpen}>
        <SheetContent className="w-[480px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm">Create Invoice</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Client</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="Search clients..." /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[9px] font-medium mb-1 block">Amount</label><div className="relative"><DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><input type="number" className="w-full h-7 rounded-xl border bg-background pl-6 pr-2 text-[9px]" placeholder="0.00" /></div></div>
              <div><label className="text-[9px] font-medium mb-1 block">Due Date</label><input type="date" className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" /></div>
            </div>
            <div><label className="text-[9px] font-medium mb-1 block">Project (optional)</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="Link to project..." /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Tax Rate</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>Auto-detect</option><option>0%</option><option>5%</option><option>7.25%</option><option>8%</option><option>20% (VAT)</option></select></div>
            <div><label className="text-[9px] font-medium mb-1 block">Notes</label><textarea className="w-full h-16 rounded-xl border bg-background px-2 py-1 text-[9px]" placeholder="Invoice notes or terms..." /></div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setCreateInvOpen(false)}>Cancel</Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setCreateInvOpen(false); toast.info('Draft saved'); }}><FileText className="h-3 w-3" />Save Draft</Button>
              <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setCreateInvOpen(false); toast.success('Invoice created & sent'); }}><Send className="h-3 w-3" />Create & Send</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default BillingPage;
