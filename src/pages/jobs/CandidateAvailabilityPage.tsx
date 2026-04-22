import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, KPIBand, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Eye, EyeOff, Signal, Plus,
  CheckCircle2,
  Shield, Globe, Bell,
  ArrowRight, BarChart3,
  Download, Mail, ExternalLink,
  Target, Sparkles, TrendingUp, Calendar, Heart,
  Radar, Radio, ToggleLeft, X, UserCheck, Lock,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */
type PageTab = 'status' | 'availability' | 'visibility' | 'signals' | 'preview' | 'matching' | 'alerts';
type OTWStatus = 'active' | 'passive' | 'off';
type VisibilityLevel = 'all_recruiters' | 'outside_company' | 'specific_recruiters' | 'hidden';
type MatchScore = 'excellent' | 'strong' | 'good' | 'fair' | 'weak';

interface MatchingSignal {
  id: string; type: 'profile_update' | 'job_change' | 'skill_add' | 'company_layoff' | 'certification' | 'activity_spike';
  label: string; description: string; strength: number; timestamp: string; actionable: boolean;
}

interface MatchedJob {
  id: string; title: string; company: string; companyAvatar: string; location: string;
  salary: string; matchScore: number; matchLabel: MatchScore; matchReasons: string[];
  posted: string; type: string; remote: boolean;
}

interface RecruiterView {
  id: string; name: string; company: string; avatar: string; viewedAt: string;
  saved: boolean; messaged: boolean;
}

const MATCH_COLORS: Record<MatchScore, string> = {
  excellent: 'text-[hsl(var(--state-healthy))]',
  strong: 'text-accent',
  good: 'text-foreground',
  fair: 'text-[hsl(var(--state-caution))]',
  weak: 'text-muted-foreground',
};

/* ═══════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════ */
const SIGNALS: MatchingSignal[] = [
  { id:'s1', type:'profile_update', label:'Profile Updated', description:'Added 3 new skills and updated headline', strength:85, timestamp:'2h ago', actionable:true },
  { id:'s2', type:'job_change', label:'Job Change Signal', description:'Updated current position — typically indicates openness', strength:92, timestamp:'1d ago', actionable:true },
  { id:'s3', type:'skill_add', label:'New Certification', description:'AWS Solutions Architect Professional added', strength:78, timestamp:'3d ago', actionable:false },
  { id:'s4', type:'company_layoff', label:'Company Restructuring', description:'Employer announced 15% workforce reduction', strength:95, timestamp:'5d ago', actionable:true },
  { id:'s5', type:'activity_spike', label:'Activity Spike', description:'5x increase in job browsing and application activity', strength:88, timestamp:'1w ago', actionable:true },
  { id:'s6', type:'certification', label:'Skill Endorsement', description:'Received 4 new endorsements for React and TypeScript', strength:45, timestamp:'2w ago', actionable:false },
];

const MATCHED_JOBS: MatchedJob[] = [
  { id:'mj1', title:'Senior Frontend Engineer', company:'Acme Corp', companyAvatar:'AC', location:'Remote', salary:'$150k–$185k', matchScore:96, matchLabel:'excellent', matchReasons:['Skills match: React, TypeScript, Node.js','Experience level: 6+ years','Salary range: within expectations','Location: remote preference matched'], posted:'2d ago', type:'Full-time', remote:true },
  { id:'mj2', title:'Staff Engineer — UI Platform', company:'TechFlow', companyAvatar:'TF', location:'SF / Remote', salary:'$180k–$220k', matchScore:91, matchLabel:'excellent', matchReasons:['Design systems expertise','Team lead experience','Tech stack alignment'], posted:'3d ago', type:'Full-time', remote:true },
  { id:'mj3', title:'Frontend Architect', company:'DataViz Inc', companyAvatar:'DV', location:'NYC', salary:'$170k–$200k', matchScore:84, matchLabel:'strong', matchReasons:['Architecture experience','Performance optimization','Partial location match'], posted:'5d ago', type:'Full-time', remote:false },
  { id:'mj4', title:'React Developer', company:'StartupXYZ', companyAvatar:'SX', location:'Remote', salary:'$120k–$150k', matchScore:72, matchLabel:'good', matchReasons:['Core skills match','Below salary expectations','Startup environment'], posted:'1w ago', type:'Contract', remote:true },
  { id:'mj5', title:'Engineering Manager', company:'BigTech', companyAvatar:'BT', location:'Seattle', salary:'$200k–$250k', matchScore:65, matchLabel:'fair', matchReasons:['Leadership skills','Different IC vs manager track','Relocation required'], posted:'1w ago', type:'Full-time', remote:false },
];

