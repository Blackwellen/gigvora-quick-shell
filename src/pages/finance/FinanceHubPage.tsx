import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Wallet, Shield, AlertTriangle, FileText, CreditCard,
  DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight,
  Plus, Download, Search, Filter, CheckCircle2, Clock,
  Receipt, Coins, Building2, Globe, BarChart3, Eye,
  Send, RefreshCw, Settings, Lock, Upload, Percent,
  Scale, Gavel, Flag, Star, AlertCircle, XCircle,
  ChevronRight, MoreHorizontal, Copy, Printer, Mail,
  Landmark, Banknote, PiggyBank, HandCoins, CircleDollarSign,
  CalendarDays, FileCheck, ShieldCheck, Sparkles, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';

// ── Mock Data ──
const TRANSACTIONS = [
  { id: 'tx1', desc: 'Milestone 1 release - SaaS Platform', amount: '+$5,000', type: 'income', date: 'Apr 6', status: 'completed', from: 'TechCorp', avatar: 'https://i.pravatar.cc/32?u=tc' },
  { id: 'tx2', desc: 'Logo Design - Standard Package', amount: '+$100', type: 'income', date: 'Apr 5', status: 'completed', from: 'DesignHub', avatar: 'https://i.pravatar.cc/32?u=dh' },
  { id: 'tx3', desc: 'Recruiter Pro Subscription', amount: '-$99', type: 'expense', date: 'Apr 1', status: 'completed', from: 'Gigvora', avatar: '' },
  { id: 'tx4', desc: 'Milestone 2 escrow funded', amount: '-$12,000', type: 'escrow', date: 'Apr 3', status: 'held', from: 'CloudScale', avatar: 'https://i.pravatar.cc/32?u=cs' },
  { id: 'tx5', desc: 'SEO Strategy - Basic Package', amount: '+$150', type: 'income', date: 'Mar 28', status: 'completed', from: 'GrowthEngine', avatar: 'https://i.pravatar.cc/32?u=ge' },
  { id: 'tx6', desc: 'Wallet top-up', amount: '+$2,000', type: 'topup', date: 'Mar 25', status: 'completed', from: 'Bank ••6789', avatar: '' },
  { id: 'tx7', desc: 'Project Contract Commission', amount: '-$250', type: 'commission', date: 'Mar 22', status: 'completed', from: 'Platform Fee', avatar: '' },
  { id: 'tx8', desc: 'Refund - Order #ORD-089', amount: '-$75', type: 'refund', date: 'Mar 20', status: 'completed', from: 'Client Refund', avatar: '' },
];

const ESCROWS = [
  { id: 'e1', project: 'SaaS Platform Development', milestone: 'Core Features', amount: '$12,000', status: 'held', created: 'Apr 3', buyer: 'James W.', buyerAvatar: 'https://i.pravatar.cc/32?u=jw', seller: 'Elena R.', sellerAvatar: 'https://i.pravatar.cc/32?u=er', dueDate: 'Apr 20', progress: 45 },
  { id: 'e2', project: 'Mobile App Redesign', milestone: 'Design Phase', amount: '$5,000', status: 'pending-release', created: 'Mar 20', buyer: 'Alex K.', buyerAvatar: 'https://i.pravatar.cc/32?u=ak', seller: 'Sarah C.', sellerAvatar: 'https://i.pravatar.cc/32?u=sc', dueDate: 'Apr 10', progress: 100 },
  { id: 'e3', project: 'E-Commerce Migration', milestone: 'Setup', amount: '$3,000', status: 'released', created: 'Mar 15', buyer: 'Priya P.', buyerAvatar: 'https://i.pravatar.cc/32?u=pp', seller: 'David T.', sellerAvatar: 'https://i.pravatar.cc/32?u=dt', dueDate: 'Mar 28', progress: 100 },
  { id: 'e4', project: 'Brand Identity Package', milestone: 'Final Delivery', amount: '$1,800', status: 'disputed', created: 'Mar 10', buyer: 'Lisa W.', buyerAvatar: 'https://i.pravatar.cc/32?u=lw', seller: 'Tom R.', sellerAvatar: 'https://i.pravatar.cc/32?u=tr', dueDate: 'Apr 5', progress: 80 },
];

