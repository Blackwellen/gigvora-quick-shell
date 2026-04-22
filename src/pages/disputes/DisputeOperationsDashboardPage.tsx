import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Gavel, Scale, Shield, AlertTriangle, Search, Clock, Users,
  CheckCircle2, XCircle, Eye, RefreshCw, FileText, Download,
  Radio, BarChart3, Activity, ChevronRight, Smartphone,
  MessageSquare, Paperclip, Lock, Unlock, DollarSign, Flag,
  AlertOctagon, Timer, ArrowRight, Layers, History, Send,
  Ban, UserCheck, Briefcase, Hash, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DisputeCase {
  id: string; stage: 'intake' | 'triage' | 'mediation' | 'arbitration' | 'resolved' | 'escalated';
  type: 'service' | 'payment' | 'quality' | 'fraud' | 'policy';
  amount: string; claimant: string; claimantAvatar: string; respondent: string; respondentAvatar: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  sla: string; slaRisk: boolean; assignee: string; created: string;
  summary: string; linkedCases: string[]; evidenceCount: number; holdActive: boolean;
}

const CASES: DisputeCase[] = [
  { id: 'DSP-9001', stage: 'arbitration', type: 'payment', amount: '$2,450.00', claimant: 'Amara Osei', claimantAvatar: 'AO', respondent: 'TechCraft LLC', respondentAvatar: 'TC', priority: 'critical', sla: '6h left', slaRisk: true, assignee: 'J. Rivera', created: '2d ago', summary: 'Escrow funds not released after milestone delivery confirmed by third-party reviewer', linkedCases: ['ESC-1120', 'TKT-5003'], evidenceCount: 8, holdActive: true },
  { id: 'DSP-9002', stage: 'mediation', type: 'quality', amount: '$680.00', claimant: 'Carlos Diaz', claimantAvatar: 'CD', respondent: 'PixelPro Studio', respondentAvatar: 'PP', priority: 'high', sla: '18h left', slaRisk: false, assignee: 'S. Kim', created: '1d ago', summary: 'Deliverable quality significantly below agreed specifications — partial refund requested', linkedCases: ['ORD-4402'], evidenceCount: 5, holdActive: false },
  { id: 'DSP-9003', stage: 'triage', type: 'fraud', amount: '$1,100.00', claimant: 'Lin Wei', claimantAvatar: 'LW', respondent: 'Unknown Seller', respondentAvatar: 'US', priority: 'critical', sla: '2h left', slaRisk: true, assignee: 'Unassigned', created: '3h ago', summary: 'Suspected fraudulent seller account — multiple chargebacks from different buyers', linkedCases: ['MOD-1092', 'FIN-7720'], evidenceCount: 12, holdActive: true },
  { id: 'DSP-9004', stage: 'intake', type: 'service', amount: '$320.00', claimant: 'Priya Sharma', claimantAvatar: 'PS', respondent: 'DevHouse Inc', respondentAvatar: 'DH', priority: 'medium', sla: '48h left', slaRisk: false, assignee: 'Unassigned', created: '45m ago', summary: 'Service not delivered within agreed timeline — contractor went unresponsive', linkedCases: [], evidenceCount: 2, holdActive: false },
  { id: 'DSP-9005', stage: 'resolved', type: 'payment', amount: '$89.00', claimant: 'Jake Morrison', claimantAvatar: 'JM', respondent: 'QuickGig Co', respondentAvatar: 'QG', priority: 'low', sla: 'Closed', slaRisk: false, assignee: 'M. Chen', created: '5d ago', summary: 'Double charge resolved — refund issued to claimant', linkedCases: ['REF-8007'], evidenceCount: 3, holdActive: false },
  { id: 'DSP-9006', stage: 'escalated', type: 'policy', amount: '$4,200.00', claimant: 'Fatima Al-Hassan', claimantAvatar: 'FA', respondent: 'GlobalBuild Agency', respondentAvatar: 'GB', priority: 'critical', sla: '12h left', slaRisk: true, assignee: 'J. Rivera', created: '3d ago', summary: 'Policy violation — agency used subcontractors without disclosure, breaching platform terms', linkedCases: ['MOD-1093', 'PRJ-4401'], evidenceCount: 15, holdActive: true },
  { id: 'DSP-9007', stage: 'mediation', type: 'quality', amount: '$550.00', claimant: 'David Kim', claimantAvatar: 'DK', respondent: 'WriteWell Co', respondentAvatar: 'WW', priority: 'medium', sla: '36h left', slaRisk: false, assignee: 'S. Kim', created: '2d ago', summary: 'Content quality dispute — buyer claims AI-generated work sold as original', linkedCases: [], evidenceCount: 4, holdActive: false },
];

