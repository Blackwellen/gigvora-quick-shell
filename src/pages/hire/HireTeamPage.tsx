import React, { useState } from 'react';
import { HireShell } from '@/components/shell/HireShell';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, Shield, MessageSquare, CheckCircle2, Clock, Plus,
  AtSign, ThumbsUp, AlertTriangle, ChevronRight, UserCheck,
  Settings, Crown, Eye,
} from 'lucide-react';

type TeamRole = 'hiring-manager' | 'interviewer' | 'coordinator' | 'approver' | 'sourcer';

interface TeamMember {
  id: string; name: string; avatar: string; role: TeamRole; email: string;
  activeRoles: number; scorecardsPending: number; lastActive: string;
}

interface CollabNote {
  id: string; author: string; avatar: string; text: string; date: string;
  mentions: string[]; type: 'note' | 'approval' | 'stage-change' | 'decision';
  candidate?: string; job?: string;
}

const ROLE_CONFIG: Record<TeamRole, { label: string; color: string; icon: React.FC<{ className?: string }> }> = {
  'hiring-manager': { label: 'Hiring Manager', color: 'bg-accent/10 text-accent', icon: Crown },
  interviewer: { label: 'Interviewer', color: 'bg-[hsl(var(--state-review))]/10 text-[hsl(var(--state-review))]', icon: MessageSquare },
  coordinator: { label: 'Coordinator', color: 'bg-[hsl(var(--state-caution))]/10 text-[hsl(var(--state-caution))]', icon: Settings },
  approver: { label: 'Approver', color: 'bg-[hsl(var(--state-premium))]/10 text-[hsl(var(--state-premium))]', icon: CheckCircle2 },
  sourcer: { label: 'Sourcer', color: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]', icon: UserCheck },
};

const TEAM: TeamMember[] = [
  { id: '1', name: 'Sarah Kim', avatar: 'SK', role: 'hiring-manager', email: 'sarah@co.com', activeRoles: 4, scorecardsPending: 1, lastActive: '5m ago' },
  { id: '2', name: 'Mike Chen', avatar: 'MC', role: 'interviewer', email: 'mike@co.com', activeRoles: 3, scorecardsPending: 2, lastActive: '30m ago' },
  { id: '3', name: 'Lisa Wang', avatar: 'LW', role: 'interviewer', email: 'lisa@co.com', activeRoles: 2, scorecardsPending: 0, lastActive: '1h ago' },
  { id: '4', name: 'Tom Lee', avatar: 'TL', role: 'coordinator', email: 'tom@co.com', activeRoles: 6, scorecardsPending: 0, lastActive: '15m ago' },
  { id: '5', name: 'VP Engineering', avatar: 'VP', role: 'approver', email: 'vp@co.com', activeRoles: 2, scorecardsPending: 1, lastActive: '2h ago' },
  { id: '6', name: 'Recruiter One', avatar: 'R1', role: 'sourcer', email: 'r1@co.com', activeRoles: 5, scorecardsPending: 0, lastActive: '10m ago' },
];

const NOTES: CollabNote[] = [
  { id: 'n1', author: 'Sarah Kim', avatar: 'SK', text: 'Ana Torres is very strong on system design. Recommend fast-tracking to final.', date: '2h ago', mentions: ['Mike Chen'], type: 'note', candidate: 'Ana Torres', job: 'Senior FE Engineer' },
  { id: 'n2', author: 'VP Engineering', avatar: 'VP', text: 'Approved: proceed to offer for David Kim.', date: '4h ago', mentions: [], type: 'approval', candidate: 'David Kim', job: 'Engineering Manager' },
  { id: 'n3', author: 'Mike Chen', avatar: 'MC', text: '@Lisa Wang can you review James Chen\u2019s take-home? I have concerns about code quality.', date: '1d ago', mentions: ['Lisa Wang'], type: 'note', candidate: 'James Chen', job: 'Senior FE Engineer' },
  { id: 'n4', author: 'Tom Lee', avatar: 'TL', text: 'Stage change: Priya Patel moved from Phone Screen to Technical Round.', date: '1d ago', mentions: [], type: 'stage-change', candidate: 'Priya Patel', job: 'ML Engineer' },
  { id: 'n5', author: 'Sarah Kim', avatar: 'SK', text: 'Decision: closing Staff Backend Engineer role — insufficient qualified pipeline after 30 days.', date: '2d ago', mentions: ['VP Engineering'], type: 'decision', job: 'Staff Backend Engineer' },
];

