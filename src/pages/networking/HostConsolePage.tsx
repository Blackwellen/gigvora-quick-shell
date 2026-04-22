import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NetworkShell } from '@/components/shell/NetworkShell';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Crown, Radio, Users, Clock, Mic, MicOff, Hand, Volume2,
  Settings, AlertTriangle, MessageSquare, SkipForward, Pause,
  Play, Eye, UserMinus, Shield, Timer, Send, ChevronRight,
  Ban, Flag, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Participant {
  id: string; name: string; avatar: string; role: 'host' | 'speaker' | 'listener';
  muted: boolean; handRaised: boolean; speaking: boolean; joinedAt: string;
}

const PARTICIPANTS: Participant[] = [
  { id: '1', name: 'Sarah Kim', avatar: 'SK', role: 'host', muted: false, handRaised: false, speaking: true, joinedAt: '45m ago' },
  { id: '2', name: 'Mike Liu', avatar: 'ML', role: 'speaker', muted: false, handRaised: false, speaking: false, joinedAt: '40m ago' },
  { id: '3', name: 'Ana Rodriguez', avatar: 'AR', role: 'speaker', muted: true, handRaised: false, speaking: false, joinedAt: '38m ago' },
  { id: '4', name: 'David Chen', avatar: 'DC', role: 'listener', muted: true, handRaised: true, speaking: false, joinedAt: '30m ago' },
  { id: '5', name: 'Lisa Park', avatar: 'LP', role: 'listener', muted: true, handRaised: false, speaking: false, joinedAt: '25m ago' },
  { id: '6', name: 'James Rivera', avatar: 'JR', role: 'listener', muted: true, handRaised: true, speaking: false, joinedAt: '20m ago' },
  { id: '7', name: 'Maya Chen', avatar: 'MC', role: 'listener', muted: true, handRaised: false, speaking: false, joinedAt: '15m ago' },
  { id: '8', name: 'Leo Tanaka', avatar: 'LT', role: 'listener', muted: true, handRaised: false, speaking: false, joinedAt: '10m ago' },
];

const ROLE_COLORS: Record<string, string> = {
  host: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  speaker: 'bg-accent/10 text-accent',
  listener: 'bg-muted text-muted-foreground',
};

