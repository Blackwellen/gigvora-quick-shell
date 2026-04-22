import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import {
  Building2, Rocket, Users, TrendingUp, Handshake, Star,
  Search, Plus, Globe, BarChart3, FileText, Shield,
  Calendar, MessageSquare, Eye, Target, Lightbulb,
  CheckCircle2, AlertTriangle, Clock, Award, Sparkles,
  ArrowUpRight, Zap, BookOpen, Lock, MapPin,
  ChevronRight, History, Bookmark, BookmarkCheck, MoreHorizontal,
  UserPlus, Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

// ── Types ──
type StartupStage = 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'growth';
type MentorStatus = 'available' | 'booked' | 'waitlist';
type RequestStatus = 'open' | 'matched' | 'in_progress' | 'completed' | 'awaiting';
type ViewMode = 'startup' | 'mentor' | 'advisor' | 'partner';

interface Startup {
  id: string; name: string; avatar: string; industry: string; stage: StartupStage;
  location: string; mrr: string; team: number; score: number; founded: string;
  raised: string; description: string; saved: boolean; seeking: string[];
}

interface Mentor {
  id: string; name: string; avatar: string; title: string; company: string;
  expertise: string[]; rating: number; sessions: number; status: MentorStatus;
  bio: string; industries: string[];
}

interface HelpRequest {
  id: string; from: string; fromAvatar: string; type: string; title: string;
  status: RequestStatus; posted: string; responses: number;
}

// ── Mock Data ──
const STARTUPS: Startup[] = [
  { id: 'S-001', name: 'LaunchPad AI', avatar: 'LA', industry: 'AI / SaaS', stage: 'series_a', location: 'San Francisco', mrr: '$45K', team: 12, score: 92, founded: '2024', raised: '$4.2M', description: 'AI-powered project management for distributed teams.', saved: true, seeking: ['CTO Advisor', 'Enterprise Partnerships'] },
  { id: 'S-002', name: 'GreenFlow', avatar: 'GF', industry: 'CleanTech', stage: 'seed', location: 'Berlin', mrr: '$12K', team: 5, score: 78, founded: '2025', raised: '$800K', description: 'Carbon footprint tracking for SMBs.', saved: false, seeking: ['Marketing Mentor', 'Seed Extension'] },
  { id: 'S-003', name: 'DataBridge', avatar: 'DB', industry: 'Data Analytics', stage: 'series_b', location: 'London', mrr: '$120K', team: 34, score: 88, founded: '2022', raised: '$18M', description: 'Real-time data integration platform.', saved: false, seeking: ['Board Member', 'US Expansion'] },
  { id: 'S-004', name: 'HealthPulse', avatar: 'HP', industry: 'HealthTech', stage: 'pre_seed', location: 'Singapore', mrr: '$3K', team: 3, score: 65, founded: '2025', raised: '$150K', description: 'Remote patient monitoring for clinics.', saved: false, seeking: ['Technical Co-founder', 'Pre-seed Funding'] },
  { id: 'S-005', name: 'FinStack', avatar: 'FS', industry: 'FinTech', stage: 'series_a', location: 'New York', mrr: '$67K', team: 18, score: 85, founded: '2023', raised: '$7.5M', description: 'Embedded finance APIs for platforms.', saved: true, seeking: ['VP Sales', 'Strategic Partnerships'] },
  { id: 'S-006', name: 'EduPath', avatar: 'EP', industry: 'EdTech', stage: 'seed', location: 'Toronto', mrr: '$8K', team: 7, score: 71, founded: '2024', raised: '$1.2M', description: 'Personalized learning pathways with AI.', saved: false, seeking: ['Product Advisor', 'School Partnerships'] },
];

const MENTORS: Mentor[] = [
  { id: 'M-001', name: 'Dr. Sarah Chen', avatar: 'SC', title: 'Former CTO', company: 'TechCorp (exited)', expertise: ['Scaling Engineering', 'Technical Strategy', 'Fundraising'], rating: 4.9, sessions: 180, status: 'available', bio: '3x founder, 2 exits. Passionate about helping early-stage technical founders.', industries: ['SaaS', 'AI'] },
  { id: 'M-002', name: 'Marcus Thompson', avatar: 'MT', title: 'Partner', company: 'Venture First Capital', expertise: ['Go-to-Market', 'Enterprise Sales', 'Pricing'], rating: 4.8, sessions: 120, status: 'available', bio: 'Former VP Sales at two unicorns. Now helping founders crack enterprise.', industries: ['FinTech', 'SaaS'] },
  { id: 'M-003', name: 'Priya Gupta', avatar: 'PG', title: 'CEO', company: 'ScaleOps', expertise: ['Operations', 'People & Culture', 'Series A Prep'], rating: 4.7, sessions: 95, status: 'booked', bio: 'Built and scaled teams from 5 to 500. Advises on operational readiness.', industries: ['General'] },
  { id: 'M-004', name: 'James O\'Brien', avatar: 'JO', title: 'Angel Investor', company: 'Independent', expertise: ['Product Strategy', 'UX', 'Consumer Markets'], rating: 4.9, sessions: 210, status: 'available', bio: '50+ angel investments. Design-led product thinking advocate.', industries: ['Consumer', 'EdTech', 'HealthTech'] },
  { id: 'M-005', name: 'Lina Park', avatar: 'LP', title: 'VP Growth', company: 'CloudScale', expertise: ['Growth Marketing', 'PLG', 'Analytics'], rating: 4.6, sessions: 65, status: 'waitlist', bio: 'Growth leader scaling B2B SaaS from $1M to $50M ARR.', industries: ['SaaS', 'Data'] },
];

const HELP_REQUESTS: HelpRequest[] = [
  { id: 'R-1', from: 'LaunchPad AI', fromAvatar: 'LA', type: 'Advisor', title: 'Looking for CTO advisor with AI/ML scaling experience', status: 'open', posted: '1d ago', responses: 3 },
  { id: 'R-2', from: 'GreenFlow', fromAvatar: 'GF', type: 'Mentor', title: 'Need marketing mentor for B2B CleanTech positioning', status: 'matched', posted: '3d ago', responses: 5 },
  { id: 'R-3', from: 'HealthPulse', fromAvatar: 'HP', type: 'Co-founder', title: 'Seeking technical co-founder (mobile + backend)', status: 'open', posted: '2d ago', responses: 1 },
  { id: 'R-4', from: 'FinStack', fromAvatar: 'FS', type: 'Partnership', title: 'Enterprise partner for embedded finance distribution', status: 'in_progress', posted: '1w ago', responses: 7 },
  { id: 'R-5', from: 'EduPath', fromAvatar: 'EP', type: 'Advisor', title: 'Product advisor familiar with K-12 EdTech', status: 'awaiting', posted: '5d ago', responses: 0 },
];

const STAGE_COLORS: Record<StartupStage, string> = {
  pre_seed: 'bg-muted text-muted-foreground',
  seed: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  series_a: 'bg-accent/10 text-accent',
  series_b: 'bg-primary/10 text-primary',
  growth: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
};

const REQ_STATUS_COLORS: Record<RequestStatus, string> = {
  open: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  matched: 'bg-accent/10 text-accent',
  in_progress: 'bg-primary/10 text-primary',
  completed: 'bg-muted text-muted-foreground',
  awaiting: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
};

// ── Startup Detail Drawer ──
const StartupDrawer: React.FC<{ startup: Startup | null; open: boolean; onClose: () => void }> = ({ startup, open, onClose }) => {
  if (!startup) return null;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Rocket className="h-4 w-4 text-accent" />Startup Showcase</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b">
            <Avatar className="h-12 w-12"><AvatarFallback className="text-sm">{startup.avatar}</AvatarFallback></Avatar>
            <div className="flex-1">
              <div className="text-sm font-bold">{startup.name}</div>
              <div className="text-[10px] text-muted-foreground">{startup.industry} · {startup.location}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{startup.score}</div>
              <div className="text-[7px] text-muted-foreground">Match Score</div>
            </div>
          </div>
          <p className="text-[9px] text-muted-foreground">{startup.description}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { l: 'Stage', v: startup.stage.replace('_', ' '), icon: TrendingUp },
              { l: 'MRR', v: startup.mrr, icon: BarChart3 },
              { l: 'Team Size', v: String(startup.team), icon: Users },
              { l: 'Founded', v: startup.founded, icon: Calendar },
              { l: 'Total Raised', v: startup.raised, icon: Sparkles },
              { l: 'Location', v: startup.location, icon: MapPin },
            ].map(m => (
              <div key={m.l} className="rounded-md border p-2 flex items-start gap-1.5">
                <m.icon className="h-3 w-3 text-muted-foreground mt-0.5" />
                <div><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-[9px] font-medium capitalize">{m.v}</div></div>
              </div>
            ))}
          </div>
          <div>
            <div className="text-[10px] font-semibold mb-1">Currently Seeking</div>
            <div className="flex flex-wrap gap-1">{startup.seeking.map(s => <Badge key={s} variant="secondary" className="text-[7px]">{s}</Badge>)}</div>
          </div>
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            <Button size="sm" className="h-6 text-[9px] gap-1"><Heart className="h-2.5 w-2.5" />Offer Help</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><MessageSquare className="h-2.5 w-2.5" />Connect</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1">{startup.saved ? <BookmarkCheck className="h-2.5 w-2.5" /> : <Bookmark className="h-2.5 w-2.5" />}{startup.saved ? 'Saved' : 'Save'}</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><Eye className="h-2.5 w-2.5" />Full Profile</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Mentor Detail Drawer ──
const MentorDrawer: React.FC<{ mentor: Mentor | null; open: boolean; onClose: () => void }> = ({ mentor, open, onClose }) => {
  if (!mentor) return null;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Mentor Profile</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b">
            <Avatar className="h-12 w-12"><AvatarFallback className="text-sm">{mentor.avatar}</AvatarFallback></Avatar>
            <div className="flex-1">
              <div className="text-sm font-bold">{mentor.name}</div>
              <div className="text-[10px] text-muted-foreground">{mentor.title} · {mentor.company}</div>
            </div>
            <Badge variant={mentor.status === 'available' ? 'default' : 'secondary'} className="text-[7px] capitalize">{mentor.status}</Badge>
          </div>
          <p className="text-[9px] text-muted-foreground">{mentor.bio}</p>
          <div>
            <div className="text-[10px] font-semibold mb-1">Expertise</div>
            <div className="flex flex-wrap gap-1">{mentor.expertise.map(e => <Badge key={e} variant="secondary" className="text-[7px]">{e}</Badge>)}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold mb-1">Industries</div>
            <div className="flex flex-wrap gap-1">{mentor.industries.map(i => <Badge key={i} className="text-[7px] border-0 bg-accent/10 text-accent">{i}</Badge>)}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border p-2 text-center"><div className="text-sm font-bold flex items-center justify-center gap-0.5"><Star className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" />{mentor.rating}</div><div className="text-[7px] text-muted-foreground">Rating</div></div>
            <div className="rounded-md border p-2 text-center"><div className="text-sm font-bold">{mentor.sessions}</div><div className="text-[7px] text-muted-foreground">Sessions</div></div>
          </div>
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            <Button size="sm" className="h-6 text-[9px] gap-1" disabled={mentor.status !== 'available'}><Calendar className="h-2.5 w-2.5" />Book Session</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><MessageSquare className="h-2.5 w-2.5" />Message</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><Eye className="h-2.5 w-2.5" />Full Profile</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Main Page ──
const EnterpriseConnectPage: React.FC = () => {
  const { activeRole } = useRole();
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('startup');

  const topStrip = (
    <>
      <Handshake className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Enterprise Connect</span>
      <div className="flex-1" />
      <select value={viewMode} onChange={e => setViewMode(e.target.value as ViewMode)} className="h-6 rounded-md border bg-background px-1.5 text-[8px]">
        <option value="startup">Startup View</option>
        <option value="mentor">Mentor View</option>
        <option value="advisor">Advisor View</option>
        <option value="partner">Partner View</option>
      </select>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search startups, mentors..." className="h-6 rounded-md border bg-background pl-7 pr-2 text-[8px] w-40 focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" />Request Help</Button>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Help Requests" icon={<Lightbulb className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />}>
        <div className="space-y-1">
          {HELP_REQUESTS.filter(r => r.status === 'open' || r.status === 'awaiting').slice(0, 3).map(r => (
            <div key={r.id} className="p-1.5 rounded-md border text-[8px]">
              <div className="flex items-center gap-1 mb-0.5">
                <Avatar className="h-4 w-4"><AvatarFallback className="text-[4px]">{r.fromAvatar}</AvatarFallback></Avatar>
                <span className="font-medium">{r.from}</span>
                <Badge className={cn('text-[5px] border-0 ml-auto capitalize', REQ_STATUS_COLORS[r.status])}>{r.status}</Badge>
              </div>
              <div className="text-[7px] text-muted-foreground line-clamp-1">{r.title}</div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="h-5 text-[7px] w-full mt-1.5 gap-0.5"><Plus className="h-2 w-2" />Post Request</Button>
      </SectionCard>

      <SectionCard title="Top Mentors" icon={<Star className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />}>
        <div className="space-y-1">
          {MENTORS.filter(m => m.status === 'available').slice(0, 3).map(m => (
            <button key={m.id} onClick={() => setSelectedMentor(m)} className="flex items-center gap-1.5 p-1.5 rounded-md w-full text-left hover:bg-muted/30 transition-colors text-[8px]">
              <Avatar className="h-5 w-5"><AvatarFallback className="text-[5px]">{m.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{m.name}</div>
                <div className="text-[6px] text-muted-foreground">{m.expertise[0]}</div>
              </div>
              <div className="flex items-center gap-0.5 text-[6px]"><Star className="h-2 w-2 text-[hsl(var(--gigvora-amber))]" />{m.rating}</div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Ecosystem Stats" icon={<Globe className="h-3.5 w-3.5 text-primary" />}>
        <div className="space-y-1 text-[8px]">
          {[
            { l: 'Active Startups', v: '248' },
            { l: 'Available Mentors', v: '62' },
            { l: 'Partnerships Made', v: '134' },
            { l: 'Help Requests Open', v: '45' },
          ].map(s => (
            <div key={s.l} className="flex justify-between"><span className="text-muted-foreground">{s.l}</span><span className="font-semibold">{s.v}</span></div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions">
        <div className="space-y-0.5">
          {[
            { label: 'Browse Showcases', icon: Rocket },
            { label: 'Find a Mentor', icon: Users },
            { label: 'Offer Help', icon: Heart },
            { label: 'My Connections', icon: Handshake },
          ].map(a => (
            <button key={a.label} className="flex items-center gap-2 p-1.5 rounded-md w-full text-left hover:bg-muted/30 transition-colors text-[8px]">
              <a.icon className="h-3 w-3 text-muted-foreground" /><span>{a.label}</span>
              <ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Recent Ecosystem Activity</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[
          { action: 'LaunchPad AI matched with Dr. Sarah Chen (CTO Advisor)', time: '1d ago', type: 'match' },
          { action: 'FinStack posted partnership request for embedded finance', time: '1w ago', type: 'request' },
          { action: 'GreenFlow completed 3 mentorship sessions', time: '3d ago', type: 'session' },
          { action: 'DataBridge joined Enterprise Connect showcase', time: '2w ago', type: 'showcase' },
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
      <a
        href="/enterprise-connect/startups"
        className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 via-primary/5 to-transparent px-4 py-2.5 hover:from-accent/15 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-accent/15 p-1.5"><Rocket className="h-3.5 w-3.5 text-accent" /></div>
          <div>
            <div className="text-[11px] font-semibold leading-tight">Startup Showcase</div>
            <div className="text-[9px] text-muted-foreground">Featured startups, ranker, investor & advisor matching</div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-medium text-accent">Open<ArrowUpRight className="h-3 w-3" /></div>
      </a>

      <KPIBand className="mb-3">
        <KPICard label="Showcases" value="248" change="Active startups" trend="up" />
        <KPICard label="Mentors Available" value="62" change="Ready to connect" />
        <KPICard label="Open Requests" value="45" change="Seeking help" />
        <KPICard label="Matches Made" value="134" change="This quarter" trend="up" />
      </KPIBand>

      <Tabs defaultValue="showcases">
        <TabsList className="mb-3 flex-wrap h-auto gap-0.5">
          <TabsTrigger value="showcases" className="gap-1 text-[10px] h-6 px-2"><Rocket className="h-3 w-3" />Startup Showcase</TabsTrigger>
          <TabsTrigger value="mentors" className="gap-1 text-[10px] h-6 px-2"><Users className="h-3 w-3" />Mentors</TabsTrigger>
          <TabsTrigger value="requests" className="gap-1 text-[10px] h-6 px-2"><Lightbulb className="h-3 w-3" />Help Requests</TabsTrigger>
          <TabsTrigger value="partners" className="gap-1 text-[10px] h-6 px-2"><Handshake className="h-3 w-3" />Partners</TabsTrigger>
        </TabsList>

        {/* Showcases */}
        <TabsContent value="showcases">
          <div className="grid grid-cols-2 gap-3">
            {STARTUPS.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.industry.toLowerCase().includes(search.toLowerCase())).map(s => (
              <div key={s.id} onClick={() => setSelectedStartup(s)} className="rounded-lg border bg-card p-3 cursor-pointer hover:border-ring/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-8 w-8"><AvatarFallback className="text-[8px]">{s.avatar}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold flex items-center gap-1">{s.name}{s.saved && <BookmarkCheck className="h-3 w-3 text-accent" />}</div>
                    <div className="text-[8px] text-muted-foreground">{s.industry}</div>
                  </div>
                  <Badge variant={s.score >= 85 ? 'default' : 'secondary'} className="text-[7px]">{s.score}</Badge>
                </div>
                <p className="text-[8px] text-muted-foreground line-clamp-2 mb-2">{s.description}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge className={cn('text-[6px] border-0 capitalize', STAGE_COLORS[s.stage])}>{s.stage.replace('_', ' ')}</Badge>
                  <Badge variant="secondary" className="text-[6px]">{s.mrr} MRR</Badge>
                  <Badge variant="secondary" className="text-[6px]">{s.team} team</Badge>
                </div>
                <div className="text-[7px] text-muted-foreground flex items-center gap-1 mb-2"><MapPin className="h-2.5 w-2.5" />{s.location} · Founded {s.founded} · Raised {s.raised}</div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-5 text-[7px] flex-1 gap-0.5"><Heart className="h-2 w-2" />Offer Help</Button>
                  <Button variant="outline" size="sm" className="h-5 text-[7px] flex-1 gap-0.5"><Eye className="h-2 w-2" />View</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Mentors */}
        <TabsContent value="mentors">
          <div className="grid grid-cols-2 gap-3">
            {MENTORS.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.expertise.some(e => e.toLowerCase().includes(search.toLowerCase()))).map(m => (
              <div key={m.id} onClick={() => setSelectedMentor(m)} className="rounded-lg border bg-card p-3 cursor-pointer hover:border-ring/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-9 w-9"><AvatarFallback className="text-[8px]">{m.avatar}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold">{m.name}</div>
                    <div className="text-[8px] text-muted-foreground">{m.title} · {m.company}</div>
                  </div>
                  <Badge variant={m.status === 'available' ? 'default' : 'secondary'} className="text-[6px] capitalize">{m.status}</Badge>
                </div>
                <p className="text-[8px] text-muted-foreground line-clamp-2 mb-2">{m.bio}</p>
                <div className="flex flex-wrap gap-0.5 mb-2">
                  {m.expertise.map(e => <Badge key={e} variant="secondary" className="text-[6px]">{e}</Badge>)}
                </div>
                <div className="flex items-center justify-between text-[8px] text-muted-foreground border-t pt-1.5">
                  <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{m.rating} · {m.sessions} sessions</span>
                  <div className="flex gap-0.5">{m.industries.slice(0, 2).map(i => <Badge key={i} className="text-[5px] border-0 bg-accent/10 text-accent">{i}</Badge>)}</div>
                </div>
                <div className="flex gap-1 mt-2">
                  <Button size="sm" className="h-5 text-[7px] flex-1 gap-0.5" disabled={m.status !== 'available'}><Calendar className="h-2 w-2" />Book</Button>
                  <Button variant="outline" size="sm" className="h-5 text-[7px] flex-1 gap-0.5"><MessageSquare className="h-2 w-2" />Message</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Help Requests */}
        <TabsContent value="requests">
          <div className="space-y-2">
            <div className="flex justify-end"><Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" />Post Request</Button></div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-[9px] text-muted-foreground font-medium">
                    <th className="text-left px-3 py-2">From</th>
                    <th className="text-left px-3 py-2">Type</th>
                    <th className="text-left px-3 py-2">Request</th>
                    <th className="text-center px-3 py-2">Status</th>
                    <th className="text-center px-3 py-2">Responses</th>
                    <th className="text-left px-3 py-2">Posted</th>
                    <th className="text-left px-3 py-2 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {HELP_REQUESTS.map(r => (
                    <tr key={r.id} className="border-t text-[9px] hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5"><AvatarFallback className="text-[5px]">{r.fromAvatar}</AvatarFallback></Avatar>
                          <span className="font-medium">{r.from}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2"><Badge variant="secondary" className="text-[6px]">{r.type}</Badge></td>
                      <td className="px-3 py-2 text-muted-foreground truncate max-w-[200px]">{r.title}</td>
                      <td className="px-3 py-2 text-center"><Badge className={cn('text-[6px] border-0 capitalize', REQ_STATUS_COLORS[r.status])}>{r.status.replace('_', ' ')}</Badge></td>
                      <td className="px-3 py-2 text-center font-medium">{r.responses}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.posted}</td>
                      <td className="px-3 py-2">
                        {r.status === 'open' && <Button size="sm" className="h-5 text-[7px] gap-0.5"><Heart className="h-2 w-2" />Help</Button>}
                        {r.status === 'awaiting' && (
                          <div className="flex items-center gap-0.5 text-[7px] text-[hsl(var(--gigvora-amber))]"><AlertTriangle className="h-2.5 w-2.5" />No responses</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {HELP_REQUESTS.some(r => r.status === 'awaiting') && (
              <div className="rounded-lg border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 p-2.5 flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0 mt-0.5" />
                <div className="text-[8px]"><span className="font-semibold">Requests Awaiting Response.</span> Some help requests have no responses yet. Consider expanding search criteria or featured placement.</div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Partners */}
        <TabsContent value="partners">
          <div className="space-y-3">
            {[
              { name: 'CloudScale', avatar: 'CS', type: 'Technology', status: 'active', since: 'Jan 2025', projects: 3, desc: 'Cloud infrastructure partner for scaling startups.' },
              { name: 'Venture First Capital', avatar: 'VF', type: 'Investment', status: 'active', since: 'Mar 2024', projects: 8, desc: 'Early-stage venture capital with hands-on support.' },
              { name: 'LegalEase', avatar: 'LE', type: 'Services', status: 'active', since: 'Sep 2024', projects: 12, desc: 'Startup-focused legal services and compliance.' },
              { name: 'TalentBridge', avatar: 'TB', type: 'Recruiting', status: 'pending', since: 'Pending', projects: 0, desc: 'Specialized recruiting for early-stage tech companies.' },
            ].map((p, i) => (
              <div key={i} className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-8 w-8"><AvatarFallback className="text-[7px]">{p.avatar}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold">{p.name}</div>
                    <div className="text-[8px] text-muted-foreground">{p.desc}</div>
                  </div>
                  <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="text-[6px] capitalize">{p.status}</Badge>
                </div>
                <div className="flex items-center justify-between text-[8px] text-muted-foreground border-t pt-1.5">
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-[6px]">{p.type}</Badge>
                    <span>Since {p.since}</span>
                    <span>{p.projects} projects</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-5 text-[7px] gap-0.5"><Eye className="h-2 w-2" />View</Button>
                    <Button variant="outline" size="sm" className="h-5 text-[7px] gap-0.5"><MessageSquare className="h-2 w-2" />Contact</Button>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-lg border bg-card p-4 text-center">
              <Handshake className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <div className="text-[10px] font-semibold mb-1">Become a Partner</div>
              <div className="text-[8px] text-muted-foreground mb-2">Join the Gigvora ecosystem and connect with startups, mentors, and enterprise clients.</div>
              <Button size="sm" className="h-6 text-[8px] gap-1"><Plus className="h-3 w-3" />Apply for Partnership</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <StartupDrawer startup={selectedStartup} open={!!selectedStartup} onClose={() => setSelectedStartup(null)} />
      <MentorDrawer mentor={selectedMentor} open={!!selectedMentor} onClose={() => setSelectedMentor(null)} />
    </DashboardLayout>
  );
};

export default EnterpriseConnectPage;
