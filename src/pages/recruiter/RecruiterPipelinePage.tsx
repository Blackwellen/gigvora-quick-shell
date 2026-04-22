import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, KPIBand, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Search, Filter, Users, Plus, Eye, MessageSquare, Mail,
  Grid3X3, List, Clock, Star, Sparkles, BarChart3, Download,
  X, CheckCircle2, UserCheck, ChevronRight, Send, Calendar,
  Settings, ArrowRight, ArrowLeft, MoreHorizontal, FileText,
  Briefcase, MapPin, Phone, AlertTriangle, Loader2, ThumbsUp,
  ThumbsDown, Bookmark, ExternalLink, Copy, Zap, Hash,
  type LucideIcon,
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════ */
type PipelineTab = 'board' | 'table' | 'stage-detail' | 'analytics';
type StageId = 'applied' | 'screening' | 'interview' | 'assessment' | 'offer' | 'hired' | 'rejected';

interface PipelineCandidate {
  id: string; name: string; avatar: string; headline: string; location: string;
  appliedDate: string; stage: StageId; score: number; starred: boolean;
  tags: string[]; notes: CollabNote[]; lastActivity: string;
  interviewDate?: string; source: string;
}

interface CollabNote {
  id: string; author: string; avatar: string; text: string; date: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface PipelineStage {
  id: StageId; label: string; color: string; limit?: number;
}

const STAGES: PipelineStage[] = [
  { id: 'applied', label: 'Applied', color: 'bg-muted-foreground' },
  { id: 'screening', label: 'Screening', color: 'bg-accent' },
  { id: 'interview', label: 'Interview', color: 'bg-[hsl(var(--state-review))]' },
  { id: 'assessment', label: 'Assessment', color: 'bg-[hsl(var(--state-caution))]' },
  { id: 'offer', label: 'Offer', color: 'bg-[hsl(var(--state-premium))]' },
  { id: 'hired', label: 'Hired', color: 'bg-[hsl(var(--state-healthy))]', limit: 2 },
  { id: 'rejected', label: 'Rejected', color: 'bg-[hsl(var(--state-blocked))]' },
];

const STAGE_STATUS_MAP: Record<StageId, 'pending' | 'review' | 'caution' | 'premium' | 'healthy' | 'blocked' | 'live'> = {
  applied: 'pending', screening: 'live', interview: 'review',
  assessment: 'caution', offer: 'premium', hired: 'healthy', rejected: 'blocked',
};

const MOCK_CANDIDATES: PipelineCandidate[] = [
  { id: 'c1', name: 'Elena Kowalski', avatar: 'EK', headline: 'Senior Full-Stack Engineer', location: 'San Francisco, CA', appliedDate: 'Apr 2', stage: 'interview', score: 92, starred: true, tags: ['Top Match', 'Referral'], source: 'Referral', lastActivity: '2h ago', interviewDate: 'Apr 15, 2:00 PM', notes: [
    { id: 'n1', author: 'Sarah Chen', avatar: 'SC', text: 'Strong system design skills. Excellent communication. Recommend advancing.', date: 'Apr 10', sentiment: 'positive' },
    { id: 'n2', author: 'Mike Torres', avatar: 'MT', text: 'Technical screening passed with flying colors. 95th percentile.', date: 'Apr 8', sentiment: 'positive' },
  ]},
  { id: 'c2', name: 'Marcus Chen', avatar: 'MC', headline: 'Staff Product Designer', location: 'New York, NY', appliedDate: 'Apr 1', stage: 'assessment', score: 88, starred: true, tags: ['Design Systems'], source: 'LinkedIn', lastActivity: '1d ago', notes: [
    { id: 'n3', author: 'Sarah Chen', avatar: 'SC', text: 'Portfolio is exceptional. Schedule final round with design director.', date: 'Apr 9', sentiment: 'positive' },
  ]},
  { id: 'c3', name: 'Priya Sharma', avatar: 'PS', headline: 'ML Engineer · NLP', location: 'London, UK', appliedDate: 'Mar 28', stage: 'screening', score: 85, starred: false, tags: ['ML/AI'], source: 'Job Board', lastActivity: '3d ago', notes: [] },
  { id: 'c4', name: 'James Rodriguez', avatar: 'JR', headline: 'DevOps Lead', location: 'Austin, TX', appliedDate: 'Apr 3', stage: 'applied', score: 78, starred: false, tags: ['Infrastructure'], source: 'Direct', lastActivity: '5h ago', notes: [] },
  { id: 'c5', name: 'Sophia Lang', avatar: 'SL', headline: 'Engineering Manager', location: 'Berlin, DE', appliedDate: 'Mar 25', stage: 'offer', score: 94, starred: true, tags: ['Leadership', 'Top Match'], source: 'Recruiter', lastActivity: '6h ago', interviewDate: 'Apr 12', notes: [
    { id: 'n4', author: 'Mike Torres', avatar: 'MT', text: 'Offer extended at $185K. Awaiting response by Apr 18.', date: 'Apr 13', sentiment: 'neutral' },
  ]},
  { id: 'c6', name: 'David Kim', avatar: 'DK', headline: 'Senior iOS Engineer', location: 'Seattle, WA', appliedDate: 'Apr 5', stage: 'applied', score: 74, starred: false, tags: ['Mobile'], source: 'Careers Page', lastActivity: '12h ago', notes: [] },
  { id: 'c7', name: 'Amara Okafor', avatar: 'AO', headline: 'Data Platform Architect', location: 'Toronto, CA', appliedDate: 'Mar 30', stage: 'interview', score: 82, starred: false, tags: ['Data'], source: 'LinkedIn', lastActivity: '1d ago', interviewDate: 'Apr 16, 10:00 AM', notes: [
    { id: 'n5', author: 'Sarah Chen', avatar: 'SC', text: 'Good technical depth but needs follow-up on leadership experience.', date: 'Apr 11', sentiment: 'neutral' },
  ]},
  { id: 'c8', name: 'Oliver Bauer', avatar: 'OB', headline: 'Security Engineer', location: 'Zürich, CH', appliedDate: 'Apr 4', stage: 'screening', score: 80, starred: false, tags: ['Security'], source: 'Referral', lastActivity: '4d ago', notes: [] },
  { id: 'c9', name: 'Lina Petrov', avatar: 'LP', headline: 'Backend Engineer · Rust', location: 'Remote', appliedDate: 'Apr 6', stage: 'rejected', score: 55, starred: false, tags: [], source: 'Job Board', lastActivity: '5d ago', notes: [
    { id: 'n6', author: 'Mike Torres', avatar: 'MT', text: 'Did not meet minimum experience requirement for senior role.', date: 'Apr 7', sentiment: 'negative' },
  ]},
  { id: 'c10', name: 'Takeshi Yamamoto', avatar: 'TY', headline: 'Frontend Architect', location: 'Tokyo, JP', appliedDate: 'Mar 29', stage: 'hired', score: 96, starred: true, tags: ['Top Match', 'React'], source: 'Recruiter', lastActivity: '1d ago', notes: [
    { id: 'n7', author: 'Sarah Chen', avatar: 'SC', text: 'Offer accepted! Start date May 1. Exceptional candidate.', date: 'Apr 12', sentiment: 'positive' },
  ]},
];

/* ═══════════════════════════════════════════════════════════
   Kanban Card
   ═══════════════════════════════════════════════════════════ */
const KanbanCard: React.FC<{ c: PipelineCandidate; onClick: () => void; selected?: boolean; onSelect?: () => void }> = ({ c, onClick, selected, onSelect }) => (
  <div className={cn('rounded-2xl border bg-card p-2.5 hover:shadow-md transition-all cursor-pointer group', selected && 'ring-1 ring-accent')} onClick={onClick}>
    <div className="flex items-start gap-2 mb-1.5">
      <div className="relative">
        <Avatar className="h-8 w-8 ring-1 ring-muted/30"><AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">{c.avatar}</AvatarFallback></Avatar>
        {c.starred && <Star className="absolute -top-1 -right-1 h-3 w-3 text-[hsl(var(--state-caution))] fill-[hsl(var(--state-caution))]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold truncate group-hover:text-accent transition-colors">{c.name}</div>
        <div className="text-[8px] text-muted-foreground truncate">{c.headline}</div>
      </div>
      <input type="checkbox" checked={selected} onChange={e => { e.stopPropagation(); onSelect?.(); }} className="rounded h-3 w-3 shrink-0 mt-0.5" onClick={e => e.stopPropagation()} />
    </div>
    <div className="flex items-center gap-1 text-[7px] text-muted-foreground mb-1.5">
      <MapPin className="h-2 w-2" />{c.location} · <Clock className="h-2 w-2" />{c.lastActivity}
    </div>
    <div className="flex items-center justify-between">
      <div className="flex gap-0.5">
        {c.tags.slice(0, 2).map(t => <span key={t} className="text-[6px] bg-accent/10 text-accent rounded-full px-1.5 py-0.5">{t}</span>)}
      </div>
      <div className="flex items-center gap-1">
        {c.notes.length > 0 && <Badge variant="secondary" className="text-[6px] h-4 px-1"><MessageSquare className="h-2 w-2 mr-0.5" />{c.notes.length}</Badge>}
        <span className="text-[9px] font-bold text-accent">{c.score}%</span>
      </div>
    </div>
    {c.interviewDate && <div className="mt-1.5 text-[7px] bg-[hsl(var(--state-review)/0.1)] text-[hsl(var(--state-review))] rounded-lg px-1.5 py-0.5 flex items-center gap-0.5"><Calendar className="h-2 w-2" />{c.interviewDate}</div>}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Candidate Detail Drawer
   ═══════════════════════════════════════════════════════════ */
const CandidateDetailDrawer: React.FC<{
  c: PipelineCandidate | null; onClose: () => void;
  onMove: (id: string, stage: StageId) => void;
  onAddNote: (id: string, note: string) => void;
}> = ({ c, onClose, onMove, onAddNote }) => {
  const [newNote, setNewNote] = useState('');
  if (!c) return null;
  const currentIdx = STAGES.findIndex(s => s.id === c.stage);
  const nextStage = STAGES[currentIdx + 1];
  const prevStage = currentIdx > 0 ? STAGES[currentIdx - 1] : null;

  return (
    <Sheet open={!!c} onOpenChange={() => onClose()}>
      <SheetContent className="w-[480px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><UserCheck className="h-4 w-4 text-accent" />Candidate Detail</SheetTitle></SheetHeader>
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar className="h-14 w-14 ring-2 ring-accent/20"><AvatarFallback className="text-sm bg-accent/10 text-accent font-bold">{c.avatar}</AvatarFallback></Avatar>
              {c.starred && <Star className="absolute -top-1 -right-1 h-4 w-4 text-[hsl(var(--state-caution))] fill-[hsl(var(--state-caution))]" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-bold">{c.name}</h3>
              <p className="text-[10px] text-muted-foreground">{c.headline}</p>
              <div className="flex items-center gap-2 mt-0.5 text-[9px] text-muted-foreground"><MapPin className="h-3 w-3" />{c.location}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{c.score}%</div>
              <div className="text-[8px] text-muted-foreground">Fit Score</div>
            </div>
          </div>

          {/* Stage & status */}
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge status={STAGE_STATUS_MAP[c.stage]} label={STAGES.find(s => s.id === c.stage)?.label} />
            {c.tags.map(t => <Badge key={t} variant="secondary" className="text-[8px]">{t}</Badge>)}
            <Badge variant="secondary" className="text-[8px]">Applied {c.appliedDate}</Badge>
            <Badge variant="secondary" className="text-[8px]">Source: {c.source}</Badge>
          </div>

          {/* Stage progression visual */}
          <div>
            <div className="text-[9px] font-semibold mb-1.5">Pipeline Stage</div>
            <div className="flex items-center gap-0.5">
              {STAGES.filter(s => s.id !== 'rejected').map((s, i) => {
                const isActive = s.id === c.stage;
                const isPast = STAGES.findIndex(st => st.id === c.stage) > i;
                return (
                  <React.Fragment key={s.id}>
                    <button onClick={() => onMove(c.id, s.id)} className={cn('h-6 flex-1 rounded-lg text-[7px] font-semibold transition-all', isActive ? `${s.color} text-white` : isPast ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>{s.label}</button>
                    {i < STAGES.length - 2 && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Upcoming interview */}
          {c.interviewDate && (
            <div className="rounded-2xl border border-[hsl(var(--state-review)/0.3)] bg-[hsl(var(--state-review)/0.05)] p-3">
              <div className="flex items-center gap-2 text-[10px]">
                <Calendar className="h-3.5 w-3.5 text-[hsl(var(--state-review))]" />
                <span className="font-semibold">Interview: {c.interviewDate}</span>
              </div>
            </div>
          )}

          {/* Scorecard */}
          <SectionCard title="Quick Scorecard" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {[
                { label: 'Technical Skills', val: Math.min(100, c.score + 3) },
                { label: 'Communication', val: Math.min(100, c.score - 2) },
                { label: 'Culture Fit', val: Math.min(100, c.score + 5) },
                { label: 'Leadership', val: Math.max(40, c.score - 10) },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="text-[8px] w-20 text-muted-foreground">{s.label}</span>
                  <div className="flex-1"><Progress value={s.val} className="h-1.5" /></div>
                  <span className="text-[8px] font-bold w-6 text-right">{s.val}%</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-semibold flex items-center gap-1"><MessageSquare className="h-3 w-3 text-accent" />Collaboration Notes ({c.notes.length})</h4>
            </div>
            <div className="space-y-2 mb-3">
              {c.notes.length === 0 && <div className="text-[9px] text-muted-foreground italic p-3 text-center border border-dashed rounded-xl">No notes yet. Be the first to add one.</div>}
              {c.notes.map(n => (
                <div key={n.id} className="rounded-xl border p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-5 w-5"><AvatarFallback className="text-[6px] bg-accent/10 text-accent font-bold">{n.avatar}</AvatarFallback></Avatar>
                    <span className="text-[9px] font-semibold">{n.author}</span>
                    <span className="text-[7px] text-muted-foreground ml-auto">{n.date}</span>
                    {n.sentiment === 'positive' && <ThumbsUp className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" />}
                    {n.sentiment === 'negative' && <ThumbsDown className="h-2.5 w-2.5 text-[hsl(var(--state-blocked))]" />}
                  </div>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">{n.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5">
              <Textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note..." className="text-[10px] min-h-[50px] rounded-xl" />
            </div>
            <div className="flex gap-1.5 mt-1.5">
              <Button size="sm" className="h-6 text-[8px] rounded-lg gap-1" disabled={!newNote.trim()} onClick={() => { onAddNote(c.id, newNote); setNewNote(''); toast.success('Note added'); }}><Send className="h-2.5 w-2.5" />Add Note</Button>
              <Button size="sm" variant="outline" className="h-6 text-[8px] rounded-lg gap-1" onClick={() => toast.info('AI summarizing...')}><Sparkles className="h-2.5 w-2.5" />AI Summary</Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 pt-3 border-t">
            <div className="flex gap-1.5">
              {nextStage && c.stage !== 'rejected' && (
                <Button size="sm" className="flex-1 h-7 text-[10px] rounded-xl gap-1" onClick={() => { onMove(c.id, nextStage.id); toast.success(`Moved to ${nextStage.label}`); }}>
                  <ArrowRight className="h-3 w-3" />Move to {nextStage.label}
                </Button>
              )}
              {prevStage && (
                <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-xl gap-1" onClick={() => { onMove(c.id, prevStage.id); toast.success(`Moved back to ${prevStage.label}`); }}>
                  <ArrowLeft className="h-3 w-3" />Back
                </Button>
              )}
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] rounded-xl gap-1"><Mail className="h-3 w-3" />Email</Button>
              <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] rounded-xl gap-1"><Calendar className="h-3 w-3" />Schedule</Button>
              <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] rounded-xl gap-1" asChild><Link to="/profile"><ExternalLink className="h-3 w-3" />Profile</Link></Button>
            </div>
            {c.stage !== 'rejected' && c.stage !== 'hired' && (
              <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-xl gap-1 text-[hsl(var(--state-blocked))]" onClick={() => { onMove(c.id, 'rejected'); toast.info('Candidate rejected'); }}>
                <X className="h-3 w-3" />Reject
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const RecruiterPipelinePage: React.FC = () => {
  const { activeRole } = useRole();
  const [activeTab, setActiveTab] = useState<PipelineTab>('board');
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<StageId | 'all'>('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [viewStageId, setViewStageId] = useState<StageId>('interview');

  const filteredCandidates = useMemo(() => {
    let r = [...candidates];
    if (stageFilter !== 'all') r = r.filter(c => c.stage === stageFilter);
    if (searchQuery) { const q = searchQuery.toLowerCase(); r = r.filter(c => c.name.toLowerCase().includes(q) || c.headline.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q))); }
    return r;
  }, [candidates, stageFilter, searchQuery]);

  const selectedCandidate = candidates.find(c => c.id === selectedId) || null;

  const moveCandidate = useCallback((id: string, stage: StageId) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage } : c));
  }, []);

  const addNote = useCallback((id: string, text: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, notes: [...c.notes, { id: `n-${Date.now()}`, author: 'You', avatar: 'YO', text, date: 'Now', sentiment: 'neutral' }] } : c));
  }, []);

  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const clearSelection = () => setSelectedIds([]);

  const stageCounts = useMemo(() => {
    const m: Record<string, number> = {};
    STAGES.forEach(s => { m[s.id] = candidates.filter(c => c.stage === s.id).length; });
    return m;
  }, [candidates]);

  const totalActive = candidates.filter(c => c.stage !== 'rejected' && c.stage !== 'hired').length;

  const TABS: { id: PipelineTab; label: string; icon: LucideIcon }[] = [
    { id: 'board', label: 'Kanban Board', icon: Grid3X3 },
    { id: 'table', label: 'Table View', icon: List },
    { id: 'stage-detail', label: 'Stage Detail', icon: Filter },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Users className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Candidate Pipeline</span>
        <StatusBadge status="live" label={`${totalActive} Active`} />
      </div>
      <div className="flex-1" />
      <select value={jobFilter} onChange={e => setJobFilter(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px]">
        <option value="all">All Jobs</option>
        <option value="senior-fe">Senior Frontend Engineer</option>
        <option value="staff-design">Staff Product Designer</option>
        <option value="eng-mgr">Engineering Manager</option>
      </select>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => toast.success('Candidate added')}><Plus className="h-3 w-3" />Add Candidate</Button>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <KPIBand className="!grid-cols-2">
        <KPICard label="Total Pipeline" value={candidates.length} trend="neutral" />
        <KPICard label="Active" value={totalActive} change={`${Math.round((totalActive / candidates.length) * 100)}% of total`} trend="up" />
      </KPIBand>

      <SectionCard title="Stage Breakdown" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {STAGES.map(s => (
            <button key={s.id} onClick={() => { setStageFilter(stageFilter === s.id ? 'all' : s.id); setActiveTab('board'); }} className={cn('flex items-center gap-2 w-full px-2 py-1.5 rounded-xl text-[9px] transition-all', stageFilter === s.id ? 'bg-accent/10 text-accent' : 'hover:bg-muted/30')}>
              <span className={cn('h-2 w-2 rounded-full', s.color)} />
              <span className="flex-1 text-left font-medium">{s.label}</span>
              <span className="font-bold">{stageCounts[s.id]}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { label: 'Schedule bulk interviews', icon: Calendar, action: () => toast.info('Scheduler') },
            { label: 'Send status updates', icon: Send, action: () => toast.info('Updates sent') },
            { label: 'Export pipeline report', icon: FileText, action: () => toast.info('Exported') },
            { label: 'View interview handoffs', icon: ArrowRight, action: () => toast.info('Handoffs') },
          ].map(a => (
            <button key={a.label} onClick={a.action} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl text-[9px] hover:bg-muted/30 transition-all font-medium group">
              <a.icon className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" /><span className="group-hover:text-accent transition-colors">{a.label}</span>
              <ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Recent activity */}
      <SectionCard title="Recent Activity" icon={<Clock className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {candidates.filter(c => c.notes.length > 0).slice(0, 3).map(c => (
            <div key={c.id} className="flex items-center gap-2 p-1 rounded-xl hover:bg-muted/30 cursor-pointer transition-all" onClick={() => setSelectedId(c.id)}>
              <Avatar className="h-5 w-5"><AvatarFallback className="text-[6px] bg-accent/10 text-accent font-bold">{c.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0"><div className="text-[8px] font-medium truncate">{c.name}</div><div className="text-[7px] text-muted-foreground truncate">{c.notes[c.notes.length - 1]?.text.slice(0, 40)}...</div></div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom Section ── */
  const bottomSection = (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5 text-accent" />Pipeline Funnel</span>
        <span className="text-[8px] text-muted-foreground">Conversion rates between stages</span>
      </div>
      <div className="flex items-end gap-1">
        {STAGES.filter(s => s.id !== 'rejected').map((s, i, arr) => {
          const count = stageCounts[s.id];
          const maxCount = Math.max(...arr.map(st => stageCounts[st.id]), 1);
          const height = Math.max(12, (count / maxCount) * 48);
          const prevCount = i > 0 ? stageCounts[arr[i - 1].id] : count;
          const rate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
          return (
            <div key={s.id} className="flex-1 text-center">
              <div className="text-[8px] font-bold mb-0.5">{count}</div>
              <div className={cn('mx-auto rounded-t-lg transition-all', s.color)} style={{ height: `${height}px`, width: '100%', maxWidth: '40px', opacity: 0.7 }} />
              <div className="text-[7px] text-muted-foreground mt-0.5">{s.label}</div>
              {i > 0 && <div className="text-[6px] text-accent font-semibold">{rate}%</div>}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-2.5 flex items-center gap-3 mb-3">
          <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
          <span className="text-[10px] font-semibold">{selectedIds.length} selected</span>
          <div className="flex-1 flex gap-1.5">
            <Button size="sm" className="h-6 text-[8px] rounded-lg" onClick={() => { toast.success('Moved to next stage'); clearSelection(); }}>Move to Next Stage</Button>
            <Button size="sm" variant="outline" className="h-6 text-[8px] rounded-lg" onClick={() => { toast.info('Emails sent'); clearSelection(); }}>Bulk Email</Button>
            <Button size="sm" variant="outline" className="h-6 text-[8px] rounded-lg" onClick={() => { toast.info('Scheduled'); clearSelection(); }}>Schedule All</Button>
            <Button size="sm" variant="outline" className="h-6 text-[8px] rounded-lg text-[hsl(var(--state-blocked))]" onClick={() => { toast.info('Rejected'); clearSelection(); }}>Reject All</Button>
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-[8px]" onClick={clearSelection}><X className="h-3 w-3" /></Button>
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
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="h-7 pl-7 pr-2 w-36 rounded-xl border bg-background text-[9px]" />
        </div>
      </div>

      {/* ═══ KANBAN BOARD TAB ═══ */}
      {activeTab === 'board' && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {STAGES.map(stage => {
            const cards = filteredCandidates.filter(c => c.stage === stage.id);
            return (
              <div key={stage.id} className="flex-shrink-0 w-[200px]">
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <span className={cn('h-2 w-2 rounded-full', stage.color)} />
                  <span className="text-[10px] font-bold">{stage.label}</span>
                  <Badge variant="secondary" className="text-[7px] h-4 px-1.5 ml-auto">{cards.length}</Badge>
                  {stage.limit && cards.length >= stage.limit && <AlertTriangle className="h-3 w-3 text-[hsl(var(--state-caution))]" />}
                </div>
                <div className="space-y-1.5 min-h-[120px] p-1 rounded-2xl bg-muted/20 border border-dashed border-muted">
                  {cards.length === 0 && <div className="text-center text-[8px] text-muted-foreground py-6">No candidates</div>}
                  {cards.map(c => (
                    <KanbanCard key={c.id} c={c} onClick={() => setSelectedId(c.id)} selected={selectedIds.includes(c.id)} onSelect={() => toggleSelect(c.id)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ TABLE VIEW TAB ═══ */}
      {activeTab === 'table' && (
        <div className="rounded-2xl border overflow-hidden">
          <div className="grid grid-cols-[32px_1fr_100px_80px_70px_60px_80px_80px] gap-2 px-3 py-2 bg-muted/50 border-b text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span />
            <span>Candidate</span><span>Stage</span><span>Location</span><span>Score</span><span>Notes</span><span>Source</span><span className="text-right">Actions</span>
          </div>
          {filteredCandidates.map(c => (
            <div key={c.id} className={cn('grid grid-cols-[32px_1fr_100px_80px_70px_60px_80px_80px] gap-2 px-3 py-2.5 border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer items-center', selectedIds.includes(c.id) && 'bg-accent/5')} onClick={() => setSelectedId(c.id)}>
              <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)} onClick={e => e.stopPropagation()} className="rounded h-3 w-3" />
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-6 w-6 ring-1 ring-muted/30"><AvatarFallback className="text-[7px] bg-accent/10 text-accent font-bold">{c.avatar}</AvatarFallback></Avatar>
                <div className="min-w-0"><div className="text-[9px] font-medium truncate">{c.name}</div><div className="text-[7px] text-muted-foreground truncate">{c.headline}</div></div>
                {c.starred && <Star className="h-2.5 w-2.5 text-[hsl(var(--state-caution))] fill-[hsl(var(--state-caution))] shrink-0" />}
              </div>
              <StatusBadge status={STAGE_STATUS_MAP[c.stage]} label={STAGES.find(s => s.id === c.stage)?.label} />
              <span className="text-[8px] text-muted-foreground truncate">{c.location}</span>
              <span className="text-[9px] font-bold text-accent">{c.score}%</span>
              <span className="text-[8px] text-muted-foreground">{c.notes.length}</span>
              <span className="text-[8px] text-muted-foreground">{c.source}</span>
              <div className="flex items-center justify-end gap-0.5">
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); toast.info('Email sent'); }}><Mail className="h-2.5 w-2.5" /></Button>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); const idx = STAGES.findIndex(s => s.id === c.stage); if (idx < STAGES.length - 2) { moveCandidate(c.id, STAGES[idx + 1].id); toast.success('Advanced'); } }}><ArrowRight className="h-2.5 w-2.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ STAGE DETAIL TAB ═══ */}
      {activeTab === 'stage-detail' && (
        <div className="space-y-3">
          <div className="flex gap-1.5 overflow-x-auto">
            {STAGES.map(s => (
              <button key={s.id} onClick={() => setViewStageId(s.id)} className={cn('flex items-center gap-1 px-3 py-1.5 text-[9px] font-semibold rounded-xl transition-all shrink-0', viewStageId === s.id ? 'bg-accent text-accent-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50')}>
                <span className={cn('h-2 w-2 rounded-full', s.color)} />{s.label} ({stageCounts[s.id]})
              </button>
            ))}
          </div>

          <SectionCard title={`${STAGES.find(s => s.id === viewStageId)?.label} Stage`} icon={<Filter className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl" action={
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg">Move All →</Button>
              <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg">Email All</Button>
            </div>
          }>
            {candidates.filter(c => c.stage === viewStageId).length === 0 ? (
              <div className="text-center py-6 text-[10px] text-muted-foreground">No candidates in this stage</div>
            ) : (
              <div className="space-y-2">
                {candidates.filter(c => c.stage === viewStageId).map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl border hover:shadow-sm transition-all cursor-pointer" onClick={() => setSelectedId(c.id)}>
                    <Avatar className="h-9 w-9 ring-1 ring-muted/30"><AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">{c.avatar}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1"><span className="text-[10px] font-bold">{c.name}</span>{c.starred && <Star className="h-2.5 w-2.5 text-[hsl(var(--state-caution))] fill-[hsl(var(--state-caution))]" />}</div>
                      <div className="text-[8px] text-muted-foreground">{c.headline} · {c.location}</div>
                      <div className="flex gap-1 mt-0.5">{c.tags.slice(0, 2).map(t => <span key={t} className="text-[6px] bg-accent/10 text-accent rounded-full px-1.5 py-0.5">{t}</span>)}</div>
                    </div>
                    <div className="text-center shrink-0"><div className="text-sm font-bold text-accent">{c.score}%</div><div className="text-[7px] text-muted-foreground">score</div></div>
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <Button size="sm" className="h-5 text-[7px] rounded-lg gap-0.5"><ArrowRight className="h-2 w-2" />Advance</Button>
                      <Button size="sm" variant="outline" className="h-5 text-[7px] rounded-lg gap-0.5"><MessageSquare className="h-2 w-2" />Note</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ═══ ANALYTICS TAB ═══ */}
      {activeTab === 'analytics' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Candidates" value={candidates.length} trend="neutral" />
            <KPICard label="Active Pipeline" value={totalActive} change={`${Math.round((totalActive / candidates.length) * 100)}%`} trend="up" />
            <KPICard label="Avg Score" value={`${Math.round(candidates.reduce((s, c) => s + c.score, 0) / candidates.length)}%`} trend="up" change="+3 vs last month" />
            <KPICard label="Avg Time in Stage" value="4.2d" change="-0.8d improvement" trend="up" />
          </KPIBand>

          <div className="grid md:grid-cols-2 gap-3">
            <SectionCard title="Conversion Rates" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-2">
                {STAGES.filter(s => s.id !== 'rejected').slice(0, -1).map((s, i) => {
                  const from = stageCounts[s.id];
                  const nextS = STAGES.filter(st => st.id !== 'rejected')[i + 1];
                  if (!nextS) return null;
                  const to = stageCounts[nextS.id];
                  const rate = from > 0 ? Math.round((to / from) * 100) : 0;
                  return (
                    <div key={s.id} className="flex items-center gap-2">
                      <span className="text-[8px] w-24 truncate">{s.label} → {nextS.label}</span>
                      <div className="flex-1"><Progress value={rate} className="h-1.5" /></div>
                      <span className="text-[9px] font-bold w-10 text-right">{rate}%</span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Source Distribution" icon={<Hash className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-1.5">
                {['Referral', 'LinkedIn', 'Job Board', 'Recruiter', 'Direct', 'Careers Page'].map(src => {
                  const count = candidates.filter(c => c.source === src).length;
                  return (
                    <div key={src} className="flex items-center gap-2">
                      <span className="text-[9px] w-20">{src}</span>
                      <div className="flex-1"><Progress value={(count / candidates.length) * 100} className="h-1.5" /></div>
                      <span className="text-[8px] font-bold w-4 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Team Activity" icon={<Users className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'Sarah Chen', avatar: 'SC', notes: 3, moves: 5, interviews: 2 },
                { name: 'Mike Torres', avatar: 'MT', notes: 4, moves: 3, interviews: 4 },
                { name: 'You', avatar: 'YO', notes: 1, moves: 2, interviews: 1 },
              ].map(m => (
                <div key={m.name} className="rounded-xl border p-2.5 text-center">
                  <Avatar className="h-8 w-8 mx-auto mb-1.5 ring-1 ring-muted/30"><AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">{m.avatar}</AvatarFallback></Avatar>
                  <div className="text-[9px] font-semibold">{m.name}</div>
                  <div className="grid grid-cols-3 gap-1 mt-1.5 text-[7px] text-muted-foreground">
                    <div><div className="font-bold text-foreground">{m.notes}</div>notes</div>
                    <div><div className="font-bold text-foreground">{m.moves}</div>moves</div>
                    <div><div className="font-bold text-foreground">{m.interviews}</div>intv</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      <CandidateDetailDrawer c={selectedCandidate} onClose={() => setSelectedId(null)} onMove={moveCandidate} onAddNote={addNote} />
    </DashboardLayout>
  );
};

export default RecruiterPipelinePage;
