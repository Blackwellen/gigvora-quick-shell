import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsTable, OpsBadge } from './_shared';

const rows = [
  ['NT-91', 'Scheduled maintenance Sunday 02:00 UTC', 'All users', <OpsBadge tone="info">Active</OpsBadge>, 'platform-ops'],
  ['NT-90', 'New API v3 endpoints available', 'Developers', <OpsBadge tone="info">Active</OpsBadge>, 'r.kahan'],
  ['NT-88', 'Revised tax invoicing for EU customers', 'EU sellers', <OpsBadge tone="warn">Important</OpsBadge>, 'finance'],
];

export default function OpsNoticesPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Notices" title="Site & Targeted Notices" subtitle="Site-wide notices, audience-targeted advisories, and scheduled platform announcements." />
      <OpsTable headers={['ID', 'Title', 'Audience', 'Status', 'Owner']} rows={rows} />
    </OpsPageShell>
  );
}
