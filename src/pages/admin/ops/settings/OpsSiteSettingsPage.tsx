import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsSettingsGate, OpsSettingsCard, OpsField, OpsInput, OpsToggle, OpsSaveBar } from '../_shared';

export default function OpsSiteSettingsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Settings" title="Site Control" subtitle="Maintenance windows, global feature flags, and platform-wide kill switches." />
      <OpsSettingsGate label="Site control configuration">
        <div className="space-y-4">
          <OpsSettingsCard title="Availability" description="Take the site into a controlled maintenance state.">
            <OpsField label="Maintenance mode" hint="Shows a public banner and disables writes."><OpsToggle label="Off" /></OpsField>
            <OpsField label="Read-only mode" hint="Reads are served, writes return 503."><OpsToggle label="Off" /></OpsField>
            <OpsField label="Banner message"><OpsInput placeholder="e.g. Scheduled maintenance Sunday 02:00 UTC" /></OpsField>
          </OpsSettingsCard>
          <OpsSettingsCard title="Global feature flags" description="System-wide kill switches.">
            <OpsField label="Signups open"><OpsToggle checked label="On" /></OpsField>
            <OpsField label="New gigs / projects"><OpsToggle checked label="On" /></OpsField>
            <OpsField label="Live messaging"><OpsToggle checked label="On" /></OpsField>
            <OpsField label="Public ads"><OpsToggle checked label="On" /></OpsField>
          </OpsSettingsCard>
        </div>
        <OpsSaveBar />
      </OpsSettingsGate>
    </OpsPageShell>
  );
}
