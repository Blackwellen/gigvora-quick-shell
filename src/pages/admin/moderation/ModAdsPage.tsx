import React from 'react';
import { ModPageShell, ModPageHeader, ModBackLink, ModTable, ModBadge } from './_shared';

const rows = [
  ['ad_3321', 'Spring sale — 50% off', 'Acme Co.', <ModBadge tone="warn">Claim review</ModBadge>, '£840'],
  ['ad_3320', 'Hire developers fast', 'Lyra Labs', <ModBadge tone="success">Approved</ModBadge>, '£2,100'],
  ['ad_3318', 'Crypto returns guaranteed', 'unknown', <ModBadge tone="danger">Rejected</ModBadge>, '£0'],
  ['ad_3317', 'Mentorship cohort', 'Northwind', <ModBadge tone="info">Pending</ModBadge>, '£560'],
];

export default function ModAdsPage() {
  return (
    <ModPageShell>
      <ModBackLink />
      <ModPageHeader eyebrow="Ads" title="Ad Creative Review" subtitle="Ad creative & policy review queue — claim verification, restricted categories, and trademark scan." />
      <ModTable headers={['ID', 'Headline', 'Advertiser', 'Status', 'Spend']} rows={rows} />
    </ModPageShell>
  );
}
