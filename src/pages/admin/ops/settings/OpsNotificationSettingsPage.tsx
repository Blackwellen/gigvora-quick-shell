import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsSettingsGate, OpsSettingsCard, OpsField, OpsInput, OpsToggle, OpsSaveBar } from '../_shared';

export default function OpsNotificationSettingsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Settings" title="Notification Settings" subtitle="Channel routing, throttling, and per-event default delivery preferences." />
      <OpsSettingsGate label="Notification configuration">
        <div className="space-y-4">
          <OpsSettingsCard title="Channels">
            <OpsField label="Email"><OpsToggle checked label="Enabled" /></OpsField>
            <OpsField label="Push (mobile)"><OpsToggle checked label="Enabled" /></OpsField>
            <OpsField label="SMS"><OpsToggle label="Disabled" /></OpsField>
            <OpsField label="In-app"><OpsToggle checked label="Enabled" /></OpsField>
          </OpsSettingsCard>
          <OpsSettingsCard title="Throttling">
            <OpsField label="Per-user max / hour"><OpsInput defaultValue="10" /></OpsField>
            <OpsField label="Per-user max / day"><OpsInput defaultValue="40" /></OpsField>
            <OpsField label="Quiet hours (UTC)"><OpsInput defaultValue="22:00 → 07:00" /></OpsField>
          </OpsSettingsCard>
        </div>
        <OpsSaveBar />
      </OpsSettingsGate>
    </OpsPageShell>
  );
}
