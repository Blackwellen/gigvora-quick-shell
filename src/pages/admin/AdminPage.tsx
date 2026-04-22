/**
 * AdminPage — Admin Terminal Root Portal (AD-016).
 *
 * Enterprise-grade portal hub: KPI strip, role-aware portal cards with live
 * queue counts and unread badges, recent cross-portal activity, and a quick-
 * jump action rail. Replaces the legacy 11-tab in-page admin.
 */

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth, type AdminRole } from '@/lib/adminAuth';
import { useAdminPortalCounts, type PortalId } from '@/lib/api/adminPortals';
import { MessageUserDialog } from '@/components/admin/MessageUserDialog';
import {
  Shield, HeadphonesIcon, Gavel, Landmark, ShieldAlert, ShieldCheck,
  Megaphone, Radio, UserCheck, Activity, Search, History, Flag,
  AlertOctagon, Users, TrendingUp, Zap, Eye, ArrowUpRight, Clock,
  Send,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'info' | 'warn' | 'danger' | 'success';

interface Portal {
  id: PortalId;
  label: string;
  blurb: string;
  path: string;
  icon: LucideIcon;
  /** Live queue depth (resolved from backend at render). */
  queue: number;
  /** Items needing attention (resolved from backend at render). */
  attention: number;
  /** Unread comms (resolved from backend at render). */
  unread: number;
  /** Roles that may view this card. */
  allowedRoles: AdminRole[];
  tone: Tone;
}

const ALL_ROLES: AdminRole[] = [
  'super-admin', 'cs-admin', 'finance-admin', 'moderator',
  'trust-safety', 'dispute-mgr', 'ads-ops', 'compliance', 'marketing-admin',
];

/** Portal definitions WITHOUT counts — counts are merged from the backend SDK. */
const PORTAL_DEFS: Omit<Portal, 'queue' | 'attention' | 'unread'>[] = [
  { id: 'cs', label: 'Customer Service', icon: HeadphonesIcon, path: '/admin/cs',
    blurb: 'Tickets, customer chat, escalations, SLA posture.',
    tone: 'info', allowedRoles: ['super-admin', 'cs-admin'] },
  { id: 'dispute', label: 'Dispute Handler', icon: Gavel, path: '/admin/dispute-ops',
    blurb: 'Open disputes, evidence, refund decisions, chargebacks.',
    tone: 'warn', allowedRoles: ['super-admin', 'dispute-mgr', 'cs-admin'] },
  { id: 'finance', label: 'Finance', icon: Landmark, path: '/admin/finance',
    blurb: 'Transactions, escrow, payouts, credits, commissions.',
    tone: 'info', allowedRoles: ['super-admin', 'finance-admin', 'compliance'] },
  { id: 'moderation', label: 'Moderator', icon: ShieldAlert, path: '/admin/moderation',
    blurb: 'Reports queue, live feed review, content moderation.',
    tone: 'warn', allowedRoles: ['super-admin', 'moderator', 'trust-safety'] },
  { id: 'trust', label: 'Trust & Safety', icon: ShieldCheck, path: '/admin/trust-safety',
    blurb: 'Risk signals, fraud cases, account integrity reviews.',
    tone: 'danger', allowedRoles: ['super-admin', 'trust-safety'] },
  { id: 'verification', label: 'Verification', icon: UserCheck, path: '/admin/verification-compliance',
    blurb: 'KYB/KYC queue, document review, compliance posture.',
    tone: 'info', allowedRoles: ['super-admin', 'trust-safety', 'compliance'] },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, path: '/admin/marketing',
    blurb: 'Campaigns, ad records, traffic, IP & geo, SEO.',
    tone: 'neutral', allowedRoles: ['super-admin', 'marketing-admin', 'ads-ops'] },
  { id: 'ads', label: 'Ads Ops', icon: Radio, path: '/admin/ads-ops',
    blurb: 'Ads moderation, creative review, advertiser disputes.',
    tone: 'neutral', allowedRoles: ['super-admin', 'ads-ops', 'marketing-admin'] },
  { id: 'ops', label: 'Admin Ops', icon: Activity, path: '/admin/ops',
    blurb: 'Cross-team triage, internal lists, site control settings.',
    tone: 'neutral', allowedRoles: ALL_ROLES },
  { id: 'super', label: 'Super Admin', icon: Shield, path: '/admin/super',
    blurb: 'KPI manager, feature flags, entitlements, emergency posture.',
    tone: 'success', allowedRoles: ['super-admin'] },
];

