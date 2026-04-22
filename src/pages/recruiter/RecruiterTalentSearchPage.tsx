import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, KPIBand, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Search, Filter, Users, MapPin, Star, Briefcase,
  Plus, Eye, MessageSquare, Mail, BookmarkPlus, Bookmark,
  Grid3X3, List, Globe, Clock, Award, Sparkles,
  TrendingUp, BarChart3, Download, ExternalLink,
  X, CheckCircle2, Shield, Lock, UserCheck, Target,
  ChevronRight, FileText, Send, Copy, Zap, AlertTriangle,
  Building2, Loader2, Heart, UserPlus, Phone, Calendar,
  Map, Settings, ArrowUpRight, RefreshCw, Inbox, Hash,
  type LucideIcon,
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { useAI } from '@/hooks/useAI';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════ */
type NavTab = 'search' | 'saved-lists' | 'outreach' | 'signals' | 'map' | 'analytics';

interface TalentCandidate {
  id: string; name: string; headline: string; location: string; experience: string;
  skills: string[]; matchScore: number; openToWork: boolean; availability: string;
  lastActive: string; verified: boolean; savedListIds: string[]; salary: string;
  avatar: string; endorsements: number; profileStrength: number;
  signalTags?: string[]; region?: string;
}

interface SavedList {
  id: string; name: string; count: number; createdAt: string; color: string; shared?: boolean;
}

interface OutreachCampaign {
  id: string; name: string; status: 'active' | 'paused' | 'completed' | 'draft';
  sent: number; opened: number; replied: number; scheduled: number; createdAt: string;
}

const MOCK_TALENT: TalentCandidate[] = [
  { id: 't1', name: 'Elena Kowalski', headline: 'Senior Full-Stack Engineer · Ex-Google', location: 'San Francisco, CA', experience: '8 years', skills: ['React', 'TypeScript', 'Go', 'Kubernetes', 'AWS'], matchScore: 95, openToWork: true, availability: 'Immediately', lastActive: '2h ago', verified: true, savedListIds: ['sl1'], salary: '$180K-$220K', avatar: 'EK', endorsements: 47, profileStrength: 92, signalTags: ['Recently promoted', 'Active contributor'], region: 'us-west' },
  { id: 't2', name: 'Marcus Chen', headline: 'Staff Product Designer · Design Systems', location: 'New York, NY', experience: '10 years', skills: ['Figma', 'Design Systems', 'UX Research', 'Prototyping', 'Motion'], matchScore: 91, openToWork: true, availability: '2 weeks', lastActive: '1d ago', verified: true, savedListIds: ['sl1', 'sl2'], salary: '$160K-$200K', avatar: 'MC', endorsements: 63, profileStrength: 88, signalTags: ['Job change signal'], region: 'us-east' },
  { id: 't3', name: 'Priya Sharma', headline: 'ML Engineer · NLP & Computer Vision', location: 'London, UK', experience: '6 years', skills: ['Python', 'PyTorch', 'TensorFlow', 'NLP', 'Computer Vision'], matchScore: 88, openToWork: false, availability: '1 month', lastActive: '3d ago', verified: true, savedListIds: [], salary: '£120K-£150K', avatar: 'PS', endorsements: 35, profileStrength: 85, signalTags: ['Published paper'], region: 'europe' },
  { id: 't4', name: 'James Rodriguez', headline: 'DevOps Lead · Infrastructure & SRE', location: 'Austin, TX', experience: '7 years', skills: ['Terraform', 'AWS', 'Docker', 'CI/CD', 'Monitoring'], matchScore: 85, openToWork: true, availability: 'Immediately', lastActive: '5h ago', verified: false, savedListIds: ['sl2'], salary: '$150K-$185K', avatar: 'JR', endorsements: 29, profileStrength: 78, signalTags: ['Company layoff'], region: 'us-central' },
  { id: 't5', name: 'Sophia Lang', headline: 'Engineering Manager · Platform Teams', location: 'Berlin, DE', experience: '12 years', skills: ['Leadership', 'System Design', 'Java', 'Microservices', 'Agile'], matchScore: 82, openToWork: false, availability: '3 months', lastActive: '1w ago', verified: true, savedListIds: [], salary: '€130K-€170K', avatar: 'SL', endorsements: 51, profileStrength: 90, signalTags: ['New certification'], region: 'europe' },
  { id: 't6', name: 'David Kim', headline: 'Senior iOS Engineer · Swift & SwiftUI', location: 'Seattle, WA', experience: '5 years', skills: ['Swift', 'SwiftUI', 'iOS', 'CoreData', 'ARKit'], matchScore: 79, openToWork: true, availability: '2 weeks', lastActive: '12h ago', verified: true, savedListIds: ['sl1'], salary: '$140K-$180K', avatar: 'DK', endorsements: 22, profileStrength: 81, signalTags: [], region: 'us-west' },
  { id: 't7', name: 'Amara Okafor', headline: 'Data Platform Architect · BigQuery & Spark', location: 'Toronto, CA', experience: '9 years', skills: ['Spark', 'BigQuery', 'Airflow', 'Python', 'dbt'], matchScore: 76, openToWork: false, availability: 'Not looking', lastActive: '2w ago', verified: false, savedListIds: [], salary: 'C$160K-C$200K', avatar: 'AO', endorsements: 18, profileStrength: 72, signalTags: ['Profile updated'], region: 'us-east' },
  { id: 't8', name: 'Oliver Bauer', headline: 'Security Engineer · AppSec & Compliance', location: 'Zürich, CH', experience: '7 years', skills: ['Security', 'Penetration Testing', 'SOC2', 'GDPR', 'Rust'], matchScore: 73, openToWork: true, availability: '1 month', lastActive: '4d ago', verified: true, savedListIds: ['sl2'], salary: 'CHF 150K-190K', avatar: 'OB', endorsements: 31, profileStrength: 84, signalTags: ['Open source commit'], region: 'europe' },
  { id: 't9', name: 'Lina Petrov', headline: 'Backend Engineer · Rust & Go', location: 'Remote', experience: '4 years', skills: ['Rust', 'Go', 'PostgreSQL', 'gRPC', 'Linux'], matchScore: 70, openToWork: true, availability: 'Immediately', lastActive: '6h ago', verified: false, savedListIds: [], salary: '$120K-$150K', avatar: 'LP', endorsements: 12, profileStrength: 68, signalTags: ['Company layoff', 'Active contributor'], region: 'europe' },
  { id: 't10', name: 'Takeshi Yamamoto', headline: 'Frontend Architect · React & Performance', location: 'Tokyo, JP', experience: '11 years', skills: ['React', 'Performance', 'TypeScript', 'WebGL', 'Accessibility'], matchScore: 87, openToWork: false, availability: '2 months', lastActive: '5d ago', verified: true, savedListIds: ['sl1'], salary: '¥15M-¥20M', avatar: 'TY', endorsements: 44, profileStrength: 91, signalTags: ['Speaker at conference'], region: 'apac' },
];

