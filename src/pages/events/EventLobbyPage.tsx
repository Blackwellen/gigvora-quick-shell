import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Clock, Users, Video, Calendar, Bell, Share2, Heart,
  MessageSquare, ArrowRight, Wifi, Volume2, Mic, Settings,
  Zap, Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SPEAKERS = [
  { name: 'Sarah Chen', role: 'Host · Product Lead', initials: 'SC' },
  { name: 'James Wilson', role: 'Panelist · Engineering', initials: 'JW' },
  { name: 'Priya Sharma', role: 'Panelist · Design', initials: 'PS' },
];

const ATTENDEES = [
  { name: 'Alex M.', initials: 'AM' }, { name: 'Jordan K.', initials: 'JK' },
  { name: 'Taylor R.', initials: 'TR' }, { name: 'Morgan L.', initials: 'ML' },
  { name: 'Casey D.', initials: 'CD' }, { name: 'Riley S.', initials: 'RS' },
];

const AGENDA = [
  { time: '3:00 PM', title: 'Welcome & Introductions', duration: '5 min' },
  { time: '3:05 PM', title: 'Keynote: Scaling Design Systems', duration: '25 min' },
  { time: '3:30 PM', title: 'Panel Discussion', duration: '20 min' },
  { time: '3:50 PM', title: 'Q&A Session', duration: '10 min' },
  { time: '4:00 PM', title: 'Networking & Wrap-up', duration: '15 min' },
];

export default function EventLobbyPage() {
  const { eventId } = useParams();
  const [countdown, setCountdown] = useState({ mins: 12, secs: 45 });
  const [systemCheck] = useState({ camera: true, mic: true, network: true, audio: true });

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { mins: prev.mins - 1, secs: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Speakers">
        <div className="space-y-2">
          {SPEAKERS.map(s => (
            <div key={s.name} className="flex items-center gap-2">
              <Avatar className="h-8 w-8 rounded-xl">
                <AvatarFallback className="rounded-xl bg-accent/10 text-accent text-[8px] font-bold">{s.initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-[10px] font-semibold">{s.name}</div>
                <div className="text-[8px] text-muted-foreground">{s.role}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Agenda">
        <div className="space-y-1.5">
          {AGENDA.map((a, i) => (
            <div key={i} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-muted/20 transition-colors">
              <span className="text-[8px] text-accent font-mono font-semibold w-14 shrink-0">{a.time}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-semibold truncate">{a.title}</div>
                <div className="text-[7px] text-muted-foreground">{a.duration}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title={`Attendees (${ATTENDEES.length + 156})`}>
        <div className="flex flex-wrap gap-1">
          {ATTENDEES.map(a => (
            <Avatar key={a.name} className="h-7 w-7 rounded-lg">
              <AvatarFallback className="rounded-lg bg-muted text-muted-foreground text-[7px] font-semibold">{a.initials}</AvatarFallback>
            </Avatar>
          ))}
          <div className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center text-[7px] text-muted-foreground font-medium">+156</div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={
      <>
        <div className="h-2 w-2 rounded-full bg-[hsl(var(--state-live))] animate-pulse" />
        <span className="text-xs font-semibold">Event Lobby</span>
        <div className="flex-1" />
        <Badge variant="outline" className="text-[9px] rounded-lg gap-1"><Globe className="h-3 w-3" /> Public Event</Badge>
        <Link to={`/events/${eventId || '1'}`} className="text-[9px] text-accent font-medium flex items-center gap-0.5 hover:underline">
          Event Detail <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </>
    } rightRail={rightRail} rightRailWidth="w-56">
      {/* Countdown Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-accent/10 via-[hsl(var(--gigvora-purple))]/5 to-background border p-8 text-center mb-4">
        <Badge className="text-[9px] bg-[hsl(var(--state-live))]/10 text-[hsl(var(--state-live))] border-0 mb-3 mx-auto">
          <Zap className="h-3 w-3 mr-0.5" /> Starting Soon
        </Badge>
        <h2 className="text-xl font-bold mb-1">Scaling Design Systems at Enterprise</h2>
        <p className="text-[11px] text-muted-foreground mb-4">Live panel discussion with industry leaders</p>
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-accent font-mono">{String(countdown.mins).padStart(2, '0')}</div>
            <div className="text-[9px] text-muted-foreground">minutes</div>
          </div>
          <span className="text-2xl text-muted-foreground/40 font-bold">:</span>
          <div className="text-center">
            <div className="text-4xl font-bold text-accent font-mono">{String(countdown.secs).padStart(2, '0')}</div>
            <div className="text-[9px] text-muted-foreground">seconds</div>
          </div>
        </div>
        <Button size="lg" className="h-11 px-8 rounded-xl gap-1.5 text-sm" disabled={countdown.mins > 0}>
          <Video className="h-4 w-4" /> Join Event
        </Button>
        <p className="text-[8px] text-muted-foreground mt-2">You'll be let in when the event starts</p>
      </div>

      {/* System Check */}
      <SectionCard title="System Check" icon={<Settings className="h-3.5 w-3.5 text-accent" />} className="mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Camera', icon: Video, ok: systemCheck.camera },
            { label: 'Microphone', icon: Mic, ok: systemCheck.mic },
            { label: 'Network', icon: Wifi, ok: systemCheck.network },
            { label: 'Audio', icon: Volume2, ok: systemCheck.audio },
          ].map(c => (
            <div key={c.label} className={cn(
              'flex items-center gap-2 p-3 rounded-xl border transition-all',
              c.ok ? 'border-[hsl(var(--state-healthy))]/30 bg-[hsl(var(--state-healthy))]/5' : 'border-destructive/30 bg-destructive/5'
            )}>
              <c.icon className={cn('h-4 w-4', c.ok ? 'text-[hsl(var(--state-healthy))]' : 'text-destructive')} />
              <div>
                <div className="text-[10px] font-semibold">{c.label}</div>
                <div className={cn('text-[8px]', c.ok ? 'text-[hsl(var(--state-healthy))]' : 'text-destructive')}>
                  {c.ok ? 'Ready' : 'Issue detected'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Event Info */}
      <SectionCard title="Event Details">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px]">
          <div>
            <span className="text-[8px] text-muted-foreground block">Date</span>
            <span className="font-semibold flex items-center gap-1"><Calendar className="h-3 w-3" /> Apr 20, 2026</span>
          </div>
          <div>
            <span className="text-[8px] text-muted-foreground block">Time</span>
            <span className="font-semibold flex items-center gap-1"><Clock className="h-3 w-3" /> 3:00 – 4:15 PM EST</span>
          </div>
          <div>
            <span className="text-[8px] text-muted-foreground block">Format</span>
            <span className="font-semibold flex items-center gap-1"><Video className="h-3 w-3" /> Virtual Live</span>
          </div>
          <div>
            <span className="text-[8px] text-muted-foreground block">Attendees</span>
            <span className="font-semibold flex items-center gap-1"><Users className="h-3 w-3" /> 162 registered</span>
          </div>
        </div>
      </SectionCard>

      {/* Quick Actions */}
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl gap-1 flex-1"><Bell className="h-3 w-3" /> Reminder</Button>
        <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl gap-1 flex-1"><Share2 className="h-3 w-3" /> Share</Button>
        <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl gap-1 flex-1"><MessageSquare className="h-3 w-3" /> Pre-Chat</Button>
        <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl gap-1 flex-1"><Heart className="h-3 w-3" /> Save</Button>
      </div>
    </DashboardLayout>
  );
}
