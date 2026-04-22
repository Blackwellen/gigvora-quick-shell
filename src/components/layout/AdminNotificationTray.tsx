/**
 * AdminNotificationTray — operational, role-scoped notification dropdown for /admin.
 *
 * Distinct from the user NotificationTray:
 *   - ONLY operational categories (tickets, escalations, fraud, audit, incidents)
 *   - Role-gated server-side AND defense-in-depth client-side
 *   - Live websocket stream indicator with pulse dot
 *   - ML risk badges on fraud/moderation signals
 *   - Cross-portal jump links into the admin shell
 */

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, ShieldAlert, Gavel, Landmark, Headphones, Megaphone,
  ShieldCheck, Activity, FileText, AlertTriangle, ArrowRight,
  CheckCheck, Sparkles, Wifi, WifiOff, ExternalLink,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAdminNotifications,
  useAdminNotificationStream,
  markAdminNotifRead,
  markAllAdminNotifsRead,
  type AdminNotification,
  type AdminNotifCategory,
  type AdminNotifPriority,
} from '@/lib/api/adminNotifications';
import type { AdminRole } from '@/lib/adminAuth';

const CAT_META: Record<AdminNotifCategory, { icon: React.ElementType; label: string; tone: string }> = {
  ticket:     { icon: Headphones,    label: 'Ticket',     tone: 'text-sky-600 bg-sky-500/10' },
  escalation: { icon: AlertTriangle, label: 'Escalation', tone: 'text-amber-600 bg-amber-500/10' },
  dispute:    { icon: Gavel,         label: 'Dispute',    tone: 'text-violet-600 bg-violet-500/10' },
  payout:     { icon: Landmark,      label: 'Payout',     tone: 'text-emerald-600 bg-emerald-500/10' },
  fraud:      { icon: ShieldAlert,   label: 'Fraud',      tone: 'text-rose-600 bg-rose-500/10' },
  moderation: { icon: ShieldCheck,   label: 'Moderation', tone: 'text-indigo-600 bg-indigo-500/10' },
  audit:      { icon: FileText,      label: 'Audit',      tone: 'text-slate-600 bg-slate-500/10' },
  incident:   { icon: Activity,      label: 'Incident',   tone: 'text-rose-700 bg-rose-500/10' },
  system:     { icon: Megaphone,     label: 'System',     tone: 'text-muted-foreground bg-muted' },
};