const MOCK_SAVED_LISTS: SavedList[] = [
  { id: 'sl1', name: 'Frontend Shortlist', count: 4, createdAt: 'Apr 8, 2025', color: 'bg-accent', shared: true },
  { id: 'sl2', name: 'Leadership Pipeline', count: 3, createdAt: 'Mar 25, 2025', color: 'bg-[hsl(var(--state-caution))]' },
  { id: 'sl3', name: 'AI/ML Watch', count: 0, createdAt: 'Apr 1, 2025', color: 'bg-[hsl(var(--state-review))]' },
  { id: 'sl4', name: 'Q2 Hiring Sprint', count: 2, createdAt: 'Apr 10, 2025', color: 'bg-[hsl(var(--state-healthy))]', shared: true },
];

const MOCK_CAMPAIGNS: OutreachCampaign[] = [
  { id: 'oc1', name: 'Senior Engineers Outreach', status: 'active', sent: 45, opened: 28, replied: 12, scheduled: 8, createdAt: 'Apr 5, 2025' },
  { id: 'oc2', name: 'Design Leaders Q2', status: 'active', sent: 22, opened: 15, replied: 6, scheduled: 3, createdAt: 'Apr 8, 2025' },
  { id: 'oc3', name: 'ML Talent Pipeline', status: 'paused', sent: 18, opened: 10, replied: 3, scheduled: 0, createdAt: 'Mar 28, 2025' },
  { id: 'oc4', name: 'DevOps Hiring Sprint', status: 'completed', sent: 60, opened: 42, replied: 18, scheduled: 0, createdAt: 'Mar 15, 2025' },
  { id: 'oc5', name: 'Security Team Build', status: 'draft', sent: 0, opened: 0, replied: 0, scheduled: 15, createdAt: 'Apr 12, 2025' },
];

const SIGNAL_TYPES = [
  { label: 'Job Change Signal', count: 3, color: 'bg-[hsl(var(--state-caution))]' },
  { label: 'Company Layoff', count: 2, color: 'bg-[hsl(var(--state-blocked))]' },
  { label: 'Active Contributor', count: 2, color: 'bg-[hsl(var(--state-healthy))]' },
  { label: 'Profile Updated', count: 1, color: 'bg-accent' },
  { label: 'New Certification', count: 1, color: 'bg-[hsl(var(--state-premium))]' },
  { label: 'Published Paper', count: 1, color: 'bg-[hsl(var(--state-review))]' },
  { label: 'Speaker at Conference', count: 1, color: 'bg-accent' },
  { label: 'Open Source Commit', count: 1, color: 'bg-[hsl(var(--state-healthy))]' },
];

const REGIONS = [
  { id: 'us-west', label: 'US West', candidates: 3, cities: 'SF, Seattle' },
  { id: 'us-east', label: 'US East', candidates: 2, cities: 'NYC, Toronto' },
  { id: 'us-central', label: 'US Central', candidates: 1, cities: 'Austin' },
  { id: 'europe', label: 'Europe', candidates: 3, cities: 'London, Berlin, Zürich' },
  { id: 'apac', label: 'Asia-Pacific', candidates: 1, cities: 'Tokyo' },
];

const OUTREACH_STATUS_MAP: Record<string, { label: string; badge: 'healthy' | 'caution' | 'blocked' | 'pending' | 'live' }> = {
  active: { label: 'Active', badge: 'live' },
  paused: { label: 'Paused', badge: 'caution' },
  completed: { label: 'Completed', badge: 'healthy' },
  draft: { label: 'Draft', badge: 'pending' },
};

type ViewMode = 'card' | 'table';

/* ═══════════════════════════════════════════════════════════
   Sub-Components
   ═══════════════════════════════════════════════════════════ */

