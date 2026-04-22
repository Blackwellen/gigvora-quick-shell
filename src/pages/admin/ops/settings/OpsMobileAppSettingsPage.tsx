import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsSettingsGate, OpsSettingsCard, OpsField, OpsInput, OpsToggle, OpsSaveBar } from '../_shared';

export default function OpsMobileAppSettingsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Settings" title="Mobile App Settings" subtitle="App version targets, force-update windows, and native feature toggles." />
      <OpsSettingsGate label="Mobile app configuration">
        <div className="space-y-4">
          <OpsSettingsCard title="Version targets">
            <OpsField label="iOS minimum"><OpsInput defaultValue="4.2.0" /></OpsField>
            <OpsField label="iOS recommended"><OpsInput defaultValue="4.3.1" /></OpsField>
            <OpsField label="Android minimum"><OpsInput defaultValue="4.2.0" /></OpsField>
            <OpsField label="Android recommended"><OpsInput defaultValue="4.3.1" /></OpsField>
          </OpsSettingsCard>
          <OpsSettingsCard title="Force update">
            <OpsField label="Force update enabled"><OpsToggle label="Off" /></OpsField>
            <OpsField label="Soft prompt below"><OpsInput defaultValue="4.2.5" /></OpsField>
          </OpsSettingsCard>
          <OpsSettingsCard title="Feature toggles">
            <OpsField label="Live reels recording"><OpsToggle checked label="On" /></OpsField>
            <OpsField label="In-app purchases"><OpsToggle checked label="On" /></OpsField>
          </OpsSettingsCard>
        </div>
        <OpsSaveBar />
      </OpsSettingsGate>
    </OpsPageShell>
  );
}
