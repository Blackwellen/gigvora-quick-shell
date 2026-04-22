import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Play, Pause, Heart, MessageSquare, Share2, Bookmark, UserPlus,
  Volume2, VolumeX, ChevronUp, ChevronDown, X, MoreHorizontal,
  Film, Crown, Eye, Music, ArrowRight, Send, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reel {
  id: string; title: string; creator: string; avatar: string; verified: boolean;
  views: string; likes: string; comments: number; shares: number;
  duration: string; category: string; description: string;
  music?: string; following: boolean;
}

const REELS: Reel[] = [
  { id: 'r1', title: 'Design System Tips', creator: 'Sarah Kim', avatar: 'SK', verified: true, views: '12.4K', likes: '2.4K', comments: 89, shares: 45, duration: '0:58', category: 'Design', description: '3 underrated design system patterns that will save you hours ✨', music: 'Original Audio — Sarah Kim', following: false },
  { id: 'r2', title: 'AI Prompt Tricks', creator: 'Alex Mercer', avatar: 'AM', verified: true, views: '8.5K', likes: '1.8K', comments: 56, shares: 32, duration: '0:45', category: 'AI', description: 'Stop writing bad prompts. Here are 5 patterns that actually work 🧠', music: 'Lofi Coding — ChillBeats', following: true },
  { id: 'r3', title: 'Remote Setup Tour', creator: 'Lisa Park', avatar: 'LP', verified: false, views: '6.2K', likes: '1.1K', comments: 34, shares: 18, duration: '1:12', category: 'Lifestyle', description: 'My $500 remote work setup that beats any $5K desk 🏠', following: false },
  { id: 'r4', title: 'Pitch Deck Review', creator: 'Mike Davis', avatar: 'MD', verified: true, views: '15K', likes: '3.2K', comments: 124, shares: 67, duration: '0:52', category: 'Business', description: 'I reviewed 100 pitch decks. Here\'s what separates the top 1% 🚀', following: false },
  { id: 'r5', title: 'CSS Art in 30s', creator: 'Yuki Tanaka', avatar: 'YT', verified: false, views: '4.8K', likes: '890', comments: 22, shares: 11, duration: '0:38', category: 'Dev', description: 'Making a sunset with pure CSS. No images, no JS. Just vibes 🌅', music: 'Synthwave Dreams — RetroWave', following: true },
];

