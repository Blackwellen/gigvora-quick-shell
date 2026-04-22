import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Megaphone, AlertTriangle, Search, Clock, Eye, RefreshCw, FileText,
  Radio, ChevronRight, Smartphone, Ban, Shield, Layers, History,
  CheckCircle2, XCircle, BarChart3, Gavel, Globe, Image, MapPin,
  DollarSign, Tag, TrendingUp, Users, AlertOctagon, Activity,
  Filter, Hash, Lock, Target, Zap, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

type CampaignStatus = 'pending-review' | 'approved' | 'rejected' | 'paused' | 'flagged' | 'archived';
type PolicySeverity = 'critical' | 'high' | 'medium' | 'low';

interface AdCampaign {
  id: string; advertiser: string; advertiserAvatar: string;
  title: string; status: CampaignStatus; severity: PolicySeverity;
  spend: string; impressions: string; ctr: string;
  policyFlags: string[]; geoTargets: string[]; keywords: string[];
  blockedKeywords: string[]; creativeType: string;
  created: string; reviewer: string | null; decisionNote: string | null;
}

const CAMPAIGNS: AdCampaign[] = [
  { id: 'AD-8001', advertiser: 'QuickLoans Pro', advertiserAvatar: 'QL', title: 'Fast Cash Advance — No Credit Check', status: 'pending-review', severity: 'critical', spend: '$4,200', impressions: '—', ctr: '—', policyFlags: ['FINANCIAL_CLAIMS', 'MISLEADING_COPY'], geoTargets: ['US', 'CA', 'UK'], keywords: ['quick loan', 'no credit check', 'fast cash'], blockedKeywords: ['guaranteed approval'], creativeType: 'banner', created: '25m ago', reviewer: null, decisionNote: null },
  { id: 'AD-8002', advertiser: 'HealthBoost Labs', advertiserAvatar: 'HB', title: 'Lose 30lbs in 30 Days — Guaranteed', status: 'pending-review', severity: 'high', spend: '$1,800', impressions: '—', ctr: '—', policyFlags: ['HEALTH_CLAIMS', 'UNSUBSTANTIATED'], geoTargets: ['US'], keywords: ['weight loss', 'diet pills'], blockedKeywords: ['miracle', 'guaranteed results'], creativeType: 'video', created: '1h ago', reviewer: null, decisionNote: null },
  { id: 'AD-8003', advertiser: 'TechHire Global', advertiserAvatar: 'TH', title: 'Senior Engineers — Remote $200K+', status: 'approved', severity: 'low', spend: '$12,400', impressions: '284K', ctr: '2.1%', policyFlags: [], geoTargets: ['US', 'EU', 'APAC'], keywords: ['software engineer', 'remote jobs'], blockedKeywords: [], creativeType: 'banner', created: '3d ago', reviewer: 'J.Martinez', decisionNote: 'Clean campaign, no policy violations.' },
  { id: 'AD-8004', advertiser: 'CryptoVault Exchange', advertiserAvatar: 'CV', title: 'Trade Crypto — 100x Leverage Available', status: 'rejected', severity: 'critical', spend: '$0', impressions: '0', ctr: '—', policyFlags: ['CRYPTO_PROMOTION', 'HIGH_RISK_FINANCIAL', 'RESTRICTED_GEO'], geoTargets: ['US', 'UK', 'EU'], keywords: ['crypto trading', 'leverage', 'bitcoin'], blockedKeywords: ['guaranteed returns', '100x'], creativeType: 'banner', created: '2d ago', reviewer: 'A.Chen', decisionNote: 'Rejected: Crypto leverage ads prohibited in target geos.' },
  { id: 'AD-8005', advertiser: 'GreenEnergy Co', advertiserAvatar: 'GE', title: 'Solar Panels — Save 40% on Energy Bills', status: 'approved', severity: 'low', spend: '$8,900', impressions: '192K', ctr: '1.8%', policyFlags: [], geoTargets: ['US', 'AU'], keywords: ['solar panels', 'green energy'], blockedKeywords: [], creativeType: 'carousel', created: '5d ago', reviewer: 'K.Wong', decisionNote: 'Approved with minor copy adjustment.' },
  { id: 'AD-8006', advertiser: 'NightLife VIP', advertiserAvatar: 'NL', title: 'Exclusive Dating — Premium Members Only', status: 'flagged', severity: 'medium', spend: '$3,100', impressions: '67K', ctr: '3.4%', policyFlags: ['ADULT_CONTENT_RISK', 'AGE_GATE_MISSING'], geoTargets: ['US', 'UK'], keywords: ['dating', 'premium dating'], blockedKeywords: [], creativeType: 'banner', created: '1d ago', reviewer: null, decisionNote: null },
  { id: 'AD-8007', advertiser: 'EduPlatform Inc', advertiserAvatar: 'EP', title: 'Online MBA — Accredited & Affordable', status: 'paused', severity: 'medium', spend: '$6,200', impressions: '145K', ctr: '1.5%', policyFlags: ['ACCREDITATION_VERIFY'], geoTargets: ['US', 'IN', 'NG'], keywords: ['online mba', 'education'], blockedKeywords: [], creativeType: 'video', created: '7d ago', reviewer: 'R.Patel', decisionNote: 'Paused: Awaiting accreditation verification documents.' },
  { id: 'AD-8008', advertiser: 'PharmaDirect', advertiserAvatar: 'PD', title: 'Buy Prescription Meds Online', status: 'rejected', severity: 'critical', spend: '$0', impressions: '0', ctr: '—', policyFlags: ['PHARMA_PROHIBITED', 'UNLICENSED_VENDOR'], geoTargets: ['US', 'CA'], keywords: ['buy medicine online', 'prescription'], blockedKeywords: ['no prescription needed'], creativeType: 'banner', created: '4d ago', reviewer: 'M.Garcia', decisionNote: 'Rejected: Unlicensed pharmaceutical vendor. Referred to legal.' },
];

