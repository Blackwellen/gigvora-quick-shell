import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Zap, Users, Video, Mic, Calendar, Clock, MapPin,
  Star, ArrowRight, Play, Search, Filter, Globe,
  Sparkles, UserPlus, MessageSquare, Shield, Award,
  Radio, Headphones, Coffee, Handshake, Target,
  QrCode, CreditCard, Heart, TrendingUp, Timer,
  Share2, BookmarkPlus, ChevronRight, ExternalLink,
  Wifi, Phone, BarChart3, Loader2, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOCK_USERS, MOCK_SUGGESTED_CONNECTIONS } from '@/data/mock';
import { useAI } from '@/hooks/useAI';
import { toast } from 'sonner';

// ── Mock data for networking ──
const MOCK_ROOMS = [
  { id: 'r1', title: 'Tech Leaders Roundtable', type: 'video' as const, category: 'Technology', host: MOCK_USERS[5], participants: 12, maxParticipants: 20, live: true, scheduled: null, tags: ['leadership', 'tech', 'management'], description: 'Open discussion for tech leads and engineering managers.' },
  { id: 'r2', title: 'Startup Founders Coffee Chat', type: 'audio' as const, category: 'Entrepreneurship', host: MOCK_USERS[3], participants: 8, maxParticipants: 15, live: true, scheduled: null, tags: ['startups', 'founders', 'networking'], description: 'Casual audio room for founders to connect and share insights.' },
  { id: 'r3', title: 'Design Systems Workshop', type: 'video' as const, category: 'Design', host: MOCK_USERS[0], participants: 0, maxParticipants: 30, live: false, scheduled: 'Apr 10, 2:00 PM', tags: ['design', 'systems', 'figma'], description: 'Deep dive into building scalable design systems.' },
  { id: 'r4', title: 'Freelancer Mastermind', type: 'audio' as const, category: 'Freelancing', host: MOCK_USERS[2], participants: 5, maxParticipants: 10, live: true, scheduled: null, tags: ['freelancing', 'business', 'growth'], description: 'Weekly mastermind for freelancers to share challenges and wins.' },
  { id: 'r5', title: 'AI in Recruitment', type: 'video' as const, category: 'HR & Recruitment', host: MOCK_USERS[1], participants: 0, maxParticipants: 25, live: false, scheduled: 'Apr 12, 10:00 AM', tags: ['ai', 'recruitment', 'hr'], description: 'How AI is transforming the hiring landscape.' },
  { id: 'r6', title: 'Marketing Strategy Circle', type: 'audio' as const, category: 'Marketing', host: MOCK_USERS[4], participants: 6, maxParticipants: 12, live: true, scheduled: null, tags: ['marketing', 'strategy', 'growth'], description: 'Share and discuss marketing strategies that work.' },
];

const SPEED_NETWORKING_EVENTS = [
  { id: 'sn1', title: 'Speed Networking: Tech Professionals', date: 'Today, 3:00 PM', duration: '45 min', format: '5-min rounds', participants: 24, maxParticipants: 30, matchType: 'AI-matched', status: 'open' as const, tags: ['tech', 'engineering', 'design'] },
  { id: 'sn2', title: 'Founder ↔ Advisor Speed Connect', date: 'Apr 10, 11:00 AM', duration: '60 min', format: '7-min rounds', participants: 16, maxParticipants: 20, matchType: 'Intent-based', status: 'open' as const, tags: ['founders', 'advisors', 'mentorship'] },
  { id: 'sn3', title: 'Recruiter ↔ Candidate Match', date: 'Apr 11, 2:00 PM', duration: '30 min', format: '4-min rounds', participants: 30, maxParticipants: 30, matchType: 'Skill-matched', status: 'full' as const, tags: ['hiring', 'careers', 'recruitment'] },
  { id: 'sn4', title: 'Creative Industry Mixer', date: 'Apr 14, 4:00 PM', duration: '45 min', format: '5-min rounds', participants: 8, maxParticipants: 24, matchType: 'AI-matched', status: 'open' as const, tags: ['design', 'content', 'marketing'] },
];

