import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Send, Eye, Save, ChevronLeft, ChevronRight, Plus, X,
  DollarSign, Clock, Briefcase, Users, AlertTriangle,
  CheckCircle2, Coins, CreditCard, FileText, Upload,
  Star, TrendingUp, BarChart3, Shield, Lightbulb,
  GripVertical, Trash2, ArrowUpDown, Lock, Zap,
  MessageSquare, ExternalLink, Award, ThumbsUp, ThumbsDown,
  ShoppingCart, Sparkles, History, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */
type ProposalStatus = 'draft' | 'submitted' | 'shortlisted' | 'revised' | 'accepted' | 'rejected';
type ViewTab = 'compose' | 'my-proposals' | 'compare' | 'credits';

interface Milestone {
  id: string; title: string; amount: string; duration: string; deliverables: string;
}

interface ProposalDraft {
  coverLetter: string;
  bidAmount: string;
  timeline: string;
  milestones: Milestone[];
  attachments: { name: string; size: string }[];
  boostEnabled: boolean;
  screeningAnswers: string[];
}

interface SubmittedProposal {
  id: string; projectTitle: string; projectId: string; status: ProposalStatus;
  bidAmount: string; timeline: string; submittedAt: string;
  clientName: string; clientAvatar: string;
  creditCost: number; boosted: boolean;
  competitorRange: string; shortlistPosition?: number;
}

/* ═══════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════ */
const CREDIT_BALANCE = { available: 18, total: 25, pending: 2, used: 5 };
const PROPOSAL_COST = 2;
const BOOST_COST = 3;

const PROJECT_CONTEXT = {
  id: 'p1', title: 'SaaS Platform Development — React + Node',
  budget: '$25,000 – $35,000', pricingType: 'fixed' as const,
  duration: '3 months', skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
  proposals: 12, clientName: 'TechVentures Inc.', clientAvatar: 'TV',
  status: 'open' as const,
  screeningQuestions: [
    'Describe a similar project you have completed.',
    'What is your availability for the next 3 months?',
  ],
};

const MY_PROPOSALS: SubmittedProposal[] = [
  { id: 'pr1', projectTitle: 'SaaS Platform Development', projectId: 'p1', status: 'shortlisted', bidAmount: '$28,000', timeline: '10 weeks', submittedAt: '2 days ago', clientName: 'TechVentures Inc.', clientAvatar: 'TV', creditCost: 2, boosted: true, competitorRange: '$22K–$38K', shortlistPosition: 2 },
  { id: 'pr2', projectTitle: 'Mobile App Redesign', projectId: 'p2', status: 'submitted', bidAmount: '$12,000', timeline: '6 weeks', submittedAt: '5 days ago', clientName: 'DesignCo', clientAvatar: 'DC', creditCost: 2, boosted: false, competitorRange: '$8K–$18K' },
  { id: 'pr3', projectTitle: 'Data Pipeline Architecture', projectId: 'p3', status: 'accepted', bidAmount: '$35,000', timeline: '12 weeks', submittedAt: '2 weeks ago', clientName: 'DataFlow Labs', clientAvatar: 'DL', creditCost: 2, boosted: true, competitorRange: '$28K–$45K' },
  { id: 'pr4', projectTitle: 'E-commerce Integration', projectId: 'p4', status: 'rejected', bidAmount: '$8,000', timeline: '4 weeks', submittedAt: '3 weeks ago', clientName: 'ShopFront', clientAvatar: 'SF', creditCost: 2, boosted: false, competitorRange: '$5K–$12K' },
  { id: 'pr5', projectTitle: 'API Gateway Setup', projectId: 'p5', status: 'draft', bidAmount: '$15,000', timeline: '8 weeks', submittedAt: '—', clientName: 'CloudFirst', clientAvatar: 'CF', creditCost: 2, boosted: false, competitorRange: '$10K–$20K' },
];

const COMPARISON_DATA = [
  { label: 'Your Bid', value: '$28,000', rank: 'Mid-range', color: 'text-accent' },
  { label: 'Average Bid', value: '$29,500', rank: '—', color: 'text-muted-foreground' },
  { label: 'Lowest Bid', value: '$22,000', rank: '—', color: 'text-[hsl(var(--state-healthy))]' },
  { label: 'Highest Bid', value: '$38,000', rank: '—', color: 'text-[hsl(var(--state-caution))]' },
];

const STATUS_CONFIG: Record<ProposalStatus, { badge: 'healthy' | 'caution' | 'blocked' | 'pending' | 'live' | 'premium'; label: string }> = {
  draft: { badge: 'pending', label: 'Draft' },
  submitted: { badge: 'live', label: 'Submitted' },
  shortlisted: { badge: 'premium', label: 'Shortlisted' },
  revised: { badge: 'caution', label: 'Revised' },
  accepted: { badge: 'healthy', label: 'Accepted' },
  rejected: { badge: 'blocked', label: 'Rejected' },
};

