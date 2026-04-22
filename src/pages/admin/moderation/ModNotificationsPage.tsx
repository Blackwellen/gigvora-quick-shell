import React from 'react';
import { ModPageShell, ModPageHeader, ModBackLink, ModBadge } from './_shared';

const items = [
  { t: 'New high-risk signal flagged', who: 'ML pipeline', when: '2m', tone: 'danger' as const },
  { t: 'SLA at 80% — MOD-9281', who: 'SLA monitor', when: '6m', tone: 'warn' as const },
  { t: 'Senior approval required for ban', who: 's.osei', when: '14m', tone: 'info' as const },
  { t: 'Appeal received on case 9270', who: 'r.kahan', when: '38m', tone: 'neutral' as const },
];

export default function ModNotificationsPage() {
  return (
    <ModPageShell>
      <ModBackLink />
      <ModPageHeader eyebrow="Alerts" title="Moderator Notifications" subtitle="In-product alerts for SLA breaches, escalations, approvals, and appeal events." />
      <div className="rounded-xl border bg-card divide-y">
        {items.map((n, i) => (
          <div key={i} className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium">{n.t}</div>
              <div className="text-[11px] text-muted-foreground">{n.who} · {n.when} ago</div>
            </div>
            <ModBadge tone={n.tone}>{n.tone}</ModBadge>
          </div>
        ))}
      </div>
    </ModPageShell>
  );
}
