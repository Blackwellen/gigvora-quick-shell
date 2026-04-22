import React, { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import {
  LayoutGrid, List, Calendar, MessageSquare, FileText, Users, Target,
  DollarSign, Shield, AlertTriangle, CheckCircle2, Clock, Plus,
  MoreHorizontal, GripVertical, ArrowRight, Paperclip, Flag,
  TrendingUp, Milestone, ChevronRight, Send, Upload, Eye, UserPlus,
  Video, BarChart3, Archive, Timer, Play, Pause, Check, X,
  Download, Star, ThumbsUp, ThumbsDown, History, Settings,
  Sparkles, Activity, CalendarDays, GanttChart, Layers, Search,
  ExternalLink, Heart, Zap, AlertCircle, CircleDot, Home,
  RefreshCw, ShieldAlert, TrendingDown, Flame, Award, Loader2, WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  useWorkspaces, useWorkspaceDetail, useKickoffWorkspace,
  useTransitionMilestone, useSubmitDeliverable, useReviewDeliverable,
  useCompleteChecklistItem, useStartHandover, useHoldWorkspace,
  useCancelWorkspace, useCloseWorkspace, pwhApiConfigured,
  type Workspace, type Milestone as ApiMilestone,
} from '@/lib/api/projectWorkspaces';

/* ═══════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════ */
const TASKS = [
  { id: 't1', title: 'Design system setup', status: 'done', assignee: 'Sarah C.', priority: 'high', due: 'Apr 5', estimate: '8h', logged: '7.5h', dependencies: [] },
  { id: 't2', title: 'Auth module implementation', status: 'in-progress', assignee: 'Elena R.', priority: 'high', due: 'Apr 12', estimate: '24h', logged: '18h', dependencies: ['t1'] },
  { id: 't3', title: 'Dashboard wireframes', status: 'in-progress', assignee: 'Sarah C.', priority: 'medium', due: 'Apr 14', estimate: '16h', logged: '10h', dependencies: ['t1'] },
  { id: 't4', title: 'API integration layer', status: 'todo', assignee: 'Elena R.', priority: 'high', due: 'Apr 18', estimate: '20h', logged: '0h', dependencies: ['t2'] },
  { id: 't5', title: 'User testing round 1', status: 'todo', assignee: 'Priya P.', priority: 'medium', due: 'Apr 22', estimate: '12h', logged: '0h', dependencies: ['t3'] },
  { id: 't6', title: 'Performance optimization', status: 'todo', assignee: 'Elena R.', priority: 'low', due: 'Apr 28', estimate: '10h', logged: '0h', dependencies: ['t4'] },
  { id: 't7', title: 'Documentation', status: 'backlog', assignee: 'Priya P.', priority: 'low', due: 'May 2', estimate: '8h', logged: '0h', dependencies: [] },
];

const MILESTONES = [
  { id: 'm1', title: 'Foundation & Setup', progress: 100, amount: '$5,000', status: 'released', tasks: 3, dueDate: 'Apr 5' },
  { id: 'm2', title: 'Core Features', progress: 45, amount: '$12,000', status: 'in-escrow', tasks: 5, dueDate: 'Apr 20' },
  { id: 'm3', title: 'Testing & Polish', progress: 0, amount: '$8,000', status: 'pending', tasks: 4, dueDate: 'May 5' },
  { id: 'm4', title: 'Launch & Handoff', progress: 0, amount: '$5,000', status: 'pending', tasks: 2, dueDate: 'May 15' },
];

const TEAM = [
  { name: 'Sarah Chen', role: 'Lead Designer', rate: '$75/hr', hours: 42, capacity: 40, avatar: 'SC', status: 'online' as const },
  { name: 'Elena Rodriguez', role: 'Full-Stack Dev', rate: '$95/hr', hours: 68, capacity: 40, avatar: 'ER', status: 'online' as const },
  { name: 'Priya Patel', role: 'QA & Testing', rate: '$60/hr', hours: 18, capacity: 40, avatar: 'PP', status: 'away' as const },
  { name: 'Alex Kim', role: 'Project Manager', rate: '$85/hr', hours: 30, capacity: 40, avatar: 'AK', status: 'online' as const },
];

const STAKEHOLDERS = [
  { name: 'James Wright', company: 'TechVentures Inc.', role: 'Client Lead', avatar: 'JW', type: 'client' as const, lastActive: '2h ago', decisionAuth: true },
  { name: 'Maya Gupta', company: 'TechVentures Inc.', role: 'Product Owner', avatar: 'MG', type: 'client' as const, lastActive: '1d ago', decisionAuth: true },
  { name: 'David Park', company: 'TechVentures Inc.', role: 'Tech Advisor', avatar: 'DP', type: 'client' as const, lastActive: '3d ago', decisionAuth: false },
  { name: 'Alex Kim', company: 'Gigvora', role: 'Project Manager', avatar: 'AK', type: 'internal' as const, lastActive: '10m ago', decisionAuth: true },
  { name: 'Sarah Chen', company: 'Freelancer', role: 'Lead Designer', avatar: 'SC', type: 'team' as const, lastActive: '30m ago', decisionAuth: false },
  { name: 'Elena Rodriguez', company: 'Freelancer', role: 'Full-Stack Dev', avatar: 'ER', type: 'team' as const, lastActive: '15m ago', decisionAuth: false },
];

const UPDATES = [
  { author: 'Elena R.', text: 'Auth module is 80% complete. OAuth integration working, need to finish password reset flow.', time: '2h ago', type: 'progress' },
  { author: 'Sarah C.', text: 'Dashboard wireframes v2 uploaded to the deliverable vault for review.', time: '5h ago', type: 'delivery' },
  { author: 'System', text: 'Milestone 1 payment of $5,000 has been released from escrow.', time: '1d ago', type: 'payment' },
  { author: 'Priya P.', text: 'Created test plan for core features. 24 test cases identified.', time: '2d ago', type: 'update' },
  { author: 'James W.', text: 'Approved wireframe direction. Proceed with implementation.', time: '2d ago', type: 'approval' },
  { author: 'System', text: 'Sprint velocity increased 15% week-over-week.', time: '3d ago', type: 'insight' },
];

const DELIVERABLES = [
  { id: 'd1', name: 'Design System v2.fig', type: 'Figma', size: '4.2 MB', date: 'Apr 5', status: 'approved', milestone: 'Foundation', submitter: 'Sarah C.', reviewer: 'Alex K.', version: 'v2.0', comments: 3 },
  { id: 'd2', name: 'Auth Module Spec.pdf', type: 'PDF', size: '1.8 MB', date: 'Apr 8', status: 'pending-review', milestone: 'Core Features', submitter: 'Elena R.', reviewer: 'Alex K.', version: 'v1.0', comments: 0 },
  { id: 'd3', name: 'Dashboard Wireframes.fig', type: 'Figma', size: '6.1 MB', date: 'Apr 10', status: 'revision-requested', milestone: 'Core Features', submitter: 'Sarah C.', reviewer: 'Alex K.', version: 'v1.2', comments: 5 },
  { id: 'd4', name: 'API Documentation.md', type: 'Markdown', size: '245 KB', date: 'Apr 3', status: 'approved', milestone: 'Foundation', submitter: 'Elena R.', reviewer: 'Priya P.', version: 'v1.1', comments: 2 },
  { id: 'd5', name: 'Test Plan.xlsx', type: 'Excel', size: '320 KB', date: 'Apr 11', status: 'submitted', milestone: 'Testing', submitter: 'Priya P.', reviewer: 'Alex K.', version: 'v1.0', comments: 0 },
];

const MEETINGS = [
  { id: 'mt1', title: 'Sprint Planning', date: 'Apr 14, 10:00 AM', duration: '60 min', type: 'recurring', attendees: 4, status: 'upcoming' },
  { id: 'mt2', title: 'Design Review — Dashboard', date: 'Apr 15, 2:00 PM', duration: '30 min', type: 'one-time', attendees: 3, status: 'upcoming' },
  { id: 'mt3', title: 'Client Check-in', date: 'Apr 16, 11:00 AM', duration: '45 min', type: 'recurring', attendees: 5, status: 'upcoming' },
  { id: 'mt4', title: 'Daily Standup', date: 'Apr 14, 9:00 AM', duration: '15 min', type: 'daily', attendees: 4, status: 'upcoming' },
  { id: 'mt5', title: 'Retrospective', date: 'Apr 11, 4:00 PM', duration: '60 min', type: 'recurring', attendees: 4, status: 'completed' },
];

const TIME_LOGS = [
  { date: 'Apr 12', person: 'Elena R.', task: 'Auth module implementation', hours: 6, billable: true },
  { date: 'Apr 12', person: 'Sarah C.', task: 'Dashboard wireframes', hours: 5, billable: true },
  { date: 'Apr 11', person: 'Elena R.', task: 'Auth module implementation', hours: 7, billable: true },
  { date: 'Apr 11', person: 'Priya P.', task: 'Test plan creation', hours: 4, billable: true },
  { date: 'Apr 10', person: 'Sarah C.', task: 'Dashboard wireframes', hours: 5, billable: true },
  { date: 'Apr 10', person: 'Elena R.', task: 'Auth module implementation', hours: 5, billable: true },
  { date: 'Apr 9', person: 'Alex K.', task: 'Project management', hours: 3, billable: false },
];

const SUBMISSIONS = [
  { id: 'sub1', title: 'Milestone 1 — Foundation & Setup', milestone: 'm1', date: 'Apr 5', status: 'approved', deliverables: 2, reviewer: 'Client', notes: 'All deliverables meet specification.' },
  { id: 'sub2', title: 'Dashboard Wireframes — Round 1', milestone: 'm2', date: 'Apr 10', status: 'revision-requested', deliverables: 1, reviewer: 'Alex K.', notes: 'Navigation needs simplification. Resubmit with updated flow.' },
  { id: 'sub3', title: 'Auth Module Spec', milestone: 'm2', date: 'Apr 8', status: 'pending', deliverables: 1, reviewer: 'Alex K.', notes: '' },
];

const RISKS = [
  { id: 'r1', title: 'Scope creep on dashboard features', severity: 'high' as const, status: 'active', owner: 'Alex K.', impact: 'Timeline delay 1-2 weeks', mitigation: 'Freeze scope after client sign-off on wireframes v2', lastReviewed: '1d ago' },
  { id: 'r2', title: 'Elena overloaded at 170% utilization', severity: 'medium' as const, status: 'monitoring', owner: 'Alex K.', impact: 'Burnout / quality issues', mitigation: 'Consider bringing in backup dev for API layer', lastReviewed: '2d ago' },
  { id: 'r3', title: 'Third-party auth provider API changes', severity: 'low' as const, status: 'mitigated', owner: 'Elena R.', impact: 'Auth module rework', mitigation: 'Abstraction layer in place, monitoring changelog', lastReviewed: '5d ago' },
];

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive',
  medium: 'bg-[hsl(var(--state-caution))]/10 text-[hsl(var(--state-caution))]',
  low: 'bg-muted text-muted-foreground',
};
const STATUS_COLUMNS = ['backlog', 'todo', 'in-progress', 'done'];
const STATUS_LABELS: Record<string, string> = { backlog: 'Backlog', todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };
const DELIV_STATUS_COLORS: Record<string, string> = {
  approved: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  'pending-review': 'bg-accent/10 text-accent',
  'revision-requested': 'bg-[hsl(var(--state-caution))]/10 text-[hsl(var(--state-caution))]',
  submitted: 'bg-muted text-muted-foreground',
};
const SEVERITY_CONFIG = {
  high: { badge: 'blocked' as const, icon: Flame, color: 'text-destructive' },
  medium: { badge: 'caution' as const, icon: AlertTriangle, color: 'text-[hsl(var(--state-caution))]' },
  low: { badge: 'pending' as const, icon: AlertCircle, color: 'text-muted-foreground' },
};
const STATUS_RING = { online: 'ring-[hsl(var(--state-healthy))]', away: 'ring-[hsl(var(--state-caution))]', offline: 'ring-muted-foreground' };

