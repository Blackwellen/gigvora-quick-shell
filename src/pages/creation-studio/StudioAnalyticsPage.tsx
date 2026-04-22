import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3, TrendingUp, Eye, Heart, MessageSquare, Share2, Users,
  ArrowRight, ArrowUp, ArrowDown, Clock, Film, FileText, Mic, Tv,
  Mail, DollarSign, Star, Target, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentPerf {
  title: string; type: string; views: string; likes: string;
  comments: number; shares: number; ctr: string; trend: 'up' | 'down' | 'flat';
  published: string;
}

const CONTENT_PERF: ContentPerf[] = [
  { title: 'How to Land Your First Freelance Client', type: 'Article', views: '12.4K', likes: '345', comments: 67, shares: 89, ctr: '8.2%', trend: 'up', published: 'Apr 2' },
  { title: 'Design Systems Deep Dive — Ep. 14', type: 'Podcast', views: '3.2K', likes: '123', comments: 28, shares: 45, ctr: '5.1%', trend: 'up', published: 'Mar 28' },
  { title: 'React Best Practices Short', type: 'Reel', views: '8.9K', likes: '1.2K', comments: 42, shares: 156, ctr: '12.4%', trend: 'up', published: 'Apr 5' },
  { title: 'Building Remote Teams Workshop', type: 'Webinar', views: '890', likes: '56', comments: 12, shares: 23, ctr: '3.8%', trend: 'down', published: 'Mar 20' },
  { title: 'Hiring Announcement Template', type: 'Post', views: '2.3K', likes: '89', comments: 5, shares: 156, ctr: '6.9%', trend: 'flat', published: 'Mar 10' },
  { title: 'Weekly Tech Newsletter #42', type: 'Newsletter', views: '1.8K', likes: '67', comments: 8, shares: 34, ctr: '24.1%', trend: 'up', published: 'Apr 3' },
];

export default function StudioAnalyticsPage() {
  const [period, setPeriod] = useState('30d');

  return (
    <DashboardLayout topStrip={
      <>
        <BarChart3 className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Studio Analytics</span>
        <div className="flex-1" />
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList className="h-6">
            {['7d', '30d', '90d', 'All'].map(p => (
              <TabsTrigger key={p} value={p} className="text-[9px] h-4 px-2">{p}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Link to="/creation-studio" className="text-[9px] text-accent font-medium flex items-center gap-0.5 hover:underline">
          Studio <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </>
    }>
      {/* KPI Strip */}
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <KPICard label="Total Views" value="28.5K" />
        <KPICard label="Engagement Rate" value="6.8%" />
        <KPICard label="New Followers" value="+342" />
        <KPICard label="Published" value="12" />
        <KPICard label="Avg. CTR" value="8.4%" />
        <KPICard label="Revenue" value="$1,240" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          {/* Performance chart placeholder */}
          <SectionCard title="Performance Over Time" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />}>
            <div className="h-48 rounded-xl bg-gradient-to-r from-accent/5 to-[hsl(var(--gigvora-purple))]/5 flex items-center justify-center border border-border/20">
              <div className="text-center">
                <BarChart3 className="h-10 w-10 text-accent/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground">Views, engagement, and followers over time</p>
              </div>
            </div>
          </SectionCard>

          {/* Content Performance Table */}
          <SectionCard title="Content Performance" icon={<Star className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />} className="mt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b text-left text-[8px] text-muted-foreground">
                    <th className="pb-2 font-semibold">Content</th>
                    <th className="pb-2 font-semibold">Type</th>
                    <th className="pb-2 font-semibold text-right">Views</th>
                    <th className="pb-2 font-semibold text-right">Likes</th>
                    <th className="pb-2 font-semibold text-right">Comments</th>
                    <th className="pb-2 font-semibold text-right">Shares</th>
                    <th className="pb-2 font-semibold text-right">CTR</th>
                    <th className="pb-2 font-semibold text-right">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {CONTENT_PERF.map((c, i) => (
                    <tr key={i} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 font-semibold max-w-[200px] truncate">{c.title}</td>
                      <td className="py-2.5"><Badge variant="outline" className="text-[7px] h-3.5">{c.type}</Badge></td>
                      <td className="py-2.5 text-right">{c.views}</td>
                      <td className="py-2.5 text-right">{c.likes}</td>
                      <td className="py-2.5 text-right">{c.comments}</td>
                      <td className="py-2.5 text-right">{c.shares}</td>
                      <td className="py-2.5 text-right font-medium">{c.ctr}</td>
                      <td className="py-2.5 text-right">
                        {c.trend === 'up' && <ArrowUp className="h-3 w-3 text-[hsl(var(--state-healthy))] inline" />}
                        {c.trend === 'down' && <ArrowDown className="h-3 w-3 text-destructive inline" />}
                        {c.trend === 'flat' && <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        {/* Right Rail */}
        <div>
          <SectionCard title="Top by Type">
            <div className="space-y-2">
              {[
                { type: 'Reels', icon: Film, views: '8.9K', growth: '+34%', color: 'text-[hsl(var(--gigvora-purple))]' },
                { type: 'Articles', icon: FileText, views: '14.7K', growth: '+12%', color: 'text-accent' },
                { type: 'Podcasts', icon: Mic, views: '3.2K', growth: '+8%', color: 'text-[hsl(var(--gigvora-green))]' },
                { type: 'Webinars', icon: Tv, views: '890', growth: '-5%', color: 'text-[hsl(var(--gigvora-amber))]' },
                { type: 'Newsletters', icon: Mail, views: '1.8K', growth: '+18%', color: 'text-muted-foreground' },
              ].map(t => (
                <div key={t.type} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/20 transition-all">
                  <t.icon className={cn('h-4 w-4', t.color)} />
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold">{t.type}</div>
                    <div className="text-[8px] text-muted-foreground">{t.views} views</div>
                  </div>
                  <Badge variant="outline" className={cn('text-[7px] h-3.5', t.growth.startsWith('+') ? 'text-[hsl(var(--state-healthy))]' : 'text-destructive')}>
                    {t.growth}
                  </Badge>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Audience Insights" className="mt-3">
            <div className="space-y-2">
              {[
                { label: 'Developers', pct: 38 },
                { label: 'Designers', pct: 24 },
                { label: 'PMs', pct: 18 },
                { label: 'Founders', pct: 12 },
                { label: 'Others', pct: 8 },
              ].map(a => (
                <div key={a.label} className="flex items-center gap-2">
                  <span className="text-[9px] w-20">{a.label}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full"><div className="h-full bg-accent rounded-full" style={{ width: `${a.pct}%` }} /></div>
                  <span className="text-[8px] text-muted-foreground w-8 text-right">{a.pct}%</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Revenue Breakdown" className="mt-3">
            <div className="space-y-1.5">
              {[
                { source: 'Tips & Donations', amount: '$480' },
                { source: 'Premium Content', amount: '$340' },
                { source: 'Webinar Tickets', amount: '$220' },
                { source: 'Sponsorships', amount: '$200' },
              ].map(r => (
                <div key={r.source} className="flex items-center justify-between text-[9px] p-1.5 rounded-lg hover:bg-muted/20">
                  <span>{r.source}</span>
                  <span className="font-semibold">{r.amount}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
