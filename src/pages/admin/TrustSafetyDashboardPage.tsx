import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Shield, AlertTriangle, Search, Clock, Users, Eye, RefreshCw, FileText,
  Radio, ChevronRight, Smartphone, Ban, Activity, Zap, Lock,
  CheckCircle2, XCircle, AlertOctagon, Layers, History,
  BarChart3, Gavel, Brain, Fingerprint, Network, TrendingUp,
  ShieldAlert, ShieldCheck, CircleDot, Target, GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { MlPipelineHealthCard } from '@/components/admin/MlPipelineHealthCard';
import { IdVerifyConnectorsCard } from '@/components/admin/IdVerifyConnectorsCard';

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
type SignalStatus = 'pending' | 'confirmed' | 'dismissed' | 'escalated' | 'overridden' | 'archived';
type SignalType = 'fraud' | 'abuse' | 'identity' | 'payment' | 'bot' | 'collusion';

interface TrustSignal {
  id: string; type: SignalType; risk: RiskLevel; status: SignalStatus;
  title: string; entity: string; entityAvatar: string;
  mlScore: number; mlModel: string; humanReview: boolean;
  created: string; clusterId: string | null; linkedEntities: string[];
  summary: string; decisionNote: string | null;
}

const SIGNALS: TrustSignal[] = [
  { id: 'TS-7001', type: 'fraud', risk: 'critical', status: 'pending', title: 'Coordinated payment fraud ring', entity: 'Cluster-Alpha', entityAvatar: 'CA', mlScore: 0.98, mlModel: 'FraudNet v4.1', humanReview: false, created: '3m ago', clusterId: 'CL-001', linkedEntities: ['ACC-112', 'ACC-334', 'ACC-556', 'ACC-778'], summary: '4 accounts with shared device fingerprints, rapid sequential chargebacks totaling $12,400', decisionNote: null },
  { id: 'TS-7002', type: 'identity', risk: 'critical', status: 'pending', title: 'Synthetic identity detected', entity: 'NewUser-9920', entityAvatar: 'N9', mlScore: 0.95, mlModel: 'IDVerify v2.3', humanReview: false, created: '18m ago', clusterId: null, linkedEntities: ['DOC-445'], summary: 'SSN/name mismatch, AI-generated ID document detected with 95% confidence', decisionNote: null },
  { id: 'TS-7003', type: 'bot', risk: 'high', status: 'confirmed', title: 'Automated bidding bot network', entity: 'BotSwarm-X', entityAvatar: 'BX', mlScore: 0.91, mlModel: 'BotDetect v3.0', humanReview: true, created: '1h ago', clusterId: 'CL-003', linkedEntities: ['ACC-200', 'ACC-201', 'ACC-202'], summary: '12 accounts bidding on gigs within 0.3s of posting, identical response patterns', decisionNote: 'Confirmed bot behavior. Accounts suspended.' },
  { id: 'TS-7004', type: 'payment', risk: 'high', status: 'pending', title: 'Unusual payout velocity spike', entity: 'ProSeller-888', entityAvatar: 'PS', mlScore: 0.84, mlModel: 'PayFlow v1.8', humanReview: false, created: '2h ago', clusterId: null, linkedEntities: ['TXN-901', 'TXN-902'], summary: 'Seller requested 8 payouts in 24h totaling $34,200 after 6 months of dormancy', decisionNote: null },
  { id: 'TS-7005', type: 'abuse', risk: 'medium', status: 'escalated', title: 'Review manipulation pattern', entity: 'ReviewRing-B', entityAvatar: 'RB', mlScore: 0.77, mlModel: 'ReviewGuard v2.1', humanReview: true, created: '4h ago', clusterId: 'CL-005', linkedEntities: ['GIG-330', 'GIG-331'], summary: 'Cross-reviewing pattern between 6 sellers, all reviews within 5-star band', decisionNote: null },
  { id: 'TS-7006', type: 'collusion', risk: 'medium', status: 'pending', title: 'Bid rigging suspicion', entity: 'Agency-Trio', entityAvatar: 'AT', mlScore: 0.72, mlModel: 'CollusionNet v1.2', humanReview: false, created: '6h ago', clusterId: 'CL-006', linkedEntities: ['PRJ-440', 'PRJ-441'], summary: '3 agencies rotating winning bids on enterprise projects, pricing within 2% variance', decisionNote: null },
  { id: 'TS-7007', type: 'fraud', risk: 'low', status: 'dismissed', title: 'False positive — legitimate refund', entity: 'User-4400', entityAvatar: 'U4', mlScore: 0.34, mlModel: 'FraudNet v4.1', humanReview: true, created: '1d ago', clusterId: null, linkedEntities: [], summary: 'Refund request matched fraud pattern but user has 3yr clean history', decisionNote: 'False positive. User verified via phone call.' },
  { id: 'TS-7008', type: 'identity', risk: 'high', status: 'overridden', title: 'Verified override — name change', entity: 'User-7700', entityAvatar: 'U7', mlScore: 0.68, mlModel: 'IDVerify v2.3', humanReview: true, created: '2d ago', clusterId: null, linkedEntities: ['DOC-550'], summary: 'Legal name change triggered identity mismatch. Court documents provided.', decisionNote: 'Override approved by L3. Documents verified.' },
];

