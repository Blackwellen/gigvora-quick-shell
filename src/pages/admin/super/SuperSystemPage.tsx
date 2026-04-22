import React from 'react';
import { SuperPageShell, SuperPageHeader, SuperBackLink, SuperOnlyGate, SuperCard, SuperKpiCard, SuperBadge } from './_shared';
import { Server, Database, Activity, Wifi } from 'lucide-react';

export default function SuperSystemPage() {
  return (
    <SuperOnlyGate>
      <SuperPageShell>
        <SuperBackLink />
        <SuperPageHeader
          eyebrow="System State"
          title="Config & System-State Summary"
          subtitle="A live snapshot of the platform's effective configuration, feature-flag state, and infrastructure health — useful for incident triage."
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <SuperKpiCard label="API uptime 30d" value="99.98%" delta="0.0pp" icon={Activity} />
          <SuperKpiCard label="DB primary" value="healthy" icon={Database} />
          <SuperKpiCard label="Edge nodes" value="42 / 42" icon={Server} />
          <SuperKpiCard label="WebSockets" value="ok" icon={Wifi} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SuperCard title="Effective config (snapshot)">
            <pre className="text-[12px] bg-muted/40 rounded-lg p-3 overflow-x-auto">{`{
  "env": "production",
  "session_lifetime_admin_min": 60,
  "mfa_required": true,
  "data_retention_audit_years": 7,
  "kms_alias": "kms_alias/finance/payouts"
}`}</pre>
          </SuperCard>
          <SuperCard title="Active flag state">
            <ul className="text-[13px] divide-y">
              {[
                ['ff_signups_open', 'success', '100%'],
                ['ff_new_messaging', 'info', '15%'],
                ['ff_credits_v2', 'success', '100%'],
                ['ff_emergency_chat_off', 'danger', 'KILL'],
              ].map(([k, t, v]) => (
                <li key={k as string} className="py-2 flex items-center justify-between">
                  <span className="font-mono text-[12px]">{k}</span>
                  <span className="flex items-center gap-2"><span className="text-muted-foreground tabular-nums">{v}</span><SuperBadge tone={t as 'success' | 'info' | 'danger'}>{t as string}</SuperBadge></span>
                </li>
              ))}
            </ul>
          </SuperCard>
        </div>
      </SuperPageShell>
    </SuperOnlyGate>
  );
}
