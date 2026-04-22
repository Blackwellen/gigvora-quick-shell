import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import {
  Compass, Search, Clock, ChevronRight, MoreHorizontal, History,
  Plus, Eye, Download, Bookmark, BookmarkCheck, Star, Building2,
  Users, Zap, TrendingUp, MapPin, Briefcase, Mail,
  MessageSquare, ListPlus, UserPlus, Target, ArrowUpRight,
  CheckCircle2, AlertTriangle, Lock, Send, Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

// ── Types ──
type IntentLevel = 'high' | 'medium' | 'low';
type Availability = 'now' | '2_weeks' | '1_month' | 'passive';
type TalentStatus = 'open_to_work' | 'actively_looking' | 'passive' | 'not_looking';

interface Talent {
  id: string; name: string; avatar: string; title: string; company: string;
  location: string; skills: string[]; intent: IntentLevel; availability: Availability;
  status: TalentStatus; score: number; saved: boolean; lastActive: string;
  experience: string; salary?: string; outreachSent: boolean;
}

interface IntentSignal {
  id: string; talent: string; avatar: string; signal: string; type: 'profile_update' | 'job_view' | 'skill_add' | 'availability' | 'engagement';
  time: string; intent: IntentLevel;
}

interface Shortlist {
  id: string; name: string; count: number; updated: string; role: string;
}

// ── Mock Data ──
const TALENT: Talent[] = [
  { id: 'T-001', name: 'Aisha Patel', avatar: 'AP', title: 'Senior React Engineer', company: 'TechCorp', location: 'San Francisco, CA', skills: ['React', 'TypeScript', 'Node.js'], intent: 'high', availability: 'now', status: 'open_to_work', score: 96, saved: true, lastActive: '1h ago', experience: '7 yrs', salary: '$180-210K', outreachSent: false },
  { id: 'T-002', name: 'James Chen', avatar: 'JC', title: 'Staff Backend Engineer', company: 'ScaleUp Inc', location: 'New York, NY', skills: ['Go', 'Kubernetes', 'PostgreSQL'], intent: 'high', availability: '2_weeks', status: 'actively_looking', score: 93, saved: true, lastActive: '3h ago', experience: '9 yrs', salary: '$200-240K', outreachSent: true },
  { id: 'T-003', name: 'Maria Santos', avatar: 'MS', title: 'Product Designer', company: 'DesignFlow', location: 'Austin, TX', skills: ['Figma', 'Design Systems', 'UX Research'], intent: 'medium', availability: '1_month', status: 'passive', score: 85, saved: false, lastActive: '1d ago', experience: '5 yrs', outreachSent: false },
  { id: 'T-004', name: 'Raj Krishnan', avatar: 'RK', title: 'ML Engineer', company: 'NexaFlow', location: 'London, UK', skills: ['Python', 'PyTorch', 'MLOps'], intent: 'high', availability: 'now', status: 'open_to_work', score: 91, saved: false, lastActive: '2h ago', experience: '6 yrs', salary: '$170-200K', outreachSent: false },
  { id: 'T-005', name: 'Sarah Kim', avatar: 'SK', title: 'Engineering Manager', company: 'CloudScale', location: 'Seattle, WA', skills: ['Leadership', 'Agile', 'System Design'], intent: 'low', availability: 'passive', status: 'not_looking', score: 78, saved: false, lastActive: '5d ago', experience: '11 yrs', outreachSent: false },
  { id: 'T-006', name: 'Omar Hassan', avatar: 'OH', title: 'DevOps Lead', company: 'DataFlow', location: 'Chicago, IL', skills: ['AWS', 'Terraform', 'CI/CD'], intent: 'medium', availability: '2_weeks', status: 'actively_looking', score: 87, saved: true, lastActive: '6h ago', experience: '8 yrs', salary: '$190-220K', outreachSent: true },
  { id: 'T-007', name: 'Emma Liu', avatar: 'EL', title: 'Full Stack Developer', company: 'AppWorks', location: 'Boston, MA', skills: ['React', 'Python', 'GraphQL'], intent: 'high', availability: 'now', status: 'open_to_work', score: 89, saved: false, lastActive: '30m ago', experience: '4 yrs', salary: '$140-165K', outreachSent: false },
];

const SIGNALS: IntentSignal[] = [
  { id: 'S-1', talent: 'Aisha Patel', avatar: 'AP', signal: 'Updated profile — added "Open to Work" badge', type: 'availability', time: '1h ago', intent: 'high' },
  { id: 'S-2', talent: 'Emma Liu', avatar: 'EL', signal: 'Viewed 5 Senior Engineer roles in the last 24h', type: 'job_view', time: '30m ago', intent: 'high' },
  { id: 'S-3', talent: 'Raj Krishnan', avatar: 'RK', signal: 'Added new skills: LLM Fine-tuning, RAG', type: 'skill_add', time: '2h ago', intent: 'high' },
  { id: 'S-4', talent: 'Maria Santos', avatar: 'MS', signal: 'Updated portfolio with 3 new case studies', type: 'profile_update', time: '1d ago', intent: 'medium' },
  { id: 'S-5', talent: 'Omar Hassan', avatar: 'OH', signal: 'Engaged with DevOps community content (3 posts)', type: 'engagement', time: '6h ago', intent: 'medium' },
  { id: 'S-6', talent: 'James Chen', avatar: 'JC', signal: 'Set availability to "2 weeks notice"', type: 'availability', time: '3h ago', intent: 'high' },
];

const SHORTLISTS: Shortlist[] = [
  { id: 'SH-1', name: 'Senior Engineers Q2', count: 18, updated: '2h ago', role: 'Staff/Senior Eng' },
  { id: 'SH-2', name: 'ML/AI Candidates', count: 12, updated: '1d ago', role: 'ML Engineer' },
  { id: 'SH-3', name: 'Design Team Expansion', count: 8, updated: '3d ago', role: 'Product Designer' },
  { id: 'SH-4', name: 'DevOps Pipeline', count: 15, updated: '5h ago', role: 'DevOps Lead' },
];

const INTENT_COLORS: Record<IntentLevel, string> = {
  high: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  medium: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  low: 'bg-muted text-muted-foreground',
};

const AVAIL_LABEL: Record<Availability, string> = {
  now: 'Available Now', '2_weeks': '2 Weeks', '1_month': '1 Month', passive: 'Passive',
};
const AVAIL_COLOR: Record<Availability, string> = {
  now: 'text-[hsl(var(--state-healthy))]', '2_weeks': 'text-accent', '1_month': 'text-[hsl(var(--gigvora-amber))]', passive: 'text-muted-foreground',
};

const STATUS_LABEL: Record<TalentStatus, string> = {
  open_to_work: 'Open to Work', actively_looking: 'Actively Looking', passive: 'Passive', not_looking: 'Not Looking',
};

const SIGNAL_ICON: Record<IntentSignal['type'], typeof Zap> = {
  profile_update: ArrowUpRight, job_view: Eye, skill_add: Plus, availability: CheckCircle2, engagement: MessageSquare,
};

// ── Talent Detail Drawer ──
const TalentDrawer: React.FC<{ talent: Talent | null; open: boolean; onClose: () => void }> = ({ talent, open, onClose }) => {
  if (!talent) return null;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Compass className="h-4 w-4 text-accent" />Talent Profile</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b">
            <Avatar className="h-12 w-12"><AvatarFallback className="text-sm">{talent.avatar}</AvatarFallback></Avatar>
            <div>
              <div className="text-sm font-bold">{talent.name}</div>
              <div className="text-[10px] text-muted-foreground">{talent.title}</div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Building2 className="h-2.5 w-2.5" />{talent.company}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-lg font-bold">{talent.score}</div>
              <div className="text-[7px] text-muted-foreground">Match Score</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { l: 'Location', v: talent.location, icon: MapPin },
              { l: 'Experience', v: talent.experience, icon: Briefcase },
              { l: 'Availability', v: AVAIL_LABEL[talent.availability], icon: Clock },
              { l: 'Status', v: STATUS_LABEL[talent.status], icon: Users },
              ...(talent.salary ? [{ l: 'Salary Range', v: talent.salary, icon: TrendingUp }] : []),
              { l: 'Last Active', v: talent.lastActive, icon: Clock },
            ].map(m => (
              <div key={m.l} className="rounded-md border p-2 flex items-start gap-1.5">
                <m.icon className="h-3 w-3 text-muted-foreground mt-0.5" />
                <div><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-[9px] font-medium">{m.v}</div></div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[10px] font-semibold mb-1">Skills</div>
            <div className="flex flex-wrap gap-1">
              {talent.skills.map(s => (
                <Badge key={s} variant="secondary" className="text-[7px]">{s}</Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold mb-1">Intent Level</div>
            <Badge className={cn('text-[8px] border-0 capitalize', INTENT_COLORS[talent.intent])}>{talent.intent} intent</Badge>
          </div>

          {talent.status === 'not_looking' && (
            <div className="rounded-lg border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 p-2.5 flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0 mt-0.5" />
              <div className="text-[8px]"><span className="font-semibold">Not currently looking.</span> Outreach may have lower response rate. Consider warming through content engagement first.</div>
            </div>
          )}

          <div className="rounded-lg border bg-card p-3">
            <div className="text-[10px] font-semibold mb-2">Recent Signals</div>
            <div className="space-y-1.5 text-[8px]">
              {SIGNALS.filter(s => s.talent === talent.name).length > 0
                ? SIGNALS.filter(s => s.talent === talent.name).map(s => (
                    <div key={s.id} className="flex gap-2 py-1 border-b last:border-0">
                      <span className="text-muted-foreground shrink-0 w-12">{s.time}</span>
                      <span>{s.signal}</span>
                    </div>
                  ))
                : <div className="text-muted-foreground italic">No recent signals detected</div>
              }
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            <Button size="sm" className="h-6 text-[9px] gap-1"><Send className="h-2.5 w-2.5" />Message</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><ListPlus className="h-2.5 w-2.5" />Shortlist</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1">{talent.saved ? <BookmarkCheck className="h-2.5 w-2.5" /> : <Bookmark className="h-2.5 w-2.5" />}{talent.saved ? 'Saved' : 'Save'}</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><Eye className="h-2.5 w-2.5" />Full Profile</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Main Page ──
const NavigatorTalentPage: React.FC = () => {
  const { activeRole } = useRole();
  const [selected, setSelected] = useState<Talent | null>(null);
  const [search, setSearch] = useState('');
  const [intentFilter, setIntentFilter] = useState('all');
  const [availFilter, setAvailFilter] = useState('all');

  const filtered = TALENT.filter(t => {
    const ms = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.title.toLowerCase().includes(search.toLowerCase()) || t.skills.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const mi = intentFilter === 'all' || t.intent === intentFilter;
    const ma = availFilter === 'all' || t.availability === availFilter;
    return ms && mi && ma;
  });

  const topStrip = (
    <>
      <Target className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Navigator — Talent</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search talent, skills..." className="h-6 rounded-md border bg-background pl-7 pr-2 text-[8px] w-44 focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <select value={intentFilter} onChange={e => setIntentFilter(e.target.value)} className="h-6 rounded-md border bg-background px-1.5 text-[8px]">
        <option value="all">All intent</option>
        <option value="high">High intent</option>
        <option value="medium">Medium intent</option>
        <option value="low">Low intent</option>
      </select>
      <select value={availFilter} onChange={e => setAvailFilter(e.target.value)} className="h-6 rounded-md border bg-background px-1.5 text-[8px]">
        <option value="all">All availability</option>
        <option value="now">Available now</option>
        <option value="2_weeks">2 weeks</option>
        <option value="1_month">1 month</option>
        <option value="passive">Passive</option>
      </select>
      <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Download className="h-3 w-3" />Export</Button>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Shortlists" icon={<ListPlus className="h-3.5 w-3.5 text-accent" />}>
        <div className="space-y-1">
          {SHORTLISTS.map(l => (
            <button key={l.id} className="flex items-center gap-1.5 p-1.5 rounded-md w-full text-left hover:bg-muted/30 transition-colors text-[8px]">
              <Users className="h-3 w-3 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{l.name}</div>
                <div className="text-[7px] text-muted-foreground">{l.count} candidates · {l.updated}</div>
              </div>
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="h-5 text-[7px] w-full mt-1.5 gap-0.5"><Plus className="h-2 w-2" />New Shortlist</Button>
      </SectionCard>

      <SectionCard title="Intent Summary" icon={<Zap className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />}>
        <div className="space-y-1 text-[8px]">
          {[
            { l: 'High Intent', c: TALENT.filter(t => t.intent === 'high').length, color: 'text-[hsl(var(--state-healthy))]' },
            { l: 'Medium Intent', c: TALENT.filter(t => t.intent === 'medium').length, color: 'text-[hsl(var(--gigvora-amber))]' },
            { l: 'Low Intent', c: TALENT.filter(t => t.intent === 'low').length, color: 'text-muted-foreground' },
          ].map(r => (
            <div key={r.l} className="flex justify-between">
              <span className={cn('font-medium', r.color)}>{r.l}</span>
              <span className="text-muted-foreground">{r.c} candidates</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Outreach Quota" icon={<Send className="h-3.5 w-3.5 text-primary" />}>
        <div className="space-y-1.5 text-[8px]">
          <div className="flex justify-between"><span>Used today</span><span className="font-semibold">12 / 50</span></div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: '24%' }} /></div>
          <div className="text-[7px] text-muted-foreground">38 messages remaining · Resets in 14h</div>
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions">
        <div className="space-y-0.5">
          {[
            { label: 'Search Talent', icon: Search },
            { label: 'Saved Searches', icon: Bookmark },
            { label: 'Outreach Templates', icon: Mail },
            { label: 'Import Candidates', icon: UserPlus },
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
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Recent Outreach Activity</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[
          { action: 'Sent InMail to James Chen — Staff Backend role', time: '3h ago', type: 'outreach', status: 'delivered' },
          { action: 'Omar Hassan replied to your message — interested', time: '6h ago', type: 'reply', status: 'positive' },
          { action: 'Shortlisted Aisha Patel for "Senior Engineers Q2"', time: '1h ago', type: 'shortlist', status: 'added' },
          { action: 'Saved search: "ML Engineers, Open to Work, SF Bay"', time: '1d ago', type: 'search', status: 'saved' },
        ].map((a, i) => (
          <div key={i} className="shrink-0 rounded-lg border bg-card px-3 py-2 min-w-[220px]">
            <div className="flex items-center gap-1 mb-1">
              <Badge variant="secondary" className="text-[6px] capitalize">{a.type}</Badge>
              <Badge className={cn('text-[6px] border-0', a.status === 'positive' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : 'bg-muted text-muted-foreground')}>{a.status}</Badge>
            </div>
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
        <KPICard label="Talent Found" value={String(TALENT.length)} change="This session" />
        <KPICard label="High Intent" value={String(TALENT.filter(t => t.intent === 'high').length)} change="Ready now" trend="up" />
        <KPICard label="Outreach Sent" value="12" change="Today" />
        <KPICard label="Response Rate" value="34%" change="Last 7d" trend="up" />
      </KPIBand>

      <Tabs defaultValue="talent">
        <TabsList className="mb-3 flex-wrap h-auto gap-0.5">
          <TabsTrigger value="talent" className="gap-1 text-[10px] h-6 px-2"><Users className="h-3 w-3" />Talent</TabsTrigger>
          <TabsTrigger value="signals" className="gap-1 text-[10px] h-6 px-2"><Zap className="h-3 w-3" />Intent Signals</TabsTrigger>
          <TabsTrigger value="outreach" className="gap-1 text-[10px] h-6 px-2"><Send className="h-3 w-3" />Outreach</TabsTrigger>
        </TabsList>

        {/* Talent Table */}
        <TabsContent value="talent">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-[9px] text-muted-foreground font-medium">
                  <th className="text-left px-3 py-2">Candidate</th>
                  <th className="text-left px-3 py-2">Skills</th>
                  <th className="text-center px-3 py-2">Intent</th>
                  <th className="text-center px-3 py-2">Availability</th>
                  <th className="text-center px-3 py-2">Score</th>
                  <th className="text-left px-3 py-2">Active</th>
                  <th className="text-left px-3 py-2 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} onClick={() => setSelected(t)} className={cn('border-t hover:bg-muted/30 cursor-pointer text-[9px] transition-colors', selected?.id === t.id && 'bg-accent/5')}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-6 w-6"><AvatarFallback className="text-[7px]">{t.avatar}</AvatarFallback></Avatar>
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            {t.name}
                            {t.saved && <BookmarkCheck className="h-2.5 w-2.5 text-accent" />}
                            {t.outreachSent && <Send className="h-2 w-2 text-primary" />}
                          </div>
                          <div className="text-[7px] text-muted-foreground">{t.title} · {t.company}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-0.5 flex-wrap">
                        {t.skills.slice(0, 2).map(s => (
                          <Badge key={s} variant="secondary" className="text-[6px]">{s}</Badge>
                        ))}
                        {t.skills.length > 2 && <Badge variant="secondary" className="text-[6px]">+{t.skills.length - 2}</Badge>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge className={cn('text-[7px] border-0 capitalize', INTENT_COLORS[t.intent])}>{t.intent}</Badge>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={cn('text-[8px] font-medium', AVAIL_COLOR[t.availability])}>{AVAIL_LABEL[t.availability]}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant={t.score >= 90 ? 'default' : 'secondary'} className="text-[7px]">{t.score}</Badge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{t.lastActive}</td>
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => toast.success(`${t.saved ? 'Removed' : 'Saved'} ${t.name}`)}>{t.saved ? <BookmarkCheck className="h-2.5 w-2.5 text-accent" /> : <Bookmark className="h-2.5 w-2.5" />}</Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => toast.success(`Shortlisted ${t.name}`)}><ListPlus className="h-2.5 w-2.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5"><MoreHorizontal className="h-2.5 w-2.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Intent Signals */}
        <TabsContent value="signals">
          <div className="space-y-2">
            {SIGNALS.map(s => {
              const Icon = SIGNAL_ICON[s.type];
              return (
                <div key={s.id} className="rounded-lg border bg-card p-3 flex items-start gap-3">
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', INTENT_COLORS[s.intent].split(' ')[0])}>
                    <Icon className={cn('h-4 w-4', INTENT_COLORS[s.intent].split(' ')[1])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Avatar className="h-4 w-4"><AvatarFallback className="text-[5px]">{s.avatar}</AvatarFallback></Avatar>
                      <span className="text-[10px] font-semibold">{s.talent}</span>
                      <Badge className={cn('text-[6px] border-0 capitalize', INTENT_COLORS[s.intent])}>{s.intent}</Badge>
                    </div>
                    <div className="text-[8px] text-muted-foreground">{s.signal}</div>
                    <div className="text-[7px] text-muted-foreground mt-0.5">{s.time}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="h-6 text-[8px] gap-1"><Eye className="h-2.5 w-2.5" />View</Button>
                    <Button size="sm" className="h-6 text-[8px] gap-1"><Send className="h-2.5 w-2.5" />Reach Out</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Outreach */}
        <TabsContent value="outreach">
          <div className="space-y-3">
            <div className="rounded-lg border bg-card p-3">
              <div className="text-[10px] font-semibold mb-2">Outreach Pipeline</div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { stage: 'Queued', count: 5, color: 'bg-muted' },
                  { stage: 'Sent', count: 12, color: 'bg-primary/10' },
                  { stage: 'Opened', count: 8, color: 'bg-accent/10' },
                  { stage: 'Replied', count: 4, color: 'bg-[hsl(var(--state-healthy))]/10' },
                ].map(s => (
                  <div key={s.stage} className={cn('rounded-lg p-2 text-center', s.color)}>
                    <div className="text-lg font-bold">{s.count}</div>
                    <div className="text-[7px] text-muted-foreground">{s.stage}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-[9px] text-muted-foreground font-medium">
                    <th className="text-left px-3 py-2">Candidate</th>
                    <th className="text-left px-3 py-2">Message</th>
                    <th className="text-center px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'James Chen', avatar: 'JC', msg: 'Re: Staff Backend Engineer role at…', status: 'replied', time: '3h ago' },
                    { name: 'Omar Hassan', avatar: 'OH', msg: 'DevOps Lead opportunity — interested?', status: 'opened', time: '6h ago' },
                    { name: 'Aisha Patel', avatar: 'AP', msg: 'Senior React role — perfect match', status: 'queued', time: 'Scheduled 2pm' },
                    { name: 'Emma Liu', avatar: 'EL', msg: 'Full Stack Developer — exciting startup', status: 'sent', time: '1d ago' },
                  ].map((o, i) => (
                    <tr key={i} className="border-t text-[9px] hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5"><AvatarFallback className="text-[6px]">{o.avatar}</AvatarFallback></Avatar>
                          <span className="font-medium">{o.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground truncate max-w-[200px]">{o.msg}</td>
                      <td className="px-3 py-2 text-center">
                        <Badge className={cn('text-[6px] border-0 capitalize',
                          o.status === 'replied' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' :
                          o.status === 'opened' ? 'bg-accent/10 text-accent' :
                          o.status === 'sent' ? 'bg-primary/10 text-primary' :
                          'bg-muted text-muted-foreground'
                        )}>{o.status}</Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{o.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 p-2.5 flex items-start gap-2">
              <Lock className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0 mt-0.5" />
              <div className="text-[8px]"><span className="font-semibold">Quota Notice:</span> You have used 12 of 50 daily outreach credits. Upgrade to Navigator Pro for unlimited outreach.</div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <TalentDrawer talent={selected} open={!!selected} onClose={() => setSelected(null)} />
    </DashboardLayout>
  );
};

export default NavigatorTalentPage;
