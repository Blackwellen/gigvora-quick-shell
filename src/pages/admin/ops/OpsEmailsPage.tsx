import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsTable, OpsBadge } from './_shared';

const rows = [
  ['EM-2201', 'Quarterly platform update', 'all-users@', <OpsBadge tone="success">Sent</OpsBadge>, '2.4M', '09:00'],
  ['EM-2200', 'Enterprise renewal nudge', 'enterprise@', <OpsBadge tone="info">Scheduled</OpsBadge>, '124', 'Tue 14:00'],
  ['EM-2197', 'Mobile app v4.2 release notes', 'mobile-users@', <OpsBadge tone="success">Sent</OpsBadge>, '892K', 'Yesterday'],
];

export default function OpsEmailsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Outbound" title="Admin Emails" subtitle="Outbound admin correspondence — broadcasts, enterprise nudges, and release notes." />
      <OpsTable headers={['ID', 'Subject', 'Audience', 'Status', 'Reach', 'Sent']} rows={rows} />
    </OpsPageShell>
  );
}
