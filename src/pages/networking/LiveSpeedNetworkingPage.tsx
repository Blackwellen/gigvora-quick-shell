import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Zap, Clock, UserPlus, MessageSquare, Star, SkipForward, ThumbsUp, Video, Mic } from 'lucide-react';

const MATCH = { name: 'Elena Vasquez', avatar: 'EV', headline: 'VP Engineering @ Cloudflare', location: 'Austin, TX', mutual: 8, interests: ['AI', 'Engineering Leadership', 'Cloud'] };

const POST_SESSION = [
  { name: 'Elena Vasquez', avatar: 'EV', headline: 'VP Engineering @ Cloudflare', rating: 5, connected: true },
  { name: 'Raj Krishnan', avatar: 'RK', headline: 'Principal Architect @ AWS', rating: 4, connected: true },
  { name: 'Sophie Larsson', avatar: 'SL', headline: 'Head of Design @ Canva', rating: 3, connected: false },
  { name: 'Omar Hassan', avatar: 'OH', headline: 'ML Research Lead @ DeepMind', rating: 5, connected: false },
];

export default function LiveSpeedNetworkingPage() {
  const [phase, setPhase] = useState<'active' | 'review'>('active');
  const [timer, setTimer] = useState(180);
  const round = 3;
  const totalRounds = 5;

  useEffect(() => {
    if (phase !== 'active' || timer <= 0) return;
    const t = setInterval(() => setTimer(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timer]);

  const mins = Math.floor(timer / 60);
  const secs = timer % 60;

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <Zap className="h-4 w-4 text-[hsl(var(--gigvora-amber))]" />
          <h1 className="text-sm font-bold">Speed Networking</h1>
          <StatusBadge status="live" />
          <Badge variant="secondary" className="text-[9px]">Round {round}/{totalRounds}</Badge>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setPhase(phase === 'active' ? 'review' : 'active')}>
            {phase === 'active' ? 'End Session' : 'Back to Session'}
          </Button>
        </div>
      }
    >
      {phase === 'active' ? (
        <>
          {/* Timer */}
          <div className="text-center py-6">
            <div className="text-5xl font-bold font-mono tracking-tight">{mins}:{secs.toString().padStart(2, '0')}</div>
            <Progress value={(timer / 180) * 100} className="h-2 max-w-xs mx-auto mt-3" />
            <p className="text-[10px] text-muted-foreground mt-2">Round {round} of {totalRounds} · 3 min per intro</p>
          </div>

          {/* Current Match */}
          <SectionCard title="Your Match" icon={<Zap className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" />}>
            <div className="flex items-center gap-6 py-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-xl bg-accent/10 text-accent">{MATCH.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-lg font-bold">{MATCH.name}</div>
                <div className="text-sm text-muted-foreground">{MATCH.headline}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{MATCH.location} · {MATCH.mutual} mutual connections</div>
                <div className="flex items-center gap-1 mt-2">
                  {MATCH.interests.map(i => <Badge key={i} variant="outline" className="text-[8px] h-4 px-1.5">{i}</Badge>)}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Video Controls */}
          <div className="flex items-center justify-center gap-4 mt-6 p-4 rounded-2xl bg-muted/30 border">
            <Button variant="outline" size="lg" className="h-12 w-12 rounded-full p-0"><Video className="h-5 w-5" /></Button>
            <Button variant="outline" size="lg" className="h-12 w-12 rounded-full p-0"><Mic className="h-5 w-5" /></Button>
            <Button variant="outline" size="lg" className="h-12 w-12 rounded-full p-0"><MessageSquare className="h-5 w-5" /></Button>
            <Button variant="outline" size="lg" className="h-12 px-6 rounded-full text-sm gap-2"><SkipForward className="h-4 w-4" /> Skip</Button>
            <Button size="lg" className="h-12 px-6 rounded-full text-sm gap-2"><UserPlus className="h-4 w-4" /> Connect</Button>
          </div>
        </>
      ) : (
        /* Post-Session Review */
        <SectionCard title="Session Summary" subtitle="Rate your intros and connect" icon={<Star className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" />}>
          <div className="space-y-3">
            {POST_SESSION.map(p => (
              <div key={p.name} className="flex items-center gap-4 p-3.5 rounded-xl border border-border/40">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs bg-accent/10 text-accent">{p.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground">{p.headline}</div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`h-3.5 w-3.5 ${s <= p.rating ? 'text-[hsl(var(--gigvora-amber))] fill-[hsl(var(--gigvora-amber))]' : 'text-muted-foreground/30'}`} />
                  ))}
                </div>
                {p.connected ? (
                  <Badge className="text-[8px] h-4 bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0">Connected</Badge>
                ) : (
                  <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><UserPlus className="h-2.5 w-2.5" /> Connect</Button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-accent/5 border border-accent/20">
            <div className="text-[10px] font-medium text-accent mb-1">AI Recommendations</div>
            <p className="text-[9px] text-muted-foreground">Based on your ratings, you should follow up with <strong>Elena Vasquez</strong> and <strong>Omar Hassan</strong>. Consider scheduling a deeper 1:1 conversation within the next 48 hours for best connection outcomes.</p>
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
