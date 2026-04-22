import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsTable, OpsBadge } from './_shared';

const rows = [
  ['proj_8810', 'Mobile app rebuild', 'Acme Co.', '£42,000', <OpsBadge tone="success">In progress</OpsBadge>, '4 / 8 milestones'],
  ['proj_8807', 'Brand refresh', 'Lyra Labs', '£12,500', <OpsBadge tone="info">Kickoff</OpsBadge>, '0 / 5 milestones'],
  ['proj_8801', 'Marketing site overhaul', 'Northwind', '£18,200', <OpsBadge tone="warn">At risk</OpsBadge>, '2 / 6 milestones'],
];

export default function OpsProjectsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Catalog" title="Projects" subtitle="All active project workspaces, their clients, contract value, and milestone progress." />
      <OpsTable headers={['ID', 'Title', 'Client', 'Contract', 'Status', 'Progress']} rows={rows} />
    </OpsPageShell>
  );
}
