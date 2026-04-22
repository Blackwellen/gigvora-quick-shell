import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  FileText, CheckCircle2, Clock, DollarSign, AlertTriangle, Shield,
  Users, ArrowUpDown, ExternalLink, Plus, X, Send, Eye,
  Award, Briefcase, Calendar, MessageSquare, Lock, Pen,
  ChevronRight, BarChart3, TrendingUp, History, Ban,
  CircleDot, Pause, Play, XCircle, Flag,
} from 'lucide-react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */
type ContractStatus = 'draft' | 'active' | 'on-hold' | 'completed' | 'cancelled';
type ChangeRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired';
type ViewTab = 'contracts' | 'awards' | 'changes' | 'analytics';

interface MilestoneItem {
  id: string; title: string; amount: string; status: 'pending' | 'in-progress' | 'submitted' | 'approved' | 'paid';
  dueDate: string;
}

interface Contract {
  id: string; title: string; projectTitle: string; status: ContractStatus;
  clientName: string; clientAvatar: string; freelancerName: string; freelancerAvatar: string;
  totalValue: string; paidAmount: string; paidPercent: number;
  startDate: string; endDate: string; milestones: MilestoneItem[];
  createdAt: string; lastActivity: string;
}

interface ChangeRequest {
  id: string; contractId: string; contractTitle: string; type: 'scope' | 'budget' | 'timeline' | 'milestone';
  description: string; requestedBy: string; requestedByAvatar: string;
  status: ChangeRequestStatus; createdAt: string; impact: string;
  originalValue: string; proposedValue: string;
}

interface AwardItem {
  id: string; projectTitle: string; freelancerName: string; freelancerAvatar: string;
  bidAmount: string; status: 'pending-review' | 'pending-sign' | 'signed' | 'declined';
  proposalDate: string; awardDate: string;
}

/* ═══════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════ */
const CONTRACTS: Contract[] = [
  {
    id: 'c1', title: 'SaaS Platform Development Contract', projectTitle: 'SaaS Platform Development', status: 'active',
    clientName: 'TechVentures Inc.', clientAvatar: 'TV', freelancerName: 'Alex Morgan', freelancerAvatar: 'AM',
    totalValue: '$28,000', paidAmount: '$12,000', paidPercent: 43,
    startDate: 'Jan 15, 2026', endDate: 'Apr 15, 2026',
    milestones: [
      { id: 'm1', title: 'Architecture & Auth', amount: '$8,000', status: 'paid', dueDate: 'Feb 1' },
      { id: 'm2', title: 'Billing & Core Features', amount: '$12,000', status: 'in-progress', dueDate: 'Mar 1' },
      { id: 'm3', title: 'Dashboard & Polish', amount: '$5,000', status: 'pending', dueDate: 'Mar 25' },
      { id: 'm4', title: 'Testing & Launch', amount: '$3,000', status: 'pending', dueDate: 'Apr 15' },
    ],
    createdAt: 'Jan 10, 2026', lastActivity: '2 hours ago',
  },
  {
    id: 'c2', title: 'Mobile App Redesign Contract', projectTitle: 'Mobile App Redesign', status: 'draft',
    clientName: 'DesignCo', clientAvatar: 'DC', freelancerName: 'Sarah Chen', freelancerAvatar: 'SC',
    totalValue: '$12,000', paidAmount: '$0', paidPercent: 0,
    startDate: 'TBD', endDate: 'TBD',
    milestones: [
      { id: 'm5', title: 'UX Research & Wireframes', amount: '$4,000', status: 'pending', dueDate: 'TBD' },
      { id: 'm6', title: 'Visual Design', amount: '$5,000', status: 'pending', dueDate: 'TBD' },
      { id: 'm7', title: 'Prototyping & Handoff', amount: '$3,000', status: 'pending', dueDate: 'TBD' },
    ],
    createdAt: '3 days ago', lastActivity: '1 day ago',
  },
  {
    id: 'c3', title: 'Data Pipeline Architecture', projectTitle: 'Data Pipeline', status: 'completed',
    clientName: 'DataFlow Labs', clientAvatar: 'DL', freelancerName: 'James Park', freelancerAvatar: 'JP',
    totalValue: '$35,000', paidAmount: '$35,000', paidPercent: 100,
    startDate: 'Oct 1, 2025', endDate: 'Jan 5, 2026',
    milestones: [
      { id: 'm8', title: 'Pipeline Design', amount: '$10,000', status: 'paid', dueDate: 'Oct 20' },
      { id: 'm9', title: 'Implementation', amount: '$15,000', status: 'paid', dueDate: 'Nov 30' },
      { id: 'm10', title: 'Testing & Docs', amount: '$10,000', status: 'paid', dueDate: 'Jan 5' },
    ],
    createdAt: 'Sep 25, 2025', lastActivity: 'Jan 5, 2026',
  },
  {
    id: 'c4', title: 'E-commerce Integration', projectTitle: 'E-commerce Platform', status: 'on-hold',
    clientName: 'ShopFront', clientAvatar: 'SF', freelancerName: 'Maria Lopez', freelancerAvatar: 'ML',
    totalValue: '$8,000', paidAmount: '$3,000', paidPercent: 38,
    startDate: 'Dec 1, 2025', endDate: 'Feb 28, 2026',
    milestones: [
      { id: 'm11', title: 'API Integration', amount: '$3,000', status: 'paid', dueDate: 'Dec 15' },
      { id: 'm12', title: 'Payment Flow', amount: '$3,000', status: 'pending', dueDate: 'Jan 30' },
      { id: 'm13', title: 'Testing', amount: '$2,000', status: 'pending', dueDate: 'Feb 28' },
    ],
    createdAt: 'Nov 20, 2025', lastActivity: '1 week ago',
  },
  {
    id: 'c5', title: 'Marketing Website', projectTitle: 'Brand Website', status: 'cancelled',
    clientName: 'StartupXYZ', clientAvatar: 'SX', freelancerName: 'Tom Wilson', freelancerAvatar: 'TW',
    totalValue: '$6,000', paidAmount: '$2,000', paidPercent: 33,
    startDate: 'Nov 1, 2025', endDate: '—',
    milestones: [
      { id: 'm14', title: 'Design Phase', amount: '$2,000', status: 'paid', dueDate: 'Nov 15' },
      { id: 'm15', title: 'Development', amount: '$4,000', status: 'pending', dueDate: '—' },
    ],
    createdAt: 'Oct 28, 2025', lastActivity: 'Dec 1, 2025',
  },
];

