import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield, AlertTriangle, Search, Clock, Users, Eye, RefreshCw, FileText,
  Radio, ChevronRight, Smartphone, MessageSquare, Flag, Ban, UserCheck,
  Hash, ExternalLink, Image, Video, AlertOctagon, Timer, Layers, History,
  CheckCircle2, XCircle, Send, Lock, Scale, Gavel, BarChart3,
  ThumbsDown, ThumbsUp, Repeat, Activity, Megaphone, Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MlPipelineHealthCard } from '@/components/admin/MlPipelineHealthCard';

type ContentType = 'post' | 'message' | 'job' | 'gig' | 'comment' | 'group' | 'profile';
type Severity = 'critical' | 'high' | 'medium' | 'low';
type Status = 'pending' | 'in-review' | 'actioned' | 'dismissed' | 'appealed' | 'escalated';

interface Report {
  id: string; contentType: ContentType; severity: Severity; status: Status;
  title: string; reporter: string; reporterAvatar: string;
  subject: string; subjectAvatar: string; reason: string;
  mlScore: number; mlFlag: string; created: string;
  priorStrikes: number; linkedCases: string[]; preview: string;
}

const REPORTS: Report[] = [
  { id: 'MOD-4001', contentType: 'message', severity: 'critical', status: 'pending', title: 'Harassment in DMs', reporter: 'User-8832', reporterAvatar: 'U8', subject: 'ShadowViper99', subjectAvatar: 'SV', reason: 'Threatening language and harassment', mlScore: 0.96, mlFlag: 'THREAT_DETECTED', created: '12m ago', priorStrikes: 3, linkedCases: ['DSP-9003'], preview: 'Threatening messages sent to multiple users over 48h period' },
  { id: 'MOD-4002', contentType: 'post', severity: 'high', status: 'pending', title: 'Misleading job listing', reporter: 'AutoML', reporterAvatar: 'ML', subject: 'QuickHire Agency', subjectAvatar: 'QH', reason: 'Deceptive content — fake salary claims', mlScore: 0.89, mlFlag: 'DECEPTION_LIKELY', created: '45m ago', priorStrikes: 1, linkedCases: [], preview: 'Job listing claims $500k salary for entry-level data entry role' },
  { id: 'MOD-4003', contentType: 'gig', severity: 'high', status: 'in-review', title: 'Prohibited services offered', reporter: 'User-2201', reporterAvatar: 'U2', subject: 'CryptoGuru42', subjectAvatar: 'CG', reason: 'Offering prohibited financial services', mlScore: 0.82, mlFlag: 'POLICY_VIOLATION', created: '2h ago', priorStrikes: 0, linkedCases: ['TKT-5010'], preview: 'Gig offers guaranteed crypto returns — violates financial services policy' },
  { id: 'MOD-4004', contentType: 'comment', severity: 'medium', status: 'pending', title: 'Spam comments on project', reporter: 'User-1100', reporterAvatar: 'U1', subject: 'BotFarm_xz', subjectAvatar: 'BF', reason: 'Automated spam / bot activity', mlScore: 0.94, mlFlag: 'BOT_DETECTED', created: '1h ago', priorStrikes: 5, linkedCases: ['MOD-3998'], preview: 'Identical promotional comments posted across 40+ project pages' },
  { id: 'MOD-4005', contentType: 'profile', severity: 'medium', status: 'appealed', title: 'Impersonation report', reporter: 'User-7744', reporterAvatar: 'U7', subject: 'RealDesignerPro', subjectAvatar: 'RD', reason: 'Impersonating another professional', mlScore: 0.61, mlFlag: 'IDENTITY_MISMATCH', created: '6h ago', priorStrikes: 0, linkedCases: [], preview: 'Profile uses portfolio images belonging to a verified designer' },
  { id: 'MOD-4006', contentType: 'group', severity: 'low', status: 'dismissed', title: 'Off-topic group content', reporter: 'User-3300', reporterAvatar: 'U3', subject: 'TechTalk Community', subjectAvatar: 'TT', reason: 'Group posting unrelated content', mlScore: 0.22, mlFlag: 'LOW_RISK', created: '1d ago', priorStrikes: 0, linkedCases: [], preview: 'Community group sharing memes unrelated to tech discussion' },
  { id: 'MOD-4007', contentType: 'message', severity: 'critical', status: 'escalated', title: 'CSAM content flagged', reporter: 'AutoML', reporterAvatar: 'ML', subject: 'Account-Suspended', subjectAvatar: 'AS', reason: 'Illegal content detected by ML pipeline', mlScore: 0.99, mlFlag: 'ILLEGAL_CONTENT', created: '5m ago', priorStrikes: 0, linkedCases: ['DSP-9010', 'LEGAL-001'], preview: '[Content hidden — requires L3+ clearance to view]' },
  { id: 'MOD-4008', contentType: 'job', severity: 'high', status: 'in-review', title: 'Discriminatory hiring language', reporter: 'User-5500', reporterAvatar: 'U5', subject: 'OldSchool Corp', subjectAvatar: 'OS', reason: 'Age and gender discrimination in listing', mlScore: 0.78, mlFlag: 'DISCRIMINATION', created: '3h ago', priorStrikes: 2, linkedCases: [], preview: 'Job listing specifies "young, energetic female candidates only"' },
];

