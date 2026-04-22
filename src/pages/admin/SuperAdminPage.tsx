import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import {
  Shield, AlertTriangle, Search, Clock, Eye, RefreshCw, FileText,
  Radio, Smartphone, CheckCircle2, XCircle, History, Settings, Zap,
  Activity, Lock, Flag, ToggleLeft, Terminal, Server, Globe, Users,
  AlertOctagon, BarChart3, DollarSign, Gavel, ShieldCheck, Power,
  Database, Wifi, WifiOff, Layers, Key, ChevronRight, Gauge,
  Siren, Building2, Rocket, Download, TrendingUp, MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// ── Types ──
type FlagStatus = 'enabled' | 'disabled' | 'rollout' | 'kill_switch';
type HealthStatus = 'healthy' | 'degraded' | 'down' | 'maintenance';

interface FeatureFlag {
  id: string; name: string; key: string; status: FlagStatus;
  coverage: number; description: string;
  owner: string; updated: string; created: string;
  environments: { prod: boolean; staging: boolean; dev: boolean };
  tenantScope: 'global' | 'tenant-specific';
  conflict?: string;
}

interface ServiceHealth {
  id: string; name: string; status: HealthStatus;
  uptime: string; latency: string; load: number; lastIncident?: string; region: string;
}

interface AuditEntry {
  id: string; actor: string; action: string; target: string; scope: string;
  timestamp: string; severity: 'info' | 'warning' | 'critical'; env: string;
}

interface SystemOverride {
  id: string; name: string; type: 'rate-limit' | 'feature-gate' | 'maintenance' | 'killswitch';
  active: boolean; reason: string; activatedBy: string; activatedAt: string; expiresAt: string | null;
}

// ── Mock Data ──
const FLAGS: FeatureFlag[] = [
  { id: 'FF-01', name: 'AI-Powered Matching', key: 'ai_matching_v2', status: 'rollout', coverage: 45, description: 'Next-gen AI matching engine for gig discovery', owner: 'Product', updated: '2h ago', created: '2w ago', environments: { prod: true, staging: true, dev: true }, tenantScope: 'global' },
  { id: 'FF-02', name: 'Escrow Auto-Release', key: 'escrow_auto_release', status: 'enabled', coverage: 100, description: 'Automatic escrow release after 14-day timer', owner: 'Finance', updated: '1d ago', created: '1m ago', environments: { prod: true, staging: true, dev: true }, tenantScope: 'global' },
  { id: 'FF-03', name: 'Enterprise SSO', key: 'enterprise_sso', status: 'enabled', coverage: 100, description: 'SAML/OIDC SSO for enterprise tenants', owner: 'Platform', updated: '3d ago', created: '3m ago', environments: { prod: true, staging: true, dev: true }, tenantScope: 'tenant-specific' },
  { id: 'FF-04', name: 'Video Proposals', key: 'video_proposals', status: 'rollout', coverage: 15, description: 'Video-based proposal submissions for gigs', owner: 'Product', updated: '6h ago', created: '1w ago', environments: { prod: true, staging: true, dev: true }, tenantScope: 'global' },
  { id: 'FF-05', name: 'New Billing Engine', key: 'billing_v3', status: 'disabled', coverage: 0, description: 'Revamped billing with usage-based pricing', owner: 'Finance', updated: '4d ago', created: '2w ago', environments: { prod: false, staging: true, dev: true }, tenantScope: 'global', conflict: 'Conflicts with escrow_auto_release in staging' },
  { id: 'FF-06', name: 'Real-time Collab', key: 'realtime_collab', status: 'rollout', coverage: 60, description: 'Real-time collaborative workspace editing', owner: 'Engineering', updated: '1h ago', created: '3w ago', environments: { prod: true, staging: true, dev: true }, tenantScope: 'global' },
  { id: 'FF-07', name: 'Emergency Read-Only', key: 'emergency_readonly', status: 'kill_switch', coverage: 0, description: 'Platform-wide read-only mode for emergencies', owner: 'Platform', updated: '6m ago', created: '1y ago', environments: { prod: false, staging: false, dev: false }, tenantScope: 'global' },
  { id: 'FF-08', name: 'Smart Notifications', key: 'smart_notif', status: 'enabled', coverage: 100, description: 'AI-prioritized notification delivery', owner: 'Product', updated: '5d ago', created: '2m ago', environments: { prod: true, staging: true, dev: true }, tenantScope: 'global' },
];

const SERVICES: ServiceHealth[] = [
  { id: 'SV-1', name: 'API Gateway', status: 'healthy', uptime: '99.99%', latency: '42ms', load: 34, region: 'us-east-1' },
  { id: 'SV-2', name: 'Auth Service', status: 'healthy', uptime: '99.98%', latency: '38ms', load: 22, region: 'us-east-1' },
  { id: 'SV-3', name: 'Payment Processor', status: 'degraded', uptime: '99.91%', latency: '185ms', load: 67, lastIncident: '45m ago', region: 'us-east-1' },
  { id: 'SV-4', name: 'Search Engine', status: 'healthy', uptime: '99.97%', latency: '55ms', load: 45, region: 'us-west-2' },
  { id: 'SV-5', name: 'Media CDN', status: 'healthy', uptime: '99.99%', latency: '12ms', load: 28, region: 'global' },
  { id: 'SV-6', name: 'Notification Hub', status: 'maintenance', uptime: '99.85%', latency: '—', load: 0, lastIncident: 'Planned', region: 'eu-west-1' },
  { id: 'SV-7', name: 'Analytics Pipeline', status: 'healthy', uptime: '99.96%', latency: '120ms', load: 56, region: 'us-east-1' },
  { id: 'SV-8', name: 'AI Inference', status: 'healthy', uptime: '99.93%', latency: '210ms', load: 41, region: 'us-west-2' },
];

const AUDIT_LOG: AuditEntry[] = [
  { id: 'AUD-001', actor: 'S.Admin', action: 'Feature flag toggled', target: 'ai_matching_v2 → rollout 45%', scope: 'Platform', timestamp: '2h ago', severity: 'warning', env: 'production' },
  { id: 'AUD-002', actor: 'System', action: 'Auto-scaling triggered', target: 'Worker pool expanded 4→8', scope: 'Infrastructure', timestamp: '3h ago', severity: 'info', env: 'production' },
  { id: 'AUD-003', actor: 'R.Patel', action: 'System override activated', target: 'Rate limit increased for API v2', scope: 'Security', timestamp: '5h ago', severity: 'warning', env: 'production' },
  { id: 'AUD-004', actor: 'S.Admin', action: 'Incident mode deactivated', target: 'Platform-wide incident mode OFF', scope: 'Platform', timestamp: '1d ago', severity: 'critical', env: 'production' },
  { id: 'AUD-005', actor: 'K.Wong', action: 'User impersonation', target: 'user:u-4821 for support ticket T-992', scope: 'Support', timestamp: '1d ago', severity: 'critical', env: 'production' },
  { id: 'AUD-006', actor: 'System', action: 'Certificate renewal', target: 'SSL cert renewed for *.gigvora.com', scope: 'Infrastructure', timestamp: '2d ago', severity: 'info', env: 'production' },
  { id: 'AUD-007', actor: 'A.Chen', action: 'Killswitch activated', target: 'SMS notifications disabled', scope: 'Communications', timestamp: '3d ago', severity: 'critical', env: 'production' },
];

const OVERRIDES: SystemOverride[] = [
  { id: 'OVR-001', name: 'API Rate Limit Override', type: 'rate-limit', active: true, reason: 'Enterprise client migration — temporary 5x limit', activatedBy: 'R.Patel', activatedAt: '5h ago', expiresAt: '24h' },
  { id: 'OVR-002', name: 'SMS Killswitch', type: 'killswitch', active: true, reason: 'Provider outage — all SMS notifications paused', activatedBy: 'A.Chen', activatedAt: '3d ago', expiresAt: null },
  { id: 'OVR-003', name: 'Maintenance Window', type: 'maintenance', active: false, reason: 'Scheduled DB migration window completed', activatedBy: 'System', activatedAt: '7d ago', expiresAt: null },
  { id: 'OVR-004', name: 'New User Registration Gate', type: 'feature-gate', active: false, reason: 'Capacity planning — registration throttle removed', activatedBy: 'S.Admin', activatedAt: '14d ago', expiresAt: null },
];

const PLATFORM_TREND = [
  { hour: '00', requests: 12400, errors: 23, latency: 45 },
  { hour: '04', requests: 8200, errors: 12, latency: 38 },
  { hour: '08', requests: 34500, errors: 67, latency: 52 },
  { hour: '12', requests: 48200, errors: 89, latency: 61 },
  { hour: '16', requests: 52100, errors: 102, latency: 68 },
  { hour: '20', requests: 38400, errors: 54, latency: 48 },
  { hour: '23', requests: 21300, errors: 31, latency: 42 },
];

const QUEUE_SUMMARY = [
  { queue: 'Support Tickets', pending: 42, escalated: 8, sla: '92%', link: '/admin/customer-service' },
  { queue: 'Moderation', pending: 156, escalated: 23, sla: '87%', link: '/admin/moderator-dashboard' },
  { queue: 'Verification', pending: 14, escalated: 3, sla: '96%', link: '/admin/verification-compliance' },
  { queue: 'Disputes', pending: 7, escalated: 2, sla: '94%', link: '/admin/dispute-ops' },
  { queue: 'Ads Review', pending: 89, escalated: 11, sla: '85%', link: '/admin/ads-ops' },
  { queue: 'Finance', pending: 5, escalated: 1, sla: '98%', link: '/admin/finance-dashboard' },
];

const FLAG_STATUS_COLORS: Record<FlagStatus, string> = {
  enabled: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  disabled: 'bg-muted text-muted-foreground',
  rollout: 'bg-primary/10 text-primary',
  kill_switch: 'bg-destructive/10 text-destructive',
};
const HEALTH_COLORS: Record<HealthStatus, string> = {
  healthy: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  degraded: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  down: 'bg-destructive/10 text-destructive',
  maintenance: 'bg-accent/10 text-accent',
};
const sevColor = (s: string) => s === 'critical' ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]' : s === 'warning' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : 'bg-muted text-muted-foreground';

