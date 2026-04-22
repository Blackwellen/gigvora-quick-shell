import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsTable, OpsBadge } from './_shared';

const rows = [
  ['T-991', 'Verify CMS publish pipeline', 'Engineering', <OpsBadge tone="warn">Today</OpsBadge>, 'unassigned'],
  ['T-988', 'Audit OAuth callback URLs', 'Security', <OpsBadge tone="info">This week</OpsBadge>, 's.osei'],
  ['T-980', 'Refresh enterprise contact list', 'Sales Ops', <OpsBadge tone="neutral">Backlog</OpsBadge>, 'a.fenton'],
];

export default function OpsTasksPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Tasks" title="Delegated Tasks" subtitle="Cross-functional admin work delegated across engineering, security, sales ops, and compliance." />
      <OpsTable headers={['Task', 'Title', 'Stream', 'Status', 'Owner']} rows={rows} />
    </OpsPageShell>
  );
}
