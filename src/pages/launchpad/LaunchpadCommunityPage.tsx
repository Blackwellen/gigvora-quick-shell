import React from 'react';
import { LaunchpadShell } from '@/components/launchpad/LaunchpadShell';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, MessageSquare, Heart, Share2, Calendar, Plus } from 'lucide-react';

const POSTS = [
  { author: 'Emma Davis', initials: 'ED', content: 'Just earned my Web Builder badge! The portfolio project was challenging but so rewarding. Thanks to my mentor Sarah for the guidance! 🎉', likes: 24, comments: 8, time: '2h ago', tags: ['Achievement'] },
  { author: 'Alex Kim', initials: 'AK', content: 'Looking for study partners for the Data Science readiness path. Anyone in the same cohort?', likes: 12, comments: 15, time: '5h ago', tags: ['Study Group'] },
  { author: 'Maria Santos', initials: 'MS', content: 'Career changer from teaching to UX! Just completed my first real client project. The experience was incredible.', likes: 45, comments: 12, time: 'Yesterday', tags: ['Career Change', 'Milestone'] },
];

export default function LaunchpadCommunityPage() {
  return (
    <LaunchpadShell>
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-lg font-bold">Community</h1><p className="text-[11px] text-muted-foreground">Connect with fellow launchpad members</p></div>
        <Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Plus className="h-3 w-3" />New Post</Button>
      </div>
      <KPIBand className="mb-3">
        <KPICard label="Members" value="1,240" className="!rounded-2xl" />
        <KPICard label="Posts Today" value="18" className="!rounded-2xl" />
        <KPICard label="Active Groups" value="12" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {POSTS.map((p, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-start gap-2.5 mb-2">
              <Avatar className="h-8 w-8 rounded-lg shrink-0"><AvatarFallback className="rounded-lg bg-accent/10 text-accent text-[8px] font-bold">{p.initials}</AvatarFallback></Avatar>
              <div>
                <div className="flex items-center gap-2"><span className="text-[10px] font-bold">{p.author}</span><span className="text-[8px] text-muted-foreground">{p.time}</span></div>
                <div className="flex gap-1 mt-0.5">{p.tags.map(t => <Badge key={t} variant="outline" className="text-[7px] h-3.5 rounded-md">{t}</Badge>)}</div>
              </div>
            </div>
            <div className="text-[10px] leading-relaxed mb-2">{p.content}</div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5"><Heart className="h-3 w-3" />{p.likes}</Button>
              <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5"><MessageSquare className="h-3 w-3" />{p.comments}</Button>
              <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5"><Share2 className="h-3 w-3" />Share</Button>
            </div>
          </SectionCard>
        ))}
      </div>
    </LaunchpadShell>
  );
}
