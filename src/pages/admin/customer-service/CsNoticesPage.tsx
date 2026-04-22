import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Bell, Plus } from 'lucide-react';
import { CsBackLink, CsPageHeader, CsPageShell } from './_shared';

const NOTICES = [
  { id: 'NT-0019', title: 'EU payments delays', body: 'Stripe BNP card declines elevated since 14:00 UTC. Refunds may take 24h longer.', severity: 'warn', surface: 'Customer dashboard', expires: 'in 18h', active: true },
  { id: 'NT-0018', title: 'Mobile app maintenance window', body: 'iOS/Android upload disabled 02:00–04:00 UTC.', severity: 'info', surface: 'Mobile splash', expires: 'tomorrow', active: true },
  { id: 'NT-0017', title: 'Holiday support hours', body: 'Reduced agent hours on bank holidays. Set expectation in chat.', severity: 'info', surface: 'Chat widget', expires: 'in 4d', active: true },
  { id: 'NT-0016', title: 'Bot traffic spike from AS14061', body: 'Internal — operators only. T&S investigating.', severity: 'critical', surface: 'Operator banner', expires: 'in 2h', active: true },
  { id: 'NT-0015', title: 'Payments outage post-mortem', body: 'Resolved 2024-04-12. Preserved for audit.', severity: 'success', surface: 'Status page', expires: 'archived', active: false },
];

const SEV: Record<string, string> = {
  info: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  warn: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  critical: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
};

const CsNoticesPage: React.FC = () => (
  <CsPageShell>
    <CsBackLink />
    <CsPageHeader
      eyebrow="Notices" title="Customer & operator notices"
      subtitle="Status banners, advisories, and operator-only notices. Lead+ can publish."
      right={<Button size="sm" className="h-8 text-xs"><Plus className="h-3.5 w-3.5 mr-1" /> New notice</Button>}
    />

    <div className="space-y-3">
      {NOTICES.map((n) => (
        <div key={n.id} className={cn('rounded-xl border bg-card p-4', !n.active && 'opacity-60')}>
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground">{n.id}</span>
              <Badge className={cn('text-[10px] capitalize border-0', SEV[n.severity])}>{n.severity}</Badge>
              {n.active ? (
                <Badge variant="secondary" className="text-[10px] border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Active</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">Archived</Badge>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">Expires {n.expires}</span>
          </div>
          <h3 className="text-sm font-semibold">{n.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{n.body}</p>
          <div className="mt-2 text-[10px] text-muted-foreground">Surface: {n.surface}</div>
        </div>
      ))}
    </div>
  </CsPageShell>
);

export default CsNoticesPage;
