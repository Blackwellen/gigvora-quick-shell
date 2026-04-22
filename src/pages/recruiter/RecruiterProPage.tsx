import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Zap, Crown, Search, BarChart3, Users, TrendingUp, Eye,
  AlertTriangle, Activity, Plus, Clock, Mail, Shield,
  ChevronRight, Sparkles, Target, Layers, Bell, FileText,
  ExternalLink, BookmarkPlus, UserCheck, Briefcase,
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Mock Data
   ═══════════════════════════════════════════════════════════ */
type ProTab = 'command-centre' | 'saved-lists' | 'signals' | 'analytics';

interface SavedList {
  id: string; name: string; count: number; newSignals: number; lastUpdated: string; status: 'active' | 'paused';
}

interface Signal {
  id: string; type: 'job-change' | 'open-to-work' | 'profile-view' | 'skill-add' | 'promotion';
  candidateName: string; candidateAvatar: string; candidateHeadline: string;
  detail: string; timestamp: string; strength: 'high' | 'medium' | 'low'; list?: string;
}

interface TalentResult {
  id: string; name: string; avatar: string; headline: string; matchScore: number;
  openToWork: boolean; premium: boolean;
}

const MOCK_SAVED_LISTS: SavedList[] = [
  { id: 'sl1', name: 'Senior Frontend — Bay Area', count: 142, newSignals: 8, lastUpdated: '2h ago', status: 'active' },
  { id: 'sl2', name: 'Engineering Managers', count: 87, newSignals: 3, lastUpdated: '5h ago', status: 'active' },
  { id: 'sl3', name: 'ML/AI Specialists', count: 234, newSignals: 12, lastUpdated: '1h ago', status: 'active' },
  { id: 'sl4', name: 'DevOps — Remote', count: 56, newSignals: 0, lastUpdated: '2d ago', status: 'paused' },
  { id: 'sl5', name: 'Product Designers', count: 98, newSignals: 5, lastUpdated: '4h ago', status: 'active' },
];

const MOCK_SIGNALS: Signal[] = [
  { id: 's1', type: 'open-to-work', candidateName: 'Ana Torres', candidateAvatar: 'AT', candidateHeadline: 'Staff Engineer @ Stripe', detail: 'Marked as Open to Work', timestamp: '12 min ago', strength: 'high', list: 'Senior Frontend — Bay Area' },
  { id: 's2', type: 'job-change', candidateName: 'David Kim', candidateAvatar: 'DK', candidateHeadline: 'Engineering Manager', detail: 'Left position at Meta', timestamp: '45 min ago', strength: 'high', list: 'Engineering Managers' },
  { id: 's3', type: 'skill-add', candidateName: 'Priya Patel', candidateAvatar: 'PP', candidateHeadline: 'ML Engineer @ DeepMind', detail: 'Added: LLM Fine-Tuning, RAG', timestamp: '2h ago', strength: 'medium', list: 'ML/AI Specialists' },
  { id: 's4', type: 'promotion', candidateName: 'Marcus Lee', candidateAvatar: 'ML', candidateHeadline: 'Senior SRE → Staff SRE', detail: 'Promoted to Staff SRE at Datadog', timestamp: '3h ago', strength: 'low' },
  { id: 's5', type: 'profile-view', candidateName: 'Elena Volkov', candidateAvatar: 'EV', candidateHeadline: 'Frontend Lead @ Vercel', detail: 'Viewed your job posting: Senior FE', timestamp: '4h ago', strength: 'high', list: 'Senior Frontend — Bay Area' },
  { id: 's6', type: 'open-to-work', candidateName: 'James Chen', candidateAvatar: 'JC', candidateHeadline: 'Product Designer @ Figma', detail: 'Marked as Open to Work', timestamp: '6h ago', strength: 'high', list: 'Product Designers' },
];

