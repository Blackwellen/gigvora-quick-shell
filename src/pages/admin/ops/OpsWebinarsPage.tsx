import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsTable, OpsBadge } from './_shared';

const rows = [
  ['web_551', 'Scaling a B2B agency', '@growthlab', 'Tomorrow 14:00', <OpsBadge tone="success">Confirmed</OpsBadge>, '412 reg.'],
  ['web_549', 'AI in product design', '@designcraft', 'Fri 18:00', <OpsBadge tone="info">Sold out</OpsBadge>, '500 reg.'],
  ['web_545', 'Hiring senior engineers', '@lyra_labs', 'Next Mon 11:00', <OpsBadge tone="warn">Low signups</OpsBadge>, '38 reg.'],
];

export default function OpsWebinarsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Catalog" title="Webinars" subtitle="All scheduled and live webinar events across the platform." />
      <OpsTable headers={['ID', 'Title', 'Host', 'When', 'Status', 'Registered']} rows={rows} />
    </OpsPageShell>
  );
}
