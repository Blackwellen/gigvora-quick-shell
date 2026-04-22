import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsTable, OpsBadge } from './_shared';
import { Inbox } from 'lucide-react';

const rows = [
  ['OPS-3321', 'Bulk-archive stale gigs', <OpsBadge tone="warn">Medium</OpsBadge>, 'open', 'Catalog', 'unassigned'],
  ['OPS-3318', 'Reconcile webinar attendance counts', <OpsBadge tone="info">Low</OpsBadge>, 'triaging', 'Analytics', 'a.fenton'],
  ['OPS-3315', 'Investigate API rate-limit spike', <OpsBadge tone="danger">High</OpsBadge>, 'open', 'Platform', 'r.kahan'],
  ['OPS-3310', 'Update T&C clause 8.4', <OpsBadge tone="info">Legal</OpsBadge>, 'holding', 'Legal', 'compliance'],
];

export default function OpsTicketsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Tickets" title="Operations Tickets" subtitle="Cross-team operational tickets routed by domain, severity, and owner." right={<button className="rounded-lg bg-primary text-primary-foreground text-[12px] font-medium px-3 py-1.5 inline-flex items-center gap-1.5"><Inbox className="h-3.5 w-3.5" /> New ticket</button>} />
      <OpsTable headers={['ID', 'Subject', 'Severity', 'Status', 'Domain', 'Owner']} rows={rows} />
    </OpsPageShell>
  );
}
