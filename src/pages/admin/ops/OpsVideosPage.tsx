import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsTable, OpsBadge } from './_shared';

const rows = [
  ['vd_8821', 'Product walkthrough Q4', '@sarah_io', '12:42', <OpsBadge tone="success">Published</OpsBadge>, '184K views'],
  ['vd_8810', 'Behind the scenes — rebrand', '@designcraft', '08:21', <OpsBadge tone="success">Published</OpsBadge>, '67K views'],
  ['vd_8801', 'AMA: scaling B2B', '@growthlab', '54:10', <OpsBadge tone="info">Processing</OpsBadge>, '—'],
];

export default function OpsVideosPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Catalog" title="Videos" subtitle="All long-form videos, their authors, and engagement." />
      <OpsTable headers={['ID', 'Title', 'Author', 'Duration', 'Status', 'Views']} rows={rows} />
    </OpsPageShell>
  );
}