const CREDIT_PACKS = [
  { id: 'c1', credits: 5, price: '$4.99', popular: false },
  { id: 'c2', credits: 15, price: '$12.99', popular: true },
  { id: 'c3', credits: 30, price: '$22.99', popular: false },
  { id: 'c4', credits: 60, price: '$39.99', popular: false },
];

/* ═══════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════ */
const CreditPanel: React.FC<{ boostEnabled: boolean; onToggleBoost: (v: boolean) => void; onBuyCredits: () => void }> = ({ boostEnabled, onToggleBoost, onBuyCredits }) => {
  const totalCost = PROPOSAL_COST + (boostEnabled ? BOOST_COST : 0);
  const hasCredits = CREDIT_BALANCE.available >= totalCost;
  return (
    <SectionCard title="Bid Credits" icon={<Coins className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Available</span>
          <span className="font-bold text-sm">{CREDIT_BALANCE.available}</span>
        </div>
        <Progress value={(CREDIT_BALANCE.available / CREDIT_BALANCE.total) * 100} className="h-1.5" />
        <div className="grid grid-cols-3 gap-1 text-[8px] text-muted-foreground">
          <div className="text-center"><div className="font-semibold text-foreground">{CREDIT_BALANCE.total}</div>Total</div>
          <div className="text-center"><div className="font-semibold text-foreground">{CREDIT_BALANCE.used}</div>Used</div>
          <div className="text-center"><div className="font-semibold text-foreground">{CREDIT_BALANCE.pending}</div>Pending</div>
        </div>
        <div className="border-t pt-2 space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span>Proposal cost</span><span className="font-medium">{PROPOSAL_COST} credits</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1"><Zap className="h-3 w-3 text-accent" />Boost proposal</div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground">+{BOOST_COST} credits</span>
              <Switch checked={boostEnabled} onCheckedChange={onToggleBoost} />
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-semibold border-t pt-1.5">
            <span>Total</span><span>{totalCost} credits</span>
          </div>
          {!hasCredits && (
            <div className="rounded-xl border border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.05)] p-2 text-[9px] text-[hsl(var(--state-blocked))] flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 shrink-0" />Insufficient credits
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" className="w-full h-6 text-[9px] gap-1 rounded-xl" onClick={onBuyCredits}><CreditCard className="h-3 w-3" />Buy Credits</Button>
      </div>
    </SectionCard>
  );
};

const ProposalPreview: React.FC<{ draft: ProposalDraft; open: boolean; onClose: () => void }> = ({ draft, open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative flex justify-center items-start pt-[5vh] px-4">
        <div className="w-full max-w-lg bg-card rounded-2xl border shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-2"><Eye className="h-4 w-4 text-accent" /><h2 className="font-semibold">Proposal Preview</h2></div>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
          <div className="p-6 space-y-4">
            <div className="rounded-2xl bg-muted/30 p-3">
              <div className="text-xs font-medium">{PROJECT_CONTEXT.title}</div>
              <div className="text-[10px] text-muted-foreground">{PROJECT_CONTEXT.clientName} · {PROJECT_CONTEXT.budget}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border p-2 text-center"><div className="text-[9px] text-muted-foreground">Your Bid</div><div className="text-sm font-bold">{draft.bidAmount || '—'}</div></div>
              <div className="rounded-2xl border p-2 text-center"><div className="text-[9px] text-muted-foreground">Timeline</div><div className="text-sm font-bold">{draft.timeline || '—'}</div></div>
            </div>
            {draft.coverLetter && <div><h3 className="text-xs font-semibold mb-1">Cover Letter</h3><div className="text-[10px] whitespace-pre-line rounded-2xl border p-3">{draft.coverLetter}</div></div>}
            {draft.milestones.filter(m => m.title).length > 0 && (
              <div>
                <h3 className="text-xs font-semibold mb-2">Milestones</h3>
                {draft.milestones.filter(m => m.title).map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/30 mb-1">
                    <div className="h-5 w-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[8px] font-bold">{i + 1}</div>
                    <span className="text-[10px] font-medium flex-1">{m.title}</span>
                    {m.amount && <span className="text-[10px] font-bold">${m.amount}</span>}
                    {m.duration && <span className="text-[9px] text-muted-foreground">{m.duration}</span>}
                  </div>
                ))}
              </div>
            )}
            {draft.screeningAnswers.filter(Boolean).length > 0 && (
              <div>
                <h3 className="text-xs font-semibold mb-2">Screening Answers</h3>
                {PROJECT_CONTEXT.screeningQuestions.map((q, i) => (
                  draft.screeningAnswers[i] ? (
                    <div key={i} className="mb-2">
                      <div className="text-[9px] font-medium text-muted-foreground">{q}</div>
                      <div className="text-[10px] mt-0.5 rounded-xl border p-2">{draft.screeningAnswers[i]}</div>
                    </div>
                  ) : null
                ))}
              </div>
            )}
            {draft.boostEnabled && (
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-2 flex items-center gap-2 text-[10px]">
                <Zap className="h-3.5 w-3.5 text-accent" /><span className="font-medium">Boosted</span><span className="text-muted-foreground">— appears higher in buyer's view</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SubmitConfirmation: React.FC<{ open: boolean; onClose: () => void; onConfirm: () => void; totalCost: number; bidAmount: string; boostEnabled: boolean }> = ({ open, onClose, onConfirm, totalCost, bidAmount, boostEnabled }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative flex justify-center items-start pt-[20vh] px-4">
        <div className="w-full max-w-sm bg-card rounded-2xl border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="p-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
              <Send className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-sm mb-1">Confirm Submission</h3>
              <p className="text-[10px] text-muted-foreground">This action will deduct {totalCost} bid credits from your balance.</p>
            </div>
            <div className="rounded-2xl bg-muted/30 p-3 text-[10px] space-y-1.5">
              <div className="flex justify-between"><span className="text-muted-foreground">Bid Amount</span><span className="font-bold">{bidAmount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Proposal Cost</span><span>{PROPOSAL_COST} credits</span></div>
              {boostEnabled && <div className="flex justify-between"><span className="text-muted-foreground">Boost</span><span>{BOOST_COST} credits</span></div>}
              <div className="flex justify-between border-t pt-1.5 font-semibold"><span>Total</span><span>{totalCost} credits</span></div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-8 text-[10px] rounded-xl" onClick={onClose}>Cancel</Button>
              <Button className="flex-1 h-8 text-[10px] gap-1 rounded-xl" onClick={onConfirm}><Send className="h-3 w-3" />Submit</Button>
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
const ProposalSubmissionPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState<ViewTab>('compose');
  const [draft, setDraft] = useState<ProposalDraft>({
    coverLetter: '', bidAmount: '', timeline: '',
    milestones: [{ id: '1', title: '', amount: '', duration: '', deliverables: '' }],
    attachments: [], boostEnabled: false,
    screeningAnswers: PROJECT_CONTEXT.screeningQuestions.map(() => ''),
  });
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<SubmittedProposal | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [draftStatus, setDraftStatus] = useState<'unsaved' | 'saving' | 'saved'>('unsaved');

  const updateDraft = <K extends keyof ProposalDraft>(key: K, value: ProposalDraft[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
    setDraftStatus('unsaved');
  };

  const totalCost = PROPOSAL_COST + (draft.boostEnabled ? BOOST_COST : 0);
  const hasCredits = CREDIT_BALANCE.available >= totalCost;
  const isValid = !!draft.coverLetter && !!draft.bidAmount && !!draft.timeline;
  const isClosed = PROJECT_CONTEXT.status !== 'open';

  const filteredProposals = useMemo(() => {
    const list = statusFilter === 'all' ? MY_PROPOSALS : MY_PROPOSALS.filter(p => p.status === statusFilter);
    return list.sort((a, b) => sortBy === 'amount' ? a.bidAmount.localeCompare(b.bidAmount) : 0);
  }, [statusFilter, sortBy]);

  const handleSubmit = () => {
    if (!isValid) { toast.error('Complete all required fields'); return; }
    if (!hasCredits) { toast.error('Insufficient bid credits'); return; }
    if (isClosed) { toast.error('Project is no longer accepting proposals'); return; }
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    toast.success('Proposal submitted! ' + totalCost + ' credits deducted.');
    setShowConfirm(false);
  };

  const saveDraft = () => {
    setDraftStatus('saving');
    setTimeout(() => { setDraftStatus('saved'); toast.success('Draft saved'); }, 800);
  };

  /* ── Top Strip ── */
  const tabs: { key: ViewTab; label: string; count?: number }[] = [
    { key: 'compose', label: 'Compose' },
    { key: 'my-proposals', label: 'My Proposals', count: MY_PROPOSALS.length },
    { key: 'compare', label: 'Analysis' },
    { key: 'credits', label: 'Credits', count: CREDIT_BALANCE.available },
  ];

  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><FileText className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Proposal Builder</span>
        {draftStatus === 'saved' && <StatusBadge status="healthy" label="Saved" />}
        {draftStatus === 'saving' && <StatusBadge status="pending" label="Saving..." />}
        {draftStatus === 'unsaved' && activeTab === 'compose' && <StatusBadge status="caution" label="Unsaved" />}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-0.5">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={cn(
            'px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition-all',
            activeTab === t.key ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'
          )}>
            {t.label}
            {t.count !== undefined && <span className="ml-1 text-[8px] opacity-70">({t.count})</span>}
          </button>
        ))}
      </div>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      {activeTab === 'compose' && (
        <>
          <CreditPanel boostEnabled={draft.boostEnabled} onToggleBoost={v => updateDraft('boostEnabled', v)} onBuyCredits={() => setActiveTab('credits')} />
          <SectionCard title="Project Context" icon={<Briefcase className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5 text-[10px]">
              <div className="font-medium truncate">{PROJECT_CONTEXT.title}</div>
              {[
                { l: 'Client', v: PROJECT_CONTEXT.clientName },
                { l: 'Budget', v: PROJECT_CONTEXT.budget },
                { l: 'Duration', v: PROJECT_CONTEXT.duration },
                { l: 'Proposals', v: String(PROJECT_CONTEXT.proposals) },
              ].map(r => (
                <div key={r.l} className="flex justify-between"><span className="text-muted-foreground">{r.l}</span><span className="font-medium">{r.v}</span></div>
              ))}
              <div className="flex flex-wrap gap-1 mt-1">{PROJECT_CONTEXT.skills.map(s => <Badge key={s} variant="secondary" className="text-[7px]">{s}</Badge>)}</div>
            </div>
            <Button variant="outline" size="sm" className="w-full h-6 text-[9px] mt-2 gap-1 rounded-xl" asChild><Link to={`/projects/${projectId || 'p1'}`}><ExternalLink className="h-3 w-3" />View Project</Link></Button>
          </SectionCard>
          <SectionCard title="Tips" icon={<Lightbulb className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5 text-[9px] text-muted-foreground">
              <p>• Proposals with milestones win 35% more often</p>
              <p>• Reference the client's requirements directly</p>
              <p>• Boosted proposals get 2.5× more views</p>
              <p>• Answer screening questions thoroughly</p>
            </div>
          </SectionCard>
          <SectionCard title="Quick Actions" className="!rounded-2xl">
            <div className="space-y-1">
              {[
                { label: 'Browse projects', icon: Briefcase, path: '/projects' },
                { label: 'My proposals', icon: FileText, action: () => setActiveTab('my-proposals') },
                { label: 'Buy credits', icon: ShoppingCart, action: () => setActiveTab('credits') },
                { label: 'View profile', icon: Users, path: '/profile' },
              ].map(a => (
                'path' in a ? (
                  <Link key={a.label} to={a.path!} className="flex items-center gap-2 px-2 py-1.5 rounded-xl text-[9px] hover:bg-muted/50 transition-colors">
                    <a.icon className="h-3 w-3 text-muted-foreground" />{a.label}
                  </Link>
                ) : (
                  <button key={a.label} onClick={a.action} className="flex items-center gap-2 px-2 py-1.5 rounded-xl text-[9px] hover:bg-muted/50 transition-colors w-full text-left">
                    <a.icon className="h-3 w-3 text-muted-foreground" />{a.label}
                  </button>
                )
              ))}
            </div>
          </SectionCard>
        </>
      )}
      {activeTab === 'my-proposals' && (
        <>
          <KPIBand className="grid-cols-2 !rounded-2xl">
            <KPICard label="Total" value={MY_PROPOSALS.length} />
            <KPICard label="Accepted" value={MY_PROPOSALS.filter(p => p.status === 'accepted').length} change="33%" trend="up" />
          </KPIBand>
          <SectionCard title="Credits Summary" className="!rounded-2xl">
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Credits spent</span><span className="font-medium">{MY_PROPOSALS.reduce((s, p) => s + p.creditCost + (p.boosted ? BOOST_COST : 0), 0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Avg cost/proposal</span><span className="font-medium">3.2</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Win rate</span><span className="font-medium text-[hsl(var(--state-healthy))]">20%</span></div>
            </div>
          </SectionCard>
          <SectionCard title="Performance" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Shortlist rate</span><span className="font-medium">40%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Avg response</span><span className="font-medium">4.2 hrs</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Profile views</span><span className="font-medium">127</span></div>
            </div>
          </SectionCard>
        </>
      )}
      {activeTab === 'compare' && (
        <SectionCard title="Market Intelligence" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-2">
            {COMPARISON_DATA.map(c => (
              <div key={c.label} className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{c.label}</span>
                <span className={cn('font-bold', c.color)}>{c.value}</span>
              </div>
            ))}
            <div className="border-t pt-2 text-[9px] text-muted-foreground">Based on {PROJECT_CONTEXT.proposals} proposals received</div>
          </div>
        </SectionCard>
      )}
      {activeTab === 'credits' && (
        <SectionCard title="Credit Balance" icon={<Coins className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="text-center py-2">
            <div className="text-2xl font-bold">{CREDIT_BALANCE.available}</div>
            <div className="text-[9px] text-muted-foreground">credits available</div>
            <Progress value={(CREDIT_BALANCE.available / CREDIT_BALANCE.total) * 100} className="h-1.5 mt-2" />
          </div>
          <div className="space-y-1 text-[10px] mt-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Lifetime purchased</span><span className="font-medium">{CREDIT_BALANCE.total}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Used</span><span className="font-medium">{CREDIT_BALANCE.used}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pending</span><span className="font-medium">{CREDIT_BALANCE.pending}</span></div>
          </div>
        </SectionCard>
      )}
    </div>
  );

  /* ── Bottom Section ── */
  const bottomSection = activeTab === 'compare' ? (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-accent" />Bid Distribution</div>
      <div className="flex items-end gap-1 h-16">
        {[15, 25, 45, 60, 80, 100, 85, 55, 30, 18, 10].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className={cn('w-full rounded-sm transition-all', i === 5 ? 'bg-accent' : 'bg-muted')} style={{ height: `${h}%` }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[8px] text-muted-foreground mt-1">
        <span>$20K</span><span>$25K</span><span>$30K</span><span>$35K</span><span>$40K</span>
      </div>
    </div>
  ) : activeTab === 'compose' ? (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-2"><Sparkles className="h-3.5 w-3.5 text-accent" /><span className="text-[11px] font-semibold">Proposal Intelligence</span></div>
      <div className="grid grid-cols-5 gap-3">
        {[{ label: 'Win Probability', value: '68%' }, { label: 'Competitor Avg', value: '$29.5K' }, { label: 'Best Timeline', value: '8 wks' }, { label: 'Avg Milestones', value: '2.1' }, { label: 'Boost ROI', value: '2.5×' }].map(s => (
          <div key={s.label} className="text-center"><div className="text-sm font-bold">{s.value}</div><div className="text-[9px] text-muted-foreground">{s.label}</div></div>
        ))}
      </div>
    </div>
  ) : null;

  /* ── TAB: Compose ── */
  const renderCompose = () => (
    <div className="space-y-4">
      {isClosed && (
        <div className="rounded-2xl border border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.05)] p-3 flex items-center gap-3">
          <Lock className="h-4 w-4 text-[hsl(var(--state-blocked))] shrink-0" />
          <div><div className="text-[11px] font-medium">Project Closed</div><div className="text-[10px] text-muted-foreground">This project is no longer accepting proposals.</div></div>
        </div>
      )}

      {!hasCredits && !isClosed && (
        <div className="rounded-2xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3 flex items-center gap-3">
          <Coins className="h-4 w-4 text-[hsl(var(--state-caution))] shrink-0" />
          <div className="flex-1"><div className="text-[11px] font-medium">Insufficient Credits</div><div className="text-[10px] text-muted-foreground">You need {totalCost} credits to submit. Current balance: {CREDIT_BALANCE.available}.</div></div>
          <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setActiveTab('credits')}><CreditCard className="h-3 w-3" />Buy Credits</Button>
        </div>
      )}

      <div>
        <label className="text-[11px] font-semibold mb-1 block">Cover Letter <span className="text-[hsl(var(--state-blocked))]">*</span></label>
        <p className="text-[9px] text-muted-foreground mb-1">Explain why you're the right fit for this project</p>
        <textarea className="w-full h-32 rounded-xl border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none" value={draft.coverLetter} onChange={e => updateDraft('coverLetter', e.target.value)} placeholder="Dear TechVentures team, I'm excited about this opportunity..." disabled={isClosed} />
        <div className="text-[8px] text-muted-foreground text-right mt-0.5">{draft.coverLetter.length}/2000</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold mb-1 block">Your Bid <span className="text-[hsl(var(--state-blocked))]">*</span></label>
          <input className="w-full h-9 rounded-xl border bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" value={draft.bidAmount} onChange={e => updateDraft('bidAmount', e.target.value)} placeholder="$28,000" disabled={isClosed} />
          <div className="text-[8px] text-muted-foreground mt-0.5">Client budget: {PROJECT_CONTEXT.budget}</div>
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1 block">Timeline <span className="text-[hsl(var(--state-blocked))]">*</span></label>
          <input className="w-full h-9 rounded-xl border bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" value={draft.timeline} onChange={e => updateDraft('timeline', e.target.value)} placeholder="10 weeks" disabled={isClosed} />
        </div>
      </div>

      {/* Screening Questions */}
      {PROJECT_CONTEXT.screeningQuestions.length > 0 && (
        <div>
          <label className="text-[11px] font-semibold mb-1 block flex items-center gap-1"><Shield className="h-3 w-3 text-accent" />Screening Questions</label>
          <p className="text-[9px] text-muted-foreground mb-2">The client requires answers to these questions</p>
          <div className="space-y-3">
            {PROJECT_CONTEXT.screeningQuestions.map((q, i) => (
              <div key={i}>
                <div className="text-[10px] font-medium mb-1">{i + 1}. {q}</div>
                <textarea className="w-full h-20 rounded-xl border bg-background px-3 py-2 text-[11px] focus:ring-2 focus:ring-ring focus:outline-none resize-none" value={draft.screeningAnswers[i] || ''} onChange={e => { const next = [...draft.screeningAnswers]; next[i] = e.target.value; updateDraft('screeningAnswers', next); }} placeholder="Your answer..." disabled={isClosed} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      <div>
        <label className="text-[11px] font-semibold mb-1 block">Payment Milestones</label>
        <p className="text-[9px] text-muted-foreground mb-2">Break your bid into milestones for buyer confidence</p>
        <div className="space-y-2">
          {draft.milestones.map((m, i) => (
            <div key={m.id} className="rounded-xl border p-3 space-y-2 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2">
                <GripVertical className="h-3 w-3 text-muted-foreground shrink-0 cursor-grab" />
                <div className="h-5 w-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[8px] font-bold shrink-0">{i + 1}</div>
                <input className="flex-1 h-8 rounded-xl border bg-background px-2 text-[10px] focus:ring-2 focus:ring-ring focus:outline-none" value={m.title} onChange={e => { const next = [...draft.milestones]; next[i] = { ...m, title: e.target.value }; updateDraft('milestones', next); }} placeholder="Milestone title" disabled={isClosed} />
                <input className="w-20 h-8 rounded-xl border bg-background px-2 text-[10px] focus:ring-2 focus:ring-ring focus:outline-none" value={m.amount} onChange={e => { const next = [...draft.milestones]; next[i] = { ...m, amount: e.target.value }; updateDraft('milestones', next); }} placeholder="$" disabled={isClosed} />
                <input className="w-20 h-8 rounded-xl border bg-background px-2 text-[10px] focus:ring-2 focus:ring-ring focus:outline-none" value={m.duration} onChange={e => { const next = [...draft.milestones]; next[i] = { ...m, duration: e.target.value }; updateDraft('milestones', next); }} placeholder="Duration" disabled={isClosed} />
                {draft.milestones.length > 1 && <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => updateDraft('milestones', draft.milestones.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>}
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl" disabled={isClosed} onClick={() => updateDraft('milestones', [...draft.milestones, { id: String(Date.now()), title: '', amount: '', duration: '', deliverables: '' }])}><Plus className="h-3 w-3" />Add Milestone</Button>
        </div>
      </div>

      {/* Attachments */}
      <div>
        <label className="text-[11px] font-semibold mb-1 block">Attachments</label>
        <div className="border-2 border-dashed rounded-2xl p-3 text-center cursor-pointer hover:border-accent/50 transition-colors" onClick={() => { if (!isClosed) { updateDraft('attachments', [...draft.attachments, { name: `Portfolio_${draft.attachments.length + 1}.pdf`, size: '2.1 MB' }]); toast.info('File attached (mock)'); } }}>
          <Upload className="h-4 w-4 text-muted-foreground mx-auto mb-0.5" />
          <div className="text-[9px] text-muted-foreground">Upload portfolio samples or supporting docs</div>
          <div className="text-[8px] text-muted-foreground mt-0.5">PDF, DOC, FIG, ZIP up to 25MB</div>
        </div>
        {draft.attachments.length > 0 && (
          <div className="mt-1.5 space-y-1">
            {draft.attachments.map((a, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-xl border text-[10px]">
                <FileText className="h-3 w-3 text-muted-foreground" /><span className="flex-1">{a.name}</span><span className="text-muted-foreground">{a.size}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => updateDraft('attachments', draft.attachments.filter((_, j) => j !== i))}><X className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <Button className="h-8 text-[10px] gap-1 rounded-xl" disabled={!isValid || !hasCredits || isClosed} onClick={handleSubmit}><Send className="h-3 w-3" />Submit ({totalCost} credits)</Button>
        <Button variant="outline" className="h-8 text-[10px] gap-1 rounded-xl" onClick={() => setShowPreview(true)}><Eye className="h-3 w-3" />Preview</Button>
        <Button variant="ghost" className="h-8 text-[10px] gap-1 rounded-xl" onClick={saveDraft}><Save className="h-3 w-3" />Save Draft</Button>
      </div>
    </div>
  );

  /* ── TAB: My Proposals ── */
  const renderMyProposals = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'draft', 'submitted', 'shortlisted', 'accepted', 'rejected'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={cn(
            'px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition-all capitalize',
            statusFilter === s ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'
          )}>{s === 'all' ? 'All' : s} {s !== 'all' && <span className="ml-1 text-[8px]">({MY_PROPOSALS.filter(p => p.status === s).length})</span>}</button>
        ))}
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setSortBy(sortBy === 'date' ? 'amount' : 'date')}><ArrowUpDown className="h-3 w-3" />{sortBy === 'date' ? 'By Date' : 'By Amount'}</Button>
      </div>

      {filteredProposals.length === 0 ? (
        <div className="rounded-2xl border p-8 text-center"><FileText className="h-6 w-6 text-muted-foreground mx-auto mb-2" /><div className="text-[11px] font-medium">No proposals found</div><div className="text-[10px] text-muted-foreground">Try adjusting your filters</div></div>
      ) : (
        <div className="space-y-1.5">
          {filteredProposals.map(p => {
            const cfg = STATUS_CONFIG[p.status];
            return (
              <div key={p.id} onClick={() => setSelectedProposal(p)} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border hover:bg-muted/20 hover:shadow-sm transition-all cursor-pointer">
                <Avatar className="h-7 w-7 ring-1 ring-muted/30"><AvatarFallback className="text-[8px] bg-accent/10 text-accent">{p.clientAvatar}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium truncate">{p.projectTitle}</div>
                  <div className="text-[8px] text-muted-foreground">{p.clientName} · {p.submittedAt}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-bold">{p.bidAmount}</div>
                  <div className="text-[8px] text-muted-foreground">{p.timeline}</div>
                </div>
                <StatusBadge status={cfg.badge} label={cfg.label} />
                {p.boosted && <Zap className="h-3 w-3 text-accent shrink-0" />}
                {p.shortlistPosition && <Badge className="text-[7px] bg-accent/10 text-accent">#{p.shortlistPosition}</Badge>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ── TAB: Compare ── */
  const renderCompare = () => (
    <div className="space-y-4">
      <SectionCard title="Your Position" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="grid grid-cols-4 gap-2">
          {COMPARISON_DATA.map(c => (
            <div key={c.label} className="text-center rounded-2xl border p-2">
              <div className="text-[8px] text-muted-foreground">{c.label}</div>
              <div className={cn('text-sm font-bold', c.color)}>{c.value}</div>
              {c.rank !== '—' && <div className="text-[8px] text-muted-foreground">{c.rank}</div>}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Competitive Analysis" className="!rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1.5 font-semibold text-muted-foreground">Metric</th>
                <th className="text-center py-1.5 font-semibold text-accent">You</th>
                <th className="text-center py-1.5 font-semibold text-muted-foreground">Average</th>
                <th className="text-center py-1.5 font-semibold text-muted-foreground">Top 10%</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metric: 'Bid Amount', you: '$28,000', avg: '$29,500', top: '$24,000' },
                { metric: 'Timeline', you: '10 weeks', avg: '11 weeks', top: '8 weeks' },
                { metric: 'Milestones', you: '3', avg: '2.1', top: '4+' },
                { metric: 'Cover Letter', you: '450 words', avg: '280 words', top: '500+' },
                { metric: 'Attachments', you: '2 files', avg: '1.3 files', top: '3+' },
                { metric: 'Response Time', you: '2 hrs', avg: '18 hrs', top: '< 4 hrs' },
                { metric: 'Profile Score', you: '87/100', avg: '72/100', top: '90+' },
              ].map(r => (
                <tr key={r.metric} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="py-1.5 text-muted-foreground">{r.metric}</td>
                  <td className="py-1.5 text-center font-medium">{r.you}</td>
                  <td className="py-1.5 text-center text-muted-foreground">{r.avg}</td>
                  <td className="py-1.5 text-center text-muted-foreground">{r.top}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Win Probability" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-accent">68%</div>
          <div className="flex-1">
            <Progress value={68} className="h-2 mb-1" />
            <div className="text-[9px] text-muted-foreground">Based on your profile, bid, and project match score</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: 'Profile Match', value: 85, icon: Users },
            { label: 'Bid Competitiveness', value: 72, icon: DollarSign },
            { label: 'Response Quality', value: 90, icon: Award },
          ].map(f => (
            <div key={f.label} className="rounded-2xl border p-2 text-center">
              <f.icon className="h-3 w-3 text-muted-foreground mx-auto mb-0.5" />
              <div className="text-[10px] font-bold">{f.value}%</div>
              <div className="text-[8px] text-muted-foreground">{f.label}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ── TAB: Credits ── */
  const renderCredits = () => (
    <div className="space-y-4">
      {/* Balance summary */}
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4 flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center">
          <Coins className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1">
          <div className="text-[9px] text-muted-foreground">Current Balance</div>
          <div className="text-xl font-bold">{CREDIT_BALANCE.available} <span className="text-[10px] font-normal text-muted-foreground">credits</span></div>
          <Progress value={(CREDIT_BALANCE.available / CREDIT_BALANCE.total) * 100} className="h-1.5 mt-1" />
        </div>
        <div className="text-right text-[10px]">
          <div><span className="text-muted-foreground">Pending:</span> <span className="font-medium">{CREDIT_BALANCE.pending}</span></div>
          <div><span className="text-muted-foreground">Used:</span> <span className="font-medium">{CREDIT_BALANCE.used}</span></div>
        </div>
      </div>

      {/* Packs */}
      <SectionCard title="Buy Credit Packs" icon={<ShoppingCart className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="grid grid-cols-2 gap-2">
          {CREDIT_PACKS.map(pack => (
            <button key={pack.id} className={cn(
              'rounded-2xl border p-3 text-left transition-all hover:shadow-sm',
              pack.popular ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : 'hover:bg-muted/30'
            )}>
              {pack.popular && <Badge className="text-[7px] bg-accent text-accent-foreground mb-1">Most Popular</Badge>}
              <div className="text-lg font-bold">{pack.credits}</div>
              <div className="text-[9px] text-muted-foreground">credits</div>
              <div className="text-[11px] font-semibold mt-1">{pack.price}</div>
              <div className="text-[8px] text-muted-foreground">${(parseFloat(pack.price.slice(1)) / pack.credits).toFixed(2)}/credit</div>
            </button>
          ))}
        </div>
        <Button className="w-full h-8 text-[10px] gap-1 rounded-xl mt-3"><CreditCard className="h-3 w-3" />Purchase Credits</Button>
      </SectionCard>

      {/* Transaction history */}
      <SectionCard title="Recent Transactions" icon={<History className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {[
            { label: 'Proposal: SaaS Platform', cost: -2, date: '2 days ago', type: 'proposal' },
            { label: 'Boost: SaaS Platform', cost: -3, date: '2 days ago', type: 'boost' },
            { label: 'Proposal: Mobile App', cost: -2, date: '5 days ago', type: 'proposal' },
            { label: 'Credit Pack (15)', cost: 15, date: '1 week ago', type: 'purchase' },
            { label: 'Proposal: Data Pipeline', cost: -2, date: '2 weeks ago', type: 'proposal' },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-muted/30 transition-colors text-[10px]">
              <div className={cn('h-5 w-5 rounded-full flex items-center justify-center', t.cost > 0 ? 'bg-[hsl(var(--state-healthy)/0.1)]' : 'bg-muted/50')}>
                {t.cost > 0 ? <Plus className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" /> : <Send className="h-2.5 w-2.5 text-muted-foreground" />}
              </div>
              <span className="flex-1 truncate">{t.label}</span>
              <span className="text-[8px] text-muted-foreground">{t.date}</span>
              <span className={cn('font-bold', t.cost > 0 ? 'text-[hsl(var(--state-healthy))]' : 'text-muted-foreground')}>
                {t.cost > 0 ? '+' : ''}{t.cost}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Pricing info */}
      <div className="rounded-2xl border p-3 text-[10px] text-muted-foreground space-y-1.5">
        <div className="flex items-center gap-1.5 font-medium text-foreground"><Lightbulb className="h-3.5 w-3.5 text-accent" />Credit Usage Guide</div>
        <div className="flex justify-between"><span>Standard proposal</span><span className="font-medium text-foreground">2 credits</span></div>
        <div className="flex justify-between"><span>Proposal boost</span><span className="font-medium text-foreground">+3 credits</span></div>
        <div className="flex justify-between"><span>Premium placement</span><span className="font-medium text-foreground">+5 credits</span></div>
        <div className="flex justify-between"><span>Unused credits</span><span className="font-medium text-foreground">Never expire</span></div>
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-60" bottomSection={bottomSection}>
      {activeTab === 'compose' && renderCompose()}
      {activeTab === 'my-proposals' && renderMyProposals()}
      {activeTab === 'compare' && renderCompare()}
      {activeTab === 'credits' && renderCredits()}

      <ProposalPreview draft={draft} open={showPreview} onClose={() => setShowPreview(false)} />
      <SubmitConfirmation open={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={confirmSubmit} totalCost={totalCost} bidAmount={draft.bidAmount} boostEnabled={draft.boostEnabled} />

      {/* Proposal detail drawer */}
      <Sheet open={!!selectedProposal} onOpenChange={() => setSelectedProposal(null)}>
        <SheetContent className="w-[380px] sm:w-[420px] overflow-y-auto p-0">
          {selectedProposal && (
            <>
              <SheetHeader className="p-5 border-b">
                <SheetTitle className="text-sm">{selectedProposal.projectTitle}</SheetTitle>
              </SheetHeader>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 ring-1 ring-muted/30"><AvatarFallback className="text-[9px] bg-accent/10 text-accent">{selectedProposal.clientAvatar}</AvatarFallback></Avatar>
                  <div><div className="text-[10px] font-medium">{selectedProposal.clientName}</div><div className="text-[8px] text-muted-foreground">Submitted {selectedProposal.submittedAt}</div></div>
                  <div className="ml-auto"><StatusBadge status={STATUS_CONFIG[selectedProposal.status].badge} label={STATUS_CONFIG[selectedProposal.status].label} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border p-2 text-center"><div className="text-[9px] text-muted-foreground">Your Bid</div><div className="text-sm font-bold">{selectedProposal.bidAmount}</div></div>
                  <div className="rounded-2xl border p-2 text-center"><div className="text-[9px] text-muted-foreground">Timeline</div><div className="text-sm font-bold">{selectedProposal.timeline}</div></div>
                </div>
                <div className="rounded-2xl border p-2 text-[10px] space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Competitor Range</span><span className="font-medium">{selectedProposal.competitorRange}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Credits Used</span><span className="font-medium">{selectedProposal.creditCost + (selectedProposal.boosted ? BOOST_COST : 0)}</span></div>
                  {selectedProposal.shortlistPosition && <div className="flex justify-between"><span className="text-muted-foreground">Shortlist Position</span><span className="font-medium text-accent">#{selectedProposal.shortlistPosition}</span></div>}
                </div>
                {selectedProposal.boosted && (
                  <div className="rounded-xl border border-accent/30 bg-accent/5 p-2 flex items-center gap-2 text-[10px]"><Zap className="h-3 w-3 text-accent" /><span>Boosted Proposal</span></div>
                )}
                <div className="flex gap-2">
                  {selectedProposal.status === 'draft' && <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl"><Send className="h-3 w-3" />Submit</Button>}
                  {selectedProposal.status === 'submitted' && <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl"><RefreshCw className="h-3 w-3" />Revise</Button>}
                  {selectedProposal.status === 'shortlisted' && <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl"><MessageSquare className="h-3 w-3" />Message Client</Button>}
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl" asChild><Link to={`/projects/${selectedProposal.projectId}`}><ExternalLink className="h-3 w-3" />View Project</Link></Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default ProposalSubmissionPage;
