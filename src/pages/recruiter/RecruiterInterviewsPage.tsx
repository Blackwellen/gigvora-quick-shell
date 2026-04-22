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
  Calendar, Clock, Video, Phone, MapPin, Users, Plus,
  X, Search, Filter, MoreHorizontal, Send, Award, Star,
  CheckCircle2, XCircle, AlertTriangle, BarChart3, FileText,
  Building2, Briefcase, Eye, MessageSquare, ExternalLink,
  RefreshCw, Loader2, Sparkles, Globe, Zap, ArrowRight,
  CalendarDays, UserCheck, ChevronRight, ThumbsUp, ThumbsDown,
  Clipboard, ListChecks, Scale, Download, Mail, Settings,
  type LucideIcon,
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */
type InterviewStatus = 'upcoming' | 'completed' | 'cancelled' | 'no-show';
type InterviewType = 'video' | 'phone' | 'onsite';
type PageTab = 'planner' | 'calendar' | 'scorecards' | 'feedback' | 'decisions' | 'reschedule';

interface Panelist { name: string; role: string; avatar: string; scorecardSubmitted: boolean; }
interface ScorecardDim { label: string; score: number; maxScore: number; }

interface Interview {
  id: string; candidateName: string; candidateAvatar: string; candidateHeadline: string;
  jobTitle: string; date: string; time: string; duration: string; type: InterviewType;
  status: InterviewStatus; round: number; totalRounds: number; panelists: Panelist[];
  location?: string; meetingLink?: string; timezone: string; notes: string;
  scorecard?: ScorecardDim[]; overallScore?: number;
  recommendation?: 'strong-yes' | 'yes' | 'neutral' | 'no' | 'strong-no';
}

const STATUS_CFG: Record<InterviewStatus, { label: string; badge: 'healthy' | 'caution' | 'blocked' | 'degraded' | 'pending' | 'live' }> = {
  upcoming: { label: 'Upcoming', badge: 'healthy' },
  completed: { label: 'Completed', badge: 'pending' },
  cancelled: { label: 'Cancelled', badge: 'blocked' },
  'no-show': { label: 'No-Show', badge: 'caution' },
};

const TYPE_ICON: Record<InterviewType, React.FC<{ className?: string }>> = { video: Video, phone: Phone, onsite: MapPin };

const REC_MAP: Record<string, { label: string; color: string }> = {
  'strong-yes': { label: 'Strong Yes', color: 'text-[hsl(var(--state-healthy))]' },
  yes: { label: 'Yes', color: 'text-[hsl(var(--state-healthy))]' },
  neutral: { label: 'Neutral', color: 'text-muted-foreground' },
  no: { label: 'No', color: 'text-[hsl(var(--state-caution))]' },
  'strong-no': { label: 'Strong No', color: 'text-[hsl(var(--state-blocked))]' },
};

const SCORE_DIMS = ['Technical Skills', 'Problem Solving', 'Communication', 'Culture Fit', 'Leadership'];

/* ═══════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════ */
const MOCK: Interview[] = [
  { id:'iv1', candidateName:'Elena Kowalski', candidateAvatar:'EK', candidateHeadline:'Senior Full-Stack Engineer · Ex-Google', jobTitle:'Senior Frontend Engineer', date:'Today', time:'2:00 PM', duration:'45 min', type:'video', status:'upcoming', round:2, totalRounds:3, timezone:'PST', panelists:[{name:'Marcus Johnson',role:'Hiring Manager',avatar:'MJ',scorecardSubmitted:false},{name:'David Torres',role:'Tech Lead',avatar:'DT',scorecardSubmitted:false}], meetingLink:'https://meet.gigvora.com/iv1', notes:'Focus on system design and React architecture.' },
  { id:'iv2', candidateName:'Wei Liu', candidateAvatar:'WL', candidateHeadline:'DevOps Engineer · AWS Certified', jobTitle:'DevOps Engineer', date:'Tomorrow', time:'10:00 AM', duration:'30 min', type:'phone', status:'upcoming', round:1, totalRounds:3, timezone:'EST', panelists:[{name:'David Torres',role:'Tech Lead',avatar:'DT',scorecardSubmitted:false}], notes:'Initial screen — focus on Terraform and CI/CD.' },
  { id:'iv3', candidateName:'Ryan Park', candidateAvatar:'RP', candidateHeadline:'Frontend Developer · React Specialist', jobTitle:'Senior Frontend Engineer', date:'Apr 14', time:'3:00 PM', duration:'60 min', type:'video', status:'upcoming', round:3, totalRounds:3, timezone:'PST', panelists:[{name:'Marcus Johnson',role:'Hiring Manager',avatar:'MJ',scorecardSubmitted:false},{name:'Sarah Chen',role:'VP Engineering',avatar:'SC',scorecardSubmitted:false}], meetingLink:'https://meet.gigvora.com/iv3', notes:'Final round — culture fit and leadership.' },
  { id:'iv4', candidateName:'Anna Müller', candidateAvatar:'AM', candidateHeadline:'Product Designer · Design Systems', jobTitle:'Product Designer', date:'Apr 16', time:'11:00 AM', duration:'45 min', type:'onsite', status:'upcoming', round:2, totalRounds:3, timezone:'CET', location:'HQ — Room 4B', panelists:[{name:'Sarah Chen',role:'VP Engineering',avatar:'SC',scorecardSubmitted:false},{name:'Lisa Park',role:'Design Lead',avatar:'LP',scorecardSubmitted:false}], notes:'Portfolio review and whiteboard exercise.' },
  { id:'iv5', candidateName:'Carlos Diaz', candidateAvatar:'CD', candidateHeadline:'Backend Engineer · Node.js & Go', jobTitle:'Senior Frontend Engineer', date:'Apr 8', time:'1:00 PM', duration:'45 min', type:'video', status:'completed', round:2, totalRounds:3, timezone:'PST', panelists:[{name:'Marcus Johnson',role:'Hiring Manager',avatar:'MJ',scorecardSubmitted:true},{name:'David Torres',role:'Tech Lead',avatar:'DT',scorecardSubmitted:true}], notes:'Strong technical performance.', scorecard:[{label:'Technical Skills',score:4,maxScore:5},{label:'Problem Solving',score:5,maxScore:5},{label:'Communication',score:4,maxScore:5},{label:'Culture Fit',score:3,maxScore:5},{label:'Leadership',score:3,maxScore:5}], overallScore:4, recommendation:'yes' },
  { id:'iv6', candidateName:'Sophia Lang', candidateAvatar:'SL', candidateHeadline:'Engineering Manager · Platform Teams', jobTitle:'Engineering Manager', date:'Apr 5', time:'2:00 PM', duration:'60 min', type:'video', status:'completed', round:3, totalRounds:3, timezone:'CET', panelists:[{name:'Sarah Chen',role:'VP Engineering',avatar:'SC',scorecardSubmitted:true},{name:'Marcus Johnson',role:'Hiring Manager',avatar:'MJ',scorecardSubmitted:false}], notes:'Excellent leadership. Awaiting Marcus scorecard.', scorecard:[{label:'Technical Skills',score:4,maxScore:5},{label:'Problem Solving',score:4,maxScore:5},{label:'Communication',score:5,maxScore:5},{label:'Culture Fit',score:5,maxScore:5},{label:'Leadership',score:5,maxScore:5}], overallScore:5, recommendation:'strong-yes' },
  { id:'iv7', candidateName:'James Rodriguez', candidateAvatar:'JR', candidateHeadline:'DevOps Lead · SRE', jobTitle:'DevOps Engineer', date:'Apr 3', time:'11:00 AM', duration:'30 min', type:'phone', status:'cancelled', round:1, totalRounds:3, timezone:'CST', panelists:[{name:'David Torres',role:'Tech Lead',avatar:'DT',scorecardSubmitted:false}], notes:'Candidate requested reschedule.' },
  { id:'iv8', candidateName:'Priya Sharma', candidateAvatar:'PS', candidateHeadline:'ML Engineer · NLP', jobTitle:'ML Engineer', date:'Apr 2', time:'9:00 AM', duration:'45 min', type:'video', status:'no-show', round:1, totalRounds:3, timezone:'GMT', panelists:[{name:'Marcus Johnson',role:'Hiring Manager',avatar:'MJ',scorecardSubmitted:false}], notes:'Candidate did not join. Follow-up sent.' },
];

