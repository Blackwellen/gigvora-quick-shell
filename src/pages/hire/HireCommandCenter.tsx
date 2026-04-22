import React from 'react';
import { Link } from 'react-router-dom';
import { HireShell } from '@/components/shell/HireShell';
import { KPICard, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Briefcase, Search, Users, Target, Calendar, FileText, BarChart3,
  Mail, Star, Shield, Sparkles, ChevronRight, Clock,
  Layers, Plus, AlertTriangle, TrendingUp, Zap,
  ArrowUpRight, ArrowDownRight, Eye, CheckCircle2,
} from 'lucide-react';

const KPI_DATA = [
  { label: 'Open Roles', value: '12', change: '+2 this week', trend: 'up' as const },
  { label: 'Active Candidates', value: '234', change: '+18 today', trend: 'up' as const },
  { label: 'Interview Pipeline', value: '28', change: '6 this week', trend: 'up' as const },
  { label: 'Offers Pending', value: '3', change: '1 expiring', trend: 'neutral' as const },
  { label: 'Time-to-Hire', value: '23d', change: '-4d vs avg', trend: 'down' as const },
  { label: 'Outreach Rate', value: '68%', change: '+5%', trend: 'up' as const },
  { label: 'At-Risk Roles', value: '2', change: 'Aging >30d', trend: 'neutral' as const },
];

const URGENT_ACTIONS = [
  { label: 'Complete 4 pending scorecards', href: '/hire/scorecards', icon: FileText, priority: 'high' as const },
  { label: 'Review 3 expired offer letters', href: '/hire/offers', icon: AlertTriangle, priority: 'high' as const },
  { label: 'Schedule interviews for Senior FE role', href: '/hire/interviews', icon: Calendar, priority: 'medium' as const },
  { label: 'Approve 2 job postings awaiting review', href: '/hire/jobs', icon: CheckCircle2, priority: 'medium' as const },
];

const PIPELINE_SUMMARY = [
  { stage: 'Applied', count: 89, color: 'bg-muted-foreground' },
  { stage: 'Screening', count: 42, color: 'bg-accent' },
  { stage: 'Interview', count: 28, color: 'bg-[hsl(var(--state-review))]' },
  { stage: 'Assessment', count: 15, color: 'bg-[hsl(var(--state-caution))]' },
  { stage: 'Offer', count: 8, color: 'bg-[hsl(var(--state-premium))]' },
  { stage: 'Hired', count: 12, color: 'bg-[hsl(var(--state-healthy))]' },
];

const RECENT_ACTIVITY = [
  { name: 'Ana Torres', avatar: 'AT', action: 'moved to Technical Interview', role: 'Senior Frontend Engineer', time: '12 min ago', icon: Target },
  { name: 'David Kim', avatar: 'DK', action: 'scorecard submitted by Sarah', role: 'Engineering Manager', time: '45 min ago', icon: FileText },
  { name: 'Priya Patel', avatar: 'PP', action: 'offer letter generated', role: 'ML Engineer', time: '2h ago', icon: Sparkles },
  { name: 'James Chen', avatar: 'JC', action: 'applied via LinkedIn', role: 'Staff Engineer', time: '3h ago', icon: Users },
  { name: 'Maria Garcia', avatar: 'MG', action: 'phone screen completed', role: 'Product Designer', time: '4h ago', icon: Calendar },
  { name: 'Alex Kim', avatar: 'AK', action: 'added to talent pool', role: 'Backend Engineer', time: '5h ago', icon: Star },
];

const UPCOMING_INTERVIEWS = [
  { candidate: 'Ana Torres', avatar: 'AT', role: 'Senior FE Engineer', time: 'Today 2:00 PM', type: 'Technical', panelists: 3 },
  { candidate: 'Wei Zhang', avatar: 'WZ', role: 'DevOps Lead', time: 'Today 4:30 PM', type: 'Culture Fit', panelists: 2 },
  { candidate: 'Sarah Johnson', avatar: 'SJ', role: 'Engineering Manager', time: 'Tomorrow 10:00 AM', type: 'Final Round', panelists: 4 },
  { candidate: 'Miguel Lopez', avatar: 'ML', role: 'ML Engineer', time: 'Tomorrow 1:00 PM', type: 'Phone Screen', panelists: 1 },
];

const TOP_ROLES = [
  { title: 'Senior Frontend Engineer', applicants: 42, interviews: 6, aging: 14, status: 'active' as const },
  { title: 'Engineering Manager', applicants: 28, interviews: 3, aging: 21, status: 'active' as const },
  { title: 'ML Engineer', applicants: 35, interviews: 4, aging: 8, status: 'active' as const },
  { title: 'Staff Backend Engineer', applicants: 15, interviews: 1, aging: 32, status: 'at-risk' as const },
  { title: 'Product Designer', applicants: 52, interviews: 5, aging: 11, status: 'active' as const },
];

