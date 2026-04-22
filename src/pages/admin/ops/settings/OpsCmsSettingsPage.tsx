import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsSettingsGate, OpsSettingsCard, OpsField, OpsInput, OpsTextarea, OpsSaveBar, OpsTable, OpsBadge } from '../_shared';

const pages = [
  ['/about', 'About', <OpsBadge tone="success">Published</OpsBadge>, '12 Apr'],
  ['/pricing', 'Pricing', <OpsBadge tone="success">Published</OpsBadge>, '02 Apr'],
  ['/blog/launch', 'Launch announcement', <OpsBadge tone="info">Draft</OpsBadge>, 'Today'],
];

export default function OpsCmsSettingsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Settings" title="CMS Settings" subtitle="Marketing site CMS — pages, drafts, and publish pipeline." />
      <OpsSettingsGate label="CMS configuration">
        <div className="space-y-4">
          <OpsSettingsCard title="Defaults">
            <OpsField label="Site title"><OpsInput defaultValue="Gigvora" /></OpsField>
            <OpsField label="Default meta description"><OpsTextarea rows={2} defaultValue="The enterprise marketplace for work, talent, and community." /></OpsField>
          </OpsSettingsCard>
          <OpsSettingsCard title="Pages">
            <OpsTable headers={['Path', 'Title', 'Status', 'Updated']} rows={pages} />
          </OpsSettingsCard>
        </div>
        <OpsSaveBar />
      </OpsSettingsGate>
    </OpsPageShell>
  );
}
