import React from 'react';
import { SuperPageShell, SuperPageHeader, SuperBackLink, SuperOnlyGate, SuperTable, SuperBadge, SuperCard } from './_shared';
import { Plus } from 'lucide-react';

const rows = [
  ['kpi_001', 'Open queue', 'Moderation', 'count(open)', <SuperBadge tone="success">Live</SuperBadge>, 'a.fenton'],
  ['kpi_002', 'SLA breached', 'Moderation', 'count(sla_breached)', <SuperBadge tone="success">Live</SuperBadge>, 'a.fenton'],
  ['kpi_003', 'Open ops tickets', 'Admin Ops', 'count(ops_open)', <SuperBadge tone="success">Live</SuperBadge>, 'a.fenton'],
  ['kpi_004', 'Active sessions', 'Admin Ops', 'gauge(sessions_active)', <SuperBadge tone="success">Live</SuperBadge>, 'a.fenton'],
  ['kpi_005', 'Open disputes', 'Disputes', 'count(disputes_open)', <SuperBadge tone="success">Live</SuperBadge>, 'a.fenton'],
  ['kpi_006', 'Pending refunds', 'Finance', 'count(refunds_pending)', <SuperBadge tone="info">Draft</SuperBadge>, 'l.park'],
  ['kpi_007', 'Verification queue', 'Verification', 'count(verif_queue)', <SuperBadge tone="success">Live</SuperBadge>, 'r.kahan'],
];

export default function SuperKpisPage() {
  return (
    <SuperOnlyGate>
      <SuperPageShell>
        <SuperBackLink />
        <SuperPageHeader
          eyebrow="KPI Manager"
          title="KPI Creation & Assignment"
          subtitle="Define KPI cards from canonical metrics and assign them to specific admin portals. Changes propagate to all admins in those portals on next page load."
          right={<button className="rounded-lg bg-primary text-primary-foreground text-[12px] font-medium px-3 py-1.5 inline-flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> New KPI</button>}
        />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <SuperCard title="Defined KPIs" description="All KPIs across all portals — edit assignment or retire.">
            <SuperTable headers={['ID', 'Label', 'Portal', 'Metric', 'Status', 'Owner']} rows={rows} />
          </SuperCard>
          <SuperCard title="Assignment summary">
            {[['Moderation', 4], ['Admin Ops', 4], ['Disputes', 3], ['Finance', 4], ['Verification', 3], ['CS', 4]].map(([p, n]) => (
              <div key={p as string} className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground">{p}</span>
                <span className="tabular-nums font-medium">{n} cards</span>
              </div>
            ))}
          </SuperCard>
        </div>
      </SuperPageShell>
    </SuperOnlyGate>
  );
}