const INVOICES = [
  { id: 'INV-001', client: 'TechCorp', clientAvatar: 'https://i.pravatar.cc/32?u=tc2', amount: '$5,000', status: 'paid', date: 'Apr 6', due: 'Apr 6', items: 3 },
  { id: 'INV-002', client: 'DesignHub', clientAvatar: 'https://i.pravatar.cc/32?u=dh2', amount: '$2,400', status: 'pending', date: 'Apr 2', due: 'Apr 16', items: 2 },
  { id: 'INV-003', client: 'CloudScale', clientAvatar: 'https://i.pravatar.cc/32?u=cs2', amount: '$8,500', status: 'overdue', date: 'Mar 15', due: 'Mar 29', items: 5 },
  { id: 'INV-004', client: 'AppWorks', clientAvatar: 'https://i.pravatar.cc/32?u=aw2', amount: '$1,200', status: 'draft', date: 'Apr 8', due: '', items: 1 },
  { id: 'INV-005', client: 'GrowthEngine', clientAvatar: 'https://i.pravatar.cc/32?u=ge2', amount: '$3,750', status: 'sent', date: 'Apr 7', due: 'Apr 21', items: 4 },
];

const DISPUTES = [
  { id: 'D-001', title: 'Delivery quality dispute', project: 'Logo Design', amount: '$100', status: 'in-review', created: 'Apr 4', evidence: 3, messages: 8, respondent: 'Sarah C.', respondentAvatar: 'https://i.pravatar.cc/32?u=sc3', phase: 'Mediation' },
  { id: 'D-002', title: 'Scope disagreement', project: 'Web App Build', amount: '$3,500', status: 'evidence', created: 'Mar 28', evidence: 5, messages: 12, respondent: 'Elena R.', respondentAvatar: 'https://i.pravatar.cc/32?u=er3', phase: 'Evidence Collection' },
  { id: 'D-003', title: 'Late delivery - penalties', project: 'SEO Campaign', amount: '$200', status: 'resolved', created: 'Mar 15', evidence: 2, messages: 6, respondent: 'Priya P.', respondentAvatar: 'https://i.pravatar.cc/32?u=pp3', phase: 'Closed' },
];

const REFUND_QUEUE = [
  { id: 'R-001', order: 'ORD-234', client: 'Alex Kim', amount: '$150', reason: 'Service not as described', status: 'pending', requested: 'Apr 7' },
  { id: 'R-002', order: 'ORD-189', client: 'Lisa Wang', amount: '$75', reason: 'Duplicate charge', status: 'approved', requested: 'Apr 5' },
  { id: 'R-003', order: 'ORD-156', client: 'Tom R.', amount: '$500', reason: 'Project cancelled', status: 'processing', requested: 'Apr 3' },
];

const SUBSCRIPTION_PLANS = [
  { name: 'Free', price: '$0', period: '/mo', features: ['5 proposals/mo', 'Basic search', 'Profile page', 'Community access'], current: false, popular: false },
  { name: 'Professional', price: '$29', period: '/mo', features: ['Unlimited proposals', 'Priority search', 'Analytics', 'AI assists', 'Verified badge'], current: true, popular: true },
  { name: 'Business', price: '$79', period: '/mo', features: ['Everything in Pro', 'Team workspace', 'Recruiter Pro', 'Sales Navigator', 'API access'], current: false, popular: false },
  { name: 'Enterprise', price: 'Custom', period: '', features: ['Everything in Business', 'Dedicated support', 'Custom integrations', 'SLA guarantees', 'SSO'], current: false, popular: false },
];

