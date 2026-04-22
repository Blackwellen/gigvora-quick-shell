import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsTable, OpsBadge } from './_shared';

const rows = [
  ['gig_4421', 'Brand identity sprint', '@designcraft', '£420', <OpsBadge tone="success">Live</OpsBadge>, '128 sales'],
  ['gig_4418', 'Pitch-deck makeover', '@sarah_io', '£280', <OpsBadge tone="success">Live</OpsBadge>, '64 sales'],
  ['gig_4410', 'Landing-page copy', '@mark.k', '£180', <OpsBadge tone="warn">Under review</OpsBadge>, '12 sales'],
  ['gig_4402', 'Logo design package', '@designcraft', '£150', <OpsBadge tone="success">Live</OpsBadge>, '298 sales'],
  ['gig_4391', 'SEO audit', '@growthlab', '£320', <OpsBadge tone="neutral">Paused</OpsBadge>, '41 sales'],
];

export default function OpsGigsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Catalog" title="Gigs" subtitle="Canonical list of all productized gig listings across the marketplace." />
      <OpsTable headers={['ID', 'Title', 'Seller', 'Starting price', 'Status', 'Volume']} rows={rows} />
    </OpsPageShell>
  );
}