const MOCK_TALENT: TalentResult[] = [
  { id: 't1', name: 'Ana Torres', avatar: 'AT', headline: 'Staff Engineer @ Stripe', matchScore: 97, openToWork: true, premium: true },
  { id: 't2', name: 'David Kim', avatar: 'DK', headline: 'Ex-Meta Engineering Manager', matchScore: 94, openToWork: false, premium: true },
  { id: 't3', name: 'Elena Volkov', avatar: 'EV', headline: 'Frontend Lead @ Vercel', matchScore: 91, openToWork: false, premium: false },
  { id: 't4', name: 'Priya Patel', avatar: 'PP', headline: 'ML Engineer @ DeepMind', matchScore: 88, openToWork: false, premium: true },
  { id: 't5', name: 'James Chen', avatar: 'JC', headline: 'Product Designer @ Figma', matchScore: 85, openToWork: true, premium: false },
];

const SIGNAL_ICONS: Record<Signal['type'], React.ElementType> = {
  'job-change': Briefcase, 'open-to-work': UserCheck, 'profile-view': Eye, 'skill-add': Sparkles, 'promotion': TrendingUp,
};

const SIGNAL_COLORS: Record<Signal['strength'], string> = {
  high: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  medium: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  low: 'bg-muted text-muted-foreground',
};