const SuperAdminPage: React.FC = () => {
  const { activeRole } = useRole();
  const [activeTab, setActiveTab] = useState('command');
  const [flags, setFlags] = useState(FLAGS);
  const [incidentMode, setIncidentMode] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<AuditEntry | null>(null);
  const [drawer, setDrawer] = useState<'flag' | 'audit' | null>(null);
  const [search, setSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState('all');
  const [env, setEnv] = useState<'production' | 'staging'>('production');

  const healthyCount = SERVICES.filter(s => s.status === 'healthy').length;
  const degradedCount = SERVICES.filter(s => s.status !== 'healthy').length;

  const toggleFlag = (id: string) => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, status: f.status === 'enabled' ? 'disabled' : 'enabled' } as FeatureFlag : f));
    toast.success('Feature flag updated');
  };

  const openFlag = (f: FeatureFlag) => { setSelectedFlag(f); setDrawer('flag'); };
  const openAudit = (a: AuditEntry) => { setSelectedAudit(a); setDrawer('audit'); };

  const filteredAudit = AUDIT_LOG.filter(a => {
    if (auditFilter !== 'all' && a.severity !== auditFilter) return false;
    if (search && !a.action.toLowerCase().includes(search.toLowerCase()) && !a.target.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const topStrip = (
    <>
      <Terminal className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Super Admin Command Center</span>
      {incidentMode && <Badge className="text-[6px] border-0 bg-destructive/10 text-destructive gap-0.5 animate-pulse"><Siren className="h-2 w-2" />INCIDENT MODE</Badge>}
      <div className="flex-1" />
      <div className={cn("flex items-center gap-1 text-[7px] font-mono px-2 py-0.5 rounded-md border", env === 'production' ? 'text-accent border-accent/30' : 'text-[hsl(var(--gigvora-amber))] border-[hsl(var(--gigvora-amber))]/30')}>
        <Radio className="h-2 w-2 animate-pulse" />{env.toUpperCase()}
      </div>
      <select value={env} onChange={e => setEnv(e.target.value as 'production' | 'staging')} className="h-5 text-[7px] bg-transparent border rounded px-1 ml-1">
        <option value="production">Production</option><option value="staging">Staging</option>
      </select>
      <div className="flex items-center gap-1.5 ml-2">
        <span className="text-[8px] text-muted-foreground">Incident Mode</span>
        <Switch checked={incidentMode} onCheckedChange={v => { setIncidentMode(v); toast[v ? 'error' : 'success'](v ? 'Incident mode activated!' : 'Incident mode deactivated'); }} className="scale-[0.6]" />
      </div>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Platform Health" icon={<Gauge className="h-3.5 w-3.5 text-accent" />}>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[8px]">
            <span className="text-muted-foreground">Services</span>
            <span className="font-semibold">{healthyCount}/{SERVICES.length} healthy</span>
          </div>
          <Progress value={(healthyCount / SERVICES.length) * 100} className="h-1.5" />
          {degradedCount > 0 && <div className="text-[7px] text-destructive font-medium">{degradedCount} service(s) need attention</div>}
          <div className="space-y-0.5 mt-1">
            {SERVICES.filter(s => s.status !== 'healthy').map(s => (
              <div key={s.id} className="flex items-center gap-1.5 text-[7px] p-1 rounded-md border">
                {s.status === 'degraded' ? <AlertTriangle className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" /> : s.status === 'down' ? <XCircle className="h-2.5 w-2.5 text-destructive" /> : <Settings className="h-2.5 w-2.5 text-accent" />}
                <span className="font-medium">{s.name}</span>
                <Badge className={cn('text-[4px] border-0 ml-auto capitalize', HEALTH_COLORS[s.status])}>{s.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Cross-Domain Links" icon={<Layers className="h-3.5 w-3.5 text-accent" />}>
        <div className="space-y-0.5">
          {[
            { label: 'Trust & Safety', icon: Shield, to: '/admin/trust-safety' },
            { label: 'Finance Admin', icon: DollarSign, to: '/admin/finance-dashboard' },
            { label: 'Moderation', icon: Eye, to: '/admin/moderator-dashboard' },
            { label: 'Ads Ops', icon: Globe, to: '/admin/ads-ops' },
            { label: 'Verification', icon: ShieldCheck, to: '/admin/verification-compliance' },
            { label: 'Disputes', icon: Gavel, to: '/admin/dispute-ops' },
          ].map(l => (
            <Link key={l.label} to={l.to}>
              <button className="flex items-center gap-2 p-1.5 rounded-md w-full text-left hover:bg-muted/30 transition-colors text-[8px]">
                <l.icon className="h-3 w-3 text-muted-foreground" /><span>{l.label}</span>
                <ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" />
              </button>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions" icon={<Zap className="h-3.5 w-3.5 text-accent" />}>
        <div className="space-y-0.5">
          {[
            { label: 'Export Platform Audit', icon: Download, action: () => toast.success('Audit export started') },
            { label: 'Rotate API Keys', icon: Key, action: () => toast.info('Key rotation initiated') },
            { label: 'Flush Platform Cache', icon: Database, action: () => toast.success('Cache flushed') },
            { label: 'Broadcast Alert', icon: Radio, action: () => toast.info('Alert broadcast sent') },
          ].map(a => (
            <button key={a.label} onClick={a.action} className="flex items-center gap-2 p-1.5 rounded-md w-full text-left hover:bg-muted/30 transition-colors text-[8px]">
              <a.icon className="h-3 w-3 text-muted-foreground" /><span>{a.label}</span>
              <ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52">
      {/* Incident Mode Banner */}
      {incidentMode && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 mb-3 flex items-center gap-2">
          <Siren className="h-4 w-4 text-destructive shrink-0 animate-pulse" />
          <div className="flex-1">
            <div className="text-[10px] font-semibold text-destructive">Platform Incident Mode Active</div>
            <p className="text-[8px] text-muted-foreground">All non-critical deployments paused · Emergency contacts notified · Dual approval required for state changes</p>
          </div>
          <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg border-destructive/30 text-destructive" onClick={() => { setIncidentMode(false); toast.success('Incident mode deactivated'); }}>Deactivate</Button>
        </div>
      )}

      {/* KPI Band */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5 mb-3">
        {[
          { label: 'Active Users', value: '24.8K', delta: '↑ 8%', icon: Users, state: 'healthy' },
          { label: 'API req/min', value: '52.1K', delta: 'P95: 68ms', icon: Gauge, state: 'healthy' },
          { label: 'Error Rate', value: '0.19%', delta: '↓ 0.03%', icon: AlertTriangle, state: 'healthy' },
          { label: 'Active Flags', value: `${flags.filter(f => f.status === 'enabled' || f.status === 'rollout').length}/${flags.length}`, delta: '3 rollout', icon: Flag, state: 'caution' },
          { label: 'Overrides', value: `${OVERRIDES.filter(o => o.active).length}`, delta: '1 expiring', icon: ToggleLeft, state: 'caution' },
          { label: 'Open Queues', value: `${QUEUE_SUMMARY.reduce((s, q) => s + q.pending, 0)}`, delta: `${QUEUE_SUMMARY.reduce((s, q) => s + q.escalated, 0)} escalated`, icon: Layers, state: 'blocked' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border bg-card p-2 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-1 text-[7px] text-muted-foreground mb-0.5"><k.icon className="h-2.5 w-2.5" />{k.label}</div>
            <div className="text-sm font-bold">{k.value}</div>
            <div className={cn('text-[7px]', k.state === 'healthy' ? 'text-[hsl(var(--state-healthy))]' : k.state === 'blocked' ? 'text-[hsl(var(--state-blocked))]' : 'text-[hsl(var(--gigvora-amber))]')}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Service alert */}
      {degradedCount > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2 flex items-center gap-2 text-[8px] mb-3">
          <AlertOctagon className="h-3.5 w-3.5 text-destructive shrink-0" />
          <div className="flex-1"><strong>{degradedCount} services need attention:</strong> {SERVICES.filter(s => s.status !== 'healthy').map(s => `${s.name} (${s.status})`).join(', ')}</div>
          <Button variant="outline" size="sm" className="h-5 text-[6px] rounded-lg" onClick={() => setActiveTab('health')}>View</Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-3 flex-wrap h-auto gap-0.5">
          <TabsTrigger value="command" className="gap-1 text-[9px] h-6 px-2"><Terminal className="h-3 w-3" />Command Center</TabsTrigger>
          <TabsTrigger value="flags" className="gap-1 text-[9px] h-6 px-2"><Flag className="h-3 w-3" />Feature Flags</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1 text-[9px] h-6 px-2"><History className="h-3 w-3" />Audit Explorer</TabsTrigger>
          <TabsTrigger value="overrides" className="gap-1 text-[9px] h-6 px-2"><ToggleLeft className="h-3 w-3" />Overrides</TabsTrigger>
          <TabsTrigger value="env" className="gap-1 text-[9px] h-6 px-2"><Server className="h-3 w-3" />Environment</TabsTrigger>
          <TabsTrigger value="health" className="gap-1 text-[9px] h-6 px-2"><Activity className="h-3 w-3" />Ops Health</TabsTrigger>
          <TabsTrigger value="queues" className="gap-1 text-[9px] h-6 px-2"><Layers className="h-3 w-3" />Cross-Domain</TabsTrigger>
          <TabsTrigger value="mobile" className="gap-1 text-[9px] h-6 px-2"><Smartphone className="h-3 w-3" />Mobile</TabsTrigger>
        </TabsList>

        {/* COMMAND CENTER */}
        <TabsContent value="command">
          <div className="space-y-3">
            <div className="rounded-xl border bg-card p-3">
              <div className="text-[9px] font-semibold mb-2">Platform Traffic (24h)</div>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PLATFORM_TREND}>
                    <XAxis dataKey="hour" tick={{ fontSize: 7 }} />
                    <YAxis tick={{ fontSize: 7 }} />
                    <Tooltip contentStyle={{ fontSize: 8 }} />
                    <Area type="monotone" dataKey="requests" fill="hsl(var(--primary))" stroke="hsl(var(--primary))" fillOpacity={0.15} name="Requests" />
                    <Area type="monotone" dataKey="errors" fill="hsl(var(--state-blocked))" stroke="hsl(var(--state-blocked))" fillOpacity={0.2} name="Errors" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <div className="text-[9px] font-semibold mb-2">Quick Actions</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                {[
                  { label: 'Toggle Incident', icon: Siren, action: () => { setIncidentMode(!incidentMode); }, variant: 'destructive' as const },
                  { label: 'Flush Cache', icon: Database, action: () => toast.success('Cache flushed'), variant: 'outline' as const },
                  { label: 'Force Deploy', icon: Rocket, action: () => toast.info('Deployment queued'), variant: 'outline' as const },
                  { label: 'Rotate Keys', icon: Key, action: () => toast.info('Key rotation initiated'), variant: 'outline' as const },
                  { label: 'Pause Queues', icon: Lock, action: () => toast.info('Queues paused'), variant: 'outline' as const },
                  { label: 'Broadcast Alert', icon: Radio, action: () => toast.info('Alert broadcast'), variant: 'outline' as const },
                  { label: 'Impersonate User', icon: Eye, action: () => toast.info('Impersonation session'), variant: 'outline' as const },
                  { label: 'Export Audit', icon: FileText, action: () => toast.success('Audit export started'), variant: 'outline' as const },
                ].map(a => (
                  <Button key={a.label} variant={a.variant} size="sm" className="h-8 text-[7px] rounded-lg gap-1 justify-start" onClick={a.action}>
                    <a.icon className="h-3 w-3" />{a.label}
                  </Button>
                ))}
              </div>
            </div>
            {/* Recent audit entries inline */}
            <div className="rounded-xl border bg-card p-3">
              <div className="text-[9px] font-semibold mb-2 flex items-center gap-1"><History className="h-3 w-3 text-accent" />Recent Activity</div>
              <div className="space-y-1">
                {AUDIT_LOG.slice(0, 4).map(a => (
                  <button key={a.id} onClick={() => openAudit(a)} className="w-full text-left rounded-md p-1.5 hover:bg-muted/10 transition-colors text-[7px] flex items-center gap-2">
                    <Badge className={cn("text-[4px] border-0 w-12 justify-center", sevColor(a.severity))}>{a.severity}</Badge>
                    <span className="font-semibold">{a.actor}</span>
                    <span className="text-muted-foreground truncate flex-1">{a.action}</span>
                    <span className="text-muted-foreground shrink-0">{a.timestamp}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* FEATURE FLAGS */}
        <TabsContent value="flags">
          <div className="space-y-1.5">
            {flags.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.key.toLowerCase().includes(search.toLowerCase())).map(f => (
              <div key={f.id} onClick={() => openFlag(f)} className={cn('rounded-xl border bg-card p-3 cursor-pointer hover:border-ring/50 transition-colors', f.conflict && 'border-[hsl(var(--gigvora-amber))]/30')}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <Badge variant="secondary" className="text-[7px] font-mono">{f.id}</Badge>
                      <Badge className={cn('text-[6px] border-0 capitalize', FLAG_STATUS_COLORS[f.status])}>{f.status.replace('_', ' ')}</Badge>
                      <Badge variant="secondary" className="text-[6px]">{f.tenantScope}</Badge>
                      {f.conflict && <Badge className="text-[5px] border-0 bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))] gap-0.5"><AlertTriangle className="h-2 w-2" />Conflict</Badge>}
                    </div>
                    <div className="text-[10px] font-semibold">{f.name}</div>
                    <code className="text-[7px] text-muted-foreground">{f.key}</code>
                    <p className="text-[7px] text-muted-foreground mt-0.5">{f.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {f.status === 'rollout' && (
                      <div className="text-right">
                        <div className="text-[7px] text-muted-foreground">Coverage</div>
                        <div className="text-[10px] font-semibold">{f.coverage}%</div>
                        <Progress value={f.coverage} className="h-1 w-16 mt-0.5" />
                      </div>
                    )}
                    <Switch checked={f.status === 'enabled' || f.status === 'rollout'} onCheckedChange={() => toggleFlag(f.id)} className="scale-[0.65]" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-[6px] text-muted-foreground">
                  <span>Owner: {f.owner}</span><span>·</span><span>Updated: {f.updated}</span><span>·</span>
                  <div className="flex gap-1">
                    {(['prod', 'staging', 'dev'] as const).map(e => (
                      <Badge key={e} className={cn('text-[4px] border-0', f.environments[e] ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : 'bg-muted text-muted-foreground')}>{e}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* AUDIT EXPLORER */}
        <TabsContent value="audit">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search audit..." className="pl-7 h-7 text-[8px] rounded-lg" />
            </div>
            <select value={auditFilter} onChange={e => setAuditFilter(e.target.value)} className="h-7 px-2 text-[8px] rounded-lg border bg-card">
              <option value="all">All Severity</option><option value="critical">Critical</option><option value="warning">Warning</option><option value="info">Info</option>
            </select>
            <Button variant="ghost" size="sm" className="h-7 text-[7px] rounded-lg gap-1" onClick={() => { setSearch(''); setAuditFilter('all'); }}><RefreshCw className="h-2.5 w-2.5" />Reset</Button>
          </div>
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-[8px]">
              <thead><tr className="border-b bg-muted/20">
                <th className="px-2 py-1.5 text-left font-semibold">ID</th>
                <th className="px-2 py-1.5 text-left font-semibold">Actor</th>
                <th className="px-2 py-1.5 text-left font-semibold">Action</th>
                <th className="px-2 py-1.5 text-left font-semibold">Target</th>
                <th className="px-2 py-1.5 text-left font-semibold">Severity</th>
                <th className="px-2 py-1.5 text-left font-semibold">Time</th>
              </tr></thead>
              <tbody className="divide-y">
                {filteredAudit.map(a => (
                  <tr key={a.id} onClick={() => openAudit(a)} className="hover:bg-muted/10 cursor-pointer transition-colors">
                    <td className="px-2 py-1.5 font-mono font-semibold">{a.id}</td>
                    <td className="px-2 py-1.5">{a.actor}</td>
                    <td className="px-2 py-1.5">{a.action}</td>
                    <td className="px-2 py-1.5 text-muted-foreground truncate max-w-[180px]">{a.target}</td>
                    <td className="px-2 py-1.5"><Badge className={cn("text-[5px] border-0", sevColor(a.severity))}>{a.severity}</Badge></td>
                    <td className="px-2 py-1.5 text-muted-foreground">{a.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* SYSTEM OVERRIDES */}
        <TabsContent value="overrides">
          <div className="space-y-2">
            {OVERRIDES.map(o => (
              <div key={o.id} className={cn("rounded-xl border bg-card p-3 hover:shadow-sm transition-shadow", o.active && "border-[hsl(var(--gigvora-amber))]/30")}>
                <div className="flex items-center gap-3">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", o.active ? 'bg-[hsl(var(--gigvora-amber))]/10' : 'bg-muted/30')}>
                    {o.type === 'killswitch' ? <Power className={cn("h-4 w-4", o.active ? 'text-destructive' : 'text-muted-foreground')} /> : o.type === 'rate-limit' ? <Gauge className="h-4 w-4 text-[hsl(var(--gigvora-amber))]" /> : o.type === 'maintenance' ? <Settings className="h-4 w-4 text-muted-foreground" /> : <Lock className="h-4 w-4 text-accent" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-bold">{o.name}</span>
                      <Badge className={cn("text-[5px] border-0", o.active ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : 'bg-muted text-muted-foreground')}>{o.active ? 'ACTIVE' : 'INACTIVE'}</Badge>
                    </div>
                    <div className="text-[7px] text-muted-foreground">{o.reason}</div>
                    <div className="text-[6px] text-muted-foreground">By: {o.activatedBy} · {o.activatedAt}{o.expiresAt ? ` · Expires: ${o.expiresAt}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => toast.success(o.active ? 'Deactivated' : 'Reactivated')}>
                      {o.active ? <XCircle className="h-2.5 w-2.5" /> : <CheckCircle2 className="h-2.5 w-2.5" />}{o.active ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ENVIRONMENT */}
        <TabsContent value="env">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card p-3">
              <div className="text-[9px] font-semibold mb-2">Environment Configuration</div>
              <div className="space-y-1">
                {[
                  { key: 'NODE_ENV', value: env, editable: false },
                  { key: 'API_VERSION', value: 'v2.4.1', editable: false },
                  { key: 'DB_POOL_SIZE', value: '20', editable: true },
                  { key: 'RATE_LIMIT_RPM', value: '1000', editable: true },
                  { key: 'LOG_LEVEL', value: 'info', editable: true },
                  { key: 'CACHE_TTL', value: '3600', editable: true },
                ].map(c => (
                  <div key={c.key} className="flex items-center gap-2 text-[7px] py-1 border-b last:border-0">
                    <code className="font-mono bg-muted px-1 py-0.5 rounded text-[6px] w-28">{c.key}</code>
                    <span className="flex-1 font-semibold">{c.value}</span>
                    {c.editable ? <Button variant="ghost" size="sm" className="h-4 w-4 p-0"><Settings className="h-2.5 w-2.5" /></Button> : <Lock className="h-2.5 w-2.5 text-muted-foreground" />}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <div className="text-[9px] font-semibold mb-2">Deployment Info</div>
              <div className="space-y-1 text-[7px]">
                {[
                  { l: 'Version', v: 'v2.4.1-build.3847' },
                  { l: 'Last Deploy', v: '2026-04-13 08:45 UTC' },
                  { l: 'Region', v: 'us-east-1 (primary)' },
                  { l: 'Replicas', v: '8 / 12 max' },
                  { l: 'DB', v: 'PostgreSQL 16.2' },
                ].map(d => (
                  <div key={d.l} className="flex justify-between py-0.5 border-b last:border-0">
                    <span className="text-muted-foreground">{d.l}</span>
                    <span className="font-semibold">{d.v}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-md border border-accent/20 bg-accent/5 p-2 text-[7px] mt-2 flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-accent shrink-0" />
                <span>Environment changes require L3 authority and full audit trail.</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* OPS HEALTH */}
        <TabsContent value="health">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 rounded-xl border bg-card overflow-hidden">
              <table className="w-full text-[8px]">
                <thead><tr className="border-b bg-muted/20">
                  <th className="px-2 py-1.5 text-left font-semibold">Service</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Status</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Latency</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Uptime</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Load</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Region</th>
                </tr></thead>
                <tbody className="divide-y">
                  {SERVICES.map(s => (
                    <tr key={s.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-2 py-1.5 font-semibold flex items-center gap-1.5">
                        <div className={cn("h-1.5 w-1.5 rounded-full", s.status === 'healthy' ? 'bg-[hsl(var(--state-healthy))]' : s.status === 'degraded' ? 'bg-[hsl(var(--gigvora-amber))]' : s.status === 'down' ? 'bg-destructive' : 'bg-accent')} />
                        {s.name}
                      </td>
                      <td className="px-2 py-1.5"><Badge className={cn("text-[5px] border-0 capitalize", HEALTH_COLORS[s.status])}>{s.status}</Badge></td>
                      <td className="px-2 py-1.5 font-mono">{s.latency}</td>
                      <td className="px-2 py-1.5 font-mono">{s.uptime}</td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1">
                          <div className="w-10 h-1 rounded-full bg-muted overflow-hidden"><div className={cn("h-full rounded-full", s.load > 60 ? 'bg-[hsl(var(--gigvora-amber))]' : 'bg-[hsl(var(--state-healthy))]')} style={{ width: `${s.load}%` }} /></div>
                          <span className="text-[6px]">{s.load}%</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-muted-foreground"><div className="flex items-center gap-0.5"><Globe className="h-2 w-2" />{s.region}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <div className="text-[9px] font-semibold mb-2">Latency (24h)</div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={PLATFORM_TREND}>
                    <XAxis dataKey="hour" tick={{ fontSize: 7 }} />
                    <YAxis tick={{ fontSize: 7 }} />
                    <Tooltip contentStyle={{ fontSize: 8 }} />
                    <Bar dataKey="latency" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="P95 (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* CROSS-DOMAIN QUEUES */}
        <TabsContent value="queues">
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-[8px]">
              <thead><tr className="border-b bg-muted/20">
                <th className="px-2 py-1.5 text-left font-semibold">Queue</th>
                <th className="px-2 py-1.5 text-left font-semibold">Pending</th>
                <th className="px-2 py-1.5 text-left font-semibold">Escalated</th>
                <th className="px-2 py-1.5 text-left font-semibold">SLA</th>
                <th className="px-2 py-1.5 text-left font-semibold">Jump</th>
              </tr></thead>
              <tbody className="divide-y">
                {QUEUE_SUMMARY.map(q => (
                  <tr key={q.queue} className="hover:bg-muted/10 transition-colors">
                    <td className="px-2 py-1.5 font-semibold">{q.queue}</td>
                    <td className="px-2 py-1.5"><Badge className="text-[5px] border-0 bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]">{q.pending}</Badge></td>
                    <td className="px-2 py-1.5"><Badge className="text-[5px] border-0 bg-destructive/10 text-destructive">{q.escalated}</Badge></td>
                    <td className="px-2 py-1.5"><Badge className={cn("text-[5px] border-0", parseFloat(q.sla) >= 95 ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : parseFloat(q.sla) >= 90 ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : 'bg-destructive/10 text-destructive')}>{q.sla}</Badge></td>
                    <td className="px-2 py-1.5"><Link to={q.link}><Button size="sm" variant="ghost" className="h-5 text-[6px] rounded-lg gap-0.5"><ChevronRight className="h-2.5 w-2.5" />Open</Button></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* MOBILE */}
        <TabsContent value="mobile">
          <div className="rounded-xl border bg-card p-3 mb-2">
            <div className="text-[9px] font-semibold mb-1.5 flex items-center gap-1"><Smartphone className="h-3 w-3 text-accent" />Emergency Mobile View</div>
            <div className="text-[7px] text-muted-foreground mb-2">Read-only view. Configuration changes require desktop.</div>
            <div className="space-y-1.5">
              {SERVICES.filter(s => s.status !== 'healthy').map(s => (
                <div key={s.id} className="rounded-lg border border-destructive/20 p-2 flex items-center gap-2 text-[7px]">
                  <div className={cn("h-2 w-2 rounded-full", s.status === 'degraded' ? 'bg-[hsl(var(--gigvora-amber))]' : s.status === 'down' ? 'bg-destructive' : 'bg-accent')} />
                  <span className="font-semibold flex-1">{s.name}</span>
                  <Badge className={cn("text-[5px] border-0 capitalize", HEALTH_COLORS[s.status])}>{s.status}</Badge>
                </div>
              ))}
              <div className="rounded-lg border p-2 mt-1">
                <div className="text-[7px] font-semibold mb-1">Active Overrides</div>
                {OVERRIDES.filter(o => o.active).map(o => (
                  <div key={o.id} className="text-[6px] py-0.5 border-b last:border-0"><strong>{o.name}</strong> — {o.reason}</div>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 p-2 text-[7px] flex items-center gap-2">
            <AlertTriangle className="h-3 w-3 text-[hsl(var(--gigvora-amber))] shrink-0" />
            <span>Feature flags, environment config, and system overrides require desktop access.</span>
          </div>
        </TabsContent>
      </Tabs>

      {/* Flag Drawer */}
      <Sheet open={drawer === 'flag'} onOpenChange={() => setDrawer(null)}>
        <SheetContent className="w-[480px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><ToggleLeft className="h-4 w-4 text-accent" />Flag Inspector</SheetTitle></SheetHeader>
          {selectedFlag && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="secondary" className="text-[7px] font-mono">{selectedFlag.id}</Badge>
                <Badge className={cn('text-[6px] border-0 capitalize', FLAG_STATUS_COLORS[selectedFlag.status])}>{selectedFlag.status.replace('_', ' ')}</Badge>
                <Badge variant="secondary" className="text-[6px]">{selectedFlag.tenantScope}</Badge>
              </div>
              <div className="text-sm font-semibold">{selectedFlag.name}</div>
              <code className="text-[8px] text-muted-foreground bg-muted px-1 py-0.5 rounded">{selectedFlag.key}</code>
              <p className="text-[8px] text-muted-foreground">{selectedFlag.description}</p>

              {selectedFlag.status === 'rollout' && (
                <div>
                  <div className="flex justify-between text-[8px] mb-1"><span className="text-muted-foreground">Rollout</span><span className="font-semibold">{selectedFlag.coverage}%</span></div>
                  <Progress value={selectedFlag.coverage} className="h-2" />
                </div>
              )}

              <div className="rounded-md border p-2.5">
                <div className="text-[9px] font-semibold mb-2">Environments</div>
                {(['prod', 'staging', 'dev'] as const).map(e => (
                  <div key={e} className="flex items-center justify-between text-[8px] py-1">
                    <span className="capitalize font-medium">{e}</span>
                    <Badge className={cn('text-[5px] border-0', selectedFlag.environments[e] ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : 'bg-muted text-muted-foreground')}>{selectedFlag.environments[e] ? 'ON' : 'OFF'}</Badge>
                  </div>
                ))}
              </div>

              {selectedFlag.conflict && (
                <div className="rounded-lg border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 p-2 text-[8px] flex items-start gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-[hsl(var(--gigvora-amber))] shrink-0 mt-0.5" />
                  <div><strong>Conflict:</strong> {selectedFlag.conflict}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[8px]">
                {[{ l: 'Owner', v: selectedFlag.owner }, { l: 'Updated', v: selectedFlag.updated }, { l: 'Created', v: selectedFlag.created }, { l: 'Coverage', v: `${selectedFlag.coverage}%` }].map(m => (
                  <div key={m.l} className="rounded-md border p-2"><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="font-medium">{m.v}</div></div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 border-t pt-3">
                {selectedFlag.status !== 'kill_switch' && <Button size="sm" className="h-6 text-[8px] gap-1" onClick={() => { toggleFlag(selectedFlag.id); setDrawer(null); }}><ToggleLeft className="h-2.5 w-2.5" />{selectedFlag.status === 'enabled' ? 'Disable' : 'Enable'}</Button>}
                {selectedFlag.status === 'rollout' && <Button variant="outline" size="sm" className="h-6 text-[8px] gap-1" onClick={() => toast.info('Rollout advanced')}><TrendingUp className="h-2.5 w-2.5" />Advance</Button>}
                {selectedFlag.status === 'kill_switch' && <Button variant="destructive" size="sm" className="h-6 text-[8px] gap-1" onClick={() => toast.error('Kill switch activated!')}><Siren className="h-2.5 w-2.5" />Activate</Button>}
                <Button variant="outline" size="sm" className="h-6 text-[8px] gap-1"><History className="h-2.5 w-2.5" />History</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Audit Drawer */}
      <Sheet open={drawer === 'audit'} onOpenChange={() => setDrawer(null)}>
        <SheetContent className="w-[480px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4 text-accent" />Audit Entry</SheetTitle></SheetHeader>
          {selectedAudit && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-mono font-bold">{selectedAudit.id}</span>
                <Badge className={cn("text-[7px] border-0", sevColor(selectedAudit.severity))}>{selectedAudit.severity}</Badge>
                <Badge variant="secondary" className="text-[7px]">{selectedAudit.scope}</Badge>
                <Badge variant="secondary" className="text-[7px] bg-accent/10 text-accent">{selectedAudit.env}</Badge>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-[9px] font-semibold mb-1">Action</div>
                <div className="text-[10px]">{selectedAudit.action}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-[9px] font-semibold mb-1">Target</div>
                <div className="text-[9px] text-muted-foreground">{selectedAudit.target}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-[9px] font-semibold mb-1">Actor</div>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center font-bold text-[8px]">{selectedAudit.actor.charAt(0)}</div>
                  <div><div className="text-[10px] font-bold">{selectedAudit.actor}</div><div className="text-[7px] text-muted-foreground">{selectedAudit.timestamp}</div></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" className="h-7 text-[8px] rounded-lg gap-1" onClick={() => toast.info('Exported')}><FileText className="h-3 w-3" />Export</Button>
                <Button size="sm" variant="outline" className="h-7 text-[8px] rounded-lg gap-1" onClick={() => toast.info('Flagged')}><Flag className="h-3 w-3" />Flag</Button>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <Link to="/admin/trust-safety"><Button variant="ghost" size="sm" className="h-5 text-[6px] rounded-lg gap-0.5"><Shield className="h-2 w-2" />T&S</Button></Link>
                <Link to="/admin/finance-dashboard"><Button variant="ghost" size="sm" className="h-5 text-[6px] rounded-lg gap-0.5"><DollarSign className="h-2 w-2" />Finance</Button></Link>
                <Link to="/admin/dispute-ops"><Button variant="ghost" size="sm" className="h-5 text-[6px] rounded-lg gap-0.5"><Gavel className="h-2 w-2" />Disputes</Button></Link>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-2 flex items-center gap-2 safe-area-bottom">
        {[
          { tab: 'command', icon: Terminal, label: 'Command' },
          { tab: 'flags', icon: Flag, label: 'Flags' },
          { tab: 'health', icon: Activity, label: 'Health' },
          { tab: 'audit', icon: History, label: 'Audit' },
        ].map(n => (
          <button key={n.tab} onClick={() => setActiveTab(n.tab)} className={cn('flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg', activeTab === n.tab ? 'text-accent' : 'text-muted-foreground')}>
            <n.icon className="h-4 w-4" /><span className="text-[7px]">{n.label}</span>
          </button>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminPage;
