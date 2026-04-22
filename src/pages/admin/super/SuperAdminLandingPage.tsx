import React from 'react';
import { Link } from 'react-router-dom';
import { SuperPageShell, SuperPageHeader, SuperKpiCard, SuperOnlyGate } from './_shared';
import {
  LayoutGrid, Flag, ShieldCheck, Settings, AlertOctagon, History,
  Lock, Activity, Users, Server, AlertTriangle, Database,
} from 'lucide-react';

type Tile = { label: string; subtitle: string; path: string; icon: React.ElementType };

const tiles: Tile[] = [
  { label: 'KPI Manager', subtitle: 'Curate KPI cards across all admin portals', path: '/admin/super/kpis', icon: LayoutGrid },
  { label: 'Feature Flags', subtitle: 'Rollouts, kill-switches, audience targeting', path: '/admin/super/flags', icon: Flag },
  { label: 'Admin Accounts', subtitle: 'Provision admins, set roles & scopes', path: '/admin/super/admins', icon: ShieldCheck },
  { label: 'Portal Entitlements', subtitle: 'Which roles see which portals', path: '/admin/super/entitlements', icon: Lock },
  { label: 'High-Privilege Settings', subtitle: 'Critical platform configuration', path: '/admin/super/settings', icon: Settings },
  { label: 'Emergency Controls', subtitle: 'Kill switches, incident posture', path: '/admin/super/emergency', icon: AlertOctagon },
  { label: 'Audit Visibility', subtitle: 'High-risk action audit trail', path: '/admin/super/audit', icon: History },
  { label: 'System State', subtitle: 'Config snapshot & health summary', path: '/admin/super/system', icon: Database },
];

export default function SuperAdminLandingPage() {
  return (
    <SuperOnlyGate>
      <SuperPageShell>
        <SuperPageHeader
          eyebrow="Governance"
          title="Super Admin Control Layer"
          subtitle="The highest-privilege surface — KPI assignment, feature flags, admin provisioning, entitlements, emergency controls, and audit visibility for the entire platform."
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <SuperKpiCard label="Active feature flags" value="24" delta="+2 this week" icon={Flag} />
          <SuperKpiCard label="Admin accounts" value="38" delta="+1" icon={Users} />
          <SuperKpiCard label="Active sessions" value="1,284" delta="+3.2%" positive icon={Activity} />
          <SuperKpiCard label="High-risk events 24h" value="6" icon={AlertTriangle} />
        </div>
        <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground/70 font-semibold mb-3">Governance surfaces</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {tiles.map((t) => (
            <Link
              key={t.path}
              to={t.path}
              className="rounded-xl border bg-card p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
                <t.icon className="h-4 w-4" />
              </div>
              <div className="text-[13px] font-medium">{t.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{t.subtitle}</div>
            </Link>
          ))}
        </div>
        <div className="mt-8 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-[12px] text-rose-800 dark:text-rose-200">
          <strong>Heads-up:</strong> All actions on this surface are recorded in the high-risk audit trail with actor, IP, and before/after diff. Destructive operations require typed confirmation.
        </div>
      </SuperPageShell>
    </SuperOnlyGate>
  );
}