const TONE_CHIP: Record<Tone, string> = {
  neutral: 'bg-muted text-foreground/70',
  info: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  warn: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
};

const TONE_ICON_BG: Record<Tone, string> = {
  neutral: 'bg-muted text-foreground/70 ring-1 ring-border',
  info: 'bg-sky-500/10 text-sky-600 dark:text-sky-300 ring-1 ring-sky-500/20',
  warn: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 ring-1 ring-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-300 ring-1 ring-rose-500/20',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/20',
};

/** Left accent rail color per tone (subtle vertical bar on portal cards). */
const TONE_RAIL: Record<Tone, string> = {
  neutral: 'before:bg-border',
  info: 'before:bg-sky-500/40',
  warn: 'before:bg-amber-500/50',
  danger: 'before:bg-rose-500/50',
  success: 'before:bg-emerald-500/50',
};

const Kpi: React.FC<{ label: string; value: string; hint?: string; icon: LucideIcon; positive?: boolean }> = ({
  label, value, hint, icon: Icon, positive,
}) => (
  <div className="rounded-xl border bg-card p-4 hover:border-foreground/15 transition-colors">
    <div className="flex items-center justify-between mb-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {hint && (
        <span className={cn(
          'text-[10px] font-medium tabular-nums',
          positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
        )}>
          {hint}
        </span>
      )}
    </div>
    <div className="text-[22px] font-semibold tracking-tight tabular-nums leading-none">{value}</div>
    <div className="text-[11px] text-muted-foreground mt-1.5">{label}</div>
  </div>
);

const PortalCard: React.FC<{ p: Portal }> = ({ p }) => {
  const Icon = p.icon;
  const hasAttention = p.attention > 0;
  return (
    <Link
      to={p.path}
      className={cn(
        'group relative rounded-2xl border bg-card p-5 transition-all',
        'hover:border-foreground/20 hover:shadow-[0_4px_20px_-8px_hsl(var(--foreground)/0.12)] hover:-translate-y-px',
        // Accent rail
        'overflow-hidden',
        'before:absolute before:left-0 before:top-4 before:bottom-4 before:w-[3px] before:rounded-r-full before:opacity-60 group-hover:before:opacity-100 before:transition-opacity',
        TONE_RAIL[p.tone],
      )}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', TONE_ICON_BG[p.tone])}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[14px] font-semibold tracking-tight truncate">{p.label}</div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 -translate-x-0.5 translate-y-0.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all shrink-0" />
          </div>
          <div className="text-[12px] text-muted-foreground/90 line-clamp-2 mt-1 leading-relaxed">{p.blurb}</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap pt-3 border-t border-border/60">
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium tabular-nums', TONE_CHIP[p.tone])}>
          {p.queue.toLocaleString()} in queue
        </span>
        {hasAttention && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-500/10 text-rose-700 dark:text-rose-300 tabular-nums">
            <AlertOctagon className="h-3 w-3" /> {p.attention}
          </span>
        )}
        {p.unread > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary tabular-nums">
            {p.unread} unread
          </span>
        )}
      </div>
    </Link>
  );
};

const ACTIVITY = [
  { id: 1, when: '4m ago', actor: 'a.fenton', action: 'paused flag', detail: 'ff_legacy_inbox', tone: 'warn' as Tone, icon: Flag },
  { id: 2, when: '12m ago', actor: 'r.kahan', action: 'resolved dispute', detail: 'DSP-4421 (£1,250 refund)', tone: 'success' as Tone, icon: Gavel },
  { id: 3, when: '34m ago', actor: 'l.park', action: 'released payout batch', detail: '£182,400 to 1,182 users', tone: 'info' as Tone, icon: Landmark },
  { id: 4, when: '1h ago', actor: 'super-admin', action: 'invited admin', detail: 's.osei (Customer Service)', tone: 'neutral' as Tone, icon: Users },
  { id: 5, when: '2h ago', actor: 'm.diallo', action: 'closed verification', detail: 'KYB-882 (Acme Co. approved)', tone: 'success' as Tone, icon: UserCheck },
];

