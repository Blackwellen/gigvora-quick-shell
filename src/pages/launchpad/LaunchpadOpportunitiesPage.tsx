import React, { useState } from 'react';
import { LaunchpadShell } from '@/components/launchpad/LaunchpadShell';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Search, Briefcase, MapPin, Clock, Users, Star, Bookmark,
  BookmarkCheck, ChevronRight, GraduationCap, Target,
  SlidersHorizontal, Grid, List, CheckCircle2, Award,
} from 'lucide-react';

interface Opportunity {
  id: string; title: string; company: string; avatar: string; type: string;
  location: string; salary?: string; skills: string[]; match: number;
  posted: string; applicants: number; mentorship: boolean; training: boolean;
  audience: string; duration: string; certificate: boolean;
}

const OPPORTUNITIES: Opportunity[] = [
  { id: 'o1', title: 'Junior Frontend Developer', company: 'TechCorp', avatar: 'TC', type: 'Entry Level', location: 'San Francisco, CA', salary: '$75-90K', skills: ['React', 'CSS', 'JavaScript'], match: 92, posted: '2d ago', applicants: 34, mentorship: true, training: true, audience: 'Graduates', duration: 'Full-time', certificate: false },
  { id: 'o2', title: 'Software Engineering Intern', company: 'ScaleUp Inc', avatar: 'SI', type: 'Internship', location: 'Remote', salary: '$35/hr', skills: ['Python', 'Git', 'SQL'], match: 78, posted: '1d ago', applicants: 89, mentorship: true, training: false, audience: 'All levels', duration: '3 months', certificate: true },
  { id: 'o3', title: 'Digital Apprenticeship', company: 'CloudScale', avatar: 'CS', type: 'Apprenticeship', location: 'Austin, TX', salary: '$55K', skills: ['HTML', 'CSS', 'JavaScript'], match: 85, posted: '3d ago', applicants: 22, mentorship: true, training: true, audience: 'School leavers', duration: '12 months', certificate: true },
  { id: 'o4', title: 'UX Research Shadowing', company: 'DesignFlow', avatar: 'DF', type: 'Shadowing', location: 'New York, NY', skills: ['UX Research', 'Figma'], match: 68, posted: '5d ago', applicants: 12, mentorship: true, training: false, audience: 'Career changers', duration: '4 weeks', certificate: false },
  { id: 'o5', title: 'Marketing Trainee Pathway', company: 'GrowthLab', avatar: 'GL', type: 'Trainee', location: 'Remote', salary: '$45K', skills: ['Content', 'Analytics', 'SEO'], match: 74, posted: '1d ago', applicants: 56, mentorship: true, training: true, audience: 'Graduates', duration: '6 months', certificate: true },
  { id: 'o6', title: 'Data Science Bootcamp', company: 'DataSphere', avatar: 'DS', type: 'Bootcamp', location: 'Remote', salary: '$2,500 stipend', skills: ['Python', 'ML', 'SQL'], match: 80, posted: '1w ago', applicants: 340, mentorship: false, training: true, audience: 'Career changers', duration: '8 weeks', certificate: true },
  { id: 'o7', title: 'Junior Product Manager', company: 'ProductPro', avatar: 'PP', type: 'Entry Level', location: 'London, UK', salary: '£35-45K', skills: ['Product', 'Strategy', 'Analytics'], match: 88, posted: '3d ago', applicants: 67, mentorship: true, training: false, audience: 'Graduates', duration: 'Full-time', certificate: false },
  { id: 'o8', title: 'Creative Design Trial Project', company: 'Gigvora', avatar: 'GV', type: 'Trial Project', location: 'Remote', skills: ['Design', 'Figma', 'Branding'], match: 91, posted: '2d ago', applicants: 28, mentorship: true, training: false, audience: 'All levels', duration: '2 weeks', certificate: true },
];

const TYPE_FILTERS = ['All', 'Entry Level', 'Internship', 'Apprenticeship', 'Trainee', 'Shadowing', 'Bootcamp', 'Trial Project'];
const AUDIENCE_FILTERS = ['All Audiences', 'Graduates', 'School leavers', 'Career changers', 'Returners'];

export default function LaunchpadOpportunitiesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set(['o1']));
  const [view, setView] = useState<'grid' | 'list'>('list');

  const filtered = OPPORTUNITIES.filter(o => {
    if (typeFilter !== 'All' && o.type !== typeFilter) return false;
    if (search && !o.title.toLowerCase().includes(search.toLowerCase()) && !o.company.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <LaunchpadShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold">Opportunities</h1>
          <p className="text-[11px] text-muted-foreground">{filtered.length} launchpad-friendly opportunities</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-8 text-[10px] rounded-xl w-48" />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className={cn('h-8 text-[10px] rounded-xl gap-1', showFilters && 'bg-accent/10 border-accent/30')}>
            <SlidersHorizontal className="h-3 w-3" /> Filters
          </Button>
          <div className="flex gap-0.5">
            <button onClick={() => setView('list')} className={cn('h-8 w-8 rounded-lg flex items-center justify-center', view === 'list' ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted')}><List className="h-3.5 w-3.5" /></button>
            <button onClick={() => setView('grid')} className={cn('h-8 w-8 rounded-lg flex items-center justify-center', view === 'grid' ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted')}><Grid className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Type Chips */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
        {TYPE_FILTERS.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} className={cn('px-3 py-1.5 rounded-xl text-[10px] font-medium shrink-0 transition-all', typeFilter === t ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>
            {t}
          </button>
        ))}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-4 rounded-2xl border bg-card/50">
          <div>
            <div className="text-[8px] font-semibold text-muted-foreground mb-1">Audience</div>
            <div className="flex flex-wrap gap-1">{AUDIENCE_FILTERS.map(a => <Badge key={a} variant="outline" className="text-[7px] rounded-lg cursor-pointer hover:bg-accent/10">{a}</Badge>)}</div>
          </div>
          <div>
            <div className="text-[8px] font-semibold text-muted-foreground mb-1">Features</div>
            <div className="flex flex-wrap gap-1">
              {['Mentorship', 'Training', 'Certificate', 'Paid'].map(f => <Badge key={f} variant="outline" className="text-[7px] rounded-lg cursor-pointer hover:bg-accent/10">{f}</Badge>)}
            </div>
          </div>
          <div>
            <div className="text-[8px] font-semibold text-muted-foreground mb-1">Location</div>
            <div className="flex flex-wrap gap-1">
              {['Remote', 'Hybrid', 'On-site'].map(l => <Badge key={l} variant="outline" className="text-[7px] rounded-lg cursor-pointer hover:bg-accent/10">{l}</Badge>)}
            </div>
          </div>
          <div>
            <div className="text-[8px] font-semibold text-muted-foreground mb-1">Sort By</div>
            <div className="flex flex-wrap gap-1">
              {['Best Match', 'Newest', 'Closing Soon', 'Most Popular'].map(s => <Badge key={s} variant="outline" className="text-[7px] rounded-lg cursor-pointer hover:bg-accent/10">{s}</Badge>)}
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <KPIBand className="mb-4">
        <KPICard label="Total Opportunities" value={String(OPPORTUNITIES.length)} className="!rounded-2xl" />
        <KPICard label="Avg Match" value="82%" className="!rounded-2xl" />
        <KPICard label="With Mentorship" value={String(OPPORTUNITIES.filter(o => o.mentorship).length)} className="!rounded-2xl" />
        <KPICard label="Saved" value={String(saved.size)} className="!rounded-2xl" />
      </KPIBand>

      {/* Results */}
      <div className={cn(view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2.5')}>
        {filtered.map(o => (
          <div key={o.id} className="rounded-2xl border bg-card p-4 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 rounded-xl shrink-0"><AvatarFallback className="rounded-xl bg-accent/10 text-accent text-[9px] font-bold">{o.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[12px] font-bold group-hover:text-accent transition-colors">{o.title}</span>
                  <Badge className="text-[7px] bg-accent/10 text-accent border-0 rounded-lg">{o.match}% match</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground flex items-center gap-2 mb-1.5">
                  <span>{o.company}</span>
                  <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{o.location}</span>
                  {o.salary && <span className="font-medium text-foreground">{o.salary}</span>}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  <Badge variant="outline" className="text-[7px] rounded-lg">{o.type}</Badge>
                  <Badge variant="outline" className="text-[7px] rounded-lg"><Clock className="h-2 w-2 mr-0.5" />{o.duration}</Badge>
                  <Badge variant="outline" className="text-[7px] rounded-lg"><GraduationCap className="h-2 w-2 mr-0.5" />{o.audience}</Badge>
                  {o.mentorship && <Badge className="text-[6px] bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))] border-0 rounded-lg">Mentored</Badge>}
                  {o.training && <Badge className="text-[6px] bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] border-0 rounded-lg">Training</Badge>}
                  {o.certificate && <Badge className="text-[6px] bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))] border-0 rounded-lg"><Award className="h-2 w-2 mr-0.5" />Certificate</Badge>}
                </div>
                <div className="flex gap-1 flex-wrap">{o.skills.map(s => <Badge key={s} variant="secondary" className="text-[7px] h-3.5 rounded-md">{s}</Badge>)}</div>
                <div className="flex items-center gap-3 mt-2 text-[8px] text-muted-foreground">
                  <span><Users className="h-2.5 w-2.5 inline mr-0.5" />{o.applicants} applicants</span>
                  <span>{o.posted}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <Button size="sm" className="h-7 text-[9px] rounded-xl">Apply</Button>
                <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); setSaved(p => { const s = new Set(p); if (s.has(o.id)) { s.delete(o.id); } else { s.add(o.id); } return s; }); }} className="h-7 text-[9px] rounded-xl gap-0.5">
                  {saved.has(o.id) ? <BookmarkCheck className="h-3 w-3 text-accent" /> : <Bookmark className="h-3 w-3" />}
                  {saved.has(o.id) ? 'Saved' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center text-[9px] text-muted-foreground">Showing {filtered.length} of {OPPORTUNITIES.length} opportunities</div>
    </LaunchpadShell>
  );
}
