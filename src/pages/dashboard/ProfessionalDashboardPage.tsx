import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  DollarSign, TrendingUp, Briefcase, Star, Clock, ChevronRight,
  Layers, Zap, Award, Eye, Target, Wallet, CreditCard, BarChart3,
  Calendar, FileText, MessageSquare, Plus, AlertTriangle, CheckCircle2,
  ArrowUpRight, ArrowDownRight, Shield, Flag, Sparkles, Activity,
  Pause, Play, Video, Upload, Mic,
} from 'lucide-react';
import { toast } from 'sonner';

/* ── Types ── */
type TimeRange = 'weekly' | 'monthly' | 'quarterly';

interface WorkItem {
  id: string; title: string; client: string; status: 'active' | 'review' | 'pending' | 'blocked' | 'completed';
  deadline: string; value: number; progress: number; type: 'gig' | 'project' | 'service';
}

/* ── Mock Data ── */
const WORK_QUEUE: WorkItem[] = [
  { id: 'w1', title: 'E-commerce Redesign', client: 'Acme Corp', status: 'active', deadline: 'Apr 15', value: 2500, progress: 65, type: 'project' },
  { id: 'w2', title: 'Mobile App Prototype', client: 'StartupXYZ', status: 'review', deadline: 'Apr 18', value: 1800, progress: 90, type: 'gig' },
  { id: 'w3', title: 'Brand Identity Package', client: 'GreenTech', status: 'active', deadline: 'Apr 22', value: 3200, progress: 30, type: 'project' },
  { id: 'w4', title: 'API Integration', client: 'DataFlow Inc', status: 'pending', deadline: 'Apr 25', value: 1500, progress: 0, type: 'service' },
  { id: 'w5', title: 'Landing Page Tests', client: 'Pulse Media', status: 'blocked', deadline: 'Apr 20', value: 900, progress: 45, type: 'gig' },
];

const ACTIONS_REQUIRED = [
  { id: 'a1', title: 'Order awaiting response', subtitle: 'Logo Design · Client: TechPulse', urgency: 'high', time: '30m ago' },
  { id: 'a2', title: 'Revision requested', subtitle: 'Brand Package · GreenTech', urgency: 'high', time: '2h ago' },
  { id: 'a3', title: 'Milestone due tomorrow', subtitle: 'E-commerce Redesign · Acme Corp', urgency: 'medium', time: '' },
  { id: 'a4', title: 'Booking request pending', subtitle: 'Consultation · New Client', urgency: 'medium', time: '4h ago' },
  { id: 'a5', title: 'Profile incomplete', subtitle: 'Add portfolio items for +40% visibility', urgency: 'low', time: '' },
];

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  active: { color: 'bg-[hsl(var(--state-live)/0.1)] text-[hsl(var(--state-live))]', label: 'Active' },
  review: { color: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]', label: 'In Review' },
  pending: { color: 'bg-[hsl(var(--state-pending)/0.15)] text-[hsl(var(--state-pending))]', label: 'Pending' },
  blocked: { color: 'bg-[hsl(var(--state-blocked)/0.1)] text-[hsl(var(--state-blocked))]', label: 'Blocked' },
  completed: { color: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]', label: 'Done' },
};

const ProfessionalDashboardPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
  const [available, setAvailable] = useState(true);
  const [detailSheet, setDetailSheet] = useState<{ title: string; content: string } | null>(null);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Strip */}
      <div className="flex items-center justify-between flex-wrap gap-4 rounded-3xl border bg-card px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Professional Dashboard</h1>
            <p className="text-[11px] text-muted-foreground">Your operating command centre</p>
          </div>
          <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l">
            <span className="text-[10px] text-muted-foreground">Availability</span>
            <Switch checked={available} onCheckedChange={setAvailable} className="scale-75" />
            <Badge className={cn('text-[8px] rounded-xl', available ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : 'bg-muted text-muted-foreground')}>
              {available ? 'Available' : 'Away'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 mr-2 px-3 py-1.5 rounded-2xl bg-[hsl(var(--gigvora-amber)/0.08)] border border-[hsl(var(--gigvora-amber)/0.2)]">
            <Wallet className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />
            <span className="text-xs font-bold">142 Credits</span>
          </div>
          {(['weekly', 'monthly', 'quarterly'] as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={cn('px-3 py-1.5 rounded-2xl text-[10px] font-semibold transition-all', timeRange === r ? 'bg-[hsl(var(--gigvora-blue)/0.1)] text-[hsl(var(--gigvora-blue))]' : 'text-muted-foreground hover:bg-muted/40')}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
          <Button size="sm" className="rounded-2xl h-8 gap-1 text-xs" onClick={() => setQuickCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Create
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Earnings', value: '$8,420', change: '+12.4%', trend: 'up', icon: DollarSign },
          { label: 'Pending', value: '$2,100', change: '3 orders', trend: 'neutral', icon: Clock },
          { label: 'Active Work', value: '5', change: '+1 new', trend: 'up', icon: Briefcase },
          { label: 'Win Rate', value: '68%', change: '+5%', trend: 'up', icon: Target },
          { label: 'Response', value: '< 2h', change: 'Excellent', trend: 'up', icon: Zap },
          { label: 'Views', value: '1.2k', change: '+18%', trend: 'up', icon: Eye },
          { label: 'Credits', value: '142', change: '-8 this week', trend: 'down', icon: CreditCard },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-3xl border bg-card p-3.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-1.5 mb-1.5">
              <kpi.icon className="h-3.5 w-3.5 text-[hsl(var(--gigvora-blue))]" />
              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
            </div>
            <div className="text-xl font-bold tracking-tight">{kpi.value}</div>
            <div className={cn('text-[10px] font-medium mt-0.5 flex items-center gap-0.5',
              kpi.trend === 'up' ? 'text-[hsl(var(--state-healthy))]' : kpi.trend === 'down' ? 'text-[hsl(var(--state-blocked))]' : 'text-muted-foreground'
            )}>
              {kpi.trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
              {kpi.trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
              {kpi.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Action Required */}
        <div className="lg:col-span-2 rounded-3xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b bg-[hsl(var(--state-caution)/0.03)]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--state-caution))]" />
              <span className="text-sm font-semibold">Action Required</span>
              <Badge className="h-5 px-1.5 text-[9px] rounded-full bg-[hsl(var(--state-caution)/0.15)] text-[hsl(var(--state-caution))]">{ACTIONS_REQUIRED.length}</Badge>
            </div>
          </div>
          <div className="divide-y">
            {ACTIONS_REQUIRED.map(a => (
              <button key={a.id} onClick={() => setDetailSheet({ title: a.title, content: a.subtitle })} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors text-left">
                <span className={cn('h-2 w-2 rounded-full shrink-0', a.urgency === 'high' ? 'bg-[hsl(var(--state-blocked))]' : a.urgency === 'medium' ? 'bg-[hsl(var(--state-caution))]' : 'bg-muted-foreground/30')} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{a.title}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{a.subtitle}</div>
                </div>
                {a.time && <span className="text-[9px] text-muted-foreground shrink-0">{a.time}</span>}
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Profile & Trust */}
        <div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b bg-muted/20">
            <Shield className="h-4 w-4 text-[hsl(var(--gigvora-blue))]" />
            <span className="text-sm font-semibold">Profile & Trust</span>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold">Profile Strength</span>
                <span className="text-xs font-bold text-[hsl(var(--gigvora-blue))]">78%</span>
              </div>
              <Progress value={78} className="h-2 rounded-full" />
            </div>
            {[
              { label: 'Rating', value: '4.9/5', icon: Star, color: 'text-[hsl(var(--gigvora-amber))]' },
              { label: 'Completion Rate', value: '96%', icon: CheckCircle2, color: 'text-[hsl(var(--state-healthy))]' },
              { label: 'Response Time', value: '< 2 hours', icon: Clock, color: 'text-[hsl(var(--gigvora-blue))]' },
              { label: 'Repeat Clients', value: '34%', icon: Award, color: 'text-[hsl(var(--gigvora-purple))]' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <stat.icon className={cn('h-3.5 w-3.5', stat.color)} />
                  <span className="text-[11px] text-muted-foreground">{stat.label}</span>
                </div>
                <span className="text-xs font-bold">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Work Queue */}
      <div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-[hsl(var(--gigvora-blue))]" />
            <span className="text-sm font-semibold">Work Queue</span>
            <Badge className="h-5 px-1.5 text-[9px] rounded-full bg-accent/10 text-accent">{WORK_QUEUE.length}</Badge>
          </div>
          <div className="flex items-center gap-1">
            {['All', 'Active', 'Review', 'Blocked'].map(f => (
              <button key={f} className="px-2.5 py-1 rounded-xl text-[9px] font-semibold text-muted-foreground hover:bg-muted/40 transition-colors">{f}</button>
            ))}
          </div>
        </div>
        <div className="divide-y">
          {WORK_QUEUE.map(item => (
            <button key={item.id} onClick={() => setDetailSheet({ title: item.title, content: `${item.client} · ${item.type} · $${item.value}` })} className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-muted/10 transition-colors text-left">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold truncate">{item.title}</span>
                  <Badge className={cn('text-[8px] rounded-xl', STATUS_MAP[item.status].color)}>{STATUS_MAP[item.status].label}</Badge>
                  <Badge variant="secondary" className="text-[8px] rounded-xl">{item.type}</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{item.client} · Due {item.deadline}</div>
              </div>
              <div className="w-20 shrink-0">
                <Progress value={item.progress} className="h-1.5 rounded-full" />
                <div className="text-[9px] text-muted-foreground mt-0.5 text-right">{item.progress}%</div>
              </div>
              <span className="text-xs font-bold shrink-0 w-16 text-right">${item.value.toLocaleString()}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Earnings + Jobs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Earnings */}
        <div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b bg-muted/20">
            <TrendingUp className="h-4 w-4 text-[hsl(var(--state-healthy))]" />
            <span className="text-sm font-semibold">Earnings Overview</span>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'This Month', value: '$8,420' },
                { label: 'Last Month', value: '$7,230' },
                { label: 'Avg Order', value: '$620' },
                { label: 'Total YTD', value: '$34,800' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl bg-muted/20 p-3">
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">{s.label}</div>
                  <div className="text-lg font-bold mt-0.5">{s.value}</div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-[hsl(var(--state-healthy)/0.05)] to-[hsl(var(--gigvora-blue)/0.05)] p-3 flex items-center gap-3">
              <Activity className="h-8 w-8 text-[hsl(var(--state-healthy))] shrink-0" />
              <div>
                <div className="text-xs font-semibold">Revenue trending up</div>
                <div className="text-[10px] text-muted-foreground">+16% vs last month. Top source: Gig orders</div>
              </div>
            </div>
          </div>
        </div>

        {/* Opportunities */}
        <div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b bg-muted/20">
            <Target className="h-4 w-4 text-[hsl(var(--gigvora-purple))]" />
            <span className="text-sm font-semibold">Opportunities & Jobs</span>
          </div>
          <div className="divide-y">
            {[
              { title: 'Senior React Developer', company: 'TechCorp', match: '94%', type: 'Job', salary: '$120k-150k' },
              { title: 'Design System Consultant', company: 'FinanceApp', match: '87%', type: 'Project', salary: '$5,000' },
              { title: 'UX Audit Needed', company: 'StartupXYZ', match: '82%', type: 'Invite', salary: '$2,200' },
            ].map((opp, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/10 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold truncate">{opp.title}</span>
                    <Badge variant="secondary" className="text-[8px] rounded-xl">{opp.type}</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{opp.company} · {opp.salary}</div>
                </div>
                <Badge className="text-[9px] rounded-xl bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]">{opp.match} match</Badge>
              </div>
            ))}
            <div className="px-5 py-3">
              <Button variant="outline" size="sm" className="w-full h-8 text-[10px] rounded-xl" asChild>
                <Link to="/jobs">Browse All Opportunities <ChevronRight className="h-3 w-3 ml-0.5" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Suggestions */}
      <div className="rounded-3xl border bg-gradient-to-r from-[hsl(var(--gigvora-blue)/0.04)] to-[hsl(var(--gigvora-purple)/0.04)] p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[hsl(var(--gigvora-blue))]" />
          <span className="text-sm font-semibold">Optimization Tips</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { title: 'Improve your gig title', desc: 'Gigs with keyword-rich titles get 2.5x more views', action: 'Optimize' },
            { title: 'Adjust pricing', desc: 'Your rates are 15% below market average for your skills', action: 'Review' },
            { title: 'Add more portfolio items', desc: '3+ portfolio items increases order rate by 40%', action: 'Add Items' },
          ].map((tip, i) => (
            <div key={i} className="rounded-2xl border bg-card p-4 hover:shadow-md transition-shadow">
              <div className="text-xs font-semibold mb-1">{tip.title}</div>
              <div className="text-[10px] text-muted-foreground mb-3">{tip.desc}</div>
              <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl w-full">{tip.action}</Button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Create Sheet */}
      <Sheet open={quickCreateOpen} onOpenChange={setQuickCreateOpen}>
        <SheetContent className="rounded-l-3xl">
          <SheetHeader>
            <SheetTitle>Quick Create</SheetTitle>
            <SheetDescription>Create a new listing or content</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            {[
              { label: 'Create Gig', icon: Layers, path: '/gigs/create' },
              { label: 'List Service', icon: Briefcase, path: '/services/create' },
              { label: 'Submit Proposal', icon: FileText, path: '/projects' },
              { label: 'Create Post', icon: MessageSquare, path: '/creation-studio' },
              { label: 'Start Webinar', icon: Video, path: '/creation-studio' },
              { label: 'Upload Podcast', icon: Mic, path: '/creation-studio' },
            ].map((item) => (
              <Link key={item.label} to={item.path} onClick={() => setQuickCreateOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/30 transition-colors">
                <div className="h-10 w-10 rounded-2xl bg-[hsl(var(--gigvora-blue)/0.08)] flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-[hsl(var(--gigvora-blue))]" />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Sheet */}
      <Sheet open={!!detailSheet} onOpenChange={() => setDetailSheet(null)}>
        <SheetContent className="rounded-l-3xl">
          <SheetHeader>
            <SheetTitle>{detailSheet?.title}</SheetTitle>
            <SheetDescription>{detailSheet?.content}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Full detail view will show timeline, messages, milestones, and actions.</p>
            </div>
            <Button className="w-full rounded-2xl" onClick={() => { toast.success('Action taken!'); setDetailSheet(null); }}>Take Action</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ProfessionalDashboardPage;
