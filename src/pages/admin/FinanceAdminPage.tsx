import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import {
  useFinRefunds, useFinHolds, useFinControls,
  useFinTransitionRefund, useFinSetControl,
} from '@/hooks/useFinanceAdmin';
import { CreateRefundDrawer } from '@/components/finance/CreateRefundDrawer';
import { ReleaseHoldDialog } from '@/components/finance/ReleaseHoldDialog';
import {
  DollarSign, CreditCard, ArrowDownLeft, ArrowUpRight, Search, Clock, AlertTriangle,
  CheckCircle2, XCircle, Eye, RefreshCw, Shield, Landmark,
  Gavel, ChevronRight, Smartphone, FileText, Download,
  AlertOctagon, Radio, TrendingUp, BarChart3, Activity,
  Receipt, Wallet, Ban, Unlock, Lock, Send, Users,
  Globe, History, Percent,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface FinanceRecord {
  id: string; type: 'refund' | 'payout' | 'credit' | 'invoice' | 'chargeback' | 'hold';
  amount: string; currency: string; user: string; userAvatar: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'held' | 'failed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string; created: string; assignee: string; linkedCases: string[];
}

const RECORDS: FinanceRecord[] = [
  { id: 'REF-8001', type: 'refund', amount: '$342.00', currency: 'USD', user: 'Amara Osei', userAvatar: 'AO', status: 'pending', priority: 'high', reason: 'Service not delivered — milestone dispute', created: '12m ago', assignee: 'Unassigned', linkedCases: ['DSP-0334', 'TKT-5003'] },
  { id: 'PAY-8002', type: 'payout', amount: '$1,250.00', currency: 'USD', user: 'Carlos Diaz', userAvatar: 'CD', status: 'held', priority: 'critical', reason: 'Payout held — trust flag on account', created: '2h ago', assignee: 'S. Kim', linkedCases: ['MOD-1092'] },
  { id: 'CRD-8003', type: 'credit', amount: '$50.00', currency: 'USD', user: 'Lin Wei', userAvatar: 'LW', status: 'approved', priority: 'low', reason: 'Goodwill credit for service delay', created: '4h ago', assignee: 'M. Chen', linkedCases: ['TKT-5004'] },
  { id: 'INV-8004', type: 'invoice', amount: '$890.00', currency: 'USD', user: 'Priya Sharma', userAvatar: 'PS', status: 'processing', priority: 'medium', reason: 'Enterprise invoice — monthly billing', created: '1d ago', assignee: 'A. Lopez', linkedCases: [] },
  { id: 'CHB-8005', type: 'chargeback', amount: '$175.00', currency: 'USD', user: 'Jake Morrison', userAvatar: 'JM', status: 'pending', priority: 'critical', reason: 'Cardholder dispute — unauthorized charge claim', created: '45m ago', assignee: 'Unassigned', linkedCases: ['FIN-7720'] },
  { id: 'HLD-8006', type: 'hold', amount: '$2,100.00', currency: 'USD', user: 'Fatima Al-Hassan', userAvatar: 'FA', status: 'held', priority: 'high', reason: 'Escrow hold — project milestone pending delivery', created: '3d ago', assignee: 'R. Patel', linkedCases: ['ESC-1120', 'PRJ-4401'] },
  { id: 'REF-8007', type: 'refund', amount: '$29.00', currency: 'USD', user: 'David Kim', userAvatar: 'DK', status: 'completed', priority: 'low', reason: 'Subscription refund — cancelled within grace', created: '2d ago', assignee: 'A. Lopez', linkedCases: [] },
  { id: 'PAY-8008', type: 'payout', amount: '$4,500.00', currency: 'USD', user: 'Sana Patel', userAvatar: 'SP', status: 'processing', priority: 'medium', reason: 'Freelancer monthly payout — verified', created: '6h ago', assignee: 'S. Kim', linkedCases: [] },
];

const REVENUE_DATA = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  revenue: Math.floor(Math.random() * 8000) + 12000,
  refunds: Math.floor(Math.random() * 600) + 200,
  payouts: Math.floor(Math.random() * 5000) + 6000,
}));

const typeIcon = (t: string) => t === 'refund' ? ArrowDownLeft : t === 'payout' ? ArrowUpRight : t === 'credit' ? Wallet : t === 'invoice' ? Receipt : t === 'chargeback' ? Ban : Lock;
const typeColor = (t: string) => t === 'refund' ? 'text-[hsl(var(--state-blocked))]' : t === 'payout' ? 'text-[hsl(var(--state-healthy))]' : t === 'credit' ? 'text-accent' : t === 'invoice' ? 'text-primary' : t === 'chargeback' ? 'text-[hsl(var(--state-blocked))]' : 'text-[hsl(var(--gigvora-amber))]';
const statusColor = (s: string) => s === 'pending' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : s === 'approved' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : s === 'processing' ? 'bg-primary/10 text-primary' : s === 'completed' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : s === 'rejected' ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]' : s === 'held' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]';
const prioColor = (p: string) => p === 'critical' ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]' : p === 'high' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : p === 'medium' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground';

const FinanceAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selected, setSelected] = useState<FinanceRecord | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [createRefundOpen, setCreateRefundOpen] = useState(false);
  const [releaseHold, setReleaseHold] = useState<{ id: string; amount_minor?: number; currency?: string; reason?: string; owner_id?: string } | null>(null);

  // Live envelopes (fall back to fixtures inside the hooks)
  const refundsQ = useFinRefunds({ status: filterStatus === 'all' ? undefined : filterStatus });
  const holdsQ = useFinHolds();
  const controlsQ = useFinControls();
  const transition = useFinTransitionRefund();
  const setControl = useFinSetControl();

  const liveRefunds = refundsQ.data?.items ?? [];
  const liveHolds = holdsQ.data?.items ?? [];
  const liveControls = controlsQ.data?.items ?? [];

  // Merge live refunds into the existing fixture row shape so the UI is preserved
  const liveRefundRows: FinanceRecord[] = useMemo(() => liveRefunds.map((r) => ({
    id: r.reference || r.id,
    type: 'refund',
    amount: `${r.currency} ${(r.amount_minor / 100).toFixed(2)}`,
    currency: r.currency,
    user: r.customer_id,
    userAvatar: (r.customer_id || '?').slice(0, 2).toUpperCase(),
    status: (r.status === 'succeeded' ? 'completed'
      : r.status === 'failed' ? 'failed'
      : r.status === 'rejected' ? 'rejected'
      : r.status === 'processing' ? 'processing'
      : r.status === 'approved' ? 'approved'
      : 'pending') as FinanceRecord['status'],
    priority: 'medium',
    reason: r.reason,
    created: new Date(r.created_at).toLocaleString(),
    assignee: r.approved_by ?? 'Unassigned',
    linkedCases: r.invoice_id ? [r.invoice_id] : [],
    _live: { refundId: r.id, status: r.status },
  } as FinanceRecord & { _live?: any })), [liveRefunds]);

  const refundRows = liveRefundRows.length > 0 ? liveRefundRows : RECORDS.filter(r => r.type === 'refund');

  const open = (r: FinanceRecord) => { setSelected(r); setDrawer(true); };

  const approveRefund = async (row: FinanceRecord & { _live?: any }) => {
    if (!row._live?.refundId) { toast.success(`Refund ${row.id} approved (demo)`); return; }
    try {
      await transition.mutateAsync({ refundId: row._live.refundId, to: 'approved' });
      toast.success(`Refund ${row.id} approved`);
    } catch (e: any) { toast.error(e?.message ?? 'Approve failed'); }
  };
  const rejectRefund = async (row: FinanceRecord & { _live?: any }) => {
    if (!row._live?.refundId) { toast.info(`Refund ${row.id} rejected (demo)`); return; }
    try {
      await transition.mutateAsync({ refundId: row._live.refundId, to: 'rejected' });
      toast.info(`Refund ${row.id} rejected`);
    } catch (e: any) { toast.error(e?.message ?? 'Reject failed'); }
  };

  const toggleControl = async (c: { control_key: string; scope: string; scope_key: string; enabled: boolean; value: Record<string, unknown> }) => {
    try {
      await setControl.mutateAsync({
        scope: c.scope, scope_key: c.scope_key, control_key: c.control_key,
        value: c.value, enabled: !c.enabled,
      });
      toast.success(`${c.control_key} ${!c.enabled ? 'enabled' : 'disabled'}`);
    } catch (e: any) { toast.error(e?.message ?? 'Update failed'); }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-2 px-4 py-1 text-[8px] font-mono border-b bg-[hsl(var(--state-blocked))]/5 text-[hsl(var(--state-blocked))]">
        <Radio className="h-2.5 w-2.5 animate-pulse" /><span className="uppercase font-bold">Production</span><span className="text-muted-foreground">·</span><span className="text-muted-foreground">Finance Admin Console v2.4</span>
        <div className="flex-1" />
        <Badge variant="secondary" className="text-[6px] gap-0.5"><Landmark className="h-2 w-2" />Finance Admin</Badge>
        <Badge variant="secondary" className="text-[6px] gap-0.5"><Clock className="h-2 w-2" />Session: 4h 38m</Badge>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-accent" /></div>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Finance Admin Dashboard</h1>
            <p className="text-[9px] text-muted-foreground">Refunds, payouts, billing controls, and financial operations</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => setCreateRefundOpen(true)}><ArrowDownLeft className="h-3 w-3" />New Refund</Button>
            <Link to="/admin/cs-dashboard"><Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Users className="h-3 w-3" />CS Dashboard</Button></Link>
            <Link to="/admin/shell"><Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Shield className="h-3 w-3" />Admin Shell</Button></Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
          {[
            { label: 'Pending Refunds', value: '$517', delta: '2 critical', icon: ArrowDownLeft, state: 'blocked' },
            { label: 'Held Payouts', value: '$3,350', delta: '2 accounts', icon: Lock, state: 'caution' },
            { label: 'Chargebacks', value: '3', delta: '$412 at risk', icon: Ban, state: 'blocked' },
            { label: 'Revenue Today', value: '$18.4K', delta: '+12% vs avg', icon: TrendingUp, state: 'healthy' },
            { label: 'Payout Volume', value: '$32.1K', delta: '14 pending', icon: ArrowUpRight, state: 'healthy' },
            { label: 'Anomalies', value: '2', delta: '1 high severity', icon: AlertTriangle, state: 'caution' },
          ].map(k => (
            <div key={k.label} className="rounded-2xl border bg-card p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-1 text-[8px] text-muted-foreground mb-1"><k.icon className="h-3 w-3" />{k.label}</div>
              <div className="text-lg font-bold">{k.value}</div>
              <div className={cn('text-[8px]', k.state === 'healthy' ? 'text-[hsl(var(--state-healthy))]' : k.state === 'blocked' ? 'text-[hsl(var(--state-blocked))]' : 'text-[hsl(var(--gigvora-amber))]')}>{k.delta}</div>
            </div>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="overview" className="text-[9px] gap-1"><BarChart3 className="h-3 w-3" />Overview</TabsTrigger>
            <TabsTrigger value="refunds" className="text-[9px] gap-1"><ArrowDownLeft className="h-3 w-3" />Refunds</TabsTrigger>
            <TabsTrigger value="payouts" className="text-[9px] gap-1"><ArrowUpRight className="h-3 w-3" />Payouts</TabsTrigger>
            <TabsTrigger value="invoices" className="text-[9px] gap-1"><Receipt className="h-3 w-3" />Invoices</TabsTrigger>
            <TabsTrigger value="subscriptions" className="text-[9px] gap-1"><CreditCard className="h-3 w-3" />Subscriptions</TabsTrigger>
            <TabsTrigger value="tax" className="text-[9px] gap-1"><Percent className="h-3 w-3" />Tax/VAT</TabsTrigger>
            <TabsTrigger value="thresholds" className="text-[9px] gap-1"><AlertOctagon className="h-3 w-3" />Thresholds</TabsTrigger>
            <TabsTrigger value="mobile" className="text-[9px] gap-1"><Smartphone className="h-3 w-3" />Mobile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-2xl border bg-card p-4">
                  <div className="text-[9px] font-semibold mb-3">Revenue vs Refunds vs Payouts — 14 Day</div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={REVENUE_DATA}>
                        <XAxis dataKey="day" tick={{ fontSize: 8 }} />
                        <YAxis tick={{ fontSize: 8 }} />
                        <Tooltip contentStyle={{ fontSize: 9 }} />
                        <Area type="monotone" dataKey="revenue" stroke="hsl(var(--state-healthy))" fill="hsl(var(--state-healthy))" fillOpacity={0.1} name="Revenue" />
                        <Area type="monotone" dataKey="payouts" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.1} name="Payouts" />
                        <Area type="monotone" dataKey="refunds" stroke="hsl(var(--state-blocked))" fill="hsl(var(--state-blocked))" fillOpacity={0.1} name="Refunds" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="rounded-xl border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 p-3 flex items-center gap-2 text-[8px]">
                  <AlertTriangle className="h-4 w-4 text-[hsl(var(--gigvora-amber))] shrink-0" />
                  <div className="flex-1"><strong>2 billing anomalies</strong> detected: Duplicate charge pattern on 3 accounts, unusual refund velocity on vendor VND-2201.</div>
                  <Button variant="outline" size="sm" className="h-6 text-[7px] rounded-lg" onClick={() => toast.info('Opening anomaly inspector')}>Inspect</Button>
                </div>
                <div className="rounded-2xl border bg-card p-4">
                  <div className="text-[9px] font-semibold mb-3">Recent Finance Operations</div>
                  <div className="space-y-1.5">
                    {RECORDS.slice(0, 5).map(r => {
                      const Icon = typeIcon(r.type);
                      return (
                        <button key={r.id} onClick={() => open(r)} className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-muted/10 transition-colors text-[8px] text-left">
                          <Icon className={cn('h-3.5 w-3.5 shrink-0', typeColor(r.type))} />
                          <span className="font-mono font-semibold w-20">{r.id}</span>
                          <span className="flex-1 truncate">{r.reason}</span>
                          <span className="font-bold">{r.amount}</span>
                          <Badge variant="secondary" className={cn('text-[6px]', statusColor(r.status))}>{r.status}</Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border bg-card p-3">
                  <div className="text-[9px] font-semibold mb-2">Finance Alerts</div>
                  <div className="space-y-1.5">
                    {[
                      { msg: 'Chargeback CHB-8005 requires response within 48h', severity: 'critical' },
                      { msg: 'Payout PAY-8002 held — trust flag review needed', severity: 'high' },
                      { msg: 'Escrow HLD-8006 approaching 30-day limit', severity: 'medium' },
                    ].map((a, i) => (
                      <div key={i} className={cn('rounded-lg p-2 text-[7px]', a.severity === 'critical' ? 'bg-[hsl(var(--state-blocked))]/5 border border-[hsl(var(--state-blocked))]/20' : a.severity === 'high' ? 'bg-[hsl(var(--gigvora-amber))]/5 border border-[hsl(var(--gigvora-amber))]/20' : 'bg-muted/20 border')}>
                        {a.msg}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border bg-card p-3">
                  <div className="text-[9px] font-semibold mb-2">Quick Actions</div>
                  <div className="space-y-1">
                    {[
                      { label: 'Issue Refund', icon: ArrowDownLeft, action: () => toast.info('Opening refund form') },
                      { label: 'Release Payout', icon: Unlock, action: () => toast.info('Opening payout release') },
                      { label: 'Issue Credit', icon: Wallet, action: () => toast.info('Opening credit form') },
                      { label: 'Export Report', icon: Download, action: () => toast.success('Exporting finance report') },
                      { label: 'Audit Log', icon: History, action: () => toast.info('Opening audit log') },
                    ].map(a => (
                      <button key={a.label} onClick={a.action} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl text-[8px] hover:bg-muted/20 transition-colors">
                        <a.icon className="h-3 w-3 text-muted-foreground" />{a.label}<ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border bg-card p-3">
                  <div className="text-[9px] font-semibold mb-2 flex items-center gap-1"><Lock className="h-3 w-3 text-accent" />Billing Controls</div>
                  {controlsQ.isLoading && <div className="text-[8px] text-muted-foreground py-2">Loading controls…</div>}
                  {!controlsQ.isLoading && liveControls.length === 0 && (
                    <div className="text-[8px] text-muted-foreground py-2">No billing controls configured.</div>
                  )}
                  <div className="space-y-1.5">
                    {liveControls.map(c => (
                      <div key={c.id} className="flex items-center gap-2 p-2 rounded-xl border text-[8px]">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold capitalize truncate">{c.control_key.replace(/_/g, ' ')}</div>
                          <div className="text-[7px] text-muted-foreground capitalize">{c.scope} · {c.scope_key}</div>
                        </div>
                        <Switch
                          checked={c.enabled}
                          disabled={setControl.isPending}
                          onCheckedChange={() => toggleControl(c)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border bg-card p-3">
                  <div className="text-[9px] font-semibold mb-2">Cross-Domain</div>
                  <div className="flex flex-wrap gap-1">
                    <Link to="/admin/cs-dashboard"><Badge variant="outline" className="text-[7px] gap-0.5 cursor-pointer hover:bg-muted/20"><Users className="h-2.5 w-2.5" />CS Dashboard</Badge></Link>
                    <Link to="/disputes"><Badge variant="outline" className="text-[7px] gap-0.5 cursor-pointer hover:bg-muted/20"><Gavel className="h-2.5 w-2.5" />Disputes</Badge></Link>
                    <Link to="/admin/shell"><Badge variant="outline" className="text-[7px] gap-0.5 cursor-pointer hover:bg-muted/20"><Shield className="h-2.5 w-2.5" />Admin Shell</Badge></Link>
                    <Link to="/billing"><Badge variant="outline" className="text-[7px] gap-0.5 cursor-pointer hover:bg-muted/20"><CreditCard className="h-2.5 w-2.5" />Billing</Badge></Link>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="refunds">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search refunds..." className="pl-8 h-8 text-[9px] rounded-xl" />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-8 px-2 text-[9px] rounded-xl border bg-card">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
              <Button variant="ghost" size="sm" className="h-8 text-[8px] rounded-xl gap-1" onClick={() => { setFilterStatus('all'); setSearch(''); }}><RefreshCw className="h-2.5 w-2.5" />Reset</Button>
            </div>
            <div className="rounded-2xl border bg-card overflow-hidden">
              <table className="w-full text-[9px]">
                <thead><tr className="border-b bg-muted/20">
                  <th className="px-3 py-2 text-left font-semibold">ID</th>
                  <th className="px-2 py-2 text-left font-semibold">User</th>
                  <th className="px-2 py-2 text-left font-semibold">Amount</th>
                  <th className="px-2 py-2 text-left font-semibold">Reason</th>
                  <th className="px-2 py-2 text-left font-semibold">Status</th>
                  <th className="px-2 py-2 text-left font-semibold">Priority</th>
                  <th className="px-2 py-2 text-left font-semibold">Linked</th>
                  <th className="px-2 py-2 text-left font-semibold">Actions</th>
                </tr></thead>
                <tbody className="divide-y">
                  {refundsQ.isLoading && (
                    <tr><td colSpan={8} className="px-3 py-6 text-center text-[9px] text-muted-foreground">Loading refunds…</td></tr>
                  )}
                  {!refundsQ.isLoading && refundRows.filter(r => filterStatus === 'all' || r.status === filterStatus).filter(r => !search || r.id.toLowerCase().includes(search.toLowerCase()) || r.user.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                    <tr><td colSpan={8} className="px-3 py-6 text-center text-[9px] text-muted-foreground">No refunds match the current filter.</td></tr>
                  )}
                  {refundRows.filter(r => filterStatus === 'all' || r.status === filterStatus).filter(r => !search || r.id.toLowerCase().includes(search.toLowerCase()) || r.user.toLowerCase().includes(search.toLowerCase())).map(r => (
                    <tr key={r.id} onClick={() => open(r)} className="hover:bg-muted/10 cursor-pointer transition-colors">
                      <td className="px-3 py-2 font-mono font-semibold">{r.id}</td>
                      <td className="px-2 py-2"><div className="flex items-center gap-1.5"><div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center text-[6px] font-bold text-accent">{r.userAvatar}</div>{r.user}</div></td>
                      <td className="px-2 py-2 font-bold">{r.amount}</td>
                      <td className="px-2 py-2 text-muted-foreground max-w-[200px] truncate">{r.reason}</td>
                      <td className="px-2 py-2"><Badge variant="secondary" className={cn('text-[6px]', statusColor(r.status))}>{r.status}</Badge></td>
                      <td className="px-2 py-2"><Badge variant="secondary" className={cn('text-[6px]', prioColor(r.priority))}>{r.priority}</Badge></td>
                      <td className="px-2 py-2">{r.linkedCases.map(c => <Badge key={c} variant="outline" className="text-[6px] mr-0.5">{c}</Badge>)}</td>
                      <td className="px-2 py-2">
                        <div className="flex gap-1">
                          <Button size="sm" className="h-5 text-[6px] rounded-lg" disabled={transition.isPending} onClick={e => { e.stopPropagation(); approveRefund(r as any); }}>Approve</Button>
                          <Button variant="outline" size="sm" className="h-5 text-[6px] rounded-lg" disabled={transition.isPending} onClick={e => { e.stopPropagation(); rejectRefund(r as any); }}>Reject</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="payouts">
            <div className="rounded-2xl border bg-card overflow-hidden">
              <table className="w-full text-[9px]">
                <thead><tr className="border-b bg-muted/20">
                  <th className="px-3 py-2 text-left font-semibold">ID</th>
                  <th className="px-2 py-2 text-left font-semibold">Recipient</th>
                  <th className="px-2 py-2 text-left font-semibold">Amount</th>
                  <th className="px-2 py-2 text-left font-semibold">Status</th>
                  <th className="px-2 py-2 text-left font-semibold">Reason</th>
                  <th className="px-2 py-2 text-left font-semibold">Actions</th>
                </tr></thead>
                <tbody className="divide-y">
                  {liveHolds.map(h => (
                    <tr key={h.id} className={cn('hover:bg-muted/10 transition-colors', h.status === 'active' && 'bg-[hsl(var(--gigvora-amber))]/[0.02]')}>
                      <td className="px-3 py-2 font-mono font-semibold">{h.id.slice(0, 8)}</td>
                      <td className="px-2 py-2"><div className="flex items-center gap-1.5"><div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center text-[6px] font-bold text-accent">{(h.owner_id || '?').slice(0, 2).toUpperCase()}</div>{h.owner_id}</div></td>
                      <td className="px-2 py-2 font-bold">{h.currency} {(h.amount_minor / 100).toFixed(2)}</td>
                      <td className="px-2 py-2"><Badge variant="secondary" className={cn('text-[6px]', h.status === 'active' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]')}>{h.status}</Badge></td>
                      <td className="px-2 py-2 text-muted-foreground max-w-[200px] truncate capitalize">{h.reason}{h.notes ? ` — ${h.notes}` : ''}</td>
                      <td className="px-2 py-2">
                        <div className="flex gap-1">
                          {h.status === 'active' && <Button size="sm" className="h-5 text-[6px] rounded-lg gap-0.5" onClick={() => setReleaseHold({ id: h.id, amount_minor: h.amount_minor, currency: h.currency, reason: h.reason, owner_id: h.owner_id })}><Unlock className="h-2 w-2" />Release</Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {RECORDS.filter(r => r.type === 'payout' || r.type === 'hold').map(r => (
                    <tr key={r.id} onClick={() => open(r)} className={cn('hover:bg-muted/10 cursor-pointer transition-colors', r.status === 'held' && 'bg-[hsl(var(--gigvora-amber))]/[0.02]')}>
                      <td className="px-3 py-2 font-mono font-semibold">{r.id}</td>
                      <td className="px-2 py-2"><div className="flex items-center gap-1.5"><div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center text-[6px] font-bold text-accent">{r.userAvatar}</div>{r.user}</div></td>
                      <td className="px-2 py-2 font-bold">{r.amount}</td>
                      <td className="px-2 py-2"><Badge variant="secondary" className={cn('text-[6px]', statusColor(r.status))}>{r.status}</Badge></td>
                      <td className="px-2 py-2 text-muted-foreground max-w-[200px] truncate">{r.reason}</td>
                      <td className="px-2 py-2">
                        <div className="flex gap-1">
                          {r.status === 'held' && <Button size="sm" className="h-5 text-[6px] rounded-lg gap-0.5" onClick={e => { e.stopPropagation(); toast.success('Payout released'); }}><Unlock className="h-2 w-2" />Release</Button>}
                          <Button variant="outline" size="sm" className="h-5 text-[6px] rounded-lg" onClick={e => { e.stopPropagation(); open(r); }}>Inspect</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'INV-4401', client: 'Acme Corp', amount: '$2,400.00', due: 'Apr 20', status: 'outstanding', type: 'Enterprise' },
                { id: 'INV-4402', client: 'TechFlow Inc', amount: '$890.00', due: 'Apr 15', status: 'paid', type: 'Pro' },
                { id: 'INV-4403', client: 'StartupXYZ', amount: '$150.00', due: 'Apr 25', status: 'outstanding', type: 'Team' },
                { id: 'INV-4404', client: 'GlobalDesign', amount: '$3,200.00', due: 'Apr 10', status: 'overdue', type: 'Enterprise' },
              ].map(inv => (
                <div key={inv.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="h-4 w-4 text-accent" />
                    <span className="text-[10px] font-mono font-bold">{inv.id}</span>
                    <Badge variant="secondary" className="text-[7px]">{inv.type}</Badge>
                    <Badge variant="secondary" className={cn('text-[6px]', inv.status === 'paid' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : inv.status === 'overdue' ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]' : 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]')}>{inv.status}</Badge>
                  </div>
                  <div className="text-[9px] font-semibold">{inv.client}</div>
                  <div className="flex justify-between text-[8px] text-muted-foreground mt-1"><span>Due: {inv.due}</span><span className="font-bold text-foreground">{inv.amount}</span></div>
                  <div className="flex gap-1.5 mt-2">
                    <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5"><Eye className="h-2.5 w-2.5" />View</Button>
                    <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5"><Download className="h-2.5 w-2.5" />PDF</Button>
                    {inv.status !== 'paid' && <Button size="sm" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => toast.success('Payment reminder sent')}><Send className="h-2.5 w-2.5" />Remind</Button>}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="subscriptions">
            <div className="rounded-2xl border bg-card p-4">
              <div className="text-[9px] font-semibold mb-3">Active Subscriptions Overview</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {[
                  { plan: 'Free', count: 12400, mrr: '$0' },
                  { plan: 'Pro', count: 3200, mrr: '$92,800' },
                  { plan: 'Enterprise', count: 145, mrr: '$72,500' },
                ].map(p => (
                  <div key={p.plan} className="rounded-xl border p-3">
                    <div className="text-[9px] font-semibold">{p.plan}</div>
                    <div className="text-lg font-bold">{p.count.toLocaleString()}</div>
                    <div className="text-[8px] text-muted-foreground">MRR: {p.mrr}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                {[
                  { event: 'Upgrade Pro → Enterprise', user: 'Acme Corp', time: '2h ago', impact: '+$500/mo' },
                  { event: 'Cancellation — Pro', user: 'Lin Wei', time: '4h ago', impact: '-$29/mo' },
                  { event: 'New Pro signup', user: 'DataFlow Ltd', time: '6h ago', impact: '+$29/mo' },
                  { event: 'Downgrade Enterprise → Pro', user: 'SmallBiz Co', time: '1d ago', impact: '-$471/mo' },
                ].map((e, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-xl border text-[8px] hover:bg-muted/10 transition-colors">
                    <Activity className="h-3 w-3 text-accent shrink-0" />
                    <span className="font-semibold">{e.event}</span>
                    <span className="text-muted-foreground">— {e.user}</span>
                    <span className="ml-auto text-muted-foreground">{e.time}</span>
                    <Badge variant="secondary" className={cn('text-[6px]', e.impact.startsWith('+') ? 'text-[hsl(var(--state-healthy))]' : 'text-[hsl(var(--state-blocked))]')}>{e.impact}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tax">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3 flex items-center gap-1"><Globe className="h-3 w-3 text-accent" />Tax Configuration by Region</div>
                <div className="space-y-1.5">
                  {[
                    { region: 'United States', rate: '0% (platform exempt)', status: 'active', transactions: 8420 },
                    { region: 'European Union', rate: '20% VAT (avg)', status: 'active', transactions: 3100 },
                    { region: 'United Kingdom', rate: '20% VAT', status: 'active', transactions: 1240 },
                    { region: 'Canada', rate: '13% HST (avg)', status: 'review', transactions: 890 },
                    { region: 'Australia', rate: '10% GST', status: 'active', transactions: 620 },
                  ].map(t => (
                    <div key={t.region} className="flex items-center gap-2 p-2 rounded-xl border text-[8px] hover:bg-muted/10 transition-colors">
                      <span className="font-semibold flex-1">{t.region}</span>
                      <span className="text-muted-foreground">{t.rate}</span>
                      <Badge variant="secondary" className={cn('text-[6px]', t.status === 'active' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]')}>{t.status}</Badge>
                      <span className="text-muted-foreground w-16 text-right">{t.transactions.toLocaleString()} txns</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3">Tax Compliance Status</div>
                <div className="space-y-2">
                  {[
                    { item: 'VAT Returns (Q1)', status: 'Filed', due: 'Completed Apr 1' },
                    { item: 'US 1099-K Reports', status: 'Pending', due: 'Due Jan 31' },
                    { item: 'UK MTD Submission', status: 'In Progress', due: 'Due Apr 30' },
                    { item: 'AU BAS Statement', status: 'Filed', due: 'Completed Mar 28' },
                  ].map(c => (
                    <div key={c.item} className="flex items-center gap-2 p-2 rounded-xl border text-[8px]">
                      <span className="flex-1 font-semibold">{c.item}</span>
                      <Badge variant="secondary" className={cn('text-[6px]', c.status === 'Filed' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : c.status === 'Pending' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : 'bg-primary/10 text-primary')}>{c.status}</Badge>
                      <span className="text-muted-foreground">{c.due}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="thresholds">
            <div className="rounded-2xl border bg-card p-4">
              <div className="text-[9px] font-semibold mb-3 flex items-center gap-1"><AlertOctagon className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" />Financial Thresholds & Alerts</div>
              <div className="space-y-2">
                {[
                  { name: 'Single Refund Limit', value: '$500', current: '$342', usage: 68, status: 'ok' },
                  { name: 'Daily Refund Volume', value: '$5,000', current: '$2,180', usage: 44, status: 'ok' },
                  { name: 'Chargeback Rate', value: '1.0%', current: '0.8%', usage: 80, status: 'warning' },
                  { name: 'Payout Hold Duration', value: '30 days', current: '22 days', usage: 73, status: 'ok' },
                  { name: 'Credit Issuance Daily', value: '$1,000', current: '$50', usage: 5, status: 'ok' },
                  { name: 'Escrow Concentration', value: '$50,000', current: '$38,200', usage: 76, status: 'warning' },
                ].map(t => (
                  <div key={t.name} className="rounded-xl border p-3">
                    <div className="flex justify-between text-[8px] mb-1.5">
                      <span className="font-semibold">{t.name}</span>
                      <span>{t.current} / {t.value}</span>
                    </div>
                    <Progress value={t.usage} className={cn('h-1.5', t.status === 'warning' && '[&>div]:bg-[hsl(var(--gigvora-amber))]')} />
                    <div className="flex justify-between mt-1 text-[7px] text-muted-foreground">
                      <span>{t.usage}% utilized</span>
                      {t.status === 'warning' && <span className="text-[hsl(var(--gigvora-amber))]">Approaching threshold</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mobile">
            <div className="rounded-2xl border bg-card p-4 mb-3">
              <div className="text-[9px] font-semibold mb-2 flex items-center gap-1"><Smartphone className="h-3 w-3 text-accent" />Mobile Billing Stack</div>
              <div className="text-[8px] text-muted-foreground mb-3">Simplified finance view for mobile operators. Critical actions only.</div>
              <div className="space-y-2">
                {RECORDS.filter(r => r.priority === 'critical' || r.priority === 'high').map(r => {
                  const Icon = typeIcon(r.type);
                  return (
                    <button key={r.id} onClick={() => open(r)} className="w-full rounded-xl border p-3 text-left hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={cn('h-3.5 w-3.5', typeColor(r.type))} />
                        <span className="text-[9px] font-mono font-bold">{r.id}</span>
                        <Badge variant="secondary" className={cn('text-[6px]', prioColor(r.priority))}>{r.priority}</Badge>
                        <span className="text-[9px] font-bold ml-auto">{r.amount}</span>
                      </div>
                      <div className="text-[8px] text-muted-foreground">{r.reason}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="rounded-xl border bg-[hsl(var(--gigvora-amber))]/5 border-[hsl(var(--gigvora-amber))]/30 p-3 text-[8px] flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0" />
              <span>Full financial controls require desktop access. Mobile supports viewing and basic approvals only.</span>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent className="w-[460px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4 text-accent" />Finance Record</SheetTitle></SheetHeader>
          {selected && (() => {
            const Icon = typeIcon(selected.type);
            return (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-mono font-bold">{selected.id}</span>
                  <Badge variant="secondary" className={cn('text-[7px]', statusColor(selected.status))}>{selected.status}</Badge>
                  <Badge variant="secondary" className={cn('text-[7px]', prioColor(selected.priority))}>{selected.priority}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-5 w-5', typeColor(selected.type))} />
                  <div><div className="text-sm font-bold">{selected.amount}</div><div className="text-[8px] text-muted-foreground capitalize">{selected.type} · {selected.currency}</div></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-[9px] font-bold text-accent">{selected.userAvatar}</div>
                  <div><div className="text-[9px] font-semibold">{selected.user}</div><div className="text-[7px] text-muted-foreground">Account holder</div></div>
                </div>
                <div className="rounded-xl border p-3 space-y-1.5 text-[8px]">
                  {[
                    { l: 'Type', v: selected.type },
                    { l: 'Reason', v: selected.reason },
                    { l: 'Assignee', v: selected.assignee },
                    { l: 'Created', v: selected.created },
                    { l: 'Linked', v: selected.linkedCases.join(', ') || 'None' },
                  ].map(m => (
                    <div key={m.l} className="flex justify-between"><span className="text-muted-foreground">{m.l}</span><span className="font-semibold text-right max-w-[200px]">{m.v}</span></div>
                  ))}
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-[9px] font-semibold mb-2">Audit Trail</div>
                  <div className="space-y-1.5 text-[7px]">
                    {[
                      { action: 'Record created', actor: 'System', time: selected.created },
                      { action: 'Assigned to ' + selected.assignee, actor: 'Auto-router', time: '2m later' },
                      { action: 'Priority set to ' + selected.priority, actor: 'ML Engine', time: '2m later' },
                    ].map((a, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                        <span>{a.action}</span>
                        <span className="text-muted-foreground ml-auto">{a.actor} · {a.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {selected.type === 'refund' && <>
                    <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.success('Refund approved')}><CheckCircle2 className="h-3 w-3" />Approve</Button>
                    <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Rejected')}><XCircle className="h-3 w-3" />Reject</Button>
                  </>}
                  {(selected.type === 'payout' || selected.type === 'hold') && selected.status === 'held' && <>
                    <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.success('Released')}><Unlock className="h-3 w-3" />Release</Button>
                    <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Extended hold')}><Lock className="h-3 w-3" />Extend Hold</Button>
                  </>}
                  <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Escalating')}><AlertTriangle className="h-3 w-3" />Escalate</Button>
                  <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Adding note')}><FileText className="h-3 w-3" />Add Note</Button>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <Link to="/admin/cs-dashboard"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Users className="h-2.5 w-2.5" />CS Dashboard</Button></Link>
                  <Link to="/disputes"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Gavel className="h-2.5 w-2.5" />Disputes</Button></Link>
                  <Link to="/admin/shell"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Shield className="h-2.5 w-2.5" />Admin Shell</Button></Link>
                </div>
                <div className="rounded-lg border border-[hsl(var(--state-blocked))]/20 bg-[hsl(var(--state-blocked))]/5 p-2 text-[8px] flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-[hsl(var(--state-blocked))] shrink-0" />
                  <span>All financial actions are audited and irreversible. Supervisor approval required for amounts over $500.</span>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      <CreateRefundDrawer open={createRefundOpen} onOpenChange={setCreateRefundOpen} />
      <ReleaseHoldDialog
        open={!!releaseHold}
        onOpenChange={(o) => { if (!o) setReleaseHold(null); }}
        hold={releaseHold}
      />

      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-2 flex items-center gap-2 safe-area-bottom">
        {[
          { tab: 'overview', icon: BarChart3, label: 'Overview' },
          { tab: 'refunds', icon: ArrowDownLeft, label: 'Refunds' },
          { tab: 'payouts', icon: ArrowUpRight, label: 'Payouts' },
          { tab: 'invoices', icon: Receipt, label: 'Invoices' },
        ].map(n => (
          <button key={n.tab} onClick={() => setActiveTab(n.tab)} className={cn('flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg', activeTab === n.tab ? 'text-accent' : 'text-muted-foreground')}>
            <n.icon className="h-4 w-4" /><span className="text-[7px]">{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FinanceAdminPage;
