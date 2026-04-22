import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Search, Star, MapPin, Clock, DollarSign, Calendar, Users,
  Video, BookOpen, Target, TrendingUp, Award, MessageSquare,
  Plus, Edit, Eye, BarChart3, FileText, Settings,
  CheckCircle2, Heart, Sparkles, Loader2, Filter,
  ChevronRight, Globe, Briefcase, GraduationCap, Zap,
  Play, Mic, Link as LinkIcon, Download, ArrowRight,
  CreditCard, Wallet, MoreHorizontal, UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAI } from '@/hooks/useAI';
import { toast } from 'sonner';

// ── Types ──
interface Mentor {
  id: string;
  name: string;
  headline: string;
  location: string;
  expertise: string[];
  rating: number;
  reviews: number;
  sessions: number;
  rate: string;
  availability: string;
  bio: string;
  languages: string[];
  packages: MentorPackage[];
  verified: boolean;
}

interface MentorPackage {
  id: string;
  name: string;
  description: string;
  sessions: number;
  duration: string;
  price: number;
  features: string[];
}

interface MentorClient {
  id: string;
  name: string;
  goal: string;
  progress: number;
  sessionsCompleted: number;
  totalSessions: number;
  nextSession: string;
  status: 'active' | 'paused' | 'completed';
}

interface SessionNote {
  id: string;
  client: string;
  date: string;
  topics: string[];
  summary: string;
  actionItems: string[];
  mood: 'positive' | 'neutral' | 'challenging';
}

// ── Mock Data ──
const MOCK_MENTORS: Mentor[] = [
  {
    id: 'm1', name: 'Dr. Sarah Chen', headline: 'Executive Coach & Leadership Advisor', location: 'San Francisco, CA',
    expertise: ['Leadership', 'Career Strategy', 'Executive Coaching', 'Startups'],
    rating: 4.9, reviews: 156, sessions: 890, rate: '$150/hr', availability: '5 slots this week',
    bio: 'Former VP at Google with 15+ years coaching C-suite executives and emerging leaders.',
    languages: ['English', 'Mandarin'], verified: true,
    packages: [
      { id: 'p1', name: 'Discovery Session', description: '1:1 exploratory call', sessions: 1, duration: '45 min', price: 75, features: ['Goal assessment', 'Roadmap overview'] },
      { id: 'p2', name: 'Growth Sprint', description: '4-week intensive program', sessions: 4, duration: '60 min', price: 500, features: ['Weekly sessions', 'Async support', 'Action plan', 'Resource library'] },
      { id: 'p3', name: 'Executive Package', description: '12-week transformation', sessions: 12, duration: '60 min', price: 1400, features: ['Weekly sessions', '24/7 chat access', 'Custom curriculum', 'Network introductions', 'Progress reports'] },
    ],
  },
  {
    id: 'm2', name: 'James Wilson', headline: 'Product Design Mentor & Portfolio Reviewer', location: 'New York, NY',
    expertise: ['Product Design', 'UX Research', 'Portfolio Review', 'Career Switch'],
    rating: 4.8, reviews: 89, sessions: 420, rate: '$100/hr', availability: '3 slots this week',
    bio: 'Lead Designer at Airbnb. Helped 100+ designers land roles at FAANG companies.',
    languages: ['English'], verified: true,
    packages: [
      { id: 'p4', name: 'Portfolio Review', description: 'Deep portfolio critique', sessions: 1, duration: '60 min', price: 100, features: ['Detailed feedback', 'Written notes'] },
      { id: 'p5', name: 'Career Accelerator', description: '6-session career program', sessions: 6, duration: '45 min', price: 450, features: ['Portfolio rebuild', 'Interview prep', 'Salary negotiation', 'Job search strategy'] },
    ],
  },
  {
    id: 'm3', name: 'Priya Sharma', headline: 'Startup Advisor & Fundraising Expert', location: 'London, UK',
    expertise: ['Fundraising', 'Pitch Decks', 'Business Strategy', 'VC Relations'],
    rating: 4.7, reviews: 67, sessions: 310, rate: '$200/hr', availability: '2 slots this week',
    bio: 'Angel investor and former YC partner. Helped raise $200M+ across 50+ startups.',
    languages: ['English', 'Hindi'], verified: true,
    packages: [
      { id: 'p6', name: 'Pitch Review', description: 'Investor-ready pitch deck review', sessions: 1, duration: '60 min', price: 200, features: ['Pitch feedback', 'Investor perspective', 'Follow-up notes'] },
      { id: 'p7', name: 'Fundraise Ready', description: '8-week fundraise prep', sessions: 8, duration: '60 min', price: 1200, features: ['Pitch coaching', 'Financial modeling', 'Investor intros', 'Due diligence prep', 'Term sheet review'] },
    ],
  },
  {
    id: 'm4', name: 'Marcus Thompson', headline: 'Engineering Manager & Tech Lead Coach', location: 'Austin, TX',
    expertise: ['Engineering Management', 'System Design', 'Team Building', 'Technical Interviews'],
    rating: 4.9, reviews: 112, sessions: 560, rate: '$125/hr', availability: '4 slots this week',
    bio: 'Engineering Director at Stripe. Passionate about growing the next generation of tech leaders.',
    languages: ['English', 'Spanish'], verified: true,
    packages: [
      { id: 'p8', name: 'Interview Prep', description: 'Targeted interview coaching', sessions: 3, duration: '60 min', price: 300, features: ['Mock interviews', 'System design', 'Behavioral prep', 'Feedback reports'] },
      { id: 'p9', name: 'Management Track', description: 'IC to manager transition', sessions: 8, duration: '60 min', price: 800, features: ['Leadership skills', '1:1 frameworks', 'Performance reviews', 'Conflict resolution', 'Hiring practices'] },
    ],
  },
];

