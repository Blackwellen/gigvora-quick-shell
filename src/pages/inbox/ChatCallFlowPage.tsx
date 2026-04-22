import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, Video, Mic, MicOff, VideoOff, Monitor, PhoneOff, MessageSquare, Users, Clock, ScreenShare } from 'lucide-react';

export default function ChatCallFlowPage() {
  const [callState, setCallState] = useState<'ringing' | 'active' | 'ended'>('active');
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-2 w-full">
          <Video className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold">Video Call</span>
          <StatusBadge status={callState === 'active' ? 'healthy' : callState === 'ringing' ? 'caution' : 'pending'} label={callState === 'active' ? 'Connected' : callState === 'ringing' ? 'Ringing...' : 'Ended'} />
          <div className="flex-1" />
          {callState === 'active' && <div className="flex items-center gap-1 text-[9px] text-muted-foreground"><Clock className="h-3 w-3" />12:34</div>}
          <div className="flex items-center gap-1 text-[8px] text-muted-foreground"><Users className="h-3 w-3" />2 participants</div>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Participants">
            {[{ name: 'Sarah Chen', status: 'Connected', muted: false }, { name: 'You', status: 'Connected', muted }].map((p, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5">
                <Avatar className="h-5 w-5"><AvatarFallback className="text-[6px] bg-accent/10 text-accent">{p.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                <div className="flex-1"><div className="text-[8px] font-semibold">{p.name}</div><div className="text-[7px] text-muted-foreground">{p.status}</div></div>
                {p.muted && <MicOff className="h-2.5 w-2.5 text-[hsl(var(--state-critical))]" />}
              </div>
            ))}
          </SectionCard>
          <SectionCard title="Call Actions">
            <div className="space-y-1">
              <Button variant="outline" size="sm" className="w-full h-6 text-[8px] rounded-lg gap-0.5 justify-start"><MessageSquare className="h-2.5 w-2.5" />Open Chat</Button>
              <Button variant="outline" size="sm" className="w-full h-6 text-[8px] rounded-lg gap-0.5 justify-start"><ScreenShare className="h-2.5 w-2.5" />Share Screen</Button>
              <Button variant="outline" size="sm" className="w-full h-6 text-[8px] rounded-lg gap-0.5 justify-start"><Monitor className="h-2.5 w-2.5" />Record</Button>
            </div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-44"
    >
      {callState === 'active' && (
        <div className="flex flex-col items-center">
          <div className="relative w-full aspect-video rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/20 flex items-center justify-center mb-4">
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto mb-2"><AvatarFallback className="text-lg bg-accent/10 text-accent font-bold">SC</AvatarFallback></Avatar>
              <p className="text-sm font-bold">Sarah Chen</p>
              <p className="text-[9px] text-muted-foreground">Senior Designer</p>
            </div>
            <div className="absolute bottom-3 right-3 w-28 aspect-video rounded-xl bg-muted/50 border border-border/30 flex items-center justify-center">
              <Avatar className="h-8 w-8"><AvatarFallback className="text-[8px] bg-muted text-muted-foreground">YO</AvatarFallback></Avatar>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setMuted(!muted)} className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-colors ${muted ? 'bg-[hsl(var(--state-critical))] text-white' : 'bg-muted/50 text-foreground hover:bg-muted'}`}>{muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</button>
            <button onClick={() => setVideoOn(!videoOn)} className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-colors ${!videoOn ? 'bg-[hsl(var(--state-critical))] text-white' : 'bg-muted/50 text-foreground hover:bg-muted'}`}>{videoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}</button>
            <button className="h-10 w-10 rounded-2xl bg-muted/50 text-foreground hover:bg-muted flex items-center justify-center"><Monitor className="h-4 w-4" /></button>
            <button onClick={() => setCallState('ended')} className="h-10 w-10 rounded-2xl bg-[hsl(var(--state-critical))] text-white flex items-center justify-center hover:opacity-90"><PhoneOff className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {callState === 'ended' && (
        <SectionCard className="!rounded-2xl text-center py-8">
          <PhoneOff className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <h2 className="text-sm font-bold mb-1">Call Ended</h2>
          <p className="text-[9px] text-muted-foreground mb-3">Duration: 12 minutes 34 seconds</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5" onClick={() => setCallState('active')}><Phone className="h-3 w-3" />Call Again</Button>
            <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><MessageSquare className="h-3 w-3" />Message</Button>
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
