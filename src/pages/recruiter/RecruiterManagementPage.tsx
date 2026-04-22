import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, KPIBand, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Briefcase, Users, Clock, CheckCircle2, XCircle, Eye, Send,
  AlertTriangle, Plus, ChevronRight, TrendingUp, Star,
  BarChart3, Shield, Edit, Trash2, Pause, Play, Archive,
  Building2, MapPin, DollarSign, Globe, Calendar, FileText,
  UserCheck, Mail, Search, Filter, Download, RotateCcw,
  Zap, Crown, Target, Layers, Bell, ExternalLink, Hash,
  type LucideIcon,
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════ */
type MgmtTab = 'active' | 'pipeline' | 'team' | 'approvals' | 'credits' | 'archive';
type ReqStatus = 'draft' | 'pending_approval' | 'approved' | 'active' | 'paused' | 'filled' | 'closed' | 'expired' | 'flagged';

const STATUS_MAP: Record<ReqStatus, { label: string; badge: 'healthy' | 'caution' | 'blocked' | 'pending' | 'review' | 'degraded' | 'live' | 'premium' }> = {
  draft: { label: 'Draft', badge: 'pending' },
  pending_approval: { label: 'Pending Approval', badge: 'review' },
  approved: { label: 'Approved', badge: 'healthy' },
  active: { label: 'Active', badge: 'live' },
  paused: { label: 'Paused', badge: 'caution' },
  filled: { label: 'Filled', badge: 'healthy' },
  closed: { label: 'Closed', badge: 'degraded' },
  expired: { label: 'Expired', badge: 'blocked' },
  flagged: { label: 'Flagged', badge: 'blocked' },
};

interface Requisition {
  id: string;
  title: string;
  department: string;
  location: string;
  salary: string;
  type: string;
  remote: boolean;
  status: ReqStatus;
  priority: 'critical' | 'high' | 'normal' | 'low';
  hiringManager: string;
  recruiter: string;
  createdDate: string;
  lastUpdate: string;
  applicants: number;
  shortlisted: number;
  interviewed: number;
  offers: number;
  hires: number;
  creditsUsed: number;
  daysOpen: number;
  approvalChain: { name: string; role: string; status: 'approved' | 'pending' | 'rejected' }[];
  notes?: string;
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  activeReqs: number;
  totalHires: number;
  avgTimeToFill: number;
  status: 'online' | 'away' | 'offline';
}