const AdminPage: React.FC = () => {
  const { user, activeRole } = useAdminAuth();
  const { data: counts, isFetching } = useAdminPortalCounts();
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  const visiblePortals = useMemo<Portal[]>(
    () =>
      PORTAL_DEFS
        .filter((p) => p.allowedRoles.includes(activeRole))
        .map((p) => {
          const c = counts?.[p.id] ?? { queue: 0, attention: 0, unread: 0 };
          return { ...p, queue: c.queue, attention: c.attention, unread: c.unread };
        }),
    [activeRole, counts],
  );

  const totalQueue = visiblePortals.reduce((sum, p) => sum + p.queue, 0);
  const totalAttention = visiblePortals.reduce((sum, p) => sum + p.attention, 0);
  const totalUnread = visiblePortals.reduce((sum, p) => sum + p.unread, 0);
  

  return (
    <div className="mx-auto w-full max-w-[1500px] px-6 lg:px-8 py-8">
      {/* ─── Page header ─── */}
      <div className="mb-7 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-primary/10 text-primary">
              <Shield className="h-3 w-3" />
            </span>
            Admin Terminal · Portal Home
            <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] tracking-normal normal-case">
              <span className={cn(
                'h-1.5 w-1.5 rounded-full bg-emerald-500',
                isFetching ? 'animate-pulse' : '',
              )} />
              Live
            </span>
          </div>
          <h1 className="mt-2.5 text-[26px] font-semibold tracking-tight leading-tight">
            Welcome back{user?.displayName ? `, ${user.displayName}` : ''}
          </h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground max-w-2xl leading-relaxed">
            {user?.isSuperAdmin
              ? 'You have full access to every portal. Use the role switcher in the header to view the terminal as another role.'
              : 'Your portals are listed below. Cross-portal navigation is also available from the left rail.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMessageDialogOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Send className="h-3.5 w-3.5" /> Message any user
          </button>
          <Link
            to="/admin/search"
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-[12px] font-medium hover:bg-muted/60 hover:border-foreground/20 transition-colors"
          >
            <Search className="h-3.5 w-3.5" /> Entity search
          </Link>
          <Link
            to="/admin/audit"
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-[12px] font-medium hover:bg-muted/60 hover:border-foreground/20 transition-colors"
          >
            <History className="h-3.5 w-3.5" /> Audit log
          </Link>
        </div>
      </div>

      <MessageUserDialog
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        asRole={activeRole}
      />

      {/* ─── KPI strip ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <Kpi label="Open work items" value={totalQueue.toLocaleString()} hint={`${visiblePortals.length} portals`} icon={Activity} />
        <Kpi label="Need attention" value={totalAttention.toLocaleString()} hint="across portals" icon={AlertOctagon} />
        <Kpi label="Unread" value={totalUnread.toLocaleString()} hint="comms & notices" icon={Eye} />
        <Kpi label="Active sessions" value="1,284" hint="+3.2%" positive icon={Users} />
        <Kpi label="Revenue MTD" value="£89.4K" hint="+15% MoM" positive icon={TrendingUp} />
        <Kpi label="System health" value="99.98%" hint="all green" positive icon={Zap} />
      </div>

      {/* ─── Portals ─── */}
      <div className="flex items-baseline justify-between mb-3.5">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-[15px] font-semibold tracking-tight">Your portals</h2>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {visiblePortals.length} accessible
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          viewing as <span className="font-medium text-foreground/80 capitalize">{activeRole.replace('-', ' ')}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-8">
        {visiblePortals.map((p) => <PortalCard key={p.id} p={p} />)}
      </div>

      {/* ─── Recent activity ─── */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <div>
            <div className="text-[14px] font-semibold">Recent cross-portal activity</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">High-signal events from the audit trail.</div>
          </div>
          <Link to="/admin/audit" className="text-[12px] font-medium text-primary hover:underline inline-flex items-center gap-1">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <ul className="divide-y">
          {ACTIVITY.map((a) => {
            const Icon = a.icon;
            return (
              <li key={a.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                <div className={cn('h-7 w-7 rounded-md flex items-center justify-center shrink-0', TONE_ICON_BG[a.tone])}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px]">
                    <span className="font-medium">{a.actor}</span>{' '}
                    <span className="text-muted-foreground">{a.action}</span>{' '}
                    <span className="font-mono text-[12px]">{a.detail}</span>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground tabular-nums inline-flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3" /> {a.when}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default AdminPage;
