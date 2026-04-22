import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, SectionCard } from '@/components/shell/EnterprisePrimitives';
import { MOCK_USERS, MOCK_JOBS, MOCK_GIGS } from '@/data/mock';
import { cn } from '@/lib/utils';
import {
  Search, MapPin, Star, Users, Briefcase, Building2,
  GraduationCap, Layers, Calendar, X, CheckCircle2,
  FileText, Bookmark, TrendingUp, Sparkles,
  Grid3X3, List, Map, Clock, Bell,
  BarChart3, ExternalLink, RefreshCw, Save,
  AlertTriangle, Trash2,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════ */
type EntityType = 'all' | 'talent' | 'jobs' | 'gigs' | 'projects' | 'companies' | 'mentors' | 'events' | 'groups';
type ViewMode = 'grid' | 'list' | 'map';
type SortMode = 'relevance' | 'newest' | 'rating' | 'distance';

const ENTITY_TABS: { id: EntityType; label: string; icon: React.ElementType; count: string }[] = [
  { id: 'all', label: 'All', icon: Search, count: '30K+' },
  { id: 'talent', label: 'Talent', icon: Users, count: '12.5K' },
  { id: 'jobs', label: 'Jobs', icon: Briefcase, count: '3.2K' },
  { id: 'gigs', label: 'Gigs', icon: Layers, count: '8.7K' },
  { id: 'projects', label: 'Projects', icon: FileText, count: '1.4K' },
  { id: 'companies', label: 'Companies', icon: Building2, count: '2.1K' },
  { id: 'mentors', label: 'Mentors', icon: GraduationCap, count: '890' },
  { id: 'events', label: 'Events', icon: Calendar, count: '456' },
  { id: 'groups', label: 'Groups', icon: Users, count: '1.2K' },
];

/* ── Mock Data ── */
const MOCK_COMPANIES = [
  { id: 'c1', name: 'LaunchPad AI', industry: 'AI / SaaS', location: 'San Francisco', size: '50-200', rating: 4.8, jobs: 12, logo: 'L' },
  { id: 'c2', name: 'GreenFlow Tech', industry: 'CleanTech', location: 'Berlin', size: '10-50', rating: 4.6, jobs: 5, logo: 'G' },
  { id: 'c3', name: 'DataBridge Analytics', industry: 'Data Analytics', location: 'London', size: '200-500', rating: 4.9, jobs: 23, logo: 'D' },
  { id: 'c4', name: 'HealthPulse', industry: 'HealthTech', location: 'Singapore', size: '1-10', rating: 4.5, jobs: 2, logo: 'H' },
  { id: 'c5', name: 'FinServe Pro', industry: 'FinTech', location: 'New York', size: '500+', rating: 4.7, jobs: 34, logo: 'F' },
  { id: 'c6', name: 'EduSpark', industry: 'EdTech', location: 'Toronto', size: '50-200', rating: 4.4, jobs: 8, logo: 'E' },
];

const MOCK_MENTORS = [
  { id: 'm1', name: 'Dr. Susan Lee', expertise: 'AI Strategy', rate: '$350/hr', rating: 5.0, sessions: 89, location: 'San Francisco' },
  { id: 'm2', name: 'Michael Torres', expertise: 'SaaS Growth', rate: '$200/hr', rating: 4.9, sessions: 156, location: 'Austin' },
  { id: 'm3', name: 'Amara Obi', expertise: 'Operations', rate: '$175/hr', rating: 4.7, sessions: 67, location: 'Lagos' },
  { id: 'm4', name: 'James Crawford', expertise: 'Fundraising', rate: '$250/hr', rating: 4.8, sessions: 234, location: 'London' },
];

const MOCK_EVENTS_EXPLORE = [
  { id: 'e1', title: 'AI in Product Design', date: 'Apr 15, 2026', type: 'Webinar', attendees: 234, host: 'DesignOps Guild' },
  { id: 'e2', title: 'Startup Pitch Night', date: 'Apr 18, 2026', type: 'In-Person', attendees: 89, host: 'LaunchPad Community' },
  { id: 'e3', title: 'Remote Work Summit', date: 'Apr 22, 2026', type: 'Virtual', attendees: 1200, host: 'Gigvora' },
  { id: 'e4', title: 'FinTech Networking Mixer', date: 'Apr 25, 2026', type: 'In-Person', attendees: 56, host: 'FinServe Pro' },
];

const SAVED_SEARCHES = [
  { id: 'ss1', query: 'React Developer · Remote', type: 'talent' as EntityType, matches: 24, lastRun: '2h ago', alerts: true },
  { id: 'ss2', query: 'Product Designer · San Francisco', type: 'jobs' as EntityType, matches: 12, lastRun: '5h ago', alerts: true },
  { id: 'ss3', query: 'AI Startup · Series A', type: 'companies' as EntityType, matches: 8, lastRun: '1d ago', alerts: false },
];

const RECENT_QUERIES = [
  'React Developer Remote', 'AI Engineer startup', 'Product Designer', 'Startup Advisor',
  'Full-Stack Freelancer', 'FinTech Jobs',
];

const TRENDING_SEARCHES = [
  'AI Engineer', 'React Developer Remote', 'Product Designer', 'Data Science Mentor',
  'Full-Stack Freelancer', 'UX Research', 'FinTech Jobs', 'Startup Advisor',
];

const FILTER_FACETS: Record<string, string[]> = {
  location: ['Remote', 'San Francisco', 'New York', 'London', 'Berlin', 'Singapore', 'Toronto'],
  experience: ['Entry Level', 'Mid Level', 'Senior', 'Lead', 'Executive'],
  skills: ['React', 'TypeScript', 'Python', 'Node.js', 'Figma', 'AWS', 'AI/ML', 'Data Science'],
  industry: ['AI / SaaS', 'FinTech', 'HealthTech', 'CleanTech', 'EdTech', 'E-Commerce'],
  budget: ['Under $1K', '$1K-$5K', '$5K-$15K', '$15K-$50K', '$50K+'],
  rating: ['4.5+', '4.0+', '3.5+', 'Any'],
};

const getFacetsForType = (t: EntityType): string[] => {
  switch (t) {
    case 'talent': return ['location', 'experience', 'skills', 'rating'];
    case 'jobs': return ['location', 'experience', 'skills', 'industry'];
    case 'gigs': return ['skills', 'budget', 'rating'];
    case 'projects': return ['skills', 'budget', 'experience'];
    case 'companies': return ['location', 'industry'];
    case 'mentors': return ['skills', 'rating', 'budget'];
    case 'events': return ['location', 'industry'];
    default: return ['location', 'skills', 'industry'];
  }
};

/* ═══════════════════════════════════════════════════════════
   Facets Rail (Left Sidebar)
   ═══════════════════════════════════════════════════════════ */
const FacetsRail: React.FC<{
  entityType: EntityType;
  activeFacets: Record<string, string[]>;
  onToggle: (facet: string, val: string) => void;
  onClear: () => void;
}> = ({ entityType, activeFacets, onToggle, onClear }) => {
  const facets = getFacetsForType(entityType);
  const activeCount = Object.values(activeFacets).flat().length;
  return (
    <div className="space-y-3">
      <SectionCard title="Filters" subtitle={activeCount > 0 ? `${activeCount} active` : undefined} action={
        activeCount > 0 ? <Button variant="ghost" size="sm" className="text-[10px] h-5 text-[hsl(var(--state-blocked))]" onClick={onClear}>Clear</Button> : undefined
      }>
        {facets.map(fk => (
          <div key={fk} className="py-2 border-b last:border-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{fk}</div>
            <div className="flex flex-wrap gap-1">
              {FILTER_FACETS[fk]?.map(v => {
                const active = activeFacets[fk]?.includes(v);
                return (
                  <button key={v} onClick={() => onToggle(fk, v)} className={cn(
                    'text-[9px] px-2 py-0.5 rounded-md border transition-colors',
                    active ? 'bg-accent text-accent-foreground border-accent' : 'hover:bg-muted/50'
                  )}>{v}</button>
                );
              })}
            </div>
          </div>
        ))}
      </SectionCard>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Result Cards (Dense Enterprise)
   ═══════════════════════════════════════════════════════════ */
const TalentRow: React.FC<{ user: typeof MOCK_USERS[0]; view: ViewMode; onSelect: () => void; selected: boolean }> = ({ user, view, onSelect, selected }) => {
  if (view === 'list') {
    return (
      <div onClick={onSelect} className={cn('flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all', selected ? 'border-accent/30 bg-accent/5' : 'hover:bg-muted/30 border-transparent')}>
        <Avatar className="h-8 w-8 shrink-0"><AvatarFallback className="text-[10px] bg-accent/10 text-accent">{user.name[0]}</AvatarFallback></Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium flex items-center gap-1">{user.name} {user.verified && <CheckCircle2 className="h-3 w-3 text-accent" />}</div>
          <div className="text-[10px] text-muted-foreground truncate">{user.headline}</div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button variant="outline" size="sm" className="h-6 text-[9px]">View</Button>
          <Button size="sm" className="h-6 text-[9px]">Connect</Button>
        </div>
      </div>
    );
  }
  return (
    <div onClick={onSelect} className={cn('rounded-lg border bg-card p-3 cursor-pointer transition-all', selected ? 'border-accent/30 ring-1 ring-accent/20' : 'hover:shadow-sm')}>
      <div className="flex items-start gap-2.5 mb-2">
        <Avatar className="h-9 w-9"><AvatarFallback className="text-[10px] bg-accent/10 text-accent">{user.name[0]}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-medium flex items-center gap-1">{user.name} {user.verified && <CheckCircle2 className="h-3 w-3 text-accent" />}</div>
          <div className="text-[10px] text-muted-foreground truncate">{user.headline}</div>
        </div>
        <button className="text-muted-foreground hover:text-accent"><Bookmark className="h-3 w-3" /></button>
      </div>
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" className="flex-1 h-6 text-[9px]">View</Button>
        <Button size="sm" className="flex-1 h-6 text-[9px]">Connect</Button>
      </div>
    </div>
  );
};

const JobRow: React.FC<{ job: typeof MOCK_JOBS[0]; view: ViewMode; onSelect: () => void; selected: boolean }> = ({ job, view, onSelect, selected }) => (
  <div onClick={onSelect} className={cn('rounded-lg border bg-card p-3 cursor-pointer transition-all', selected ? 'border-accent/30 ring-1 ring-accent/20' : 'hover:shadow-sm', view === 'list' && 'flex items-center gap-3')}>
    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0"><Building2 className="h-4 w-4 text-muted-foreground" /></div>
    <div className="flex-1 min-w-0 mt-1.5">
      <div className="text-[11px] font-medium truncate">{job.title}</div>
      <div className="text-[10px] text-muted-foreground">{job.company} · {job.location}</div>
      <div className="text-[10px] text-muted-foreground">{job.salary} · {job.type}</div>
    </div>
    <div className="flex gap-1 mt-1.5 flex-wrap">
      {job.skills.slice(0, 3).map(s => <Badge key={s} variant="secondary" className="text-[8px] h-4">{s}</Badge>)}
    </div>
  </div>
);

const GigRow: React.FC<{ gig: typeof MOCK_GIGS[0]; view: ViewMode; onSelect: () => void; selected: boolean }> = ({ gig, view, onSelect, selected }) => (
  <div onClick={onSelect} className={cn('rounded-lg border bg-card p-3 cursor-pointer transition-all', selected ? 'border-accent/30 ring-1 ring-accent/20' : 'hover:shadow-sm', view === 'list' && 'flex items-center gap-3')}>
    <div className="h-8 w-8 rounded-md bg-accent/10 flex items-center justify-center shrink-0"><Layers className="h-4 w-4 text-accent" /></div>
    <div className="flex-1 min-w-0 mt-1.5">
      <div className="text-[11px] font-medium truncate">{gig.title}</div>
      <div className="text-[10px] text-muted-foreground">{gig.seller.name}</div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[10px] font-semibold">From ${gig.startingPrice}</span>
        <Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />
        <span className="text-[9px]">{gig.rating}</span>
      </div>
    </div>
  </div>
);

const CompanyRow: React.FC<{ company: typeof MOCK_COMPANIES[0]; onSelect: () => void; selected: boolean }> = ({ company, onSelect, selected }) => (
  <div onClick={onSelect} className={cn('rounded-lg border bg-card p-3 cursor-pointer transition-all', selected ? 'border-accent/30 ring-1 ring-accent/20' : 'hover:shadow-sm')}>
    <div className="flex items-center gap-2.5 mb-1.5">
      <div className="h-8 w-8 rounded-md bg-accent/10 flex items-center justify-center font-bold text-[11px] text-accent">{company.logo}</div>
      <div>
        <div className="text-[11px] font-semibold">{company.name}</div>
        <div className="text-[10px] text-muted-foreground">{company.industry}</div>
      </div>
    </div>
    <div className="flex flex-wrap gap-2 text-[9px] text-muted-foreground">
      <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{company.location}</span>
      <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{company.size}</span>
      <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{company.rating}</span>
      <span className="flex items-center gap-0.5"><Briefcase className="h-2.5 w-2.5" />{company.jobs} open</span>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Detail Inspector (Right Rail Drawer)
   ═══════════════════════════════════════════════════════════ */
const DetailInspector: React.FC<{ type: EntityType; id: string | null; onClose: () => void }> = ({ type, id, onClose }) => {
  if (!id) return null;
  const company = MOCK_COMPANIES.find(c => c.id === id);
  const user = MOCK_USERS.find(u => u.id === id);
  const job = MOCK_JOBS.find(j => j.id === id);
  const gig = MOCK_GIGS.find(g => g.id === id);

  return (
    <SectionCard title="Inspector" action={<button onClick={onClose}><X className="h-3 w-3 text-muted-foreground" /></button>}>
      {type === 'companies' && company && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center font-bold text-accent">{company.logo}</div>
            <div>
              <div className="text-xs font-semibold">{company.name}</div>
              <div className="text-[10px] text-muted-foreground">{company.industry}</div>
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              { l: 'Location', v: company.location },
              { l: 'Size', v: company.size },
              { l: 'Rating', v: `${company.rating}/5.0` },
              { l: 'Open Jobs', v: `${company.jobs}` },
            ].map(f => (
              <div key={f.l} className="flex justify-between text-[10px]"><span className="text-muted-foreground">{f.l}</span><span className="font-medium">{f.v}</span></div>
            ))}
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="flex-1 text-[9px] h-6"><Bookmark className="h-2.5 w-2.5 mr-1" />Save</Button>
            <Button size="sm" className="flex-1 text-[9px] h-6"><ExternalLink className="h-2.5 w-2.5 mr-1" />View</Button>
          </div>
        </div>
      )}
      {type === 'talent' && user && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-10 w-10"><AvatarFallback className="bg-accent/10 text-accent">{user.name[0]}</AvatarFallback></Avatar>
            <div>
              <div className="text-xs font-semibold flex items-center gap-1">{user.name}{user.verified && <CheckCircle2 className="h-3 w-3 text-accent" />}</div>
              <div className="text-[10px] text-muted-foreground">{user.headline}</div>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="flex-1 text-[9px] h-6">Message</Button>
            <Button size="sm" className="flex-1 text-[9px] h-6">Connect</Button>
          </div>
        </div>
      )}
      {type === 'jobs' && job && (
        <div className="space-y-3">
          <div className="text-xs font-semibold">{job.title}</div>
          <div className="text-[10px] text-muted-foreground">{job.company} · {job.location}</div>
          <div className="text-[10px]">{job.salary} · {job.type}</div>
          <div className="flex flex-wrap gap-1">{job.skills.map(s => <Badge key={s} variant="secondary" className="text-[8px] h-4">{s}</Badge>)}</div>
          <Button size="sm" className="w-full text-[9px] h-6" asChild><Link to={`/jobs/${job.id}`}>View Full Listing</Link></Button>
        </div>
      )}
      {type === 'gigs' && gig && (
        <div className="space-y-3">
          <div className="text-xs font-semibold">{gig.title}</div>
          <div className="text-[10px] text-muted-foreground">{gig.seller.name}</div>
          <div className="text-[10px] font-semibold">From ${gig.startingPrice}</div>
          <Button size="sm" className="w-full text-[9px] h-6" asChild><Link to={`/gigs/${gig.id}`}>View Gig</Link></Button>
        </div>
      )}
      {!company && !user && !job && !gig && (
        <div className="text-center py-4 text-[10px] text-muted-foreground">Select a result to inspect</div>
      )}
    </SectionCard>
  );
};

