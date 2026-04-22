import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Video, Mic, Radio, Play, Pause, Search, Plus, Calendar,
  Users, Clock, Eye, Star, ThumbsUp, MessageSquare, Share2,
  BarChart3, TrendingUp, DollarSign, Shield, Sparkles,
  Settings, ExternalLink, ChevronRight, Filter, Grid,
  List, Headphones, Monitor, Scissors, BookOpen, Award,
  Heart, Volume2, Download, Bookmark, Globe, Zap, Lock,
  CheckCircle2, AlertTriangle, Upload, FileText, Target,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Webinars Directory ──
const WebinarsDirectory: React.FC = () => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const webinars = [
    { id: 'w1', title: 'Design Systems at Scale', status: 'live', host: 'Sarah Chen', coHost: 'Mike Torres', date: 'Now', attendees: 342, registered: 890, duration: '2h', category: 'Design', isPaid: false, thumbnail: null },
    { id: 'w2', title: 'AI in Recruitment: 2026 Playbook', status: 'upcoming', host: 'Dr. Susan Lee', coHost: null, date: 'Apr 15, 3pm EST', attendees: 0, registered: 1240, duration: '1.5h', category: 'AI / HR', isPaid: true, thumbnail: null },
    { id: 'w3', title: 'Startup Fundraising Masterclass', status: 'upcoming', host: 'James Crawford', coHost: 'Elena Vasquez', date: 'Apr 18, 11am PST', attendees: 0, registered: 567, duration: '3h', category: 'Business', isPaid: true, thumbnail: null },
    { id: 'w4', title: 'Remote Team Management Workshop', status: 'replay', host: 'Amara Obi', coHost: null, date: 'Apr 5', attendees: 456, registered: 890, duration: '2h', category: 'Management', isPaid: false, thumbnail: null },
    { id: 'w5', title: 'Building Gig Marketplace Products', status: 'replay', host: 'Raj Patel', coHost: null, date: 'Mar 28', attendees: 312, registered: 650, duration: '1.5h', category: 'Product', isPaid: false, thumbnail: null },
    { id: 'w6', title: 'Enterprise Sales Pipeline Deep Dive', status: 'upcoming', host: 'David Kim', coHost: 'Lisa Wang', date: 'Apr 22, 2pm EST', attendees: 0, registered: 345, duration: '2h', category: 'Sales', isPaid: true, thumbnail: null },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input placeholder="Search webinars..." className="w-full h-9 rounded-lg border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <select className="h-9 rounded-md border bg-background px-3 text-xs"><option>All Categories</option><option>Design</option><option>AI / HR</option><option>Business</option><option>Sales</option><option>Product</option></select>
          <select className="h-9 rounded-md border bg-background px-3 text-xs"><option>All Status</option><option>Live Now</option><option>Upcoming</option><option>Replay</option></select>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-md">
            <button onClick={() => setView('grid')} className={cn('p-1.5', view === 'grid' ? 'bg-muted' : '')}><Grid className="h-4 w-4" /></button>
            <button onClick={() => setView('list')} className={cn('p-1.5', view === 'list' ? 'bg-muted' : '')}><List className="h-4 w-4" /></button>
          </div>
          <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Host Webinar</Button>
        </div>
      </div>

      <div className={cn(view === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3')}>
        {webinars.map(w => (
          <div key={w.id} className={cn('rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all cursor-pointer', view === 'list' && 'flex items-center')}>
            <div className={cn('bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center relative', view === 'grid' ? 'h-36' : 'h-24 w-40 shrink-0')}>
              <Video className="h-8 w-8 text-accent/40" />
              {w.status === 'live' && (
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold animate-pulse">
                  <Radio className="h-3 w-3" /> LIVE
                </div>
              )}
              {w.isPaid && <div className="absolute top-2 right-2"><Badge className="text-[10px] bg-gigvora-amber/10 text-gigvora-amber"><DollarSign className="h-2.5 w-2.5" /> Paid</Badge></div>}
            </div>
            <div className="p-4 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-[10px]">{w.category}</Badge>
                <Badge className={cn('text-[10px]', w.status === 'live' ? 'bg-destructive/10 text-destructive' : w.status === 'upcoming' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground')}>{w.status === 'live' ? 'Live Now' : w.status === 'upcoming' ? 'Upcoming' : 'Replay'}</Badge>
              </div>
              <h3 className="font-semibold text-sm mb-1">{w.title}</h3>
              <div className="text-xs text-muted-foreground mb-2">
                {w.host}{w.coHost && ` & ${w.coHost}`} · {w.date} · {w.duration}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {w.status === 'live' ? `${w.attendees} watching` : `${w.registered} registered`}</span>
                </div>
                <Button size="sm" className="h-7 text-xs">{w.status === 'live' ? 'Join Now' : w.status === 'upcoming' ? 'Register' : 'Watch Replay'}</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Podcasts ──
const PodcastsLibrary: React.FC = () => {
  const shows = [
    { id: 'p1', title: 'The Future of Work', host: 'Alex Kim', episodes: 67, subscribers: '12.4K', rating: 4.9, category: 'Business', latestEp: 'Ep 67: AI Hiring in 2026', latestDate: 'Apr 7', duration: '42 min' },
    { id: 'p2', title: 'Design Matters', host: 'Sarah Chen', episodes: 45, subscribers: '8.9K', rating: 4.8, category: 'Design', latestEp: 'Ep 45: Systems Thinking', latestDate: 'Apr 5', duration: '38 min' },
    { id: 'p3', title: 'Startup Stories', host: 'Elena Rodriguez', episodes: 89, subscribers: '21K', rating: 4.7, category: 'Startups', latestEp: 'Ep 89: From Garage to IPO', latestDate: 'Apr 6', duration: '55 min' },
    { id: 'p4', title: 'Code & Coffee', host: 'Dev Patel', episodes: 34, subscribers: '6.2K', rating: 4.6, category: 'Tech', latestEp: 'Ep 34: Rust vs Go in 2026', latestDate: 'Apr 3', duration: '48 min' },
    { id: 'p5', title: 'Sales Unlocked', host: 'James Wilson', episodes: 52, subscribers: '9.8K', rating: 4.8, category: 'Sales', latestEp: 'Ep 52: Enterprise Deal Anatomy', latestDate: 'Apr 4', duration: '35 min' },
    { id: 'p6', title: 'The Freelancer Show', host: 'Maria Santos', episodes: 78, subscribers: '15.6K', rating: 4.9, category: 'Freelancing', latestEp: 'Ep 78: Pricing Your Worth', latestDate: 'Apr 8', duration: '41 min' },
  ];

  const [selectedShow, setSelectedShow] = useState<string | null>(null);
  const show = shows.find(s => s.id === selectedShow);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="relative min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input placeholder="Search podcasts, episodes..." className="w-full h-9 rounded-lg border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <select className="h-9 rounded-md border bg-background px-3 text-xs"><option>All Categories</option><option>Business</option><option>Tech</option><option>Design</option><option>Sales</option></select>
        </div>
        <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Create Show</Button>
      </div>

      {!selectedShow ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shows.map(s => (
            <div key={s.id} onClick={() => setSelectedShow(s.id)} className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all cursor-pointer">
              <div className="h-32 bg-gradient-to-br from-gigvora-purple/20 to-accent/10 flex items-center justify-center">
                <Headphones className="h-10 w-10 text-gigvora-purple/40" />
              </div>
              <div className="p-4">
                <Badge variant="secondary" className="text-[10px] mb-2">{s.category}</Badge>
                <h3 className="font-semibold text-sm">{s.title}</h3>
                <div className="text-xs text-muted-foreground mb-2">by {s.host} · {s.episodes} episodes</div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-gigvora-amber text-gigvora-amber" /> {s.rating}</span>
                    <span className="text-muted-foreground">{s.subscribers} subscribers</span>
                  </div>
                </div>
                <div className="mt-3 p-2 rounded-lg bg-muted/30 flex items-center gap-2">
                  <button className="h-7 w-7 rounded-full bg-accent flex items-center justify-center shrink-0"><Play className="h-3 w-3 text-accent-foreground ml-0.5" /></button>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-medium truncate">{s.latestEp}</div>
                    <div className="text-[10px] text-muted-foreground">{s.latestDate} · {s.duration}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : show && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedShow(null)} className="gap-1 text-xs mb-2">← Back to Shows</Button>
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-start gap-6">
              <div className="h-32 w-32 rounded-xl bg-gradient-to-br from-gigvora-purple/20 to-accent/10 flex items-center justify-center shrink-0"><Headphones className="h-12 w-12 text-gigvora-purple/40" /></div>
              <div className="flex-1">
                <Badge variant="secondary" className="text-xs mb-2">{show.category}</Badge>
                <h2 className="text-xl font-bold mb-1">{show.title}</h2>
                <div className="text-sm text-muted-foreground mb-2">by {show.host} · {show.episodes} episodes</div>
                <div className="flex items-center gap-4 text-sm mb-4">
                  <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-gigvora-amber text-gigvora-amber" /> {show.rating}</span>
                  <span className="text-muted-foreground">{show.subscribers} subscribers</span>
                </div>
                <div className="flex gap-2">
                  <Button className="gap-1"><Play className="h-3.5 w-3.5" /> Play Latest</Button>
                  <Button variant="outline" className="gap-1"><Bookmark className="h-3.5 w-3.5" /> Subscribe</Button>
                  <Button variant="outline" className="gap-1"><Share2 className="h-3.5 w-3.5" /> Share</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold text-sm mb-3">Episodes</h3>
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, i) => ({
                ep: show.episodes - i,
                title: [`AI Hiring in 2026`, `Remote Culture Secrets`, `Scaling Past $1M`, `Finding Product-Market Fit`, `The Art of Negotiation`][i],
                date: [`Apr 7`, `Apr 3`, `Mar 28`, `Mar 21`, `Mar 14`][i],
                duration: [`42 min`, `38 min`, `55 min`, `48 min`, `35 min`][i],
                plays: [1240, 890, 2100, 1560, 980][i],
              })).map(ep => (
                <div key={ep.ep} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer">
                  <button className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0 hover:bg-accent hover:text-accent-foreground transition-colors"><Play className="h-4 w-4 ml-0.5" /></button>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Ep {ep.ep}: {ep.title}</div>
                    <div className="text-[10px] text-muted-foreground">{ep.date} · {ep.duration} · {ep.plays.toLocaleString()} plays</div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Share2 className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Bookmark className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Live Sessions ──
const LiveSessionsView: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="font-semibold">Live Sessions & Rooms</h3>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="gap-1"><Calendar className="h-3.5 w-3.5" /> Schedule</Button>
        <Button size="sm" className="gap-1"><Radio className="h-3.5 w-3.5" /> Go Live</Button>
      </div>
    </div>

    {/* Currently Live */}
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
      <h4 className="text-sm font-semibold text-destructive flex items-center gap-2 mb-3"><Radio className="h-4 w-4 animate-pulse" /> Live Now</h4>
      <div className="grid md:grid-cols-2 gap-3">
        {[
          { title: 'AMA: Building at Scale', host: 'Alex Kim', viewers: 234, type: 'AMA', started: '45 min ago' },
          { title: 'Code Review: React Patterns', host: 'Dev Patel', viewers: 89, type: 'Workshop', started: '20 min ago' },
        ].map(s => (
          <div key={s.title} className="rounded-lg border bg-card p-4 flex items-center gap-3">
            <div className="h-16 w-24 rounded-lg bg-gradient-to-br from-destructive/20 to-accent/10 flex items-center justify-center shrink-0">
              <Video className="h-6 w-6 text-destructive/60" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{s.title}</div>
              <div className="text-[10px] text-muted-foreground">{s.host} · {s.type} · {s.started}</div>
              <div className="flex items-center gap-1 text-[10px] text-destructive mt-1"><Eye className="h-3 w-3" /> {s.viewers} watching</div>
            </div>
            <Button size="sm" className="h-7 text-xs bg-destructive hover:bg-destructive/90">Join</Button>
          </div>
        ))}
      </div>
    </div>

    {/* Upcoming Sessions */}
    <div className="rounded-xl border bg-card p-5">
      <h4 className="font-semibold text-sm mb-3">Upcoming Sessions</h4>
      <div className="space-y-2">
        {[
          { title: 'Portfolio Review: Designers', host: 'Sarah Chen', date: 'Apr 10, 3pm', type: 'Workshop', registered: 56, maxCapacity: 100 },
          { title: 'Pitch Practice: Startup Edition', host: 'James Crawford', date: 'Apr 12, 11am', type: 'Interactive', registered: 23, maxCapacity: 30 },
          { title: 'Freelancer Office Hours', host: 'Maria Santos', date: 'Apr 14, 2pm', type: 'Office Hours', registered: 89, maxCapacity: null },
          { title: 'Enterprise Architecture Deep Dive', host: 'Mike Torres', date: 'Apr 15, 10am', type: 'Masterclass', registered: 145, maxCapacity: 200 },
        ].map(s => (
          <div key={s.title} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center"><Monitor className="h-5 w-5 text-accent" /></div>
              <div>
                <div className="text-sm font-medium">{s.title}</div>
                <div className="text-[10px] text-muted-foreground">{s.host} · {s.date} · {s.type}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-muted-foreground">
                {s.registered} registered{s.maxCapacity ? ` / ${s.maxCapacity}` : ''}
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs">Register</Button>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Host Studio Controls */}
    <div className="rounded-xl border bg-accent/5 border-accent/20 p-5">
      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><Settings className="h-4 w-4 text-accent" /> Host Studio</h4>
      <p className="text-xs text-muted-foreground mb-4">Manage your upcoming and past sessions from here.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'My Sessions', value: '12', desc: 'hosted' },
          { label: 'Total Viewers', value: '3.4K', desc: 'lifetime' },
          { label: 'Avg. Rating', value: '4.8', desc: 'from attendees' },
          { label: 'Revenue', value: '$2,450', desc: 'from paid tickets' },
        ].map(s => (
          <div key={s.label} className="rounded-lg bg-card border p-3 text-center">
            <div className="text-lg font-bold">{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Replay Library ──
const ReplayLibrary: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <div className="relative min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input placeholder="Search replays, transcripts..." className="w-full h-9 rounded-lg border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select className="h-9 rounded-md border bg-background px-3 text-xs"><option>All Types</option><option>Webinar</option><option>Podcast</option><option>Workshop</option><option>Interview</option></select>
        <select className="h-9 rounded-md border bg-background px-3 text-xs"><option>Sort: Recent</option><option>Sort: Popular</option><option>Sort: Rating</option></select>
      </div>
      <Button size="sm" variant="outline" className="gap-1"><Upload className="h-3.5 w-3.5" /> Upload Replay</Button>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        { title: 'Design Systems at Scale', type: 'Webinar', host: 'Sarah Chen', date: 'Apr 5', views: 2340, duration: '1h 52m', rating: 4.9, hasTranscript: true, hasChapters: true },
        { title: 'AI Hiring Playbook', type: 'Webinar', host: 'Dr. Susan Lee', date: 'Mar 28', views: 1890, duration: '1h 28m', rating: 4.8, hasTranscript: true, hasChapters: true },
        { title: 'Startup Stories: Ep 89', type: 'Podcast', host: 'Elena Rodriguez', date: 'Apr 6', views: 890, duration: '55m', rating: 4.7, hasTranscript: true, hasChapters: false },
        { title: 'React Patterns Workshop', type: 'Workshop', host: 'Dev Patel', date: 'Apr 1', views: 1560, duration: '2h 15m', rating: 4.9, hasTranscript: true, hasChapters: true },
        { title: 'Freelancer Pricing Strategy', type: 'Webinar', host: 'Maria Santos', date: 'Mar 22', views: 3200, duration: '1h 10m', rating: 4.8, hasTranscript: true, hasChapters: false },
        { title: 'Enterprise Sales Tactics', type: 'Masterclass', host: 'James Wilson', date: 'Mar 15', views: 2100, duration: '2h 45m', rating: 4.6, hasTranscript: false, hasChapters: true },
      ].map(r => (
        <div key={r.title} className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all cursor-pointer">
          <div className="h-32 bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center relative">
            <Play className="h-10 w-10 text-accent/40" />
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px]">{r.duration}</div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Badge variant="secondary" className="text-[10px]">{r.type}</Badge>
              {r.hasTranscript && <Badge variant="secondary" className="text-[10px] gap-0.5"><FileText className="h-2.5 w-2.5" /> Transcript</Badge>}
              {r.hasChapters && <Badge variant="secondary" className="text-[10px] gap-0.5"><BookOpen className="h-2.5 w-2.5" /> Chapters</Badge>}
            </div>
            <h3 className="font-semibold text-sm mb-1">{r.title}</h3>
            <div className="text-xs text-muted-foreground mb-2">{r.host} · {r.date}</div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {r.views.toLocaleString()}</span>
                <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-gigvora-amber text-gigvora-amber" /> {r.rating}</span>
              </div>
              <Button size="sm" variant="outline" className="h-6 text-[10px]"><Play className="h-2.5 w-2.5 mr-1" /> Watch</Button>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* AI Replay Features */}
    <div className="rounded-xl border bg-accent/5 border-accent/20 p-5">
      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> AI Replay Tools</h4>
      <div className="grid md:grid-cols-4 gap-3">
        {[
          { label: 'AI Summaries', desc: 'Auto-generated session summaries', icon: FileText },
          { label: 'Smart Search', desc: 'Search within transcripts', icon: Search },
          { label: 'Clip Generator', desc: 'AI-powered clip extraction', icon: Scissors },
          { label: 'Chapter Markers', desc: 'Auto-detect topic changes', icon: BookOpen },
        ].map(f => (
          <div key={f.label} className="rounded-lg border bg-card p-3 text-center">
            <f.icon className="h-5 w-5 text-accent mx-auto mb-2" />
            <div className="text-xs font-semibold">{f.label}</div>
            <div className="text-[10px] text-muted-foreground">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Clips Library ──
const ClipsLibrary: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="font-semibold">Clips Library</h3>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="gap-1"><Sparkles className="h-3.5 w-3.5" /> AI Generate Clips</Button>
        <Button size="sm" className="gap-1"><Scissors className="h-3.5 w-3.5" /> Create Clip</Button>
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {[
        { title: 'The secret to scaling design teams', source: 'Design Systems at Scale', duration: '2:34', views: 4500, likes: 234 },
        { title: 'Why AI will replace 40% of hiring', source: 'AI Hiring Playbook', duration: '1:45', views: 8900, likes: 567 },
        { title: '3 pricing mistakes freelancers make', source: 'Freelancer Pricing Strategy', duration: '3:12', views: 12400, likes: 890 },
        { title: 'How to nail your startup pitch', source: 'Startup Stories Ep 89', duration: '2:08', views: 6700, likes: 345 },
        { title: 'React patterns you should know', source: 'React Patterns Workshop', duration: '4:22', views: 3400, likes: 178 },
        { title: 'Enterprise sales: first meeting tips', source: 'Enterprise Sales Tactics', duration: '1:55', views: 5600, likes: 289 },
        { title: 'Remote team rituals that work', source: 'Remote Team Management', duration: '2:48', views: 7800, likes: 412 },
        { title: 'Building a personal brand on Gigvora', source: 'The Freelancer Show Ep 78', duration: '3:05', views: 9200, likes: 523 },
      ].map(c => (
        <div key={c.title} className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all cursor-pointer">
          <div className="h-24 bg-gradient-to-br from-primary/20 to-gigvora-purple/10 flex items-center justify-center relative">
            <Play className="h-6 w-6 text-accent/40" />
            <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/70 text-white text-[9px]">{c.duration}</div>
          </div>
          <div className="p-3">
            <div className="text-xs font-semibold mb-0.5 line-clamp-2">{c.title}</div>
            <div className="text-[10px] text-muted-foreground mb-2">from {c.source}</div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{c.views.toLocaleString()} views</span>
              <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5" /> {c.likes}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Video Interviews ──
const VideoInterviewsView: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="font-semibold">Video Interview Rooms</h3>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="gap-1"><Calendar className="h-3.5 w-3.5" /> Schedule Interview</Button>
        <Button size="sm" className="gap-1"><Video className="h-3.5 w-3.5" /> Start Room</Button>
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      {/* Upcoming Interviews */}
      <div className="rounded-xl border bg-card p-5">
        <h4 className="font-semibold text-sm mb-3">Upcoming Interviews</h4>
        <div className="space-y-2">
          {[
            { candidate: 'Alex Johnson', role: 'Sr. Frontend Dev', time: 'Today, 2:30pm', interviewer: 'Sarah Chen', stage: 'Technical', recording: true },
            { candidate: 'Maria Garcia', role: 'Product Designer', time: 'Tomorrow, 10am', interviewer: 'Mike Torres', stage: 'Culture Fit', recording: true },
            { candidate: 'James Park', role: 'DevOps Engineer', time: 'Apr 12, 3pm', interviewer: 'Dev Patel', stage: 'System Design', recording: false },
          ].map(iv => (
            <div key={iv.candidate} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9"><AvatarFallback className="text-xs bg-accent/10 text-accent">{iv.candidate[0]}</AvatarFallback></Avatar>
                <div>
                  <div className="text-sm font-medium">{iv.candidate}</div>
                  <div className="text-[10px] text-muted-foreground">{iv.role} · {iv.stage} · {iv.time}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {iv.recording && <Badge variant="secondary" className="text-[10px] gap-0.5"><Video className="h-2.5 w-2.5" /> REC</Badge>}
                <Button size="sm" className="h-7 text-xs">Join</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Room Features */}
      <div className="rounded-xl border bg-card p-5">
        <h4 className="font-semibold text-sm mb-3">Interview Room Features</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'HD Video & Audio', icon: Video },
            { label: 'Screen Sharing', icon: Monitor },
            { label: 'Live Coding', icon: FileText },
            { label: 'Whiteboard', icon: BookOpen },
            { label: 'Auto Recording', icon: Radio },
            { label: 'AI Transcript', icon: Sparkles },
            { label: 'Scorecard Integration', icon: Star },
            { label: 'Calendar Sync', icon: Calendar },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
              <f.icon className="h-4 w-4 text-accent" />
              <span className="text-xs">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Past Interview Recordings */}
    <div className="rounded-xl border bg-card p-5">
      <h4 className="font-semibold text-sm mb-3">Recent Recordings</h4>
      <div className="space-y-2">
        {[
          { candidate: 'Emma Wilson', role: 'Backend Dev', date: 'Apr 6', duration: '45 min', stage: 'Technical', score: 4.2, hasTranscript: true },
          { candidate: 'Ryan Chen', role: 'Data Analyst', date: 'Apr 4', duration: '35 min', stage: 'Behavioral', score: 3.8, hasTranscript: true },
          { candidate: 'Sophia Kim', role: 'UX Researcher', date: 'Apr 2', duration: '50 min', stage: 'Portfolio', score: 4.5, hasTranscript: false },
        ].map(rec => (
          <div key={rec.candidate} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-muted">{rec.candidate[0]}</AvatarFallback></Avatar>
              <div>
                <div className="text-sm font-medium">{rec.candidate} — {rec.role}</div>
                <div className="text-[10px] text-muted-foreground">{rec.stage} · {rec.date} · {rec.duration}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1"><Star className="h-3 w-3 fill-gigvora-amber text-gigvora-amber" /><span className="text-xs font-medium">{rec.score}/5</span></div>
              {rec.hasTranscript && <Badge variant="secondary" className="text-[10px]">Transcript</Badge>}
              <Button size="sm" variant="outline" className="h-7 text-xs"><Play className="h-2.5 w-2.5 mr-1" /> Watch</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Session Analytics ──
const SessionAnalytics: React.FC = () => (
  <div className="space-y-4">
    <h3 className="font-semibold">Session Analytics</h3>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: 'Total Sessions', value: '156', change: '+12 this month' },
        { label: 'Total Views', value: '45.2K', change: '+18% MoM' },
        { label: 'Avg. Attendance Rate', value: '72%', change: '+5% vs last month' },
        { label: 'Avg. Rating', value: '4.7', change: 'from 2.3K reviews' },
      ].map(s => (
        <div key={s.label} className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">{s.label}</div>
          <div className="text-xl font-bold">{s.value}</div>
          <div className="text-[10px] text-gigvora-green">{s.change}</div>
        </div>
      ))}
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-xl border bg-card p-5">
        <h4 className="font-semibold text-sm mb-3">Content Performance</h4>
        <div className="space-y-3">
          {[
            { type: 'Webinars', sessions: 24, views: '18.5K', convRate: '4.2%', revenue: '$8,400' },
            { type: 'Podcasts', sessions: 89, views: '12.8K', convRate: '2.1%', revenue: '$0' },
            { type: 'Workshops', sessions: 18, views: '6.4K', convRate: '6.8%', revenue: '$3,200' },
            { type: 'Interviews', sessions: 25, views: '2.1K', convRate: 'N/A', revenue: 'N/A' },
          ].map(c => (
            <div key={c.type} className="flex items-center justify-between p-2 rounded-lg border">
              <div className="text-sm font-medium w-24">{c.type}</div>
              <div className="text-xs text-muted-foreground">{c.sessions} sessions</div>
              <div className="text-xs font-medium">{c.views} views</div>
              <div className="text-xs text-accent">{c.convRate} conv.</div>
              <div className="text-xs font-semibold">{c.revenue}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h4 className="font-semibold text-sm mb-3">Engagement Metrics</h4>
        <div className="space-y-3">
          {[
            { metric: 'Avg. Watch Time', value: '68%', bar: 68 },
            { metric: 'Q&A Participation', value: '34%', bar: 34 },
            { metric: 'Chat Activity', value: '56%', bar: 56 },
            { metric: 'Poll Response Rate', value: '78%', bar: 78 },
            { metric: 'Replay Completion', value: '42%', bar: 42 },
          ].map(m => (
            <div key={m.metric}>
              <div className="flex justify-between text-xs mb-1"><span>{m.metric}</span><span className="font-semibold">{m.value}</span></div>
              <Progress value={m.bar} className="h-1.5" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 md:col-span-2">
        <h4 className="font-semibold text-sm mb-3">Top Performing Content</h4>
        <div className="space-y-2">
          {[
            { rank: 1, title: '3 pricing mistakes freelancers make', type: 'Clip', views: '12.4K', engagement: '89%', conversions: 234 },
            { rank: 2, title: 'Design Systems at Scale', type: 'Webinar', views: '8.9K', engagement: '76%', conversions: 123 },
            { rank: 3, title: 'Why AI will replace 40% of hiring', type: 'Clip', views: '8.2K', engagement: '82%', conversions: 98 },
            { rank: 4, title: 'The Freelancer Show Ep 78', type: 'Podcast', views: '7.8K', engagement: '71%', conversions: 67 },
            { rank: 5, title: 'Startup Fundraising Masterclass', type: 'Webinar', views: '6.5K', engagement: '74%', conversions: 89 },
          ].map(t => (
            <div key={t.rank} className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">{t.rank}</div>
              <div className="flex-1"><div className="text-sm font-medium">{t.title}</div><Badge variant="secondary" className="text-[10px] mt-0.5">{t.type}</Badge></div>
              <div className="flex gap-6 text-xs text-muted-foreground">
                <div className="text-center"><div className="font-semibold text-foreground">{t.views}</div><div>views</div></div>
                <div className="text-center"><div className="font-semibold text-foreground">{t.engagement}</div><div>engagement</div></div>
                <div className="text-center"><div className="font-semibold text-foreground">{t.conversions}</div><div>conversions</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Monetization */}
    <div className="rounded-xl border bg-card p-5">
      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><DollarSign className="h-4 w-4 text-accent" /> Monetization</h4>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Ticket Revenue', value: '$11,600' },
          { label: 'Subscriptions', value: '$4,200' },
          { label: 'Sponsorships', value: '$8,500' },
          { label: 'Premium Replays', value: '$1,800' },
          { label: 'Total Revenue', value: '$26,100' },
        ].map(m => (
          <div key={m.label} className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="text-lg font-bold">{m.value}</div>
            <div className="text-[10px] text-muted-foreground">{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── MAIN PAGE ──
const InteractiveMediaPage: React.FC = () => (
  <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Video className="h-6 w-6 text-accent" /> Interactive</h1>
        <p className="text-sm text-muted-foreground">Webinars, podcasts, live sessions, video interviews, replays, and clips</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="gap-1"><Headphones className="h-3.5 w-3.5" /> My Library</Button>
        <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Create</Button>
      </div>
    </div>

    {/* Live indicator */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {[
        { label: 'Live Now', value: '2', icon: Radio, color: 'text-destructive' },
        { label: 'Webinars', value: '156', icon: Video },
        { label: 'Podcasts', value: '89 shows', icon: Headphones },
        { label: 'Clips', value: '1.2K', icon: Scissors },
      ].map(s => (
        <div key={s.label} className="rounded-xl border bg-card p-4">
          <div className={cn('flex items-center gap-1.5 text-xs text-muted-foreground mb-1', s.color)}><s.icon className={cn('h-3.5 w-3.5', s.color, s.label === 'Live Now' && 'animate-pulse')} /> {s.label}</div>
          <div className="text-xl font-bold">{s.value}</div>
        </div>
      ))}
    </div>

    <Tabs defaultValue="webinars">
      <TabsList className="mb-4 flex-wrap h-auto gap-1">
        <TabsTrigger value="webinars" className="text-xs gap-1"><Video className="h-3 w-3" /> Webinars</TabsTrigger>
        <TabsTrigger value="podcasts" className="text-xs gap-1"><Headphones className="h-3 w-3" /> Podcasts</TabsTrigger>
        <TabsTrigger value="live" className="text-xs gap-1"><Radio className="h-3 w-3" /> Live Sessions</TabsTrigger>
        <TabsTrigger value="replays" className="text-xs gap-1"><Play className="h-3 w-3" /> Replay Library</TabsTrigger>
        <TabsTrigger value="clips" className="text-xs gap-1"><Scissors className="h-3 w-3" /> Clips</TabsTrigger>
        <TabsTrigger value="interviews" className="text-xs gap-1"><Users className="h-3 w-3" /> Video Interviews</TabsTrigger>
        <TabsTrigger value="analytics" className="text-xs gap-1"><BarChart3 className="h-3 w-3" /> Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="webinars"><WebinarsDirectory /></TabsContent>
      <TabsContent value="podcasts"><PodcastsLibrary /></TabsContent>
      <TabsContent value="live"><LiveSessionsView /></TabsContent>
      <TabsContent value="replays"><ReplayLibrary /></TabsContent>
      <TabsContent value="clips"><ClipsLibrary /></TabsContent>
      <TabsContent value="interviews"><VideoInterviewsView /></TabsContent>
      <TabsContent value="analytics"><SessionAnalytics /></TabsContent>
    </Tabs>
  </div>
);

export default InteractiveMediaPage;
