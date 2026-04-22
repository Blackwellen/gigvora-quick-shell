import React from 'react';
import { SuperPageShell, SuperPageHeader, SuperBackLink, SuperOnlyGate, SuperTable, SuperBadge, SuperCard } from './_shared';

const rows = [
  ['evt_4421', '12m ago', 'a.fenton', 'flag.toggle', 'ff_new_messaging → 15%', '10.0.4.21', <SuperBadge tone="info">Info</SuperBadge>],
  ['evt_4420', '34m ago', 'super-admin', 'kpi.create', 'kpi_007 verification queue', '10.0.4.21', <SuperBadge tone="info">Info</SuperBadge>],
  ['evt_4418', '1h ago', 's.osei', 'admin.invite', 'Invited admin_007 (CS)', '10.0.5.12', <SuperBadge tone="info">Info</SuperBadge>],
  ['evt_4415', '2h ago', 'a.fenton', 'settings.update', 'session lifetime 60 → 60 (no-op)', '10.0.4.21', <SuperBadge tone="neutral">Noop</SuperBadge>],
  ['evt_4410', '5h ago', 'l.park', 'finance.bank_reveal', 'Acme Co. bank details viewed', '10.0.7.4', <SuperBadge tone="warn">Sensitive</SuperBadge>],
  ['evt_4404', '8h ago', 'super-admin', 'emergency.toggle', 'incident_mode = OFF', '10.0.4.21', <SuperBadge tone="danger">Critical</SuperBadge>],
];

export default function SuperAuditPage() {
  return (
    <SuperOnlyGate>
      <SuperPageShell>
        <SuperBackLink />
        <SuperPageHeader
          eyebrow="Audit"
          title="High-Risk Action Audit Trail"
          subtitle="Every super-admin and high-privilege action with actor, IP, and a structured before/after diff. Retained per compliance policy."
        />
        <SuperCard title="Recent events" description="Most recent first. Filter or export from the toolbar.">
          <SuperTable headers={['ID', 'When', 'Actor', 'Action', 'Detail', 'IP', 'Severity']} rows={rows} />
        </SuperCard>
      </SuperPageShell>
    </SuperOnlyGate>
  );
}