const RECRUITER_VIEWS: RecruiterView[] = [
  { id:'rv1', name:'Sarah Mitchell', company:'Acme Corp', avatar:'SM', viewedAt:'1h ago', saved:true, messaged:true },
  { id:'rv2', name:'James Chen', company:'TechFlow', avatar:'JC', viewedAt:'4h ago', saved:true, messaged:false },
  { id:'rv3', name:'Emily Watson', company:'DataViz Inc', avatar:'EW', viewedAt:'Yesterday', saved:false, messaged:false },
  { id:'rv4', name:'Michael Torres', company:'BigTech', avatar:'MT', viewedAt:'2d ago', saved:false, messaged:false },
  { id:'rv5', name:'Lisa Park', company:'StartupXYZ', avatar:'LP', viewedAt:'3d ago', saved:false, messaged:true },
];

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const CandidateAvailabilityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PageTab>('status');
  const [otwStatus, setOtwStatus] = useState<OTWStatus>('active');
  const [visibility, setVisibility] = useState<VisibilityLevel>('outside_company');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobTypes, setJobTypes] = useState(['Full-time', 'Contract']);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [salaryMin, setSalaryMin] = useState('140000');
  const [salaryMax, setSalaryMax] = useState('200000');
  const [noticePeriod, setNoticePeriod] = useState('2 weeks');

  const selectedJob = MATCHED_JOBS.find(j => j.id === selectedJobId);

  const TABS: { id: PageTab; label: string; icon: LucideIcon; count?: number }[] = [
    { id: 'status', label: 'Status Controls', icon: ToggleLeft },
    { id: 'availability', label: 'Availability', icon: Calendar },
    { id: 'visibility', label: 'Visibility Rules', icon: Eye },
    { id: 'signals', label: 'Signals', icon: Radio, count: SIGNALS.filter(s => s.actionable).length },
    { id: 'preview', label: 'Recruiter Preview', icon: UserCheck, count: RECRUITER_VIEWS.length },
    { id: 'matching', label: 'Job Matching', icon: Target, count: MATCHED_JOBS.length },
    { id: 'alerts', label: 'Alerts', icon: Bell },
  ];

  /* ── Top Strip ── */
  const topStrip = (<>
    <div className="flex items-center gap-2.5">
      <div className={cn('h-7 w-7 rounded-xl flex items-center justify-center', otwStatus === 'active' ? 'bg-[hsl(var(--state-healthy)/0.1)]' : 'bg-muted/50')}>
        <Signal className={cn('h-3.5 w-3.5', otwStatus === 'active' ? 'text-[hsl(var(--state-healthy))]' : 'text-muted-foreground')} />
      </div>
      <span className="text-xs font-bold">Availability & Matching</span>
      <StatusBadge status={otwStatus === 'active' ? 'live' : otwStatus === 'passive' ? 'pending' : 'degraded'} label={otwStatus === 'active' ? 'Open to Work' : otwStatus === 'passive' ? 'Passively Looking' : 'Not Looking'} />
    </div>
    <div className="flex-1" />
    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3" />Export Profile</Button>
    <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => toast.success('Profile visibility refreshed')}><Sparkles className="h-3 w-3" />Boost Visibility</Button>
  </>);

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <KPIBand className="!grid-cols-2">
        <KPICard label="Profile Views" value="48" change="this week" trend="up" />
        <KPICard label="Matches" value={String(MATCHED_JOBS.length)} trend="up" />
      </KPIBand>
      <KPIBand className="!grid-cols-2">
        <KPICard label="Saved By" value={String(RECRUITER_VIEWS.filter(r => r.saved).length)} change="recruiters" trend="up" />
        <KPICard label="Messages" value={String(RECRUITER_VIEWS.filter(r => r.messaged).length)} trend="neutral" />
      </KPIBand>

      <SectionCard title="Quick Status" icon={<Signal className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-2">
          {(['active', 'passive', 'off'] as const).map(s => (
            <button key={s} onClick={() => { setOtwStatus(s); toast.success(`Status: ${s === 'active' ? 'Open to Work' : s === 'passive' ? 'Passively Looking' : 'Not Looking'}`); }} className={cn('w-full flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-all', otwStatus === s ? 'border-accent bg-accent/5' : 'hover:bg-muted/30')}>
              <div className={cn('h-2 w-2 rounded-full', s === 'active' ? 'bg-[hsl(var(--state-healthy))]' : s === 'passive' ? 'bg-[hsl(var(--state-caution))]' : 'bg-muted-foreground')} />
              <div>
                <div className="text-[9px] font-semibold capitalize">{s === 'active' ? 'Open to Work' : s === 'passive' ? 'Passively Looking' : 'Not Looking'}</div>
                <div className="text-[7px] text-muted-foreground">{s === 'active' ? 'Visible to all recruiters' : s === 'passive' ? 'Only matched recruiters' : 'Profile hidden from search'}</div>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Recent Recruiter Views" icon={<Eye className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {RECRUITER_VIEWS.slice(0, 4).map(r => (
            <div key={r.id} className="flex items-center gap-2">
              <Avatar className="h-5 w-5"><AvatarFallback className="text-[6px] bg-accent/10 text-accent font-bold">{r.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0"><div className="text-[8px] font-medium truncate">{r.name}</div><div className="text-[7px] text-muted-foreground">{r.company} · {r.viewedAt}</div></div>
              {r.saved && <Heart className="h-2.5 w-2.5 text-[hsl(var(--state-caution))] fill-[hsl(var(--state-caution))]" />}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Profile Strength" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {[{ l: 'Skills', v: 85 }, { l: 'Experience', v: 92 }, { l: 'Portfolio', v: 60 }, { l: 'Availability Info', v: 100 }].map(m => (
            <div key={m.l}>
              <div className="flex items-center justify-between text-[8px] mb-0.5"><span className="text-muted-foreground">{m.l}</span><span className="font-bold">{m.v}%</span></div>
              <Progress value={m.v} className="h-1" />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom ── */
  const bottomSection = (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5 text-accent" />Matching Analytics · Last 30 days</span>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Profile Views', value: '186' },
          { label: 'Search Appearances', value: '412' },
          { label: 'Matches Generated', value: '24' },
          { label: 'Recruiter Saves', value: '8' },
          { label: 'InMails Received', value: '5' },
          { label: 'Match Rate', value: '78%' },
        ].map(s => (<div key={s.label} className="text-center"><div className="text-sm font-bold">{s.value}</div><div className="text-[8px] text-muted-foreground">{s.label}</div></div>))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      {/* Banners */}
      {otwStatus === 'active' && (
        <div className="rounded-2xl border border-[hsl(var(--state-healthy)/0.3)] bg-[hsl(var(--state-healthy)/0.05)] p-2.5 flex items-center gap-3 mb-3">
          <Signal className="h-4 w-4 text-[hsl(var(--state-healthy))] shrink-0" />
          <div className="flex-1"><div className="text-[10px] font-medium">You're Open to Work</div><div className="text-[9px] text-muted-foreground">Your profile is visible to recruiters. {MATCHED_JOBS.length} new matches found.</div></div>
          <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg" onClick={() => setActiveTab('matching')}>View Matches</Button>
        </div>
      )}
      {otwStatus === 'off' && (
        <div className="rounded-2xl border border-muted bg-muted/30 p-2.5 flex items-center gap-3 mb-3">
          <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1"><div className="text-[10px] font-medium">Profile Hidden</div><div className="text-[9px] text-muted-foreground">You won't appear in recruiter searches or receive job matches.</div></div>
          <Button size="sm" className="h-6 text-[8px] rounded-lg" onClick={() => { setOtwStatus('active'); toast.success('Now open to work!'); }}>Go Active</Button>
        </div>
      )}

      {/* Tab Nav */}
      <div className="flex items-center gap-0.5 p-1 rounded-2xl bg-muted/30 mb-4 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn('flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-semibold rounded-xl transition-all duration-200 shrink-0', activeTab === t.id ? 'bg-background shadow-sm text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30')}>
            <t.icon className="h-3 w-3" />{t.label}
            {t.count !== undefined && <span className={cn('text-[7px] rounded-full px-1.5', activeTab === t.id ? 'bg-accent/10' : 'bg-muted')}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ═══ STATUS CONTROLS TAB ═══ */}
      {activeTab === 'status' && (
        <div className="space-y-3">
          <SectionCard title="Open-to-Work Status" icon={<Signal className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="grid md:grid-cols-3 gap-3">
              {([
                { key: 'active' as const, label: 'Open to Work', desc: 'Actively seeking. Visible in recruiter searches, receive all matches and InMails.', icon: Signal, color: 'hsl(var(--state-healthy))' },
                { key: 'passive' as const, label: 'Passively Looking', desc: 'Not urgently seeking but open to the right opportunity. Limited visibility.', icon: Radar, color: 'hsl(var(--state-caution))' },
                { key: 'off' as const, label: 'Not Looking', desc: 'Profile hidden from recruiter searches. No matches or outreach.', icon: EyeOff, color: 'hsl(var(--muted-foreground))' },
              ]).map(s => (
                <button key={s.key} onClick={() => { setOtwStatus(s.key); toast.success(`Status updated to ${s.label}`); }} className={cn('rounded-2xl border p-4 text-left transition-all hover:shadow-md', otwStatus === s.key ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : '')}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}><s.icon className="h-4 w-4" style={{ color: s.color }} /></div>
                    {otwStatus === s.key && <CheckCircle2 className="h-4 w-4 text-accent ml-auto" />}
                  </div>
                  <div className="text-[11px] font-bold mb-1">{s.label}</div>
                  <div className="text-[9px] text-muted-foreground">{s.desc}</div>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="What Recruiters See" icon={<Eye className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="rounded-xl border p-3 bg-muted/20">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12 ring-2 ring-accent/20"><AvatarFallback className="text-sm bg-accent/10 text-accent font-bold">YN</AvatarFallback></Avatar>
                <div>
                  <div className="text-[12px] font-bold">Your Name</div>
                  <div className="text-[10px] text-muted-foreground">Senior Frontend Engineer · 6+ years</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {otwStatus === 'active' && <Badge className="text-[7px] bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]">Open to Work</Badge>}
                    {otwStatus === 'passive' && <Badge className="text-[7px] bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]">Passively Looking</Badge>}
                    <Badge variant="secondary" className="text-[7px]">Remote</Badge>
                    <Badge variant="secondary" className="text-[7px]">$140k–$200k</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[8px]">
                {[{ l: 'Skills', v: 'React, TS, Node' }, { l: 'Notice', v: noticePeriod }, { l: 'Location', v: 'Remote preferred' }, { l: 'Types', v: jobTypes.join(', ') }].map(i => (
                  <div key={i.l} className="rounded-lg bg-background p-1.5"><div className="text-muted-foreground">{i.l}</div><div className="font-medium">{i.v}</div></div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ AVAILABILITY TAB ═══ */}
      {activeTab === 'availability' && (
        <div className="space-y-3">
          <SectionCard title="Availability Preferences" icon={<Calendar className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium mb-1 block">Notice Period</label>
                  <select value={noticePeriod} onChange={e => setNoticePeriod(e.target.value)} className="w-full h-9 rounded-xl border bg-background px-3 text-sm">
                    <option>Immediately</option><option>1 week</option><option>2 weeks</option><option>1 month</option><option>2 months</option><option>3 months</option>
                  </select></div>
                <div><label className="text-xs font-medium mb-1 block">Preferred Start</label><input type="date" className="w-full h-9 rounded-xl border bg-background px-3 text-sm" /></div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Job Types</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Full-time', 'Contract', 'Part-time', 'Freelance', 'Internship'].map(t => (
                    <button key={t} onClick={() => setJobTypes(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])} className={cn('px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all', jobTypes.includes(t) ? 'bg-accent text-accent-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted/60')}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div><div className="text-[10px] font-medium">Remote Only</div><div className="text-[8px] text-muted-foreground">Only show remote opportunities</div></div>
                <Switch checked={remoteOnly} onCheckedChange={setRemoteOnly} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium mb-1 block">Salary Min ($)</label><input value={salaryMin} onChange={e => setSalaryMin(e.target.value)} className="w-full h-9 rounded-xl border bg-background px-3 text-sm" /></div>
                <div><label className="text-xs font-medium mb-1 block">Salary Max ($)</label><input value={salaryMax} onChange={e => setSalaryMax(e.target.value)} className="w-full h-9 rounded-xl border bg-background px-3 text-sm" /></div>
              </div>
              <div><label className="text-xs font-medium mb-1 block">Preferred Locations</label><input className="w-full h-9 rounded-xl border bg-background px-3 text-sm" placeholder="e.g. Remote, NYC, SF, London..." /></div>
              <Button size="sm" className="h-8 text-[10px] rounded-xl w-full" onClick={() => toast.success('Availability preferences saved')}><CheckCircle2 className="h-3 w-3 mr-1" />Save Preferences</Button>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ VISIBILITY RULES TAB ═══ */}
      {activeTab === 'visibility' && (
        <div className="space-y-3">
          <SectionCard title="Who Can See Your Open-to-Work Status" icon={<Shield className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              {([
                { key: 'all_recruiters' as const, label: 'All Recruiters', desc: 'Any recruiter on Gigvora can see your availability status.', icon: Globe },
                { key: 'outside_company' as const, label: 'Outside Current Company', desc: 'Recruiters at your current employer will not see your status.', icon: Shield },
                { key: 'specific_recruiters' as const, label: 'Specific Recruiters Only', desc: 'Only recruiters you approve can see your availability.', icon: Lock },
                { key: 'hidden' as const, label: 'Hidden', desc: 'Your status is completely hidden from all recruiters.', icon: EyeOff },
              ]).map(v => (
                <button key={v.key} onClick={() => { setVisibility(v.key); toast.success(`Visibility: ${v.label}`); }} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all', visibility === v.key ? 'border-accent bg-accent/5' : 'hover:bg-muted/30')}>
                  <v.icon className={cn('h-4 w-4 shrink-0', visibility === v.key ? 'text-accent' : 'text-muted-foreground')} />
                  <div className="flex-1"><div className="text-[10px] font-semibold">{v.label}</div><div className="text-[8px] text-muted-foreground">{v.desc}</div></div>
                  {visibility === v.key && <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />}
                </button>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Blocked Companies" className="!rounded-2xl">
            <div className="space-y-1.5 mb-2">
              {['Current Employer Inc.', 'Previous Corp'].map(c => (
                <div key={c} className="flex items-center gap-2 px-2 py-1.5 rounded-xl border">
                  <span className="text-[9px] flex-1">{c}</span>
                  <Button variant="ghost" size="sm" className="h-5 text-[7px]"><X className="h-2 w-2" /></Button>
                </div>
              ))}
            </div>
            <input className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]" placeholder="Add company to block..." />
          </SectionCard>
        </div>
      )}

      {/* ═══ SIGNALS TAB ═══ */}
      {activeTab === 'signals' && (
        <div className="space-y-2">
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-2.5 flex items-center gap-2 text-[10px] mb-3">
            <Radio className="h-4 w-4 text-accent shrink-0" />
            <span className="font-semibold">Talent Matching Signals</span>
            <span className="text-muted-foreground">— Activity patterns that indicate job readiness to recruiters.</span>
          </div>
          {SIGNALS.map(s => (
            <div key={s.id} className="rounded-2xl border p-3 hover:shadow-sm transition-all">
              <div className="flex items-start gap-3">
                <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0', s.strength > 80 ? 'bg-[hsl(var(--state-healthy)/0.1)]' : s.strength > 50 ? 'bg-[hsl(var(--state-caution)/0.1)]' : 'bg-muted/50')}>
                  <Radio className={cn('h-4 w-4', s.strength > 80 ? 'text-[hsl(var(--state-healthy))]' : s.strength > 50 ? 'text-[hsl(var(--state-caution))]' : 'text-muted-foreground')} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-bold">{s.label}</span>
                    <span className="text-[8px] text-muted-foreground">{s.timestamp}</span>
                    {s.actionable && <Badge className="text-[7px] bg-accent/10 text-accent">Actionable</Badge>}
                  </div>
                  <div className="text-[9px] text-muted-foreground mb-1.5">{s.description}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-muted-foreground">Signal Strength:</span>
                    <Progress value={s.strength} className="h-1 flex-1 max-w-[120px]" />
                    <span className="text-[8px] font-bold">{s.strength}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ RECRUITER PREVIEW TAB ═══ */}
      {activeTab === 'preview' && (
        <div className="space-y-3">
          <SectionCard title="Who's Viewing Your Profile" icon={<Eye className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="rounded-2xl border overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_55px_55px_80px] gap-2 px-3 py-2 bg-muted/50 border-b text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Recruiter</span><span>Viewed</span><span>Saved</span><span>Msg'd</span><span className="text-right">Action</span>
              </div>
              {RECRUITER_VIEWS.map(r => (
                <div key={r.id} className="grid grid-cols-[1fr_80px_55px_55px_80px] gap-2 px-3 py-2.5 border-b last:border-0 hover:bg-muted/30 transition-colors items-center">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-7 w-7 ring-1 ring-muted/30"><AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">{r.avatar}</AvatarFallback></Avatar>
                    <div className="min-w-0"><div className="text-[10px] font-medium truncate">{r.name}</div><div className="text-[8px] text-muted-foreground truncate">{r.company}</div></div>
                  </div>
                  <div className="text-[9px] text-muted-foreground">{r.viewedAt}</div>
                  <div>{r.saved ? <Heart className="h-3 w-3 text-[hsl(var(--state-caution))] fill-[hsl(var(--state-caution))]" /> : <span className="text-[8px] text-muted-foreground">—</span>}</div>
                  <div>{r.messaged ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /> : <span className="text-[8px] text-muted-foreground">—</span>}</div>
                  <div className="flex justify-end"><Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg"><Mail className="h-2 w-2 mr-0.5" />Reply</Button></div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ JOB MATCHING TAB ═══ */}
      {activeTab === 'matching' && (
        <div className="space-y-2">
          {MATCHED_JOBS.map(j => (
            <div key={j.id} onClick={() => setSelectedJobId(j.id)} className="rounded-2xl border p-3 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 ring-1 ring-muted/30 rounded-xl"><AvatarFallback className="text-[9px] bg-accent/10 text-accent font-bold rounded-xl">{j.companyAvatar}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-bold">{j.title}</span>
                    {j.remote && <Badge variant="secondary" className="text-[7px]">Remote</Badge>}
                  </div>
                  <div className="text-[9px] text-muted-foreground">{j.company} · {j.location} · {j.type}</div>
                  <div className="text-[9px] font-medium mt-0.5">{j.salary}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {j.matchReasons.slice(0, 2).map(r => (<Badge key={r} variant="secondary" className="text-[7px]">{r}</Badge>))}
                    {j.matchReasons.length > 2 && <Badge variant="secondary" className="text-[7px]">+{j.matchReasons.length - 2} more</Badge>}
                  </div>
                </div>
                <div className="text-center shrink-0">
                  <div className={cn('text-xl font-bold', MATCH_COLORS[j.matchLabel])}>{j.matchScore}%</div>
                  <div className={cn('text-[8px] font-semibold capitalize', MATCH_COLORS[j.matchLabel])}>{j.matchLabel}</div>
                  <div className="text-[7px] text-muted-foreground mt-0.5">{j.posted}</div>
                </div>
              </div>
              <div className="flex gap-1.5 mt-2.5 pt-2 border-t">
                <Button size="sm" className="flex-1 h-6 text-[8px] rounded-lg gap-0.5" onClick={e => { e.stopPropagation(); toast.success('Application started'); }}><ArrowRight className="h-2 w-2" />Quick Apply</Button>
                <Button size="sm" variant="outline" className="h-6 text-[8px] rounded-lg gap-0.5" onClick={e => { e.stopPropagation(); toast.info('Saved'); }}><Heart className="h-2 w-2" />Save</Button>
                <Button size="sm" variant="outline" className="h-6 text-[8px] rounded-lg gap-0.5" onClick={e => { e.stopPropagation(); toast.info('Hidden'); }}><EyeOff className="h-2 w-2" />Hide</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ ALERTS TAB ═══ */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          <SectionCard title="Notification Preferences" icon={<Bell className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              {[
                { label: 'New Job Matches', desc: 'Get notified when new jobs match your profile', enabled: true },
                { label: 'Recruiter Views', desc: 'Know when a recruiter views your profile', enabled: true },
                { label: 'InMail Messages', desc: 'Receive notifications for recruiter messages', enabled: true },
                { label: 'Saved by Recruiter', desc: 'Get notified when a recruiter saves your profile', enabled: false },
                { label: 'Weekly Match Digest', desc: 'Receive a weekly summary of matches', enabled: true },
                { label: 'Signal Alerts', desc: 'Get alerted about new matching signals', enabled: false },
              ].map(a => (
                <div key={a.label} className="flex items-center justify-between rounded-xl border p-3">
                  <div><div className="text-[10px] font-medium">{a.label}</div><div className="text-[8px] text-muted-foreground">{a.desc}</div></div>
                  <Switch defaultChecked={a.enabled} />
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Saved Searches & Alerts" className="!rounded-2xl">
            <div className="space-y-1.5">
              {[{ label: 'Senior Frontend — Remote — $150k+', matches: 12 }, { label: 'Staff Engineer — Any Location', matches: 5 }, { label: 'Engineering Manager — SF/NYC', matches: 3 }].map(s => (
                <div key={s.label} className="flex items-center gap-2 px-2 py-1.5 rounded-xl border">
                  <Bell className="h-3 w-3 text-accent shrink-0" />
                  <span className="text-[9px] flex-1">{s.label}</span>
                  <Badge variant="secondary" className="text-[7px]">{s.matches} matches</Badge>
                  <Button variant="ghost" size="sm" className="h-5 text-[7px]"><X className="h-2 w-2" /></Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl w-full mt-2 gap-1"><Plus className="h-3 w-3" />Create Alert</Button>
          </SectionCard>
        </div>
      )}

      {/* ── Job Match Detail Drawer ── */}
      <Sheet open={!!selectedJob} onOpenChange={() => setSelectedJobId(null)}>
        <SheetContent className="w-[460px] overflow-y-auto p-0">
          <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-accent" />Match Details</SheetTitle></SheetHeader>
          {selectedJob && (
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-accent/20 rounded-xl"><AvatarFallback className="text-sm bg-accent/10 text-accent font-bold rounded-xl">{selectedJob.companyAvatar}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <h3 className="text-[13px] font-bold">{selectedJob.title}</h3>
                  <p className="text-[10px] text-muted-foreground">{selectedJob.company} · {selectedJob.location}</p>
                  <p className="text-[10px] font-medium mt-0.5">{selectedJob.salary} · {selectedJob.type}</p>
                </div>
                <div className="text-center">
                  <div className={cn('text-2xl font-bold', MATCH_COLORS[selectedJob.matchLabel])}>{selectedJob.matchScore}%</div>
                  <div className={cn('text-[9px] font-semibold capitalize', MATCH_COLORS[selectedJob.matchLabel])}>{selectedJob.matchLabel} Match</div>
                </div>
              </div>
              <SectionCard title="Why This Matches" icon={<Sparkles className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
                <div className="space-y-1.5">
                  {selectedJob.matchReasons.map(r => (
                    <div key={r} className="flex items-center gap-2 text-[10px]"><CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))] shrink-0" /><span>{r}</span></div>
                  ))}
                </div>
              </SectionCard>
              <div className="flex flex-col gap-1.5 pt-2 border-t">
                <Button size="sm" className="h-7 text-[10px] gap-1 w-full rounded-xl" onClick={() => toast.success('Application started')}><ArrowRight className="h-3 w-3" />Apply Now</Button>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] gap-1 rounded-xl"><Heart className="h-3 w-3" />Save</Button>
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] gap-1 rounded-xl" asChild><Link to="/profile"><ExternalLink className="h-3 w-3" />Company</Link></Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default CandidateAvailabilityPage;
