import React, { useState } from 'react';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, UserPlus, Shield, Search, MoreHorizontal, Mail, Trash2, Clock, Activity, ChevronRight, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const MEMBERS = [
  { id: '1', name: 'Sarah Kim', email: 'sarah@company.com', role: 'Admin', dept: 'Design', status: 'active', initials: 'SK', lastActive: '2 min ago' },
  { id: '2', name: 'Mike Torres', email: 'mike@company.com', role: 'Manager', dept: 'Engineering', status: 'active', initials: 'MT', lastActive: '1 hr ago' },
  { id: '3', name: 'Lisa Martinez', email: 'lisa@company.com', role: 'Member', dept: 'Marketing', status: 'active', initials: 'LM', lastActive: '30 min ago' },
  { id: '4', name: 'Dave Robinson', email: 'dave@company.com', role: 'Member', dept: 'Analytics', status: 'active', initials: 'DR', lastActive: '5 min ago' },
  { id: '5', name: 'Emma Chen', email: 'emma@company.com', role: 'Viewer', dept: 'Finance', status: 'on-leave', initials: 'EC', lastActive: '2 days ago' },
  { id: '6', name: 'James Wright', email: 'james@company.com', role: 'Member', dept: 'Sales', status: 'suspended', initials: 'JW', lastActive: '1 week ago' },
];

const PENDING = [
  { email: 'rachel@company.com', role: 'Manager', sent: '2 days ago' },
  { email: 'tom@company.com', role: 'Member', sent: '5 days ago' },
  { email: 'anna@company.com', role: 'Viewer', sent: '1 week ago' },
];

const ACTIVITY_LOG = [
  { action: 'Sarah Kim changed role of Lisa Martinez to Manager', time: '2 hours ago' },
  { action: 'Mike Torres joined the team', time: '1 day ago' },
  { action: 'Invite sent to rachel@company.com', time: '2 days ago' },
  { action: 'James Wright was suspended', time: '3 days ago' },
  { action: 'Emma Chen set to on-leave status', time: '5 days ago' },
];

export default function TeamManagementPage() {
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  const filtered = MEMBERS.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.dept.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = () => {
    if (!inviteEmail) return;
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail('');
    setInviteOpen(false);
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-4 w-4" /></Link>
            <h1 className="text-xl font-bold flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Team Management</h1>
          </div>
          <p className="text-xs text-muted-foreground ml-6">Manage team members, roles, invitations, and access controls</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="h-9 text-xs rounded-xl gap-1.5"><UserPlus className="h-3.5 w-3.5" />Invite Member</Button>
      </div>

      <KPIBand>
        <KPICard label="Total Members" value={String(MEMBERS.length)} />
        <KPICard label="Active" value={String(MEMBERS.filter(m => m.status === 'active').length)} change="67%" />
        <KPICard label="Pending Invites" value={String(PENDING.length)} />
        <KPICard label="On Leave" value={String(MEMBERS.filter(m => m.status === 'on-leave').length)} />
      </KPIBand>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="h-9 rounded-xl bg-muted/50">
          <TabsTrigger value="members" className="text-xs rounded-lg">Members</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs rounded-lg">Pending Invites</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs rounded-lg">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <SectionCard title="Team Members" icon={<Users className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search by name, email, or department..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 rounded-xl text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              {filtered.map(m => (
                <div key={m.id} className="flex items-center gap-3 py-3 px-2 border-b border-border/20 last:border-0 hover:bg-muted/30 rounded-xl transition-colors group">
                  <Avatar className="h-9 w-9 rounded-xl">
                    <AvatarFallback className="rounded-xl text-[10px] bg-primary/10 text-primary font-bold">{m.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold">{m.name}</span>
                      {m.role === 'Admin' && <Shield className="h-3 w-3 text-primary" />}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{m.email} · {m.dept}</div>
                  </div>
                  <div className="text-[9px] text-muted-foreground hidden sm:block"><Clock className="h-3 w-3 inline mr-0.5" />{m.lastActive}</div>
                  <StatusBadge
                    status={m.status === 'active' ? 'live' : m.status === 'on-leave' ? 'caution' : 'blocked'}
                    label={m.status.replace('-', ' ')}
                  />
                  <Select defaultValue={m.role.toLowerCase()}>
                    <SelectTrigger className="w-24 h-7 rounded-xl text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Admin', 'Manager', 'Member', 'Viewer'].map(r => (
                        <SelectItem key={r} value={r.toLowerCase()} className="text-[10px]">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <SectionCard title="Pending Invitations" icon={<Mail className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
            <div className="space-y-2">
              {PENDING.map((inv, i) => (
                <div key={i} className="flex items-center gap-3 py-3 px-2 border-b border-border/20 last:border-0 rounded-xl hover:bg-muted/20 transition-colors">
                  <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center"><Mail className="h-4 w-4 text-muted-foreground" /></div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold">{inv.email}</div>
                    <div className="text-[10px] text-muted-foreground">{inv.role} · Sent {inv.sent}</div>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg">Resend</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-lg text-destructive">Revoke</Button>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <SectionCard title="Recent Activity" icon={<Activity className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
            <div className="space-y-2">
              {ACTIVITY_LOG.map((log, i) => (
                <div key={i} className="flex items-start gap-2.5 py-2 border-b border-border/10 last:border-0">
                  <div className="h-2 w-2 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                  <div>
                    <div className="text-[11px]">{log.action}</div>
                    <div className="text-[9px] text-muted-foreground">{log.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Invite Member Sheet */}
      <Sheet open={inviteOpen} onOpenChange={setInviteOpen}>
        <SheetContent className="sm:max-w-md rounded-l-3xl">
          <SheetHeader>
            <SheetTitle className="text-base">Invite Team Member</SheetTitle>
            <SheetDescription className="text-xs">Send an invitation to join your team</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <label className="text-xs font-medium mb-1.5 block">Email Address</label>
              <Input type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="h-10 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">Role</label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Admin', 'Manager', 'Member', 'Viewer'].map(r => (
                    <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted/40 rounded-xl p-3 space-y-1">
              <div className="text-[10px] font-medium">Role Permissions</div>
              <div className="text-[9px] text-muted-foreground space-y-0.5">
                {inviteRole === 'admin' && <p>Full access to all team settings, billing, and member management.</p>}
                {inviteRole === 'manager' && <p>Can manage members, projects, and view analytics. No billing access.</p>}
                {inviteRole === 'member' && <p>Standard access to projects, tasks, and collaboration features.</p>}
                {inviteRole === 'viewer' && <p>Read-only access to shared projects and documents.</p>}
              </div>
            </div>
            <Button onClick={handleInvite} className="w-full h-10 rounded-xl font-semibold gap-1.5"><Mail className="h-4 w-4" />Send Invitation</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
