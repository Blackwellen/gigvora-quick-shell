import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import {
  Shield, Search, Terminal, Activity, Clock, ChevronRight, Users, Bell,
  AlertTriangle, Server, Zap, CheckCircle2, XCircle, Eye, Flag, Lock,
  FileText, BarChart3, Settings, Globe, Radio, Cpu, Landmark, Gavel,
  HeadphonesIcon, ShieldAlert, ShieldCheck, ArrowRight, ExternalLink,
  Command, Hash, Inbox, TrendingUp, AlertOctagon, RefreshCw, Pin,
  PanelRightOpen, Maximize2, Filter, MoreHorizontal, ChevronDown,
  Layers, Bookmark, Copy, MessageSquare, CreditCard, UserCheck,
  Wifi, Database, Smartphone, KeyRound, LayoutGrid, List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ── Types ── */
type AdminRole = 'super-admin' | 'cs-admin' | 'finance-admin' | 'moderator' | 'trust-safety' | 'dispute-mgr' | 'ads-ops' | 'compliance';

interface QueueItem {
  id: string; type: string; title: string; severity: 'critical' | 'high' | 'medium' | 'low';
  assignee: string; age: string; status: 'open' | 'in-progress' | 'escalated' | 'blocked';
  domain: string;
}

interface ShortcutEntry { keys: string; label: string; action: () => void; }

/* ── Mock Data ── */
const QUEUES: QueueItem[] = [
  { id: 'TKT-4821', type: 'Support', title: 'Payment failed — user locked out', severity: 'critical', assignee: 'M. Chen', age: '12m', status: 'open', domain: 'finance' },
  { id: 'MOD-1092', type: 'Moderation', title: 'Flagged profile — impersonation report', severity: 'high', assignee: 'Unassigned', age: '45m', status: 'open', domain: 'moderation' },
  { id: 'DSP-0334', type: 'Dispute', title: 'Escrow hold — milestone rejected', severity: 'high', assignee: 'R. Patel', age: '2h', status: 'in-progress', domain: 'disputes' },
  { id: 'FIN-7720', type: 'Finance', title: 'Payout anomaly — duplicate charge detected', severity: 'critical', assignee: 'S. Kim', age: '8m', status: 'escalated', domain: 'finance' },
  { id: 'TKT-4833', type: 'Support', title: 'Account recovery — MFA device lost', severity: 'medium', assignee: 'A. Lopez', age: '1h', status: 'in-progress', domain: 'support' },
  { id: 'VER-0091', type: 'Verification', title: 'ID verification — blurred document', severity: 'low', assignee: 'Unassigned', age: '3h', status: 'open', domain: 'verification' },
  { id: 'ADS-2210', type: 'Ads Ops', title: 'Campaign policy violation — misleading claims', severity: 'high', assignee: 'J. Park', age: '30m', status: 'in-progress', domain: 'ads' },
  { id: 'MOD-1105', type: 'Moderation', title: 'Reported content — hate speech', severity: 'critical', assignee: 'M. Chen', age: '5m', status: 'open', domain: 'moderation' },
];

const NAV_SECTIONS = [
  { label: 'Operations', items: [
    { icon: LayoutGrid, label: 'Dashboard', to: '/admin', badge: '' },
    { icon: Inbox, label: 'Queue Triage', to: '/admin/ops', badge: '23' },
    { icon: Users, label: 'User Lookup', to: '/admin', badge: '' },
    { icon: Search, label: 'Search Cases', to: '/admin', badge: '' },
  ]},
  { label: 'Queues', items: [
    { icon: HeadphonesIcon, label: 'Support', to: '/admin/ops', badge: '8' },
    { icon: Landmark, label: 'Finance', to: '/admin/finance', badge: '5' },
    { icon: ShieldAlert, label: 'Moderation', to: '/admin/moderation', badge: '12' },
    { icon: ShieldCheck, label: 'Trust & Safety', to: '/admin/trust', badge: '3' },
    { icon: Gavel, label: 'Disputes', to: '/admin/ops', badge: '4' },
    { icon: UserCheck, label: 'Verification', to: '/admin/ops', badge: '6' },
    { icon: Radio, label: 'Ads Ops', to: '/admin/ops', badge: '2' },
  ]},
  { label: 'System', items: [
    { icon: Activity, label: 'Audit Log', to: '/admin', badge: '' },
    { icon: Settings, label: 'Feature Flags', to: '/admin', badge: '' },
    { icon: Database, label: 'Data Health', to: '/admin', badge: '' },
    { icon: FileText, label: 'Compliance', to: '/admin/compliance', badge: '' },
  ]},
];

const ROLE_LABELS: Record<AdminRole, { label: string; icon: React.ElementType; color: string }> = {
  'super-admin': { label: 'Super Admin', icon: Shield, color: 'text-[hsl(var(--state-blocked))]' },
  'cs-admin': { label: 'Customer Service', icon: HeadphonesIcon, color: 'text-accent' },
  'finance-admin': { label: 'Finance Admin', icon: Landmark, color: 'text-[hsl(var(--state-healthy))]' },
  'moderator': { label: 'Moderator', icon: ShieldAlert, color: 'text-[hsl(var(--gigvora-amber))]' },
  'trust-safety': { label: 'Trust & Safety', icon: ShieldCheck, color: 'text-primary' },
  'dispute-mgr': { label: 'Dispute Manager', icon: Gavel, color: 'text-[hsl(var(--state-caution))]' },
  'ads-ops': { label: 'Ads Ops', icon: Radio, color: 'text-accent' },
  'compliance': { label: 'Compliance', icon: FileText, color: 'text-muted-foreground' },
};

const sevColor = (s: string) => s === 'critical' ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))] border-[hsl(var(--state-blocked))]/30' : s === 'high' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))] border-[hsl(var(--gigvora-amber))]/30' : s === 'medium' ? 'bg-accent/10 text-accent border-accent/30' : 'bg-muted text-muted-foreground border-muted';
const statusColor = (s: string) => s === 'open' ? 'bg-accent/10 text-accent' : s === 'in-progress' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : s === 'escalated' ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]' : 'bg-muted text-muted-foreground';

