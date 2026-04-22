import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Activity, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { CsBackLink, CsPageHeader, CsPageShell } from './_shared';

const NOTIFS = [
  { id: 'a1', icon: AlertTriangle, severity: 'critical', title: 'CS-9200 SLA breached', body: 'Bank verification ticket exceeded 1h SLA.', time: '2m', read: false },
  { id: 'a2', icon: AlertTriangle, severity: 'warn', title: 'Refund > $500 pending', body: 'CS-9189 awaiting Finance Admin approval.', time: '14m', read: false },
  { id: 'a3', icon: Activity, severity: 'info', title: 'VIP ticket opened', body: 'AceCorp opened CS-9205 — auto-routed.', time: '22m', read: false },
  { id: 'a4', icon: CheckCircle2, severity: 'success', title: 'Reopen storm cleared', body: '3 tickets reopened in last hour: now resolved.', time: '38m', read: true },
  { id: 'a5', icon: RefreshCw, severity: 'info', title: 'Macro library updated', body: 'New macro published: EU payments delay v2.', time: '1h', read: true },
];

const SEV: Record<string, string> = {
  critical: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  warn: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  info: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
};

const CsNotificationsPage: React.FC = () => (
  <CsPageShell>
    <CsBackLink />
    <CsPageHeader
      eyebrow="Notifications" title="Operator alerts"
      subtitle="SLA breaches, refunds awaiting approval, VIP activity, and system events."
      right={<Button size="sm" variant="outline" className="h-8 text-xs">Mark all read</Button>}
    />

    <div className="rounded-xl border bg-card divide-y overflow-hidden">
      {NOTIFS.map((n) => {
        const Icon = n.icon;
        return (
          <div key={n.id} className={cn('p-4 flex gap-3', !n.read && 'bg-muted/20')}>
            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', SEV[n.severity])}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium">{n.title}</span>
                {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                <span className="text-[10px] text-muted-foreground ml-auto">{n.time} ago</span>
              </div>
              <p className="text-xs text-muted-foreground">{n.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  </CsPageShell>
);

export default CsNotificationsPage;
