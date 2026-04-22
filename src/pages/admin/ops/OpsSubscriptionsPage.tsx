import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsTable, OpsBadge } from './_shared';

const rows = [
  ['sub_4421', '@sarah_io', 'Pro · Monthly', '£24', <OpsBadge tone="success">Active</OpsBadge>, 'Renews 12 May'],
  ['sub_4418', '@designcraft', 'Pro · Annual', '£240', <OpsBadge tone="success">Active</OpsBadge>, 'Renews 04 Sep'],
  ['sub_4410', 'Acme Co.', 'Enterprise+', '£420,000', <OpsBadge tone="info">Renewal</OpsBadge>, '14 days left'],
  ['sub_4395', '@mark.k', 'Pro · Monthly', '£24', <OpsBadge tone="warn">Past due</OpsBadge>, 'Retry tomorrow'],
];

export default function OpsSubscriptionsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Catalog" title="Subscriptions" subtitle="All plan and billing subscriptions across users and enterprise accounts." />
      <OpsTable headers={['ID', 'Account', 'Plan', 'Amount', 'Status', 'Next event']} rows={rows} />
    </OpsPageShell>
  );
}
