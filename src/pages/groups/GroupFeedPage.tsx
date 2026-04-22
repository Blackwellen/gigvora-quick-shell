import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageSquare, Star, Share2, Plus, Pin, Filter,
  Image, FileText, Link2, MoreHorizontal, Flag, Bookmark,
} from 'lucide-react';

const POSTS = [
  { id: '1', author: 'Maya Chen', avatar: 'MC', content: 'Just published a deep dive on React Server Components performance patterns. Link in comments!', time: '2h ago', likes: 34, comments: 12, pinned: true, type: 'text' as const },
  { id: '2', author: 'James Rivera', avatar: 'JR', content: 'What state management library are you using in 2026? Curious about community trends.', time: '4h ago', likes: 89, comments: 56, pinned: false, type: 'poll' as const },
  { id: '3', author: 'Lisa Park', avatar: 'LP', content: 'Hiring React engineers at our startup. Remote-first, competitive comp. DM me for details.', time: '6h ago', likes: 15, comments: 8, pinned: false, type: 'text' as const },
  { id: '4', author: 'Sarah Kim', avatar: 'SK', content: 'New design system components dropped — check the resources section for the Figma file.', time: '1d ago', likes: 42, comments: 19, pinned: false, type: 'resource' as const },
  { id: '5', author: 'Tom Wright', avatar: 'TW', content: 'Anyone attending React Summit next month? Would love to organize a group meetup.', time: '1d ago', likes: 28, comments: 31, pinned: false, type: 'event' as const },
];

export default function GroupFeedPage() {
  const [filter, setFilter] = useState<'all' | 'pinned' | 'polls' | 'resources'>('all');
  const filtered = POSTS.filter(p => filter === 'all' || (filter === 'pinned' && p.pinned) || (filter === 'polls' && p.type === 'poll') || (filter === 'resources' && p.type === 'resource'));

  const topStrip = (
    <>
      <MessageSquare className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">React Developers — Feed</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['all', 'pinned', 'polls', 'resources'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-2 py-1 rounded-lg text-[8px] font-medium transition-colors capitalize ${filter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{f}</button>
        ))}
      </div>
      <Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" />New Post</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Pinned Posts" className="!rounded-2xl">
        {POSTS.filter(p => p.pinned).map(p => (
          <div key={p.id} className="flex items-center gap-1.5 text-[9px] py-1.5">
            <Pin className="h-2.5 w-2.5 text-accent shrink-0" />
            <span className="truncate">{p.content.slice(0, 50)}...</span>
          </div>
        ))}
      </SectionCard>
      <SectionCard title="Post Types" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Discussions</span><span className="font-semibold">156</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Polls</span><span className="font-semibold">23</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Resources</span><span className="font-semibold">45</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Events</span><span className="font-semibold">12</span></div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      {/* Composer */}
      <SectionCard className="!rounded-2xl mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 rounded-xl"><AvatarFallback className="rounded-xl text-[9px] bg-accent/10 text-accent">YU</AvatarFallback></Avatar>
          <input placeholder="Share something with the group..." className="flex-1 h-9 rounded-xl border bg-background px-3 text-xs" />
        </div>
        <div className="flex items-center gap-2 mt-2 pl-11">
          <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-1"><Image className="h-3 w-3" />Photo</Button>
          <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-1"><FileText className="h-3 w-3" />File</Button>
          <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-1"><Link2 className="h-3 w-3" />Link</Button>
        </div>
      </SectionCard>

      {/* Feed */}
      <div className="space-y-3">
        {filtered.map(p => (
          <SectionCard key={p.id} className="!rounded-2xl">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 rounded-xl"><AvatarFallback className="rounded-xl text-[9px] bg-accent/10 text-accent">{p.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold">{p.author}</span>
                  <span className="text-[8px] text-muted-foreground">{p.time}</span>
                  {p.pinned && <Badge className="text-[7px] h-3.5 bg-accent/10 text-accent border-0 gap-0.5"><Pin className="h-2 w-2" />Pinned</Badge>}
                  {p.type !== 'text' && <Badge variant="outline" className="text-[7px] h-3.5 capitalize">{p.type}</Badge>}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{p.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button variant="ghost" size="sm" className="h-5 text-[9px] gap-1"><Star className="h-2.5 w-2.5" />{p.likes}</Button>
                  <Button variant="ghost" size="sm" className="h-5 text-[9px] gap-1"><MessageSquare className="h-2.5 w-2.5" />{p.comments}</Button>
                  <Button variant="ghost" size="sm" className="h-5 text-[9px] gap-1"><Share2 className="h-2.5 w-2.5" />Share</Button>
                  <Button variant="ghost" size="sm" className="h-5 text-[9px] gap-1"><Bookmark className="h-2.5 w-2.5" />Save</Button>
                  <div className="flex-1" />
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0"><MoreHorizontal className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
