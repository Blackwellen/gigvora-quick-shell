import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Shield, Crown, Users, AlertTriangle, Flag, Ban,
  Settings, Eye, MessageSquare, Clock, CheckCircle,
  XCircle, UserMinus, MoreHorizontal,
} from 'lucide-react';

const REPORTED = [
  { id: '1', reporter: 'James R.', reporterInit: 'JR', target: 'Spam post by unknown_user', reason: 'Spam / Self-promotion', time: '1h ago', status: 'pending' as const },
  { id: '2', reporter: 'Lisa P.', reporterInit: 'LP', target: 'Offensive comment in thread #245', reason: 'Harassment', time: '3h ago', status: 'pending' as const },
  { id: '3', reporter: 'Tom W.', reporterInit: 'TW', target: 'Misleading job post', reason: 'Misleading content', time: '1d ago', status: 'resolved' as const },
];

const BANNED = [
  { name: 'spam_bot_42', initials: 'SB', bannedAt: 'Apr 10', reason: 'Automated spam', bannedBy: 'Sarah Kim' },
  { name: 'toxic_user', initials: 'TU', bannedAt: 'Mar 28', reason: 'Repeated harassment', bannedBy: 'Mike Liu' },
];

const ROLES = [
  { name: 'Sarah Kim', initials: 'SK', role: 'Owner' as const, permissions: ['All permissions'] },
  { name: 'Mike Liu', initials: 'ML', role: 'Admin' as const, permissions: ['Manage members', 'Moderate posts', 'Edit settings'] },
  { name: 'Alex Torres', initials: 'AT', role: 'Moderator' as const, permissions: ['Moderate posts', 'Review reports'] },
];

export default function GroupModerationPage() {
  const [tab, setTab] = useState('reports');

  const topStrip = (
    <>
      <Shield className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">React Developers — Roles & Moderation</span>
      <div className="flex-1" />
      <Badge variant="outline" className="text-[9px] gap-1 rounded-lg"><AlertTriangle className="h-3 w-3 text-[hsl(var(--state-caution))]" />{REPORTED.filter(r => r.status === 'pending').length} pending</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Auto-Moderation" className="!rounded-2xl">
        <div className="space-y-2">
          {[
            { label: 'Spam Filter', desc: 'Auto-remove suspected spam', on: true },
            { label: 'Link Preview', desc: 'Require approval for links', on: false },
            { label: 'Profanity Filter', desc: 'Block offensive language', on: true },
            { label: 'New Member Posts', desc: 'Review first 3 posts', on: true },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between">
              <div><div className="text-[9px] font-medium">{s.label}</div><div className="text-[7px] text-muted-foreground">{s.desc}</div></div>
              <Switch defaultChecked={s.on} className="scale-75" />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Pending Reports" value={String(REPORTED.filter(r => r.status === 'pending').length)} className="!rounded-2xl" />
        <KPICard label="Resolved (30d)" value="12" className="!rounded-2xl" />
        <KPICard label="Banned Members" value={String(BANNED.length)} className="!rounded-2xl" />
        <KPICard label="Team Size" value={String(ROLES.length)} className="!rounded-2xl" />
      </KPIBand>

      <Tabs value={tab} onValueChange={setTab} className="mb-3">
        <TabsList className="h-8 rounded-xl">
          <TabsTrigger value="reports" className="text-[10px] px-3 rounded-lg">Reports</TabsTrigger>
          <TabsTrigger value="roles" className="text-[10px] px-3 rounded-lg">Roles</TabsTrigger>
          <TabsTrigger value="banned" className="text-[10px] px-3 rounded-lg">Banned</TabsTrigger>
          <TabsTrigger value="settings" className="text-[10px] px-3 rounded-lg">Rules</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'reports' && (
        <div className="space-y-2">
          {REPORTED.map(r => (
            <div key={r.id} className="rounded-2xl border bg-card p-3.5 flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-[hsl(var(--state-caution)/0.1)] flex items-center justify-center shrink-0"><Flag className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold">{r.target}</span>
                  <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', r.status === 'pending' ? 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]' : 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]')}>{r.status}</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{r.reason} · Reported by {r.reporter} · {r.time}</div>
                {r.status === 'pending' && (
                  <div className="flex gap-1.5 mt-2">
                    <Button size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><CheckCircle className="h-2.5 w-2.5" />Dismiss</Button>
                    <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><XCircle className="h-2.5 w-2.5" />Remove Post</Button>
                    <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5 text-destructive"><Ban className="h-2.5 w-2.5" />Ban User</Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'roles' && (
        <div className="space-y-2">
          {ROLES.map(r => (
            <div key={r.name} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3">
              <Avatar className="h-9 w-9 rounded-2xl"><AvatarFallback className="rounded-2xl text-[9px] font-bold bg-accent/10 text-accent">{r.initials}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold">{r.name}</span>
                  <Badge className={cn('text-[7px] border-0 rounded-lg', r.role === 'Owner' ? 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]' : r.role === 'Admin' ? 'bg-accent/10 text-accent' : 'bg-muted')}>{r.role}</Badge>
                </div>
                <div className="text-[8px] text-muted-foreground mt-0.5 flex gap-1 flex-wrap">{r.permissions.map(p => <Badge key={p} variant="outline" className="text-[7px] h-3.5 rounded-md">{p}</Badge>)}</div>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Settings className="h-3 w-3" /></Button>
            </div>
          ))}
          <Button variant="outline" className="w-full h-8 text-[10px] rounded-xl gap-1 mt-2"><Users className="h-3 w-3" />Add Moderator</Button>
        </div>
      )}

      {tab === 'banned' && (
        <div className="space-y-2">
          {BANNED.map(b => (
            <div key={b.name} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0"><Ban className="h-3.5 w-3.5 text-destructive" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold">{b.name}</div>
                <div className="text-[8px] text-muted-foreground">{b.reason} · Banned {b.bannedAt} by {b.bannedBy}</div>
              </div>
              <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">Unban</Button>
            </div>
          ))}
        </div>
      )}

      {tab === 'settings' && (
        <SectionCard title="Group Rules" className="!rounded-2xl">
          <div className="space-y-2">
            {[
              'Be respectful and professional in all interactions',
              'No spam, self-promotion, or irrelevant content',
              'Share knowledge freely — credit original authors',
              'No recruiting or job posts outside designated threads',
              'Keep discussions on-topic for the group',
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px] p-2 rounded-xl bg-muted/30">
                <span className="text-[9px] font-bold text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                <span>{rule}</span>
              </div>
            ))}
            <Button variant="outline" className="w-full h-8 text-[10px] rounded-xl gap-1 mt-2"><Settings className="h-3 w-3" />Edit Rules</Button>
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