const RISK_TREND = [
  { day: 'Mon', critical: 3, high: 8, medium: 14, low: 22 },
  { day: 'Tue', critical: 5, high: 11, medium: 16, low: 19 },
  { day: 'Wed', critical: 2, high: 7, medium: 12, low: 25 },
  { day: 'Thu', critical: 6, high: 13, medium: 18, low: 20 },
  { day: 'Fri', critical: 4, high: 9, medium: 15, low: 23 },
  { day: 'Sat', critical: 1, high: 4, medium: 8, low: 12 },
  { day: 'Sun', critical: 2, high: 5, medium: 10, low: 14 },
];

const CLUSTER_DATA = [
  { x: 12, y: 98, z: 4, name: 'Payment Fraud Ring', id: 'CL-001' },
  { x: 45, y: 72, z: 3, name: 'Bot Network', id: 'CL-003' },
  { x: 67, y: 55, z: 6, name: 'Review Ring', id: 'CL-005' },
  { x: 30, y: 60, z: 3, name: 'Bid Rigging', id: 'CL-006' },
  { x: 80, y: 30, z: 2, name: 'Dormant Ring', id: 'CL-008' },
];

const DECISION_LOG = [
  { id: 'DEC-501', signal: 'TS-7003', action: 'Accounts suspended', actor: 'T.Chen (T&S L2)', time: '58m ago', outcome: 'confirmed' },
  { id: 'DEC-502', signal: 'TS-7007', action: 'Dismissed — false positive', actor: 'R.Patel (T&S L1)', time: '22h ago', outcome: 'dismissed' },
  { id: 'DEC-503', signal: 'TS-7008', action: 'Override approved — legal name change', actor: 'M.Garcia (T&S L3)', time: '2d ago', outcome: 'overridden' },
  { id: 'DEC-504', signal: 'TS-6990', action: 'Escalated to legal', actor: 'K.Wong (T&S L2)', time: '3d ago', outcome: 'escalated' },
  { id: 'DEC-505', signal: 'TS-6985', action: 'Permanent ban issued', actor: 'M.Garcia (T&S L3)', time: '4d ago', outcome: 'confirmed' },
];

const riskColor = (r: RiskLevel) => r === 'critical' ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]' : r === 'high' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : r === 'medium' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground';
const statusColor = (s: SignalStatus) => s === 'pending' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : s === 'confirmed' ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]' : s === 'dismissed' ? 'bg-muted text-muted-foreground' : s === 'escalated' ? 'bg-primary/10 text-primary' : s === 'overridden' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground';
const typeIcon = (t: SignalType) => t === 'fraud' ? Fingerprint : t === 'abuse' ? ShieldAlert : t === 'identity' ? Eye : t === 'payment' ? Zap : t === 'bot' ? Brain : Network;

const TrustSafetyDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('risk');
  const [selected, setSelected] = useState<TrustSignal | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  const open = (s: TrustSignal) => { setSelected(s); setDrawer(true); };

  const filtered = SIGNALS.filter(s => {
    if (filterRisk !== 'all' && s.risk !== filterRisk) return false;
    if (filterType !== 'all' && s.type !== filterType) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (search && !s.id.toLowerCase().includes(search.toLowerCase()) && !s.entity.toLowerCase().includes(search.toLowerCase()) && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Env Ribbon */}
      <div className="flex items-center gap-2 px-4 py-1 text-[8px] font-mono border-b bg-[hsl(var(--state-blocked))]/5 text-[hsl(var(--state-blocked))]">
        <Radio className="h-2.5 w-2.5 animate-pulse" /><span className="uppercase font-bold">Production</span><span className="text-muted-foreground">·</span><span className="text-muted-foreground">Trust & Safety Control Plane v3.1</span>
        <div className="flex-1" />
        <Badge variant="secondary" className="text-[6px] gap-0.5"><ShieldAlert className="h-2 w-2" />T&S Specialist</Badge>
        <Badge variant="secondary" className="text-[6px] gap-0.5"><Clock className="h-2 w-2" />Session: 1h 32m</Badge>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-[hsl(var(--state-blocked))]/10 flex items-center justify-center"><ShieldAlert className="h-5 w-5 text-[hsl(var(--state-blocked))]" /></div>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Trust & Safety Dashboard</h1>
            <p className="text-[9px] text-muted-foreground">ML review, fraud signals, risk decisions, and override controls</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Link to="/admin/moderator-dashboard"><Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Shield className="h-3 w-3" />Moderation</Button></Link>
            <Link to="/admin/dispute-ops"><Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Gavel className="h-3 w-3" />Disputes</Button></Link>
            <Link to="/admin/shell"><Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Layers className="h-3 w-3" />Admin Shell</Button></Link>
          </div>
        </div>

        {/* KPI Band */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
          {[
            { label: 'Critical Signals', value: '4', delta: '2 pending review', icon: AlertOctagon, state: 'blocked' },
            { label: 'ML Flags (24h)', value: '38', delta: '6 high-confidence', icon: Brain, state: 'caution' },
            { label: 'Active Clusters', value: '5', delta: '1 new today', icon: Network, state: 'caution' },
            { label: 'Decisions (24h)', value: '27', delta: '89% accuracy', icon: CheckCircle2, state: 'healthy' },
            { label: 'Overrides', value: '3', delta: '2 pending L3', icon: Lock, state: 'caution' },
            { label: 'Value at Risk', value: '$47.2K', delta: '↑ 12% vs avg', icon: TrendingUp, state: 'blocked' },
          ].map(k => (
            <div key={k.label} className="rounded-2xl border bg-card p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-1 text-[8px] text-muted-foreground mb-1"><k.icon className="h-3 w-3" />{k.label}</div>
              <div className="text-lg font-bold">{k.value}</div>
              <div className={cn('text-[8px]', k.state === 'healthy' ? 'text-[hsl(var(--state-healthy))]' : k.state === 'blocked' ? 'text-[hsl(var(--state-blocked))]' : 'text-[hsl(var(--gigvora-amber))]')}>{k.delta}</div>
            </div>
          ))}
        </div>

        {/* Critical Alert Banner */}
        {SIGNALS.some(s => s.risk === 'critical' && s.status === 'pending') && (
          <div className="rounded-xl border border-[hsl(var(--state-blocked))]/30 bg-[hsl(var(--state-blocked))]/5 p-3 flex items-center gap-2 text-[8px] mb-4">
            <AlertOctagon className="h-4 w-4 text-[hsl(var(--state-blocked))] shrink-0 animate-pulse" />
            <div className="flex-1"><strong>{SIGNALS.filter(s => s.risk === 'critical' && s.status === 'pending').length} critical signals require immediate human review</strong> — includes fraud ring and synthetic identity</div>
            <Button variant="outline" size="sm" className="h-6 text-[7px] rounded-lg" onClick={() => { setFilterRisk('critical'); setActiveTab('queue'); }}>View Critical</Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="risk" className="text-[9px] gap-1"><Target className="h-3 w-3" />Risk Dashboard</TabsTrigger>
            <TabsTrigger value="queue" className="text-[9px] gap-1"><Layers className="h-3 w-3" />High-Severity Queue</TabsTrigger>
            <TabsTrigger value="ml" className="text-[9px] gap-1"><Brain className="h-3 w-3" />ML Flags</TabsTrigger>
            <TabsTrigger value="clusters" className="text-[9px] gap-1"><Network className="h-3 w-3" />Fraud Clusters</TabsTrigger>
            <TabsTrigger value="entities" className="text-[9px] gap-1"><GitBranch className="h-3 w-3" />Entity Links</TabsTrigger>
            <TabsTrigger value="decisions" className="text-[9px] gap-1"><History className="h-3 w-3" />Decision Log</TabsTrigger>
            <TabsTrigger value="overrides" className="text-[9px] gap-1"><Lock className="h-3 w-3" />Override Controls</TabsTrigger>
            <TabsTrigger value="mobile" className="text-[9px] gap-1"><Smartphone className="h-3 w-3" />Mobile</TabsTrigger>
          </TabsList>

          {/* RISK DASHBOARD */}
          <TabsContent value="risk">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3">7-Day Risk Signal Trend</div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={RISK_TREND}>
                      <XAxis dataKey="day" tick={{ fontSize: 8 }} />
                      <YAxis tick={{ fontSize: 8 }} />
                      <Tooltip contentStyle={{ fontSize: 9 }} />
                      <Area type="monotone" dataKey="critical" stackId="1" fill="hsl(var(--state-blocked))" stroke="hsl(var(--state-blocked))" fillOpacity={0.6} name="Critical" />
                      <Area type="monotone" dataKey="high" stackId="1" fill="hsl(var(--gigvora-amber))" stroke="hsl(var(--gigvora-amber))" fillOpacity={0.4} name="High" />
                      <Area type="monotone" dataKey="medium" stackId="1" fill="hsl(var(--accent))" stroke="hsl(var(--accent))" fillOpacity={0.3} name="Medium" />
                      <Area type="monotone" dataKey="low" stackId="1" fill="hsl(var(--muted-foreground))" stroke="hsl(var(--muted-foreground))" fillOpacity={0.2} name="Low" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border bg-card p-3">
                  <div className="text-[9px] font-semibold mb-2">Signal Type Distribution</div>
                  {(['fraud', 'abuse', 'identity', 'payment', 'bot', 'collusion'] as SignalType[]).map(t => {
                    const count = SIGNALS.filter(s => s.type === t).length;
                    const TIcon = typeIcon(t);
                    return (
                      <button key={t} onClick={() => { setFilterType(t); setActiveTab('queue'); }} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl hover:bg-muted/20 transition-colors text-[8px]">
                        <TIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="capitalize flex-1 text-left">{t}</span>
                        <span className="font-bold">{count}</span>
                        <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
                <div className="rounded-2xl border bg-card p-3">
                  <MlPipelineHealthCard compact={false} />
                </div>
                <IdVerifyConnectorsCard />
              </div>
            </div>
          </TabsContent>

          {/* HIGH-SEVERITY QUEUE */}
          <TabsContent value="queue">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search signals..." className="pl-8 h-8 text-[9px] rounded-xl" />
              </div>
              <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="h-8 px-2 text-[9px] rounded-xl border bg-card">
                <option value="all">All Risk</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="h-8 px-2 text-[9px] rounded-xl border bg-card">
                <option value="all">All Types</option><option value="fraud">Fraud</option><option value="abuse">Abuse</option><option value="identity">Identity</option><option value="payment">Payment</option><option value="bot">Bot</option><option value="collusion">Collusion</option>
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-8 px-2 text-[9px] rounded-xl border bg-card">
                <option value="all">All Status</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="dismissed">Dismissed</option><option value="escalated">Escalated</option><option value="overridden">Overridden</option>
              </select>
              <Button variant="ghost" size="sm" className="h-8 text-[8px] rounded-xl gap-1" onClick={() => { setFilterRisk('all'); setFilterType('all'); setFilterStatus('all'); setSearch(''); }}><RefreshCw className="h-2.5 w-2.5" />Reset</Button>
            </div>
            <div className="rounded-2xl border bg-card overflow-hidden">
              <table className="w-full text-[9px]">
                <thead><tr className="border-b bg-muted/20">
                  <th className="px-3 py-2 text-left font-semibold">Signal</th>
                  <th className="px-2 py-2 text-left font-semibold">Type</th>
                  <th className="px-2 py-2 text-left font-semibold">Entity</th>
                  <th className="px-2 py-2 text-left font-semibold">ML</th>
                  <th className="px-2 py-2 text-left font-semibold">Risk</th>
                  <th className="px-2 py-2 text-left font-semibold">Status</th>
                  <th className="px-2 py-2 text-left font-semibold">Cluster</th>
                  <th className="px-2 py-2 text-left font-semibold">Actions</th>
                </tr></thead>
                <tbody className="divide-y">
                  {filtered.map(s => {
                    const TIcon = typeIcon(s.type);
                    return (
                      <tr key={s.id} onClick={() => open(s)} className={cn('hover:bg-muted/10 cursor-pointer transition-colors', s.risk === 'critical' && s.status === 'pending' && 'bg-[hsl(var(--state-blocked))]/[0.02]')}>
                        <td className="px-3 py-2"><div className="font-mono font-semibold">{s.id}</div><div className="text-[7px] text-muted-foreground">{s.created}</div></td>
                        <td className="px-2 py-2"><div className="flex items-center gap-1"><TIcon className="h-3 w-3 text-muted-foreground" /><span className="capitalize">{s.type}</span></div></td>
                        <td className="px-2 py-2"><div className="flex items-center gap-1"><div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[5px] font-bold">{s.entityAvatar}</div><span>{s.entity}</span></div></td>
                        <td className="px-2 py-2"><div className="flex items-center gap-1"><div className={cn('h-1.5 w-1.5 rounded-full', s.mlScore >= 0.9 ? 'bg-[hsl(var(--state-blocked))]' : s.mlScore >= 0.7 ? 'bg-[hsl(var(--gigvora-amber))]' : 'bg-muted-foreground')} /><span className="text-[7px]">{(s.mlScore * 100).toFixed(0)}%</span></div></td>
                        <td className="px-2 py-2"><Badge variant="secondary" className={cn('text-[6px]', riskColor(s.risk))}>{s.risk}</Badge></td>
                        <td className="px-2 py-2"><Badge variant="secondary" className={cn('text-[6px]', statusColor(s.status))}>{s.status}</Badge></td>
                        <td className="px-2 py-2">{s.clusterId ? <Badge variant="secondary" className="text-[6px] bg-accent/10 text-accent">{s.clusterId}</Badge> : <span className="text-[7px] text-muted-foreground">—</span>}</td>
                        <td className="px-2 py-2"><Button size="sm" className="h-5 text-[6px] rounded-lg" onClick={e => { e.stopPropagation(); open(s); }}>Review</Button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ML FLAGS */}
          <TabsContent value="ml">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-2">
                <div className="text-[9px] text-muted-foreground mb-1">ML-generated flags requiring human verification:</div>
                {SIGNALS.filter(s => !s.humanReview && s.status === 'pending').map(s => (
                  <button key={s.id} onClick={() => open(s)} className="w-full rounded-2xl border bg-card p-4 text-left hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-3.5 w-3.5 text-accent" />
                      <span className="font-mono font-bold text-[10px]">{s.id}</span>
                      <Badge variant="secondary" className={cn('text-[6px]', riskColor(s.risk))}>{s.risk}</Badge>
                      <Badge variant="secondary" className="text-[6px] bg-accent/10 text-accent">{s.mlModel}</Badge>
                      <span className="text-[7px] text-muted-foreground ml-auto">{s.created}</span>
                    </div>
                    <div className="text-[9px] font-semibold mb-1">{s.title}</div>
                    <div className="rounded-xl bg-muted/20 border p-2 text-[8px] text-muted-foreground mb-2">{s.summary}</div>
                    <div className="flex items-center gap-3 text-[7px] text-muted-foreground">
                      <span>Confidence: <strong className={s.mlScore >= 0.9 ? 'text-[hsl(var(--state-blocked))]' : 'text-foreground'}>{(s.mlScore * 100).toFixed(1)}%</strong></span>
                      <span>Entity: <strong className="text-foreground">{s.entity}</strong></span>
                      {s.linkedEntities.length > 0 && <span>Linked: <strong>{s.linkedEntities.length}</strong></span>}
                    </div>
                  </button>
                ))}
                {SIGNALS.filter(s => !s.humanReview && s.status === 'pending').length === 0 && (
                  <div className="text-center text-[9px] text-muted-foreground py-8 rounded-2xl border bg-card"><ShieldCheck className="h-5 w-5 mx-auto mb-2 text-[hsl(var(--state-healthy))]" />All ML flags reviewed</div>
                )}
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border bg-card p-3">
                  <div className="text-[9px] font-semibold mb-2">Model Performance (7d)</div>
                  <div className="space-y-1.5 text-[8px]">
                    {[
                      { model: 'FraudNet v4.1', prec: '93.2%', rec: '88.1%', fp: '2.1%' },
                      { model: 'IDVerify v2.3', prec: '91.8%', rec: '85.4%', fp: '3.4%' },
                      { model: 'BotDetect v3.0', prec: '95.1%', rec: '91.2%', fp: '1.8%' },
                      { model: 'PayFlow v1.8', prec: '87.5%', rec: '82.3%', fp: '5.1%' },
                    ].map(m => (
                      <div key={m.model} className="rounded-xl border p-2">
                        <div className="font-semibold text-[7px] mb-1">{m.model}</div>
                        <div className="flex gap-3 text-[7px] text-muted-foreground">
                          <span>Prec: <strong className="text-foreground">{m.prec}</strong></span>
                          <span>Recall: <strong className="text-foreground">{m.rec}</strong></span>
                          <span>FP: <strong className={parseFloat(m.fp) > 3 ? 'text-[hsl(var(--gigvora-amber))]' : 'text-foreground'}>{m.fp}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* FRAUD CLUSTERS */}
          <TabsContent value="clusters">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3">Cluster Scatter — Risk vs Age (bubble = entity count)</div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <XAxis dataKey="x" name="Age (days)" tick={{ fontSize: 8 }} />
                      <YAxis dataKey="y" name="Risk Score" tick={{ fontSize: 8 }} />
                      <ZAxis dataKey="z" range={[60, 200]} name="Entities" />
                      <Tooltip contentStyle={{ fontSize: 9 }} />
                      <Scatter data={CLUSTER_DATA} fill="hsl(var(--state-blocked))" fillOpacity={0.6} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-[9px] font-semibold mb-1">Active Fraud Clusters</div>
                {CLUSTER_DATA.map(c => (
                  <div key={c.id} className="rounded-xl border bg-card p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-2 mb-1">
                      <Network className="h-3.5 w-3.5 text-[hsl(var(--state-blocked))]" />
                      <span className="font-mono font-bold text-[9px]">{c.id}</span>
                      <span className="text-[9px] font-semibold">{c.name}</span>
                      <Badge variant="secondary" className="text-[6px] bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))] ml-auto">{c.z} entities</Badge>
                    </div>
                    <div className="flex gap-2 text-[7px] text-muted-foreground mb-2">
                      <span>Risk: <strong className="text-foreground">{c.y}</strong></span>
                      <span>Age: <strong className="text-foreground">{c.x}d</strong></span>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-5 text-[6px] rounded-lg gap-0.5" onClick={() => toast.info(`Inspecting cluster ${c.id}`)}><Eye className="h-2.5 w-2.5" />Inspect</Button>
                      <Button size="sm" variant="outline" className="h-5 text-[6px] rounded-lg gap-0.5" onClick={() => toast.info('Expanding cluster view')}><Network className="h-2.5 w-2.5" />Expand</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ENTITY LINKS */}
          <TabsContent value="entities">
            <div className="rounded-2xl border bg-card p-4">
              <div className="text-[9px] font-semibold mb-3 flex items-center gap-1"><GitBranch className="h-3 w-3 text-accent" />Entity Link Map</div>
              <div className="text-[8px] text-muted-foreground mb-3">Linked entities across signals, showing relationship depth and shared attributes.</div>
              <div className="space-y-2">
                {SIGNALS.filter(s => s.linkedEntities.length > 0).map(s => (
                  <div key={s.id} className="rounded-xl border p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono font-bold text-[9px]">{s.id}</span>
                      <Badge variant="secondary" className={cn('text-[6px]', riskColor(s.risk))}>{s.risk}</Badge>
                      <span className="text-[8px] text-muted-foreground">{s.entity}</span>
                      <span className="text-[7px] text-muted-foreground ml-auto">{s.linkedEntities.length} linked</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {s.linkedEntities.map(e => (
                        <Badge key={e} variant="outline" className="text-[7px] gap-0.5 cursor-pointer hover:bg-muted/20" onClick={() => toast.info(`Opening ${e}`)}>
                          <CircleDot className="h-2 w-2" />{e}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* DECISION LOG */}
          <TabsContent value="decisions">
            <div className="rounded-2xl border bg-card p-4">
              <div className="text-[9px] font-semibold mb-3 flex items-center gap-1"><History className="h-3 w-3 text-primary" />Decision Log — Audit Trail</div>
              <div className="space-y-1.5">
                {DECISION_LOG.map(d => (
                  <div key={d.id} className="rounded-xl border p-3 flex items-center gap-3 text-[8px]">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[6px] font-bold shrink-0">{d.actor.charAt(0)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{d.id}</span>
                        <Badge variant="secondary" className={cn('text-[5px]', d.outcome === 'confirmed' ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]' : d.outcome === 'dismissed' ? 'bg-muted text-muted-foreground' : d.outcome === 'overridden' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary')}>{d.outcome}</Badge>
                      </div>
                      <div className="text-[7px] text-muted-foreground">{d.action}</div>
                    </div>
                    <div className="text-right text-[7px] text-muted-foreground shrink-0">
                      <div className="font-semibold text-foreground">{d.actor}</div>
                      <div>{d.time}</div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-5 text-[6px] rounded-lg shrink-0" onClick={() => toast.info(`Viewing signal ${d.signal}`)}><Eye className="h-2.5 w-2.5" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* OVERRIDE CONTROLS */}
          <TabsContent value="overrides">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3 flex items-center gap-1"><Lock className="h-3 w-3 text-accent" />Override Controls</div>
                <div className="text-[8px] text-muted-foreground mb-3">Override an ML decision or existing enforcement action. Requires L3+ clearance and documented rationale.</div>
                {SIGNALS.filter(s => s.status === 'overridden' || s.status === 'confirmed').map(s => (
                  <div key={s.id} className="rounded-xl border p-3 mb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono font-bold text-[9px]">{s.id}</span>
                      <Badge variant="secondary" className={cn('text-[6px]', statusColor(s.status))}>{s.status}</Badge>
                      <Badge variant="secondary" className={cn('text-[6px]', riskColor(s.risk))}>{s.risk}</Badge>
                    </div>
                    <div className="text-[8px] font-semibold mb-1">{s.title}</div>
                    {s.decisionNote && <div className="rounded-lg bg-muted/20 border p-2 text-[7px] text-muted-foreground mb-2">{s.decisionNote}</div>}
                    <div className="flex gap-1.5">
                      {s.status === 'confirmed' && <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => toast.info('Initiating override — L3 approval required')}><Lock className="h-2.5 w-2.5" />Request Override</Button>}
                      {s.status === 'overridden' && <Badge variant="secondary" className="text-[6px] bg-accent/10 text-accent gap-0.5"><ShieldCheck className="h-2.5 w-2.5" />Override Active</Badge>}
                      <Button size="sm" variant="ghost" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => open(s)}><Eye className="h-2.5 w-2.5" />Details</Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3">Override Policy</div>
                <div className="space-y-1.5 text-[8px]">
                  {[
                    { rule: 'L1 operators cannot override ML decisions', level: 'mandatory' },
                    { rule: 'L2 operators may override with documented rationale', level: 'restricted' },
                    { rule: 'L3 operators may override and reverse enforcement', level: 'full' },
                    { rule: 'All overrides logged with actor + timestamp + reason', level: 'mandatory' },
                    { rule: 'Critical signals require dual-approval for override', level: 'mandatory' },
                    { rule: 'Overrides expire after 90 days unless renewed', level: 'policy' },
                  ].map(p => (
                    <div key={p.rule} className="rounded-xl border p-2 flex items-center gap-2">
                      <Badge variant="secondary" className={cn('text-[5px] w-16 justify-center', p.level === 'mandatory' ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]' : p.level === 'restricted' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : p.level === 'full' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : 'bg-muted text-muted-foreground')}>{p.level}</Badge>
                      <span>{p.rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* MOBILE */}
          <TabsContent value="mobile">
            <div className="rounded-2xl border bg-card p-4 mb-3">
              <div className="text-[9px] font-semibold mb-2 flex items-center gap-1"><Smartphone className="h-3 w-3 text-accent" />Mobile Incident Review</div>
              <div className="text-[8px] text-muted-foreground mb-3">Critical and high-risk signals for on-the-go triage. Full cluster analysis requires desktop.</div>
              <div className="space-y-2">
                {SIGNALS.filter(s => (s.risk === 'critical' || s.risk === 'high') && s.status === 'pending').map(s => (
                  <button key={s.id} onClick={() => open(s)} className="w-full rounded-xl border p-3 text-left hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldAlert className="h-3.5 w-3.5 text-[hsl(var(--state-blocked))]" />
                      <span className="text-[9px] font-mono font-bold">{s.id}</span>
                      <Badge variant="secondary" className={cn('text-[6px]', riskColor(s.risk))}>{s.risk}</Badge>
                    </div>
                    <div className="text-[8px] font-semibold">{s.title}</div>
                    <div className="text-[7px] text-muted-foreground">{s.entity} · ML: {(s.mlScore * 100).toFixed(0)}%</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-[hsl(var(--gigvora-amber))]/5 border-[hsl(var(--gigvora-amber))]/30 p-3 text-[8px] flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0" />
              <span>Override decisions and cluster analysis require desktop access with full audit controls.</span>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Drawer */}
      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent className="w-[480px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-[hsl(var(--state-blocked))]" />Signal Review</SheetTitle></SheetHeader>
          {selected && (() => {
            const TIcon = typeIcon(selected.type);
            return (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-mono font-bold">{selected.id}</span>
                  <Badge variant="secondary" className={cn('text-[7px]', riskColor(selected.risk))}>{selected.risk}</Badge>
                  <Badge variant="secondary" className={cn('text-[7px]', statusColor(selected.status))}>{selected.status}</Badge>
                  <Badge variant="secondary" className="text-[7px] bg-muted capitalize">{selected.type}</Badge>
                </div>

                <div className="flex items-center gap-3">
                  <TIcon className="h-5 w-5 text-muted-foreground" />
                  <div><div className="text-sm font-bold">{selected.title}</div><div className="text-[8px] text-muted-foreground">{selected.entity}</div></div>
                </div>

                <div className="rounded-xl border p-3">
                  <div className="text-[9px] font-semibold mb-1">Summary</div>
                  <div className="text-[8px] text-muted-foreground">{selected.summary}</div>
                </div>

                <div className="rounded-xl border p-3">
                  <div className="text-[9px] font-semibold mb-1">ML Analysis</div>
                  <div className="space-y-1 text-[8px]">
                    <div className="flex justify-between"><span className="text-muted-foreground">Model</span><span className="font-bold">{selected.mlModel}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Confidence</span><span className={cn('font-bold', selected.mlScore >= 0.9 ? 'text-[hsl(var(--state-blocked))]' : '')}>{(selected.mlScore * 100).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Human Reviewed</span><span className="font-bold">{selected.humanReview ? 'Yes' : 'No'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="font-bold">{selected.created}</span></div>
                    {selected.clusterId && <div className="flex justify-between"><span className="text-muted-foreground">Cluster</span><span className="font-bold">{selected.clusterId}</span></div>}
                  </div>
                </div>

                {selected.linkedEntities.length > 0 && (
                  <div className="rounded-xl border p-3">
                    <div className="text-[9px] font-semibold mb-1">Linked Entities</div>
                    <div className="flex flex-wrap gap-1">{selected.linkedEntities.map(e => <Badge key={e} variant="outline" className="text-[7px] cursor-pointer hover:bg-muted/20" onClick={() => toast.info(`Opening ${e}`)}>{e}</Badge>)}</div>
                  </div>
                )}

                {selected.decisionNote && (
                  <div className="rounded-xl border p-3">
                    <div className="text-[9px] font-semibold mb-1">Decision Note</div>
                    <div className="text-[8px] text-muted-foreground">{selected.decisionNote}</div>
                  </div>
                )}

                <div className="rounded-xl border p-3">
                  <div className="text-[9px] font-semibold mb-2">Audit Trail</div>
                  <div className="space-y-1.5 text-[7px]">
                    {[
                      { action: `ML flag: ${selected.mlModel}`, actor: 'ML Pipeline', time: selected.created },
                      { action: 'Queued for human review', actor: 'Auto-router', time: 'Shortly after' },
                      ...(selected.humanReview ? [{ action: 'Human review completed', actor: 'T&S Operator', time: 'After review' }] : []),
                    ].map((a, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                        <span>{a.action}</span>
                        <span className="text-muted-foreground ml-auto">{a.actor} · {a.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.success('Signal confirmed — enforcement applied')}><CheckCircle2 className="h-3 w-3" />Confirm & Act</Button>
                  <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Dismissed')}><XCircle className="h-3 w-3" />Dismiss</Button>
                  <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Escalating')}><AlertTriangle className="h-3 w-3" />Escalate</Button>
                  <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Override requested')}><Lock className="h-3 w-3" />Override</Button>
                  <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Account restricted')}><Ban className="h-3 w-3" />Restrict Entity</Button>
                  <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Note added')}><FileText className="h-3 w-3" />Add Note</Button>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  <Link to="/admin/moderator-dashboard"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Shield className="h-2.5 w-2.5" />Moderation</Button></Link>
                  <Link to="/admin/dispute-ops"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Gavel className="h-2.5 w-2.5" />Disputes</Button></Link>
                  <Link to="/admin/finance-dashboard"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><BarChart3 className="h-2.5 w-2.5" />Finance</Button></Link>
                </div>

                <div className="rounded-lg border border-[hsl(var(--state-blocked))]/20 bg-[hsl(var(--state-blocked))]/5 p-2 text-[8px] flex items-center gap-2">
                  <ShieldAlert className="h-3 w-3 text-[hsl(var(--state-blocked))] shrink-0" />
                  <span>All T&S decisions are logged with actor, timestamp, rationale, and linked evidence for compliance audit.</span>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-2 flex items-center gap-2 safe-area-bottom">
        {[
          { tab: 'risk', icon: Target, label: 'Risk' },
          { tab: 'queue', icon: Layers, label: 'Queue' },
          { tab: 'clusters', icon: Network, label: 'Clusters' },
          { tab: 'decisions', icon: History, label: 'Decisions' },
        ].map(n => (
          <button key={n.tab} onClick={() => setActiveTab(n.tab)} className={cn('flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg', activeTab === n.tab ? 'text-[hsl(var(--state-blocked))]' : 'text-muted-foreground')}>
            <n.icon className="h-4 w-4" /><span className="text-[7px]">{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrustSafetyDashboardPage;
