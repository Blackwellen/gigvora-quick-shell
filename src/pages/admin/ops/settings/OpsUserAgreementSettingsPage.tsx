import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsSettingsGate, OpsSettingsCard, OpsField, OpsInput, OpsTextarea, OpsSaveBar } from '../_shared';

export default function OpsUserAgreementSettingsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Settings · Legal" title="User Agreement" subtitle="The canonical user agreement governing accounts, content, and conduct." />
      <OpsSettingsGate label="User agreement">
        <OpsSettingsCard title="Document">
          <OpsField label="Version"><OpsInput defaultValue="1.6" /></OpsField>
          <OpsField label="Effective date"><OpsInput defaultValue="2025-02-20" /></OpsField>
          <OpsField label="Body"><OpsTextarea rows={16} defaultValue="By creating a Gigvora account, you agree to abide by the conduct, content, and commercial terms…" /></OpsField>
        </OpsSettingsCard>
        <OpsSaveBar />
      </OpsSettingsGate>
    </OpsPageShell>
  );
}
