import React from 'react';
import { ModPageShell, ModPageHeader, ModBackLink, ModTable, ModBadge } from './_shared';
import { Inbox } from 'lucide-react';

const rows = [
  ['MOD-9281', 'Harassment in DMs', <ModBadge tone="danger">High</ModBadge>, 'open', '2h SLA', 'a.fenton'],
  ['MOD-9276', 'Suspicious paid promo', <ModBadge tone="warn">Medium</ModBadge>, 'triaging', '6h SLA', 'unassigned'],
  ['MOD-9270', 'Trademark complaint', <ModBadge tone="info">Legal</ModBadge>, 'escalated', '24h SLA', 'r.kahan'],
  ['MOD-9265', 'NSFW image — auto flagged', <ModBadge tone="danger">High</ModBadge>, 'open', '1h SLA', 'unassigned'],
  ['MOD-9261', 'Spam comments on reel', <ModBadge tone="neutral">Low</ModBadge>, 'holding', '48h SLA', 's.osei'],
];

export default function ModTicketsPage() {
  return (
    <ModPageShell>
      <ModBackLink />
      <ModPageHeader eyebrow="Tickets" title="Moderation Tickets" subtitle="User-reported moderation tickets queued by severity, SLA timer, and assignment." right={<button className="rounded-lg bg-primary text-primary-foreground text-[12px] font-medium px-3 py-1.5 inline-flex items-center gap-1.5"><Inbox className="h-3.5 w-3.5" /> Claim next</button>} />
      <ModTable headers={['ID', 'Subject', 'Severity', 'Status', 'SLA', 'Assignee']} rows={rows} />
    </ModPageShell>
  );
}
