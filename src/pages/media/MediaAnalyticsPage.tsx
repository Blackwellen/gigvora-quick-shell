import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3, TrendingUp, Eye, Heart, MessageSquare, Share2,
  UserPlus, Film, Zap, Play, Clock, Calendar, ArrowUp, ArrowDown,
  Download, Users, Globe, Target,
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';

const VIEWS_DATA = [
  { day: 'Mon', videos: 1200, reels: 3400 }, { day: 'Tue', videos: 1800, reels: 4200 },
  { day: 'Wed', videos: 2400, reels: 5100 }, { day: 'Thu', videos: 2100, reels: 4800 },
  { day: 'Fri', videos: 3200, reels: 6200 }, { day: 'Sat', videos: 2800, reels: 5600 },
  { day: 'Sun', videos: 2500, reels: 4900 },
];
const ENGAGEMENT_DATA = [
  { day: 'Mon', likes: 320, comments: 89, shares: 45 }, { day: 'Tue', likes: 450, comments: 112, shares: 67 },
  { day: 'Wed', likes: 580, comments: 145, shares: 89 }, { day: 'Thu', likes: 510, comments: 130, shares: 72 },
  { day: 'Fri', likes: 690, comments: 178, shares: 98 }, { day: 'Sat', likes: 620, comments: 156, shares: 85 },
  { day: 'Sun', likes: 540, comments: 134, shares: 76 },
];
const AUDIENCE_DATA = [
  { name: 'Tech', value: 35 }, { name: 'Design', value: 25 }, { name: 'Business', value: 20 },
  { name: 'Marketing', value: 12 }, { name: 'Other', value: 8 },
];
const COLORS = ['hsl(var(--accent))', 'hsl(var(--gigvora-purple))', 'hsl(var(--gigvora-green))', 'hsl(var(--gigvora-amber))', 'hsl(var(--muted-foreground))'];

const TOP_CONTENT = [
  { title: 'Building a $1M SaaS — Full Documentary', type: 'video', views: '45K', likes: '4.2K', engagement: '89%', trend: 'up' as const },
  { title: 'Design System Tips', type: 'reel', views: '12.4K', likes: '2.4K', engagement: '92%', trend: 'up' as const },
  { title: 'Advanced React Patterns Workshop', type: 'video', views: '23K', likes: '2.8K', engagement: '76%', trend: 'down' as const },
  { title: 'AI Prompt Tricks', type: 'reel', views: '8.5K', likes: '1.8K', engagement: '85%', trend: 'up' as const },
  { title: 'Freelancing Masterclass', type: 'video', views: '31K', likes: '3.5K', engagement: '82%', trend: 'up' as const },
];

export default function MediaAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [contentType, setContentType] = useState('all');

  return (
    <DashboardLayout topStrip={
      <>
        <BarChart3 className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Media Analytics</span>
        <div className="flex-1" />
        <Select value={timeRange} onValueChange={setTimeRange}><SelectTrigger className="h-7 w-28 text-[10px] rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7d">Last 7 days</SelectItem><SelectItem value="30d">Last 30 days</SelectItem><SelectItem value="90d">Last 90 days</SelectItem><SelectItem value="1y">Last year</SelectItem></SelectContent></Select>
        <Tabs value={contentType} onValueChange={setContentType}><TabsList className="h-7"><TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger><TabsTrigger value="videos" className="text-[10px] h-5 px-2">Videos</TabsTrigger><TabsTrigger value="reels" className="text-[10px] h-5 px-2">Reels</TabsTrigger></TabsList></Tabs>
      </>
    }>
      {/* KPI Band */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-5">
        <KPICard label="Total Views" value="107.2K" change="+18.3%" trend="up" />
        <KPICard label="Total Likes" value="11.5K" change="+12.1%" trend="up" />
        <KPICard label="Comments" value="1.2K" change="+8.4%" trend="up" />
        <KPICard label="Shares" value="532" change="+22.7%" trend="up" />
        <KPICard label="New Followers" value="1.8K" change="+15.6%" trend="up" />
        <KPICard label="Watch Time" value="3.2K hrs" change="+9.2%" trend="up" />
        <KPICard label="Avg. Engagement" value="7.8%" change="-0.3%" trend="down" />
        <KPICard label="Content Published" value="12" change="+4" trend="up" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        {/* Views Chart */}
        <SectionCard title="Views Overview" icon={<Eye className="h-4 w-4 text-accent" />}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={VIEWS_DATA}>
                <defs>
                  <linearGradient id="videoGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} /></linearGradient>
                  <linearGradient id="reelGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--gigvora-purple))" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(var(--gigvora-purple))" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                <Area type="monotone" dataKey="videos" stroke="hsl(var(--accent))" fill="url(#videoGrad)" strokeWidth={2} name="Videos" />
                <Area type="monotone" dataKey="reels" stroke="hsl(var(--gigvora-purple))" fill="url(#reelGrad)" strokeWidth={2} name="Reels" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Engagement Chart */}
        <SectionCard title="Engagement Breakdown" icon={<Heart className="h-4 w-4 text-accent" />}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ENGAGEMENT_DATA}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                <Bar dataKey="likes" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Likes" />
                <Bar dataKey="comments" fill="hsl(var(--gigvora-purple))" radius={[4, 4, 0, 0]} name="Comments" />
                <Bar dataKey="shares" fill="hsl(var(--gigvora-green))" radius={[4, 4, 0, 0]} name="Shares" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Top Content */}
        <div className="xl:col-span-2">
          <SectionCard title="Top Performing Content" icon={<TrendingUp className="h-4 w-4 text-accent" />}>
            <div className="space-y-2">
              {TOP_CONTENT.map((c, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <span className="text-[10px] font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
                  <div className="h-8 w-12 rounded-lg bg-gradient-to-br from-accent/10 to-muted flex items-center justify-center shrink-0">
                    {c.type === 'video' ? <Film className="h-3 w-3 text-accent" /> : <Zap className="h-3 w-3 text-[hsl(var(--gigvora-purple))]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-medium truncate">{c.title}</div>
                    <Badge variant="outline" className="text-[7px] rounded-lg">{c.type}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-[9px] text-muted-foreground shrink-0">
                    <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{c.views}</span>
                    <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" />{c.likes}</span>
                    <span className="font-semibold text-foreground">{c.engagement}</span>
                    {c.trend === 'up' ? <ArrowUp className="h-3 w-3 text-emerald-500" /> : <ArrowDown className="h-3 w-3 text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Audience Breakdown */}
        <SectionCard title="Audience by Industry" icon={<Users className="h-4 w-4 text-accent" />}>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={AUDIENCE_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                  {AUDIENCE_DATA.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {AUDIENCE_DATA.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} /><span className="text-[10px]">{d.name}</span></div>
                <span className="text-[10px] font-semibold">{d.value}%</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
