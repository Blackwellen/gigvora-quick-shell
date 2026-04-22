import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Building2, Users, Shield, Plus, Search, Clock, Settings,
  UserPlus, UserMinus, Edit, Eye, Lock, CheckCircle2,
  AlertTriangle, Mail, MoreHorizontal, CreditCard,
  BarChart3, Briefcase, Star, Globe, MapPin,
  Crown, Key, FileText, Download, Flag, RefreshCw,
  Layers, TrendingUp, DollarSign, Activity, Zap,
  MessageSquare, Calendar, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════ */
type OrgType = 'company' | 'agency';
type MemberRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer' | 'suspended';
type MemberStatus = 'active' | 'invited' | 'suspended' | 'deactivated';

interface OrgMember {
  id: string; name: string; email: string; avatar: string;
  role: MemberRole; status: MemberStatus; department?: string;
  joined: string; lastActive: string; projects: number;
}

const ROLE_META: Record<MemberRole, { badge: 'premium' | 'live' | 'healthy' | 'review' | 'caution' | 'blocked'; label: string; icon: typeof Crown }> = {
  owner: { badge: 'premium', label: 'Owner', icon: Crown },
  admin: { badge: 'live', label: 'Admin', icon: Key },
  manager: { badge: 'healthy', label: 'Manager', icon: Shield },
  member: { badge: 'review', label: 'Member', icon: Users },
  viewer: { badge: 'caution', label: 'Viewer', icon: Eye },
  suspended: { badge: 'blocked', label: 'Suspended', icon: Lock },
};

const STATUS_META: Record<MemberStatus, { badge: 'healthy' | 'caution' | 'blocked' | 'degraded'; label: string }> = {
  active: { badge: 'healthy', label: 'Active' },
  invited: { badge: 'caution', label: 'Invited' },
  suspended: { badge: 'blocked', label: 'Suspended' },
  deactivated: { badge: 'degraded', label: 'Deactivated' },
};

const MEMBERS: OrgMember[] = [
  { id: 'm1', name: 'Sarah Chen', email: 'sarah@vortex.tech', avatar: 'SC', role: 'owner', status: 'active', department: 'Executive', joined: 'Jan 2018', lastActive: '2 min ago', projects: 24 },
  { id: 'm2', name: 'Marcus Webb', email: 'marcus@vortex.tech', avatar: 'MW', role: 'admin', status: 'active', department: 'Engineering', joined: 'Mar 2018', lastActive: '15 min ago', projects: 18 },
  { id: 'm3', name: 'Priya Sharma', email: 'priya@vortex.tech', avatar: 'PS', role: 'admin', status: 'active', department: 'Engineering', joined: 'Jun 2019', lastActive: '1 hr ago', projects: 14 },
  { id: 'm4', name: 'David Kim', email: 'david@vortex.tech', avatar: 'DK', role: 'manager', status: 'active', department: 'Design', joined: 'Sep 2019', lastActive: '3 hrs ago', projects: 11 },
  { id: 'm5', name: 'Elena Rodriguez', email: 'elena@vortex.tech', avatar: 'ER', role: 'manager', status: 'active', department: 'Talent', joined: 'Jan 2020', lastActive: '30 min ago', projects: 8 },
  { id: 'm6', name: 'Jordan Blake', email: 'jordan@vortex.tech', avatar: 'JB', role: 'member', status: 'active', department: 'Engineering', joined: 'Apr 2021', lastActive: '5 min ago', projects: 9 },
  { id: 'm7', name: 'Alex Morgan', email: 'alex@vortex.tech', avatar: 'AM', role: 'member', status: 'active', department: 'Product', joined: 'Jul 2021', lastActive: '2 hrs ago', projects: 7 },
  { id: 'm8', name: 'Chris Walker', email: 'chris@vortex.tech', avatar: 'CW', role: 'member', status: 'invited', department: 'Engineering', joined: 'Pending', lastActive: 'Never', projects: 0 },
  { id: 'm9', name: 'Dana Kim', email: 'dana@vortex.tech', avatar: 'DK2', role: 'viewer', status: 'active', department: 'Marketing', joined: 'Oct 2022', lastActive: '1 day ago', projects: 3 },
  { id: 'm10', name: 'Liam Foster', email: 'liam@vortex.tech', avatar: 'LF', role: 'member', status: 'suspended', department: 'Engineering', joined: 'Feb 2022', lastActive: '2 weeks ago', projects: 5 },
];

