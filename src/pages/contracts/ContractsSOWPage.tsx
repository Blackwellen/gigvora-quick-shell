import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  FileText, PenTool, Shield, Clock, CheckCircle2, XCircle,
  AlertTriangle, DollarSign, Users, ExternalLink, Eye,
  Send, Briefcase, BarChart3, ArrowUpDown, Filter,
  ChevronRight, Lock, History, Sparkles, RefreshCw,
  MessageSquare, Scale, Award, Calendar, Download,
  Plus, Edit3, Copy, Trash2, CircleDot, X, Flag,
  Building2, Milestone as MilestoneIcon, BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */
type ContractStatus = 'draft' | 'pending-review' | 'pending-signature' | 'active' | 'amended' | 'expired' | 'terminated' | 'disputed' | 'completed';
type ViewTab = 'all' | 'active' | 'pending' | 'archive' | 'timeline' | 'amendments';

interface ContractParty { name: string; avatar: string; role: 'client' | 'freelancer' | 'agency'; signed: boolean; signedAt?: string; }
interface Milestone { id: string; title: string; amount: string; dueDate: string; status: 'pending' | 'funded' | 'delivered' | 'approved' | 'disputed'; }
interface Amendment { id: string; title: string; description: string; status: 'proposed' | 'accepted' | 'rejected'; proposedBy: string; proposedAt: string; }
interface TimelineEvent { id: string; action: string; actor: string; timestamp: string; detail?: string; }
interface Contract {
  id: string; title: string; projectTitle: string; projectId: string;
  status: ContractStatus; createdAt: string; updatedAt: string; expiresAt?: string;
  value: string; valueNumeric: number; currency: string;
  parties: ContractParty[]; milestones: Milestone[]; amendments: Amendment[];
  timeline: TimelineEvent[]; terms: string[];
  paymentTerms: string; disputeClause: string; renewalType: 'none' | 'auto' | 'manual';
  escrowFunded: boolean; escrowAmount: string;
}

