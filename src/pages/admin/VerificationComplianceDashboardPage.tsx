import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  ShieldCheck, AlertTriangle, Search, Clock, Eye, RefreshCw, FileText,
  Radio, Smartphone, CheckCircle2, XCircle, History, Users, UserCheck,
  Building2, CreditCard, Globe, Lock, Zap, Activity, Filter, Fingerprint,
  Scale, AlertOctagon, Shield, BarChart3, DollarSign, Gavel, Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

type VerifStatus = 'pending' | 'in-review' | 'approved' | 'rejected' | 'escalated' | 'expired' | 'suspended';
type VerifType = 'identity' | 'business' | 'agency' | 'payout' | 'advertiser' | 'compliance';
type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

interface VerifCase {
  id: string; entity: string; entityAvatar: string; type: VerifType;
  status: VerifStatus; risk: RiskLevel; submittedAt: string;
  documents: string[]; country: string; reviewer: string | null;
  notes: string | null; flags: string[]; expiresAt: string | null;
}

const CASES: VerifCase[] = [
  { id: 'VRF-4001', entity: 'Marcus Chen', entityAvatar: 'MC', type: 'identity', status: 'pending', risk: 'high', submittedAt: '18m ago', documents: ['Passport', 'Selfie'], country: 'US', reviewer: null, notes: null, flags: ['DOCUMENT_MISMATCH', 'ML_FLAG_FACE'], expiresAt: null },
  { id: 'VRF-4002', entity: 'TechBridge Solutions Ltd', entityAvatar: 'TB', type: 'business', status: 'in-review', risk: 'medium', submittedAt: '2h ago', documents: ['Articles of Inc.', 'Tax ID', 'Utility Bill'], country: 'UK', reviewer: 'J.Martinez', notes: 'Verifying registered address with Companies House.', flags: ['ADDRESS_DISCREPANCY'], expiresAt: null },
  { id: 'VRF-4003', entity: 'Apex Talent Agency', entityAvatar: 'AT', type: 'agency', status: 'pending', risk: 'critical', submittedAt: '45m ago', documents: ['Business License', 'Director IDs', 'Client Contracts'], country: 'AE', reviewer: null, notes: null, flags: ['HIGH_RISK_JURISDICTION', 'SHELL_COMPANY_INDICATOR'], expiresAt: null },
  { id: 'VRF-4004', entity: 'Sarah Williams', entityAvatar: 'SW', type: 'payout', status: 'approved', risk: 'low', submittedAt: '3d ago', documents: ['Bank Statement', 'ID'], country: 'CA', reviewer: 'K.Wong', notes: 'All clear. Bank details verified.', flags: [], expiresAt: '2026-10-13' },
  { id: 'VRF-4005', entity: 'AdVenture Media Group', entityAvatar: 'AV', type: 'advertiser', status: 'rejected', risk: 'critical', submittedAt: '1d ago', documents: ['Business Reg.', 'Ad Policy Ack.'], country: 'NG', reviewer: 'A.Chen', notes: 'Rejected: Fraudulent business registration. Referred to T&S.', flags: ['FRAUDULENT_DOCS', 'BLACKLISTED_ENTITY'], expiresAt: null },
  { id: 'VRF-4006', entity: 'GlobalFreight Corp', entityAvatar: 'GF', type: 'compliance', status: 'escalated', risk: 'high', submittedAt: '5h ago', documents: ['AML Policy', 'KYC Records', 'OFAC Screen'], country: 'DE', reviewer: 'R.Patel', notes: 'Escalated: Potential sanctions match requires legal review.', flags: ['SANCTIONS_MATCH', 'PEP_FLAG'], expiresAt: null },
  { id: 'VRF-4007', entity: 'Lisa Park', entityAvatar: 'LP', type: 'identity', status: 'expired', risk: 'medium', submittedAt: '30d ago', documents: ['Driver License'], country: 'US', reviewer: 'M.Garcia', notes: 'Expired: No response to re-verification request.', flags: ['EXPIRED_DOCUMENT'], expiresAt: '2026-03-13' },
  { id: 'VRF-4008', entity: 'QuickStaff Agency', entityAvatar: 'QS', type: 'agency', status: 'suspended', risk: 'critical', submittedAt: '7d ago', documents: ['Business License', 'Insurance'], country: 'IN', reviewer: 'A.Chen', notes: 'Suspended: Multiple fraud reports from placed workers.', flags: ['FRAUD_REPORTS', 'WORKER_COMPLAINTS'], expiresAt: null },
];

