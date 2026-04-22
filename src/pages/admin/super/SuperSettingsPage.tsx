import React from 'react';
import { SuperPageShell, SuperPageHeader, SuperBackLink, SuperOnlyGate, SuperCard } from './_shared';

const Field: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-3 md:gap-6 items-center py-2 border-b last:border-0">
    <div>
      <div className="text-[12px] font-medium">{label}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
    <input className="w-full rounded-lg border bg-background px-3 py-2 text-[13px]" defaultValue={value} />
  </div>
);

export default function SuperSettingsPage() {
  return (
    <SuperOnlyGate>
      <SuperPageShell>
        <SuperBackLink />
        <SuperPageHeader
          eyebrow="High-Privilege Settings"
          title="Critical Platform Settings"
          subtitle="The settings that touch security, identity, encryption, and compliance posture. All changes require typed confirmation and trigger an audit alert."
        />
        <div className="space-y-4">
          <SuperCard title="Identity & sessions">
            <Field label="Session lifetime (admin)" value="60 minutes" hint="Hard cap; admins must re-auth after this." />
            <Field label="MFA enforcement" value="required for all admins" hint="Includes super-admin." />
            <Field label="Sign-in risk score threshold" value="0.65" hint="Above this triggers step-up auth." />
          </SuperCard>
          <SuperCard title="Encryption">
            <Field label="At-rest envelope key rotation" value="every 90 days" />
            <Field label="PII encryption mode" value="AES-256-GCM (envelope)" />
            <Field label="Bank-detail encryption KMS key" value="kms_alias/finance/payouts" />
          </SuperCard>
          <SuperCard title="Compliance posture">
            <Field label="Data retention (audit log)" value="7 years" hint="Required by regulator." />
            <Field label="Right-to-erasure response SLA" value="30 days" />
            <Field label="Breach disclosure window" value="72 hours" />
          </SuperCard>
        </div>
      </SuperPageShell>
    </SuperOnlyGate>
  );
}
