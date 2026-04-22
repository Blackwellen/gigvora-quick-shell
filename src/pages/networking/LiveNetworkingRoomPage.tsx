import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Radio, Mic, MicOff, Hand, MessageSquare, Users, Share2, LogOut, Crown, Volume2, Settings } from 'lucide-react';

const SPEAKERS = [
  { name: 'Sarah Kim', avatar: 'SK', role: 'Host', speaking: true },
  { name: 'Mike Liu', avatar: 'ML', role: 'Speaker', speaking: false },
  { name: 'Ana Rodriguez', avatar: 'AR', role: 'Speaker', speaking: true },
];

const LISTENERS = [
  { name: 'David Chen', avatar: 'DC' }, { name: 'Lisa Park', avatar: 'LP' },
  { name: 'James Rivera', avatar: 'JR' }, { name: 'Maya Chen', avatar: 'MC' },
  { name: 'Leo Tanaka', avatar: 'LT' }, { name: 'Aisha Patel', avatar: 'AP' },
  { name: 'Jordan Blake', avatar: 'JB' }, { name: 'Rina Okamoto', avatar: 'RO' },
];

export default function LiveNetworkingRoomPage() {
  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <Radio className="h-4 w-4 text-[hsl(var(--state-live))]" />
          <h1 className="text-sm font-bold">AI in Product Management</h1>
          <StatusBadge status="live" />
          <span className="text-[10px] text-muted-foreground">45 min · 18 attendees</span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Share2 className="h-3 w-3" /> Share</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Settings className="h-3 w-3" /></Button>
          <Button variant="destructive" size="sm" className="h-7 text-[10px] gap-1"><LogOut className="h-3 w-3" /> Leave</Button>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Chat" icon={<MessageSquare className="h-3 w-3 text-muted-foreground" />}>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {[
                { user: 'David C.', msg: 'Great point about AI governance!', time: '2m' },
                { user: 'Lisa P.', msg: 'Can we discuss tooling next?', time: '5m' },
                { user: 'James R.', msg: 'Agree with Sarah on the framework approach', time: '8m' },
                { user: 'Maya C.', msg: '🔥 This session is fire', time: '10m' },
              ].map((c, i) => (
                <div key={i} className="text-[9px]">
                  <span className="font-medium">{c.user}</span>
                  <span className="text-muted-foreground ml-1">{c.time}</span>
                  <p className="text-muted-foreground mt-0.5">{c.msg}</p>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-border/30">
              <input placeholder="Type a message..." className="w-full h-7 rounded-md border bg-background px-2 text-[10px]" />
            </div>
          </SectionCard>
          <SectionCard title="Raise Hand Queue" icon={<Hand className="h-3 w-3 text-muted-foreground" />}>
            {['Lisa Park', 'Jordan Blake'].map((n, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
                <Hand className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />
                <span className="text-[10px] flex-1">{n}</span>
                <Button variant="outline" size="sm" className="h-5 text-[8px] px-1.5">Invite</Button>
              </div>
            ))}
          </SectionCard>
        </div>
      }
      rightRailWidth="w-60"
    >
      {/* Stage — Speakers */}
      <SectionCard title="Stage" icon={<Volume2 className="h-3 w-3 text-accent" />}>
        <div className="flex items-center gap-6 justify-center py-6">
          {SPEAKERS.map(s => (
            <div key={s.name} className="flex flex-col items-center gap-2">
              <div className={`relative ${s.speaking ? 'ring-2 ring-accent ring-offset-2 ring-offset-background rounded-full' : ''}`}>
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-sm bg-accent/10 text-accent">{s.avatar}</AvatarFallback>
                </Avatar>
                {s.role === 'Host' && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[hsl(var(--gigvora-amber))] flex items-center justify-center">
                    <Crown className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-[11px] font-semibold">{s.name}</div>
                <Badge variant={s.role === 'Host' ? 'default' : 'secondary'} className="text-[7px] h-3.5">{s.role}</Badge>
              </div>
              {s.speaking && <div className="flex gap-0.5">{[1,2,3].map(i => <div key={i} className="w-1 bg-accent rounded-full animate-pulse" style={{ height: `${8 + Math.random() * 12}px`, animationDelay: `${i * 0.2}s` }} />)}</div>}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Listeners */}
      <SectionCard title="Listeners" subtitle={`${LISTENERS.length} people`} className="mt-4">
        <div className="flex flex-wrap gap-3">
          {LISTENERS.map(l => (
            <div key={l.name} className="flex flex-col items-center gap-1">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-[10px] bg-muted">{l.avatar}</AvatarFallback>
              </Avatar>
              <span className="text-[9px] text-muted-foreground">{l.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mt-6 p-4 rounded-2xl bg-muted/30 border">
        <Button variant="outline" size="lg" className="h-12 w-12 rounded-full p-0"><Mic className="h-5 w-5" /></Button>
        <Button variant="outline" size="lg" className="h-12 w-12 rounded-full p-0"><Hand className="h-5 w-5" /></Button>
        <Button variant="outline" size="lg" className="h-12 w-12 rounded-full p-0"><MessageSquare className="h-5 w-5" /></Button>
        <Button variant="destructive" size="lg" className="h-12 px-6 rounded-full text-sm gap-2"><LogOut className="h-4 w-4" /> Leave Room</Button>
      </div>
    </DashboardLayout>
  );
}
