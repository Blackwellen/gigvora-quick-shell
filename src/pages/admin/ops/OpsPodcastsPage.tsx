import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsTable, OpsBadge } from './_shared';

const rows = [
  ['pod_120', 'Product Builders', '@growthlab', '34 episodes', <OpsBadge tone="success">Active</OpsBadge>, '128K downloads'],
  ['pod_118', 'Design at Scale', '@designcraft', '12 episodes', <OpsBadge tone="success">Active</OpsBadge>, '42K downloads'],
  ['pod_115', 'Founders Unfiltered', '@sarah_io', '8 episodes', <OpsBadge tone="warn">Hiatus</OpsBadge>, '18K downloads'],
];

export default function OpsPodcastsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Catalog" title="Podcasts" subtitle="All podcasts and episode catalogs hosted on the platform." />
      <OpsTable headers={['ID', 'Show', 'Host', 'Episodes', 'Status', 'Downloads']} rows={rows} />
    </OpsPageShell>
  );
}
