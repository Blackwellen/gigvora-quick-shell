import React, { useState } from 'react';
import { KPIBand, KPICard, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Users, ChevronRight, Clock, Eye, UserPlus, Building2,
  AlertTriangle, Activity, Settings, Mail, Shield,
} from 'lucide-react';

type MemberStatus = 'active' | 'inactive' | 'on-leave';

interface Member {
  id: string; name: string; dept: string; role: string; status: MemberStatus;
  lastActive: string; actions: number; initials: string;
}

const MEMBERS: Member[] = [
  { id: '1', name: 'Sarah Kim', dept: 'Design', role: 'Hiring Manager', status: 'active', lastActive: '2m ago', actions: 14, initials: 'SK' },
  { id: '2', name: 'Mike Torres', dept: 'Engineering', role: 'Tech Lead', status: 'active', lastActive: '15m ago', actions: 22, initials: 'MT' },
  { id: '3', name: 'Lisa Martinez', dept: 'Marketing', role: 'Campaign Owner', status: 'active', lastActive: '1h ago', actions: 8, initials: 'LM' },
  { id: '4', name: 'Dave Robinson', dept: 'Analytics', role: 'Team Manager', status: 'active', lastActive: '3h ago', actions: 5, initials: 'DR' },
  { id: '5', name: 'Emma Chen', dept: 'Finance', role: 'Approver', status: 'on-leave', lastActive: '3d ago', actions: 0, initials: 'EC' },
  { id: '6', name: 'James Wright', dept: 'Sales', role: 'Enterprise Admin', status: 'inactive', lastActive: '2w ago', actions: 0, initials: 'JW' },
];

const STATUS_MAP: Record<MemberStatus, { badge: 'live' | 'caution' | 'pending'; label: string }> = {
  active: { badge: 'live', label: 'Active' }, 'on-leave': { badge: 'caution', label: 'On Leave' },
  inactive: { badge: 'pending', label: 'Inactive' },
};

const ACTIVITY = [
  { user: 'Sarah Kim', action: 'Approved vendor contract — Studio Alpha', time: '2h ago', dept: 'Design' },
  { user: 'Mike Torres', action: 'Posted job — Backend Engineer', time: '4h ago', dept: 'Engineering' },
  { user: 'Lisa Martinez', action: 'Launched campaign — Q2 Talent Acquisition', time: '6h ago', dept: 'Marketing' },
  { user: 'Dave Robinson', action: 'Reviewed procurement — Security Audit', time: 'Yesterday', dept: 'Analytics' },
  { user: 'Mike Torres', action: 'Approved spend — Tool License ($3,200)', time: 'Yesterday', dept: 'Engineering' },
];

export default function EntTeamActivityPage() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? MEMBERS : MEMBERS.filter(m => m.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2"><Users className="h-5 w-5 text-accent" /> Team Activity</h1>
          <p className="text-[11px] text-muted-foreground">Monitor seat utilization, team actions, and workspace health</p>
        </div>
        <Button size="sm" className="h-8 text-[10px] rounded-xl gap-1"><UserPlus className="h-3.5 w-3.5" />Invite Member</Button>
      </div>

      <KPIBand>
        <KPICard label="Total Seats" value="8" />
        <KPICard label="Active" value="4" change="50% utilization" />
        <KPICard label="On Leave" value="1" />
        <KPICard label="Inactive" value="1" change="Review needed" trend="down" />
      </KPIBand>

      {/* Inactive Warning */}
      {MEMBERS.some(m => m.status === 'inactive') && (
        <div className="rounded-2xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3.5 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--state-caution))] shrink-0" />
          <div className="flex-1">
            <div className="text-[10px] font-semibold">Inactive seats detected</div>
            <div className="text-[9px] text-muted-foreground">1 seat hasn't been used in 2+ weeks — consider reassignment or removal</div>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl">Manage Seats</Button>
        </div>
      )}

      <div className="flex items-center gap-1.5 pb-1">
        {['all', 'active', 'on-leave', 'inactive'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all capitalize',
            filter === f ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>{f === 'all' ? 'All Members' : f.replace('-', ' ')}</button>
        ))}
      </div>

      {/* Members */}
      <div className="space-y-2">
        {filtered.map(m => {
          const sm = STATUS_MAP[m.status];
          return (
            <div key={m.id} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer group">
              <Avatar className="h-9 w-9"><AvatarFallback className="text-[10px] bg-accent/10 text-accent font-bold">{m.initials}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold group-hover:text-accent transition-colors">{m.name}</span>
                  <StatusBadge status={sm.badge} label={sm.label} />
                </div>
                <div className="text-[9px] text-muted-foreground flex items-center gap-3">
                  <span className="flex items-center gap-0.5"><Building2 className="h-2.5 w-2.5" />{m.dept}</span>
                  <span className="flex items-center gap-0.5"><Shield className="h-2.5 w-2.5" />{m.role}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{m.lastActive}</span>
                </div>
              </div>
              {m.actions > 0 && <Badge className="text-[8px] bg-accent/10 text-accent border-0 rounded-lg">{m.actions} actions</Badge>}
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <SectionCard title="Recent Team Actions" icon={<Activity className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-2">
          {ACTIVITY.map((a, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2 border-b border-border/20 last:border-0">
              <div className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <div className="flex-1">
                <div className="text-[10px]"><span className="font-semibold">{a.user}</span> · {a.action}</div>
                <div className="text-[8px] text-muted-foreground mt-0.5">{a.dept} · {a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
