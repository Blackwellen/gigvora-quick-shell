import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  Award, Star, Users, DollarSign, Clock, CheckCircle2, XCircle,
  ThumbsUp, ThumbsDown, MessageSquare, ExternalLink, Eye, Send,
  Shield, AlertTriangle, Briefcase, BarChart3, TrendingUp,
  ArrowUpDown, Filter, Bookmark, BookmarkPlus, ChevronRight,
  FileText, Paperclip, Zap, Lock, StickyNote, Scale,
  UserCheck, Crown, Columns2, X, RefreshCw, Flag,
  CircleDot, History, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */
type ProposalStatus = 'new' | 'reviewed' | 'shortlisted' | 'rejected' | 'awarded' | 'withdrawn';
type ViewTab = 'all' | 'shortlist' | 'compare' | 'awarded' | 'notes';
type SortKey = 'score' | 'bid' | 'date' | 'timeline';

interface Proposal {
  id: string; freelancerName: string; freelancerAvatar: string;
  title: string; coverExcerpt: string; bidAmount: string; bidNumeric: number;
  timeline: string; matchScore: number; rating: number; completedJobs: number;
  status: ProposalStatus; submittedAt: string; skills: string[];
  milestones: number; attachments: number; boosted: boolean;
  location: string; memberSince: string; responseTime: string;
  screeningScore: number; portfolioItems: number;
  notes: string[];
}

/* ═══════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════ */
const PROJECT = {
  id: 'p1', title: 'SaaS Platform Development — React + Node',
  budget: '$25,000 – $35,000', status: 'open' as const,
  proposals: 8, shortlisted: 3, awarded: 0,
};

