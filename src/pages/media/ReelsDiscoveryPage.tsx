import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Zap, Search, Play, Heart, MessageSquare, Eye,
  Bookmark, TrendingUp, Sparkles,
  CheckCircle2, Film,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reel {
  id: string; title: string; creator: string; avatar: string; verified: boolean;
  views: string; likes: string; comments: number; duration: string;
  category: string; description: string; trending: boolean; following: boolean;
}

const REELS: Reel[] = [
  { id: 'r1', title: 'Design System Tips', creator: 'Sarah Kim', avatar: 'SK', verified: true, views: '12.4K', likes: '2.4K', comments: 89, duration: '0:58', category: 'Design', description: '3 underrated design system patterns ✨', trending: true, following: false },
  { id: 'r2', title: 'AI Prompt Tricks', creator: 'Alex Mercer', avatar: 'AM', verified: true, views: '8.5K', likes: '1.8K', comments: 56, duration: '0:45', category: 'AI', description: 'Stop writing bad prompts 🧠', trending: true, following: true },
  { id: 'r3', title: 'Remote Setup Tour', creator: 'Lisa Park', avatar: 'LP', verified: false, views: '6.2K', likes: '1.1K', comments: 34, duration: '1:12', category: 'Lifestyle', description: 'My $500 remote work setup 🏠', trending: false, following: false },
  { id: 'r4', title: 'Pitch Deck Review', creator: 'Mike Davis', avatar: 'MD', verified: true, views: '15K', likes: '3.2K', comments: 124, duration: '0:52', category: 'Business', description: 'What separates the top 1% 🚀', trending: true, following: false },
  { id: 'r5', title: 'CSS Art in 30s', creator: 'Yuki Tanaka', avatar: 'YT', verified: false, views: '4.8K', likes: '890', comments: 22, duration: '0:38', category: 'Dev', description: 'Pure CSS sunset 🌅', trending: false, following: true },
  { id: 'r6', title: 'Startup Metrics', creator: 'Nina Patel', avatar: 'NP', verified: true, views: '9.7K', likes: '1.5K', comments: 67, duration: '0:55', category: 'Business', description: 'The 5 metrics that matter 📊', trending: true, following: false },
  { id: 'r7', title: 'Portfolio Review', creator: 'Tom Lee', avatar: 'TL', verified: false, views: '3.2K', likes: '560', comments: 18, duration: '1:05', category: 'Design', description: 'Quick tips for designers 🎨', trending: false, following: false },
  { id: 'r8', title: 'React 19 Hooks', creator: 'Dev Guru', avatar: 'DG', verified: true, views: '18K', likes: '4.1K', comments: 145, duration: '0:48', category: 'Dev', description: 'New hooks breakdown ⚛️', trending: true, following: true },
  { id: 'r9', title: 'Negotiation Tips', creator: 'Priya Shah', avatar: 'PS', verified: true, views: '7.1K', likes: '1.3K', comments: 41, duration: '0:42', category: 'Career', description: 'Salary negotiation secrets 💰', trending: false, following: false },
  { id: 'r10', title: 'Brand Color Theory', creator: 'Kim Styles', avatar: 'KS', verified: false, views: '5.4K', likes: '920', comments: 28, duration: '0:35', category: 'Marketing', description: 'Colors that convert 🎯', trending: false, following: false },
  { id: 'r11', title: 'Code Review Tips', creator: 'Alex Mercer', avatar: 'AM', verified: true, views: '11K', likes: '2.1K', comments: 73, duration: '0:50', category: 'Dev', description: 'Give better code reviews 🔍', trending: true, following: true },
  { id: 'r12', title: 'Morning Routine', creator: 'Lisa Park', avatar: 'LP', verified: false, views: '4K', likes: '680', comments: 19, duration: '1:00', category: 'Lifestyle', description: 'My 5AM morning routine ☀️', trending: false, following: false },
];

const FILTER_TABS = ['For You', 'Following', 'Trending', 'All', 'Business', 'Dev', 'Design', 'AI', 'Marketing', 'Career', 'Lifestyle'];