const FinanceHubPage: React.FC = () => {
  const { activeRole } = useRole();
  const [selectedTx, setSelectedTx] = useState<string | null>(null);
  const [ledgerFilter, setLedgerFilter] = useState('all');

  const filteredTx = ledgerFilter === 'all' ? TRANSACTIONS : TRANSACTIONS.filter(t => t.type === ledgerFilter);

  // Role-specific stats
  const roleStats = activeRole === 'enterprise' ? [
    { label: 'Company Balance', value: '$142,500', icon: Building2, color: 'text-accent' },
    { label: 'Total Escrow', value: '$87,000', icon: Shield, color: 'text-accent' },
    { label: 'Monthly Spend', value: '$45,200', icon: TrendingUp, color: 'text-gigvora-amber' },
    { label: 'Active Contracts', value: '12', icon: FileText, color: 'text-gigvora-green' },
    { label: 'Open Disputes', value: '2', icon: AlertTriangle, color: 'text-destructive' },
  ] : activeRole === 'professional' ? [
    { label: 'Available Balance', value: '$8,250', icon: Wallet, color: 'text-gigvora-green' },
    { label: 'In Escrow', value: '$17,000', icon: Shield, color: 'text-accent' },
    { label: 'Pending Payout', value: '$2,400', icon: Clock, color: 'text-gigvora-amber' },
    { label: 'This Month', value: '$5,250', icon: TrendingUp, color: 'text-gigvora-green' },
    { label: 'Open Disputes', value: '2', icon: AlertTriangle, color: 'text-destructive' },
  ] : [
    { label: 'Wallet Balance', value: '$3,200', icon: Wallet, color: 'text-gigvora-green' },
    { label: 'In Escrow', value: '$5,000', icon: Shield, color: 'text-accent' },
    { label: 'Total Spent', value: '$12,400', icon: ArrowUpRight, color: 'text-muted-foreground' },
    { label: 'Active Orders', value: '3', icon: Receipt, color: 'text-gigvora-amber' },
    { label: 'Refunds', value: '1', icon: RefreshCw, color: 'text-destructive' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet className="h-6 w-6 text-accent" /> Finance Hub</h1>
          <p className="text-sm text-muted-foreground">
            {activeRole === 'enterprise' ? 'Company wallet, contracts, billing, and finance ops' :
             activeRole === 'professional' ? 'Earnings, escrow, invoices, and payouts' :
             'Wallet, orders, billing, and payment methods'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" /> Export</Button>
          <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> New Invoice</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {roleStats.map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow cursor-pointer">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><s.icon className="h-3.5 w-3.5" /> {s.label}</div>
            <div className={cn('text-xl font-bold', s.color)}>{s.value}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="wallet">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="wallet">Wallet & Ledger</TabsTrigger>
          <TabsTrigger value="escrow">Escrow Console</TabsTrigger>
          <TabsTrigger value="disputes">Disputes & Refunds</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="billing">Billing & Plans</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="tax">Tax Center</TabsTrigger>
          {activeRole === 'enterprise' && <TabsTrigger value="finance-ops">Finance Ops</TabsTrigger>}
        </TabsList>

        {/* ── Wallet & Ledger ── */}
        <TabsContent value="wallet">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Transaction Ledger</h2>
                  <div className="flex gap-2">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><input placeholder="Search transactions..." className="h-8 rounded-md border bg-background pl-8 pr-3 text-xs w-48 focus:outline-none focus:ring-1 focus:ring-ring" /></div>
                    <select value={ledgerFilter} onChange={e => setLedgerFilter(e.target.value)} className="h-8 rounded-md border bg-background px-2 text-xs">
                      <option value="all">All Types</option>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                      <option value="escrow">Escrow</option>
                      <option value="commission">Commission</option>
                      <option value="refund">Refund</option>
                      <option value="topup">Top-up</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  {filteredTx.map(tx => (
                    <div key={tx.id} onClick={() => setSelectedTx(selectedTx === tx.id ? null : tx.id)} className={cn('p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer', selectedTx === tx.id && 'bg-muted/30 ring-1 ring-ring')}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn('h-8 w-8 rounded-full flex items-center justify-center',
                            tx.type === 'income' ? 'bg-gigvora-green/10' : tx.type === 'escrow' ? 'bg-accent/10' : tx.type === 'commission' ? 'bg-gigvora-amber/10' : tx.type === 'refund' ? 'bg-destructive/10' : 'bg-muted')}>
                            {tx.type === 'income' ? <ArrowDownRight className="h-4 w-4 text-gigvora-green" /> :
                             tx.type === 'escrow' ? <Shield className="h-4 w-4 text-accent" /> :
                             tx.type === 'commission' ? <Percent className="h-4 w-4 text-gigvora-amber" /> :
                             tx.type === 'refund' ? <RefreshCw className="h-4 w-4 text-destructive" /> :
                             <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{tx.desc}</div>
                            <div className="text-xs text-muted-foreground">{tx.date} · {tx.from}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn('font-semibold text-sm', tx.amount.startsWith('+') ? 'text-gigvora-green' : '')}>{tx.amount}</div>
                          <Badge variant="secondary" className="text-[10px]">{tx.status}</Badge>
                        </div>
                      </div>
                      {selectedTx === tx.id && (
                        <div className="mt-3 pt-3 border-t flex gap-2">
                          <Button variant="outline" size="sm" className="h-7 text-xs"><Eye className="h-3 w-3 mr-1" /> Details</Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs"><Download className="h-3 w-3 mr-1" /> Receipt</Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs"><Flag className="h-3 w-3 mr-1" /> Report</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button className="w-full" size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Top Up Wallet</Button>
                  <Button variant="outline" className="w-full" size="sm"><ArrowUpRight className="h-3.5 w-3.5 mr-1" /> Withdraw</Button>
                  <Button variant="outline" className="w-full" size="sm"><FileText className="h-3.5 w-3.5 mr-1" /> Create Invoice</Button>
                  <Button variant="outline" className="w-full" size="sm"><Send className="h-3.5 w-3.5 mr-1" /> Send Payment</Button>
                </div>
              </div>
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3">Payment Methods</h3>
                <div className="space-y-2">
                  {[
                    { type: 'Visa', last4: '4242', exp: '08/27', primary: true },
                    { type: 'Bank', last4: '6789', exp: 'ACH', primary: false },
                    { type: 'PayPal', last4: 'user@...', exp: '', primary: false },
                  ].map(pm => (
                    <div key={pm.last4} className="flex items-center justify-between p-2.5 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-sm font-medium">{pm.type} ••{pm.last4}</span>
                          {pm.primary && <Badge className="ml-1.5 text-[9px] bg-accent/10 text-accent">Primary</Badge>}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{pm.exp}</span>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground"><Plus className="h-3 w-3 mr-1" /> Add Method</Button>
                </div>
              </div>
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-2">Monthly Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Income</span><span className="text-gigvora-green font-medium">+$5,250</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Expenses</span><span className="font-medium">-$99</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Commissions</span><span className="font-medium">-$250</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Escrow Held</span><span className="text-accent font-medium">$12,000</span></div>
                  <div className="border-t pt-2 flex justify-between font-semibold"><span>Net</span><span className="text-gigvora-green">+$4,901</span></div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Escrow Console ── */}
        <TabsContent value="escrow">
          <div className="space-y-4">
            <div className="grid md:grid-cols-4 gap-3">
              {[
                { label: 'Active Escrows', value: '4', icon: Shield },
                { label: 'Total Held', value: '$21,800', icon: Lock },
                { label: 'Pending Release', value: '$5,000', icon: Clock },
                { label: 'Released This Month', value: '$3,000', icon: CheckCircle2 },
              ].map(s => (
                <div key={s.label} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><s.icon className="h-3.5 w-3.5" /> {s.label}</div>
                  <div className="text-xl font-bold">{s.value}</div>
                </div>
              ))}
            </div>
            {ESCROWS.map(e => (
              <div key={e.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-sm">{e.project}</div>
                    <div className="text-xs text-muted-foreground">{e.milestone} · Due {e.dueDate}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{e.amount}</div>
                    <Badge className={cn('text-xs',
                      e.status === 'held' ? 'bg-accent/10 text-accent' :
                      e.status === 'released' ? 'bg-gigvora-green/10 text-gigvora-green' :
                      e.status === 'disputed' ? 'bg-destructive/10 text-destructive' :
                      'bg-gigvora-amber/10 text-gigvora-amber'
                    )}>{e.status}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5"><AvatarImage src={e.buyerAvatar} /><AvatarFallback className="text-[8px]">{e.buyer[0]}</AvatarFallback></Avatar>
                    <span>Buyer: {e.buyer}</span>
                  </div>
                  <span>→</span>
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5"><AvatarImage src={e.sellerAvatar} /><AvatarFallback className="text-[8px]">{e.seller[0]}</AvatarFallback></Avatar>
                    <span>Seller: {e.seller}</span>
                  </div>
                </div>
                <Progress value={e.progress} className="h-1.5 mb-3" />
                {e.status !== 'released' && (
                  <div className="flex gap-2">
                    {e.status === 'pending-release' && <Button size="sm" className="h-7 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" /> Release Full</Button>}
                    {e.status === 'held' && <Button size="sm" variant="outline" className="h-7 text-xs">Partial Release</Button>}
                    {e.status !== 'disputed' && <Button size="sm" variant="outline" className="h-7 text-xs text-destructive"><Gavel className="h-3 w-3 mr-1" /> Dispute</Button>}
                    {e.status === 'disputed' && <Button size="sm" variant="outline" className="h-7 text-xs"><Eye className="h-3 w-3 mr-1" /> View Dispute</Button>}
                    <Button size="sm" variant="ghost" className="h-7 text-xs"><MoreHorizontal className="h-3 w-3" /></Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── Disputes & Refunds ── */}
        <TabsContent value="disputes">
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Gavel className="h-5 w-5 text-gigvora-amber" /> Disputes</h2>
              <div className="space-y-3">
                {DISPUTES.map(d => (
                  <div key={d.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8"><AvatarImage src={d.respondentAvatar} /><AvatarFallback className="text-[10px]">{d.respondent[0]}</AvatarFallback></Avatar>
                        <div>
                          <div className="font-medium text-sm">{d.title}</div>
                          <div className="text-xs text-muted-foreground">{d.id} · {d.project}</div>
                        </div>
                      </div>
                      <Badge className={cn('text-xs',
                        d.status === 'in-review' ? 'bg-accent/10 text-accent' :
                        d.status === 'evidence' ? 'bg-gigvora-amber/10 text-gigvora-amber' :
                        'bg-gigvora-green/10 text-gigvora-green'
                      )}>{d.phase}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <span>Amount: <strong className="text-foreground">{d.amount}</strong></span>
                      <span>{d.evidence} evidence files</span>
                      <span>{d.messages} messages</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs"><Eye className="h-3 w-3 mr-1" /> Timeline</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs"><Upload className="h-3 w-3 mr-1" /> Evidence</Button>
                      <Button size="sm" className="h-7 text-xs">View Details</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="font-semibold mb-4 flex items-center gap-2"><RefreshCw className="h-5 w-5 text-accent" /> Refund Queue</h2>
              <div className="space-y-3">
                {REFUND_QUEUE.map(r => (
                  <div key={r.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm">{r.reason}</div>
                        <div className="text-xs text-muted-foreground">{r.id} · {r.order} · {r.client}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{r.amount}</div>
                        <Badge variant="secondary" className="text-[10px]">{r.status}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {r.status === 'pending' && <>
                        <Button size="sm" className="h-7 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" /> Approve</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-destructive"><XCircle className="h-3 w-3 mr-1" /> Deny</Button>
                      </>}
                      <Button size="sm" variant="ghost" className="h-7 text-xs"><Eye className="h-3 w-3 mr-1" /> View</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Invoices ── */}
        <TabsContent value="invoices">
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold">Invoice Center</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs"><Filter className="h-3 w-3 mr-1" /> Filter</Button>
                <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> New Invoice</Button>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground"><tr>
                <th className="text-left px-4 py-2 font-medium">Invoice</th>
                <th className="text-left px-4 py-2 font-medium">Client</th>
                <th className="text-left px-4 py-2 font-medium">Amount</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Date</th>
                <th className="text-left px-4 py-2 font-medium">Due</th>
                <th className="px-4 py-2"></th>
              </tr></thead>
              <tbody>
                {INVOICES.map(inv => (
                  <tr key={inv.id} className="border-t hover:bg-muted/30 cursor-pointer">
                    <td className="px-4 py-3 font-medium">{inv.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6"><AvatarImage src={inv.clientAvatar} /><AvatarFallback className="text-[9px]">{inv.client[0]}</AvatarFallback></Avatar>
                        {inv.client}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{inv.amount}</td>
                    <td className="px-4 py-3">
                      <Badge className={cn('text-xs',
                        inv.status === 'paid' ? 'bg-gigvora-green/10 text-gigvora-green' :
                        inv.status === 'overdue' ? 'bg-destructive/10 text-destructive' :
                        inv.status === 'pending' || inv.status === 'sent' ? 'bg-gigvora-amber/10 text-gigvora-amber' : 'bg-muted text-muted-foreground'
                      )}>{inv.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.date}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.due || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Printer className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Mail className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── Billing & Plans ── */}
        <TabsContent value="billing">
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {SUBSCRIPTION_PLANS.map(plan => (
              <div key={plan.name} className={cn('rounded-xl border bg-card p-5 relative', plan.current && 'ring-2 ring-accent', plan.popular && 'border-accent')}>
                {plan.popular && <Badge className="absolute -top-2.5 left-4 bg-accent text-accent-foreground text-[10px]">Most Popular</Badge>}
                {plan.current && <Badge className="absolute -top-2.5 right-4 bg-gigvora-green/10 text-gigvora-green text-[10px]">Current</Badge>}
                <h3 className="font-semibold mb-1">{plan.name}</h3>
                <div className="text-2xl font-bold mb-3">{plan.price}<span className="text-sm text-muted-foreground font-normal">{plan.period}</span></div>
                <ul className="space-y-1.5 mb-4">
                  {plan.features.map(f => (
                    <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-gigvora-green shrink-0" /> {f}</li>
                  ))}
                </ul>
                <Button variant={plan.current ? 'secondary' : 'default'} size="sm" className="w-full" disabled={plan.current}>
                  {plan.current ? 'Current Plan' : plan.name === 'Enterprise' ? 'Contact Sales' : 'Upgrade'}
                </Button>
              </div>
            ))}
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold mb-4">Commission Policy</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { type: 'Gig Orders', rate: '10%', desc: 'Applied to completed gig orders' },
                { type: 'Project Contracts', rate: '5%', desc: 'Applied to project milestone releases' },
                { type: 'Job Postings', rate: '$49/post', desc: 'One-time fee per active job listing' },
                { type: 'Recruiter Pro', rate: '$99/mo', desc: 'Monthly subscription for ATS tools' },
                { type: 'Sales Navigator', rate: '$79/mo', desc: 'Monthly subscription for CRM tools' },
                { type: 'Enterprise Connect', rate: 'Custom', desc: 'Contact sales for enterprise pricing' },
              ].map(c => (
                <div key={c.type} className="rounded-lg border p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{c.type}</span>
                    <Badge variant="secondary" className="text-xs">{c.rate}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Payouts ── */}
        <TabsContent value="payouts">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Banknote className="h-5 w-5 text-accent" /> Payout Settings</h3>
              <div className="space-y-4">
                <div><label className="text-sm font-medium mb-1 block">Payout Method</label>
                  <select className="w-full h-9 rounded-md border bg-background px-3 text-sm"><option>Bank Transfer (ACH)</option><option>PayPal</option><option>Wire Transfer</option><option>Wise</option><option>Payoneer</option></select></div>
                <div><label className="text-sm font-medium mb-1 block">Payout Schedule</label>
                  <select className="w-full h-9 rounded-md border bg-background px-3 text-sm"><option>Weekly (Fridays)</option><option>Bi-weekly</option><option>Monthly (1st)</option><option>On-demand</option></select></div>
                <div><label className="text-sm font-medium mb-1 block">Minimum Threshold</label>
                  <input className="w-full h-9 rounded-md border bg-background px-3 text-sm" defaultValue="$50" /></div>
                <div><label className="text-sm font-medium mb-1 block">Currency</label>
                  <select className="w-full h-9 rounded-md border bg-background px-3 text-sm"><option>USD</option><option>EUR</option><option>GBP</option><option>CAD</option></select></div>
                <Button size="sm"><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Save Settings</Button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3">Recent Payouts</h3>
                <div className="space-y-2">
                  {[
                    { amount: '$3,200', date: 'Apr 1', method: 'Bank ••6789', status: 'completed' },
                    { amount: '$5,100', date: 'Mar 25', method: 'Bank ••6789', status: 'completed' },
                    { amount: '$2,800', date: 'Mar 18', method: 'Bank ••6789', status: 'completed' },
                    { amount: '$1,450', date: 'Mar 11', method: 'PayPal', status: 'completed' },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border text-sm">
                      <span className="font-medium text-gigvora-green">{p.amount}</span>
                      <span className="text-muted-foreground text-xs">{p.date}</span>
                      <span className="text-muted-foreground text-xs">{p.method}</span>
                      <Badge variant="secondary" className="text-[10px]">{p.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-2">Next Payout</h3>
                <div className="text-2xl font-bold text-gigvora-green mb-1">$2,400</div>
                <div className="text-xs text-muted-foreground">Scheduled for Apr 11 · Bank ••6789</div>
                <Button variant="outline" size="sm" className="mt-3 h-7 text-xs">Request Early Payout</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Commissions ── */}
        <TabsContent value="commissions">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Percent className="h-5 w-5 text-gigvora-amber" /> Commission History</h3>
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Total Commissions Paid', value: '$1,240' },
                { label: 'This Month', value: '$250' },
                { label: 'Average Rate', value: '7.5%' },
              ].map(s => (
                <div key={s.label} className="rounded-lg border p-3 text-center">
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="text-xl font-bold">{s.value}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[
                { desc: 'Logo Design - Standard Package', base: '$100', rate: '10%', commission: '$10', date: 'Apr 5' },
                { desc: 'SaaS Platform - Milestone 1', base: '$5,000', rate: '5%', commission: '$250', date: 'Apr 3' },
                { desc: 'SEO Strategy - Basic', base: '$150', rate: '10%', commission: '$15', date: 'Mar 28' },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                  <div>
                    <div className="font-medium">{c.desc}</div>
                    <div className="text-xs text-muted-foreground">Base: {c.base} · Rate: {c.rate}</div>
                  </div>
                  <span className="font-semibold text-gigvora-amber">{c.commission}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Tax Center ── */}
        <TabsContent value="tax">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><FileCheck className="h-5 w-5 text-accent" /> Tax Documents</h3>
              <div className="space-y-2">
                {[
                  { name: '1099-NEC (2025)', status: 'Available', date: 'Jan 31, 2026' },
                  { name: 'W-9 Form', status: 'On file', date: 'Updated Mar 2025' },
                  { name: 'Annual Earnings Summary', status: 'Available', date: '2025' },
                ].map(d => (
                  <div key={d.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="text-sm font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.date}</div>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="secondary" className="text-[10px]">{d.status}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4">Tax Settings</h3>
              <div className="space-y-4">
                <div><label className="text-sm font-medium mb-1 block">Tax ID / SSN</label>
                  <input className="w-full h-9 rounded-md border bg-background px-3 text-sm" value="••••••1234" readOnly /></div>
                <div><label className="text-sm font-medium mb-1 block">Tax Country</label>
                  <select className="w-full h-9 rounded-md border bg-background px-3 text-sm"><option>United States</option><option>United Kingdom</option><option>Germany</option></select></div>
                <div><label className="text-sm font-medium mb-1 block">VAT/GST Number</label>
                  <input className="w-full h-9 rounded-md border bg-background px-3 text-sm" placeholder="Optional" /></div>
                <Button size="sm">Update Tax Info</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Credits ── */}
        <TabsContent value="credits">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Coins className="h-5 w-5 text-gigvora-amber" /> Credits Wallet</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { type: 'Proposal Credits', balance: 15 },
                { type: 'AI Credits', balance: 100 },
                { type: 'Posting Credits', balance: 5 },
                { type: 'Boost Credits', balance: 3 },
              ].map(c => (
                <div key={c.type} className="rounded-lg bg-muted/30 p-4 text-center">
                  <div className="text-xs text-muted-foreground">{c.type}</div>
                  <div className="text-2xl font-bold">{c.balance}</div>
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-xs">Buy More</Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Finance Ops (Enterprise only) ── */}
        {activeRole === 'enterprise' && (
          <TabsContent value="finance-ops">
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { title: 'Anomaly Detection', desc: 'AI-powered unusual transaction alerts', icon: AlertTriangle, count: '3 alerts' },
                  { title: 'Batch Payments', desc: 'Process multiple payouts at once', icon: Users, count: '12 pending' },
                  { title: 'Compliance Reports', desc: 'SOC2, GDPR, and financial audits', icon: ShieldCheck, count: '2 due' },
                ].map(item => (
                  <div key={item.title} className="rounded-xl border bg-card p-5 hover:shadow-sm cursor-pointer transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className="h-5 w-5 text-accent" />
                      <h3 className="font-semibold text-sm">{item.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{item.desc}</p>
                    <Badge variant="secondary" className="text-[10px]">{item.count}</Badge>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-3">Multi-Currency Summary</h3>
                <div className="space-y-2">
                  {[
                    { currency: 'USD', balance: '$142,500', change: '+$12,400' },
                    { currency: 'EUR', balance: '€28,300', change: '+€3,200' },
                    { currency: 'GBP', balance: '£15,800', change: '+£1,100' },
                  ].map(c => (
                    <div key={c.currency} className="flex items-center justify-between p-2 rounded-lg border">
                      <span className="font-medium text-sm">{c.currency}</span>
                      <span className="font-bold">{c.balance}</span>
                      <span className="text-xs text-gigvora-green">{c.change} this month</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default FinanceHubPage;
