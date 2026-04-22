import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import {
  Rocket, Search, Clock, ChevronRight, MoreHorizontal, History,
  Eye, Bookmark, BookmarkCheck, Star, Building2, Users, Zap,
  TrendingUp, MapPin, Briefcase, GraduationCap, Target,
  CheckCircle2, AlertTriangle, Play, Award, Compass, UserPlus,
  MessageSquare, BookOpen, ArrowUpRight, Lightbulb, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

// ── Types ──
type PathwayType = 'graduate' | 'school_leaver' | 'career_change';
type ReadinessLevel = 'ready' | 'almost' | 'building' | 'starting';
type OpportunityType = 'internship' | 'apprenticeship' | 'entry_level' | 'bootcamp' | 'mentorship';

interface Assessment {
  category: string; score: number; max: number; status: ReadinessLevel;
}

interface Opportunity {
  id: string; title: string; company: string; companyAvatar: string; type: OpportunityType;
  location: string; salary?: string; skills: string[]; saved: boolean; posted: string;
  applicants: number; match: number;
}

interface Mentor {
  id: string; name: string; avatar: string; title: string; company: string;
  expertise: string[]; rating: number; sessions: number; available: boolean;
}

// ── Mock Data ──
const ASSESSMENTS: Assessment[] = [
  { category: 'Technical Skills', score: 72, max: 100, status: 'almost' },
  { category: 'Communication', score: 85, max: 100, status: 'ready' },
  { category: 'Portfolio Quality', score: 45, max: 100, status: 'building' },
  { category: 'Interview Readiness', score: 60, max: 100, status: 'almost' },
  { category: 'Industry Knowledge', score: 38, max: 100, status: 'building' },
  { category: 'Networking', score: 20, max: 100, status: 'starting' },
];

const OPPORTUNITIES: Opportunity[] = [
  { id: 'O-001', title: 'Junior Frontend Developer', company: 'TechCorp', companyAvatar: 'TC', type: 'entry_level', location: 'San Francisco, CA', salary: '$75-90K', skills: ['React', 'CSS', 'JavaScript'], saved: true, posted: '2d ago', applicants: 34, match: 92 },
  { id: 'O-002', title: 'Software Engineering Intern', company: 'ScaleUp Inc', companyAvatar: 'SI', type: 'internship', location: 'Remote', salary: '$35/hr', skills: ['Python', 'Git', 'SQL'], saved: false, posted: '1d ago', applicants: 89, match: 78 },
  { id: 'O-003', title: 'Digital Apprenticeship', company: 'CloudScale', companyAvatar: 'CS', type: 'apprenticeship', location: 'Austin, TX', salary: '$55K', skills: ['HTML', 'CSS', 'JavaScript'], saved: false, posted: '3d ago', applicants: 22, match: 85 },
  { id: 'O-004', title: 'UX Design Bootcamp Graduate', company: 'DesignFlow', companyAvatar: 'DF', type: 'bootcamp', location: 'New York, NY', salary: '$70-85K', skills: ['Figma', 'UX Research', 'Prototyping'], saved: true, posted: '5d ago', applicants: 41, match: 68 },
  { id: 'O-005', title: 'Junior Data Analyst', company: 'DataFlow', companyAvatar: 'DA', type: 'entry_level', location: 'Chicago, IL', salary: '$65-80K', skills: ['SQL', 'Python', 'Excel'], saved: false, posted: '1d ago', applicants: 56, match: 74 },
  { id: 'O-006', title: 'Career Change Mentorship Program', company: 'Gigvora Academy', companyAvatar: 'GA', type: 'mentorship', location: 'Remote', skills: ['Any Background', 'Motivation'], saved: false, posted: '1w ago', applicants: 15, match: 95 },
];

const MENTORS: Mentor[] = [
  { id: 'M-001', name: 'Dr. Rachel Kim', avatar: 'RK', title: 'Engineering Director', company: 'TechCorp', expertise: ['Career Transitions', 'Frontend', 'Interview Prep'], rating: 4.9, sessions: 120, available: true },
  { id: 'M-002', name: 'Alex Thompson', avatar: 'AT', title: 'Senior Product Manager', company: 'ScaleUp Inc', expertise: ['Product Thinking', 'Resume Review', 'Networking'], rating: 4.8, sessions: 85, available: true },
  { id: 'M-003', name: 'Priya Gupta', avatar: 'PG', title: 'Staff Engineer', company: 'CloudScale', expertise: ['System Design', 'DSA', 'Career Growth'], rating: 4.7, sessions: 200, available: false },
  { id: 'M-004', name: 'Marcus Brown', avatar: 'MB', title: 'Design Lead', company: 'DesignFlow', expertise: ['Portfolio Review', 'UX Design', 'Career Change'], rating: 4.9, sessions: 65, available: true },
];

const READINESS_COLORS: Record<ReadinessLevel, string> = {
  ready: 'text-[hsl(var(--state-healthy))]',
  almost: 'text-accent',
  building: 'text-[hsl(var(--gigvora-amber))]',
  starting: 'text-muted-foreground',
};

const READINESS_BG: Record<ReadinessLevel, string> = {
  ready: 'bg-[hsl(var(--state-healthy))]',
  almost: 'bg-accent',
  building: 'bg-[hsl(var(--gigvora-amber))]',
  starting: 'bg-muted-foreground',
};

const OPP_TYPE_COLORS: Record<OpportunityType, string> = {
  internship: 'bg-accent/10 text-accent',
  apprenticeship: 'bg-primary/10 text-primary',
  entry_level: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  bootcamp: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  mentorship: 'bg-muted text-muted-foreground',
};

// ── Opportunity Detail Drawer ──
const OpportunityDrawer: React.FC<{ opp: Opportunity | null; open: boolean; onClose: () => void }> = ({ opp, open, onClose }) => {
  if (!opp) return null;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Rocket className="h-4 w-4 text-accent" />Opportunity Detail</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b">
            <Avatar className="h-10 w-10"><AvatarFallback className="text-[8px]">{opp.companyAvatar}</AvatarFallback></Avatar>
            <div className="flex-1">
              <div className="text-sm font-bold">{opp.title}</div>
              <div className="text-[10px] text-muted-foreground">{opp.company} · {opp.location}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{opp.match}%</div>
              <div className="text-[7px] text-muted-foreground">Match</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { l: 'Type', v: opp.type.replace('_', ' '), icon: Briefcase },
              { l: 'Location', v: opp.location, icon: MapPin },
              ...(opp.salary ? [{ l: 'Compensation', v: opp.salary, icon: TrendingUp }] : []),
              { l: 'Applicants', v: String(opp.applicants), icon: Users },
              { l: 'Posted', v: opp.posted, icon: Clock },
            ].map(m => (
              <div key={m.l} className="rounded-md border p-2 flex items-start gap-1.5">
                <m.icon className="h-3 w-3 text-muted-foreground mt-0.5" />
                <div><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-[9px] font-medium capitalize">{m.v}</div></div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[10px] font-semibold mb-1">Required Skills</div>
            <div className="flex flex-wrap gap-1">
              {opp.skills.map(s => <Badge key={s} variant="secondary" className="text-[7px]">{s}</Badge>)}
            </div>
          </div>

          <div className="rounded-lg border bg-card p-3">
            <div className="text-[10px] font-semibold mb-2">Your Readiness</div>
            <div className="space-y-1.5">
              {ASSESSMENTS.slice(0, 3).map(a => (
                <div key={a.category} className="flex items-center gap-2 text-[8px]">
                  <span className="w-28 truncate">{a.category}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={cn('h-full rounded-full', READINESS_BG[a.status])} style={{ width: `${a.score}%` }} />
                  </div>
                  <span className={cn('w-8 text-right font-medium', READINESS_COLORS[a.status])}>{a.score}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            <Button size="sm" className="h-6 text-[9px] gap-1"><Play className="h-2.5 w-2.5" />Apply Now</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1">{opp.saved ? <BookmarkCheck className="h-2.5 w-2.5" /> : <Bookmark className="h-2.5 w-2.5" />}{opp.saved ? 'Saved' : 'Save'}</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><MessageSquare className="h-2.5 w-2.5" />Ask Mentor</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Main Page ──
const LaunchpadPage: React.FC = () => {
  const { activeRole } = useRole();
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [pathway, setPathway] = useState<PathwayType>('graduate');
  const [search, setSearch] = useState('');

  const overallScore = Math.round(ASSESSMENTS.reduce((s, a) => s + a.score, 0) / ASSESSMENTS.length);

  const topStrip = (
    <>
      <Rocket className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Experience Launchpad</span>
      <div className="flex-1" />
      <select value={pathway} onChange={e => setPathway(e.target.value as PathwayType)} className="h-6 rounded-md border bg-background px-1.5 text-[8px]">
        <option value="graduate">Graduate</option>
        <option value="school_leaver">School Leaver</option>
        <option value="career_change">Career Change</option>
      </select>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search opportunities..." className="h-6 rounded-md border bg-background pl-7 pr-2 text-[8px] w-40 focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Updated 2h ago</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Readiness Score" icon={<Target className="h-3.5 w-3.5 text-accent" />}>
        <div className="flex items-center justify-center py-2">
          <div className="relative h-16 w-16">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--accent))" strokeWidth="3" strokeDasharray={`${overallScore}, 100`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold">{overallScore}%</span>
            </div>
          </div>
        </div>
        <div className="space-y-1 mt-1">
          {ASSESSMENTS.map(a => (
            <div key={a.category} className="flex items-center gap-1.5 text-[7px]">
              <span className="flex-1 truncate">{a.category}</span>
              <span className={cn('font-medium', READINESS_COLORS[a.status])}>{a.score}%</span>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="h-5 text-[7px] w-full mt-2 gap-0.5"><Play className="h-2 w-2" />Take Assessment</Button>
      </SectionCard>

      <SectionCard title="Recommended Mentors" icon={<Users className="h-3.5 w-3.5 text-primary" />}>
        <div className="space-y-1.5">
          {MENTORS.filter(m => m.available).slice(0, 3).map(m => (
            <button key={m.id} className="flex items-center gap-1.5 p-1.5 rounded-md w-full text-left hover:bg-muted/30 transition-colors text-[8px]">
              <Avatar className="h-5 w-5"><AvatarFallback className="text-[5px]">{m.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{m.name}</div>
                <div className="text-[6px] text-muted-foreground">{m.title}</div>
              </div>
              <div className="flex items-center gap-0.5 text-[6px]"><Star className="h-2 w-2 text-[hsl(var(--gigvora-amber))]" />{m.rating}</div>
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="h-5 text-[7px] w-full mt-1.5 gap-0.5"><Compass className="h-2 w-2" />Find Mentor</Button>
      </SectionCard>

      <SectionCard title="Next Steps" icon={<Lightbulb className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />}>
        <div className="space-y-0.5">
          {[
            { label: 'Complete portfolio', done: false },
            { label: 'Take skills assessment', done: true },
            { label: 'Connect with a mentor', done: false },
            { label: 'Apply to first role', done: false },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5 p-1 text-[8px]">
              <CheckCircle2 className={cn('h-3 w-3', s.done ? 'text-[hsl(var(--state-healthy))]' : 'text-muted-foreground/40')} />
              <span className={cn(s.done && 'line-through text-muted-foreground')}>{s.label}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Your Journey So Far</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[
          { action: 'Completed Communication assessment — scored 85%', time: '2d ago', type: 'assessment' },
          { action: 'Saved "Junior Frontend Developer" at TechCorp', time: '3d ago', type: 'saved' },
          { action: 'Booked mentorship session with Dr. Rachel Kim', time: '5d ago', type: 'mentor' },
          { action: 'Updated profile — added 2 portfolio projects', time: '1w ago', type: 'profile' },
        ].map((a, i) => (
          <div key={i} className="shrink-0 rounded-lg border bg-card px-3 py-2 min-w-[220px]">
            <Badge variant="secondary" className="text-[6px] capitalize mb-1">{a.type}</Badge>
            <p className="text-[8px] text-muted-foreground line-clamp-2">{a.action}</p>
            <div className="text-[7px] text-muted-foreground mt-0.5">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52" bottomSection={bottomSection}>
      <KPIBand className="mb-3">
        <KPICard label="Readiness Score" value={`${overallScore}%`} change="Overall" trend={overallScore >= 50 ? 'up' : undefined} />
        <KPICard label="Assessments Done" value="2/6" change="In progress" />
        <KPICard label="Opportunities Matched" value={String(OPPORTUNITIES.length)} change="For your profile" />
        <KPICard label="Mentor Sessions" value="3" change="Completed" trend="up" />
      </KPIBand>

      <Tabs defaultValue="overview">
        <TabsList className="mb-3 flex-wrap h-auto gap-0.5">
          <TabsTrigger value="overview" className="gap-1 text-[10px] h-6 px-2"><BarChart3 className="h-3 w-3" />Overview</TabsTrigger>
          <TabsTrigger value="opportunities" className="gap-1 text-[10px] h-6 px-2"><Briefcase className="h-3 w-3" />Opportunities</TabsTrigger>
          <TabsTrigger value="mentors" className="gap-1 text-[10px] h-6 px-2"><Users className="h-3 w-3" />Mentors</TabsTrigger>
          <TabsTrigger value="assessments" className="gap-1 text-[10px] h-6 px-2"><Award className="h-3 w-3" />Assessments</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="space-y-3">
            {/* Readiness Overview */}
            <div className="rounded-lg border bg-card p-3">
              <div className="text-[10px] font-semibold mb-2">Career Readiness Breakdown</div>
              <div className="grid grid-cols-3 gap-2">
                {ASSESSMENTS.map(a => (
                  <div key={a.category} className="rounded-md border p-2">
                    <div className="text-[8px] text-muted-foreground mb-1">{a.category}</div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full rounded-full', READINESS_BG[a.status])} style={{ width: `${a.score}%` }} />
                      </div>
                      <span className={cn('text-[9px] font-semibold', READINESS_COLORS[a.status])}>{a.score}%</span>
                    </div>
                    <Badge variant="secondary" className="text-[6px] capitalize mt-1">{a.status}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Matches */}
            <div className="rounded-lg border bg-card p-3">
              <div className="text-[10px] font-semibold mb-2 flex items-center gap-1"><Zap className="h-3 w-3 text-accent" />Top Matched Opportunities</div>
              <div className="space-y-1.5">
                {OPPORTUNITIES.sort((a, b) => b.match - a.match).slice(0, 3).map(o => (
                  <button key={o.id} onClick={() => setSelectedOpp(o)} className="flex items-center gap-2 p-2 rounded-md w-full text-left hover:bg-muted/30 transition-colors">
                    <Avatar className="h-7 w-7"><AvatarFallback className="text-[6px]">{o.companyAvatar}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-medium">{o.title}</div>
                      <div className="text-[7px] text-muted-foreground">{o.company} · {o.location}</div>
                    </div>
                    <Badge className={cn('text-[6px] border-0', OPP_TYPE_COLORS[o.type])}>{o.type.replace('_', ' ')}</Badge>
                    <Badge variant={o.match >= 85 ? 'default' : 'secondary'} className="text-[7px]">{o.match}%</Badge>
                  </button>
                ))}
              </div>
            </div>

            {/* Needs Onboarding Alert */}
            {overallScore < 50 && (
              <div className="rounded-lg border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--gigvora-amber))] shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-semibold">Complete Your Onboarding</div>
                  <div className="text-[8px] text-muted-foreground mt-0.5">Your readiness score is below 50%. Complete your assessments and profile to unlock more matched opportunities.</div>
                  <Button size="sm" className="h-5 text-[7px] mt-1.5 gap-0.5"><Play className="h-2 w-2" />Continue Onboarding</Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Opportunities */}
        <TabsContent value="opportunities">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-[9px] text-muted-foreground font-medium">
                  <th className="text-left px-3 py-2">Opportunity</th>
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-left px-3 py-2">Skills</th>
                  <th className="text-center px-3 py-2">Match</th>
                  <th className="text-left px-3 py-2">Posted</th>
                  <th className="text-left px-3 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {OPPORTUNITIES.filter(o => !search || o.title.toLowerCase().includes(search.toLowerCase()) || o.company.toLowerCase().includes(search.toLowerCase())).map(o => (
                  <tr key={o.id} onClick={() => setSelectedOpp(o)} className={cn('border-t hover:bg-muted/30 cursor-pointer text-[9px] transition-colors', selectedOpp?.id === o.id && 'bg-accent/5')}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-6 w-6"><AvatarFallback className="text-[6px]">{o.companyAvatar}</AvatarFallback></Avatar>
                        <div>
                          <div className="font-medium flex items-center gap-1">{o.title}{o.saved && <BookmarkCheck className="h-2.5 w-2.5 text-accent" />}</div>
                          <div className="text-[7px] text-muted-foreground">{o.company} · {o.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2"><Badge className={cn('text-[6px] border-0 capitalize', OPP_TYPE_COLORS[o.type])}>{o.type.replace('_', ' ')}</Badge></td>
                    <td className="px-3 py-2">
                      <div className="flex gap-0.5 flex-wrap">
                        {o.skills.slice(0, 2).map(s => <Badge key={s} variant="secondary" className="text-[6px]">{s}</Badge>)}
                        {o.skills.length > 2 && <Badge variant="secondary" className="text-[6px]">+{o.skills.length - 2}</Badge>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center"><Badge variant={o.match >= 85 ? 'default' : 'secondary'} className="text-[7px]">{o.match}%</Badge></td>
                    <td className="px-3 py-2 text-muted-foreground">{o.posted}</td>
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => toast.success(`${o.saved ? 'Removed' : 'Saved'} ${o.title}`)}>{o.saved ? <BookmarkCheck className="h-2.5 w-2.5 text-accent" /> : <Bookmark className="h-2.5 w-2.5" />}</Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5"><MoreHorizontal className="h-2.5 w-2.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Mentors */}
        <TabsContent value="mentors">
          <div className="grid grid-cols-2 gap-3">
            {MENTORS.map(m => (
              <div key={m.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-9 w-9"><AvatarFallback className="text-[8px]">{m.avatar}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold">{m.name}</div>
                    <div className="text-[8px] text-muted-foreground">{m.title} · {m.company}</div>
                  </div>
                  <Badge variant={m.available ? 'default' : 'secondary'} className="text-[6px]">{m.available ? 'Available' : 'Booked'}</Badge>
                </div>
                <div className="flex flex-wrap gap-0.5 mb-2">
                  {m.expertise.map(e => <Badge key={e} variant="secondary" className="text-[6px]">{e}</Badge>)}
                </div>
                <div className="flex items-center justify-between text-[8px] text-muted-foreground border-t pt-1.5">
                  <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{m.rating} · {m.sessions} sessions</span>
                </div>
                <div className="flex gap-1 mt-2">
                  <Button size="sm" className="h-5 text-[7px] flex-1 gap-0.5" disabled={!m.available}><MessageSquare className="h-2 w-2" />Book Session</Button>
                  <Button variant="outline" size="sm" className="h-5 text-[7px] flex-1 gap-0.5"><Eye className="h-2 w-2" />Profile</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Assessments */}
        <TabsContent value="assessments">
          <div className="space-y-2">
            {ASSESSMENTS.map(a => (
              <div key={a.category} className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', a.status === 'ready' ? 'bg-[hsl(var(--state-healthy))]/10' : a.status === 'almost' ? 'bg-accent/10' : a.status === 'building' ? 'bg-[hsl(var(--gigvora-amber))]/10' : 'bg-muted')}>
                    {a.status === 'ready' ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--state-healthy))]" /> : a.status === 'almost' ? <TrendingUp className="h-4 w-4 text-accent" /> : <BookOpen className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold">{a.category}</div>
                    <Badge variant="secondary" className="text-[6px] capitalize">{a.status}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{a.score}<span className="text-[8px] text-muted-foreground font-normal">/{a.max}</span></div>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', READINESS_BG[a.status])} style={{ width: `${a.score}%` }} />
                </div>
                <div className="flex gap-1 mt-2">
                  <Button variant="outline" size="sm" className="h-5 text-[7px] gap-0.5">{a.status === 'starting' ? <><Play className="h-2 w-2" />Start</> : <><ArrowUpRight className="h-2 w-2" />Retake</>}</Button>
                  <Button variant="outline" size="sm" className="h-5 text-[7px] gap-0.5"><BookOpen className="h-2 w-2" />Resources</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <OpportunityDrawer opp={selectedOpp} open={!!selectedOpp} onClose={() => setSelectedOpp(null)} />
    </DashboardLayout>
  );
};

export default LaunchpadPage;