/* ═══════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════ */
const CONTRACTS: Contract[] = [
  {
    id: 'c1', title: 'SaaS Platform Development Contract', projectTitle: 'SaaS Platform Development — React + Node', projectId: 'p1',
    status: 'active', createdAt: '2024-01-15', updatedAt: '2 days ago', value: '$28,000', valueNumeric: 28000, currency: 'USD',
    parties: [{ name: 'TechVentures Inc.', avatar: 'TV', role: 'client', signed: true, signedAt: 'Jan 16, 2024' }, { name: 'Alex Chen', avatar: 'AC', role: 'freelancer', signed: true, signedAt: 'Jan 16, 2024' }],
    milestones: [
      { id: 'm1', title: 'Discovery & Architecture', amount: '$5,000', dueDate: 'Feb 1', status: 'approved' },
      { id: 'm2', title: 'Core Backend APIs', amount: '$8,000', dueDate: 'Mar 1', status: 'funded' },
      { id: 'm3', title: 'Frontend & Integration', amount: '$10,000', dueDate: 'Apr 1', status: 'pending' },
      { id: 'm4', title: 'Testing & Launch', amount: '$5,000', dueDate: 'Apr 15', status: 'pending' },
    ],
    amendments: [{ id: 'a1', title: 'Extended timeline by 2 weeks', description: 'Client requested additional API endpoints requiring timeline extension.', status: 'accepted', proposedBy: 'Alex Chen', proposedAt: 'Feb 10, 2024' }],
    timeline: [
      { id: 't1', action: 'Contract created', actor: 'System', timestamp: 'Jan 15, 2024' },
      { id: 't2', action: 'Signed by TechVentures Inc.', actor: 'TechVentures Inc.', timestamp: 'Jan 16, 2024' },
      { id: 't3', action: 'Signed by Alex Chen', actor: 'Alex Chen', timestamp: 'Jan 16, 2024' },
      { id: 't4', action: 'Contract activated', actor: 'System', timestamp: 'Jan 16, 2024' },
      { id: 't5', action: 'Milestone 1 funded', actor: 'TechVentures Inc.', timestamp: 'Jan 17, 2024' },
      { id: 't6', action: 'Milestone 1 delivered', actor: 'Alex Chen', timestamp: 'Feb 2, 2024' },
      { id: 't7', action: 'Milestone 1 approved', actor: 'TechVentures Inc.', timestamp: 'Feb 3, 2024' },
      { id: 't8', action: 'Amendment proposed', actor: 'Alex Chen', timestamp: 'Feb 10, 2024', detail: 'Extended timeline by 2 weeks' },
      { id: 't9', action: 'Amendment accepted', actor: 'TechVentures Inc.', timestamp: 'Feb 11, 2024' },
      { id: 't10', action: 'Milestone 2 funded', actor: 'TechVentures Inc.', timestamp: 'Feb 15, 2024' },
    ],
    terms: ['Net-30 payment upon milestone approval', 'IP transfers to client on final payment', 'Confidentiality clause active for 2 years', 'Dispute resolution via platform arbitration'],
    paymentTerms: 'Milestone-based, escrow-funded', disputeClause: 'Platform arbitration with 7-day resolution window', renewalType: 'none',
    escrowFunded: true, escrowAmount: '$8,000',
  },
  {
    id: 'c2', title: 'Mobile App Redesign SOW', projectTitle: 'Mobile App Redesign', projectId: 'p2',
    status: 'pending-signature', createdAt: '2024-02-20', updatedAt: '1 day ago', value: '$12,000', valueNumeric: 12000, currency: 'USD',
    parties: [{ name: 'DesignCo', avatar: 'DC', role: 'client', signed: true, signedAt: 'Feb 21, 2024' }, { name: 'Sarah Miller', avatar: 'SM', role: 'freelancer', signed: false }],
    milestones: [
      { id: 'm5', title: 'UX Research & Wireframes', amount: '$4,000', dueDate: 'Mar 15', status: 'pending' },
      { id: 'm6', title: 'Visual Design', amount: '$5,000', dueDate: 'Apr 15', status: 'pending' },
      { id: 'm7', title: 'Handoff & QA', amount: '$3,000', dueDate: 'May 1', status: 'pending' },
    ],
    amendments: [], timeline: [
      { id: 't20', action: 'Contract created', actor: 'System', timestamp: 'Feb 20, 2024' },
      { id: 't21', action: 'Signed by DesignCo', actor: 'DesignCo', timestamp: 'Feb 21, 2024' },
      { id: 't22', action: 'Awaiting freelancer signature', actor: 'System', timestamp: 'Feb 21, 2024' },
    ],
    terms: ['Fixed-price per milestone', 'Client owns all deliverables', '14-day revision window per milestone'],
    paymentTerms: 'Milestone-based', disputeClause: 'Platform mediation', renewalType: 'none',
    escrowFunded: false, escrowAmount: '$0',
  },
  {
    id: 'c3', title: 'Data Pipeline Maintenance Agreement', projectTitle: 'Data Pipeline Architecture', projectId: 'p3',
    status: 'completed', createdAt: '2023-10-01', updatedAt: '3 months ago', value: '$35,000', valueNumeric: 35000, currency: 'USD',
    parties: [{ name: 'DataFlow Labs', avatar: 'DL', role: 'client', signed: true, signedAt: 'Oct 2, 2023' }, { name: 'Dev Studio Pro', avatar: 'DS', role: 'agency', signed: true, signedAt: 'Oct 2, 2023' }],
    milestones: [
      { id: 'm8', title: 'Architecture Design', amount: '$10,000', dueDate: 'Nov 1', status: 'approved' },
      { id: 'm9', title: 'Implementation', amount: '$15,000', dueDate: 'Dec 15', status: 'approved' },
      { id: 'm10', title: 'Testing & Deployment', amount: '$10,000', dueDate: 'Jan 15', status: 'approved' },
    ],
    amendments: [], timeline: [
      { id: 't30', action: 'Contract created', actor: 'System', timestamp: 'Oct 1, 2023' },
      { id: 't31', action: 'Both parties signed', actor: 'System', timestamp: 'Oct 2, 2023' },
      { id: 't32', action: 'All milestones completed', actor: 'System', timestamp: 'Jan 20, 2024' },
      { id: 't33', action: 'Contract completed', actor: 'System', timestamp: 'Jan 20, 2024' },
    ],
    terms: ['Hourly + milestone hybrid', 'Source code ownership on completion'],
    paymentTerms: 'Milestone-based', disputeClause: 'Binding arbitration', renewalType: 'manual',
    escrowFunded: false, escrowAmount: '$0',
  },
  {
    id: 'c4', title: 'E-commerce Integration Contract', projectTitle: 'E-commerce Integration', projectId: 'p4',
    status: 'draft', createdAt: '2024-03-01', updatedAt: 'Today', value: '$8,000', valueNumeric: 8000, currency: 'USD',
    parties: [{ name: 'ShopFront', avatar: 'SF', role: 'client', signed: false }, { name: 'Marcus Johnson', avatar: 'MJ', role: 'freelancer', signed: false }],
    milestones: [{ id: 'm11', title: 'Full Delivery', amount: '$8,000', dueDate: 'Apr 30', status: 'pending' }],
    amendments: [], timeline: [{ id: 't40', action: 'Draft created', actor: 'ShopFront', timestamp: 'Today' }],
    terms: ['Fixed price', 'Single delivery'],
    paymentTerms: 'On completion', disputeClause: 'Platform mediation', renewalType: 'none',
    escrowFunded: false, escrowAmount: '$0',
  },
  {
    id: 'c5', title: 'API Gateway Retainer', projectTitle: 'API Gateway Setup', projectId: 'p5',
    status: 'expired', createdAt: '2023-06-01', updatedAt: '6 months ago', expiresAt: '2023-12-01', value: '$15,000', valueNumeric: 15000, currency: 'USD',
    parties: [{ name: 'CloudFirst', avatar: 'CF', role: 'client', signed: true, signedAt: 'Jun 2, 2023' }, { name: 'Nina Kowalski', avatar: 'NK', role: 'freelancer', signed: true, signedAt: 'Jun 2, 2023' }],
    milestones: [{ id: 'm12', title: 'Monthly retainer', amount: '$2,500/mo', dueDate: 'Monthly', status: 'approved' }],
    amendments: [], timeline: [
      { id: 't50', action: 'Contract expired', actor: 'System', timestamp: 'Dec 1, 2023' },
    ],
    terms: ['Monthly retainer', '30-day notice for termination'],
    paymentTerms: 'Monthly', disputeClause: 'Platform arbitration', renewalType: 'auto',
    escrowFunded: false, escrowAmount: '$0',
  },
];