/* ═══════════════════════════════════════════════════════════
   Recommendation Strip
   ═══════════════════════════════════════════════════════════ */
const RecommendationStrip: React.FC = () => (
  <SectionCard title="Recommended for You" subtitle="Based on your activity" icon={<Sparkles className="h-3.5 w-3.5 text-accent" />}>
    <div className="flex gap-2 overflow-x-auto pb-1">
      {MOCK_USERS.slice(0, 4).map(u => (
        <Link key={u.id} to={`/profile/${u.id}`} className="min-w-[120px] rounded-md border p-2 text-center hover:bg-muted/30 transition-colors shrink-0">
          <Avatar className="h-8 w-8 mx-auto mb-1"><AvatarFallback className="text-[9px] bg-accent/10 text-accent">{u.name[0]}</AvatarFallback></Avatar>
          <div className="text-[10px] font-medium truncate">{u.name}</div>
          <div className="text-[9px] text-muted-foreground truncate">{u.headline?.slice(0, 25)}</div>
        </Link>
      ))}
    </div>
  </SectionCard>
);

/* ═══════════════════════════════════════════════════════════
   Empty / Error States
   ═══════════════════════════════════════════════════════════ */
const NoQueryState: React.FC = () => (
  <div className="text-center py-10">
    <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
    <div className="text-sm font-medium">Start exploring</div>
    <p className="text-[11px] text-muted-foreground mt-1">Enter a query or select a category to discover talent, jobs, gigs, and more</p>
    <div className="flex flex-wrap justify-center gap-1.5 mt-4 max-w-md mx-auto">
      {TRENDING_SEARCHES.slice(0, 6).map(s => (
        <span key={s} className="text-[9px] px-2 py-0.5 rounded-full border cursor-pointer hover:bg-accent/10 hover:border-accent/30 transition-colors flex items-center gap-1">
          <TrendingUp className="h-2.5 w-2.5" />{s}
        </span>
      ))}
    </div>
  </div>
);

