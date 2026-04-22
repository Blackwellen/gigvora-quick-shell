import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Users, Search, MessageSquare, Shield, Crown, UserPlus,
  MoreHorizontal, Mail, UserMinus, Download,
} from 'lucide-react';

type MemberRole = 'owner' | 'admin' | 'moderator' | 'member';

interface Member {
  id: string; name: string; initials: string; role: MemberRole;
  headline: string; joinedAt: string; lastActive: string; posts: number;
}

const MEMBERS: Member[] = [
  { id: '1', name: 'Sarah Kim', initials: 'SK', role: 'owner', headline: 'Staff Engineer @ Google', joinedAt: 'Jan 2024', lastActive: '2h ago', posts: 89 },
  { id: '2', name: 'Mike Liu', initials: 'ML', role: 'admin', headline: 'Senior Dev @ Vercel', joinedAt: 'Feb 2024', lastActive: '1h ago', posts: 67 },
  { id: '3', name: 'Alex Torres', initials: 'AT', role: 'moderator', headline: 'Tech Lead @ Meta', joinedAt: 'Mar 2024', lastActive: '3h ago', posts: 45 },
  { id: '4', name: 'Maya Chen', initials: 'MC', role: 'member', headline: 'Product Lead @ Stripe', joinedAt: 'Apr 2024', lastActive: '30m ago', posts: 34 },
  { id: '5', name: 'James Rivera', initials: 'JR', role: 'member', headline: 'Staff Engineer @ Vercel', joinedAt: 'Apr 2024', lastActive: '5h ago', posts: 56 },
  { id: '6', name: 'Lisa Park', initials: 'LP', role: 'member', headline: 'Design Lead @ Figma', joinedAt: 'May 2024', lastActive: '1d ago', posts: 12 },
  { id: '7', name: 'Tom Wright', initials: 'TW', role: 'member', headline: 'CTO @ StartupXYZ', joinedAt: 'Jun 2024', lastActive: '2d ago', posts: 8 },
];

const ROLE_STYLES: Record<MemberRole, { bg: string; icon: React.ElementType }> = {
  owner: { bg: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]', icon: Crown },
  admin: { bg: 'bg-accent/10 text-accent', icon: Shield },
  moderator: { bg: 'bg-secondary text-secondary-foreground', icon: Shield },
  member: { bg: 'bg-muted text-muted-foreground', icon: Users },
};

export default function GroupMembersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | MemberRole>('all');
  const filtered = MEMBERS.filter(m => (roleFilter === 'all' || m.role === roleFilter) && m.name.toLowerCase().includes(search.toLowerCase()));

  const topStrip = (
    <>
      <Users className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">React Developers — Members</span>
      <Badge variant="outline" className="text-[9px]">{MEMBERS.length.toLocaleString()} members</Badge>
      <div className="flex-1" />
      <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1"><Download className="h-3 w-3" />Export</Button>
      <Button size="sm" className="h-7 text-[10px] gap-1"><UserPlus className="h-3 w-3" />Invite</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Roles" className="!rounded-2xl">
        <div className="space-y-1">
          {(['all', 'owner', 'admin', 'moderator', 'member'] as const).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} className={cn('w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[9px] transition-colors capitalize', roleFilter === r ? 'bg-accent/10 text-accent' : 'hover:bg-muted/50')}>
              <span>{r}</span>
              <span className="font-semibold">{r === 'all' ? MEMBERS.length : MEMBERS.filter(m => m.role === r).length}</span>
            </button>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Activity" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Active today</span><span className="font-semibold">5</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Active this week</span><span className="font-semibold">6</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">New this month</span><span className="font-semibold">2</span></div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-44">
      <div className="relative max-w-sm mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs rounded-xl" />
      </div>

      <div className="space-y-2">
        {filtered.map(m => {
          const rs = ROLE_STYLES[m.role];
          return (
            <div key={m.id} className="rounded-2xl border bg-card p-3.5 hover:shadow-sm transition-all flex items-center gap-3">
              <Avatar className="h-9 w-9 rounded-2xl"><AvatarFallback className="rounded-2xl text-[9px] font-bold bg-accent/10 text-accent">{m.initials}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold">{m.name}</span>
                  <Badge className={cn('text-[7px] h-3.5 border-0 capitalize gap-0.5 rounded-lg', rs.bg)}><rs.icon className="h-2 w-2" />{m.role}</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground">{m.headline}</div>
                <div className="text-[8px] text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span>Joined {m.joinedAt}</span><span>·</span><span>Active {m.lastActive}</span><span>·</span><span>{m.posts} posts</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><MessageSquare className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Mail className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><MoreHorizontal className="h-3 w-3" /></Button>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