const STATUS_CONFIG: Record<ContractStatus, { badge: 'healthy' | 'caution' | 'blocked' | 'pending' | 'live' | 'premium'; label: string }> = {
  draft: { badge: 'pending', label: 'Draft' },
  'pending-review': { badge: 'caution', label: 'Pending Review' },
  'pending-signature': { badge: 'live', label: 'Awaiting Signature' },
  active: { badge: 'healthy', label: 'Active' },
  amended: { badge: 'premium', label: 'Amended' },
  expired: { badge: 'blocked', label: 'Expired' },
  terminated: { badge: 'blocked', label: 'Terminated' },
  disputed: { badge: 'blocked', label: 'Disputed' },
  completed: { badge: 'healthy', label: 'Completed' },
};

const MILESTONE_STATUS_COLOR: Record<string, string> = {
  pending: 'text-muted-foreground', funded: 'text-accent', delivered: 'text-[hsl(var(--state-caution))]', approved: 'text-[hsl(var(--state-healthy))]', disputed: 'text-[hsl(var(--state-blocked))]',
};

/* ═══════════════════════════════════════════════════════════
   Sign Confirmation Modal
   ═══════════════════════════════════════════════════════════ */
const SignModal: React.FC<{ contract: Contract | null; onClose: () => void; onSign: () => void }> = ({ contract, onClose, onSign }) => {
  const [agreed, setAgreed] = useState(false);
  if (!contract) return null;
  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative flex justify-center items-start pt-[12vh] px-4">
        <div className="w-full max-w-md bg-card rounded-2xl border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center"><PenTool className="h-5 w-5 text-accent" /></div>
              <div><h3 className="font-bold text-sm">Sign Contract</h3><p className="text-[9px] text-muted-foreground">{contract.title}</p></div>
            </div>
            <div className="rounded-2xl bg-muted/30 p-3 text-[10px] space-y-1.5">
              <div className="flex justify-between"><span className="text-muted-foreground">Contract Value</span><span className="font-bold">{contract.value}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Milestones</span><span className="font-medium">{contract.milestones.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payment Terms</span><span className="font-medium">{contract.paymentTerms}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Dispute Clause</span><span className="font-medium">{contract.disputeClause}</span></div>
            </div>
            <div className="rounded-2xl border p-3 max-h-32 overflow-y-auto text-[9px] text-muted-foreground space-y-1">
              <div className="font-semibold text-foreground text-[10px] mb-1">Key Terms</div>
              {contract.terms.map((t, i) => <div key={i} className="flex items-start gap-1.5"><CircleDot className="h-2.5 w-2.5 text-accent shrink-0 mt-0.5" />{t}</div>)}
            </div>
            <label className="flex items-start gap-2 text-[10px] cursor-pointer">
              <Checkbox checked={agreed} onCheckedChange={v => setAgreed(!!v)} className="mt-0.5" />
              <span>I have read and agree to the terms of this contract, including the statement of work, payment schedule, and dispute resolution clause.</span>
            </label>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-9 text-[10px] rounded-xl" onClick={onClose}>Cancel</Button>
              <Button className="flex-1 h-9 text-[10px] gap-1 rounded-xl" disabled={!agreed} onClick={onSign}><PenTool className="h-3 w-3" />Sign & Accept</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const ContractsSOWPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewTab>('all');
  const [contracts, setContracts] = useState(CONTRACTS);
  const [detailContract, setDetailContract] = useState<Contract | null>(null);
  const [signTarget, setSignTarget] = useState<Contract | null>(null);
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'status'>('date');

  const filtered = useMemo(() => {
    let list = contracts;
    if (activeTab === 'active') list = list.filter(c => c.status === 'active' || c.status === 'amended');
    else if (activeTab === 'pending') list = list.filter(c => c.status === 'draft' || c.status === 'pending-review' || c.status === 'pending-signature');
    else if (activeTab === 'archive') list = list.filter(c => c.status === 'completed' || c.status === 'expired' || c.status === 'terminated');
    else if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter);
    return list.sort((a, b) => sortBy === 'value' ? b.valueNumeric - a.valueNumeric : 0);
  }, [contracts, activeTab, statusFilter, sortBy]);

  const handleSign = () => {
    if (!signTarget) return;
    setContracts(prev => prev.map(c => c.id === signTarget.id ? { ...c, status: 'active' as ContractStatus, parties: c.parties.map(p => ({ ...p, signed: true, signedAt: 'Today' })) } : c));
    toast.success('Contract signed successfully!');
    setSignTarget(null);
  };

  const tabs: { key: ViewTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All Contracts', count: contracts.length },
    { key: 'active', label: 'Active', count: contracts.filter(c => c.status === 'active' || c.status === 'amended').length },
    { key: 'pending', label: 'Pending', count: contracts.filter(c => ['draft', 'pending-review', 'pending-signature'].includes(c.status)).length },
    { key: 'archive', label: 'Archive', count: contracts.filter(c => ['completed', 'expired', 'terminated'].includes(c.status)).length },
    { key: 'timeline', label: 'Timeline' },
    { key: 'amendments', label: 'Amendments', count: contracts.reduce((s, c) => s + c.amendments.length, 0) },
  ];

  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><FileText className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Contracts & SOW</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-0.5">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={cn(
            'px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition-all',
            activeTab === t.key ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'
          )}>
            {t.label}{t.count !== undefined && <span className="ml-1 text-[8px] opacity-70">({t.count})</span>}
          </button>
        ))}
      </div>
    </>
  );

  const totalValue = contracts.reduce((s, c) => s + c.valueNumeric, 0);
  const activeValue = contracts.filter(c => c.status === 'active').reduce((s, c) => s + c.valueNumeric, 0);

  const rightRail = (
    <div className="space-y-3">
      <KPIBand className="grid-cols-2 !rounded-2xl">
        <KPICard label="Total Value" value={`$${Math.round(totalValue / 1000)}K`} />
        <KPICard label="Active" value={`$${Math.round(activeValue / 1000)}K`} trend="up" change="64%" />
        <KPICard label="Pending" value={contracts.filter(c => ['draft', 'pending-review', 'pending-signature'].includes(c.status)).length} />
        <KPICard label="Completed" value={contracts.filter(c => c.status === 'completed').length} />
      </KPIBand>

      <SectionCard title="Escrow Status" icon={<Shield className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[10px]">
          {contracts.filter(c => c.status === 'active').map(c => (
            <div key={c.id} className="flex items-center justify-between">
              <span className="text-muted-foreground truncate max-w-[100px]">{c.title.split(' ').slice(0, 2).join(' ')}</span>
              <div className="flex items-center gap-1">
                {c.escrowFunded ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /> : <AlertTriangle className="h-3 w-3 text-[hsl(var(--state-caution))]" />}
                <span className="font-medium">{c.escrowAmount}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-1">
          {[
            { label: 'Create contract', icon: Plus, action: () => toast.info('Opening contract builder…') },
            { label: 'Export all', icon: Download, action: () => toast.info('Exporting…') },
            { label: 'View templates', icon: BookOpen, action: () => toast.info('Opening templates…') },
          ].map(a => (
            <button key={a.label} onClick={a.action} className="flex items-center gap-2 px-2 py-1.5 rounded-xl text-[9px] hover:bg-muted/50 transition-colors w-full text-left">
              <a.icon className="h-3 w-3 text-muted-foreground" />{a.label}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-2"><Sparkles className="h-3.5 w-3.5 text-accent" /><span className="text-[11px] font-semibold">Contract Value Distribution</span></div>
      <div className="flex items-end gap-1.5 h-14">
        {contracts.map(c => (
          <div key={c.id} className="flex-1 flex flex-col items-center gap-0.5">
            <div className={cn('w-full rounded-sm transition-all', c.status === 'active' ? 'bg-accent' : c.status === 'completed' ? 'bg-[hsl(var(--state-healthy))]' : 'bg-muted')} style={{ height: `${(c.valueNumeric / 35000) * 100}%` }} />
            <span className="text-[7px] text-muted-foreground truncate w-full text-center">{c.title.split(' ')[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── Contract Row ── */
  const ContractRow: React.FC<{ c: Contract }> = ({ c }) => {
    const cfg = STATUS_CONFIG[c.status];
    const pendingSig = c.parties.some(p => !p.signed);
    const msProgress = c.milestones.filter(m => m.status === 'approved').length / (c.milestones.length || 1) * 100;
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border hover:bg-muted/20 hover:shadow-sm transition-all cursor-pointer" onClick={() => setDetailContract(c)}>
        <div className="flex -space-x-2 shrink-0">
          {c.parties.map(p => (
            <Avatar key={p.name} className={cn('h-7 w-7 ring-2', p.signed ? 'ring-[hsl(var(--state-healthy)/0.3)]' : 'ring-[hsl(var(--state-caution)/0.3)]')}>
              <AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">{p.avatar}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold truncate">{c.title}</span>
            <StatusBadge status={cfg.badge} label={cfg.label} />
            {pendingSig && c.status !== 'draft' && <Badge variant="outline" className="text-[7px] border-[hsl(var(--state-caution)/0.5)] text-[hsl(var(--state-caution))]">Sig. Required</Badge>}
          </div>
          <div className="text-[9px] text-muted-foreground">{c.projectTitle} · {c.updatedAt}</div>
        </div>
        <div className="text-right shrink-0 space-y-0.5">
          <div className="text-[11px] font-bold">{c.value}</div>
          <div className="text-[8px] text-muted-foreground">{c.milestones.length} milestones</div>
        </div>
        <div className="w-16 shrink-0">
          <Progress value={msProgress} className="h-1.5" />
          <div className="text-[7px] text-muted-foreground text-center mt-0.5">{Math.round(msProgress)}%</div>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </div>
    );
  };

  /* ── TAB: All / Active / Pending / Archive ── */
  const renderList = () => (
    <div className="space-y-2">
      {activeTab === 'all' && (
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'draft', 'pending-signature', 'active', 'completed', 'expired'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn(
              'px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition-all capitalize',
              statusFilter === s ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'
            )}>{s === 'all' ? 'All' : s.replace('-', ' ')}</button>
          ))}
          <div className="flex-1" />
          <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setSortBy(prev => prev === 'date' ? 'value' : 'date')}><ArrowUpDown className="h-3 w-3" />{sortBy === 'date' ? 'By Date' : 'By Value'}</Button>
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border p-8 text-center"><FileText className="h-6 w-6 text-muted-foreground mx-auto mb-2" /><div className="text-[11px] font-medium">No contracts found</div></div>
      ) : (
        <div className="space-y-1.5">{filtered.map(c => <ContractRow key={c.id} c={c} />)}</div>
      )}
    </div>
  );

  /* ── TAB: Timeline ── */
  const renderTimeline = () => {
    const allEvents = contracts.flatMap(c => c.timeline.map(e => ({ ...e, contractTitle: c.title, contractId: c.id }))).sort((a, b) => b.id.localeCompare(a.id));
    return (
      <div className="space-y-1">
        {allEvents.map((e, i) => (
          <div key={e.id} className="flex gap-3 pl-2">
            <div className="flex flex-col items-center">
              <div className="h-2 w-2 rounded-full bg-accent shrink-0 mt-1.5" />
              {i < allEvents.length - 1 && <div className="w-px flex-1 bg-border" />}
            </div>
            <div className="pb-3">
              <div className="text-[10px] font-medium">{e.action}</div>
              <div className="text-[9px] text-muted-foreground">{e.actor} · {e.timestamp}</div>
              <div className="text-[8px] text-muted-foreground">{e.contractTitle}</div>
              {e.detail && <div className="text-[9px] mt-0.5 rounded-xl bg-muted/30 px-2 py-1">{e.detail}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  /* ── TAB: Amendments ── */
  const renderAmendments = () => {
    const allAmendments = contracts.flatMap(c => c.amendments.map(a => ({ ...a, contractTitle: c.title })));
    if (allAmendments.length === 0) return (
      <div className="rounded-2xl border p-8 text-center"><Edit3 className="h-6 w-6 text-muted-foreground mx-auto mb-2" /><div className="text-[11px] font-medium">No amendments</div></div>
    );
    return (
      <div className="space-y-2">
        {allAmendments.map(a => (
          <div key={a.id} className="rounded-2xl border p-3 hover:shadow-sm transition-all">
            <div className="flex items-center gap-2 mb-1">
              <Edit3 className="h-3.5 w-3.5 text-accent" />
              <span className="text-[10px] font-semibold flex-1">{a.title}</span>
              <StatusBadge status={a.status === 'accepted' ? 'healthy' : a.status === 'rejected' ? 'blocked' : 'caution'} label={a.status} />
            </div>
            <div className="text-[9px] text-muted-foreground mb-1">{a.description}</div>
            <div className="text-[8px] text-muted-foreground">Proposed by {a.proposedBy} · {a.proposedAt} · {a.contractTitle}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-60" bottomSection={bottomSection}>
      {(activeTab === 'all' || activeTab === 'active' || activeTab === 'pending' || activeTab === 'archive') && renderList()}
      {activeTab === 'timeline' && renderTimeline()}
      {activeTab === 'amendments' && renderAmendments()}

      <SignModal contract={signTarget} onClose={() => setSignTarget(null)} onSign={handleSign} />

      {/* Detail Drawer */}
      <Sheet open={!!detailContract} onOpenChange={() => setDetailContract(null)}>
        <SheetContent className="w-[420px] sm:w-[460px] overflow-y-auto p-0">
          {detailContract && (() => {
            const c = detailContract;
            const cfg = STATUS_CONFIG[c.status];
            const pendingSig = c.parties.some(p => !p.signed);
            return (
              <>
                <SheetHeader className="p-5 border-b">
                  <SheetTitle className="text-sm">{c.title}</SheetTitle>
                </SheetHeader>
                <div className="p-4 space-y-3">
                  {/* Status & Value */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={cfg.badge} label={cfg.label} />
                    {pendingSig && c.status !== 'draft' && <Badge variant="outline" className="text-[7px] border-[hsl(var(--state-caution)/0.5)] text-[hsl(var(--state-caution))]">Signature Required</Badge>}
                    {c.escrowFunded && <Badge className="text-[7px] bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]"><Shield className="h-2.5 w-2.5 mr-0.5" />Escrow: {c.escrowAmount}</Badge>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ l: 'Value', v: c.value }, { l: 'Milestones', v: String(c.milestones.length) }, { l: 'Created', v: c.createdAt }].map(m => (
                      <div key={m.l} className="rounded-2xl border p-2 text-center"><div className="text-[9px] text-muted-foreground">{m.l}</div><div className="text-sm font-bold">{m.v}</div></div>
                    ))}
                  </div>

                  {/* Parties */}
                  <div>
                    <h4 className="text-[10px] font-semibold mb-1.5">Parties</h4>
                    <div className="space-y-1.5">
                      {c.parties.map(p => (
                        <div key={p.name} className="flex items-center gap-2 px-2 py-1.5 rounded-xl border">
                          <Avatar className={cn('h-7 w-7 ring-2', p.signed ? 'ring-[hsl(var(--state-healthy)/0.3)]' : 'ring-[hsl(var(--state-caution)/0.3)]')}>
                            <AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">{p.avatar}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-medium truncate">{p.name}</div>
                            <div className="text-[8px] text-muted-foreground capitalize">{p.role}</div>
                          </div>
                          {p.signed ? (
                            <Badge className="text-[7px] bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]"><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Signed {p.signedAt}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[7px] border-[hsl(var(--state-caution)/0.5)] text-[hsl(var(--state-caution))]"><Clock className="h-2.5 w-2.5 mr-0.5" />Pending</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Terms */}
                  <div>
                    <h4 className="text-[10px] font-semibold mb-1">Key Terms</h4>
                    <div className="rounded-2xl border p-2.5 space-y-1">
                      {c.terms.map((t, i) => <div key={i} className="text-[9px] flex items-start gap-1.5"><CircleDot className="h-2.5 w-2.5 text-accent shrink-0 mt-0.5" />{t}</div>)}
                    </div>
                  </div>

                  {/* Milestones */}
                  <div>
                    <h4 className="text-[10px] font-semibold mb-1.5">Milestones</h4>
                    <div className="space-y-1">
                      {c.milestones.map((m, i) => (
                        <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-xl border hover:bg-muted/20 transition-colors">
                          <div className="h-5 w-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[8px] font-bold shrink-0">{i + 1}</div>
                          <span className="text-[10px] font-medium flex-1 truncate">{m.title}</span>
                          <span className="text-[10px] font-bold shrink-0">{m.amount}</span>
                          <span className={cn('text-[8px] font-medium capitalize shrink-0', MILESTONE_STATUS_COLOR[m.status])}>{m.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contract details */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {[
                      { l: 'Payment', v: c.paymentTerms, icon: DollarSign },
                      { l: 'Dispute', v: c.disputeClause.split(' ').slice(0, 2).join(' '), icon: Scale },
                      { l: 'Renewal', v: c.renewalType, icon: RefreshCw },
                      { l: 'Updated', v: c.updatedAt, icon: Clock },
                    ].map(m => (
                      <div key={m.l} className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-muted/30">
                        <m.icon className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{m.l}:</span>
                        <span className="font-medium capitalize truncate">{m.v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Timeline (last 5) */}
                  <div>
                    <h4 className="text-[10px] font-semibold mb-1.5 flex items-center gap-1"><History className="h-3 w-3 text-accent" />Recent Activity</h4>
                    <div className="space-y-1">
                      {c.timeline.slice(-5).reverse().map(e => (
                        <div key={e.id} className="flex gap-2 text-[9px]">
                          <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                          <div><span className="font-medium">{e.action}</span><span className="text-muted-foreground"> · {e.actor} · {e.timestamp}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {pendingSig && c.status !== 'draft' && (
                      <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => { setDetailContract(null); setSignTarget(c); }}><PenTool className="h-3 w-3" />Sign Contract</Button>
                    )}
                    {c.status === 'draft' && (
                      <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => toast.info('Sending for review…')}><Send className="h-3 w-3" />Send for Review</Button>
                    )}
                    {c.status === 'active' && (
                      <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => toast.info('Opening amendment form…')}><Edit3 className="h-3 w-3" />Propose Amendment</Button>
                    )}
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl" asChild><Link to={`/projects/${c.projectId}`}><ExternalLink className="h-3 w-3" />Project</Link></Button>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl" asChild><Link to={`/projects/${c.projectId}/workspace`}><Briefcase className="h-3 w-3" />Workspace</Link></Button>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => toast.info('Opening message…')}><MessageSquare className="h-3 w-3" />Message</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => toast.info('Downloading PDF…')}><Download className="h-3 w-3" />PDF</Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default ContractsSOWPage;