const InternalAdminShellPage: React.FC = () => {
  const [activeRole, setActiveRole] = useState<AdminRole>('super-admin');
  const [env, setEnv] = useState<'production' | 'staging' | 'sandbox'>('production');
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<QueueItem | null>(null);
  const [caseDrawer, setCaseDrawer] = useState(false);
  const [detachedPanes, setDetachedPanes] = useState<string[]>([]);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [pinnedCases, setPinnedCases] = useState<string[]>(['TKT-4821']);
  const [activeTab, setActiveTab] = useState('home');
  const [mobileSheet, setMobileSheet] = useState(false);

  /* ── Keyboard Shortcuts ── */
  const shortcuts: ShortcutEntry[] = [
    { keys: '⌘K', label: 'Command Bar', action: () => setCommandOpen(true) },
    { keys: 'G Q', label: 'Queue Jump', action: () => setActiveTab('queues') },
    { keys: 'G H', label: 'Admin Home', action: () => setActiveTab('home') },
    { keys: 'G A', label: 'Audit Log', action: () => toast.info('Opening audit log') },
    { keys: 'Esc', label: 'Close Drawer', action: () => { setCaseDrawer(false); setCommandOpen(false); } },
  ];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCommandOpen(true); }
      if (e.key === 'Escape') { setCommandOpen(false); setCaseDrawer(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const openCase = (item: QueueItem) => { setSelectedCase(item); setCaseDrawer(true); };
  const togglePin = (id: string) => setPinnedCases(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleDetach = (id: string) => { setDetachedPanes(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); toast.success(`Pane ${id} ${detachedPanes.includes(id) ? 'attached' : 'detached'}`); };

  const roleInfo = ROLE_LABELS[activeRole];
  const RoleIcon = roleInfo.icon;

  const filteredQueues = commandQuery ? QUEUES.filter(q => q.title.toLowerCase().includes(commandQuery.toLowerCase()) || q.id.toLowerCase().includes(commandQuery.toLowerCase())) : QUEUES;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ═══ Environment Ribbon ═══ */}
      <div className={cn('flex items-center gap-2 px-4 py-1 text-[8px] font-mono border-b',
        env === 'production' ? 'bg-[hsl(var(--state-blocked))]/5 text-[hsl(var(--state-blocked))]' :
        env === 'staging' ? 'bg-[hsl(var(--gigvora-amber))]/5 text-[hsl(var(--gigvora-amber))]' :
        'bg-accent/5 text-accent'
      )}>
        <Radio className="h-2.5 w-2.5 animate-pulse" />
        <span className="uppercase font-bold">{env}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">Internal Admin Shell v4.2</span>
        <div className="flex-1" />
        <select value={env} onChange={e => setEnv(e.target.value as typeof env)} className="bg-transparent border-none text-[8px] font-bold cursor-pointer">
          <option value="production">PRODUCTION</option>
          <option value="staging">STAGING</option>
          <option value="sandbox">SANDBOX</option>
        </select>
        <Badge variant="secondary" className="text-[6px] gap-0.5"><Wifi className="h-2 w-2" />Connected</Badge>
        <Badge variant="secondary" className="text-[6px] gap-0.5"><Clock className="h-2 w-2" />4h remaining</Badge>
      </div>

      {/* ═══ Admin Header ═══ */}
      <div className="bg-card border-b px-4 py-2 flex items-center gap-3">
        <button onClick={() => setNavCollapsed(!navCollapsed)} className="p-1 rounded-lg hover:bg-muted/30 transition-colors md:block hidden"><List className="h-4 w-4 text-muted-foreground" /></button>
        <div className="flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-accent" />
          <span className="text-[11px] font-bold tracking-tight">GIGVORA</span>
          <span className="text-[9px] text-muted-foreground hidden sm:inline">Admin Terminal</span>
        </div>

        {/* Command Bar Trigger */}
        <button onClick={() => setCommandOpen(true)} className="flex-1 max-w-md mx-4 flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
          <Search className="h-3 w-3 text-muted-foreground" />
          <span className="text-[9px] text-muted-foreground flex-1 text-left">Search cases, users, commands...</span>
          <kbd className="text-[7px] bg-muted/50 rounded px-1 py-0.5 font-mono">⌘K</kbd>
        </button>

        {/* Role Badge */}
        <button onClick={() => { const roles = Object.keys(ROLE_LABELS) as AdminRole[]; const idx = roles.indexOf(activeRole); setActiveRole(roles[(idx + 1) % roles.length]); }} className="flex items-center gap-1.5 px-2 py-1 rounded-xl border hover:bg-muted/20 transition-colors">
          <RoleIcon className={cn('h-3 w-3', roleInfo.color)} />
          <span className="text-[8px] font-semibold hidden md:inline">{roleInfo.label}</span>
          <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
        </button>

        {/* Quick Actions */}
        <div className="flex items-center gap-1">
          <button onClick={() => toast.info('Notifications')} className="relative p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-[hsl(var(--state-blocked))] text-[6px] text-white flex items-center justify-center font-bold">5</span>
          </button>
          <button onClick={() => setMobileSheet(true)} className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors md:hidden"><MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" /></button>
          <Link to="/admin/login" className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors"><KeyRound className="h-3.5 w-3.5 text-muted-foreground" /></Link>
        </div>
      </div>

      {/* ═══ Main Layout ═══ */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Rail */}
        <nav className={cn('hidden md:flex flex-col border-r bg-card/50 overflow-y-auto transition-all', navCollapsed ? 'w-14' : 'w-56')}>
          <div className="py-2 flex-1">
            {NAV_SECTIONS.map(section => (
              <div key={section.label} className="mb-2">
                {!navCollapsed && <div className="px-3 py-1 text-[7px] uppercase tracking-wider text-muted-foreground font-semibold">{section.label}</div>}
                {section.items.map(item => (
                  <Link key={item.label} to={item.to} className="flex items-center gap-2 px-3 py-1.5 mx-1 rounded-xl text-[9px] hover:bg-muted/30 transition-colors group">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-accent shrink-0" />
                    {!navCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!navCollapsed && item.badge && <Badge variant="secondary" className="text-[6px] h-4 min-w-[18px] justify-center">{item.badge}</Badge>}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Shortcuts Footer */}
          {!navCollapsed && (
            <div className="border-t p-2">
              <div className="text-[7px] text-muted-foreground mb-1 font-semibold">Shortcuts</div>
              {shortcuts.slice(0, 3).map(s => (
                <button key={s.keys} onClick={s.action} className="flex items-center gap-2 px-2 py-1 w-full rounded-lg text-[8px] hover:bg-muted/20 transition-colors">
                  <kbd className="text-[7px] bg-muted/50 rounded px-1 py-0.5 font-mono min-w-[28px] text-center">{s.keys}</kbd>
                  <span className="text-muted-foreground">{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* Main Canvas */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-4">
            {/* Workload Chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {[
                { label: 'Critical', count: QUEUES.filter(q => q.severity === 'critical').length, color: 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))] border-[hsl(var(--state-blocked))]/30' },
                { label: 'High', count: QUEUES.filter(q => q.severity === 'high').length, color: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))] border-[hsl(var(--gigvora-amber))]/30' },
                { label: 'Escalated', count: QUEUES.filter(q => q.status === 'escalated').length, color: 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))] border-[hsl(var(--state-blocked))]/30' },
                { label: 'Unassigned', count: QUEUES.filter(q => q.assignee === 'Unassigned').length, color: 'bg-accent/10 text-accent border-accent/30' },
                { label: 'My Queue', count: 3, color: 'bg-primary/10 text-primary border-primary/30' },
              ].map(c => (
                <button key={c.label} onClick={() => toast.info(`Filter: ${c.label}`)} className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[8px] font-semibold hover:shadow-sm transition-all', c.color)}>
                  {c.label}<span className="font-bold">{c.count}</span>
                </button>
              ))}
              <div className="flex-1" />
              <Badge variant="outline" className="text-[7px] gap-1"><Clock className="h-2.5 w-2.5" />Updated 8s ago</Badge>
              <button onClick={() => toast.success('Refreshed')} className="p-1 rounded-lg hover:bg-muted/20 transition-colors"><RefreshCw className="h-3 w-3 text-muted-foreground" /></button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 flex-wrap">
                <TabsTrigger value="home" className="text-[9px] gap-1"><LayoutGrid className="h-3 w-3" />Home</TabsTrigger>
                <TabsTrigger value="queues" className="text-[9px] gap-1"><Inbox className="h-3 w-3" />Queue Jump</TabsTrigger>
                <TabsTrigger value="cases" className="text-[9px] gap-1"><Eye className="h-3 w-3" />Cases</TabsTrigger>
                <TabsTrigger value="detached" className="text-[9px] gap-1"><Maximize2 className="h-3 w-3" />Detached</TabsTrigger>
                <TabsTrigger value="breadcrumbs" className="text-[9px] gap-1"><Layers className="h-3 w-3" />Trail</TabsTrigger>
                <TabsTrigger value="mobile" className="text-[9px] gap-1"><Smartphone className="h-3 w-3" />Mobile</TabsTrigger>
              </TabsList>

              {/* ═══ HOME ═══ */}
              <TabsContent value="home">
                {/* KPI Band */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {[
                    { label: 'Open Cases', value: '23', delta: '+3 today', icon: Inbox, state: 'caution' },
                    { label: 'Avg Resolution', value: '2.4h', delta: '-18% this week', icon: Clock, state: 'healthy' },
                    { label: 'SLA Breaches', value: '2', delta: '1 critical', icon: AlertTriangle, state: 'blocked' },
                    { label: 'Throughput', value: '89/day', delta: '+12% MoM', icon: TrendingUp, state: 'healthy' },
                  ].map(k => (
                    <div key={k.label} className="rounded-2xl border bg-card p-3 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground mb-1"><k.icon className="h-3 w-3" />{k.label}</div>
                      <div className="text-xl font-bold">{k.value}</div>
                      <div className={cn('text-[8px]', k.state === 'healthy' ? 'text-[hsl(var(--state-healthy))]' : k.state === 'blocked' ? 'text-[hsl(var(--state-blocked))]' : 'text-[hsl(var(--gigvora-amber))]')}>{k.delta}</div>
                    </div>
                  ))}
                </div>

                {/* Pinned Cases */}
                {pinnedCases.length > 0 && (
                  <div className="rounded-2xl border bg-card p-3 mb-4">
                    <div className="text-[9px] font-semibold mb-2 flex items-center gap-1"><Pin className="h-3 w-3 text-accent" />Pinned Cases</div>
                    <div className="flex flex-wrap gap-1.5">
                      {pinnedCases.map(id => {
                        const q = QUEUES.find(x => x.id === id);
                        return q ? (
                          <button key={id} onClick={() => openCase(q)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border hover:bg-muted/20 transition-colors text-[8px]">
                            <Badge variant="secondary" className={cn('text-[6px]', sevColor(q.severity))}>{q.severity}</Badge>
                            <span className="font-mono font-semibold">{q.id}</span>
                            <span className="text-muted-foreground truncate max-w-[120px]">{q.title}</span>
                            <button onClick={e => { e.stopPropagation(); togglePin(id); }} className="p-0.5 hover:bg-muted/30 rounded"><XCircle className="h-2.5 w-2.5 text-muted-foreground" /></button>
                          </button>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Recent Queue Activity */}
                <div className="rounded-2xl border bg-card overflow-hidden mb-4">
                  <div className="px-3 py-2 border-b flex items-center gap-2">
                    <span className="text-[9px] font-semibold">Active Queue</span>
                    <div className="flex-1" />
                    <button onClick={() => setActiveTab('queues')} className="text-[8px] text-accent hover:underline flex items-center gap-0.5">View All<ArrowRight className="h-2.5 w-2.5" /></button>
                  </div>
                  <div className="divide-y">
                    {QUEUES.slice(0, 5).map(q => (
                      <button key={q.id} onClick={() => openCase(q)} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/10 transition-colors">
                        <Badge variant="secondary" className={cn('text-[6px] shrink-0', sevColor(q.severity))}>{q.severity.slice(0, 4)}</Badge>
                        <span className="text-[9px] font-mono font-semibold shrink-0 w-16">{q.id}</span>
                        <span className="text-[9px] flex-1 truncate">{q.title}</span>
                        <Badge variant="secondary" className={cn('text-[6px]', statusColor(q.status))}>{q.status}</Badge>
                        <span className="text-[8px] text-muted-foreground shrink-0">{q.age}</span>
                        <button onClick={e => { e.stopPropagation(); togglePin(q.id); }} className={cn('p-0.5 rounded hover:bg-muted/30', pinnedCases.includes(q.id) ? 'text-accent' : 'text-muted-foreground')}><Pin className="h-2.5 w-2.5" /></button>
                      </button>
                    ))}
                  </div>
                </div>

                {/* System Health */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { label: 'API Latency', value: '45ms', health: 98, state: 'healthy' },
                    { label: 'Queue Depth', value: '342 items', health: 72, state: 'caution' },
                    { label: 'Error Rate', value: '0.02%', health: 99, state: 'healthy' },
                  ].map(s => (
                    <div key={s.label} className="rounded-2xl border bg-card p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-semibold">{s.label}</span>
                        <span className={cn('h-2 w-2 rounded-full', s.state === 'healthy' ? 'bg-[hsl(var(--state-healthy))]' : 'bg-[hsl(var(--gigvora-amber))]')} />
                      </div>
                      <div className="text-sm font-bold mb-1">{s.value}</div>
                      <Progress value={s.health} className="h-1" />
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* ═══ QUEUE JUMP ═══ */}
              <TabsContent value="queues">
                <div className="rounded-2xl border bg-card p-3 mb-4">
                  <div className="text-[9px] font-semibold mb-2 flex items-center gap-1"><Zap className="h-3 w-3 text-accent" />Quick Jump — select a queue to filter</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {NAV_SECTIONS[1].items.map(q => (
                      <Link key={q.label} to={q.to} className="flex items-center gap-2 p-2.5 rounded-xl border hover:bg-muted/20 hover:shadow-sm transition-all">
                        <q.icon className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="text-[9px] font-semibold">{q.label}</div>
                          <div className="text-[7px] text-muted-foreground">Queue depth: {q.badge || '0'}</div>
                        </div>
                        {q.badge && <Badge variant="secondary" className="text-[7px]">{q.badge}</Badge>}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Full Queue Table */}
                <div className="rounded-2xl border bg-card overflow-hidden">
                  <div className="px-3 py-2 border-b flex items-center gap-2">
                    <span className="text-[9px] font-semibold">All Cases</span>
                    <div className="flex-1" />
                    <button className="flex items-center gap-1 text-[8px] text-muted-foreground hover:text-accent transition-colors"><Filter className="h-2.5 w-2.5" />Filter</button>
                    <button className="flex items-center gap-1 text-[8px] text-muted-foreground hover:text-accent transition-colors"><Bookmark className="h-2.5 w-2.5" />Save View</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[9px]">
                      <thead><tr className="border-b bg-muted/20">
                        <th className="px-3 py-1.5 text-left font-semibold">ID</th>
                        <th className="px-2 py-1.5 text-left font-semibold">Type</th>
                        <th className="px-2 py-1.5 text-left font-semibold">Title</th>
                        <th className="px-2 py-1.5 text-left font-semibold">Severity</th>
                        <th className="px-2 py-1.5 text-left font-semibold">Status</th>
                        <th className="px-2 py-1.5 text-left font-semibold">Assignee</th>
                        <th className="px-2 py-1.5 text-left font-semibold">Age</th>
                        <th className="px-2 py-1.5 text-left font-semibold">Actions</th>
                      </tr></thead>
                      <tbody className="divide-y">
                        {QUEUES.map(q => (
                          <tr key={q.id} className="hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => openCase(q)}>
                            <td className="px-3 py-2 font-mono font-semibold">{q.id}</td>
                            <td className="px-2 py-2"><Badge variant="outline" className="text-[7px]">{q.type}</Badge></td>
                            <td className="px-2 py-2 max-w-[200px] truncate">{q.title}</td>
                            <td className="px-2 py-2"><Badge variant="secondary" className={cn('text-[6px]', sevColor(q.severity))}>{q.severity}</Badge></td>
                            <td className="px-2 py-2"><Badge variant="secondary" className={cn('text-[6px]', statusColor(q.status))}>{q.status}</Badge></td>
                            <td className="px-2 py-2 text-muted-foreground">{q.assignee}</td>
                            <td className="px-2 py-2 text-muted-foreground">{q.age}</td>
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-1">
                                <button onClick={e => { e.stopPropagation(); togglePin(q.id); }} className={cn('p-0.5 rounded hover:bg-muted/30', pinnedCases.includes(q.id) ? 'text-accent' : 'text-muted-foreground')}><Pin className="h-2.5 w-2.5" /></button>
                                <button onClick={e => { e.stopPropagation(); toggleDetach(q.id); }} className="p-0.5 rounded hover:bg-muted/30 text-muted-foreground"><Maximize2 className="h-2.5 w-2.5" /></button>
                                <button onClick={e => { e.stopPropagation(); toast.success(`Assigned ${q.id} to you`); }} className="p-0.5 rounded hover:bg-muted/30 text-muted-foreground"><UserCheck className="h-2.5 w-2.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              {/* ═══ CASE PREVIEWS ═══ */}
              <TabsContent value="cases">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {QUEUES.map(q => (
                    <button key={q.id} onClick={() => openCase(q)} className="rounded-2xl border bg-card p-3 text-left hover:shadow-sm transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className={cn('text-[6px]', sevColor(q.severity))}>{q.severity}</Badge>
                        <span className="text-[9px] font-mono font-semibold">{q.id}</span>
                        <Badge variant="secondary" className={cn('text-[6px]', statusColor(q.status))}>{q.status}</Badge>
                        <div className="flex-1" />
                        <span className="text-[8px] text-muted-foreground">{q.age}</span>
                      </div>
                      <div className="text-[10px] font-semibold mb-1">{q.title}</div>
                      <div className="flex items-center gap-2 text-[8px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{q.assignee}</span>
                        <span>·</span>
                        <span>{q.type}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg gap-0.5" onClick={e => { e.stopPropagation(); toast.success(`Assigned ${q.id}`); }}><UserCheck className="h-2.5 w-2.5" />Assign</Button>
                        <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg gap-0.5" onClick={e => { e.stopPropagation(); toast.info('Escalating'); }}><AlertTriangle className="h-2.5 w-2.5" />Escalate</Button>
                        <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg gap-0.5" onClick={e => { e.stopPropagation(); togglePin(q.id); }}><Pin className="h-2.5 w-2.5" />{pinnedCases.includes(q.id) ? 'Unpin' : 'Pin'}</Button>
                      </div>
                    </button>
                  ))}
                </div>
              </TabsContent>

              {/* ═══ DETACHED PANES ═══ */}
              <TabsContent value="detached">
                <div className="rounded-2xl border bg-card p-4 mb-4">
                  <div className="text-[9px] font-semibold mb-2 flex items-center gap-1"><Maximize2 className="h-3 w-3 text-accent" />Detached Panes</div>
                  {detachedPanes.length === 0 ? (
                    <div className="text-center py-8">
                      <Maximize2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <div className="text-[10px] text-muted-foreground">No detached panes</div>
                      <div className="text-[8px] text-muted-foreground">Click the detach icon on any case to open it in a separate pane</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {detachedPanes.map(id => {
                        const q = QUEUES.find(x => x.id === id);
                        return q ? (
                          <div key={id} className="rounded-xl border p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] font-mono font-bold">{q.id}</span>
                              <div className="flex items-center gap-1">
                                <button onClick={() => openCase(q)} className="p-0.5 rounded hover:bg-muted/20"><ExternalLink className="h-2.5 w-2.5 text-muted-foreground" /></button>
                                <button onClick={() => toggleDetach(id)} className="p-0.5 rounded hover:bg-muted/20"><XCircle className="h-2.5 w-2.5 text-muted-foreground" /></button>
                              </div>
                            </div>
                            <div className="text-[9px] font-semibold mb-1">{q.title}</div>
                            <div className="flex gap-1">
                              <Badge variant="secondary" className={cn('text-[6px]', sevColor(q.severity))}>{q.severity}</Badge>
                              <Badge variant="secondary" className={cn('text-[6px]', statusColor(q.status))}>{q.status}</Badge>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ═══ BREADCRUMB TRAIL ═══ */}
              <TabsContent value="breadcrumbs">
                <div className="rounded-2xl border bg-card p-4">
                  <div className="text-[9px] font-semibold mb-3 flex items-center gap-1"><Layers className="h-3 w-3 text-accent" />Navigation Trail</div>
                  <div className="space-y-1">
                    {[
                      { label: 'Admin Login', path: '/admin/login', time: '4m ago' },
                      { label: 'Admin Shell', path: '/admin/shell', time: '3m ago' },
                      { label: 'Support Queue', path: '/admin/ops', time: '2m ago' },
                      { label: 'Case TKT-4821', path: '#', time: '1m ago' },
                      { label: 'Finance Queue', path: '/admin/finance', time: '30s ago' },
                    ].map((b, i, arr) => (
                      <div key={i} className="flex items-center gap-2 text-[8px]">
                        <div className={cn('h-2 w-2 rounded-full shrink-0', i === arr.length - 1 ? 'bg-accent' : 'bg-muted-foreground/30')} />
                        <Link to={b.path} className="text-accent hover:underline flex-1">{b.label}</Link>
                        <span className="text-muted-foreground">{b.time}</span>
                        {i < arr.length - 1 && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/30" />}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* ═══ MOBILE TRIAGE ═══ */}
              <TabsContent value="mobile">
                <div className="rounded-2xl border bg-card p-4 mb-4">
                  <div className="text-[9px] font-semibold mb-2 flex items-center gap-1"><Smartphone className="h-3 w-3 text-accent" />Mobile Triage View</div>
                  <div className="text-[8px] text-muted-foreground mb-3">Simplified view for mobile triage. Full operations require desktop access.</div>
                  <div className="space-y-2">
                    {QUEUES.filter(q => q.severity === 'critical' || q.severity === 'high').map(q => (
                      <button key={q.id} onClick={() => openCase(q)} className="w-full rounded-xl border p-3 text-left hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className={cn('text-[6px]', sevColor(q.severity))}>{q.severity}</Badge>
                          <span className="text-[9px] font-mono font-bold">{q.id}</span>
                          <span className="text-[8px] text-muted-foreground ml-auto">{q.age}</span>
                        </div>
                        <div className="text-[9px] font-semibold">{q.title}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border bg-[hsl(var(--gigvora-amber))]/5 border-[hsl(var(--gigvora-amber))]/30 p-3 text-[8px] flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0" />
                  <span>State-changing actions are limited on mobile. Switch to desktop for full operations.</span>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* Right Rail */}
        <aside className="hidden lg:flex flex-col w-64 border-l bg-card/50 overflow-y-auto">
          <div className="p-3 border-b">
            <div className="text-[9px] font-semibold mb-2">Session Context</div>
            <div className="space-y-1 text-[8px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="font-semibold">{roleInfo.label}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Env</span><Badge variant="secondary" className="text-[6px]">{env}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Session</span><span>3h 48m left</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Actions</span><span>12 today</span></div>
            </div>
          </div>

          <div className="p-3 border-b">
            <div className="text-[9px] font-semibold mb-2">SLA Warnings</div>
            <div className="space-y-1">
              {QUEUES.filter(q => q.severity === 'critical').map(q => (
                <div key={q.id} className="rounded-lg border border-[hsl(var(--state-blocked))]/20 bg-[hsl(var(--state-blocked))]/5 p-2 text-[8px]">
                  <div className="font-mono font-semibold text-[hsl(var(--state-blocked))]">{q.id}</div>
                  <div className="text-muted-foreground truncate">{q.title}</div>
                  <div className="text-[7px] text-[hsl(var(--state-blocked))] mt-0.5">SLA breach in 18m</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 border-b">
            <div className="text-[9px] font-semibold mb-2">Recent Audit</div>
            <div className="space-y-1">
              {[
                { action: 'Resolved TKT-4799', actor: 'M. Chen', time: '5m ago' },
                { action: 'Escalated MOD-1088', actor: 'You', time: '12m ago' },
                { action: 'Refund issued REF-440', actor: 'S. Kim', time: '20m ago' },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[8px] p-1 rounded-lg hover:bg-muted/10">
                  <CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))] shrink-0" />
                  <div className="flex-1 truncate">{a.action}</div>
                  <span className="text-[7px] text-muted-foreground">{a.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3">
            <div className="text-[9px] font-semibold mb-2">Quick Links</div>
            <div className="space-y-0.5">
              {[
                { label: 'Admin Console', to: '/admin' },
                { label: 'Finance Admin', to: '/admin/finance' },
                { label: 'Ops Queue', to: '/admin/ops' },
                { label: 'Disputes', to: '/disputes' },
                { label: 'Trust Center', to: '/trust' },
              ].map(l => (
                <Link key={l.label} to={l.to} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] hover:bg-muted/20 transition-colors">
                  <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />{l.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ═══ Command Bar Overlay ═══ */}
      {commandOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-start justify-center pt-[15vh]" onClick={() => setCommandOpen(false)}>
          <div className="w-full max-w-lg bg-card border rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <Command className="h-4 w-4 text-accent" />
              <input autoFocus value={commandQuery} onChange={e => setCommandQuery(e.target.value)} placeholder="Search cases, users, run commands..." className="flex-1 bg-transparent text-[11px] outline-none" />
              <kbd className="text-[7px] bg-muted/50 rounded px-1 py-0.5 font-mono">Esc</kbd>
            </div>
            <div className="max-h-[300px] overflow-y-auto divide-y">
              {filteredQueues.map(q => (
                <button key={q.id} onClick={() => { openCase(q); setCommandOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-muted/10 transition-colors">
                  <Badge variant="secondary" className={cn('text-[6px] shrink-0', sevColor(q.severity))}>{q.severity.slice(0, 4)}</Badge>
                  <span className="text-[9px] font-mono font-semibold shrink-0">{q.id}</span>
                  <span className="text-[9px] flex-1 truncate">{q.title}</span>
                  <Badge variant="secondary" className={cn('text-[6px]', statusColor(q.status))}>{q.status}</Badge>
                </button>
              ))}
              <div className="px-4 py-2 text-[8px] text-muted-foreground">
                <span className="font-semibold">Commands:</span> assign, escalate, resolve, restrict, override, impersonate
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Case Detail Drawer ═══ */}
      <Sheet open={caseDrawer} onOpenChange={setCaseDrawer}>
        <SheetContent className="w-[420px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4 text-accent" />Case Inspector</SheetTitle></SheetHeader>
          {selectedCase && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono font-bold">{selectedCase.id}</span>
                <Badge variant="secondary" className={cn('text-[7px]', sevColor(selectedCase.severity))}>{selectedCase.severity}</Badge>
                <Badge variant="secondary" className={cn('text-[7px]', statusColor(selectedCase.status))}>{selectedCase.status}</Badge>
              </div>
              <div className="text-[11px] font-semibold">{selectedCase.title}</div>

              <div className="rounded-xl border p-3 space-y-1.5 text-[8px]">
                {[
                  { l: 'Type', v: selectedCase.type },
                  { l: 'Assignee', v: selectedCase.assignee },
                  { l: 'Age', v: selectedCase.age },
                  { l: 'Domain', v: selectedCase.domain },
                  { l: 'Environment', v: env },
                  { l: 'Role', v: roleInfo.label },
                ].map(m => (
                  <div key={m.l} className="flex justify-between"><span className="text-muted-foreground">{m.l}</span><span className="font-semibold">{m.v}</span></div>
                ))}
              </div>

              <div className="rounded-xl border p-3">
                <div className="text-[9px] font-semibold mb-2">Timeline</div>
                <div className="space-y-1.5">
                  {[
                    { action: 'Case created', actor: 'System', time: selectedCase.age + ' ago' },
                    { action: 'Auto-assigned to ' + selectedCase.assignee, actor: 'Router', time: '2m later' },
                    { action: 'First response sent', actor: selectedCase.assignee, time: '5m later' },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-[8px]">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                      <span className="flex-1">{t.action}</span>
                      <span className="text-muted-foreground">{t.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.success('Assigned to you')}><UserCheck className="h-3 w-3" />Assign to Me</Button>
                <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Escalating')}><AlertTriangle className="h-3 w-3" />Escalate</Button>
                <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.success('Resolved')}><CheckCircle2 className="h-3 w-3" />Resolve</Button>
                <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => { toggleDetach(selectedCase.id); setCaseDrawer(false); }}><Maximize2 className="h-3 w-3" />Detach</Button>
              </div>

              {env === 'production' && (
                <div className="rounded-lg border border-[hsl(var(--state-blocked))]/20 bg-[hsl(var(--state-blocked))]/5 p-2 text-[8px] flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-[hsl(var(--state-blocked))] shrink-0" />
                  <span>Actions affect live data. All changes are audited.</span>
                </div>
              )}

              <div className="flex gap-1.5 flex-wrap">
                <Link to="/admin"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><ArrowRight className="h-2.5 w-2.5" />Admin Console</Button></Link>
                <Link to="/admin/finance"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Landmark className="h-2.5 w-2.5" />Finance</Button></Link>
                <Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => toast.info('Opening message thread')}><MessageSquare className="h-2.5 w-2.5" />Messages</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ═══ Mobile Bottom Bar ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-2 flex items-center gap-2 safe-area-bottom">
        <button onClick={() => setActiveTab('home')} className={cn('flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg', activeTab === 'home' ? 'text-accent' : 'text-muted-foreground')}>
          <LayoutGrid className="h-4 w-4" /><span className="text-[7px]">Home</span>
        </button>
        <button onClick={() => setActiveTab('queues')} className={cn('flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg', activeTab === 'queues' ? 'text-accent' : 'text-muted-foreground')}>
          <Inbox className="h-4 w-4" /><span className="text-[7px]">Queues</span>
        </button>
        <button onClick={() => setCommandOpen(true)} className="flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg text-muted-foreground">
          <Search className="h-4 w-4" /><span className="text-[7px]">Search</span>
        </button>
        <button onClick={() => setActiveTab('cases')} className={cn('flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg', activeTab === 'cases' ? 'text-accent' : 'text-muted-foreground')}>
          <Eye className="h-4 w-4" /><span className="text-[7px]">Cases</span>
        </button>
      </div>

      {/* Mobile Sheet */}
      <Sheet open={mobileSheet} onOpenChange={setMobileSheet}>
        <SheetContent className="w-[300px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm">Admin Menu</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-2">
            {NAV_SECTIONS.flatMap(s => s.items).map(item => (
              <Link key={item.label} to={item.to} onClick={() => setMobileSheet(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted/20 text-[10px]">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{item.label}</span>
                {item.badge && <Badge variant="secondary" className="text-[7px]">{item.badge}</Badge>}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default InternalAdminShellPage;
