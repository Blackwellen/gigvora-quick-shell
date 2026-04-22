import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { AdvancedFilterPanel, RECRUITER_SEARCH_FILTERS, FilterValues } from '@/components/shell/AdvancedFilterPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Search, Mail, UserPlus, MapPin, Briefcase, Shield, Sparkles, BookmarkPlus, SlidersHorizontal, Eye } from 'lucide-react';

const MOCK_RESULTS = [
  { id: '1', name: 'Ana Torres', avatar: 'AT', headline: 'Staff Engineer @ Stripe', location: 'San Francisco', match: 94, openToWork: true, skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'], experience: '8 years' },
  { id: '2', name: 'David Kim', avatar: 'DK', headline: 'Engineering Manager @ Meta', location: 'New York', match: 88, openToWork: false, skills: ['Leadership', 'System Design', 'Java', 'Python'], experience: '12 years' },
  { id: '3', name: 'Priya Patel', avatar: 'PP', headline: 'ML Engineer @ DeepMind', location: 'London', match: 91, openToWork: true, skills: ['PyTorch', 'LLMs', 'MLOps', 'Python'], experience: '6 years' },
  { id: '4', name: 'James Chen', avatar: 'JC', headline: 'Senior Frontend @ Netflix', location: 'Remote', match: 85, openToWork: false, skills: ['React', 'Vue', 'Performance', 'A11y'], experience: '7 years' },
  { id: '5', name: 'Lisa Wang', avatar: 'LW', headline: 'DevOps Lead @ AWS', location: 'Seattle', match: 82, openToWork: true, skills: ['Kubernetes', 'Terraform', 'AWS', 'CI/CD'], experience: '9 years' },
];

export default function RecruiterCandidateSearchPage() {
  const [query, setQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-2 w-full">
          <Search className="h-4 w-4 text-[hsl(var(--state-healthy))]" />
          <h1 className="text-sm font-bold mr-4">Candidate Search</h1>
          <Badge variant="outline" className="text-[9px]"><Shield className="h-2.5 w-2.5 mr-0.5" /> Private</Badge>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <AdvancedFilterPanel filters={RECRUITER_SEARCH_FILTERS} values={filterValues} onChange={setFilterValues} compact />
        </div>
      }
      rightRailWidth="w-56"
    >
      <SectionBackNav homeRoute="/recruiter-pro" homeLabel="Recruiter Pro" currentLabel="Candidate Search" icon={<Search className="h-3 w-3" />} />

      <SectionCard title="Search">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by skills, title, company, location..." value={query} onChange={e => setQuery(e.target.value)} className="pl-10 h-10 text-sm" />
          </div>
          <Button size="sm" className="h-10 gap-1 text-xs"><Sparkles className="h-3.5 w-3.5" /> AI Search</Button>
        </div>
        <AdvancedFilterPanel filters={RECRUITER_SEARCH_FILTERS} values={filterValues} onChange={setFilterValues} inline className="mb-2" />
      </SectionCard>

      <SectionCard title="Results" subtitle={`${MOCK_RESULTS.length} found`} className="mt-4">
        <div className="space-y-2">
          {MOCK_RESULTS.map(c => (
            <div key={c.id} className="flex items-center gap-4 p-3.5 rounded-xl border border-border/40 hover:border-accent/30 hover:bg-accent/5 transition-all group">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-xs bg-muted">{c.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{c.name}</span>
                  {c.openToWork && <Badge className="text-[7px] h-3.5 bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0">Open to Work</Badge>}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{c.headline}</div>
                <div className="flex items-center gap-3 mt-1 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" /> {c.location}</span>
                  <span className="flex items-center gap-0.5"><Briefcase className="h-2.5 w-2.5" /> {c.experience}</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  {c.skills.map(s => <Badge key={s} variant="outline" className="text-[8px] h-4 px-1.5">{s}</Badge>)}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-muted-foreground">Match</span>
                  <div className="w-16"><Progress value={c.match} className="h-1.5" /></div>
                  <span className="text-[10px] font-semibold text-[hsl(var(--state-healthy))]">{c.match}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Eye className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><BookmarkPlus className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Mail className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><UserPlus className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
