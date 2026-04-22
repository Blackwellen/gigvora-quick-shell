import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2,
  Heart, MessageSquare, Share2, Bookmark, ThumbsUp, ThumbsDown,
  Download, Flag, MoreHorizontal, Crown, Eye, Clock, Calendar,
  UserPlus, ChevronLeft, Send, Settings, Film, ArrowRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SUGGESTED = [
  { id: 's1', title: 'How to Build a Design System from Scratch', creator: 'DesignPro', views: '18K', duration: '35:42' },
  { id: 's2', title: 'Startup Metrics That Actually Matter', creator: 'TechFounders', views: '12K', duration: '28:15' },
  { id: 's3', title: 'Remote Team Management Strategies', creator: 'PMInsights', views: '9.4K', duration: '41:00' },
  { id: 's4', title: 'AI Tools for Developers in 2026', creator: 'DevMaster', views: '34K', duration: '52:30' },
  { id: 's5', title: 'Freelance Pricing Strategies', creator: 'GigGuru', views: '22K', duration: '33:20' },
  { id: 's6', title: 'Portfolio Design Tips', creator: 'TypeSchool', views: '7.8K', duration: '19:45' },
];

const COMMENTS = [
  { user: 'Elena V.', avatar: 'EV', text: 'This is the best breakdown I\'ve seen on this topic. The section on unit economics at 18:30 was pure gold.', time: '2h ago', likes: 45, replies: 3 },
  { user: 'Raj K.', avatar: 'RK', text: 'As someone who just started my SaaS journey, this gives me so much hope. Bookmarked! 🔥', time: '5h ago', likes: 23, replies: 1 },
  { user: 'Sophie L.', avatar: 'SL', text: 'Would love a follow-up on the marketing strategies you used in months 6-12.', time: '1d ago', likes: 18, replies: 2 },
  { user: 'Maya C.', avatar: 'MC', text: 'The production quality is amazing. What camera/mic setup do you use?', time: '2d ago', likes: 8, replies: 4 },
];