const FOLLOW_UP_QUEUE = [
  { id: 'f1', person: MOCK_USERS[0], metAt: 'Tech Leaders Roundtable', when: '2 hours ago', intent: 'Potential collaborator', notes: 'Discussed design system consultation. Follow up with portfolio.', priority: 'high' as const },
  { id: 'f2', person: MOCK_USERS[3], metAt: 'Founder Speed Connect', when: 'Yesterday', intent: 'Advisor match', notes: 'Interested in advising on go-to-market. Send pitch deck.', priority: 'high' as const },
  { id: 'f3', person: MOCK_USERS[4], metAt: 'Marketing Circle', when: '2 days ago', intent: 'Potential client', notes: 'Needs marketing strategy for Q3 launch.', priority: 'medium' as const },
  { id: 'f4', person: MOCK_USERS[6], metAt: 'UX Research Room', when: '3 days ago', intent: 'Peer connection', notes: 'Shared research methodologies. Great conversation.', priority: 'low' as const },
];

const DIGITAL_CARDS = [
  { id: 'dc1', person: MOCK_USERS[0], exchangedAt: 'Tech Leaders Roundtable', date: '2 hours ago', tags: ['design', 'figma'] },
  { id: 'dc2', person: MOCK_USERS[3], exchangedAt: 'Founder Speed Connect', date: 'Yesterday', tags: ['startup', 'ai'] },
  { id: 'dc3', person: MOCK_USERS[1], exchangedAt: 'Recruiter Mixer', date: '3 days ago', tags: ['hiring', 'talent'] },
];

