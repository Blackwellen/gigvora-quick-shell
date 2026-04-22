import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsTable, OpsBadge } from './_shared';

const rows = [
  ['ent_42', 'Acme Co. Group', 'Enterprise+', '£420,000 ARR', '128 seats', <OpsBadge tone="success">Renewing</OpsBadge>],
  ['ent_38', 'Northwind Holdings', 'Enterprise', '£180,000 ARR', '54 seats', <OpsBadge tone="info">In renewal</OpsBadge>],
  ['ent_31', 'Phantom Industries', 'Enterprise', '£96,000 ARR', '28 seats', <OpsBadge tone="warn">At risk</OpsBadge>],
];

export default function OpsEnterprisePage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Catalog" title="Enterprise Accounts" subtitle="Managed enterprise tenants — contract value, seat counts, and renewal posture." />
      <OpsTable headers={['ID', 'Account', 'Tier', 'ARR', 'Seats', 'Status']} rows={rows} />
    </OpsPageShell>
  );
}
