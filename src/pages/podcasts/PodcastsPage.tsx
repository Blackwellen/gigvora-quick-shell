import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import {
  Headphones, Play, Pause, SkipForward, SkipBack, Clock, Search, Plus,
  Users, Star, Heart, Lock, Eye, Bookmark, BookmarkCheck,
  ChevronRight, Volume2, Mic, Radio, DollarSign,
  TrendingUp, ListMusic, Library, Rss, Download, Share2,
  CircleDot, CheckCircle2, Sparkles, BarChart3,
  Upload, Trash2, Settings, ExternalLink, GripVertical,
  MessageSquare, ThumbsUp, X, MoreHorizontal, Repeat,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

// ── Types ──
type ShowAccess = 'free' | 'premium' | 'subscribed' | 'purchased';
type EpisodeStatus = 'new' | 'playing' | 'played' | 'locked' | 'draft' | 'processing';
type MainTab = 'discover' | 'library' | 'queue' | 'creator' | 'albums' | 'purchases' | 'analytics';

interface Show {
  id: string; title: string; creator: string; creatorAvatar: string;
  category: string; episodes: number; subscribers: number; rating: number;
  access: ShowAccess; description: string; saved: boolean;
  latestEp: string; latestDate: string; coverColor: string;
  totalPlays: number; donationsReceived: number;
}

interface Episode {
  id: string; showId: string; title: string; duration: string;
  date: string; status: EpisodeStatus; description: string;
  plays: number; access: ShowAccess; likes: number; comments: number;
  chapters?: string[];
}

interface Album {
  id: string; title: string; showId: string; episodeCount: number;
  access: ShowAccess; price?: string; coverColor: string; description: string;
}

// ── Mock Data ──
const SHOWS: Show[] = [
  { id: 'S-001', title: 'The Growth Engine', creator: 'Sarah Chen', creatorAvatar: 'SC', category: 'Business', episodes: 148, subscribers: 24500, rating: 4.9, access: 'free', description: 'Weekly insights on scaling startups, hiring, and product-market fit from founders who\'ve done it.', saved: true, latestEp: 'Ep 148: When to Pivot', latestDate: '2d ago', coverColor: 'bg-accent/15', totalPlays: 342000, donationsReceived: 1250 },
  { id: 'S-002', title: 'Code & Coffee', creator: 'Marcus Thompson', creatorAvatar: 'MT', category: 'Engineering', episodes: 92, subscribers: 18200, rating: 4.8, access: 'free', description: 'Deep dives into software architecture, dev culture, and engineering leadership.', saved: false, latestEp: 'Ep 92: Monorepos at Scale', latestDate: '5d ago', coverColor: 'bg-primary/15', totalPlays: 198000, donationsReceived: 780 },
  { id: 'S-003', title: 'Venture Insider', creator: 'Priya Gupta', creatorAvatar: 'PG', category: 'VC & Finance', episodes: 67, subscribers: 31000, rating: 4.7, access: 'premium', description: 'Behind-the-scenes of venture capital deals, term sheets, and founder-investor dynamics.', saved: false, latestEp: 'Ep 67: The AI Funding Bubble', latestDate: '1w ago', coverColor: 'bg-[hsl(var(--gigvora-amber))]/15', totalPlays: 456000, donationsReceived: 3200 },
  { id: 'S-004', title: 'Design Matters', creator: 'James O\'Brien', creatorAvatar: 'JO', category: 'Design', episodes: 210, subscribers: 42000, rating: 4.9, access: 'subscribed', description: 'Conversations with leading designers on craft, creativity, and the future of design.', saved: true, latestEp: 'Ep 210: AI in UX Research', latestDate: '3d ago', coverColor: 'bg-[hsl(var(--state-healthy))]/15', totalPlays: 890000, donationsReceived: 5600 },
  { id: 'S-005', title: 'The Remote Report', creator: 'Lina Park', creatorAvatar: 'LP', category: 'Work Culture', episodes: 45, subscribers: 8900, rating: 4.5, access: 'free', description: 'Exploring remote work, async culture, and distributed team dynamics.', saved: false, latestEp: 'Ep 45: Hybrid is Dead', latestDate: '1d ago', coverColor: 'bg-muted', totalPlays: 67000, donationsReceived: 340 },
  { id: 'S-006', title: 'Founder\'s Playbook Pro', creator: 'Alex Rivera', creatorAvatar: 'AR', category: 'Startups', episodes: 34, subscribers: 5600, rating: 4.6, access: 'purchased', description: 'Premium tactical guides for first-time founders. Each episode is a standalone masterclass.', saved: false, latestEp: 'Ep 34: Pricing Strategy', latestDate: '4d ago', coverColor: 'bg-destructive/10', totalPlays: 89000, donationsReceived: 0 },
];

const EPISODES: Episode[] = [
  { id: 'E-1', showId: 'S-001', title: 'Ep 148: When to Pivot', duration: '42 min', date: '2d ago', status: 'new', description: 'Sarah breaks down the signals that tell you it\'s time to pivot.', plays: 3200, access: 'free', likes: 189, comments: 24, chapters: ['Intro', 'Signs to pivot', 'Case study: Slack', 'When NOT to pivot', 'Q&A'] },
  { id: 'E-2', showId: 'S-001', title: 'Ep 147: Hiring Your First 10', duration: '38 min', date: '1w ago', status: 'played', description: 'The playbook for building your founding team.', plays: 5100, access: 'free', likes: 312, comments: 41 },
  { id: 'E-3', showId: 'S-001', title: 'Ep 146: PMF Signals', duration: '45 min', date: '2w ago', status: 'played', description: 'How to know you\'ve actually found product-market fit.', plays: 6800, access: 'free', likes: 445, comments: 58 },
  { id: 'E-4', showId: 'S-003', title: 'Ep 67: The AI Funding Bubble', duration: '55 min', date: '1w ago', status: 'locked', description: 'Is AI funding a bubble? Priya analyzes the data.', plays: 0, access: 'premium', likes: 0, comments: 0 },
  { id: 'E-5', showId: 'S-002', title: 'Ep 92: Monorepos at Scale', duration: '34 min', date: '5d ago', status: 'playing', description: 'Pros and cons of monorepo architecture at scale.', plays: 2400, access: 'free', likes: 156, comments: 19, chapters: ['What is a monorepo', 'Tooling', 'Pros & Cons', 'Real-world examples'] },
  { id: 'E-6', showId: 'S-004', title: 'Ep 210: AI in UX Research', duration: '48 min', date: '3d ago', status: 'new', description: 'How AI is changing user research methodology.', plays: 4100, access: 'subscribed', likes: 267, comments: 33 },
  { id: 'E-7', showId: 'S-005', title: 'Ep 45: Hybrid is Dead', duration: '29 min', date: '1d ago', status: 'new', description: 'Why hybrid work models are failing and what\'s next.', plays: 1200, access: 'free', likes: 89, comments: 12 },
  { id: 'E-8', showId: 'S-006', title: 'Ep 34: Pricing Strategy', duration: '51 min', date: '4d ago', status: 'locked', description: 'A masterclass on SaaS pricing models.', plays: 0, access: 'purchased', likes: 0, comments: 0 },
];

const ALBUMS: Album[] = [
  { id: 'A-1', title: 'Startup Foundations', showId: 'S-001', episodeCount: 12, access: 'free', coverColor: 'bg-accent/15', description: 'Essential episodes on building from zero.' },
  { id: 'A-2', title: 'VC Masterclass', showId: 'S-003', episodeCount: 8, access: 'premium', price: '$29', coverColor: 'bg-[hsl(var(--gigvora-amber))]/15', description: 'Complete fundraising guide.' },
  { id: 'A-3', title: 'Design Systems Deep Dive', showId: 'S-004', episodeCount: 15, access: 'subscribed', coverColor: 'bg-[hsl(var(--state-healthy))]/15', description: 'From tokens to production.' },
  { id: 'A-4', title: 'Engineering Leadership', showId: 'S-002', episodeCount: 10, access: 'free', coverColor: 'bg-primary/15', description: 'Becoming a better engineering leader.' },
];

const PURCHASES = [
  { id: 'P-1', title: 'Founder\'s Playbook Pro — Full Series', price: '$49', date: 'Mar 15, 2026', type: 'Album' },
  { id: 'P-2', title: 'Venture Insider — Annual Sub', price: '$99/yr', date: 'Feb 1, 2026', type: 'Subscription' },
  { id: 'P-3', title: 'Design Matters — Monthly Sub', price: '$9/mo', date: 'Jan 10, 2026', type: 'Subscription' },
];

const ACCESS_COLORS: Record<ShowAccess, string> = {
  free: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  premium: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  subscribed: 'bg-accent/10 text-accent',
  purchased: 'bg-primary/10 text-primary',
};

const STATUS_MAP: Record<EpisodeStatus, { label: string; state: 'healthy' | 'live' | 'pending' | 'blocked' | 'caution' | 'degraded' }> = {
  new: { label: 'New', state: 'healthy' },
  playing: { label: 'Playing', state: 'live' },
  played: { label: 'Played', state: 'degraded' },
  locked: { label: 'Locked', state: 'blocked' },
  draft: { label: 'Draft', state: 'caution' },
  processing: { label: 'Processing', state: 'pending' },
};

const ACTIVITY = [
  { actor: 'Sarah Chen', action: 'published "Ep 148: When to Pivot"', time: '2d ago' },
  { actor: 'System', action: 'Donation received: $25 for The Growth Engine', time: '3d ago' },
  { actor: 'Marcus T.', action: 'started recording new episode', time: '5d ago' },
  { actor: 'Priya G.', action: 'scheduled "Ep 68: AI Regulation" for Apr 18', time: '1w ago' },
];

/* ═══════════════════════════════════════════════════
   Episode Detail Drawer
   ═══════════════════════════════════════════════════ */
const EpisodeDrawer: React.FC<{ episode: Episode | null; open: boolean; onClose: () => void }> = ({ episode, open, onClose }) => {
  const [speed, setSpeed] = useState(1);
  if (!episode) return null;
  const show = SHOWS.find(s => s.id === episode.showId);
  const sm = STATUS_MAP[episode.status];
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Headphones className="h-4 w-4 text-accent" />Episode Detail</SheetTitle></SheetHeader>
        <div className="p-5 space-y-4">
          {/* Cover */}
          <div className={cn('rounded-2xl h-28 flex items-center justify-center', show?.coverColor || 'bg-muted')}>
            <Mic className="h-10 w-10 text-muted-foreground/20" />
          </div>

          <div>
            <div className="text-[12px] font-bold mb-0.5">{episode.title}</div>
            <div className="text-[9px] text-muted-foreground flex items-center gap-2">
              <span>{show?.title}</span><span>·</span><span>{episode.date}</span><span>·</span><span>{episode.duration}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <StatusBadge status={sm.state} label={sm.label} />
            <Badge className={cn('text-[7px] border-0 capitalize', ACCESS_COLORS[episode.access])}>{episode.access}</Badge>
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed">{episode.description}</p>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { icon: Play, value: episode.plays.toLocaleString(), label: 'Plays' },
              { icon: ThumbsUp, value: episode.likes, label: 'Likes' },
              { icon: MessageSquare, value: episode.comments, label: 'Comments' },
              { icon: Clock, value: episode.duration, label: 'Length' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border p-2 text-center">
                <s.icon className="h-3 w-3 mx-auto mb-0.5 text-muted-foreground" />
                <div className="text-[10px] font-bold">{s.value}</div>
                <div className="text-[6px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Chapters */}
          {episode.chapters && (
            <div>
              <div className="text-[10px] font-semibold mb-1.5">Chapters</div>
              <div className="space-y-0.5">
                {episode.chapters.map((ch, i) => (
                  <button key={i} className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/30 transition-all w-full text-left text-[9px] group">
                    <span className="text-[8px] text-muted-foreground font-mono w-4">{i + 1}</span>
                    <span className="group-hover:text-accent transition-colors">{ch}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Playback speed */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl border">
            <span className="text-[9px] text-muted-foreground">Speed</span>
            <div className="flex gap-0.5">
              {[0.5, 1, 1.25, 1.5, 2].map(s => (
                <button key={s} onClick={() => setSpeed(s)} className={cn('px-2 py-0.5 rounded-lg text-[8px] font-semibold transition-all', speed === s ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/30')}>
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {episode.status === 'locked' && (
            <div className="rounded-xl border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 px-3 py-2.5 flex items-start gap-2">
              <Lock className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0 mt-0.5" />
              <div className="text-[9px]"><span className="font-semibold">Premium Content.</span> {episode.access === 'premium' ? ' Subscribe to unlock.' : ' Purchase required.'}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            {episode.status !== 'locked' ? (
              <Button size="sm" className="h-8 text-[9px] gap-1 rounded-xl"><Play className="h-3 w-3" />Play</Button>
            ) : (
              <Button size="sm" className="h-8 text-[9px] gap-1 rounded-xl"><Lock className="h-3 w-3" />{episode.access === 'premium' ? 'Subscribe' : 'Purchase'}</Button>
            )}
            <Button variant="outline" size="sm" className="h-8 text-[9px] gap-1 rounded-xl"><Download className="h-3 w-3" />Download</Button>
            <Button variant="outline" size="sm" className="h-8 text-[9px] gap-1 rounded-xl"><Share2 className="h-3 w-3" />Share</Button>
            <Button variant="outline" size="sm" className="h-8 text-[9px] gap-1 rounded-xl"><Bookmark className="h-3 w-3" />Save</Button>
            <Button variant="outline" size="sm" className="h-8 text-[9px] gap-1 rounded-xl"><ListMusic className="h-3 w-3" />Queue</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ═══════════════════════════════════════════════════
   Show Detail Drawer
   ═══════════════════════════════════════════════════ */
const ShowDrawer: React.FC<{ show: Show | null; open: boolean; onClose: () => void; onEpisode: (ep: Episode) => void }> = ({ show, open, onClose, onEpisode }) => {
  if (!show) return null;
  const showEps = EPISODES.filter(e => e.showId === show.id);
  const showAlbums = ALBUMS.filter(a => a.showId === show.id);
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[500px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Headphones className="h-4 w-4 text-accent" />Show Detail</SheetTitle></SheetHeader>
        <div className="p-5 space-y-4">
          {/* Cover */}
          <div className={cn('h-24 rounded-2xl flex items-center justify-center relative', show.coverColor)}>
            <Mic className="h-10 w-10 text-muted-foreground/20" />
            <Badge className={cn('absolute top-2 right-2 text-[7px] border-0 capitalize', ACCESS_COLORS[show.access])}>{show.access}</Badge>
          </div>

          <div>
            <div className="text-[13px] font-bold">{show.title}</div>
            <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground">
              <Avatar className="h-5 w-5 ring-1 ring-muted/40"><AvatarFallback className="text-[6px] bg-accent/10 text-accent font-bold">{show.creatorAvatar}</AvatarFallback></Avatar>
              <span className="font-medium">{show.creator}</span>
              <span>·</span>
              <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{show.rating}</span>
              <span>·</span>
              <span>{show.category}</span>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed">{show.description}</p>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'Episodes', value: show.episodes },
              { label: 'Subscribers', value: show.subscribers.toLocaleString() },
              { label: 'Total Plays', value: show.totalPlays.toLocaleString() },
              { label: 'Donations', value: `$${show.donationsReceived}` },
            ].map(s => (
              <div key={s.label} className="rounded-xl border p-2 text-center">
                <div className="text-[10px] font-bold">{s.value}</div>
                <div className="text-[6px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Episodes */}
          {showEps.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold mb-1.5">Latest Episodes</div>
              <div className="space-y-0.5">
                {showEps.map(ep => {
                  const esm = STATUS_MAP[ep.status];
                  return (
                    <button key={ep.id} onClick={() => onEpisode(ep)} className={cn('flex items-center gap-2 p-2 rounded-xl w-full text-left text-[9px] hover:bg-muted/30 transition-all group', ep.status === 'playing' && 'bg-accent/5 border border-accent/20', ep.status === 'locked' && 'opacity-50')}>
                      {ep.status === 'playing' ? <Pause className="h-3.5 w-3.5 text-accent" /> : ep.status === 'locked' ? <Lock className="h-3.5 w-3.5 text-muted-foreground" /> : ep.status === 'played' ? <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" /> : <Play className="h-3.5 w-3.5 text-muted-foreground group-hover:text-accent transition-colors" />}
                      <div className="flex-1 min-w-0"><div className="truncate font-medium">{ep.title}</div><div className="text-[7px] text-muted-foreground">{ep.date} · {ep.duration} · {ep.plays.toLocaleString()} plays</div></div>
                      <StatusBadge status={esm.state} label={esm.label} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Albums */}
          {showAlbums.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold mb-1.5">Albums</div>
              <div className="space-y-1">
                {showAlbums.map(a => (
                  <div key={a.id} className="flex items-center gap-2 p-2 rounded-xl border hover:shadow-sm transition-all">
                    <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', a.coverColor)}><ListMusic className="h-3.5 w-3.5 text-muted-foreground/30" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-semibold truncate">{a.title}</div>
                      <div className="text-[7px] text-muted-foreground">{a.episodeCount} episodes{a.price ? ` · ${a.price}` : ''}</div>
                    </div>
                    <Badge className={cn('text-[6px] border-0 capitalize', ACCESS_COLORS[a.access])}>{a.access}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(show.access === 'premium' || show.access === 'purchased') && (
            <div className="rounded-xl border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 px-3 py-2.5 flex items-start gap-2">
              <Lock className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0 mt-0.5" />
              <div className="text-[9px]"><span className="font-semibold">Premium Content.</span> {show.access === 'premium' ? ' Subscribe to unlock all episodes.' : ' This show requires a one-time purchase.'}</div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            {(show.access === 'free' || show.access === 'subscribed') && <Button size="sm" className="h-8 text-[9px] gap-1 rounded-xl"><Play className="h-3 w-3" />Play Latest</Button>}
            {show.access === 'premium' && <Button size="sm" className="h-8 text-[9px] gap-1 rounded-xl"><Lock className="h-3 w-3" />Subscribe</Button>}
            {show.access === 'purchased' && <Button size="sm" className="h-8 text-[9px] gap-1 rounded-xl"><DollarSign className="h-3 w-3" />Purchase</Button>}
            <Button variant="outline" size="sm" className="h-8 text-[9px] gap-1 rounded-xl"><Heart className="h-3 w-3" />Donate</Button>
            <Button variant="outline" size="sm" className="h-8 text-[9px] gap-1 rounded-xl">{show.saved ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}{show.saved ? 'Saved' : 'Save'}</Button>
            <Button variant="outline" size="sm" className="h-8 text-[9px] gap-1 rounded-xl"><Share2 className="h-3 w-3" />Share</Button>
            <Button variant="outline" size="sm" className="h-8 text-[9px] gap-1 rounded-xl"><Rss className="h-3 w-3" />RSS</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ═══════════════════════════════════════════════════
   Record / Publish Drawer
   ═══════════════════════════════════════════════════ */
const RecordDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Sheet open={open} onOpenChange={onClose}>
    <SheetContent className="w-[480px] overflow-y-auto p-0">
      <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Mic className="h-4 w-4 text-accent" />New Episode</SheetTitle></SheetHeader>
      <div className="p-5 space-y-4">
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Show</label>
          <select className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]">
            {SHOWS.map(s => <option key={s.id}>{s.title}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Episode Title</label>
          <input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30" placeholder="e.g. Ep 149: Growth Levers" />
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Description</label>
          <textarea className="w-full h-20 rounded-xl border bg-background px-3 py-2 text-[11px] resize-none focus:outline-none focus:ring-2 focus:ring-accent/30" placeholder="What's this episode about?" />
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Audio File</label>
          <div className="rounded-2xl border-2 border-dashed border-accent/30 bg-accent/5 p-6 text-center cursor-pointer hover:border-accent/50 transition-all">
            <Upload className="h-8 w-8 mx-auto mb-2 text-accent/40" />
            <div className="text-[10px] font-semibold">Drop audio file or click to browse</div>
            <div className="text-[8px] text-muted-foreground mt-0.5">MP3, WAV, M4A · Max 500 MB</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">Access</label>
            <select className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]">
              <option>Free</option><option>Premium (Subscribers)</option><option>Paid (One-time)</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">Price (if paid)</label>
            <input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]" placeholder="$0.00" />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Chapters (one per line)</label>
          <textarea className="w-full h-16 rounded-xl border bg-background px-3 py-2 text-[11px] resize-none focus:outline-none focus:ring-2 focus:ring-accent/30" placeholder="Intro&#10;Main topic&#10;Q&A" />
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Schedule</label>
          <div className="flex items-center gap-2">
            <input type="date" className="h-9 rounded-xl border bg-background px-3 text-[11px] flex-1" />
            <input type="time" className="h-9 rounded-xl border bg-background px-3 text-[11px] w-28" />
          </div>
        </div>
        <div className="flex gap-2 border-t pt-4">
          <Button className="flex-1 h-10 rounded-2xl text-[11px] gap-1.5" onClick={() => { onClose(); toast.success('Episode published!'); }}>
            <Upload className="h-4 w-4" />Publish Episode
          </Button>
          <Button variant="outline" className="h-10 rounded-2xl text-[11px] gap-1.5" onClick={() => { onClose(); toast.info('Draft saved.'); }}>
            Save Draft
          </Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
);

/* ═══════════════════════════════════════════════════
   Player Dock
   ═══════════════════════════════════════════════════ */
const PlayerDock: React.FC = () => {
  const [playing, setPlaying] = useState(true);
  const [progress] = useState(65);
  return (
    <div className="rounded-2xl border bg-card shadow-card p-3.5">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 group cursor-pointer hover:shadow-md transition-all">
          <Mic className="h-6 w-6 text-primary/40 group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold truncate">Ep 92: Monorepos at Scale</div>
          <div className="text-[8px] text-muted-foreground">Code & Coffee · Marcus Thompson</div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[8px] text-muted-foreground font-mono">22:05</span>
            <Progress value={progress} className="h-1.5 flex-1" />
            <span className="text-[8px] text-muted-foreground font-mono">34:00</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg"><SkipBack className="h-3.5 w-3.5" /></Button>
          <Button size="sm" className="h-9 w-9 p-0 rounded-full" onClick={() => setPlaying(!playing)}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg"><SkipForward className="h-3.5 w-3.5" /></Button>
          <div className="flex items-center gap-1.5 ml-2 border-l pl-2">
            <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
            <Slider defaultValue={[75]} max={100} step={1} className="w-16" />
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg ml-1"><Repeat className="h-3 w-3 text-muted-foreground" /></Button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
const PodcastsPage: React.FC = () => {
  const { activeRole } = useRole();
  const [activeTab, setActiveTab] = useState<MainTab>('discover');
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = [...new Set(SHOWS.map(s => s.category))];

  const filtered = SHOWS.filter(s => {
    if (accessFilter !== 'all' && s.access !== accessFilter) return false;
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase()) && !s.creator.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const TABS: { id: MainTab; label: string; icon: LucideIcon }[] = [
    { id: 'discover', label: 'Discover', icon: Headphones },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'queue', label: 'Queue', icon: ListMusic },
    { id: 'albums', label: 'Albums', icon: Radio },
    { id: 'purchases', label: 'Purchases', icon: DollarSign },
    { id: 'creator', label: 'Creator Studio', icon: Mic },
    ...(activeRole === 'professional' || activeRole === 'enterprise' ? [{ id: 'analytics' as MainTab, label: 'Analytics', icon: BarChart3 }] : []),
  ];

  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Headphones className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Podcasts</span>
        <Badge variant="secondary" className="text-[7px] rounded-lg">{SHOWS.length} shows</Badge>
      </div>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shows..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[9px] w-44 focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>
      <select value={accessFilter} onChange={e => setAccessFilter(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px] ml-1.5">
        <option value="all">All Access</option>
        <option value="free">Free</option><option value="premium">Premium</option>
        <option value="subscribed">Subscribed</option><option value="purchased">Purchased</option>
      </select>
      <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px] ml-1">
        <option value="all">All Categories</option>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1 ml-1.5" onClick={() => setRecordOpen(true)}><Plus className="h-3 w-3" />New Episode</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Now Playing" icon={<CircleDot className="h-3.5 w-3.5 text-accent animate-pulse" />} className="!rounded-2xl">
        <div className="text-[9px]">
          <div className="font-semibold">Ep 92: Monorepos at Scale</div>
          <div className="text-[7px] text-muted-foreground mt-0.5">Code & Coffee · Marcus Thompson</div>
          <Progress value={65} className="h-1.5 mt-1.5" />
          <div className="flex justify-between text-[7px] text-muted-foreground mt-0.5"><span>22:05</span><span>34:00</span></div>
        </div>
      </SectionCard>

      <SectionCard title="Your Library" icon={<Library className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
        <div className="space-y-0.5">
          {SHOWS.filter(s => s.saved).map(s => (
            <button key={s.id} onClick={() => setSelectedShow(s)} className="flex items-center gap-2 p-2 rounded-xl w-full text-left hover:bg-muted/30 transition-all text-[9px] group">
              <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0', s.coverColor)}><Mic className="h-3 w-3 text-muted-foreground/30" /></div>
              <div className="flex-1 min-w-0"><div className="font-semibold truncate group-hover:text-accent transition-colors">{s.title}</div><div className="text-[7px] text-muted-foreground">{s.episodes} eps</div></div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Listening Stats" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[
            { l: 'Hours Listened', v: '86h' },
            { l: 'Shows Subscribed', v: '12' },
            { l: 'Episodes Played', v: '234' },
            { l: 'Donations Given', v: '$45' },
          ].map(s => (
            <div key={s.l} className="flex justify-between"><span className="text-muted-foreground">{s.l}</span><span className="font-bold">{s.v}</span></div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { label: 'Browse Shows', icon: Headphones, action: () => setActiveTab('discover') },
            { label: 'My Queue', icon: ListMusic, action: () => setActiveTab('queue') },
            { label: 'Donations', icon: Heart, action: () => toast.info('Donations') },
            { label: 'Creator Studio', icon: Mic, action: () => setActiveTab('creator') },
            { label: 'Settings', icon: Settings, action: () => toast.info('Settings') },
          ].map(a => (
            <button key={a.label} onClick={a.action} className="flex items-center gap-2 p-2 rounded-xl w-full text-left hover:bg-muted/30 transition-all text-[9px] font-medium group">
              <a.icon className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" /><span className="group-hover:text-accent transition-colors">{a.label}</span>
              <ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="space-y-3">
      <PlayerDock />
      <div className="px-1">
        <div className="text-[10px] font-bold mb-2 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-accent" />Recent Activity</div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {ACTIVITY.map((a, i) => (
            <div key={i} className="shrink-0 rounded-2xl border bg-card px-3.5 py-2.5 min-w-[200px] hover:shadow-sm transition-all">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Avatar className="h-4 w-4 ring-1 ring-muted/40"><AvatarFallback className="text-[5px] bg-accent/10 text-accent font-bold">{a.actor[0]}</AvatarFallback></Avatar>
                <span className="text-[9px] font-semibold">{a.actor}</span>
              </div>
              <p className="text-[8px] text-muted-foreground line-clamp-2">{a.action}</p>
              <div className="text-[7px] text-muted-foreground mt-0.5">{a.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52" bottomSection={bottomSection}>
      {/* KPI Band */}
      <KPIBand className="mb-4">
        <KPICard label="Shows" value={String(SHOWS.length)} change="available" />
        <KPICard label="Subscribed" value="12" change="in library" />
        <KPICard label="Listened" value="86h" change="all time" trend="up" />
        <KPICard label="Queue" value="8" change="episodes" />
        <KPICard label="Donations" value="$45" change="given" />
      </KPIBand>

      {/* Tab Nav */}
      <div className="flex items-center gap-0.5 p-1 rounded-2xl bg-muted/30 mb-4 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn(
            'flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-semibold rounded-xl transition-all duration-200 shrink-0',
            activeTab === t.id ? 'bg-background shadow-sm text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          )}><t.icon className="h-3 w-3" />{t.label}</button>
        ))}
      </div>

      {/* ═══ DISCOVER ═══ */}
      {activeTab === 'discover' && (
        <>
          {/* Featured show */}
          <div className="rounded-2xl border bg-gradient-to-r from-accent/5 to-transparent p-5 mb-4 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedShow(SHOWS[0])}>
            <div className={cn('h-20 w-20 rounded-2xl flex items-center justify-center shrink-0', SHOWS[0].coverColor)}><Mic className="h-8 w-8 text-muted-foreground/20" /></div>
            <div className="flex-1 min-w-0">
              <Badge className="text-[7px] bg-accent/10 text-accent border-0 mb-1">Featured</Badge>
              <div className="text-[13px] font-bold">{SHOWS[0].title}</div>
              <div className="text-[9px] text-muted-foreground mt-0.5">{SHOWS[0].creator} · {SHOWS[0].episodes} episodes · <Star className="h-2.5 w-2.5 inline text-[hsl(var(--gigvora-amber))]" /> {SHOWS[0].rating}</div>
              <p className="text-[9px] text-muted-foreground mt-1 line-clamp-1">{SHOWS[0].description}</p>
            </div>
            <Button size="sm" className="h-9 rounded-xl gap-1.5 shrink-0"><Play className="h-3.5 w-3.5" />Play Latest</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map(s => (
              <div key={s.id} onClick={() => setSelectedShow(s)} className="rounded-2xl border bg-card cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
                <div className={cn('h-20 flex items-center justify-center relative', s.coverColor)}>
                  <Mic className="h-8 w-8 text-muted-foreground/15 group-hover:scale-110 transition-transform" />
                  <Badge className={cn('absolute top-2 left-2 text-[6px] border-0 capitalize', ACCESS_COLORS[s.access])}>{s.access}</Badge>
                  {s.saved && <BookmarkCheck className="h-3.5 w-3.5 text-accent absolute top-2 right-2" />}
                  <button onClick={e => { e.stopPropagation(); }} className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <div className="h-10 w-10 rounded-full bg-white/80 flex items-center justify-center"><Play className="h-5 w-5 text-foreground ml-0.5" /></div>
                  </button>
                </div>
                <div className="p-3">
                  <div className="text-[11px] font-bold mb-0.5 line-clamp-1">{s.title}</div>
                  <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground mb-1.5">
                    <Avatar className="h-4 w-4 ring-1 ring-muted/40"><AvatarFallback className="text-[5px] bg-accent/10 text-accent font-bold">{s.creatorAvatar}</AvatarFallback></Avatar>
                    <span>{s.creator}</span>
                  </div>
                  <p className="text-[8px] text-muted-foreground line-clamp-2 mb-2">{s.description}</p>
                  <div className="flex items-center justify-between text-[7px] text-muted-foreground border-t pt-1.5">
                    <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{s.rating} · {s.episodes} eps</span>
                    <span>{s.subscribers.toLocaleString()} subs</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-2xl border p-12 text-center">
              <Headphones className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-[11px] font-bold mb-1">No Shows Found</div>
              <div className="text-[9px] text-muted-foreground">Try adjusting your filters.</div>
            </div>
          )}
        </>
      )}

      {/* ═══ LIBRARY ═══ */}
      {activeTab === 'library' && (
        <div className="space-y-2">
          {SHOWS.filter(s => s.saved || s.access === 'subscribed').map(s => (
            <div key={s.id} onClick={() => setSelectedShow(s)} className="rounded-2xl border bg-card p-3.5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3 group">
              <div className={cn('h-14 w-14 rounded-xl flex items-center justify-center shrink-0 group-hover:shadow-md transition-all', s.coverColor)}><Mic className="h-6 w-6 text-muted-foreground/15" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold truncate group-hover:text-accent transition-colors">{s.title}</div>
                <div className="text-[9px] text-muted-foreground">{s.creator} · {s.episodes} episodes</div>
                <div className="text-[8px] text-muted-foreground mt-0.5">Latest: {s.latestEp} · {s.latestDate}</div>
              </div>
              <Badge className={cn('text-[7px] border-0 capitalize', ACCESS_COLORS[s.access])}>{s.access}</Badge>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg"><Play className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
          {SHOWS.filter(s => s.saved || s.access === 'subscribed').length === 0 && (
            <div className="rounded-2xl border p-12 text-center">
              <Library className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-[11px] font-bold">Your Library is Empty</div>
              <div className="text-[9px] text-muted-foreground">Subscribe to shows to build your library.</div>
            </div>
          )}
        </div>
      )}

      {/* ═══ QUEUE ═══ */}
      {activeTab === 'queue' && (
        <div className="space-y-1.5">
          {EPISODES.filter(e => e.status !== 'locked').map((ep, i) => {
            const esm = STATUS_MAP[ep.status];
            const show = SHOWS.find(s => s.id === ep.showId);
            return (
              <div key={ep.id} onClick={() => setSelectedEpisode(ep)} className={cn('flex items-center gap-2.5 p-3 rounded-2xl border bg-card cursor-pointer hover:shadow-sm transition-all text-[9px] group', ep.status === 'playing' && 'border-accent/30 bg-accent/5')}>
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 cursor-grab" />
                <span className="text-[9px] text-muted-foreground font-mono w-4 text-center">{i + 1}</span>
                <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', show?.coverColor || 'bg-muted')}>
                  {ep.status === 'playing' ? <Pause className="h-4 w-4 text-accent" /> : <Play className="h-4 w-4 text-muted-foreground/30 group-hover:text-accent transition-colors" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{ep.title}</div>
                  <div className="text-[7px] text-muted-foreground">{show?.title} · {ep.date} · {ep.duration}</div>
                </div>
                <div className="flex items-center gap-1.5 text-[7px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Play className="h-2 w-2" />{ep.plays.toLocaleString()}</span>
                </div>
                <StatusBadge status={esm.state} label={esm.label} />
              </div>
            );
          })}
          {EPISODES.some(e => e.status === 'locked') && (
            <div className="rounded-2xl border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 px-4 py-3 flex items-start gap-2.5 mt-2">
              <Lock className="h-4 w-4 text-[hsl(var(--gigvora-amber))] shrink-0 mt-0.5" />
              <div className="text-[9px]"><span className="font-semibold">Premium Locked.</span> Some episodes require a subscription to access.</div>
            </div>
          )}
        </div>
      )}

      {/* ═══ ALBUMS ═══ */}
      {activeTab === 'albums' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ALBUMS.map(a => {
            const show = SHOWS.find(s => s.id === a.showId);
            return (
              <div key={a.id} className="rounded-2xl border bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                <div className={cn('h-24 flex items-center justify-center relative', a.coverColor)}>
                  <ListMusic className="h-8 w-8 text-muted-foreground/15 group-hover:scale-110 transition-transform" />
                  <Badge className={cn('absolute top-2 left-2 text-[6px] border-0 capitalize', ACCESS_COLORS[a.access])}>{a.access}</Badge>
                  {a.price && <Badge className="absolute top-2 right-2 text-[7px] bg-accent text-accent-foreground border-0">{a.price}</Badge>}
                </div>
                <div className="p-3">
                  <div className="text-[11px] font-bold truncate mb-0.5">{a.title}</div>
                  <div className="text-[8px] text-muted-foreground">{show?.title} · {a.episodeCount} episodes</div>
                  <p className="text-[8px] text-muted-foreground line-clamp-2 mt-1">{a.description}</p>
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" className="h-6 text-[8px] flex-1 gap-0.5 rounded-lg"><Play className="h-2.5 w-2.5" />Play</Button>
                    {a.price && <Button variant="outline" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><DollarSign className="h-2.5 w-2.5" />Buy</Button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ PURCHASES ═══ */}
      {activeTab === 'purchases' && (
        <div className="space-y-2">
          {PURCHASES.map(p => (
            <div key={p.id} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                {p.type === 'Subscription' ? <Rss className="h-4 w-4 text-accent" /> : <DollarSign className="h-4 w-4 text-accent" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold truncate">{p.title}</div>
                <div className="text-[8px] text-muted-foreground">{p.type} · {p.date}</div>
              </div>
              <div className="text-[11px] font-bold text-accent">{p.price}</div>
              <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-1"><ExternalLink className="h-2.5 w-2.5" />View</Button>
            </div>
          ))}
          {PURCHASES.length === 0 && (
            <div className="rounded-2xl border p-12 text-center">
              <DollarSign className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-[11px] font-bold">No Purchases Yet</div>
              <div className="text-[9px] text-muted-foreground">Your subscriptions and purchases will appear here.</div>
            </div>
          )}
        </div>
      )}

      {/* ═══ CREATOR STUDIO ═══ */}
      {activeTab === 'creator' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-bold">Your Shows</div>
            <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Create Show')}><Plus className="h-3 w-3" />Create Show</Button>
          </div>

          {/* Creator show cards */}
          <div className="grid grid-cols-2 gap-3">
            {SHOWS.slice(0, 2).map(s => (
              <div key={s.id} className="rounded-2xl border bg-card p-4 hover:shadow-md transition-all">
                <div className={cn('h-14 rounded-xl flex items-center justify-center mb-3', s.coverColor)}><Mic className="h-6 w-6 text-muted-foreground/15" /></div>
                <div className="text-[11px] font-bold mb-0.5">{s.title}</div>
                <div className="text-[8px] text-muted-foreground mb-2">{s.episodes} episodes · {s.subscribers.toLocaleString()} subs</div>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  <div className="rounded-lg border p-1.5 text-center"><div className="text-[9px] font-bold">{s.totalPlays.toLocaleString()}</div><div className="text-[6px] text-muted-foreground">Plays</div></div>
                  <div className="rounded-lg border p-1.5 text-center"><div className="text-[9px] font-bold">${s.donationsReceived}</div><div className="text-[6px] text-muted-foreground">Donations</div></div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" className="h-6 text-[8px] flex-1 rounded-lg gap-0.5" onClick={() => setRecordOpen(true)}><Plus className="h-2.5 w-2.5" />New Ep</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Settings className="h-2.5 w-2.5" /></Button>
                </div>
              </div>
            ))}
          </div>

          {/* Drafts */}
          <SectionCard title="Drafts & Processing" className="!rounded-2xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2 p-2 rounded-xl border bg-[hsl(var(--gigvora-amber))]/5 border-[hsl(var(--gigvora-amber))]/20">
                <Mic className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />
                <div className="flex-1 min-w-0"><div className="text-[9px] font-semibold">Ep 149: Growth Levers (Draft)</div><div className="text-[7px] text-muted-foreground">Last edited 2h ago</div></div>
                <StatusBadge status="caution" label="Draft" />
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl border">
                <Mic className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex-1 min-w-0"><div className="text-[9px] font-semibold">Ep 93: Testing in Production</div><div className="text-[7px] text-muted-foreground">Processing audio...</div></div>
                <StatusBadge status="pending" label="Processing" />
              </div>
            </div>
          </SectionCard>

          {/* Monetization */}
          <SectionCard title="Monetization" className="!rounded-2xl">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Donations', desc: 'Accept listener support', icon: Heart, active: true },
                { label: 'Premium Episodes', desc: 'Paid subscriber content', icon: Lock, active: true },
                { label: 'Sponsorships', desc: 'Ad placements & reads', icon: DollarSign, active: false },
                { label: 'One-Time Purchase', desc: 'Sell individual episodes', icon: Sparkles, active: false },
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
            <KPICard label="Total Plays" value="342K" change="+12% this month" trend="up" />
            <KPICard label="Subscribers" value="24.5K" change="+340 this week" trend="up" />
            <KPICard label="Revenue" value="$1,250" change="donations" />
            <KPICard label="Avg. Completion" value="78%" change="+3%" trend="up" />
          </KPIBand>

          <SectionCard title="Top Episodes (30 days)" className="!rounded-2xl">
            <div className="space-y-1">
              {EPISODES.filter(e => e.status !== 'locked').slice(0, 4).map((ep, i) => (
                <div key={ep.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/30 transition-all text-[9px]">
                  <span className="text-[10px] font-bold text-accent w-4 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0"><div className="font-semibold truncate">{ep.title}</div><div className="text-[7px] text-muted-foreground">{ep.plays.toLocaleString()} plays · {ep.likes} likes</div></div>
                  <div className="text-[8px] font-mono text-muted-foreground">{ep.duration}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="grid grid-cols-2 gap-3">
            <SectionCard title="Listener Demographics" className="!rounded-2xl">
              <div className="space-y-1.5 text-[8px]">
                {[
                  { label: 'US / Canada', pct: 45 },
                  { label: 'Europe', pct: 28 },
                  { label: 'Asia-Pacific', pct: 18 },
                  { label: 'Other', pct: 9 },
                ].map(d => (
                  <div key={d.label}>
                    <div className="flex justify-between mb-0.5"><span className="text-muted-foreground">{d.label}</span><span className="font-semibold">{d.pct}%</span></div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${d.pct}%` }} /></div>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Revenue Breakdown" className="!rounded-2xl">
              <div className="space-y-1.5 text-[8px]">
                {[
                  { label: 'Donations', amount: '$780', color: 'bg-accent' },
                  { label: 'Subscriptions', amount: '$320', color: 'bg-primary' },
                  { label: 'One-time', amount: '$150', color: 'bg-[hsl(var(--gigvora-amber))]' },
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', r.color)} />
                    <span className="text-muted-foreground flex-1">{r.label}</span>
                    <span className="font-bold">{r.amount}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* Drawers */}
      <ShowDrawer show={selectedShow} open={!!selectedShow && !selectedEpisode} onClose={() => setSelectedShow(null)} onEpisode={ep => setSelectedEpisode(ep)} />
      <EpisodeDrawer episode={selectedEpisode} open={!!selectedEpisode} onClose={() => setSelectedEpisode(null)} />
      <RecordDrawer open={recordOpen} onClose={() => setRecordOpen(false)} />
    </DashboardLayout>
  );
};

export default PodcastsPage;
