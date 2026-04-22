import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsSettingsGate, OpsSettingsCard, OpsField, OpsInput, OpsToggle, OpsSaveBar } from '../_shared';

export default function OpsEscrowSettingsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Settings" title="Escrow Settings" subtitle="Escrow rules, milestone hold timelines, and dispute SLAs." />
      <OpsSettingsGate label="Escrow configuration">
        <div className="space-y-4">
          <OpsSettingsCard title="Hold rules">
            <OpsField label="Default hold period (days)"><OpsInput defaultValue="14" /></OpsField>
            <OpsField label="Auto-release on approval"><OpsToggle checked label="On" /></OpsField>
            <OpsField label="Allow partial release"><OpsToggle checked label="On" /></OpsField>
          </OpsSettingsCard>
          <OpsSettingsCard title="Disputes">
            <OpsField label="Open dispute SLA (hours)"><OpsInput defaultValue="48" /></OpsField>
            <OpsField label="Mediator engagement SLA (hours)"><OpsInput defaultValue="24" /></OpsField>
            <OpsField label="Auto-escalate after"><OpsInput defaultValue="7 days" /></OpsField>
          </OpsSettingsCard>
        </div>
        <OpsSaveBar />
      </OpsSettingsGate>
    </OpsPageShell>
  );
}
