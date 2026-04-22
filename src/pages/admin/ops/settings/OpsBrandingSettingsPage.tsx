import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsSettingsGate, OpsSettingsCard, OpsField, OpsInput, OpsSaveBar } from '../_shared';

export default function OpsBrandingSettingsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Settings" title="Logo & Favicon" subtitle="Brand assets used across the web app, marketing site, mobile app, and emails." />
      <OpsSettingsGate label="Brand assets">
        <div className="space-y-4">
          <OpsSettingsCard title="Primary logo">
            <OpsField label="Logo (light theme)" hint="SVG preferred, max 200KB.">
              <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center text-[12px] text-muted-foreground">Drop SVG / PNG to replace</div>
            </OpsField>
            <OpsField label="Logo (dark theme)">
              <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center text-[12px] text-muted-foreground">Drop SVG / PNG to replace</div>
            </OpsField>
          </OpsSettingsCard>
          <OpsSettingsCard title="Favicon & app icon">
            <OpsField label="Favicon (32×32)">
              <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center text-[12px] text-muted-foreground">Drop ICO / PNG to replace</div>
            </OpsField>
            <OpsField label="Apple touch icon (180×180)">
              <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center text-[12px] text-muted-foreground">Drop PNG to replace</div>
            </OpsField>
          </OpsSettingsCard>
          <OpsSettingsCard title="Open Graph defaults">
            <OpsField label="Default OG image URL"><OpsInput defaultValue="https://cdn.gigvora.com/og/default.png" /></OpsField>
            <OpsField label="Default Twitter card"><OpsInput defaultValue="summary_large_image" /></OpsField>
          </OpsSettingsCard>
        </div>
        <OpsSaveBar />
      </OpsSettingsGate>
    </OpsPageShell>
  );
}
