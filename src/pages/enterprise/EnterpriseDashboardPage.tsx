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
  PieChart, ShoppingCart, Megaphone, Link2, ListChecks, MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRole } from '@/contexts/RoleContext';

type TimeRange = '7d' | '30d' | '90d';
type EntTab = 'overview' | 'team' | 'hiring' | 'procurement' | 'budget' | 'ads' | 'connect' | 'approvals';

interface Member { id: string; name: string; dept: string; role: string; status: 'active' | 'on-leave' | 'suspended'; lastActive: string; }
interface Requisition { id: string; title: string; dept: string; status: 'open' | 'interviewing' | 'offer' | 'filled' | 'closed'; candidates: number; daysOpen: number; }
interface ProcItem { id: string; vendor: string; type: string; amount: string; status: 'pending' | 'approved' | 'rejected' | 'active'; renewal: string; }
interface Approval { id: string; title: string; requester: string; type: string; status: 'pending' | 'approved' | 'rejected' | 'escalated'; amount?: string; submitted: string; }

const MEMBERS: Member[] = [
  { id: 'm1', name: 'Elena Rodriguez', dept: 'Engineering', role: 'VP Engineering', status: 'active', lastActive: '2 min ago' },
  { id: 'm2', name: 'James Chen', dept: 'Design', role: 'Head of Design', status: 'active', lastActive: '15 min ago' },
  { id: 'm3', name: 'Priya Sharma', dept: 'Product', role: 'Product Director', status: 'active', lastActive: '1 hr ago' },
  { id: 'm4', name: 'Marcus Johnson', dept: 'Engineering', role: 'Staff Engineer', status: 'on-leave', lastActive: '3 days ago' },
  { id: 'm5', name: 'Aisha Okonkwo', dept: 'Marketing', role: 'Marketing Lead', status: 'active', lastActive: '30 min ago' },
  { id: 'm6', name: 'David Kim', dept: 'Finance', role: 'Finance Manager', status: 'active', lastActive: '1 hr ago' },
  { id: 'm7', name: 'Sarah Thompson', dept: 'HR', role: 'HR Director', status: 'active', lastActive: '5 min ago' },
  { id: 'm8', name: 'Robert Liu', dept: 'Sales', role: 'Sales VP', status: 'suspended', lastActive: '2 weeks ago' },
];

const REQUISITIONS: Requisition[] = [
  { id: 'r1', title: 'Senior Full-Stack Engineer', dept: 'Engineering', status: 'interviewing', candidates: 12, daysOpen: 18 },
  { id: 'r2', title: 'UX Designer', dept: 'Design', status: 'open', candidates: 24, daysOpen: 5 },
  { id: 'r3', title: 'Product Manager', dept: 'Product', status: 'offer', candidates: 8, daysOpen: 32 },
  { id: 'r4', title: 'DevOps Engineer', dept: 'Engineering', status: 'open', candidates: 6, daysOpen: 3 },
  { id: 'r5', title: 'Data Analyst', dept: 'Finance', status: 'filled', candidates: 15, daysOpen: 45 },
];

const PROC_ITEMS: ProcItem[] = [
  { id: 'p1', vendor: 'AWS', type: 'Cloud Infrastructure', amount: '$18,500/mo', status: 'active', renewal: 'Jul 2025' },
  { id: 'p2', vendor: 'Figma', type: 'Design Tools', amount: '$2,400/yr', status: 'active', renewal: 'Sep 2025' },
  { id: 'p3', vendor: 'Vertex AI Consulting', type: 'Freelancer', amount: '$12,000', status: 'pending', renewal: 'One-time' },
  { id: 'p4', vendor: 'DataDog', type: 'Monitoring', amount: '$3,200/mo', status: 'approved', renewal: 'Dec 2025' },
  { id: 'p5', vendor: 'TechRecruit Agency', type: 'Recruiting', amount: '$25,000', status: 'pending', renewal: 'Project' },
];

const APPROVALS: Approval[] = [
  { id: 'a1', title: 'New AWS Region Expansion', requester: 'Elena Rodriguez', type: 'Procurement', status: 'pending', amount: '$8,200/mo', submitted: '2 hrs ago' },
  { id: 'a2', title: 'Design Team Offsite Budget', requester: 'James Chen', type: 'Budget', status: 'pending', amount: '$15,000', submitted: '1 day ago' },
  { id: 'a3', title: 'Senior Engineer Offer — $185K', requester: 'Sarah Thompson', type: 'Hiring', status: 'pending', amount: '$185,000/yr', submitted: '3 hrs ago' },
  { id: 'a4', title: 'Marketing Campaign Q3', requester: 'Aisha Okonkwo', type: 'Ads', status: 'escalated', amount: '$42,000', submitted: '2 days ago' },
  { id: 'a5', title: 'Freelancer Contract Extension', requester: 'Priya Sharma', type: 'Procurement', status: 'approved', amount: '$6,000', submitted: '5 days ago' },
];

