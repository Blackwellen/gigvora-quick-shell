import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsSettingsGate, OpsSettingsCard, OpsField, OpsInput, OpsTextarea, OpsSaveBar } from '../_shared';

export default function OpsTermsSettingsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Settings · Legal" title="Terms & Conditions" subtitle="The canonical T&C document. Versioned — changes require user re-acceptance." />
      <OpsSettingsGate label="Terms & Conditions">
        <OpsSettingsCard title="Document">
          <OpsField label="Version"><OpsInput defaultValue="3.4" /></OpsField>
          <OpsField label="Effective date"><OpsInput defaultValue="2025-04-01" /></OpsField>
          <OpsField label="Body"><OpsTextarea rows={16} defaultValue="These Terms & Conditions govern your use of the Gigvora platform…" /></OpsField>
        </OpsSettingsCard>
        <OpsSaveBar />
      </OpsSettingsGate>
    </OpsPageShell>
  );
}
