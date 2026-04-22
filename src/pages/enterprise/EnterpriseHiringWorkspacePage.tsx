import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, KPIBand, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Building2, Users, Briefcase, Plus, Search, Filter,
  CheckCircle2, XCircle, AlertTriangle, Clock, Shield,
  ChevronRight, ArrowRight, BarChart3, FileText, Eye,
  Star, Settings, Download, Mail, MessageSquare,
  UserCheck, CalendarDays, Zap, Globe, RefreshCw,
  ExternalLink, MoreHorizontal, ListChecks, Scale,
  GitBranch, CircleDot, Lock, Award, TrendingUp,
  CreditCard, X, Send,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */
type PageTab = 'jobs' | 'team' | 'approvals' | 'credits' | 'requisitions' | 'analytics';
type JobStatus = 'draft' | 'pending_approval' | 'approved' | 'published' | 'paused' | 'closed' | 'rejected';
type ApprovalState = 'pending' | 'approved' | 'rejected' | 'escalated' | 'expired';

const JOB_STATUS_CFG: Record<JobStatus, { label: string; badge: 'pending'|'healthy'|'live'|'caution'|'blocked'|'degraded' }> = {
  draft: { label: 'Draft', badge: 'degraded' },
  pending_approval: { label: 'Pending Approval', badge: 'pending' },
  approved: { label: 'Approved', badge: 'healthy' },
  published: { label: 'Published', badge: 'live' },
  paused: { label: 'Paused', badge: 'caution' },
  closed: { label: 'Closed', badge: 'degraded' },
  rejected: { label: 'Rejected', badge: 'blocked' },
};

const APPROVAL_CFG: Record<ApprovalState, { label: string; badge: 'pending'|'healthy'|'blocked'|'caution'|'degraded' }> = {
  pending: { label: 'Pending', badge: 'pending' },
  approved: { label: 'Approved', badge: 'healthy' },
  rejected: { label: 'Rejected', badge: 'blocked' },
  escalated: { label: 'Escalated', badge: 'caution' },
  expired: { label: 'Expired', badge: 'degraded' },
};

interface Job {
  id: string; title: string; department: string; location: string; type: string;
  status: JobStatus; applicants: number; hires: number; target: number;
  hiringManager: { name: string; avatar: string };
  recruiter: { name: string; avatar: string };
  daysOpen: number; creditsUsed: number; priority: 'high'|'medium'|'low';
}

interface ApprovalItem {
  id: string; title: string; type: 'requisition'|'offer'|'budget'|'headcount';
  requester: { name: string; avatar: string; role: string };
  status: ApprovalState; createdAt: string; urgency: 'high'|'medium'|'low';
  details: string; chain: { name: string; avatar: string; status: ApprovalState }[];
}

interface TeamMember {
  id: string; name: string; avatar: string; role: string; department: string;
  activeReqs: number; hires: number; avgTimeToFill: string; load: number;
}

/* ═══════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════ */
const JOBS: Job[] = [
  { id:'j1', title:'Senior Frontend Engineer', department:'Engineering', location:'Remote', type:'Full-time', status:'published', applicants:142, hires:0, target:2, hiringManager:{name:'Sarah Chen',avatar:'SC'}, recruiter:{name:'Marcus Johnson',avatar:'MJ'}, daysOpen:18, creditsUsed:45, priority:'high' },
  { id:'j2', title:'DevOps Engineer', department:'Infrastructure', location:'NYC', type:'Full-time', status:'published', applicants:87, hires:1, target:1, hiringManager:{name:'David Torres',avatar:'DT'}, recruiter:{name:'Marcus Johnson',avatar:'MJ'}, daysOpen:25, creditsUsed:32, priority:'medium' },
  { id:'j3', title:'Product Designer', department:'Design', location:'SF / Remote', type:'Full-time', status:'pending_approval', applicants:0, hires:0, target:1, hiringManager:{name:'Lisa Park',avatar:'LP'}, recruiter:{name:'Elena Kowalski',avatar:'EK'}, daysOpen:0, creditsUsed:0, priority:'medium' },
  { id:'j4', title:'Engineering Manager', department:'Engineering', location:'London', type:'Full-time', status:'approved', applicants:0, hires:0, target:1, hiringManager:{name:'Sarah Chen',avatar:'SC'}, recruiter:{name:'Marcus Johnson',avatar:'MJ'}, daysOpen:0, creditsUsed:0, priority:'high' },
  { id:'j5', title:'ML Engineer', department:'AI/ML', location:'Remote', type:'Contract', status:'draft', applicants:0, hires:0, target:2, hiringManager:{name:'David Torres',avatar:'DT'}, recruiter:{name:'Elena Kowalski',avatar:'EK'}, daysOpen:0, creditsUsed:0, priority:'low' },
  { id:'j6', title:'Data Analyst', department:'Analytics', location:'NYC', type:'Full-time', status:'paused', applicants:54, hires:0, target:1, hiringManager:{name:'Lisa Park',avatar:'LP'}, recruiter:{name:'Marcus Johnson',avatar:'MJ'}, daysOpen:40, creditsUsed:28, priority:'low' },
  { id:'j7', title:'QA Lead', department:'Engineering', location:'Remote', type:'Full-time', status:'closed', applicants:92, hires:1, target:1, hiringManager:{name:'Sarah Chen',avatar:'SC'}, recruiter:{name:'Elena Kowalski',avatar:'EK'}, daysOpen:35, creditsUsed:18, priority:'medium' },
  { id:'j8', title:'VP Sales', department:'Sales', location:'SF', type:'Full-time', status:'rejected', applicants:0, hires:0, target:1, hiringManager:{name:'David Torres',avatar:'DT'}, recruiter:{name:'Marcus Johnson',avatar:'MJ'}, daysOpen:0, creditsUsed:0, priority:'high' },
];

