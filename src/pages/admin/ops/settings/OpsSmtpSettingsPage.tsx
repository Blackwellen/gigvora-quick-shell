import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsSettingsGate, OpsSettingsCard, OpsField, OpsInput, OpsToggle, OpsSaveBar } from '../_shared';

export default function OpsSmtpSettingsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Settings" title="SMTP Settings" subtitle="Outbound email configuration, authentication, and delivery monitoring." />
      <OpsSettingsGate label="SMTP configuration">
        <div className="space-y-4">
          <OpsSettingsCard title="Provider">
            <OpsField label="Host"><OpsInput defaultValue="smtp.postmarkapp.com" /></OpsField>
            <OpsField label="Port"><OpsInput defaultValue="587" /></OpsField>
            <OpsField label="Username"><OpsInput defaultValue="apikey" /></OpsField>
            <OpsField label="Password" hint="Stored encrypted; never shown to non-super-admins."><OpsInput type="password" defaultValue="••••••••••••" /></OpsField>
          </OpsSettingsCard>
          <OpsSettingsCard title="From identities">
            <OpsField label="Default sender"><OpsInput defaultValue="hello@gigvora.com" /></OpsField>
            <OpsField label="Reply-to"><OpsInput defaultValue="support@gigvora.com" /></OpsField>
            <OpsField label="DKIM signing"><OpsToggle checked label="On" /></OpsField>
            <OpsField label="DMARC enforcement"><OpsToggle checked label="On" /></OpsField>
          </OpsSettingsCard>
        </div>
        <OpsSaveBar />
      </OpsSettingsGate>
    </OpsPageShell>
  );
}
