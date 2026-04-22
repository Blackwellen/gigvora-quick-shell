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
  LayoutGrid, BarChart3, Table2, Clock, AlertTriangle, TrendingUp, Download,
  Plus, Search, Filter, MoreHorizontal, ChevronRight, CheckCircle2, X,
  Users, Calendar, Activity, Zap, Eye, Settings, RefreshCw, ArrowRightLeft,
  Layers, Target, Gauge, MapPin, FileText, Star, Pin, Archive,
  CalendarDays, UserCheck, UserX, Briefcase, Timer, GitBranch,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRole } from '@/contexts/RoleContext';

type RPTab = 'board' | 'heatmap' | 'assignments' | 'timeline' | 'conflicts' | 'forecast' | 'export' | 'mobile';

interface Resource {
  id: string; name: string; role: string; dept: string; avatar: string;
  utilization: number; capacity: number; assigned: number; available: number;
  status: 'available' | 'busy' | 'overloaded' | 'on-leave' | 'blocked';
  skills: string[]; currentProjects: string[];
}

interface Assignment {
  id: string; resource: string; project: string; role: string; allocation: number;
  start: string; end: string; status: 'active' | 'pending' | 'completed' | 'conflict';
  priority: 'high' | 'medium' | 'low';
}

interface Conflict {
  id: string; resource: string; projects: string[]; type: 'overlap' | 'overallocation' | 'skill-gap' | 'availability';
  severity: 'critical' | 'warning' | 'info'; description: string; resolvedBy?: string;
}

const RESOURCES: Resource[] = [
  { id: 'r1', name: 'Liam Chen', role: 'Senior Engineer', dept: 'Engineering', avatar: 'LC', utilization: 92, capacity: 40, assigned: 37, available: 3, status: 'overloaded', skills: ['React', 'Node.js', 'AWS'], currentProjects: ['Platform v3', 'API Gateway'] },
  { id: 'r2', name: 'Sophia Wang', role: 'Product Designer', dept: 'Design', avatar: 'SW', utilization: 78, capacity: 40, assigned: 31, available: 9, status: 'busy', skills: ['Figma', 'UX Research', 'Design Systems'], currentProjects: ['Design System v3'] },
  { id: 'r3', name: 'Noah Park', role: 'Full Stack Dev', dept: 'Engineering', avatar: 'NP', utilization: 65, capacity: 40, assigned: 26, available: 14, status: 'available', skills: ['TypeScript', 'Python', 'PostgreSQL'], currentProjects: ['Client Portal'] },
  { id: 'r4', name: 'Olivia Martin', role: 'Project Manager', dept: 'Operations', avatar: 'OM', utilization: 85, capacity: 40, assigned: 34, available: 6, status: 'busy', skills: ['Agile', 'Stakeholder Mgmt', 'Risk'], currentProjects: ['Platform v3', 'Client Portal', 'Q2 Launch'] },
  { id: 'r5', name: 'Aiden Kim', role: 'DevOps Engineer', dept: 'Engineering', avatar: 'AK', utilization: 45, capacity: 40, assigned: 18, available: 22, status: 'available', skills: ['Kubernetes', 'CI/CD', 'Terraform'], currentProjects: ['Infra Upgrade'] },
  { id: 'r6', name: 'Emma Johnson', role: 'QA Lead', dept: 'Engineering', avatar: 'EJ', utilization: 0, capacity: 40, assigned: 0, available: 0, status: 'on-leave', skills: ['Automation', 'Selenium', 'Performance'], currentProjects: [] },
  { id: 'r7', name: 'Lucas Garcia', role: 'Backend Dev', dept: 'Engineering', avatar: 'LG', utilization: 100, capacity: 40, assigned: 40, available: 0, status: 'overloaded', skills: ['Go', 'Microservices', 'Redis'], currentProjects: ['API Gateway', 'Data Pipeline', 'Auth Service'] },
  { id: 'r8', name: 'Mia Thompson', role: 'UX Researcher', dept: 'Design', avatar: 'MT', utilization: 55, capacity: 32, assigned: 18, available: 14, status: 'available', skills: ['User Interviews', 'Analytics', 'A/B Testing'], currentProjects: ['User Onboarding'] },
];

