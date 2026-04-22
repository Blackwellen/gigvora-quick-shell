/**
 * Admin Portal Landing — role-aware launcher for the seven internal portals.
 * Sits at /admin index. Each card filters by the active role's allow-list.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth, type AdminRole } from '@/lib/adminAuth';
import {
  HeadphonesIcon, Gavel, Landmark, ShieldAlert, Megaphone,
  Activity, Shield, ArrowRight, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortalCard {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  to: string;
  count: number;
  countLabel: string;
  accent: string;
  allowedRoles: AdminRole[];
}

const PORTALS: PortalCard[] = [
  {
    id: 'cs',
    label: 'Customer Service',
    description: 'Tickets, escalations, refund follow-ups, account holds.',
    icon: HeadphonesIcon,
    to: '/admin/cs-dashboard',
    count: 28,
    countLabel: 'open tickets',
    accent: 'from-sky-500/15 via-sky-500/5 to-transparent border-sky-500/30',
    allowedRoles: ['super-admin', 'cs-admin'],
  },
  {
    id: 'disputes',
    label: 'Dispute Operations',
    description: 'Arbitration desk, evidence intake, payout reversal review.',
    icon: Gavel,
    to: '/admin/dispute-ops',
    count: 12,
    countLabel: 'active cases',
    accent: 'from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/30',
    allowedRoles: ['super-admin', 'dispute-mgr', 'cs-admin'],
  },
  {
    id: 'finance',
    label: 'Finance Admin',
    description: 'Refunds, holds, payouts, ledger reconciliation, control toggles.',
    icon: Landmark,
    to: '/admin/finance-dashboard',
    count: 7,
    countLabel: 'pending releases',
    accent: 'from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/30',
    allowedRoles: ['super-admin', 'finance-admin', 'compliance'],
  },
  {
    id: 'moderator',
    label: 'Moderator Desk',
    description: 'Content queue, messaging incidents, enforcement actions.',
    icon: ShieldAlert,
    to: '/admin/moderator-dashboard',
    count: 41,
    countLabel: 'in queue',
    accent: 'from-rose-500/15 via-rose-500/5 to-transparent border-rose-500/30',
    allowedRoles: ['super-admin', 'moderator', 'trust-safety'],
  },
  {
    id: 'marketing',
    label: 'Marketing Admin',
    description: 'Ads moderation, campaigns, traffic, SEO, internal comms, KPI cards.',
    icon: Megaphone,
    to: '/admin/marketing',
    count: 18,
    countLabel: 'ads pending',
    accent: 'from-violet-500/15 via-violet-500/5 to-transparent border-violet-500/30',
    allowedRoles: ['super-admin', 'marketing-admin', 'ads-ops'],
  },
  {
    id: 'ops',
    label: 'Admin Operations',
    description: 'Cross-portal triage, queue jump, audit log, entity search.',
    icon: Activity,
    to: '/admin/ops',
    count: 9,
    countLabel: 'cross-team items',
    accent: 'from-slate-500/15 via-slate-500/5 to-transparent border-slate-500/30',
    allowedRoles: ['super-admin', 'cs-admin', 'finance-admin', 'moderator', 'trust-safety', 'dispute-mgr', 'ads-ops', 'compliance', 'marketing-admin'],
  },
  {
    id: 'super',
    label: 'Super Admin',
    description: 'Feature flags, kill switches, platform overrides, role assignment.',
    icon: Shield,
    to: '/admin/super-admin',
    count: 3,
    countLabel: 'open incidents',
    accent: 'from-indigo-500/15 via-indigo-500/5 to-transparent border-indigo-500/30',
    allowedRoles: ['super-admin'],
  },
];

const AdminPortalLandingPage: React.FC = () => {
  const { user, activeRole } = useAdminAuth();
  const visible = PORTALS.filter((p) => p.allowedRoles.includes(activeRole));
  const hidden = PORTALS.length - visible.length;

  return (
    <div className="min-h-full bg-gradient-to-b from-muted/20 via-background to-background">
      <div className="mx-auto w-full max-w-[1400px] px-8 py-10">
        {/* Greeting */}
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Admin terminal
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Welcome back, {user?.displayName ?? 'Operator'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              You have access to {visible.length} portal{visible.length === 1 ? '' : 's'} in this role context.
              {hidden > 0 && ` ${hidden} hidden by role policy.`}
            </p>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1.5 text-right">
            <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium">
              <Activity className="h-3 w-3 text-emerald-500" />
              All systems operational
            </Badge>
            <span className="text-[11px] text-muted-foreground">Signed in as {user?.email ?? '—'}</span>
          </div>
        </div>

        {/* Portal grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.id}
                to={p.to}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all duration-200',
                  'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5',
                  p.accent,
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background/80 ring-1 ring-border/50">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold tabular-nums text-foreground">{p.count}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.countLabel}</div>
                  </div>
                </div>
                <div className="mt-5">
                  <h3 className="text-base font-semibold tracking-tight text-foreground">{p.label}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                </div>
                <div className="mt-5 flex items-center justify-between text-xs font-medium text-foreground/70">
                  <span>Open portal</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>

        {hidden > 0 && (
          <div className="mt-8 rounded-xl border border-dashed bg-muted/20 px-5 py-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{hidden} portal{hidden === 1 ? '' : 's'} hidden.</span>{' '}
            Switch to <span className="font-medium text-foreground">Super Admin</span> to view all portals,
            or contact a Super Admin to request access.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPortalLandingPage;
