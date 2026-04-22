import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, Lock, Globe, Eye, SlidersHorizontal, UserPlus } from 'lucide-react';

const GROUPS = [
  { name: 'Product Design Collective', members: 4200, posts: '12/day', type: 'Public', category: 'Design', description: 'Community for product designers sharing work, feedback, and career advice.' },
  { name: 'React Developers Hub', members: 8600, posts: '24/day', type: 'Public', category: 'Engineering', description: 'All things React — hooks, patterns, performance, and best practices.' },
  { name: 'Freelancer Mastermind', members: 1800, posts: '8/day', type: 'Private', category: 'Business', description: 'Accountability group for freelancers growing their businesses.' },
  { name: 'AI & Machine Learning', members: 5400, posts: '18/day', type: 'Public', category: 'Technology', description: 'Discussions on ML papers, tools, and applications in industry.' },
  { name: 'Women in Tech Leadership', members: 3200, posts: '6/day', type: 'Private', category: 'Career', description: 'Supporting women in tech leadership roles with mentorship and networking.' },
];

export default function GroupsSearchPage() {
  return (
    <DashboardLayout topStrip={<><Users className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Groups Search</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><SlidersHorizontal className="h-3 w-3" />Filters</Button></>}>
      <div className="flex gap-2 mb-3"><div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search groups..." className="pl-8 h-8 text-xs rounded-xl" /></div></div>
      <div className="flex flex-wrap gap-1 mb-3">{['Category', 'Type', 'Size', 'Activity'].map(f => <Button key={f} variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">{f}</Button>)}</div>
      <KPIBand className="mb-3">
        <KPICard label="Total Groups" value="1,240" className="!rounded-2xl" />
        <KPICard label="Public" value="860" className="!rounded-2xl" />
        <KPICard label="My Groups" value="8" className="!rounded-2xl" />
        <KPICard label="Trending" value="24" className="!rounded-2xl" />
      </KPIBand>
      <div className="space-y-2.5">
        {GROUPS.map((g, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{g.name}</span>
                  <Badge variant="outline" className="text-[7px] rounded-md gap-0.5">{g.type === 'Private' ? <Lock className="h-2 w-2" /> : <Globe className="h-2 w-2" />}{g.type}</Badge>
                  <Badge variant="outline" className="text-[7px] rounded-md">{g.category}</Badge>
                </div>
                <p className="text-[8px] text-muted-foreground mb-0.5">{g.description}</p>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{g.members.toLocaleString()} members</span>
                  <span>{g.posts} avg</span>
                </div>
              </div>
              <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><UserPlus className="h-3 w-3" />Join</Button>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