const TREND_DATA = [
  { day: 'Mon', submitted: 24, approved: 18, rejected: 4, escalated: 2 },
  { day: 'Tue', submitted: 31, approved: 22, rejected: 6, escalated: 3 },
  { day: 'Wed', submitted: 28, approved: 20, rejected: 5, escalated: 3 },
  { day: 'Thu', submitted: 35, approved: 25, rejected: 7, escalated: 3 },
  { day: 'Fri', submitted: 22, approved: 16, rejected: 4, escalated: 2 },
  { day: 'Sat', submitted: 12, approved: 8, rejected: 2, escalated: 2 },
  { day: 'Sun', submitted: 9, approved: 6, rejected: 1, escalated: 2 },
];

const TYPE_DIST = [
  { type: 'Identity', count: 45 }, { type: 'Business', count: 28 }, { type: 'Agency', count: 15 },
  { type: 'Payout', count: 32 }, { type: 'Advertiser', count: 18 }, { type: 'Compliance', count: 8 },
];

const riskColor = (r: RiskLevel) => r === 'critical' ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]' : r === 'high' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : r === 'medium' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground';
const statusColor = (s: VerifStatus) => s === 'approved' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : s === 'rejected' || s === 'suspended' ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]' : s === 'escalated' ? 'bg-accent/10 text-accent' : s === 'expired' ? 'bg-muted text-muted-foreground' : 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]';
const typeIcon = (t: VerifType) => t === 'identity' ? Fingerprint : t === 'business' ? Building2 : t === 'agency' ? Users : t === 'payout' ? CreditCard : t === 'advertiser' ? Globe : Scale;

const VerificationComplianceDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('queue');
  const [selected, setSelected] = useState<VerifCase | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [search, setSearch] = useState('');

  const open = (c: VerifCase) => { setSelected(c); setDrawer(true); };

  const filtered = CASES.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterType !== 'all' && c.type !== filterType) return false;
    if (filterRisk !== 'all' && c.risk !== filterRisk) return false;
    if (search && !c.id.toLowerCase().includes(search.toLowerCase()) && !c.entity.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-2 px-4 py-1 text-[8px] font-mono border-b bg-accent/5 text-accent">
        <Radio className="h-2.5 w-2.5 animate-pulse" /><span className="uppercase font-bold">Production</span><span className="text-muted-foreground">·</span><span className="text-muted-foreground">Verification & Compliance Console v1.8</span>
        <div className="flex-1" />
        <Badge variant="secondary" className="text-[6px] gap-0.5"><ShieldCheck className="h-2 w-2" />Compliance Ops</Badge>
        <Badge variant="secondary" className="text-[6px] gap-0.5"><Clock className="h-2 w-2" />Session: 2h 44m</Badge>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-accent" /></div>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Verification & Compliance Dashboard</h1>
            <p className="text-[9px] text-muted-foreground">Identity, business, agency, payout, and advertiser verification · Policy review & exception tracking</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Link to="/admin/trust-safety"><Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Shield className="h-3 w-3" />T&S</Button></Link>
            <Link to="/admin/finance-dashboard"><Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><BarChart3 className="h-3 w-3" />Finance</Button></Link>
            <Link to="/admin/ads-ops"><Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Globe className="h-3 w-3" />Ads Ops</Button></Link>
          </div>
        </div>

        {/* KPI Band */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
          {[
            { label: 'Pending Review', value: '14', delta: '3 critical', icon: Clock, state: 'blocked' },
            { label: 'In Review', value: '8', delta: '2 escalated', icon: Eye, state: 'caution' },
            { label: 'Approved (7d)', value: '115', delta: '↑ 12% WoW', icon: CheckCircle2, state: 'healthy' },
            { label: 'Rejected (7d)', value: '29', delta: '18% rejection rate', icon: XCircle, state: 'blocked' },
            { label: 'Expiring Soon', value: '6', delta: 'Within 30 days', icon: AlertTriangle, state: 'caution' },
            { label: 'Suspended', value: '3', delta: '2 fraud-related', icon: Lock, state: 'blocked' },
          ].map(k => (
            <div key={k.label} className="rounded-2xl border bg-card p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-1 text-[8px] text-muted-foreground mb-1"><k.icon className="h-3 w-3" />{k.label}</div>
              <div className="text-lg font-bold">{k.value}</div>
              <div className={cn('text-[8px]', k.state === 'healthy' ? 'text-[hsl(var(--state-healthy))]' : k.state === 'blocked' ? 'text-[hsl(var(--state-blocked))]' : 'text-[hsl(var(--gigvora-amber))]')}>{k.delta}</div>
            </div>
          ))}
        </div>

        {CASES.some(c => c.risk === 'critical' && (c.status === 'pending' || c.status === 'escalated')) && (
          <div className="rounded-xl border border-[hsl(var(--state-blocked))]/30 bg-[hsl(var(--state-blocked))]/5 p-3 flex items-center gap-2 text-[8px] mb-4">
            <AlertOctagon className="h-4 w-4 text-[hsl(var(--state-blocked))] shrink-0 animate-pulse" />
            <div className="flex-1"><strong>{CASES.filter(c => c.risk === 'critical' && (c.status === 'pending' || c.status === 'escalated')).length} critical cases require immediate review</strong> — includes potential sanctions match and fraudulent documents</div>
            <Button variant="outline" size="sm" className="h-6 text-[7px] rounded-lg" onClick={() => { setFilterRisk('critical'); setActiveTab('queue'); }}>View Critical</Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="queue" className="text-[9px] gap-1"><UserCheck className="h-3 w-3" />Verification Queue</TabsTrigger>
            <TabsTrigger value="identity" className="text-[9px] gap-1"><Fingerprint className="h-3 w-3" />Identity Review</TabsTrigger>
            <TabsTrigger value="business" className="text-[9px] gap-1"><Building2 className="h-3 w-3" />Business/Agency</TabsTrigger>
            <TabsTrigger value="compliance" className="text-[9px] gap-1"><Scale className="h-3 w-3" />Compliance</TabsTrigger>
            <TabsTrigger value="exceptions" className="text-[9px] gap-1"><AlertTriangle className="h-3 w-3" />Exceptions</TabsTrigger>
            <TabsTrigger value="analytics" className="text-[9px] gap-1"><Activity className="h-3 w-3" />Analytics</TabsTrigger>
            <TabsTrigger value="audit" className="text-[9px] gap-1"><History className="h-3 w-3" />Audit Log</TabsTrigger>
            <TabsTrigger value="mobile" className="text-[9px] gap-1"><Smartphone className="h-3 w-3" />Mobile</TabsTrigger>
          </TabsList>

          {/* VERIFICATION QUEUE */}
          <TabsContent value="queue">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cases, entities..." className="pl-8 h-8 text-[9px] rounded-xl" />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-8 px-2 text-[9px] rounded-xl border bg-card">
                <option value="all">All Status</option><option value="pending">Pending</option><option value="in-review">In Review</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="escalated">Escalated</option><option value="expired">Expired</option><option value="suspended">Suspended</option>
              </select>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="h-8 px-2 text-[9px] rounded-xl border bg-card">
                <option value="all">All Types</option><option value="identity">Identity</option><option value="business">Business</option><option value="agency">Agency</option><option value="payout">Payout</option><option value="advertiser">Advertiser</option><option value="compliance">Compliance</option>
              </select>
              <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="h-8 px-2 text-[9px] rounded-xl border bg-card">
                <option value="all">All Risk</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
              <Button variant="ghost" size="sm" className="h-8 text-[8px] rounded-xl gap-1" onClick={() => { setFilterStatus('all'); setFilterType('all'); setFilterRisk('all'); setSearch(''); }}><RefreshCw className="h-2.5 w-2.5" />Reset</Button>
            </div>
            <div className="rounded-2xl border bg-card overflow-hidden">
              <table className="w-full text-[9px]">
                <thead><tr className="border-b bg-muted/20">
                  <th className="px-3 py-2 text-left font-semibold">Case</th>
                  <th className="px-2 py-2 text-left font-semibold">Entity</th>
                  <th className="px-2 py-2 text-left font-semibold">Type</th>
                  <th className="px-2 py-2 text-left font-semibold">Country</th>
                  <th className="px-2 py-2 text-left font-semibold">Flags</th>
                  <th className="px-2 py-2 text-left font-semibold">Risk</th>
                  <th className="px-2 py-2 text-left font-semibold">Status</th>
                  <th className="px-2 py-2 text-left font-semibold">Actions</th>
                </tr></thead>
                <tbody className="divide-y">
                  {filtered.map(c => {
                    const Icon = typeIcon(c.type);
                    return (
                      <tr key={c.id} onClick={() => open(c)} className={cn('hover:bg-muted/10 cursor-pointer transition-colors', c.risk === 'critical' && (c.status === 'pending' || c.status === 'escalated') && 'bg-[hsl(var(--state-blocked))]/[0.02]')}>
                        <td className="px-3 py-2"><div className="font-mono font-semibold">{c.id}</div><div className="text-[7px] text-muted-foreground">{c.submittedAt}</div></td>
                        <td className="px-2 py-2"><div className="flex items-center gap-1"><div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[5px] font-bold">{c.entityAvatar}</div><span className="truncate max-w-[120px]">{c.entity}</span></div></td>
                        <td className="px-2 py-2"><div className="flex items-center gap-1"><Icon className="h-3 w-3 text-muted-foreground" /><span className="capitalize">{c.type}</span></div></td>
                        <td className="px-2 py-2"><Badge variant="secondary" className="text-[6px] bg-muted">{c.country}</Badge></td>
                        <td className="px-2 py-2"><div className="flex flex-wrap gap-0.5">{c.flags.length > 0 ? c.flags.slice(0, 2).map(f => <Badge key={f} variant="secondary" className="text-[5px] bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]">{f}</Badge>) : <span className="text-[7px] text-muted-foreground">Clean</span>}</div></td>
                        <td className="px-2 py-2"><Badge variant="secondary" className={cn('text-[6px]', riskColor(c.risk))}>{c.risk}</Badge></td>
                        <td className="px-2 py-2"><Badge variant="secondary" className={cn('text-[6px]', statusColor(c.status))}>{c.status}</Badge></td>
                        <td className="px-2 py-2"><Button size="sm" className="h-5 text-[6px] rounded-lg" onClick={e => { e.stopPropagation(); open(c); }}>Review</Button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* IDENTITY REVIEW */}
          <TabsContent value="identity">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {CASES.filter(c => c.type === 'identity').map(c => (
                <button key={c.id} onClick={() => open(c)} className="rounded-2xl border bg-card p-4 text-left hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 rounded-full bg-muted/30 border flex items-center justify-center text-sm font-bold">{c.entityAvatar}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="font-mono font-bold text-[9px]">{c.id}</span>
                        <Badge variant="secondary" className={cn('text-[6px]', riskColor(c.risk))}>{c.risk}</Badge>
                        <Badge variant="secondary" className={cn('text-[6px]', statusColor(c.status))}>{c.status}</Badge>
                      </div>
                      <div className="text-[10px] font-semibold">{c.entity}</div>
                      <div className="text-[7px] text-muted-foreground">{c.country} · Documents: {c.documents.join(', ')}</div>
                    </div>
                  </div>
                  {c.flags.length > 0 && <div className="flex flex-wrap gap-1 mb-2">{c.flags.map(f => <Badge key={f} variant="secondary" className="text-[6px] bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]">{f}</Badge>)}</div>}
                  <div className="flex gap-1.5">
                    <Button size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Eye className="h-2.5 w-2.5" />Review Docs</Button>
                    <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={e => { e.stopPropagation(); toast.success('Approved'); }}><CheckCircle2 className="h-2.5 w-2.5" />Approve</Button>
                    <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5 text-[hsl(var(--state-blocked))]" onClick={e => { e.stopPropagation(); toast.info('Rejected'); }}><XCircle className="h-2.5 w-2.5" />Reject</Button>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* BUSINESS/AGENCY */}
          <TabsContent value="business">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {CASES.filter(c => c.type === 'business' || c.type === 'agency' || c.type === 'advertiser').map(c => {
                const Icon = typeIcon(c.type);
                return (
                  <button key={c.id} onClick={() => open(c)} className="rounded-2xl border bg-card p-4 text-left hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-muted/30 border flex items-center justify-center"><Icon className="h-5 w-5 text-muted-foreground" /></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="font-mono font-bold text-[9px]">{c.id}</span>
                          <Badge variant="secondary" className={cn('text-[6px]', riskColor(c.risk))}>{c.risk}</Badge>
                          <Badge variant="secondary" className={cn('text-[6px]', statusColor(c.status))}>{c.status}</Badge>
                          <Badge variant="secondary" className="text-[6px] bg-muted capitalize">{c.type}</Badge>
                        </div>
                        <div className="text-[10px] font-semibold">{c.entity}</div>
                        <div className="text-[7px] text-muted-foreground">{c.country} · {c.documents.length} documents</div>
                      </div>
                    </div>
                    {c.flags.length > 0 && <div className="flex flex-wrap gap-1 mb-2">{c.flags.map(f => <Badge key={f} variant="secondary" className="text-[6px] bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]">{f}</Badge>)}</div>}
                    {c.notes && <div className="text-[7px] text-muted-foreground mb-2 italic">"{c.notes}"</div>}
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Eye className="h-2.5 w-2.5" />Inspect</Button>
                      {c.status !== 'approved' && c.status !== 'rejected' && <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={e => { e.stopPropagation(); toast.info('Escalated'); }}><Zap className="h-2.5 w-2.5" />Escalate</Button>}
                    </div>
                  </button>
                );
              })}
            </div>
          </TabsContent>

          {/* COMPLIANCE */}
          <TabsContent value="compliance">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-3">
                {CASES.filter(c => c.type === 'compliance' || c.flags.some(f => f.includes('SANCTIONS') || f.includes('PEP'))).map(c => (
                  <button key={c.id} onClick={() => open(c)} className="w-full rounded-2xl border bg-card p-4 text-left hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                      <Scale className="h-5 w-5 text-accent shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="font-mono font-bold text-[9px]">{c.id}</span>
                          <Badge variant="secondary" className={cn('text-[6px]', riskColor(c.risk))}>{c.risk}</Badge>
                          <Badge variant="secondary" className={cn('text-[6px]', statusColor(c.status))}>{c.status}</Badge>
                        </div>
                        <div className="text-[10px] font-semibold">{c.entity}</div>
                        <div className="flex flex-wrap gap-1 mt-1">{c.flags.map(f => <Badge key={f} variant="secondary" className="text-[6px] bg-accent/10 text-accent">{f}</Badge>)}</div>
                      </div>
                      <Button size="sm" className="h-7 text-[8px] rounded-lg" onClick={e => { e.stopPropagation(); open(c); }}>Review</Button>
                    </div>
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border bg-card p-3">
                  <div className="text-[9px] font-semibold mb-2">Compliance Checks</div>
                  {['AML/KYC Screening', 'OFAC Sanctions', 'PEP Screening', 'Adverse Media', 'Document Authenticity'].map(chk => (
                    <div key={chk} className="flex items-center gap-2 py-1.5 text-[8px] border-b last:border-0">
                      <ShieldCheck className="h-3 w-3 text-[hsl(var(--state-healthy))]" />
                      <span className="flex-1">{chk}</span>
                      <Badge variant="secondary" className="text-[6px] bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]">Active</Badge>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border bg-card p-3">
                  <div className="text-[9px] font-semibold mb-2">Policy Exceptions</div>
                  <div className="space-y-1.5">
                    {[
                      { policy: 'High-risk jurisdiction override', count: 3, status: 'active' },
                      { policy: 'Extended review period', count: 5, status: 'active' },
                      { policy: 'Manual doc verification waiver', count: 1, status: 'expired' },
                    ].map(p => (
                      <div key={p.policy} className="rounded-xl border p-2 text-[8px]">
                        <div className="font-semibold">{p.policy}</div>
                        <div className="text-[7px] text-muted-foreground">{p.count} cases · {p.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* EXCEPTIONS */}
          <TabsContent value="exceptions">
            <div className="rounded-2xl border bg-card p-4">
              <div className="text-[9px] font-semibold mb-3 flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" />Exception Tracker</div>
              <div className="space-y-2">
                {[
                  { id: 'EXC-101', desc: 'Expired identity re-verification — grace period extended', entity: 'Lisa Park', risk: 'medium' as RiskLevel, status: 'Active', approver: 'R.Patel', date: '5d ago' },
                  { id: 'EXC-102', desc: 'High-risk jurisdiction waiver for GlobalFreight Corp', entity: 'GlobalFreight Corp', risk: 'high' as RiskLevel, status: 'Under Legal Review', approver: 'Legal Team', date: '3d ago' },
                  { id: 'EXC-103', desc: 'Temporary payout without full KYC — capped at $500', entity: 'New Freelancer Pool', risk: 'medium' as RiskLevel, status: 'Active', approver: 'K.Wong', date: '7d ago' },
                  { id: 'EXC-104', desc: 'Business verification doc substitution allowed', entity: 'TechBridge Solutions', risk: 'low' as RiskLevel, status: 'Expired', approver: 'J.Martinez', date: '14d ago' },
                ].map(ex => (
                  <div key={ex.id} className="rounded-xl border p-3 flex items-center gap-3 text-[8px] hover:bg-muted/10 transition-colors">
                    <Badge variant="secondary" className={cn('text-[6px] w-16 justify-center', riskColor(ex.risk))}>{ex.risk}</Badge>
                    <div className="flex-1">
                      <div className="font-mono font-semibold">{ex.id}</div>
                      <div className="text-[7px]">{ex.desc}</div>
                      <div className="text-[7px] text-muted-foreground">Entity: {ex.entity} · Approved by: {ex.approver}</div>
                    </div>
                    <Badge variant="secondary" className="text-[6px] bg-muted">{ex.status}</Badge>
                    <span className="text-[7px] text-muted-foreground shrink-0">{ex.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ANALYTICS */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3">7-Day Verification Volume</div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={TREND_DATA}>
                      <XAxis dataKey="day" tick={{ fontSize: 8 }} />
                      <YAxis tick={{ fontSize: 8 }} />
                      <Tooltip contentStyle={{ fontSize: 9 }} />
                      <Area type="monotone" dataKey="submitted" fill="hsl(var(--primary))" stroke="hsl(var(--primary))" fillOpacity={0.15} name="Submitted" />
                      <Area type="monotone" dataKey="approved" fill="hsl(var(--state-healthy))" stroke="hsl(var(--state-healthy))" fillOpacity={0.2} name="Approved" />
                      <Area type="monotone" dataKey="rejected" fill="hsl(var(--state-blocked))" stroke="hsl(var(--state-blocked))" fillOpacity={0.2} name="Rejected" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3">By Type</div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={TYPE_DIST} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 8 }} />
                      <YAxis dataKey="type" type="category" tick={{ fontSize: 8 }} width={70} />
                      <Tooltip contentStyle={{ fontSize: 9 }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* AUDIT LOG */}
          <TabsContent value="audit">
            <div className="rounded-2xl border bg-card p-4">
              <div className="text-[9px] font-semibold mb-3 flex items-center gap-1"><History className="h-3 w-3 text-primary" />Audit History</div>
              <div className="space-y-1.5">
                {[
                  { id: 'AUD-901', case_id: 'VRF-4005', action: 'Rejected — fraudulent business registration, referred to T&S', actor: 'A.Chen', time: '1d ago' },
                  { id: 'AUD-902', case_id: 'VRF-4004', action: 'Approved — payout verification, bank details confirmed', actor: 'K.Wong', time: '3d ago' },
                  { id: 'AUD-903', case_id: 'VRF-4006', action: 'Escalated — potential sanctions match, legal review required', actor: 'R.Patel', time: '5h ago' },
                  { id: 'AUD-904', case_id: 'VRF-4008', action: 'Suspended — multiple fraud reports from workers', actor: 'A.Chen', time: '7d ago' },
                  { id: 'AUD-905', case_id: 'VRF-4007', action: 'Expired — no response to re-verification within 30 days', actor: 'System', time: '30d ago' },
                ].map(a => (
                  <div key={a.id} className="rounded-xl border p-3 flex items-center gap-3 text-[8px]">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[6px] font-bold shrink-0">{a.actor.charAt(0)}</div>
                    <div className="flex-1">
                      <div className="font-mono font-semibold">{a.id} → {a.case_id}</div>
                      <div className="text-[7px] text-muted-foreground">{a.action}</div>
                    </div>
                    <div className="text-right text-[7px] text-muted-foreground shrink-0">
                      <div className="font-semibold text-foreground">{a.actor}</div>
                      <div>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* MOBILE */}
          <TabsContent value="mobile">
            <div className="rounded-2xl border bg-card p-4 mb-3">
              <div className="text-[9px] font-semibold mb-2 flex items-center gap-1"><Smartphone className="h-3 w-3 text-accent" />Mobile Triage</div>
              <div className="text-[8px] text-muted-foreground mb-3">Critical and pending verification cases. Document inspection requires desktop.</div>
              <div className="space-y-2">
                {CASES.filter(c => c.status === 'pending' || c.status === 'escalated' || (c.risk === 'critical' && c.status !== 'approved')).map(c => {
                  const Icon = typeIcon(c.type);
                  return (
                    <button key={c.id} onClick={() => open(c)} className="w-full rounded-xl border p-3 text-left hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-3.5 w-3.5 text-accent" />
                        <span className="text-[9px] font-mono font-bold">{c.id}</span>
                        <Badge variant="secondary" className={cn('text-[6px]', riskColor(c.risk))}>{c.risk}</Badge>
                        <Badge variant="secondary" className={cn('text-[6px]', statusColor(c.status))}>{c.status}</Badge>
                      </div>
                      <div className="text-[8px] font-semibold">{c.entity}</div>
                      <div className="text-[7px] text-muted-foreground">{c.country} · {c.type} · {c.documents.length} docs</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="rounded-xl border bg-[hsl(var(--gigvora-amber))]/5 border-[hsl(var(--gigvora-amber))]/30 p-3 text-[8px] flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0" />
              <span>Document inspection, compliance checks, and exception management require desktop access.</span>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Drawer */}
      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent className="w-[480px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" />Verification Review</SheetTitle></SheetHeader>
          {selected && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-mono font-bold">{selected.id}</span>
                <Badge variant="secondary" className={cn('text-[7px]', riskColor(selected.risk))}>{selected.risk}</Badge>
                <Badge variant="secondary" className={cn('text-[7px]', statusColor(selected.status))}>{selected.status}</Badge>
                <Badge variant="secondary" className="text-[7px] bg-muted capitalize">{selected.type}</Badge>
              </div>

              <div className="rounded-xl border p-3">
                <div className="text-[9px] font-semibold mb-1">Entity</div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-[9px]">{selected.entityAvatar}</div>
                  <div>
                    <div className="text-sm font-bold">{selected.entity}</div>
                    <div className="text-[8px] text-muted-foreground">Country: {selected.country} · Submitted: {selected.submittedAt}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-3">
                <div className="text-[9px] font-semibold mb-2">Documents</div>
                <div className="space-y-1">
                  {selected.documents.map(d => (
                    <div key={d} className="flex items-center gap-2 text-[8px] py-1 border-b last:border-0">
                      <Upload className="h-3 w-3 text-muted-foreground" />
                      <span className="flex-1">{d}</span>
                      <Button variant="ghost" size="sm" className="h-5 text-[6px] rounded-lg"><Eye className="h-2.5 w-2.5" /></Button>
                    </div>
                  ))}
                </div>
              </div>

              {selected.flags.length > 0 && (
                <div className="rounded-xl border border-[hsl(var(--state-blocked))]/20 bg-[hsl(var(--state-blocked))]/5 p-3">
                  <div className="text-[9px] font-semibold mb-1">Risk Flags</div>
                  <div className="flex flex-wrap gap-1">{selected.flags.map(f => <Badge key={f} variant="secondary" className="text-[6px] bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]">{f}</Badge>)}</div>
                </div>
              )}

              {selected.notes && (
                <div className="rounded-xl border p-3">
                  <div className="text-[9px] font-semibold mb-1">Review Notes</div>
                  <div className="text-[8px] text-muted-foreground">{selected.notes}</div>
                  {selected.reviewer && <div className="text-[7px] text-muted-foreground mt-1">Reviewer: <strong>{selected.reviewer}</strong></div>}
                </div>
              )}

              {selected.expiresAt && (
                <div className="rounded-xl border p-3">
                  <div className="text-[9px] font-semibold mb-1">Expiry</div>
                  <div className="text-[8px]">{selected.expiresAt}</div>
                </div>
              )}

              <div className="rounded-xl border p-3">
                <div className="text-[9px] font-semibold mb-2">Audit Trail</div>
                <div className="space-y-1.5 text-[7px]">
                  {[
                    { action: 'Case submitted', actor: selected.entity, time: selected.submittedAt },
                    { action: 'ML document scan completed', actor: 'VerifyEngine', time: 'Auto' },
                    ...(selected.reviewer ? [{ action: `Reviewed by ${selected.reviewer}`, actor: selected.reviewer, time: 'After review' }] : []),
                  ].map((a, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                      <span>{a.action}</span>
                      <span className="text-muted-foreground ml-auto">{a.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.success('Approved')}><CheckCircle2 className="h-3 w-3" />Approve</Button>
                <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1 text-[hsl(var(--state-blocked))]" onClick={() => toast.info('Rejected')}><XCircle className="h-3 w-3" />Reject</Button>
                <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Escalated')}><Zap className="h-3 w-3" />Escalate</Button>
                <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Suspended')}><Lock className="h-3 w-3" />Suspend</Button>
                <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Re-verification requested')}><RefreshCw className="h-3 w-3" />Re-verify</Button>
                <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Note added')}><FileText className="h-3 w-3" />Add Note</Button>
              </div>

              <div className="flex gap-1.5 flex-wrap">
                <Link to="/admin/trust-safety"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Shield className="h-2.5 w-2.5" />T&S</Button></Link>
                <Link to="/admin/finance-dashboard"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><DollarSign className="h-2.5 w-2.5" />Finance</Button></Link>
                <Link to="/admin/dispute-ops"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Gavel className="h-2.5 w-2.5" />Disputes</Button></Link>
              </div>

              <div className="rounded-lg border border-accent/20 bg-accent/5 p-2 text-[8px] flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-accent shrink-0" />
                <span>All verification decisions are logged with actor, timestamp, and compliance rationale for regulatory audit.</span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-2 flex items-center gap-2 safe-area-bottom">
        {[
          { tab: 'queue', icon: UserCheck, label: 'Queue' },
          { tab: 'compliance', icon: Scale, label: 'Compliance' },
          { tab: 'exceptions', icon: AlertTriangle, label: 'Exceptions' },
          { tab: 'audit', icon: History, label: 'Audit' },
        ].map(n => (
          <button key={n.tab} onClick={() => setActiveTab(n.tab)} className={cn('flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg', activeTab === n.tab ? 'text-accent' : 'text-muted-foreground')}>
            <n.icon className="h-4 w-4" /><span className="text-[7px]">{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default VerificationComplianceDashboardPage;