const TalentCard: React.FC<{ c: TalentCandidate; onClick: () => void; onSave: () => void; compare?: boolean; onCompare?: () => void }> = ({ c, onClick, onSave, compare, onCompare }) => (
  <div className={cn('rounded-2xl border bg-card p-3.5 hover:shadow-md transition-all cursor-pointer group', compare && 'ring-1 ring-accent')} onClick={onClick}>
    <div className="flex items-start gap-2.5 mb-2">
      <div className="relative">
        <Avatar className="h-10 w-10 ring-2 ring-muted/30">
          <AvatarFallback className="text-[10px] bg-accent/10 text-accent font-bold">{c.avatar}</AvatarFallback>
        </Avatar>
        {c.openToWork && <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[hsl(var(--state-healthy))] border-2 border-card" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-bold truncate group-hover:text-accent transition-colors">{c.name}</span>
          {c.verified && <CheckCircle2 className="h-3 w-3 text-accent shrink-0" />}
        </div>
        <div className="text-[9px] text-muted-foreground truncate">{c.headline}</div>
      </div>
      <div className="text-center shrink-0">
        <div className="text-sm font-bold text-accent">{c.matchScore}%</div>
        <div className="text-[7px] text-muted-foreground">match</div>
      </div>
    </div>
    <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground mb-2">
      <MapPin className="h-2.5 w-2.5" />{c.location} · <Clock className="h-2.5 w-2.5" />{c.lastActive}
    </div>
    <div className="flex flex-wrap gap-1 mb-2">
      {c.skills.slice(0, 4).map(s => <span key={s} className="text-[8px] bg-accent/10 text-accent rounded-full px-1.5 py-0.5">{s}</span>)}
      {c.skills.length > 4 && <span className="text-[8px] text-muted-foreground">+{c.skills.length - 4}</span>}
    </div>
    {c.signalTags && c.signalTags.length > 0 && (
      <div className="flex flex-wrap gap-1 mb-2">
        {c.signalTags.slice(0, 2).map(s => <span key={s} className="text-[7px] bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))] rounded-full px-1.5 py-0.5 flex items-center gap-0.5"><Zap className="h-2 w-2" />{s}</span>)}
      </div>
    )}
    <div className="flex items-center justify-between">
      <span className="text-[8px] text-muted-foreground">{c.experience} · {c.salary}</span>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onCompare && <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); onCompare(); }}><Copy className="h-2.5 w-2.5" /></Button>}
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); onSave(); }}>
          {c.savedListIds.length > 0 ? <Bookmark className="h-3 w-3 text-accent fill-accent" /> : <BookmarkPlus className="h-3 w-3" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); toast.info('InMail sent'); }}>
          <Mail className="h-3 w-3" />
        </Button>
      </div>
    </div>
  </div>
);

const TalentRow: React.FC<{ c: TalentCandidate; onClick: () => void; onSave: () => void }> = ({ c, onClick, onSave }) => (
  <div className="grid grid-cols-[1fr_100px_80px_60px_90px_80px] gap-2 px-3 py-2.5 border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer items-center" onClick={onClick}>
    <div className="flex items-center gap-2 min-w-0">
      <div className="relative">
        <Avatar className="h-7 w-7 ring-1 ring-muted/30"><AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">{c.avatar}</AvatarFallback></Avatar>
        {c.openToWork && <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[hsl(var(--state-healthy))] border border-card" />}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-medium truncate">{c.name}</span>
          {c.verified && <CheckCircle2 className="h-2.5 w-2.5 text-accent" />}
        </div>
        <div className="text-[8px] text-muted-foreground truncate">{c.headline}</div>
      </div>
    </div>
    <div className="text-[9px] text-muted-foreground truncate">{c.location}</div>
    <div className="text-[9px] text-muted-foreground">{c.experience}</div>
    <div className="text-center"><span className="text-[10px] font-bold text-accent">{c.matchScore}%</span></div>
    <div className="flex flex-wrap gap-0.5">{c.skills.slice(0, 2).map(s => <span key={s} className="text-[7px] bg-accent/10 text-accent rounded-full px-1 py-0">{s}</span>)}</div>
    <div className="flex items-center justify-end gap-0.5">
      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); onSave(); }}>
        {c.savedListIds.length > 0 ? <Bookmark className="h-2.5 w-2.5 text-accent fill-accent" /> : <BookmarkPlus className="h-2.5 w-2.5" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); toast.info('InMail sent'); }}>
        <Mail className="h-2.5 w-2.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); toast.info('Scheduled call'); }}>
        <Phone className="h-2.5 w-2.5" />
      </Button>
    </div>
  </div>
);

