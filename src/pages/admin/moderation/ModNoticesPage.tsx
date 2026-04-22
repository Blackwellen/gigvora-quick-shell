import React from 'react';
import { ModPageShell, ModPageHeader, ModBackLink, ModTable, ModBadge } from './_shared';

const rows = [
  ['NT-302', 'Phishing attempt advisory', 'All users', <ModBadge tone="info">Active</ModBadge>, 'a.fenton'],
  ['NT-301', 'Election integrity reminder', 'UK · 18+', <ModBadge tone="info">Active</ModBadge>, 'r.kahan'],
  ['NT-298', 'Holiday SLA notice', 'Sellers', <ModBadge tone="neutral">Scheduled</ModBadge>, 's.osei'],
];

export default function ModNoticesPage() {
  return (
    <ModPageShell>
      <ModBackLink />
      <ModPageHeader eyebrow="Notices" title="Site & Targeted Notices" subtitle="Public moderation notices, targeted advisories, and scheduled policy reminders." />
      <ModTable headers={['ID', 'Title', 'Audience', 'Status', 'Owner']} rows={rows} />
    </ModPageShell>
  );
}