const MOCK_REQS: Requisition[] = [
  {
    id: 'r1', title: 'Senior Frontend Engineer', department: 'Engineering', location: 'San Francisco, CA', salary: '$150K-$200K', type: 'Full-time', remote: true,
    status: 'active', priority: 'critical', hiringManager: 'Sarah Chen', recruiter: 'James Wilson',
    createdDate: 'Mar 15, 2025', lastUpdate: '2h ago', applicants: 142, shortlisted: 18, interviewed: 7, offers: 2, hires: 0, creditsUsed: 12, daysOpen: 28,
    approvalChain: [{ name: 'Sarah Chen', role: 'Hiring Manager', status: 'approved' }, { name: 'VP Eng', role: 'Department Head', status: 'approved' }, { name: 'HR Lead', role: 'HR', status: 'approved' }],
  },
  {
    id: 'r2', title: 'Product Designer', department: 'Design', location: 'New York, NY', salary: '$120K-$160K', type: 'Full-time', remote: true,
    status: 'active', priority: 'high', hiringManager: 'Lisa Park', recruiter: 'James Wilson',
    createdDate: 'Mar 22, 2025', lastUpdate: '1d ago', applicants: 87, shortlisted: 12, interviewed: 4, offers: 1, hires: 0, creditsUsed: 8, daysOpen: 21,
    approvalChain: [{ name: 'Lisa Park', role: 'Design Lead', status: 'approved' }, { name: 'VP Product', role: 'Department Head', status: 'approved' }],
  },
  {
    id: 'r3', title: 'Data Scientist', department: 'Data', location: 'Remote', salary: '$130K-$170K', type: 'Full-time', remote: true,
    status: 'pending_approval', priority: 'normal', hiringManager: 'Michael Torres', recruiter: 'Ana Patel',
    createdDate: 'Apr 8, 2025', lastUpdate: '4h ago', applicants: 0, shortlisted: 0, interviewed: 0, offers: 0, hires: 0, creditsUsed: 0, daysOpen: 5,
    approvalChain: [{ name: 'Michael Torres', role: 'Data Lead', status: 'approved' }, { name: 'CFO', role: 'Finance', status: 'pending' }],
  },
  {
    id: 'r4', title: 'DevOps Engineer', department: 'Infrastructure', location: 'Austin, TX', salary: '$140K-$180K', type: 'Full-time', remote: true,
    status: 'paused', priority: 'normal', hiringManager: 'David Kim', recruiter: 'James Wilson',
    createdDate: 'Feb 28, 2025', lastUpdate: '1w ago', applicants: 56, shortlisted: 8, interviewed: 3, offers: 0, hires: 0, creditsUsed: 6, daysOpen: 44,
    approvalChain: [{ name: 'David Kim', role: 'Infra Lead', status: 'approved' }, { name: 'VP Eng', role: 'Department Head', status: 'approved' }],
    notes: 'Paused: Budget reallocation pending Q2 review',
  },
  {
    id: 'r5', title: 'Mobile Developer', department: 'Engineering', location: 'Berlin, DE', salary: '€80K-€110K', type: 'Full-time', remote: true,
    status: 'filled', priority: 'high', hiringManager: 'Sarah Chen', recruiter: 'Ana Patel',
    createdDate: 'Jan 15, 2025', lastUpdate: '2w ago', applicants: 198, shortlisted: 22, interviewed: 9, offers: 3, hires: 1, creditsUsed: 15, daysOpen: 62,
    approvalChain: [{ name: 'Sarah Chen', role: 'Hiring Manager', status: 'approved' }, { name: 'VP Eng', role: 'Department Head', status: 'approved' }],
  },
  {
    id: 'r6', title: 'Marketing Manager', department: 'Marketing', location: 'London, UK', salary: '£70K-£90K', type: 'Full-time', remote: false,
    status: 'expired', priority: 'low', hiringManager: 'Elena Volkov', recruiter: 'James Wilson',
    createdDate: 'Dec 1, 2024', lastUpdate: '1mo ago', applicants: 45, shortlisted: 5, interviewed: 2, offers: 0, hires: 0, creditsUsed: 4, daysOpen: 90,
    approvalChain: [{ name: 'Elena Volkov', role: 'Marketing Lead', status: 'approved' }],
  },
  {
    id: 'r7', title: 'Backend Engineer', department: 'Engineering', location: 'Remote', salary: '$130K-$170K', type: 'Full-time', remote: true,
    status: 'draft', priority: 'normal', hiringManager: 'Sarah Chen', recruiter: 'Ana Patel',
    createdDate: 'Apr 12, 2025', lastUpdate: '3h ago', applicants: 0, shortlisted: 0, interviewed: 0, offers: 0, hires: 0, creditsUsed: 0, daysOpen: 1,
    approvalChain: [],
  },
  {
    id: 'r8', title: 'QA Lead', department: 'Engineering', location: 'Chicago, IL', salary: '$110K-$140K', type: 'Full-time', remote: false,
    status: 'flagged', priority: 'high', hiringManager: 'David Kim', recruiter: 'James Wilson',
    createdDate: 'Mar 1, 2025', lastUpdate: '3d ago', applicants: 34, shortlisted: 4, interviewed: 1, offers: 0, hires: 0, creditsUsed: 5, daysOpen: 43,
    approvalChain: [{ name: 'David Kim', role: 'QA Lead', status: 'approved' }, { name: 'Compliance', role: 'Compliance', status: 'rejected' }],
    notes: 'Flagged: Job description requires compliance review — language policy violation',
  },
];

const MOCK_TEAM: TeamMember[] = [
  { id: 'tm1', name: 'James Wilson', avatar: 'JW', role: 'Senior Recruiter', activeReqs: 4, totalHires: 12, avgTimeToFill: 34, status: 'online' },
  { id: 'tm2', name: 'Ana Patel', avatar: 'AP', role: 'Recruiter', activeReqs: 3, totalHires: 8, avgTimeToFill: 28, status: 'online' },
  { id: 'tm3', name: 'Marcus Lee', avatar: 'ML', role: 'Sourcer', activeReqs: 2, totalHires: 5, avgTimeToFill: 22, status: 'away' },
  { id: 'tm4', name: 'Priya Sharma', avatar: 'PS', role: 'Coordinator', activeReqs: 0, totalHires: 0, avgTimeToFill: 0, status: 'offline' },
];

