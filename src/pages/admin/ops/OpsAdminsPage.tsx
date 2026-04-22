import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsTable, OpsBadge } from './_shared';
import { useAdminAuth } from '@/lib/adminAuth';
import { Lock } from 'lucide-react';

const rows = [
  ['admin_001', 'a.fenton', 'Super Admin', 'All scopes', <OpsBadge tone="success">Active</OpsBadge>, '2 hours ago'],
  ['admin_002', 'r.kahan', 'Trust & Safety', 'Moderation, Verification', <OpsBadge tone="success">Active</OpsBadge>, '12m ago'],
  ['admin_003', 's.osei', 'Customer Service', 'CS, Disputes', <OpsBadge tone="success">Active</OpsBadge>, '4h ago'],
  ['admin_004', 'l.park', 'Finance Admin', 'Finance, Escrow', <OpsBadge tone="warn">Inactive 30d</OpsBadge>, '34 days ago'],
];

export default function OpsAdminsPage() {
  const { user } = useAdminAuth();
  const isSuper = !!user?.isSuperAdmin;
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader
        eyebrow="Catalog"
        title="Admin Accounts"
        subtitle="Internal admin accounts and their assigned scopes. Editing requires Super Admin."
        right={isSuper ? (
          <button className="rounded-lg bg-primary text-primary-foreground text-[12px] font-medium px-3 py-1.5">Invite admin</button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Read-only</span>
        )}
      />
      {!isSuper && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-[13px] text-amber-800 dark:text-amber-200">
          Admin account management is locked. Sign in as Super Admin to edit.
        </div>
      )}
      <OpsTable headers={['ID', 'Username', 'Role', 'Scopes', 'Status', 'Last active']} rows={rows} />
    </OpsPageShell>
  );
}
