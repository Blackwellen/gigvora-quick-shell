import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Building2, Users, DollarSign, TrendingUp, BarChart3, Briefcase,
  FileText, MessageSquare, Calendar, Plus, ChevronRight, Layers,
  Zap, CheckCircle2, AlertTriangle, Eye, Target, CreditCard,
  Activity, Shield, ExternalLink, UserCheck, Clock, Send,
  ArrowUpRight, Settings, UserPlus, Mail, Star, Package,
  PieChart, Inbox, Flag, MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRole } from '@/contexts/RoleContext';

type TimeRange = '7d' | '30d' | '90d';
type AgencyTab = 'overview' | 'utilization' | 'clients' | 'delivery' | 'revenue' | 'inbox' | 'resources' | 'team';

interface TeamMember {
  id: string; name: string; role: string; utilization: number; projects: number;
  status: 'active' | 'on-leave' | 'bench';
}

interface Client {
  id: string; name: string; health: 'healthy' | 'at-risk' | 'churning';
  revenue: string; projects: number; satisfaction: number; lastContact: string;
}

interface Delivery {
  id: string; project: string; client: string; status: 'on-track' | 'at-risk' | 'delayed' | 'completed';
  progress: number; deadline: string; lead: string;
}

const TEAM: TeamMember[] = [
  { id: 't1', name: 'Alex Rivera', role: 'Design Lead', utilization: 92, projects: 3, status: 'active' },
  { id: 't2', name: 'Jordan Kim', role: 'Full-Stack Dev', utilization: 85, projects: 2, status: 'active' },
  { id: 't3', name: 'Sam Patel', role: 'Project Manager', utilization: 78, projects: 4, status: 'active' },
  { id: 't4', name: 'Casey Morgan', role: 'UX Researcher', utilization: 45, projects: 1, status: 'active' },
  { id: 't5', name: 'Taylor Brooks', role: 'Backend Dev', utilization: 0, projects: 0, status: 'bench' },
  { id: 't6', name: 'Riley Nguyen', role: 'Content Strategist', utilization: 0, projects: 0, status: 'on-leave' },
];

const CLIENTS: Client[] = [
  { id: 'cl1', name: 'Nextera Corp', health: 'healthy', revenue: '$24,500/mo', projects: 3, satisfaction: 4.8, lastContact: '1 day ago' },
  { id: 'cl2', name: 'Bloom Studio', health: 'healthy', revenue: '$12,000/mo', projects: 1, satisfaction: 4.6, lastContact: '3 days ago' },
  { id: 'cl3', name: 'ArcVentures', health: 'at-risk', revenue: '$18,000/mo', projects: 2, satisfaction: 3.2, lastContact: '12 days ago' },
  { id: 'cl4', name: 'Pulse Health', health: 'churning', revenue: '$8,500/mo', projects: 1, satisfaction: 2.8, lastContact: '21 days ago' },
];

const DELIVERIES: Delivery[] = [
  { id: 'd1', project: 'Nextera Redesign', client: 'Nextera Corp', status: 'on-track', progress: 72, deadline: 'May 15', lead: 'Alex Rivera' },
  { id: 'd2', project: 'Bloom E-commerce', client: 'Bloom Studio', status: 'on-track', progress: 45, deadline: 'Jun 1', lead: 'Jordan Kim' },
  { id: 'd3', project: 'Arc Mobile App', client: 'ArcVentures', status: 'at-risk', progress: 38, deadline: 'Apr 28', lead: 'Sam Patel' },
  { id: 'd4', project: 'Arc API Integration', client: 'ArcVentures', status: 'delayed', progress: 20, deadline: 'Apr 20', lead: 'Taylor Brooks' },
  { id: 'd5', project: 'Pulse Dashboard', client: 'Pulse Health', status: 'completed', progress: 100, deadline: 'Apr 5', lead: 'Casey Morgan' },
];

const HEALTH_MAP: Record<string, { badge: 'healthy' | 'caution' | 'blocked'; label: string }> = {
  healthy: { badge: 'healthy', label: 'Healthy' },
  'at-risk': { badge: 'caution', label: 'At Risk' },
  churning: { badge: 'blocked', label: 'Churning' },
};

