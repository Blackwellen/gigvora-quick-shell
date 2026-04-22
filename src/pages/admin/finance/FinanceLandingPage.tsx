/** Finance Admin Portal — landing (AD-019). */
import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Landmark, Wallet, Receipt, ShieldCheck, Banknote, TrendingUp, TrendingDown,
  Activity, Sparkles, ArrowRight, Inbox, ListTodo, MessageSquare, Mail, Bell,
  BarChart3, LayoutGrid, RefreshCw, Coins, Briefcase, Lock, FileBarChart,
  PiggyBank, Megaphone,
} from 'lucide-react';

const KPIS = [
  { label: 'Pending refunds', value: '23', delta: '+4', positive: false, icon: RefreshCw },
  { label: 'Active escrow', value: '£1.42M', delta: '+£82k', positive: true, icon: ShieldCheck },
  { label: 'Held credits', value: '£184.2k', delta: '−£6.1k', positive: true, icon: Lock },
  { label: 'Site earnings (30d)', value: '£612.4k', delta: '+9.4%', positive: true, icon: TrendingUp },
  { label: 'Commissions (30d)', value: '£94.8k', delta: '+12.1%', positive: true, icon: PiggyBank },
  { label: 'Ad spend (30d)', value: '£48.6k', delta: '+£3.2k', positive: false, icon: Megaphone },
];

const SUB_PORTALS = [
  { id: 'tickets', label: 'Finance Tickets', description: 'Refund requests, billing disputes, payout queries.', icon: Inbox, to: '/admin/finance/tickets', count: 47, countLabel: 'open' },
  { id: 'tasks', label: 'Delegated Tasks', description: 'Cross-team finance tasks, reconciliations, signoffs.', icon: ListTodo, to: '/admin/finance/tasks', count: 14, countLabel: 'open' },
  { id: 'internal-chat', label: 'Internal Chat', description: 'Finance team chat for case collaboration.', icon: MessageSquare, to: '/admin/finance/internal-chat', count: 5, countLabel: 'unread' },
  { id: 'customer-chat', label: 'Customer Chat', description: 'Direct customer threads on payments & refunds.', icon: MessageSquare, to: '/admin/finance/customer-chat', count: 3, countLabel: 'live' },
  { id: 'emails', label: 'Email Console', description: 'Finance outbound + customer reply threads.', icon: Mail, to: '/admin/finance/emails', count: 28, countLabel: 'today' },
  { id: 'notices', label: 'Notices', description: 'Customer-facing payment notices and advisories.', icon: Bell, to: '/admin/finance/notices', count: 2, countLabel: 'active' },
  { id: 'notifications', label: 'Notifications', description: 'Operator alerts: failed payouts, chargebacks, KYC.', icon: Activity, to: '/admin/finance/notifications', count: 11, countLabel: 'unread' },
  { id: 'transactions', label: 'Transactions', description: 'Live ledger of all platform transactions.', icon: Receipt, to: '/admin/finance/transactions', count: 18420, countLabel: '30d' },
  { id: 'escrow', label: 'Escrow Records', description: 'Held funds across active projects and milestones.', icon: ShieldCheck, to: '/admin/finance/escrow', count: 312, countLabel: 'active' },
  { id: 'records', label: 'Project / Gig / Payment Records', description: 'Cross-object payment trail per booking.', icon: Briefcase, to: '/admin/finance/records', count: 1842, countLabel: 'recent' },
  { id: 'subscriptions', label: 'Subscriptions', description: 'Recurring billing across all customer plans.', icon: RefreshCw, to: '/admin/finance/subscriptions', count: 4106, countLabel: 'active' },
  { id: 'credits', label: 'Credits & Held Credits', description: 'Wallet credits, held balances, and adjustments.', icon: Coins, to: '/admin/finance/credits', count: 928, countLabel: 'wallets' },
  { id: 'earnings', label: 'Site Earnings', description: 'Platform revenue, take rate, and trend analysis.', icon: TrendingUp, to: '/admin/finance/earnings', count: 0, countLabel: 'live' },
  { id: 'commissions', label: 'Commissions', description: 'Commission breakdown across product lines.', icon: PiggyBank, to: '/admin/finance/commissions', count: 0, countLabel: 'live' },
  { id: 'ad-spend', label: 'Ad Spend', description: 'On-site ad spend reconciliation & invoice ledger.', icon: Megaphone, to: '/admin/finance/ad-spend', count: 0, countLabel: 'live' },
  { id: 'bank-details', label: 'Bank Details (Encrypted)', description: 'Encrypted payout & bank credential vault.', icon: Lock, to: '/admin/finance/bank-details', count: 0, countLabel: 'gated' },
  { id: 'analytics', label: 'Stats & Analytics', description: 'Volume, revenue, refund rate, churn, FX impact.', icon: BarChart3, to: '/admin/finance/analytics', count: 0, countLabel: 'live' },
  { id: 'kpi-cards', label: 'Custom KPI Cards', description: 'Super-admin defined KPIs surfaced to Finance.', icon: LayoutGrid, to: '/admin/finance/kpi-cards', count: 8, countLabel: 'cards' },
];

const RECENT = [
  { time: '3m ago', actor: 'Operator Reyes', action: 'Approved refund', target: 'RF-1842 — £124.50' },
  { time: '11m ago', actor: 'System', action: 'Escrow released', target: 'PRJ-7821 milestone 3 — £2,450' },
  { time: '22m ago', actor: 'Operator Khan', action: 'Held payout', target: 'PO-9181 (KYC review)' },
  { time: '47m ago', actor: 'Operator Smith', action: 'Issued credit note', target: 'CN-0214 — £58.00' },
  { time: '1h ago', actor: 'System', action: 'Chargeback opened', target: 'TXN-90412 — £312.00' },
];

const FinanceLandingPage: React.FC = () => (
  <div className="min-h-full bg-gradient-to-b from-muted/20 via-background to-background">
    <div className="mx-auto w-full max-w-[1500px] px-8 py-10">
      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Finance Admin
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Finance operations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Transactions, escrow, credits, subscriptions, payouts, commissions, ad spend, and encrypted bank vault.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-[11px]">
          <Activity className="h-3 w-3 text-emerald-500" /> Finance posture nominal
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className={cn('inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums',
                  k.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                  {k.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {k.delta}
                </span>
              </div>
              <div className="text-xl font-semibold tracking-tight tabular-nums">{k.value}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{k.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div>
          <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground mb-3">Sub-portals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUB_PORTALS.map((p) => {
              const Icon = p.icon;
              return (
                <Link key={p.id} to={p.to}
                  className="group rounded-xl border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60">
                      <Icon className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold tabular-nums">{p.count.toLocaleString()}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.countLabel}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-sm font-medium">{p.label}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed mt-0.5">{p.description}</div>
                  </div>
                  <div className="mt-3 flex items-center justify-end text-xs text-foreground/60 group-hover:text-foreground">
                    Open <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground mb-3">Recent activity</h2>
          <div className="rounded-xl border bg-card divide-y">
            {RECENT.map((r, i) => (
              <div key={i} className="p-3.5">
                <div className="text-xs text-muted-foreground">{r.time} · {r.actor}</div>
                <div className="text-sm mt-0.5">{r.action}</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{r.target}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default FinanceLandingPage;