export default function ReelsOverlayPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const navigate = useNavigate();

  const reel = REELS[currentIdx];

  const nextReel = () => setCurrentIdx(i => Math.min(REELS.length - 1, i + 1));
  const prevReel = () => setCurrentIdx(i => Math.max(0, i - 1));

  const toggleLike = (id: string) => {
    setLiked(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const toggleSave = (id: string) => {
    setSaved(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
      {/* Close button */}
      <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-50 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
        <X className="h-5 w-5" />
      </button>

      {/* Navigation arrows */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button onClick={() => navigate('/media/videos')} className="text-[10px] text-white/70 hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all">
          <Film className="h-3 w-3" /> Video Center <ArrowRight className="h-2.5 w-2.5" />
        </button>
      </div>

      {/* Main Reel View */}
      <div className="relative h-full max-w-[420px] w-full flex flex-col">
        {/* Up/Down navigation */}
        <div className="absolute right-[-60px] top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30">
          <button onClick={prevReel} disabled={currentIdx === 0} className={cn('h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white transition-all', currentIdx === 0 ? 'opacity-30' : 'hover:bg-white/20')}>
            <ChevronUp className="h-5 w-5" />
          </button>
          <button onClick={nextReel} disabled={currentIdx === REELS.length - 1} className={cn('h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white transition-all', currentIdx === REELS.length - 1 ? 'opacity-30' : 'hover:bg-white/20')}>
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>

        {/* Video area */}
        <div className="flex-1 relative bg-gradient-to-b from-[hsl(var(--gigvora-purple))]/30 via-black to-black flex items-center justify-center rounded-3xl mx-2 my-2 overflow-hidden" onClick={() => setPlaying(!playing)}>
          {/* Placeholder video content */}
          <div className="absolute inset-0 flex items-center justify-center">
            {!playing && (
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center animate-fade-in">
                <Play className="h-7 w-7 text-white ml-1" />
              </div>
            )}
          </div>

          {/* Duration badge */}
          <Badge className="absolute top-4 right-4 text-[8px] bg-black/50 text-white border-0">{reel.duration}</Badge>
          <Badge className="absolute top-4 left-4 text-[8px] bg-accent/80 text-white border-0">{reel.category}</Badge>

          {/* Progress dots */}
          <div className="absolute top-1.5 left-4 right-4 flex gap-1">
            {REELS.map((_, i) => (
              <div key={i} className={cn('h-0.5 flex-1 rounded-full transition-all', i === currentIdx ? 'bg-white' : i < currentIdx ? 'bg-white/60' : 'bg-white/20')} />
            ))}
          </div>

          {/* Bottom gradient & info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 pt-16">
            {/* Creator */}
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-9 w-9 ring-2 ring-white/20">
                <AvatarFallback className="text-xs bg-accent/20 text-white">{reel.avatar}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white">{reel.creator}</span>
                  {reel.verified && <Crown className="h-3 w-3 text-accent" />}
                </div>
                <span className="text-[9px] text-white/60">{reel.views} views</span>
              </div>
              {!reel.following && (
                <Button size="sm" className="h-6 text-[9px] rounded-full ml-2 gap-1 bg-accent hover:bg-accent/80">
                  <UserPlus className="h-2.5 w-2.5" /> Follow
                </Button>
              )}
            </div>

            {/* Description */}
            <p className="text-[11px] text-white/90 mb-2 line-clamp-2">{reel.description}</p>

            {/* Music */}
            {reel.music && (
              <div className="flex items-center gap-1.5 text-[9px] text-white/50">
                <Music className="h-3 w-3" />
                <span className="truncate">{reel.music}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action sidebar */}
        <div className="absolute right-[-55px] bottom-32 flex flex-col gap-4 items-center z-30">
          <button onClick={() => toggleLike(reel.id)} className="flex flex-col items-center gap-0.5">
            <div className={cn('h-10 w-10 rounded-full flex items-center justify-center transition-all', liked.has(reel.id) ? 'bg-red-500/20' : 'bg-white/10 hover:bg-white/20')}>
              <Heart className={cn('h-5 w-5', liked.has(reel.id) ? 'text-red-500 fill-red-500' : 'text-white')} />
            </div>
            <span className="text-[9px] text-white/70">{reel.likes}</span>
          </button>

          <button onClick={() => setShowComments(!showComments)} className="flex flex-col items-center gap-0.5">
            <div className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <span className="text-[9px] text-white/70">{reel.comments}</span>
          </button>

          <button className="flex flex-col items-center gap-0.5">
            <div className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-[9px] text-white/70">{reel.shares}</span>
          </button>

          <button onClick={() => toggleSave(reel.id)} className="flex flex-col items-center gap-0.5">
            <div className={cn('h-10 w-10 rounded-full flex items-center justify-center transition-all', saved.has(reel.id) ? 'bg-accent/20' : 'bg-white/10 hover:bg-white/20')}>
              <Bookmark className={cn('h-5 w-5', saved.has(reel.id) ? 'text-accent fill-accent' : 'text-white')} />
            </div>
          </button>

          <button onClick={() => setMuted(!muted)}>
            <div className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
              {muted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
            </div>
          </button>

          <button>
            <div className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
              <MoreHorizontal className="h-5 w-5 text-white" />
            </div>
          </button>
        </div>
      </div>

      {/* Comments Panel */}
      {showComments && (
        <div className="absolute bottom-0 left-0 right-0 max-h-[50vh] bg-card/95 backdrop-blur-xl rounded-t-3xl border-t p-4 animate-slide-up z-40" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold">Comments ({reel.comments})</span>
            <button onClick={() => setShowComments(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>

          <div className="space-y-3 max-h-[30vh] overflow-y-auto mb-3">
            {[
              { user: 'Elena V.', avatar: 'EV', text: 'This is so helpful! Saved for later 🔥', time: '2h', likes: 12 },
              { user: 'Raj K.', avatar: 'RK', text: 'The second pattern blew my mind. Using it in my next project.', time: '4h', likes: 8 },
              { user: 'Sophie L.', avatar: 'SL', text: 'More content like this please! 👏', time: '6h', likes: 5 },
            ].map((c, i) => (
              <div key={i} className="flex gap-2">
                <Avatar className="h-7 w-7 shrink-0"><AvatarFallback className="text-[7px] bg-muted">{c.avatar}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold">{c.user}</span>
                    <span className="text-[8px] text-muted-foreground">{c.time}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{c.text}</p>
                </div>
                <button className="shrink-0 text-[8px] text-muted-foreground flex items-center gap-0.5">
                  <Heart className="h-2.5 w-2.5" /> {c.likes}
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." className="h-8 text-xs flex-1" />
            <Button size="sm" className="h-8 w-8 p-0 rounded-xl"><Send className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
