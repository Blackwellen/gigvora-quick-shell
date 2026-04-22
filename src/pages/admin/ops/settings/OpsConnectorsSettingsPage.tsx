import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsSettingsGate, OpsSettingsCard, OpsTable, OpsBadge } from '../_shared';

const rows = [
  ['Stripe', 'Payments', <OpsBadge tone="success">Connected</OpsBadge>, 'Live · 4 webhooks'],
  ['Postmark', 'Transactional email', <OpsBadge tone="success">Connected</OpsBadge>, 'DKIM verified'],
  ['Cloudflare', 'CDN & DNS', <OpsBadge tone="success">Connected</OpsBadge>, 'WAF active'],
  ['Slack', 'Internal alerts', <OpsBadge tone="success">Connected</OpsBadge>, '4 channels routed'],
  ['Google OAuth', 'User sign-in', <OpsBadge tone="success">Connected</OpsBadge>, 'Production credentials'],
  ['Apple Sign-in', 'User sign-in', <OpsBadge tone="warn">Sandbox only</OpsBadge>, 'Promote to live'],
  ['Twilio', 'SMS', <OpsBadge tone="neutral">Disabled</OpsBadge>, 'Not configured'],
];

export default function OpsConnectorsSettingsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Settings" title="Connectors" subtitle="Third-party integrations and OAuth credentials. Secrets are visible to Super Admin only." />
      <OpsSettingsGate label="Connector configuration">
        <OpsSettingsCard title="Integrations">
          <OpsTable headers={['Provider', 'Purpose', 'Status', 'Notes']} rows={rows} />
        </OpsSettingsCard>
      </OpsSettingsGate>
    </OpsPageShell>
  );
}
