import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import {
  Wifi, Search, Clock, ChevronRight, MoreHorizontal, History,
  Eye, Bookmark, BookmarkCheck, Users, MapPin, Calendar,
  CheckCircle2, AlertTriangle, Play, Star, MessageSquare,
  Plus, Timer, Video, Zap, UserPlus, ArrowUpRight, Globe,
  Mic, MicOff, Lock, Share2, Flag, Settings, Camera,
  Save, Heart, Ban, Crown, Sparkles, Radio, TrendingUp,
  MonitorPlay, CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Mock Data
   ═══════════════════════════════════════════════════════════ */
type EventType = 'speed_networking' | 'industry_room' | 'panel' | 'mixer' | 'workshop' | 'meetup';
type EventStatus = 'upcoming' | 'live' | 'ended' | 'full' | 'cancelled';
type FollowUpStatus = 'pending' | 'sent' | 'connected' | 'declined';
type EventTab = 'discover' | 'live' | 'rsvps' | 'followups' | 'archive';

const TABS: { id: EventTab; label: string; icon: React.ElementType }[] = [
  { id: 'discover', label: 'Discover', icon: Calendar },
  { id: 'live', label: 'Live Now', icon: Radio },
  { id: 'rsvps', label: 'My RSVPs', icon: CheckCircle2 },
  { id: 'followups', label: 'Follow-Ups', icon: MessageSquare },
  { id: 'archive', label: 'Archive', icon: History },
];

interface NetworkEvent {
  id: string; title: string; type: EventType; host: string; hostAvatar: string;
  date: string; time: string; duration: string; participants: number; maxParticipants: number;
  status: EventStatus; industry: string; location: string; saved: boolean; description: string;
  price?: string; cover?: string;
}

interface Participant {
  id: string; name: string; avatar: string; title: string; company: string;
  matchScore: number; connected: boolean; online?: boolean;
}

interface FollowUp {
  id: string; name: string; avatar: string; title: string; event: string;
  status: FollowUpStatus; time: string;
}

const EVENTS: NetworkEvent[] = [
  { id: 'E-001', title: 'SaaS Founders Speed Networking', type: 'speed_networking', host: 'Gigvora Events', hostAvatar: 'GE', date: 'Apr 14, 2026', time: '2:00 PM EST', duration: '45 min', participants: 18, maxParticipants: 24, status: 'upcoming', industry: 'SaaS', location: 'Virtual', saved: true, description: '5-minute rounds with SaaS founders and operators. Meet vetted founders and exchange ideas in structured speed rounds.', price: 'Free' },
  { id: 'E-002', title: 'FinTech Industry Room', type: 'industry_room', host: 'Sarah Chen', hostAvatar: 'SC', date: 'Apr 12, 2026', time: '11:00 AM EST', duration: '60 min', participants: 32, maxParticipants: 50, status: 'live', industry: 'FinTech', location: 'Virtual', saved: false, description: 'Open room for FinTech professionals to connect and discuss trends.' },
  { id: 'E-003', title: 'AI/ML Engineering Mixer', type: 'mixer', host: 'Raj Krishnan', hostAvatar: 'RK', date: 'Apr 15, 2026', time: '6:00 PM EST', duration: '90 min', participants: 45, maxParticipants: 60, status: 'upcoming', industry: 'AI/ML', location: 'Virtual', saved: false, description: 'Casual mixer for ML engineers and researchers to network and collaborate.' },
  { id: 'E-004', title: 'Recruiter-Talent Speed Round', type: 'speed_networking', host: 'Gigvora Events', hostAvatar: 'GE', date: 'Apr 13, 2026', time: '3:00 PM EST', duration: '30 min', participants: 20, maxParticipants: 20, status: 'full', industry: 'Recruiting', location: 'Virtual', saved: true, description: '3-minute speed rounds matching recruiters with top talent.' },
  { id: 'E-005', title: 'Design Leadership Panel', type: 'panel', host: 'Marcus Brown', hostAvatar: 'MB', date: 'Apr 11, 2026', time: '1:00 PM EST', duration: '60 min', participants: 85, maxParticipants: 100, status: 'ended', industry: 'Design', location: 'Virtual', saved: false, description: 'Panel discussion on design leadership paths and career growth.' },
  { id: 'E-006', title: 'Startup Pitch Workshop', type: 'workshop', host: 'Emma Liu', hostAvatar: 'EL', date: 'Apr 16, 2026', time: '10:00 AM EST', duration: '120 min', participants: 12, maxParticipants: 15, status: 'upcoming', industry: 'Startups', location: 'Virtual', saved: false, description: 'Practice your pitch with live feedback from experienced founders.', price: '$19' },
  { id: 'E-007', title: 'NYC Tech Meetup — Spring Edition', type: 'meetup', host: 'NYC Tech Community', hostAvatar: 'NY', date: 'Apr 20, 2026', time: '7:00 PM EST', duration: '3h', participants: 120, maxParticipants: 200, status: 'upcoming', industry: 'General', location: 'Brooklyn, NY', saved: false, description: 'In-person networking mixer at The Bell House. Drinks, demos, and connections.', price: '$15' },
];

const PARTICIPANTS: Participant[] = [
  { id: 'P-1', name: 'Alex Thompson', avatar: 'AT', title: 'VP Product', company: 'ScaleUp Inc', matchScore: 92, connected: false, online: true },
  { id: 'P-2', name: 'Lina Park', avatar: 'LP', title: 'CTO', company: 'NexaFlow', matchScore: 88, connected: true, online: true },
  { id: 'P-3', name: 'David Chen', avatar: 'DC', title: 'Eng Manager', company: 'CloudScale', matchScore: 85, connected: false, online: false },
  { id: 'P-4', name: 'Priya Sharma', avatar: 'PS', title: 'Founder', company: 'DevTools', matchScore: 78, connected: false, online: true },
  { id: 'P-5', name: "James O'Brien", avatar: 'JO', title: 'BD Lead', company: 'TechCorp', matchScore: 74, connected: true, online: false },
];

const FOLLOWUPS: FollowUp[] = [
  { id: 'F-1', name: 'Lina Park', avatar: 'LP', title: 'CTO at NexaFlow', event: 'SaaS Founders Speed Networking', status: 'connected', time: '2d ago' },
  { id: 'F-2', name: 'Alex Thompson', avatar: 'AT', title: 'VP Product at ScaleUp', event: 'SaaS Founders Speed Networking', status: 'sent', time: '2d ago' },
  { id: 'F-3', name: 'Marcus Brown', avatar: 'MB', title: 'Design Lead', event: 'Design Leadership Panel', status: 'pending', time: '1d ago' },
  { id: 'F-4', name: 'David Chen', avatar: 'DC', title: 'Eng Manager at CloudScale', event: 'AI/ML Engineering Mixer', status: 'declined', time: '3d ago' },
];

const TYPE_COLORS: Record<EventType, string> = {
  speed_networking: 'bg-accent/10 text-accent',
  industry_room: 'bg-primary/10 text-primary',
  panel: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  mixer: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  workshop: 'bg-muted text-muted-foreground',
  meetup: 'bg-primary/10 text-primary',
};

const STATUS_COLORS: Record<EventStatus, string> = {
  upcoming: 'bg-accent/10 text-accent',
  live: 'bg-[hsl(var(--state-live)/0.1)] text-[hsl(var(--state-live))]',
  ended: 'bg-muted text-muted-foreground',
  full: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  cancelled: 'bg-destructive/10 text-destructive',
};

const FU_COLORS: Record<FollowUpStatus, string> = {
  pending: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  sent: 'bg-accent/10 text-accent',
  connected: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  declined: 'bg-muted text-muted-foreground',
};

/* ═══════════════════════════════════════════════════════════
   Create Event Drawer
   ═══════════════════════════════════════════════════════════ */
const CreateEventDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [saving, setSaving] = useState(false);
  const handleCreate = () => { setSaving(true); setTimeout(() => { setSaving(false); onClose(); toast.success('Event created'); }, 800); };
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[420px] sm:w-[460px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm font-bold flex items-center gap-2"><Plus className="h-4 w-4 text-accent" />Create Event</SheetTitle></SheetHeader>
        <div className="p-5 space-y-4">
          {[
            { label: 'Event Title', placeholder: 'e.g. SaaS Founders Speed Networking' },
            { label: 'Industry / Topic', placeholder: 'e.g. SaaS, FinTech, Design' },
          ].map(f => (
            <div key={f.label}>
              <label className="text-[11px] font-semibold mb-1.5 block">{f.label}</label>
              <input placeholder={f.placeholder} className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
            </div>
          ))}
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">Description</label>
            <Textarea placeholder="What will attendees experience?" rows={3} className="rounded-xl text-[11px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Date', type: 'date' },
              { label: 'Time', type: 'time' },
              { label: 'Duration', placeholder: '45 min' },
              { label: 'Max Participants', placeholder: '24' },
            ].map(f => (
              <div key={f.label}>
                <label className="text-[11px] font-semibold mb-1.5 block">{f.label}</label>
                <input type={('type' in f ? f.type : 'text') as string} placeholder={'placeholder' in f ? f.placeholder : ''} className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">Event Type</label>
            <div className="flex flex-wrap gap-1.5">
              {['Speed Networking', 'Industry Room', 'Panel', 'Mixer', 'Workshop', 'Meetup'].map(t => (
                <button key={t} className="px-2.5 py-1 rounded-xl border text-[9px] font-semibold hover:bg-accent/10 hover:border-accent/30 transition-all">{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">Location</label>
            <div className="flex gap-2">
              <button className="flex-1 p-2.5 rounded-xl border hover:bg-accent/5 transition-all text-center">
                <Globe className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <div className="text-[10px] font-semibold">Virtual</div>
              </button>
              <button className="flex-1 p-2.5 rounded-xl border hover:bg-accent/5 transition-all text-center">
                <MapPin className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <div className="text-[10px] font-semibold">In-Person</div>
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t">
          <Button variant="outline" size="sm" className="rounded-xl text-[10px]" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="rounded-xl text-[10px] gap-1" onClick={handleCreate} disabled={saving}><Save className="h-3 w-3" />{saving ? 'Creating...' : 'Create Event'}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ═══════════════════════════════════════════════════════════
   Event Detail Drawer
   ═══════════════════════════════════════════════════════════ */
const EventDrawer: React.FC<{ event: NetworkEvent | null; open: boolean; onClose: () => void }> = ({ event, open, onClose }) => {
  if (!event) return null;
  const isFull = event.participants >= event.maxParticipants;
  const fillPct = Math.round((event.participants / event.maxParticipants) * 100);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[440px] sm:w-[480px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm font-bold flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" />Event Detail</SheetTitle></SheetHeader>

        {/* Hero */}
        <div className="h-24 bg-gradient-to-r from-accent via-primary/60 to-primary relative">
          {event.status === 'live' && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-destructive text-destructive-foreground text-[8px] font-bold animate-pulse">
              <div className="h-1.5 w-1.5 rounded-full bg-white" /> LIVE
            </div>
          )}
        </div>

        <div className="px-5 pb-5 -mt-6">
          <div className="flex items-end gap-3 mb-3">
            <Avatar className="h-14 w-14 ring-4 ring-card rounded-2xl border-2 border-card shadow-md">
              <AvatarFallback className="text-sm font-bold bg-accent/10 text-accent rounded-2xl">{event.hostAvatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pb-0.5">
              <div className="text-[13px] font-bold truncate">{event.title}</div>
              <div className="text-[9px] text-muted-foreground">Hosted by {event.host}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', TYPE_COLORS[event.type])}>{event.type.replace(/_/g, ' ')}</Badge>
            <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', STATUS_COLORS[event.status])}>{event.status}</Badge>
            {event.price && <Badge variant="secondary" className="text-[7px] rounded-lg">{event.price}</Badge>}
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">{event.description}</p>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { l: 'Date', v: event.date, icon: Calendar },
              { l: 'Time', v: event.time, icon: Clock },
              { l: 'Duration', v: event.duration, icon: Timer },
              { l: 'Industry', v: event.industry, icon: Globe },
              { l: 'Location', v: event.location, icon: MapPin },
              { l: 'Spots', v: `${event.participants}/${event.maxParticipants}`, icon: Users },
            ].map(m => (
              <div key={m.l} className="rounded-xl border p-2.5 flex items-start gap-2 hover:bg-muted/20 transition-colors">
                <m.icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div><div className="text-[8px] text-muted-foreground">{m.l}</div><div className="text-[10px] font-semibold">{m.v}</div></div>
              </div>
            ))}
          </div>

          {/* Capacity bar */}
          <div className="mb-3">
            <div className="flex justify-between text-[8px] mb-1"><span className="text-muted-foreground">Capacity</span><span className="font-semibold">{fillPct}%</span></div>
            <Progress value={fillPct} className="h-1.5" />
          </div>

          {/* Stacked attendees */}
          <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl border">
            <div className="flex -space-x-1.5">
              {PARTICIPANTS.slice(0, 4).map(p => (
                <div key={p.id} className="relative">
                  <Avatar className="h-6 w-6 ring-2 ring-card">
                    <AvatarFallback className="text-[6px] bg-muted font-bold">{p.avatar}</AvatarFallback>
                  </Avatar>
                  {p.online && <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[hsl(var(--state-healthy))] ring-2 ring-card" />}
                </div>
              ))}
            </div>
            <span className="text-[9px] text-muted-foreground">+{event.participants - 4} attending</span>
          </div>

          {/* Participants detail for live */}
          {event.status === 'live' && (
            <div className="rounded-2xl border p-3 mb-3">
              <div className="text-[10px] font-semibold mb-2 flex items-center gap-1"><Users className="h-3 w-3 text-accent" />In Room ({event.participants})</div>
              <div className="space-y-1.5">
                {PARTICIPANTS.map(p => (
                  <div key={p.id} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/20 transition-all group cursor-pointer">
                    <div className="relative">
                      <Avatar className="h-7 w-7 ring-2 ring-muted/50 transition-transform group-hover:scale-105">
                        <AvatarFallback className="text-[7px] bg-muted font-bold">{p.avatar}</AvatarFallback>
                      </Avatar>
                      {p.online && <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[hsl(var(--state-healthy))] ring-2 ring-card" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-semibold group-hover:text-accent transition-colors">{p.name}</div>
                      <div className="text-[7px] text-muted-foreground">{p.title}, {p.company}</div>
                    </div>
                    <Badge variant={p.matchScore >= 85 ? 'default' : 'secondary'} className="text-[7px] rounded-lg">{p.matchScore}%</Badge>
                    {!p.connected ? (
                      <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl gap-0.5" onClick={e => { e.stopPropagation(); toast.success('Request sent'); }}><UserPlus className="h-2.5 w-2.5" />Connect</Button>
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isFull && event.status !== 'ended' && (
            <div className="rounded-2xl border border-[hsl(var(--gigvora-amber)/0.3)] bg-[hsl(var(--gigvora-amber)/0.05)] p-3 flex items-start gap-2.5 mb-3">
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--gigvora-amber))] shrink-0 mt-0.5" />
              <div className="text-[9px]"><span className="font-semibold">Room Full.</span> This session has reached capacity. Join the waitlist to be notified of openings.</div>
            </div>
          )}

          {event.status === 'cancelled' && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2.5 mb-3">
              <Ban className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-[9px]"><span className="font-semibold">Cancelled.</span> This event has been cancelled by the host.</div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            {event.status === 'live' && <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Video className="h-3 w-3" />Join Session</Button>}
            {event.status === 'upcoming' && !isFull && <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Play className="h-3 w-3" />RSVP{event.price ? ` · ${event.price}` : ''}</Button>}
            {event.status === 'upcoming' && isFull && <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Clock className="h-3 w-3" />Join Waitlist</Button>}
            {event.status === 'ended' && <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><MessageSquare className="h-3 w-3" />Follow Up</Button>}
            <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => toast.success(event.saved ? 'Unsaved' : 'Saved')}>
              {event.saved ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}{event.saved ? 'Saved' : 'Save'}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Share2 className="h-3 w-3" /></Button>
            <Button variant="ghost" size="sm" className="h-7 text-[9px] rounded-xl gap-1 text-destructive"><Flag className="h-3 w-3" /></Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const NetworkingSessionsPage: React.FC = () => {
  const { activeRole } = useRole();
  const isManager = activeRole === 'enterprise';
  const [activeTab, setActiveTab] = useState<EventTab>('discover');
  const [selectedEvent, setSelectedEvent] = useState<NetworkEvent | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => EVENTS.filter(e => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.industry.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [search, typeFilter, statusFilter]);

  const liveEvents = EVENTS.filter(e => e.status === 'live');
  const myRsvps = EVENTS.filter(e => e.saved && e.status !== 'ended');
  const archivedEvents = EVENTS.filter(e => e.status === 'ended');

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Calendar className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Events & Networking</span>
        {liveEvents.length > 0 && (
          <Badge className="text-[7px] gap-0.5 bg-[hsl(var(--state-live)/0.1)] text-[hsl(var(--state-live))] border-0 rounded-lg animate-pulse">
            <CircleDot className="h-2 w-2" />{liveEvents.length} Live
          </Badge>
        )}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[10px] w-44 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
        </div>
        <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setCreateOpen(true)}><Plus className="h-3 w-3" />Host Event</Button>
      </div>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <KPICard label="Attended" value="8" change="This month" trend="up" className="!rounded-2xl" />
        <KPICard label="Connections" value="23" change="From events" trend="up" className="!rounded-2xl" />
      </div>

      {liveEvents.length > 0 && (
        <SectionCard title="Live Now" className="!rounded-2xl">
          <div className="space-y-1">
            {liveEvents.map(e => (
              <button key={e.id} onClick={() => setSelectedEvent(e)} className="p-2 rounded-xl w-full text-left hover:bg-muted/30 transition-all duration-200 group">
                <div className="flex items-center gap-1 mb-0.5">
                  <CircleDot className="h-2.5 w-2.5 text-[hsl(var(--state-live))] animate-pulse" />
                  <span className="text-[9px] font-semibold truncate group-hover:text-accent transition-colors">{e.title}</span>
                </div>
                <div className="text-[7px] text-muted-foreground flex items-center gap-1"><Users className="h-2.5 w-2.5" />{e.participants} in room</div>
                <Button size="sm" className="h-5 text-[7px] mt-1.5 gap-0.5 w-full rounded-xl"><Video className="h-2.5 w-2.5" />Join</Button>
              </button>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="My RSVPs" subtitle={`${myRsvps.length} upcoming`} className="!rounded-2xl">
        <div className="space-y-1">
          {myRsvps.length > 0 ? myRsvps.map(e => (
            <button key={e.id} onClick={() => setSelectedEvent(e)} className="flex items-start gap-2 p-1.5 rounded-xl w-full text-left hover:bg-muted/30 transition-all duration-200 group">
              <Calendar className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-semibold truncate group-hover:text-accent transition-colors">{e.title}</div>
                <div className="text-[7px] text-muted-foreground">{e.date} · {e.time}</div>
              </div>
            </button>
          )) : <div className="text-[8px] text-muted-foreground italic text-center py-2">No upcoming RSVPs</div>}
        </div>
      </SectionCard>

      <SectionCard title="Follow-Up Queue" subtitle={`${FOLLOWUPS.filter(f => f.status === 'pending').length} pending`} className="!rounded-2xl">
        <div className="space-y-1">
          {FOLLOWUPS.filter(f => f.status === 'pending').map(f => (
            <div key={f.id} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/20 transition-all">
              <Avatar className="h-6 w-6 ring-2 ring-muted/50"><AvatarFallback className="text-[6px] font-bold bg-muted">{f.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-semibold truncate">{f.name}</div>
                <div className="text-[7px] text-muted-foreground truncate">{f.event}</div>
              </div>
              <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-xl shrink-0">Send</Button>
            </div>
          ))}
          {FOLLOWUPS.filter(f => f.status === 'pending').length === 0 && <div className="text-[8px] text-muted-foreground italic text-center py-2">All caught up!</div>}
        </div>
      </SectionCard>

      <SectionCard title="Suggested Events" subtitle="AI-matched" className="!rounded-2xl">
        <div className="space-y-1">
          {[
            { name: 'DevOps Roundtable', match: 94, date: 'Apr 22' },
            { name: 'Product-Led Growth Mixer', match: 87, date: 'Apr 24' },
            { name: 'TypeScript Meetup', match: 82, date: 'May 1' },
          ].map(s => (
            <div key={s.name} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/30 cursor-pointer transition-all duration-200 group">
              <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary transition-transform group-hover:scale-105">{s.name[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-semibold truncate group-hover:text-accent transition-colors">{s.name}</div>
                <div className="text-[7px] text-muted-foreground">{s.date}</div>
              </div>
              <Badge variant="secondary" className="text-[7px] h-3.5 rounded-lg">{s.match}%</Badge>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom Section ── */
  const bottomSection = (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold flex items-center gap-1.5"><History className="h-3.5 w-3.5 text-accent" />Recent Activity</span>
        <span className="text-[10px] text-muted-foreground">Last 7 days</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {[
          { action: 'Connected with Lina Park (CTO, NexaFlow) after speed round', time: '2d ago', type: 'connection' },
          { action: 'Attended "Design Leadership Panel" — 85 participants', time: '1d ago', type: 'event' },
          { action: 'Follow-up sent to Alex Thompson (VP Product)', time: '2d ago', type: 'follow-up' },
          { action: 'RSVP\'d for "AI/ML Engineering Mixer" on Apr 15', time: '3d ago', type: 'rsvp' },
          { action: 'NYC Tech Meetup — Spring Edition registration confirmed', time: '4d ago', type: 'rsvp' },
        ].map((a, i) => (
          <div key={i} className="shrink-0 rounded-2xl border bg-card px-3.5 py-2.5 min-w-[240px] hover:shadow-sm cursor-pointer transition-all duration-200">
            <Badge variant="secondary" className="text-[7px] capitalize mb-1 rounded-lg">{a.type}</Badge>
            <p className="text-[9px] text-muted-foreground line-clamp-2">{a.action}</p>
            <div className="text-[8px] text-muted-foreground mt-1 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-60" bottomSection={bottomSection}>
      {/* ── TAB NAV ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-3 scrollbar-none sticky top-0 z-10 bg-background/95 backdrop-blur-sm -mx-1 px-1 pt-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0',
            activeTab === t.id ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}>
            <t.icon className="h-3 w-3" />{t.label}
            {t.id === 'live' && liveEvents.length > 0 && <span className="text-[8px] ml-0.5">({liveEvents.length})</span>}
            {t.id === 'followups' && FOLLOWUPS.filter(f => f.status === 'pending').length > 0 && <span className="text-[8px] ml-0.5">({FOLLOWUPS.filter(f => f.status === 'pending').length})</span>}
          </button>
        ))}
      </div>

      {/* ── DISCOVER TAB ── */}
      {activeTab === 'discover' && (
        <div className="space-y-3">
          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              {['all', 'upcoming', 'live', 'full'].map(f => (
                <button key={f} onClick={() => setStatusFilter(f)} className={cn(
                  'px-2.5 py-1 rounded-xl text-[9px] font-semibold transition-all duration-200',
                  statusFilter === f ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                )}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex gap-1 overflow-x-auto scrollbar-none">
              {['all', 'speed_networking', 'industry_room', 'panel', 'mixer', 'workshop', 'meetup'].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)} className={cn(
                  'px-2.5 py-1 rounded-xl text-[9px] font-semibold transition-all duration-200 whitespace-nowrap shrink-0',
                  typeFilter === t ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                )}>{t === 'all' ? 'All Types' : t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</button>
              ))}
            </div>
            <div className="flex-1" />
            <span className="text-[9px] text-muted-foreground">{filtered.length} events</span>
          </div>

          {/* Event Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filtered.map(e => {
              const isFull = e.participants >= e.maxParticipants;
              const fillPct = (e.participants / e.maxParticipants) * 100;
              return (
                <div key={e.id} onClick={() => setSelectedEvent(e)} className={cn(
                  'rounded-2xl border bg-card overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group',
                  e.status === 'live' && 'border-[hsl(var(--state-live)/0.4)]',
                  e.status === 'cancelled' && 'opacity-60'
                )}>
                  {/* Mini cover */}
                  <div className={cn(
                    'h-16 relative',
                    e.status === 'live' ? 'bg-gradient-to-r from-[hsl(var(--state-live)/0.2)] via-accent/10 to-primary/10' : 'bg-gradient-to-r from-accent/20 via-primary/10 to-muted'
                  )}>
                    {e.status === 'live' && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-destructive text-destructive-foreground text-[7px] font-bold animate-pulse">
                        <div className="h-1.5 w-1.5 rounded-full bg-white" /> LIVE
                      </div>
                    )}
                    {e.location !== 'Virtual' && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-background/80 text-[7px] text-muted-foreground backdrop-blur-sm">
                        <MapPin className="h-2.5 w-2.5" />{e.location}
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 -mt-4">
                    <div className="flex items-end gap-2.5 mb-2">
                      <Avatar className="h-10 w-10 ring-3 ring-card rounded-xl shadow-sm transition-transform group-hover:scale-105">
                        <AvatarFallback className="text-[9px] font-bold bg-accent/10 text-accent rounded-xl">{e.hostAvatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold truncate group-hover:text-accent transition-colors flex items-center gap-1">
                          {e.title}
                          {e.saved && <BookmarkCheck className="h-3 w-3 text-accent shrink-0" />}
                        </div>
                        <div className="text-[8px] text-muted-foreground">by {e.host}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', TYPE_COLORS[e.type])}>{e.type.replace(/_/g, ' ')}</Badge>
                      <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', STATUS_COLORS[e.status])}>{e.status}</Badge>
                      {e.price && <Badge variant="secondary" className="text-[7px] rounded-lg">{e.price}</Badge>}
                    </div>

                    <div className="flex items-center gap-3 text-[8px] text-muted-foreground mb-2">
                      <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{e.date}</span>
                      <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{e.time}</span>
                      <span className="flex items-center gap-0.5"><Timer className="h-2.5 w-2.5" />{e.duration}</span>
                    </div>

                    {/* Capacity bar */}
                    <div className="mb-2.5">
                      <div className="flex justify-between text-[7px] mb-0.5">
                        <span className="text-muted-foreground flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{e.participants}/{e.maxParticipants}</span>
                        <span className={cn('font-semibold', isFull ? 'text-[hsl(var(--gigvora-amber))]' : 'text-accent')}>{Math.round(fillPct)}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', isFull ? 'bg-[hsl(var(--gigvora-amber))]' : 'bg-accent')} style={{ width: `${fillPct}%` }} />
                      </div>
                    </div>

                    {/* Stacked attendees */}
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <div className="flex -space-x-1">
                        {[...Array(Math.min(3, e.participants))].map((_, i) => (
                          <div key={i} className="h-5 w-5 rounded-full bg-muted border-2 border-card" />
                        ))}
                      </div>
                      <span className="text-[7px] text-muted-foreground">+{e.participants} attending</span>
                    </div>

                    <div className="flex gap-1.5">
                      {e.status === 'live' && <Button size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl"><Video className="h-3 w-3" />Join</Button>}
                      {e.status === 'upcoming' && !isFull && <Button size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl"><Play className="h-3 w-3" />RSVP</Button>}
                      {e.status === 'upcoming' && isFull && <Button variant="outline" size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl"><Clock className="h-3 w-3" />Waitlist</Button>}
                      {e.status === 'ended' && <Button variant="outline" size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl"><Eye className="h-3 w-3" />Summary</Button>}
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-xl" onClick={ev => { ev.stopPropagation(); toast.success(e.saved ? 'Unsaved' : 'Saved'); }}>
                        {e.saved ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><MoreHorizontal className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-[11px] font-semibold mb-1">No Events Found</div>
              <div className="text-[9px] text-muted-foreground mb-3">Try adjusting your filters or search terms.</div>
              <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => { setTypeFilter('all'); setStatusFilter('all'); setSearch(''); }}>Clear Filters</Button>
            </div>
          )}
        </div>
      )}

      {/* ── LIVE TAB ── */}
      {activeTab === 'live' && (
        <div className="space-y-2.5">
          {liveEvents.length > 0 ? liveEvents.map(e => (
            <div key={e.id} className="rounded-2xl border border-[hsl(var(--state-live)/0.3)] bg-card overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-[hsl(var(--state-live)/0.15)] via-accent/10 to-primary/10 relative flex items-center justify-center">
                <Video className="h-6 w-6 text-muted-foreground/20" />
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-destructive text-destructive-foreground text-[8px] font-bold animate-pulse">
                  <div className="h-1.5 w-1.5 rounded-full bg-white" /> LIVE
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10 ring-2 ring-muted/50 rounded-xl"><AvatarFallback className="text-[9px] font-bold rounded-xl bg-accent/10 text-accent">{e.hostAvatar}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <div className="text-[12px] font-bold">{e.title}</div>
                    <div className="text-[9px] text-muted-foreground">Hosted by {e.host} · {e.duration} · {e.industry}</div>
                  </div>
                  <Button size="sm" className="h-8 text-[10px] gap-1 rounded-xl"><Video className="h-3.5 w-3.5" />Join Session</Button>
                </div>

                <div className="rounded-2xl border p-3 mb-3">
                  <div className="text-[10px] font-semibold mb-2 flex items-center gap-1"><Users className="h-3.5 w-3.5 text-accent" />Participants ({e.participants})</div>
                  <div className="flex flex-wrap gap-2">
                    {PARTICIPANTS.map(p => (
                      <div key={p.id} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/20 transition-all cursor-pointer group">
                        <div className="relative">
                          <Avatar className="h-7 w-7 ring-2 ring-muted/50 transition-transform group-hover:scale-105"><AvatarFallback className="text-[7px] bg-muted font-bold">{p.avatar}</AvatarFallback></Avatar>
                          {p.online && <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[hsl(var(--state-healthy))] ring-2 ring-card" />}
                        </div>
                        <div>
                          <div className="text-[9px] font-semibold group-hover:text-accent transition-colors">{p.name}</div>
                          <div className="text-[7px] text-muted-foreground">{p.title}</div>
                        </div>
                        <Badge variant={p.matchScore >= 85 ? 'default' : 'secondary'} className="text-[7px] rounded-lg ml-1">{p.matchScore}%</Badge>
                        {!p.connected && <Button variant="outline" size="sm" className="h-5 text-[7px] gap-0.5 rounded-xl" onClick={ev => { ev.stopPropagation(); toast.success('Request sent'); }}><UserPlus className="h-2.5 w-2.5" /></Button>}
                        {p.connected && <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                  <Timer className="h-3 w-3" />Session in progress · {e.participants}/{e.maxParticipants} spots used
                </div>
              </div>
            </div>
          )) : (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <Video className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-[11px] font-semibold mb-1">No Live Sessions Right Now</div>
              <div className="text-[9px] text-muted-foreground mb-3">Check back soon or browse upcoming events.</div>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setActiveTab('discover')}><Calendar className="h-3 w-3" />Browse Upcoming</Button>
            </div>
          )}
        </div>
      )}

      {/* ── RSVPS TAB ── */}
      {activeTab === 'rsvps' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold">{myRsvps.length} Upcoming RSVPs</span>
          </div>
          {myRsvps.length > 0 ? myRsvps.map(e => (
            <div key={e.id} onClick={() => setSelectedEvent(e)} className="flex items-center gap-3 p-3 rounded-2xl border hover:bg-muted/20 hover:shadow-sm cursor-pointer transition-all duration-200 group">
              <Avatar className="h-10 w-10 ring-2 ring-muted/50 rounded-xl transition-transform group-hover:scale-105">
                <AvatarFallback className="text-[9px] font-bold bg-accent/10 text-accent rounded-xl">{e.hostAvatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold group-hover:text-accent transition-colors">{e.title}</div>
                <div className="text-[8px] text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{e.date}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{e.time}</span>
                  <span className="flex items-center gap-0.5"><Timer className="h-2.5 w-2.5" />{e.duration}</span>
                </div>
              </div>
              <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', STATUS_COLORS[e.status])}>{e.status}</Badge>
              <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1 shrink-0"><CheckCircle2 className="h-3 w-3" />Confirmed</Button>
            </div>
          )) : (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-[11px] font-semibold mb-1">No RSVPs Yet</div>
              <div className="text-[9px] text-muted-foreground mb-3">Browse events and RSVP to join.</div>
              <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setActiveTab('discover')}><Search className="h-3 w-3" />Discover Events</Button>
            </div>
          )}
        </div>
      )}

      {/* ── FOLLOWUPS TAB ── */}
      {activeTab === 'followups' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold">{FOLLOWUPS.length} Follow-Ups</span>
            <div className="flex gap-1">
              {['all', 'pending', 'sent', 'connected', 'declined'].map(s => (
                <button key={s} className="px-2 py-0.5 rounded-xl text-[8px] font-semibold bg-muted/60 text-muted-foreground hover:bg-muted transition-all capitalize">{s}</button>
              ))}
            </div>
          </div>
          {FOLLOWUPS.map(f => (
            <div key={f.id} className="flex items-center gap-2.5 p-3 rounded-2xl border hover:bg-muted/20 hover:shadow-sm cursor-pointer transition-all duration-200 group">
              <Avatar className="h-9 w-9 ring-2 ring-muted/50 transition-transform group-hover:scale-105">
                <AvatarFallback className="text-[9px] bg-muted font-bold">{f.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold group-hover:text-accent transition-colors">{f.name}</div>
                <div className="text-[8px] text-muted-foreground">{f.title}</div>
                <div className="text-[7px] text-muted-foreground mt-0.5">from {f.event}</div>
              </div>
              <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', FU_COLORS[f.status])}>{f.status}</Badge>
              <span className="text-[8px] text-muted-foreground shrink-0">{f.time}</span>
              <div className="flex gap-1">
                {f.status === 'pending' && <Button size="sm" className="h-7 text-[9px] gap-0.5 rounded-xl"><MessageSquare className="h-3 w-3" />Send</Button>}
                {f.status === 'connected' && <Button variant="outline" size="sm" className="h-7 text-[9px] gap-0.5 rounded-xl"><Eye className="h-3 w-3" />Profile</Button>}
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><MoreHorizontal className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ARCHIVE TAB ── */}
      {activeTab === 'archive' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold">{archivedEvents.length} Past Events</span>
          </div>
          {archivedEvents.length > 0 ? archivedEvents.map(e => (
            <div key={e.id} onClick={() => setSelectedEvent(e)} className="flex items-center gap-3 p-3 rounded-2xl border hover:bg-muted/20 cursor-pointer transition-all duration-200 group opacity-80 hover:opacity-100">
              <Avatar className="h-10 w-10 ring-2 ring-muted/50 rounded-xl">
                <AvatarFallback className="text-[9px] font-bold bg-muted rounded-xl">{e.hostAvatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold group-hover:text-accent transition-colors">{e.title}</div>
                <div className="text-[8px] text-muted-foreground">{e.date} · {e.participants} attended · {e.industry}</div>
              </div>
              <Badge className="text-[7px] border-0 bg-muted text-muted-foreground rounded-lg">Ended</Badge>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1 shrink-0"><MessageSquare className="h-3 w-3" />Follow Up</Button>
            </div>
          )) : (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <History className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-[11px] font-semibold mb-1">No Past Events</div>
              <div className="text-[9px] text-muted-foreground">Events you attend will appear here.</div>
            </div>
          )}
        </div>
      )}

      {/* Drawers */}
      <EventDrawer event={selectedEvent} open={!!selectedEvent} onClose={() => setSelectedEvent(null)} />
      <CreateEventDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </DashboardLayout>
  );
};

export default NetworkingSessionsPage;
