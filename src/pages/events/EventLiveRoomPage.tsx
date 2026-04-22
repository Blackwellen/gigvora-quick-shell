import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Video, Mic, MicOff, VideoOff, Monitor, MessageSquare,
  Users, Hand, Share2, Settings, PhoneOff, Maximize,
} from 'lucide-react';

const EventLiveRoomPage: React.FC = () => {
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);

  const topStrip = (
    <>
      <Video className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Live — Tech Leaders Summit 2026</span>
      <div className="flex-1" />
      <Badge className="bg-destructive/10 text-destructive text-[9px] border-0 rounded-lg gap-1 animate-pulse"><div className="h-1.5 w-1.5 rounded-full bg-destructive" />LIVE</Badge>
      <Badge variant="outline" className="text-[9px] rounded-lg gap-1"><Users className="h-3 w-3" />187</Badge>
      <Badge variant="outline" className="text-[9px] rounded-lg gap-1">01:23:45</Badge>
    </>
  );

  const rightRail = chatOpen ? (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-2 py-1.5 border-b">
        <span className="text-[10px] font-semibold">Live Chat</span>
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setChatOpen(false)}>×</Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {[
          { n: 'Sarah C.', i: 'SC', msg: 'Great insight on distributed systems!', t: '2m ago' },
          { n: 'Marcus J.', i: 'MJ', msg: 'Can we get the slides shared?', t: '1m ago' },
          { n: 'Priya P.', i: 'PP', msg: '🔥 This is incredible', t: '30s ago' },
        ].map((m, i) => (
          <div key={i} className="flex gap-1.5">
            <Avatar className="h-5 w-5 rounded-lg shrink-0"><AvatarFallback className="rounded-lg text-[6px] bg-accent/10 text-accent">{m.i}</AvatarFallback></Avatar>
            <div><span className="text-[8px] font-semibold">{m.n}</span><div className="text-[9px] text-muted-foreground leading-relaxed">{m.msg}</div></div>
          </div>
        ))}
      </div>
      <div className="p-2 border-t">
        <div className="flex gap-1">
          <input className="flex-1 h-7 rounded-lg bg-muted/50 border-0 px-2 text-[9px] focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Type a message..." />
          <Button size="sm" className="h-7 w-7 p-0 rounded-lg"><MessageSquare className="h-3 w-3" /></Button>
        </div>
      </div>
    </div>
  ) : undefined;

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56">
      {/* Main stage */}
      <div className="rounded-2xl bg-black/90 aspect-video flex items-center justify-center mb-3 relative overflow-hidden">
        <div className="text-center">
          <Avatar className="h-16 w-16 rounded-2xl mx-auto mb-2"><AvatarFallback className="rounded-2xl text-lg font-bold bg-accent/20 text-accent">KS</AvatarFallback></Avatar>
          <div className="text-white text-[12px] font-semibold">Keynote Speaker</div>
          <div className="text-white/60 text-[9px]">Building the Future of Platform Engineering</div>
        </div>
        <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0 text-white/60 hover:text-white"><Maximize className="h-3.5 w-3.5" /></Button>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border bg-card p-3 flex items-center justify-center gap-2">
        <Button variant={micOn ? 'outline' : 'destructive'} size="sm" className="h-9 w-9 p-0 rounded-xl" onClick={() => setMicOn(!micOn)}>
          {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
        <Button variant={videoOn ? 'outline' : 'destructive'} size="sm" className="h-9 w-9 p-0 rounded-xl" onClick={() => setVideoOn(!videoOn)}>
          {videoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl"><Monitor className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl"><Hand className="h-4 w-4" /></Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl" onClick={() => setChatOpen(!chatOpen)}><MessageSquare className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl"><Users className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl"><Share2 className="h-4 w-4" /></Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button variant="destructive" size="sm" className="h-9 px-4 rounded-xl gap-1 text-[10px]"><PhoneOff className="h-3.5 w-3.5" />Leave</Button>
      </div>
    </DashboardLayout>
  );
};

export default EventLiveRoomPage;
