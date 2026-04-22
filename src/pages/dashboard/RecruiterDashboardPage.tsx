import React, { useState } from 'react';
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
  Briefcase, DollarSign, Star, Clock, TrendingUp, BarChart3,
  FileText, MessageSquare, Users, Calendar, Plus, ChevronRight,
  Layers, Zap, CheckCircle2, AlertTriangle, Eye,
  Target, Building2, CreditCard, Activity,
  Shield, Flag, ExternalLink, UserCheck,
  Bookmark, Search, Send, Phone, Video, MapPin,
  ThumbsUp, ThumbsDown, ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRole } from '@/contexts/RoleContext';

type TimeRange = '7d' | '30d' | '90d';
type RecTab = 'overview' | 'pipeline' | 'jobs' | 'velocity' | 'interviews' | 'lists' | 'team' | 'credits';

interface Candidate {
  id: string; name: string; role: string; stage: 'sourced' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  match: number; appliedDays: number; job: string; location: string;
}

interface Job {
  id: string; title: string; applicants: number; shortlisted: number; interviews: number;
  offers: number; hired: number; status: 'active' | 'paused' | 'closed' | 'draft'; daysOpen: number;
}

const CANDIDATES: Candidate[] = [
  { id: 'c1', name: 'Sarah Chen', role: 'Senior React Dev', stage: 'interview', match: 96, appliedDays: 3, job: 'Frontend Lead', location: 'Remote' },
  { id: 'c2', name: 'Marcus Johnson', role: 'Full-Stack Engineer', stage: 'screening', match: 91, appliedDays: 1, job: 'Frontend Lead', location: 'NYC' },
  { id: 'c3', name: 'Elena Petrova', role: 'UX Designer', stage: 'offer', match: 94, appliedDays: 8, job: 'Product Designer', location: 'London' },
  { id: 'c4', name: 'James Okafor', role: 'DevOps Engineer', stage: 'sourced', match: 88, appliedDays: 0, job: 'Platform Eng', location: 'Berlin' },
  { id: 'c5', name: 'Priya Sharma', role: 'Data Scientist', stage: 'hired', match: 93, appliedDays: 14, job: 'ML Engineer', location: 'Remote' },
  { id: 'c6', name: 'Alex Kim', role: 'Backend Dev', stage: 'rejected', match: 72, appliedDays: 5, job: 'Frontend Lead', location: 'SF' },
];

const JOBS: Job[] = [
  { id: 'j1', title: 'Frontend Lead', applicants: 45, shortlisted: 8, interviews: 3, offers: 1, hired: 0, status: 'active', daysOpen: 12 },
  { id: 'j2', title: 'Product Designer', applicants: 32, shortlisted: 5, interviews: 2, offers: 1, hired: 0, status: 'active', daysOpen: 18 },
  { id: 'j3', title: 'ML Engineer', applicants: 28, shortlisted: 6, interviews: 4, offers: 1, hired: 1, status: 'closed', daysOpen: 21 },
  { id: 'j4', title: 'Platform Engineer', applicants: 15, shortlisted: 2, interviews: 0, offers: 0, hired: 0, status: 'active', daysOpen: 5 },
  { id: 'j5', title: 'Content Strategist', applicants: 0, shortlisted: 0, interviews: 0, offers: 0, hired: 0, status: 'draft', daysOpen: 0 },
];

const STAGE_MAP: Record<string, { badge: 'healthy' | 'live' | 'caution' | 'blocked' | 'review' | 'pending' | 'premium'; label: string }> = {
  sourced: { badge: 'pending', label: 'Sourced' },
  screening: { badge: 'caution', label: 'Screening' },
  interview: { badge: 'live', label: 'Interview' },
  offer: { badge: 'premium', label: 'Offer' },
  hired: { badge: 'healthy', label: 'Hired' },
  rejected: { badge: 'blocked', label: 'Rejected' },
};

