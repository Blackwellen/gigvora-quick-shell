import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import {
  Video, Play, Pause, Clock, Search, Plus, Users, Star,
  Calendar, MessageSquare, Eye, CheckCircle2, AlertTriangle, Lock,
  ChevronRight, History, Bookmark, BookmarkCheck,
  Sparkles, Target, Mic, Radio, Ticket, DollarSign,
  TrendingUp, ArrowUpRight, MoreHorizontal, Heart,
  MonitorPlay, CircleDot, PauseCircle, Tv, Share2, Flag,
  Save, Ban, Settings, Upload, ExternalLink, Download,
  Send, ThumbsUp, Volume2, Maximize, X, BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════ */
type WebinarStatus = 'upcoming' | 'live' | 'replay' | 'ended' | 'sold_out' | 'cancelled' | 'draft' | 'processing';
type TicketType = 'free' | 'paid' | 'vip' | 'donation';
type RegistrationStatus = 'registered' | 'attended' | 'missed' | 'cancelled';
type MainTab = 'discover' | 'registered' | 'replays' | 'hosting' | 'library' | 'analytics';

interface Webinar {
  id: string; title: string; host: string; hostAvatar: string; hostTitle: string;
  status: WebinarStatus; type: TicketType; date: string; time: string;
  duration: string; attendees: number; capacity: number; price?: string;
  description: string; tags: string[]; saved: boolean; rating?: number;
  replayUrl?: boolean; donations?: number; coverColor: string;
  chatMessages?: number; polls?: number; revenue?: number;
}

interface Registration {
  id: string; webinar: string; status: RegistrationStatus; date: string;
  ticket: TicketType; amount?: string; webinarId?: string;
}

/* ═══════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════ */
const WEBINARS: Webinar[] = [
  { id: 'W-001', title: 'Scaling Engineering Teams: From 10 to 100', host: 'Dr. Sarah Chen', hostAvatar: 'SC', hostTitle: 'Former CTO, TechCorp', status: 'live', type: 'free', date: 'Today', time: '2:00 PM EST', duration: '90 min', attendees: 342, capacity: 500, description: 'Learn proven strategies for scaling engineering organizations while maintaining culture and velocity.', tags: ['Engineering', 'Leadership', 'Scaling'], saved: true, coverColor: 'bg-accent/15', chatMessages: 186, polls: 3, revenue: 0 },
  { id: 'W-002', title: 'AI-Powered Product Development Workshop', host: 'Marcus Thompson', hostAvatar: 'MT', hostTitle: 'VP Product, ScaleAI', status: 'upcoming', type: 'paid', date: 'Apr 18, 2026', time: '11:00 AM EST', duration: '2h', attendees: 189, capacity: 200, price: '$29', description: 'Hands-on workshop integrating AI tools into your product development lifecycle.', tags: ['AI', 'Product', 'Workshop'], saved: false, coverColor: 'bg-primary/15', revenue: 5481 },
  { id: 'W-003', title: 'Fundraising Masterclass: Series A Prep', host: 'Priya Gupta', hostAvatar: 'PG', hostTitle: 'Partner, Venture First', status: 'upcoming', type: 'vip', date: 'Apr 22, 2026', time: '3:00 PM EST', duration: '75 min', attendees: 45, capacity: 50, price: '$99', description: 'Exclusive deep-dive into Series A preparation with live pitch feedback.', tags: ['Fundraising', 'VC', 'Startups'], saved: false, coverColor: 'bg-[hsl(var(--gigvora-amber))]/15', revenue: 4455 },
  { id: 'W-004', title: 'Design Systems at Scale', host: "James O'Brien", hostAvatar: 'JO', hostTitle: 'Design Director', status: 'replay', type: 'free', date: 'Apr 5, 2026', time: 'On Demand', duration: '60 min', attendees: 1250, capacity: 1250, description: 'How to build, maintain, and evolve design systems across large organizations.', tags: ['Design', 'Systems', 'UI'], saved: true, rating: 4.8, replayUrl: true, coverColor: 'bg-[hsl(var(--state-healthy))]/15', chatMessages: 324, revenue: 0 },
  { id: 'W-005', title: 'Open Source Sustainability Summit', host: 'Lina Park', hostAvatar: 'LP', hostTitle: 'OSS Maintainer', status: 'upcoming', type: 'donation', date: 'Apr 25, 2026', time: '1:00 PM EST', duration: '3h', attendees: 520, capacity: 1000, description: 'Community summit on sustainable open source funding models.', tags: ['Open Source', 'Community'], saved: false, donations: 3400, coverColor: 'bg-muted', revenue: 3400 },
  { id: 'W-006', title: 'Enterprise Sales Playbook', host: 'Alex Rivera', hostAvatar: 'AR', hostTitle: 'VP Sales, CloudScale', status: 'sold_out', type: 'paid', date: 'Apr 15, 2026', time: '10:00 AM EST', duration: '90 min', attendees: 300, capacity: 300, price: '$49', description: 'Proven enterprise sales strategies from a 3x quota-crusher.', tags: ['Sales', 'Enterprise', 'B2B'], saved: false, coverColor: 'bg-destructive/10', revenue: 14700 },
  { id: 'W-007', title: 'Remote Culture Deep Dive', host: 'Lina Park', hostAvatar: 'LP', hostTitle: 'OSS Maintainer', status: 'ended', type: 'free', date: 'Mar 28, 2026', time: 'Ended', duration: '45 min', attendees: 890, capacity: 1000, description: 'Building genuine culture in distributed teams.', tags: ['Remote', 'Culture'], saved: false, rating: 4.5, replayUrl: true, coverColor: 'bg-primary/10', chatMessages: 210, revenue: 0 },
];

const REGISTRATIONS: Registration[] = [
  { id: 'R-1', webinar: 'Scaling Engineering Teams', status: 'registered', date: 'Today', ticket: 'free', webinarId: 'W-001' },
  { id: 'R-2', webinar: 'AI-Powered Product Development', status: 'registered', date: 'Apr 18', ticket: 'paid', amount: '$29', webinarId: 'W-002' },
  { id: 'R-3', webinar: 'Design Systems at Scale', status: 'attended', date: 'Apr 5', ticket: 'free', webinarId: 'W-004' },
  { id: 'R-4', webinar: 'Remote Culture Deep Dive', status: 'missed', date: 'Mar 28', ticket: 'free', webinarId: 'W-007' },
];

const STATUS_COLORS: Record<WebinarStatus, string> = {
  live: 'bg-[hsl(var(--state-live)/0.1)] text-[hsl(var(--state-live))]',
  upcoming: 'bg-accent/10 text-accent',
  replay: 'bg-primary/10 text-primary',
  ended: 'bg-muted text-muted-foreground',
  sold_out: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  cancelled: 'bg-destructive/10 text-destructive',
  draft: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  processing: 'bg-muted text-muted-foreground',
};

const STATUS_MAP: Record<WebinarStatus, { label: string; state: 'healthy' | 'live' | 'pending' | 'blocked' | 'caution' | 'degraded' }> = {
  live: { label: 'Live', state: 'live' },
  upcoming: { label: 'Upcoming', state: 'healthy' },
  replay: { label: 'Replay', state: 'pending' },
  ended: { label: 'Ended', state: 'degraded' },
  sold_out: { label: 'Sold Out', state: 'caution' },
  cancelled: { label: 'Cancelled', state: 'blocked' },
  draft: { label: 'Draft', state: 'caution' },
  processing: { label: 'Processing', state: 'pending' },
};

const TICKET_COLORS: Record<TicketType, string> = {
  free: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  paid: 'bg-primary/10 text-primary',
  vip: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  donation: 'bg-accent/10 text-accent',
};

const REG_STATUS: Record<RegistrationStatus, { label: string; state: 'healthy' | 'live' | 'pending' | 'blocked' | 'caution' | 'degraded' }> = {
  registered: { label: 'Registered', state: 'healthy' },
  attended: { label: 'Attended', state: 'live' },
  missed: { label: 'Missed', state: 'caution' },
  cancelled: { label: 'Cancelled', state: 'degraded' },
};

const ACTIVITY = [
  { actor: 'Sarah Chen', action: 'started live session "Scaling Engineering Teams"', time: '2m ago' },
  { actor: 'System', action: '342 attendees joined the live room', time: '5m ago' },
  { actor: 'Marcus T.', action: 'published registration for "AI Product Workshop"', time: '1d ago' },
  { actor: 'Priya G.', action: 'sold out "Series A Prep" (50/50 seats)', time: '3d ago' },
];

const CHAT_MESSAGES = [
  { user: 'Alex R.', avatar: 'AR', msg: 'Great point about org design!', time: '2m ago' },
  { user: 'Jordan L.', avatar: 'JL', msg: 'How does this apply to remote-first teams?', time: '3m ago' },
  { user: 'Maya K.', avatar: 'MK', msg: '🔥 This is gold', time: '4m ago' },
  { user: 'Sam W.', avatar: 'SW', msg: 'Can you share the slides after?', time: '5m ago' },
];

/* ═══════════════════════════════════════════════════
   Create Webinar Drawer
   ═══════════════════════════════════════════════════ */
const CreateWebinarDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [saving, setSaving] = useState(false);
  const handleCreate = () => { setSaving(true); setTimeout(() => { setSaving(false); onClose(); toast.success('Webinar created!'); }, 800); };
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Plus className="h-4 w-4 text-accent" />Create Webinar</SheetTitle></SheetHeader>
        <div className="p-5 space-y-4">
          {[{ label: 'Title', placeholder: 'e.g. Scaling Engineering Teams' }, { label: 'Subtitle', placeholder: 'e.g. From 10 to 100 engineers' }].map(f => (
            <div key={f.label}><label className="text-[11px] font-semibold mb-1.5 block">{f.label}</label><input placeholder={f.placeholder} className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30" /></div>
          ))}
          <div><label className="text-[11px] font-semibold mb-1.5 block">Description</label><Textarea placeholder="What will attendees learn?" rows={3} className="rounded-xl text-[11px]" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[11px] font-semibold mb-1.5 block">Date</label><input type="date" className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]" /></div>
            <div><label className="text-[11px] font-semibold mb-1.5 block">Time</label><input type="time" className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]" /></div>
            <div><label className="text-[11px] font-semibold mb-1.5 block">Duration</label><input placeholder="90 min" className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]" /></div>
            <div><label className="text-[11px] font-semibold mb-1.5 block">Capacity</label><input placeholder="500" className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]" /></div>
          </div>
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">Ticket Type</label>
            <div className="flex gap-2">
              {[{ value: 'free', label: 'Free', desc: 'Open access' }, { value: 'paid', label: 'Paid', desc: 'Set a price' }, { value: 'vip', label: 'VIP', desc: 'Premium' }, { value: 'donation', label: 'Donation', desc: 'Pay what you want' }].map(opt => (
                <button key={opt.value} className="flex-1 p-2 rounded-xl border hover:bg-accent/5 hover:border-accent/30 transition-all text-center">
                  <div className="text-[10px] font-semibold">{opt.label}</div>
                  <div className="text-[7px] text-muted-foreground">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div><label className="text-[11px] font-semibold mb-1.5 block">Price (if paid/VIP)</label><input placeholder="$0.00" className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]" /></div>
          <div><label className="text-[11px] font-semibold mb-1.5 block">Cover Image</label>
            <div className="rounded-2xl border-2 border-dashed border-accent/30 bg-accent/5 p-6 text-center cursor-pointer hover:border-accent/50 transition-all">
              <Upload className="h-6 w-6 mx-auto mb-1.5 text-accent/40" />
              <div className="text-[9px] font-semibold">Drop image or click to browse</div>
              <div className="text-[7px] text-muted-foreground">PNG, JPG · Max 5 MB</div>
            </div>
          </div>
          <div><label className="text-[11px] font-semibold mb-1.5 block">Tags</label><input placeholder="e.g. Engineering, Leadership, AI" className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2.5 rounded-xl border"><input type="checkbox" className="rounded" /><div><div className="text-[9px] font-semibold">Enable Chat</div><div className="text-[7px] text-muted-foreground">Live Q&A during session</div></div></div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl border"><input type="checkbox" className="rounded" /><div><div className="text-[9px] font-semibold">Enable Donations</div><div className="text-[7px] text-muted-foreground">Accept viewer donations</div></div></div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl border"><input type="checkbox" className="rounded" /><div><div className="text-[9px] font-semibold">Auto-Record</div><div className="text-[7px] text-muted-foreground">Save replay automatically</div></div></div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl border"><input type="checkbox" className="rounded" /><div><div className="text-[9px] font-semibold">Polls</div><div className="text-[7px] text-muted-foreground">Live audience polls</div></div></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t">
          <Button variant="outline" size="sm" className="rounded-xl text-[10px]" onClick={onClose}>Cancel</Button>
          <Button variant="outline" size="sm" className="rounded-xl text-[10px]" onClick={() => { onClose(); toast.info('Draft saved.'); }}>Save Draft</Button>
          <Button size="sm" className="rounded-xl text-[10px] gap-1" onClick={handleCreate} disabled={saving}><Save className="h-3 w-3" />{saving ? 'Creating...' : 'Publish Webinar'}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ═══════════════════════════════════════════════════
   Webinar Detail Drawer
   ═══════════════════════════════════════════════════ */
const WebinarDrawer: React.FC<{ webinar: Webinar | null; open: boolean; onClose: () => void; onLive: () => void }> = ({ webinar, open, onClose, onLive }) => {
  if (!webinar) return null;
  const isFull = webinar.attendees >= webinar.capacity;
  const fillPct = Math.round((webinar.attendees / webinar.capacity) * 100);
  const sm = STATUS_MAP[webinar.status];
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Tv className="h-4 w-4 text-accent" />Webinar Detail</SheetTitle></SheetHeader>
        <div className={cn('h-28 flex items-center justify-center relative', webinar.coverColor)}>
          <Tv className="h-8 w-8 text-muted-foreground/15" />
          {webinar.status === 'live' && <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-destructive text-destructive-foreground text-[8px] font-bold animate-pulse"><div className="h-1.5 w-1.5 rounded-full bg-white" /> LIVE</div>}
        </div>
        <div className="px-5 pb-5 -mt-6">
          <div className="flex items-end gap-3 mb-3">
            <Avatar className="h-14 w-14 ring-4 ring-card rounded-2xl border-2 border-card shadow-md"><AvatarFallback className="text-sm font-bold bg-accent/10 text-accent rounded-2xl">{webinar.hostAvatar}</AvatarFallback></Avatar>
            <div className="flex-1 min-w-0 pb-0.5"><div className="text-[13px] font-bold">{webinar.title}</div><div className="text-[9px] text-muted-foreground">{webinar.host} · {webinar.hostTitle}</div></div>
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            <StatusBadge status={sm.state} label={sm.label} />
            <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', TICKET_COLORS[webinar.type])}>{webinar.type}</Badge>
            {webinar.price && <Badge variant="secondary" className="text-[7px] rounded-lg">{webinar.price}</Badge>}
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">{webinar.description}</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[{ l: 'Date', v: webinar.date, icon: Calendar }, { l: 'Time', v: webinar.time, icon: Clock }, { l: 'Duration', v: webinar.duration, icon: Play }, { l: 'Attendees', v: `${webinar.attendees}/${webinar.capacity}`, icon: Users }].map(m => (
              <div key={m.l} className="rounded-xl border p-2.5 flex items-start gap-2 hover:bg-muted/20 transition-colors"><m.icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" /><div><div className="text-[8px] text-muted-foreground">{m.l}</div><div className="text-[10px] font-semibold">{m.v}</div></div></div>
            ))}
          </div>
          {webinar.status !== 'replay' && <div className="mb-3"><div className="flex justify-between text-[8px] mb-1"><span className="text-muted-foreground">Capacity</span><span className="font-semibold">{fillPct}%</span></div><Progress value={fillPct} className="h-1.5" /></div>}
          {webinar.rating && <div className="flex items-center gap-1.5 text-[10px] mb-3 p-2 rounded-xl bg-muted/20"><Star className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] fill-[hsl(var(--gigvora-amber))]" /><span className="font-semibold">{webinar.rating}</span><span className="text-muted-foreground">average rating</span></div>}
          <div className="flex flex-wrap gap-1 mb-3">{webinar.tags.map(t => <Badge key={t} variant="secondary" className="text-[7px] rounded-lg">{t}</Badge>)}</div>

          {webinar.status === 'sold_out' && (
            <div className="rounded-2xl border border-[hsl(var(--gigvora-amber)/0.3)] bg-[hsl(var(--gigvora-amber)/0.05)] p-3 flex items-start gap-2.5 mb-3">
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--gigvora-amber))] shrink-0 mt-0.5" />
              <div className="text-[9px]"><span className="font-semibold">Sold Out.</span> Join the waitlist to be notified.</div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            {webinar.status === 'live' && <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => { onClose(); onLive(); }}><Radio className="h-3 w-3" />Join Live</Button>}
            {webinar.status === 'upcoming' && !isFull && <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Ticket className="h-3 w-3" />Register{webinar.price ? ` · ${webinar.price}` : ''}</Button>}
            {webinar.status === 'upcoming' && isFull && <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Clock className="h-3 w-3" />Join Waitlist</Button>}
            {webinar.status === 'replay' && <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1"><MonitorPlay className="h-3 w-3" />Watch Replay</Button>}
            {webinar.type === 'donation' && <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Heart className="h-3 w-3" />Donate</Button>}
            <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.success(webinar.saved ? 'Unsaved' : 'Saved')}>{webinar.saved ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}{webinar.saved ? 'Saved' : 'Save'}</Button>
            <Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Share2 className="h-3 w-3" />Share</Button>
            <Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3" />Slides</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ═══════════════════════════════════════════════════
   Live Room Overlay
   ═══════════════════════════════════════════════════ */
