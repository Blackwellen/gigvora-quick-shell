import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsSettingsGate, OpsSettingsCard, OpsField, OpsInput, OpsToggle, OpsSaveBar } from '../_shared';

export default function OpsFinanceSettingsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Settings" title="Finance Settings" subtitle="Platform fees, supported currencies, payout schedules, and tax handling." />
      <OpsSettingsGate label="Finance configuration">
        <div className="space-y-4">
          <OpsSettingsCard title="Fees & take rate">
            <OpsField label="Marketplace take rate"><OpsInput defaultValue="12.0" />  </OpsField>
            <OpsField label="Subscription processing fee"><OpsInput defaultValue="2.9 + 0.30" /></OpsField>
            <OpsField label="Payout fee"><OpsInput defaultValue="0.25" /></OpsField>
          </OpsSettingsCard>
          <OpsSettingsCard title="Currencies">
            <OpsField label="Default currency"><OpsInput defaultValue="GBP" /></OpsField>
            <OpsField label="Supported currencies"><OpsInput defaultValue="GBP, EUR, USD, AUD, CAD" /></OpsField>
          </OpsSettingsCard>
          <OpsSettingsCard title="Payout schedule">
            <OpsField label="Default cadence"><OpsInput defaultValue="weekly · Friday" /></OpsField>
            <OpsField label="Hold period (days)"><OpsInput defaultValue="7" /></OpsField>
            <OpsField label="Auto-payouts"><OpsToggle checked label="Enabled" /></OpsField>
          </OpsSettingsCard>
        </div>
        <OpsSaveBar />
      </OpsSettingsGate>
    </OpsPageShell>
  );
}