const CHANGE_REQUESTS: ChangeRequest[] = [
  { id: 'cr1', contractId: 'c1', contractTitle: 'SaaS Platform Development', type: 'scope', description: 'Add real-time notifications module to dashboard', requestedBy: 'TechVentures Inc.', requestedByAvatar: 'TV', status: 'pending', createdAt: '4 hours ago', impact: '+$3,000 / +2 weeks', originalValue: 'No notifications', proposedValue: 'WebSocket-based real-time notifications' },
  { id: 'cr2', contractId: 'c1', contractTitle: 'SaaS Platform Development', type: 'timeline', description: 'Extend milestone 2 deadline by 1 week', requestedBy: 'Alex Morgan', requestedByAvatar: 'AM', status: 'approved', createdAt: '3 days ago', impact: '+1 week', originalValue: 'Mar 1', proposedValue: 'Mar 8' },
  { id: 'cr3', contractId: 'c4', contractTitle: 'E-commerce Integration', type: 'budget', description: 'Increase budget for additional payment gateway', requestedBy: 'ShopFront', requestedByAvatar: 'SF', status: 'pending', createdAt: '1 week ago', impact: '+$1,500', originalValue: '$8,000', proposedValue: '$9,500' },
  { id: 'cr4', contractId: 'c1', contractTitle: 'SaaS Platform Development', type: 'milestone', description: 'Split milestone 2 into two separate milestones', requestedBy: 'Alex Morgan', requestedByAvatar: 'AM', status: 'rejected', createdAt: '2 weeks ago', impact: 'No cost change', originalValue: '1 milestone ($12K)', proposedValue: '2 milestones ($7K + $5K)' },
];

