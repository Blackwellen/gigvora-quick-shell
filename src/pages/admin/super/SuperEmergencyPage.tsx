import React from 'react';
import { SuperPageShell, SuperPageHeader, SuperBackLink, SuperOnlyGate, SuperCard, SuperBadge } from './_shared';
import { AlertOctagon } from 'lucide-react';

const switches: Array<{ id: string; label: string; description: string; tone: 'danger' | 'warn' | 'info' }> = [
  { id: 'incident_mode', label: 'Site-wide incident banner', description: 'Renders a red banner on every page and notifies all admins.', tone: 'warn' },
  { id: 'kill_signups', label: 'Halt new signups', description: 'Returns 503 on /signup and disables OAuth signup flows.', tone: 'warn' },
  { id: 'kill_writes', label: 'Read-only mode (writes off)', description: 'All write endpoints return 503; reads continue.', tone: 'danger' },
  { id: 'kill_messaging', label: 'Disable live messaging', description: 'Closes WebSockets and disables outbound chat APIs.', tone: 'warn' },
  { id: 'kill_payouts', label: 'Halt payouts', description: 'Pauses Finance payout job; existing escrow remains.', tone: 'danger' },
  { id: 'force_logout_admins', label: 'Force log out all admins', description: 'Invalidates every admin session except yours.', tone: 'danger' },
];

export default function SuperEmergencyPage() {
  return (
    <SuperOnlyGate>
      <SuperPageShell>
        <SuperBackLink />
        <SuperPageHeader
          eyebrow="Emergency Controls"
          title="Emergency Posture & Kill Switches"
          subtitle="Reach for these only during an active incident. Each switch requires typed confirmation and pages the on-call team."
          right={<SuperBadge tone="danger">Audit-critical</SuperBadge>}
        />
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-[13px] text-rose-800 dark:text-rose-200 flex items-start gap-3">
          <AlertOctagon className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">Use with extreme care.</div>
            <div className="text-[12px] mt-0.5 opacity-90">
              All actions on this surface are irreversible from the UI and immediately page the on-call team. To revert, open an incident and follow the rollback runbook.
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {switches.map((s) => (
            <SuperCard key={s.id} title={s.label} description={s.description} right={<SuperBadge tone={s.tone}>{s.tone}</SuperBadge>}>
              <div className="flex items-center justify-between">
                <SuperBadge tone="success">Currently OFF</SuperBadge>
                <button className="rounded-lg border border-rose-500/40 text-rose-700 dark:text-rose-300 text-[12px] font-medium px-3 py-1.5 hover:bg-rose-500/10">
                  Engage…
                </button>
              </div>
            </SuperCard>
          ))}
        </div>
      </SuperPageShell>
    </SuperOnlyGate>
  );
}
