import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Headphones, Play, Star, Users, Clock, Bell, Share2, Rss, Download, Heart, MessageSquare, Calendar } from 'lucide-react';

const SHOW = {
  title: 'AI Frontiers',
  host: 'Dr. Raj Patel',
  hostAvatar: 'RP',
  image: '🤖',
  category: 'AI/ML',
  rating: 4.7,
  episodes: 78,
  subscribers: '32K',
  description: 'Weekly deep dives into the latest AI research, industry trends, and practical applications. Featuring interviews with leading researchers, engineers, and founders building the future of intelligence.',
  tags: ['AI', 'Machine Learning', 'Research', 'Interviews'],
};

const EPISODES = [
  { id: '1', title: 'Why AI Agents Will Replace SaaS', number: 78, date: 'Apr 11, 2026', duration: '42 min', plays: '12.4K', description: 'Exploring how autonomous AI agents are disrupting traditional SaaS models...' },
  { id: '2', title: 'The State of LLM Fine-Tuning', number: 77, date: 'Apr 4, 2026', duration: '38 min', plays: '9.1K', description: 'A comprehensive look at fine-tuning techniques, costs, and when to use them...' },
  { id: '3', title: 'Building with Multimodal Models', number: 76, date: 'Mar 28, 2026', duration: '55 min', plays: '11.2K', description: 'Practical guide to building products that leverage vision, audio, and text models...' },
  { id: '4', title: 'AI Safety: Beyond Alignment', number: 75, date: 'Mar 21, 2026', duration: '48 min', plays: '8.5K', description: 'Interview with leading AI safety researchers on the challenges ahead...' },
  { id: '5', title: 'Edge AI for Mobile Apps', number: 74, date: 'Mar 14, 2026', duration: '35 min', plays: '7.3K', description: 'How to run ML models efficiently on mobile devices...' },
];

export default function PodcastShowDetailPage() {
  const [tab, setTab] = useState('episodes');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <Headphones className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold">{SHOW.title}</h1>
          <Badge variant="secondary" className="text-[9px]">{SHOW.category}</Badge>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Bell className="h-3 w-3" /> Notify</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Share2 className="h-3 w-3" /> Share</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Rss className="h-3 w-3" /> RSS</Button>
          <Button size="sm" className="h-7 text-[10px]">Subscribe</Button>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Show Info">
            <div className="text-center mb-3">
              <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center text-4xl mx-auto mb-2">{SHOW.image}</div>
              <div className="text-sm font-bold">{SHOW.title}</div>
              <div className="text-[10px] text-muted-foreground">{SHOW.host}</div>
            </div>
            <div className="space-y-1.5 text-[9px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Rating</span><span className="font-semibold flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-[hsl(var(--gigvora-amber))] text-[hsl(var(--gigvora-amber))]" /> {SHOW.rating}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Episodes</span><span className="font-semibold">{SHOW.episodes}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Subscribers</span><span className="font-semibold">{SHOW.subscribers}</span></div>
            </div>
          </SectionCard>
          <SectionCard title="Tags">
            <div className="flex flex-wrap gap-1">
              {SHOW.tags.map(t => <Badge key={t} variant="outline" className="text-[8px] h-3.5 px-1.5">{t}</Badge>)}
            </div>
          </SectionCard>
          <SectionCard title="Host">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px] bg-accent/10 text-accent">{SHOW.hostAvatar}</AvatarFallback></Avatar>
              <div>
                <div className="text-[10px] font-medium">{SHOW.host}</div>
                <div className="text-[8px] text-muted-foreground">AI Researcher & Educator</div>
              </div>
            </div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-52"
    >
      <SectionCard>
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">{SHOW.description}</p>
      </SectionCard>

      <Tabs value={tab} onValueChange={setTab} className="mt-4 mb-3">
        <TabsList className="h-8">
          <TabsTrigger value="episodes" className="text-[10px] px-3">Episodes ({SHOW.episodes})</TabsTrigger>
          <TabsTrigger value="reviews" className="text-[10px] px-3">Reviews</TabsTrigger>
          <TabsTrigger value="similar" className="text-[10px] px-3">Similar Shows</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'episodes' && (
        <div className="space-y-2">
          {EPISODES.map(ep => (
            <div key={ep.id} className="p-3.5 rounded-xl border border-border/40 hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer group">
              <div className="flex items-start gap-3">
                <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-full shrink-0 group-hover:bg-accent group-hover:text-accent-foreground group-hover:border-accent"><Play className="h-4 w-4" /></Button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className="text-[7px] h-3.5">#{ep.number}</Badge>
                    <span className="text-xs font-semibold group-hover:text-accent transition-colors">{ep.title}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground line-clamp-1">{ep.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[8px] text-muted-foreground">
                    <span><Calendar className="h-2.5 w-2.5 inline" /> {ep.date}</span>
                    <span><Clock className="h-2.5 w-2.5 inline" /> {ep.duration}</span>
                    <span><Users className="h-2.5 w-2.5 inline" /> {ep.plays}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Download className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Heart className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'reviews' && (
        <SectionCard title="Listener Reviews">
          {[
            { user: 'Maya C.', rating: 5, text: 'Best AI podcast out there. Raj always gets the best guests.', date: '2d ago' },
            { user: 'James R.', rating: 4, text: 'Great content, sometimes episodes run a bit long.', date: '1w ago' },
            { user: 'Lisa P.', rating: 5, text: 'Essential listening for anyone in tech.', date: '2w ago' },
          ].map((r, i) => (
            <div key={i} className="py-3 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-medium">{r.user}</span>
                <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`h-2.5 w-2.5 ${s <= r.rating ? 'fill-[hsl(var(--gigvora-amber))] text-[hsl(var(--gigvora-amber))]' : 'text-muted-foreground/30'}`} />)}</div>
                <span className="text-[8px] text-muted-foreground">{r.date}</span>
              </div>
              <p className="text-[9px] text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </SectionCard>
      )}

      {tab === 'similar' && (
        <SectionCard title="Similar Shows">
          {['Tech Talks Daily', 'The AI Podcast', 'Machine Learning Street Talk'].map((s, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0 cursor-pointer hover:text-accent">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-sm">🎙️</div>
              <div className="flex-1"><div className="text-[10px] font-medium">{s}</div></div>
              <Button variant="outline" size="sm" className="h-5 text-[8px] px-1.5">View</Button>
            </div>
          ))}
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
