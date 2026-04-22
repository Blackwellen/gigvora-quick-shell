import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Search, Plus, Users, MessageSquare, Star, TrendingUp, Lock, ChevronRight } from 'lucide-react';

const GROUPS = [
  { id: '1', name: 'React Developers', members: 12400, posts: 342, category: 'Technology', privacy: 'public' as const, joined: true, description: 'Community for React and frontend developers' },
  { id: '2', name: 'Freelance Professionals', members: 8900, posts: 189, category: 'Career', privacy: 'public' as const, joined: true, description: 'Tips, jobs, and support for freelancers' },
  { id: '3', name: 'Design Systems', members: 5600, posts: 98, category: 'Design', privacy: 'public' as const, joined: false, description: 'All things design systems and component libraries' },
  { id: '4', name: 'Startup Founders', members: 15200, posts: 567, category: 'Business', privacy: 'public' as const, joined: true, description: 'Network with founders and share experiences' },
  { id: '5', name: 'AI & Machine Learning', members: 21000, posts: 890, category: 'Technology', privacy: 'public' as const, joined: false, description: 'Discuss the latest in AI and ML' },
  { id: '6', name: 'Remote Work Hub', members: 9800, posts: 234, category: 'Lifestyle', privacy: 'public' as const, joined: true, description: 'Resources and discussions for remote workers' },
  { id: '7', name: 'CTO Network', members: 420, posts: 45, category: 'Leadership', privacy: 'private' as const, joined: true, description: 'Exclusive group for CTOs and engineering leaders' },
  { id: '8', name: 'Women in Tech', members: 18500, posts: 678, category: 'Community', privacy: 'public' as const, joined: false, description: 'Empowering women in technology careers' },
];

export default function GroupsHubPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const filtered = GROUPS.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) && (tab === 'all' || (tab === 'my' && g.joined) || (tab === 'discover' && !g.joined)));

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Globe className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Groups</h1>
          <KPICard label="My Groups" value={String(GROUPS.filter(g => g.joined).length)} />
          <KPICard label="Total Members" value="72K+" />
          <KPICard label="New Posts (7d)" value="1.2K" trend="up" change="+15%" />
        </div>
      }
    >
      <SectionCard title="Groups" action={
        <div className="flex items-center gap-2">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-7">
              <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
              <TabsTrigger value="my" className="text-[10px] h-5 px-2">My Groups</TabsTrigger>
              <TabsTrigger value="discover" className="text-[10px] h-5 px-2">Discover</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" /> Create Group</Button>
        </div>
      }>
        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search groups..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(g => (
            <div key={g.id} className="p-4 rounded-xl border border-border/40 hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer group">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold group-hover:text-accent transition-colors">{g.name}</span>
                    {g.privacy === 'private' && <Badge variant="outline" className="text-[7px] h-3.5 gap-0.5"><Lock className="h-2 w-2" /> Private</Badge>}
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{g.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" /> {g.members.toLocaleString()}</span>
                    <span className="flex items-center gap-0.5"><MessageSquare className="h-2.5 w-2.5" /> {g.posts} posts</span>
                    <Badge variant="secondary" className="text-[7px] h-3.5">{g.category}</Badge>
                  </div>
                </div>
                <div>
                  {g.joined ? (
                    <Badge className="text-[8px] h-4 bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0">Joined</Badge>
                  ) : (
                    <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><Plus className="h-2.5 w-2.5" /> Join</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