const CREDIT_HISTORY = [
  { date: 'Apr 12', action: 'Boosted: Senior Frontend Engineer', amount: -3, balance: 42 },
  { date: 'Apr 10', action: 'Posted: Data Scientist', amount: -1, balance: 45 },
  { date: 'Apr 8', action: 'Premium Listing: Product Designer', amount: -5, balance: 46 },
  { date: 'Apr 5', action: 'Purchased: 25 credits', amount: 25, balance: 51 },
  { date: 'Apr 1', action: 'Monthly allocation', amount: 10, balance: 26 },
  { date: 'Mar 28', action: 'Boosted: Mobile Developer', amount: -3, balance: 16 },
];

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-[hsl(var(--state-blocked)/0.1)] text-[hsl(var(--state-blocked))]',
  high: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  normal: 'bg-muted text-muted-foreground',
  low: 'bg-muted/50 text-muted-foreground',
};

const ACTIVITY_FEED = [
  { actor: 'James Wilson', action: 'Moved 3 candidates to interview stage for Senior Frontend Engineer', time: '2h ago' },
  { actor: 'Ana Patel', action: 'Submitted Data Scientist requisition for approval', time: '4h ago' },
  { actor: 'System', action: 'Marketing Manager requisition expired after 90 days', time: '1d ago' },
  { actor: 'Compliance', action: 'Flagged QA Lead requisition — language policy review required', time: '3d ago' },
  { actor: 'Sarah Chen', action: 'Approved Mobile Developer offer to candidate #198', time: '2w ago' },
];

/* ═══════════════════════════════════════════════════════════
   Requisition Detail Drawer
   ═══════════════════════════════════════════════════════════ */