const PRIORITY_DOT: Record<AdminNotifPriority, string> = {
  critical: 'bg-rose-500',
  high:     'bg-amber-500',
  normal:   'bg-emerald-500',
  low:      'bg-muted-foreground/40',
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

interface Props {
  role: AdminRole;
}

export const AdminNotificationTray: React.FC<Props> = ({ role }) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'all' | 'unread' | 'critical'>('unread');
  const qc = useQueryClient();

  const { data: notifs = [] } = useAdminNotifications(role);
  const { connected } = useAdminNotificationStream(role);

  const unreadCount = useMemo(() => notifs.filter((n) => !n.read).length, [notifs]);
  const criticalCount = useMemo(
    () => notifs.filter((n) => !n.read && n.priority === 'critical').length,
    [notifs],
  );

  const filtered = useMemo(() => {
    if (tab === 'unread') return notifs.filter((n) => !n.read);
    if (tab === 'critical') return notifs.filter((n) => n.priority === 'critical');
    return notifs;
  }, [notifs, tab]);

  const optimisticUpdate = (mutator: (list: AdminNotification[]) => AdminNotification[]) => {
    qc.setQueryData<AdminNotification[]>(['admin', 'notifications', role], (prev) => (prev ? mutator(prev) : prev));
  };

  const handleMarkRead = (id: string) => {
    optimisticUpdate((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    void markAdminNotifRead(id);
  };
  const handleMarkAll = () => {
    optimisticUpdate((list) => list.map((n) => ({ ...n, read: true })));
    void markAllAdminNotifsRead(role);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Admin notifications"
          className="relative h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted/60 transition-colors"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-background tabular-nums',
                criticalCount > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-primary text-primary-foreground',
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[420px] p-0 rounded-xl border shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 pt-3.5 pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShieldAlert className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="leading-tight">
                <div className="text-[12px] font-semibold tracking-tight">Operational Alerts</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  {connected ? (
                    <>
                      <Wifi className="h-2.5 w-2.5 text-emerald-500" />
                      <span>Live · role-scoped</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-2.5 w-2.5 text-amber-500" />
                      <span>Polling · role-scoped</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-[10px] font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {(['unread', 'critical', 'all'] as const).map((t) => {
              const count = t === 'unread' ? unreadCount : t === 'critical' ? criticalCount : notifs.length;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[10px] font-medium capitalize transition-all',
                    tab === t
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted',
                  )}
                >
                  {t}
                  {count > 0 && (
                    <span className={cn('ml-1 tabular-nums', tab === t ? 'opacity-90' : 'opacity-60')}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Critical banner */}
        {criticalCount > 0 && tab !== 'critical' && (
          <button
            onClick={() => setTab('critical')}
            className="w-full px-4 py-2 bg-rose-500/5 border-b border-rose-500/20 flex items-center gap-2 text-left hover:bg-rose-500/10 transition-colors"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-rose-600 shrink-0" />
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
              {criticalCount} critical signal{criticalCount > 1 ? 's' : ''} need review
            </span>
            <ArrowRight className="h-3 w-3 text-rose-600 ml-auto" />
          </button>
        )}

        {/* List */}
        <ScrollArea className="max-h-[440px]">
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="h-12 w-12 rounded-xl bg-muted/40 flex items-center justify-center mx-auto mb-3">
                <Bell className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {tab === 'unread' ? 'All caught up.' : tab === 'critical' ? 'No critical signals.' : 'No alerts yet.'}
              </p>
            </div>
          ) : (
            <ul className="py-1">
              {filtered.map((n) => {
                const meta = CAT_META[n.category];
                const Icon = meta.icon;
                return (
                  <li key={n.id}>
                    <Link
                      to={n.href ?? '#'}
                      onClick={() => {
                        if (!n.read) handleMarkRead(n.id);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex items-start gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors group relative',
                        !n.read && 'bg-primary/[0.025]',
                      )}
                    >
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', meta.tone)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[n.priority])} />
                          <span className={cn('text-[11px] truncate flex-1', !n.read && 'font-semibold')}>
                            {n.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                            {relativeTime(n.at)}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <Badge
                            variant="secondary"
                            className="h-4 text-[9px] px-1.5 font-medium uppercase tracking-wider rounded"
                          >
                            {meta.label}
                          </Badge>
                          {typeof n.mlRisk === 'number' && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'h-4 text-[9px] px-1.5 font-medium rounded gap-1 tabular-nums',
                                n.mlRisk >= 0.85
                                  ? 'border-rose-500/40 text-rose-600 bg-rose-500/5'
                                  : n.mlRisk >= 0.6
                                  ? 'border-amber-500/40 text-amber-600 bg-amber-500/5'
                                  : 'border-emerald-500/40 text-emerald-600 bg-emerald-500/5',
                              )}
                            >
                              <Sparkles className="h-2.5 w-2.5" />
                              ML {(n.mlRisk * 100).toFixed(0)}%
                              {n.mlModel && <span className="opacity-70">· {n.mlModel}</span>}
                            </Badge>
                          )}
                          {n.entityRef && (
                            <span className="text-[9px] text-muted-foreground font-mono">{n.entityRef}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t px-4 py-2.5 flex items-center justify-between bg-muted/10">
          <Link
            to="/admin/audit"
            onClick={() => setOpen(false)}
            className="text-[11px] text-primary hover:text-primary/80 font-medium flex items-center gap-1.5"
          >
            Audit log <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            to="/admin/super/system"
            onClick={() => setOpen(false)}
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            System status <ExternalLink className="h-2.5 w-2.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};