const MOCK_CLIENTS: MentorClient[] = [
  { id: 'cl1', name: 'Alex Kim', goal: 'Transition to Engineering Manager', progress: 65, sessionsCompleted: 5, totalSessions: 8, nextSession: 'Apr 10, 2:00 PM', status: 'active' },
  { id: 'cl2', name: 'Nina Kowalski', goal: 'Land FAANG Design Role', progress: 80, sessionsCompleted: 4, totalSessions: 6, nextSession: 'Apr 11, 10:00 AM', status: 'active' },
  { id: 'cl3', name: 'Tom Richards', goal: 'Raise Series A', progress: 40, sessionsCompleted: 3, totalSessions: 8, nextSession: 'Apr 14, 3:00 PM', status: 'active' },
  { id: 'cl4', name: 'Aisha Mohammed', goal: 'Career Switch to Product', progress: 100, sessionsCompleted: 6, totalSessions: 6, nextSession: 'Completed', status: 'completed' },
  { id: 'cl5', name: 'Robert Chang', goal: 'Executive Coaching', progress: 25, sessionsCompleted: 2, totalSessions: 12, nextSession: 'Paused', status: 'paused' },
];

const MOCK_SESSION_NOTES: SessionNote[] = [
  { id: 'n1', client: 'Alex Kim', date: 'Apr 7', topics: ['1:1 Framework', 'Delegation'], summary: 'Discussed 1:1 meeting structure and effective delegation techniques. Alex showed strong progress in team communication.', actionItems: ['Practice 1:1 framework with 2 reports', 'Read "The Manager\'s Path" Ch. 4-6'], mood: 'positive' },
  { id: 'n2', client: 'Nina Kowalski', date: 'Apr 4', topics: ['Portfolio Review', 'Case Study'], summary: 'Reviewed updated portfolio. Case study for e-commerce redesign needs stronger problem statement. Visual presentation is excellent.', actionItems: ['Revise problem statement', 'Add metrics to case study', 'Practice 15-min presentation'], mood: 'positive' },
  { id: 'n3', client: 'Tom Richards', date: 'Apr 2', topics: ['Financial Model', 'VC Meetings'], summary: 'Reviewed financial projections. Revenue assumptions need more data backing. Discussed preparation for upcoming VC meetings.', actionItems: ['Update TAM analysis', 'Prepare Q&A document', 'Schedule 3 warm intros'], mood: 'neutral' },
];

const MOCK_TEMPLATES = [
  { id: 'tp1', name: 'Career Transition Roadmap', uses: 234, category: 'Career' },
  { id: 'tp2', name: 'Interview Prep Checklist', uses: 456, category: 'Interview' },
  { id: 'tp3', name: 'Fundraise Playbook', uses: 123, category: 'Startup' },
  { id: 'tp4', name: 'Leadership Development Plan', uses: 189, category: 'Leadership' },
  { id: 'tp5', name: 'Portfolio Review Framework', uses: 345, category: 'Design' },
  { id: 'tp6', name: 'Technical Growth Plan', uses: 267, category: 'Engineering' },
];