const APPROVALS: ApprovalItem[] = [
  { id:'a1', title:'Product Designer — New Headcount', type:'requisition', requester:{name:'Lisa Park',avatar:'LP',role:'Design Lead'}, status:'pending', createdAt:'2h ago', urgency:'high', details:'New headcount request for design systems team. Budget approved in Q2 plan.', chain:[{name:'Sarah Chen',avatar:'SC',status:'approved'},{name:'VP Finance',avatar:'VF',status:'pending'},{name:'CHRO',avatar:'CH',status:'pending'}] },
  { id:'a2', title:'Senior Frontend — Offer $185k', type:'offer', requester:{name:'Marcus Johnson',avatar:'MJ',role:'Recruiter'}, status:'pending', createdAt:'5h ago', urgency:'medium', details:'Offer for Elena Kowalski. Above mid-band, requires VP approval.', chain:[{name:'David Torres',avatar:'DT',status:'approved'},{name:'Sarah Chen',avatar:'SC',status:'pending'}] },
  { id:'a3', title:'Q2 Hiring Budget +$50k', type:'budget', requester:{name:'Sarah Chen',avatar:'SC',role:'VP Engineering'}, status:'escalated', createdAt:'2d ago', urgency:'high', details:'Additional budget for unexpected ML hiring needs.', chain:[{name:'VP Finance',avatar:'VF',status:'approved'},{name:'CFO',avatar:'CF',status:'escalated'}] },
  { id:'a4', title:'DevOps Engineer — Offer $165k', type:'offer', requester:{name:'Marcus Johnson',avatar:'MJ',role:'Recruiter'}, status:'approved', createdAt:'3d ago', urgency:'low', details:'Offer accepted. Start date confirmed.', chain:[{name:'David Torres',avatar:'DT',status:'approved'},{name:'Sarah Chen',avatar:'SC',status:'approved'}] },
  { id:'a5', title:'VP Sales — Requisition Denied', type:'requisition', requester:{name:'David Torres',avatar:'DT',role:'CTO'}, status:'rejected', createdAt:'5d ago', urgency:'low', details:'Headcount frozen for sales leadership pending reorg.', chain:[{name:'CHRO',avatar:'CH',status:'rejected'}] },
];

const TEAM: TeamMember[] = [
  { id:'t1', name:'Marcus Johnson', avatar:'MJ', role:'Senior Recruiter', department:'Talent', activeReqs:4, hires:6, avgTimeToFill:'28d', load:85 },
  { id:'t2', name:'Elena Kowalski', avatar:'EK', role:'Recruiter', department:'Talent', activeReqs:3, hires:4, avgTimeToFill:'32d', load:70 },
  { id:'t3', name:'Sarah Chen', avatar:'SC', role:'VP Engineering', department:'Engineering', activeReqs:2, hires:0, avgTimeToFill:'—', load:40 },
  { id:'t4', name:'David Torres', avatar:'DT', role:'CTO', department:'Engineering', activeReqs:1, hires:0, avgTimeToFill:'—', load:25 },
  { id:'t5', name:'Lisa Park', avatar:'LP', role:'Design Lead', department:'Design', activeReqs:1, hires:0, avgTimeToFill:'—', load:30 },
];

/* ═══════════════════════════════════════════════════════════
   Create Requisition Modal
   ═══════════════════════════════════════════════════════════ */
const RequisitionModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [step, setStep] = useState<'details'|'approval'|'review'>('details');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative flex justify-center items-start pt-[6vh] px-4">
        <div className="w-full max-w-lg bg-card rounded-2xl border shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="font-semibold text-lg">New Requisition</h2>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4"/></Button>
          </div>
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2 mb-4">
              {['details','approval','review'].map((s,i) => (
                <React.Fragment key={s}>
                  <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors',step===s?'border-accent bg-accent text-accent-foreground':i<['details','approval','review'].indexOf(step)?'border-accent bg-accent/10 text-accent':'border-muted text-muted-foreground')}>{i+1}</div>
                  {i<2&&<div className={cn('flex-1 h-0.5',i<['details','approval','review'].indexOf(step)?'bg-accent':'bg-muted')}/>}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="p-6 max-h-[55vh] overflow-y-auto space-y-4">
            {step==='details'&&(<>
              <div><label className="text-xs font-medium mb-1 block">Job Title *</label><input className="w-full h-9 rounded-xl border bg-background px-3 text-sm" placeholder="e.g. Senior Frontend Engineer"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium mb-1 block">Department *</label><select className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>Engineering</option><option>Design</option><option>Sales</option><option>AI/ML</option></select></div>
                <div><label className="text-xs font-medium mb-1 block">Headcount *</label><input type="number" defaultValue={1} className="w-full h-9 rounded-xl border bg-background px-3 text-sm"/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium mb-1 block">Location</label><input className="w-full h-9 rounded-xl border bg-background px-3 text-sm" placeholder="Remote / NYC / SF"/></div>
                <div><label className="text-xs font-medium mb-1 block">Priority</label><select className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>High</option><option>Medium</option><option>Low</option></select></div>
              </div>
              <div><label className="text-xs font-medium mb-1 block">Salary Band</label><div className="grid grid-cols-2 gap-3"><input className="h-9 rounded-xl border bg-background px-3 text-sm" placeholder="Min"/><input className="h-9 rounded-xl border bg-background px-3 text-sm" placeholder="Max"/></div></div>
              <div><label className="text-xs font-medium mb-1 block">Justification</label><textarea className="w-full h-16 rounded-xl border bg-background px-3 py-2 text-sm resize-none" placeholder="Business case for this role..."/></div>
            </>)}
            {step==='approval'&&(<>
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 text-[10px] flex items-center gap-2">
                <GitBranch className="h-3.5 w-3.5 text-accent"/>
                <span>Approval chain is auto-assigned based on department and budget level.</span>
              </div>
              <div className="space-y-2">
                {[{name:'Direct Manager',role:'Auto-assigned',avatar:'DM'},{name:'VP / Department Head',role:'Required for $150k+',avatar:'VP'},{name:'Finance',role:'Required for new headcount',avatar:'FN'},{name:'CHRO',role:'Required for VP+ roles',avatar:'CH'}].map((p,i)=>(
                  <div key={p.name} className="flex items-center gap-2 p-2.5 rounded-xl border">
                    <div className={cn('h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-bold',i<2?'bg-accent/10 text-accent':'bg-muted text-muted-foreground')}>{i+1}</div>
                    <Avatar className="h-6 w-6"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{p.avatar}</AvatarFallback></Avatar>
                    <div className="flex-1"><div className="text-[10px] font-medium">{p.name}</div><div className="text-[8px] text-muted-foreground">{p.role}</div></div>
                    {i<2?<CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]"/>:<Clock className="h-3 w-3 text-muted-foreground"/>}
                  </div>
                ))}
              </div>
              <div><label className="text-xs font-medium mb-1 block">Hiring Manager Override</label><input className="w-full h-9 rounded-xl border bg-background px-3 text-sm" placeholder="Search team member..."/></div>
            </>)}
            {step==='review'&&(
              <div className="space-y-3">
                <div className="rounded-xl border p-3 bg-muted/30 text-xs space-y-1.5">
                  {[['Title','—'],['Department','Engineering'],['Headcount','1'],['Location','Remote'],['Priority','High'],['Approval Chain','3 approvers']].map(([k,v])=>(
                    <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
                  ))}
                </div>
                <div className="rounded-xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3 flex items-center gap-2 text-[10px]">
                  <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]"/>Submitting will notify the approval chain. You cannot edit after submission.
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between px-6 py-4 border-t">
            {step!=='details'?<Button variant="outline" onClick={()=>setStep(step==='review'?'approval':'details')}>Back</Button>:<div/>}
            {step==='review'?<Button onClick={()=>{toast.success('Requisition submitted for approval');onClose();}}><Send className="h-3 w-3 mr-1"/>Submit</Button>:<Button onClick={()=>setStep(step==='details'?'approval':'review')}>Continue</Button>}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const EnterpriseHiringWorkspacePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PageTab>('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobFilter, setJobFilter] = useState<'all'|JobStatus>('all');
  const [selectedJobId, setSelectedJobId] = useState<string|null>(null);
  const [selectedApprovalId, setSelectedApprovalId] = useState<string|null>(null);
  const [reqModalOpen, setReqModalOpen] = useState(false);

  const filteredJobs = useMemo(()=>{
    let list = [...JOBS];
    if (jobFilter!=='all') list = list.filter(j=>j.status===jobFilter);
    if (searchQuery){const q=searchQuery.toLowerCase();list=list.filter(j=>j.title.toLowerCase().includes(q)||j.department.toLowerCase().includes(q));}
    return list;
  },[jobFilter,searchQuery]);

  const selectedJob = JOBS.find(j=>j.id===selectedJobId);
  const selectedApproval = APPROVALS.find(a=>a.id===selectedApprovalId);

  const publishedCount = JOBS.filter(j=>j.status==='published').length;
  const pendingApprovals = APPROVALS.filter(a=>a.status==='pending'||a.status==='escalated').length;
  const totalApplicants = JOBS.reduce((s,j)=>s+j.applicants,0);
  const totalCreditsUsed = JOBS.reduce((s,j)=>s+j.creditsUsed,0);

  const TABS: {id:PageTab;label:string;icon:LucideIcon;count?:number}[] = [
    {id:'jobs',label:'Job List',icon:Briefcase,count:JOBS.length},
    {id:'team',label:'Team Assignments',icon:Users,count:TEAM.length},
    {id:'approvals',label:'Approval Chain',icon:GitBranch,count:pendingApprovals},
    {id:'credits',label:'Credit Usage',icon:CreditCard},
    {id:'requisitions',label:'Requisitions',icon:FileText},
    {id:'analytics',label:'Analytics',icon:BarChart3},
  ];

  /* ── Top Strip ── */
  const topStrip = (<>
    <div className="flex items-center gap-2.5">
      <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Building2 className="h-3.5 w-3.5 text-accent"/></div>
      <span className="text-xs font-bold">Enterprise Hiring</span>
      <StatusBadge status="live" label={`${publishedCount} Live Jobs`}/>
      {pendingApprovals>0&&<StatusBadge status="caution" label={`${pendingApprovals} Pending Approvals`}/>}
    </div>
    <div className="flex-1"/>
    <select className="h-7 rounded-xl border bg-background px-2 text-[9px]"><option>All Departments</option><option>Engineering</option><option>Design</option><option>Sales</option></select>
    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3"/>Export</Button>
    <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={()=>setReqModalOpen(true)}><Plus className="h-3 w-3"/>New Requisition</Button>
  </>);

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <KPIBand className="!grid-cols-2">
        <KPICard label="Open Roles" value={JOBS.filter(j=>j.status==='published'||j.status==='approved').length} trend="up"/>
        <KPICard label="Applicants" value={totalApplicants} trend="up"/>
      </KPIBand>
      <KPIBand className="!grid-cols-2">
        <KPICard label="Avg Time-to-Fill" value="29d" trend="down" change="-3d"/>
        <KPICard label="Credits Used" value={totalCreditsUsed} change={`/${200} budget`} trend="neutral"/>
      </KPIBand>

      <SectionCard title="Pending Actions" icon={<AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]"/>} className="!rounded-2xl">
        <div className="space-y-1.5">
          {APPROVALS.filter(a=>a.status==='pending'||a.status==='escalated').map(a=>(
            <button key={a.id} onClick={()=>{setActiveTab('approvals');setSelectedApprovalId(a.id);}} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl text-left hover:bg-muted/50 transition-all group">
              <CircleDot className={cn('h-3 w-3 shrink-0',a.status==='escalated'?'text-[hsl(var(--state-caution))]':'text-accent')}/>
              <div className="min-w-0 flex-1"><div className="text-[9px] font-medium truncate group-hover:text-accent transition-colors">{a.title}</div><div className="text-[8px] text-muted-foreground">{a.createdAt} · {a.type}</div></div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            {label:'Create requisition',icon:Plus,action:()=>setReqModalOpen(true)},
            {label:'Review approvals',icon:GitBranch,action:()=>setActiveTab('approvals')},
            {label:'View pipeline',icon:ArrowRight,action:()=>{}},
            {label:'Buy credits',icon:CreditCard,action:()=>toast.info('Opening credits store')},
            {label:'Workspace settings',icon:Settings,action:()=>toast.info('Settings')},
          ].map(a=>(
            <button key={a.label} onClick={a.action} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl text-[9px] hover:bg-muted/30 transition-all font-medium group">
              <a.icon className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors"/><span className="group-hover:text-accent transition-colors">{a.label}</span>
              <ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground"/>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Org Hiring Health" icon={<TrendingUp className="h-3.5 w-3.5 text-accent"/>} className="!rounded-2xl">
        <div className="space-y-2">
          {[{label:'Offer Acceptance',value:82,color:'bg-[hsl(var(--state-healthy))]'},{label:'Pipeline Coverage',value:65,color:'bg-accent'},{label:'Diversity Target',value:48,color:'bg-[hsl(var(--state-caution))]'}].map(m=>(
            <div key={m.label}>
              <div className="flex items-center justify-between text-[8px] mb-0.5"><span className="text-muted-foreground">{m.label}</span><span className="font-bold">{m.value}%</span></div>
              <Progress value={m.value} className="h-1"/>
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
        <span className="text-[10px] font-bold flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5 text-accent"/>Workspace Overview · Q2 2026</span>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {[
          {label:'Total Hires',value:'8'},
          {label:'Open Roles',value:String(publishedCount)},
          {label:'Avg Cost/Hire',value:'$4.2k'},
          {label:'Time-to-Fill',value:'29d'},
          {label:'Credits Remaining',value:String(200-totalCreditsUsed)},
          {label:'Approval SLA',value:'1.4d'},
        ].map(s=>(<div key={s.label} className="text-center"><div className="text-sm font-bold">{s.value}</div><div className="text-[8px] text-muted-foreground">{s.label}</div></div>))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      {/* Banners */}
      {pendingApprovals>0&&(
        <div className="rounded-2xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-2.5 flex items-center gap-3 mb-3">
          <GitBranch className="h-4 w-4 text-[hsl(var(--state-caution))] shrink-0"/>
          <div className="flex-1"><div className="text-[10px] font-medium">{pendingApprovals} Approval{pendingApprovals>1?'s':''} Waiting</div><div className="text-[9px] text-muted-foreground">Requisitions and offers require your review before proceeding.</div></div>
          <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg" onClick={()=>setActiveTab('approvals')}>Review Now</Button>
        </div>
      )}
      {totalCreditsUsed>150&&(
        <div className="rounded-2xl border border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.05)] p-2.5 flex items-center gap-3 mb-3">
          <CreditCard className="h-4 w-4 text-[hsl(var(--state-blocked))] shrink-0"/>
          <div className="flex-1"><div className="text-[10px] font-medium">Credit Usage High</div><div className="text-[9px] text-muted-foreground">{totalCreditsUsed}/200 credits used this quarter.</div></div>
          <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg" onClick={()=>toast.info('Opening credits store')}>Buy More</Button>
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

      {/* ═══ JOB LIST TAB ═══ */}
      {activeTab==='jobs'&&(<>
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {(['all','published','pending_approval','approved','draft','paused','closed'] as const).map(f=>(
            <button key={f} onClick={()=>setJobFilter(f)} className={cn('px-2.5 py-1 rounded-xl text-[9px] font-semibold transition-all capitalize',jobFilter===f?'bg-accent text-accent-foreground':'bg-muted/40 text-muted-foreground hover:bg-muted/60')}>
              {f==='pending_approval'?'Pending':f} ({f==='all'?JOBS.length:JOBS.filter(j=>j.status===f).length})
            </button>
          ))}
        </div>
        <div className="rounded-2xl border overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_55px_55px_65px_65px_80px] gap-2 px-3 py-2 bg-muted/50 border-b text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Position</span><span>Applicants</span><span>Hires</span><span>Days</span><span>Credits</span><span>Status</span><span className="text-right">Actions</span>
          </div>
          {filteredJobs.map(j=>{const cfg=JOB_STATUS_CFG[j.status];return(
            <div key={j.id} onClick={()=>setSelectedJobId(j.id)} className="grid grid-cols-[1fr_80px_55px_55px_65px_65px_80px] gap-2 px-3 py-2.5 border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer items-center">
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn('h-1.5 w-1.5 rounded-full shrink-0',j.priority==='high'?'bg-[hsl(var(--state-blocked))]':j.priority==='medium'?'bg-[hsl(var(--state-caution))]':'bg-muted-foreground')}/>
                <div className="min-w-0">
                  <div className="text-[10px] font-medium truncate">{j.title}</div>
                  <div className="text-[8px] text-muted-foreground">{j.department} · {j.location} · {j.type}</div>
                </div>
              </div>
              <div className="text-[10px] font-medium">{j.applicants}<span className="text-[8px] text-muted-foreground ml-0.5">/{j.target}</span></div>
              <div className="text-[10px] font-medium">{j.hires}/{j.target}</div>
              <div className="text-[10px] text-muted-foreground">{j.daysOpen||'—'}</div>
              <div className="text-[10px] text-muted-foreground">{j.creditsUsed||'—'}</div>
              <StatusBadge status={cfg.badge} label={cfg.label}/>
              <div className="flex items-center justify-end gap-0.5">
                {j.status==='published'&&<Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e=>{e.stopPropagation();}}><Eye className="h-2 w-2 mr-0.5"/>View</Button>}
                {j.status==='draft'&&<Button size="sm" className="h-5 text-[7px] rounded-lg" onClick={e=>{e.stopPropagation();toast.info('Submitting for approval');}}><Send className="h-2 w-2 mr-0.5"/>Submit</Button>}
                {j.status==='pending_approval'&&<Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e=>{e.stopPropagation();setActiveTab('approvals');}}><GitBranch className="h-2 w-2 mr-0.5"/>Chain</Button>}
              </div>
            </div>
          );})}
        </div>
      </>)}

      {/* ═══ TEAM ASSIGNMENTS TAB ═══ */}
      {activeTab==='team'&&(
        <div className="space-y-3">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {TEAM.map(m=>(
              <div key={m.id} className="rounded-2xl border p-3 hover:shadow-md transition-all">
                <div className="flex items-start gap-2.5 mb-3">
                  <Avatar className="h-10 w-10 ring-2 ring-accent/20"><AvatarFallback className="text-[9px] bg-accent/10 text-accent font-bold">{m.avatar}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold">{m.name}</div>
                    <div className="text-[8px] text-muted-foreground">{m.role} · {m.department}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-3 w-3"/></Button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="rounded-xl bg-muted/30 p-2 text-center"><div className="text-sm font-bold">{m.activeReqs}</div><div className="text-[7px] text-muted-foreground">Active Reqs</div></div>
                  <div className="rounded-xl bg-muted/30 p-2 text-center"><div className="text-sm font-bold">{m.hires}</div><div className="text-[7px] text-muted-foreground">Hires</div></div>
                  <div className="rounded-xl bg-muted/30 p-2 text-center"><div className="text-sm font-bold text-[10px]">{m.avgTimeToFill}</div><div className="text-[7px] text-muted-foreground">Avg TTF</div></div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[8px] mb-1"><span className="text-muted-foreground">Workload</span><span className={cn('font-bold',m.load>80?'text-[hsl(var(--state-blocked))]':m.load>60?'text-[hsl(var(--state-caution))]':'text-[hsl(var(--state-healthy))]')}>{m.load}%</span></div>
                  <Progress value={m.load} className="h-1.5"/>
                </div>
                <div className="flex gap-1 mt-2.5">
                  <Button size="sm" variant="outline" className="flex-1 h-6 text-[8px] rounded-lg gap-0.5"><Mail className="h-2 w-2"/>Message</Button>
                  <Button size="sm" variant="outline" className="flex-1 h-6 text-[8px] rounded-lg gap-0.5"><ListChecks className="h-2 w-2"/>Assign</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ APPROVAL CHAIN TAB ═══ */}
      {activeTab==='approvals'&&(
        <div className="space-y-2">
          {APPROVALS.map(a=>{const cfg=APPROVAL_CFG[a.status];return(
            <div key={a.id} onClick={()=>setSelectedApprovalId(a.id)} className={cn('rounded-2xl border p-3 hover:shadow-sm transition-all cursor-pointer',a.status==='escalated'&&'border-[hsl(var(--state-caution)/0.3)]')}>
              <div className="flex items-start gap-3">
                <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0',a.type==='requisition'?'bg-accent/10':'bg-muted/50')}>
                  {a.type==='requisition'?<FileText className="h-4 w-4 text-accent"/>:a.type==='offer'?<Award className="h-4 w-4 text-accent"/>:a.type==='budget'?<CreditCard className="h-4 w-4 text-accent"/>:<Users className="h-4 w-4 text-accent"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-bold">{a.title}</span>
                    <Badge variant="secondary" className="text-[7px] capitalize">{a.type}</Badge>
                    {a.urgency==='high'&&<Badge className="text-[7px] bg-[hsl(var(--state-blocked)/0.1)] text-[hsl(var(--state-blocked))]">Urgent</Badge>}
                  </div>
                  <div className="text-[9px] text-muted-foreground mb-2">{a.details}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                      <Avatar className="h-4 w-4"><AvatarFallback className="text-[5px] bg-accent/10 text-accent">{a.requester.avatar}</AvatarFallback></Avatar>
                      <span>{a.requester.name} · {a.requester.role}</span>
                    </div>
                    <span className="text-[8px] text-muted-foreground">·</span>
                    <span className="text-[8px] text-muted-foreground">{a.createdAt}</span>
                  </div>
                  {/* Approval Chain Visual */}
                  <div className="flex items-center gap-1 mt-2">
                    {a.chain.map((c,i)=>{const cCfg=APPROVAL_CFG[c.status];return(
                      <React.Fragment key={c.name}>
                        <div className="flex items-center gap-1 rounded-lg border px-1.5 py-0.5">
                          <Avatar className="h-4 w-4"><AvatarFallback className="text-[5px] bg-accent/10 text-accent">{c.avatar}</AvatarFallback></Avatar>
                          <span className="text-[7px] font-medium">{c.name}</span>
                          <StatusBadge status={cCfg.badge} label={cCfg.label}/>
                        </div>
                        {i<a.chain.length-1&&<ArrowRight className="h-2.5 w-2.5 text-muted-foreground"/>}
                      </React.Fragment>
                    );})}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={cfg.badge} label={cfg.label}/>
                  {(a.status==='pending')&&(
                    <div className="flex gap-1 mt-1">
                      <Button size="sm" className="h-5 text-[7px] rounded-lg gap-0.5" onClick={e=>{e.stopPropagation();toast.success('Approved!');}}><CheckCircle2 className="h-2 w-2"/>Approve</Button>
                      <Button size="sm" variant="outline" className="h-5 text-[7px] rounded-lg gap-0.5 text-[hsl(var(--state-blocked))]" onClick={e=>{e.stopPropagation();toast.info('Rejected');}}><XCircle className="h-2 w-2"/>Reject</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );})}
        </div>
      )}

      {/* ═══ CREDITS TAB ═══ */}
      {activeTab==='credits'&&(
        <div className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="rounded-2xl border p-4 text-center">
              <div className="text-2xl font-bold text-accent">{200-totalCreditsUsed}</div>
              <div className="text-[10px] text-muted-foreground">Credits Remaining</div>
              <Progress value={(totalCreditsUsed/200)*100} className="h-2 mt-2"/>
              <div className="text-[8px] text-muted-foreground mt-1">{totalCreditsUsed}/200 used this quarter</div>
            </div>
            <div className="rounded-2xl border p-4 text-center">
              <div className="text-2xl font-bold">{Math.round(totalCreditsUsed/JOBS.filter(j=>j.creditsUsed>0).length)}</div>
              <div className="text-[10px] text-muted-foreground">Avg Credits/Job</div>
            </div>
            <div className="rounded-2xl border p-4 text-center">
              <div className="text-2xl font-bold">$8.40</div>
              <div className="text-[10px] text-muted-foreground">Cost/Credit</div>
              <Button size="sm" className="h-6 text-[8px] rounded-lg mt-2 gap-0.5" onClick={()=>toast.info('Opening credits store')}><CreditCard className="h-2.5 w-2.5"/>Buy More</Button>
            </div>
          </div>
          <SectionCard title="Usage by Job" icon={<BarChart3 className="h-3.5 w-3.5 text-accent"/>} className="!rounded-2xl">
            <div className="space-y-1.5">
              {JOBS.filter(j=>j.creditsUsed>0).sort((a,b)=>b.creditsUsed-a.creditsUsed).map(j=>(
                <div key={j.id} className="flex items-center gap-2">
                  <span className="text-[9px] w-40 truncate">{j.title}</span>
                  <div className="flex-1"><Progress value={(j.creditsUsed/50)*100} className="h-1.5"/></div>
                  <span className="text-[9px] font-bold w-8 text-right">{j.creditsUsed}</span>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Usage by Recruiter" icon={<Users className="h-3.5 w-3.5 text-accent"/>} className="!rounded-2xl">
            <div className="space-y-1.5">
              {[{name:'Marcus Johnson',avatar:'MJ',credits:95},{name:'Elena Kowalski',avatar:'EK',credits:28}].map(r=>(
                <div key={r.name} className="flex items-center gap-2">
                  <Avatar className="h-5 w-5"><AvatarFallback className="text-[6px] bg-accent/10 text-accent">{r.avatar}</AvatarFallback></Avatar>
                  <span className="text-[9px] flex-1">{r.name}</span>
                  <div className="flex-1"><Progress value={(r.credits/100)*100} className="h-1.5"/></div>
                  <span className="text-[9px] font-bold w-8 text-right">{r.credits}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ REQUISITIONS TAB ═══ */}
      {activeTab==='requisitions'&&(
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-bold">Requisition States</h3>
            <Button size="sm" className="h-6 text-[8px] rounded-lg gap-0.5" onClick={()=>setReqModalOpen(true)}><Plus className="h-2.5 w-2.5"/>New</Button>
          </div>
          <div className="grid md:grid-cols-4 gap-2 mb-3">
            {[{label:'Draft',count:1,badge:'degraded' as const},{label:'Pending',count:1,badge:'pending' as const},{label:'Approved',count:1,badge:'healthy' as const},{label:'Rejected',count:1,badge:'blocked' as const}].map(s=>(
              <div key={s.label} className="rounded-2xl border p-3 text-center">
                <StatusBadge status={s.badge} label={s.label}/>
                <div className="text-xl font-bold mt-1">{s.count}</div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border overflow-hidden">
            <div className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-2 px-3 py-2 bg-muted/50 border-b text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Requisition</span><span>Type</span><span>Requester</span><span>Status</span><span className="text-right">Action</span>
            </div>
            {APPROVALS.filter(a=>a.type==='requisition').map(a=>{const cfg=APPROVAL_CFG[a.status];return(
              <div key={a.id} className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-2 px-3 py-2.5 border-b last:border-0 hover:bg-muted/30 items-center">
                <div className="text-[10px] font-medium truncate">{a.title}</div>
                <Badge variant="secondary" className="text-[7px] capitalize w-fit">{a.type}</Badge>
                <div className="flex items-center gap-1"><Avatar className="h-4 w-4"><AvatarFallback className="text-[5px] bg-accent/10 text-accent">{a.requester.avatar}</AvatarFallback></Avatar><span className="text-[8px]">{a.requester.name}</span></div>
                <StatusBadge status={cfg.badge} label={cfg.label}/>
                <div className="flex justify-end"><Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg"><Eye className="h-2 w-2 mr-0.5"/>View</Button></div>
              </div>
            );})}
          </div>
        </div>
      )}

      {/* ═══ ANALYTICS TAB ═══ */}
      {activeTab==='analytics'&&(
        <div className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            {[
              {title:'Hiring Funnel',items:[{l:'Applied',v:375},{l:'Screened',v:180},{l:'Interviewed',v:52},{l:'Offered',v:12},{l:'Hired',v:8}]},
              {title:'Source Distribution',items:[{l:'Job Boards',v:45},{l:'Referrals',v:28},{l:'Direct',v:15},{l:'Agency',v:12}]},
              {title:'Department Demand',items:[{l:'Engineering',v:5},{l:'Design',v:1},{l:'Sales',v:1},{l:'AI/ML',v:1}]},
            ].map(s=>(
              <SectionCard key={s.title} title={s.title} className="!rounded-2xl">
                <div className="space-y-1.5">
                  {s.items.map((it,i)=>(
                    <div key={it.l} className="flex items-center gap-2">
                      <span className="text-[9px] w-20 text-muted-foreground">{it.l}</span>
                      <div className="flex-1"><Progress value={(it.v / s.items[0].v) * 100} className="h-1.5"/></div>
                      <span className="text-[9px] font-bold w-8 text-right">{it.v}{s.title==='Source Distribution'?'%':''}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            ))}
          </div>
          <SectionCard title="Approval SLA Performance" icon={<Clock className="h-3.5 w-3.5 text-accent"/>} className="!rounded-2xl">
            <div className="grid grid-cols-4 gap-3">
              {[{label:'Avg Approval Time',value:'1.4d'},{label:'SLA Met',value:'82%'},{label:'Escalated',value:'12%'},{label:'Auto-Expired',value:'3%'}].map(s=>(
                <div key={s.label} className="text-center"><div className="text-lg font-bold">{s.value}</div><div className="text-[8px] text-muted-foreground">{s.label}</div></div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── Job Detail Drawer ── */}
      <Sheet open={!!selectedJob} onOpenChange={()=>setSelectedJobId(null)}>
        <SheetContent className="w-[460px] overflow-y-auto p-0">
          <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Briefcase className="h-4 w-4 text-accent"/>Job Details</SheetTitle></SheetHeader>
          {selectedJob&&(()=>{const cfg=JOB_STATUS_CFG[selectedJob.status];return(
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center',selectedJob.priority==='high'?'bg-[hsl(var(--state-blocked)/0.1)]':'bg-accent/10')}>
                  <Briefcase className={cn('h-5 w-5',selectedJob.priority==='high'?'text-[hsl(var(--state-blocked))]':'text-accent')}/>
                </div>
                <div className="flex-1">
                  <h3 className="text-[13px] font-bold">{selectedJob.title}</h3>
                  <p className="text-[10px] text-muted-foreground">{selectedJob.department} · {selectedJob.location} · {selectedJob.type}</p>
                </div>
                <StatusBadge status={cfg.badge} label={cfg.label}/>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[{label:'Applicants',value:selectedJob.applicants},{label:'Hires',value:`${selectedJob.hires}/${selectedJob.target}`},{label:'Days Open',value:selectedJob.daysOpen||'—'}].map(s=>(
                  <div key={s.label} className="rounded-xl border p-2 text-center"><div className="text-sm font-bold">{s.value}</div><div className="text-[7px] text-muted-foreground">{s.label}</div></div>
                ))}
              </div>
              <SectionCard title="Hiring Team" className="!rounded-2xl">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2"><Avatar className="h-6 w-6"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{selectedJob.hiringManager.avatar}</AvatarFallback></Avatar><div><div className="text-[9px] font-medium">{selectedJob.hiringManager.name}</div><div className="text-[7px] text-muted-foreground">Hiring Manager</div></div></div>
                  <div className="flex items-center gap-2"><Avatar className="h-6 w-6"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{selectedJob.recruiter.avatar}</AvatarFallback></Avatar><div><div className="text-[9px] font-medium">{selectedJob.recruiter.name}</div><div className="text-[7px] text-muted-foreground">Recruiter</div></div></div>
                </div>
              </SectionCard>
              <div className="flex flex-col gap-1.5 pt-2 border-t">
                {selectedJob.status==='published'&&<Button size="sm" className="h-7 text-[10px] gap-1 w-full rounded-xl" asChild><Link to="/recruiter/pipeline"><Eye className="h-3 w-3"/>View Pipeline</Link></Button>}
                {selectedJob.status==='draft'&&<Button size="sm" className="h-7 text-[10px] gap-1 w-full rounded-xl" onClick={()=>toast.info('Submitting for approval')}><Send className="h-3 w-3"/>Submit for Approval</Button>}
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 w-full rounded-xl" asChild><Link to="/recruiter/interviews"><CalendarDays className="h-3 w-3"/>View Interviews</Link></Button>
              </div>
            </div>
          );})()}
        </SheetContent>
      </Sheet>

      {/* ── Approval Detail Drawer ── */}
      <Sheet open={!!selectedApproval} onOpenChange={()=>setSelectedApprovalId(null)}>
        <SheetContent className="w-[420px] overflow-y-auto p-0">
          <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><GitBranch className="h-4 w-4 text-accent"/>Approval Details</SheetTitle></SheetHeader>
          {selectedApproval&&(()=>{const cfg=APPROVAL_CFG[selectedApproval.status];return(
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-[13px] font-bold">{selectedApproval.title}</h3>
                <div className="flex items-center gap-2 mt-1"><Badge variant="secondary" className="text-[7px] capitalize">{selectedApproval.type}</Badge><StatusBadge status={cfg.badge} label={cfg.label}/></div>
              </div>
              <p className="text-[10px] text-muted-foreground bg-muted/30 rounded-xl px-3 py-2">{selectedApproval.details}</p>
              <SectionCard title="Approval Chain" icon={<GitBranch className="h-3.5 w-3.5 text-accent"/>} className="!rounded-2xl">
                <div className="space-y-2">
                  {selectedApproval.chain.map((c,i)=>{const cCfg=APPROVAL_CFG[c.status];return(
                    <div key={c.name} className="flex items-center gap-2">
                      <div className={cn('h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-bold',c.status==='approved'?'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]':c.status==='rejected'?'bg-[hsl(var(--state-blocked)/0.1)] text-[hsl(var(--state-blocked))]':'bg-muted text-muted-foreground')}>{i+1}</div>
                      <Avatar className="h-6 w-6"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{c.avatar}</AvatarFallback></Avatar>
                      <span className="text-[10px] font-medium flex-1">{c.name}</span>
                      <StatusBadge status={cCfg.badge} label={cCfg.label}/>
                    </div>
                  );})}
                </div>
              </SectionCard>
              {selectedApproval.status==='pending'&&(
                <div className="flex gap-1.5 pt-2 border-t">
                  <Button size="sm" className="flex-1 h-7 text-[10px] gap-1 rounded-xl" onClick={()=>{toast.success('Approved!');setSelectedApprovalId(null);}}><CheckCircle2 className="h-3 w-3"/>Approve</Button>
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] gap-1 rounded-xl text-[hsl(var(--state-blocked))]" onClick={()=>{toast.info('Rejected');setSelectedApprovalId(null);}}><XCircle className="h-3 w-3"/>Reject</Button>
                </div>
              )}
            </div>
          );})()}
        </SheetContent>
      </Sheet>

      <RequisitionModal open={reqModalOpen} onClose={()=>setReqModalOpen(false)}/>
    </DashboardLayout>
  );
};

export default EnterpriseHiringWorkspacePage;
