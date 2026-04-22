import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsBadge } from './_shared';

const items = [
  { t: 'CMS v3.2 deploy starting in 30m', who: 'release-bot', when: '5m', tone: 'info' as const },
  { t: 'API error rate above 0.5% threshold', who: 'metrics', when: '14m', tone: 'warn' as const },
  { t: 'Backup completed successfully', who: 'database', when: '1h', tone: 'success' as const },
  { t: 'New super-admin sign-in from new device', who: 'security', when: '2h', tone: 'danger' as const },
];

export default function OpsNotificationsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Alerts" title="Admin Notifications" subtitle="Platform alerts, deployment events, security signals, and scheduled job results." />
      <div className="rounded-xl border bg-card divide-y">
        {items.map((n, i) => (
          <div key={i} className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium">{n.t}</div>
              <div className="text-[11px] text-muted-foreground">{n.who} · {n.when} ago</div>
            </div>
            <OpsBadge tone={n.tone}>{n.tone}</OpsBadge>
          </div>
        ))}
      </div>
    </OpsPageShell>
  );
}