// ── Mentor Card ──
const MentorCard: React.FC<{ mentor: Mentor; onBook: () => void }> = ({ mentor, onBook }) => (
  <div className="rounded-xl border bg-card p-5 hover:shadow-md transition-all">
    <div className="flex items-start gap-3 mb-3">
      <Avatar className="h-12 w-12"><AvatarFallback className="bg-accent/10 text-accent font-semibold">{mentor.name[0]}</AvatarFallback></Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm">{mentor.name}</span>
          {mentor.verified && <CheckCircle2 className="h-3.5 w-3.5 text-accent" />}
        </div>
        <div className="text-xs text-muted-foreground">{mentor.headline}</div>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {mentor.location}
          <span>·</span>
          <Star className="h-3 w-3 text-gigvora-amber" /> {mentor.rating} ({mentor.reviews})
        </div>
      </div>
    </div>
    <div className="flex flex-wrap gap-1 mb-3">
      {mentor.expertise.map(e => <span key={e} className="text-[10px] bg-accent/10 text-accent rounded-full px-2 py-0.5">{e}</span>)}
    </div>
    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{mentor.bio}</p>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{mentor.rate}</span>
        <span>{mentor.sessions} sessions</span>
        <span className="text-gigvora-green">{mentor.availability}</span>
      </div>
      <Button size="sm" className="text-xs" onClick={onBook}>Book Session</Button>
    </div>
  </div>
);

// ── Browse / Marketplace ──
const MentorBrowse: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const categories = ['all', 'Leadership', 'Design', 'Engineering', 'Startup', 'Career', 'Marketing'];

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mentors by name, expertise, or keyword..." className="w-full h-10 rounded-lg border bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <Button variant="outline" className="gap-1.5"><Filter className="h-4 w-4" /> Filters</Button>
      </div>
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)} className={cn('px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors', category === c ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/50')}>{c === 'all' ? 'All Mentors' : c}</button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {MOCK_MENTORS.map(m => <MentorCard key={m.id} mentor={m} onBook={() => toast.success(`Booking request sent to ${m.name}`)} />)}
      </div>
    </div>
  );
};

// ── Mentor Dashboard ──
const MentorDashboard: React.FC = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {[
        { label: 'Active Clients', value: '8', icon: Users, change: '+2' },
        { label: 'Sessions This Month', value: '24', icon: Video, change: '+6' },
        { label: 'Revenue MTD', value: '$3,400', icon: DollarSign, change: '+$800' },
        { label: 'Avg Rating', value: '4.9', icon: Star, change: '' },
        { label: 'Completion Rate', value: '94%', icon: CheckCircle2, change: '+2%' },
      ].map(s => (
        <div key={s.label} className="rounded-xl border bg-card p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><s.icon className="h-3 w-3" /> {s.label}</div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{s.value}</span>
            {s.change && <span className="text-[10px] text-gigvora-green">{s.change}</span>}
          </div>
        </div>
      ))}
    </div>

    {/* Upcoming */}
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-semibold text-sm mb-3">Upcoming Sessions</h3>
      <div className="space-y-2">
        {MOCK_CLIENTS.filter(c => c.status === 'active').map(c => (
          <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border">
            <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px] bg-accent/10 text-accent">{c.name[0]}</AvatarFallback></Avatar>
            <div className="flex-1">
              <div className="text-xs font-medium">{c.name}</div>
              <div className="text-[10px] text-muted-foreground">{c.goal}</div>
            </div>
            <div className="text-xs text-muted-foreground">{c.nextSession}</div>
            <Button size="sm" className="h-7 text-[10px] gap-1"><Video className="h-3 w-3" /> Join</Button>
          </div>
        ))}
      </div>
    </div>

    {/* Quick Actions */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: 'Set Availability', icon: Calendar },
        { label: 'Create Package', icon: Plus },
        { label: 'View Payouts', icon: Wallet },
        { label: 'AI Session Prep', icon: Sparkles },
      ].map(a => (
        <button key={a.label} className="rounded-xl border bg-card p-4 text-center hover:bg-accent/5 hover:border-accent/30 transition-all">
          <a.icon className="h-6 w-6 text-accent mx-auto mb-2" />
          <span className="text-xs font-medium">{a.label}</span>
        </button>
      ))}
    </div>
  </div>
);