const AWARDS: AwardItem[] = [
  { id: 'a1', projectTitle: 'SaaS Platform Development', freelancerName: 'Alex Morgan', freelancerAvatar: 'AM', bidAmount: '$28,000', status: 'signed', proposalDate: 'Jan 5, 2026', awardDate: 'Jan 10, 2026' },
  { id: 'a2', projectTitle: 'Mobile App Redesign', freelancerName: 'Sarah Chen', freelancerAvatar: 'SC', bidAmount: '$12,000', status: 'pending-sign', proposalDate: '5 days ago', awardDate: '3 days ago' },
  { id: 'a3', projectTitle: 'AI Chatbot Integration', freelancerName: 'David Kim', freelancerAvatar: 'DK', bidAmount: '$7,500', status: 'pending-review', proposalDate: '1 day ago', awardDate: '—' },
  { id: 'a4', projectTitle: 'Logo Redesign', freelancerName: 'Emma White', freelancerAvatar: 'EW', bidAmount: '$2,000', status: 'declined', proposalDate: '2 weeks ago', awardDate: '10 days ago' },
];

const CONTRACT_STATUS_MAP: Record<ContractStatus, { badge: 'healthy' | 'caution' | 'blocked' | 'pending' | 'live' | 'premium'; label: string; icon: React.FC<any> }> = {
  draft: { badge: 'pending', label: 'Draft', icon: Pen },
  active: { badge: 'live', label: 'Active', icon: Play },
  'on-hold': { badge: 'caution', label: 'On Hold', icon: Pause },
  completed: { badge: 'healthy', label: 'Completed', icon: CheckCircle2 },
  cancelled: { badge: 'blocked', label: 'Cancelled', icon: XCircle },
};

const MILESTONE_STATUS_COLORS: Record<string, string> = {
  pending: 'text-muted-foreground', 'in-progress': 'text-accent', submitted: 'text-[hsl(var(--state-caution))]', approved: 'text-[hsl(var(--state-healthy))]', paid: 'text-[hsl(var(--state-healthy))]',
};

const CR_STATUS_MAP: Record<ChangeRequestStatus, { badge: 'pending' | 'healthy' | 'blocked' | 'caution'; label: string }> = {
  pending: { badge: 'pending', label: 'Pending' },
  approved: { badge: 'healthy', label: 'Approved' },
  rejected: { badge: 'blocked', label: 'Rejected' },
  expired: { badge: 'caution', label: 'Expired' },
};

const AWARD_STATUS_MAP: Record<string, { badge: 'pending' | 'caution' | 'healthy' | 'blocked'; label: string }> = {
  'pending-review': { badge: 'pending', label: 'Pending Review' },
  'pending-sign': { badge: 'caution', label: 'Awaiting Signature' },
  signed: { badge: 'healthy', label: 'Signed' },
  declined: { badge: 'blocked', label: 'Declined' },
};

/* ═══════════════════════════════════════════════════════════
   Change Request Modal
   ═══════════════════════════════════════════════════════════ */
