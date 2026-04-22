import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Plus, Send, CheckCircle2, XCircle, Clock, DollarSign,
  FileText, Search, MoreHorizontal, BarChart3, Users,
  Building2, Briefcase, Award, AlertTriangle, Shield,
  X, Eye, ExternalLink, Edit, Copy, Archive,
  TrendingUp, Calendar, UserCheck, Mail, Zap,
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Mock Data
   ═══════════════════════════════════════════════════════════ */
type OfferStatus = 'draft' | 'pending-approval' | 'sent' | 'accepted' | 'declined' | 'expired' | 'withdrawn';
type OfferTab = 'all' | 'active' | 'accepted' | 'closed';

const STATUS_CFG: Record<OfferStatus, { label: string; badge: 'pending' | 'healthy' | 'caution' | 'blocked' | 'review' | 'degraded' | 'live' }> = {
  draft: { label: 'Draft', badge: 'pending' },
  'pending-approval': { label: 'Awaiting Approval', badge: 'review' },
  sent: { label: 'Sent', badge: 'live' },
  accepted: { label: 'Accepted', badge: 'healthy' },
  declined: { label: 'Declined', badge: 'blocked' },
  expired: { label: 'Expired', badge: 'degraded' },
  withdrawn: { label: 'Withdrawn', badge: 'caution' },
};

interface TimelineEvent {
  action: string;
  actor: string;
  date: string;
}

interface Offer {
  id: string;
  candidateName: string;
  candidateAvatar: string;
  candidateHeadline: string;
  jobTitle: string;
  status: OfferStatus;
  baseSalary: string;
  equity: string;
  bonus: string;
  startDate: string;
  expiresAt: string;
  createdAt: string;
  lastUpdate: string;
  approver: string;
  approvalStatus: 'approved' | 'pending' | 'rejected' | null;
  notes: string;
  timeline: TimelineEvent[];
}

