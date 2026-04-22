import React from 'react';
import { ModPageShell, ModPageHeader, ModBackLink, ModTable, ModBadge } from './_shared';

const rows = [
  ['co_220', 'Acme Co.', 'Verified', '128 employees', <ModBadge tone="success">Healthy</ModBadge>],
  ['co_219', 'Lyra Labs', 'Verified', '42 employees', <ModBadge tone="warn">2 reports</ModBadge>],
  ['co_217', 'Northwind Holdings', 'Pending', '18 employees', <ModBadge tone="info">KYB review</ModBadge>],
  ['co_215', 'Phantom LLC', 'Unverified', '3 employees', <ModBadge tone="danger">Risk</ModBadge>],
];

export default function ModCompaniesPage() {
  return (
    <ModPageShell>
      <ModBackLink />
      <ModPageHeader eyebrow="Orgs" title="Companies Review" subtitle="Company / org records under review — verification, reports, and risk classification." />
      <ModTable headers={['ID', 'Name', 'Verification', 'Size', 'Status']} rows={rows} />
    </ModPageShell>
  );
}