const VOLUME_DATA = [
  { day: 'Mon', reports: 45, actioned: 38, dismissed: 7 },
  { day: 'Tue', reports: 52, actioned: 41, dismissed: 11 },
  { day: 'Wed', reports: 38, actioned: 32, dismissed: 6 },
  { day: 'Thu', reports: 61, actioned: 50, dismissed: 11 },
  { day: 'Fri', reports: 44, actioned: 39, dismissed: 5 },
  { day: 'Sat', reports: 22, actioned: 18, dismissed: 4 },
  { day: 'Sun', reports: 15, actioned: 12, dismissed: 3 },
];

const sevColor = (s: Severity) => s === 'critical' ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]' : s === 'high' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : s === 'medium' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground';
const statusColor = (s: Status) => s === 'pending' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : s === 'in-review' ? 'bg-accent/10 text-accent' : s === 'actioned' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : s === 'dismissed' ? 'bg-muted text-muted-foreground' : s === 'appealed' ? 'bg-primary/10 text-primary' : 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]';
const typeIcon = (t: ContentType) => t === 'post' ? FileText : t === 'message' ? MessageSquare : t === 'job' ? Globe : t === 'gig' ? Megaphone : t === 'comment' ? Hash : t === 'group' ? Users : Shield;

const ModeratorDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('queue');
  const [selected, setSelected] = useState<Report | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  const open = (r: Report) => { setSelected(r); setDrawer(true); };

  const filtered = REPORTS.filter(r => {
    if (filterSeverity !== 'all' && r.severity !== filterSeverity) return false;
    if (filterType !== 'all' && r.contentType !== filterType) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (search && !r.id.toLowerCase().includes(search.toLowerCase()) && !r.subject.toLowerCase().includes(search.toLowerCase()) && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Env Ribbon */}
      <div className="flex items-center gap-2 px-4 py-1 text-[8px] font-mono border-b bg-accent/5 text-accent">
        <Radio className="h-2.5 w-2.5 animate-pulse" /><span className="uppercase font-bold">Production</span><span className="text-muted-foreground">·</span><span className="text-muted-foreground">Moderation Console v4.2</span>
        <div className="flex-1" />
        <Badge variant="secondary" className="text-[6px] gap-0.5"><Shield className="h-2 w-2" />Moderator</Badge>
        <Badge variant="secondary" className="text-[6px] gap-0.5"><Clock className="h-2 w-2" />Session: 2h 48m</Badge>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center"><Shield className="h-5 w-5 text-accent" /></div>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Moderator Dashboard</h1>
            <p className="text-[9px] text-muted-foreground">Content enforcement, messaging incident review, and policy actions</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Link to="/admin/dispute-ops"><Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Gavel className="h-3 w-3" />Disputes</Button></Link>
            <Link to="/admin/cs-dashboard"><Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Users className="h-3 w-3" />CS Dashboard</Button></Link>
            <Link to="/admin/shell"><Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Shield className="h-3 w-3" />Admin Shell</Button></Link>
          </div>
        </div>

        {/* KPI Band */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
          {[
            { label: 'Pending Review', value: '18', delta: '3 critical', icon: Flag, state: 'blocked' },
            { label: 'ML Flagged', value: '12', delta: '4 high-confidence', icon: Activity, state: 'caution' },
            { label: 'In Review', value: '6', delta: '2 assigned to you', icon: Eye, state: 'caution' },
            { label: 'Actioned (24h)', value: '43', delta: '91% accuracy', icon: CheckCircle2, state: 'healthy' },
            { label: 'Repeat Offenders', value: '7', delta: '3 at ban threshold', icon: Repeat, state: 'blocked' },
            { label: 'Appeals Queue', value: '4', delta: '1 overdue', icon: Scale, state: 'caution' },
          ].map(k => (
            <div key={k.label} className="rounded-2xl border bg-card p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-1 text-[8px] text-muted-foreground mb-1"><k.icon className="h-3 w-3" />{k.label}</div>
              <div className="text-lg font-bold">{k.value}</div>
              <div className={cn('text-[8px]', k.state === 'healthy' ? 'text-[hsl(var(--state-healthy))]' : k.state === 'blocked' ? 'text-[hsl(var(--state-blocked))]' : 'text-[hsl(var(--gigvora-amber))]')}>{k.delta}</div>
            </div>
          ))}
        </div>

        {/* Critical Incident Banner */}
        {REPORTS.some(r => r.severity === 'critical' && r.status !== 'actioned' && r.status !== 'dismissed') && (
          <div className="rounded-xl border border-[hsl(var(--state-blocked))]/30 bg-[hsl(var(--state-blocked))]/5 p-3 flex items-center gap-2 text-[8px] mb-4">
            <AlertOctagon className="h-4 w-4 text-[hsl(var(--state-blocked))] shrink-0 animate-pulse" />
            <div className="flex-1"><strong>{REPORTS.filter(r => r.severity === 'critical' && r.status !== 'actioned' && r.status !== 'dismissed').length} critical reports require immediate review</strong> — includes ML-flagged illegal content and active threats</div>
            <Button variant="outline" size="sm" className="h-6 text-[7px] rounded-lg" onClick={() => { setFilterSeverity('critical'); setActiveTab('queue'); }}>View Critical</Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="queue" className="text-[9px] gap-1"><Layers className="h-3 w-3" />Report Queue</TabsTrigger>
            <TabsTrigger value="content" className="text-[9px] gap-1"><FileText className="h-3 w-3" />Content Detail</TabsTrigger>
            <TabsTrigger value="messages" className="text-[9px] gap-1"><MessageSquare className="h-3 w-3" />Message Incidents</TabsTrigger>
            <TabsTrigger value="policy" className="text-[9px] gap-1"><Shield className="h-3 w-3" />Policy Compare</TabsTrigger>
            <TabsTrigger value="offenders" className="text-[9px] gap-1"><Repeat className="h-3 w-3" />Repeat Offenders</TabsTrigger>
            <TabsTrigger value="appeals" className="text-[9px] gap-1"><Scale className="h-3 w-3" />Appeals</TabsTrigger>
            <TabsTrigger value="analytics" className="text-[9px] gap-1"><BarChart3 className="h-3 w-3" />Analytics</TabsTrigger>
            <TabsTrigger value="mobile" className="text-[9px] gap-1"><Smartphone className="h-3 w-3" />Mobile</TabsTrigger>
          </TabsList>

          {/* REPORT QUEUE */}
          <TabsContent value="queue">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports, subjects..." className="pl-8 h-8 text-[9px] rounded-xl" />
              </div>
              <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="h-8 px-2 text-[9px] rounded-xl border bg-card">
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="h-8 px-2 text-[9px] rounded-xl border bg-card">
                <option value="all">All Types</option>
                <option value="post">Post</option>
                <option value="message">Message</option>
                <option value="job">Job</option>
                <option value="gig">Gig</option>
                <option value="comment">Comment</option>
                <option value="group">Group</option>
                <option value="profile">Profile</option>
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-8 px-2 text-[9px] rounded-xl border bg-card">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-review">In Review</option>
                <option value="actioned">Actioned</option>
                <option value="dismissed">Dismissed</option>
                <option value="appealed">Appealed</option>
                <option value="escalated">Escalated</option>
              </select>
              <Button variant="ghost" size="sm" className="h-8 text-[8px] rounded-xl gap-1" onClick={() => { setFilterSeverity('all'); setFilterType('all'); setFilterStatus('all'); setSearch(''); }}><RefreshCw className="h-2.5 w-2.5" />Reset</Button>
            </div>

            <div className="rounded-2xl border bg-card overflow-hidden">
              <table className="w-full text-[9px]">
                <thead><tr className="border-b bg-muted/20">
                  <th className="px-3 py-2 text-left font-semibold">Report</th>
                  <th className="px-2 py-2 text-left font-semibold">Type</th>
                  <th className="px-2 py-2 text-left font-semibold">Subject</th>
                  <th className="px-2 py-2 text-left font-semibold">Reason</th>
                  <th className="px-2 py-2 text-left font-semibold">ML</th>
                  <th className="px-2 py-2 text-left font-semibold">Severity</th>
                  <th className="px-2 py-2 text-left font-semibold">Status</th>
                  <th className="px-2 py-2 text-left font-semibold">Strikes</th>
                  <th className="px-2 py-2 text-left font-semibold">Actions</th>
                </tr></thead>
                <tbody className="divide-y">
                  {filtered.map(r => {
                    const TIcon = typeIcon(r.contentType);
                    return (
                      <tr key={r.id} onClick={() => open(r)} className={cn('hover:bg-muted/10 cursor-pointer transition-colors', r.severity === 'critical' && r.status === 'pending' && 'bg-[hsl(var(--state-blocked))]/[0.02]')}>
                        <td className="px-3 py-2">
                          <div className="font-mono font-semibold">{r.id}</div>
                          <div className="text-[7px] text-muted-foreground">{r.created}</div>
                        </td>
                        <td className="px-2 py-2"><div className="flex items-center gap-1"><TIcon className="h-3 w-3 text-muted-foreground" /><span className="capitalize">{r.contentType}</span></div></td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[5px] font-bold">{r.subjectAvatar}</div>
                            <span>{r.subject}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2 max-w-[140px] truncate">{r.reason}</td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <div className={cn('h-1.5 w-1.5 rounded-full', r.mlScore >= 0.9 ? 'bg-[hsl(var(--state-blocked))]' : r.mlScore >= 0.7 ? 'bg-[hsl(var(--gigvora-amber))]' : 'bg-muted-foreground')} />
                            <span className="text-[7px]">{(r.mlScore * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-2 py-2"><Badge variant="secondary" className={cn('text-[6px]', sevColor(r.severity))}>{r.severity}</Badge></td>
                        <td className="px-2 py-2"><Badge variant="secondary" className={cn('text-[6px]', statusColor(r.status))}>{r.status}</Badge></td>
                        <td className="px-2 py-2"><span className={cn('text-[8px] font-bold', r.priorStrikes >= 3 ? 'text-[hsl(var(--state-blocked))]' : '')}>{r.priorStrikes}</span></td>
                        <td className="px-2 py-2">
                          <div className="flex gap-1">
                            <Button size="sm" className="h-5 text-[6px] rounded-lg" onClick={e => { e.stopPropagation(); open(r); }}>Review</Button>
                            {r.status === 'pending' && <Button variant="outline" size="sm" className="h-5 text-[6px] rounded-lg" onClick={e => { e.stopPropagation(); toast.info('Assigned to you'); }}>Claim</Button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* CONTENT DETAIL */}
          <TabsContent value="content">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-3">
                <div className="text-[9px] text-muted-foreground mb-1">Select a report to inspect content, or review flagged items below:</div>
                {REPORTS.filter(r => r.contentType !== 'message' && r.status !== 'dismissed').slice(0, 4).map(r => (
                  <button key={r.id} onClick={() => open(r)} className="w-full rounded-2xl border bg-card p-4 text-left hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono font-bold text-[10px]">{r.id}</span>
                      <Badge variant="secondary" className={cn('text-[6px]', sevColor(r.severity))}>{r.severity}</Badge>
                      <Badge variant="secondary" className={cn('text-[6px]', statusColor(r.status))}>{r.status}</Badge>
                      <Badge variant="secondary" className="text-[6px] bg-muted capitalize">{r.contentType}</Badge>
                    </div>
                    <div className="text-[9px] font-semibold mb-1">{r.title}</div>
                    <div className="rounded-xl bg-muted/20 border p-2 text-[8px] text-muted-foreground mb-2">{r.preview}</div>
                    <div className="flex items-center gap-3 text-[7px] text-muted-foreground">
                      <span>Subject: <strong className="text-foreground">{r.subject}</strong></span>
                      <span>ML: <strong className={r.mlScore >= 0.8 ? 'text-[hsl(var(--state-blocked))]' : 'text-foreground'}>{r.mlFlag}</strong></span>
                      <span>Strikes: <strong className={r.priorStrikes >= 3 ? 'text-[hsl(var(--state-blocked))]' : 'text-foreground'}>{r.priorStrikes}</strong></span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border bg-card p-3">
                  <div className="text-[9px] font-semibold mb-2">Content Type Breakdown</div>
                  {(['post', 'message', 'job', 'gig', 'comment', 'group', 'profile'] as ContentType[]).map(t => {
                    const count = REPORTS.filter(r => r.contentType === t).length;
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
                  <div className="text-[9px] font-semibold mb-2">Cross-Domain</div>
                  <div className="flex flex-wrap gap-1">
                    <Link to="/admin/dispute-ops"><Badge variant="outline" className="text-[7px] gap-0.5 cursor-pointer hover:bg-muted/20"><Gavel className="h-2.5 w-2.5" />Disputes</Badge></Link>
                    <Link to="/admin/cs-dashboard"><Badge variant="outline" className="text-[7px] gap-0.5 cursor-pointer hover:bg-muted/20"><Users className="h-2.5 w-2.5" />CS Dashboard</Badge></Link>
                    <Link to="/admin/finance-dashboard"><Badge variant="outline" className="text-[7px] gap-0.5 cursor-pointer hover:bg-muted/20"><BarChart3 className="h-2.5 w-2.5" />Finance</Badge></Link>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* MESSAGE INCIDENTS */}
          <TabsContent value="messages">
            <div className="rounded-2xl border bg-card p-4">
              <div className="text-[9px] font-semibold mb-3 flex items-center gap-1"><MessageSquare className="h-3 w-3 text-accent" />Messaging Incident Review</div>
              <div className="space-y-2">
                {REPORTS.filter(r => r.contentType === 'message').map(r => (
                  <div key={r.id} className={cn('rounded-xl border p-3 hover:bg-muted/10 transition-colors', r.severity === 'critical' && 'border-[hsl(var(--state-blocked))]/30 bg-[hsl(var(--state-blocked))]/[0.02]')}>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-3.5 w-3.5 text-accent" />
                      <span className="font-mono font-bold text-[9px]">{r.id}</span>
                      <Badge variant="secondary" className={cn('text-[6px]', sevColor(r.severity))}>{r.severity}</Badge>
                      <Badge variant="secondary" className={cn('text-[6px]', statusColor(r.status))}>{r.status}</Badge>
                      <span className="text-[7px] ml-auto text-muted-foreground">{r.created}</span>
                    </div>
                    <div className="text-[9px] font-semibold mb-1">{r.title}</div>
                    <div className="rounded-lg bg-muted/20 border p-2 text-[8px] text-muted-foreground mb-2">{r.preview}</div>
                    <div className="flex items-center gap-2 mb-2 text-[7px]">
                      <span>Subject: <strong>{r.subject}</strong></span>
                      <span>ML: <strong className={r.mlScore >= 0.9 ? 'text-[hsl(var(--state-blocked))]' : ''}>{r.mlFlag} ({(r.mlScore * 100).toFixed(0)}%)</strong></span>
                      <span>Prior strikes: <strong className={r.priorStrikes >= 3 ? 'text-[hsl(var(--state-blocked))]' : ''}>{r.priorStrikes}</strong></span>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => open(r)}><Eye className="h-2.5 w-2.5" />Review Thread</Button>
                      <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => toast.info('Restricting messaging')}><Ban className="h-2.5 w-2.5" />Restrict DMs</Button>
                      <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => toast.info('Escalating to T&S')}><AlertTriangle className="h-2.5 w-2.5" />Escalate to T&S</Button>
                      {r.severity === 'critical' && <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5 text-[hsl(var(--state-blocked))]" onClick={() => toast.info('Suspending account')}><Lock className="h-2.5 w-2.5" />Suspend Account</Button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* POLICY COMPARE */}
          <TabsContent value="policy">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3">Active Policy Rules</div>
                <div className="space-y-2">
                  {[
                    { rule: 'Harassment & Threats', threshold: 'Zero tolerance — immediate action', auto: true, severity: 'critical' },
                    { rule: 'Deceptive Content', threshold: 'ML score ≥ 0.85 → auto-queue', auto: true, severity: 'high' },
                    { rule: 'Spam / Bot Activity', threshold: '5+ duplicate posts → auto-flag', auto: true, severity: 'medium' },
                    { rule: 'Prohibited Services', threshold: 'Financial, legal, medical claims', auto: false, severity: 'high' },
                    { rule: 'Impersonation', threshold: 'Identity mismatch ≥ 0.7', auto: true, severity: 'medium' },
                    { rule: 'Discrimination', threshold: 'Protected class language detected', auto: true, severity: 'high' },
                    { rule: 'Off-Topic / Low Quality', threshold: '3+ reports from unique users', auto: false, severity: 'low' },
                  ].map(p => (
                    <div key={p.rule} className="rounded-xl border p-2 flex items-center gap-2 text-[8px]">
                      <Badge variant="secondary" className={cn('text-[6px] w-14 justify-center', sevColor(p.severity as Severity))}>{p.severity}</Badge>
                      <div className="flex-1">
                        <div className="font-semibold">{p.rule}</div>
                        <div className="text-muted-foreground text-[7px]">{p.threshold}</div>
                      </div>
                      {p.auto && <Badge variant="secondary" className="text-[5px] bg-accent/10 text-accent">AUTO</Badge>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3">Enforcement Actions Reference</div>
                <div className="space-y-1.5">
                  {[
                    { action: 'Warning issued', desc: 'Soft warning, no restrictions', level: 'low' },
                    { action: 'Content removed', desc: 'Offending content taken down', level: 'medium' },
                    { action: 'Temporary restriction', desc: '24h–7d feature restriction', level: 'medium' },
                    { action: 'Account suspension', desc: '7–30d full account freeze', level: 'high' },
                    { action: 'Permanent ban', desc: 'Irreversible, requires L3 approval', level: 'critical' },
                    { action: 'Legal referral', desc: 'Forwarded to legal / law enforcement', level: 'critical' },
                  ].map(a => (
                    <div key={a.action} className="rounded-xl border p-2 flex items-center gap-2 text-[8px]">
                      <Badge variant="secondary" className={cn('text-[6px] w-14 justify-center', sevColor(a.level as Severity))}>{a.level}</Badge>
                      <div><div className="font-semibold">{a.action}</div><div className="text-[7px] text-muted-foreground">{a.desc}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* REPEAT OFFENDERS */}
          <TabsContent value="offenders">
            <div className="rounded-2xl border bg-card p-4">
              <div className="text-[9px] font-semibold mb-3 flex items-center gap-1"><Repeat className="h-3 w-3 text-[hsl(var(--state-blocked))]" />Repeat Offender Trail</div>
              <div className="space-y-2">
                {REPORTS.filter(r => r.priorStrikes >= 1).sort((a, b) => b.priorStrikes - a.priorStrikes).map(r => (
                  <div key={r.id} className={cn('rounded-xl border p-3', r.priorStrikes >= 3 && 'border-[hsl(var(--state-blocked))]/30 bg-[hsl(var(--state-blocked))]/[0.02]')}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[6px] font-bold">{r.subjectAvatar}</div>
                      <span className="text-[9px] font-semibold">{r.subject}</span>
                      <Badge variant="secondary" className={cn('text-[6px]', r.priorStrikes >= 3 ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]' : 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]')}>{r.priorStrikes} strikes</Badge>
                      {r.priorStrikes >= 5 && <Badge variant="secondary" className="text-[5px] bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))] animate-pulse">BAN THRESHOLD</Badge>}
                      <span className="text-[7px] text-muted-foreground ml-auto">Latest: {r.id}</span>
                    </div>
                    <div className="text-[8px] text-muted-foreground mb-2">Latest violation: {r.reason}</div>
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => open(r)}><Eye className="h-2.5 w-2.5" />View History</Button>
                      <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => toast.info('Issuing final warning')}><AlertTriangle className="h-2.5 w-2.5" />Final Warning</Button>
                      {r.priorStrikes >= 3 && <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5 text-[hsl(var(--state-blocked))]" onClick={() => toast.info('Initiating ban')}><Ban className="h-2.5 w-2.5" />Initiate Ban</Button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* APPEALS */}
          <TabsContent value="appeals">
            <div className="rounded-2xl border bg-card p-4">
              <div className="text-[9px] font-semibold mb-3 flex items-center gap-1"><Scale className="h-3 w-3 text-primary" />Appeals Queue</div>
              <div className="space-y-2">
                {REPORTS.filter(r => r.status === 'appealed').map(r => (
                  <div key={r.id} className="rounded-xl border p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono font-bold text-[9px]">{r.id}</span>
                      <Badge variant="secondary" className="text-[6px] bg-primary/10 text-primary">Appeal</Badge>
                      <Badge variant="secondary" className={cn('text-[6px]', sevColor(r.severity))}>{r.severity}</Badge>
                      <span className="text-[7px] text-muted-foreground ml-auto">{r.created}</span>
                    </div>
                    <div className="text-[9px] font-semibold mb-1">{r.title}</div>
                    <div className="text-[8px] text-muted-foreground mb-2">Original action: Content removal · Reason: {r.reason}</div>
                    <div className="rounded-lg bg-muted/20 border p-2 text-[8px] mb-2">
                      <div className="font-semibold text-[7px] text-muted-foreground mb-1">APPEAL STATEMENT:</div>
                      "I believe this was an error. My portfolio images are my own original work and I can provide verification."
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => toast.success('Appeal upheld — action reversed')}><ThumbsUp className="h-2.5 w-2.5" />Uphold Appeal</Button>
                      <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => toast.info('Appeal denied')}><ThumbsDown className="h-2.5 w-2.5" />Deny Appeal</Button>
                      <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => toast.info('Requesting additional evidence')}><Send className="h-2.5 w-2.5" />Request Evidence</Button>
                    </div>
                  </div>
                ))}
                {REPORTS.filter(r => r.status === 'appealed').length === 0 && (
                  <div className="text-center text-[9px] text-muted-foreground py-8">No pending appeals</div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ANALYTICS */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3">7-Day Moderation Volume</div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={VOLUME_DATA}>
                      <XAxis dataKey="day" tick={{ fontSize: 8 }} />
                      <YAxis tick={{ fontSize: 8 }} />
                      <Tooltip contentStyle={{ fontSize: 9 }} />
                      <Bar dataKey="reports" fill="hsl(var(--primary))" name="Reports" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="actioned" fill="hsl(var(--state-healthy))" name="Actioned" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="dismissed" fill="hsl(var(--muted-foreground))" name="Dismissed" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border bg-card p-3">
                  <div className="text-[9px] font-semibold mb-2">Performance Metrics</div>
                  <div className="space-y-1.5 text-[8px]">
                    {[
                      { l: 'Avg Review Time', v: '4.2 min' },
                      { l: 'Accuracy Rate', v: '91.3%' },
                      { l: 'ML Confirmation Rate', v: '87.6%' },
                      { l: 'Appeals Overturned', v: '12%' },
                      { l: 'Escalation Rate', v: '8.4%' },
                      { l: 'Queue Clear Time', v: '2.1 hours' },
                    ].map(m => (
                      <div key={m.l} className="flex justify-between"><span className="text-muted-foreground">{m.l}</span><span className="font-bold">{m.v}</span></div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border bg-card p-3">
                  <MlPipelineHealthCard compact={false} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* MOBILE */}
          <TabsContent value="mobile">
            <div className="rounded-2xl border bg-card p-4 mb-3">
              <div className="text-[9px] font-semibold mb-2 flex items-center gap-1"><Smartphone className="h-3 w-3 text-accent" />Mobile Moderator Triage</div>
              <div className="text-[8px] text-muted-foreground mb-3">Critical and high-severity items for quick triage. Full review requires desktop.</div>
              <div className="space-y-2">
                {REPORTS.filter(r => (r.severity === 'critical' || r.severity === 'high') && r.status !== 'actioned' && r.status !== 'dismissed').map(r => (
                  <button key={r.id} onClick={() => open(r)} className="w-full rounded-xl border p-3 text-left hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-3.5 w-3.5 text-accent" />
                      <span className="text-[9px] font-mono font-bold">{r.id}</span>
                      <Badge variant="secondary" className={cn('text-[6px]', sevColor(r.severity))}>{r.severity}</Badge>
                      <Badge variant="secondary" className={cn('text-[6px]', statusColor(r.status))}>{r.status}</Badge>
                    </div>
                    <div className="text-[8px] font-semibold">{r.title}</div>
                    <div className="text-[7px] text-muted-foreground">{r.reason}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-[hsl(var(--gigvora-amber))]/5 border-[hsl(var(--gigvora-amber))]/30 p-3 text-[8px] flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0" />
              <span>Account suspensions and permanent bans require desktop access with full audit controls.</span>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Drawer */}
      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent className="w-[480px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-accent" />Moderation Review</SheetTitle></SheetHeader>
          {selected && (() => {
            const TIcon = typeIcon(selected.contentType);
            return (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-mono font-bold">{selected.id}</span>
                  <Badge variant="secondary" className={cn('text-[7px]', sevColor(selected.severity))}>{selected.severity}</Badge>
                  <Badge variant="secondary" className={cn('text-[7px]', statusColor(selected.status))}>{selected.status}</Badge>
                  <Badge variant="secondary" className="text-[7px] bg-muted capitalize">{selected.contentType}</Badge>
                </div>

                <div className="flex items-center gap-3">
                  <TIcon className="h-5 w-5 text-muted-foreground" />
                  <div><div className="text-sm font-bold">{selected.title}</div><div className="text-[8px] text-muted-foreground">{selected.reason}</div></div>
                </div>

                <div className="rounded-xl border p-3">
                  <div className="text-[9px] font-semibold mb-2">Subject</div>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold">{selected.subjectAvatar}</div>
                    <div><div className="text-[9px] font-semibold">{selected.subject}</div><div className="text-[7px] text-muted-foreground">Prior strikes: <strong className={selected.priorStrikes >= 3 ? 'text-[hsl(var(--state-blocked))]' : ''}>{selected.priorStrikes}</strong></div></div>
                  </div>
                </div>

                <div className="rounded-xl border p-3">
                  <div className="text-[9px] font-semibold mb-1">Content Preview</div>
                  <div className="rounded-lg bg-muted/20 border p-2 text-[8px] text-muted-foreground">{selected.preview}</div>
                </div>

                <div className="rounded-xl border p-3">
                  <div className="text-[9px] font-semibold mb-1">ML Analysis</div>
                  <div className="space-y-1 text-[8px]">
                    <div className="flex justify-between"><span className="text-muted-foreground">Confidence</span><span className={cn('font-bold', selected.mlScore >= 0.9 ? 'text-[hsl(var(--state-blocked))]' : '')}>{(selected.mlScore * 100).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Flag</span><span className="font-bold">{selected.mlFlag}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Reporter</span><span className="font-bold">{selected.reporter}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Filed</span><span className="font-bold">{selected.created}</span></div>
                    {selected.linkedCases.length > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Linked</span><span className="font-bold">{selected.linkedCases.join(', ')}</span></div>}
                  </div>
                </div>

                {/* Audit Trail */}
                <div className="rounded-xl border p-3">
                  <div className="text-[9px] font-semibold mb-2">Audit Trail</div>
                  <div className="space-y-1.5 text-[7px]">
                    {[
                      { action: 'Report filed', actor: selected.reporter, time: selected.created },
                      { action: `ML flag: ${selected.mlFlag}`, actor: 'ML Pipeline', time: selected.created },
                      { action: 'Queued for review', actor: 'Auto-router', time: 'Shortly after' },
                    ].map((a, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                        <span>{a.action}</span>
                        <span className="text-muted-foreground ml-auto">{a.actor} · {a.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Panel */}
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.success('Content removed')}><XCircle className="h-3 w-3" />Remove Content</Button>
                  <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Warning issued')}><AlertTriangle className="h-3 w-3" />Issue Warning</Button>
                  <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Restricting account')}><Ban className="h-3 w-3" />Restrict Account</Button>
                  <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Dismissed')}><ThumbsDown className="h-3 w-3" />Dismiss Report</Button>
                  <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Escalating to T&S')}><Shield className="h-3 w-3" />Escalate to T&S</Button>
                  <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Adding note')}><FileText className="h-3 w-3" />Add Note</Button>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  <Link to="/admin/dispute-ops"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Gavel className="h-2.5 w-2.5" />Disputes</Button></Link>
                  <Link to="/admin/cs-dashboard"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Users className="h-2.5 w-2.5" />CS Dashboard</Button></Link>
                  <Link to="/admin/shell"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Shield className="h-2.5 w-2.5" />Admin Shell</Button></Link>
                </div>

                <div className="rounded-lg border border-accent/20 bg-accent/5 p-2 text-[8px] flex items-center gap-2">
                  <Shield className="h-3 w-3 text-accent shrink-0" />
                  <span>All moderation actions are logged with actor, timestamp, and rationale for audit compliance.</span>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-2 flex items-center gap-2 safe-area-bottom">
        {[
          { tab: 'queue', icon: Layers, label: 'Queue' },
          { tab: 'messages', icon: MessageSquare, label: 'Messages' },
          { tab: 'offenders', icon: Repeat, label: 'Offenders' },
          { tab: 'appeals', icon: Scale, label: 'Appeals' },
        ].map(n => (
          <button key={n.tab} onClick={() => setActiveTab(n.tab)} className={cn('flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg', activeTab === n.tab ? 'text-accent' : 'text-muted-foreground')}>
            <n.icon className="h-4 w-4" /><span className="text-[7px]">{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModeratorDashboardPage;