const NoResultsState: React.FC<{ query: string }> = ({ query }) => (
  <div className="text-center py-10">
    <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-[hsl(var(--state-caution))]/30" />
    <div className="text-sm font-medium">No results found</div>
    <p className="text-[11px] text-muted-foreground mt-1">No matches for "{query}". Try adjusting your filters or broadening your search.</p>
    <Button variant="outline" size="sm" className="mt-3 text-[10px] h-7">Clear Filters</Button>
  </div>
);

const DegradedState: React.FC = () => (
  <div className="rounded-lg border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3 flex items-center gap-3 mb-3">
    <AlertTriangle className="h-4 w-4 text-[hsl(var(--state-caution))] shrink-0" />
    <div className="flex-1">
      <div className="text-[11px] font-medium">Index partially degraded</div>
      <div className="text-[10px] text-muted-foreground">Some results may be delayed. Last full sync: 15 min ago.</div>
    </div>
    <Button variant="ghost" size="sm" className="text-[10px] h-6"><RefreshCw className="h-3 w-3 mr-1" />Retry</Button>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Map View
   ═══════════════════════════════════════════════════════════ */
const MapView: React.FC = () => (
  <div className="rounded-lg border bg-card overflow-hidden">
    <div className="h-[400px] bg-muted/30 flex flex-col items-center justify-center text-muted-foreground">
      <Map className="h-10 w-10 mb-2" />
      <p className="text-xs font-medium">Interactive Map View</p>
      <p className="text-[10px]">Geo-located results</p>
      <div className="grid grid-cols-3 gap-2 mt-4">
        {[{ city: 'San Francisco', count: 234 }, { city: 'London', count: 189 }, { city: 'Berlin', count: 145 }].map(c => (
          <div key={c.city} className="rounded-md border bg-card p-2 text-center">
            <MapPin className="h-3 w-3 mx-auto mb-0.5 text-accent" />
            <div className="text-[10px] font-medium">{c.city}</div>
            <div className="text-[9px] text-muted-foreground">{c.count}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const ExplorerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const entityType = (searchParams.get('type') || 'all') as EntityType;
  const queryParam = searchParams.get('q') || '';

  const [query, setQuery] = useState(queryParam);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('relevance');
  const [activeFacets, setActiveFacets] = useState<Record<string, string[]>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDegraded] = useState(false);
  const [savedSearches, setSavedSearches] = useState(SAVED_SEARCHES);
  const [tab, setTab] = useState<'results' | 'saved' | 'compare'>('results');

  const activeFilterCount = Object.values(activeFacets).flat().length;
  const hasQuery = query.trim().length > 0 || entityType !== 'all';

  const toggleFacet = (facet: string, val: string) => {
    setActiveFacets(prev => {
      const cur = prev[facet] || [];
      return { ...prev, [facet]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] };
    });
  };

  const setEntityType = (t: EntityType) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (t === 'all') next.delete('type'); else next.set('type', t);
      return next;
    });
    setSelectedId(null);
  };

  const handleSearch = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (query) next.set('q', query); else next.delete('q');
      return next;
    });
  };

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Explorer</span>
      </div>
      <div className="flex-1" />
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search talent, jobs, gigs, companies..."
          className="w-full h-7 rounded-md border bg-background pl-8 pr-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <select value={sortMode} onChange={e => setSortMode(e.target.value as SortMode)} className="h-7 rounded-md border bg-background px-2 text-[10px]">
          <option value="relevance">Relevance</option>
          <option value="newest">Newest</option>
          <option value="rating">Rating</option>
          <option value="distance">Distance</option>
        </select>
        <div className="flex border rounded-md overflow-hidden">
          {([['grid', Grid3X3], ['list', List], ['map', Map]] as [ViewMode, React.ElementType][]).map(([m, Icon]) => (
            <button key={m} onClick={() => setViewMode(m)} className={cn('px-1.5 py-1 transition-colors', viewMode === m ? 'bg-muted' : 'hover:bg-muted/50')}>
              <Icon className="h-3 w-3" />
            </button>
          ))}
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="text-[10px] h-7 text-[hsl(var(--state-blocked))]" onClick={() => setActiveFacets({})}>
            <X className="h-3 w-3 mr-1" />Clear ({activeFilterCount})
          </Button>
        )}
      </div>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <KPICard label="Total Results" value={hasQuery ? '1,247' : '30K+'} />
        <KPICard label="Saved Searches" value={savedSearches.length} />
      </div>

      {/* Inspector */}
      {selectedId && (
        <DetailInspector type={entityType === 'all' ? 'talent' : entityType} id={selectedId} onClose={() => setSelectedId(null)} />
      )}

      {/* Recommendations */}
      <RecommendationStrip />

      {/* Saved Searches */}
      <SectionCard title="Saved Searches" action={<Badge variant="secondary" className="text-[8px] h-3.5">{savedSearches.length}</Badge>}>
        {savedSearches.length === 0 ? (
          <div className="text-center py-3 text-[10px] text-muted-foreground">No saved searches yet</div>
        ) : (
          <div className="space-y-1.5">
            {savedSearches.map(s => (
              <div key={s.id} className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/30 transition-colors cursor-pointer">
                <Search className="h-3 w-3 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium truncate">{s.query}</div>
                  <div className="text-[9px] text-muted-foreground">{s.matches} new · {s.lastRun}</div>
                </div>
                {s.alerts && <Bell className="h-2.5 w-2.5 text-accent shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Recent Queries */}
      <SectionCard title="Recent Queries">
        <div className="flex flex-wrap gap-1">
          {RECENT_QUERIES.map(q => (
            <button key={q} onClick={() => { setQuery(q); handleSearch(); }} className="text-[9px] px-2 py-0.5 rounded-md border hover:bg-muted/50 transition-colors flex items-center gap-1">
              <Clock className="h-2 w-2" />{q}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Freshness */}
      <SectionCard title="Index Status">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[hsl(var(--state-healthy))] animate-pulse" />
          <span className="text-[10px] text-muted-foreground">All indices healthy · synced 2m ago</span>
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom Section ── */
  const bottomSection = (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold">Trending on Gigvora</span>
        <span className="text-[10px] text-muted-foreground">Updated hourly</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TRENDING_SEARCHES.map(t => (
          <button key={t} onClick={() => { setQuery(t); handleSearch(); }} className="flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-md border hover:bg-accent/10 hover:border-accent/30 transition-colors whitespace-nowrap shrink-0">
            <TrendingUp className="h-2.5 w-2.5 text-accent" />{t}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-72" bottomSection={bottomSection}>
      {/* Degraded Banner */}
      {showDegraded && <DegradedState />}

      {/* Entity Type Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-2">
        {ENTITY_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setEntityType(t.id)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors shrink-0',
              entityType === t.id
                ? 'bg-accent text-accent-foreground'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            )}
          >
            <t.icon className="h-3 w-3" />
            {t.label}
            <span className="text-[8px] ml-0.5 opacity-70">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Sub Tabs */}
      <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)} className="mb-3">
        <TabsList className="h-7">
          <TabsTrigger value="results" className="text-[10px] h-5">Results</TabsTrigger>
          <TabsTrigger value="saved" className="text-[10px] h-5">Saved</TabsTrigger>
          <TabsTrigger value="compare" className="text-[10px] h-5">Compare</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'results' && (
        <div className="flex gap-3">
          {/* Facets Sidebar (Desktop) */}
          {entityType !== 'all' && (
            <div className="hidden md:block w-48 shrink-0">
              <FacetsRail entityType={entityType} activeFacets={activeFacets} onToggle={toggleFacet} onClear={() => setActiveFacets({})} />
            </div>
          )}

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            {hasQuery && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground">
                  1,247 results{queryParam && ` for "${queryParam}"`}{entityType !== 'all' && ` in ${entityType}`}
                </span>
                <Button variant="outline" size="sm" className="text-[9px] h-6"><Save className="h-2.5 w-2.5 mr-1" />Save Search</Button>
              </div>
            )}

            {/* Content */}
            {!hasQuery ? <NoQueryState /> : viewMode === 'map' ? <MapView /> : (
              <div className={cn(viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-2' : 'space-y-1')}>
                {(entityType === 'all' || entityType === 'talent') && MOCK_USERS.map(u => (
                  <TalentRow key={u.id} user={u} view={viewMode} onSelect={() => setSelectedId(u.id)} selected={selectedId === u.id} />
                ))}
                {(entityType === 'all' || entityType === 'jobs') && MOCK_JOBS.map(j => (
                  <JobRow key={j.id} job={j} view={viewMode} onSelect={() => setSelectedId(j.id)} selected={selectedId === j.id} />
                ))}
                {(entityType === 'all' || entityType === 'gigs') && MOCK_GIGS.map(g => (
                  <GigRow key={g.id} gig={g} view={viewMode} onSelect={() => setSelectedId(g.id)} selected={selectedId === g.id} />
                ))}
                {entityType === 'companies' && MOCK_COMPANIES.map(c => (
                  <CompanyRow key={c.id} company={c} onSelect={() => setSelectedId(c.id)} selected={selectedId === c.id} />
                ))}
                {entityType === 'mentors' && MOCK_MENTORS.map(m => (
                  <div key={m.id} onClick={() => setSelectedId(m.id)} className={cn('rounded-lg border bg-card p-3 cursor-pointer transition-all', selectedId === m.id ? 'border-accent/30 ring-1 ring-accent/20' : 'hover:shadow-sm')}>
                    <Avatar className="h-9 w-9 mb-1.5"><AvatarFallback className="text-[10px] bg-accent/10 text-accent">{m.name[0]}</AvatarFallback></Avatar>
                    <div className="text-[11px] font-semibold">{m.name}</div>
                    <div className="text-[10px] text-muted-foreground">{m.expertise} · {m.location}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" /><span className="text-[10px]">{m.rating}</span>
                      <span className="text-[9px] text-muted-foreground">{m.sessions} sessions · {m.rate}</span>
                    </div>
                  </div>
                ))}
                {entityType === 'events' && MOCK_EVENTS_EXPLORE.map(e => (
                  <div key={e.id} className="rounded-lg border bg-card p-3 cursor-pointer hover:shadow-sm transition-all">
                    <Calendar className="h-5 w-5 text-accent mb-1.5" />
                    <div className="text-[11px] font-semibold">{e.title}</div>
                    <div className="text-[10px] text-muted-foreground">{e.date} · {e.type}</div>
                    <div className="text-[10px] text-muted-foreground">{e.attendees} attending</div>
                    <Button variant="outline" size="sm" className="mt-1.5 text-[9px] h-6">RSVP</Button>
                  </div>
                ))}
                {(entityType === 'groups' || entityType === 'projects') && <NoResultsState query={entityType} />}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'saved' && (
        <SectionCard title="Saved Searches" subtitle={`${savedSearches.length} saved`}>
          {savedSearches.length === 0 ? (
            <div className="text-center py-8 text-[11px] text-muted-foreground">No saved searches. Save a search to get alerts for new matches.</div>
          ) : (
            <div className="space-y-2">
              {savedSearches.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2.5">
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <div className="text-[11px] font-medium">{s.query}</div>
                      <div className="text-[10px] text-muted-foreground">Updated {s.lastRun} · {s.matches} new matches</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[9px]">{s.type}</Badge>
                    <Switch checked={s.alerts} onCheckedChange={() => {}} />
                    <Button variant="ghost" size="sm" className="h-6 text-[9px]">Run</Button>
                    <Button variant="ghost" size="sm" className="h-6 text-[9px] text-[hsl(var(--state-blocked))]"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {tab === 'compare' && (
        <SectionCard title="Compare" subtitle="Select up to 3 records" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />}>
          <div className="grid grid-cols-3 gap-3">
            {MOCK_COMPANIES.slice(0, 3).map(c => (
              <div key={c.id} className="rounded-lg border p-3 text-center">
                <div className="h-9 w-9 rounded-md bg-accent/10 flex items-center justify-center mx-auto mb-1.5 font-bold text-[11px] text-accent">{c.logo}</div>
                <div className="text-[11px] font-semibold">{c.name}</div>
                <div className="text-[9px] text-muted-foreground">{c.industry}</div>
                <div className="mt-2 space-y-1">
                  {[['Rating', c.rating], ['Jobs', c.jobs], ['Size', c.size], ['Location', c.location]].map(([l, v]) => (
                    <div key={String(l)} className="flex justify-between text-[9px]"><span className="text-muted-foreground">{l}</span><span className="font-medium">{v}</span></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
};

export default ExplorerPage;

// Sub-page exports for routing
export const ExploreRecordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  return <div className="p-8 text-center text-muted-foreground">Record: {searchParams.get('type')} / {searchParams.get('id')}</div>;
};