const NewChangeRequestModal: React.FC<{ open: boolean; onClose: () => void; contractId: string }> = ({ open, onClose, contractId }) => {
  const [crType, setCrType] = useState<'scope' | 'budget' | 'timeline' | 'milestone'>('scope');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative flex justify-center items-start pt-[6vh] px-4">
        <div className="w-full max-w-md bg-card rounded-2xl border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="font-semibold text-sm">New Change Request</h2>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-[11px] font-semibold mb-1 block">Type</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['scope', 'budget', 'timeline', 'milestone'] as const).map(t => (
                  <button key={t} onClick={() => setCrType(t)} className={cn('px-2 py-1.5 rounded-md border text-[9px] font-medium capitalize transition-colors', crType === t ? 'border-accent bg-accent/10 text-accent' : 'hover:bg-muted/30')}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold mb-1 block">Description <span className="text-[hsl(var(--state-blocked))]">*</span></label>
              <textarea className="w-full h-20 rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none" placeholder="Describe the change..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] font-semibold mb-1 block">Current Value</label><input className="w-full h-8 rounded-md border bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Original" /></div>
              <div><label className="text-[11px] font-semibold mb-1 block">Proposed Value</label><input className="w-full h-8 rounded-md border bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="New" /></div>
            </div>
            <div><label className="text-[11px] font-semibold mb-1 block">Impact Summary</label><input className="w-full h-8 rounded-md border bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="e.g. +$2,000 / +1 week" /></div>
            <div className="rounded-md border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-2.5 flex items-center gap-2 text-[10px]">
              <Shield className="h-3.5 w-3.5 text-[hsl(var(--state-caution))] shrink-0" />
              <span>This change requires approval from the other party before taking effect.</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t">
            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={onClose}>Cancel</Button>
            <Button size="sm" className="h-7 text-[10px] gap-1" onClick={() => { toast.success('Change request submitted'); onClose(); }}><Send className="h-3 w-3" />Submit Request</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const ContractsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewTab>('contracts');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedCR, setSelectedCR] = useState<ChangeRequest | null>(null);
  const [newCROpen, setNewCROpen] = useState(false);
  const [newCRContractId, setNewCRContractId] = useState('');

  const filteredContracts = useMemo(() =>
    statusFilter === 'all' ? CONTRACTS : CONTRACTS.filter(c => c.status === statusFilter),
  [statusFilter]);

  const tabs: { key: ViewTab; label: string; count?: number }[] = [
    { key: 'contracts', label: 'Contracts', count: CONTRACTS.length },
    { key: 'awards', label: 'Awards', count: AWARDS.length },
    { key: 'changes', label: 'Change Requests', count: CHANGE_REQUESTS.filter(cr => cr.status === 'pending').length },
    { key: 'analytics', label: 'Analytics' },
  ];

  const topStrip = (
    <>
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Contracts & Awards</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={cn(
            'px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors',
            activeTab === t.key ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/50'
          )}>
            {t.label}
            {t.count !== undefined && <span className="ml-1 text-[8px] opacity-70">({t.count})</span>}
          </button>
        ))}
      </div>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <KPIBand className="grid-cols-2">
        <KPICard label="Active" value={CONTRACTS.filter(c => c.status === 'active').length} />
        <KPICard label="Total Value" value="$89K" change="+12%" trend="up" />
      </KPIBand>
      <SectionCard title="Pending Actions">
        <div className="space-y-1.5 text-[10px]">
          {[
            { label: 'Awards awaiting signature', count: AWARDS.filter(a => a.status === 'pending-sign').length, urgent: true },
            { label: 'Change requests pending', count: CHANGE_REQUESTS.filter(cr => cr.status === 'pending').length, urgent: true },
            { label: 'Milestones to review', count: 1, urgent: false },
            { label: 'Contracts expiring soon', count: 0, urgent: false },
          ].map(a => (
            <div key={a.label} className="flex items-center justify-between">
              <span className="text-muted-foreground">{a.label}</span>
              <span className={cn('font-medium', a.urgent && a.count > 0 ? 'text-[hsl(var(--state-caution))]' : '')}>{a.count}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Quick Actions">
        <div className="space-y-1">
          <Button variant="outline" size="sm" className="w-full h-6 text-[9px] justify-start gap-1"><Plus className="h-3 w-3" />New Contract</Button>
          <Button variant="outline" size="sm" className="w-full h-6 text-[9px] justify-start gap-1"><Pen className="h-3 w-3" />Request Change</Button>
          <Button variant="outline" size="sm" className="w-full h-6 text-[9px] justify-start gap-1"><BarChart3 className="h-3 w-3" />Export Report</Button>
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = activeTab === 'analytics' ? (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Contract Activity Timeline</div>
      <div className="space-y-1.5">
        {[
          { time: '2 hrs ago', event: 'Milestone "Billing & Core" marked in-progress', contract: 'SaaS Platform' },
          { time: '1 day ago', event: 'Change request CR-002 approved', contract: 'SaaS Platform' },
          { time: '3 days ago', event: 'Award sent to Sarah Chen', contract: 'Mobile App Redesign' },
          { time: '1 week ago', event: 'Contract C-004 placed on hold', contract: 'E-commerce Integration' },
        ].map((e, i) => (
          <div key={i} className="flex items-center gap-3 text-[10px]">
            <span className="text-[9px] text-muted-foreground w-16 shrink-0">{e.time}</span>
            <CircleDot className="h-2.5 w-2.5 text-accent shrink-0" />
            <span className="flex-1">{e.event}</span>
            <span className="text-muted-foreground text-[9px]">{e.contract}</span>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  /* ── TAB: Contracts ── */
  const renderContracts = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'draft', 'active', 'on-hold', 'completed', 'cancelled'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={cn(
            'px-2.5 py-1 rounded-md text-[10px] font-medium capitalize transition-colors',
            statusFilter === s ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/50'
          )}>{s === 'all' ? 'All' : s.replace('-', ' ')} <span className="text-[8px] ml-0.5">({s === 'all' ? CONTRACTS.length : CONTRACTS.filter(c => c.status === s).length})</span></button>
        ))}
      </div>
      <div className="space-y-1.5">
        {filteredContracts.map(c => {
          const cfg = CONTRACT_STATUS_MAP[c.status];
          return (
            <div key={c.id} onClick={() => setSelectedContract(c)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border hover:bg-muted/20 transition-colors cursor-pointer">
              <div className="flex -space-x-2">
                <Avatar className="h-6 w-6 border-2 border-card"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{c.clientAvatar}</AvatarFallback></Avatar>
                <Avatar className="h-6 w-6 border-2 border-card"><AvatarFallback className="text-[7px] bg-muted">{c.freelancerAvatar}</AvatarFallback></Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium truncate">{c.title}</div>
                <div className="text-[8px] text-muted-foreground">{c.clientName} ↔ {c.freelancerName}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] font-bold">{c.totalValue}</div>
                <div className="text-[8px] text-muted-foreground">{c.paidPercent}% paid</div>
              </div>
              <Progress value={c.paidPercent} className="w-16 h-1.5" />
              <StatusBadge status={cfg.badge} label={cfg.label} />
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── TAB: Awards ── */
  const renderAwards = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Contract Awards</span>
        <Button size="sm" className="h-6 text-[9px] gap-1"><Award className="h-3 w-3" />New Award</Button>
      </div>
      <div className="space-y-1.5">
        {AWARDS.map(a => {
          const cfg = AWARD_STATUS_MAP[a.status];
          return (
            <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border hover:bg-muted/20 transition-colors">
              <Avatar className="h-7 w-7"><AvatarFallback className="text-[8px] bg-accent/10 text-accent">{a.freelancerAvatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium truncate">{a.projectTitle}</div>
                <div className="text-[8px] text-muted-foreground">{a.freelancerName} · Proposed {a.proposalDate}</div>
              </div>
              <div className="text-[10px] font-bold shrink-0">{a.bidAmount}</div>
              <StatusBadge status={cfg.badge} label={cfg.label} />
              <div className="flex gap-1">
                {a.status === 'pending-review' && (
                  <>
                    <Button size="sm" className="h-5 text-[8px] gap-0.5 px-2" onClick={() => toast.success('Award approved')}><CheckCircle2 className="h-2.5 w-2.5" />Approve</Button>
                    <Button variant="ghost" size="sm" className="h-5 text-[8px] px-1.5 text-[hsl(var(--state-blocked))]" onClick={() => toast.info('Award declined')}><Ban className="h-2.5 w-2.5" /></Button>
                  </>
                )}
                {a.status === 'pending-sign' && <Button size="sm" className="h-5 text-[8px] gap-0.5 px-2" onClick={() => toast.success('Contract signed')}><Pen className="h-2.5 w-2.5" />Sign</Button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── TAB: Changes ── */
  const renderChanges = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Change Requests</span>
        <Button size="sm" className="h-6 text-[9px] gap-1" onClick={() => { setNewCRContractId('c1'); setNewCROpen(true); }}><Plus className="h-3 w-3" />New Request</Button>
      </div>
      <div className="space-y-1.5">
        {CHANGE_REQUESTS.map(cr => {
          const cfg = CR_STATUS_MAP[cr.status];
          return (
            <div key={cr.id} onClick={() => setSelectedCR(cr)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border hover:bg-muted/20 transition-colors cursor-pointer">
              <Avatar className="h-6 w-6"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{cr.requestedByAvatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium truncate">{cr.description}</div>
                <div className="text-[8px] text-muted-foreground">{cr.contractTitle} · {cr.requestedBy} · {cr.createdAt}</div>
              </div>
              <Badge variant="secondary" className="text-[7px] capitalize shrink-0">{cr.type}</Badge>
              <span className="text-[9px] font-medium text-muted-foreground shrink-0">{cr.impact}</span>
              <StatusBadge status={cfg.badge} label={cfg.label} />
              {cr.status === 'pending' && (
                <div className="flex gap-1">
                  <Button size="sm" className="h-5 text-[8px] gap-0.5 px-2" onClick={e => { e.stopPropagation(); toast.success('Change approved'); }}><CheckCircle2 className="h-2.5 w-2.5" />Approve</Button>
                  <Button variant="ghost" size="sm" className="h-5 text-[8px] px-1.5 text-[hsl(var(--state-blocked))]" onClick={e => { e.stopPropagation(); toast.info('Change rejected'); }}><Ban className="h-2.5 w-2.5" /></Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── TAB: Analytics ── */
  const renderAnalytics = () => (
    <div className="space-y-4">
      <KPIBand>
        <KPICard label="Total Contracts" value={CONTRACTS.length} />
        <KPICard label="Active Value" value="$48K" change="+8%" trend="up" />
        <KPICard label="Completion Rate" value="80%" change="+5%" trend="up" />
        <KPICard label="Avg Duration" value="11 wks" />
      </KPIBand>
      <div className="grid grid-cols-2 gap-3">
        <SectionCard title="Contract Status Distribution">
          <div className="space-y-2">
            {([['active', 2], ['draft', 1], ['completed', 1], ['on-hold', 1], ['cancelled', 1]] as [ContractStatus, number][]).map(([status, count]) => {
              const cfg = CONTRACT_STATUS_MAP[status];
              return (
                <div key={status} className="flex items-center gap-2">
                  <StatusBadge status={cfg.badge} label={cfg.label} />
                  <div className="flex-1"><Progress value={(count / CONTRACTS.length) * 100} className="h-1.5" /></div>
                  <span className="text-[10px] font-medium w-4 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </SectionCard>
        <SectionCard title="Payment Progress">
          <div className="space-y-2">
            {CONTRACTS.filter(c => c.status !== 'cancelled').map(c => (
              <div key={c.id} className="space-y-0.5">
                <div className="flex items-center justify-between text-[9px]">
                  <span className="truncate max-w-[120px]">{c.projectTitle}</span>
                  <span className="font-medium">{c.paidPercent}%</span>
                </div>
                <Progress value={c.paidPercent} className="h-1" />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
      <SectionCard title="Change Request Summary" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />}>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Total', value: CHANGE_REQUESTS.length },
            { label: 'Approved', value: CHANGE_REQUESTS.filter(cr => cr.status === 'approved').length },
            { label: 'Pending', value: CHANGE_REQUESTS.filter(cr => cr.status === 'pending').length },
            { label: 'Rejected', value: CHANGE_REQUESTS.filter(cr => cr.status === 'rejected').length },
          ].map(s => (
            <div key={s.label} className="rounded-lg border p-2">
              <div className="text-sm font-bold">{s.value}</div>
              <div className="text-[8px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      {activeTab === 'contracts' && renderContracts()}
      {activeTab === 'awards' && renderAwards()}
      {activeTab === 'changes' && renderChanges()}
      {activeTab === 'analytics' && renderAnalytics()}

      <NewChangeRequestModal open={newCROpen} onClose={() => setNewCROpen(false)} contractId={newCRContractId} />

      {/* Contract detail drawer */}
      <Sheet open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
        <SheetContent className="w-[400px] sm:w-[440px] overflow-y-auto">
          {selectedContract && (() => {
            const c = selectedContract;
            const cfg = CONTRACT_STATUS_MAP[c.status];
            return (
              <>
                <SheetHeader><SheetTitle className="text-sm">{c.title}</SheetTitle></SheetHeader>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={cfg.badge} label={cfg.label} />
                    <span className="text-[10px] text-muted-foreground">Last activity: {c.lastActivity}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5"><Avatar className="h-6 w-6"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{c.clientAvatar}</AvatarFallback></Avatar><span className="text-[10px]">{c.clientName}</span></div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <div className="flex items-center gap-1.5"><Avatar className="h-6 w-6"><AvatarFallback className="text-[7px] bg-muted">{c.freelancerAvatar}</AvatarFallback></Avatar><span className="text-[10px]">{c.freelancerName}</span></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border p-2 text-center"><div className="text-[8px] text-muted-foreground">Total</div><div className="text-[11px] font-bold">{c.totalValue}</div></div>
                    <div className="rounded-lg border p-2 text-center"><div className="text-[8px] text-muted-foreground">Paid</div><div className="text-[11px] font-bold text-[hsl(var(--state-healthy))]">{c.paidAmount}</div></div>
                    <div className="rounded-lg border p-2 text-center"><div className="text-[8px] text-muted-foreground">Progress</div><div className="text-[11px] font-bold">{c.paidPercent}%</div></div>
                  </div>
                  <Progress value={c.paidPercent} className="h-2" />
                  <div className="rounded-lg border p-2 text-[10px] space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Start</span><span className="font-medium">{c.startDate}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">End</span><span className="font-medium">{c.endDate}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="font-medium">{c.createdAt}</span></div>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-semibold mb-2">Milestones</h4>
                    <div className="space-y-1.5">
                      {c.milestones.map((m, i) => (
                        <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md border">
                          <div className="h-5 w-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[8px] font-bold shrink-0">{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-medium truncate">{m.title}</div>
                            <div className="text-[8px] text-muted-foreground">Due: {m.dueDate}</div>
                          </div>
                          <span className="text-[9px] font-bold shrink-0">{m.amount}</span>
                          <span className={cn('text-[8px] font-medium capitalize', MILESTONE_STATUS_COLORS[m.status])}>{m.status}</span>
                          {m.status === 'submitted' && <Button size="sm" className="h-5 text-[7px] px-1.5">Approve</Button>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    {c.status === 'active' && (
                      <>
                        <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 gap-1" onClick={() => { setNewCRContractId(c.id); setNewCROpen(true); setSelectedContract(null); }}><Pen className="h-3 w-3" />Request Change</Button>
                        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => toast.info('Contract paused')}><Pause className="h-3 w-3" />Hold</Button>
                        <Button size="sm" className="h-7 text-[10px] gap-1" onClick={() => toast.success('Contract closed')}><CheckCircle2 className="h-3 w-3" />Close</Button>
                      </>
                    )}
                    {c.status === 'draft' && <Button size="sm" className="h-7 text-[10px] flex-1 gap-1" onClick={() => toast.success('Contract activated')}><Award className="h-3 w-3" />Award Contract</Button>}
                    {c.status === 'on-hold' && <Button size="sm" className="h-7 text-[10px] flex-1 gap-1" onClick={() => toast.success('Contract resumed')}><Play className="h-3 w-3" />Resume</Button>}
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Change request detail drawer */}
      <Sheet open={!!selectedCR} onOpenChange={() => setSelectedCR(null)}>
        <SheetContent className="w-[380px] sm:w-[400px] overflow-y-auto">
          {selectedCR && (() => {
            const cr = selectedCR;
            const cfg = CR_STATUS_MAP[cr.status];
            return (
              <>
                <SheetHeader><SheetTitle className="text-sm">Change Request</SheetTitle></SheetHeader>
                <div className="mt-4 space-y-3">
                  <StatusBadge status={cfg.badge} label={cfg.label} />
                  <div className="rounded-lg border p-3 text-[10px] space-y-1.5">
                    <div className="flex justify-between"><span className="text-muted-foreground">Contract</span><span className="font-medium">{cr.contractTitle}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Type</span><Badge variant="secondary" className="text-[7px] capitalize">{cr.type}</Badge></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Requested by</span><span className="font-medium">{cr.requestedBy}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="font-medium">{cr.createdAt}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Impact</span><span className="font-semibold text-[hsl(var(--state-caution))]">{cr.impact}</span></div>
                  </div>
                  <div className="rounded-lg border p-3 text-[10px]">
                    <h4 className="font-semibold mb-1">Description</h4>
                    <p className="text-muted-foreground">{cr.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border p-2"><div className="text-[8px] text-muted-foreground mb-0.5">Original</div><div className="text-[10px] font-medium">{cr.originalValue}</div></div>
                    <div className="rounded-lg border border-accent/30 bg-accent/5 p-2"><div className="text-[8px] text-muted-foreground mb-0.5">Proposed</div><div className="text-[10px] font-medium text-accent">{cr.proposedValue}</div></div>
                  </div>
                  {cr.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button size="sm" className="h-7 text-[10px] flex-1 gap-1" onClick={() => { toast.success('Change approved'); setSelectedCR(null); }}><CheckCircle2 className="h-3 w-3" />Approve Change</Button>
                      <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 gap-1 text-[hsl(var(--state-blocked))]" onClick={() => { toast.info('Change rejected'); setSelectedCR(null); }}><Ban className="h-3 w-3" />Reject</Button>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default ContractsPage;
