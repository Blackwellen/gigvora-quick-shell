import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, ThumbsUp, MessageSquare, Share2, Eye, Briefcase, FileText, Star, Calendar } from 'lucide-react';

const ACTIVITIES = [
  { type: 'post', icon: FileText, title: 'Published a new article', detail: '"5 Lessons from My First Year in Product Management"', time: '2h ago', engagement: { likes: 42, comments: 8, shares: 3 } },
  { type: 'project', icon: Briefcase, title: 'Completed a project milestone', detail: 'Acme Corp — Brand Identity Package delivered', time: '1d ago', engagement: { likes: 18, comments: 4, shares: 1 } },
  { type: 'review', icon: Star, title: 'Received a 5-star review', detail: 'From Jordan M. on "Website Redesign" project', time: '2d ago', engagement: { likes: 12, comments: 2, shares: 0 } },
  { type: 'event', icon: Calendar, title: 'Attended a webinar', detail: '"Scaling Design Systems" hosted by Figma Community', time: '3d ago', engagement: { likes: 5, comments: 1, shares: 0 } },
  { type: 'gig', icon: Briefcase, title: 'Listed a new gig', detail: '"Custom Logo Design — 3 Concepts + Revisions"', time: '4d ago', engagement: { likes: 24, comments: 6, shares: 2 } },
  { type: 'post', icon: FileText, title: 'Shared an insight', detail: '"The biggest mistake freelancers make with pricing..."', time: '5d ago', engagement: { likes: 89, comments: 22, shares: 11 } },
];

export default function ProfileActivityPage() {
  return (
    <DashboardLayout topStrip={<><Activity className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Activity Feed</span><div className="flex-1" /><div className="flex gap-1">{['All', 'Posts', 'Projects', 'Reviews'].map(f => <Button key={f} variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">{f}</Button>)}</div></>}>
      <KPIBand className="mb-3">
        <KPICard label="Total Posts" value="34" className="!rounded-2xl" />
        <KPICard label="Engagements" value="1.2K" className="!rounded-2xl" />
        <KPICard label="Profile Views" value="856" change="+12% this week" className="!rounded-2xl" />
        <KPICard label="Connection Rate" value="68%" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {ACTIVITIES.map((a, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0"><a.icon className="h-4 w-4 text-accent" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold mb-0.5">{a.title}</div>
                <p className="text-[9px] text-muted-foreground mb-1.5">{a.detail}</p>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><ThumbsUp className="h-2.5 w-2.5" />{a.engagement.likes}</span>
                  <span className="flex items-center gap-0.5"><MessageSquare className="h-2.5 w-2.5" />{a.engagement.comments}</span>
                  <span className="flex items-center gap-0.5"><Share2 className="h-2.5 w-2.5" />{a.engagement.shares}</span>
                  <span className="ml-auto">{a.time}</span>
                </div>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
