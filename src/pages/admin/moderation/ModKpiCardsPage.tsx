import React from 'react';
import { ModPageShell, ModPageHeader, ModBackLink, ModKpiCard } from './_shared';
import { useAdminAuth } from '@/lib/adminAuth';
import { Lock, Inbox, Clock, ShieldAlert, Gauge, Plus } from 'lucide-react';

export default function ModKpiCardsPage() {
  const { user } = useAdminAuth();
  const isSuper = !!user?.isSuperAdmin;
  return (
    <ModPageShell>
      <ModBackLink />
      <ModPageHeader
        eyebrow="Configuration"
        title="Custom KPI Cards"
        subtitle="Curate the moderation KPI strip shown to all moderators. Editing requires Super Admin."
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
        <ModKpiCard label="Open queue" value="184" icon={Inbox} />
        <ModKpiCard label="SLA breached" value="6" icon={Clock} />
        <ModKpiCard label="High-risk signals" value="9" icon={ShieldAlert} />
        <ModKpiCard label="Auto-moderated 24h" value="1,427" icon={Gauge} />
      </div>
    </ModPageShell>
  );
}