// ── Package Manager ──
const PackageManager: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-semibold">Session Packages</h3>
      <Button className="gap-1 text-xs"><Plus className="h-3.5 w-3.5" /> New Package</Button>
    </div>
    {MOCK_MENTORS[0].packages.map(pkg => (
      <div key={pkg.id} className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="font-semibold text-sm">{pkg.name}</h4>
            <p className="text-xs text-muted-foreground">{pkg.description}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">${pkg.price}</div>
            <div className="text-[10px] text-muted-foreground">{pkg.sessions} × {pkg.duration}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {pkg.features.map(f => (
            <span key={f} className="text-[10px] bg-muted rounded-full px-2 py-0.5 flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5 text-gigvora-green" /> {f}</span>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-xs gap-1"><Edit className="h-3 w-3" /> Edit</Button>
          <Button size="sm" variant="ghost" className="text-xs text-destructive">Archive</Button>
        </div>
      </div>
    ))}
  </div>
);

// ── Clients List ──
const ClientsList: React.FC = () => (
  <div className="space-y-3">
    {MOCK_CLIENTS.map(c => {
      const statusMap: Record<string, string> = { active: 'bg-gigvora-green/10 text-gigvora-green', paused: 'bg-gigvora-amber/10 text-gigvora-amber', completed: 'bg-muted text-muted-foreground' };
      return (
        <div key={c.id} className="rounded-xl border bg-card p-4 flex items-center gap-4">
          <Avatar className="h-10 w-10"><AvatarFallback className="bg-accent/10 text-accent">{c.name[0]}</AvatarFallback></Avatar>
          <div className="flex-1">
            <div className="font-medium text-sm">{c.name}</div>
            <div className="text-xs text-muted-foreground">{c.goal}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <Progress value={c.progress} className="h-1.5 flex-1 max-w-[120px]" />
              <span className="text-[10px] text-muted-foreground">{c.sessionsCompleted}/{c.totalSessions} sessions</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            <div>{c.nextSession}</div>
          </div>
          <Badge className={cn('text-[10px] capitalize', statusMap[c.status])}>{c.status}</Badge>
          <Button variant="outline" size="sm" className="text-xs">View</Button>
        </div>
      );
    })}
  </div>
);

// ── Notes Hub ──
const NotesHub: React.FC = () => {
  const { loading: aiLoading, invoke: aiInvoke } = useAI({ type: 'writing-assist' });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Session Notes</h3>
        <Button className="gap-1 text-xs"><Plus className="h-3.5 w-3.5" /> New Note</Button>
      </div>
      {MOCK_SESSION_NOTES.map(note => {
        const moodMap = { positive: '🟢', neutral: '🟡', challenging: '🔴' };
        return (
          <div key={note.id} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{note.client}</span>
                <span className="text-xs text-muted-foreground">{note.date}</span>
                <span className="text-xs">{moodMap[note.mood]}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => aiInvoke({ text: note.summary, action: 'Generate follow-up action items and key takeaways from this mentorship session.' })} disabled={aiLoading}>
                <Sparkles className="h-3 w-3" /> AI Summary
              </Button>
            </div>
            <div className="flex gap-1 mb-2">{note.topics.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}</div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{note.summary}</p>
            <div>
              <h5 className="text-[10px] font-semibold mb-1">Action Items</h5>
              {note.actionItems.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-3 w-3 text-muted-foreground/50" /> {a}</div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Outcomes Analytics ──
const OutcomesAnalytics: React.FC = () => (
  <div className="space-y-4">
    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold text-sm mb-3">Client Outcomes</h3>
        <div className="space-y-3">
          {[
            { label: 'Got Promoted', count: 12, pct: 35 },
            { label: 'Landed Target Role', count: 18, pct: 52 },
            { label: 'Raised Funding', count: 6, pct: 17 },
            { label: 'Career Switch', count: 8, pct: 23 },
            { label: 'Salary Increase', count: 22, pct: 64 },
          ].map(o => (
            <div key={o.label} className="flex items-center gap-3">
              <span className="text-xs flex-1">{o.label}</span>
              <Progress value={o.pct} className="h-1.5 w-24" />
              <span className="text-xs font-semibold w-8 text-right">{o.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold text-sm mb-3">Revenue & Payouts</h3>
        <div className="space-y-2">
          {[
            { label: 'Total Revenue', value: '$24,500' },
            { label: 'This Month', value: '$3,400' },
            { label: 'Pending Payout', value: '$1,200' },
            { label: 'Next Payout', value: 'Apr 15' },
            { label: 'Platform Fee', value: '10%' },
            { label: 'Net Earnings YTD', value: '$22,050' },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-semibold">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Cohort Sessions */}
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-accent" /> Cohort Sessions</h3>
      <div className="space-y-2">
        {[
          { name: 'Leadership Masterclass', participants: 12, date: 'Apr 15', duration: '90 min', price: '$45/person' },
          { name: 'Portfolio Review Workshop', participants: 8, date: 'Apr 20', duration: '120 min', price: '$60/person' },
          { name: 'Fundraising Bootcamp', participants: 15, date: 'Apr 25', duration: '180 min', price: '$80/person' },
        ].map(c => (
          <div key={c.name} className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <div className="text-xs font-medium">{c.name}</div>
              <div className="text-[10px] text-muted-foreground">{c.date} · {c.duration} · {c.participants} participants</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">{c.price}</span>
              <Button variant="outline" size="sm" className="h-6 text-[10px]">Manage</Button>
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" className="mt-3 w-full text-xs gap-1"><Plus className="h-3 w-3" /> Create Cohort Session</Button>
    </div>

    {/* Resources */}
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4 text-accent" /> Templates & Resources</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {MOCK_TEMPLATES.map(t => (
          <div key={t.id} className="p-3 rounded-lg border hover:border-accent/30 transition-colors cursor-pointer">
            <FileText className="h-5 w-5 text-accent mb-1.5" />
            <div className="text-xs font-medium">{t.name}</div>
            <div className="text-[10px] text-muted-foreground">{t.category} · {t.uses} uses</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Payouts ──
const PayoutsPage: React.FC = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: 'Available Balance', value: '$1,200', color: 'text-gigvora-green' },
        { label: 'Pending', value: '$450', color: 'text-gigvora-amber' },
        { label: 'Total Earned', value: '$24,500', color: 'text-foreground' },
      ].map(s => (
        <div key={s.label} className="rounded-xl border bg-card p-4 text-center">
          <div className={cn('text-2xl font-bold', s.color)}>{s.value}</div>
          <div className="text-xs text-muted-foreground">{s.label}</div>
        </div>
      ))}
    </div>
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-semibold text-sm mb-3">Payout History</h3>
      <div className="space-y-2">
        {[
          { date: 'Apr 1', amount: '$2,800', method: 'Bank Transfer', status: 'Completed' },
          { date: 'Mar 15', amount: '$3,100', method: 'Bank Transfer', status: 'Completed' },
          { date: 'Mar 1', amount: '$2,500', method: 'Bank Transfer', status: 'Completed' },
          { date: 'Feb 15', amount: '$2,200', method: 'PayPal', status: 'Completed' },
        ].map((p, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <div className="text-xs font-medium">{p.date}</div>
              <div className="text-[10px] text-muted-foreground">{p.method}</div>
            </div>
            <span className="text-sm font-semibold">{p.amount}</span>
            <Badge variant="secondary" className="text-[10px]">{p.status}</Badge>
          </div>
        ))}
      </div>
    </div>
    <Button className="gap-1"><CreditCard className="h-4 w-4" /> Request Payout</Button>
  </div>
);

// ── MAIN PAGE ──
const MentorMarketplacePage: React.FC = () => {
  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="h-6 w-6 text-accent" /> Mentor Marketplace</h1>
          <p className="text-sm text-muted-foreground">Find mentors, book sessions, and accelerate your growth</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5"><UserCheck className="h-3.5 w-3.5" /> Become a Mentor</Button>
          <Button className="gap-1.5"><Search className="h-3.5 w-3.5" /> Find a Mentor</Button>
        </div>
      </div>

      <Tabs defaultValue="browse">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="browse">Browse Mentors</TabsTrigger>
          <TabsTrigger value="dashboard">Mentor Dashboard</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="notes">Notes Hub</TabsTrigger>
          <TabsTrigger value="analytics">Outcomes</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="browse"><MentorBrowse /></TabsContent>
        <TabsContent value="dashboard"><MentorDashboard /></TabsContent>
        <TabsContent value="packages"><PackageManager /></TabsContent>
        <TabsContent value="clients"><ClientsList /></TabsContent>
        <TabsContent value="notes"><NotesHub /></TabsContent>
        <TabsContent value="analytics"><OutcomesAnalytics /></TabsContent>
        <TabsContent value="payouts"><PayoutsPage /></TabsContent>
      </Tabs>
    </div>
  );
};

export default MentorMarketplacePage;
