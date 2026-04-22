import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsSettingsGate, OpsSettingsCard, OpsField, OpsInput, OpsToggle, OpsSaveBar, OpsTable, OpsBadge } from '../_shared';

const keys = [
  ['key_pk_4421', 'Public site (read-only)', 'pk_live_…aH2', <OpsBadge tone="success">Active</OpsBadge>, '12 Mar 2025'],
  ['key_sk_4418', 'Server (full)', 'sk_live_…••••', <OpsBadge tone="success">Active</OpsBadge>, '04 Apr 2025'],
  ['key_sk_4410', 'Mobile builds', 'sk_live_…••••', <OpsBadge tone="warn">Rotate soon</OpsBadge>, '21 Jan 2025'],
];

export default function OpsApiSettingsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Settings" title="API Settings" subtitle="Public API access, rate limits, and API key management." />
      <OpsSettingsGate label="API configuration">
        <div className="space-y-4">
          <OpsSettingsCard title="Access">
            <OpsField label="Public API enabled"><OpsToggle checked label="On" /></OpsField>
            <OpsField label="Default rate limit (req/min)"><OpsInput defaultValue="600" /></OpsField>
            <OpsField label="Burst allowance"><OpsInput defaultValue="60" /></OpsField>
          </OpsSettingsCard>
          <OpsSettingsCard title="API keys">
            <OpsTable headers={['ID', 'Label', 'Key', 'Status', 'Created']} rows={keys} />
          </OpsSettingsCard>
        </div>
        <OpsSaveBar />
      </OpsSettingsGate>
    </OpsPageShell>
  );
}