/* ═══════════════════════════════════════════════════════════
   Schedule Interview Modal (multi-step)
   ═══════════════════════════════════════════════════════════ */
const ScheduleModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [step, setStep] = useState<'details' | 'panel' | 'confirm'>('details');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative flex justify-center items-start pt-[6vh] px-4">
        <div className="w-full max-w-lg bg-card rounded-2xl border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="font-semibold text-lg">Schedule Interview</h2>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2 mb-4">
              {['details','panel','confirm'].map((s,i) => (
                <React.Fragment key={s}>
                  <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors', step===s?'border-accent bg-accent text-accent-foreground':i<['details','panel','confirm'].indexOf(step)?'border-accent bg-accent/10 text-accent':'border-muted text-muted-foreground')}>{i+1}</div>
                  {i<2&&<div className={cn('flex-1 h-0.5',i<['details','panel','confirm'].indexOf(step)?'bg-accent':'bg-muted')}/>}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="p-6 max-h-[55vh] overflow-y-auto space-y-4">
            {step==='details'&&(<>
              <div><label className="text-xs font-medium mb-1 block">Candidate *</label><input className="w-full h-9 rounded-xl border bg-background px-3 text-sm" placeholder="Search candidate..." /></div>
              <div><label className="text-xs font-medium mb-1 block">Job Position *</label><select className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>Senior Frontend Engineer</option><option>DevOps Engineer</option><option>Product Designer</option><option>ML Engineer</option></select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium mb-1 block">Date *</label><input type="date" className="w-full h-9 rounded-xl border bg-background px-3 text-sm" /></div>
                <div><label className="text-xs font-medium mb-1 block">Time *</label><input type="time" className="w-full h-9 rounded-xl border bg-background px-3 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium mb-1 block">Duration</label><select className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>30 min</option><option>45 min</option><option>60 min</option><option>90 min</option></select></div>
                <div><label className="text-xs font-medium mb-1 block">Type</label><select className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>Video</option><option>Phone</option><option>On-site</option></select></div>
              </div>
              <div><label className="text-xs font-medium mb-1 block">Round</label><select className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>Round 1 — Initial Screen</option><option>Round 2 — Technical</option><option>Round 3 — Final</option></select></div>
            </>)}
            {step==='panel'&&(<>
              <div><label className="text-xs font-medium mb-1 block">Interview Panel *</label><input className="w-full h-9 rounded-xl border bg-background px-3 text-sm" placeholder="Search panelists..." /></div>
              <div className="space-y-2">
                {[{name:'Marcus Johnson',role:'Hiring Manager',avatar:'MJ'},{name:'David Torres',role:'Tech Lead',avatar:'DT'},{name:'Sarah Chen',role:'VP Engineering',avatar:'SC'}].map(p=>(
                  <div key={p.name} className="flex items-center gap-2 p-2 rounded-xl border">
                    <Avatar className="h-7 w-7"><AvatarFallback className="text-[9px] bg-accent/10 text-accent">{p.avatar}</AvatarFallback></Avatar>
                    <div className="flex-1"><div className="text-xs font-medium">{p.name}</div><div className="text-[9px] text-muted-foreground">{p.role}</div></div>
                    <input type="checkbox" className="rounded" defaultChecked={p.name!=='Sarah Chen'} />
                  </div>
                ))}
              </div>
              <div><label className="text-xs font-medium mb-1 block">Notes for Panel</label><textarea className="w-full h-16 rounded-xl border bg-background px-3 py-2 text-sm resize-none" placeholder="Focus areas, questions..." /></div>
            </>)}
            {step==='confirm'&&(
              <div className="space-y-3">
                <div className="rounded-xl border p-3 bg-muted/30 text-xs space-y-1.5">
                  {[['Candidate','—'],['Job','Senior Frontend Engineer'],['Date & Time','—'],['Type','Video'],['Panelists','2 selected']].map(([k,v])=>(<div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>))}
                </div>
                <div className="rounded-xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3 flex items-center gap-2 text-[10px]">
                  <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]" />Calendar invites will be sent to candidate and panelists.
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between px-6 py-4 border-t">
            {step!=='details'?<Button variant="outline" onClick={()=>setStep(step==='confirm'?'panel':'details')}>Back</Button>:<div/>}
            {step==='confirm'?<Button onClick={()=>{toast.success('Interview scheduled!');onClose();}}><Send className="h-3 w-3 mr-1"/>Send Invites</Button>:<Button onClick={()=>setStep(step==='details'?'panel':'confirm')}>Continue</Button>}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Scorecard Form Component
   ═══════════════════════════════════════════════════════════ */
const ScorecardForm: React.FC<{ interview: Interview; onClose: () => void }> = ({ interview, onClose }) => {
  const [scores, setScores] = useState<Record<string,number>>(
    interview.scorecard ? Object.fromEntries(interview.scorecard.map(d=>[d.label,d.score])) : Object.fromEntries(SCORE_DIMS.map(d=>[d,0]))
  );
  const [rec, setRec] = useState<string>(interview.recommendation||'');
  const [notes, setNotes] = useState('');
  const readOnly = interview.status==='completed' && interview.scorecard!==undefined;
  const avg = Object.values(scores).filter(v=>v>0);
  const avgScore = avg.length ? (avg.reduce((a,b)=>a+b,0)/avg.length).toFixed(1) : '—';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1"><Award className="h-4 w-4 text-accent"/>Interview Scorecard</h3>
        <div className="flex items-center gap-2">
          {readOnly && <Badge variant="secondary" className="text-[8px]">Submitted</Badge>}
          <span className="text-sm font-bold text-accent">{avgScore}<span className="text-[8px] text-muted-foreground">/5</span></span>
        </div>
      </div>
      <div className="space-y-3">
        {SCORE_DIMS.map(dim=>(
          <div key={dim}>
            <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-medium">{dim}</span><span className="text-[8px] text-muted-foreground">{scores[dim]||0}/5</span></div>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(n=>(
                <button key={n} disabled={readOnly} onClick={()=>setScores(p=>({...p,[dim]:n}))} className={cn('h-7 flex-1 rounded-lg text-[10px] font-semibold transition-all',n<=(scores[dim]||0)?'bg-accent text-accent-foreground':'bg-muted text-muted-foreground',!readOnly&&'hover:bg-accent/70 hover:text-accent-foreground')}>{n}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div>
        <label className="text-[10px] font-medium mb-1 block">Recommendation</label>
        <div className="flex flex-wrap gap-1">
          {(['strong-yes','yes','neutral','no','strong-no'] as const).map(r=>(
            <button key={r} disabled={readOnly} onClick={()=>setRec(r)} className={cn('px-2.5 py-1.5 rounded-xl text-[9px] font-medium transition-all',rec===r?'bg-accent text-accent-foreground':'bg-muted text-muted-foreground',!readOnly&&'hover:bg-muted/70')}>{REC_MAP[r].label}</button>
          ))}
        </div>
      </div>
      {!readOnly&&(<>
        <div><label className="text-[10px] font-medium mb-1 block">Notes</label><Textarea value={notes} onChange={e=>setNotes(e.target.value)} className="text-[10px] min-h-[50px] rounded-xl" placeholder="Key observations, strengths, concerns..."/></div>
        <Button size="sm" className="h-7 text-[10px] w-full rounded-xl" onClick={()=>{toast.success('Scorecard submitted');onClose();}}><CheckCircle2 className="h-3 w-3 mr-1"/>Submit Scorecard</Button>
      </>)}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const RecruiterInterviewsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PageTab>('planner');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scorecardDrawerId, setScorecardDrawerId] = useState<string|null>(null);
  const [plannerFilter, setPlannerFilter] = useState<'all'|InterviewStatus>('all');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const filtered = useMemo(()=>{
    let list = [...MOCK];
    if (activeTab==='planner') {
      if (plannerFilter!=='all') list = list.filter(iv=>plannerFilter==='cancelled'?(iv.status==='cancelled'||iv.status==='no-show'):iv.status===plannerFilter);
    } else if (activeTab==='scorecards') {
      list = list.filter(iv=>iv.status==='completed');
    } else if (activeTab==='reschedule') {
      list = list.filter(iv=>iv.status==='cancelled'||iv.status==='no-show');
    }
    if (searchQuery){const q=searchQuery.toLowerCase();list=list.filter(iv=>iv.candidateName.toLowerCase().includes(q)||iv.jobTitle.toLowerCase().includes(q));}
    return list;
  },[activeTab,plannerFilter,searchQuery]);

  const selected = MOCK.find(iv=>iv.id===selectedId);
  const scorecardInterview = MOCK.find(iv=>iv.id===scorecardDrawerId);
  const upcomingCount = MOCK.filter(iv=>iv.status==='upcoming').length;
  const completedCount = MOCK.filter(iv=>iv.status==='completed').length;
  const pendingScorecardsCount = MOCK.filter(iv=>iv.status==='completed').reduce((s,iv)=>s+iv.panelists.filter(p=>!p.scorecardSubmitted).length,0);
  const toggleCompare = (id:string) => setCompareIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id].slice(-3));

  const TABS: {id:PageTab;label:string;icon:LucideIcon;count?:number}[] = [
    {id:'planner',label:'Planner',icon:ListChecks,count:MOCK.length},
    {id:'calendar',label:'Calendar',icon:Calendar,count:upcomingCount},
    {id:'scorecards',label:'Scorecards',icon:Award,count:completedCount},
    {id:'feedback',label:'Feedback Summary',icon:MessageSquare},
    {id:'decisions',label:'Decision Panel',icon:Scale},
    {id:'reschedule',label:'Reschedule / Cancel',icon:RefreshCw,count:MOCK.filter(iv=>iv.status==='cancelled'||iv.status==='no-show').length},
  ];

  /* ── Top Strip ── */
  const topStrip = (<>
    <div className="flex items-center gap-2.5">
      <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><CalendarDays className="h-3.5 w-3.5 text-accent"/></div>
      <span className="text-xs font-bold">Interview Workstation</span>
      <StatusBadge status="live" label={`${upcomingCount} Upcoming`}/>
      {pendingScorecardsCount>0&&<StatusBadge status="caution" label={`${pendingScorecardsCount} Pending Scores`}/>}
    </div>
    <div className="flex-1"/>
    <select className="h-7 rounded-xl border bg-background px-2 text-[9px]">
      <option>All Jobs</option><option>Senior Frontend Engineer</option><option>DevOps Engineer</option><option>Product Designer</option>
    </select>
    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3"/>Export</Button>
    <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={()=>setScheduleOpen(true)}><Plus className="h-3 w-3"/>Schedule</Button>
  </>);

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <KPIBand className="!grid-cols-2">
        <KPICard label="Today" value={MOCK.filter(iv=>iv.date==='Today'&&iv.status==='upcoming').length} change="interviews" trend="neutral"/>
        <KPICard label="This Week" value={upcomingCount} trend="up"/>
      </KPIBand>
      <KPIBand className="!grid-cols-2">
        <KPICard label="Avg Score" value="4.1" change="/5" trend="up"/>
        <KPICard label="No-Show Rate" value="5%" trend="down" change="-2% vs prior"/>
      </KPIBand>

      <SectionCard title="Today's Schedule" icon={<Clock className="h-3.5 w-3.5 text-accent"/>} className="!rounded-2xl">
        <div className="space-y-1.5">
          {MOCK.filter(iv=>iv.date==='Today'&&iv.status==='upcoming').map(iv=>{const TI=TYPE_ICON[iv.type];return(
            <button key={iv.id} onClick={()=>setSelectedId(iv.id)} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl text-left hover:bg-muted/50 transition-all group">
              <TI className="h-3 w-3 text-accent shrink-0"/>
              <div className="min-w-0 flex-1"><div className="text-[9px] font-medium truncate group-hover:text-accent transition-colors">{iv.candidateName}</div><div className="text-[8px] text-muted-foreground">{iv.time} · {iv.duration}</div></div>
            </button>
          );})}
          {MOCK.filter(iv=>iv.date==='Today'&&iv.status==='upcoming').length===0&&<div className="text-[9px] text-muted-foreground text-center py-2">No interviews today</div>}
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            {label:'Schedule interview',icon:Plus,action:()=>setScheduleOpen(true)},
            {label:'Remind pending scorecards',icon:Award,action:()=>toast.success('Reminders sent')},
            {label:'Export schedule',icon:FileText,action:()=>toast.info('Exported')},
            {label:'View pipeline',icon:ArrowRight,action:()=>{}},
          ].map(a=>(
            <button key={a.label} onClick={a.action} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl text-[9px] hover:bg-muted/30 transition-all font-medium group">
              <a.icon className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors"/><span className="group-hover:text-accent transition-colors">{a.label}</span>
              <ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground"/>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Panelist Load" icon={<Users className="h-3.5 w-3.5 text-accent"/>} className="!rounded-2xl">
        <div className="space-y-1.5">
          {[{name:'Marcus Johnson',avatar:'MJ',load:4},{name:'David Torres',avatar:'DT',load:3},{name:'Sarah Chen',avatar:'SC',load:2},{name:'Lisa Park',avatar:'LP',load:1}].map(p=>(
            <div key={p.name} className="flex items-center gap-2">
              <Avatar className="h-5 w-5"><AvatarFallback className="text-[6px] bg-accent/10 text-accent font-bold">{p.avatar}</AvatarFallback></Avatar>
              <span className="text-[8px] flex-1">{p.name}</span>
              <div className="flex-1"><Progress value={p.load*25} className="h-1"/></div>
              <span className="text-[8px] font-bold w-3 text-right">{p.load}</span>
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
        <span className="text-[10px] font-bold flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5 text-accent"/>Interview Analytics · Last 30 days</span>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {[
          {label:'Total Conducted',value:String(completedCount)},
          {label:'Avg Duration',value:'42 min'},
          {label:'No-Show Rate',value:'5%'},
          {label:'Avg Score',value:'4.1/5'},
          {label:'Scorecards On-Time',value:'78%'},
          {label:'Time-to-Decision',value:'1.8d'},
        ].map(s=>(<div key={s.label} className="text-center"><div className="text-sm font-bold">{s.value}</div><div className="text-[8px] text-muted-foreground">{s.label}</div></div>))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      {/* Banners */}
      {MOCK.some(iv=>iv.date==='Today'&&iv.status==='upcoming'&&iv.panelists.length>1)&&(
        <div className="rounded-2xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-2.5 flex items-center gap-3 mb-3">
          <Globe className="h-4 w-4 text-[hsl(var(--state-caution))] shrink-0"/>
          <div className="flex-1"><div className="text-[10px] font-medium">Timezone Mismatch Detected</div><div className="text-[9px] text-muted-foreground">1 upcoming interview has panelists in conflicting timezones.</div></div>
          <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">Review</Button>
        </div>
      )}
      {pendingScorecardsCount>0&&(
        <div className="rounded-2xl border border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.05)] p-2.5 flex items-center gap-3 mb-3">
          <Award className="h-4 w-4 text-[hsl(var(--state-blocked))] shrink-0"/>
          <div className="flex-1"><div className="text-[10px] font-medium">{pendingScorecardsCount} Pending Scorecard{pendingScorecardsCount>1?'s':''}</div><div className="text-[9px] text-muted-foreground">Some panelists haven't submitted their scorecards.</div></div>
          <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg" onClick={()=>toast.success('Reminders sent')}>Remind</Button>
        </div>
      )}

      {/* Compare Bar */}
      {compareIds.length>0&&(
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-2.5 flex items-center gap-3 mb-3">
          <Scale className="h-4 w-4 text-accent shrink-0"/>
          <span className="text-[10px] font-semibold">{compareIds.length} selected for comparison</span>
          <div className="flex gap-1">{compareIds.map(id=>{const iv=MOCK.find(x=>x.id===id);return iv?<Badge key={id} variant="secondary" className="text-[7px]">{iv.candidateName}</Badge>:null;})}</div>
          <div className="flex-1"/>
          <Button size="sm" className="h-6 text-[8px] rounded-lg" disabled={compareIds.length<2} onClick={()=>{setActiveTab('decisions');toast.info('Opening comparison');}}>Compare Scorecards</Button>
          <Button variant="ghost" size="sm" className="h-6 text-[8px]" onClick={()=>setCompareIds([])}><X className="h-3 w-3"/></Button>
        </div>
      )}

      {/* Tab Nav */}
      <div className="flex items-center gap-0.5 p-1 rounded-2xl bg-muted/30 mb-4 overflow-x-auto">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} className={cn('flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-semibold rounded-xl transition-all duration-200 shrink-0',activeTab===t.id?'bg-background shadow-sm text-accent':'text-muted-foreground hover:text-foreground hover:bg-muted/30')}>
            <t.icon className="h-3 w-3"/>{t.label}
            {t.count!==undefined&&<span className={cn('text-[7px] rounded-full px-1.5',activeTab===t.id?'bg-accent/10':'bg-muted')}>{t.count}</span>}
          </button>
        ))}
        <div className="flex-1"/>
        <div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground"/><input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search..." className="h-7 pl-7 pr-2 w-36 rounded-xl border bg-background text-[9px]"/></div>
      </div>

      {/* ═══ PLANNER TAB ═══ */}
      {activeTab==='planner'&&(<>
        <div className="flex gap-1.5 mb-3">
          {(['all','upcoming','completed','cancelled'] as const).map(f=>(
            <button key={f} onClick={()=>setPlannerFilter(f)} className={cn('px-2.5 py-1 rounded-xl text-[9px] font-semibold transition-all capitalize',plannerFilter===f?'bg-accent text-accent-foreground':'bg-muted/40 text-muted-foreground hover:bg-muted/60')}>
              {f==='cancelled'?'Cancelled / No-Show':f} ({f==='all'?MOCK.length:f==='cancelled'?MOCK.filter(iv=>iv.status==='cancelled'||iv.status==='no-show').length:MOCK.filter(iv=>iv.status===f).length})
            </button>
          ))}
        </div>
        {filtered.length===0?(
          <div className="rounded-2xl border p-8 text-center"><CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-3"/><div className="text-sm font-medium mb-1">No interviews found</div><Button size="sm" className="h-7 text-[10px] rounded-xl" onClick={()=>setScheduleOpen(true)}><Plus className="h-3 w-3 mr-1"/>Schedule</Button></div>
        ):(
          <div className="rounded-2xl border overflow-hidden">
            <div className="grid grid-cols-[32px_1fr_110px_65px_55px_75px_90px] gap-2 px-3 py-2 bg-muted/50 border-b text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span/><span>Interview</span><span>Date & Time</span><span>Type</span><span>Round</span><span>Status</span><span className="text-right">Actions</span>
            </div>
            {filtered.map(iv=>{const cfg=STATUS_CFG[iv.status];const TI=TYPE_ICON[iv.type];return(
              <div key={iv.id} onClick={()=>setSelectedId(iv.id)} className={cn('grid grid-cols-[32px_1fr_110px_65px_55px_75px_90px] gap-2 px-3 py-2.5 border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer items-center',iv.status==='no-show'&&'bg-[hsl(var(--state-caution)/0.02)]',compareIds.includes(iv.id)&&'bg-accent/5')}>
                <input type="checkbox" checked={compareIds.includes(iv.id)} onChange={()=>toggleCompare(iv.id)} onClick={e=>e.stopPropagation()} className="rounded h-3 w-3"/>
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-7 w-7 ring-1 ring-muted/30"><AvatarFallback className="text-[9px] bg-accent/10 text-accent font-bold">{iv.candidateAvatar}</AvatarFallback></Avatar>
                  <div className="min-w-0"><div className="text-[10px] font-medium truncate">{iv.candidateName}</div><div className="text-[8px] text-muted-foreground truncate">{iv.jobTitle}</div></div>
                </div>
                <div className="text-[9px]"><div className="font-medium">{iv.date}</div><div className="text-muted-foreground">{iv.time} · {iv.duration}</div></div>
                <div className="flex items-center gap-1 text-[9px]"><TI className="h-3 w-3 text-muted-foreground"/><span className="capitalize">{iv.type}</span></div>
                <div className="text-[9px] text-center">{iv.round}/{iv.totalRounds}</div>
                <StatusBadge status={cfg.badge} label={cfg.label}/>
                <div className="flex items-center justify-end gap-0.5">
                  {iv.status==='upcoming'&&iv.meetingLink&&<Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e=>{e.stopPropagation();toast.success('Joining...');}}><Video className="h-2 w-2 mr-0.5"/>Join</Button>}
                  {iv.status==='completed'&&<Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e=>{e.stopPropagation();setScorecardDrawerId(iv.id);}}><Award className="h-2 w-2 mr-0.5"/>Score</Button>}
                  {iv.status==='cancelled'&&<Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e=>{e.stopPropagation();toast.info('Rescheduling...');}}><RefreshCw className="h-2 w-2 mr-0.5"/>Resched.</Button>}
                </div>
              </div>
            );})}
          </div>
        )}
      </>)}

      {/* ═══ CALENDAR TAB ═══ */}
      {activeTab==='calendar'&&(
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold">Week View · Apr 13–19</h3>
            <div className="flex gap-1"><Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">← Prev</Button><Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">Today</Button><Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">Next →</Button></div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {['Mon 14','Tue 15','Wed 16','Thu 17','Fri 18'].map((day,di)=>{
              const dayInterviews = di===0?MOCK.filter(iv=>iv.status==='upcoming').slice(0,1):di===2?MOCK.filter(iv=>iv.status==='upcoming').slice(1,2):di===3?MOCK.filter(iv=>iv.status==='upcoming').slice(2,3):[];
              return(
                <div key={day} className="rounded-2xl border bg-card min-h-[180px]">
                  <div className="px-2.5 py-1.5 border-b bg-muted/30 text-[9px] font-semibold text-center">{day}</div>
                  <div className="p-1.5 space-y-1">
                    {dayInterviews.map(iv=>{const TI=TYPE_ICON[iv.type];return(
                      <button key={iv.id} onClick={()=>setSelectedId(iv.id)} className="w-full rounded-xl border p-2 text-left hover:shadow-sm transition-all bg-accent/5">
                        <div className="flex items-center gap-1 mb-0.5"><TI className="h-2.5 w-2.5 text-accent"/><span className="text-[8px] font-semibold">{iv.time}</span></div>
                        <div className="text-[8px] font-medium truncate">{iv.candidateName}</div>
                        <div className="text-[7px] text-muted-foreground truncate">{iv.jobTitle}</div>
                        <div className="flex items-center gap-0.5 mt-1">
                          {iv.panelists.slice(0,3).map(p=>(<Avatar key={p.name} className="h-4 w-4 -ml-1 first:ml-0 ring-1 ring-background"><AvatarFallback className="text-[5px] bg-accent/10 text-accent">{p.avatar}</AvatarFallback></Avatar>))}
                        </div>
                      </button>
                    );})}
                    {dayInterviews.length===0&&<div className="text-[8px] text-muted-foreground text-center py-4 italic">No interviews</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ SCORECARDS TAB ═══ */}
      {activeTab==='scorecards'&&(
        <div className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            {filtered.map(iv=>(
              <div key={iv.id} className="rounded-2xl border p-3 hover:shadow-md transition-all cursor-pointer" onClick={()=>setScorecardDrawerId(iv.id)}>
                <div className="flex items-start gap-2.5 mb-2">
                  <Avatar className="h-9 w-9 ring-1 ring-muted/30"><AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">{iv.candidateAvatar}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold">{iv.candidateName}</div>
                    <div className="text-[8px] text-muted-foreground">{iv.jobTitle} · Round {iv.round}</div>
                    <div className="text-[7px] text-muted-foreground">{iv.date} · {iv.time}</div>
                  </div>
                  {iv.recommendation&&<span className={cn('text-[10px] font-bold',REC_MAP[iv.recommendation].color)}>{REC_MAP[iv.recommendation].label}</span>}
                </div>
                {iv.scorecard&&(
                  <div className="space-y-1 mb-2">
                    {iv.scorecard.map(d=>(
                      <div key={d.label} className="flex items-center gap-2">
                        <span className="text-[7px] w-20 text-muted-foreground">{d.label}</span>
                        <div className="flex-1"><Progress value={(d.score/d.maxScore)*100} className="h-1"/></div>
                        <span className="text-[7px] font-bold w-5 text-right">{d.score}/{d.maxScore}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {iv.panelists.map(p=>(
                      <div key={p.name} className="flex items-center gap-0.5">
                        <Avatar className="h-4 w-4"><AvatarFallback className="text-[5px] bg-accent/10 text-accent">{p.avatar}</AvatarFallback></Avatar>
                        {p.scorecardSubmitted?<CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]"/>:<Clock className="h-2.5 w-2.5 text-[hsl(var(--state-caution))]"/>}
                      </div>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" className="h-5 text-[7px] rounded-lg gap-0.5"><Award className="h-2 w-2"/>View Scorecard</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ FEEDBACK SUMMARY TAB ═══ */}
      {activeTab==='feedback'&&(
        <div className="space-y-3">
          <SectionCard title="Aggregate Feedback" icon={<BarChart3 className="h-3.5 w-3.5 text-accent"/>} className="!rounded-2xl">
            <div className="space-y-2">
              {SCORE_DIMS.map(dim=>{
                const scores = MOCK.filter(iv=>iv.scorecard).flatMap(iv=>iv.scorecard!.filter(d=>d.label===dim).map(d=>d.score));
                const avg = scores.length?(scores.reduce((a,b)=>a+b,0)/scores.length):0;
                return(
                  <div key={dim} className="flex items-center gap-2">
                    <span className="text-[9px] w-28">{dim}</span>
                    <div className="flex-1"><Progress value={avg*20} className="h-1.5"/></div>
                    <span className="text-[9px] font-bold w-8 text-right">{avg.toFixed(1)}/5</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Recommendation Distribution" icon={<ThumbsUp className="h-3.5 w-3.5 text-accent"/>} className="!rounded-2xl">
            <div className="flex gap-2">
              {(['strong-yes','yes','neutral','no','strong-no'] as const).map(r=>{
                const count = MOCK.filter(iv=>iv.recommendation===r).length;
                return(
                  <div key={r} className="flex-1 rounded-xl border p-2 text-center">
                    <div className={cn('text-sm font-bold',REC_MAP[r].color)}>{count}</div>
                    <div className="text-[7px] text-muted-foreground">{REC_MAP[r].label}</div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Panelist Activity" icon={<Users className="h-3.5 w-3.5 text-accent"/>} className="!rounded-2xl">
            <div className="grid grid-cols-2 gap-2">
              {[{name:'Marcus Johnson',avatar:'MJ',conducted:4,scored:3,avgScore:'3.8'},{name:'David Torres',avatar:'DT',conducted:3,scored:3,avgScore:'4.2'},{name:'Sarah Chen',avatar:'SC',conducted:3,scored:2,avgScore:'4.6'},{name:'Lisa Park',avatar:'LP',conducted:1,scored:0,avgScore:'—'}].map(p=>(
                <div key={p.name} className="rounded-xl border p-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Avatar className="h-6 w-6"><AvatarFallback className="text-[7px] bg-accent/10 text-accent font-bold">{p.avatar}</AvatarFallback></Avatar>
                    <div><div className="text-[9px] font-semibold">{p.name}</div></div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[7px] text-muted-foreground">
                    <div><div className="font-bold text-foreground">{p.conducted}</div>Conducted</div>
                    <div><div className="font-bold text-foreground">{p.scored}</div>Scored</div>
                    <div><div className="font-bold text-foreground">{p.avgScore}</div>Avg</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ DECISION PANEL TAB ═══ */}
      {activeTab==='decisions'&&(
        <div className="space-y-3">
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-3 flex items-center gap-2 text-[10px]">
            <Scale className="h-4 w-4 text-accent shrink-0"/>
            <span className="font-semibold">Decision Panel</span>
            <span className="text-muted-foreground">— Compare candidates side-by-side to make a hiring decision.</span>
          </div>
          {MOCK.filter(iv=>iv.status==='completed'&&iv.scorecard).length===0?(
            <div className="rounded-2xl border p-8 text-center"><Scale className="h-8 w-8 text-muted-foreground mx-auto mb-3"/><div className="text-sm font-medium">No completed scorecards to compare</div></div>
          ):(
            <div className="grid md:grid-cols-2 gap-3">
              {MOCK.filter(iv=>iv.status==='completed'&&iv.scorecard).map(iv=>(
                <div key={iv.id} className={cn('rounded-2xl border p-3 transition-all',compareIds.includes(iv.id)?'ring-1 ring-accent bg-accent/5':'hover:shadow-md')}>
                  <div className="flex items-start gap-2.5 mb-3">
                    <Avatar className="h-10 w-10 ring-2 ring-accent/20"><AvatarFallback className="text-[9px] bg-accent/10 text-accent font-bold">{iv.candidateAvatar}</AvatarFallback></Avatar>
                    <div className="flex-1">
                      <div className="text-[11px] font-bold">{iv.candidateName}</div>
                      <div className="text-[8px] text-muted-foreground">{iv.candidateHeadline}</div>
                      <div className="text-[8px] text-muted-foreground">{iv.jobTitle} · Round {iv.round}/{iv.totalRounds}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-accent">{iv.overallScore}<span className="text-[8px] text-muted-foreground">/5</span></div>
                      {iv.recommendation&&<span className={cn('text-[8px] font-bold',REC_MAP[iv.recommendation].color)}>{REC_MAP[iv.recommendation].label}</span>}
                    </div>
                  </div>
                  {iv.scorecard&&(
                    <div className="space-y-1 mb-3">
                      {iv.scorecard.map(d=>(
                        <div key={d.label} className="flex items-center gap-2">
                          <span className="text-[8px] w-24 text-muted-foreground">{d.label}</span>
                          <div className="flex-1"><Progress value={(d.score/d.maxScore)*100} className="h-1.5"/></div>
                          <span className="text-[8px] font-bold w-6 text-right">{d.score}/{d.maxScore}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <Button size="sm" className="flex-1 h-6 text-[8px] rounded-lg gap-0.5" onClick={()=>toast.success(`${iv.candidateName} advanced to offer`)}><ArrowRight className="h-2 w-2"/>Advance to Offer</Button>
                    <Button size="sm" variant="outline" className="h-6 text-[8px] rounded-lg gap-0.5" onClick={()=>toast.info('Feedback requested')}><Mail className="h-2 w-2"/>Request Feedback</Button>
                    <Button size="sm" variant="outline" className="h-6 text-[8px] rounded-lg gap-0.5 text-[hsl(var(--state-blocked))]" onClick={()=>toast.info('Rejected')}><XCircle className="h-2 w-2"/>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ RESCHEDULE / CANCEL TAB ═══ */}
      {activeTab==='reschedule'&&(
        <div className="space-y-2">
          {filtered.length===0?(
            <div className="rounded-2xl border p-8 text-center"><RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-3"/><div className="text-sm font-medium">No cancelled or no-show interviews</div></div>
          ):filtered.map(iv=>{const cfg=STATUS_CFG[iv.status];const TI=TYPE_ICON[iv.type];return(
            <div key={iv.id} className="rounded-2xl border p-3 flex items-center gap-3 hover:shadow-sm transition-all">
              <Avatar className="h-9 w-9 ring-1 ring-muted/30"><AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">{iv.candidateAvatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold">{iv.candidateName}</div>
                <div className="text-[8px] text-muted-foreground">{iv.jobTitle} · {iv.date} · {iv.time}</div>
                <div className="text-[8px] text-muted-foreground mt-0.5 italic">{iv.notes}</div>
              </div>
              <StatusBadge status={cfg.badge} label={cfg.label}/>
              <div className="flex gap-1">
                <Button size="sm" className="h-6 text-[8px] rounded-lg gap-0.5" onClick={()=>toast.success('Rescheduled')}><RefreshCw className="h-2 w-2"/>Reschedule</Button>
                <Button size="sm" variant="outline" className="h-6 text-[8px] rounded-lg gap-0.5" onClick={()=>toast.info('Archived')}><X className="h-2 w-2"/>Archive</Button>
              </div>
            </div>
          );})}
        </div>
      )}

      {/* ── Interview Detail Drawer ── */}
      <Sheet open={!!selected} onOpenChange={()=>setSelectedId(null)}>
        <SheetContent className="w-[460px] overflow-y-auto p-0">
          <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><CalendarDays className="h-4 w-4 text-accent"/>Interview Details</SheetTitle></SheetHeader>
          {selected&&(()=>{const cfg=STATUS_CFG[selected.status];const TI=TYPE_ICON[selected.type];return(
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-accent/20"><AvatarFallback className="text-sm bg-accent/10 text-accent font-bold">{selected.candidateAvatar}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <h3 className="text-[13px] font-bold">{selected.candidateName}</h3>
                  <p className="text-[10px] text-muted-foreground">{selected.candidateHeadline}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">for <span className="font-medium text-foreground">{selected.jobTitle}</span></p>
                </div>
                <StatusBadge status={cfg.badge} label={cfg.label}/>
              </div>

              <SectionCard title="Schedule" className="!rounded-2xl">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{selected.date}</span></div>
                  <div><span className="text-muted-foreground">Time:</span> <span className="font-medium">{selected.time}</span></div>
                  <div><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{selected.duration}</span></div>
                  <div className="flex items-center gap-1"><TI className="h-3 w-3 text-muted-foreground"/><span className="font-medium capitalize">{selected.type}</span></div>
                  <div><span className="text-muted-foreground">Round:</span> <span className="font-medium">{selected.round} of {selected.totalRounds}</span></div>
                  <div><span className="text-muted-foreground">TZ:</span> <span className="font-medium">{selected.timezone}</span></div>
                </div>
                {selected.location&&<div className="text-[10px] mt-1"><span className="text-muted-foreground">Location:</span> <span className="font-medium">{selected.location}</span></div>}
              </SectionCard>

              <SectionCard title="Interview Panel" className="!rounded-2xl">
                <div className="space-y-1.5">
                  {selected.panelists.map(p=>(
                    <div key={p.name} className="flex items-center gap-2">
                      <Avatar className="h-6 w-6"><AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">{p.avatar}</AvatarFallback></Avatar>
                      <div className="flex-1"><div className="text-[10px] font-medium">{p.name}</div><div className="text-[8px] text-muted-foreground">{p.role}</div></div>
                      {selected.status==='completed'&&(p.scorecardSubmitted?<Badge className="text-[7px] bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]">Scored</Badge>:<Badge className="text-[7px] bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]">Pending</Badge>)}
                    </div>
                  ))}
                </div>
              </SectionCard>

              {selected.notes&&(<div><h4 className="text-xs font-semibold mb-1">Notes</h4><p className="text-[10px] text-muted-foreground bg-muted/30 rounded-xl px-3 py-2">{selected.notes}</p></div>)}

              {selected.status==='completed'&&selected.scorecard&&(
                <SectionCard title="Scorecard Summary" icon={<Award className="h-3.5 w-3.5 text-accent"/>} className="!rounded-2xl">
                  <div className="space-y-1.5">
                    {selected.scorecard.map(d=>(
                      <div key={d.label}>
                        <div className="flex items-center justify-between text-[10px] mb-0.5"><span>{d.label}</span><span className="font-semibold">{d.score}/{d.maxScore}</span></div>
                        <Progress value={(d.score/d.maxScore)*100} className="h-1"/>
                      </div>
                    ))}
                  </div>
                  {selected.recommendation&&<div className="flex items-center gap-2 mt-2"><span className="text-[10px] text-muted-foreground">Recommendation:</span><span className={cn('text-[10px] font-bold',REC_MAP[selected.recommendation].color)}>{REC_MAP[selected.recommendation].label}</span></div>}
                </SectionCard>
              )}

              <div className="flex flex-col gap-1.5 pt-2 border-t">
                {selected.status==='upcoming'&&(<>
                  {selected.meetingLink&&<Button size="sm" className="h-7 text-[10px] gap-1 w-full rounded-xl"><Video className="h-3 w-3"/>Join Meeting</Button>}
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] gap-1 rounded-xl"><RefreshCw className="h-3 w-3"/>Reschedule</Button>
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] gap-1 rounded-xl text-[hsl(var(--state-blocked))]"><XCircle className="h-3 w-3"/>Cancel</Button>
                  </div>
                </>)}
                {selected.status==='completed'&&<Button size="sm" className="h-7 text-[10px] gap-1 w-full rounded-xl" onClick={()=>{setScorecardDrawerId(selected.id);setSelectedId(null);}}><Award className="h-3 w-3"/>View/Submit Scorecard</Button>}
                {(selected.status==='cancelled'||selected.status==='no-show')&&<Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 w-full rounded-xl" onClick={()=>toast.info('Rescheduling...')}><RefreshCw className="h-3 w-3"/>Reschedule</Button>}
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 w-full rounded-xl" asChild><Link to="/profile"><ExternalLink className="h-3 w-3"/>View Candidate Profile</Link></Button>
              </div>
            </div>
          );})()}
        </SheetContent>
      </Sheet>

      {/* Scorecard Drawer */}
      <Sheet open={!!scorecardInterview} onOpenChange={()=>setScorecardDrawerId(null)}>
        <SheetContent className="w-[420px] overflow-y-auto p-0">
          <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm">Scorecard — {scorecardInterview?.candidateName}</SheetTitle></SheetHeader>
          {scorecardInterview&&<div className="p-5"><ScorecardForm interview={scorecardInterview} onClose={()=>setScorecardDrawerId(null)}/></div>}
        </SheetContent>
      </Sheet>

      <ScheduleModal open={scheduleOpen} onClose={()=>setScheduleOpen(false)}/>
    </DashboardLayout>
  );
};

export default RecruiterInterviewsPage;
