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
  Users, Shield, UserPlus, Settings, Key, Clock, CheckCircle2,
  AlertTriangle, ChevronRight, Mail, MoreHorizontal, Activity,
  CreditCard, Eye, ExternalLink, MessageSquare, Search, Filter,
  UserX, ArrowRightLeft, History, Lock, Unlock, Building2,
  ChevronDown, X, RefreshCw, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRole } from '@/contexts/RoleContext';

type OrgTab = 'members' | 'seats' | 'roles' | 'permissions' | 'invites' | 'audit' | 'offboard' | 'transfer';

interface Member {
  id: string; name: string; email: string; role: 'owner' | 'admin' | 'lead' | 'member' | 'viewer' | 'billing';
  dept: string; status: 'active' | 'invited' | 'suspended' | 'deactivated'; lastActive: string; joinedAt: string;
  permissions: string[];
}

interface AuditEntry {
  id: string; actor: string; action: string; target: string; timestamp: string; scope: string;
}

const ROLES_DEF = [
  { key: 'owner', label: 'Owner', desc: 'Full access, billing, transfer', count: 1, color: 'text-amber-600' },
  { key: 'admin', label: 'Admin', desc: 'Manage members, roles, settings', count: 2, color: 'text-accent' },
  { key: 'lead', label: 'Team Lead', desc: 'Manage team, approve requests', count: 3, color: 'text-blue-500' },
  { key: 'member', label: 'Member', desc: 'Standard workspace access', count: 8, color: 'text-foreground' },
  { key: 'viewer', label: 'Viewer', desc: 'Read-only access', count: 2, color: 'text-muted-foreground' },
  { key: 'billing', label: 'Billing', desc: 'Finance and billing only', count: 1, color: 'text-emerald-600' },
];

const PERMISSIONS_MATRIX = [
  { perm: 'Manage Members', owner: true, admin: true, lead: false, member: false, viewer: false, billing: false },
  { perm: 'Edit Roles', owner: true, admin: true, lead: false, member: false, viewer: false, billing: false },
  { perm: 'Billing Access', owner: true, admin: false, lead: false, member: false, viewer: false, billing: true },
  { perm: 'Create Projects', owner: true, admin: true, lead: true, member: true, viewer: false, billing: false },
  { perm: 'Approve Requests', owner: true, admin: true, lead: true, member: false, viewer: false, billing: false },
  { perm: 'View Analytics', owner: true, admin: true, lead: true, member: true, viewer: true, billing: false },
  { perm: 'Export Data', owner: true, admin: true, lead: true, member: false, viewer: false, billing: false },
  { perm: 'Transfer Ownership', owner: true, admin: false, lead: false, member: false, viewer: false, billing: false },
];

