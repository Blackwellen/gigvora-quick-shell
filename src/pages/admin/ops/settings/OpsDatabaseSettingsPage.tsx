import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsSettingsGate, OpsSettingsCard, OpsField, OpsInput, OpsToggle, OpsSaveBar, OpsTable, OpsBadge } from '../_shared';

const backups = [
  ['bk_4421', 'Daily full', 'Today 03:00 UTC', '4.2 GB', <OpsBadge tone="success">Healthy</OpsBadge>],
  ['bk_4420', 'Daily full', 'Yesterday 03:00 UTC', '4.1 GB', <OpsBadge tone="success">Healthy</OpsBadge>],
  ['bk_4419', 'Daily full', '2 days ago 03:00 UTC', '4.0 GB', <OpsBadge tone="success">Healthy</OpsBadge>],
];

export default function OpsDatabaseSettingsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Settings" title="Database" subtitle="Backups, scheduled maintenance windows, and read-replica posture. Destructive operations are Super Admin-only." />
      <OpsSettingsGate label="Database configuration">
        <div className="space-y-4">
          <OpsSettingsCard title="Backups">
            <OpsField label="Daily full backup"><OpsToggle checked label="Enabled" /></OpsField>
            <OpsField label="Hourly WAL"><OpsToggle checked label="Enabled" /></OpsField>
            <OpsField label="Retention (days)"><OpsInput defaultValue="30" /></OpsField>
          </OpsSettingsCard>
          <OpsSettingsCard title="Maintenance window">
            <OpsField label="Day"><OpsInput defaultValue="Sunday" /></OpsField>
            <OpsField label="Window (UTC)"><OpsInput defaultValue="02:00 → 03:00" /></OpsField>
            <OpsField label="Auto-apply minor upgrades"><OpsToggle checked label="On" /></OpsField>
          </OpsSettingsCard>
          <OpsSettingsCard title="Recent backups">
            <OpsTable headers={['ID', 'Type', 'When', 'Size', 'Status']} rows={backups} />
          </OpsSettingsCard>
        </div>
        <OpsSaveBar />
      </OpsSettingsGate>
    </OpsPageShell>
  );
}