export default function VideoPlayerDetailPage() {
  const { videoId } = useParams();
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [comment, setComment] = useState('');
  const [tab, setTab] = useState('comments');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Search bar top */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b px-4 py-2">
        <div className="max-w-[1600px] mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <Film className="h-4 w-4 text-accent" />
          <Input placeholder="Search videos..." className="h-8 text-xs max-w-sm" />
          <div className="flex-1" />
          <Link to="/media" className="text-[10px] text-muted-foreground hover:text-accent flex items-center gap-1">Media Home <ArrowRight className="h-2.5 w-2.5" /></Link>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-4 flex gap-4">
        {/* Main Player Column */}
        <div className="flex-1 min-w-0">
          {/* Player */}
          <div className="relative aspect-video rounded-2xl bg-gradient-to-br from-accent/10 via-black to-[hsl(var(--gigvora-purple))]/10 flex items-center justify-center overflow-hidden mb-4 group">
            <button onClick={() => setPlaying(!playing)} className="h-20 w-20 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all hover:scale-110">
              {playing ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
            </button>

            {/* Controls overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 opacity-0 group-hover:opacity-100 transition-all duration-300">
              {/* Progress bar */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-white/70 font-mono">12:34</span>
                <div className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer group/bar">
                  <div className="h-full w-1/3 bg-accent rounded-full relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-accent shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                  </div>
                </div>
                <span className="text-[10px] text-white/70 font-mono">42:15</span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"><SkipBack className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10" onClick={() => setPlaying(!playing)}>
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"><SkipForward className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10" onClick={() => setMuted(!muted)}>
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <div className="flex-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"><Settings className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"><Maximize2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>

          {/* Title & Actions */}
          <h1 className="text-lg font-bold mb-2">Building a $1M SaaS — Full Documentary</h1>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3 flex-wrap">
            <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> 45,234 views</span>
            <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" /> Apr 12, 2026</span>
            <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> 42:15</span>
            <Badge variant="outline" className="text-[8px]">Business</Badge>
            <Badge variant="outline" className="text-[8px]">SaaS</Badge>
            <Badge variant="outline" className="text-[8px]">Documentary</Badge>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Button variant={liked ? 'default' : 'outline'} size="sm" className="h-8 text-[10px] rounded-xl gap-1" onClick={() => setLiked(!liked)}>
              <ThumbsUp className={cn('h-3.5 w-3.5', liked && 'fill-current')} /> {liked ? '4.3K' : '4.2K'}
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl gap-1"><ThumbsDown className="h-3.5 w-3.5" /></Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl gap-1"><Share2 className="h-3.5 w-3.5" /> Share</Button>
            <Button variant={saved ? 'default' : 'outline'} size="sm" className="h-8 text-[10px] rounded-xl gap-1" onClick={() => setSaved(!saved)}>
              <Bookmark className={cn('h-3.5 w-3.5', saved && 'fill-current')} /> Save
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl gap-1"><Download className="h-3.5 w-3.5" /> Download</Button>
            <Button variant="ghost" size="sm" className="h-8 text-[10px] rounded-xl gap-1"><Flag className="h-3.5 w-3.5" /></Button>
          </div>

          {/* Creator Card */}
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-border/40 bg-card mb-4">
            <Avatar className="h-12 w-12 ring-2 ring-accent/10">
              <AvatarFallback className="text-sm bg-accent/10 text-accent">TF</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold">TechFounders</span>
                <Crown className="h-3.5 w-3.5 text-accent" />
              </div>
              <div className="text-[10px] text-muted-foreground">24.3K followers · 142 videos</div>
            </div>
            <Button size="sm" onClick={() => setFollowing(!following)} className={cn('h-8 text-[10px] rounded-xl gap-1', following && 'bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive')}>
              {following ? 'Following' : <><UserPlus className="h-3 w-3" /> Follow</>}
            </Button>
          </div>

          {/* Tabs: Comments / About */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-8 mb-3">
              <TabsTrigger value="comments" className="text-[10px] h-6 px-3">Comments ({COMMENTS.length})</TabsTrigger>
              <TabsTrigger value="about" className="text-[10px] h-6 px-3">About</TabsTrigger>
              <TabsTrigger value="transcript" className="text-[10px] h-6 px-3">Transcript</TabsTrigger>
            </TabsList>

            <TabsContent value="comments">
              <div className="flex gap-2 mb-4">
                <Avatar className="h-7 w-7 shrink-0"><AvatarFallback className="text-[7px] bg-muted">YO</AvatarFallback></Avatar>
                <Input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." className="h-8 text-xs flex-1" />
                <Button size="sm" className="h-8 w-8 p-0 rounded-xl"><Send className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="space-y-4">
                {COMMENTS.map((c, i) => (
                  <div key={i} className="flex gap-2.5">
                    <Avatar className="h-8 w-8 shrink-0"><AvatarFallback className="text-[8px] bg-muted">{c.avatar}</AvatarFallback></Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-semibold">{c.user}</span>
                        <span className="text-[9px] text-muted-foreground">{c.time}</span>
                      </div>
                      <p className="text-[11px] text-foreground/80 mb-1.5">{c.text}</p>
                      <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                        <button className="flex items-center gap-0.5 hover:text-accent"><ThumbsUp className="h-2.5 w-2.5" /> {c.likes}</button>
                        <button className="hover:text-accent">Reply</button>
                        {c.replies > 0 && <button className="text-accent font-medium">{c.replies} replies</button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="about">
              <div className="p-4 rounded-xl bg-muted/30 text-[11px] text-foreground/80 space-y-2">
                <p>The complete journey of building a SaaS product from zero to $1M in annual recurring revenue. This documentary follows TechFounders through every stage — idea validation, MVP development, first customers, fundraising, scaling, and the lessons learned along the way.</p>
                <p className="font-semibold mt-3">Chapters:</p>
                <div className="space-y-1">
                  {['0:00 — Introduction', '2:15 — The Idea', '8:30 — Building the MVP', '15:00 — First 10 Customers', '22:45 — Fundraising', '30:00 — Scaling to $500K', '36:30 — The $1M Milestone', '40:00 — Key Takeaways'].map(ch => (
                    <button key={ch} className="block text-accent hover:underline text-[10px]">{ch}</button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="transcript">
              <div className="p-4 rounded-xl bg-muted/30 text-[10px] text-foreground/70 space-y-2 max-h-[400px] overflow-y-auto">
                <p><span className="text-accent font-mono">0:00</span> Welcome to this documentary about building a million-dollar SaaS company from scratch.</p>
                <p><span className="text-accent font-mono">0:15</span> My name is Alex, and three years ago I had nothing but an idea and a laptop.</p>
                <p><span className="text-accent font-mono">0:28</span> Today, our product serves over 10,000 businesses worldwide.</p>
                <p className="text-muted-foreground italic">... transcript continues ...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar — Suggested */}
        <div className="w-[300px] shrink-0 hidden xl:block">
          <div className="sticky top-20">
            <h3 className="text-xs font-bold mb-3 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-accent" /> Up Next</h3>
            <div className="space-y-2.5">
              {SUGGESTED.map(s => (
                <div key={s.id} onClick={() => navigate(`/media/videos/${s.id}`)} className="flex gap-2.5 cursor-pointer group">
                  <div className="relative h-16 w-28 rounded-xl bg-gradient-to-br from-accent/10 to-muted/30 flex items-center justify-center shrink-0 overflow-hidden">
                    <Play className="h-4 w-4 text-muted-foreground/30 group-hover:text-accent/60 transition-colors" />
                    <span className="absolute bottom-1 right-1 text-[7px] text-white bg-black/70 px-1 py-0.5 rounded font-mono">{s.duration}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold line-clamp-2 group-hover:text-accent transition-colors">{s.title}</p>
                    <div className="text-[8px] text-muted-foreground mt-0.5">{s.creator}</div>
                    <div className="text-[8px] text-muted-foreground flex items-center gap-0.5"><Eye className="h-2 w-2" />{s.views}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