const ReqDetailDrawer: React.FC<{ req: Requisition | null; onClose: () => void }> = ({ req, onClose }) => {
  if (!req) return null;
  const cfg = STATUS_MAP[req.status];
  const funnelStages = [
    { label: 'Applied', value: req.applicants },
    { label: 'Shortlisted', value: req.shortlisted },
    { label: 'Interviewed', value: req.interviewed },
    { label: 'Offered', value: req.offers },
    { label: 'Hired', value: req.hires },
  ];

  return (
    <Sheet open={!!req} onOpenChange={onClose}>
      <SheetContent className="w-[460px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Briefcase className="h-4 w-4 text-accent" />Requisition Details</SheetTitle></SheetHeader>
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center shadow-sm"><Building2 className="h-6 w-6 text-muted-foreground/30" /></div>
            <div className="flex-1">
              <div className="text-[13px] font-bold">{req.title}</div>
              <div className="text-[10px] text-muted-foreground">{req.department} · {req.location}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <StatusBadge status={cfg.badge} label={cfg.label} />
                <Badge className={cn('text-[7px]', PRIORITY_COLORS[req.priority])}>{req.priority}</Badge>
              </div>
            </div>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-2 text-[9px]">
            <div className="flex items-center gap-1.5"><DollarSign className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Salary:</span><span className="font-semibold">{req.salary}</span></div>
            <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Open:</span><span className="font-semibold">{req.daysOpen} days</span></div>
            <div className="flex items-center gap-1.5"><Users className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Manager:</span><span className="font-semibold">{req.hiringManager}</span></div>
            <div className="flex items-center gap-1.5"><UserCheck className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Recruiter:</span><span className="font-semibold">{req.recruiter}</span></div>
            <div className="flex items-center gap-1.5"><Hash className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Credits:</span><span className="font-semibold">{req.creditsUsed}</span></div>
            <div className="flex items-center gap-1.5">{req.remote ? <Globe className="h-3 w-3 text-accent" /> : <MapPin className="h-3 w-3 text-muted-foreground" />}<span className="font-semibold">{req.remote ? 'Remote' : 'On-site'}</span></div>
          </div>

          {/* Notes / Flags */}
          {req.notes && (
            <div className={cn('rounded-2xl border p-3 text-[9px]', req.status === 'flagged' ? 'border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.05)]' : 'border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)]')}>
              <div className="flex items-center gap-1 font-semibold mb-0.5"><AlertTriangle className="h-3 w-3" />{req.status === 'flagged' ? 'Compliance Flag' : 'Note'}</div>
              <p className="text-muted-foreground">{req.notes}</p>
            </div>
          )}

          {/* Funnel */}
          <SectionCard title="Candidate Pipeline" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="flex items-end justify-between gap-1 h-20">
              {funnelStages.map((s, i) => {
                const maxVal = Math.max(...funnelStages.map(f => f.value), 1);
                const h = Math.max((s.value / maxVal) * 100, 8);
                return (
                  <div key={s.label} className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-bold">{s.value}</span>
                    <div className={cn('w-full rounded-t-lg transition-all', i === funnelStages.length - 1 && s.value > 0 ? 'bg-[hsl(var(--state-healthy))]' : 'bg-accent/40')} style={{ height: `${h}%` }} />
                    <span className="text-[7px] text-muted-foreground text-center">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Approval Chain */}
          {req.approvalChain.length > 0 && (
            <SectionCard title="Approval Chain" icon={<Shield className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-1.5">
                {req.approvalChain.map((a, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className={cn('h-5 w-5 rounded-full flex items-center justify-center shrink-0', a.status === 'approved' ? 'bg-[hsl(var(--state-healthy)/0.1)]' : a.status === 'rejected' ? 'bg-[hsl(var(--state-blocked)/0.1)]' : 'bg-muted')}>
                      {a.status === 'approved' ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /> : a.status === 'rejected' ? <XCircle className="h-3 w-3 text-[hsl(var(--state-blocked))]" /> : <Clock className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-medium">{a.name}</div>
                      <div className="text-[7px] text-muted-foreground">{a.role}</div>
                    </div>
                    <Badge variant="secondary" className="text-[6px] capitalize">{a.status}</Badge>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-1.5 pt-2 border-t">
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] rounded-xl" asChild><Link to="/recruiter/talent"><Search className="h-3 w-3 mr-1" />Find Candidates</Link></Button>
              <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] rounded-xl" onClick={() => toast.info('View applicants')}><Users className="h-3 w-3 mr-1" />Applicants</Button>
            </div>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] rounded-xl" onClick={() => toast.info('Edit requisition')}><Edit className="h-3 w-3 mr-1" />Edit</Button>
              {req.status === 'active' && <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] rounded-xl" onClick={() => toast.info('Paused')}><Pause className="h-3 w-3 mr-1" />Pause</Button>}
              {req.status === 'paused' && <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] rounded-xl" onClick={() => toast.info('Resumed')}><Play className="h-3 w-3 mr-1" />Resume</Button>}
            </div>
            {['expired', 'closed'].includes(req.status) && (
              <Button variant="outline" size="sm" className="h-7 text-[10px] w-full rounded-xl" onClick={() => toast.success('Requisition reopened')}><RotateCcw className="h-3 w-3 mr-1" />Reopen</Button>
            )}
            {req.status === 'flagged' && (
              <Button variant="outline" size="sm" className="h-7 text-[10px] w-full rounded-xl text-[hsl(var(--state-caution))]" onClick={() => toast.info('Sent for review')}><Shield className="h-3 w-3 mr-1" />Submit for Compliance Review</Button>
            )}
            <Button variant="outline" size="sm" className="h-7 text-[10px] w-full rounded-xl" onClick={() => toast.info('Messaged hiring manager')}><Mail className="h-3 w-3 mr-1" />Message Hiring Manager</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const RecruiterManagementPage: React.FC = () => {
  const { activeRole } = useRole();
  const [activeTab, setActiveTab] = useState<MgmtTab>('active');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReqStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const selectedReq = MOCK_REQS.find(r => r.id === selectedReqId) || null;

  const getTabReqs = (tab: MgmtTab): Requisition[] => {
    switch (tab) {
      case 'active': return MOCK_REQS.filter(r => ['active', 'paused', 'flagged'].includes(r.status));
      case 'pipeline': return MOCK_REQS.filter(r => ['active'].includes(r.status));
      case 'approvals': return MOCK_REQS.filter(r => ['draft', 'pending_approval'].includes(r.status));
      case 'credits': return MOCK_REQS;
      case 'archive': return MOCK_REQS.filter(r => ['filled', 'closed', 'expired'].includes(r.status));
      default: return MOCK_REQS;
    }
  };

  let filteredReqs = getTabReqs(activeTab);
  if (searchQuery) filteredReqs = filteredReqs.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.department.toLowerCase().includes(searchQuery.toLowerCase()));
  if (statusFilter !== 'all') filteredReqs = filteredReqs.filter(r => r.status === statusFilter);
  if (priorityFilter !== 'all') filteredReqs = filteredReqs.filter(r => r.priority === priorityFilter);

  const activeCount = MOCK_REQS.filter(r => r.status === 'active').length;
  const pendingCount = MOCK_REQS.filter(r => r.status === 'pending_approval').length;
  const totalApplicants = MOCK_REQS.reduce((s, r) => s + r.applicants, 0);
  const totalHires = MOCK_REQS.reduce((s, r) => s + r.hires, 0);
  const flaggedCount = MOCK_REQS.filter(r => r.status === 'flagged').length;

  const TABS: { id: MgmtTab; label: string; icon: LucideIcon; count?: number }[] = [
    { id: 'active', label: 'Active Jobs', icon: Briefcase, count: activeCount },
    { id: 'pipeline', label: 'Pipeline', icon: TrendingUp },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'approvals', label: 'Approvals', icon: Shield, count: pendingCount },
    { id: 'credits', label: 'Credits', icon: Zap },
    { id: 'archive', label: 'Archive', icon: Archive },
  ];

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Target className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Recruiter Dashboard</span>
        <StatusBadge status="live" label={`${activeCount} Active`} />
        {flaggedCount > 0 && <StatusBadge status="blocked" label={`${flaggedCount} Flagged`} />}
        {pendingCount > 0 && <StatusBadge status="review" label={`${pendingCount} Pending`} />}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button>
        <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" asChild><Link to="/recruiter/jobs"><Plus className="h-3 w-3" />New Requisition</Link></Button>
      </div>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Alerts" className="!rounded-2xl">
        <div className="space-y-1.5">
          {flaggedCount > 0 && (
            <div className="flex items-start gap-2 p-1.5 rounded-xl bg-[hsl(var(--state-blocked)/0.05)] cursor-pointer hover:bg-[hsl(var(--state-blocked)/0.1)] transition-all" onClick={() => setActiveTab('active')}>
              <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-blocked))] shrink-0 mt-0.5" />
              <div><div className="text-[9px] font-medium">{flaggedCount} flagged requisition{flaggedCount > 1 ? 's' : ''}</div><div className="text-[7px] text-muted-foreground">Requires compliance review</div></div>
            </div>
          )}
          {MOCK_REQS.some(r => r.daysOpen > 40 && r.status === 'active') && (
            <div className="flex items-start gap-2 p-1.5 rounded-xl bg-[hsl(var(--state-caution)/0.05)]">
              <Clock className="h-3.5 w-3.5 text-[hsl(var(--state-caution))] shrink-0 mt-0.5" />
              <div><div className="text-[9px] font-medium">Aging requisitions</div><div className="text-[7px] text-muted-foreground">1 open 40+ days</div></div>
            </div>
          )}
          {pendingCount > 0 && (
            <div className="flex items-start gap-2 p-1.5 rounded-xl bg-accent/5 cursor-pointer hover:bg-accent/10 transition-all" onClick={() => setActiveTab('approvals')}>
              <Shield className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
              <div><div className="text-[9px] font-medium">{pendingCount} awaiting approval</div><div className="text-[7px] text-muted-foreground">Review and approve</div></div>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Credits" className="!rounded-2xl">
        <div className="text-center mb-2">
          <div className="text-xl font-bold">42</div>
          <div className="text-[8px] text-muted-foreground">credits remaining</div>
          <Progress value={42} className="h-1.5 mt-1" />
        </div>
        <Button variant="outline" size="sm" className="h-6 text-[8px] w-full rounded-xl" onClick={() => setActiveTab('credits')}>Manage Credits</Button>
      </SectionCard>

      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { label: 'Post new job', icon: Plus, to: '/recruiter/jobs' },
            { label: 'Search talent', icon: Search, to: '/recruiter/talent' },
            { label: 'View interviews', icon: Calendar, to: '/recruiter/interviews' },
            { label: 'Manage offers', icon: Star, to: '/recruiter/offers' },
          ].map(a => (
            <Link key={a.label} to={a.to} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl text-[9px] hover:bg-muted/30 transition-all font-medium group">
              <a.icon className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" /><span className="group-hover:text-accent transition-colors">{a.label}</span>
              <ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" />
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom Section ── */
  const bottomSection = (
    <div className="px-1">
      <div className="text-[10px] font-bold mb-2 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-accent" />Recent Activity</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {ACTIVITY_FEED.map((a, i) => (
          <div key={i} className="shrink-0 rounded-2xl border bg-card px-3.5 py-2.5 min-w-[220px] hover:shadow-sm transition-all">
            <div className="flex items-center gap-1.5 mb-0.5"><Avatar className="h-4 w-4 ring-1 ring-muted/40"><AvatarFallback className="text-[5px] bg-accent/10 text-accent font-bold">{a.actor[0]}</AvatarFallback></Avatar><span className="text-[9px] font-semibold">{a.actor}</span></div>
            <p className="text-[8px] text-muted-foreground line-clamp-2">{a.action}</p>
            <div className="text-[7px] text-muted-foreground mt-0.5">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52" bottomSection={bottomSection}>
      <KPIBand className="mb-4">
        <KPICard label="Active Reqs" value={activeCount} change={`${pendingCount} pending`} trend="neutral" />
        <KPICard label="Total Applicants" value={totalApplicants} change="+23% this month" trend="up" />
        <KPICard label="Avg Time-to-Fill" value="34d" change="-3d vs last quarter" trend="up" />
        <KPICard label="Hires YTD" value={totalHires} change="on target" trend="up" />
      </KPIBand>

      {/* Flagged banner */}
      {flaggedCount > 0 && activeTab === 'active' && (
        <div className="rounded-2xl border border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.05)] p-3.5 flex items-center gap-3 mb-3">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--state-blocked))] shrink-0" />
          <div className="flex-1">
            <div className="text-[11px] font-semibold">{flaggedCount} Requisition{flaggedCount > 1 ? 's' : ''} Flagged</div>
            <div className="text-[9px] text-muted-foreground">Compliance review required before these jobs can proceed.</div>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl">Review</Button>
        </div>
      )}

      {/* Tab Nav */}
      <div className="flex items-center gap-0.5 p-1 rounded-2xl bg-muted/30 mb-4 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn(
            'flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-semibold rounded-xl transition-all duration-200 shrink-0',
            activeTab === t.id ? 'bg-background shadow-sm text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          )}>
            <t.icon className="h-3 w-3" />{t.label}
            {t.count !== undefined && <span className={cn('text-[7px] rounded-full px-1.5', activeTab === t.id ? 'bg-accent/10 text-accent' : 'bg-muted')}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── Active Jobs / Pipeline / Archive tabs ── */}
      {['active', 'pipeline', 'archive'].includes(activeTab) && (
        <>
          {/* Filter bar */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input placeholder="Search requisitions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full h-8 pl-8 pr-3 rounded-xl border bg-background text-[10px] focus:ring-2 focus:ring-accent/30 focus:outline-none" />
            </div>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="h-8 rounded-xl border bg-background px-2 text-[10px]">
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Req List */}
          {filteredReqs.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed p-10 text-center">
              <Briefcase className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-[11px] font-bold mb-1">No requisitions found</div>
              <div className="text-[9px] text-muted-foreground mb-3">Try adjusting your filters or create a new requisition.</div>
              <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl" asChild><Link to="/recruiter/jobs">Create Requisition</Link></Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReqs.map(req => {
                const cfg = STATUS_MAP[req.status];
                return (
                  <div key={req.id} className={cn(
                    'rounded-2xl border p-3.5 hover:shadow-md transition-all cursor-pointer group',
                    selectedReqId === req.id && 'ring-1 ring-accent',
                    req.status === 'flagged' && 'border-[hsl(var(--state-blocked)/0.3)]',
                    req.status === 'draft' && 'border-dashed',
                  )} onClick={() => setSelectedReqId(req.id)}>
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0 shadow-sm">
                        <Building2 className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[11px] font-bold truncate group-hover:text-accent transition-colors">{req.title}</span>
                            <StatusBadge status={cfg.badge} label={cfg.label} />
                            <Badge className={cn('text-[6px]', PRIORITY_COLORS[req.priority])}>{req.priority}</Badge>
                          </div>
                        </div>
                        <div className="text-[9px] text-muted-foreground">{req.department} · {req.salary} · {req.location}{req.remote ? ' (Remote)' : ''}</div>
                        <div className="flex items-center gap-3 mt-1.5 text-[8px] text-muted-foreground">
                          <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{req.applicants} applicants</span>
                          <span className="flex items-center gap-0.5"><UserCheck className="h-2.5 w-2.5" />{req.shortlisted} shortlisted</span>
                          <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{req.daysOpen}d open</span>
                          <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{req.lastUpdate}</span>
                        </div>
                        {/* Inline pipeline */}
                        {req.status === 'active' && (
                          <div className="flex items-center gap-1 mt-2">
                            {[
                              { label: 'App', val: req.applicants },
                              { label: 'Short', val: req.shortlisted },
                              { label: 'Int', val: req.interviewed },
                              { label: 'Offer', val: req.offers },
                              { label: 'Hire', val: req.hires },
                            ].map((s, i) => (
                              <React.Fragment key={s.label}>
                                <div className="flex items-center gap-0.5">
                                  <span className="text-[7px] text-muted-foreground">{s.label}</span>
                                  <span className="text-[8px] font-bold">{s.val}</span>
                                </div>
                                {i < 4 && <ChevronRight className="h-2 w-2 text-muted-foreground/30" />}
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Quick actions */}
                    <div className="flex items-center gap-1.5 mt-2.5 ml-[52px]">
                      <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e => { e.stopPropagation(); setSelectedReqId(req.id); }}><Eye className="h-2 w-2 mr-0.5" />Details</Button>
                      <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e => { e.stopPropagation(); toast.info('View applicants'); }}><Users className="h-2 w-2 mr-0.5" />Applicants</Button>
                      {req.status === 'active' && <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e => { e.stopPropagation(); toast.info('Paused'); }}><Pause className="h-2 w-2 mr-0.5" />Pause</Button>}
                      {req.status === 'paused' && <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e => { e.stopPropagation(); toast.info('Resumed'); }}><Play className="h-2 w-2 mr-0.5" />Resume</Button>}
                      {req.status === 'draft' && <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e => { e.stopPropagation(); toast.info('Submitted for approval'); }}><Send className="h-2 w-2 mr-0.5" />Submit</Button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Team Tab ── */}
      {activeTab === 'team' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
            <KPICard label="Team Members" value={MOCK_TEAM.length} change="active recruiters" trend="neutral" />
            <KPICard label="Total Active Reqs" value={MOCK_TEAM.reduce((s, t) => s + t.activeReqs, 0)} change="across team" trend="neutral" />
            <KPICard label="Team Hires" value={MOCK_TEAM.reduce((s, t) => s + t.totalHires, 0)} change="year to date" trend="up" />
            <KPICard label="Avg Fill Time" value={`${Math.round(MOCK_TEAM.filter(t => t.avgTimeToFill > 0).reduce((s, t) => s + t.avgTimeToFill, 0) / MOCK_TEAM.filter(t => t.avgTimeToFill > 0).length)}d`} change="team average" trend="up" />
          </div>
          <div className="space-y-2">
            {MOCK_TEAM.map(member => (
              <div key={member.id} className="rounded-2xl border p-3.5 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10 ring-2 ring-muted/30"><AvatarFallback className="text-xs bg-accent/10 text-accent font-bold">{member.avatar}</AvatarFallback></Avatar>
                    <div className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card', member.status === 'online' ? 'bg-[hsl(var(--state-healthy))]' : member.status === 'away' ? 'bg-[hsl(var(--state-caution))]' : 'bg-muted')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold">{member.name}</div>
                    <div className="text-[9px] text-muted-foreground">{member.role}</div>
                  </div>
                  <div className="flex items-center gap-4 text-[9px] text-center">
                    <div><div className="font-bold text-sm">{member.activeReqs}</div><div className="text-muted-foreground">Active</div></div>
                    <div><div className="font-bold text-sm">{member.totalHires}</div><div className="text-muted-foreground">Hires</div></div>
                    <div><div className="font-bold text-sm">{member.avgTimeToFill || '—'}d</div><div className="text-muted-foreground">Avg Fill</div></div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg"><Mail className="h-2.5 w-2.5 mr-0.5" />Message</Button>
                    <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg"><Eye className="h-2.5 w-2.5 mr-0.5" />Profile</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[9px] w-full rounded-xl"><Plus className="h-3 w-3 mr-1" />Invite Team Member</Button>
        </div>
      )}

      {/* ── Approvals Tab ── */}
      {activeTab === 'approvals' && (
        <div className="space-y-3">
          {filteredReqs.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed p-10 text-center">
              <Shield className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-[11px] font-bold mb-1">No pending approvals</div>
              <div className="text-[9px] text-muted-foreground">All requisitions have been reviewed.</div>
            </div>
          ) : (
            filteredReqs.map(req => {
              const cfg = STATUS_MAP[req.status];
              return (
                <div key={req.id} className={cn('rounded-2xl border p-4 hover:shadow-md transition-all', req.status === 'pending_approval' && 'border-accent/30 bg-accent/5')}>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0 shadow-sm"><Briefcase className="h-5 w-5 text-muted-foreground/40" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[11px] font-bold">{req.title}</span>
                        <StatusBadge status={cfg.badge} label={cfg.label} />
                      </div>
                      <div className="text-[9px] text-muted-foreground">{req.department} · {req.salary} · Requested by {req.hiringManager}</div>
                      {/* Approval chain inline */}
                      <div className="flex items-center gap-2 mt-2">
                        {req.approvalChain.map((a, i) => (
                          <React.Fragment key={i}>
                            <div className="flex items-center gap-1">
                              <div className={cn('h-4 w-4 rounded-full flex items-center justify-center', a.status === 'approved' ? 'bg-[hsl(var(--state-healthy)/0.1)]' : a.status === 'rejected' ? 'bg-[hsl(var(--state-blocked)/0.1)]' : 'bg-muted')}>
                                {a.status === 'approved' ? <CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" /> : a.status === 'rejected' ? <XCircle className="h-2.5 w-2.5 text-[hsl(var(--state-blocked))]" /> : <Clock className="h-2.5 w-2.5 text-muted-foreground" />}
                              </div>
                              <span className="text-[8px] font-medium">{a.name}</span>
                            </div>
                            {i < req.approvalChain.length - 1 && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/30" />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {req.status === 'pending_approval' && (
                        <>
                          <Button size="sm" className="h-7 text-[9px] rounded-xl" onClick={() => toast.success('Approved')}><CheckCircle2 className="h-3 w-3 mr-1" />Approve</Button>
                          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl" onClick={() => toast.info('Rejected')}><XCircle className="h-3 w-3 mr-1" />Reject</Button>
                        </>
                      )}
                      {req.status === 'draft' && <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl" onClick={() => toast.info('Submitted')}><Send className="h-3 w-3 mr-1" />Submit</Button>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Credits Tab ── */}
      {activeTab === 'credits' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 mb-1">
            <KPICard label="Balance" value="42" change="credits available" trend="neutral" />
            <KPICard label="Used This Month" value="9" change="across 3 reqs" trend="neutral" />
            <KPICard label="Allocation" value="10/mo" change="next: May 1" trend="neutral" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { name: 'Starter', credits: 10, price: '$29', features: ['10 job posts', 'Basic listing'] },
              { name: 'Growth', credits: 25, price: '$59', features: ['25 job posts', 'Priority listing', 'Analytics'], popular: true },
              { name: 'Enterprise', credits: 100, price: '$179', features: ['100 job posts', 'Premium listing', 'Dedicated support'] },
            ].map(pkg => (
              <div key={pkg.name} className={cn('rounded-2xl border p-3 text-center relative', pkg.popular && 'border-accent ring-1 ring-accent/20')}>
                {pkg.popular && <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-[6px] bg-accent text-accent-foreground">Popular</Badge>}
                <div className="text-[10px] font-bold mb-0.5">{pkg.name}</div>
                <div className="text-lg font-bold">{pkg.credits}</div>
                <div className="text-[8px] text-muted-foreground mb-1">credits · {pkg.price}</div>
                <div className="space-y-0.5 text-[8px] text-muted-foreground mb-2">
                  {pkg.features.map(f => <div key={f} className="flex items-center gap-1 justify-center"><CheckCircle2 className="h-2 w-2 text-accent" />{f}</div>)}
                </div>
                <Button variant={pkg.popular ? 'default' : 'outline'} size="sm" className="h-6 text-[8px] w-full rounded-xl" onClick={() => toast.success(`Purchased ${pkg.credits} credits`)}>Buy</Button>
              </div>
            ))}
          </div>

          <SectionCard title="Credit History" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1">
              {CREDIT_HISTORY.map((entry, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[9px] py-1 border-b last:border-0">
                  <span className="text-muted-foreground w-14 shrink-0">{entry.date}</span>
                  <span className="flex-1 truncate">{entry.action}</span>
                  <span className={cn('font-bold shrink-0', entry.amount > 0 ? 'text-[hsl(var(--state-healthy))]' : 'text-[hsl(var(--state-blocked))]')}>{entry.amount > 0 ? '+' : ''}{entry.amount}</span>
                  <span className="text-muted-foreground w-8 text-right shrink-0">{entry.balance}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      <ReqDetailDrawer req={selectedReq} onClose={() => setSelectedReqId(null)} />
    </DashboardLayout>
  );
};

export default RecruiterManagementPage;