const ASSIGNMENTS: Assignment[] = [
  { id: 'a1', resource: 'Liam Chen', project: 'Platform v3', role: 'Tech Lead', allocation: 60, start: 'Mar 1', end: 'Jun 30', status: 'active', priority: 'high' },
  { id: 'a2', resource: 'Liam Chen', project: 'API Gateway', role: 'Reviewer', allocation: 32, start: 'Apr 1', end: 'May 15', status: 'conflict', priority: 'high' },
  { id: 'a3', resource: 'Sophia Wang', project: 'Design System v3', role: 'Lead Designer', allocation: 78, start: 'Feb 15', end: 'May 31', status: 'active', priority: 'medium' },
  { id: 'a4', resource: 'Noah Park', project: 'Client Portal', role: 'Developer', allocation: 65, start: 'Mar 15', end: 'Jun 15', status: 'active', priority: 'medium' },
  { id: 'a5', resource: 'Olivia Martin', project: 'Platform v3', role: 'PM', allocation: 40, start: 'Jan 1', end: 'Jun 30', status: 'active', priority: 'high' },
  { id: 'a6', resource: 'Olivia Martin', project: 'Q2 Launch', role: 'Coordinator', allocation: 30, start: 'Apr 1', end: 'Jun 30', status: 'pending', priority: 'high' },
  { id: 'a7', resource: 'Aiden Kim', project: 'Infra Upgrade', role: 'Lead', allocation: 45, start: 'Apr 1', end: 'May 31', status: 'active', priority: 'low' },
  { id: 'a8', resource: 'Lucas Garcia', project: 'API Gateway', role: 'Backend Lead', allocation: 50, start: 'Mar 1', end: 'May 15', status: 'active', priority: 'high' },
  { id: 'a9', resource: 'Lucas Garcia', project: 'Data Pipeline', role: 'Developer', allocation: 30, start: 'Apr 1', end: 'Jul 31', status: 'active', priority: 'medium' },
  { id: 'a10', resource: 'Lucas Garcia', project: 'Auth Service', role: 'Contributor', allocation: 20, start: 'Apr 10', end: 'May 30', status: 'conflict', priority: 'low' },
];

const CONFLICTS: Conflict[] = [
  { id: 'c1', resource: 'Liam Chen', projects: ['Platform v3', 'API Gateway'], type: 'overallocation', severity: 'critical', description: 'Total allocation at 92% — exceeds 85% threshold. Risk of burnout and delivery delays.' },
  { id: 'c2', resource: 'Lucas Garcia', projects: ['API Gateway', 'Data Pipeline', 'Auth Service'], type: 'overallocation', severity: 'critical', description: 'Allocated at 100% across 3 projects. Immediate rebalancing needed.' },
  { id: 'c3', resource: 'Olivia Martin', projects: ['Platform v3', 'Q2 Launch'], type: 'overlap', severity: 'warning', description: 'Timeline overlap between Q2 Launch coordination and Platform v3 PM duties in April.' },
  { id: 'c4', resource: 'Emma Johnson', projects: ['Platform v3'], type: 'availability', severity: 'warning', description: 'QA Lead on leave — no coverage for Platform v3 testing milestones due Apr 20.' },
  { id: 'c5', resource: 'Noah Park', projects: ['Client Portal'], type: 'skill-gap', severity: 'info', description: 'Client Portal requires GraphQL experience — Noah has limited exposure. Consider pairing or training.' },
];

const UTIL_COLOR = (u: number) => u >= 90 ? 'text-[hsl(var(--state-blocked))]' : u >= 75 ? 'text-accent' : u >= 50 ? 'text-foreground' : 'text-muted-foreground';
const UTIL_BG = (u: number) => u >= 90 ? 'bg-[hsl(var(--state-blocked))]/15' : u >= 75 ? 'bg-accent/10' : u >= 50 ? 'bg-muted/30' : 'bg-muted/10';
const STATUS_MAP: Record<string, { badge: 'healthy' | 'pending' | 'blocked' | 'caution' | 'live'; label: string }> = {
  available: { badge: 'healthy', label: 'Available' }, busy: { badge: 'pending', label: 'Busy' },
  overloaded: { badge: 'blocked', label: 'Overloaded' }, 'on-leave': { badge: 'caution', label: 'On Leave' },
  blocked: { badge: 'blocked', label: 'Blocked' },
};
const PRIORITY_DOT: Record<string, string> = { high: 'text-[hsl(var(--state-blocked))]', medium: 'text-accent', low: 'text-muted-foreground' };
const SEVERITY_MAP: Record<string, { badge: 'blocked' | 'caution' | 'pending'; label: string }> = {
  critical: { badge: 'blocked', label: 'Critical' }, warning: { badge: 'caution', label: 'Warning' }, info: { badge: 'pending', label: 'Info' },
};