const JOB_STATUS: Record<string, { badge: 'healthy' | 'live' | 'caution' | 'blocked' | 'pending'; label: string }> = {
  active: { badge: 'live', label: 'Active' },
  paused: { badge: 'caution', label: 'Paused' },
  closed: { badge: 'healthy', label: 'Closed' },
  draft: { badge: 'pending', label: 'Draft' },
};

const PIPELINE_STAGES = ['sourced', 'screening', 'interview', 'offer', 'hired'] as const;

const RecruiterDashboardPage: React.FC = () => {
  const { activeRole } = useRole();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [tab, setTab] = useState<RecTab>('overview');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [detailItem, setDetailItem] = useState<{ type: string; title: string; detail: string } | null>(null);
  const [postJobDrawer, setPostJobDrawer] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const openDetail = (type: string, title: string, detail: string) => {
    setDetailItem({ type, title, detail });
    setDetailDrawer(true);
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev);
  };

  const topStrip = (
    <>
      <UserCheck className="h-3.5 w-3.5 text-accent" />
      <span className="text-[11px] font-semibold">Recruiter Command Center</span>
      <Badge variant="secondary" className="text-[7px] capitalize">{activeRole}</Badge>
      <div className="flex-1" />
      <div className="flex items-center gap-1 border rounded-xl p-0.5">
        {(['7d', '30d', '90d'] as const).map(r => (
          <button key={r} onClick={() => setTimeRange(r)} className={cn('px-2 py-0.5 rounded-lg text-[8px] font-medium transition-colors', timeRange === r ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted/30')}>{r}</button>
        ))}
      </div>
      <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setPostJobDrawer(true)}><Plus className="h-3 w-3" />Post Job</Button>
      <Link to="/recruiter/talent-search"><Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Search className="h-3 w-3" />Search</Button></Link>
    </>
  );

  const rightRail = selectedCandidate ? (
    <div className="space-y-3">
      <SectionCard title="Candidate Detail" icon={<Users className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-8 w-8"><AvatarFallback className="text-[8px] bg-accent/10 text-accent">{selectedCandidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
          <div><div className="text-[10px] font-semibold">{selectedCandidate.name}</div><div className="text-[8px] text-muted-foreground">{selectedCandidate.role}</div></div>
        </div>
        <div className="space-y-1.5 text-[9px]">
          {[
            { l: 'Job', v: selectedCandidate.job },
            { l: 'Location', v: selectedCandidate.location },
            { l: 'Match', v: `${selectedCandidate.match}%` },
            { l: 'Applied', v: selectedCandidate.appliedDays === 0 ? 'Today' : `${selectedCandidate.appliedDays}d ago` },
          ].map(r => (
            <div key={r.l} className="flex justify-between"><span className="text-muted-foreground">{r.l}</span><span className="font-medium">{r.v}</span></div>
          ))}
          <div className="flex justify-between"><span className="text-muted-foreground">Stage</span><StatusBadge status={STAGE_MAP[selectedCandidate.stage].badge} label={STAGE_MAP[selectedCandidate.stage].label} /></div>
        </div>
      </SectionCard>
      <SectionCard title="Actions" className="!rounded-2xl">
        <div className="space-y-1">
          {selectedCandidate.stage === 'sourced' && <Button size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl" onClick={() => toast.success('Moved to screening')}><ArrowUpRight className="h-3 w-3" />Move to Screening</Button>}
          {selectedCandidate.stage === 'screening' && <Button size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl" onClick={() => toast.success('Interview scheduled')}><Calendar className="h-3 w-3" />Schedule Interview</Button>}
          {selectedCandidate.stage === 'interview' && <Button size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl" onClick={() => toast.success('Offer sent')}><Send className="h-3 w-3" />Send Offer</Button>}
          {selectedCandidate.stage === 'offer' && <Button size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl" onClick={() => toast.success('Marked as hired')}><CheckCircle2 className="h-3 w-3" />Mark Hired</Button>}
          <Link to="/inbox"><Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl"><MessageSquare className="h-3 w-3" />Message</Button></Link>
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl" onClick={() => openDetail('candidate', selectedCandidate.name, selectedCandidate.role)}><ExternalLink className="h-3 w-3" />Full Profile</Button>
        </div>
      </SectionCard>
    </div>
  ) : (
    <div className="space-y-3">
      <SectionCard title="Hiring Velocity" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[
            { l: 'Avg Time to Hire', v: '18 days', trend: '-3d' },
            { l: 'Offer Accept Rate', v: '78%', trend: '+5%' },
            { l: 'Response Rate', v: '62%', trend: '+8%' },
            { l: 'Pipeline Health', v: 'Good', trend: '' },
          ].map(m => (
            <div key={m.l} className="flex justify-between items-center">
              <span className="text-muted-foreground">{m.l}</span>
              <div className="flex items-center gap-1"><span className="font-bold">{m.v}</span>{m.trend && <span className="text-[7px] text-[hsl(var(--state-healthy))]">{m.trend}</span>}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Upcoming" icon={<Calendar className="h-3.5 w-3.5 text-accent" />} action={<Link to="/recruiter/interviews" className="text-[8px] text-accent hover:underline">All</Link>} className="!rounded-2xl">
        <div className="space-y-1.5">
          {[
            { t: 'Interview — Sarah Chen', time: 'Today, 2 PM', icon: Video },
            { t: 'Screening — Marcus J.', time: 'Tomorrow, 10 AM', icon: Phone },
            { t: 'Offer Review — Elena P.', time: 'Apr 18', icon: FileText },
          ].map((e, i) => (
            <div key={i} className="flex items-center gap-2 p-1.5 rounded-xl border text-[8px] cursor-pointer hover:bg-muted/20" onClick={() => openDetail('event', e.t, e.time)}>
              <e.icon className="h-3 w-3 text-accent shrink-0" />
              <div><div className="font-medium">{e.t}</div><div className="text-muted-foreground">{e.time}</div></div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Alerts" icon={<AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {[
            { text: 'Frontend Lead — 12 days, no hire', severity: 'caution' as const },
            { text: 'Credit balance low (8 left)', severity: 'blocked' as const },
            { text: 'Offer pending 5+ days — Elena', severity: 'caution' as const },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-[8px] cursor-pointer hover:bg-muted/20 rounded-lg p-1" onClick={() => openDetail('alert', a.text, 'Action needed')}>
              <StatusBadge status={a.severity} label="" />
              <span className="flex-1">{a.text}</span>
              <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><Activity className="h-3.5 w-3.5 text-accent" />Recent Activity</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {[
          { text: 'Moved Sarah Chen to Interview stage', time: '1 hr ago', icon: ArrowUpRight },
          { text: 'Sent offer to Elena Petrova', time: '3 hrs ago', icon: Send },
          { text: 'Posted Platform Engineer job', time: '1 day ago', icon: Briefcase },
          { text: 'Priya Sharma accepted offer', time: '2 days ago', icon: CheckCircle2 },
        ].map((a, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-xl border bg-card text-[8px]">
            <a.icon className="h-3 w-3 text-accent shrink-0" />
            <div><div className="font-medium">{a.text}</div><div className="text-muted-foreground">{a.time}</div></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-3 border-b pb-2 overflow-x-auto">
        {([
          { key: 'overview' as const, label: 'Overview', icon: BarChart3 },
          { key: 'pipeline' as const, label: 'Pipeline', icon: Layers },
          { key: 'jobs' as const, label: 'Job Health', icon: Briefcase },
          { key: 'velocity' as const, label: 'Velocity', icon: TrendingUp },
          { key: 'interviews' as const, label: 'Interviews', icon: Video },
          { key: 'lists' as const, label: 'Saved Lists', icon: Bookmark },
          { key: 'team' as const, label: 'Team Tasks', icon: Users },
          { key: 'credits' as const, label: 'Credits', icon: CreditCard },
        ]).map(w => (
          <button key={w.key} onClick={() => setTab(w.key)} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] transition-colors whitespace-nowrap shrink-0',
            tab === w.key ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
          )}>
            <w.icon className="h-3 w-3" />{w.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {tab === 'overview' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Open Roles" value={String(JOBS.filter(j => j.status === 'active').length)} change="+1 this week" trend="up" />
            <KPICard label="Total Applicants" value={String(JOBS.reduce((a, j) => a + j.applicants, 0))} change="+22 new" trend="up" />
            <KPICard label="Interviews This Week" value="5" />
            <KPICard label="Offers Pending" value="2" change="Action needed" />
          </KPIBand>

          {/* Pipeline Summary */}
          <SectionCard title="Pipeline Summary" icon={<Layers className="h-3.5 w-3.5 text-accent" />} action={<button onClick={() => setTab('pipeline')} className="text-[8px] text-accent hover:underline">Full Pipeline</button>} className="!rounded-2xl">
            <div className="flex gap-2">
              {PIPELINE_STAGES.map(stage => {
                const count = CANDIDATES.filter(c => c.stage === stage).length;
                const sc = STAGE_MAP[stage];
                return (
                  <div key={stage} className="flex-1 rounded-2xl border bg-card p-2 text-center">
                    <div className="text-lg font-bold">{count}</div>
                    <StatusBadge status={sc.badge} label={sc.label} />
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Top Candidates */}
          <SectionCard title="Top Candidates" icon={<Star className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {CANDIDATES.filter(c => c.stage !== 'rejected' && c.stage !== 'hired').slice(0, 4).map(c => {
                const sc = STAGE_MAP[c.stage];
                return (
                  <div key={c.id} onClick={() => setSelectedCandidate(c)} className={cn('rounded-2xl border p-2.5 cursor-pointer transition-all hover:shadow-sm', selectedCandidate?.id === c.id && 'ring-1 ring-accent border-accent/30')}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{c.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><span className="text-[10px] font-semibold truncate">{c.name}</span><Badge className="text-[7px] bg-accent/10 text-accent">{c.match}%</Badge><StatusBadge status={sc.badge} label={sc.label} /></div>
                        <div className="text-[8px] text-muted-foreground">{c.role} · {c.job} · {c.location}</div>
                      </div>
                      <button className="p-1 hover:bg-accent/10 rounded-lg" onClick={e => { e.stopPropagation(); toggleCompare(c.id); }}><Layers className={cn("h-3 w-3", compareIds.includes(c.id) ? "text-accent" : "text-muted-foreground")} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
            {compareIds.length >= 2 && <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl mt-2" onClick={() => setCompareOpen(true)}><Layers className="h-3 w-3" />Compare ({compareIds.length})</Button>}
          </SectionCard>

          {/* Job Health Quick */}
          <SectionCard title="Job Health" icon={<Briefcase className="h-3.5 w-3.5 text-accent" />} action={<button onClick={() => setTab('jobs')} className="text-[8px] text-accent hover:underline">All Jobs</button>} className="!rounded-2xl">
            <div className="space-y-1.5">
              {JOBS.filter(j => j.status === 'active').map(j => (
                <div key={j.id} className="rounded-2xl border p-2.5 hover:shadow-sm transition-all cursor-pointer" onClick={() => openDetail('job', j.title, `${j.applicants} applicants · ${j.daysOpen}d open`)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{j.title}</span><StatusBadge status="live" label="Active" /></div>
                    <span className="text-[8px] text-muted-foreground">{j.daysOpen}d open</span>
                  </div>
                  <div className="flex gap-3 mt-1 text-[8px] text-muted-foreground">
                    <span>{j.applicants} applied</span><span>{j.shortlisted} shortlisted</span><span>{j.interviews} interviews</span><span>{j.offers} offers</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ PIPELINE ═══ */}
      {tab === 'pipeline' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {PIPELINE_STAGES.map(stage => {
              const sc = STAGE_MAP[stage];
              const candidates = CANDIDATES.filter(c => c.stage === stage);
              return (
                <div key={stage} className="rounded-2xl border bg-card">
                  <div className="p-2 border-b flex items-center justify-between">
                    <StatusBadge status={sc.badge} label={sc.label} />
                    <span className="text-[9px] font-bold">{candidates.length}</span>
                  </div>
                  <div className="p-2 space-y-1.5 min-h-[120px]">
                    {candidates.map(c => (
                      <div key={c.id} onClick={() => setSelectedCandidate(c)} className={cn('rounded-xl border p-2 cursor-pointer transition-all hover:shadow-sm text-[8px]', selectedCandidate?.id === c.id && 'ring-1 ring-accent')}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Avatar className="h-4 w-4"><AvatarFallback className="text-[5px] bg-accent/10 text-accent">{c.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                          <span className="font-medium truncate">{c.name}</span>
                        </div>
                        <div className="text-muted-foreground">{c.role}</div>
                        <Badge className="text-[6px] bg-accent/10 text-accent mt-0.5">{c.match}%</Badge>
                      </div>
                    ))}
                    {candidates.length === 0 && <div className="text-[8px] text-muted-foreground text-center py-4">No candidates</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ JOB HEALTH ═══ */}
      {tab === 'jobs' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Jobs" value={String(JOBS.filter(j => j.status === 'active').length)} />
            <KPICard label="Total Applicants" value={String(JOBS.reduce((a, j) => a + j.applicants, 0))} />
            <KPICard label="Avg Days Open" value={String(Math.round(JOBS.filter(j => j.status === 'active').reduce((a, j) => a + j.daysOpen, 0) / JOBS.filter(j => j.status === 'active').length))} />
            <KPICard label="Hire Rate" value="25%" trend="up" />
          </KPIBand>
          <div className="space-y-1.5">
            {JOBS.map(j => {
              const sc = JOB_STATUS[j.status];
              return (
                <div key={j.id} className="rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => openDetail('job', j.title, `${j.applicants} applicants`)}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2"><span className="text-[11px] font-semibold">{j.title}</span><StatusBadge status={sc.badge} label={sc.label} /></div>
                    <span className="text-[9px] text-muted-foreground">{j.daysOpen}d open</span>
                  </div>
                  <div className="flex gap-2 text-[8px]">
                    {[
                      { l: 'Applied', v: j.applicants },
                      { l: 'Shortlisted', v: j.shortlisted },
                      { l: 'Interviews', v: j.interviews },
                      { l: 'Offers', v: j.offers },
                      { l: 'Hired', v: j.hired },
                    ].map(s => (
                      <div key={s.l} className="text-center flex-1 rounded-xl border p-1.5">
                        <div className="font-bold">{s.v}</div>
                        <div className="text-muted-foreground">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => setPostJobDrawer(true)}><Plus className="h-3 w-3" />Post New Job</Button>
        </div>
      )}

      {/* ═══ VELOCITY ═══ */}
      {tab === 'velocity' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Avg Time to Hire" value="18 days" change="-3d" trend="down" />
            <KPICard label="Response Rate" value="62%" change="+8%" trend="up" />
            <KPICard label="Offer Accept" value="78%" change="+5%" trend="up" />
            <KPICard label="Source Quality" value="High" />
          </KPIBand>

          <SectionCard title="Hiring Funnel" icon={<Target className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5 text-[9px]">
              {[
                { stage: 'Applications', count: 120, pct: 100 },
                { stage: 'Screened', count: 48, pct: 40 },
                { stage: 'Interviewed', count: 18, pct: 15 },
                { stage: 'Offers Sent', count: 6, pct: 5 },
                { stage: 'Hired', count: 3, pct: 2.5 },
              ].map(f => (
                <div key={f.stage} className="flex items-center gap-2">
                  <span className="w-24 text-muted-foreground">{f.stage}</span>
                  <Progress value={f.pct} className="h-1.5 flex-1" />
                  <span className="font-medium w-8 text-right">{f.count}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Response Time by Channel" icon={<Clock className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5 text-[9px]">
              {[
                { channel: 'InMail', rate: '68%', time: '4 hrs' },
                { channel: 'Direct Apply', rate: '100%', time: 'Instant' },
                { channel: 'Referral', rate: '82%', time: '1 day' },
                { channel: 'Job Board', rate: '45%', time: '2 days' },
              ].map(ch => (
                <div key={ch.channel} className="flex items-center justify-between rounded-xl border p-2">
                  <span className="font-medium">{ch.channel}</span>
                  <div className="flex gap-3"><span className="text-muted-foreground">Rate: {ch.rate}</span><span className="text-muted-foreground">Avg: {ch.time}</span></div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-3">
            <div className="flex items-center gap-2 mb-1"><Zap className="h-4 w-4 text-accent" /><span className="text-[10px] font-semibold">AI Insight</span></div>
            <p className="text-[9px] text-muted-foreground">Your InMail response rate is 23% above industry average. Consider increasing outbound volume for Frontend Lead role — pipeline needs 3 more candidates at screening stage to hit your 18-day hire target.</p>
          </div>
        </div>
      )}

      {/* ═══ INTERVIEWS ═══ */}
      {tab === 'interviews' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="This Week" value="5" />
            <KPICard label="Upcoming" value="3" />
            <KPICard label="Completed" value="12" />
            <KPICard label="Pass Rate" value="67%" trend="up" />
          </KPIBand>
          <div className="space-y-1.5">
            {[
              { candidate: 'Sarah Chen', job: 'Frontend Lead', time: 'Today, 2:00 PM', type: 'Technical', status: 'upcoming' },
              { candidate: 'Marcus Johnson', job: 'Frontend Lead', time: 'Tomorrow, 10:00 AM', type: 'Screening', status: 'upcoming' },
              { candidate: 'New Candidate', job: 'Platform Eng', time: 'Apr 18, 3:00 PM', type: 'Culture Fit', status: 'upcoming' },
              { candidate: 'Elena Petrova', job: 'Product Designer', time: 'Apr 10, 2:00 PM', type: 'Portfolio Review', status: 'completed' },
            ].map((int, i) => (
              <div key={i} className="rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => openDetail('interview', `${int.candidate} — ${int.type}`, `${int.job} · ${int.time}`)}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold">{int.candidate}</span>
                      <Badge variant="secondary" className="text-[7px]">{int.type}</Badge>
                      <StatusBadge status={int.status === 'upcoming' ? 'live' : 'healthy'} label={int.status === 'upcoming' ? 'Upcoming' : 'Done'} />
                    </div>
                    <div className="text-[8px] text-muted-foreground mt-0.5">{int.job} · {int.time}</div>
                  </div>
                  {int.status === 'upcoming' && <Button variant="outline" size="sm" className="h-6 text-[8px] gap-1 rounded-xl"><Video className="h-3 w-3" />Join</Button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SAVED LISTS ═══ */}
      {tab === 'lists' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Lists" value="5" />
            <KPICard label="Total Saved" value="42" />
            <KPICard label="Contacted" value="28" />
            <KPICard label="Response Rate" value="64%" />
          </KPIBand>
          <div className="space-y-1.5">
            {[
              { name: 'Frontend Engineers — NYC', count: 12, contacted: 8, lastUpdated: '2 hrs ago' },
              { name: 'Senior Designers', count: 8, contacted: 5, lastUpdated: '1 day ago' },
              { name: 'DevOps Shortlist', count: 6, contacted: 4, lastUpdated: '3 days ago' },
              { name: 'ML/AI Candidates', count: 10, contacted: 7, lastUpdated: '1 week ago' },
              { name: 'Executive Search', count: 6, contacted: 4, lastUpdated: '2 weeks ago' },
            ].map(l => (
              <div key={l.name} className="rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => openDetail('list', l.name, `${l.count} candidates`)}>
                <div className="flex items-center justify-between">
                  <div><div className="text-[10px] font-semibold">{l.name}</div><div className="text-[8px] text-muted-foreground">{l.count} candidates · {l.contacted} contacted · Updated {l.lastUpdated}</div></div>
                  <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl">Open</Button>
                </div>
              </div>
            ))}
          </div>
          <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('New list created')}><Plus className="h-3 w-3" />Create List</Button>
        </div>
      )}

      {/* ═══ TEAM TASKS ═══ */}
      {tab === 'team' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Team Members" value="3" />
            <KPICard label="Open Tasks" value="8" />
            <KPICard label="Completed Today" value="4" />
            <KPICard label="Overdue" value="1" change="Action needed" />
          </KPIBand>
          <div className="space-y-1.5">
            {[
              { task: 'Screen Marcus Johnson', assignee: 'You', due: 'Today', priority: 'high', done: false },
              { task: 'Send offer to Elena P.', assignee: 'Sarah P.', due: 'Today', priority: 'high', done: false },
              { task: 'Post Platform Eng on boards', assignee: 'Mike T.', due: 'Tomorrow', priority: 'medium', done: false },
              { task: 'Review Frontend Lead JD', assignee: 'You', due: 'Apr 15', priority: 'low', done: true },
              { task: 'Source 10 DevOps candidates', assignee: 'Mike T.', due: 'Overdue', priority: 'high', done: false },
            ].map((t, i) => (
              <div key={i} className={cn('rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all', t.done && 'opacity-60')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={cn('h-4 w-4 cursor-pointer', t.done ? 'text-[hsl(var(--state-healthy))]' : 'text-muted-foreground')} onClick={() => toast.success(`Task ${t.done ? 'reopened' : 'completed'}`)} />
                    <div>
                      <div className={cn('text-[10px] font-semibold', t.done && 'line-through')}>{t.task}</div>
                      <div className="text-[8px] text-muted-foreground">{t.assignee} · Due: {t.due}</div>
                    </div>
                  </div>
                  <StatusBadge status={t.due === 'Overdue' ? 'blocked' : t.priority === 'high' ? 'caution' : 'pending'} label={t.due === 'Overdue' ? 'Overdue' : t.priority} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ CREDITS ═══ */}
      {tab === 'credits' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Credits Remaining" value="8" change="Low balance" />
            <KPICard label="Used This Month" value="22" />
            <KPICard label="Plan" value="Pro" />
            <KPICard label="Renewal" value="May 1" />
          </KPIBand>

          <div className="rounded-2xl border border-[hsl(var(--state-caution))]/30 bg-[hsl(var(--state-caution))]/5 p-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[hsl(var(--state-caution))]" />
            <div className="flex-1"><div className="text-[10px] font-semibold">Low Credit Balance</div><div className="text-[8px] text-muted-foreground">You have 8 credits remaining. InMail and talent search will be limited.</div></div>
            <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><CreditCard className="h-3 w-3" />Buy Credits</Button>
          </div>

          <SectionCard title="Credit Usage" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5 text-[9px]">
              {[
                { type: 'InMail Sends', used: 12, pct: 55 },
                { type: 'Talent Search', used: 6, pct: 27 },
                { type: 'Job Promotions', used: 3, pct: 14 },
                { type: 'Analytics Access', used: 1, pct: 4 },
              ].map(u => (
                <div key={u.type} className="flex items-center gap-2">
                  <span className="w-28 text-muted-foreground">{u.type}</span>
                  <Progress value={u.pct} className="h-1.5 flex-1" />
                  <span className="font-medium w-6 text-right">{u.used}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        <div className="flex-1"><span className="text-[10px] font-semibold">Recruiter Dashboard</span><div className="text-[8px] text-muted-foreground">{JOBS.filter(j => j.status === 'active').length} open roles · {CANDIDATES.filter(c => c.stage !== 'rejected' && c.stage !== 'hired').length} in pipeline</div></div>
        <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-4" onClick={() => setPostJobDrawer(true)}><Plus className="h-3.5 w-3.5" />Post Job</Button>
      </div>

      {/* Post Job Drawer */}
      <Sheet open={postJobDrawer} onOpenChange={setPostJobDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Post a Job</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Job Title</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="e.g. Senior Frontend Developer" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Description</label><textarea className="w-full h-20 rounded-xl border bg-background px-3 py-2 text-[9px] resize-none" placeholder="Role requirements and responsibilities..." /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[9px] font-medium mb-1 block">Location</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="Remote / City" /></div>
              <div><label className="text-[9px] font-medium mb-1 block">Salary Range</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="$80K - $120K" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[9px] font-medium mb-1 block">Type</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>Full-time</option><option>Contract</option><option>Part-time</option></select></div>
              <div><label className="text-[9px] font-medium mb-1 block">Experience</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>Senior</option><option>Mid</option><option>Junior</option></select></div>
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => { setPostJobDrawer(false); toast.info('Saved as draft'); }}>Save Draft</Button>
              <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setPostJobDrawer(false); toast.success('Job posted!'); }}><Briefcase className="h-3 w-3" />Publish</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Drawer */}
      <Sheet open={detailDrawer} onOpenChange={setDetailDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Detail Inspector</SheetTitle></SheetHeader>
          {detailItem && (
            <div className="p-4 space-y-3">
              <Badge variant="secondary" className="text-[7px] capitalize">{detailItem.type}</Badge>
              <h3 className="text-[12px] font-bold">{detailItem.title}</h3>
              <p className="text-[9px] text-muted-foreground">{detailItem.detail}</p>
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="h-7 text-[9px] flex-1 rounded-xl" onClick={() => setDetailDrawer(false)}>Close</Button>
                <Button size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl" onClick={() => { setDetailDrawer(false); toast.success('Action taken!'); }}><CheckCircle2 className="h-3 w-3" />Take Action</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Compare Drawer */}
      <Sheet open={compareOpen} onOpenChange={setCompareOpen}>
        <SheetContent className="w-[600px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Compare Candidates</SheetTitle></SheetHeader>
          <div className="p-4">
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${compareIds.length}, 1fr)` }}>
              {compareIds.map(id => {
                const c = CANDIDATES.find(x => x.id === id);
                if (!c) return null;
                const sc = STAGE_MAP[c.stage];
                return (
                  <div key={id} className="rounded-2xl border bg-card p-3 space-y-2">
                    <div className="text-center">
                      <Avatar className="h-10 w-10 mx-auto"><AvatarFallback className="text-[10px] bg-accent/10 text-accent">{c.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                      <div className="text-[10px] font-semibold mt-1">{c.name}</div>
                      <div className="text-[8px] text-muted-foreground">{c.role}</div>
                    </div>
                    <div className="space-y-1 text-[9px]">
                      <div className="flex justify-between"><span className="text-muted-foreground">Match</span><span className="font-bold text-accent">{c.match}%</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{c.location}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Stage</span><StatusBadge status={sc.badge} label={sc.label} /></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Job</span><span>{c.job}</span></div>
                    </div>
                    <Button size="sm" className="h-6 text-[8px] w-full rounded-xl" onClick={() => { setCompareOpen(false); setSelectedCandidate(c); }}><ArrowUpRight className="h-3 w-3 mr-1" />Advance</Button>
                  </div>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default RecruiterDashboardPage;