const LiveRoom: React.FC<{ webinar: Webinar; onClose: () => void }> = ({ webinar, onClose }) => {
  const [chatInput, setChatInput] = useState('');
  const [volume] = useState([75]);
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-card/80 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-destructive text-destructive-foreground text-[8px] font-bold animate-pulse"><div className="h-1.5 w-1.5 rounded-full bg-white" /> LIVE</div>
          <span className="text-[11px] font-bold">{webinar.title}</span>
          <Badge variant="secondary" className="text-[7px] rounded-lg">{webinar.attendees} watching</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2"><Volume2 className="h-3 w-3 text-muted-foreground" /><Slider defaultValue={volume} max={100} className="w-16" /></div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg"><Maximize className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={onClose}><X className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-black/90 flex items-center justify-center relative">
            <Tv className="h-16 w-16 text-white/10" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <Avatar className="h-8 w-8 ring-2 ring-accent"><AvatarFallback className="text-[8px] bg-accent/20 text-accent font-bold">{webinar.hostAvatar}</AvatarFallback></Avatar>
              <div><div className="text-[10px] font-bold text-white">{webinar.host}</div><div className="text-[8px] text-white/60">{webinar.hostTitle}</div></div>
            </div>
            <div className="absolute bottom-4 right-4 flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 text-[8px] text-white/70 gap-1 rounded-lg"><Heart className="h-3 w-3" />Donate</Button>
              <Button variant="ghost" size="sm" className="h-7 text-[8px] text-white/70 gap-1 rounded-lg"><ThumbsUp className="h-3 w-3" />React</Button>
            </div>
            {/* Live timer */}
            <div className="absolute top-4 left-4 text-[9px] text-white/50 font-mono">00:42:15</div>
          </div>
          {/* Controls */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t bg-card">
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
              <Users className="h-3 w-3" />{webinar.attendees} viewers
              <span className="mx-1">·</span>
              <MessageSquare className="h-3 w-3" />{webinar.chatMessages} messages
            </div>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-lg gap-1"><BarChart3 className="h-3 w-3" />Poll</Button>
              <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-lg gap-1"><Share2 className="h-3 w-3" />Share</Button>
              <Button variant="destructive" size="sm" className="h-7 text-[8px] rounded-lg gap-1" onClick={onClose}><X className="h-3 w-3" />Leave</Button>
            </div>
          </div>
        </div>
        {/* Chat panel */}
        <div className="w-72 border-l flex flex-col bg-card">
          <div className="px-3 py-2.5 border-b flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-accent" />
            <span className="text-[10px] font-bold">Live Chat</span>
            <Badge variant="secondary" className="text-[6px] rounded-lg ml-auto">{webinar.chatMessages}</Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {CHAT_MESSAGES.map((m, i) => (
              <div key={i} className="flex items-start gap-2">
                <Avatar className="h-5 w-5 ring-1 ring-muted/40"><AvatarFallback className="text-[5px] bg-accent/10 text-accent font-bold">{m.avatar}</AvatarFallback></Avatar>
                <div><div className="text-[8px]"><span className="font-semibold">{m.user}</span> <span className="text-muted-foreground">· {m.time}</span></div><div className="text-[9px] text-foreground/80">{m.msg}</div></div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t flex gap-1.5">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 h-8 rounded-xl border bg-background px-3 text-[10px] focus:outline-none focus:ring-2 focus:ring-accent/30" />
            <Button size="sm" className="h-8 w-8 p-0 rounded-xl"><Send className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
const WebinarsPage: React.FC = () => {
  const { activeRole } = useRole();
  const [activeTab, setActiveTab] = useState<MainTab>('discover');
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [liveRoom, setLiveRoom] = useState<Webinar | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ticketFilter, setTicketFilter] = useState<string>('all');

  const filtered = useMemo(() => WEBINARS.filter(w => {
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    if (ticketFilter !== 'all' && w.type !== ticketFilter) return false;
    if (search && !w.title.toLowerCase().includes(search.toLowerCase()) && !w.host.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [search, statusFilter, ticketFilter]);

  const liveWebinars = WEBINARS.filter(w => w.status === 'live');
  const replayWebinars = WEBINARS.filter(w => w.status === 'replay' || (w.status === 'ended' && w.replayUrl));

  const TABS: { id: MainTab; label: string; icon: LucideIcon }[] = [
    { id: 'discover', label: 'Discover', icon: Tv },
    { id: 'registered', label: 'My Tickets', icon: Ticket },
    { id: 'replays', label: 'Replays', icon: MonitorPlay },
    { id: 'library', label: 'Library', icon: Bookmark },
    { id: 'hosting', label: 'Host Studio', icon: Mic },
    ...(activeRole === 'professional' || activeRole === 'enterprise' ? [{ id: 'analytics' as MainTab, label: 'Analytics', icon: BarChart3 }] : []),
  ];

  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Tv className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Webinars</span>
        {liveWebinars.length > 0 && <Badge className="text-[7px] gap-0.5 bg-[hsl(var(--state-live)/0.1)] text-[hsl(var(--state-live))] border-0 rounded-lg animate-pulse"><CircleDot className="h-2 w-2" />{liveWebinars.length} Live</Badge>}
        <Badge variant="secondary" className="text-[7px] rounded-lg">{WEBINARS.length} events</Badge>
      </div>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search webinars..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[9px] w-44 focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px] ml-1.5">
        <option value="all">All Status</option>
        <option value="live">Live</option><option value="upcoming">Upcoming</option>
        <option value="replay">Replay</option><option value="sold_out">Sold Out</option>
      </select>
      <select value={ticketFilter} onChange={e => setTicketFilter(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px] ml-1">
        <option value="all">All Tickets</option>
        <option value="free">Free</option><option value="paid">Paid</option>
        <option value="vip">VIP</option><option value="donation">Donation</option>
      </select>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1 ml-1.5" onClick={() => setCreateOpen(true)}><Plus className="h-3 w-3" />Host Webinar</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      {liveWebinars.length > 0 && (
        <SectionCard title="Live Now" icon={<CircleDot className="h-3.5 w-3.5 text-[hsl(var(--state-live))] animate-pulse" />} className="!rounded-2xl">
          <div className="space-y-1.5">
            {liveWebinars.map(w => (
              <button key={w.id} onClick={() => setSelectedWebinar(w)} className="w-full text-left p-2 rounded-xl hover:bg-muted/30 transition-all group">
                <div className="flex items-center gap-1 mb-0.5"><CircleDot className="h-2.5 w-2.5 text-[hsl(var(--state-live))] animate-pulse" /><span className="text-[9px] font-semibold truncate group-hover:text-accent transition-colors">{w.title}</span></div>
                <div className="text-[7px] text-muted-foreground ml-3.5">{w.host} · {w.attendees} watching</div>
              </button>
            ))}
          </div>
        </SectionCard>
      )}
      <SectionCard title="Upcoming" icon={<Calendar className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1">
          {WEBINARS.filter(w => w.status === 'upcoming').slice(0, 3).map(w => (
            <button key={w.id} onClick={() => setSelectedWebinar(w)} className="flex items-center gap-2 p-2 rounded-xl w-full text-left hover:bg-muted/30 transition-all text-[9px] group">
              <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0', w.coverColor)}><Tv className="h-3 w-3 text-muted-foreground/30" /></div>
              <div className="flex-1 min-w-0"><div className="font-semibold truncate group-hover:text-accent transition-colors">{w.title}</div><div className="text-[7px] text-muted-foreground">{w.date} · {w.time}</div></div>
            </button>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { label: 'Browse Webinars', icon: Tv, action: () => setActiveTab('discover') },
            { label: 'My Tickets', icon: Ticket, action: () => setActiveTab('registered') },
            { label: 'Saved', icon: Bookmark, action: () => setActiveTab('library') },
            { label: 'Host Studio', icon: Mic, action: () => setActiveTab('hosting') },
            { label: 'Donations', icon: Heart, action: () => toast.info('Donations') },
          ].map(a => (
            <button key={a.label} onClick={a.action} className="flex items-center gap-2 p-2 rounded-xl w-full text-left hover:bg-muted/30 transition-all text-[9px] font-medium group">
              <a.icon className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" /><span className="group-hover:text-accent transition-colors">{a.label}</span>
              <ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Your Stats" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[{ l: 'Attended', v: '12' }, { l: 'Registered', v: '3' }, { l: 'Donated', v: '$85' }, { l: 'Hours Watched', v: '28h' }].map(s => (
            <div key={s.l} className="flex justify-between"><span className="text-muted-foreground">{s.l}</span><span className="font-bold">{s.v}</span></div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="px-1">
      <div className="text-[10px] font-bold mb-2 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-accent" />Recent Activity</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {ACTIVITY.map((a, i) => (
          <div key={i} className="shrink-0 rounded-2xl border bg-card px-3.5 py-2.5 min-w-[200px] hover:shadow-sm transition-all">
            <div className="flex items-center gap-1.5 mb-0.5"><Avatar className="h-4 w-4 ring-1 ring-muted/40"><AvatarFallback className="text-[5px] bg-accent/10 text-accent font-bold">{a.actor[0]}</AvatarFallback></Avatar><span className="text-[9px] font-semibold">{a.actor}</span></div>
            <p className="text-[8px] text-muted-foreground line-clamp-2">{a.action}</p>
            <div className="text-[7px] text-muted-foreground mt-0.5">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (liveRoom) return <LiveRoom webinar={liveRoom} onClose={() => setLiveRoom(null)} />;

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52" bottomSection={bottomSection}>
      <KPIBand className="mb-4">
        <KPICard label="Total Events" value={String(WEBINARS.length)} change="all time" />
        <KPICard label="Live Now" value={String(liveWebinars.length)} change="active" trend={liveWebinars.length > 0 ? 'up' : undefined} />
        <KPICard label="Upcoming" value={String(WEBINARS.filter(w => w.status === 'upcoming').length)} change="scheduled" />
        <KPICard label="Replays" value={String(replayWebinars.length)} change="available" />
        <KPICard label="Revenue" value={`$${WEBINARS.reduce((s, w) => s + (w.revenue || 0), 0).toLocaleString()}`} change="total" />
      </KPIBand>

      <div className="flex items-center gap-0.5 p-1 rounded-2xl bg-muted/30 mb-4 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn('flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-semibold rounded-xl transition-all duration-200 shrink-0', activeTab === t.id ? 'bg-background shadow-sm text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30')}>
            <t.icon className="h-3 w-3" />{t.label}
          </button>
        ))}
      </div>

      {/* ═══ DISCOVER ═══ */}
      {activeTab === 'discover' && (
        <>
          {/* Featured live banner */}
          {liveWebinars.length > 0 && (
            <div className="rounded-2xl border bg-gradient-to-r from-[hsl(var(--state-live))]/5 to-transparent p-5 mb-4 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedWebinar(liveWebinars[0])}>
              <div className={cn('h-20 w-20 rounded-2xl flex items-center justify-center shrink-0 relative', liveWebinars[0].coverColor)}>
                <Tv className="h-8 w-8 text-muted-foreground/15" />
                <div className="absolute -top-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-destructive text-destructive-foreground text-[6px] font-bold animate-pulse"><div className="h-1 w-1 rounded-full bg-white" />LIVE</div>
              </div>
              <div className="flex-1 min-w-0">
                <Badge className="text-[7px] bg-[hsl(var(--state-live)/0.1)] text-[hsl(var(--state-live))] border-0 mb-1">Happening Now</Badge>
                <div className="text-[13px] font-bold">{liveWebinars[0].title}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{liveWebinars[0].host} · {liveWebinars[0].attendees} watching · {liveWebinars[0].duration}</div>
              </div>
              <Button size="sm" className="h-9 rounded-xl gap-1.5 shrink-0 bg-[hsl(var(--state-live))] hover:bg-[hsl(var(--state-live))]/90" onClick={e => { e.stopPropagation(); setLiveRoom(liveWebinars[0]); }}><Radio className="h-3.5 w-3.5" />Join Live</Button>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map(w => {
              const sm = STATUS_MAP[w.status];
              const isFull = w.attendees >= w.capacity;
              return (
                <div key={w.id} onClick={() => setSelectedWebinar(w)} className="rounded-2xl border bg-card cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
                  <div className={cn('h-20 flex items-center justify-center relative', w.coverColor)}>
                    <Tv className="h-8 w-8 text-muted-foreground/15 group-hover:scale-110 transition-transform" />
                    <StatusBadge status={sm.state} label={sm.label} className="absolute top-2 left-2" />
                    {w.saved && <BookmarkCheck className="h-3.5 w-3.5 text-accent absolute top-2 right-2" />}
                    {w.status === 'live' && <div className="absolute bottom-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-destructive text-destructive-foreground text-[6px] font-bold animate-pulse"><div className="h-1 w-1 rounded-full bg-white" />{w.attendees}</div>}
                  </div>
                  <div className="p-3">
                    <div className="text-[11px] font-bold mb-0.5 line-clamp-1">{w.title}</div>
                    <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground mb-1.5">
                      <Avatar className="h-4 w-4 ring-1 ring-muted/40"><AvatarFallback className="text-[5px] bg-accent/10 text-accent font-bold">{w.hostAvatar}</AvatarFallback></Avatar>
                      <span>{w.host}</span>
                    </div>
                    <p className="text-[8px] text-muted-foreground line-clamp-2 mb-2">{w.description}</p>
                    <div className="flex items-center justify-between text-[7px] text-muted-foreground border-t pt-1.5">
                      <span>{w.date} · {w.time}</span>
                      <div className="flex items-center gap-1">
                        <Badge className={cn('text-[6px] border-0 capitalize rounded-lg', TICKET_COLORS[w.type])}>{w.type}{w.price ? ` ${w.price}` : ''}</Badge>
                        {isFull && <Badge variant="secondary" className="text-[6px] rounded-lg">Full</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-2xl border p-12 text-center"><Tv className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" /><div className="text-[11px] font-bold mb-1">No Webinars Found</div><div className="text-[9px] text-muted-foreground">Try adjusting your filters.</div></div>
          )}
        </>
      )}

      {/* ═══ MY TICKETS ═══ */}
      {activeTab === 'registered' && (
        <div className="space-y-2">
          {REGISTRATIONS.map(r => {
            const rs = REG_STATUS[r.status];
            const w = r.webinarId ? WEBINARS.find(w => w.id === r.webinarId) : null;
            return (
              <div key={r.id} onClick={() => w && setSelectedWebinar(w)} className="rounded-2xl border bg-card p-3.5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3 group">
                <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center shrink-0', w?.coverColor || 'bg-muted')}><Ticket className="h-5 w-5 text-muted-foreground/15" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold truncate group-hover:text-accent transition-colors">{r.webinar}</div>
                  <div className="text-[8px] text-muted-foreground">{r.date} · {r.ticket}{r.amount ? ` · ${r.amount}` : ''}</div>
                </div>
                <StatusBadge status={rs.state} label={rs.label} />
                {r.status === 'registered' && w?.status === 'live' && <Button size="sm" className="h-7 text-[8px] rounded-xl gap-1 bg-[hsl(var(--state-live))] hover:bg-[hsl(var(--state-live))]/90" onClick={e => { e.stopPropagation(); if (w) setLiveRoom(w); }}><Radio className="h-2.5 w-2.5" />Join</Button>}
                {r.status === 'missed' && w?.replayUrl && <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-1"><MonitorPlay className="h-2.5 w-2.5" />Replay</Button>}
              </div>
            );
          })}
          {REGISTRATIONS.length === 0 && (
            <div className="rounded-2xl border p-12 text-center"><Ticket className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" /><div className="text-[11px] font-bold">No Tickets</div><div className="text-[9px] text-muted-foreground">Register for upcoming webinars to see your tickets here.</div></div>
          )}
        </div>
      )}

      {/* ═══ REPLAYS ═══ */}
      {activeTab === 'replays' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {replayWebinars.map(w => (
            <div key={w.id} onClick={() => setSelectedWebinar(w)} className="rounded-2xl border bg-card cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
              <div className={cn('h-20 flex items-center justify-center relative', w.coverColor)}>
                <MonitorPlay className="h-8 w-8 text-muted-foreground/15 group-hover:scale-110 transition-transform" />
                {w.rating && <div className="absolute top-2 right-2 flex items-center gap-0.5 text-[8px] font-semibold bg-card/80 backdrop-blur px-1.5 py-0.5 rounded-lg"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{w.rating}</div>}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><div className="h-10 w-10 rounded-full bg-white/80 flex items-center justify-center"><Play className="h-5 w-5 text-foreground ml-0.5" /></div></div>
              </div>
              <div className="p-3">
                <div className="text-[11px] font-bold mb-0.5 line-clamp-1">{w.title}</div>
                <div className="text-[8px] text-muted-foreground mb-1">{w.host} · {w.date}</div>
                <div className="flex items-center justify-between text-[7px] text-muted-foreground border-t pt-1.5">
                  <span>{w.duration} · {w.attendees.toLocaleString()} views</span>
                  {w.chatMessages && <span>{w.chatMessages} comments</span>}
                </div>
              </div>
            </div>
          ))}
          {replayWebinars.length === 0 && (
            <div className="col-span-full rounded-2xl border p-12 text-center"><MonitorPlay className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" /><div className="text-[11px] font-bold">No Replays</div><div className="text-[9px] text-muted-foreground">Replays will appear here after events end.</div></div>
          )}
        </div>
      )}

      {/* ═══ LIBRARY ═══ */}
      {activeTab === 'library' && (
        <div className="space-y-2">
          {WEBINARS.filter(w => w.saved).map(w => {
            const sm = STATUS_MAP[w.status];
            return (
              <div key={w.id} onClick={() => setSelectedWebinar(w)} className="rounded-2xl border bg-card p-3.5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3 group">
                <div className={cn('h-14 w-14 rounded-xl flex items-center justify-center shrink-0', w.coverColor)}><Tv className="h-6 w-6 text-muted-foreground/15" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold truncate group-hover:text-accent transition-colors">{w.title}</div>
                  <div className="text-[9px] text-muted-foreground">{w.host} · {w.date}</div>
                </div>
                <StatusBadge status={sm.state} label={sm.label} />
                <BookmarkCheck className="h-3.5 w-3.5 text-accent" />
              </div>
            );
          })}
          {WEBINARS.filter(w => w.saved).length === 0 && (
            <div className="rounded-2xl border p-12 text-center"><Bookmark className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" /><div className="text-[11px] font-bold">No Saved Webinars</div><div className="text-[9px] text-muted-foreground">Save webinars to build your library.</div></div>
          )}
        </div>
      )}

      {/* ═══ HOST STUDIO ═══ */}
      {activeTab === 'hosting' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-bold">Your Webinars</div>
            <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => setCreateOpen(true)}><Plus className="h-3 w-3" />New Webinar</Button>
          </div>

          {/* Host cards */}
          <div className="grid grid-cols-2 gap-3">
            {WEBINARS.slice(0, 3).map(w => {
              const sm = STATUS_MAP[w.status];
              return (
                <div key={w.id} className="rounded-2xl border bg-card p-4 hover:shadow-md transition-all">
                  <div className={cn('h-14 rounded-xl flex items-center justify-center mb-3 relative', w.coverColor)}>
                    <Tv className="h-6 w-6 text-muted-foreground/15" />
                    <StatusBadge status={sm.state} label={sm.label} className="absolute top-1.5 left-1.5" />
                  </div>
                  <div className="text-[11px] font-bold mb-0.5 truncate">{w.title}</div>
                  <div className="text-[8px] text-muted-foreground mb-2">{w.date} · {w.attendees}/{w.capacity} seats</div>
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    <div className="rounded-lg border p-1.5 text-center"><div className="text-[9px] font-bold">{w.attendees}</div><div className="text-[6px] text-muted-foreground">Registered</div></div>
                    <div className="rounded-lg border p-1.5 text-center"><div className="text-[9px] font-bold">${(w.revenue || 0).toLocaleString()}</div><div className="text-[6px] text-muted-foreground">Revenue</div></div>
                  </div>
                  <div className="flex gap-1">
                    {w.status === 'upcoming' && <Button size="sm" className="h-6 text-[8px] flex-1 rounded-lg gap-0.5"><Radio className="h-2.5 w-2.5" />Go Live</Button>}
                    {w.status === 'live' && <Button size="sm" className="h-6 text-[8px] flex-1 rounded-lg gap-0.5 bg-[hsl(var(--state-live))]"><Radio className="h-2.5 w-2.5" />Live Now</Button>}
                    {(w.status === 'replay' || w.status === 'ended') && <Button variant="outline" size="sm" className="h-6 text-[8px] flex-1 rounded-lg gap-0.5"><MonitorPlay className="h-2.5 w-2.5" />View Replay</Button>}
                    <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Settings className="h-2.5 w-2.5" /></Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drafts */}
          <SectionCard title="Drafts & Scheduled" className="!rounded-2xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2 p-2 rounded-xl border bg-[hsl(var(--gigvora-amber))]/5 border-[hsl(var(--gigvora-amber))]/20">
                <Tv className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />
                <div className="flex-1 min-w-0"><div className="text-[9px] font-semibold">Cloud Architecture Deep Dive (Draft)</div><div className="text-[7px] text-muted-foreground">Last edited 4h ago</div></div>
                <StatusBadge status="caution" label="Draft" />
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl border">
                <Tv className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex-1 min-w-0"><div className="text-[9px] font-semibold">DevOps Best Practices (Scheduled May 2)</div><div className="text-[7px] text-muted-foreground">34 registered</div></div>
                <StatusBadge status="healthy" label="Scheduled" />
              </div>
            </div>
          </SectionCard>

          {/* Host features */}
          <SectionCard title="Host Features" className="!rounded-2xl">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Live Chat', desc: 'Real-time audience chat', icon: MessageSquare, active: true },
                { label: 'Polls & Q&A', desc: 'Interactive audience polls', icon: BarChart3, active: true },
                { label: 'Donations', desc: 'Accept viewer donations', icon: Heart, active: true },
                { label: 'Auto-Record', desc: 'Save replays automatically', icon: MonitorPlay, active: true },
                { label: 'Paid Access', desc: 'Ticketed entry', icon: DollarSign, active: false },
                { label: 'Co-Hosts', desc: 'Invite guest speakers', icon: Users, active: false },
              ].map(f => (
                <div key={f.label} className={cn('rounded-xl border p-2.5 flex items-start gap-2', f.active && 'border-accent/30 bg-accent/5')}>
                  <f.icon className={cn('h-3.5 w-3.5 mt-0.5', f.active ? 'text-accent' : 'text-muted-foreground')} />
                  <div><div className="text-[9px] font-semibold">{f.label}</div><div className="text-[7px] text-muted-foreground">{f.desc}</div></div>
                  {f.active && <CheckCircle2 className="h-3 w-3 text-accent ml-auto" />}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ ANALYTICS ═══ */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <KPIBand>
            <KPICard label="Total Attendees" value="2,546" change="+18% this month" trend="up" />
            <KPICard label="Revenue" value="$28,036" change="+$4,200 this week" trend="up" />
            <KPICard label="Avg. Attendance" value="78%" change="of registered" />
            <KPICard label="Avg. Rating" value="4.7" change="across all events" />
          </KPIBand>
          <div className="grid grid-cols-2 gap-3">
            <SectionCard title="Top Webinars (30 days)" className="!rounded-2xl">
              <div className="space-y-1">
                {WEBINARS.slice(0, 4).map((w, i) => (
                  <div key={w.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/30 transition-all text-[9px]">
                    <span className="text-[10px] font-bold text-accent w-4 text-center">{i + 1}</span>
                    <div className="flex-1 min-w-0"><div className="font-semibold truncate">{w.title}</div><div className="text-[7px] text-muted-foreground">{w.attendees} attendees · ${(w.revenue || 0).toLocaleString()}</div></div>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Revenue Breakdown" className="!rounded-2xl">
              <div className="space-y-1.5 text-[8px]">
                {[{ label: 'Ticket Sales', amount: '$20,636', pct: 74 }, { label: 'Donations', amount: '$3,400', pct: 12 }, { label: 'VIP Upgrades', amount: '$4,000', pct: 14 }].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between mb-0.5"><span className="text-muted-foreground">{r.label}</span><span className="font-semibold">{r.amount}</span></div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${r.pct}%` }} /></div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
          <SectionCard title="Audience Demographics" className="!rounded-2xl">
            <div className="grid grid-cols-4 gap-2 text-[8px]">
              {[{ label: 'US / Canada', pct: 42 }, { label: 'Europe', pct: 31 }, { label: 'Asia-Pacific', pct: 19 }, { label: 'Other', pct: 8 }].map(d => (
                <div key={d.label} className="text-center">
                  <div className="text-[12px] font-bold text-accent">{d.pct}%</div>
                  <div className="text-muted-foreground">{d.label}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Drawers */}
      <WebinarDrawer webinar={selectedWebinar} open={!!selectedWebinar} onClose={() => setSelectedWebinar(null)} onLive={() => { if (selectedWebinar) setLiveRoom(selectedWebinar); }} />
      <CreateWebinarDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </DashboardLayout>
  );
};

export default WebinarsPage;
