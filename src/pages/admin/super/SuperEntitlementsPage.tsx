import React from 'react';
import { SuperPageShell, SuperPageHeader, SuperBackLink, SuperOnlyGate, SuperCard, SuperBadge } from './_shared';

const portals = ['CS', 'Disputes', 'Finance', 'Moderation', 'T&S', 'Verification', 'Marketing', 'Ads Ops', 'Admin Ops', 'Super Admin'];
const roles: Array<{ role: string; allowed: string[] }> = [
  { role: 'Super Admin', allowed: portals },
  { role: 'Customer Service', allowed: ['CS', 'Disputes', 'Admin Ops'] },
  { role: 'Finance Admin', allowed: ['Finance', 'Admin Ops'] },
  { role: 'Moderator', allowed: ['Moderation', 'Admin Ops'] },
  { role: 'Trust & Safety', allowed: ['Moderation', 'T&S', 'Verification', 'Admin Ops'] },
  { role: 'Dispute Mgr', allowed: ['Disputes', 'CS', 'Admin Ops'] },
  { role: 'Ads Ops', allowed: ['Ads Ops', 'Marketing', 'Admin Ops'] },
  { role: 'Compliance', allowed: ['Verification', 'Finance', 'Admin Ops'] },
  { role: 'Marketing Admin', allowed: ['Marketing', 'Ads Ops', 'Admin Ops'] },
];

export default function SuperEntitlementsPage() {
  return (
    <SuperOnlyGate>
      <SuperPageShell>
        <SuperBackLink />
        <SuperPageHeader
          eyebrow="Portal Entitlements"
          title="Role → Portal Entitlement Matrix"
          subtitle="Which admin role can access which portal. Toggling a cell takes effect on the role's next sign-in and is fully audit-logged."
        />
        <SuperCard title="Entitlement matrix" description="✓ = role has access · — = no access.">
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-2.5 sticky left-0 bg-muted/40">Role</th>
                  {portals.map((p) => <th key={p} className="text-center font-medium px-3 py-2.5 whitespace-nowrap">{p}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y">
                {roles.map((r) => (
                  <tr key={r.role} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium text-[13px] sticky left-0 bg-card">{r.role}</td>
                    {portals.map((p) => (
                      <td key={p} className="px-3 py-2.5 text-center">
                        {r.allowed.includes(p)
                          ? <SuperBadge tone="success">✓</SuperBadge>
                          : <span className="text-muted-foreground/40">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SuperCard>
      </SuperPageShell>
    </SuperOnlyGate>
  );
}
