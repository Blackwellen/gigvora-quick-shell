import React, { useState } from 'react';
import { NetworkShell } from '@/components/shell/NetworkShell';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Clock, MessageSquare, Check, Star, Calendar, Users,
  Handshake, Zap, Radio, AlertTriangle, ChevronRight,
  Send, Edit, Trash2, Plus, Eye,
} from 'lucide-react';

type FollowUpType = 'event' | 'speed-match' | 'intro-request' | 'room-session' | 'manual' | 'collaboration';
type Priority = 'high' | 'medium' | 'low';
type Status = 'pending' | 'in-progress' | 'completed' | 'skipped';

interface FollowUp {
  id: string; name: string; avatar: string; headline: string;
  type: FollowUpType; reason: string; due: string; priority: Priority;
  status: Status; context: string; lastInteraction: string;
  tags: string[];
}

const TYPE_CONFIG: Record<FollowUpType, { label: string; icon: React.FC<{className?:string}>; color: string }> = {
  'event': { label: 'Event', icon: Calendar, color: 'bg-accent/10 text-accent' },
  'speed-match': { label: 'Speed Match', icon: Zap, color: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' },
  'intro-request': { label: 'Introduction', icon: Handshake, color: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]' },
  'room-session': { label: 'Room', icon: Radio, color: 'bg-[hsl(var(--state-live))]/10 text-[hsl(var(--state-live))]' },
  'manual': { label: 'Manual', icon: Edit, color: 'bg-muted text-muted-foreground' },
  'collaboration': { label: 'Collaboration', icon: Users, color: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' },
};

const STATUS_STYLES: Record<Status, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-[hsl(var(--state-caution))]/10 text-[hsl(var(--state-caution))]' },
  'in-progress': { label: 'In Progress', color: 'bg-accent/10 text-accent' },
  completed: { label: 'Done', color: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' },
  skipped: { label: 'Skipped', color: 'bg-muted text-muted-foreground' },
};

const FOLLOW_UPS: FollowUp[] = [
  { id: '1', name: 'Elena Vasquez', avatar: 'EV', headline: 'VP Eng @ Cloudflare', type: 'event', reason: 'Met at Cloud Summit Q2', due: 'Today', priority: 'high', status: 'pending', context: 'Discussed platform architecture. She mentioned interest in collaboration.', lastInteraction: '2d ago', tags: ['Engineering', 'Leadership'] },
  { id: '2', name: 'Marcus Johnson', avatar: 'MJ', headline: 'Product Design Lead', type: 'speed-match', reason: 'Speed networking match — 94% score', due: 'Today', priority: 'high', status: 'pending', context: 'Strong alignment on design systems. Wants to explore partnership.', lastInteraction: 'Yesterday', tags: ['Design', 'Partnership'] },
  { id: '3', name: 'Priya Patel', avatar: 'PP', headline: 'AI/ML Researcher', type: 'intro-request', reason: 'Intro requested by Leo Tanaka', due: 'Tomorrow', priority: 'medium', status: 'in-progress', context: 'Leo suggested connecting over ML infrastructure.', lastInteraction: '3d ago', tags: ['ML', 'Research'] },
  { id: '4', name: 'James Rivera', avatar: 'JR', headline: 'Staff Engineer @ Vercel', type: 'room-session', reason: 'Connected in AI Leaders room', due: 'In 3 days', priority: 'medium', status: 'pending', context: 'Exchanged ideas on edge computing. Follow up with resources.', lastInteraction: '5d ago', tags: ['Edge', 'Infrastructure'] },
  { id: '5', name: 'Aisha Patel', avatar: 'AP', headline: 'Design Director @ Figma', type: 'collaboration', reason: 'Mutual project interest', due: 'In 5 days', priority: 'low', status: 'pending', context: 'Both interested in open-source design tools project.', lastInteraction: '1w ago', tags: ['Design', 'Open Source'] },
  { id: '6', name: 'Sarah Chen', avatar: 'SC', headline: 'Staff Engineer at Stripe', type: 'speed-match', reason: 'Speed networking last week', due: 'Completed', priority: 'low', status: 'completed', context: 'Followed up and connected. Scheduled a coffee chat.', lastInteraction: '2d ago', tags: ['Engineering'] },
  { id: '7', name: 'David Park', avatar: 'DP', headline: 'Growth Lead @ Series B', type: 'manual', reason: 'Manual reminder set', due: 'Completed', priority: 'low', status: 'completed', context: 'Sent article on growth strategies as promised.', lastInteraction: '4d ago', tags: ['Growth'] },
];

export default function FollowUpCenterPage() {
  const [tab, setTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = FOLLOW_UPS.filter(f => {
    if (tab === 'pending') return f.status === 'pending' || f.status === 'in-progress';
    if (tab === 'completed') return f.status === 'completed' || f.status === 'skipped';
    return true;
  });

  const selectedItem = FOLLOW_UPS.find(f => f.id === selected);
  const pendingCount = FOLLOW_UPS.filter(f => f.status === 'pending').length;
  const dueToday = FOLLOW_UPS.filter(f => f.due === 'Today').length;

  return (
    <NetworkShell backLabel="Follow-Up Center" backRoute="/networking"
      rightPanel={selectedItem ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10"><AvatarFallback className="text-xs bg-accent/10 text-accent">{selectedItem.avatar}</AvatarFallback></Avatar>
            <div>
              <div className="text-xs font-bold">{selectedItem.name}</div>
              <div className="text-[9px] text-muted-foreground">{selectedItem.headline}</div>
            </div>
          </div>
          <SectionCard title="Context" className="!rounded-xl">
            <p className="text-[9px] text-muted-foreground leading-relaxed">{selectedItem.context}</p>
          </SectionCard>
          <SectionCard title="Details" className="!rounded-xl">
            <div className="space-y-1.5 text-[9px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><Badge className={`text-[7px] h-3.5 border-0 ${TYPE_CONFIG[selectedItem.type].color}`}>{TYPE_CONFIG[selectedItem.type].label}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Reason</span><span className="font-medium text-right">{selectedItem.reason}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Last interaction</span><span>{selectedItem.lastInteraction}</span></div>
            </div>
          </SectionCard>
          <SectionCard title="Tags" className="!rounded-xl">
            <div className="flex flex-wrap gap-1">
              {selectedItem.tags.map(t => <Badge key={t} variant="outline" className="text-[7px] h-3.5 px-1.5">{t}</Badge>)}
            </div>
          </SectionCard>
          <SectionCard title="Quick Message" className="!rounded-xl">
            <Textarea placeholder="Write a follow-up message..." className="text-[10px] min-h-[60px] resize-none mb-2" />
            <Button size="sm" className="h-6 text-[8px] w-full rounded-lg gap-1"><Send className="h-2.5 w-2.5" /> Send</Button>
          </SectionCard>
          <div className="flex gap-1.5">
            <Button size="sm" className="h-7 text-[9px] flex-1 rounded-xl gap-0.5"><Check className="h-3 w-3" /> Complete</Button>
            <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Calendar className="h-3 w-3" /> Snooze</Button>
          </div>
        </div>
      ) : undefined}
    >
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <Clock className="h-4 w-4 text-[hsl(var(--state-caution))]" />
        <h1 className="text-sm font-bold mr-2">Follow-Up Center</h1>
        <KPICard label="Pending" value={String(pendingCount)} />
        <KPICard label="Due Today" value={String(dueToday)} change={dueToday > 0 ? 'Action needed' : undefined} trend={dueToday > 0 ? 'neutral' : undefined} />
        <KPICard label="Completed" value={String(FOLLOW_UPS.filter(f => f.status === 'completed').length)} />
        <KPICard label="Completion Rate" value={`${Math.round((FOLLOW_UPS.filter(f => f.status === 'completed').length / FOLLOW_UPS.length) * 100)}%`} />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Tabs value={tab} onValueChange={v => setTab(v as any)}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
            <TabsTrigger value="pending" className="text-[10px] h-5 px-2 gap-1">Pending <Badge className="text-[7px] h-3 bg-[hsl(var(--state-caution))]/10 text-[hsl(var(--state-caution))] border-0 px-1">{pendingCount}</Badge></TabsTrigger>
            <TabsTrigger value="completed" className="text-[10px] h-5 px-2">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex-1" />
        <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl"><Plus className="h-3 w-3" /> Add Reminder</Button>
      </div>

      <div className="space-y-2">
        {filtered.map(f => {
          const tc = TYPE_CONFIG[f.type];
          const ss = STATUS_STYLES[f.status];
          const Icon = tc.icon;
          return (
            <div key={f.id} onClick={() => setSelected(f.id === selected ? null : f.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${f.id === selected ? 'border-accent/40 bg-accent/5' : 'border-border/40 hover:border-accent/30 hover:bg-accent/5'} ${f.priority === 'high' && f.status === 'pending' ? 'border-l-2 border-l-[hsl(var(--state-critical))]' : ''}`}>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs bg-accent/10 text-accent">{f.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{f.name}</span>
                    <Badge className={`text-[7px] h-3.5 border-0 ${tc.color}`}><Icon className="h-2 w-2 mr-0.5" />{tc.label}</Badge>
                    <Badge className={`text-[7px] h-3.5 border-0 ${ss.color}`}>{ss.label}</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{f.headline}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{f.reason}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge className={`text-[8px] h-4 border-0 ${f.due === 'Today' ? 'bg-[hsl(var(--state-critical))]/10 text-[hsl(var(--state-critical))]' : f.due === 'Tomorrow' ? 'bg-[hsl(var(--state-caution))]/10 text-[hsl(var(--state-caution))]' : 'bg-muted text-muted-foreground'}`}>
                    {f.due}
                  </Badge>
                  <span className="text-[8px] text-muted-foreground">Last: {f.lastInteraction}</span>
                </div>
              </div>
              {f.status !== 'completed' && f.status !== 'skipped' && (
                <div className="flex gap-1.5 mt-2 pt-2 border-t border-border/30">
                  <Button size="sm" className="h-6 text-[8px] rounded-lg gap-0.5 flex-1"><MessageSquare className="h-2.5 w-2.5" /> Message</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Check className="h-2.5 w-2.5" /> Done</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Calendar className="h-2.5 w-2.5" /> Snooze</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </NetworkShell>
  );
}
