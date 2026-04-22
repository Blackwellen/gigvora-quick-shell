import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsTable, OpsBadge } from './_shared';

const rows = [
  ['rl_9921', 'Office tour 60s', '@sarah_io', <OpsBadge tone="success">Published</OpsBadge>, '482K views'],
  ['rl_9918', 'Design tip #14', '@designcraft', <OpsBadge tone="success">Published</OpsBadge>, '218K views'],
  ['rl_9914', 'Hiring advice in 30s', '@growthlab', <OpsBadge tone="warn">Flagged</OpsBadge>, '12K views'],
];

export default function OpsReelsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Catalog" title="Reels" subtitle="All short-form reels across the platform with moderation status." />
      <OpsTable headers={['ID', 'Title', 'Author', 'Status', 'Views']} rows={rows} />
    </OpsPageShell>
  );
}