/* ── Candidate Detail Drawer ── */
const CandidateDrawer: React.FC<{ c: TalentCandidate | null; onClose: () => void }> = ({ c, onClose }) => {
  const { loading: aiLoading, invoke: aiInvoke, result: aiResult } = useAI({ type: 'writing-assist' });
  if (!c) return null;
  return (
    <Sheet open={!!c} onOpenChange={() => onClose()}>
      <SheetContent className="w-[460px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><UserCheck className="h-4 w-4 text-accent" />Candidate Profile</SheetTitle></SheetHeader>
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar className="h-14 w-14 ring-2 ring-accent/20"><AvatarFallback className="text-sm bg-accent/10 text-accent font-bold">{c.avatar}</AvatarFallback></Avatar>
              {c.openToWork && <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[hsl(var(--state-healthy))] border-2 border-card flex items-center justify-center"><CheckCircle2 className="h-2.5 w-2.5 text-white" /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1"><h3 className="text-[13px] font-bold">{c.name}</h3>{c.verified && <CheckCircle2 className="h-3.5 w-3.5 text-accent" />}</div>
              <p className="text-[10px] text-muted-foreground">{c.headline}</p>
              <div className="flex items-center gap-2 mt-0.5 text-[9px] text-muted-foreground"><MapPin className="h-3 w-3" />{c.location} · {c.experience}</div>
            </div>
            <div className="text-center"><div className="text-2xl font-bold text-accent">{c.matchScore}%</div><div className="text-[8px] text-muted-foreground">Match</div></div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {c.openToWork && <StatusBadge status="healthy" label="Open to Work" />}
            {c.verified && <StatusBadge status="premium" label="Verified" />}
            <Badge variant="secondary" className="text-[8px]">{c.availability}</Badge>
            <Badge variant="secondary" className="text-[8px]">Active {c.lastActive}</Badge>
          </div>

          {c.signalTags && c.signalTags.length > 0 && (
            <div className="rounded-2xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-2.5">
              <div className="text-[9px] font-semibold mb-1 flex items-center gap-1"><Zap className="h-3 w-3 text-[hsl(var(--state-caution))]" />Intent Signals</div>
              <div className="flex flex-wrap gap-1">{c.signalTags.map(s => <Badge key={s} variant="secondary" className="text-[7px]">{s}</Badge>)}</div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between text-[10px] mb-1"><span className="text-muted-foreground">Profile Strength</span><span className="font-semibold">{c.profileStrength}%</span></div>
            <Progress value={c.profileStrength} className="h-1.5" />
          </div>

          <div>
            <h4 className="text-[10px] font-semibold mb-1.5">Skills & Endorsements</h4>
            <div className="flex flex-wrap gap-1">{c.skills.map(s => <span key={s} className="text-[9px] bg-accent/10 text-accent rounded-full px-2 py-0.5">{s}</span>)}</div>
            <div className="text-[9px] text-muted-foreground mt-1">{c.endorsements} endorsements</div>
          </div>

          <SectionCard title="AI Assessment" icon={<Sparkles className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl" action={
            <Button variant="outline" size="sm" className="h-5 text-[8px] rounded-lg" disabled={aiLoading} onClick={() => aiInvoke({ text: `Candidate: ${c.name}, ${c.headline}, Skills: ${c.skills.join(', ')}. ${c.experience} experience. Match: ${c.matchScore}%`, action: 'Write a concise recruiter assessment.' })}>
              {aiLoading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : 'Generate'}
            </Button>
          }>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{aiResult || 'Click Generate for an AI-powered candidate assessment.'}</p>
          </SectionCard>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border p-2.5"><div className="text-[8px] text-muted-foreground mb-0.5">Expected Salary</div><div className="text-[11px] font-semibold">{c.salary}</div></div>
            <div className="rounded-2xl border p-2.5"><div className="text-[8px] text-muted-foreground mb-0.5">Availability</div><div className="text-[11px] font-semibold">{c.availability}</div></div>
          </div>

          {c.savedListIds.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold mb-1">Saved In</h4>
              <div className="flex flex-wrap gap-1">{c.savedListIds.map(id => { const list = MOCK_SAVED_LISTS.find(l => l.id === id); return list ? <Badge key={id} variant="secondary" className="text-[8px]"><span className={cn('h-1.5 w-1.5 rounded-full mr-1', list.color)} />{list.name}</Badge> : null; })}</div>
            </div>
          )}

          <div className="flex flex-col gap-1.5 pt-2 border-t">
            <div className="flex gap-1.5">
              <Button size="sm" className="flex-1 h-7 text-[10px] rounded-xl gap-1"><Mail className="h-3 w-3" />InMail</Button>
              <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] rounded-xl gap-1"><BookmarkPlus className="h-3 w-3" />Add to List</Button>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] rounded-xl gap-1"><Send className="h-3 w-3" />Outreach</Button>
              <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] rounded-xl gap-1"><Calendar className="h-3 w-3" />Schedule</Button>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-[10px] w-full rounded-xl gap-1" asChild><Link to="/profile"><ExternalLink className="h-3 w-3" />Full Profile</Link></Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const RecruiterTalentSearchPage: React.FC = () => {
  const { activeRole } = useRole();
  const [activeTab, setActiveTab] = useState<NavTab>('search');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState('all');
  const [expFilter, setExpFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('all');
  const [openFilter, setOpenFilter] = useState(false);
  const [signalFilter, setSignalFilter] = useState('all');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const filteredCandidates = useMemo(() => {
    let results = [...MOCK_TALENT];
    if (openFilter) results = results.filter(c => c.openToWork);
    if (activeListId) results = results.filter(c => c.savedListIds.includes(activeListId));
    if (locationFilter !== 'all') results = results.filter(c => c.location.toLowerCase().includes(locationFilter.toLowerCase()));
    if (expFilter !== 'all') { const min = parseInt(expFilter); results = results.filter(c => parseInt(c.experience) >= min); }
    if (skillFilter !== 'all') results = results.filter(c => c.skills.some(s => s.toLowerCase().includes(skillFilter.toLowerCase())));
    if (signalFilter !== 'all') results = results.filter(c => c.signalTags?.some(s => s.toLowerCase().includes(signalFilter.toLowerCase())));
    if (searchQuery) { const q = searchQuery.toLowerCase(); results = results.filter(c => c.name.toLowerCase().includes(q) || c.headline.toLowerCase().includes(q) || c.skills.some(s => s.toLowerCase().includes(q))); }
    return results;
  }, [openFilter, activeListId, locationFilter, expFilter, skillFilter, signalFilter, searchQuery]);

  const selectedCandidate = MOCK_TALENT.find(c => c.id === selectedCandidateId) || null;
  const openToWorkCount = MOCK_TALENT.filter(c => c.openToWork).length;
  const savedCount = MOCK_TALENT.filter(c => c.savedListIds.length > 0).length;
  const signalCount = MOCK_TALENT.filter(c => c.signalTags && c.signalTags.length > 0).length;

  const handleSave = (id: string) => toast.success('Added to shortlist');
  const toggleCompare = (id: string) => setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  const clearFilters = () => { setLocationFilter('all'); setExpFilter('all'); setSkillFilter('all'); setSignalFilter('all'); setOpenFilter(false); setSearchQuery(''); setActiveListId(null); };

  const TABS: { id: NavTab; label: string; icon: LucideIcon; count?: number }[] = [
    { id: 'search', label: 'Search', icon: Search, count: MOCK_TALENT.length },
    { id: 'saved-lists', label: 'Saved Lists', icon: Bookmark, count: MOCK_SAVED_LISTS.length },
    { id: 'outreach', label: 'Outreach', icon: Send, count: MOCK_CAMPAIGNS.filter(c => c.status === 'active').length },
    { id: 'signals', label: 'Signals', icon: Zap, count: signalCount },
    { id: 'map', label: 'Regions', icon: Map },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Target className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Talent Navigator</span>
        <StatusBadge status="premium" label="Pro" />
        <StatusBadge status="live" label={`${MOCK_TALENT.length} in Pool`} />
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        {activeTab === 'search' && (
          <div className="flex items-center border rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('card')} className={cn('px-2 py-1 transition-all', viewMode === 'card' ? 'bg-accent text-accent-foreground' : 'bg-background text-muted-foreground hover:bg-muted')}><Grid3X3 className="h-3 w-3" /></button>
            <button onClick={() => setViewMode('table')} className={cn('px-2 py-1 transition-all', viewMode === 'table' ? 'bg-accent text-accent-foreground' : 'bg-background text-muted-foreground hover:bg-muted')}><List className="h-3 w-3" /></button>
          </div>
        )}
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button>
        <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => toast.success('Search saved')}><Bookmark className="h-3 w-3" />Save Search</Button>
      </div>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <KPIBand className="!grid-cols-2">
        <KPICard label="Pool Size" value={MOCK_TALENT.length} change="total" trend="neutral" />
        <KPICard label="Open to Work" value={openToWorkCount} change={`${Math.round((openToWorkCount / MOCK_TALENT.length) * 100)}%`} trend="up" />
      </KPIBand>
      <KPICard label="With Signals" value={signalCount} change="intent detected" trend="up" />

      {/* Filters Panel */}
      <SectionCard title="Filters" icon={<Filter className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl" action={<Button variant="ghost" size="sm" className="h-5 text-[7px]" onClick={clearFilters}><X className="h-2.5 w-2.5 mr-0.5" />Clear</Button>}>
        <div className="space-y-2">
          <div>
            <label className="text-[8px] text-muted-foreground mb-0.5 block">Location</label>
            <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]">
              <option value="all">All Locations</option>
              <option value="san francisco">San Francisco</option>
              <option value="new york">New York</option>
              <option value="london">London</option>
              <option value="berlin">Berlin</option>
              <option value="remote">Remote</option>
              <option value="tokyo">Tokyo</option>
            </select>
          </div>
          <div>
            <label className="text-[8px] text-muted-foreground mb-0.5 block">Experience</label>
            <select value={expFilter} onChange={e => setExpFilter(e.target.value)} className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]">
              <option value="all">Any</option><option value="3">3+ yrs</option><option value="5">5+ yrs</option><option value="8">8+ yrs</option><option value="10">10+ yrs</option>
            </select>
          </div>
          <div>
            <label className="text-[8px] text-muted-foreground mb-0.5 block">Skill</label>
            <select value={skillFilter} onChange={e => setSkillFilter(e.target.value)} className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]">
              <option value="all">All Skills</option><option value="react">React</option><option value="python">Python</option><option value="typescript">TypeScript</option><option value="aws">AWS</option><option value="figma">Figma</option><option value="leadership">Leadership</option><option value="rust">Rust</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={openFilter} onChange={e => setOpenFilter(e.target.checked)} className="rounded" id="open-filter" />
            <label htmlFor="open-filter" className="text-[9px]">Open to Work only</label>
          </div>
        </div>
      </SectionCard>

      {/* Saved Lists shortcut */}
      <SectionCard title="Saved Lists" className="!rounded-2xl" action={<Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setActiveTab('saved-lists')}><Plus className="h-3 w-3" /></Button>}>
        <div className="space-y-1">
          {MOCK_SAVED_LISTS.slice(0, 3).map(l => (
            <button key={l.id} onClick={() => { setActiveListId(activeListId === l.id ? null : l.id); setActiveTab('search'); }} className={cn('flex items-center gap-2 w-full px-2 py-1.5 rounded-xl text-[9px] transition-all', activeListId === l.id ? 'bg-accent/10 text-accent' : 'hover:bg-muted/30')}>
              <span className={cn('h-2 w-2 rounded-full', l.color)} />
              <span className="flex-1 text-left truncate font-medium">{l.name}</span>
              <span className="text-[8px] text-muted-foreground">{l.count}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Quick Actions */}
      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { label: 'New outreach campaign', icon: Send, action: () => setActiveTab('outreach') },
            { label: 'View signal alerts', icon: Zap, action: () => setActiveTab('signals') },
            { label: 'Bulk message', icon: Mail, action: () => toast.info('Bulk message') },
            { label: 'Import candidates', icon: UserPlus, action: () => toast.info('Import') },
          ].map(a => (
            <button key={a.label} onClick={a.action} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl text-[9px] hover:bg-muted/30 transition-all font-medium group">
              <a.icon className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" /><span className="group-hover:text-accent transition-colors">{a.label}</span>
              <ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom Section ── */
  const bottomSection = (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5 text-accent" />Talent Pool Insights</span>
        <span className="text-[8px] text-muted-foreground">Updated 5 min ago</span>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Avg Match', value: `${Math.round(MOCK_TALENT.reduce((s, c) => s + c.matchScore, 0) / MOCK_TALENT.length)}%` },
          { label: 'Open Rate', value: `${Math.round((openToWorkCount / MOCK_TALENT.length) * 100)}%` },
          { label: 'Verified', value: `${MOCK_TALENT.filter(c => c.verified).length}` },
          { label: 'Avg Exp', value: `${Math.round(MOCK_TALENT.reduce((s, c) => s + parseInt(c.experience), 0) / MOCK_TALENT.length)}y` },
          { label: 'Saved', value: `${savedCount}` },
          { label: 'Signals', value: `${signalCount}` },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className="text-sm font-bold">{s.value}</div>
            <div className="text-[8px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      <SectionBackNav homeRoute="/recruiter-pro" homeLabel="Recruiter Pro" currentLabel="Talent Search" icon={<Search className="h-3 w-3" />} />
      {/* Compare Bar */}
      {compareIds.length > 0 && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-2.5 flex items-center gap-3 mb-3">
          <Copy className="h-4 w-4 text-accent shrink-0" />
          <div className="flex-1 flex items-center gap-1.5">
            {compareIds.map(id => { const c = MOCK_TALENT.find(t => t.id === id); return c ? <Badge key={id} variant="secondary" className="text-[8px] gap-1">{c.name}<button onClick={() => toggleCompare(id)}><X className="h-2 w-2" /></button></Badge> : null; })}
          </div>
          <Button size="sm" className="h-6 text-[8px] rounded-xl" onClick={() => toast.info('Compare view opened')}>Compare ({compareIds.length})</Button>
          <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-xl" onClick={() => setCompareIds([])}>Clear</Button>
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

      {/* ═══ SEARCH TAB ═══ */}
      {activeTab === 'search' && (
        <>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name, skills, title, location..." className="w-full h-9 pl-10 pr-3 rounded-xl border bg-background text-[11px] focus:ring-2 focus:ring-accent/30 focus:outline-none" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
          </div>

          {/* Active filter chips */}
          {(locationFilter !== 'all' || expFilter !== 'all' || skillFilter !== 'all' || openFilter || activeListId) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <span className="text-[8px] text-muted-foreground">Active:</span>
              {locationFilter !== 'all' && <Badge variant="secondary" className="text-[7px] gap-1">{locationFilter}<button onClick={() => setLocationFilter('all')}><X className="h-2 w-2" /></button></Badge>}
              {expFilter !== 'all' && <Badge variant="secondary" className="text-[7px] gap-1">{expFilter}+ yrs<button onClick={() => setExpFilter('all')}><X className="h-2 w-2" /></button></Badge>}
              {skillFilter !== 'all' && <Badge variant="secondary" className="text-[7px] gap-1">{skillFilter}<button onClick={() => setSkillFilter('all')}><X className="h-2 w-2" /></button></Badge>}
              {openFilter && <Badge variant="secondary" className="text-[7px] gap-1">Open to Work<button onClick={() => setOpenFilter(false)}><X className="h-2 w-2" /></button></Badge>}
              {activeListId && <Badge variant="secondary" className="text-[7px] gap-1">List: {MOCK_SAVED_LISTS.find(l => l.id === activeListId)?.name}<button onClick={() => setActiveListId(null)}><X className="h-2 w-2" /></button></Badge>}
              <button onClick={clearFilters} className="text-[8px] text-accent font-medium">Clear all</button>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground">{filteredCandidates.length} result{filteredCandidates.length !== 1 ? 's' : ''}</span>
          </div>

          {filteredCandidates.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed p-10 text-center">
              <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-[11px] font-bold mb-1">No candidates found</div>
              <div className="text-[9px] text-muted-foreground mb-3">Try adjusting your filters or broadening your criteria.</div>
              <Button size="sm" className="h-7 text-[10px] rounded-xl" onClick={clearFilters}>Clear Filters</Button>
            </div>
          ) : viewMode === 'card' ? (
            <div className="grid md:grid-cols-2 gap-2">
              {filteredCandidates.map(c => (
                <TalentCard key={c.id} c={c} onClick={() => setSelectedCandidateId(c.id)} onSave={() => handleSave(c.id)} compare={compareIds.includes(c.id)} onCompare={() => toggleCompare(c.id)} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border overflow-hidden">
              <div className="grid grid-cols-[1fr_100px_80px_60px_90px_80px] gap-2 px-3 py-2 bg-muted/50 border-b text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Candidate</span><span>Location</span><span>Experience</span><span className="text-center">Match</span><span>Skills</span><span className="text-right">Actions</span>
              </div>
              {filteredCandidates.map(c => (
                <TalentRow key={c.id} c={c} onClick={() => setSelectedCandidateId(c.id)} onSave={() => handleSave(c.id)} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ SAVED LISTS TAB ═══ */}
      {activeTab === 'saved-lists' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold">Your Saved Lists</span>
            <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => toast.success('List created')}><Plus className="h-3 w-3" />New List</Button>
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {MOCK_SAVED_LISTS.map(l => (
              <div key={l.id} className="rounded-2xl border p-4 hover:shadow-md transition-all cursor-pointer group" onClick={() => { setActiveListId(l.id); setActiveTab('search'); }}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center', l.color, 'bg-opacity-20')}><Bookmark className="h-4 w-4 text-current" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold group-hover:text-accent transition-colors">{l.name}</div>
                    <div className="text-[9px] text-muted-foreground">Created {l.createdAt}</div>
                  </div>
                  {l.shared && <Badge variant="secondary" className="text-[7px]"><Users className="h-2 w-2 mr-0.5" />Shared</Badge>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold">{l.count} candidates</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e => { e.stopPropagation(); toast.info('Exported'); }}><Download className="h-2 w-2 mr-0.5" />Export</Button>
                    <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e => { e.stopPropagation(); toast.info('Shared'); }}><Send className="h-2 w-2 mr-0.5" />Share</Button>
                  </div>
                </div>
                {/* Mini avatar stack */}
                <div className="flex -space-x-1.5 mt-2">
                  {MOCK_TALENT.filter(t => t.savedListIds.includes(l.id)).slice(0, 4).map(t => (
                    <Avatar key={t.id} className="h-5 w-5 ring-1 ring-card"><AvatarFallback className="text-[5px] bg-accent/10 text-accent font-bold">{t.avatar}</AvatarFallback></Avatar>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ OUTREACH TAB ═══ */}
      {activeTab === 'outreach' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold">Outreach Campaigns</span>
            <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => toast.success('Campaign created')}><Plus className="h-3 w-3" />New Campaign</Button>
          </div>

          <KPIBand>
            <KPICard label="Active Campaigns" value={MOCK_CAMPAIGNS.filter(c => c.status === 'active').length} change="running now" trend="neutral" />
            <KPICard label="Total Sent" value={MOCK_CAMPAIGNS.reduce((s, c) => s + c.sent, 0)} change="all time" trend="up" />
            <KPICard label="Reply Rate" value={`${Math.round((MOCK_CAMPAIGNS.reduce((s, c) => s + c.replied, 0) / Math.max(MOCK_CAMPAIGNS.reduce((s, c) => s + c.sent, 0), 1)) * 100)}%`} change="+3% vs last month" trend="up" />
            <KPICard label="Scheduled" value={MOCK_CAMPAIGNS.reduce((s, c) => s + c.scheduled, 0)} change="pending send" trend="neutral" />
          </KPIBand>

          <div className="space-y-2">
            {MOCK_CAMPAIGNS.map(camp => {
              const cfg = OUTREACH_STATUS_MAP[camp.status];
              const openRate = camp.sent > 0 ? Math.round((camp.opened / camp.sent) * 100) : 0;
              const replyRate = camp.sent > 0 ? Math.round((camp.replied / camp.sent) * 100) : 0;
              return (
                <div key={camp.id} className={cn('rounded-2xl border p-4 hover:shadow-md transition-all', camp.status === 'draft' && 'border-dashed')}>
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0"><Send className="h-4 w-4 text-muted-foreground/40" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[11px] font-bold">{camp.name}</span>
                        <StatusBadge status={cfg.badge} label={cfg.label} />
                      </div>
                      <div className="text-[9px] text-muted-foreground">Created {camp.createdAt}</div>
                      {camp.status !== 'draft' && (
                        <div className="grid grid-cols-4 gap-3 mt-2">
                          <div><div className="text-[9px] text-muted-foreground">Sent</div><div className="text-[11px] font-bold">{camp.sent}</div></div>
                          <div><div className="text-[9px] text-muted-foreground">Opened</div><div className="text-[11px] font-bold">{camp.opened} <span className="text-[8px] text-muted-foreground">({openRate}%)</span></div></div>
                          <div><div className="text-[9px] text-muted-foreground">Replied</div><div className="text-[11px] font-bold">{camp.replied} <span className="text-[8px] text-muted-foreground">({replyRate}%)</span></div></div>
                          <div><div className="text-[9px] text-muted-foreground">Scheduled</div><div className="text-[11px] font-bold">{camp.scheduled}</div></div>
                        </div>
                      )}
                      {camp.status !== 'draft' && (
                        <div className="mt-2">
                          <Progress value={openRate} className="h-1" />
                          <div className="text-[7px] text-muted-foreground mt-0.5">{openRate}% open rate</div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {camp.status === 'active' && <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg" onClick={() => toast.info('Paused')}>Pause</Button>}
                      {camp.status === 'paused' && <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg" onClick={() => toast.info('Resumed')}>Resume</Button>}
                      {camp.status === 'draft' && <Button size="sm" className="h-6 text-[8px] rounded-lg" onClick={() => toast.info('Launched')}>Launch</Button>}
                      <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg"><Eye className="h-2.5 w-2.5" /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ SIGNALS TAB ═══ */}
      {activeTab === 'signals' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold">Intent Signals</span>
            <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Settings className="h-3 w-3" />Configure Alerts</Button>
          </div>

          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-3.5 flex items-center gap-3">
            <Zap className="h-5 w-5 text-accent shrink-0" />
            <div className="flex-1">
              <div className="text-[11px] font-semibold">{signalCount} candidates with active signals</div>
              <div className="text-[9px] text-muted-foreground">Signals indicate hiring intent, career changes, or engagement patterns</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-2 mb-3">
            {SIGNAL_TYPES.map(s => (
              <button key={s.label} onClick={() => { setSignalFilter(s.label.toLowerCase().includes(signalFilter) && signalFilter !== 'all' ? 'all' : s.label.toLowerCase().split(' ')[0]); setActiveTab('search'); }} className="rounded-2xl border p-3 hover:shadow-sm transition-all text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('h-2.5 w-2.5 rounded-full', s.color)} />
                  <span className="text-[10px] font-semibold">{s.label}</span>
                </div>
                <div className="text-lg font-bold">{s.count}</div>
                <div className="text-[8px] text-muted-foreground">candidates</div>
              </button>
            ))}
          </div>

          <SectionCard title="Recent Signal Activity" icon={<Clock className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {MOCK_TALENT.filter(c => c.signalTags && c.signalTags.length > 0).slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-muted/30 transition-all cursor-pointer" onClick={() => { setSelectedCandidateId(c.id); setActiveTab('search'); }}>
                  <Avatar className="h-6 w-6 ring-1 ring-muted/30"><AvatarFallback className="text-[7px] bg-accent/10 text-accent font-bold">{c.avatar}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-medium truncate">{c.name}</div>
                    <div className="flex gap-1">{c.signalTags?.slice(0, 2).map(s => <span key={s} className="text-[7px] text-[hsl(var(--state-caution))]">{s}</span>)}</div>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ MAP / REGIONS TAB ═══ */}
      {activeTab === 'map' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold">Regional Distribution</span>
            <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Globe className="h-3 w-3" />Full Map View</Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {REGIONS.map(r => {
              const regionCandidates = MOCK_TALENT.filter(c => c.region === r.id);
              return (
                <div key={r.id} className="rounded-2xl border p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => { setLocationFilter(r.cities.split(',')[0].trim().toLowerCase()); setActiveTab('search'); }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center"><Map className="h-4 w-4 text-accent" /></div>
                    <div>
                      <div className="text-[11px] font-bold">{r.label}</div>
                      <div className="text-[8px] text-muted-foreground">{r.cities}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold mb-1">{r.candidates}</div>
                  <div className="text-[9px] text-muted-foreground mb-2">candidates</div>
                  <div className="flex -space-x-1.5">
                    {regionCandidates.slice(0, 3).map(c => (
                      <Avatar key={c.id} className="h-5 w-5 ring-1 ring-card"><AvatarFallback className="text-[5px] bg-accent/10 text-accent font-bold">{c.avatar}</AvatarFallback></Avatar>
                    ))}
                    {regionCandidates.length > 3 && <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[6px] font-bold ring-1 ring-card">+{regionCandidates.length - 3}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Region breakdown bar */}
          <SectionCard title="Region Breakdown" className="!rounded-2xl">
            <div className="space-y-2">
              {REGIONS.map(r => (
                <div key={r.id} className="flex items-center gap-2.5">
                  <span className="text-[9px] font-medium w-20 shrink-0">{r.label}</span>
                  <div className="flex-1"><Progress value={(r.candidates / MOCK_TALENT.length) * 100} className="h-2" /></div>
                  <span className="text-[9px] font-bold w-6 text-right">{r.candidates}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ ANALYTICS TAB ═══ */}
      {activeTab === 'analytics' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold">Navigator Analytics</span>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3" />Export Report</Button>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Settings className="h-3 w-3" />Seat Settings</Button>
            </div>
          </div>

          <KPIBand>
            <KPICard label="Searches This Month" value="142" change="+18% vs last month" trend="up" />
            <KPICard label="Profiles Viewed" value="89" change="+12% vs last month" trend="up" />
            <KPICard label="InMails Sent" value="34" change="26% response rate" trend="up" />
            <KPICard label="Candidates Saved" value="22" change="across 4 lists" trend="neutral" />
          </KPIBand>

          <div className="grid md:grid-cols-2 gap-3">
            <SectionCard title="Search Activity" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-2">
                {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((w, i) => {
                  const val = [28, 35, 42, 37][i];
                  return (
                    <div key={w} className="flex items-center gap-2">
                      <span className="text-[9px] text-muted-foreground w-14">{w}</span>
                      <div className="flex-1"><Progress value={(val / 50) * 100} className="h-2" /></div>
                      <span className="text-[9px] font-bold w-6 text-right">{val}</span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Top Skills Searched" icon={<Award className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-1.5">
                {[
                  { skill: 'React', searches: 38, pct: 95 },
                  { skill: 'TypeScript', searches: 32, pct: 80 },
                  { skill: 'Python', searches: 28, pct: 70 },
                  { skill: 'AWS', searches: 22, pct: 55 },
                  { skill: 'Leadership', searches: 18, pct: 45 },
                ].map(s => (
                  <div key={s.skill} className="flex items-center gap-2">
                    <span className="text-[9px] font-medium w-20">{s.skill}</span>
                    <div className="flex-1"><Progress value={s.pct} className="h-1.5" /></div>
                    <span className="text-[8px] text-muted-foreground w-6 text-right">{s.searches}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Outreach Performance" icon={<Send className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div><div className="text-xl font-bold">145</div><div className="text-[9px] text-muted-foreground">Total Sent</div></div>
              <div><div className="text-xl font-bold text-accent">65%</div><div className="text-[9px] text-muted-foreground">Open Rate</div></div>
              <div><div className="text-xl font-bold text-[hsl(var(--state-healthy))]">27%</div><div className="text-[9px] text-muted-foreground">Reply Rate</div></div>
              <div><div className="text-xl font-bold">8</div><div className="text-[9px] text-muted-foreground">Interviews</div></div>
            </div>
          </SectionCard>

          {/* Seat usage */}
          <SectionCard title="Seat Usage" icon={<Users className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between text-[10px] mb-1"><span>2 of 5 seats used</span><span className="font-semibold">40%</span></div>
                <Progress value={40} className="h-2" />
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl">Manage Seats</Button>
            </div>
          </SectionCard>
        </div>
      )}

      <CandidateDrawer c={selectedCandidate} onClose={() => setSelectedCandidateId(null)} />
    </DashboardLayout>
  );
};

export default RecruiterTalentSearchPage;
