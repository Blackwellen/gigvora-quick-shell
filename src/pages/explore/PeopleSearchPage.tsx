import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { AdvancedFilterPanel, EXPLORE_PEOPLE_FILTERS, FilterValues } from '@/components/shell/AdvancedFilterPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Users, Search, MapPin, Briefcase, Star, UserPlus, MessageSquare, SlidersHorizontal, Heart } from 'lucide-react';

const RESULTS = [
  { name: 'Sarah Chen', role: 'Senior Product Manager', company: 'Google', location: 'Remote', rating: 4.9, connections: 248, mutual: 12, skills: ['Product Strategy', 'User Research', 'Agile'] },
  { name: 'James Wilson', role: 'Staff Engineer', company: 'Stripe', location: 'San Francisco', rating: 4.8, connections: 312, mutual: 8, skills: ['System Design', 'React', 'Node.js'] },
  { name: 'Priya Sharma', role: 'Design Director', company: 'Figma', location: 'London', rating: 4.9, connections: 520, mutual: 15, skills: ['UX Design', 'Design Systems', 'Leadership'] },
  { name: 'Marcus Johnson', role: 'Data Science Lead', company: 'Netflix', location: 'Remote', rating: 4.7, connections: 186, mutual: 4, skills: ['Machine Learning', 'Python', 'Analytics'] },
  { name: 'Lena Müller', role: 'Brand Strategist', company: 'IDEO', location: 'Berlin', rating: 4.8, connections: 290, mutual: 6, skills: ['Branding', 'Strategy', 'Workshop Facilitation'] },
];

export default function PeopleSearchPage() {
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  return (
    <DashboardLayout
      topStrip={<><Users className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">People Search</span><div className="flex-1" /></>}
      rightRail={
        <div className="space-y-3">
          <AdvancedFilterPanel filters={EXPLORE_PEOPLE_FILTERS} values={filterValues} onChange={setFilterValues} compact />
        </div>
      }
      rightRailWidth="w-52"
    >
      <SectionBackNav homeRoute="/explore" homeLabel="Explore" currentLabel="People" icon={<Users className="h-3 w-3" />} />

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search people by name, role, skill, or company..." className="pl-8 h-8 text-xs rounded-xl" /></div>
      </div>

      <AdvancedFilterPanel filters={EXPLORE_PEOPLE_FILTERS} values={filterValues} onChange={setFilterValues} inline className="mb-3" />

      <KPIBand className="mb-3">
        <KPICard label="Results" value="2,480" className="!rounded-2xl" />
        <KPICard label="Online Now" value="342" className="!rounded-2xl" />
        <KPICard label="Open to Connect" value="1,820" className="!rounded-2xl" />
        <KPICard label="Mentors Available" value="86" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {RESULTS.map((r, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 rounded-xl shrink-0"><AvatarFallback className="rounded-xl bg-accent/10 text-accent text-[10px] font-bold">{r.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{r.name}</span>
                  <span className="flex items-center gap-0.5 text-[8px] text-muted-foreground"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{r.rating}</span>
                </div>
                <div className="flex items-center gap-2 text-[8px] text-muted-foreground mb-1">
                  <span className="flex items-center gap-0.5"><Briefcase className="h-2.5 w-2.5" />{r.role} at {r.company}</span>
                  <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{r.location}</span>
                  <span>{r.mutual} mutual</span>
                </div>
                <div className="flex flex-wrap gap-1">{r.skills.map(s => <Badge key={s} variant="outline" className="text-[7px] h-3.5 rounded-md">{s}</Badge>)}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Heart className="h-3 w-3" />Follow</Button>
                <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><UserPlus className="h-3 w-3" />Connect</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><MessageSquare className="h-3 w-3" /></Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
