import React from 'react';
import { ModPageShell, ModPageHeader, ModBackLink, ModTable, ModBadge } from './_shared';

const rows = [
  ['EM-7711', 'Notice of content removal', 'user@example.com', <ModBadge tone="success">Sent</ModBadge>, '09:21'],
  ['EM-7710', 'Final warning — repeat policy violation', 'user2@example.com', <ModBadge tone="warn">Queued</ModBadge>, '09:18'],
  ['EM-7709', 'Account suspension confirmation', 'user3@example.com', <ModBadge tone="success">Sent</ModBadge>, '08:54'],
  ['EM-7708', 'Appeal received — under review', 'user4@example.com', <ModBadge tone="info">Auto</ModBadge>, '08:32'],
];

export default function ModEmailsPage() {
  return (
    <ModPageShell>
      <ModBackLink />
      <ModPageHeader eyebrow="Outbound" title="Enforcement Emails" subtitle="Outbound moderation correspondence — templated, audited, and policy-tagged." />
      <ModTable headers={['ID', 'Subject', 'Recipient', 'Status', 'Time']} rows={rows} />
    </ModPageShell>
  );
}