const DELIVERY_STATUS: Record<string, { badge: 'healthy' | 'live' | 'caution' | 'blocked'; label: string }> = {
  'on-track': { badge: 'healthy', label: 'On Track' },
  'at-risk': { badge: 'caution', label: 'At Risk' },
  delayed: { badge: 'blocked', label: 'Delayed' },
  completed: { badge: 'live', label: 'Completed' },
};

const MEMBER_STATUS: Record<string, { badge: 'healthy' | 'caution' | 'pending'; label: string }> = {
  active: { badge: 'healthy', label: 'Active' },
  'on-leave': { badge: 'caution', label: 'On Leave' },
  bench: { badge: 'pending', label: 'Bench' },
};

const AgencyManagementDashboardPage: React.FC = () => {
  const { activeRole } = useRole();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [tab, setTab] = useState<AgencyTab>('overview');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [detailItem, setDetailItem] = useState<{ type: string; title: string; detail: string } | null>(null);
  const [inviteDrawer, setInviteDrawer] = useState(false);

  const openDetail = (type: string, title: string, detail: string) => {
    setDetailItem({ type, title, detail });
    setDetailDrawer(true);
  };

  const avgUtilization = Math.round(TEAM.filter(t => t.status === 'active').reduce((a, t) => a + t.utilization, 0) / TEAM.filter(t => t.status === 'active').length);
  const totalRevenue = '$63,000';
  const activeProjects = DELIVERIES.filter(d => d.status !== 'completed').length;

  const topStrip = (
    <>
      <Building2 className="h-3.5 w-3.5 text-accent" />
      <span className="text-[11px] font-semibold">Agency Command Center</span>
      <Badge variant="secondary" className="text-[7px] capitalize">{activeRole}</Badge>
      <div className="flex-1" />
      <div className="flex items-center gap-1 border rounded-xl p-0.5">
        {(['7d', '30d', '90d'] as const).map(r => (
          <button key={r} onClick={() => setTimeRange(r)} className={cn('px-2 py-0.5 rounded-lg text-[8px] font-medium transition-colors', timeRange === r ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted/30')}>{r}</button>
        ))}
      </div>
      <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setInviteDrawer(true)}><UserPlus className="h-3 w-3" />Invite</Button>
      <Link to="/projects/create"><Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Plus className="h-3 w-3" />New Project</Button></Link>
    </>
  );

  const rightRail = selectedMember ? (
    <div className="space-y-3">
      <SectionCard title="Team Member" icon={<Users className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-8 w-8"><AvatarFallback className="text-[8px] bg-accent/10 text-accent">{selectedMember.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
          <div><div className="text-[10px] font-semibold">{selectedMember.name}</div><div className="text-[8px] text-muted-foreground">{selectedMember.role}</div></div>
        </div>
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Utilization</span><span className="font-bold">{selectedMember.utilization}%</span></div>
          <Progress value={selectedMember.utilization} className="h-1.5" />
          <div className="flex justify-between"><span className="text-muted-foreground">Projects</span><span>{selectedMember.projects}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={MEMBER_STATUS[selectedMember.status].badge} label={MEMBER_STATUS[selectedMember.status].label} /></div>
        </div>
      </SectionCard>
      <SectionCard title="Actions" className="!rounded-2xl">
        <div className="space-y-1">
          <Link to="/inbox"><Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl"><MessageSquare className="h-3 w-3" />Message</Button></Link>
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl" onClick={() => openDetail('member', selectedMember.name, selectedMember.role)}><ExternalLink className="h-3 w-3" />View Profile</Button>
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl text-destructive" onClick={() => toast.info('Role edit opened')}><Settings className="h-3 w-3" />Edit Role</Button>
        </div>
      </SectionCard>
    </div>
  ) : selectedClient ? (
    <div className="space-y-3">
      <SectionCard title="Client Detail" icon={<Briefcase className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="text-[10px] font-semibold mb-1">{selectedClient.name}</div>
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Health</span><StatusBadge status={HEALTH_MAP[selectedClient.health].badge} label={HEALTH_MAP[selectedClient.health].label} /></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="font-bold">{selectedClient.revenue}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Projects</span><span>{selectedClient.projects}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Satisfaction</span><span className="font-bold">{selectedClient.satisfaction}/5</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Last Contact</span><span>{selectedClient.lastContact}</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Actions" className="!rounded-2xl">
        <div className="space-y-1">
          <Link to="/inbox"><Button size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl"><MessageSquare className="h-3 w-3" />Reach Out</Button></Link>
          <Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl" onClick={() => openDetail('client', selectedClient.name, selectedClient.revenue)}><Eye className="h-3 w-3" />Full Account</Button>
        </div>
      </SectionCard>
    </div>
  ) : (
    <div className="space-y-3">
      <SectionCard title="Agency Health" icon={<Activity className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[
            { l: 'Avg Utilization', v: `${avgUtilization}%`, ok: avgUtilization >= 70 },
            { l: 'On-Bench Staff', v: String(TEAM.filter(t => t.status === 'bench').length), ok: TEAM.filter(t => t.status === 'bench').length <= 1 },
            { l: 'At-Risk Clients', v: String(CLIENTS.filter(c => c.health !== 'healthy').length), ok: CLIENTS.filter(c => c.health !== 'healthy').length === 0 },
            { l: 'Delayed Projects', v: String(DELIVERIES.filter(d => d.status === 'delayed').length), ok: DELIVERIES.filter(d => d.status === 'delayed').length === 0 },
          ].map(m => (
            <div key={m.l} className="flex justify-between items-center">
              <span className="text-muted-foreground">{m.l}</span>
              <span className={cn('font-bold', m.ok ? 'text-[hsl(var(--state-healthy))]' : 'text-[hsl(var(--state-caution))]')}>{m.v}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Alerts" icon={<AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {[
            { text: 'ArcVentures — satisfaction declining', severity: 'caution' as const },
            { text: 'Arc API Integration — overdue', severity: 'blocked' as const },
            { text: 'Taylor Brooks — idle 2 weeks', severity: 'caution' as const },
            { text: 'Pulse Health — churn risk', severity: 'blocked' as const },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-[8px] cursor-pointer hover:bg-muted/20 rounded-lg p-1" onClick={() => openDetail('alert', a.text, 'Action needed')}>
              <StatusBadge status={a.severity} label="" />
              <span className="flex-1">{a.text}</span>
              <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Seats & Billing" icon={<CreditCard className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="font-bold">Team</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Seats Used</span><span>{TEAM.length} / 8</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Next Billing</span><span>May 1</span></div>
        </div>
        <Link to="/finance/billing"><Button variant="outline" size="sm" className="h-6 text-[8px] w-full gap-1 rounded-xl mt-2"><CreditCard className="h-3 w-3" />Manage Billing</Button></Link>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><Activity className="h-3.5 w-3.5 text-accent" />Recent Activity</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {[
          { text: 'Nextera Redesign — milestone delivered', time: '2 hrs ago', icon: CheckCircle2 },
          { text: 'Invoice sent to Bloom Studio — $12,000', time: '5 hrs ago', icon: Send },
          { text: 'Alex Rivera reassigned to Arc Mobile', time: '1 day ago', icon: ArrowUpRight },
          { text: 'Pulse Health — client meeting scheduled', time: '1 day ago', icon: Calendar },
        ].map((a, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-xl border bg-card text-[8px]">
            <a.icon className="h-3 w-3 text-accent shrink-0" />
            <div><div className="font-medium">{a.text}</div><div className="text-muted-foreground">{a.time}</div></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-3 border-b pb-2 overflow-x-auto">
        {([
          { key: 'overview' as const, label: 'Overview', icon: BarChart3 },
          { key: 'utilization' as const, label: 'Utilization', icon: PieChart },
          { key: 'clients' as const, label: 'Clients', icon: Briefcase },
          { key: 'delivery' as const, label: 'Delivery Ops', icon: Package },
          { key: 'revenue' as const, label: 'Revenue', icon: DollarSign },
          { key: 'inbox' as const, label: 'Shared Inbox', icon: Inbox },
          { key: 'resources' as const, label: 'Resources', icon: Target },
          { key: 'team' as const, label: 'Team', icon: Users },
        ]).map(w => (
          <button key={w.key} onClick={() => { setTab(w.key); setSelectedMember(null); setSelectedClient(null); }} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] transition-colors whitespace-nowrap shrink-0',
            tab === w.key ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
          )}>
            <w.icon className="h-3 w-3" />{w.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {tab === 'overview' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Monthly Revenue" value={totalRevenue} change="+8%" trend="up" />
            <KPICard label="Active Projects" value={String(activeProjects)} change="+1 this week" trend="up" />
            <KPICard label="Avg Utilization" value={`${avgUtilization}%`} change={avgUtilization >= 75 ? 'Healthy' : 'Below target'} trend={avgUtilization >= 75 ? 'up' : 'down'} />
            <KPICard label="Client Health" value={`${CLIENTS.filter(c => c.health === 'healthy').length}/${CLIENTS.length}`} />
          </KPIBand>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Delivery pipeline */}
            <SectionCard title="Delivery Pipeline" icon={<Package className="h-3.5 w-3.5 text-accent" />} action={<button onClick={() => setTab('delivery')} className="text-[8px] text-accent hover:underline">All</button>} className="!rounded-2xl">
              <div className="space-y-1.5">
                {DELIVERIES.filter(d => d.status !== 'completed').map(d => {
                  const sc = DELIVERY_STATUS[d.status];
                  return (
                    <div key={d.id} className="rounded-2xl border p-2.5 hover:shadow-sm transition-all cursor-pointer" onClick={() => openDetail('project', d.project, `${d.client} · ${d.deadline}`)}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{d.project}</span><StatusBadge status={sc.badge} label={sc.label} /></div>
                        <span className="text-[8px] text-muted-foreground">{d.deadline}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={d.progress} className="h-1.5 flex-1" />
                        <span className="text-[8px] font-medium">{d.progress}%</span>
                      </div>
                      <div className="text-[8px] text-muted-foreground mt-1">{d.client} · Lead: {d.lead}</div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* Client portfolio */}
            <SectionCard title="Client Portfolio" icon={<Briefcase className="h-3.5 w-3.5 text-accent" />} action={<button onClick={() => setTab('clients')} className="text-[8px] text-accent hover:underline">All</button>} className="!rounded-2xl">
              <div className="space-y-1.5">
                {CLIENTS.map(c => {
                  const h = HEALTH_MAP[c.health];
                  return (
                    <div key={c.id} onClick={() => setSelectedClient(c)} className={cn('rounded-2xl border p-2.5 cursor-pointer transition-all hover:shadow-sm', selectedClient?.id === c.id && 'ring-1 ring-accent border-accent/30')}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{c.name}</span><StatusBadge status={h.badge} label={h.label} /></div>
                        <span className="text-[9px] font-bold">{c.revenue}</span>
                      </div>
                      <div className="flex gap-3 mt-1 text-[8px] text-muted-foreground">
                        <span>{c.projects} projects</span><span>⭐ {c.satisfaction}</span><span>Last: {c.lastContact}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          {/* Team utilization quick */}
          <SectionCard title="Team Utilization" icon={<Users className="h-3.5 w-3.5 text-accent" />} action={<button onClick={() => setTab('utilization')} className="text-[8px] text-accent hover:underline">Full View</button>} className="!rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {TEAM.map(m => {
                const ms = MEMBER_STATUS[m.status];
                return (
                  <div key={m.id} onClick={() => setSelectedMember(m)} className={cn('rounded-2xl border p-2 text-center cursor-pointer transition-all hover:shadow-sm', selectedMember?.id === m.id && 'ring-1 ring-accent')}>
                    <Avatar className="h-8 w-8 mx-auto mb-1"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{m.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                    <div className="text-[9px] font-semibold truncate">{m.name}</div>
                    <div className="text-[7px] text-muted-foreground">{m.role}</div>
                    <Progress value={m.utilization} className="h-1 mt-1" />
                    <div className="text-[8px] font-bold mt-0.5">{m.utilization}%</div>
                    <StatusBadge status={ms.badge} label={ms.label} />
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ UTILIZATION ═══ */}
      {tab === 'utilization' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Avg Utilization" value={`${avgUtilization}%`} trend={avgUtilization >= 75 ? 'up' : 'down'} />
            <KPICard label="Active Members" value={String(TEAM.filter(t => t.status === 'active').length)} />
            <KPICard label="On Bench" value={String(TEAM.filter(t => t.status === 'bench').length)} change={TEAM.filter(t => t.status === 'bench').length > 0 ? 'Assign work' : ''} />
            <KPICard label="On Leave" value={String(TEAM.filter(t => t.status === 'on-leave').length)} />
          </KPIBand>

          <div className="space-y-1.5">
            {TEAM.map(m => {
              const ms = MEMBER_STATUS[m.status];
              return (
                <div key={m.id} onClick={() => setSelectedMember(m)} className={cn('rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer', selectedMember?.id === m.id && 'ring-1 ring-accent')}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8"><AvatarFallback className="text-[8px] bg-accent/10 text-accent">{m.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{m.name}</span><StatusBadge status={ms.badge} label={ms.label} /></div>
                      <div className="text-[8px] text-muted-foreground">{m.role} · {m.projects} projects</div>
                    </div>
                    <div className="w-32 flex items-center gap-2">
                      <Progress value={m.utilization} className="h-1.5 flex-1" />
                      <span className={cn('text-[10px] font-bold w-10 text-right', m.utilization >= 80 ? 'text-[hsl(var(--state-healthy))]' : m.utilization >= 50 ? 'text-foreground' : 'text-[hsl(var(--state-caution))]')}>{m.utilization}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {TEAM.some(t => t.status === 'bench') && (
            <div className="rounded-2xl border border-[hsl(var(--state-caution))]/30 bg-[hsl(var(--state-caution))]/5 p-3 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[hsl(var(--state-caution))]" />
              <div className="flex-1"><div className="text-[10px] font-semibold">Bench Alert</div><div className="text-[8px] text-muted-foreground">{TEAM.filter(t => t.status === 'bench').map(t => t.name).join(', ')} currently unassigned. Revenue impact: ~$4,200/week.</div></div>
              <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><Target className="h-3 w-3" />Assign</Button>
            </div>
          )}
        </div>
      )}

      {/* ═══ CLIENTS ═══ */}
      {tab === 'clients' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Clients" value={String(CLIENTS.length)} />
            <KPICard label="Healthy" value={String(CLIENTS.filter(c => c.health === 'healthy').length)} />
            <KPICard label="At Risk" value={String(CLIENTS.filter(c => c.health === 'at-risk').length)} change="Action needed" />
            <KPICard label="Avg Satisfaction" value={(CLIENTS.reduce((a, c) => a + c.satisfaction, 0) / CLIENTS.length).toFixed(1)} />
          </KPIBand>

          <div className="space-y-1.5">
            {CLIENTS.map(c => {
              const h = HEALTH_MAP[c.health];
              return (
                <div key={c.id} onClick={() => setSelectedClient(c)} className={cn('rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer', selectedClient?.id === c.id && 'ring-1 ring-accent')}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2"><span className="text-[11px] font-semibold">{c.name}</span><StatusBadge status={h.badge} label={h.label} /></div>
                    <span className="text-[10px] font-bold">{c.revenue}</span>
                  </div>
                  <div className="flex gap-2 text-[8px]">
                    {[
                      { l: 'Projects', v: c.projects },
                      { l: 'Satisfaction', v: `${c.satisfaction}/5` },
                      { l: 'Last Contact', v: c.lastContact },
                    ].map(s => (
                      <div key={s.l} className="text-center flex-1 rounded-xl border p-1.5">
                        <div className="font-bold">{s.v}</div>
                        <div className="text-muted-foreground">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ DELIVERY OPS ═══ */}
      {tab === 'delivery' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Projects" value={String(activeProjects)} />
            <KPICard label="On Track" value={String(DELIVERIES.filter(d => d.status === 'on-track').length)} />
            <KPICard label="At Risk" value={String(DELIVERIES.filter(d => d.status === 'at-risk').length)} change="Monitor" />
            <KPICard label="Delayed" value={String(DELIVERIES.filter(d => d.status === 'delayed').length)} change="Action needed" />
          </KPIBand>

          <div className="space-y-1.5">
            {DELIVERIES.map(d => {
              const sc = DELIVERY_STATUS[d.status];
              return (
                <div key={d.id} className="rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => openDetail('project', d.project, `${d.client} · Lead: ${d.lead}`)}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2"><span className="text-[11px] font-semibold">{d.project}</span><StatusBadge status={sc.badge} label={sc.label} /></div>
                    <span className="text-[9px] text-muted-foreground">{d.deadline}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Progress value={d.progress} className="h-1.5 flex-1" />
                    <span className="text-[9px] font-medium">{d.progress}%</span>
                  </div>
                  <div className="text-[8px] text-muted-foreground">{d.client} · Lead: {d.lead}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ REVENUE ═══ */}
      {tab === 'revenue' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="MRR" value={totalRevenue} change="+8%" trend="up" />
            <KPICard label="Outstanding" value="$14,500" change="2 invoices" />
            <KPICard label="Collected (30d)" value="$48,500" trend="up" />
            <KPICard label="Avg Project Value" value="$15,750" />
          </KPIBand>

          <SectionCard title="Revenue by Client" icon={<DollarSign className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5 text-[9px]">
              {CLIENTS.map(c => (
                <div key={c.id} className="flex items-center gap-2">
                  <span className="w-28 truncate text-muted-foreground">{c.name}</span>
                  <Progress value={c.projects * 25} className="h-1.5 flex-1" />
                  <span className="font-bold w-24 text-right">{c.revenue}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Recent Invoices" icon={<FileText className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {[
                { inv: 'INV-042', client: 'Nextera Corp', amount: '$24,500', status: 'paid' },
                { inv: 'INV-041', client: 'Bloom Studio', amount: '$12,000', status: 'pending' },
                { inv: 'INV-040', client: 'Pulse Health', amount: '$2,500', status: 'overdue' },
              ].map(inv => (
                <div key={inv.inv} className="flex items-center justify-between rounded-xl border p-2 text-[9px] cursor-pointer hover:bg-muted/20" onClick={() => openDetail('invoice', inv.inv, `${inv.client} — ${inv.amount}`)}>
                  <div><span className="font-medium">{inv.inv}</span> · <span className="text-muted-foreground">{inv.client}</span></div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{inv.amount}</span>
                    <StatusBadge status={inv.status === 'paid' ? 'healthy' : inv.status === 'pending' ? 'caution' : 'blocked'} label={inv.status} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ SHARED INBOX ═══ */}
      {tab === 'inbox' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Unread" value="7" change="3 urgent" />
            <KPICard label="Awaiting Reply" value="4" />
            <KPICard label="Avg Response Time" value="2.4 hrs" trend="down" />
            <KPICard label="Resolved Today" value="5" />
          </KPIBand>

          <div className="space-y-1.5">
            {[
              { from: 'Nextera Corp', subject: 'Redesign Phase 2 — approval needed', time: '1 hr ago', unread: true, urgent: true },
              { from: 'Bloom Studio', subject: 'Logo variations feedback', time: '3 hrs ago', unread: true, urgent: false },
              { from: 'ArcVentures', subject: 'Re: Timeline concerns', time: '5 hrs ago', unread: true, urgent: true },
              { from: 'Pulse Health', subject: 'Contract renewal discussion', time: '1 day ago', unread: false, urgent: false },
              { from: 'New Lead — Zenith Inc', subject: 'Website redesign inquiry', time: '2 days ago', unread: false, urgent: false },
            ].map((msg, i) => (
              <div key={i} className={cn('rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer', msg.unread && 'border-accent/30')} onClick={() => openDetail('message', msg.subject, msg.from)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {msg.unread && <span className="h-2 w-2 rounded-full bg-accent" />}
                    <span className={cn("text-[10px]", msg.unread ? "font-bold" : "font-medium")}>{msg.from}</span>
                    {msg.urgent && <Badge className="text-[6px] bg-[hsl(var(--state-caution))]/10 text-[hsl(var(--state-caution))]">Urgent</Badge>}
                  </div>
                  <span className="text-[8px] text-muted-foreground">{msg.time}</span>
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{msg.subject}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ RESOURCES ═══ */}
      {tab === 'resources' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Capacity" value={`${TEAM.filter(t => t.status === 'active').length * 40}h/wk`} />
            <KPICard label="Allocated" value={`${Math.round(avgUtilization * TEAM.filter(t => t.status === 'active').length * 40 / 100)}h/wk`} />
            <KPICard label="Available" value={`${Math.round((100 - avgUtilization) * TEAM.filter(t => t.status === 'active').length * 40 / 100)}h/wk`} />
            <KPICard label="Overbooked" value="0" />
          </KPIBand>

          <SectionCard title="Resource Allocation by Project" icon={<Target className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5 text-[9px]">
              {DELIVERIES.filter(d => d.status !== 'completed').map(d => (
                <div key={d.id} className="flex items-center gap-2 rounded-xl border p-2">
                  <span className="w-36 truncate font-medium">{d.project}</span>
                  <Progress value={d.progress} className="h-1.5 flex-1" />
                  <span className="text-muted-foreground w-20 text-right">Lead: {d.lead.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Capacity Forecast" icon={<Calendar className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5 text-[9px]">
              {[
                { week: 'This Week', capacity: 85 },
                { week: 'Next Week', capacity: 78 },
                { week: 'Week 3', capacity: 65 },
                { week: 'Week 4', capacity: 55 },
              ].map(w => (
                <div key={w.week} className="flex items-center gap-2">
                  <span className="w-20 text-muted-foreground">{w.week}</span>
                  <Progress value={w.capacity} className="h-1.5 flex-1" />
                  <span className={cn('font-bold w-10 text-right', w.capacity >= 80 ? 'text-[hsl(var(--state-caution))]' : 'text-[hsl(var(--state-healthy))]')}>{w.capacity}%</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-3">
            <div className="flex items-center gap-2 mb-1"><Zap className="h-4 w-4 text-accent" /><span className="text-[10px] font-semibold">AI Insight</span></div>
            <p className="text-[9px] text-muted-foreground">Capacity drops below 60% in 3 weeks. Consider staffing Taylor Brooks on the ArcVentures API project or pursuing the Zenith Inc lead to maintain utilization targets.</p>
          </div>
        </div>
      )}

      {/* ═══ TEAM ═══ */}
      {tab === 'team' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Team Size" value={String(TEAM.length)} />
            <KPICard label="Active" value={String(TEAM.filter(t => t.status === 'active').length)} />
            <KPICard label="Seats Available" value={String(8 - TEAM.length)} />
            <KPICard label="Avg Projects/Person" value={(TEAM.filter(t => t.status === 'active').reduce((a, t) => a + t.projects, 0) / TEAM.filter(t => t.status === 'active').length).toFixed(1)} />
          </KPIBand>

          <div className="space-y-1.5">
            {TEAM.map(m => {
              const ms = MEMBER_STATUS[m.status];
              return (
                <div key={m.id} onClick={() => setSelectedMember(m)} className={cn('rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer', selectedMember?.id === m.id && 'ring-1 ring-accent')}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8"><AvatarFallback className="text-[8px] bg-accent/10 text-accent">{m.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{m.name}</span><StatusBadge status={ms.badge} label={ms.label} /></div>
                      <div className="text-[8px] text-muted-foreground">{m.role} · {m.projects} projects · {m.utilization}% utilization</div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg" onClick={e => { e.stopPropagation(); toast.info('Role editor opened'); }}><Settings className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg" onClick={e => { e.stopPropagation(); openDetail('member', m.name, m.role); }}><MoreHorizontal className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => setInviteDrawer(true)}><UserPlus className="h-3 w-3" />Invite Team Member</Button>
        </div>
      )}

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        <div className="flex-1"><span className="text-[10px] font-semibold">Agency Dashboard</span><div className="text-[8px] text-muted-foreground">{activeProjects} projects · {avgUtilization}% utilization</div></div>
        <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-4" onClick={() => setInviteDrawer(true)}><UserPlus className="h-3.5 w-3.5" />Invite</Button>
      </div>

      {/* Invite Drawer */}
      <Sheet open={inviteDrawer} onOpenChange={setInviteDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Invite Team Member</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Email</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="team@example.com" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Name</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="Full name" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Role</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>Member</option><option>Admin</option><option>Team Lead</option><option>Viewer</option></select></div>
            <div><label className="text-[9px] font-medium mb-1 block">Department</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="e.g. Design, Engineering" /></div>
            <div className="rounded-xl border bg-muted/20 p-2 text-[8px] text-muted-foreground"><strong>Seats:</strong> {TEAM.length}/8 used. {8 - TEAM.length} available.</div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setInviteDrawer(false)}>Cancel</Button>
              <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setInviteDrawer(false); toast.success('Invitation sent!'); }}><Mail className="h-3 w-3" />Send Invite</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Drawer */}
      <Sheet open={detailDrawer} onOpenChange={setDetailDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Detail Inspector</SheetTitle></SheetHeader>
          {detailItem && (
            <div className="p-4 space-y-3">
              <Badge variant="secondary" className="text-[7px] capitalize">{detailItem.type}</Badge>
              <h3 className="text-[12px] font-bold">{detailItem.title}</h3>
              <p className="text-[9px] text-muted-foreground">{detailItem.detail}</p>
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="h-7 text-[9px] flex-1 rounded-xl" onClick={() => setDetailDrawer(false)}>Close</Button>
                <Button size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl" onClick={() => { setDetailDrawer(false); toast.success('Action taken!'); }}><CheckCircle2 className="h-3 w-3" />Take Action</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default AgencyManagementDashboardPage;