const MOCK_OFFERS: Offer[] = [
  {
    id: 'of1', candidateName: 'Carlos Diaz', candidateAvatar: 'CD', candidateHeadline: 'Senior Frontend Engineer',
    jobTitle: 'Senior Frontend Engineer', status: 'sent', baseSalary: '$185,000', equity: '0.15%', bonus: '$15,000 signing',
    startDate: 'May 15, 2025', expiresAt: 'Apr 25, 2025', createdAt: 'Apr 8, 2025', lastUpdate: '2 days ago',
    approver: 'Sarah Chen', approvalStatus: 'approved', notes: 'Strong candidate, fast-tracked approval.',
    timeline: [
      { action: 'Offer sent to candidate', actor: 'Sarah Chen', date: 'Apr 10' },
      { action: 'Approved by VP Engineering', actor: 'Sarah Chen', date: 'Apr 9' },
      { action: 'Offer created', actor: 'Marcus Johnson', date: 'Apr 8' },
    ],
  },
  {
    id: 'of2', candidateName: 'Sophia Lang', candidateAvatar: 'SL', candidateHeadline: 'Engineering Manager',
    jobTitle: 'Engineering Manager', status: 'pending-approval', baseSalary: '$210,000', equity: '0.25%', bonus: '$20,000 signing',
    startDate: 'Jun 1, 2025', expiresAt: 'May 1, 2025', createdAt: 'Apr 11, 2025', lastUpdate: '1 day ago',
    approver: 'Sarah Chen', approvalStatus: 'pending', notes: 'Awaiting VP approval. Comp above band — justification attached.',
    timeline: [
      { action: 'Submitted for approval', actor: 'Marcus Johnson', date: 'Apr 11' },
      { action: 'Offer created', actor: 'Marcus Johnson', date: 'Apr 11' },
    ],
  },
  {
    id: 'of3', candidateName: 'Wei Liu', candidateAvatar: 'WL', candidateHeadline: 'DevOps Engineer',
    jobTitle: 'DevOps Engineer', status: 'draft', baseSalary: '$165,000', equity: '0.10%', bonus: '$10,000 signing',
    startDate: 'May 20, 2025', expiresAt: '', createdAt: 'Apr 12, 2025', lastUpdate: '3 hours ago',
    approver: '', approvalStatus: null, notes: 'Draft — pending final interview debrief.',
    timeline: [{ action: 'Offer created as draft', actor: 'Marcus Johnson', date: 'Apr 12' }],
  },
  {
    id: 'of4', candidateName: 'Elena Kowalski', candidateAvatar: 'EK', candidateHeadline: 'Senior Full-Stack Engineer',
    jobTitle: 'Senior Frontend Engineer', status: 'accepted', baseSalary: '$195,000', equity: '0.20%', bonus: '$18,000 signing',
    startDate: 'Apr 28, 2025', expiresAt: 'Apr 15, 2025', createdAt: 'Mar 28, 2025', lastUpdate: '1 week ago',
    approver: 'Sarah Chen', approvalStatus: 'approved', notes: 'Accepted! Onboarding scheduled.',
    timeline: [
      { action: 'Candidate accepted offer', actor: 'Elena Kowalski', date: 'Apr 5' },
      { action: 'Offer sent', actor: 'Marcus Johnson', date: 'Apr 1' },
      { action: 'Approved', actor: 'Sarah Chen', date: 'Mar 31' },
      { action: 'Offer created', actor: 'Marcus Johnson', date: 'Mar 28' },
    ],
  },
  {
    id: 'of5', candidateName: 'James Rodriguez', candidateAvatar: 'JR', candidateHeadline: 'DevOps Lead',
    jobTitle: 'DevOps Engineer', status: 'declined', baseSalary: '$155,000', equity: '0.08%', bonus: '$8,000 signing',
    startDate: 'May 1, 2025', expiresAt: 'Apr 10, 2025', createdAt: 'Mar 20, 2025', lastUpdate: '2 weeks ago',
    approver: 'Sarah Chen', approvalStatus: 'approved', notes: 'Declined — accepted competing offer with higher comp.',
    timeline: [
      { action: 'Candidate declined', actor: 'James Rodriguez', date: 'Apr 2' },
      { action: 'Offer sent', actor: 'Marcus Johnson', date: 'Mar 25' },
      { action: 'Approved', actor: 'Sarah Chen', date: 'Mar 24' },
      { action: 'Offer created', actor: 'Marcus Johnson', date: 'Mar 20' },
    ],
  },
  {
    id: 'of6', candidateName: 'Priya Sharma', candidateAvatar: 'PS', candidateHeadline: 'ML Engineer',
    jobTitle: 'ML Engineer', status: 'expired', baseSalary: '$175,000', equity: '0.12%', bonus: '$12,000 signing',
    startDate: 'Apr 15, 2025', expiresAt: 'Mar 30, 2025', createdAt: 'Mar 10, 2025', lastUpdate: '3 weeks ago',
    approver: 'Sarah Chen', approvalStatus: 'approved', notes: 'No response from candidate within deadline.',
    timeline: [
      { action: 'Offer expired', actor: 'System', date: 'Mar 30' },
      { action: 'Reminder sent', actor: 'System', date: 'Mar 28' },
      { action: 'Offer sent', actor: 'Marcus Johnson', date: 'Mar 15' },
      { action: 'Offer created', actor: 'Marcus Johnson', date: 'Mar 10' },
    ],
  },
  {
    id: 'of7', candidateName: 'Ryan Park', candidateAvatar: 'RP', candidateHeadline: 'Frontend Developer',
    jobTitle: 'Senior Frontend Engineer', status: 'withdrawn', baseSalary: '$160,000', equity: '0.10%', bonus: '$10,000 signing',
    startDate: 'May 5, 2025', expiresAt: 'Apr 20, 2025', createdAt: 'Mar 25, 2025', lastUpdate: '2 weeks ago',
    approver: 'Sarah Chen', approvalStatus: 'rejected', notes: 'Withdrawn — approval rejected due to budget freeze.',
    timeline: [
      { action: 'Offer withdrawn', actor: 'Marcus Johnson', date: 'Mar 28' },
      { action: 'Approval rejected — budget freeze', actor: 'Sarah Chen', date: 'Mar 27' },
      { action: 'Submitted for approval', actor: 'Marcus Johnson', date: 'Mar 25' },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════
   Create Offer Modal
   ═══════════════════════════════════════════════════════════ */
const CreateOfferModal: React.FC<{ open: boolean; onClose: () => void; editOffer?: Offer }> = ({ open, onClose, editOffer }) => {
  const [step, setStep] = useState<'comp' | 'details' | 'review'>('comp');
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative flex justify-center items-start pt-[6vh] px-4">
        <div className="w-full max-w-lg bg-card rounded-2xl border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="font-semibold text-lg">{editOffer ? 'Edit Offer' : 'Create Offer'}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2 mb-4">
              {['comp', 'details', 'review'].map((s, i) => (
                <React.Fragment key={s}>
                  <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors',
                    step === s ? 'border-accent bg-accent text-accent-foreground' : i < ['comp', 'details', 'review'].indexOf(step) ? 'border-accent bg-accent/10 text-accent' : 'border-muted text-muted-foreground'
                  )}>{i + 1}</div>
                  {i < 2 && <div className={cn('flex-1 h-0.5', i < ['comp', 'details', 'review'].indexOf(step) ? 'bg-accent' : 'bg-muted')} />}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="p-6 max-h-[55vh] overflow-y-auto space-y-4">
            {step === 'comp' && (
              <>
                <div><label className="text-xs font-medium mb-1 block">Candidate *</label><input className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" defaultValue={editOffer?.candidateName || ''} placeholder="Search candidate..." /></div>
                <div><label className="text-xs font-medium mb-1 block">Position *</label>
                  <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none">
                    <option>Senior Frontend Engineer</option><option>DevOps Engineer</option><option>Engineering Manager</option><option>ML Engineer</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium mb-1 block">Base Salary *</label><input className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" defaultValue={editOffer?.baseSalary || ''} placeholder="$150,000" /></div>
                  <div><label className="text-xs font-medium mb-1 block">Equity</label><input className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" defaultValue={editOffer?.equity || ''} placeholder="0.15%" /></div>
                </div>
                <div><label className="text-xs font-medium mb-1 block">Signing Bonus</label><input className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" defaultValue={editOffer?.bonus || ''} placeholder="$15,000" /></div>
              </>
            )}
            {step === 'details' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium mb-1 block">Start Date *</label><input type="date" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" /></div>
                  <div><label className="text-xs font-medium mb-1 block">Offer Expires *</label><input type="date" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" /></div>
                </div>
                <div><label className="text-xs font-medium mb-1 block">Approver *</label>
                  <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none">
                    <option>Sarah Chen — VP Engineering</option><option>Lisa Park — HR Director</option>
                  </select>
                </div>
                <div><label className="text-xs font-medium mb-1 block">Notes / Justification</label><textarea className="w-full h-20 rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none" placeholder="Justification for above-band comp, special terms..." /></div>
                <div><label className="text-xs font-medium mb-1 block">Attach Offer Letter</label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors">
                    <FileText className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />Click or drag to upload offer letter PDF
                  </div>
                </div>
              </>
            )}
            {step === 'review' && (
              <div className="space-y-3">
                <div className="rounded-lg border p-3 bg-muted/30 text-xs space-y-1.5">
                  {[
                    { l: 'Candidate', v: editOffer?.candidateName || '—' },
                    { l: 'Position', v: 'Senior Frontend Engineer' },
                    { l: 'Base Salary', v: editOffer?.baseSalary || '$—' },
                    { l: 'Equity', v: editOffer?.equity || '—' },
                    { l: 'Bonus', v: editOffer?.bonus || '—' },
                    { l: 'Start Date', v: '—' },
                    { l: 'Expires', v: '—' },
                    { l: 'Approver', v: 'Sarah Chen' },
                  ].map(r => (
                    <div key={r.l} className="flex justify-between"><span className="text-muted-foreground">{r.l}</span><span className="font-medium">{r.v}</span></div>
                  ))}
                </div>
                <div className="rounded-lg border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3 flex items-center gap-2 text-[10px]">
                  <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))] shrink-0" />
                  <span>This offer will be submitted for approval before it can be sent to the candidate.</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between px-6 py-4 border-t">
            {step !== 'comp' ? <Button variant="outline" onClick={() => setStep(step === 'review' ? 'details' : 'comp')}>Back</Button> : <div />}
            {step === 'review' ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { toast.success('Saved as draft'); onClose(); }}>Save Draft</Button>
                <Button onClick={() => { toast.success('Offer submitted for approval'); onClose(); }}><Send className="h-3 w-3 mr-1" />Submit for Approval</Button>
              </div>
            ) : (
              <Button onClick={() => setStep(step === 'comp' ? 'details' : 'review')}>Continue</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Banners
   ═══════════════════════════════════════════════════════════ */
const ApprovalPendingBanner: React.FC<{ count: number }> = ({ count }) => (
  <div className="rounded-lg border border-[hsl(var(--state-review)/0.3)] bg-[hsl(var(--state-review)/0.05)] p-3 flex items-center gap-3 mb-3">
    <Shield className="h-4 w-4 text-[hsl(var(--state-review))] shrink-0" />
    <div className="flex-1">
      <div className="text-[11px] font-medium">{count} Offer{count > 1 ? 's' : ''} Awaiting Approval</div>
      <div className="text-[10px] text-muted-foreground">These offers require sign-off before they can be sent to candidates.</div>
    </div>
    <Button variant="outline" size="sm" className="h-6 text-[10px]">Review</Button>
  </div>
);

const ExpiringBanner: React.FC<{ count: number }> = ({ count }) => (
  <div className="rounded-lg border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3 flex items-center gap-3 mb-3">
    <Clock className="h-4 w-4 text-[hsl(var(--state-caution))] shrink-0" />
    <div className="flex-1">
      <div className="text-[11px] font-medium">{count} Offer{count > 1 ? 's' : ''} Expiring Soon</div>
      <div className="text-[10px] text-muted-foreground">Sent offers nearing their expiry deadline without a candidate response.</div>
    </div>
    <Button variant="outline" size="sm" className="h-6 text-[10px]">View</Button>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const RecruiterOffersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OfferTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOffer, setEditOffer] = useState<Offer | undefined>();

  const filtered = useMemo(() => {
    let list = [...MOCK_OFFERS];
    if (activeTab === 'active') list = list.filter(o => ['draft', 'pending-approval', 'sent'].includes(o.status));
    if (activeTab === 'accepted') list = list.filter(o => o.status === 'accepted');
    if (activeTab === 'closed') list = list.filter(o => ['declined', 'expired', 'withdrawn'].includes(o.status));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o => o.candidateName.toLowerCase().includes(q) || o.jobTitle.toLowerCase().includes(q));
    }
    return list;
  }, [activeTab, searchQuery]);

  const selected = MOCK_OFFERS.find(o => o.id === selectedId);
  const pendingApproval = MOCK_OFFERS.filter(o => o.status === 'pending-approval').length;
  const sentCount = MOCK_OFFERS.filter(o => o.status === 'sent').length;
  const acceptedCount = MOCK_OFFERS.filter(o => o.status === 'accepted').length;
  const declinedCount = MOCK_OFFERS.filter(o => o.status === 'declined').length;

  const tabCounts: Record<OfferTab, number> = {
    all: MOCK_OFFERS.length,
    active: MOCK_OFFERS.filter(o => ['draft', 'pending-approval', 'sent'].includes(o.status)).length,
    accepted: acceptedCount,
    closed: MOCK_OFFERS.filter(o => ['declined', 'expired', 'withdrawn'].includes(o.status)).length,
  };

  const topStrip = (
    <>
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Offers & Outcomes</span>
        <StatusBadge status="live" label={`${sentCount} Sent`} />
      </div>
      <div className="flex-1" />
      <Button size="sm" className="h-6 text-[10px]" onClick={() => { setEditOffer(undefined); setCreateOpen(true); }}><Plus className="h-3 w-3 mr-1" />Create Offer</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <KPICard label="Active" value={tabCounts.active} change="in pipeline" trend="neutral" />
        <KPICard label="Accepted" value={acceptedCount} change="hired" trend="up" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <KPICard label="Declined" value={declinedCount} change="lost" trend="down" />
        <KPICard label="Accept Rate" value={MOCK_OFFERS.length > 0 ? `${Math.round((acceptedCount / Math.max(acceptedCount + declinedCount, 1)) * 100)}%` : '—'} change="overall" trend="up" />
      </div>

      <SectionCard title="Approval Queue">
        <div className="space-y-1.5">
          {MOCK_OFFERS.filter(o => o.status === 'pending-approval').map(o => (
            <button key={o.id} onClick={() => setSelectedId(o.id)} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-left hover:bg-muted/50 transition-colors">
              <Avatar className="h-5 w-5"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{o.candidateAvatar}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-medium truncate">{o.candidateName}</div>
                <div className="text-[8px] text-muted-foreground">{o.baseSalary}</div>
              </div>
              <StatusBadge status="review" label="Pending" />
            </button>
          ))}
          {pendingApproval === 0 && <div className="text-[9px] text-muted-foreground text-center py-2">No pending approvals</div>}
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions">
        <div className="space-y-1">
          {[
            { label: 'Create offer', icon: Plus, action: () => { setEditOffer(undefined); setCreateOpen(true); } },
            { label: 'Export offer report', icon: FileText },
            { label: 'Comp benchmarks', icon: BarChart3 },
            { label: 'Offer templates', icon: Copy },
          ].map(a => (
            <button key={a.label} onClick={a.action || (() => toast.info(a.label))} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-[9px] hover:bg-muted/50 transition-colors">
              <a.icon className="h-3 w-3 text-muted-foreground" />{a.label}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5 text-accent" />Hiring Outcomes</span>
        <span className="text-[10px] text-muted-foreground">All time</span>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Total Offers', value: String(MOCK_OFFERS.length) },
          { label: 'Accepted', value: String(acceptedCount) },
          { label: 'Declined', value: String(declinedCount) },
          { label: 'Expired', value: String(MOCK_OFFERS.filter(o => o.status === 'expired').length) },
          { label: 'Avg Time to Accept', value: '5d' },
          { label: 'Accept Rate', value: `${Math.round((acceptedCount / Math.max(acceptedCount + declinedCount, 1)) * 100)}%` },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className="text-sm font-bold">{s.value}</div>
            <div className="text-[9px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      {pendingApproval > 0 && <ApprovalPendingBanner count={pendingApproval} />}
      {sentCount > 0 && <ExpiringBanner count={1} />}

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search offers..." className="w-full h-8 pl-8 pr-3 rounded-lg border bg-background text-xs focus:ring-2 focus:ring-ring focus:outline-none" />
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2 mb-2">
        {(['all', 'active', 'accepted', 'closed'] as OfferTab[]).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={cn(
            'px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors shrink-0 flex items-center gap-1 capitalize',
            activeTab === t ? 'bg-accent text-accent-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
          )}>
            {t === 'closed' ? 'Declined / Expired' : t}
            <span className={cn('text-[7px] rounded-full px-1', activeTab === t ? 'bg-accent-foreground/20' : 'bg-muted')}>{tabCounts[t]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <div className="text-sm font-medium mb-1">No offers found</div>
          <div className="text-[10px] text-muted-foreground mb-3">Adjust filters or create a new offer.</div>
          <Button size="sm" className="h-7 text-[10px]" onClick={() => { setEditOffer(undefined); setCreateOpen(true); }}><Plus className="h-3 w-3 mr-1" />Create Offer</Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="grid grid-cols-[1fr_90px_80px_80px_80px_90px] gap-2 px-3 py-2 bg-muted/50 border-b text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Candidate / Role</span><span>Comp</span><span>Status</span><span>Approval</span><span>Expires</span><span className="text-right">Actions</span>
          </div>
          {filtered.map(o => {
            const cfg = STATUS_CFG[o.status];
            return (
              <div key={o.id} onClick={() => setSelectedId(o.id)} className={cn(
                'grid grid-cols-[1fr_90px_80px_80px_80px_90px] gap-2 px-3 py-2.5 border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer items-center',
                o.status === 'pending-approval' && 'bg-[hsl(var(--state-review)/0.02)]',
              )}>
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-7 w-7"><AvatarFallback className="text-[9px] bg-accent/10 text-accent">{o.candidateAvatar}</AvatarFallback></Avatar>
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium truncate">{o.candidateName}</div>
                    <div className="text-[8px] text-muted-foreground truncate">{o.jobTitle}</div>
                  </div>
                </div>
                <div className="text-[9px]"><div className="font-medium">{o.baseSalary}</div><div className="text-[8px] text-muted-foreground">{o.equity} eq</div></div>
                <StatusBadge status={cfg.badge} label={cfg.label} />
                <div>
                  {o.approvalStatus === 'approved' && <Badge className="text-[7px] bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]">Approved</Badge>}
                  {o.approvalStatus === 'pending' && <Badge className="text-[7px] bg-[hsl(var(--state-review)/0.1)] text-[hsl(var(--state-review))]">Pending</Badge>}
                  {o.approvalStatus === 'rejected' && <Badge className="text-[7px] bg-[hsl(var(--state-blocked)/0.1)] text-[hsl(var(--state-blocked))]">Rejected</Badge>}
                  {o.approvalStatus === null && <span className="text-[8px] text-muted-foreground">—</span>}
                </div>
                <div className="text-[9px] text-muted-foreground">{o.expiresAt || '—'}</div>
                <div className="flex items-center justify-end gap-1">
                  {o.status === 'draft' && <Button variant="outline" size="sm" className="h-5 text-[7px]" onClick={e => { e.stopPropagation(); setEditOffer(o); setCreateOpen(true); }}><Edit className="h-2 w-2 mr-0.5" />Edit</Button>}
                  {o.status === 'sent' && <Button variant="outline" size="sm" className="h-5 text-[7px]" onClick={e => { e.stopPropagation(); toast.success('Marked as hired!'); }}><UserCheck className="h-2 w-2 mr-0.5" />Hired</Button>}
                  {o.status === 'accepted' && <Button variant="outline" size="sm" className="h-5 text-[7px]" onClick={e => { e.stopPropagation(); toast.info('Onboarding...'); }}><CheckCircle2 className="h-2 w-2 mr-0.5" />Onboard</Button>}
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={e => e.stopPropagation()}><MoreHorizontal className="h-3 w-3" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      <Sheet open={!!selected} onOpenChange={() => setSelectedId(null)}>
        <SheetContent className="w-[440px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm">Offer Details</SheetTitle></SheetHeader>
          {selected && (() => {
            const cfg = STATUS_CFG[selected.status];
            return (
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10"><AvatarFallback className="text-xs bg-accent/10 text-accent">{selected.candidateAvatar}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold">{selected.candidateName}</h3>
                    <p className="text-[10px] text-muted-foreground">{selected.candidateHeadline}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">for <span className="font-medium text-foreground">{selected.jobTitle}</span></p>
                  </div>
                  <StatusBadge status={cfg.badge} label={cfg.label} />
                </div>

                <SectionCard title="Compensation">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><div className="text-sm font-bold">{selected.baseSalary}</div><div className="text-[8px] text-muted-foreground">Base</div></div>
                    <div><div className="text-sm font-bold">{selected.equity}</div><div className="text-[8px] text-muted-foreground">Equity</div></div>
                    <div><div className="text-sm font-bold">{selected.bonus}</div><div className="text-[8px] text-muted-foreground">Bonus</div></div>
                  </div>
                </SectionCard>

                <SectionCard title="Details">
                  <div className="text-[10px] space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Start Date</span><span className="font-medium">{selected.startDate}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Expires</span><span className="font-medium">{selected.expiresAt || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="font-medium">{selected.createdAt}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Approver</span><span className="font-medium">{selected.approver || '—'}</span></div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Approval</span>
                      {selected.approvalStatus === 'approved' && <span className="font-medium text-[hsl(var(--state-healthy))]">Approved</span>}
                      {selected.approvalStatus === 'pending' && <span className="font-medium text-[hsl(var(--state-review))]">Pending</span>}
                      {selected.approvalStatus === 'rejected' && <span className="font-medium text-[hsl(var(--state-blocked))]">Rejected</span>}
                      {selected.approvalStatus === null && <span className="font-medium">—</span>}
                    </div>
                  </div>
                </SectionCard>

                {selected.notes && (
                  <div>
                    <h4 className="text-xs font-semibold mb-1">Notes</h4>
                    <p className="text-[10px] text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">{selected.notes}</p>
                  </div>
                )}

                {/* Decision Timeline */}
                <SectionCard title="Decision Timeline">
                  <div className="space-y-2">
                    {selected.timeline.map((ev, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="flex flex-col items-center">
                          <div className={cn('h-2 w-2 rounded-full mt-1', i === 0 ? 'bg-accent' : 'bg-muted-foreground/30')} />
                          {i < selected.timeline.length - 1 && <div className="w-px flex-1 bg-muted" />}
                        </div>
                        <div className="pb-2">
                          <div className="text-[10px] font-medium">{ev.action}</div>
                          <div className="text-[8px] text-muted-foreground">{ev.actor} · {ev.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 pt-2 border-t">
                  {selected.status === 'draft' && (
                    <div className="flex gap-1.5">
                      <Button size="sm" className="flex-1 h-7 text-[10px] gap-1" onClick={() => { setEditOffer(selected); setCreateOpen(true); setSelectedId(null); }}><Edit className="h-3 w-3" />Edit</Button>
                      <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] gap-1" onClick={() => toast.success('Submitted for approval')}><Send className="h-3 w-3" />Submit</Button>
                    </div>
                  )}
                  {selected.status === 'pending-approval' && (
                    <div className="flex gap-1.5">
                      <Button size="sm" className="flex-1 h-7 text-[10px] gap-1" onClick={() => toast.success('Approved')}><CheckCircle2 className="h-3 w-3" />Approve</Button>
                      <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] gap-1 text-[hsl(var(--state-blocked))]" onClick={() => toast.info('Rejected')}><XCircle className="h-3 w-3" />Reject</Button>
                    </div>
                  )}
                  {selected.status === 'sent' && (
                    <div className="flex gap-1.5">
                      <Button size="sm" className="flex-1 h-7 text-[10px] gap-1" onClick={() => toast.success('Marked as hired!')}><UserCheck className="h-3 w-3" />Mark Hired</Button>
                      <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] gap-1" onClick={() => toast.info('Sending reminder')}><Mail className="h-3 w-3" />Remind</Button>
                    </div>
                  )}
                  {selected.status === 'accepted' && (
                    <Button size="sm" className="h-7 text-[10px] gap-1 w-full" onClick={() => toast.info('Opening onboarding...')}><Zap className="h-3 w-3" />Start Onboarding</Button>
                  )}
                  {(selected.status === 'declined' || selected.status === 'expired') && (
                    <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 w-full" onClick={() => toast.info('Creating revised offer...')}><Copy className="h-3 w-3" />Create Revised Offer</Button>
                  )}
                  {selected.status !== 'accepted' && selected.status !== 'withdrawn' && selected.status !== 'expired' && selected.status !== 'declined' && (
                    <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 w-full text-[hsl(var(--state-blocked))]" onClick={() => toast.info('Offer withdrawn')}><XCircle className="h-3 w-3" />Withdraw Offer</Button>
                  )}
                  <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 w-full"><ExternalLink className="h-3 w-3" />View Candidate Profile</Button>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      <CreateOfferModal open={createOpen} onClose={() => { setCreateOpen(false); setEditOffer(undefined); }} editOffer={editOffer} />
    </DashboardLayout>
  );
};

export default RecruiterOffersPage;