// ── Room Card ──
const RoomCard: React.FC<{ room: typeof MOCK_ROOMS[0] }> = ({ room }) => (
  <div className="rounded-xl border bg-card hover:shadow-card-hover transition-all group">
    <div className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {room.live ? (
            <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1 text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" /> LIVE
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] gap-1"><Calendar className="h-3 w-3" /> Scheduled</Badge>
          )}
          <Badge variant="outline" className="text-[10px]">
            {room.type === 'video' ? <Video className="h-3 w-3 mr-1" /> : <Mic className="h-3 w-3 mr-1" />}
            {room.type === 'video' ? 'Video' : 'Audio'}
          </Badge>
        </div>
        <Badge variant="secondary" className="text-[10px]">{room.category}</Badge>
      </div>
      <h3 className="font-semibold text-sm mb-1 group-hover:text-accent transition-colors">{room.title}</h3>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{room.description}</p>
      <div className="flex items-center gap-2 mb-3">
        <Avatar className="h-6 w-6"><AvatarFallback className="text-[9px] bg-accent/10 text-accent">{room.host.name[0]}</AvatarFallback></Avatar>
        <span className="text-xs text-muted-foreground">Hosted by <span className="font-medium text-foreground">{room.host.name}</span></span>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {room.tags.map(t => <span key={t} className="text-[10px] text-accent bg-accent/5 rounded-full px-2 py-0.5">#{t}</span>)}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{room.participants}/{room.maxParticipants}</span>
          {room.scheduled && <span className="ml-2 flex items-center gap-1"><Clock className="h-3 w-3" /> {room.scheduled}</span>}
        </div>
        <Button size="sm" className="h-7 text-xs gap-1" disabled={!room.live && !room.scheduled}>
          {room.live ? <><Play className="h-3 w-3" /> Join</> : <><Calendar className="h-3 w-3" /> RSVP</>}
        </Button>
      </div>
    </div>
  </div>
);

// ── Speed Networking Card ──
const SpeedNetworkingCard: React.FC<{ event: typeof SPEED_NETWORKING_EVENTS[0] }> = ({ event }) => (
  <div className="rounded-xl border bg-card hover:shadow-card-hover transition-all overflow-hidden">
    <div className="h-2 bg-gradient-to-r from-accent to-primary" />
    <div className="p-5">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="h-4 w-4 text-accent" />
        <h3 className="font-semibold text-sm">{event.title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {event.date}</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {event.duration}</span>
        <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {event.format}</span>
        <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> {event.matchType}</span>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {event.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px] py-0">{t}</Badge>)}
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{event.participants}</span>/{event.maxParticipants} joined
        </div>
        <Button size="sm" className="h-7 text-xs gap-1" disabled={event.status === 'full'} variant={event.status === 'full' ? 'secondary' : 'default'}>
          {event.status === 'full' ? 'Waitlist' : <><Zap className="h-3 w-3" /> Join Queue</>}
        </Button>
      </div>
    </div>
  </div>
);

// ── Follow-up Item ──
const FollowUpItem: React.FC<{ item: typeof FOLLOW_UP_QUEUE[0] }> = ({ item }) => {
  const priorityColors = { high: 'text-destructive', medium: 'text-gigvora-amber', low: 'text-muted-foreground' };
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border bg-card hover:shadow-card-hover transition-all">
      <Avatar className="h-10 w-10 shrink-0"><AvatarFallback className="bg-accent/10 text-accent text-xs">{item.person.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-sm">{item.person.name}</span>
          <span className={cn('text-[10px] font-semibold uppercase', priorityColors[item.priority])}>{item.priority}</span>
        </div>
        <div className="text-xs text-muted-foreground mb-1">Met at {item.metAt} · {item.when}</div>
        <Badge variant="secondary" className="text-[10px] mb-1.5">{item.intent}</Badge>
        <p className="text-xs text-muted-foreground">{item.notes}</p>
        <div className="flex gap-1.5 mt-2">
          <Button size="sm" className="h-6 text-[11px] px-2 gap-1"><MessageSquare className="h-3 w-3" /> Message</Button>
          <Button size="sm" variant="outline" className="h-6 text-[11px] px-2 gap-1"><UserPlus className="h-3 w-3" /> Connect</Button>
          <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2 gap-1"><Calendar className="h-3 w-3" /> Schedule</Button>
        </div>
      </div>
    </div>
  );
};

// ── Digital Business Card ──
const DigitalCardItem: React.FC<{ card: typeof DIGITAL_CARDS[0] }> = ({ card }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
    <Avatar className="h-10 w-10"><AvatarFallback className="bg-accent/10 text-accent text-xs">{card.person.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
    <div className="flex-1 min-w-0">
      <div className="font-medium text-sm truncate">{card.person.name}</div>
      <div className="text-xs text-muted-foreground truncate">{card.person.headline}</div>
      <div className="text-[10px] text-muted-foreground">Exchanged at {card.exchangedAt} · {card.date}</div>
    </div>
    <div className="flex gap-1 shrink-0">
      <Button variant="ghost" size="icon" className="h-7 w-7"><Share2 className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-3.5 w-3.5" /></Button>
    </div>
  </div>
);

// ── Networking Intent Selector ──
const NetworkingIntentSelector: React.FC<{ selected: string; onSelect: (v: string) => void }> = ({ selected, onSelect }) => {
  const intents = [
    { id: 'all', label: 'All', icon: Globe },
    { id: 'collaborate', label: 'Collaborate', icon: Handshake },
    { id: 'hire', label: 'Hire/Get Hired', icon: Target },
    { id: 'mentor', label: 'Mentor/Advise', icon: Award },
    { id: 'partner', label: 'Partnership', icon: CreditCard },
    { id: 'learn', label: 'Learn', icon: Coffee },
  ];
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {intents.map(i => (
        <button
          key={i.id}
          onClick={() => onSelect(i.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
            selected === i.id ? 'bg-accent text-accent-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}
        >
          <i.icon className="h-3.5 w-3.5" /> {i.label}
        </button>
      ))}
    </div>
  );
};

// ── Relationship Strength Chips ──
const RelationshipStrength: React.FC = () => (
  <div className="rounded-xl border bg-card p-5">
    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" /> Relationship Strength</h3>
    <div className="space-y-2.5">
      {[
        { label: 'Strong (10+ interactions)', count: 12, color: 'bg-gigvora-green' },
        { label: 'Growing (3-9 interactions)', count: 28, color: 'bg-accent' },
        { label: 'New (1-2 interactions)', count: 45, color: 'bg-muted-foreground' },
      ].map(s => (
        <div key={s.label} className="flex items-center gap-3">
          <div className={cn('h-2.5 w-2.5 rounded-full', s.color)} />
          <div className="flex-1 text-xs text-muted-foreground">{s.label}</div>
          <span className="text-sm font-semibold">{s.count}</span>
        </div>
      ))}
    </div>
  </div>
);

// ── Connection Timeline ──
const ConnectionTimeline: React.FC = () => (
  <div className="rounded-xl border bg-card p-5">
    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" /> This Week's Activity</h3>
    <div className="space-y-3">
      {[
        { action: 'Connected with Sarah Chen', time: '2h ago', icon: UserPlus },
        { action: 'Exchanged cards with Alex Kim', time: '5h ago', icon: QrCode },
        { action: 'Joined Tech Leaders Roundtable', time: 'Yesterday', icon: Video },
        { action: 'Speed networked with 6 people', time: '2 days ago', icon: Zap },
        { action: 'Followed up with Priya Patel', time: '3 days ago', icon: MessageSquare },
      ].map((e, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <e.icon className="h-3.5 w-3.5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs truncate">{e.action}</div>
            <div className="text-[10px] text-muted-foreground">{e.time}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── My Digital Card ──
const MyDigitalCard: React.FC = () => (
  <div className="rounded-xl border bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-sm">My Digital Card</h3>
      <Button variant="secondary" size="sm" className="h-6 text-[10px] gap-1"><QrCode className="h-3 w-3" /> QR Code</Button>
    </div>
    <div className="flex items-center gap-3 mb-3">
      <Avatar className="h-12 w-12 border-2 border-primary-foreground/30"><AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">DU</AvatarFallback></Avatar>
      <div>
        <div className="font-semibold">Demo User</div>
        <div className="text-xs text-primary-foreground/80">Professional · Gigvora</div>
      </div>
    </div>
    <div className="flex gap-2">
      <Button variant="secondary" size="sm" className="h-7 text-xs gap-1 flex-1"><Share2 className="h-3 w-3" /> Share</Button>
      <Button variant="secondary" size="sm" className="h-7 text-xs gap-1 flex-1"><QrCode className="h-3 w-3" /> Scan</Button>
    </div>
  </div>
);

// ── AI Networking Suggestions ──
const AINetworkingSuggestions: React.FC = () => {
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const { loading, invoke } = useAI({ type: 'smart-match' });

  const getSuggestions = async () => {
    const result = await invoke({
      action: 'networking-suggestions',
      userProfile: { role: 'professional', skills: ['React', 'TypeScript', 'Design Systems'], goals: ['find collaborators', 'learn AI'] },
      availableRooms: MOCK_ROOMS.map(r => ({ title: r.title, category: r.category, tags: r.tags })),
    });
    if (result) setSuggestions(result);
  };

  return (
    <div className="rounded-xl border bg-accent/5 p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> AI Suggestions</h3>
        <Button size="sm" variant="outline" onClick={getSuggestions} disabled={loading} className="h-6 text-[10px] gap-1">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} {suggestions ? 'Refresh' : 'Get'}
        </Button>
      </div>
      {suggestions ? (
        <p className="text-xs text-muted-foreground whitespace-pre-line">{suggestions}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Get AI-powered room and connection suggestions based on your goals.</p>
      )}
    </div>
  );
};

// ── Mutual Interest Tags ──
const MutualInterestTags: React.FC = () => (
  <div className="rounded-xl border bg-card p-5">
    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Heart className="h-4 w-4 text-accent" /> Your Networking Interests</h3>
    <div className="flex flex-wrap gap-1.5">
      {['React', 'TypeScript', 'Design Systems', 'AI/ML', 'Startups', 'Leadership', 'Remote Work', 'Freelancing'].map(t => (
        <Badge key={t} variant="secondary" className="text-[10px] py-1 cursor-pointer hover:bg-accent/10 transition-colors">{t}</Badge>
      ))}
    </div>
    <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs w-full">Edit Interests</Button>
  </div>
);

// ── MAIN PAGE ──
const NetworkingPage: React.FC = () => {
  const [intent, setIntent] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');

  const roomFilters = ['all', 'live', 'scheduled', 'video', 'audio'];
  const filteredRooms = MOCK_ROOMS.filter(r => {
    if (roomFilter === 'live') return r.live;
    if (roomFilter === 'scheduled') return !r.live;
    if (roomFilter === 'video') return r.type === 'video';
    if (roomFilter === 'audio') return r.type === 'audio';
    return true;
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">Networking Hub <Wifi className="h-5 w-5 text-accent" /></h1>
          <p className="text-sm text-muted-foreground mt-0.5">Discover rooms, join speed networking, and build relationships</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5"><QrCode className="h-3.5 w-3.5" /> My Card</Button>
          <Button size="sm" className="gap-1.5"><Zap className="h-3.5 w-3.5" /> Start Room</Button>
        </div>
      </div>

      {/* Intent Selector */}
      <div className="mb-6">
        <NetworkingIntentSelector selected={intent} onSelect={setIntent} />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Main content */}
        <div>
          <Tabs defaultValue="rooms">
            <TabsList className="mb-6 bg-card border rounded-lg p-1">
              <TabsTrigger value="rooms" className="gap-1.5"><Globe className="h-3.5 w-3.5" /> Rooms</TabsTrigger>
              <TabsTrigger value="speed" className="gap-1.5"><Zap className="h-3.5 w-3.5" /> Speed Networking</TabsTrigger>
              <TabsTrigger value="followup" className="gap-1.5"><ArrowRight className="h-3.5 w-3.5" /> Follow-ups</TabsTrigger>
              <TabsTrigger value="cards" className="gap-1.5"><QrCode className="h-3.5 w-3.5" /> Digital Cards</TabsTrigger>
              <TabsTrigger value="timeline" className="gap-1.5 hidden md:flex"><BarChart3 className="h-3.5 w-3.5" /> Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="rooms">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input placeholder="Search rooms..." className="w-full h-8 rounded-lg border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div className="flex gap-1">
                  {roomFilters.map(f => (
                    <button
                      key={f}
                      onClick={() => setRoomFilter(f)}
                      className={cn('px-2.5 py-1 rounded-full text-xs capitalize transition-colors', roomFilter === f ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/50')}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {filteredRooms.map(room => <RoomCard key={room.id} room={room} />)}
              </div>
            </TabsContent>

            <TabsContent value="speed">
              <div className="mb-4">
                <div className="rounded-xl border bg-gradient-to-r from-accent/10 to-primary/10 p-5 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                      <Zap className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">How Speed Networking Works</h3>
                      <p className="text-xs text-muted-foreground">Join a queue → AI matches you with compatible professionals → Timed 1-on-1 rounds → Exchange digital cards → Follow up with your favorites. Each round has a timer — when it ends, you're matched with someone new.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {SPEED_NETWORKING_EVENTS.map(e => <SpeedNetworkingCard key={e.id} event={e} />)}
              </div>
            </TabsContent>

            <TabsContent value="followup">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-sm">{FOLLOW_UP_QUEUE.length} pending follow-ups</h2>
                <Button variant="ghost" size="sm" className="text-xs h-7">Mark all done</Button>
              </div>
              <div className="space-y-3">
                {FOLLOW_UP_QUEUE.map(item => <FollowUpItem key={item.id} item={item} />)}
              </div>
            </TabsContent>

            <TabsContent value="cards">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-sm">Digital Business Cards</h2>
                <Button variant="outline" size="sm" className="gap-1 h-7 text-xs"><QrCode className="h-3 w-3" /> Scan QR</Button>
              </div>
              <div className="space-y-2">
                {DIGITAL_CARDS.map(card => <DigitalCardItem key={card.id} card={card} />)}
              </div>
              {DIGITAL_CARDS.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">No cards exchanged yet. Join a room or speed networking session!</div>
              )}
            </TabsContent>

            <TabsContent value="timeline">
              <div className="rounded-xl border bg-card p-6">
                <h2 className="font-semibold mb-4">Connection Timeline</h2>
                <div className="space-y-4">
                  {[
                    { date: 'Today', events: ['Connected with Sarah Chen after Tech Leaders Roundtable', 'Exchanged cards with Alex Kim at Founder Speed Connect'] },
                    { date: 'Yesterday', events: ['Joined Freelancer Mastermind audio room', 'Followed up with David Thompson'] },
                    { date: 'Apr 5', events: ['Speed networked with 6 professionals', 'Received 3 connection requests'] },
                    { date: 'Apr 3', events: ['Hosted Design Systems Workshop (18 attendees)', 'Exchanged 5 digital business cards'] },
                  ].map((day, i) => (
                    <div key={i}>
                      <div className="text-xs font-semibold text-accent mb-2">{day.date}</div>
                      <div className="space-y-2 pl-4 border-l-2 border-accent/20">
                        {day.events.map((ev, j) => (
                          <div key={j} className="relative pl-4">
                            <div className="absolute -left-[9px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent/30 border-2 border-card" />
                            <p className="text-sm text-muted-foreground">{ev}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          <MyDigitalCard />
          <AINetworkingSuggestions />
          <RelationshipStrength />
          <MutualInterestTags />
          <ConnectionTimeline />
        </div>
      </div>
    </div>
  );
};

export default NetworkingPage;