const MEMBERS: Member[] = [
  { id: 'm1', name: 'Olivia Martinez', email: 'olivia@acme.co', role: 'owner', dept: 'Executive', status: 'active', lastActive: 'Now', joinedAt: 'Jan 2023', permissions: ['all'] },
  { id: 'm2', name: 'Liam Chen', email: 'liam@acme.co', role: 'admin', dept: 'Engineering', status: 'active', lastActive: '5 min ago', joinedAt: 'Mar 2023', permissions: ['manage_members', 'edit_roles', 'create_projects'] },
  { id: 'm3', name: 'Sophia Williams', email: 'sophia@acme.co', role: 'admin', dept: 'Operations', status: 'active', lastActive: '1 hr ago', joinedAt: 'Apr 2023', permissions: ['manage_members', 'edit_roles'] },
  { id: 'm4', name: 'Noah Patel', email: 'noah@acme.co', role: 'lead', dept: 'Design', status: 'active', lastActive: '30 min ago', joinedAt: 'Jun 2023', permissions: ['create_projects', 'approve_requests'] },
  { id: 'm5', name: 'Emma Johnson', email: 'emma@acme.co', role: 'lead', dept: 'Product', status: 'active', lastActive: '2 hrs ago', joinedAt: 'Jul 2023', permissions: ['create_projects', 'approve_requests'] },
  { id: 'm6', name: 'Aiden Kim', email: 'aiden@acme.co', role: 'lead', dept: 'Engineering', status: 'active', lastActive: '15 min ago', joinedAt: 'Aug 2023', permissions: ['create_projects'] },
  { id: 'm7', name: 'Isabella Brown', email: 'isabella@acme.co', role: 'member', dept: 'Marketing', status: 'active', lastActive: '1 day ago', joinedAt: 'Sep 2023', permissions: ['create_projects', 'view_analytics'] },
  { id: 'm8', name: 'Lucas Garcia', email: 'lucas@acme.co', role: 'member', dept: 'Engineering', status: 'active', lastActive: '3 hrs ago', joinedAt: 'Oct 2023', permissions: ['create_projects'] },
  { id: 'm9', name: 'Mia Thompson', email: 'mia@acme.co', role: 'member', dept: 'Sales', status: 'active', lastActive: '2 days ago', joinedAt: 'Nov 2023', permissions: ['create_projects'] },
  { id: 'm10', name: 'Ethan Davis', email: 'ethan@acme.co', role: 'member', dept: 'Finance', status: 'suspended', lastActive: '2 weeks ago', joinedAt: 'Dec 2023', permissions: [] },
  { id: 'm11', name: 'Ava Wilson', email: 'ava@acme.co', role: 'viewer', dept: 'Legal', status: 'active', lastActive: '4 hrs ago', joinedAt: 'Jan 2024', permissions: ['view_analytics'] },
  { id: 'm12', name: 'James Lee', email: 'james@acme.co', role: 'viewer', dept: 'Advisory', status: 'active', lastActive: '1 week ago', joinedAt: 'Feb 2024', permissions: ['view_analytics'] },
  { id: 'm13', name: 'Charlotte Moore', email: 'charlotte@acme.co', role: 'billing', dept: 'Finance', status: 'active', lastActive: '6 hrs ago', joinedAt: 'Mar 2024', permissions: ['billing_access'] },
  { id: 'm14', name: 'Benjamin Taylor', email: 'ben@freelance.co', role: 'member', dept: 'Engineering', status: 'invited', lastActive: 'Never', joinedAt: 'Pending', permissions: [] },
  { id: 'm15', name: 'Harper Anderson', email: 'harper@agency.co', role: 'member', dept: 'Design', status: 'invited', lastActive: 'Never', joinedAt: 'Pending', permissions: [] },
  { id: 'm16', name: 'Daniel White', email: 'daniel@acme.co', role: 'member', dept: 'Engineering', status: 'deactivated', lastActive: '3 months ago', joinedAt: 'May 2023', permissions: [] },
];

const AUDIT_LOG: AuditEntry[] = [
  { id: 'au1', actor: 'Olivia Martinez', action: 'Suspended member', target: 'Ethan Davis', timestamp: '2 weeks ago', scope: 'Member Management' },
  { id: 'au2', actor: 'Liam Chen', action: 'Changed role to Lead', target: 'Aiden Kim', timestamp: '1 month ago', scope: 'Role Change' },
  { id: 'au3', actor: 'Sophia Williams', action: 'Sent invitation', target: 'Benjamin Taylor', timestamp: '3 days ago', scope: 'Invite' },
  { id: 'au4', actor: 'Olivia Martinez', action: 'Deactivated member', target: 'Daniel White', timestamp: '3 months ago', scope: 'Offboarding' },
  { id: 'au5', actor: 'Sophia Williams', action: 'Sent invitation', target: 'Harper Anderson', timestamp: '1 day ago', scope: 'Invite' },
  { id: 'au6', actor: 'Olivia Martinez', action: 'Updated billing plan', target: 'Organization', timestamp: '2 months ago', scope: 'Billing' },
  { id: 'au7', actor: 'Liam Chen', action: 'Added permission: Export Data', target: 'Noah Patel', timestamp: '3 weeks ago', scope: 'Permission' },
];

