import React from 'react';
import { ModPageShell, ModPageHeader, ModBackLink, ModTable, ModBadge } from './_shared';

const rows = [
  ['u_1182', '@sarah_io', 'UK', '2 reports', <ModBadge tone="success">Active</ModBadge>],
  ['u_5510', '@mark.k', 'US', '7 reports', <ModBadge tone="warn">Watch</ModBadge>],
  ['u_8810', '@anon_99', 'Unknown', '12 reports', <ModBadge tone="danger">Suspended</ModBadge>],
  ['u_2210', '@designcraft', 'IE', '0 reports', <ModBadge tone="success">Active</ModBadge>],
];

export default function ModUsersPage() {
  return (
    <ModPageShell>
      <ModBackLink />
      <ModPageHeader eyebrow="Accounts" title="Users Review" subtitle="User accounts under moderation review — report counts, geo signals, and suspension state." />
      <ModTable headers={['ID', 'Handle', 'Region', 'Reports', 'Status']} rows={rows} />
    </ModPageShell>
  );
}