const PROPOSALS: Proposal[] = [
  { id: 'pr1', freelancerName: 'Alex Chen', freelancerAvatar: 'AC', title: 'Full-Stack React/Node Expert', coverExcerpt: 'I have 7+ years building SaaS platforms with React and Node.js. My approach focuses on scalable architecture...', bidAmount: '$28,000', bidNumeric: 28000, timeline: '10 weeks', matchScore: 94, rating: 4.9, completedJobs: 87, status: 'shortlisted', submittedAt: '2 days ago', skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'], milestones: 4, attachments: 3, boosted: true, location: 'San Francisco, US', memberSince: '2019', responseTime: '< 2 hrs', screeningScore: 95, portfolioItems: 12, notes: ['Strong technical background', 'Excellent communication'] },
  { id: 'pr2', freelancerName: 'Sarah Miller', freelancerAvatar: 'SM', title: 'Senior SaaS Developer', coverExcerpt: 'Specializing in SaaS development for 5 years. Built 3 platforms from scratch that now serve 50K+ users...', bidAmount: '$32,000', bidNumeric: 32000, timeline: '12 weeks', matchScore: 91, rating: 4.8, completedJobs: 63, status: 'shortlisted', submittedAt: '3 days ago', skills: ['React', 'Node.js', 'AWS', 'MongoDB'], milestones: 5, attachments: 2, boosted: false, location: 'London, UK', memberSince: '2020', responseTime: '< 4 hrs', screeningScore: 88, portfolioItems: 8, notes: ['Great portfolio'] },
  { id: 'pr3', freelancerName: 'Dev Studio Pro', freelancerAvatar: 'DS', title: 'Agency — Full Team Available', coverExcerpt: 'We are a team of 6 developers ready to deliver your SaaS platform. Our agency has delivered 20+ similar projects...', bidAmount: '$35,000', bidNumeric: 35000, timeline: '8 weeks', matchScore: 88, rating: 4.7, completedJobs: 142, status: 'shortlisted', submittedAt: '1 day ago', skills: ['React', 'Node.js', 'DevOps', 'UI/UX'], milestones: 3, attachments: 5, boosted: true, location: 'Berlin, DE', memberSince: '2018', responseTime: '< 1 hr', screeningScore: 92, portfolioItems: 20, notes: [] },
  { id: 'pr4', freelancerName: 'Marcus Johnson', freelancerAvatar: 'MJ', title: 'React Specialist', coverExcerpt: 'Frontend-focused developer with deep React expertise. Can handle the full stack but my strength is in UI...', bidAmount: '$22,000', bidNumeric: 22000, timeline: '14 weeks', matchScore: 79, rating: 4.5, completedJobs: 34, status: 'reviewed', submittedAt: '4 days ago', skills: ['React', 'CSS', 'JavaScript'], milestones: 2, attachments: 1, boosted: false, location: 'Toronto, CA', memberSince: '2021', responseTime: '< 8 hrs', screeningScore: 72, portfolioItems: 5, notes: [] },
  { id: 'pr5', freelancerName: 'Nina Kowalski', freelancerAvatar: 'NK', title: 'Full-Stack Engineer', coverExcerpt: 'Experienced in building enterprise-grade applications. Strong focus on performance and security...', bidAmount: '$30,000', bidNumeric: 30000, timeline: '11 weeks', matchScore: 85, rating: 4.6, completedJobs: 51, status: 'new', submittedAt: '1 day ago', skills: ['React', 'Node.js', 'TypeScript', 'Docker'], milestones: 4, attachments: 2, boosted: false, location: 'Warsaw, PL', memberSince: '2020', responseTime: '< 3 hrs', screeningScore: 85, portfolioItems: 9, notes: [] },
  { id: 'pr6', freelancerName: 'James Wright', freelancerAvatar: 'JW', title: 'Backend-Heavy Developer', coverExcerpt: 'I focus on robust backend architecture. Can pair with a frontend specialist if needed...', bidAmount: '$24,000', bidNumeric: 24000, timeline: '12 weeks', matchScore: 72, rating: 4.3, completedJobs: 28, status: 'rejected', submittedAt: '5 days ago', skills: ['Node.js', 'PostgreSQL', 'Redis'], milestones: 3, attachments: 1, boosted: false, location: 'Sydney, AU', memberSince: '2021', responseTime: '< 12 hrs', screeningScore: 65, portfolioItems: 4, notes: ['Backend only — missing frontend skills'] },
  { id: 'pr7', freelancerName: 'Aria Patel', freelancerAvatar: 'AP', title: 'React + TypeScript Expert', coverExcerpt: 'TypeScript-first approach to building scalable React applications. Strong testing culture...', bidAmount: '$26,000', bidNumeric: 26000, timeline: '10 weeks', matchScore: 90, rating: 4.8, completedJobs: 45, status: 'new', submittedAt: '6 hours ago', skills: ['React', 'TypeScript', 'Node.js', 'Testing'], milestones: 4, attachments: 3, boosted: false, location: 'Mumbai, IN', memberSince: '2019', responseTime: '< 2 hrs', screeningScore: 91, portfolioItems: 11, notes: [] },
  { id: 'pr8', freelancerName: 'Tom Baker', freelancerAvatar: 'TB', title: 'Freelance SaaS Dev', coverExcerpt: 'Available immediately. Have built several SaaS dashboards. Quick turnaround guaranteed...', bidAmount: '$18,000', bidNumeric: 18000, timeline: '16 weeks', matchScore: 65, rating: 4.1, completedJobs: 15, status: 'withdrawn', submittedAt: '6 days ago', skills: ['React', 'Express'], milestones: 2, attachments: 0, boosted: false, location: 'Austin, US', memberSince: '2022', responseTime: '< 24 hrs', screeningScore: 55, portfolioItems: 3, notes: [] },
];

const STATUS_CONFIG: Record<ProposalStatus, { badge: 'healthy' | 'caution' | 'blocked' | 'pending' | 'live' | 'premium'; label: string }> = {
  new: { badge: 'live', label: 'New' },
  reviewed: { badge: 'pending', label: 'Reviewed' },
  shortlisted: { badge: 'premium', label: 'Shortlisted' },
  rejected: { badge: 'blocked', label: 'Rejected' },
  awarded: { badge: 'healthy', label: 'Awarded' },
  withdrawn: { badge: 'caution', label: 'Withdrawn' },
};

/* ═══════════════════════════════════════════════════════════
   Award Confirmation Modal
   ═══════════════════════════════════════════════════════════ */
const AwardModal: React.FC<{ proposal: Proposal | null; onClose: () => void; onConfirm: () => void }> = ({ proposal, onClose, onConfirm }) => {
  if (!proposal) return null;
  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative flex justify-center items-start pt-[15vh] px-4">
        <div className="w-full max-w-md bg-card rounded-2xl border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="p-6 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
              <Award className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-sm mb-1">Award Project</h3>
              <p className="text-[10px] text-muted-foreground">You are about to award this project to {proposal.freelancerName}. This will notify the freelancer and initiate the contract flow.</p>
            </div>
            <div className="rounded-2xl bg-muted/30 p-3 text-[10px] space-y-1.5 text-left">
              <div className="flex justify-between"><span className="text-muted-foreground">Freelancer</span><span className="font-bold">{proposal.freelancerName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Bid Amount</span><span className="font-bold">{proposal.bidAmount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Timeline</span><span className="font-bold">{proposal.timeline}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Milestones</span><span className="font-bold">{proposal.milestones}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Match Score</span><span className="font-bold text-accent">{proposal.matchScore}%</span></div>
            </div>
            <div className="rounded-xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-2 text-[9px] text-[hsl(var(--state-caution))] flex items-start gap-1.5 text-left">
              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
              <span>Awarding will reject all other proposals and initiate the escrow funding flow. This action cannot be undone.</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-9 text-[10px] rounded-xl" onClick={onClose}>Cancel</Button>
              <Button className="flex-1 h-9 text-[10px] gap-1 rounded-xl" onClick={onConfirm}><Award className="h-3 w-3" />Award Project</Button>
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
const ProposalReviewAwardPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState<ViewTab>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  const [detailProposal, setDetailProposal] = useState<Proposal | null>(null);
  const [awardTarget, setAwardTarget] = useState<Proposal | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [proposals, setProposals] = useState(PROPOSALS);

  const toggleSelect = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = () => setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));

  const filtered = useMemo(() => {
    let list = proposals;
    if (activeTab === 'shortlist') list = list.filter(p => p.status === 'shortlisted');
    else if (activeTab === 'awarded') list = list.filter(p => p.status === 'awarded');
    else if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    return list.sort((a, b) => {
      if (sortBy === 'score') return b.matchScore - a.matchScore;
      if (sortBy === 'bid') return a.bidNumeric - b.bidNumeric;
      if (sortBy === 'timeline') return parseInt(a.timeline) - parseInt(b.timeline);
      return 0;
    });
  }, [proposals, activeTab, statusFilter, sortBy]);

  const shortlisted = proposals.filter(p => p.status === 'shortlisted');
  const compareList = proposals.filter(p => selected.has(p.id));

  const handleShortlist = (id: string) => {
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'shortlisted' ? 'reviewed' : 'shortlisted' as ProposalStatus } : p));
    toast.success('Shortlist updated');
  };

  const handleReject = (id: string) => {
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' as ProposalStatus } : p));
    toast.info('Proposal rejected');
  };

  const handleAward = () => {
    if (!awardTarget) return;
    setProposals(prev => prev.map(p => p.id === awardTarget.id ? { ...p, status: 'awarded' as ProposalStatus } : p.status !== 'rejected' && p.status !== 'withdrawn' ? { ...p, status: 'rejected' as ProposalStatus } : p));
    toast.success(`Project awarded to ${awardTarget.freelancerName}!`);
    setAwardTarget(null);
  };

  const addNote = (id: string) => {
    if (!noteInput.trim()) return;
    setProposals(prev => prev.map(p => p.id === id ? { ...p, notes: [...p.notes, noteInput] } : p));
    setNoteInput('');
    toast.success('Note added');
  };

  const tabs: { key: ViewTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All Proposals', count: proposals.filter(p => p.status !== 'withdrawn').length },
    { key: 'shortlist', label: 'Shortlist', count: shortlisted.length },
    { key: 'compare', label: 'Compare', count: selected.size },
    { key: 'awarded', label: 'Awarded', count: proposals.filter(p => p.status === 'awarded').length },
    { key: 'notes', label: 'Notes' },
  ];

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Scale className="h-3.5 w-3.5 text-accent" /></div>
        <div>
          <span className="text-xs font-bold">Proposal Review & Award</span>
          <div className="text-[9px] text-muted-foreground truncate max-w-[200px]">{PROJECT.title}</div>
        </div>
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
      <KPIBand className="grid-cols-2 !rounded-2xl">
        <KPICard label="Total" value={proposals.filter(p => p.status !== 'withdrawn').length} />
        <KPICard label="Shortlisted" value={shortlisted.length} change={`${Math.round(shortlisted.length / proposals.length * 100)}%`} trend="up" />
        <KPICard label="Avg Bid" value={`$${Math.round(proposals.reduce((s, p) => s + p.bidNumeric, 0) / proposals.length / 1000)}K`} />
        <KPICard label="Avg Score" value={`${Math.round(proposals.reduce((s, p) => s + p.matchScore, 0) / proposals.length)}%`} />
      </KPIBand>

      <SectionCard title="Project Context" icon={<Briefcase className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[10px]">
          <div className="font-medium truncate">{PROJECT.title}</div>
          <div className="flex justify-between"><span className="text-muted-foreground">Budget</span><span className="font-medium">{PROJECT.budget}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status="healthy" label="Open" /></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Proposals</span><span className="font-medium">{PROJECT.proposals}</span></div>
        </div>
        <Button variant="outline" size="sm" className="w-full h-6 text-[9px] mt-2 gap-1 rounded-xl" asChild><Link to={`/projects/${projectId || 'p1'}`}><ExternalLink className="h-3 w-3" />View Project</Link></Button>
      </SectionCard>

      <SectionCard title="Decision Summary" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[10px]">
          {(['new', 'reviewed', 'shortlisted', 'rejected', 'awarded', 'withdrawn'] as ProposalStatus[]).map(s => {
            const c = proposals.filter(p => p.status === s).length;
            if (c === 0) return null;
            const cfg = STATUS_CONFIG[s];
            return (
              <div key={s} className="flex items-center justify-between">
                <StatusBadge status={cfg.badge} label={cfg.label} />
                <span className="font-medium">{c}</span>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-1">
          {[
            { label: 'Message shortlisted', icon: MessageSquare, action: () => toast.info('Opening message composer…') },
            { label: 'Export proposals', icon: FileText, action: () => toast.info('Exporting…') },
            { label: 'Request more proposals', icon: RefreshCw, action: () => toast.info('Requesting…') },
          ].map(a => (
            <button key={a.label} onClick={a.action} className="flex items-center gap-2 px-2 py-1.5 rounded-xl text-[9px] hover:bg-muted/50 transition-colors w-full text-left">
              <a.icon className="h-3 w-3 text-muted-foreground" />{a.label}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom Section ── */
  const bottomSection = (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-2"><Sparkles className="h-3.5 w-3.5 text-accent" /><span className="text-[11px] font-semibold">Bid Distribution</span></div>
      <div className="flex items-end gap-1 h-14">
        {[10, 30, 20, 55, 75, 100, 80, 45, 25, 15].map((h, i) => (
          <div key={i} className="flex-1">
            <div className={cn('w-full rounded-sm transition-all', i === 5 ? 'bg-accent' : 'bg-muted')} style={{ height: `${h}%` }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[8px] text-muted-foreground mt-1"><span>$18K</span><span>$24K</span><span>$30K</span><span>$35K</span></div>
    </div>
  );

  /* ── Proposal Row ── */
  const ProposalRow: React.FC<{ p: Proposal }> = ({ p }) => {
    const cfg = STATUS_CONFIG[p.status];
    const isSelected = selected.has(p.id);
    return (
      <div className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition-all cursor-pointer',
        isSelected ? 'bg-accent/5 border-accent/30 shadow-sm' : 'hover:bg-muted/20 hover:shadow-sm',
        p.status === 'rejected' && 'opacity-60',
      )} onClick={() => setDetailProposal(p)}>
        <Checkbox checked={isSelected} onCheckedChange={() => { toggleSelect(p.id); }} onClick={e => e.stopPropagation()} className="shrink-0" />
        <Avatar className="h-8 w-8 ring-2 ring-muted/30 shrink-0">
          <AvatarFallback className="text-[9px] bg-accent/10 text-accent font-bold">{p.freelancerAvatar}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold truncate">{p.freelancerName}</span>
            {p.boosted && <Zap className="h-3 w-3 text-accent shrink-0" />}
            <StatusBadge status={cfg.badge} label={cfg.label} />
          </div>
          <div className="text-[9px] text-muted-foreground truncate">{p.coverExcerpt.slice(0, 80)}…</div>
          <div className="flex items-center gap-2 mt-0.5">
            {p.skills.slice(0, 3).map(s => <Badge key={s} variant="secondary" className="text-[7px] px-1">{s}</Badge>)}
            {p.skills.length > 3 && <span className="text-[7px] text-muted-foreground">+{p.skills.length - 3}</span>}
          </div>
        </div>
        <div className="text-right shrink-0 space-y-0.5">
          <div className="text-[11px] font-bold">{p.bidAmount}</div>
          <div className="text-[9px] text-muted-foreground">{p.timeline}</div>
        </div>
        <div className="text-center shrink-0 w-10">
          <div className={cn('text-[11px] font-bold', p.matchScore >= 85 ? 'text-[hsl(var(--state-healthy))]' : p.matchScore >= 70 ? 'text-accent' : 'text-muted-foreground')}>{p.matchScore}%</div>
          <div className="text-[7px] text-muted-foreground">match</div>
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <div className="flex items-center text-[9px] text-muted-foreground"><Star className="h-3 w-3 text-accent fill-accent mr-0.5" />{p.rating}</div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleShortlist(p.id)} title={p.status === 'shortlisted' ? 'Remove from shortlist' : 'Shortlist'}>
            {p.status === 'shortlisted' ? <Bookmark className="h-3 w-3 text-accent fill-accent" /> : <BookmarkPlus className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    );
  };

  /* ── TAB: All ── */
  const renderAll = () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'new', 'reviewed', 'shortlisted', 'rejected'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={cn(
            'px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition-all capitalize',
            statusFilter === s ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'
          )}>{s === 'all' ? 'All' : s} {s !== 'all' && <span className="text-[8px]">({proposals.filter(p => p.status === s).length})</span>}</button>
        ))}
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={selectAll}><CheckCircle2 className="h-3 w-3" />{selected.size === filtered.length ? 'Deselect All' : 'Select All'}</Button>
        <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setSortBy(prev => ({ score: 'bid', bid: 'timeline', timeline: 'date', date: 'score' } as Record<SortKey, SortKey>)[prev])}><ArrowUpDown className="h-3 w-3" />{sortBy}</Button>
      </div>
      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-accent/20 bg-accent/5 text-[10px]">
          <span className="font-medium">{selected.size} selected</span>
          <div className="flex-1" />
          <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setActiveTab('compare')}><Columns2 className="h-3 w-3" />Compare</Button>
          <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => { selected.forEach(id => handleShortlist(id)); }}><BookmarkPlus className="h-3 w-3" />Shortlist</Button>
          <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl text-[hsl(var(--state-blocked))]" onClick={() => { selected.forEach(id => handleReject(id)); setSelected(new Set()); }}><XCircle className="h-3 w-3" />Reject</Button>
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border p-8 text-center"><Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" /><div className="text-[11px] font-medium">No proposals found</div></div>
      ) : (
        <div className="space-y-1.5">{filtered.map(p => <ProposalRow key={p.id} p={p} />)}</div>
      )}
    </div>
  );

  /* ── TAB: Shortlist ── */
  const renderShortlist = () => (
    <div className="space-y-3">
      {shortlisted.length === 0 ? (
        <div className="rounded-2xl border p-8 text-center"><BookmarkPlus className="h-6 w-6 text-muted-foreground mx-auto mb-2" /><div className="text-[11px] font-medium">No shortlisted proposals yet</div><div className="text-[10px] text-muted-foreground">Use the bookmark icon to shortlist proposals</div></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2">
            {shortlisted.map((p, i) => (
              <div key={p.id} className="rounded-2xl border p-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => setDetailProposal(p)}>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</div>
                  <Avatar className="h-8 w-8 ring-2 ring-accent/20 shrink-0"><AvatarFallback className="text-[9px] bg-accent/10 text-accent font-bold">{p.freelancerAvatar}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold truncate">{p.freelancerName}</div>
                    <div className="text-[9px] text-muted-foreground">{p.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-bold">{p.bidAmount}</div>
                    <div className="text-[9px] text-muted-foreground">{p.timeline}</div>
                  </div>
                  <div className="text-center w-10">
                    <div className="text-[11px] font-bold text-accent">{p.matchScore}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 pl-[52px]" onClick={e => e.stopPropagation()}>
                  <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setAwardTarget(p)}><Award className="h-3 w-3" />Award</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Opening message…')}><MessageSquare className="h-3 w-3" />Message</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1 rounded-xl text-[hsl(var(--state-blocked))]" onClick={() => handleReject(p.id)}><XCircle className="h-3 w-3" />Remove</Button>
                </div>
              </div>
            ))}
          </div>
          {shortlisted.length >= 2 && (
            <Button className="w-full h-8 text-[10px] gap-1 rounded-xl" onClick={() => { setSelected(new Set(shortlisted.map(p => p.id))); setActiveTab('compare'); }}><Columns2 className="h-3 w-3" />Compare Shortlisted</Button>
          )}
        </>
      )}
    </div>
  );

  /* ── TAB: Compare ── */
  const renderCompare = () => {
    const items = compareList.length > 0 ? compareList : shortlisted;
    if (items.length < 2) return (
      <div className="rounded-2xl border p-8 text-center"><Columns2 className="h-6 w-6 text-muted-foreground mx-auto mb-2" /><div className="text-[11px] font-medium">Select at least 2 proposals to compare</div><div className="text-[10px] text-muted-foreground">Use checkboxes in All Proposals tab</div></div>
    );
    const metrics = [
      { label: 'Bid Amount', key: 'bidAmount' as const },
      { label: 'Timeline', key: 'timeline' as const },
      { label: 'Match Score', key: 'matchScore' as const },
      { label: 'Rating', key: 'rating' as const },
      { label: 'Completed Jobs', key: 'completedJobs' as const },
      { label: 'Milestones', key: 'milestones' as const },
      { label: 'Attachments', key: 'attachments' as const },
      { label: 'Screening', key: 'screeningScore' as const },
      { label: 'Portfolio', key: 'portfolioItems' as const },
      { label: 'Response Time', key: 'responseTime' as const },
    ];
    return (
      <div className="space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-semibold text-muted-foreground w-28">Metric</th>
                {items.map(p => (
                  <th key={p.id} className="text-center py-2 min-w-[120px]">
                    <div className="flex flex-col items-center gap-1">
                      <Avatar className="h-7 w-7 ring-2 ring-accent/20"><AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">{p.freelancerAvatar}</AvatarFallback></Avatar>
                      <span className="font-semibold">{p.freelancerName}</span>
                      <StatusBadge status={STATUS_CONFIG[p.status].badge} label={STATUS_CONFIG[p.status].label} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map(m => {
                const vals = items.map(p => {
                  const v = p[m.key];
                  return typeof v === 'number' ? v : String(v);
                });
                const numVals = vals.filter(v => typeof v === 'number') as number[];
                const best = m.key === 'bidAmount' ? Math.min(...items.map(p => p.bidNumeric)) : numVals.length > 0 ? Math.max(...numVals) : null;
                return (
                  <tr key={m.label} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-2 text-muted-foreground font-medium">{m.label}</td>
                    {items.map(p => {
                      const v = p[m.key];
                      const isBest = m.key === 'bidAmount' ? p.bidNumeric === best : typeof v === 'number' && v === best;
                      return (
                        <td key={p.id} className={cn('py-2 text-center font-medium', isBest && 'text-accent font-bold')}>
                          {typeof v === 'number' && m.key === 'matchScore' ? `${v}%` : typeof v === 'number' && m.key === 'screeningScore' ? `${v}%` : String(v)}
                          {isBest && <Crown className="h-2.5 w-2.5 text-accent inline ml-0.5" />}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr>
                <td className="py-2 font-semibold">Actions</td>
                {items.map(p => (
                  <td key={p.id} className="py-2 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl w-full max-w-[100px]" onClick={() => setAwardTarget(p)}><Award className="h-3 w-3" />Award</Button>
                      <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl w-full max-w-[100px]" onClick={() => setDetailProposal(p)}><Eye className="h-3 w-3" />Detail</Button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ── TAB: Awarded ── */
  const renderAwarded = () => {
    const awarded = proposals.filter(p => p.status === 'awarded');
    if (awarded.length === 0) return (
      <div className="rounded-2xl border p-8 text-center"><Award className="h-6 w-6 text-muted-foreground mx-auto mb-2" /><div className="text-[11px] font-medium">No awards yet</div><div className="text-[10px] text-muted-foreground">Shortlist and compare proposals, then award the project</div></div>
    );
    return (
      <div className="space-y-2">
        {awarded.map(p => (
          <div key={p.id} className="rounded-2xl border border-[hsl(var(--state-healthy)/0.3)] bg-[hsl(var(--state-healthy)/0.05)] p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center"><Award className="h-5 w-5 text-[hsl(var(--state-healthy))]" /></div>
              <Avatar className="h-9 w-9 ring-2 ring-[hsl(var(--state-healthy)/0.3)]"><AvatarFallback className="text-[9px] bg-accent/10 text-accent font-bold">{p.freelancerAvatar}</AvatarFallback></Avatar>
              <div className="flex-1">
                <div className="text-[11px] font-bold">{p.freelancerName}</div>
                <div className="text-[9px] text-muted-foreground">{p.title}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">{p.bidAmount}</div>
                <div className="text-[9px] text-muted-foreground">{p.timeline}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl" asChild><Link to={`/projects/${projectId || 'p1'}/workspace`}><Briefcase className="h-3 w-3" />Open Workspace</Link></Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => toast.info('Opening contract…')}><FileText className="h-3 w-3" />View Contract</Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => toast.info('Initiating escrow…')}><DollarSign className="h-3 w-3" />Fund Escrow</Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  /* ── TAB: Notes ── */
  const renderNotes = () => {
    const withNotes = proposals.filter(p => p.notes.length > 0);
    return (
      <div className="space-y-3">
        {withNotes.length === 0 ? (
          <div className="rounded-2xl border p-8 text-center"><StickyNote className="h-6 w-6 text-muted-foreground mx-auto mb-2" /><div className="text-[11px] font-medium">No notes yet</div><div className="text-[10px] text-muted-foreground">Open a proposal detail to add review notes</div></div>
        ) : withNotes.map(p => (
          <div key={p.id} className="rounded-2xl border p-3">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6"><AvatarFallback className="text-[8px] bg-accent/10 text-accent">{p.freelancerAvatar}</AvatarFallback></Avatar>
              <span className="text-[10px] font-semibold">{p.freelancerName}</span>
              <StatusBadge status={STATUS_CONFIG[p.status].badge} label={STATUS_CONFIG[p.status].label} />
            </div>
            <div className="space-y-1 pl-8">
              {p.notes.map((n, i) => (
                <div key={i} className="text-[10px] flex items-start gap-1.5"><CircleDot className="h-2.5 w-2.5 text-accent shrink-0 mt-0.5" /><span>{n}</span></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-60" bottomSection={bottomSection}>
      {activeTab === 'all' && renderAll()}
      {activeTab === 'shortlist' && renderShortlist()}
      {activeTab === 'compare' && renderCompare()}
      {activeTab === 'awarded' && renderAwarded()}
      {activeTab === 'notes' && renderNotes()}

      <AwardModal proposal={awardTarget} onClose={() => setAwardTarget(null)} onConfirm={handleAward} />

      {/* Detail Drawer */}
      <Sheet open={!!detailProposal} onOpenChange={() => setDetailProposal(null)}>
        <SheetContent className="w-[400px] sm:w-[440px] overflow-y-auto p-0">
          {detailProposal && (() => {
            const p = detailProposal;
            const cfg = STATUS_CONFIG[p.status];
            return (
              <>
                <SheetHeader className="p-5 border-b">
                  <SheetTitle className="text-sm flex items-center gap-2">
                    <Avatar className="h-8 w-8 ring-2 ring-accent/20"><AvatarFallback className="text-[9px] bg-accent/10 text-accent font-bold">{p.freelancerAvatar}</AvatarFallback></Avatar>
                    <div><div>{p.freelancerName}</div><div className="text-[9px] text-muted-foreground font-normal">{p.title}</div></div>
                  </SheetTitle>
                </SheetHeader>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={cfg.badge} label={cfg.label} />
                    {p.boosted && <Badge className="text-[7px] bg-accent/10 text-accent gap-0.5"><Zap className="h-2.5 w-2.5" />Boosted</Badge>}
                    <Badge variant="secondary" className="text-[7px]"><Star className="h-2.5 w-2.5 text-accent fill-accent mr-0.5" />{p.rating} · {p.completedJobs} jobs</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: 'Bid', v: p.bidAmount },
                      { l: 'Timeline', v: p.timeline },
                      { l: 'Match', v: `${p.matchScore}%` },
                    ].map(m => (
                      <div key={m.l} className="rounded-2xl border p-2 text-center"><div className="text-[9px] text-muted-foreground">{m.l}</div><div className="text-sm font-bold">{m.v}</div></div>
                    ))}
                  </div>

                  <div>
                    <h4 className="text-[10px] font-semibold mb-1">Cover Letter</h4>
                    <div className="text-[10px] rounded-2xl border p-3 whitespace-pre-line">{p.coverExcerpt}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {[
                      { l: 'Location', v: p.location, icon: Flag },
                      { l: 'Member Since', v: p.memberSince, icon: History },
                      { l: 'Response Time', v: p.responseTime, icon: Clock },
                      { l: 'Screening', v: `${p.screeningScore}%`, icon: Shield },
                      { l: 'Portfolio', v: `${p.portfolioItems} items`, icon: Eye },
                      { l: 'Attachments', v: `${p.attachments} files`, icon: Paperclip },
                    ].map(m => (
                      <div key={m.l} className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-muted/30">
                        <m.icon className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{m.l}:</span>
                        <span className="font-medium">{m.v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1">{p.skills.map(s => <Badge key={s} variant="secondary" className="text-[7px]">{s}</Badge>)}</div>

                  {/* Notes */}
                  <div>
                    <h4 className="text-[10px] font-semibold mb-1 flex items-center gap-1"><StickyNote className="h-3 w-3 text-accent" />Notes ({p.notes.length})</h4>
                    {p.notes.map((n, i) => (
                      <div key={i} className="text-[10px] flex items-start gap-1.5 mb-1"><CircleDot className="h-2.5 w-2.5 text-accent shrink-0 mt-0.5" /><span>{n}</span></div>
                    ))}
                    <div className="flex gap-1 mt-1">
                      <input className="flex-1 h-7 rounded-xl border bg-background px-2 text-[10px] focus:ring-2 focus:ring-ring focus:outline-none" value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="Add a note…" onKeyDown={e => e.key === 'Enter' && addNote(p.id)} />
                      <Button size="sm" className="h-7 text-[9px] rounded-xl" onClick={() => addNote(p.id)}>Add</Button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {p.status !== 'awarded' && p.status !== 'rejected' && p.status !== 'withdrawn' && (
                      <>
                        <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => { setDetailProposal(null); setAwardTarget(p); }}><Award className="h-3 w-3" />Award</Button>
                        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => handleShortlist(p.id)}>
                          {p.status === 'shortlisted' ? <><Bookmark className="h-3 w-3 fill-current" />Unshortlist</> : <><BookmarkPlus className="h-3 w-3" />Shortlist</>}
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => toast.info('Opening message…')}><MessageSquare className="h-3 w-3" />Message</Button>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl" asChild><Link to="/profile"><ExternalLink className="h-3 w-3" />Profile</Link></Button>
                    {p.status !== 'rejected' && p.status !== 'withdrawn' && p.status !== 'awarded' && (
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 rounded-xl text-[hsl(var(--state-blocked))]" onClick={() => { handleReject(p.id); setDetailProposal(null); }}><XCircle className="h-3 w-3" />Reject</Button>
                    )}
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

export default ProposalReviewAwardPage;
