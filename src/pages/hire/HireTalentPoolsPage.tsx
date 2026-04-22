import React, { useState } from 'react';
import { HireShell } from '@/components/shell/HireShell';
import { KPICard } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Star, Users, Plus, Search, Shield, Eye,
  Mail, Clock, MoreHorizontal, Share2,
} from 'lucide-react';

interface TalentPool {
  id: string; name: string; description: string; candidates: number;
  lastUpdated: string; owner: string; ownerAvatar: string; shared: boolean;
  tags: string[]; topCandidates: { name: string; avatar: string; headline: string }[];
}

const POOLS: TalentPool[] = [
  {
    id: '1', name: 'Senior Engineers Pipeline', description: 'Top-tier full-stack and backend engineers for Q2 hiring surge',
    candidates: 45, lastUpdated: '2h ago', owner: 'Sarah Kim', ownerAvatar: 'SK', shared: true,
    tags: ['Engineering', 'Senior', 'Full-Stack'],
    topCandidates: [
      { name: 'Ana Torres', avatar: 'AT', headline: 'Staff Engineer at Stripe' },
      { name: 'Wei Zhang', avatar: 'WZ', headline: 'Principal Engineer at Netflix' },
      { name: 'Priya Patel', avatar: 'PP', headline: 'ML Engineer at DeepMind' },
    ],
  },
  {
    id: '2', name: 'Design Leaders', description: 'Product design managers and design directors for org scaling',
    candidates: 18, lastUpdated: '1d ago', owner: 'Mike Chen', ownerAvatar: 'MC', shared: false,
    tags: ['Design', 'Leadership', 'Product'],
    topCandidates: [
      { name: 'Lisa Wang', avatar: 'LW', headline: 'Design Director at Figma' },
      { name: 'James Rivera', avatar: 'JR', headline: 'Head of Design at Canva' },
    ],
  },
  {
    id: '3', name: 'Data Science Watchlist', description: 'ML/AI talent pool for upcoming data platform team',
    candidates: 32, lastUpdated: '3d ago', owner: 'Sarah Kim', ownerAvatar: 'SK', shared: true,
    tags: ['ML', 'Data Science', 'AI'],
    topCandidates: [
      { name: 'David Kim', avatar: 'DK', headline: 'Senior ML Engineer at OpenAI' },
      { name: 'Maria Garcia', avatar: 'MG', headline: 'Research Scientist at Google Brain' },
      { name: 'Alex Chen', avatar: 'AC', headline: 'Data Science Lead at Uber' },
    ],
  },
  {
    id: '4', name: 'Product Managers', description: 'Senior and staff PMs with B2B SaaS experience',
    candidates: 24, lastUpdated: '5d ago', owner: 'Tom Lee', ownerAvatar: 'TL', shared: false,
    tags: ['Product', 'B2B', 'SaaS'],
    topCandidates: [
      { name: 'Raj Patel', avatar: 'RP', headline: 'Group PM at Slack' },
    ],
  },
  {
    id: '5', name: 'Executive Pipeline', description: 'VP and C-suite candidates for leadership expansion',
    candidates: 8, lastUpdated: '1w ago', owner: 'CTO', ownerAvatar: 'CT', shared: true,
    tags: ['Executive', 'C-Suite', 'VP'],
    topCandidates: [
      { name: 'Jennifer Wu', avatar: 'JW', headline: 'VP Engineering at Shopify' },
      { name: 'Robert Clark', avatar: 'RC', headline: 'CTO at Series B Startup' },
    ],
  },
];

export default function HireTalentPoolsPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const filtered = POOLS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <HireShell>
      <SectionBackNav homeRoute="/hire" homeLabel="Recruitment" currentLabel="Talent Pools" icon={<Shield className="h-3 w-3" />} />

      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <Star className="h-4 w-4 text-accent" />
        <h1 className="text-sm font-bold mr-2">Talent Pools</h1>
        <KPICard label="Total Pools" value={String(POOLS.length)} />
        <KPICard label="Total Candidates" value={String(POOLS.reduce((a, p) => a + p.candidates, 0))} />
        <KPICard label="Shared" value={String(POOLS.filter(p => p.shared).length)} />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search pools..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
            <TabsTrigger value="mine" className="text-[10px] h-5 px-2">My Pools</TabsTrigger>
            <TabsTrigger value="shared" className="text-[10px] h-5 px-2">Shared</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl"><Plus className="h-3 w-3" /> New Pool</Button>
      </div>

      <div className="space-y-3">
        {filtered.map(pool => (
          <div key={pool.id} className="p-4 rounded-2xl border border-border/40 hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer group">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Star className="h-4.5 w-4.5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold group-hover:text-accent transition-colors">{pool.name}</span>
                  {pool.shared && <Badge className="text-[7px] h-3.5 bg-accent/10 text-accent border-0">Shared</Badge>}
                  <Badge variant="outline" className="text-[7px] h-3.5"><Users className="h-2 w-2 mr-0.5" />{pool.candidates}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">{pool.description}</p>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {pool.tags.map(t => <Badge key={t} variant="outline" className="text-[7px] h-3.5 px-1.5">{t}</Badge>)}
                </div>
                {/* Top Candidates Preview */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {pool.topCandidates.slice(0, 4).map((c, i) => (
                      <Avatar key={i} className="h-6 w-6 border-2 border-background">
                        <AvatarFallback className="text-[7px] bg-muted">{c.avatar}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-[8px] text-muted-foreground">
                    {pool.topCandidates.map(c => c.name).join(', ')}
                    {pool.candidates > pool.topCandidates.length && ` +${pool.candidates - pool.topCandidates.length} more`}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <div className="flex items-center gap-1 text-[8px] text-muted-foreground mb-1">
                  <Clock className="h-2.5 w-2.5" /> {pool.lastUpdated}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Eye className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Mail className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Share2 className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><MoreHorizontal className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </HireShell>
  );
}