export default function HostConsolePage() {
  const [isPaused, setIsPaused] = useState(false);
  const [broadcast, setBroadcast] = useState('');
  const navigate = useNavigate();

  const speakers = PARTICIPANTS.filter(p => p.role === 'host' || p.role === 'speaker');
  const listeners = PARTICIPANTS.filter(p => p.role === 'listener');
  const handRaised = PARTICIPANTS.filter(p => p.handRaised);

  return (
    <NetworkShell backLabel="Host Console" backRoute="/networking/rooms"
      rightPanel={
        <div className="space-y-3">
          <SectionCard title="Room Controls" icon={<Settings className="h-3 w-3 text-accent" />} className="!rounded-xl">
            <div className="space-y-2">
              <Button variant={isPaused ? 'default' : 'outline'} size="sm" className="w-full h-7 text-[9px] rounded-lg gap-1" onClick={() => setIsPaused(!isPaused)}>
                {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                {isPaused ? 'Resume Room' : 'Pause Room'}
              </Button>
              <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-lg gap-1"><SkipForward className="h-3 w-3" /> Next Topic</Button>
              <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-lg gap-1"><Clock className="h-3 w-3" /> Extend +15 min</Button>
              <Button variant="destructive" size="sm" className="w-full h-7 text-[9px] rounded-lg gap-1"><Ban className="h-3 w-3" /> Close Room</Button>
            </div>
          </SectionCard>

          <SectionCard title="Broadcast Message" icon={<MessageSquare className="h-3 w-3 text-accent" />} className="!rounded-xl">
            <Textarea value={broadcast} onChange={e => setBroadcast(e.target.value)} placeholder="Send a message to all participants..." className="text-[9px] min-h-[50px] resize-none mb-2" />
            <Button size="sm" className="w-full h-6 text-[8px] rounded-lg gap-0.5"><Send className="h-2.5 w-2.5" /> Broadcast</Button>
          </SectionCard>

          <SectionCard title="Hand Raise Queue" icon={<Hand className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" />} className="!rounded-xl">
            {handRaised.length === 0 ? (
              <p className="text-[9px] text-muted-foreground">No hands raised</p>
            ) : (
              <div className="space-y-1.5">
                {handRaised.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Avatar className="h-5 w-5"><AvatarFallback className="text-[6px] bg-muted">{p.avatar}</AvatarFallback></Avatar>
                    <span className="text-[9px] font-medium flex-1">{p.name}</span>
                    <Button variant="outline" size="sm" className="h-5 text-[7px] px-1.5 rounded-md">Invite</Button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Moderation" icon={<Shield className="h-3 w-3 text-muted-foreground" />} className="!rounded-xl">
            <div className="space-y-1.5 text-[9px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Reported</span><span className="font-semibold">0</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Warnings Sent</span><span className="font-semibold">0</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Removed</span><span className="font-semibold">0</span></div>
            </div>
          </SectionCard>
        </div>
      }
    >
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <Crown className="h-4 w-4 text-[hsl(var(--gigvora-amber))]" />
        <h1 className="text-sm font-bold mr-2">Host Console</h1>
        <StatusBadge status={isPaused ? 'pending' : 'live'} />
        <KPICard label="Participants" value={String(PARTICIPANTS.length)} />
        <KPICard label="Speakers" value={String(speakers.length)} />
        <KPICard label="Hands" value={String(handRaised.length)} />
        <KPICard label="Duration" value="45 min" />
      </div>

      {isPaused && (
        <div className="bg-[hsl(var(--state-caution))]/10 border border-[hsl(var(--state-caution))]/30 rounded-xl p-3 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--state-caution))]" />
          <span className="text-xs font-medium">Room is paused. Participants are notified.</span>
          <div className="flex-1" />
          <Button size="sm" className="h-6 text-[9px] rounded-lg gap-0.5" onClick={() => setIsPaused(false)}><Play className="h-3 w-3" /> Resume</Button>
        </div>
      )}

      {/* Stage — Speakers */}
      <SectionCard title="Stage" icon={<Volume2 className="h-3.5 w-3.5 text-accent" />}>
        <div className="flex items-center gap-6 justify-center py-4">
          {speakers.map(s => (
            <div key={s.id} className="flex flex-col items-center gap-2 group">
              <div className={cn('relative', s.speaking ? 'ring-2 ring-accent ring-offset-2 ring-offset-background rounded-full' : '')}>
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-sm bg-accent/10 text-accent">{s.avatar}</AvatarFallback>
                </Avatar>
                {s.role === 'host' && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[hsl(var(--gigvora-amber))] flex items-center justify-center">
                    <Crown className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-[10px] font-semibold">{s.name}</div>
                <Badge className={cn('text-[7px] h-3.5 border-0', ROLE_COLORS[s.role])}>{s.role}</Badge>
              </div>
              {s.speaking && (
                <div className="flex gap-0.5">
                  {[1,2,3].map(i => <div key={i} className="w-1 bg-accent rounded-full animate-pulse" style={{ height: `${6 + Math.random() * 10}px`, animationDelay: `${i * 0.2}s` }} />)}
                </div>
              )}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 rounded-md"><MicOff className="h-2.5 w-2.5" /></Button>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 rounded-md"><UserMinus className="h-2.5 w-2.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Listeners Grid */}
      <SectionCard title="Listeners" subtitle={`${listeners.length} people`} className="mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2">
          {listeners.map(l => (
            <div key={l.id} className="flex items-center gap-2 p-2 rounded-xl border border-border/30 hover:border-accent/30 transition-all group">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-[9px] bg-muted">{l.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-semibold truncate">{l.name}</div>
                <div className="text-[8px] text-muted-foreground">{l.joinedAt}</div>
              </div>
              <div className="flex flex-col gap-0.5">
                {l.handRaised && <Hand className="h-3 w-3 text-[hsl(var(--gigvora-amber))] animate-pulse" />}
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"><Flag className="h-2 w-2 text-muted-foreground" /></Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </NetworkShell>
  );
}