export default function HireCommandCenter() {
  const total = PIPELINE_SUMMARY.reduce((a, s) => a + s.count, 0);

  return (
    <HireShell>
      {/* KPI Strip */}
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3.5 shadow-card mb-4">
        <Shield className="h-4 w-4 text-[hsl(var(--state-healthy))]" />
        <h1 className="text-sm font-bold mr-2">Recruitment Command Center</h1>
        {KPI_DATA.slice(0, 5).map(k => (
          <KPICard key={k.label} label={k.label} value={k.value} change={k.change} trend={k.trend} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left Column: Pipeline + Actions */}
        <div className="xl:col-span-2 space-y-4">
          {/* Pipeline Overview */}
          <SectionCard title="Pipeline Overview" icon={<Layers className="h-3.5 w-3.5 text-accent" />}
            action={<Link to="/hire/pipeline"><Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1">View Board <ChevronRight className="h-2.5 w-2.5" /></Button></Link>}
          >
            <div className="flex items-end gap-1 h-20 mb-2">
              {PIPELINE_SUMMARY.map(s => (
                <div key={s.stage} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold">{s.count}</span>
                  <div className={`w-full rounded-t-lg ${s.color}`} style={{ height: `${Math.max(8, (s.count / total) * 100)}%` }} />
                  <span className="text-[7px] text-muted-foreground text-center leading-tight">{s.stage}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Urgent Actions */}
          <SectionCard title="Urgent Actions" icon={<AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]" />}>
            <div className="space-y-1.5">
              {URGENT_ACTIONS.map((a, i) => (
                <Link key={i} to={a.href} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all group">
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${a.priority === 'high' ? 'bg-[hsl(var(--state-critical))]/10' : 'bg-[hsl(var(--state-caution))]/10'}`}>
                    <a.icon className={`h-3.5 w-3.5 ${a.priority === 'high' ? 'text-[hsl(var(--state-critical))]' : 'text-[hsl(var(--state-caution))]'}`} />
                  </div>
                  <span className="text-[10px] font-medium flex-1">{a.label}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-accent" />
                </Link>
              ))}
            </div>
          </SectionCard>

          {/* Top Open Roles */}
          <SectionCard title="Active Roles" icon={<Briefcase className="h-3.5 w-3.5 text-accent" />}
            action={<Link to="/hire/jobs"><Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1">All Jobs <ChevronRight className="h-2.5 w-2.5" /></Button></Link>}
          >
            <div className="space-y-1.5">
              {TOP_ROLES.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/30 hover:bg-accent/5 transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold">{r.title}</span>
                      {r.status === 'at-risk' && <Badge className="text-[7px] h-3.5 bg-[hsl(var(--state-critical))]/10 text-[hsl(var(--state-critical))] border-0">At Risk</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[9px] text-muted-foreground">
                    <span><Users className="h-2.5 w-2.5 inline" /> {r.applicants}</span>
                    <span><Calendar className="h-2.5 w-2.5 inline" /> {r.interviews}</span>
                    <span><Clock className="h-2.5 w-2.5 inline" /> {r.aging}d</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right Column: Activity + Interviews */}
        <div className="space-y-4">
          {/* Upcoming Interviews */}
          <SectionCard title="Upcoming Interviews" icon={<Calendar className="h-3.5 w-3.5 text-[hsl(var(--state-review))]" />}
            action={<Link to="/hire/interviews"><Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1">Schedule <ChevronRight className="h-2.5 w-2.5" /></Button></Link>}
          >
            <div className="space-y-2">
              {UPCOMING_INTERVIEWS.map((iv, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl border border-border/30 hover:bg-accent/5 transition-all">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[8px] bg-muted">{iv.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold truncate">{iv.candidate}</div>
                    <div className="text-[8px] text-muted-foreground">{iv.role}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[7px] h-3.5">{iv.type}</Badge>
                      <span className="text-[8px] text-muted-foreground">{iv.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Recent Activity */}
          <SectionCard title="Recent Activity" icon={<Zap className="h-3.5 w-3.5 text-accent" />}>
            <div className="space-y-0.5">
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-center gap-2.5 py-2 border-b border-border/20 last:border-0">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[7px] bg-muted">{a.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px]">
                      <span className="font-semibold">{a.name}</span>{' '}
                      <span className="text-muted-foreground">{a.action}</span>
                    </div>
                    <div className="text-[8px] text-muted-foreground">{a.role} · {a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Quick KPIs */}
          <SectionCard title="Performance" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />}>
            <div className="space-y-2">
              {[
                { label: 'Offer Acceptance Rate', value: '82%', bar: 82 },
                { label: 'Interview-to-Hire', value: '28%', bar: 28 },
                { label: 'Candidate Satisfaction', value: '4.6/5', bar: 92 },
                { label: 'Source Quality', value: '71%', bar: 71 },
              ].map((m, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] text-muted-foreground">{m.label}</span>
                    <span className="text-[9px] font-semibold">{m.value}</span>
                  </div>
                  <Progress value={m.bar} className="h-1" />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </HireShell>
  );
}