/* ═══════════════════════════════════════════════════════════
   Workspace Home Tab
   ═══════════════════════════════════════════════════════════ */
const WorkspaceHomeTab: React.FC<{ viewMode: 'internal' | 'client' }> = ({ viewMode }) => {
  const completedTasks = TASKS.filter(t => t.status === 'done').length;
  const inProgressTasks = TASKS.filter(t => t.status === 'in-progress').length;
  const overallProgress = Math.round((completedTasks / TASKS.length) * 100);
  const budgetUsed = 13000;
  const budgetTotal = 30000;
  const nextMilestone = MILESTONES.find(m => m.progress < 100);

  return (
    <div className="space-y-4">
      {/* Health Summary Banner */}
      <div className="rounded-2xl border bg-card/80 p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-2xl bg-[hsl(var(--state-healthy))]/10 flex items-center justify-center">
            <Heart className="h-5 w-5 text-[hsl(var(--state-healthy))]" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Project Health: Good</h3>
            <p className="text-[10px] text-muted-foreground">On track · 37 days remaining · {completedTasks}/{TASKS.length} tasks complete</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[hsl(var(--state-healthy))] animate-pulse" />
            <span className="text-[9px] text-muted-foreground">Updated 12s ago</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-muted/30 p-3">
            <div className="text-[9px] text-muted-foreground mb-0.5">Progress</div>
            <div className="text-lg font-bold">{overallProgress}%</div>
            <Progress value={overallProgress} className="h-1.5 mt-1" />
          </div>
          <div className="rounded-xl bg-muted/30 p-3">
            <div className="text-[9px] text-muted-foreground mb-0.5">Budget</div>
            <div className="text-lg font-bold">${Math.round(budgetUsed/1000)}K <span className="text-[10px] font-normal text-muted-foreground">/ ${Math.round(budgetTotal/1000)}K</span></div>
            <Progress value={(budgetUsed / budgetTotal) * 100} className="h-1.5 mt-1" />
          </div>
          <div className="rounded-xl bg-muted/30 p-3">
            <div className="text-[9px] text-muted-foreground mb-0.5">Sprint Velocity</div>
            <div className="text-lg font-bold flex items-center gap-1">12 <TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" /></div>
            <div className="text-[9px] text-muted-foreground">+15% vs last sprint</div>
          </div>
          <div className="rounded-xl bg-muted/30 p-3">
            <div className="text-[9px] text-muted-foreground mb-0.5">Active Risks</div>
            <div className="text-lg font-bold">{RISKS.filter(r => r.status === 'active').length}</div>
            <div className="text-[9px] text-[hsl(var(--state-caution))]">1 high severity</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {/* Next Milestone */}
        {nextMilestone && (
          <div className="rounded-2xl border bg-card/80 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-accent" />
              <span className="text-[11px] font-semibold">Next Milestone</span>
              <StatusBadge status={nextMilestone.status === 'in-escrow' ? 'live' : 'pending'} label={nextMilestone.status} />
            </div>
            <h4 className="text-sm font-bold mb-1">{nextMilestone.title}</h4>
            <div className="text-[10px] text-muted-foreground mb-2">{nextMilestone.tasks} tasks · {nextMilestone.amount} · Due {nextMilestone.dueDate}</div>
            <Progress value={nextMilestone.progress} className="h-2 mb-1.5" />
            <div className="flex justify-between text-[9px]">
              <span className="text-muted-foreground">{nextMilestone.progress}% complete</span>
              <Button variant="outline" size="sm" className="h-5 text-[8px] rounded-lg">View Tasks</Button>
            </div>
          </div>
        )}

        {/* Recent Decisions */}
        <div className="rounded-2xl border bg-card/80 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-accent" />
            <span className="text-[11px] font-semibold">Recent Decisions</span>
          </div>
          <div className="space-y-2">
            {[
              { decision: 'Approved wireframe direction for dashboard', by: 'James W.', date: '2d ago', status: 'approved' },
              { decision: 'Extended auth module timeline by 1 week', by: 'Maya G.', date: '5d ago', status: 'approved' },
              { decision: 'Pending: Color palette sign-off', by: 'James W.', date: 'Awaiting', status: 'pending' },
            ].map((d, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px]">
                <div className={cn('h-4 w-4 rounded-full flex items-center justify-center shrink-0 mt-0.5', d.status === 'approved' ? 'bg-[hsl(var(--state-healthy))]/10' : 'bg-[hsl(var(--state-caution))]/10')}>
                  {d.status === 'approved' ? <Check className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" /> : <Clock className="h-2.5 w-2.5 text-[hsl(var(--state-caution))]" />}
                </div>
                <div>
                  <div className="font-medium">{d.decision}</div>
                  <div className="text-[9px] text-muted-foreground">{d.by} · {d.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* In-Progress Tasks */}
      <div className="rounded-2xl border bg-card/80 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-accent" />Active Work ({inProgressTasks})</span>
          <Link to={`/projects/p1/board`} className="text-[9px] text-accent hover:underline flex items-center gap-0.5">View Board <ChevronRight className="h-3 w-3" /></Link>
        </div>
        <div className="space-y-1.5">
          {TASKS.filter(t => t.status === 'in-progress').map(task => (
            <div key={task.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border hover:bg-muted/20 transition-all cursor-pointer">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse shrink-0" />
              <span className="text-[10px] font-medium flex-1">{task.title}</span>
              <Badge className={cn('text-[8px]', PRIORITY_COLORS[task.priority])}>{task.priority}</Badge>
              <Avatar className="h-5 w-5"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{task.assignee[0]}</AvatarFallback></Avatar>
              <span className="text-[9px] text-muted-foreground">{task.logged}/{task.estimate}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed (last 4) */}
      <div className="rounded-2xl border bg-card/80 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-accent" />Activity</span>
          <span className="text-[9px] text-muted-foreground">{viewMode === 'client' ? 'Client-visible only' : 'All activity'}</span>
        </div>
        <div className="space-y-1">
          {UPDATES
            .filter(u => viewMode === 'client' ? u.type !== 'progress' : true)
            .slice(0, 4)
            .map((u, i) => (
            <div key={i} className="flex gap-2.5 py-1.5">
              <div className="flex flex-col items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0 mt-2" />
                {i < 3 && <div className="w-px flex-1 bg-border" />}
              </div>
              <div className="pb-1">
                <div className="text-[10px]"><span className="font-medium">{u.author}</span> <span className="text-muted-foreground">{u.text}</span></div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[8px] text-muted-foreground">{u.time}</span>
                  <Badge variant="secondary" className="text-[7px] capitalize">{u.type}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Stakeholder Panel
   ═══════════════════════════════════════════════════════════ */
const StakeholderPanel: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'client' | 'team' | 'internal'>('all');
  const filtered = filter === 'all' ? STAKEHOLDERS : STAKEHOLDERS.filter(s => s.type === filter);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        {(['all', 'client', 'team', 'internal'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn(
            'px-2.5 py-1 rounded-xl text-[10px] font-medium transition-all capitalize',
            filter === f ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'
          )}>{f}</button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(s => (
          <div key={s.name} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border hover:shadow-sm hover:-translate-y-px transition-all cursor-pointer">
            <Avatar className={cn('h-9 w-9 ring-2', STATUS_RING[s.type === 'team' ? (TEAM.find(t => t.avatar === s.avatar)?.status || 'offline') : 'offline'])}>
              <AvatarFallback className="text-[9px] bg-accent/10 text-accent font-bold">{s.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold truncate">{s.name}</span>
                {s.decisionAuth && <Badge className="text-[7px] bg-accent/10 text-accent">Decision Maker</Badge>}
              </div>
              <div className="text-[9px] text-muted-foreground">{s.role} · {s.company}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[8px] text-muted-foreground">{s.lastActive}</div>
              <Badge variant="secondary" className="text-[7px] capitalize">{s.type}</Badge>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => toast.info(`Opening message to ${s.name}…`)}><MessageSquare className="h-3 w-3" /></Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl"><UserPlus className="h-3 w-3" />Invite Stakeholder</Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl"><Download className="h-3 w-3" />Export RACI</Button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Risk Block
   ═══════════════════════════════════════════════════════════ */
const RiskBlock: React.FC = () => (
  <div className="space-y-3">
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: 'Active', count: RISKS.filter(r => r.status === 'active').length, color: 'text-destructive' },
        { label: 'Monitoring', count: RISKS.filter(r => r.status === 'monitoring').length, color: 'text-[hsl(var(--state-caution))]' },
        { label: 'Mitigated', count: RISKS.filter(r => r.status === 'mitigated').length, color: 'text-[hsl(var(--state-healthy))]' },
      ].map(s => (
        <div key={s.label} className="rounded-xl border p-2.5 text-center">
          <div className={cn('text-lg font-bold', s.color)}>{s.count}</div>
          <div className="text-[9px] text-muted-foreground">{s.label}</div>
        </div>
      ))}
    </div>
    <div className="space-y-2">
      {RISKS.map(r => {
        const cfg = SEVERITY_CONFIG[r.severity];
        return (
          <div key={r.id} className="rounded-2xl border p-3 hover:shadow-sm transition-all">
            <div className="flex items-center gap-2 mb-1.5">
              <cfg.icon className={cn('h-3.5 w-3.5', cfg.color)} />
              <span className="text-[11px] font-semibold flex-1">{r.title}</span>
              <StatusBadge status={cfg.badge} label={r.severity} />
              <Badge variant="secondary" className="text-[7px] capitalize">{r.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[9px] mb-2">
              <div><span className="text-muted-foreground">Impact:</span> {r.impact}</div>
              <div><span className="text-muted-foreground">Owner:</span> {r.owner}</div>
            </div>
            <div className="rounded-xl bg-muted/30 px-2.5 py-1.5 text-[9px]">
              <span className="text-muted-foreground">Mitigation:</span> {r.mitigation}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[8px] text-muted-foreground">Reviewed {r.lastReviewed}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-5 text-[8px] rounded-lg" onClick={() => toast.info('Updating risk…')}>Update</Button>
                {r.status === 'active' && <Button variant="outline" size="sm" className="h-5 text-[8px] rounded-lg" onClick={() => toast.success('Escalated to client')}>Escalate</Button>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl w-full"><Plus className="h-3 w-3" />Log New Risk</Button>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Kanban Board
   ═══════════════════════════════════════════════════════════ */
const KanbanBoard = () => (
  <div className="flex gap-3 overflow-x-auto pb-4">
    {STATUS_COLUMNS.map(status => {
      const tasks = TASKS.filter(t => t.status === status);
      return (
        <div key={status} className="flex-shrink-0 w-64">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold">{STATUS_LABELS[status]} <span className="text-muted-foreground">({tasks.length})</span></span>
            <Button variant="ghost" size="icon" className="h-6 w-6"><Plus className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="space-y-2">
            {tasks.map(task => (
              <div key={task.id} className="rounded-2xl border bg-card p-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] font-medium">{task.title}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5"><MoreHorizontal className="h-3 w-3" /></Button>
                </div>
                <div className="flex items-center justify-between">
                  <Badge className={cn('text-[8px]', PRIORITY_COLORS[task.priority])}>{task.priority}</Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground">{task.due}</span>
                    <Avatar className="h-5 w-5"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{task.assignee[0]}</AvatarFallback></Avatar>
                  </div>
                </div>
                {task.dependencies.length > 0 && <div className="text-[9px] text-muted-foreground mt-1.5">→ depends on {task.dependencies.length} task(s)</div>}
              </div>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Task List
   ═══════════════════════════════════════════════════════════ */
const TaskListView = () => (
  <div className="rounded-2xl border overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-muted/50 text-muted-foreground">
        <tr>
          <th className="text-left px-4 py-2 text-[10px] font-medium">Task</th>
          <th className="text-left px-4 py-2 text-[10px] font-medium">Status</th>
          <th className="text-left px-4 py-2 text-[10px] font-medium">Priority</th>
          <th className="text-left px-4 py-2 text-[10px] font-medium">Assignee</th>
          <th className="text-left px-4 py-2 text-[10px] font-medium">Due</th>
          <th className="text-left px-4 py-2 text-[10px] font-medium">Est.</th>
          <th className="text-left px-4 py-2 text-[10px] font-medium">Logged</th>
        </tr>
      </thead>
      <tbody>
        {TASKS.map(task => (
          <tr key={task.id} className="border-t hover:bg-muted/30 transition-colors cursor-pointer">
            <td className="px-4 py-2.5 text-[10px] font-medium">{task.title}</td>
            <td className="px-4 py-2.5"><Badge variant="secondary" className="text-[8px] capitalize">{task.status.replace('-', ' ')}</Badge></td>
            <td className="px-4 py-2.5"><Badge className={cn('text-[8px]', PRIORITY_COLORS[task.priority])}>{task.priority}</Badge></td>
            <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{task.assignee}</td>
            <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{task.due}</td>
            <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{task.estimate}</td>
            <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{task.logged}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Timeline / Gantt
   ═══════════════════════════════════════════════════════════ */
const TimelineView = () => {
  const weeks = ['Apr 1-7', 'Apr 8-14', 'Apr 15-21', 'Apr 22-28', 'Apr 29-May 5', 'May 6-12', 'May 13-15'];
  const taskBars = [
    { task: 'Design system setup', start: 0, span: 1, status: 'done' },
    { task: 'Auth module', start: 1, span: 2, status: 'in-progress' },
    { task: 'Dashboard wireframes', start: 1, span: 2, status: 'in-progress' },
    { task: 'API integration', start: 3, span: 1, status: 'todo' },
    { task: 'User testing', start: 3, span: 2, status: 'todo' },
    { task: 'Performance opt.', start: 4, span: 1, status: 'todo' },
    { task: 'Documentation', start: 5, span: 2, status: 'backlog' },
  ];

  return (
    <div className="rounded-2xl border bg-card p-5 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[11px] flex items-center gap-2"><GanttChart className="h-4 w-4 text-accent" /> Project Timeline</h3>
        <div className="flex gap-2 text-[9px]">
          {[{ label: 'Done', color: 'bg-[hsl(var(--state-healthy))]' }, { label: 'In Progress', color: 'bg-accent' }, { label: 'To Do', color: 'bg-muted-foreground/30' }, { label: 'Backlog', color: 'bg-muted-foreground/10' }].map(l => (
            <span key={l.label} className="flex items-center gap-1"><span className={cn('h-2 w-2 rounded-full', l.color)} /> {l.label}</span>
          ))}
        </div>
      </div>
      <div className="min-w-[800px]">
        <div className="grid grid-cols-[180px_repeat(7,1fr)] gap-0 border-b pb-2 mb-2">
          <div className="text-[10px] font-medium text-muted-foreground">Task</div>
          {weeks.map(w => <div key={w} className="text-[9px] text-muted-foreground text-center">{w}</div>)}
        </div>
        {taskBars.map((bar, i) => (
          <div key={i} className="grid grid-cols-[180px_repeat(7,1fr)] gap-0 items-center py-1.5">
            <div className="text-[10px] truncate pr-2">{bar.task}</div>
            {weeks.map((_, wi) => (
              <div key={wi} className="h-6 px-0.5">
                {wi >= bar.start && wi < bar.start + bar.span && (
                  <div className={cn('h-full rounded-md', bar.status === 'done' ? 'bg-[hsl(var(--state-healthy))]' : bar.status === 'in-progress' ? 'bg-accent' : bar.status === 'todo' ? 'bg-muted-foreground/30' : 'bg-muted-foreground/10')} />
                )}
              </div>
            ))}
          </div>
        ))}
        <div className="grid grid-cols-[180px_repeat(7,1fr)] gap-0 items-center py-2 border-t mt-2">
          <div className="text-[10px] font-medium text-accent">Milestones</div>
          {weeks.map((_, wi) => (
            <div key={wi} className="flex justify-center">
              {wi === 0 && <div className="h-4 w-4 rounded-full bg-[hsl(var(--state-healthy))] flex items-center justify-center"><Check className="h-2.5 w-2.5 text-white" /></div>}
              {wi === 3 && <div className="h-4 w-4 rounded-full bg-accent flex items-center justify-center"><Target className="h-2.5 w-2.5 text-white" /></div>}
              {wi === 5 && <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />}
              {wi === 6 && <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Workload View
   ═══════════════════════════════════════════════════════════ */
const WorkloadView = () => (
  <div className="rounded-2xl border bg-card p-5">
    <h3 className="font-semibold text-[11px] mb-4 flex items-center gap-2"><Activity className="h-4 w-4 text-accent" /> Workload Distribution</h3>
    <div className="space-y-3">
      {TEAM.map(m => {
        const assignedTasks = TASKS.filter(t => t.assignee.startsWith(m.name.split(' ')[0]));
        const totalEstimate = assignedTasks.reduce((a, t) => a + parseInt(t.estimate), 0);
        const totalLogged = assignedTasks.reduce((a, t) => a + parseFloat(t.logged), 0);
        const utilization = Math.round((totalEstimate / m.capacity) * 100);
        return (
          <div key={m.name} className="rounded-xl border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Avatar className={cn('h-8 w-8 ring-2', STATUS_RING[m.status])}><AvatarFallback className="text-[9px] bg-accent/10 text-accent">{m.avatar}</AvatarFallback></Avatar>
                <div>
                  <div className="text-[11px] font-medium">{m.name}</div>
                  <div className="text-[9px] text-muted-foreground">{m.role}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={cn('text-sm font-bold', utilization > 100 ? 'text-destructive' : utilization > 80 ? 'text-[hsl(var(--state-caution))]' : 'text-[hsl(var(--state-healthy))]')}>{utilization}%</div>
                <div className="text-[9px] text-muted-foreground">utilization</div>
              </div>
            </div>
            <Progress value={Math.min(utilization, 100)} className="h-1.5 mb-2" />
            <div className="flex gap-3 text-[9px] text-muted-foreground">
              <span>{assignedTasks.length} tasks</span>
              <span>{totalEstimate}h est.</span>
              <span>{totalLogged}h logged</span>
              <span>{m.capacity}h cap.</span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Deliverable Vault
   ═══════════════════════════════════════════════════════════ */
const DeliverableVault = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = DELIVERABLES.find(d => d.id === selectedId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[11px]">Deliverable Vault</h3>
        <Button size="sm" className="gap-1 rounded-xl h-7 text-[10px]"><Upload className="h-3.5 w-3.5" /> Upload</Button>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <div className={cn('space-y-1.5', selected ? 'md:col-span-1' : 'md:col-span-3')}>
          {DELIVERABLES.map(d => (
            <div key={d.id} onClick={() => setSelectedId(d.id)} className={cn('flex items-center justify-between p-2.5 rounded-xl border hover:bg-muted/30 transition-all cursor-pointer', selectedId === d.id && 'border-accent bg-accent/5')}>
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-[10px] font-medium">{d.name}</div>
                  <div className="text-[8px] text-muted-foreground">{d.type} · {d.size} · {d.version}</div>
                </div>
              </div>
              <Badge className={cn('text-[8px]', DELIV_STATUS_COLORS[d.status])}>{d.status.replace('-', ' ')}</Badge>
            </div>
          ))}
        </div>
        {selected && (
          <div className="md:col-span-2 rounded-2xl border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-[11px]">{selected.name}</h3>
                <p className="text-[9px] text-muted-foreground">{selected.type} · {selected.size} · Version {selected.version}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedId(null)}><X className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              {[
                { label: 'Milestone', value: selected.milestone },
                { label: 'Submitted by', value: selected.submitter },
                { label: 'Reviewer', value: selected.reviewer },
                { label: 'Status', value: selected.status.replace('-', ' ') },
              ].map(f => (
                <div key={f.label}><div className="text-[9px] text-muted-foreground">{f.label}</div><div className="text-[10px] font-medium capitalize">{f.value}</div></div>
              ))}
            </div>
            <div className="h-40 rounded-xl bg-muted/30 flex items-center justify-center mb-3 text-muted-foreground">
              <Eye className="h-5 w-5 mr-2" /> File Preview
            </div>
            <div className="flex gap-2 mb-3">
              <Button size="sm" className="gap-1 flex-1 h-7 text-[10px] rounded-xl"><ThumbsUp className="h-3 w-3" /> Approve</Button>
              <Button size="sm" variant="outline" className="gap-1 flex-1 h-7 text-[10px] rounded-xl"><ThumbsDown className="h-3 w-3" /> Revise</Button>
              <Button size="sm" variant="outline" className="gap-1 h-7 text-[10px] rounded-xl"><Download className="h-3 w-3" /></Button>
            </div>
            <div className="rounded-xl border p-2.5">
              <div className="text-[10px] font-medium mb-1.5">Comments ({selected.comments})</div>
              <div className="flex gap-2">
                <input placeholder="Add a comment..." className="flex-1 h-7 rounded-lg border bg-background px-2.5 text-[10px]" />
                <Button size="sm" className="h-7 text-[10px] rounded-lg">Post</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Submissions & Approvals
   ═══════════════════════════════════════════════════════════ */
const SubmissionsView = () => {
  const statusColors: Record<string, string> = {
    approved: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
    'revision-requested': 'bg-[hsl(var(--state-caution))]/10 text-[hsl(var(--state-caution))]',
    pending: 'bg-accent/10 text-accent',
  };

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[11px]">Submissions & Approvals</h3>
        <Button size="sm" className="gap-1 h-7 text-[10px] rounded-xl"><Upload className="h-3.5 w-3.5" /> New Submission</Button>
      </div>
      <div className="space-y-2">
        {SUBMISSIONS.map(s => (
          <div key={s.id} className="rounded-xl border p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <div className="text-[11px] font-medium">{s.title}</div>
                <div className="text-[9px] text-muted-foreground">Submitted {s.date} · {s.deliverables} deliverable(s) · Reviewer: {s.reviewer}</div>
              </div>
              <Badge className={cn('text-[8px]', statusColors[s.status])}>{s.status.replace('-', ' ')}</Badge>
            </div>
            {s.notes && <p className="text-[9px] text-muted-foreground bg-muted/30 rounded-lg p-2 mt-1.5">{s.notes}</p>}
            <div className="flex gap-2 mt-2">
              {s.status === 'pending' && (
                <>
                  <Button size="sm" className="h-6 text-[9px] gap-1 rounded-lg"><ThumbsUp className="h-3 w-3" /> Approve</Button>
                  <Button size="sm" variant="outline" className="h-6 text-[9px] gap-1 rounded-lg"><ThumbsDown className="h-3 w-3" /> Revise</Button>
                </>
              )}
              {s.status === 'revision-requested' && <Button size="sm" className="h-6 text-[9px] gap-1 rounded-lg"><Upload className="h-3 w-3" /> Resubmit</Button>}
              <Button size="sm" variant="outline" className="h-6 text-[9px] gap-1 rounded-lg"><Eye className="h-3 w-3" /> Details</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Meeting Calendar
   ═══════════════════════════════════════════════════════════ */
const MeetingCalendar = () => (
  <div className="rounded-2xl border bg-card p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-[11px] flex items-center gap-2"><Video className="h-4 w-4 text-accent" /> Meetings</h3>
      <Button size="sm" className="gap-1 h-7 text-[10px] rounded-xl"><Plus className="h-3.5 w-3.5" /> Schedule</Button>
    </div>
    <div className="space-y-1.5">
      {MEETINGS.map(m => (
        <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl border hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center', m.status === 'completed' ? 'bg-muted' : 'bg-accent/10')}>
              <Video className={cn('h-3.5 w-3.5', m.status === 'completed' ? 'text-muted-foreground' : 'text-accent')} />
            </div>
            <div>
              <div className="text-[10px] font-medium">{m.title}</div>
              <div className="text-[9px] text-muted-foreground">{m.date} · {m.duration} · {m.attendees} attendees</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[8px]">{m.type}</Badge>
            {m.status === 'upcoming' ? (
              <Button size="sm" className="h-6 text-[9px] gap-1 rounded-lg"><Play className="h-3 w-3" /> Join</Button>
            ) : (
              <Badge variant="secondary" className="text-[8px] bg-muted">Done</Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Time Logs
   ═══════════════════════════════════════════════════════════ */
const TimeLogsView = () => {
  const totalHours = TIME_LOGS.reduce((a, l) => a + l.hours, 0);
  const billableHours = TIME_LOGS.filter(l => l.billable).reduce((a, l) => a + l.hours, 0);

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[11px] flex items-center gap-2"><Timer className="h-4 w-4 text-accent" /> Time Logs</h3>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" className="h-6 text-[9px] gap-1 rounded-lg"><Download className="h-3 w-3" /> Export</Button>
          <Button size="sm" className="h-6 text-[9px] gap-1 rounded-lg"><Play className="h-3 w-3" /> Start Timer</Button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2.5 mb-3">
        <div className="rounded-xl bg-muted/30 p-2.5 text-center"><div className="text-base font-bold">{totalHours}h</div><div className="text-[9px] text-muted-foreground">Total</div></div>
        <div className="rounded-xl bg-muted/30 p-2.5 text-center"><div className="text-base font-bold">{billableHours}h</div><div className="text-[9px] text-muted-foreground">Billable</div></div>
        <div className="rounded-xl bg-muted/30 p-2.5 text-center"><div className="text-base font-bold">${(billableHours * 80).toLocaleString()}</div><div className="text-[9px] text-muted-foreground">Value</div></div>
      </div>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-[10px]">
          <thead className="bg-muted/50"><tr><th className="text-left px-3 py-2 font-medium">Date</th><th className="text-left px-3 py-2 font-medium">Person</th><th className="text-left px-3 py-2 font-medium">Task</th><th className="text-left px-3 py-2 font-medium">Hours</th><th className="text-left px-3 py-2 font-medium">Bill.</th></tr></thead>
          <tbody>
            {TIME_LOGS.map((l, i) => (
              <tr key={i} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2 text-muted-foreground">{l.date}</td>
                <td className="px-3 py-2">{l.person}</td>
                <td className="px-3 py-2">{l.task}</td>
                <td className="px-3 py-2 font-medium">{l.hours}h</td>
                <td className="px-3 py-2">{l.billable ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /> : <X className="h-3 w-3 text-muted-foreground" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Budget Detail
   ═══════════════════════════════════════════════════════════ */
const BudgetView = () => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
      {[
        { label: 'Total Budget', value: '$30,000' },
        { label: 'Spent', value: '$13,000', color: 'text-foreground' },
        { label: 'In Escrow', value: '$12,000', color: 'text-accent' },
        { label: 'Remaining', value: '$5,000', color: 'text-[hsl(var(--state-healthy))]' },
      ].map(b => (
        <div key={b.label} className="rounded-2xl border bg-card p-3 text-center">
          <div className="text-[9px] text-muted-foreground mb-0.5">{b.label}</div>
          <div className={cn('text-lg font-bold', b.color)}>{b.value}</div>
        </div>
      ))}
    </div>
    <div className="grid md:grid-cols-2 gap-3">
      <div className="rounded-2xl border bg-card p-4">
        <h3 className="font-semibold text-[11px] mb-2.5">Milestone Payments</h3>
        <div className="space-y-2">
          {MILESTONES.map(m => (
            <div key={m.id} className="flex items-center justify-between text-[10px]">
              <span>{m.title}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{m.amount}</span>
                <Badge variant="secondary" className={cn('text-[8px]', m.status === 'released' && 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]', m.status === 'in-escrow' && 'bg-accent/10 text-accent')}>{m.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border bg-card p-4">
        <h3 className="font-semibold text-[11px] mb-2.5">Team Costs</h3>
        <div className="space-y-1.5">
          {TEAM.map(t => {
            const total = parseInt(t.rate.replace(/\D/g, '')) * t.hours;
            return (
              <div key={t.name} className="flex items-center justify-between text-[10px]">
                <div><span className="font-medium">{t.name}</span><span className="text-muted-foreground ml-1.5 text-[9px]">{t.rate} × {t.hours}h</span></div>
                <span className="font-medium">${total.toLocaleString()}</span>
              </div>
            );
          })}
          <div className="border-t pt-1.5 flex justify-between font-semibold text-[11px]">
            <span>Total</span><span>${TEAM.reduce((a, t) => a + parseInt(t.rate.replace(/\D/g, '')) * t.hours, 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
    <div className="rounded-2xl border bg-card p-4">
      <h3 className="font-semibold text-[11px] mb-2.5">Objectives</h3>
      <div className="space-y-2.5">
        {[
          { obj: 'Launch MVP by May 15', progress: 45 },
          { obj: 'Achieve 95% test coverage', progress: 20 },
          { obj: 'Sub-2s page load time', progress: 0 },
        ].map(o => (
          <div key={o.obj}>
            <div className="flex justify-between text-[10px] mb-1"><span>{o.obj}</span><span className="text-muted-foreground">{o.progress}%</span></div>
            <Progress value={o.progress} className="h-1.5" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Archive
   ═══════════════════════════════════════════════════════════ */
const ArchiveView = () => (
  <div className="rounded-2xl border bg-card p-5">
    <div className="flex items-center gap-2 mb-3">
      <Archive className="h-4 w-4 text-accent" />
      <h3 className="font-semibold text-[11px]">Project Archive</h3>
    </div>
    <p className="text-[10px] text-muted-foreground mb-4">Archive this project to preserve all data, deliverables, and analytics. Archived projects are read-only.</p>
    <div className="grid grid-cols-3 gap-3 mb-4">
      {[
        { label: 'Completed Tasks', value: `${TASKS.filter(t => t.status === 'done').length}/${TASKS.length}` },
        { label: 'Deliverables', value: `${DELIVERABLES.filter(d => d.status === 'approved').length} approved` },
        { label: 'Total Logged', value: `${TEAM.reduce((a, t) => a + t.hours, 0)}h` },
      ].map(s => (
        <div key={s.label} className="rounded-xl bg-muted/30 p-2.5 text-center">
          <div className="text-base font-bold">{s.value}</div>
          <div className="text-[9px] text-muted-foreground">{s.label}</div>
        </div>
      ))}
    </div>
    <div className="space-y-1.5 mb-4">
      {['Project Brief & Scope', 'All Deliverables', 'Chat History', 'Time Logs & Budget', 'Milestones & Submissions', 'Risk Flags & Change Requests'].map(item => (
        <div key={item} className="flex items-center gap-2 text-[10px]"><CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" /> {item} — will be preserved</div>
      ))}
    </div>
    <div className="flex gap-2">
      <Button variant="outline" className="gap-1 h-8 text-[10px] rounded-xl"><Download className="h-3.5 w-3.5" /> Export All</Button>
      <Button className="gap-1 h-8 text-[10px] rounded-xl"><Archive className="h-3.5 w-3.5" /> Archive Project</Button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════
   Real-data adapters — derive view-model from API workspace
   ═══════════════════════════════════════════════════════════ */
const fmtMoney = (cents: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

function statusToView(s: ApiMilestone['status']): 'released' | 'in-escrow' | 'pending' | 'disputed' {
  if (s === 'released') return 'released';
  if (s === 'funded' || s === 'in-progress' || s === 'in-review') return 'in-escrow';
  if (s === 'disputed') return 'disputed';
  return 'pending';
}

const ProjectWorkspacePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [chatMsg, setChatMsg] = useState('');
  const [viewMode, setViewMode] = useState<'internal' | 'client'>('internal');
  const [commentDrawer, setCommentDrawer] = useState(false);

  // Resolve workspace by projectId — backend list endpoint filters by projectId,
  // and we take the first active workspace returned.
  const apiOn = pwhApiConfigured();
  const wsList = useWorkspaces(projectId ? { projectId } : {});
  const workspaceId = wsList.data?.[0]?.id;
  const wsDetail = useWorkspaceDetail(workspaceId);
  const ws: Workspace | undefined = wsDetail.data ?? wsList.data?.[0];

  // Mutations
  const mKickoff = useKickoffWorkspace(workspaceId ?? '');
  const mTransition = useTransitionMilestone(workspaceId ?? '');
  const mSubmitDeliv = useSubmitDeliverable(workspaceId ?? '');
  const mReviewDeliv = useReviewDeliverable(workspaceId ?? '');
  const mCompleteItem = useCompleteChecklistItem(workspaceId ?? '');
  const mStartHandover = useStartHandover(workspaceId ?? '');
  const mHold = useHoldWorkspace(workspaceId ?? '');
  const mCancel = useCancelWorkspace(workspaceId ?? '');
  const mClose = useCloseWorkspace(workspaceId ?? '');

  // Derive view-model — fall back to local mock arrays when API is offline so
  // the preview keeps rendering. Real values override mock when present.
  const milestones = useMemo(() => {
    if (ws?.milestones?.length) {
      return ws.milestones.map((m, i) => ({
        id: m.id,
        title: m.title,
        progress: m.progress ?? 0,
        amount: fmtMoney(m.amountCents, m.currency),
        status: statusToView(m.status),
        rawStatus: m.status,
        version: m.version,
        tasks: m.taskCount ?? 0,
        dueDate: fmtDate(m.dueAt),
        index: i,
      }));
    }
    return MILESTONES.map((m, i) => ({ ...m, status: m.status as any, rawStatus: m.status as ApiMilestone['status'], version: 0, index: i }));
  }, [ws]);

  const updates = useMemo(() => {
    if (ws?.updates?.length) {
      return ws.updates.map((u) => ({
        author: u.author, text: u.text, time: new Date(u.at).toLocaleString(), type: u.type,
      }));
    }
    return UPDATES;
  }, [ws]);

  const isLive = wsDetail.isFetching || wsList.isFetching;
  const apiError = (wsDetail.error || wsList.error) as Error | undefined;

  // Action handlers
  const onMilestoneAction = (m: typeof milestones[number], to: ApiMilestone['status']) => {
    if (!workspaceId) { toast.error('No workspace bound'); return; }
    mTransition.mutate({ milestoneId: m.id, toStatus: to, expectedVersion: m.version });
  };
  const onSubmitChat = () => {
    const t = chatMsg.trim();
    if (!t) return;
    setChatMsg('');
    // Chat updates flow through the inbox/messaging domain; until that wiring lands
    // here, surface optimistic feedback so the send button is never dead.
    toast.success('Message queued for delivery');
  };

  const wsTitle = ws?.title ?? 'SaaS Platform Development';
  const wsStatus = ws?.status ?? 'in-progress';

  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Layers className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold truncate">{wsTitle}</span>
        <StatusBadge status={wsStatus === 'closed' ? 'pending' : wsStatus === 'on-hold' ? 'caution' : 'live'} label={wsStatus} />
        {isLive && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>
      <div className="flex-1" />
      {!apiOn && (
        <Badge variant="secondary" className="gap-1 text-[8px]"><WifiOff className="h-2.5 w-2.5" />Preview data</Badge>
      )}
      <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-0.5">
        {(['internal', 'client'] as const).map(m => (
          <button key={m} onClick={() => setViewMode(m)} className={cn('px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all capitalize', viewMode === m ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{m === 'internal' ? '🔒 Internal' : '👁 Client'}</button>
        ))}
      </div>
      {wsStatus === 'draft' && workspaceId && (
        <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl" disabled={mKickoff.isPending} onClick={() => mKickoff.mutate()}>
          <Play className="h-3 w-3" />Kickoff
        </Button>
      )}
      <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => toast.info('Opening message…')}><MessageSquare className="h-3 w-3" />Comment</Button>
      <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => setCommentDrawer(true)}><Plus className="h-3 w-3" />New Task</Button>
      <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl" asChild><Link to="/settings"><Settings className="h-3 w-3" /></Link></Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Team" icon={<Users className="h-3.5 w-3.5 text-accent" />} action={<span className="text-[8px] text-accent">{TEAM.length}</span>} className="!rounded-2xl">
        <div className="space-y-1">
          {TEAM.map(t => (
            <div key={t.name} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/30 cursor-pointer transition-colors">
              <Avatar className={cn('h-6 w-6 ring-2', STATUS_RING[t.status])}><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{t.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-medium truncate">{t.name}</div>
                <div className="text-[7px] text-muted-foreground">{t.role}</div>
              </div>
              <div className="text-[7px] text-muted-foreground">{t.hours}h</div>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="h-5 text-[8px] w-full mt-1 gap-1 rounded-lg"><UserPlus className="h-2.5 w-2.5" />Add</Button>
      </SectionCard>

      <SectionCard title="Milestones" icon={<Milestone className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {milestones.map((m) => (
            <div key={m.id} className="rounded-xl border p-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-medium">{m.title}</span>
                <span className="text-[8px] font-bold">{m.amount}</span>
              </div>
              <Progress value={m.progress} className="h-1 mb-0.5" />
              <div className="flex justify-between text-[7px] text-muted-foreground">
                <span>{m.progress}%</span>
                <StatusBadge status={m.status === 'released' ? 'healthy' : m.status === 'in-escrow' ? 'live' : 'pending'} label={m.status} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { l: 'Task Board', icon: LayoutGrid, href: `/projects/${projectId || 'p1'}/board` },
            { l: 'Contract', icon: FileText, href: '/contracts/sow' },
            { l: 'Escrow', icon: Shield, href: '#' },
            { l: 'Disputes', icon: ShieldAlert, href: '/disputes' },
          ].map(a => (
            <Link key={a.l} to={a.href} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent/5 transition-colors w-full text-[8px] font-medium">
              <a.icon className="h-3 w-3 text-accent" />{a.l}
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Linked" icon={<ExternalLink className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-0.5 text-[8px]">
          {[
            { l: ws?.contractId ? `Contract #${ws.contractId.slice(0, 10)}` : 'Contract #CT-2024-12', type: 'Contract', href: '/contracts/sow' },
            { l: 'Acme Corp', type: 'Company', href: '/company' },
            { l: 'Support Ticket #48', type: 'Support', href: '/help' },
          ].map(lo => (
            <Link key={lo.l} to={lo.href} className="flex items-center justify-between p-1 rounded-lg hover:bg-muted/30 cursor-pointer">
              <span className="font-medium truncate">{lo.l}</span>
              <Badge variant="secondary" className="text-[6px] shrink-0">{lo.type}</Badge>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><Activity className="h-3.5 w-3.5 text-accent" />Recent Activity</div>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {updates.slice(0, 4).map((u, i) => (
          <div key={i} className="shrink-0 rounded-xl border bg-card px-3 py-2 min-w-[220px] hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Avatar className="h-4 w-4"><AvatarFallback className="text-[5px]">{u.author[0]}</AvatarFallback></Avatar>
              <span className="text-[9px] font-medium">{u.author}</span>
              <Badge variant="secondary" className="text-[6px] capitalize">{u.type}</Badge>
            </div>
            <p className="text-[8px] text-muted-foreground line-clamp-2">{u.text}</p>
            <div className="text-[7px] text-muted-foreground mt-0.5">{u.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // KPIs from API budget when available
  const totalBudget = ws?.budget ? fmtMoney(ws.budget.totalCents, ws.budget.currency) : '$30,000';
  const spent = ws?.budget ? fmtMoney(ws.budget.spentCents, ws.budget.currency) : '$13K billed';
  const taskTotal = milestones.reduce((a, m) => a + (m.tasks ?? 0), 0);
  const tasksDone = milestones.filter((m) => m.status === 'released').length;

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52" bottomSection={bottomSection}>
      {apiError && (
        <div className="mb-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-[10px] text-destructive flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5" />Failed to load workspace: {apiError.message}. Showing cached preview.
        </div>
      )}
      <KPIBand className="mb-3">
        <KPICard label="Budget" value={totalBudget} change={`${spent} spent`} trend="up" />
        <KPICard label="Milestones" value={`${tasksDone}/${milestones.length}`} change={`${milestones.length - tasksDone} open`} />
        <KPICard label="Hours" value="158h" change="$13K billed" />
        <KPICard label="Deadline" value={ws?.closedAt ? fmtDate(ws.closedAt) : 'May 15'} change={ws?.startedAt ? `Started ${fmtDate(ws.startedAt)}` : '37 days left'} />
      </KPIBand>

      <Tabs defaultValue="home">
        <TabsList className="mb-3 flex-wrap h-auto gap-0.5">
          <TabsTrigger value="home" className="gap-1 text-[10px] h-6 px-2"><Home className="h-3 w-3" />Home</TabsTrigger>
          <TabsTrigger value="kanban" className="gap-1 text-[10px] h-6 px-2"><LayoutGrid className="h-3 w-3" />Board</TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1 text-[10px] h-6 px-2"><List className="h-3 w-3" />Tasks</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1 text-[10px] h-6 px-2"><GanttChart className="h-3 w-3" />Timeline</TabsTrigger>
          <TabsTrigger value="stakeholders" className="gap-1 text-[10px] h-6 px-2"><Users className="h-3 w-3" />Stakeholders</TabsTrigger>
          <TabsTrigger value="risks" className="gap-1 text-[10px] h-6 px-2"><AlertTriangle className="h-3 w-3" />Risks</TabsTrigger>
          <TabsTrigger value="workload" className="gap-1 text-[10px] h-6 px-2"><Activity className="h-3 w-3" />Workload</TabsTrigger>
          <TabsTrigger value="milestones" className="gap-1 text-[10px] h-6 px-2"><Milestone className="h-3 w-3" />Milestones</TabsTrigger>
          <TabsTrigger value="deliverables" className="gap-1 text-[10px] h-6 px-2"><FileText className="h-3 w-3" />Files</TabsTrigger>
          <TabsTrigger value="submissions" className="gap-1 text-[10px] h-6 px-2"><Upload className="h-3 w-3" />Submissions</TabsTrigger>
          <TabsTrigger value="meetings" className="gap-1 text-[10px] h-6 px-2"><Video className="h-3 w-3" />Meetings</TabsTrigger>
          <TabsTrigger value="chat" className="gap-1 text-[10px] h-6 px-2"><MessageSquare className="h-3 w-3" />Chat</TabsTrigger>
          <TabsTrigger value="budget" className="gap-1 text-[10px] h-6 px-2"><DollarSign className="h-3 w-3" />Budget</TabsTrigger>
          <TabsTrigger value="time" className="gap-1 text-[10px] h-6 px-2"><Timer className="h-3 w-3" />Time</TabsTrigger>
          <TabsTrigger value="escrow" className="gap-1 text-[10px] h-6 px-2"><Shield className="h-3 w-3" />Escrow</TabsTrigger>
          <TabsTrigger value="archive" className="gap-1 text-[10px] h-6 px-2"><Archive className="h-3 w-3" />Archive</TabsTrigger>
        </TabsList>

        <TabsContent value="home"><WorkspaceHomeTab viewMode={viewMode} /></TabsContent>
        <TabsContent value="kanban"><div className="rounded-2xl border bg-card p-3"><KanbanBoard /></div></TabsContent>
        <TabsContent value="tasks"><TaskListView /></TabsContent>
        <TabsContent value="timeline"><TimelineView /></TabsContent>
        <TabsContent value="stakeholders"><StakeholderPanel /></TabsContent>
        <TabsContent value="risks"><RiskBlock /></TabsContent>
        <TabsContent value="workload"><WorkloadView /></TabsContent>

        <TabsContent value="milestones">
          <div className="space-y-2">
            {milestones.map((m) => (
              <div key={m.id} className="rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold', m.progress === 100 ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : 'bg-accent/10 text-accent')}>{m.index + 1}</div>
                    <div>
                      <h3 className="font-semibold text-[11px]">{m.title}</h3>
                      <p className="text-[9px] text-muted-foreground">{m.tasks} tasks · {m.amount} · Due {m.dueDate}</p>
                    </div>
                  </div>
                  <StatusBadge status={m.status === 'released' ? 'healthy' : m.status === 'in-escrow' ? 'live' : 'pending'} label={m.status} />
                </div>
                <Progress value={m.progress} className="h-1.5 mb-1" />
                <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                  <span>{m.progress}% complete</span>
                  {m.status === 'in-escrow' && (
                    <Button size="sm" variant="outline" className="h-5 text-[8px] rounded-lg"
                      disabled={mTransition.isPending}
                      onClick={() => onMilestoneAction(m, 'in-review')}>
                      Submit for Review
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deliverables"><DeliverableVault /></TabsContent>
        <TabsContent value="submissions"><SubmissionsView /></TabsContent>

        <TabsContent value="meetings"><MeetingCalendar /></TabsContent>

        <TabsContent value="chat">
          <div className="rounded-2xl border bg-card overflow-hidden" style={{ height: '400px' }}>
            <div className="flex flex-col h-full">
              <div className="p-2.5 border-b font-semibold text-[11px] flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-accent" />Project Chat
                {viewMode === 'client' && <Badge variant="secondary" className="text-[7px]">Client-Visible</Badge>}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {updates
                  .filter(u => viewMode === 'client' ? u.type !== 'progress' : true)
                  .map((u, i) => (
                  <div key={i} className="flex gap-2">
                    <Avatar className="h-6 w-6 shrink-0"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{u.author[0]}</AvatarFallback></Avatar>
                    <div className="bg-muted/50 rounded-xl rounded-tl-none px-2.5 py-1.5 max-w-[80%]">
                      <div className="text-[9px] font-medium mb-0.5">{u.author}</div>
                      <p className="text-[10px]">{u.text}</p>
                      <span className="text-[7px] text-muted-foreground">{u.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <form className="border-t px-3 py-2 flex gap-2"
                onSubmit={(e) => { e.preventDefault(); onSubmitChat(); }}>
                <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} placeholder="Message the team..." className="flex-1 h-7 rounded-full border bg-background px-3 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring" />
                <Button type="submit" size="icon" className="h-7 w-7 rounded-full" disabled={!chatMsg.trim()}><Send className="h-3 w-3" /></Button>
              </form>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="budget"><BudgetView /></TabsContent>
        <TabsContent value="time"><TimeLogsView /></TabsContent>

        <TabsContent value="escrow">
          <div className="rounded-2xl border bg-card p-4">
            <h2 className="font-semibold text-[11px] mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-accent" />Escrow Management</h2>
            <div className="space-y-2">
              {milestones.map(m => (
                <div key={m.id} className="p-3 rounded-xl border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-[10px]">{m.title}</span>
                    <span className="font-semibold text-[10px]">{m.amount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.status === 'released' ? 'healthy' : m.status === 'in-escrow' ? 'live' : 'pending'} label={m.status} />
                    {m.status === 'in-escrow' && (
                      <div className="flex gap-1.5 ml-auto">
                        <Button size="sm" variant="outline" className="h-5 text-[8px] rounded-lg"
                          disabled={mTransition.isPending}
                          onClick={() => onMilestoneAction(m, 'in-review')}>Partial</Button>
                        <Button size="sm" className="h-5 text-[8px] rounded-lg"
                          disabled={mTransition.isPending}
                          onClick={() => onMilestoneAction(m, 'released')}>Release</Button>
                      </div>
                    )}
                    {m.status === 'pending' && (
                      <Button size="sm" variant="outline" className="h-5 text-[8px] ml-auto rounded-lg"
                        disabled={mTransition.isPending}
                        onClick={() => onMilestoneAction(m, 'funded')}>Fund</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {workspaceId && (
              <div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 rounded-xl"
                  disabled={mStartHandover.isPending}
                  onClick={() => mStartHandover.mutate()}>
                  <ArrowRight className="h-3 w-3" />Start Handover
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 rounded-xl"
                  disabled={mHold.isPending}
                  onClick={() => {
                    const reason = window.prompt('Reason for holding the workspace?');
                    if (reason) mHold.mutate(reason);
                  }}>
                  <Pause className="h-3 w-3" />Hold
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 rounded-xl text-destructive"
                  disabled={mCancel.isPending}
                  onClick={() => {
                    const reason = window.prompt('Reason for cancelling?');
                    if (reason) mCancel.mutate(reason);
                  }}>
                  <X className="h-3 w-3" />Cancel
                </Button>
                <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl ml-auto"
                  disabled={mClose.isPending}
                  onClick={() => {
                    const report = window.prompt('Final report (markdown)?', '# Project complete\n\nAll milestones delivered.');
                    if (report) mClose.mutate({ finalReportMd: report });
                  }}>
                  <CheckCircle2 className="h-3 w-3" />Close Workspace
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="archive"><ArchiveView /></TabsContent>
      </Tabs>

      {/* New Task Drawer */}
      <Sheet open={commentDrawer} onOpenChange={setCommentDrawer}>
        <SheetContent className="w-[420px] overflow-y-auto p-0">
          <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm">New Task</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-[9px] font-medium mb-1 block">Title</label>
              <input className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]" placeholder="Task title..." />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-medium mb-1 block">Assignee</label>
                <select className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]">
                  {TEAM.map(t => <option key={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-medium mb-1 block">Priority</label>
                <select className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]">
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Due Date</label>
              <input type="date" className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]" />
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Description</label>
              <textarea className="w-full h-20 rounded-xl border bg-background px-3 py-2 text-[10px] resize-none focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Task details..." />
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-8 text-[10px] flex-1 rounded-xl" onClick={() => setCommentDrawer(false)}>Cancel</Button>
              <Button size="sm" className="h-8 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setCommentDrawer(false); toast.success('Task created'); }}><Plus className="h-3 w-3" />Create</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default ProjectWorkspacePage;