const SPEND_TREND = [
  { day: 'Mon', spend: 14200, rejected: 2100, flagged: 800 },
  { day: 'Tue', spend: 16800, rejected: 3400, flagged: 1200 },
  { day: 'Wed', spend: 12400, rejected: 1800, flagged: 600 },
  { day: 'Thu', spend: 18900, rejected: 4200, flagged: 1500 },
  { day: 'Fri', spend: 15600, rejected: 2800, flagged: 900 },
  { day: 'Sat', spend: 8200, rejected: 1100, flagged: 400 },
  { day: 'Sun', spend: 6400, rejected: 800, flagged: 300 },
];

const KEYWORD_BLOCKS = [
  { keyword: 'guaranteed approval', hits: 34, category: 'Financial Claims' },
  { keyword: 'miracle cure', hits: 22, category: 'Health Claims' },
  { keyword: 'no prescription', hits: 18, category: 'Pharma' },
  { keyword: '100x leverage', hits: 15, category: 'Crypto/Finance' },
  { keyword: 'guaranteed returns', hits: 12, category: 'Financial Claims' },
  { keyword: 'act now limited', hits: 9, category: 'Urgency Spam' },
];

const GEO_POLICIES = [
  { region: 'United States', restrictions: ['Crypto leverage ads prohibited', 'Pharma requires FDA license', 'Financial claims need disclaimers'], riskLevel: 'high' as PolicySeverity },
  { region: 'European Union', restrictions: ['GDPR consent required', 'Crypto ads restricted', 'Political ads require transparency'], riskLevel: 'high' as PolicySeverity },
  { region: 'United Kingdom', restrictions: ['FCA compliance for financial ads', 'Age-gating for alcohol/gambling'], riskLevel: 'medium' as PolicySeverity },
  { region: 'Australia', restrictions: ['ACCC truth in advertising', 'Gambling ad restrictions'], riskLevel: 'medium' as PolicySeverity },
  { region: 'India', restrictions: ['Crypto ads banned', 'Tobacco/alcohol restricted'], riskLevel: 'medium' as PolicySeverity },
];

const sevColor = (s: PolicySeverity) => s === 'critical' ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]' : s === 'high' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : s === 'medium' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground';
const statusColor = (s: CampaignStatus) => s === 'pending-review' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : s === 'approved' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : s === 'rejected' ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]' : s === 'paused' ? 'bg-muted text-muted-foreground' : s === 'flagged' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground';

const AdsOpsDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('queue');
  const [selected, setSelected] = useState<AdCampaign | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [search, setSearch] = useState('');

  const open = (c: AdCampaign) => { setSelected(c); setDrawer(true); };

  const filtered = CAMPAIGNS.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && c.severity !== filterSeverity) return false;
    if (search && !c.id.toLowerCase().includes(search.toLowerCase()) && !c.advertiser.toLowerCase().includes(search.toLowerCase()) && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-2 px-4 py-1 text-[8px] font-mono border-b bg-accent/5 text-accent">
        <Radio className="h-2.5 w-2.5 animate-pulse" /><span className="uppercase font-bold">Production</span><span className="text-muted-foreground">·</span><span className="text-muted-foreground">Ads Ops Console v2.4</span>
        <div className="flex-1" />
        <Badge variant="secondary" className="text-[6px] gap-0.5"><Megaphone className="h-2 w-2" />Ads Ops</Badge>
        <Badge variant="secondary" className="text-[6px] gap-0.5"><Clock className="h-2 w-2" />Session: 3h 12m</Badge>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center"><Megaphone className="h-5 w-5 text-accent" /></div>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Ads Operations Dashboard</h1>
            <p className="text-[9px] text-muted-foreground">Policy review, geo/keyword moderation, campaign controls, and billing anomalies</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Link to="/admin/trust-safety"><Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Shield className="h-3 w-3" />T&S</Button></Link>
            <Link to="/admin/moderator-dashboard"><Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Shield className="h-3 w-3" />Moderation</Button></Link>
            <Link to="/admin/finance-dashboard"><Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><BarChart3 className="h-3 w-3" />Finance</Button></Link>
          </div>
        </div>

        {/* KPI Band */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
          {[
            { label: 'Pending Review', value: '6', delta: '2 critical', icon: Layers, state: 'blocked' },
            { label: 'Flagged Campaigns', value: '3', delta: '1 geo-restricted', icon: AlertTriangle, state: 'caution' },
            { label: 'Active Campaigns', value: '142', delta: '↑ 8% WoW', icon: Activity, state: 'healthy' },
            { label: 'Total Spend (7d)', value: '$92.5K', delta: '$13.2K rejected', icon: DollarSign, state: 'caution' },
            { label: 'Blocked Keywords', value: '47', delta: '6 new this week', icon: Ban, state: 'blocked' },
            { label: 'Policy Violations', value: '12', delta: '3 critical', icon: AlertOctagon, state: 'blocked' },
          ].map(k => (
            <div key={k.label} className="rounded-2xl border bg-card p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-1 text-[8px] text-muted-foreground mb-1"><k.icon className="h-3 w-3" />{k.label}</div>
              <div className="text-lg font-bold">{k.value}</div>
              <div className={cn('text-[8px]', k.state === 'healthy' ? 'text-[hsl(var(--state-healthy))]' : k.state === 'blocked' ? 'text-[hsl(var(--state-blocked))]' : 'text-[hsl(var(--gigvora-amber))]')}>{k.delta}</div>
            </div>
          ))}
        </div>

        {CAMPAIGNS.some(c => c.severity === 'critical' && c.status === 'pending-review') && (
          <div className="rounded-xl border border-[hsl(var(--state-blocked))]/30 bg-[hsl(var(--state-blocked))]/5 p-3 flex items-center gap-2 text-[8px] mb-4">
            <AlertOctagon className="h-4 w-4 text-[hsl(var(--state-blocked))] shrink-0 animate-pulse" />
            <div className="flex-1"><strong>{CAMPAIGNS.filter(c => c.severity === 'critical' && c.status === 'pending-review').length} critical campaigns require policy review</strong> — includes prohibited financial and pharmaceutical content</div>
            <Button variant="outline" size="sm" className="h-6 text-[7px] rounded-lg" onClick={() => { setFilterSeverity('critical'); setActiveTab('queue'); }}>View Critical</Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="queue" className="text-[9px] gap-1"><Layers className="h-3 w-3" />Campaign Queue</TabsTrigger>
            <TabsTrigger value="creative" className="text-[9px] gap-1"><Image className="h-3 w-3" />Creative Inspection</TabsTrigger>
            <TabsTrigger value="keywords" className="text-[9px] gap-1"><Hash className="h-3 w-3" />Keyword Moderation</TabsTrigger>
            <TabsTrigger value="geo" className="text-[9px] gap-1"><Globe className="h-3 w-3" />Geo/Policy</TabsTrigger>
            <TabsTrigger value="billing" className="text-[9px] gap-1"><DollarSign className="h-3 w-3" />Billing Anomalies</TabsTrigger>
            <TabsTrigger value="templates" className="text-[9px] gap-1"><FileText className="h-3 w-3" />Decision Templates</TabsTrigger>
            <TabsTrigger value="audit" className="text-[9px] gap-1"><History className="h-3 w-3" />Audit History</TabsTrigger>
            <TabsTrigger value="mobile" className="text-[9px] gap-1"><Smartphone className="h-3 w-3" />Mobile</TabsTrigger>
          </TabsList>

          {/* CAMPAIGN REVIEW QUEUE */}
          <TabsContent value="queue">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns, advertisers..." className="pl-8 h-8 text-[9px] rounded-xl" />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-8 px-2 text-[9px] rounded-xl border bg-card">
                <option value="all">All Status</option><option value="pending-review">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="paused">Paused</option><option value="flagged">Flagged</option>
              </select>
              <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="h-8 px-2 text-[9px] rounded-xl border bg-card">
                <option value="all">All Severity</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
              <Button variant="ghost" size="sm" className="h-8 text-[8px] rounded-xl gap-1" onClick={() => { setFilterStatus('all'); setFilterSeverity('all'); setSearch(''); }}><RefreshCw className="h-2.5 w-2.5" />Reset</Button>
            </div>
            <div className="rounded-2xl border bg-card overflow-hidden">
              <table className="w-full text-[9px]">
                <thead><tr className="border-b bg-muted/20">
                  <th className="px-3 py-2 text-left font-semibold">Campaign</th>
                  <th className="px-2 py-2 text-left font-semibold">Advertiser</th>
                  <th className="px-2 py-2 text-left font-semibold">Flags</th>
                  <th className="px-2 py-2 text-left font-semibold">Geo</th>
                  <th className="px-2 py-2 text-left font-semibold">Severity</th>
                  <th className="px-2 py-2 text-left font-semibold">Status</th>
                  <th className="px-2 py-2 text-left font-semibold">Spend</th>
                  <th className="px-2 py-2 text-left font-semibold">Actions</th>
                </tr></thead>
                <tbody className="divide-y">
                  {filtered.map(c => (
                    <tr key={c.id} onClick={() => open(c)} className={cn('hover:bg-muted/10 cursor-pointer transition-colors', c.severity === 'critical' && c.status === 'pending-review' && 'bg-[hsl(var(--state-blocked))]/[0.02]')}>
                      <td className="px-3 py-2"><div className="font-mono font-semibold">{c.id}</div><div className="text-[7px] text-muted-foreground truncate max-w-[160px]">{c.title}</div></td>
                      <td className="px-2 py-2"><div className="flex items-center gap-1"><div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[5px] font-bold">{c.advertiserAvatar}</div><span>{c.advertiser}</span></div></td>
                      <td className="px-2 py-2"><div className="flex flex-wrap gap-0.5">{c.policyFlags.length > 0 ? c.policyFlags.slice(0, 2).map(f => <Badge key={f} variant="secondary" className="text-[5px] bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]">{f}</Badge>) : <span className="text-[7px] text-muted-foreground">Clean</span>}</div></td>
                      <td className="px-2 py-2"><span className="text-[7px]">{c.geoTargets.slice(0, 2).join(', ')}{c.geoTargets.length > 2 ? ` +${c.geoTargets.length - 2}` : ''}</span></td>
                      <td className="px-2 py-2"><Badge variant="secondary" className={cn('text-[6px]', sevColor(c.severity))}>{c.severity}</Badge></td>
                      <td className="px-2 py-2"><Badge variant="secondary" className={cn('text-[6px]', statusColor(c.status))}>{c.status}</Badge></td>
                      <td className="px-2 py-2 font-mono">{c.spend}</td>
                      <td className="px-2 py-2"><Button size="sm" className="h-5 text-[6px] rounded-lg" onClick={e => { e.stopPropagation(); open(c); }}>Review</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* CREATIVE INSPECTION */}
          <TabsContent value="creative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {CAMPAIGNS.filter(c => c.status === 'pending-review' || c.status === 'flagged').map(c => (
                <button key={c.id} onClick={() => open(c)} className="rounded-2xl border bg-card p-4 text-left hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-16 w-24 rounded-xl bg-muted/30 border flex items-center justify-center">
                      <Image className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="font-mono font-bold text-[9px]">{c.id}</span>
                        <Badge variant="secondary" className={cn('text-[6px]', sevColor(c.severity))}>{c.severity}</Badge>
                        <Badge variant="secondary" className="text-[6px] bg-muted capitalize">{c.creativeType}</Badge>
                      </div>
                      <div className="text-[9px] font-semibold">{c.title}</div>
                      <div className="text-[7px] text-muted-foreground">{c.advertiser}</div>
                    </div>
                  </div>
                  {c.policyFlags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {c.policyFlags.map(f => <Badge key={f} variant="secondary" className="text-[6px] bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]">{f}</Badge>)}
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <Button size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Eye className="h-2.5 w-2.5" />Inspect</Button>
                    <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={e => { e.stopPropagation(); toast.success('Approved'); }}><CheckCircle2 className="h-2.5 w-2.5" />Approve</Button>
                    <Button size="sm" variant="outline" className="h-6 text-[7px] rounded-lg gap-0.5 text-[hsl(var(--state-blocked))]" onClick={e => { e.stopPropagation(); toast.info('Rejected'); }}><XCircle className="h-2.5 w-2.5" />Reject</Button>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* KEYWORD MODERATION */}
          <TabsContent value="keywords">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3 flex items-center gap-1"><Hash className="h-3 w-3 text-accent" />Blocked Keyword Registry</div>
                <div className="space-y-1.5">
                  {KEYWORD_BLOCKS.map(k => (
                    <div key={k.keyword} className="rounded-xl border p-2.5 flex items-center gap-2 text-[8px] hover:bg-muted/10 transition-colors">
                      <Ban className="h-3 w-3 text-[hsl(var(--state-blocked))] shrink-0" />
                      <span className="font-mono font-semibold flex-1">"{k.keyword}"</span>
                      <Badge variant="secondary" className="text-[6px] bg-muted">{k.category}</Badge>
                      <span className="text-muted-foreground">{k.hits} blocked</span>
                      <Button variant="ghost" size="sm" className="h-5 text-[6px] rounded-lg" onClick={() => toast.info(`Editing rule for "${k.keyword}"`)}><Eye className="h-2.5 w-2.5" /></Button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input placeholder="Add blocked keyword..." className="h-8 text-[9px] rounded-xl flex-1" />
                  <Button size="sm" className="h-8 text-[8px] rounded-xl gap-1"><Tag className="h-3 w-3" />Add Rule</Button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border bg-card p-3">
                  <div className="text-[9px] font-semibold mb-2">Category Summary</div>
                  {['Financial Claims', 'Health Claims', 'Pharma', 'Crypto/Finance', 'Urgency Spam'].map(cat => {
                    const count = KEYWORD_BLOCKS.filter(k => k.category === cat).reduce((a, b) => a + b.hits, 0);
                    return (
                      <div key={cat} className="flex items-center gap-2 py-1 text-[8px]">
                        <span className="flex-1">{cat}</span>
                        <span className="font-bold">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* GEO/POLICY */}
          <TabsContent value="geo">
            <div className="rounded-2xl border bg-card p-4">
              <div className="text-[9px] font-semibold mb-3 flex items-center gap-1"><Globe className="h-3 w-3 text-accent" />Geo-Policy Overlays</div>
              <div className="space-y-2">
                {GEO_POLICIES.map(g => (
                  <div key={g.region} className="rounded-xl border p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[9px] font-semibold">{g.region}</span>
                      <Badge variant="secondary" className={cn('text-[6px] ml-auto', sevColor(g.riskLevel))}>{g.riskLevel} risk</Badge>
                    </div>
                    <div className="space-y-1">
                      {g.restrictions.map(r => (
                        <div key={r} className="flex items-center gap-1.5 text-[8px] text-muted-foreground">
                          <div className="h-1 w-1 rounded-full bg-accent shrink-0" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* BILLING ANOMALIES */}
          <TabsContent value="billing">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3">7-Day Ad Spend vs Rejected/Flagged</div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={SPEND_TREND}>
                      <XAxis dataKey="day" tick={{ fontSize: 8 }} />
                      <YAxis tick={{ fontSize: 8 }} />
                      <Tooltip contentStyle={{ fontSize: 9 }} />
                      <Area type="monotone" dataKey="spend" fill="hsl(var(--primary))" stroke="hsl(var(--primary))" fillOpacity={0.2} name="Total Spend" />
                      <Area type="monotone" dataKey="rejected" fill="hsl(var(--state-blocked))" stroke="hsl(var(--state-blocked))" fillOpacity={0.3} name="Rejected" />
                      <Area type="monotone" dataKey="flagged" fill="hsl(var(--gigvora-amber))" stroke="hsl(var(--gigvora-amber))" fillOpacity={0.3} name="Flagged" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border bg-card p-3">
                  <div className="text-[9px] font-semibold mb-2">Anomaly Alerts</div>
                  <div className="space-y-1.5">
                    {[
                      { alert: 'Spend spike: QuickLoans Pro +340%', severity: 'critical' as PolicySeverity },
                      { alert: 'Chargeback rate above threshold', severity: 'high' as PolicySeverity },
                      { alert: 'New advertiser rapid spend ramp', severity: 'medium' as PolicySeverity },
                    ].map(a => (
                      <div key={a.alert} className="rounded-xl border p-2 flex items-center gap-2 text-[8px]">
                        <Badge variant="secondary" className={cn('text-[5px] w-14 justify-center', sevColor(a.severity))}>{a.severity}</Badge>
                        <span className="flex-1">{a.alert}</span>
                        <Button variant="ghost" size="sm" className="h-5 text-[6px] rounded-lg"><Eye className="h-2.5 w-2.5" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border bg-card p-3">
                  <div className="text-[9px] font-semibold mb-2">Cross-Domain</div>
                  <div className="flex flex-wrap gap-1">
                    <Link to="/admin/finance-dashboard"><Badge variant="outline" className="text-[7px] gap-0.5 cursor-pointer hover:bg-muted/20"><DollarSign className="h-2.5 w-2.5" />Finance</Badge></Link>
                    <Link to="/admin/trust-safety"><Badge variant="outline" className="text-[7px] gap-0.5 cursor-pointer hover:bg-muted/20"><Shield className="h-2.5 w-2.5" />T&S</Badge></Link>
                    <Link to="/admin/dispute-ops"><Badge variant="outline" className="text-[7px] gap-0.5 cursor-pointer hover:bg-muted/20"><Gavel className="h-2.5 w-2.5" />Disputes</Badge></Link>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* DECISION TEMPLATES */}
          <TabsContent value="templates">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                { name: 'Approve — Clean Campaign', desc: 'No policy violations detected. Campaign approved for all target geos.', action: 'approve', severity: 'low' as PolicySeverity },
                { name: 'Approve with Conditions', desc: 'Campaign approved with required disclaimer additions or geo restrictions.', action: 'conditional', severity: 'medium' as PolicySeverity },
                { name: 'Reject — Policy Violation', desc: 'Campaign violates platform ad policy. Advertiser notified with violation details.', action: 'reject', severity: 'high' as PolicySeverity },
                { name: 'Reject — Prohibited Content', desc: 'Campaign contains prohibited content category. Escalated to legal/compliance.', action: 'reject-escalate', severity: 'critical' as PolicySeverity },
                { name: 'Pause — Verification Required', desc: 'Campaign paused pending verification of claims, licenses, or certifications.', action: 'pause', severity: 'medium' as PolicySeverity },
                { name: 'Flag — Geo Restriction', desc: 'Campaign approved for some geos but restricted in others due to regional policy.', action: 'flag-geo', severity: 'medium' as PolicySeverity },
              ].map(t => (
                <div key={t.name} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className={cn('text-[6px]', sevColor(t.severity))}>{t.severity}</Badge>
                    <span className="text-[9px] font-semibold">{t.name}</span>
                  </div>
                  <div className="text-[8px] text-muted-foreground mb-3">{t.desc}</div>
                  <Button size="sm" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => toast.info(`Template "${t.name}" applied`)}><FileText className="h-2.5 w-2.5" />Apply Template</Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* AUDIT HISTORY */}
          <TabsContent value="audit">
            <div className="rounded-2xl border bg-card p-4">
              <div className="text-[9px] font-semibold mb-3 flex items-center gap-1"><History className="h-3 w-3 text-primary" />Audit History</div>
              <div className="space-y-1.5">
                {[
                  { id: 'AUD-601', campaign: 'AD-8004', action: 'Rejected — crypto leverage prohibited', actor: 'A.Chen', time: '2d ago' },
                  { id: 'AUD-602', campaign: 'AD-8003', action: 'Approved — clean campaign', actor: 'J.Martinez', time: '3d ago' },
                  { id: 'AUD-603', campaign: 'AD-8008', action: 'Rejected — unlicensed pharma, referred to legal', actor: 'M.Garcia', time: '4d ago' },
                  { id: 'AUD-604', campaign: 'AD-8005', action: 'Approved with minor copy edit', actor: 'K.Wong', time: '5d ago' },
                  { id: 'AUD-605', campaign: 'AD-8007', action: 'Paused — accreditation verification pending', actor: 'R.Patel', time: '7d ago' },
                ].map(a => (
                  <div key={a.id} className="rounded-xl border p-3 flex items-center gap-3 text-[8px]">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[6px] font-bold shrink-0">{a.actor.charAt(0)}</div>
                    <div className="flex-1">
                      <div className="font-mono font-semibold">{a.id} → {a.campaign}</div>
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
              <div className="text-[9px] font-semibold mb-2 flex items-center gap-1"><Smartphone className="h-3 w-3 text-accent" />Mobile Reviewer Summary</div>
              <div className="text-[8px] text-muted-foreground mb-3">Critical and pending campaigns for on-the-go review. Full creative inspection requires desktop.</div>
              <div className="space-y-2">
                {CAMPAIGNS.filter(c => c.status === 'pending-review' || (c.status === 'flagged' && c.severity !== 'low')).map(c => (
                  <button key={c.id} onClick={() => open(c)} className="w-full rounded-xl border p-3 text-left hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <Megaphone className="h-3.5 w-3.5 text-accent" />
                      <span className="text-[9px] font-mono font-bold">{c.id}</span>
                      <Badge variant="secondary" className={cn('text-[6px]', sevColor(c.severity))}>{c.severity}</Badge>
                      <Badge variant="secondary" className={cn('text-[6px]', statusColor(c.status))}>{c.status}</Badge>
                    </div>
                    <div className="text-[8px] font-semibold">{c.title}</div>
                    <div className="text-[7px] text-muted-foreground">{c.advertiser} · {c.geoTargets.join(', ')}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-[hsl(var(--gigvora-amber))]/5 border-[hsl(var(--gigvora-amber))]/30 p-3 text-[8px] flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0" />
              <span>Creative inspection, keyword rule editing, and geo-policy changes require desktop access.</span>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Drawer */}
      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent className="w-[480px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Megaphone className="h-4 w-4 text-accent" />Campaign Review</SheetTitle></SheetHeader>
          {selected && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-mono font-bold">{selected.id}</span>
                <Badge variant="secondary" className={cn('text-[7px]', sevColor(selected.severity))}>{selected.severity}</Badge>
                <Badge variant="secondary" className={cn('text-[7px]', statusColor(selected.status))}>{selected.status}</Badge>
                <Badge variant="secondary" className="text-[7px] bg-muted capitalize">{selected.creativeType}</Badge>
              </div>

              <div className="rounded-xl border p-3">
                <div className="text-[9px] font-semibold mb-1">Campaign</div>
                <div className="text-sm font-bold">{selected.title}</div>
                <div className="text-[8px] text-muted-foreground mt-1">Advertiser: <strong className="text-foreground">{selected.advertiser}</strong></div>
              </div>

              <div className="h-20 rounded-xl bg-muted/20 border flex items-center justify-center">
                <Image className="h-8 w-8 text-muted-foreground" />
                <span className="text-[8px] text-muted-foreground ml-2">Creative preview — {selected.creativeType}</span>
              </div>

              {selected.policyFlags.length > 0 && (
                <div className="rounded-xl border border-[hsl(var(--state-blocked))]/20 bg-[hsl(var(--state-blocked))]/5 p-3">
                  <div className="text-[9px] font-semibold mb-1">Policy Violations</div>
                  <div className="flex flex-wrap gap-1">{selected.policyFlags.map(f => <Badge key={f} variant="secondary" className="text-[6px] bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]">{f}</Badge>)}</div>
                </div>
              )}

              <div className="rounded-xl border p-3">
                <div className="text-[9px] font-semibold mb-1">Targeting</div>
                <div className="space-y-1 text-[8px]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Geo</span><span className="font-bold">{selected.geoTargets.join(', ')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Keywords</span><span className="font-bold">{selected.keywords.join(', ')}</span></div>
                  {selected.blockedKeywords.length > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Blocked</span><span className="font-bold text-[hsl(var(--state-blocked))]">{selected.blockedKeywords.join(', ')}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">Spend</span><span className="font-bold">{selected.spend}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Impressions</span><span className="font-bold">{selected.impressions}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">CTR</span><span className="font-bold">{selected.ctr}</span></div>
                </div>
              </div>

              {selected.decisionNote && (
                <div className="rounded-xl border p-3">
                  <div className="text-[9px] font-semibold mb-1">Decision Note</div>
                  <div className="text-[8px] text-muted-foreground">{selected.decisionNote}</div>
                  {selected.reviewer && <div className="text-[7px] text-muted-foreground mt-1">Reviewer: <strong>{selected.reviewer}</strong></div>}
                </div>
              )}

              <div className="rounded-xl border p-3">
                <div className="text-[9px] font-semibold mb-2">Audit Trail</div>
                <div className="space-y-1.5 text-[7px]">
                  {[
                    { action: 'Campaign submitted', actor: selected.advertiser, time: selected.created },
                    { action: 'ML policy scan completed', actor: 'PolicyEngine', time: 'Auto' },
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
                <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.success('Campaign approved')}><CheckCircle2 className="h-3 w-3" />Approve</Button>
                <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1 text-[hsl(var(--state-blocked))]" onClick={() => toast.info('Campaign rejected')}><XCircle className="h-3 w-3" />Reject</Button>
                <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Campaign paused')}><Lock className="h-3 w-3" />Pause</Button>
                <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Flagged for review')}><AlertTriangle className="h-3 w-3" />Flag</Button>
                <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Escalating')}><Zap className="h-3 w-3" />Escalate</Button>
                <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Note added')}><FileText className="h-3 w-3" />Add Note</Button>
              </div>

              <div className="flex gap-1.5 flex-wrap">
                <Link to="/admin/trust-safety"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Shield className="h-2.5 w-2.5" />T&S</Button></Link>
                <Link to="/admin/finance-dashboard"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><DollarSign className="h-2.5 w-2.5" />Finance</Button></Link>
                <Link to="/admin/moderator-dashboard"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Shield className="h-2.5 w-2.5" />Moderation</Button></Link>
              </div>

              <div className="rounded-lg border border-accent/20 bg-accent/5 p-2 text-[8px] flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-accent shrink-0" />
                <span>All ad review decisions are logged with actor, timestamp, and policy rationale for compliance audit.</span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-2 flex items-center gap-2 safe-area-bottom">
        {[
          { tab: 'queue', icon: Layers, label: 'Queue' },
          { tab: 'keywords', icon: Hash, label: 'Keywords' },
          { tab: 'geo', icon: Globe, label: 'Geo' },
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

export default AdsOpsDashboardPage;
