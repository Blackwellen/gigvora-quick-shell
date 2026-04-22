import React from 'react';
import { ModPageShell, ModPageHeader, ModBackLink, ModTable, ModBadge } from './_shared';

const rows = [
  ['T-2451', 'Re-review video #vd_8821', 'Trust review', <ModBadge tone="warn">Due today</ModBadge>, 'unassigned'],
  ['T-2450', 'Cross-check IP infringement claim', 'Legal', <ModBadge tone="danger">Overdue</ModBadge>, 'r.kahan'],
  ['T-2447', 'Bulk-unbleach archived comments', 'Cleanup', <ModBadge tone="neutral">This week</ModBadge>, 's.osei'],
  ['T-2440', 'Verify identity dispute escalation', 'Identity', <ModBadge tone="info">In review</ModBadge>, 'a.fenton'],
];

export default function ModTasksPage() {
  return (
    <ModPageShell>
      <ModBackLink />
      <ModPageHeader eyebrow="Tasks" title="Delegated Tasks" subtitle="Cross-team moderation work delegated by senior moderators or Trust & Safety leads." />
      <ModTable headers={['Task', 'Title', 'Stream', 'Status', 'Owner']} rows={rows} />
    </ModPageShell>
  );
}
