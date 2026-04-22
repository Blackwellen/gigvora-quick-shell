import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Palette, Users, Heart, Share2, Eye, Play, FileText, Image as ImageIcon, Video, ExternalLink, Calendar } from 'lucide-react';

const CREATOR = {
  name: 'Sarah Chen', handle: '@sarahchendesign', bio: 'Product designer & content creator sharing design tips, career advice, and behind-the-scenes of creative work.',
  followers: '12.4K', following: 186, posts: 142, subscribers: 840,
  categories: ['Design Tips', 'Career Advice', 'Case Studies', 'Tool Reviews'],
};

const CONTENT = [
  { title: '5 Portfolio Mistakes That Cost You Jobs', type: 'Article', engagement: { views: 8400, likes: 342, shares: 89 }, date: 'Apr 12, 2026', featured: true },
  { title: 'My Design Process Breakdown', type: 'Video', engagement: { views: 5200, likes: 218, shares: 45 }, date: 'Apr 8, 2026', featured: false },
  { title: 'Figma Tips You Didn\'t Know', type: 'Post', engagement: { views: 3100, likes: 156, shares: 32 }, date: 'Apr 5, 2026', featured: false },
  { title: 'From Junior to Senior Designer', type: 'Article', engagement: { views: 12800, likes: 680, shares: 142 }, date: 'Mar 28, 2026', featured: true },
];

const ICON_MAP = { Article: FileText, Video, Post: ImageIcon };

export default function CreatorProfilePage() {
  return (
    <DashboardLayout topStrip={<><Palette className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Creator Profile</span><Badge variant="outline" className="text-[9px] rounded-lg ml-2">{CREATOR.handle}</Badge><div className="flex-1" /><Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Heart className="h-3 w-3" />Follow</Button></>}>
      <SectionCard className="!rounded-2xl mb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 rounded-2xl shrink-0"><AvatarFallback className="rounded-2xl bg-accent/10 text-accent text-lg font-bold">SC</AvatarFallback></Avatar>
          <div className="flex-1">
            <div className="text-sm font-bold mb-0.5">{CREATOR.name}</div>
            <p className="text-[9px] text-muted-foreground mb-2">{CREATOR.bio}</p>
            <div className="flex flex-wrap gap-1">{CREATOR.categories.map(c => <Badge key={c} variant="outline" className="text-[7px] rounded-md">{c}</Badge>)}</div>
          </div>
        </div>
      </SectionCard>

      <KPIBand className="mb-3">
        <KPICard label="Followers" value={CREATOR.followers} className="!rounded-2xl" />
        <KPICard label="Posts" value={String(CREATOR.posts)} className="!rounded-2xl" />
        <KPICard label="Subscribers" value={String(CREATOR.subscribers)} className="!rounded-2xl" />
        <KPICard label="Avg Engagement" value="4.2%" className="!rounded-2xl" />
      </KPIBand>

      <SectionCard title="Content" className="!rounded-2xl">
        <div className="space-y-2.5">
          {CONTENT.map((c, i) => {
            const Icon = ICON_MAP[c.type as keyof typeof ICON_MAP] || FileText;
            return (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                <div className="h-8 w-8 rounded-xl bg-muted/30 flex items-center justify-center shrink-0"><Icon className="h-4 w-4 text-muted-foreground/60" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold">{c.title}</span>
                    {c.featured && <Badge className="text-[6px] bg-accent/10 text-accent border-0 rounded-md">Featured</Badge>}
                    <Badge variant="outline" className="text-[6px] rounded-md">{c.type}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{c.engagement.views.toLocaleString()}</span>
                    <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5" />{c.engagement.likes}</span>
                    <span className="flex items-center gap-0.5"><Share2 className="h-2.5 w-2.5" />{c.engagement.shares}</span>
                    <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{c.date}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg"><ExternalLink className="h-2.5 w-2.5 mr-0.5" />View</Button>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
