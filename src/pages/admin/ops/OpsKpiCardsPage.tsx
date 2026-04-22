import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsKpiCard } from './_shared';
import { useAdminAuth } from '@/lib/adminAuth';
import { Lock, Inbox, Activity, AlertTriangle, Settings, Plus } from 'lucide-react';

export default function OpsKpiCardsPage() {
  const { user } = useAdminAuth();
  const isSuper = !!user?.isSuperAdmin;
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader
        eyebrow="Configuration"
        title="Custom KPI Cards"
        subtitle="Curate the admin ops KPI strip shown to all admin roles. Editing requires Super Admin."
        right={isSuper ? (
          <button className="rounded-lg bg-primary text-primary-foreground text-[12px] font-medium px-3 py-1.5 inline-flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Add KPI</button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Read-only</span>
        )}
      />
      {!isSuper && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-[13px] text-amber-800 dark:text-amber-200">
          KPI configuration is locked. Sign in as Super Admin to edit.
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <OpsKpiCard label="Open ops tickets" value="42" icon={Inbox} />
        <OpsKpiCard label="Active sessions" value="1,284" icon={Activity} />
        <OpsKpiCard label="System incidents" value="0" icon={AlertTriangle} />
        <OpsKpiCard label="Pending settings changes" value="3" icon={Settings} />
      </div>
    </OpsPageShell>
  );
}