export default function ReelsDiscoveryPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('For You');
  const [search, setSearch] = useState('');
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const filtered = REELS.filter(r => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.creator.toLowerCase().includes(search.toLowerCase())) return false;
    if (tab === 'Following') return r.following;
    if (tab === 'Trending') return r.trending;
    if (tab === 'For You' || tab === 'All') return true;
    return r.category === tab;
  });

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Trending Creators" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-2">
          {[
            { name: 'Sarah Kim', avatar: 'SK', reels: 42, verified: true },
            { name: 'Alex Mercer', avatar: 'AM', reels: 38, verified: true },
            { name: 'Dev Guru', avatar: 'DG', reels: 28, verified: true },
          ].map(c => (
            <div key={c.name} className="flex items-center gap-2 py-1">
              <Avatar className="h-7 w-7"><AvatarFallback className="text-[7px] bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]">{c.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <span className="text-[8px] font-semibold flex items-center gap-0.5">{c.name}{c.verified && <CheckCircle2 className="h-2 w-2 text-blue-500" />}</span>
                <div className="text-[7px] text-muted-foreground">{c.reels} reels</div>
              </div>
              <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg px-2">Follow</Button>
            </div>
          ))}
        </div>
      </SectionCard>
      <div className="rounded-2xl border bg-gradient-to-br from-[hsl(var(--gigvora-purple))]/10 to-accent/5 p-3.5 text-center">
        <Sparkles className="h-5 w-5 text-[hsl(var(--gigvora-purple))] mx-auto mb-1.5" />
        <div className="text-[10px] font-semibold mb-0.5">Create Your Reel</div>
        <div className="text-[8px] text-muted-foreground mb-2">Share your expertise in 60 seconds</div>
        <Button size="sm" onClick={() => navigate('/media/reels/studio')} className="h-7 text-[9px] rounded-xl w-full bg-[hsl(var(--gigvora-purple))] hover:bg-[hsl(var(--gigvora-purple))]/90">
          <Zap className="h-3 w-3 mr-1" /> Create Reel
        </Button>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      topStrip={
        <>
          <Zap className="h-4 w-4 text-[hsl(var(--gigvora-purple))]" />
          <span className="text-xs font-semibold">Reels</span>
          <div className="flex-1" />
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input placeholder="Search reels..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 text-[10px] rounded-xl" />
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate('/media/videos')} className="h-7 text-[10px] rounded-xl gap-1"><Film className="h-3 w-3" /> Videos</Button>
          <Button size="sm" onClick={() => navigate('/media/reels/studio')} className="h-7 text-[10px] rounded-xl gap-1 bg-[hsl(var(--gigvora-purple))] hover:bg-[hsl(var(--gigvora-purple))]/90"><Sparkles className="h-3 w-3" /> Create</Button>
        </>
      }
      rightRail={rightRail}
      rightRailWidth="w-52"
    >
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_TABS.map(f => (
          <button key={f} onClick={() => setTab(f)} className={cn('px-3 py-1.5 rounded-xl text-[10px] font-medium shrink-0 transition-all', tab === f ? 'bg-[hsl(var(--gigvora-purple))] text-white shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>
            {f === 'Trending' && <TrendingUp className="h-3 w-3 inline mr-1" />}{f}
          </button>
        ))}
      </div>

      {/* Reels Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
        {filtered.map(r => (
          <div key={r.id} className="group rounded-2xl overflow-hidden border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer" onClick={() => navigate(`/media/reels/${r.id}`)}>
            {/* Thumbnail */}
            <div className="relative aspect-[9/16] bg-gradient-to-b from-[hsl(var(--gigvora-purple))]/20 via-black/50 to-black flex items-center justify-center">
              <Play className="h-10 w-10 text-white/25 group-hover:text-white/50 group-hover:scale-110 transition-all" />
              <div className="absolute top-2 right-2 bg-black/60 text-white text-[7px] px-1.5 py-0.5 rounded-lg font-mono">{r.duration}</div>
              {r.trending && <div className="absolute top-2 left-2"><Badge className="text-[6px] rounded-lg bg-amber-500/80 text-white border-0"><TrendingUp className="h-2 w-2 mr-0.5" />Hot</Badge></div>}
              {/* Bottom info */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-8">
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5 ring-1 ring-white/20"><AvatarFallback className="text-[6px] bg-accent/20 text-white">{r.avatar}</AvatarFallback></Avatar>
                  <span className="text-[8px] font-semibold text-white truncate flex items-center gap-0.5">{r.creator}{r.verified && <CheckCircle2 className="h-2 w-2 text-blue-400" />}</span>
                </div>
                <div className="text-[8px] text-white/70 mt-0.5 line-clamp-1">{r.description}</div>
              </div>
              {/* Side actions on hover */}
              <div className="absolute right-1.5 bottom-14 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={e => { e.stopPropagation(); setLiked(p => { const s = new Set(p); if (s.has(r.id)) { s.delete(r.id); } else { s.add(r.id); } return s; }); }} className="flex flex-col items-center">
                  <div className={cn('h-7 w-7 rounded-full flex items-center justify-center', liked.has(r.id) ? 'bg-red-500 text-white' : 'bg-white/15 text-white')}><Heart className="h-3 w-3" /></div>
                  <span className="text-[6px] text-white/60">{r.likes}</span>
                </button>
                <button onClick={e => e.stopPropagation()} className="flex flex-col items-center">
                  <div className="h-7 w-7 rounded-full bg-white/15 text-white flex items-center justify-center"><MessageSquare className="h-3 w-3" /></div>
                  <span className="text-[6px] text-white/60">{r.comments}</span>
                </button>
                <button onClick={e => { e.stopPropagation(); setSaved(p => { const s = new Set(p); if (s.has(r.id)) { s.delete(r.id); } else { s.add(r.id); } return s; }); }} className="flex flex-col items-center">
                  <div className={cn('h-7 w-7 rounded-full flex items-center justify-center', saved.has(r.id) ? 'bg-accent text-white' : 'bg-white/15 text-white')}><Bookmark className="h-3 w-3" /></div>
                </button>
              </div>
            </div>
            {/* Footer */}
            <div className="p-2">
              <div className="text-[9px] font-semibold line-clamp-1">{r.title}</div>
              <div className="flex items-center gap-2 mt-0.5 text-[7px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{r.views}</span>
                <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5" />{r.likes}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center text-[9px] text-muted-foreground">
        Showing {filtered.length} reels
      </div>
    </DashboardLayout>
  );
}