const VOLUME_DATA = [
  { day: 'Mon', intake: 12, mediation: 8, arbitration: 3, resolved: 15 },
  { day: 'Tue', intake: 9, mediation: 11, arbitration: 4, resolved: 12 },
  { day: 'Wed', intake: 15, mediation: 7, arbitration: 5, resolved: 18 },
  { day: 'Thu', intake: 11, mediation: 9, arbitration: 2, resolved: 14 },
  { day: 'Fri', intake: 8, mediation: 6, arbitration: 6, resolved: 10 },
  { day: 'Sat', intake: 4, mediation: 3, arbitration: 1, resolved: 7 },
  { day: 'Sun', intake: 3, mediation: 2, arbitration: 1, resolved: 5 },
];

const stageColor = (s: string) => s === 'intake' ? 'bg-primary/10 text-primary' : s === 'triage' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : s === 'mediation' ? 'bg-accent/10 text-accent' : s === 'arbitration' ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]' : s === 'resolved' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]';
const prioColor = (p: string) => p === 'critical' ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]' : p === 'high' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : p === 'medium' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground';
const typeIcon = (t: string) => t === 'payment' ? DollarSign : t === 'quality' ? Layers : t === 'fraud' ? Ban : t === 'policy' ? Shield : Briefcase;

const DisputeOperationsDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('board');
  const [selected, setSelected] = useState<DisputeCase | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [filterStage, setFilterStage] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [search, setSearch] = useState('');

  const open = (c: DisputeCase) => { setSelected(c); setDrawer(true); };

  const filtered = CASES.filter(c => {
    if (filterStage !== 'all' && c.stage !== filterStage) return false;
    if (filterPriority !== 'all' && c.priority !== filterPriority) return false;
    if (search && !c.id.toLowerCase().includes(search.toLowerCase()) && !c.claimant.toLowerCase().includes(search.toLowerCase()) && !c.respondent.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Env Ribbon */}
      <div className="flex items-center gap-2 px-4 py-1 text-[8px] font-mono border-b bg-[hsl(var(--state-blocked))]/5 text-[hsl(var(--state-blocked))]">
        <Radio className="h-2.5 w-2.5 animate-pulse" /><span className="uppercase font-bold">Production</span><span className="text-muted-foreground">·</span><span className="text-muted-foreground">Dispute Operations Console v3.1</span>
        <div className="flex-1" />
        <Badge variant="secondary" className="text-[6px] gap-0.5"><Gavel className="h-2 w-2" />Dispute Ops</Badge>
        <Badge variant="secondary" className="text-[6px] gap-0.5"><Clock className="h-2 w-2" />Session: 3h 12m</Badge>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-[hsl(var(--state-blocked))]/10 flex items-center justify-center"><Gavel className="h-5 w-5 text-[hsl(var(--state-blocked))]" /></div>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Dispute Operations Dashboard</h1>
            <p className="text-[9px] text-muted-foreground">Case routing, mediation, arbitration, and resolution tracking</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Link to="/admin/finance-dashboard"><Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><DollarSign className="h-3 w-3" />Finance</Button></Link>
            <Link to="/admin/cs-dashboard"><Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Users className="h-3 w-3" />CS Dashboard</Button></Link>
            <Link to="/admin/shell"><Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Shield className="h-3 w-3" />Admin Shell</Button></Link>
          </div>
        </div>

        {/* KPI Band */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
          {[
            { label: 'Open Cases', value: '24', delta: '5 critical', icon: Gavel, state: 'blocked' },
            { label: 'SLA At Risk', value: '3', delta: '<6h remaining', icon: Timer, state: 'blocked' },
            { label: 'In Mediation', value: '8', delta: '2 stalled', icon: MessageSquare, state: 'caution' },
            { label: 'Arbitration', value: '4', delta: '$8.2K at stake', icon: Scale, state: 'caution' },
            { label: 'Value at Risk', value: '$14.6K', delta: 'Across 7 holds', icon: DollarSign, state: 'blocked' },
            { label: 'Resolved (7d)', value: '31', delta: '89% satisfaction', icon: CheckCircle2, state: 'healthy' },
          ].map(k => (
            <div key={k.label} className="rounded-2xl border bg-card p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-1 text-[8px] text-muted-foreground mb-1"><k.icon className="h-3 w-3" />{k.label}</div>
              <div className="text-lg font-bold">{k.value}</div>
              <div className={cn('text-[8px]', k.state === 'healthy' ? 'text-[hsl(var(--state-healthy))]' : k.state === 'blocked' ? 'text-[hsl(var(--state-blocked))]' : 'text-[hsl(var(--gigvora-amber))]')}>{k.delta}</div>
            </div>
          ))}
        </div>

        {/* SLA Breach Banner */}
        {CASES.some(c => c.slaRisk) && (
          <div className="rounded-xl border border-[hsl(var(--state-blocked))]/30 bg-[hsl(var(--state-blocked))]/5 p-3 flex items-center gap-2 text-[8px] mb-4">
            <AlertOctagon className="h-4 w-4 text-[hsl(var(--state-blocked))] shrink-0 animate-pulse" />
            <div className="flex-1"><strong>{CASES.filter(c => c.slaRisk).length} cases at SLA breach risk</strong> — immediate triage required for {CASES.filter(c => c.slaRisk).map(c => c.id).join(', ')}</div>
            <Button variant="outline" size="sm" className="h-6 text-[7px] rounded-lg" onClick={() => { setFilterStage('all'); setActiveTab('board'); toast.info('Filtering SLA-risk cases'); }}>View At-Risk</Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="board" className="text-[9px] gap-1"><Layers className="h-3 w-3" />Case Board</TabsTrigger>
            <TabsTrigger value="detail" className="text-[9px] gap-1"><Eye className="h-3 w-3" />Case Detail</TabsTrigger>
            <TabsTrigger value="evidence" className="text-[9px] gap-1"><Paperclip className="h-3 w-3" />Evidence</TabsTrigger>
            <TabsTrigger value="timeline" className="text-[9px] gap-1"><History className="h-3 w-3" />Timeline</TabsTrigger>
            <TabsTrigger value="mediation" className="text-[9px] gap-1"><MessageSquare className="h-3 w-3" />Mediation</TabsTrigger>
            <TabsTrigger value="arbitration" className="text-[9px] gap-1"><Scale className="h-3 w-3" />Arbitration Desk</TabsTrigger>
            <TabsTrigger value="finance" className="text-[9px] gap-1"><DollarSign className="h-3 w-3" />Linked Finance</TabsTrigger>
            <TabsTrigger value="mobile" className="text-[9px] gap-1"><Smartphone className="h-3 w-3" />Mobile</TabsTrigger>
          </TabsList>

          {/* CASE BOARD */}
          <TabsContent value="board">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cases, parties..." className="pl-8 h-8 text-[9px] rounded-xl" />
              </div>
              <select value={filterStage} onChange={e => setFilterStage(e.target.value)} className="h-8 px-2 text-[9px] rounded-xl border bg-card">
                <option value="all">All Stages</option>
                <option value="intake">Intake</option>
                <option value="triage">Triage</option>
                <option value="mediation">Mediation</option>
                <option value="arbitration">Arbitration</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
              </select>
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="h-8 px-2 text-[9px] rounded-xl border bg-card">
                <option value="all">All Priority</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <Button variant="ghost" size="sm" className="h-8 text-[8px] rounded-xl gap-1" onClick={() => { setFilterStage('all'); setFilterPriority('all'); setSearch(''); }}><RefreshCw className="h-2.5 w-2.5" />Reset</Button>
            </div>

            <div className="rounded-2xl border bg-card overflow-hidden">
              <table className="w-full text-[9px]">
                <thead><tr className="border-b bg-muted/20">
                  <th className="px-3 py-2 text-left font-semibold">Case</th>
                  <th className="px-2 py-2 text-left font-semibold">Type</th>
                  <th className="px-2 py-2 text-left font-semibold">Claimant vs Respondent</th>
                  <th className="px-2 py-2 text-left font-semibold">Amount</th>
                  <th className="px-2 py-2 text-left font-semibold">Stage</th>
                  <th className="px-2 py-2 text-left font-semibold">Priority</th>
                  <th className="px-2 py-2 text-left font-semibold">SLA</th>
                  <th className="px-2 py-2 text-left font-semibold">Evidence</th>
                  <th className="px-2 py-2 text-left font-semibold">Actions</th>
                </tr></thead>
                <tbody className="divide-y">
                  {filtered.map(c => {
                    const TIcon = typeIcon(c.type);
                    return (
                      <tr key={c.id} onClick={() => open(c)} className={cn('hover:bg-muted/10 cursor-pointer transition-colors', c.slaRisk && 'bg-[hsl(var(--state-blocked))]/[0.02]')}>
                        <td className="px-3 py-2">
                          <div className="font-mono font-semibold">{c.id}</div>
                          {c.holdActive && <Badge variant="secondary" className="text-[5px] bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))] mt-0.5">HOLD</Badge>}
                        </td>
                        <td className="px-2 py-2"><div className="flex items-center gap-1"><TIcon className="h-3 w-3 text-muted-foreground" /><span className="capitalize">{c.type}</span></div></td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <div className="h-4 w-4 rounded-full bg-accent/10 flex items-center justify-center text-[5px] font-bold text-accent">{c.claimantAvatar}</div>
                            <span>{c.claimant}</span>
                            <span className="text-muted-foreground">vs</span>
                            <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[5px] font-bold">{c.respondentAvatar}</div>
                            <span>{c.respondent}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2 font-bold">{c.amount}</td>
                        <td className="px-2 py-2"><Badge variant="secondary" className={cn('text-[6px]', stageColor(c.stage))}>{c.stage}</Badge></td>
                        <td className="px-2 py-2"><Badge variant="secondary" className={cn('text-[6px]', prioColor(c.priority))}>{c.priority}</Badge></td>
                        <td className="px-2 py-2"><span className={cn('text-[8px]', c.slaRisk ? 'text-[hsl(var(--state-blocked))] font-bold' : 'text-muted-foreground')}>{c.sla}</span></td>
                        <td className="px-2 py-2"><span className="text-[8px]">{c.evidenceCount} files</span></td>
                        <td className="px-2 py-2">
                          <div className="flex gap-1">
                            <Button size="sm" className="h-5 text-[6px] rounded-lg" onClick={e => { e.stopPropagation(); open(c); }}>Open</Button>
                            {c.stage !== 'resolved' && <Button variant="outline" size="sm" className="h-5 text-[6px] rounded-lg" onClick={e => { e.stopPropagation(); toast.info('Escalating ' + c.id); }}>Escalate</Button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* CASE DETAIL */}
          <TabsContent value="detail">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-3">
                <div className="text-[9px] text-muted-foreground mb-1">Select a case from the board to view details, or choose below:</div>
                {CASES.filter(c => c.stage !== 'resolved').slice(0, 3).map(c => (
                  <button key={c.id} onClick={() => open(c)} className="w-full rounded-2xl border bg-card p-4 text-left hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono font-bold text-[10px]">{c.id}</span>
                      <Badge variant="secondary" className={cn('text-[6px]', stageColor(c.stage))}>{c.stage}</Badge>
                      <Badge variant="secondary" className={cn('text-[6px]', prioColor(c.priority))}>{c.priority}</Badge>
                      {c.holdActive && <Badge variant="secondary" className="text-[6px] bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]"><Lock className="h-2 w-2" />Financial Hold</Badge>}
                      <span className="text-[8px] font-bold ml-auto">{c.amount}</span>
                    </div>
                    <div className="text-[8px] text-muted-foreground mb-2">{c.summary}</div>
                    <div className="flex items-center gap-3 text-[7px] text-muted-foreground">
                      <span>Claimant: <strong className="text-foreground">{c.claimant}</strong></span>
                      <span>Respondent: <strong className="text-foreground">{c.respondent}</strong></span>
                      <span>SLA: <strong className={c.slaRisk ? 'text-[hsl(var(--state-blocked))]' : 'text-foreground'}>{c.sla}</strong></span>
                      <span>{c.evidenceCount} evidence files</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border bg-card p-3">
                  <div className="text-[9px] font-semibold mb-2">Stage Pipeline</div>
                  {['intake', 'triage', 'mediation', 'arbitration', 'escalated', 'resolved'].map(s => {
                    const count = CASES.filter(c => c.stage === s).length;
                    return (
                      <button key={s} onClick={() => { setFilterStage(s); setActiveTab('board'); }} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl hover:bg-muted/20 transition-colors text-[8px]">
                        <Badge variant="secondary" className={cn('text-[6px] w-16 justify-center', stageColor(s))}>{s}</Badge>
                        <span className="font-bold">{count}</span>
                        <ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
                <div className="rounded-2xl border bg-card p-3">
                  <div className="text-[9px] font-semibold mb-2">Cross-Domain</div>
                  <div className="flex flex-wrap gap-1">
                    <Link to="/admin/finance-dashboard"><Badge variant="outline" className="text-[7px] gap-0.5 cursor-pointer hover:bg-muted/20"><DollarSign className="h-2.5 w-2.5" />Finance</Badge></Link>
                    <Link to="/admin/cs-dashboard"><Badge variant="outline" className="text-[7px] gap-0.5 cursor-pointer hover:bg-muted/20"><Users className="h-2.5 w-2.5" />CS Dashboard</Badge></Link>
                    <Link to="/admin/shell"><Badge variant="outline" className="text-[7px] gap-0.5 cursor-pointer hover:bg-muted/20"><Shield className="h-2.5 w-2.5" />Admin Shell</Badge></Link>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* EVIDENCE */}
          <TabsContent value="evidence">
            <div className="rounded-2xl border bg-card p-4">
              <div className="text-[9px] font-semibold mb-3">Evidence Repository — All Active Cases</div>
              <div className="space-y-2">
                {CASES.filter(c => c.evidenceCount > 0 && c.stage !== 'resolved').map(c => (
                  <div key={c.id} className="rounded-xl border p-3 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono font-bold text-[9px]">{c.id}</span>
                      <Badge variant="secondary" className={cn('text-[6px]', stageColor(c.stage))}>{c.stage}</Badge>
                      <span className="text-[8px] text-muted-foreground ml-auto">{c.evidenceCount} files</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: Math.min(c.evidenceCount, 4) }, (_, i) => (
                        <div key={i} className="rounded-lg border bg-muted/20 px-2 py-1.5 text-[7px] flex items-center gap-1 hover:bg-muted/40 cursor-pointer transition-colors">
                          <Paperclip className="h-2.5 w-2.5 text-muted-foreground" />
                          <span>{['screenshot', 'contract', 'chat_log', 'invoice', 'delivery_proof', 'review'][i % 6]}_{i + 1}.{['png', 'pdf', 'txt', 'pdf'][i % 4]}</span>
                        </div>
                      ))}
                      {c.evidenceCount > 4 && <span className="text-[7px] text-muted-foreground self-center">+{c.evidenceCount - 4} more</span>}
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <Button size="sm" variant="outline" className="h-5 text-[6px] rounded-lg gap-0.5"><Eye className="h-2 w-2" />Review All</Button>
                      <Button size="sm" variant="outline" className="h-5 text-[6px] rounded-lg gap-0.5"><Download className="h-2 w-2" />Export</Button>
                      <Button size="sm" variant="outline" className="h-5 text-[6px] rounded-lg gap-0.5" onClick={() => toast.info('Requesting additional evidence')}><Send className="h-2 w-2" />Request More</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TIMELINE */}
          <TabsContent value="timeline">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3">Dispute Resolution Timeline — DSP-9001</div>
                <div className="space-y-3">
                  {[
                    { action: 'Dispute filed by Amara Osei', actor: 'Claimant', time: '2d ago', type: 'create' },
                    { action: 'Case assigned to J. Rivera', actor: 'Auto-router', time: '2d ago', type: 'assign' },
                    { action: 'Evidence submitted: 4 files (screenshots, contract)', actor: 'Claimant', time: '2d ago', type: 'evidence' },
                    { action: 'Respondent notified — 48h response window', actor: 'System', time: '2d ago', type: 'notify' },
                    { action: 'Respondent submitted counter-evidence: 3 files', actor: 'TechCraft LLC', time: '1d ago', type: 'evidence' },
                    { action: 'Financial hold placed on escrow — $2,450.00', actor: 'J. Rivera', time: '1d ago', type: 'hold' },
                    { action: 'Mediation attempted — no resolution reached', actor: 'S. Kim', time: '18h ago', type: 'mediation' },
                    { action: 'Case escalated to arbitration desk', actor: 'J. Rivera', time: '12h ago', type: 'escalate' },
                    { action: 'Third-party reviewer report received', actor: 'External', time: '6h ago', type: 'evidence' },
                    { action: 'SLA warning — 6h remaining for arbitration decision', actor: 'System', time: 'Now', type: 'warning' },
                  ].map((e, i) => (
                    <div key={i} className="flex gap-3 text-[8px]">
                      <div className="flex flex-col items-center">
                        <div className={cn('h-2 w-2 rounded-full shrink-0', e.type === 'warning' ? 'bg-[hsl(var(--state-blocked))] animate-pulse' : e.type === 'hold' ? 'bg-[hsl(var(--gigvora-amber))]' : e.type === 'escalate' ? 'bg-[hsl(var(--state-blocked))]' : 'bg-accent')} />
                        {i < 9 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="pb-3">
                        <div className="font-semibold">{e.action}</div>
                        <div className="text-muted-foreground">{e.actor} · {e.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3">7-Day Volume</div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={VOLUME_DATA}>
                      <XAxis dataKey="day" tick={{ fontSize: 8 }} />
                      <YAxis tick={{ fontSize: 8 }} />
                      <Tooltip contentStyle={{ fontSize: 9 }} />
                      <Bar dataKey="intake" fill="hsl(var(--primary))" name="Intake" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="resolved" fill="hsl(var(--state-healthy))" name="Resolved" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* MEDIATION */}
          <TabsContent value="mediation">
            <div className="rounded-2xl border bg-card p-4">
              <div className="text-[9px] font-semibold mb-3">Active Mediation Sessions</div>
              <div className="space-y-2">
                {CASES.filter(c => c.stage === 'mediation').map(c => (
                  <div key={c.id} className="rounded-xl border p-3 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono font-bold text-[9px]">{c.id}</span>
                      <Badge variant="secondary" className="text-[6px] bg-accent/10 text-accent">Mediation</Badge>
                      <span className="text-[8px] font-bold ml-auto">{c.amount}</span>
                    </div>
                    <div className="text-[8px] text-muted-foreground mb-2">{c.summary}</div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1 text-[7px]">
                        <div className="h-4 w-4 rounded-full bg-accent/10 flex items-center justify-center text-[5px] font-bold text-accent">{c.claimantAvatar}</div>
                        {c.claimant}
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <div className="flex items-center gap-1 text-[7px]">
                        <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[5px] font-bold">{c.respondentAvatar}</div>
                        {c.respondent}
                      </div>
                      <span className="text-[7px] text-muted-foreground ml-auto">Mediator: {c.assignee}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => toast.info('Opening mediation thread')}><MessageSquare className="h-2.5 w-2.5" />Open Thread</Button>
                      <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => toast.info('Proposing settlement')}><DollarSign className="h-2.5 w-2.5" />Propose Settlement</Button>
                      <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => toast.info('Escalating to arbitration')}><Scale className="h-2.5 w-2.5" />Escalate to Arbitration</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ARBITRATION DESK */}
          <TabsContent value="arbitration">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-3">
                <div className="rounded-xl border border-[hsl(var(--state-blocked))]/30 bg-[hsl(var(--state-blocked))]/5 p-3 flex items-center gap-2 text-[8px]">
                  <Scale className="h-4 w-4 text-[hsl(var(--state-blocked))] shrink-0" />
                  <div className="flex-1"><strong>Arbitration decisions are final and binding.</strong> All rulings are audited and must include written rationale.</div>
                </div>
                {CASES.filter(c => c.stage === 'arbitration' || c.stage === 'escalated').map(c => (
                  <div key={c.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono font-bold text-[10px]">{c.id}</span>
                      <Badge variant="secondary" className={cn('text-[6px]', stageColor(c.stage))}>{c.stage}</Badge>
                      <Badge variant="secondary" className={cn('text-[6px]', prioColor(c.priority))}>{c.priority}</Badge>
                      {c.slaRisk && <Badge variant="secondary" className="text-[6px] bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))] animate-pulse"><Timer className="h-2 w-2" />{c.sla}</Badge>}
                      <span className="text-[9px] font-bold ml-auto">{c.amount}</span>
                    </div>
                    <div className="text-[8px] text-muted-foreground mb-3">{c.summary}</div>
                    <div className="text-[7px] text-muted-foreground mb-2">Evidence: {c.evidenceCount} files · Linked: {c.linkedCases.join(', ') || 'None'} · Assignee: {c.assignee}</div>
                    <div className="flex gap-1.5 flex-wrap">
                      <Button size="sm" className="h-7 text-[7px] rounded-lg gap-0.5" onClick={() => toast.success('Ruling: Claimant awarded')}><CheckCircle2 className="h-2.5 w-2.5" />Award Claimant</Button>
                      <Button size="sm" variant="outline" className="h-7 text-[7px] rounded-lg gap-0.5" onClick={() => toast.info('Ruling: Respondent awarded')}><UserCheck className="h-2.5 w-2.5" />Award Respondent</Button>
                      <Button size="sm" variant="outline" className="h-7 text-[7px] rounded-lg gap-0.5" onClick={() => toast.info('Split decision')}><Scale className="h-2.5 w-2.5" />Split Decision</Button>
                      <Button size="sm" variant="outline" className="h-7 text-[7px] rounded-lg gap-0.5" onClick={() => toast.info('Requesting more evidence')}><Paperclip className="h-2.5 w-2.5" />Request Evidence</Button>
                      <Button size="sm" variant="outline" className="h-7 text-[7px] rounded-lg gap-0.5" onClick={() => open(c)}><Eye className="h-2.5 w-2.5" />Full Detail</Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border bg-card p-3">
                  <div className="text-[9px] font-semibold mb-2">Arbitration Queue</div>
                  <div className="space-y-1.5 text-[8px]">
                    <div className="flex justify-between"><span className="text-muted-foreground">Pending Decision</span><span className="font-bold">4</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Awaiting Evidence</span><span className="font-bold">2</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Decided (This Week)</span><span className="font-bold">7</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Avg Resolution</span><span className="font-bold">3.2 days</span></div>
                  </div>
                </div>
                <div className="rounded-2xl border bg-card p-3">
                  <div className="text-[9px] font-semibold mb-2">Outcome Templates</div>
                  <div className="space-y-1">
                    {['Full refund to claimant', 'Partial refund (50%)', 'Dismiss — insufficient evidence', 'Respondent warning + credit', 'Account restriction + refund', 'Escalate to legal'].map(t => (
                      <button key={t} className="w-full text-left px-2 py-1.5 rounded-xl text-[8px] hover:bg-muted/20 transition-colors flex items-center gap-1">
                        <FileText className="h-2.5 w-2.5 text-muted-foreground" />{t}<ChevronRight className="h-2 w-2 ml-auto text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* LINKED FINANCE */}
          <TabsContent value="finance">
            <div className="rounded-2xl border bg-card p-4">
              <div className="text-[9px] font-semibold mb-3 flex items-center gap-1"><DollarSign className="h-3 w-3 text-accent" />Linked Financial Actions</div>
              <div className="space-y-2">
                {CASES.filter(c => c.holdActive).map(c => (
                  <div key={c.id} className="rounded-xl border p-3 bg-[hsl(var(--gigvora-amber))]/[0.02]">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" />
                      <span className="font-mono font-bold text-[9px]">{c.id}</span>
                      <span className="text-[8px] font-bold">{c.amount}</span>
                      <Badge variant="secondary" className="text-[6px] bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]">Hold Active</Badge>
                      <span className="text-[7px] text-muted-foreground ml-auto">Linked: {c.linkedCases.join(', ')}</span>
                    </div>
                    <div className="text-[8px] text-muted-foreground mb-2">{c.summary}</div>
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => toast.success('Hold released — funds disbursed')}><Unlock className="h-2.5 w-2.5" />Release Hold</Button>
                      <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => toast.info('Issuing refund')}><DollarSign className="h-2.5 w-2.5" />Issue Refund</Button>
                      <Link to="/admin/finance-dashboard"><Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5"><ExternalLink className="h-2.5 w-2.5" />Finance Dashboard</Button></Link>
                    </div>
                  </div>
                ))}
                {CASES.filter(c => !c.holdActive && c.stage !== 'resolved').length > 0 && (
                  <div className="text-[8px] text-muted-foreground mt-2">
                    {CASES.filter(c => !c.holdActive && c.stage !== 'resolved').length} additional cases without active financial holds
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* MOBILE */}
          <TabsContent value="mobile">
            <div className="rounded-2xl border bg-card p-4 mb-3">
              <div className="text-[9px] font-semibold mb-2 flex items-center gap-1"><Smartphone className="h-3 w-3 text-accent" />Mobile Case Summary</div>
              <div className="text-[8px] text-muted-foreground mb-3">Priority cases for mobile triage. Full arbitration requires desktop.</div>
              <div className="space-y-2">
                {CASES.filter(c => c.priority === 'critical' || c.slaRisk).map(c => (
                  <button key={c.id} onClick={() => open(c)} className="w-full rounded-xl border p-3 text-left hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <Gavel className="h-3.5 w-3.5 text-[hsl(var(--state-blocked))]" />
                      <span className="text-[9px] font-mono font-bold">{c.id}</span>
                      <Badge variant="secondary" className={cn('text-[6px]', prioColor(c.priority))}>{c.priority}</Badge>
                      {c.slaRisk && <Badge variant="secondary" className="text-[5px] bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))] animate-pulse">SLA RISK</Badge>}
                      <span className="text-[9px] font-bold ml-auto">{c.amount}</span>
                    </div>
                    <div className="text-[8px] text-muted-foreground">{c.summary}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-[hsl(var(--gigvora-amber))]/5 border-[hsl(var(--gigvora-amber))]/30 p-3 text-[8px] flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0" />
              <span>Arbitration decisions and financial holds require desktop access with full audit controls.</span>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Drawer */}
      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent className="w-[480px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Gavel className="h-4 w-4 text-[hsl(var(--state-blocked))]" />Dispute Case</SheetTitle></SheetHeader>
          {selected && (() => {
            const TIcon = typeIcon(selected.type);
            return (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-mono font-bold">{selected.id}</span>
                  <Badge variant="secondary" className={cn('text-[7px]', stageColor(selected.stage))}>{selected.stage}</Badge>
                  <Badge variant="secondary" className={cn('text-[7px]', prioColor(selected.priority))}>{selected.priority}</Badge>
                  {selected.holdActive && <Badge variant="secondary" className="text-[7px] bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]"><Lock className="h-2.5 w-2.5" />Hold</Badge>}
                </div>

                <div className="flex items-center gap-3">
                  <TIcon className="h-5 w-5 text-muted-foreground" />
                  <div><div className="text-sm font-bold">{selected.amount}</div><div className="text-[8px] text-muted-foreground capitalize">{selected.type} dispute</div></div>
                </div>

                <div className="rounded-xl border p-3">
                  <div className="text-[9px] font-semibold mb-2">Parties</div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center text-[8px] font-bold text-accent">{selected.claimantAvatar}</div>
                      <div><div className="text-[9px] font-semibold">{selected.claimant}</div><div className="text-[7px] text-muted-foreground">Claimant</div></div>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <div className="flex items-center gap-1.5">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold">{selected.respondentAvatar}</div>
                      <div><div className="text-[9px] font-semibold">{selected.respondent}</div><div className="text-[7px] text-muted-foreground">Respondent</div></div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border p-3 text-[8px]">
                  <div className="text-[9px] font-semibold mb-1">Summary</div>
                  <p className="text-muted-foreground">{selected.summary}</p>
                </div>

                <div className="rounded-xl border p-3 space-y-1.5 text-[8px]">
                  {[
                    { l: 'Assignee', v: selected.assignee },
                    { l: 'Created', v: selected.created },
                    { l: 'SLA', v: selected.sla },
                    { l: 'Evidence', v: `${selected.evidenceCount} files` },
                    { l: 'Linked', v: selected.linkedCases.join(', ') || 'None' },
                  ].map(m => (
                    <div key={m.l} className="flex justify-between"><span className="text-muted-foreground">{m.l}</span><span className={cn('font-semibold', m.l === 'SLA' && selected.slaRisk && 'text-[hsl(var(--state-blocked))]')}>{m.v}</span></div>
                  ))}
                </div>

                {/* Audit Trail */}
                <div className="rounded-xl border p-3">
                  <div className="text-[9px] font-semibold mb-2">Audit Trail</div>
                  <div className="space-y-1.5 text-[7px]">
                    {[
                      { action: 'Dispute filed', actor: selected.claimant, time: selected.created },
                      { action: 'Assigned to ' + selected.assignee, actor: 'Auto-router', time: 'Shortly after' },
                      { action: 'Stage: ' + selected.stage, actor: 'System', time: 'Current' },
                    ].map((a, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                        <span>{a.action}</span>
                        <span className="text-muted-foreground ml-auto">{a.actor} · {a.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  {selected.stage !== 'resolved' && <>
                    <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.success('Case resolved')}><CheckCircle2 className="h-3 w-3" />Resolve</Button>
                    <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Escalating')}><AlertTriangle className="h-3 w-3" />Escalate</Button>
                  </>}
                  {selected.holdActive && (
                    <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.success('Hold released')}><Unlock className="h-3 w-3" />Release Hold</Button>
                  )}
                  <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Requesting evidence')}><Paperclip className="h-3 w-3" />Request Evidence</Button>
                  <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Adding note')}><FileText className="h-3 w-3" />Add Note</Button>
                  <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Referring to finance')}><DollarSign className="h-3 w-3" />Refer Finance</Button>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  <Link to="/admin/finance-dashboard"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><DollarSign className="h-2.5 w-2.5" />Finance</Button></Link>
                  <Link to="/admin/cs-dashboard"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Users className="h-2.5 w-2.5" />CS Dashboard</Button></Link>
                  <Link to="/admin/shell"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Shield className="h-2.5 w-2.5" />Admin Shell</Button></Link>
                </div>

                <div className="rounded-lg border border-[hsl(var(--state-blocked))]/20 bg-[hsl(var(--state-blocked))]/5 p-2 text-[8px] flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-[hsl(var(--state-blocked))] shrink-0" />
                  <span>Arbitration decisions are final, audited, and irreversible. All actions require written rationale.</span>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-2 flex items-center gap-2 safe-area-bottom">
        {[
          { tab: 'board', icon: Layers, label: 'Cases' },
          { tab: 'mediation', icon: MessageSquare, label: 'Mediation' },
          { tab: 'arbitration', icon: Scale, label: 'Arbitration' },
          { tab: 'finance', icon: DollarSign, label: 'Finance' },
        ].map(n => (
          <button key={n.tab} onClick={() => setActiveTab(n.tab)} className={cn('flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg', activeTab === n.tab ? 'text-accent' : 'text-muted-foreground')}>
            <n.icon className="h-4 w-4" /><span className="text-[7px]">{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DisputeOperationsDashboardPage;
