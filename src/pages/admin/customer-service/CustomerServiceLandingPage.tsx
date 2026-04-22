/**
 * Customer Service Admin Portal — landing (AD-018).
 * KPI strip + sub-portal grid + recent escalations.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  HeadphonesIcon, Inbox, MessageSquare, Mail, Bell, ListTodo,
  StickyNote, Users, BarChart3, GitBranch, LayoutGrid, Activity,
  Sparkles, ArrowRight, TrendingUp, TrendingDown, Clock, AlertTriangle,
} from 'lucide-react';

const KPIS = [
  { label: 'Open tickets', value: '184', delta: '+12', positive: false, icon: Inbox },
  { label: 'SLA at-risk', value: '7', delta: '+2', positive: false, icon: AlertTriangle },
  { label: 'Avg first response', value: '6m 14s', delta: '−42s', positive: true, icon: Clock },
  { label: 'CSAT (7d)', value: '4.62', delta: '+0.08', positive: true, icon: TrendingUp },
  { label: 'Resolved today', value: '94', delta: '+18', positive: true, icon: Activity },
  { label: 'Escalations open', value: '11', delta: '+3', positive: false, icon: AlertTriangle },
];

const SUB_PORTALS = [
  { id: 'tickets', label: 'Tickets', description: 'Live queue, filters by status, priority, queue, and agent.', icon: Inbox, to: '/admin/cs/tickets', count: 184, countLabel: 'open' },
  { id: 'escalations', label: 'Routing & Escalations', description: 'Escalation paths, rules, and SLA breach handling.', icon: GitBranch, to: '/admin/cs/escalations', count: 11, countLabel: 'open' },
  { id: 'tasks', label: 'Delegated Tasks', description: 'Tasks delegated across CS, Trust & Safety, and Finance.', icon: ListTodo, to: '/admin/cs/tasks', count: 23, countLabel: 'open' },
  { id: 'internal-chat', label: 'Internal Chat', description: 'Team chat for case collaboration and shift handover.', icon: MessageSquare, to: '/admin/cs/internal-chat', count: 8, countLabel: 'unread' },
  { id: 'customer-chat', label: 'Customer Chat', description: 'Live customer conversations with handoff to tickets.', icon: Users, to: '/admin/cs/customer-chat', count: 14, countLabel: 'live' },
  { id: 'emails', label: 'Email Console', description: 'Outbound transactional + reply-to-customer threads.', icon: Mail, to: '/admin/cs/emails', count: 47, countLabel: 'today' },
  { id: 'notes', label: 'Internal Notes', description: 'Cross-ticket internal notes, pinned advisories, runbooks.', icon: StickyNote, to: '/admin/cs/notes', count: 38, countLabel: 'recent' },
  { id: 'notices', label: 'Notices', description: 'Customer-facing notices, status banners, advisories.', icon: Bell, to: '/admin/cs/notices', count: 4, countLabel: 'active' },
  { id: 'notifications', label: 'Notifications', description: 'Operator alerts: SLA breaches, refunds, VIP tickets.', icon: Activity, to: '/admin/cs/notifications', count: 19, countLabel: 'unread' },
  { id: 'analytics', label: 'Stats & Analytics', description: 'Volume, response time, CSAT, agent leaderboards.', icon: BarChart3, to: '/admin/cs/analytics', count: 0, countLabel: 'live' },
  { id: 'kpi-cards', label: 'Custom KPI Cards', description: 'Super-admin defined KPI cards exposed to CS dashboards.', icon: LayoutGrid, to: '/admin/cs/kpi-cards', count: 6, countLabel: 'cards' },
];

const RECENT = [
  { time: '2m ago', actor: 'Operator Park', action: 'Escalated ticket', target: 'CS-9182 → Trust & Safety' },
  { time: '8m ago', actor: 'Operator Lin', action: 'Refunded order', target: 'ORD-32108 — $148.00' },
  { time: '17m ago', actor: 'System', action: 'SLA breach warning', target: 'CS-9117 (waiting 47m)' },
  { time: '34m ago', actor: 'Operator Rivera', action: 'Resolved ticket', target: 'CS-9088 — Account access' },
  { time: '1h ago', actor: 'Operator Chen', action: 'Posted notice', target: 'NT-0019 — EU payments delay' },
];

const CustomerServiceLandingPage: React.FC = () => {
  return (
    <div className="min-h-full bg-gradient-to-b from-muted/20 via-background to-background">
      <div className="mx-auto w-full max-w-[1500px] px-8 py-10">
        <div className="flex items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Customer Service Admin
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Customer service operations</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tickets, escalations, internal + customer chat, email, notices, tasks, notifications, KPI cards, and analytics.
            </p>
          </div>
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-[11px]">
            <Activity className="h-3 w-3 text-emerald-500" /> CS posture nominal
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
};

export default CustomerServiceLandingPage;