/* ═══════════════════════════════════════════════════════════ */
const QuotaBanner: React.FC = () => (
  <div className="rounded-lg border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3 flex items-center gap-3 mb-3">
    <AlertTriangle className="h-4 w-4 text-[hsl(var(--state-caution))] shrink-0" />
    <div className="flex-1">
      <div className="text-[11px] font-medium">Search Quota: 42 / 50 this month</div>
      <div className="text-[10px] text-muted-foreground">You've used 84% of your monthly InMail and search credits.</div>
    </div>
    <Progress value={84} className="w-20 h-1.5" />
    <Button variant="outline" size="sm" className="h-6 text-[10px]">Manage</Button>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Command Centre
   ═══════════════════════════════════════════════════════════ */
const CommandCentre: React.FC<{ onViewSignals: () => void; onOpenList: (id: string) => void }> = ({ onViewSignals, onOpenList }) => (
  <div className="space-y-3">
    <QuotaBanner />
    <SectionCard title="Live Signals" action={<Button variant="ghost" size="sm" className="h-5 text-[8px]" onClick={onViewSignals}>View All<ChevronRight className="h-2.5 w-2.5 ml-0.5" /></Button>}>
      <div className="space-y-1.5">
        {MOCK_SIGNALS.slice(0, 4).map(s => {
          const Icon = SIGNAL_ICONS[s.type];
          return (
            <div key={s.id} className="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-muted/30 transition-colors cursor-pointer">
              <div className={cn('h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5', SIGNAL_COLORS[s.strength])}><Icon className="h-3 w-3" /></div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px]"><span className="font-medium">{s.candidateName}</span> · {s.detail}</div>
                <div className="text-[8px] text-muted-foreground flex items-center gap-1">{s.timestamp}{s.list && <><span>·</span><Layers className="h-2 w-2" />{s.list}</>}</div>
              </div>
              <Badge className={cn('text-[6px] shrink-0', SIGNAL_COLORS[s.strength])}>{s.strength}</Badge>
            </div>
          );
        })}
      </div>
    </SectionCard>
    <SectionCard title="Saved Lists" action={<Button variant="ghost" size="sm" className="h-5 text-[8px]"><Plus className="h-2.5 w-2.5 mr-0.5" />New List</Button>}>
      <div className="space-y-1">
        {MOCK_SAVED_LISTS.slice(0, 4).map(l => (
          <button key={l.id} onClick={() => onOpenList(l.id)} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-left hover:bg-muted/30 transition-colors">
            <Layers className="h-3 w-3 text-accent shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-medium truncate">{l.name}</div>
              <div className="text-[8px] text-muted-foreground">{l.count} candidates · {l.lastUpdated}</div>
            </div>
            {l.newSignals > 0 && <Badge className="text-[6px] bg-accent/10 text-accent">{l.newSignals} new</Badge>}
            {l.status === 'paused' && <StatusBadge status="degraded" label="Paused" />}
          </button>
        ))}
      </div>
    </SectionCard>
    <SectionCard title="Top Intent Matches">
      <div className="space-y-1.5">
        {MOCK_TALENT.slice(0, 3).map(t => (
          <div key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/30 transition-colors cursor-pointer">
            <Avatar className="h-7 w-7"><AvatarFallback className="text-[9px] bg-accent/10 text-accent">{t.avatar}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-medium truncate">{t.name}</div>
              <div className="text-[8px] text-muted-foreground truncate">{t.headline}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] font-bold text-accent">{t.matchScore}%</div>
              <div className="text-[7px] text-muted-foreground">match</div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Saved Lists Tab
   ═══════════════════════════════════════════════════════════ */
const SavedListsTab: React.FC<{ selectedListId: string | null; onSelect: (id: string) => void }> = ({ selectedListId, onSelect }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 mb-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input placeholder="Search lists..." className="w-full h-8 pl-8 pr-3 rounded-lg border bg-background text-xs focus:ring-2 focus:ring-ring focus:outline-none" />
      </div>
      <Button size="sm" className="h-8 text-[10px] gap-1"><Plus className="h-3 w-3" />New List</Button>
    </div>
    <div className="rounded-lg border overflow-hidden">
      <div className="grid grid-cols-[1fr_60px_70px_80px_70px] gap-2 px-3 py-2 bg-muted/50 border-b text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">
        <span>List</span><span>Size</span><span>Signals</span><span>Updated</span><span className="text-right">Status</span>
      </div>
      {MOCK_SAVED_LISTS.map(l => (
        <button key={l.id} onClick={() => onSelect(l.id)} className={cn(
          'grid grid-cols-[1fr_60px_70px_80px_70px] gap-2 px-3 py-2.5 border-b last:border-0 hover:bg-muted/30 transition-colors w-full text-left items-center',
          selectedListId === l.id && 'bg-accent/5'
        )}>
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="h-3.5 w-3.5 text-accent shrink-0" />
            <span className="text-[10px] font-medium truncate">{l.name}</span>
          </div>
          <span className="text-[10px]">{l.count}</span>
          <span>{l.newSignals > 0 ? <Badge className="text-[7px] bg-accent/10 text-accent">{l.newSignals} new</Badge> : <span className="text-[9px] text-muted-foreground">—</span>}</span>
          <span className="text-[9px] text-muted-foreground">{l.lastUpdated}</span>
          <span className="text-right"><StatusBadge status={l.status === 'active' ? 'healthy' : 'degraded'} label={l.status} /></span>
        </button>
      ))}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Signals Tab
   ═══════════════════════════════════════════════════════════ */
const SignalsTab: React.FC = () => {
  const [filter, setFilter] = useState<'all' | Signal['type']>('all');
  const filtered = filter === 'all' ? MOCK_SIGNALS : MOCK_SIGNALS.filter(s => s.type === filter);

  return (
    <div className="space-y-3">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All Signals' }, { key: 'open-to-work', label: 'Open to Work' },
          { key: 'job-change', label: 'Job Changes' }, { key: 'profile-view', label: 'Profile Views' },
          { key: 'skill-add', label: 'New Skills' }, { key: 'promotion', label: 'Promotions' },
        ].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key as typeof filter)} className={cn(
            'px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors shrink-0',
            filter === t.key ? 'bg-accent text-accent-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
          )}>{t.label}</button>
        ))}
      </div>
      <div className="space-y-1.5">
        {filtered.map(s => {
          const Icon = SIGNAL_ICONS[s.type];
          return (
            <div key={s.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg border hover:bg-muted/20 transition-colors cursor-pointer">
              <div className={cn('h-8 w-8 rounded-full flex items-center justify-center shrink-0', SIGNAL_COLORS[s.strength])}><Icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium">{s.candidateName}</div>
                <div className="text-[9px] text-muted-foreground">{s.candidateHeadline}</div>
                <div className="text-[10px] mt-0.5">{s.detail}</div>
                <div className="text-[8px] text-muted-foreground mt-0.5 flex items-center gap-1"><Clock className="h-2 w-2" />{s.timestamp}{s.list && <><span>·</span><Layers className="h-2 w-2" />{s.list}</>}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="outline" size="sm" className="h-5 text-[7px]"><Mail className="h-2 w-2 mr-0.5" />Message</Button>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0"><BookmarkPlus className="h-3 w-3" /></Button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-6 text-[10px] text-muted-foreground"><Bell className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />No signals matching this filter.</div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Analytics Tab
   ═══════════════════════════════════════════════════════════ */
const AnalyticsTab: React.FC = () => (
  <div className="space-y-3">
    <div className="grid grid-cols-4 gap-2">
      <KPICard label="Searches" value="42" change="this month" trend="up" />
      <KPICard label="InMails Sent" value="28" change="67% reply rate" trend="up" />
      <KPICard label="Profiles Viewed" value="312" change="+18% vs last month" trend="up" />
      <KPICard label="Pipeline Rate" value="23%" change="search → interview" trend="neutral" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <SectionCard title="Search Performance">
        <div className="space-y-2">
          {[
            { search: 'Senior Frontend — Bay Area', views: 87, responses: 12 },
            { search: 'Engineering Managers', views: 54, responses: 8 },
            { search: 'ML/AI Specialists', views: 120, responses: 15 },
            { search: 'DevOps — Remote', views: 32, responses: 3 },
          ].map(s => (
            <div key={s.search} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-medium truncate">{s.search}</div>
                <div className="text-[8px] text-muted-foreground">{s.views} views · {s.responses} responses</div>
              </div>
              <Progress value={(s.responses / s.views) * 100} className="w-16 h-1.5" />
              <span className="text-[8px] font-medium w-8 text-right">{Math.round((s.responses / s.views) * 100)}%</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Activity Stream">
        <div className="space-y-1.5">
          {[
            { action: 'Sent InMail to Ana Torres', time: '12 min ago', icon: Mail },
            { action: 'Added 3 candidates to ML/AI list', time: '1h ago', icon: BookmarkPlus },
            { action: 'Ran search: "Staff+ Frontend"', time: '2h ago', icon: Search },
            { action: 'Exported Engineering Managers list', time: '4h ago', icon: FileText },
            { action: 'Upgraded seat to Pro', time: '1d ago', icon: Crown },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-[9px]">
              <a.icon className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate">{a.action}</span>
              <span className="text-[8px] text-muted-foreground shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
    <SectionCard title="Seat & Entitlement Usage">
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: 'Search Credits', used: 42, total: 50 },
          { label: 'InMail Credits', used: 28, total: 40 },
          { label: 'Profile Unlocks', used: 15, total: 25 },
        ].map(e => (
          <div key={e.label}>
            <div className="text-sm font-bold">{e.used}<span className="text-muted-foreground font-normal text-[10px]">/{e.total}</span></div>
            <Progress value={(e.used / e.total) * 100} className="h-1.5 my-1" />
            <div className="text-[8px] text-muted-foreground">{e.label}</div>
          </div>
        ))}
      </div>
    </SectionCard>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const RecruiterProPage: React.FC = () => {
  const { isSubscribed } = useRole();
  const [activeTab, setActiveTab] = useState<ProTab>('command-centre');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCandidate, setDrawerCandidate] = useState<TalentResult | null>(null);

  const isPro = isSubscribed('recruiter-pro');

  const tabs: { key: ProTab; label: string; icon: React.ElementType }[] = [
    { key: 'command-centre', label: 'Command Centre', icon: Target },
    { key: 'saved-lists', label: 'Saved Lists', icon: Layers },
    { key: 'signals', label: 'Signals', icon: Activity },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const topStrip = (
    <>
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Recruiter Pro</span>
        {isPro ? <StatusBadge status="premium" label="Pro Active" /> : <StatusBadge status="blocked" label="Free Tier" />}
      </div>
      <div className="flex-1" />
      <div className="flex gap-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors',
            activeTab === t.key ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/50'
          )}><t.icon className="h-3 w-3" />{t.label}</button>
        ))}
      </div>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Your Seat">
        <div className="space-y-2">
          {[
            { l: 'Plan', v: isPro ? 'Pro — Team' : 'Free' },
            { l: 'Team Seats', v: '3 / 5' },
            { l: 'Renewal', v: 'May 12, 2025' },
          ].map(r => (
            <div key={r.l} className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">{r.l}</span><span className="font-medium">{r.v}</span>
            </div>
          ))}
          {!isPro && <Button size="sm" className="w-full h-6 text-[9px] gap-1 mt-1"><Zap className="h-3 w-3" />Upgrade</Button>}
        </div>
      </SectionCard>
      <SectionCard title="Quick Search">
        <div className="space-y-1.5">
          <input placeholder="Role or skill..." className="w-full h-7 rounded-md border bg-background px-2 text-[10px] focus:ring-2 focus:ring-ring focus:outline-none" />
          <input placeholder="Location..." className="w-full h-7 rounded-md border bg-background px-2 text-[10px] focus:ring-2 focus:ring-ring focus:outline-none" />
          <Button size="sm" className="w-full h-6 text-[9px] gap-1"><Search className="h-3 w-3" />Search</Button>
        </div>
      </SectionCard>
      <SectionCard title="Hot Signals">
        <div className="space-y-1">
          {MOCK_SIGNALS.filter(s => s.strength === 'high').slice(0, 3).map(s => {
            const Icon = SIGNAL_ICONS[s.type];
            return (
              <div key={s.id} className="flex items-center gap-1.5 text-[9px] cursor-pointer hover:bg-muted/30 rounded px-1 py-0.5">
                <Icon className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" />
                <span className="truncate flex-1">{s.candidateName}</span>
                <span className="text-[7px] text-muted-foreground">{s.timestamp}</span>
              </div>
            );
          })}
        </div>
      </SectionCard>
      <SectionCard title="Actions">
        <div className="space-y-1">
          {[
            { label: 'Run saved search', icon: Search },
            { label: 'Export candidates', icon: FileText },
            { label: 'Manage team seats', icon: Users },
            { label: 'View billing', icon: Shield },
          ].map(a => (
            <button key={a.label} onClick={() => toast.info(a.label)} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-[9px] hover:bg-muted/50 transition-colors">
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
        <span className="text-[11px] font-semibold flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5 text-accent" />Hiring Velocity</span>
        <span className="text-[10px] text-muted-foreground">Last 30 days</span>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Searches', value: '42' }, { label: 'Candidates Found', value: '312' },
          { label: 'InMails Sent', value: '28' }, { label: 'Replies', value: '19' },
          { label: 'Interviews', value: '8' }, { label: 'Hires', value: '2' },
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
      {!isPro && (
        <div className="rounded-lg border-2 border-accent/20 bg-accent/5 p-4 flex items-center gap-4 mb-3">
          <Crown className="h-8 w-8 text-accent shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-bold">Unlock Recruiter Pro</h3>
            <p className="text-[10px] text-muted-foreground">Get higher-signal discovery, unlimited saved lists, intent signals, and hiring analytics. Premium features shown below are view-only.</p>
          </div>
          <Button size="sm" className="h-7 text-[10px] gap-1 shrink-0"><Zap className="h-3 w-3" />Upgrade Now</Button>
        </div>
      )}

      {activeTab === 'command-centre' && <CommandCentre onViewSignals={() => setActiveTab('signals')} onOpenList={(id) => { setSelectedListId(id); setActiveTab('saved-lists'); }} />}
      {activeTab === 'saved-lists' && <SavedListsTab selectedListId={selectedListId} onSelect={setSelectedListId} />}
      {activeTab === 'signals' && <SignalsTab />}
      {activeTab === 'analytics' && <AnalyticsTab />}

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[420px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm">Candidate Profile</SheetTitle></SheetHeader>
          {drawerCandidate && (
            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10"><AvatarFallback className="text-xs bg-accent/10 text-accent">{drawerCandidate.avatar}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <h3 className="text-sm font-bold">{drawerCandidate.name}</h3>
                  <p className="text-[10px] text-muted-foreground">{drawerCandidate.headline}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {drawerCandidate.openToWork && <StatusBadge status="healthy" label="Open to Work" />}
                    {drawerCandidate.premium && <Badge className="text-[7px] bg-accent/10 text-accent"><Crown className="h-2 w-2 mr-0.5" />Pro Insight</Badge>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-accent">{drawerCandidate.matchScore}%</div>
                  <div className="text-[8px] text-muted-foreground">match</div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" className="flex-1 h-7 text-[10px] gap-1"><Mail className="h-3 w-3" />InMail</Button>
                <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] gap-1"><BookmarkPlus className="h-3 w-3" />Save</Button>
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1"><ExternalLink className="h-3 w-3" /></Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default RecruiterProPage;