const PERMISSIONS = [
  { scope: 'Projects', owner: true, admin: true, manager: true, member: 'own', viewer: 'read' },
  { scope: 'Members', owner: true, admin: true, manager: 'read', member: false, viewer: false },
  { scope: 'Billing', owner: true, admin: true, manager: false, member: false, viewer: false },
  { scope: 'Settings', owner: true, admin: true, manager: false, member: false, viewer: false },
  { scope: 'Analytics', owner: true, admin: true, manager: true, member: 'own', viewer: 'read' },
  { scope: 'Contracts', owner: true, admin: true, manager: true, member: 'own', viewer: false },
  { scope: 'Finance', owner: true, admin: 'read', manager: false, member: false, viewer: false },
  { scope: 'Trust & Safety', owner: true, admin: true, manager: 'read', member: false, viewer: false },
];

/* ═══════════════════════════════════════════════════════════ */
const OrgWorkspacePage: React.FC = () => {
  const [orgType, setOrgType] = useState<OrgType>('company');
  const [tab, setTab] = useState('overview');
  const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);
  const [inviteDrawer, setInviteDrawer] = useState(false);
  const [editRoleDrawer, setEditRoleDrawer] = useState(false);
  const [roleFilter, setRoleFilter] = useState<MemberRole | 'all'>('all');
  const [searchQ, setSearchQ] = useState('');

  const filtered = MEMBERS.filter(m => {
    if (roleFilter !== 'all' && m.role !== roleFilter) return false;
    if (searchQ && !m.name.toLowerCase().includes(searchQ.toLowerCase()) && !m.email.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  const roleCounts: Record<string, number> = { all: MEMBERS.length };
  for (const m of MEMBERS) roleCounts[m.role] = (roleCounts[m.role] || 0) + 1;

  const activeSeats = MEMBERS.filter(m => m.status === 'active').length;
  const totalSeats = 15;
  const seatUsage = Math.round((activeSeats / totalSeats) * 100);

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <Building2 className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Org Workspace</span>
      <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
        {(['company', 'agency'] as const).map(t => (
          <button key={t} onClick={() => setOrgType(t)} className={cn('px-2 py-0.5 rounded text-[9px] font-medium transition-all capitalize', orgType === t ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{t}</button>
        ))}
      </div>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input className="h-7 w-44 rounded-md border bg-background pl-7 pr-3 text-[10px] focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Search members..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
      </div>
      <Button size="sm" className="h-7 text-[10px] gap-1" onClick={() => setInviteDrawer(true)}><UserPlus className="h-3 w-3" />Invite Member</Button>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = selectedMember ? (
    <div className="space-y-3">
      <SectionCard title="Member Detail" icon={<Users className="h-3.5 w-3.5 text-accent" />}>
        <div className="text-center mb-2">
          <Avatar className="h-10 w-10 mx-auto mb-1"><AvatarFallback className="text-xs bg-accent/10 text-accent">{selectedMember.avatar}</AvatarFallback></Avatar>
          <div className="text-[11px] font-semibold">{selectedMember.name}</div>
          <div className="text-[8px] text-muted-foreground">{selectedMember.email}</div>
        </div>
        <div className="space-y-1.5 text-[9px]">
          {[
            { l: 'Role', v: <StatusBadge status={ROLE_META[selectedMember.role].badge} label={ROLE_META[selectedMember.role].label} /> },
            { l: 'Status', v: <StatusBadge status={STATUS_META[selectedMember.status].badge} label={STATUS_META[selectedMember.status].label} /> },
            { l: 'Department', v: selectedMember.department || '—' },
            { l: 'Joined', v: selectedMember.joined },
            { l: 'Last Active', v: selectedMember.lastActive },
            { l: 'Projects', v: selectedMember.projects },
          ].map(r => (
            <div key={r.l} className="flex justify-between items-center"><span className="text-muted-foreground">{r.l}</span><span className="font-medium">{typeof r.v === 'string' || typeof r.v === 'number' ? r.v : r.v}</span></div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Actions">
        <div className="space-y-1">
          {selectedMember.role !== 'owner' && (
            <>
              <Button size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => { setEditRoleDrawer(true); }}><Edit className="h-3 w-3" />Edit Role</Button>
              <Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1"><MessageSquare className="h-3 w-3" />Message</Button>
              {selectedMember.status === 'active' && (
                <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 text-[hsl(var(--state-caution))]" onClick={() => toast.info('Seat suspended')}><Lock className="h-3 w-3" />Suspend Seat</Button>
              )}
              {selectedMember.status === 'suspended' && (
                <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 text-[hsl(var(--state-healthy))]" onClick={() => toast.success('Seat reactivated')}><RefreshCw className="h-3 w-3" />Reactivate</Button>
              )}
              <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 text-destructive" onClick={() => toast.error('Member removed')}><UserMinus className="h-3 w-3" />Remove Member</Button>
            </>
          )}
          {selectedMember.role === 'owner' && (
            <div className="rounded-md bg-muted/30 p-2 text-[8px] text-muted-foreground text-center">Owner cannot be modified from this panel</div>
          )}
        </div>
      </SectionCard>
    </div>
  ) : (
    <div className="space-y-3">
      {/* Seat Summary */}
      <SectionCard title="Seat Summary" icon={<CreditCard className="h-3.5 w-3.5 text-accent" />}>
        <div className="text-center mb-2">
          <div className="text-2xl font-bold">{activeSeats}<span className="text-sm text-muted-foreground font-normal">/{totalSeats}</span></div>
          <div className="text-[8px] text-muted-foreground">seats used</div>
        </div>
        <Progress value={seatUsage} className="h-1.5 mb-1.5" />
        <div className="space-y-1 text-[8px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Active</span><span className="font-medium text-[hsl(var(--state-healthy))]">{activeSeats}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Invited</span><span className="font-medium text-[hsl(var(--state-caution))]">{MEMBERS.filter(m => m.status === 'invited').length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Suspended</span><span className="font-medium text-destructive">{MEMBERS.filter(m => m.status === 'suspended').length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Available</span><span className="font-medium">{totalSeats - activeSeats}</span></div>
        </div>
        {seatUsage >= 80 && (
          <div className="mt-2 rounded-md border border-[hsl(var(--state-caution))]/30 bg-[hsl(var(--state-caution))]/5 p-2 text-[8px]">
            <div className="flex items-center gap-1 text-[hsl(var(--state-caution))] font-medium"><AlertTriangle className="h-2.5 w-2.5" />Seats running low</div>
            <p className="text-muted-foreground mt-0.5">Upgrade plan for more seats</p>
          </div>
        )}
      </SectionCard>

      {/* Role Breakdown */}
      <SectionCard title="Role Breakdown" icon={<Shield className="h-3.5 w-3.5 text-accent" />}>
        <div className="space-y-1 text-[8px]">
          {(['owner', 'admin', 'manager', 'member', 'viewer', 'suspended'] as const).map(r => {
            const meta = ROLE_META[r];
            const count = roleCounts[r] || 0;
            return (
              <div key={r} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <meta.icon className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{meta.label}</span>
                </div>
                <span className="font-medium">{count}</span>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Quick Links */}
      <SectionCard title="Org Settings">
        <div className="space-y-1">
          {[
            { l: 'Billing & Plan', icon: CreditCard, href: '/finance' },
            { l: 'Security', icon: Shield, href: '/settings' },
            { l: 'Integrations', icon: Zap, href: '/settings' },
            { l: 'Audit Log', icon: FileText, href: '/trust' },
          ].map(a => (
            <Link key={a.l} to={a.href} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-accent/5 transition-colors text-[8px] font-medium">
              <a.icon className="h-3 w-3 text-accent" />{a.l}
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom: Audit Trail ── */
  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><Activity className="h-3.5 w-3.5 text-accent" />Recent Activity</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[
          { actor: 'Sarah Chen', action: 'invited Chris Walker', time: '2 hrs ago', type: 'invite' },
          { actor: 'Marcus Webb', action: 'changed Jordan Blake role to Member', time: '1 day ago', type: 'role' },
          { actor: 'Priya Sharma', action: 'suspended Liam Foster', time: '2 weeks ago', type: 'suspend' },
          { actor: 'Sarah Chen', action: 'updated billing plan to Enterprise', time: '1 month ago', type: 'billing' },
          { actor: 'David Kim', action: 'added Design department', time: '2 months ago', type: 'config' },
        ].map((e, i) => (
          <div key={i} className="shrink-0 rounded-lg border bg-card px-3 py-2 min-w-[220px]">
            <div className="text-[9px] font-medium">{e.actor}</div>
            <div className="text-[8px] text-muted-foreground">{e.action}</div>
            <div className="text-[7px] text-muted-foreground mt-0.5">{e.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      {/* KPI Band */}
      <KPIBand className="mb-3">
        <KPICard label="Members" value={MEMBERS.length} change={`${activeSeats} active`} trend="up" />
        <KPICard label="Seats Used" value={`${seatUsage}%`} change={`${totalSeats - activeSeats} available`} trend={seatUsage > 80 ? 'down' : 'up'} />
        <KPICard label="Active Projects" value="14" change="+3 this month" trend="up" />
        <KPICard label="Team Revenue" value="$28.4K" change="+$4.2K" trend="up" />
      </KPIBand>

      <Tabs value={tab} onValueChange={v => { setTab(v); setSelectedMember(null); }}>
        <TabsList className="h-8 mb-3 flex-wrap">
          {([['overview', 'Overview'], ['members', 'Members'], ['permissions', 'Permissions'], ['teams', 'Teams'], ['billing', 'Billing']] as const).map(([k, l]) => (
            <TabsTrigger key={k} value={k} className="text-[10px] h-6 px-2.5">{l}</TabsTrigger>
          ))}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="space-y-3">
            {/* Org Header */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center"><Building2 className="h-6 w-6 text-accent" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold">{orgType === 'company' ? 'Vortex Technologies' : 'Apex Digital Studio'}</h2>
                    <StatusBadge status="live" label={orgType === 'company' ? 'Enterprise' : 'Agency'} />
                    <Badge variant="secondary" className="text-[7px]"><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Verified</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-3">
                    <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />San Francisco, CA</span>
                    <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{MEMBERS.length} members</span>
                    <span className="flex items-center gap-0.5"><Briefcase className="h-3 w-3" />14 active projects</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Settings className="h-3 w-3" />Settings</Button>
              </div>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { l: 'Completion Rate', v: '94%', s: 'healthy' as const },
                { l: 'Avg Response', v: '< 1hr', s: 'healthy' as const },
                { l: 'Client Rating', v: '4.8★', s: 'premium' as const },
                { l: 'On-time', v: '96%', s: 'healthy' as const },
              ].map(m => (
                <div key={m.l} className="rounded-lg border bg-card p-3 text-center">
                  <div className={cn('text-sm font-bold', m.s === 'healthy' && 'text-[hsl(var(--state-healthy))]', m.s === 'premium' && 'text-accent')}>{m.v}</div>
                  <div className="text-[8px] text-muted-foreground">{m.l}</div>
                </div>
              ))}
            </div>

            {/* Recent Members */}
            <SectionCard title="Recent Members" icon={<Users className="h-3.5 w-3.5 text-accent" />} action={<button onClick={() => setTab('members')} className="text-[8px] text-accent hover:underline">View All</button>}>
              <div className="space-y-1">
                {MEMBERS.slice(0, 5).map(m => (
                  <div key={m.id} onClick={() => { setSelectedMember(m); setTab('members'); }} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/30 cursor-pointer transition-colors">
                    <Avatar className="h-6 w-6"><AvatarFallback className="text-[7px]">{m.avatar}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-medium truncate">{m.name}</div>
                      <div className="text-[7px] text-muted-foreground">{m.department}</div>
                    </div>
                    <StatusBadge status={ROLE_META[m.role].badge} label={ROLE_META[m.role].label} />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members">
          <div className="flex items-center gap-1 mb-3 flex-wrap">
            {(['all', 'owner', 'admin', 'manager', 'member', 'viewer', 'suspended'] as const).map(r => (
              <button key={r} onClick={() => { setRoleFilter(r); setSelectedMember(null); }} className={cn('px-2 py-0.5 rounded-md text-[9px] font-medium transition-colors capitalize', roleFilter === r ? 'bg-accent text-accent-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted')}>
                {r}{(roleCounts[r] || 0) > 0 && <span className="ml-1 text-[7px]">({roleCounts[r] || MEMBERS.length})</span>}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <div className="text-[11px] font-semibold">No members found</div>
              <div className="text-[9px] text-muted-foreground">Adjust filters or search</div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map(m => {
                const isSel = selectedMember?.id === m.id;
                const rm = ROLE_META[m.role];
                const sm = STATUS_META[m.status];
                return (
                  <div key={m.id} onClick={() => setSelectedMember(m)} className={cn('rounded-lg border bg-card px-4 py-3 cursor-pointer transition-all hover:shadow-sm', isSel && 'ring-1 ring-accent border-accent/30')}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback className={cn('text-[9px]', m.role === 'owner' && 'bg-accent/10 text-accent')}>{m.avatar}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-semibold truncate">{m.name}</span>
                          <StatusBadge status={rm.badge} label={rm.label} />
                          <StatusBadge status={sm.badge} label={sm.label} />
                        </div>
                        <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                          <span>{m.email}</span>
                          <span>·</span>
                          <span>{m.department}</span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{m.lastActive}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-medium">{m.projects} projects</div>
                        <div className="text-[7px] text-muted-foreground">Joined {m.joined}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Permissions */}
        <TabsContent value="permissions">
          <SectionCard title="Permission Matrix" icon={<Key className="h-3.5 w-3.5 text-accent" />} subtitle="What each role can access">
            <div className="overflow-x-auto">
              <table className="w-full text-[9px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1.5 pr-3 font-semibold text-muted-foreground">Scope</th>
                    {(['owner', 'admin', 'manager', 'member', 'viewer'] as const).map(r => (
                      <th key={r} className="text-center py-1.5 px-2 font-semibold">
                        <StatusBadge status={ROLE_META[r].badge} label={ROLE_META[r].label} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSIONS.map(p => (
                    <tr key={p.scope} className="border-b last:border-0">
                      <td className="py-1.5 pr-3 font-medium">{p.scope}</td>
                      {[p.owner, p.admin, p.manager, p.member, p.viewer].map((v, i) => (
                        <td key={i} className="text-center py-1.5 px-2">
                          {v === true && <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))] mx-auto" />}
                          {v === false && <span className="text-muted-foreground/30">—</span>}
                          {typeof v === 'string' && <Badge variant="secondary" className="text-[7px]">{v}</Badge>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <div className="mt-3 rounded-lg border border-accent/20 bg-accent/5 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-medium mb-1"><Shield className="h-3.5 w-3.5 text-accent" />Permission Enforcement</div>
            <p className="text-[8px] text-muted-foreground">Permissions are enforced at the API level. UI controls are hidden for unauthorized actions. Audit logs record all role changes and permission overrides.</p>
          </div>
        </TabsContent>

        {/* Teams */}
        <TabsContent value="teams">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { name: 'Engineering', lead: 'Priya Sharma', members: 4, projects: 8, status: 'active' as const },
              { name: 'Design', lead: 'David Kim', members: 2, projects: 5, status: 'active' as const },
              { name: 'Product', lead: 'Alex Morgan', members: 2, projects: 4, status: 'active' as const },
              { name: 'Marketing', lead: 'Dana Kim', members: 1, projects: 2, status: 'active' as const },
              { name: 'Talent', lead: 'Elena Rodriguez', members: 1, projects: 3, status: 'active' as const },
            ].map(t => (
              <div key={t.name} className="rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center"><Layers className="h-4 w-4 text-accent" /></div>
                    <div>
                      <div className="text-[11px] font-semibold">{t.name}</div>
                      <div className="text-[8px] text-muted-foreground">Led by {t.lead}</div>
                    </div>
                  </div>
                  <StatusBadge status="healthy" label="Active" />
                </div>
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{t.members} members</span>
                  <span className="flex items-center gap-0.5"><Briefcase className="h-2.5 w-2.5" />{t.projects} projects</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing">
          <div className="space-y-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-bold">Enterprise Plan</div>
                  <div className="text-[10px] text-muted-foreground">$299/mo · {totalSeats} seats included</div>
                </div>
                <StatusBadge status="healthy" label="Active" />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><div className="text-lg font-bold">$299</div><div className="text-[8px] text-muted-foreground">Monthly</div></div>
                <div><div className="text-lg font-bold">{activeSeats}/{totalSeats}</div><div className="text-[8px] text-muted-foreground">Seats Used</div></div>
                <div><div className="text-lg font-bold">Apr 30</div><div className="text-[8px] text-muted-foreground">Next Billing</div></div>
              </div>
            </div>

            <SectionCard title="Billing History">
              <div className="space-y-1">
                {[
                  { date: 'Apr 1, 2026', amount: '$299.00', status: 'Paid' },
                  { date: 'Mar 1, 2026', amount: '$299.00', status: 'Paid' },
                  { date: 'Feb 1, 2026', amount: '$249.00', status: 'Paid' },
                  { date: 'Jan 1, 2026', amount: '$249.00', status: 'Paid' },
                ].map((b, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-md border text-[9px]">
                    <span>{b.date}</span>
                    <span className="font-medium">{b.amount}</span>
                    <StatusBadge status="healthy" label={b.status} />
                    <Button variant="ghost" size="sm" className="h-5 text-[8px] px-1.5"><Download className="h-2.5 w-2.5" /></Button>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>

      {/* Invite Member Drawer */}
      <Sheet open={inviteDrawer} onOpenChange={setInviteDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm">Invite Member</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-[9px] font-medium mb-1 block">Email Address</label>
              <input className="w-full h-7 rounded-md border bg-background px-2 text-[9px]" placeholder="colleague@company.com" />
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Role</label>
              <select className="w-full h-7 rounded-md border bg-background px-2 text-[9px]">
                <option>Member</option>
                <option>Manager</option>
                <option>Admin</option>
                <option>Viewer</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Department (optional)</label>
              <input className="w-full h-7 rounded-md border bg-background px-2 text-[9px]" placeholder="e.g. Engineering" />
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Personal Message (optional)</label>
              <textarea className="w-full h-16 rounded-md border bg-background px-3 py-2 text-[9px] resize-none focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Add a welcome note..." />
            </div>
            {seatUsage >= 80 && (
              <div className="rounded-md border border-[hsl(var(--state-caution))]/30 bg-[hsl(var(--state-caution))]/5 p-2 text-[8px]">
                <div className="flex items-center gap-1 text-[hsl(var(--state-caution))] font-medium"><AlertTriangle className="h-2.5 w-2.5" />{totalSeats - activeSeats} seats remaining</div>
              </div>
            )}
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1" onClick={() => setInviteDrawer(false)}>Cancel</Button>
              <Button size="sm" className="h-7 text-[10px] flex-1 gap-1" onClick={() => { setInviteDrawer(false); toast.success('Invitation sent!'); }}><Mail className="h-3 w-3" />Send Invite</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Role Drawer */}
      <Sheet open={editRoleDrawer} onOpenChange={setEditRoleDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm">Edit Role — {selectedMember?.name}</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-[9px] font-medium mb-1 block">Current Role</label>
              {selectedMember && <StatusBadge status={ROLE_META[selectedMember.role].badge} label={ROLE_META[selectedMember.role].label} />}
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">New Role</label>
              <select className="w-full h-7 rounded-md border bg-background px-2 text-[9px]" defaultValue={selectedMember?.role}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Reason (audit log)</label>
              <textarea className="w-full h-16 rounded-md border bg-background px-3 py-2 text-[9px] resize-none focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Reason for role change..." />
            </div>
            <div className="rounded-md bg-muted/20 p-2 text-[8px] text-muted-foreground">
              <div className="font-medium mb-0.5">This action will:</div>
              <ul className="space-y-0.5">
                <li>• Update member permissions immediately</li>
                <li>• Notify the member via email</li>
                <li>• Record in audit log with your identity</li>
              </ul>
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1" onClick={() => setEditRoleDrawer(false)}>Cancel</Button>
              <Button size="sm" className="h-7 text-[10px] flex-1 gap-1" onClick={() => { setEditRoleDrawer(false); toast.success('Role updated'); }}><CheckCircle2 className="h-3 w-3" />Update Role</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default OrgWorkspacePage;
