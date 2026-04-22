import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Zap, Users, Clock, Timer, ArrowRight, Play, Pause,
  MessageSquare, UserPlus, QrCode, Star, Shield,
  Sparkles, ChevronLeft, Video, Mic, MicOff, VideoOff,
  Share2, Heart, X, CheckCircle2, Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOCK_USERS } from '@/data/mock';

type LobbyState = 'intent' | 'queue' | 'matched' | 'session' | 'recap';

const INTENTS = [
  { id: 'collaborate', label: 'Find Collaborators', desc: 'Connect with people who complement your skills', icon: '🤝' },
  { id: 'hire', label: 'Hire or Get Hired', desc: 'Meet recruiters or candidates directly', icon: '💼' },
  { id: 'mentor', label: 'Find a Mentor/Advisor', desc: 'Get matched with experienced professionals', icon: '🎓' },
  { id: 'partner', label: 'Business Partnership', desc: 'Explore partnership opportunities', icon: '🚀' },
  { id: 'learn', label: 'Learn & Grow', desc: 'Meet people in your field of interest', icon: '📚' },
  { id: 'social', label: 'Just Network', desc: 'Open to meeting anyone interesting', icon: '☕' },
];

const SpeedNetworkingLobbyPage: React.FC = () => {
  const [state, setState] = useState<LobbyState>('intent');
  const [selectedIntent, setSelectedIntent] = useState('');
  const [queuePosition, setQueuePosition] = useState(5);
  const [timer, setTimer] = useState(300); // 5-min round
  const [matchedPerson, setMatchedPerson] = useState(MOCK_USERS[0]);
  const [roundNumber, setRoundNumber] = useState(1);
  const [videoOn, setVideoOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [notes, setNotes] = useState('');
  const [exchangeCard, setExchangeCard] = useState(false);
  const [rating, setRating] = useState(0);

  // Queue countdown simulation
  useEffect(() => {
    if (state !== 'queue') return;
    const interval = setInterval(() => {
      setQueuePosition(p => {
        if (p <= 1) {
          clearInterval(interval);
          setState('matched');
          return 0;
        }
        return p - 1;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [state]);

  // Session timer
  useEffect(() => {
    if (state !== 'session') return;
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 0) {
          clearInterval(interval);
          setState('recap');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Intent Selection ──
  if (state === 'intent') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link to="/networking" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4" /> Back to Networking
        </Link>
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Speed Networking</h1>
          <p className="text-muted-foreground">Define your networking intent to get better matches</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {INTENTS.map(intent => (
            <button
              key={intent.id}
              onClick={() => setSelectedIntent(intent.id)}
              className={cn(
                'text-left p-4 rounded-xl border transition-all',
                selectedIntent === intent.id ? 'border-accent bg-accent/5 shadow-md' : 'hover:border-accent/50 hover:bg-muted/30'
              )}
            >
              <div className="text-2xl mb-2">{intent.icon}</div>
              <div className="font-semibold text-sm">{intent.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{intent.desc}</div>
            </button>
          ))}
        </div>
        <Button className="w-full gap-2" size="lg" disabled={!selectedIntent} onClick={() => setState('queue')}>
          <Zap className="h-4 w-4" /> Join Queue
        </Button>
      </div>
    );
  }

  // ── Queue ──
  if (state === 'queue') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Users className="h-10 w-10 text-accent" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Finding your match...</h1>
        <p className="text-muted-foreground mb-6">AI is pairing you with the best match based on your intent and profile</p>
        <div className="rounded-xl border bg-card p-6 mb-4">
          <div className="text-sm text-muted-foreground mb-2">Queue Position</div>
          <div className="text-4xl font-bold text-accent mb-2">#{queuePosition}</div>
          <Progress value={(1 - queuePosition / 5) * 100} className="h-2" />
          <div className="text-xs text-muted-foreground mt-2">{queuePosition * 2} seconds estimated</div>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" /> 18 people in this session
        </div>
        <Button variant="outline" className="mt-6" onClick={() => setState('intent')}>Leave Queue</Button>
      </div>
    );
  }

  // ── Match Found ──
  if (state === 'matched') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="mb-6">
          <Badge className="bg-accent/10 text-accent border-accent/20 text-xs mb-4">Round {roundNumber}</Badge>
          <h1 className="text-2xl font-bold mb-2">Match Found! 🎉</h1>
          <p className="text-muted-foreground">You've been paired with</p>
        </div>
        <div className="rounded-xl border bg-card p-6 mb-6">
          <Avatar className="h-20 w-20 mx-auto mb-3">
            <AvatarFallback className="bg-accent/10 text-accent text-2xl">{matchedPerson.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <h2 className="font-bold text-lg">{matchedPerson.name}</h2>
          <p className="text-sm text-muted-foreground mb-3">{matchedPerson.headline}</p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="text-[10px]"><Sparkles className="h-3 w-3 mr-1" /> 92% match</Badge>
            {matchedPerson.verified && <Badge variant="secondary" className="text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Verified</Badge>}
          </div>
          <div className="mt-3 flex flex-wrap gap-1 justify-center">
            <Badge variant="outline" className="text-[10px]">React</Badge>
            <Badge variant="outline" className="text-[10px]">Design</Badge>
            <Badge variant="outline" className="text-[10px]">Leadership</Badge>
          </div>
        </div>
        <Button className="w-full gap-2" size="lg" onClick={() => { setTimer(300); setState('session'); }}>
          <Video className="h-4 w-4" /> Start {formatTime(300)} Session
        </Button>
      </div>
    );
  }

  // ── Live Session ──
  if (state === 'session') {
    const pct = (timer / 300) * 100;
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Timer bar */}
        <div className="flex items-center gap-3 mb-4">
          <Badge variant={timer < 60 ? 'destructive' : 'secondary'} className="gap-1">
            <Timer className="h-3 w-3" /> {formatTime(timer)}
          </Badge>
          <Progress value={pct} className="flex-1 h-2" />
          <Badge variant="secondary" className="text-[10px]">Round {roundNumber}</Badge>
        </div>

        <div className="grid md:grid-cols-[1fr_280px] gap-4">
          {/* Video area */}
          <div className="space-y-3">
            <div className="aspect-video rounded-xl bg-foreground/5 border flex items-center justify-center relative overflow-hidden">
              <div className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-3">
                  <AvatarFallback className="bg-accent/10 text-accent text-3xl">{matchedPerson.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="font-semibold">{matchedPerson.name}</div>
                <div className="text-sm text-muted-foreground">{matchedPerson.headline}</div>
              </div>
              {/* Self preview */}
              <div className="absolute bottom-3 right-3 h-28 w-40 rounded-lg bg-foreground/10 border flex items-center justify-center">
                <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary text-primary-foreground text-xs">DU</AvatarFallback></Avatar>
              </div>
            </div>
            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button variant={micOn ? 'secondary' : 'destructive'} size="icon" className="h-10 w-10 rounded-full" onClick={() => setMicOn(!micOn)}>
                {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button variant={videoOn ? 'secondary' : 'destructive'} size="icon" className="h-10 w-10 rounded-full" onClick={() => setVideoOn(!videoOn)}>
                {videoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              <Button variant="destructive" size="icon" className="h-10 w-10 rounded-full" onClick={() => setState('recap')}>
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" className="h-10 w-10 rounded-full">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-3">
            <div className="rounded-xl border bg-card p-4">
              <h3 className="font-semibold text-xs mb-2">About {matchedPerson.name.split(' ')[0]}</h3>
              <p className="text-xs text-muted-foreground mb-2">{matchedPerson.headline}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {['React', 'Design', 'Leadership'].map(s => <Badge key={s} variant="secondary" className="text-[10px] py-0">{s}</Badge>)}
              </div>
              <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px]"><Sparkles className="h-3 w-3 mr-1" /> 92% match</Badge>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <h3 className="font-semibold text-xs mb-2">Session Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Take notes during the conversation..."
                className="w-full bg-background border rounded-lg p-2 text-xs resize-none h-24 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <Button variant="outline" className="w-full gap-1.5 text-xs h-8" onClick={() => setExchangeCard(true)} disabled={exchangeCard}>
              <QrCode className="h-3.5 w-3.5" /> {exchangeCard ? 'Card Exchanged ✓' : 'Exchange Digital Cards'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Recap ──
  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Session Complete! 🎉</h1>
        <p className="text-muted-foreground">Round {roundNumber} with {matchedPerson.name}</p>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        {/* Rate */}
        <div>
          <h3 className="font-semibold text-sm mb-2">Rate this conversation</h3>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} onClick={() => setRating(i)}>
                <Star className={cn('h-6 w-6', i <= rating ? 'fill-gigvora-amber text-gigvora-amber' : 'text-muted')} />
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <h3 className="font-semibold text-sm mb-2">Session Notes</h3>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Key takeaways..." className="w-full bg-background border rounded-lg p-3 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Follow-up Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="gap-1 h-8 text-xs"><UserPlus className="h-3 w-3" /> Connect</Button>
            <Button variant="outline" size="sm" className="gap-1 h-8 text-xs"><MessageSquare className="h-3 w-3" /> Message</Button>
            <Button variant="outline" size="sm" className="gap-1 h-8 text-xs"><QrCode className="h-3 w-3" /> Exchange Card</Button>
            <Button variant="outline" size="sm" className="gap-1 h-8 text-xs"><Star className="h-3 w-3" /> Add to Favorites</Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <Button className="flex-1 gap-1.5" onClick={() => {
          setRoundNumber(r => r + 1);
          setMatchedPerson(MOCK_USERS[(roundNumber) % MOCK_USERS.length]);
          setNotes('');
          setExchangeCard(false);
          setRating(0);
          setState('matched');
        }}>
          <Zap className="h-4 w-4" /> Next Round
        </Button>
        <Button variant="outline" asChild>
          <Link to="/networking">Finish</Link>
        </Button>
      </div>
    </div>
  );
};

export default SpeedNetworkingLobbyPage;