const ResourcePlanningPage: React.FC = () => {
  const { activeRole } = useRole();
  const [tab, setTab] = useState<RPTab>('board');
  const [selectedRes, setSelectedRes] = useState<Resource | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [assignDrawer, setAssignDrawer] = useState(false);
  const [conflictDrawer, setConflictDrawer] = useState(false);
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [detailItem, setDetailItem] = useState<{ type: string; title: string; detail: string } | null>(null);

  const openDetail = (type: string, title: string, detail: string) => { setDetailItem({ type, title, detail }); setDetailDrawer(true); };

  const filteredResources = RESOURCES.filter(r => {
    if (filterDept !== 'all' && r.dept !== filterDept) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchQ && !r.name.toLowerCase().includes(searchQ.toLowerCase()) && !r.role.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  const topStrip = (
    <>
      <Gauge className="h-3.5 w-3.5 text-accent" />
      <span className="text-[11px] font-semibold">Resource Planning · Capacity</span>
      <Badge variant="secondary" className="text-[7px] capitalize">{activeRole}</Badge>
      <div className="flex-1" />
      <Badge variant="outline" className="text-[7px]">{RESOURCES.filter(r => r.status === 'overloaded').length} overloaded</Badge>
      <Badge variant="outline" className="text-[7px]">{CONFLICTS.filter(c => c.severity === 'critical').length} critical conflicts</Badge>
      <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setAssignDrawer(true)}><Plus className="h-3 w-3" />Assign</Button>
      <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Exporting...')}><Download className="h-3 w-3" />Export</Button>
    </>
  );

  const rightRail = selectedRes ? (
    <div className="space-y-3">
      <SectionCard title="Resource" icon={<UserCheck className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-8 w-8"><AvatarFallback className="text-[8px] bg-accent/10 text-accent">{selectedRes.avatar}</AvatarFallback></Avatar>
            <div><div className="text-[11px] font-semibold">{selectedRes.name}</div><div className="text-[8px] text-muted-foreground">{selectedRes.role}</div></div>
          </div>
          <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span>{selectedRes.dept}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={STATUS_MAP[selectedRes.status].badge} label={STATUS_MAP[selectedRes.status].label} /></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Utilization</span><span className={UTIL_COLOR(selectedRes.utilization)}>{selectedRes.utilization}%</span></div>
          <Progress value={selectedRes.utilization} className="h-1.5" />
          <div className="flex justify-between"><span className="text-muted-foreground">Capacity</span><span>{selectedRes.capacity}h/wk</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Assigned</span><span>{selectedRes.assigned}h</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Available</span><span className="font-medium">{selectedRes.available}h</span></div>
        </div>
        <div className="mt-2 pt-2 border-t">
          <div className="text-[8px] text-muted-foreground mb-1">Skills</div>
          <div className="flex flex-wrap gap-1">{selectedRes.skills.map(s => <Badge key={s} variant="outline" className="text-[6px]">{s}</Badge>)}</div>
        </div>
        <div className="mt-2 pt-2 border-t">
          <div className="text-[8px] text-muted-foreground mb-1">Projects</div>
          {selectedRes.currentProjects.map(p => <div key={p} className="text-[8px] flex items-center gap-1 py-0.5 cursor-pointer hover:text-accent" onClick={() => openDetail('project', p, selectedRes.name)}><Briefcase className="h-2.5 w-2.5" />{p}</div>)}
        </div>
      </SectionCard>
      <SectionCard title="Actions" className="!rounded-2xl">
        <div className="space-y-1">
          <Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl" onClick={() => setAssignDrawer(true)}><Plus className="h-3 w-3" />New Assignment</Button>
          <Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl" onClick={() => openDetail('schedule', selectedRes.name, 'Schedule view')}><Calendar className="h-3 w-3" />View Schedule</Button>
          <Link to="/profile"><Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl"><Eye className="h-3 w-3" />View Profile</Button></Link>
        </div>
      </SectionCard>
    </div>
  ) : (
    <div className="space-y-3">
      <SectionCard title="Alerts" icon={<AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {CONFLICTS.filter(c => c.severity === 'critical').map(c => (
            <div key={c.id} className="text-[8px] flex items-center gap-1.5 p-1 rounded-lg hover:bg-muted/20 cursor-pointer" onClick={() => { setTab('conflicts'); }}>
              <span className="text-[hsl(var(--state-blocked))] font-bold">●</span>
              <span className="flex-1 truncate">{c.resource}: {c.type}</span>
              <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Capacity Summary" icon={<Gauge className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Total Capacity</span><span>{RESOURCES.reduce((s, r) => s + r.capacity, 0)}h/wk</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total Assigned</span><span>{RESOURCES.reduce((s, r) => s + r.assigned, 0)}h</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Available</span><span className="font-medium text-accent">{RESOURCES.reduce((s, r) => s + r.available, 0)}h</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Avg Utilization</span><span>{Math.round(RESOURCES.filter(r => r.status !== 'on-leave').reduce((s, r) => s + r.utilization, 0) / RESOURCES.filter(r => r.status !== 'on-leave').length)}%</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Quick Links" className="!rounded-2xl">
        <div className="space-y-1">
          <Link to="/org/members"><Button variant="ghost" size="sm" className="h-6 text-[8px] w-full gap-1 rounded-lg justify-start"><Users className="h-3 w-3" />Org Members</Button></Link>
          <Link to="/org/workspaces"><Button variant="ghost" size="sm" className="h-6 text-[8px] w-full gap-1 rounded-lg justify-start"><Layers className="h-3 w-3" />Workspaces</Button></Link>
          <Link to="/projects"><Button variant="ghost" size="sm" className="h-6 text-[8px] w-full gap-1 rounded-lg justify-start"><Briefcase className="h-3 w-3" />Projects</Button></Link>
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><Activity className="h-3.5 w-3.5 text-accent" />Recent Assignment Changes</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {[
          { actor: 'Olivia M', action: 'reassigned Liam C', target: 'API Gateway → reduced to 20%', time: '1 hr ago' },
          { actor: 'System', action: 'flagged conflict', target: 'Lucas G at 100% allocation', time: '2 hrs ago' },
          { actor: 'Aiden K', action: 'completed assignment', target: 'Infra Upgrade Phase 1', time: '4 hrs ago' },
          { actor: 'Sophia W', action: 'capacity updated', target: '40h → 32h next sprint', time: '1 day ago' },
        ].map((e, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-xl border bg-card text-[8px]">
            <GitBranch className="h-3 w-3 text-accent shrink-0" />
            <div><div className="font-medium">{e.actor}: {e.action}</div><div className="text-muted-foreground">{e.target} · {e.time}</div></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      <div className="flex items-center gap-1 mb-3 border-b pb-2 overflow-x-auto">
        {([
          { key: 'board' as const, label: 'Resource Board', icon: LayoutGrid },
          { key: 'heatmap' as const, label: 'Capacity Heatmap', icon: BarChart3 },
          { key: 'assignments' as const, label: 'Assignments', icon: Table2 },
          { key: 'timeline' as const, label: 'Timeline', icon: Clock },
          { key: 'conflicts' as const, label: 'Conflicts', icon: AlertTriangle },
          { key: 'forecast' as const, label: 'Forecast', icon: TrendingUp },
          { key: 'export' as const, label: 'Export', icon: Download },
          { key: 'mobile' as const, label: 'Summary', icon: Layers },
        ]).map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSelectedRes(null); }} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] transition-colors whitespace-nowrap shrink-0',
            tab === t.key ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
          )}><t.icon className="h-3 w-3" />{t.label}</button>
        ))}
      </div>

      {/* ═══ RESOURCE BOARD ═══ */}
      {tab === 'board' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Team Size" value={String(RESOURCES.length)} />
            <KPICard label="Available" value={String(RESOURCES.filter(r => r.status === 'available').length)} />
            <KPICard label="Overloaded" value={String(RESOURCES.filter(r => r.status === 'overloaded').length)} change="Action needed" />
            <KPICard label="On Leave" value={String(RESOURCES.filter(r => r.status === 'on-leave').length)} />
          </KPIBand>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[160px] max-w-xs"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><input value={searchQ} onChange={e => setSearchQ(e.target.value)} className="w-full h-7 rounded-xl border bg-background pl-7 pr-2 text-[9px]" placeholder="Search resources..." /></div>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px]"><option value="all">All Depts</option><option value="Engineering">Engineering</option><option value="Design">Design</option><option value="Operations">Operations</option></select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px]"><option value="all">All Status</option><option value="available">Available</option><option value="busy">Busy</option><option value="overloaded">Overloaded</option><option value="on-leave">On Leave</option></select>
            {(filterDept !== 'all' || filterStatus !== 'all' || searchQ) && <Button variant="ghost" size="sm" className="h-7 text-[8px] gap-1 rounded-xl" onClick={() => { setFilterDept('all'); setFilterStatus('all'); setSearchQ(''); }}><X className="h-3 w-3" />Clear</Button>}
          </div>
          <div className="space-y-1.5">
            {filteredResources.map(r => {
              const sm = STATUS_MAP[r.status];
              return (
                <div key={r.id} onClick={() => setSelectedRes(r)} className={cn('rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer', selectedRes?.id === r.id && 'ring-1 ring-accent', r.status === 'on-leave' && 'opacity-60')}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border-2 border-background"><AvatarFallback className={cn('text-[8px]', UTIL_BG(r.utilization), UTIL_COLOR(r.utilization))}>{r.avatar}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{r.name}</span><StatusBadge status={sm.badge} label={sm.label} /></div>
                      <div className="text-[8px] text-muted-foreground">{r.role} · {r.dept} · {r.currentProjects.length} projects</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className={cn('text-[11px] font-bold', UTIL_COLOR(r.utilization))}>{r.utilization}%</div>
                        <div className="text-[7px] text-muted-foreground">{r.assigned}h / {r.capacity}h</div>
                      </div>
                      <div className="w-16"><Progress value={r.utilization} className="h-1.5" /></div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg" onClick={e => { e.stopPropagation(); openDetail('resource', r.name, r.role); }}><MoreHorizontal className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ CAPACITY HEATMAP ═══ */}
      {tab === 'heatmap' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Avg Utilization" value={`${Math.round(RESOURCES.filter(r => r.status !== 'on-leave').reduce((s, r) => s + r.utilization, 0) / RESOURCES.filter(r => r.status !== 'on-leave').length)}%`} />
            <KPICard label="Over 85%" value={String(RESOURCES.filter(r => r.utilization > 85).length)} change="At risk" />
            <KPICard label="Under 50%" value={String(RESOURCES.filter(r => r.utilization < 50 && r.status !== 'on-leave').length)} />
            <KPICard label="Spare Capacity" value={`${RESOURCES.reduce((s, r) => s + r.available, 0)}h`} />
          </KPIBand>
          <SectionCard title="Weekly Capacity Heatmap" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-[8px]">
                <thead><tr className="border-b"><th className="text-left py-1 pr-3 font-medium">Resource</th>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => <th key={d} className="text-center py-1 px-2 font-medium">{d}</th>)}<th className="text-right py-1 pl-3 font-medium">Total</th></tr></thead>
                <tbody>
                  {RESOURCES.filter(r => r.status !== 'on-leave').map(r => {
                    const daily = Math.round(r.assigned / 5);
                    const cap = r.capacity / 5;
                    return (
                      <tr key={r.id} className="border-b hover:bg-muted/10 cursor-pointer" onClick={() => setSelectedRes(r)}>
                        <td className="py-1.5 pr-3 font-medium">{r.name}</td>
                        {[0, 1, 2, 3, 4].map(i => {
                          const hrs = Math.min(daily + (i % 2 === 0 ? 1 : -1), cap);
                          const pct = (hrs / cap) * 100;
                          return <td key={i} className="text-center py-1.5 px-1"><div className={cn('rounded-lg px-1.5 py-0.5 mx-auto w-fit', pct >= 90 ? 'bg-[hsl(var(--state-blocked))]/15 text-[hsl(var(--state-blocked))]' : pct >= 70 ? 'bg-accent/10 text-accent' : 'bg-muted/30')}>{hrs}h</div></td>;
                        })}
                        <td className={cn('text-right py-1.5 pl-3 font-bold', UTIL_COLOR(r.utilization))}>{r.assigned}h</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
          <div className="flex items-center gap-3 text-[7px] text-muted-foreground">
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-[hsl(var(--state-blocked))]/15" /> ≥90%</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-accent/10" /> 70-89%</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-muted/30" /> &lt;70%</span>
          </div>
        </div>
      )}

      {/* ═══ ASSIGNMENTS ═══ */}
      {tab === 'assignments' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Assignments" value={String(ASSIGNMENTS.length)} />
            <KPICard label="Active" value={String(ASSIGNMENTS.filter(a => a.status === 'active').length)} />
            <KPICard label="Conflicts" value={String(ASSIGNMENTS.filter(a => a.status === 'conflict').length)} change="Review" />
            <KPICard label="Pending" value={String(ASSIGNMENTS.filter(a => a.status === 'pending').length)} />
          </KPIBand>
          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-[8px]">
              <thead><tr className="bg-muted/20 border-b"><th className="text-left py-2 px-3 font-medium">Resource</th><th className="text-left py-2 px-2 font-medium">Project</th><th className="text-left py-2 px-2 font-medium">Role</th><th className="text-center py-2 px-2 font-medium">Alloc %</th><th className="text-center py-2 px-2 font-medium">Period</th><th className="text-center py-2 px-2 font-medium">Status</th><th className="text-center py-2 px-2 font-medium">Actions</th></tr></thead>
              <tbody>
                {ASSIGNMENTS.map(a => (
                  <tr key={a.id} className={cn('border-b hover:bg-muted/10 cursor-pointer', a.status === 'conflict' && 'bg-[hsl(var(--state-blocked))]/5')} onClick={() => openDetail('assignment', `${a.resource} → ${a.project}`, `${a.role} at ${a.allocation}%`)}>
                    <td className="py-2 px-3 font-medium"><span className={cn('mr-1', PRIORITY_DOT[a.priority])}>●</span>{a.resource}</td>
                    <td className="py-2 px-2">{a.project}</td>
                    <td className="py-2 px-2 text-muted-foreground">{a.role}</td>
                    <td className="py-2 px-2 text-center"><span className={cn('font-bold', a.allocation > 50 ? 'text-accent' : '')}>{a.allocation}%</span></td>
                    <td className="py-2 px-2 text-center text-muted-foreground">{a.start} – {a.end}</td>
                    <td className="py-2 px-2 text-center"><StatusBadge status={a.status === 'active' ? 'healthy' : a.status === 'conflict' ? 'blocked' : a.status === 'pending' ? 'pending' : 'healthy'} label={a.status} /></td>
                    <td className="py-2 px-2 text-center"><Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e => { e.stopPropagation(); toast.info('Edit assignment'); }}><Settings className="h-2.5 w-2.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => setAssignDrawer(true)}><Plus className="h-3 w-3" />New Assignment</Button>
        </div>
      )}

      {/* ═══ TIMELINE ═══ */}
      {tab === 'timeline' && (
        <div className="space-y-3">
          <SectionCard title="Assignment Timeline" icon={<Clock className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              {RESOURCES.filter(r => r.currentProjects.length > 0).map(r => (
                <div key={r.id} className="rounded-xl border p-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Avatar className="h-5 w-5"><AvatarFallback className="text-[5px] bg-accent/10 text-accent">{r.avatar}</AvatarFallback></Avatar>
                    <span className="text-[9px] font-semibold">{r.name}</span>
                    <span className={cn('text-[8px] font-bold ml-auto', UTIL_COLOR(r.utilization))}>{r.utilization}%</span>
                  </div>
                  <div className="space-y-1">
                    {ASSIGNMENTS.filter(a => a.resource === r.name).map(a => (
                      <div key={a.id} className={cn('flex items-center gap-2 rounded-lg px-2 py-1 text-[7px] cursor-pointer hover:shadow-sm', a.status === 'conflict' ? 'bg-[hsl(var(--state-blocked))]/10 border border-[hsl(var(--state-blocked))]/20' : 'bg-accent/5 border border-accent/10')} onClick={() => openDetail('assignment', a.project, `${a.allocation}% · ${a.start} – ${a.end}`)}>
                        <span className={cn('font-bold', PRIORITY_DOT[a.priority])}>●</span>
                        <span className="font-medium flex-1">{a.project}</span>
                        <span className="text-muted-foreground">{a.allocation}%</span>
                        <span className="text-muted-foreground">{a.start} – {a.end}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ CONFLICTS ═══ */}
      {tab === 'conflicts' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Conflicts" value={String(CONFLICTS.length)} />
            <KPICard label="Critical" value={String(CONFLICTS.filter(c => c.severity === 'critical').length)} change="Immediate" />
            <KPICard label="Warnings" value={String(CONFLICTS.filter(c => c.severity === 'warning').length)} />
            <KPICard label="Info" value={String(CONFLICTS.filter(c => c.severity === 'info').length)} />
          </KPIBand>
          <div className="space-y-1.5">
            {CONFLICTS.map(c => {
              const sev = SEVERITY_MAP[c.severity];
              return (
                <div key={c.id} className={cn('rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer', c.severity === 'critical' && 'border-[hsl(var(--state-blocked))]/30')} onClick={() => setConflictDrawer(true)}>
                  <div className="flex items-center gap-3">
                    <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0', c.severity === 'critical' ? 'bg-[hsl(var(--state-blocked))]/10' : 'bg-muted')}>
                      <AlertTriangle className={cn('h-4 w-4', c.severity === 'critical' ? 'text-[hsl(var(--state-blocked))]' : 'text-muted-foreground')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{c.resource}</span><StatusBadge status={sev.badge} label={sev.label} /><Badge variant="outline" className="text-[6px]">{c.type}</Badge></div>
                      <div className="text-[8px] text-muted-foreground">{c.description}</div>
                      <div className="flex gap-1 mt-0.5">{c.projects.map(p => <Badge key={p} variant="secondary" className="text-[6px]">{p}</Badge>)}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" className="h-6 text-[8px] gap-1 rounded-lg" onClick={e => { e.stopPropagation(); toast.success('Conflict resolved'); }}><CheckCircle2 className="h-3 w-3" />Resolve</Button>
                      <Button variant="outline" size="sm" className="h-6 text-[8px] gap-1 rounded-lg" onClick={e => { e.stopPropagation(); toast.info('Reassigning...'); }}><ArrowRightLeft className="h-3 w-3" />Reassign</Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ FORECAST ═══ */}
      {tab === 'forecast' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Next 4 Weeks" value="72%" change="+5% vs now" />
            <KPICard label="Need Hire" value="2" change="Engineering" />
            <KPICard label="Ending Soon" value="3" change="Assignments" />
            <KPICard label="Capacity Gap" value="48h" change="Projected" />
          </KPIBand>
          <SectionCard title="Availability Forecast" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              {['Week 1 (Apr 14-18)', 'Week 2 (Apr 21-25)', 'Week 3 (Apr 28 – May 2)', 'Week 4 (May 5-9)'].map((week, i) => {
                const util = [77, 82, 68, 55][i];
                return (
                  <div key={week} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                    <span className="text-[9px] font-medium w-36">{week}</span>
                    <div className="flex-1"><Progress value={util} className="h-2" /></div>
                    <span className={cn('text-[9px] font-bold w-10 text-right', UTIL_COLOR(util))}>{util}%</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
          <SectionCard title="Ending Assignments" icon={<Timer className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {ASSIGNMENTS.filter(a => a.end === 'May 15' || a.end === 'May 31').map(a => (
                <div key={a.id} className="flex items-center gap-2 text-[8px] p-1.5 rounded-lg hover:bg-muted/20 cursor-pointer" onClick={() => openDetail('assignment', a.project, `${a.resource} ends ${a.end}`)}>
                  <Timer className="h-3 w-3 text-[hsl(var(--state-caution))]" />
                  <span className="flex-1">{a.resource} — {a.project}</span>
                  <span className="text-muted-foreground">Ends {a.end}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ EXPORT ═══ */}
      {tab === 'export' && (
        <div className="space-y-3">
          <SectionCard title="Export & Reports" icon={<Download className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Resource Utilization Report', desc: 'CSV with all resource metrics' },
                { label: 'Assignment Schedule', desc: 'Excel with timeline and allocations' },
                { label: 'Conflict Summary', desc: 'PDF report of all conflicts' },
                { label: 'Capacity Forecast', desc: '4-week forward projection' },
              ].map(r => (
                <div key={r.label} className="rounded-xl border p-3 hover:shadow-sm cursor-pointer transition-all" onClick={() => toast.success(`Generating ${r.label}...`)}>
                  <div className="flex items-center gap-2"><Download className="h-3.5 w-3.5 text-accent" /><div><div className="text-[9px] font-semibold">{r.label}</div><div className="text-[7px] text-muted-foreground">{r.desc}</div></div></div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ MOBILE SUMMARY ═══ */}
      {tab === 'mobile' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Team" value={String(RESOURCES.length)} />
            <KPICard label="Overloaded" value={String(RESOURCES.filter(r => r.status === 'overloaded').length)} change="Critical" />
            <KPICard label="Conflicts" value={String(CONFLICTS.filter(c => c.severity === 'critical').length)} />
            <KPICard label="Available" value={`${RESOURCES.reduce((s, r) => s + r.available, 0)}h`} />
          </KPIBand>
          <SectionCard title="Quick Actions" className="!rounded-2xl">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-9 text-[9px] gap-1 rounded-xl" onClick={() => setAssignDrawer(true)}><Plus className="h-3.5 w-3.5" />Assign</Button>
              <Button variant="outline" size="sm" className="h-9 text-[9px] gap-1 rounded-xl" onClick={() => setTab('conflicts')}><AlertTriangle className="h-3.5 w-3.5" />Conflicts</Button>
              <Button variant="outline" size="sm" className="h-9 text-[9px] gap-1 rounded-xl" onClick={() => setTab('heatmap')}><BarChart3 className="h-3.5 w-3.5" />Heatmap</Button>
              <Button variant="outline" size="sm" className="h-9 text-[9px] gap-1 rounded-xl" onClick={() => setTab('forecast')}><TrendingUp className="h-3.5 w-3.5" />Forecast</Button>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        <div className="flex-1"><span className="text-[10px] font-semibold">Resources</span><div className="text-[8px] text-muted-foreground">{RESOURCES.filter(r => r.status === 'overloaded').length} overloaded · {CONFLICTS.filter(c => c.severity === 'critical').length} critical</div></div>
        <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-4" onClick={() => setAssignDrawer(true)}><Plus className="h-3.5 w-3.5" />Assign</Button>
      </div>

      {/* Assign Drawer */}
      <Sheet open={assignDrawer} onOpenChange={setAssignDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">New Assignment</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Resource</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]">{RESOURCES.filter(r => r.status !== 'on-leave').map(r => <option key={r.id}>{r.name} ({r.available}h avail)</option>)}</select></div>
            <div><label className="text-[9px] font-medium mb-1 block">Project</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="Search or select project" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Role</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="e.g. Tech Lead, Developer" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[9px] font-medium mb-1 block">Allocation %</label><input type="number" className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="50" /></div>
              <div><label className="text-[9px] font-medium mb-1 block">Priority</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>High</option><option>Medium</option><option>Low</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[9px] font-medium mb-1 block">Start</label><input type="date" className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" /></div>
              <div><label className="text-[9px] font-medium mb-1 block">End</label><input type="date" className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" /></div>
            </div>
            <div><label className="text-[9px] font-medium mb-1 block">Notes</label><textarea className="w-full h-16 rounded-xl border bg-background px-2 py-1 text-[9px]" placeholder="Assignment context..." /></div>
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-2 text-[8px] flex items-center gap-1.5"><Zap className="h-3 w-3 text-accent" /><span>System will check for conflicts before confirming.</span></div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setAssignDrawer(false)}>Cancel</Button>
              <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setAssignDrawer(false); toast.success('Assignment created!'); }}><CheckCircle2 className="h-3 w-3" />Assign</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Conflict Resolution Drawer */}
      <Sheet open={conflictDrawer} onOpenChange={setConflictDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Resolve Conflict</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            <div className="text-[9px]">Select a resolution strategy:</div>
            {['Reduce allocation on secondary project', 'Reassign to available team member', 'Extend timeline to reduce weekly load', 'Escalate to manager for decision'].map(opt => (
              <div key={opt} className="rounded-xl border p-2.5 hover:bg-accent/5 cursor-pointer transition-all" onClick={() => { setConflictDrawer(false); toast.success('Resolution applied!'); }}>
                <div className="text-[9px] font-medium">{opt}</div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="h-7 text-[10px] w-full rounded-xl" onClick={() => setConflictDrawer(false)}>Cancel</Button>
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
                <Button size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl" onClick={() => { setDetailDrawer(false); toast.success('Action taken!'); }}><CheckCircle2 className="h-3 w-3" />Action</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default ResourcePlanningPage;
