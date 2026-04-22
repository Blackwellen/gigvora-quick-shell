import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsSettingsGate, OpsSettingsCard, OpsField, OpsInput, OpsTextarea, OpsSaveBar } from '../_shared';

export default function OpsPrivacySettingsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Settings · Legal" title="Privacy Policy" subtitle="The canonical privacy policy. UK GDPR-aligned and reviewed by compliance." />
      <OpsSettingsGate label="Privacy policy">
        <OpsSettingsCard title="Document">
          <OpsField label="Version"><OpsInput defaultValue="2.8" /></OpsField>
          <OpsField label="Effective date"><OpsInput defaultValue="2025-03-15" /></OpsField>
          <OpsField label="Body"><OpsTextarea rows={16} defaultValue="This Privacy Policy describes how Gigvora collects, uses, and shares your personal data…" /></OpsField>
        </OpsSettingsCard>
        <OpsSaveBar />
      </OpsSettingsGate>
    </OpsPageShell>
  );
}
