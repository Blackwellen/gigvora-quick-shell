import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  MessageSquare, Search, Plus, Users, Lock, Globe, Shield,
  Clock, Eye, Building2, ChevronRight, Hash,
} from 'lucide-react';

type RoomType = 'deal' | 'project' | 'industry' | 'partnership' | 'general';
type RoomAccess = 'invite-only' | 'enterprise-only' | 'public';
interface Room {
  id: string; name: string; type: RoomType; access: RoomAccess;
  members: number; messages: number; lastActive: string;
  orgs: string[]; description: string; unread: number;
}

const TYPE_COLORS: Record<RoomType, string> = {
  deal: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  project: 'bg-accent/10 text-accent', industry: 'bg-primary/10 text-primary',
  partnership: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]',
  general: 'bg-muted text-muted-foreground',
};

const ROOMS: Room[] = [
  { id: 'RM-1', name: 'Cloud Migration Partnership', type: 'partnership', access: 'invite-only', members: 8, messages: 234, lastActive: '5m ago', orgs: ['Acme Corp', 'CloudScale'], description: 'Discussing joint cloud migration offering.', unread: 3 },
  { id: 'RM-2', name: 'AI Infrastructure Deal Room', type: 'deal', access: 'invite-only', members: 5, messages: 89, lastActive: '1h ago', orgs: ['Acme Corp', 'GlobalHealth'], description: 'NDA-protected deal discussion for AI infrastructure project.', unread: 0 },
  { id: 'RM-3', name: 'FinTech Leaders Forum', type: 'industry', access: 'enterprise-only', members: 45, messages: 1240, lastActive: '15m ago', orgs: ['FinanceFirst', 'PayScale', 'Acme Corp'], description: 'Industry discussion for financial technology leaders.', unread: 12 },
  { id: 'RM-4', name: 'Q2 Security Assessment', type: 'project', access: 'invite-only', members: 6, messages: 156, lastActive: '2h ago', orgs: ['Acme Corp', 'SecureOps'], description: 'Project room for ongoing security assessment engagement.', unread: 1 },
  { id: 'RM-5', name: 'Enterprise Connect General', type: 'general', access: 'enterprise-only', members: 340, messages: 4560, lastActive: '2m ago', orgs: ['Open'], description: 'General discussion for all Enterprise Connect members.', unread: 8 },
];

const EnterpriseRoomsPage: React.FC = () => {
  const topStrip = (
    <>
      <MessageSquare className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Enterprise Rooms</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input placeholder="Search rooms..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[10px] w-44 focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />Create Room</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Room Types" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {(['deal', 'project', 'partnership', 'industry', 'general'] as RoomType[]).map(t => (
            <div key={t} className="flex justify-between">
              <Badge className={cn('text-[7px] border-0 capitalize', TYPE_COLORS[t])}>{t}</Badge>
              <span className="font-semibold">{ROOMS.filter(r => r.type === t).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Access Levels" className="!rounded-2xl">
        <div className="space-y-1 text-[9px] text-muted-foreground">
          <div className="flex items-center gap-1"><Lock className="h-2.5 w-2.5" /> <span className="font-medium text-foreground">Invite-Only</span> — NDA protected</div>
          <div className="flex items-center gap-1"><Shield className="h-2.5 w-2.5" /> <span className="font-medium text-foreground">Enterprise</span> — verified orgs only</div>
          <div className="flex items-center gap-1"><Globe className="h-2.5 w-2.5" /> <span className="font-medium text-foreground">Public</span> — open to all members</div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Active Rooms" value={String(ROOMS.length)} className="!rounded-2xl" />
        <KPICard label="Unread Messages" value={String(ROOMS.reduce((s, r) => s + r.unread, 0))} className="!rounded-2xl" />
        <KPICard label="Total Members" value={String(ROOMS.reduce((s, r) => s + r.members, 0))} className="!rounded-2xl" />
        <KPICard label="Your Rooms" value={String(ROOMS.length)} className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2">
        {ROOMS.map(r => (
          <div key={r.id} className="rounded-2xl border bg-card p-4 hover:shadow-md cursor-pointer transition-all group">
            <div className="flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', TYPE_COLORS[r.type])}>
                {r.access === 'invite-only' ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[12px] font-bold group-hover:text-accent transition-colors">{r.name}</span>
                  <Badge className={cn('text-[7px] border-0 capitalize', TYPE_COLORS[r.type])}>{r.type}</Badge>
                  {r.access === 'invite-only' && <Lock className="h-2.5 w-2.5 text-muted-foreground" />}
                  {r.unread > 0 && <span className="h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center">{r.unread}</span>}
                </div>
                <div className="text-[9px] text-muted-foreground line-clamp-1">{r.description}</div>
                <div className="flex items-center gap-2 mt-1 text-[8px] text-muted-foreground">
                  <span><Users className="h-2.5 w-2.5 inline" /> {r.members}</span>
                  <span>{r.messages} messages</span>
                  <span><Clock className="h-2.5 w-2.5 inline" /> {r.lastActive}</span>
                  <span className="flex gap-0.5">{r.orgs.slice(0, 2).map(o => <Badge key={o} variant="secondary" className="text-[6px]">{o}</Badge>)}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-[9px] rounded-lg gap-0.5 shrink-0"><Eye className="h-3 w-3" />Open</Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default EnterpriseRoomsPage;