const STATUS_MAP: Record<string, { badge: 'healthy' | 'caution' | 'blocked' | 'pending' | 'live'; label: string }> = {
  active: { badge: 'healthy', label: 'Active' }, 'on-leave': { badge: 'caution', label: 'On Leave' }, suspended: { badge: 'blocked', label: 'Suspended' },
  open: { badge: 'live', label: 'Open' }, interviewing: { badge: 'caution', label: 'Interviewing' }, offer: { badge: 'pending', label: 'Offer' }, filled: { badge: 'healthy', label: 'Filled' }, closed: { badge: 'blocked', label: 'Closed' },
  pending: { badge: 'pending', label: 'Pending' }, approved: { badge: 'healthy', label: 'Approved' }, rejected: { badge: 'blocked', label: 'Rejected' }, escalated: { badge: 'caution', label: 'Escalated' },
};

const EnterpriseDashboardPage: React.FC = () => {
  const { activeRole } = useRole();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [tab, setTab] = useState<EntTab>('overview');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [detailItem, setDetailItem] = useState<{ type: string; title: string; detail: string } | null>(null);
  const [inviteDrawer, setInviteDrawer] = useState(false);
  const [reqDrawer, setReqDrawer] = useState(false);

  const openDetail = (type: string, title: string, detail: string) => { setDetailItem({ type, title, detail }); setDetailDrawer(true); };

  const topStrip = (
    <>
      <Building2 className="h-3.5 w-3.5 text-accent" />
      <span className="text-[11px] font-semibold">Enterprise Command Center</span>
      <Badge variant="secondary" className="text-[7px] capitalize">{activeRole}</Badge>
      <div className="flex-1" />
      <div className="flex items-center gap-1 border rounded-xl p-0.5">
        {(['7d', '30d', '90d'] as const).map(r => (
          <button key={r} onClick={() => setTimeRange(r)} className={cn('px-2 py-0.5 rounded-lg text-[8px] font-medium transition-colors', timeRange === r ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted/30')}>{r}</button>
        ))}
      </div>
      <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setInviteDrawer(true)}><UserPlus className="h-3 w-3" />Invite</Button>
      <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setReqDrawer(true)}><Plus className="h-3 w-3" />New Requisition</Button>
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
          <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span>{selectedMember.dept}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={STATUS_MAP[selectedMember.status].badge} label={STATUS_MAP[selectedMember.status].label} /></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Last Active</span><span>{selectedMember.lastActive}</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Actions" className="!rounded-2xl">
        <div className="space-y-1">
          <Link to="/inbox"><Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl"><MessageSquare className="h-3 w-3" />Message</Button></Link>
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl" onClick={() => toast.info('Role editor opened')}><Settings className="h-3 w-3" />Edit Role</Button>
          {selectedMember.status === 'active' && <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl text-destructive" onClick={() => toast.info('Suspend flow started')}><Shield className="h-3 w-3" />Suspend Seat</Button>}
        </div>
      </SectionCard>
    </div>
  ) : (
    <div className="space-y-3">
      <SectionCard title="Org Health" icon={<Activity className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[
            { l: 'Active Members', v: `${MEMBERS.filter(m => m.status === 'active').length}/${MEMBERS.length}`, ok: true },
            { l: 'Open Requisitions', v: String(REQUISITIONS.filter(r => r.status === 'open' || r.status === 'interviewing').length), ok: true },
            { l: 'Pending Approvals', v: String(APPROVALS.filter(a => a.status === 'pending').length), ok: APPROVALS.filter(a => a.status === 'pending').length <= 3 },
            { l: 'Escalated Items', v: String(APPROVALS.filter(a => a.status === 'escalated').length), ok: APPROVALS.filter(a => a.status === 'escalated').length === 0 },
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
            { text: 'Marketing campaign — escalated approval', severity: 'caution' as const },
            { text: 'Robert Liu — account suspended', severity: 'blocked' as const },
            { text: '2 procurement requests awaiting review', severity: 'caution' as const },
            { text: 'Seat limit at 80% — plan upgrade soon', severity: 'caution' as const },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-[8px] cursor-pointer hover:bg-muted/20 rounded-lg p-1" onClick={() => openDetail('alert', a.text, 'Action needed')}>
              <StatusBadge status={a.severity} label="" /><span className="flex-1">{a.text}</span><ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Billing & Seats" icon={<CreditCard className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="font-bold">Enterprise</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Seats Used</span><span>{MEMBERS.length} / 10</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Monthly Spend</span><span className="font-bold">$142,300</span></div>
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
          { text: 'Senior Engineer offer sent — $185K', time: '3 hrs ago', icon: Send },
          { text: 'AWS procurement approved — $8,200/mo', time: '5 hrs ago', icon: CheckCircle2 },
          { text: 'New requisition: DevOps Engineer', time: '1 day ago', icon: Plus },
          { text: 'Q3 marketing campaign escalated', time: '2 days ago', icon: ArrowUpRight },
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
      <div className="flex items-center gap-1 mb-3 border-b pb-2 overflow-x-auto">
        {([
          { key: 'overview' as const, label: 'Overview', icon: BarChart3 },
          { key: 'team' as const, label: 'Team Ops', icon: Users },
          { key: 'hiring' as const, label: 'Hiring', icon: UserCheck },
          { key: 'procurement' as const, label: 'Procurement', icon: ShoppingCart },
          { key: 'budget' as const, label: 'Budget', icon: DollarSign },
          { key: 'ads' as const, label: 'Ads', icon: Megaphone },
          { key: 'connect' as const, label: 'Connect', icon: Link2 },
          { key: 'approvals' as const, label: 'Approvals', icon: ListChecks },
        ]).map(w => (
          <button key={w.key} onClick={() => { setTab(w.key); setSelectedMember(null); }} className={cn(
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
            <KPICard label="Team Size" value={String(MEMBERS.length)} change={`${MEMBERS.filter(m => m.status === 'active').length} active`} />
            <KPICard label="Open Roles" value={String(REQUISITIONS.filter(r => r.status !== 'filled' && r.status !== 'closed').length)} change="+2 this month" trend="up" />
            <KPICard label="Monthly Spend" value="$142,300" change="+5%" trend="up" />
            <KPICard label="Pending Approvals" value={String(APPROVALS.filter(a => a.status === 'pending' || a.status === 'escalated').length)} change="Action needed" />
          </KPIBand>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <SectionCard title="Hiring Pipeline" icon={<UserCheck className="h-3.5 w-3.5 text-accent" />} action={<button onClick={() => setTab('hiring')} className="text-[8px] text-accent hover:underline">All</button>} className="!rounded-2xl">
              <div className="space-y-1.5">
                {REQUISITIONS.filter(r => r.status !== 'filled' && r.status !== 'closed').map(r => {
                  const s = STATUS_MAP[r.status];
                  return (
                    <div key={r.id} className="rounded-2xl border p-2.5 hover:shadow-sm transition-all cursor-pointer" onClick={() => openDetail('requisition', r.title, `${r.dept} · ${r.candidates} candidates · ${r.daysOpen}d open`)}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{r.title}</span><StatusBadge status={s.badge} label={s.label} /></div>
                      </div>
                      <div className="flex gap-3 text-[8px] text-muted-foreground"><span>{r.dept}</span><span>{r.candidates} candidates</span><span>{r.daysOpen}d open</span></div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Procurement" icon={<ShoppingCart className="h-3.5 w-3.5 text-accent" />} action={<button onClick={() => setTab('procurement')} className="text-[8px] text-accent hover:underline">All</button>} className="!rounded-2xl">
              <div className="space-y-1.5">
                {PROC_ITEMS.map(p => {
                  const s = STATUS_MAP[p.status];
                  return (
                    <div key={p.id} className="rounded-2xl border p-2.5 hover:shadow-sm transition-all cursor-pointer" onClick={() => openDetail('procurement', p.vendor, `${p.type} · ${p.amount}`)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{p.vendor}</span><StatusBadge status={s.badge} label={s.label} /></div>
                        <span className="text-[9px] font-bold">{p.amount}</span>
                      </div>
                      <div className="text-[8px] text-muted-foreground mt-0.5">{p.type} · Renewal: {p.renewal}</div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Pending Approvals" icon={<ListChecks className="h-3.5 w-3.5 text-accent" />} action={<button onClick={() => setTab('approvals')} className="text-[8px] text-accent hover:underline">All</button>} className="!rounded-2xl">
            <div className="space-y-1.5">
              {APPROVALS.filter(a => a.status === 'pending' || a.status === 'escalated').map(a => {
                const s = STATUS_MAP[a.status];
                return (
                  <div key={a.id} className="flex items-center justify-between rounded-2xl border p-2.5 hover:shadow-sm cursor-pointer" onClick={() => openDetail('approval', a.title, `${a.requester} · ${a.type}`)}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <StatusBadge status={s.badge} label={s.label} />
                      <div className="min-w-0"><div className="text-[10px] font-semibold truncate">{a.title}</div><div className="text-[8px] text-muted-foreground">{a.requester} · {a.type} · {a.submitted}</div></div>
                    </div>
                    {a.amount && <span className="text-[9px] font-bold shrink-0">{a.amount}</span>}
                    <div className="flex gap-1 ml-2 shrink-0">
                      <Button size="sm" className="h-6 text-[8px] rounded-lg px-2" onClick={e => { e.stopPropagation(); toast.success(`${a.title} approved`); }}><CheckCircle2 className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg px-2 text-destructive" onClick={e => { e.stopPropagation(); toast.info('Rejection flow'); }}>✕</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ TEAM OPS ═══ */}
      {tab === 'team' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Members" value={String(MEMBERS.length)} />
            <KPICard label="Active" value={String(MEMBERS.filter(m => m.status === 'active').length)} />
            <KPICard label="On Leave" value={String(MEMBERS.filter(m => m.status === 'on-leave').length)} />
            <KPICard label="Departments" value={String(new Set(MEMBERS.map(m => m.dept)).size)} />
          </KPIBand>
          <div className="space-y-1.5">
            {MEMBERS.map(m => {
              const s = STATUS_MAP[m.status];
              return (
                <div key={m.id} onClick={() => setSelectedMember(m)} className={cn('rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer', selectedMember?.id === m.id && 'ring-1 ring-accent')}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8"><AvatarFallback className="text-[8px] bg-accent/10 text-accent">{m.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{m.name}</span><StatusBadge status={s.badge} label={s.label} /></div>
                      <div className="text-[8px] text-muted-foreground">{m.role} · {m.dept} · {m.lastActive}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg" onClick={e => { e.stopPropagation(); toast.info('Role editor'); }}><Settings className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg" onClick={e => { e.stopPropagation(); openDetail('member', m.name, m.role); }}><MoreHorizontal className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => setInviteDrawer(true)}><UserPlus className="h-3 w-3" />Invite Member</Button>
            <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Department management')}><Layers className="h-3 w-3" />Manage Departments</Button>
          </div>
        </div>
      )}

      {/* ═══ HIRING ═══ */}
      {tab === 'hiring' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Open Roles" value={String(REQUISITIONS.filter(r => r.status === 'open').length)} />
            <KPICard label="Interviewing" value={String(REQUISITIONS.filter(r => r.status === 'interviewing').length)} />
            <KPICard label="Offers Out" value={String(REQUISITIONS.filter(r => r.status === 'offer').length)} />
            <KPICard label="Avg Time-to-Fill" value="28d" trend="down" />
          </KPIBand>
          <div className="space-y-1.5">
            {REQUISITIONS.map(r => {
              const s = STATUS_MAP[r.status];
              return (
                <div key={r.id} className="rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => openDetail('requisition', r.title, `${r.dept} · ${r.candidates} candidates`)}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2"><span className="text-[11px] font-semibold">{r.title}</span><StatusBadge status={s.badge} label={s.label} /></div>
                    <span className="text-[9px] text-muted-foreground">{r.daysOpen}d open</span>
                  </div>
                  <div className="flex gap-3 text-[8px]">
                    <span className="text-muted-foreground">{r.dept}</span>
                    <span>{r.candidates} candidates</span>
                    {r.status === 'interviewing' && <span className="text-accent font-medium">Active interviews</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => setReqDrawer(true)}><Plus className="h-3 w-3" />New Requisition</Button>
        </div>
      )}

      {/* ═══ PROCUREMENT ═══ */}
      {tab === 'procurement' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Vendors" value={String(PROC_ITEMS.filter(p => p.status === 'active').length)} />
            <KPICard label="Pending Approvals" value={String(PROC_ITEMS.filter(p => p.status === 'pending').length)} />
            <KPICard label="Monthly Commitments" value="$24,100" />
            <KPICard label="Upcoming Renewals" value="3" change="Next 90d" />
          </KPIBand>
          <div className="space-y-1.5">
            {PROC_ITEMS.map(p => {
              const s = STATUS_MAP[p.status];
              return (
                <div key={p.id} className="rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => openDetail('procurement', p.vendor, `${p.type} · ${p.amount}`)}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2"><span className="text-[11px] font-semibold">{p.vendor}</span><StatusBadge status={s.badge} label={s.label} /></div>
                    <span className="text-[10px] font-bold">{p.amount}</span>
                  </div>
                  <div className="text-[8px] text-muted-foreground">{p.type} · Renewal: {p.renewal}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ BUDGET ═══ */}
      {tab === 'budget' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Budget" value="$1.8M" change="Annual" />
            <KPICard label="Spent YTD" value="$568K" change="31.5%" />
            <KPICard label="Remaining" value="$1.23M" />
            <KPICard label="Burn Rate" value="$142K/mo" trend="up" />
          </KPIBand>
          <SectionCard title="Budget by Department" icon={<PieChart className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5 text-[9px]">
              {[
                { dept: 'Engineering', budget: '$720K', spent: '$228K', pct: 32 },
                { dept: 'Marketing', budget: '$360K', spent: '$142K', pct: 39 },
                { dept: 'Design', budget: '$180K', spent: '$52K', pct: 29 },
                { dept: 'Product', budget: '$270K', spent: '$84K', pct: 31 },
                { dept: 'Operations', budget: '$270K', spent: '$62K', pct: 23 },
              ].map(d => (
                <div key={d.dept} className="flex items-center gap-2">
                  <span className="w-24 text-muted-foreground">{d.dept}</span>
                  <Progress value={d.pct} className="h-1.5 flex-1" />
                  <span className="font-bold w-16 text-right">{d.spent}</span>
                  <span className="text-muted-foreground w-16 text-right">/ {d.budget}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ ADS ═══ */}
      {tab === 'ads' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Campaigns" value="4" />
            <KPICard label="Ad Spend (30d)" value="$18,200" change="+12%" trend="up" />
            <KPICard label="Impressions" value="2.4M" trend="up" />
            <KPICard label="CTR" value="3.2%" />
          </KPIBand>
          <SectionCard title="Active Campaigns" icon={<Megaphone className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {[
                { name: 'Q2 Brand Awareness', budget: '$8,000', spent: '$5,200', status: 'live' },
                { name: 'Engineering Hiring', budget: '$4,000', spent: '$2,800', status: 'live' },
                { name: 'Product Launch', budget: '$6,000', spent: '$1,200', status: 'live' },
                { name: 'Q3 Marketing (pending)', budget: '$42,000', spent: '$0', status: 'pending' },
              ].map((c, i) => (
                <div key={i} className="rounded-2xl border p-2.5 hover:shadow-sm cursor-pointer" onClick={() => openDetail('campaign', c.name, `Budget: ${c.budget} · Spent: ${c.spent}`)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{c.name}</span><StatusBadge status={c.status === 'live' ? 'live' : 'pending'} label={c.status === 'live' ? 'Live' : 'Pending'} /></div>
                    <span className="text-[9px] font-bold">{c.spent} / {c.budget}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
          <Link to="/ads"><Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><Megaphone className="h-3 w-3" />Ads Manager</Button></Link>
        </div>
      )}

      {/* ═══ CONNECT ═══ */}
      {tab === 'connect' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Partner Companies" value="12" />
            <KPICard label="Shared Projects" value="5" />
            <KPICard label="Active Integrations" value="8" />
            <KPICard label="Pending Invites" value="2" />
          </KPIBand>
          <SectionCard title="Connected Partners" icon={<Link2 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {[
                { name: 'TechServe Solutions', type: 'Agency', projects: 3, status: 'active' },
                { name: 'CloudFirst Inc', type: 'Vendor', projects: 1, status: 'active' },
                { name: 'DataFlow Partners', type: 'Consulting', projects: 2, status: 'active' },
                { name: 'DesignCraft Studio', type: 'Agency', projects: 0, status: 'pending' },
              ].map((p, i) => (
                <div key={i} className="rounded-2xl border p-2.5 hover:shadow-sm cursor-pointer" onClick={() => openDetail('partner', p.name, `${p.type} · ${p.projects} shared projects`)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{p.name}</span><Badge variant="secondary" className="text-[7px]">{p.type}</Badge></div>
                    <StatusBadge status={p.status === 'active' ? 'healthy' : 'pending'} label={p.status === 'active' ? 'Active' : 'Pending'} />
                  </div>
                  <div className="text-[8px] text-muted-foreground mt-0.5">{p.projects} shared projects</div>
                </div>
              ))}
            </div>
          </SectionCard>
          <Link to="/enterprise-connect"><Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><ExternalLink className="h-3 w-3" />Enterprise Connect Hub</Button></Link>
        </div>
      )}

      {/* ═══ APPROVALS ═══ */}
      {tab === 'approvals' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Pending" value={String(APPROVALS.filter(a => a.status === 'pending').length)} />
            <KPICard label="Escalated" value={String(APPROVALS.filter(a => a.status === 'escalated').length)} change="Urgent" />
            <KPICard label="Approved (30d)" value={String(APPROVALS.filter(a => a.status === 'approved').length)} />
            <KPICard label="Avg Response" value="4.2 hrs" />
          </KPIBand>
          <div className="space-y-1.5">
            {APPROVALS.map(a => {
              const s = STATUS_MAP[a.status];
              return (
                <div key={a.id} className={cn('rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer', a.status === 'escalated' && 'border-[hsl(var(--state-caution))]/30')} onClick={() => openDetail('approval', a.title, `${a.requester} · ${a.type}`)}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2"><StatusBadge status={s.badge} label={s.label} /><span className="text-[11px] font-semibold">{a.title}</span></div>
                    {a.amount && <span className="text-[10px] font-bold">{a.amount}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[8px] text-muted-foreground">{a.requester} · {a.type} · {a.submitted}</div>
                    {(a.status === 'pending' || a.status === 'escalated') && (
                      <div className="flex gap-1">
                        <Button size="sm" className="h-6 text-[8px] rounded-lg px-2" onClick={e => { e.stopPropagation(); toast.success('Approved'); }}><CheckCircle2 className="h-3 w-3 mr-1" />Approve</Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg px-2 text-destructive" onClick={e => { e.stopPropagation(); toast.info('Rejection flow'); }}>Reject</Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        <div className="flex-1"><span className="text-[10px] font-semibold">Enterprise Dashboard</span><div className="text-[8px] text-muted-foreground">{MEMBERS.filter(m => m.status === 'active').length} active · {APPROVALS.filter(a => a.status === 'pending').length} pending</div></div>
        <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-4" onClick={() => setTab('approvals')}><ListChecks className="h-3.5 w-3.5" />Approvals</Button>
      </div>

      {/* Invite Drawer */}
      <Sheet open={inviteDrawer} onOpenChange={setInviteDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Invite Team Member</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Email</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="team@company.com" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Name</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="Full name" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Department</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>Engineering</option><option>Design</option><option>Product</option><option>Marketing</option><option>Finance</option><option>HR</option><option>Sales</option><option>Operations</option></select></div>
            <div><label className="text-[9px] font-medium mb-1 block">Role</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>Member</option><option>Team Lead</option><option>Admin</option><option>Viewer</option></select></div>
            <div className="rounded-xl border bg-muted/20 p-2 text-[8px] text-muted-foreground"><strong>Seats:</strong> {MEMBERS.length}/10 used. {10 - MEMBERS.length} available.</div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setInviteDrawer(false)}>Cancel</Button>
              <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setInviteDrawer(false); toast.success('Invitation sent!'); }}><Mail className="h-3 w-3" />Send Invite</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Requisition Drawer */}
      <Sheet open={reqDrawer} onOpenChange={setReqDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">New Hiring Requisition</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Job Title</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="e.g. Senior Full-Stack Engineer" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Department</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>Engineering</option><option>Design</option><option>Product</option><option>Marketing</option><option>Finance</option></select></div>
            <div><label className="text-[9px] font-medium mb-1 block">Salary Range</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="$120K - $180K" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Priority</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>High</option><option>Medium</option><option>Low</option></select></div>
            <div><label className="text-[9px] font-medium mb-1 block">Description</label><textarea className="w-full h-16 rounded-xl border bg-background px-2 py-1 text-[9px] resize-none" placeholder="Role description and requirements..." /></div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setReqDrawer(false)}>Cancel</Button>
              <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setReqDrawer(false); toast.success('Requisition submitted for approval'); }}><Plus className="h-3 w-3" />Submit</Button>
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

export default EnterpriseDashboardPage;
