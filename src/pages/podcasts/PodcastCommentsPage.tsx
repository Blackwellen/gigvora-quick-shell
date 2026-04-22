import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { MessageSquare, ThumbsUp, Heart, Star, Reply, Flag, Send, Smile, Clock } from 'lucide-react';

const COMMENTS = [
  { author: 'Sarah C.', initials: 'SC', text: 'This episode completely changed how I think about AI agents. The comparison with traditional SaaS was eye-opening.', time: '2h ago', likes: 24, replies: 3 },
  { author: 'Marcus J.', initials: 'MJ', text: 'Great breakdown of the architecture patterns. Would love a follow-up on implementation details.', time: '5h ago', likes: 18, replies: 1 },
  { author: 'Priya P.', initials: 'PP', text: 'The performance benchmarks were really convincing. Shared this with my entire engineering team.', time: '1d ago', likes: 42, replies: 7 },
  { author: 'Tom W.', initials: 'TW', text: 'Interesting perspective but I think the timeline is more aggressive than realistic. Enterprise adoption will take longer.', time: '2d ago', likes: 9, replies: 2 },
];

const REACTIONS = [
  { emoji: '🔥', label: 'Fire', count: 89 },
  { emoji: '💡', label: 'Insightful', count: 64 },
  { emoji: '👏', label: 'Applause', count: 52 },
  { emoji: '❤️', label: 'Love', count: 38 },
  { emoji: '🤔', label: 'Thinking', count: 15 },
];

export default function PodcastCommentsPage() {
  const [tab, setTab] = useState('comments');

  const topStrip = (
    <>
      <MessageSquare className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Comments & Reactions</span>
      <div className="flex-1" />
      <Badge variant="outline" className="text-[9px] rounded-lg">{COMMENTS.length} comments</Badge>
      <Badge variant="outline" className="text-[9px] rounded-lg">{REACTIONS.reduce((s, r) => s + r.count, 0)} reactions</Badge>
    </>
  );

  return (
    <DashboardLayout topStrip={topStrip}>
      <Tabs value={tab} onValueChange={setTab} className="mb-3">
        <TabsList className="h-8 rounded-xl">
          <TabsTrigger value="comments" className="text-[10px] px-3 rounded-lg gap-1"><MessageSquare className="h-3 w-3" />Comments</TabsTrigger>
          <TabsTrigger value="reactions" className="text-[10px] px-3 rounded-lg gap-1"><Heart className="h-3 w-3" />Reactions</TabsTrigger>
          <TabsTrigger value="ratings" className="text-[10px] px-3 rounded-lg gap-1"><Star className="h-3 w-3" />Ratings</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'comments' && (
        <div className="space-y-3">
          <SectionCard className="!rounded-2xl">
            <div className="flex gap-2">
              <Avatar className="h-7 w-7 rounded-lg shrink-0"><AvatarFallback className="rounded-lg text-[8px] bg-accent/10 text-accent">You</AvatarFallback></Avatar>
              <div className="flex-1">
                <textarea className="w-full h-16 rounded-xl border px-3 py-2 text-[10px] resize-none focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Add a comment..." />
                <div className="flex justify-end gap-1 mt-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg"><Smile className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" className="h-7 text-[9px] rounded-lg gap-1"><Send className="h-3 w-3" />Post</Button>
                </div>
              </div>
            </div>
          </SectionCard>

          {COMMENTS.map((c, i) => (
            <SectionCard key={i} className="!rounded-2xl">
              <div className="flex gap-2.5">
                <Avatar className="h-7 w-7 rounded-lg shrink-0"><AvatarFallback className="rounded-lg text-[8px] bg-muted">{c.initials}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-semibold">{c.author}</span>
                    <span className="text-[8px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2 w-2" />{c.time}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-relaxed mb-1.5">{c.text}</div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-5 text-[8px] gap-0.5 px-1.5"><ThumbsUp className="h-2.5 w-2.5" />{c.likes}</Button>
                    <Button variant="ghost" size="sm" className="h-5 text-[8px] gap-0.5 px-1.5"><Reply className="h-2.5 w-2.5" />{c.replies}</Button>
                    <Button variant="ghost" size="sm" className="h-5 text-[8px] gap-0.5 px-1.5"><Flag className="h-2.5 w-2.5" /></Button>
                  </div>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      {tab === 'reactions' && (
        <SectionCard title="Episode Reactions" className="!rounded-2xl">
          <div className="grid grid-cols-5 gap-2">
            {REACTIONS.map(r => (
              <button key={r.label} className="rounded-2xl border p-3 text-center hover:shadow-sm hover:border-accent transition-all">
                <div className="text-2xl mb-1">{r.emoji}</div>
                <div className="text-[10px] font-bold">{r.count}</div>
                <div className="text-[7px] text-muted-foreground">{r.label}</div>
              </button>
            ))}
          </div>
          <div className="mt-3 text-[9px] text-muted-foreground text-center">{REACTIONS.reduce((s, r) => s + r.count, 0)} total reactions from listeners</div>
        </SectionCard>
      )}

      {tab === 'ratings' && (
        <SectionCard title="Episode Rating" className="!rounded-2xl">
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-1 mb-1">
              {[1, 2, 3, 4, 5].map(s => <Star key={s} className={cn('h-6 w-6', s <= 4 ? 'text-[hsl(var(--gigvora-amber))] fill-[hsl(var(--gigvora-amber))]' : 'text-muted-foreground')} />)}
            </div>
            <div className="text-[18px] font-bold">4.8 / 5</div>
            <div className="text-[9px] text-muted-foreground">Based on 156 ratings</div>
          </div>
          <div className="space-y-1.5 max-w-xs mx-auto">
            {[{ stars: 5, pct: 72 }, { stars: 4, pct: 18 }, { stars: 3, pct: 6 }, { stars: 2, pct: 3 }, { stars: 1, pct: 1 }].map(r => (
              <div key={r.stars} className="flex items-center gap-2 text-[8px]">
                <span className="w-3 text-right">{r.stars}</span>
                <Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-[hsl(var(--gigvora-amber))] rounded-full" style={{ width: `${r.pct}%` }} /></div>
                <span className="w-6 text-muted-foreground">{r.pct}%</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
