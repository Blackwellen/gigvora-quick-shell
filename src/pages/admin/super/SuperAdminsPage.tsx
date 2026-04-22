import React from 'react';
import { SuperPageShell, SuperPageHeader, SuperBackLink, SuperOnlyGate, SuperTable, SuperBadge, SuperCard } from './_shared';
import { Plus } from 'lucide-react';

const rows = [
  ['admin_001', 'a.fenton', 'Super Admin', 'All scopes', <SuperBadge tone="success">Active</SuperBadge>, '2 hours ago'],
  ['admin_002', 'r.kahan', 'Trust & Safety', 'Moderation, Verification', <SuperBadge tone="success">Active</SuperBadge>, '12m ago'],
  ['admin_003', 's.osei', 'Customer Service', 'CS, Disputes', <SuperBadge tone="success">Active</SuperBadge>, '4h ago'],
  ['admin_004', 'l.park', 'Finance Admin', 'Finance, Escrow', <SuperBadge tone="warn">Inactive 30d</SuperBadge>, '34 days ago'],
  ['admin_005', 'm.diallo', 'Compliance', 'Compliance, Audit', <SuperBadge tone="success">Active</SuperBadge>, '1h ago'],
  ['admin_006', 'p.tan', 'Marketing Admin', 'Marketing, Ads Ops', <SuperBadge tone="success">Active</SuperBadge>, '3h ago'],
];

export default function SuperAdminsPage() {
  return (
    <SuperOnlyGate>
      <SuperPageShell>
        <SuperBackLink />
        <SuperPageHeader
          eyebrow="Admin Accounts"
          title="Admin Account Management"
          subtitle="Provision admins, assign roles and scopes, suspend or rotate credentials. Every change is audit-logged with actor and IP."
          right={<button className="rounded-lg bg-primary text-primary-foreground text-[12px] font-medium px-3 py-1.5 inline-flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Invite admin</button>}
        />
        <SuperCard title="Admins" description="All internal admin accounts.">
          <SuperTable headers={['ID', 'Username', 'Role', 'Scopes', 'Status', 'Last active']} rows={rows} />
        </SuperCard>
      </SuperPageShell>
    </SuperOnlyGate>
  );
}