const NOTE_TYPE_BADGE: Record<string, { label: string; color: string }> = {
  note: { label: 'Note', color: 'bg-muted text-muted-foreground' },
  approval: { label: 'Approval', color: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' },
  'stage-change': { label: 'Stage Change', color: 'bg-[hsl(var(--state-review))]/10 text-[hsl(var(--state-review))]' },
  decision: { label: 'Decision', color: 'bg-[hsl(var(--state-premium))]/10 text-[hsl(var(--state-premium))]' },
};

export default function HireTeamPage() {
  const [tab, setTab] = useState<'team' | 'notes' | 'approvals'>('team');
  const [noteText, setNoteText] = useState('');

  return (
    <HireShell>
      <SectionBackNav homeRoute="/hire" homeLabel="Recruitment" currentLabel="Hiring Team" icon={<Shield className="h-3 w-3" />} />

      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <Users className="h-4 w-4 text-accent" />
        <h1 className="text-sm font-bold mr-2">Hiring Team</h1>
        <KPICard label="Members" value={String(TEAM.length)} />
        <KPICard label="Pending Scorecards" value={String(TEAM.reduce((a, m) => a + m.scorecardsPending, 0))} />
        <KPICard label="Active Roles" value="12" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Tabs value={tab} onValueChange={v => setTab(v as any)}>
          <TabsList className="h-7">
            <TabsTrigger value="team" className="text-[10px] h-5 px-2">Team Members</TabsTrigger>
            <TabsTrigger value="notes" className="text-[10px] h-5 px-2">Internal Notes</TabsTrigger>
            <TabsTrigger value="approvals" className="text-[10px] h-5 px-2">Approvals</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex-1" />
        <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl"><Plus className="h-3 w-3" /> Add Member</Button>
      </div>

      {tab === 'team' && (
        <div className="space-y-2">
          {TEAM.map(m => {
            const rc = ROLE_CONFIG[m.role];
            return (
              <div key={m.id} className="p-3.5 rounded-xl border border-border/40 hover:border-accent/30 hover:bg-accent/5 transition-all">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9"><AvatarFallback className="text-[10px] bg-muted">{m.avatar}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{m.name}</span>
                      <Badge className={`text-[7px] h-3.5 border-0 ${rc.color}`}>{rc.label}</Badge>
                    </div>
                    <div className="text-[9px] text-muted-foreground">{m.email}</div>
                  </div>
                  <div className="flex items-center gap-4 text-[9px] text-muted-foreground">
                    <span>{m.activeRoles} roles</span>
                    {m.scorecardsPending > 0 && (
                      <Badge className="text-[7px] h-3.5 bg-[hsl(var(--state-caution))]/10 text-[hsl(var(--state-caution))] border-0">
                        {m.scorecardsPending} pending
                      </Badge>
                    )}
                    <span><Clock className="h-2.5 w-2.5 inline" /> {m.lastActive}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'notes' && (
        <div className="space-y-3">
          {/* Compose Note */}
          <SectionCard className="!rounded-xl">
            <div className="flex gap-2">
              <Textarea placeholder="Add an internal note... use @mentions to notify team members" value={noteText} onChange={e => setNoteText(e.target.value)} className="text-[10px] min-h-[60px] resize-none" />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                <Shield className="h-2.5 w-2.5" /> Private — only visible to hiring team
              </div>
              <Button size="sm" className="h-6 text-[8px] gap-1 rounded-lg"><MessageSquare className="h-2.5 w-2.5" /> Post Note</Button>
            </div>
          </SectionCard>

          {NOTES.map(n => {
            const badge = NOTE_TYPE_BADGE[n.type];
            return (
              <div key={n.id} className="p-3.5 rounded-xl border border-border/40">
                <div className="flex items-start gap-2.5">
                  <Avatar className="h-7 w-7 mt-0.5"><AvatarFallback className="text-[8px] bg-muted">{n.avatar}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold">{n.author}</span>
                      <Badge className={`text-[7px] h-3.5 border-0 ${badge.color}`}>{badge.label}</Badge>
                      <span className="text-[8px] text-muted-foreground ml-auto">{n.date}</span>
                    </div>
                    <p className="text-[10px] text-foreground/80 leading-relaxed">{n.text}</p>
                    {(n.candidate || n.job) && (
                      <div className="flex items-center gap-2 mt-1.5">
                        {n.candidate && <Badge variant="outline" className="text-[7px] h-3.5">{n.candidate}</Badge>}
                        {n.job && <Badge variant="outline" className="text-[7px] h-3.5">{n.job}</Badge>}
                      </div>
                    )}
                    {n.mentions.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-[8px] text-accent">
                        <AtSign className="h-2.5 w-2.5" /> {n.mentions.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'approvals' && (
        <div className="space-y-2">
          {NOTES.filter(n => n.type === 'approval' || n.type === 'decision').map(n => (
            <div key={n.id} className="p-3.5 rounded-xl border border-border/40">
              <div className="flex items-center gap-3">
                <Avatar className="h-7 w-7"><AvatarFallback className="text-[8px] bg-muted">{n.avatar}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <span className="text-[10px] font-semibold">{n.author}</span>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{n.text}</p>
                </div>
                <span className="text-[8px] text-muted-foreground">{n.date}</span>
              </div>
            </div>
          ))}
          <div className="text-center p-4 text-[10px] text-muted-foreground">
            2 pending approvals require action from VP Engineering
          </div>
        </div>
      )}
    </HireShell>
  );
}
