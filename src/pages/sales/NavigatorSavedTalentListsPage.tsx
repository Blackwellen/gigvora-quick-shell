import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Users, Plus, Search, Filter, Star, MoreHorizontal, Share2, Download,
  UserPlus, Eye, Mail, Trash2, Clock, TrendingUp, Lock, Copy,
} from 'lucide-react';

interface TalentList {
  id: string; name: string; count: number; owner: string; ownerAvatar: string;
  shared: boolean; updated: string; tags: string[]; matchRate: number;
  status: 'active' | 'archived';
  topTalent: Array<{ name: string; initials: string; role: string; match: number }>;
}

const LISTS: TalentList[] = [
  {
    id: 'TL1', name: 'Senior React Engineers — Bay Area', count: 48, owner: 'Alex Kim', ownerAvatar: 'AK',
    shared: true, updated: '2h ago', tags: ['React', 'Senior', 'Bay Area'], matchRate: 87,
    status: 'active',
    topTalent: [
      { name: 'Jordan Lee', initials: 'JL', role: 'Staff Engineer @ Meta', match: 96 },
      { name: 'Sam Chen', initials: 'SC', role: 'Sr. Frontend @ Stripe', match: 94 },
      { name: 'Casey Brown', initials: 'CB', role: 'Lead Developer @ Airbnb', match: 91 },
    ],
  },
  {
    id: 'TL2', name: 'Product Designers — Remote', count: 32, owner: 'Sarah Park', ownerAvatar: 'SP',
    shared: false, updated: '1d ago', tags: ['Design', 'Remote', 'Mid-Senior'], matchRate: 79,
    status: 'active',
    topTalent: [
      { name: 'Riley Adams', initials: 'RA', role: 'Sr. Designer @ Figma', match: 92 },
      { name: 'Morgan Liu', initials: 'ML', role: 'Product Designer @ Notion', match: 88 },
    ],
  },
  {
    id: 'TL3', name: 'DevOps / Platform Engineers', count: 21, owner: 'Alex Kim', ownerAvatar: 'AK',
    shared: true, updated: '3d ago', tags: ['DevOps', 'Kubernetes', 'AWS'], matchRate: 72,
    status: 'active',
    topTalent: [
      { name: 'Taylor Wright', initials: 'TW', role: 'Platform Lead @ Datadog', match: 89 },
    ],
  },
  {
    id: 'TL4', name: 'Q3 Data Science Candidates', count: 15, owner: 'Mike Rivera', ownerAvatar: 'MR',
    shared: false, updated: '2w ago', tags: ['Data Science', 'ML', 'Python'], matchRate: 65,
    status: 'archived',
    topTalent: [],
  },
];

const NavigatorSavedTalentListsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const filtered = LISTS.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

  const topStrip = (
    <>
      <Users className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Navigator — Saved Talent Lists</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input
          className="h-7 w-44 rounded-xl border bg-muted/30 pl-7 pr-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Search lists…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />New List</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Quick Stats" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Total Lists</span><span className="font-semibold">{LISTS.length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total Talent</span><span className="font-semibold">{LISTS.reduce((s, l) => s + l.count, 0)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Shared Lists</span><span className="font-semibold">{LISTS.filter(l => l.shared).length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Avg Match</span><span className="font-semibold">{Math.round(LISTS.reduce((s, l) => s + l.matchRate, 0) / LISTS.length)}%</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Actions" className="!rounded-2xl">
        <div className="space-y-1.5">
          <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><Download className="h-3 w-3" />Export All</Button>
          <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><Copy className="h-3 w-3" />Duplicate List</Button>
          <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><Filter className="h-3 w-3" />Merge Lists</Button>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Total Lists" value={String(LISTS.length)} change="2 shared" className="!rounded-2xl" />
        <KPICard label="Talent Saved" value={String(LISTS.reduce((s, l) => s + l.count, 0))} change="+12 this week" className="!rounded-2xl" />
        <KPICard label="Avg Match Rate" value={`${Math.round(LISTS.reduce((s, l) => s + l.matchRate, 0) / LISTS.length)}%`} change="↑ 3%" className="!rounded-2xl" />
        <KPICard label="Contacted" value="23" change="from saved talent" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {filtered.map(list => (
          <div key={list.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Users className="h-4.5 w-4.5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold truncate">{list.name}</span>
                  {list.shared && <Share2 className="h-3 w-3 text-muted-foreground" />}
                  <StatusBadge status={list.status === 'active' ? 'healthy' : 'pending'} label={list.status} />
                </div>
                <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1"><Avatar className="h-3.5 w-3.5"><AvatarFallback className="text-[6px]">{list.ownerAvatar}</AvatarFallback></Avatar>{list.owner}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{list.updated}</span>
                  <span>·</span>
                  <span className="font-medium">{list.count} candidates</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Eye className="h-3 w-3" />View</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Mail className="h-3 w-3" />Outreach</Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {list.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-[8px] h-4 rounded-lg">{tag}</Badge>
              ))}
              <div className="flex-1" />
              <div className="flex items-center gap-1 text-[9px]">
                <TrendingUp className="h-3 w-3 text-[hsl(var(--state-healthy))]" />
                <span className="font-semibold">{list.matchRate}%</span>
                <span className="text-muted-foreground">avg match</span>
              </div>
            </div>

            {list.topTalent.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {list.topTalent.map(t => (
                  <div key={t.name} className="rounded-xl bg-muted/30 p-2.5 flex items-center gap-2">
                    <Avatar className="h-7 w-7"><AvatarFallback className="text-[8px] font-bold">{t.initials}</AvatarFallback></Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-semibold truncate">{t.name}</div>
                      <div className="text-[8px] text-muted-foreground truncate">{t.role}</div>
                    </div>
                    <Badge className="text-[7px] h-4 bg-accent/10 text-accent border-0 rounded-lg">{t.match}%</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default NavigatorSavedTalentListsPage;