const ROLE_BADGE: Record<string, { badge: 'healthy' | 'caution' | 'pending' | 'blocked' | 'live'; label: string }> = {
  owner: { badge: 'live', label: 'Owner' }, admin: { badge: 'healthy', label: 'Admin' }, lead: { badge: 'caution', label: 'Lead' },
  member: { badge: 'pending', label: 'Member' }, viewer: { badge: 'pending', label: 'Viewer' }, billing: { badge: 'healthy', label: 'Billing' },
};
const STATUS_BADGE: Record<string, { badge: 'healthy' | 'caution' | 'pending' | 'blocked'; label: string }> = {
  active: { badge: 'healthy', label: 'Active' }, invited: { badge: 'pending', label: 'Invited' },
  suspended: { badge: 'caution', label: 'Suspended' }, deactivated: { badge: 'blocked', label: 'Deactivated' },
};

const OrgMembersSeatsPage: React.FC = () => {
  const { activeRole } = useRole();
  const [tab, setTab] = useState<OrgTab>('members');
  const [selected, setSelected] = useState<Member | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQ, setSearchQ] = useState('');
  const [inviteDrawer, setInviteDrawer] = useState(false);
  const [roleDrawer, setRoleDrawer] = useState(false);
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [detailItem, setDetailItem] = useState<{ type: string; title: string; detail: string } | null>(null);
  const [transferDrawer, setTransferDrawer] = useState(false);

  const openDetail = (type: string, title: string, detail: string) => { setDetailItem({ type, title, detail }); setDetailDrawer(true); };

  const totalSeats = 20;
  const usedSeats = MEMBERS.filter(m => m.status !== 'deactivated').length;
  const filtered = MEMBERS.filter(m => {
    if (filterRole !== 'all' && m.role !== filterRole) return false;
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    if (searchQ && !m.name.toLowerCase().includes(searchQ.toLowerCase()) && !m.email.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  const topStrip = (
    <>
      <Shield className="h-3.5 w-3.5 text-accent" />
      <span className="text-[11px] font-semibold">Organization · Members & Permissions</span>
      <Badge variant="secondary" className="text-[7px] capitalize">{activeRole}</Badge>
      <div className="flex-1" />
      <Badge variant="outline" className="text-[7px]">{usedSeats}/{totalSeats} seats</Badge>
      <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setInviteDrawer(true)}><UserPlus className="h-3 w-3" />Invite</Button>
      <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Buy seats flow')}><CreditCard className="h-3 w-3" />Buy Seats</Button>
    </>
  );

  const rightRail = selected ? (
    <div className="space-y-3">
      <SectionCard title="Member Detail" icon={<Users className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-9 w-9"><AvatarFallback className="text-[8px] bg-accent/10 text-accent">{selected.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
          <div><div className="text-[10px] font-semibold">{selected.name}</div><div className="text-[8px] text-muted-foreground">{selected.email}</div></div>
        </div>
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Role</span><StatusBadge status={ROLE_BADGE[selected.role].badge} label={ROLE_BADGE[selected.role].label} /></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span>{selected.dept}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={STATUS_BADGE[selected.status].badge} label={STATUS_BADGE[selected.status].label} /></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Last Active</span><span>{selected.lastActive}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Joined</span><span>{selected.joinedAt}</span></div>
        </div>
        {selected.permissions.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-[8px] text-muted-foreground mb-1">Permissions</div>
            <div className="flex flex-wrap gap-1">{selected.permissions.map(p => <Badge key={p} variant="secondary" className="text-[6px]">{p.replace('_', ' ')}</Badge>)}</div>
          </div>
        )}
      </SectionCard>
      <SectionCard title="Actions" className="!rounded-2xl">
        <div className="space-y-1">
          <Link to="/inbox"><Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl"><MessageSquare className="h-3 w-3" />Message</Button></Link>
          <Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl" onClick={() => { setRoleDrawer(true); }}><Key className="h-3 w-3" />Change Role</Button>
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl" onClick={() => openDetail('member', selected.name, selected.role)}><ExternalLink className="h-3 w-3" />Full Profile</Button>
          {selected.status === 'active' && <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl text-destructive" onClick={() => toast.info('Suspend flow')}><UserX className="h-3 w-3" />Suspend</Button>}
          {selected.status === 'suspended' && <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl text-[hsl(var(--state-healthy))]" onClick={() => toast.success('Reactivated')}><Unlock className="h-3 w-3" />Reactivate</Button>}
          {selected.status === 'invited' && <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl" onClick={() => toast.info('Resent')}><RefreshCw className="h-3 w-3" />Resend Invite</Button>}
        </div>
      </SectionCard>
    </div>
  ) : (
    <div className="space-y-3">
      <SectionCard title="Seat Overview" icon={<CreditCard className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="font-bold">Team</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Seats Used</span><span>{usedSeats} / {totalSeats}</span></div>
          <Progress value={(usedSeats / totalSeats) * 100} className="h-1.5" />
          <div className="flex justify-between"><span className="text-muted-foreground">Available</span><span className={cn('font-bold', totalSeats - usedSeats <= 2 ? 'text-[hsl(var(--state-caution))]' : 'text-[hsl(var(--state-healthy))]')}>{totalSeats - usedSeats}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Invited</span><span>{MEMBERS.filter(m => m.status === 'invited').length}</span></div>
        </div>
        <Button variant="outline" size="sm" className="h-6 text-[8px] w-full gap-1 rounded-xl mt-2" onClick={() => toast.info('Buy seats')}><CreditCard className="h-3 w-3" />Buy More Seats</Button>
      </SectionCard>
      <SectionCard title="Role Distribution" icon={<Key className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {ROLES_DEF.map(r => (
            <div key={r.key} className="flex items-center justify-between cursor-pointer hover:bg-muted/20 rounded-lg p-1" onClick={() => { setFilterRole(r.key); setTab('members'); }}>
              <span className={cn('font-medium', r.color)}>{r.label}</span>
              <span className="text-muted-foreground">{MEMBERS.filter(m => m.role === r.key).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Alerts" icon={<AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {[
            { text: 'Ethan Davis — suspended, review needed', severity: 'caution' as const },
            { text: '2 pending invitations expiring soon', severity: 'caution' as const },
            { text: `Seat usage at ${Math.round((usedSeats / totalSeats) * 100)}%`, severity: usedSeats / totalSeats > 0.8 ? 'caution' as const : 'healthy' as const },
            { text: 'Daniel White — offboarding incomplete', severity: 'blocked' as const },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-[8px] cursor-pointer hover:bg-muted/20 rounded-lg p-1" onClick={() => openDetail('alert', a.text, 'Action needed')}>
              <StatusBadge status={a.severity} label="" /><span className="flex-1">{a.text}</span><ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Recent Changes</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {AUDIT_LOG.slice(0, 4).map(a => (
          <div key={a.id} className="flex items-center gap-2 p-2 rounded-xl border bg-card text-[8px]">
            <Activity className="h-3 w-3 text-accent shrink-0" />
            <div><div className="font-medium">{a.actor}: {a.action}</div><div className="text-muted-foreground">{a.target} · {a.timestamp}</div></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      <div className="flex items-center gap-1 mb-3 border-b pb-2 overflow-x-auto">
        {([
          { key: 'members' as const, label: 'Members', icon: Users },
          { key: 'seats' as const, label: 'Seats & Plan', icon: CreditCard },
          { key: 'roles' as const, label: 'Roles', icon: Key },
          { key: 'permissions' as const, label: 'Permissions', icon: Shield },
          { key: 'invites' as const, label: 'Invitations', icon: Mail },
          { key: 'audit' as const, label: 'Audit Log', icon: History },
          { key: 'offboard' as const, label: 'Offboard', icon: UserX },
          { key: 'transfer' as const, label: 'Transfer', icon: ArrowRightLeft },
        ]).map(w => (
          <button key={w.key} onClick={() => { setTab(w.key); setSelected(null); }} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] transition-colors whitespace-nowrap shrink-0',
            tab === w.key ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
          )}><w.icon className="h-3 w-3" />{w.label}</button>
        ))}
      </div>

      {/* ═══ MEMBERS ═══ */}
      {tab === 'members' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Members" value={String(MEMBERS.length)} />
            <KPICard label="Active" value={String(MEMBERS.filter(m => m.status === 'active').length)} />
            <KPICard label="Invited" value={String(MEMBERS.filter(m => m.status === 'invited').length)} />
            <KPICard label="Departments" value={String(new Set(MEMBERS.map(m => m.dept)).size)} />
          </KPIBand>
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[160px] max-w-xs"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><input value={searchQ} onChange={e => setSearchQ(e.target.value)} className="w-full h-7 rounded-xl border bg-background pl-7 pr-2 text-[9px]" placeholder="Search members..." /></div>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px]"><option value="all">All Roles</option>{ROLES_DEF.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}</select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px]"><option value="all">All Status</option><option value="active">Active</option><option value="invited">Invited</option><option value="suspended">Suspended</option><option value="deactivated">Deactivated</option></select>
            {(filterRole !== 'all' || filterStatus !== 'all' || searchQ) && <Button variant="ghost" size="sm" className="h-7 text-[8px] gap-1 rounded-xl" onClick={() => { setFilterRole('all'); setFilterStatus('all'); setSearchQ(''); }}><X className="h-3 w-3" />Clear</Button>}
            <Button variant="ghost" size="sm" className="h-7 text-[8px] gap-1 rounded-xl ml-auto"><Download className="h-3 w-3" />Export</Button>
          </div>
          {/* Member list */}
          <div className="space-y-1.5">
            {filtered.map(m => {
              const rb = ROLE_BADGE[m.role]; const sb = STATUS_BADGE[m.status];
              return (
                <div key={m.id} onClick={() => setSelected(m)} className={cn('rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer', selected?.id === m.id && 'ring-1 ring-accent')}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8"><AvatarFallback className="text-[8px] bg-accent/10 text-accent">{m.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{m.name}</span><StatusBadge status={rb.badge} label={rb.label} /><StatusBadge status={sb.badge} label={sb.label} /></div>
                      <div className="text-[8px] text-muted-foreground">{m.email} · {m.dept} · Last: {m.lastActive}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg" onClick={e => { e.stopPropagation(); setSelected(m); setRoleDrawer(true); }}><Key className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg" onClick={e => { e.stopPropagation(); openDetail('member', m.name, `${m.role} · ${m.dept}`); }}><MoreHorizontal className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="text-center py-8 text-[10px] text-muted-foreground">No members match your filters.</div>}
          </div>
        </div>
      )}

      {/* ═══ SEATS & PLAN ═══ */}
      {tab === 'seats' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Seats" value={String(totalSeats)} />
            <KPICard label="Used" value={String(usedSeats)} />
            <KPICard label="Available" value={String(totalSeats - usedSeats)} change={totalSeats - usedSeats <= 3 ? 'Low' : ''} />
            <KPICard label="Utilization" value={`${Math.round((usedSeats / totalSeats) * 100)}%`} />
          </KPIBand>
          <SectionCard title="Seat Usage" icon={<CreditCard className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <Progress value={(usedSeats / totalSeats) * 100} className="h-2 mb-2" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px]">
              {[
                { l: 'Active', v: MEMBERS.filter(m => m.status === 'active').length, c: 'text-[hsl(var(--state-healthy))]' },
                { l: 'Invited', v: MEMBERS.filter(m => m.status === 'invited').length, c: 'text-accent' },
                { l: 'Suspended', v: MEMBERS.filter(m => m.status === 'suspended').length, c: 'text-[hsl(var(--state-caution))]' },
                { l: 'Deactivated', v: MEMBERS.filter(m => m.status === 'deactivated').length, c: 'text-[hsl(var(--state-blocked))]' },
              ].map(s => (
                <div key={s.l} className="rounded-xl border p-2 text-center"><div className={cn('text-lg font-bold', s.c)}>{s.v}</div><div className="text-muted-foreground">{s.l}</div></div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Plan Details" icon={<Building2 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5 text-[9px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Current Plan</span><span className="font-bold">Team — $49/seat/mo</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Monthly Cost</span><span className="font-bold">${usedSeats * 49}/mo</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Next Billing</span><span>May 1, 2025</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payment Method</span><span>Visa ····4242</span></div>
            </div>
            <div className="flex gap-2 mt-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-6 text-[8px] flex-1 rounded-xl" onClick={() => toast.info('Buy seats')}><CreditCard className="h-3 w-3 mr-1" />Buy Seats</Button>
              <Link to="/finance/billing" className="flex-1"><Button variant="outline" size="sm" className="h-6 text-[8px] w-full rounded-xl">Billing Settings</Button></Link>
            </div>
          </SectionCard>
          {usedSeats / totalSeats >= 0.75 && (
            <div className="rounded-2xl border border-[hsl(var(--state-caution))]/30 bg-[hsl(var(--state-caution))]/5 p-3 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[hsl(var(--state-caution))]" />
              <div className="flex-1"><div className="text-[10px] font-semibold">Seat Capacity Warning</div><div className="text-[8px] text-muted-foreground">You're at {Math.round((usedSeats / totalSeats) * 100)}% capacity. Purchase additional seats before reaching your limit.</div></div>
              <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Buy seats')}><CreditCard className="h-3 w-3" />Buy Seats</Button>
            </div>
          )}
        </div>
      )}

      {/* ═══ ROLES ═══ */}
      {tab === 'roles' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Defined Roles" value={String(ROLES_DEF.length)} />
            <KPICard label="Owners" value={String(MEMBERS.filter(m => m.role === 'owner').length)} />
            <KPICard label="Admins" value={String(MEMBERS.filter(m => m.role === 'admin').length)} />
            <KPICard label="Custom Roles" value="0" change="Coming soon" />
          </KPIBand>
          <div className="space-y-1.5">
            {ROLES_DEF.map(r => {
              const members = MEMBERS.filter(m => m.role === r.key);
              return (
                <div key={r.key} className="rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><span className={cn('text-[11px] font-semibold', r.color)}>{r.label}</span><Badge variant="secondary" className="text-[7px]">{members.length} members</Badge></div>
                    <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-1 rounded-lg" onClick={() => openDetail('role', r.label, r.desc)}><Settings className="h-3 w-3" />Configure</Button>
                  </div>
                  <div className="text-[8px] text-muted-foreground mb-2">{r.desc}</div>
                  {members.length > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-2">{members.slice(0, 5).map(m => <Avatar key={m.id} className="h-6 w-6 border-2 border-background"><AvatarFallback className="text-[6px] bg-accent/10 text-accent">{m.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>)}</div>
                      {members.length > 5 && <span className="text-[7px] text-muted-foreground ml-1">+{members.length - 5}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ PERMISSIONS ═══ */}
      {tab === 'permissions' && (
        <div className="space-y-3">
          <SectionCard title="Permission Matrix" icon={<Shield className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-[9px]">
                <thead><tr className="border-b">
                  <th className="text-left py-1.5 pr-4 font-medium text-muted-foreground">Permission</th>
                  {ROLES_DEF.map(r => <th key={r.key} className={cn('text-center py-1.5 px-2 font-medium', r.color)}>{r.label}</th>)}
                </tr></thead>
                <tbody>
                  {PERMISSIONS_MATRIX.map(p => (
                    <tr key={p.perm} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="py-1.5 pr-4 font-medium">{p.perm}</td>
                      {(['owner', 'admin', 'lead', 'member', 'viewer', 'billing'] as const).map(r => (
                        <td key={r} className="text-center py-1.5 px-2">
                          {p[r] ? <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))] mx-auto" /> : <Lock className="h-3 w-3 text-muted-foreground/40 mx-auto" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            <div className="text-[9px]"><span className="font-semibold">Custom permissions</span> <span className="text-muted-foreground">coming soon. Contact support for granular access controls.</span></div>
          </div>
        </div>
      )}

      {/* ═══ INVITATIONS ═══ */}
      {tab === 'invites' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Pending" value={String(MEMBERS.filter(m => m.status === 'invited').length)} />
            <KPICard label="Sent This Month" value="4" />
            <KPICard label="Accepted Rate" value="78%" trend="up" />
            <KPICard label="Expired" value="1" />
          </KPIBand>
          <div className="space-y-1.5">
            {MEMBERS.filter(m => m.status === 'invited').map(m => (
              <div key={m.id} className="rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Avatar className="h-7 w-7"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{m.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar><div><div className="text-[10px] font-semibold">{m.name}</div><div className="text-[8px] text-muted-foreground">{m.email} · {m.dept} · {m.role}</div></div></div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-6 text-[8px] gap-1 rounded-lg" onClick={() => toast.success('Resent')}><RefreshCw className="h-3 w-3" />Resend</Button>
                    <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-1 rounded-lg text-destructive" onClick={() => toast.info('Revoked')}><X className="h-3 w-3" />Revoke</Button>
                  </div>
                </div>
              </div>
            ))}
            {MEMBERS.filter(m => m.status === 'invited').length === 0 && <div className="text-center py-8 text-[10px] text-muted-foreground">No pending invitations.</div>}
          </div>
          <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => setInviteDrawer(true)}><UserPlus className="h-3 w-3" />Send New Invite</Button>
        </div>
      )}

      {/* ═══ AUDIT LOG ═══ */}
      {tab === 'audit' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Events" value={String(AUDIT_LOG.length)} />
            <KPICard label="This Week" value="3" />
            <KPICard label="Role Changes" value={String(AUDIT_LOG.filter(a => a.scope === 'Role Change').length)} />
            <KPICard label="Offboardings" value={String(AUDIT_LOG.filter(a => a.scope === 'Offboarding').length)} />
          </KPIBand>
          <div className="space-y-1.5">
            {AUDIT_LOG.map(a => (
              <div key={a.id} className="rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => openDetail('audit', a.action, `${a.actor} → ${a.target} · ${a.scope}`)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-accent" /><span className="text-[10px] font-semibold">{a.action}</span><Badge variant="secondary" className="text-[6px]">{a.scope}</Badge></div>
                  <span className="text-[8px] text-muted-foreground">{a.timestamp}</span>
                </div>
                <div className="text-[8px] text-muted-foreground mt-0.5">By {a.actor} → {a.target}</div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><Download className="h-3 w-3" />Export Audit Log</Button>
        </div>
      )}

      {/* ═══ OFFBOARD ═══ */}
      {tab === 'offboard' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Deactivated" value={String(MEMBERS.filter(m => m.status === 'deactivated').length)} />
            <KPICard label="Suspended" value={String(MEMBERS.filter(m => m.status === 'suspended').length)} change="Review needed" />
            <KPICard label="Pending Offboard" value="1" />
            <KPICard label="Completed" value="1" />
          </KPIBand>
          <div className="space-y-1.5">
            {MEMBERS.filter(m => m.status === 'suspended' || m.status === 'deactivated').map(m => {
              const sb = STATUS_BADGE[m.status];
              return (
                <div key={m.id} className={cn('rounded-2xl border bg-card px-4 py-3', m.status === 'suspended' && 'border-[hsl(var(--state-caution))]/30')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Avatar className="h-7 w-7"><AvatarFallback className="text-[7px] bg-muted text-muted-foreground">{m.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar><div><div className="text-[10px] font-semibold">{m.name}</div><div className="text-[8px] text-muted-foreground">{m.email} · {m.dept} · Last active: {m.lastActive}</div></div></div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={sb.badge} label={sb.label} />
                      {m.status === 'suspended' && <Button size="sm" className="h-6 text-[8px] gap-1 rounded-lg" onClick={() => toast.success('Reactivated')}><Unlock className="h-3 w-3" />Reactivate</Button>}
                      {m.status === 'suspended' && <Button variant="destructive" size="sm" className="h-6 text-[8px] gap-1 rounded-lg" onClick={() => toast.info('Deactivation flow')}><UserX className="h-3 w-3" />Deactivate</Button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ TRANSFER ═══ */}
      {tab === 'transfer' && (
        <div className="space-y-3">
          <SectionCard title="Ownership Transfer" icon={<ArrowRightLeft className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="rounded-2xl border border-[hsl(var(--state-caution))]/30 bg-[hsl(var(--state-caution))]/5 p-3 mb-3">
              <div className="flex items-center gap-2 mb-1"><AlertTriangle className="h-4 w-4 text-[hsl(var(--state-caution))]" /><span className="text-[10px] font-semibold">Irreversible Action</span></div>
              <p className="text-[8px] text-muted-foreground">Transferring ownership is permanent. The new owner will gain full control including billing, member management, and data access. You will be downgraded to Admin.</p>
            </div>
            <div className="space-y-2 text-[9px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Current Owner</span><span className="font-bold">Olivia Martinez</span></div>
              <div><label className="text-[9px] font-medium mb-1 block">Transfer To</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]">{MEMBERS.filter(m => m.status === 'active' && m.role !== 'owner').map(m => <option key={m.id}>{m.name} ({m.role})</option>)}</select></div>
              <div><label className="text-[9px] font-medium mb-1 block">Confirm by typing "TRANSFER"</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="Type TRANSFER to confirm" /></div>
            </div>
            <Button variant="destructive" size="sm" className="h-7 text-[9px] gap-1 rounded-xl mt-3 w-full" onClick={() => toast.info('Transfer requires confirmation')}><ArrowRightLeft className="h-3 w-3" />Transfer Ownership</Button>
          </SectionCard>
        </div>
      )}

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        <div className="flex-1"><span className="text-[10px] font-semibold">Org Members</span><div className="text-[8px] text-muted-foreground">{usedSeats}/{totalSeats} seats · {MEMBERS.filter(m => m.status === 'active').length} active</div></div>
        <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-4" onClick={() => setInviteDrawer(true)}><UserPlus className="h-3.5 w-3.5" />Invite</Button>
      </div>

      {/* Invite Drawer */}
      <Sheet open={inviteDrawer} onOpenChange={setInviteDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Invite Member</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Email</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="member@company.com" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Name</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="Full name" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Role</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]">{ROLES_DEF.filter(r => r.key !== 'owner').map(r => <option key={r.key}>{r.label}</option>)}</select></div>
            <div><label className="text-[9px] font-medium mb-1 block">Department</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="e.g. Engineering" /></div>
            <div className="rounded-xl border bg-muted/20 p-2 text-[8px] text-muted-foreground"><strong>Seats:</strong> {usedSeats}/{totalSeats} used. {totalSeats - usedSeats > 0 ? `${totalSeats - usedSeats} available.` : <span className="text-[hsl(var(--state-blocked))] font-semibold">No seats available — purchase more to invite.</span>}</div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setInviteDrawer(false)}>Cancel</Button>
              <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" disabled={totalSeats - usedSeats <= 0} onClick={() => { setInviteDrawer(false); toast.success('Invitation sent!'); }}><Mail className="h-3 w-3" />Send Invite</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Role Change Drawer */}
      <Sheet open={roleDrawer} onOpenChange={setRoleDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Change Role</SheetTitle></SheetHeader>
          {selected && (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2"><Avatar className="h-8 w-8"><AvatarFallback className="text-[8px] bg-accent/10 text-accent">{selected.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar><div><div className="text-[10px] font-semibold">{selected.name}</div><div className="text-[8px] text-muted-foreground">Current: {selected.role}</div></div></div>
              <div><label className="text-[9px] font-medium mb-1 block">New Role</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]">{ROLES_DEF.filter(r => r.key !== 'owner').map(r => <option key={r.key} selected={r.key === selected.role}>{r.label}</option>)}</select></div>
              <div className="rounded-xl border bg-muted/20 p-2 text-[8px] text-muted-foreground">Role changes take effect immediately. The member will be notified via email.</div>
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setRoleDrawer(false)}>Cancel</Button>
                <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setRoleDrawer(false); toast.success('Role updated'); }}><CheckCircle2 className="h-3 w-3" />Save Role</Button>
              </div>
            </div>
          )}
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

export default OrgMembersSeatsPage;
