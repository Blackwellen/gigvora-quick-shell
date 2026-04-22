import React, { useState } from 'react';
import { NetworkShell } from '@/components/shell/NetworkShell';
import { KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles, UserPlus, Users, MapPin, Eye, X, Filter,
  ChevronDown, Briefcase, Star, Globe, Building2,
  GraduationCap, Award,
} from 'lucide-react';

const SUGGESTIONS = [
  { id: '1', name: 'Elena Vasquez', avatar: 'EV', headline: 'VP Engineering @ Cloudflare', location: 'Austin', mutual: 24, relevance: 96, reason: 'Shared skills: React, TypeScript, Leadership', skills: ['React', 'TypeScript', 'Engineering Leadership'], industry: 'Infrastructure' },
  { id: '2', name: 'Raj Krishnan', avatar: 'RK', headline: 'Principal Architect @ AWS', location: 'Seattle', mutual: 18, relevance: 92, reason: '18 mutual connections in your industry', skills: ['Cloud', 'Architecture', 'Distributed Systems'], industry: 'Cloud' },
  { id: '3', name: 'Sophie Larsson', avatar: 'SL', headline: 'Head of Design @ Canva', location: 'Sydney', mutual: 11, relevance: 88, reason: 'Attended same events', skills: ['Design Systems', 'UX Strategy', 'Brand'], industry: 'Design' },
  { id: '4', name: 'Omar Hassan', avatar: 'OH', headline: 'ML Research Lead @ DeepMind', location: 'London', mutual: 7, relevance: 85, reason: 'Similar career trajectory', skills: ['ML', 'Research', 'Python'], industry: 'AI/ML' },
  { id: '5', name: 'Yuki Tanaka', avatar: 'YT', headline: 'Product Director @ LINE', location: 'Tokyo', mutual: 5, relevance: 81, reason: 'Active in your groups', skills: ['Product', 'Mobile', 'Growth'], industry: 'Mobile' },
  { id: '6', name: 'Zara Thompson', avatar: 'ZT', headline: 'Founding Engineer @ Ramp', location: 'NYC', mutual: 14, relevance: 79, reason: 'Works in related domain', skills: ['Fintech', 'Full-Stack', 'React'], industry: 'Fintech' },
  { id: '7', name: 'Daniel Kim', avatar: 'DK', headline: 'Senior SRE @ Netflix', location: 'LA', mutual: 9, relevance: 77, reason: 'Common conference attendance', skills: ['SRE', 'Kubernetes', 'Go'], industry: 'Entertainment' },
  { id: '8', name: 'Maria Garcia', avatar: 'MG', headline: 'Growth PM @ Notion', location: 'SF', mutual: 16, relevance: 74, reason: 'Strong network overlap', skills: ['Growth', 'Product', 'Analytics'], industry: 'Productivity' },
];

const FILTER_CATEGORIES = [
  { label: 'Industry', options: ['Tech', 'Fintech', 'AI/ML', 'Design', 'Cloud', 'Mobile', 'SaaS'] },
  { label: 'Location', options: ['US', 'Europe', 'Asia-Pacific', 'Remote', 'Local area'] },
  { label: 'Seniority', options: ['C-Suite', 'VP', 'Director', 'Senior', 'Mid', 'Junior'] },
  { label: 'Mutual', options: ['20+', '10-19', '5-9', '1-4'] },
  { label: 'Relevance', options: ['90%+', '80-89%', '70-79%', '<70%'] },
  { label: 'Source', options: ['Skills match', 'Mutual connections', 'Events', 'Groups', 'Career path'] },
  { label: 'Open to', options: ['Mentorship', 'Collaboration', 'Hiring', 'Advisory'] },
  { label: 'Company Size', options: ['Startup', 'Scale-up', 'Enterprise', 'FAANG'] },
];

export default function SuggestedConnectionsPage() {
  const [showFilters, setShowFilters] = useState(true);

  return (
    <NetworkShell backLabel="Suggestions" backRoute="/networking">
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <Sparkles className="h-4 w-4 text-accent" />
        <h1 className="text-sm font-bold mr-2">Suggested Connections</h1>
        <KPICard label="Suggestions" value={String(SUGGESTIONS.length)} />
        <KPICard label="Avg Match" value={`${Math.round(SUGGESTIONS.reduce((a, s) => a + s.relevance, 0) / SUGGESTIONS.length)}%`} />
        <Badge variant="secondary" className="text-[9px] h-5 gap-0.5"><Sparkles className="h-2.5 w-2.5" /> AI-Powered</Badge>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className={`h-7 text-[10px] gap-1 rounded-xl ${showFilters ? 'bg-accent/10 border-accent/30' : ''}`}>
          <Filter className="h-3 w-3" /> Filters ({FILTER_CATEGORIES.length}) <ChevronDown className="h-2.5 w-2.5" />
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 p-3 rounded-xl border border-border/40 bg-card/50">
          {FILTER_CATEGORIES.map(fc => (
            <div key={fc.label}>
              <div className="text-[8px] font-semibold text-muted-foreground mb-1">{fc.label}</div>
              <div className="flex flex-wrap gap-1">
                {fc.options.map(o => (
                  <Badge key={o} variant="outline" className="text-[7px] h-3.5 px-1.5 cursor-pointer hover:bg-accent/10 hover:border-accent/30 transition-colors">{o}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SUGGESTIONS.map(s => (
          <div key={s.id} className="p-4 rounded-2xl border border-border/40 hover:border-accent/30 hover:bg-accent/5 transition-all group">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-accent/10">
                <AvatarFallback className="text-sm bg-accent/10 text-accent">{s.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{s.name}</span>
                  <Badge className="text-[7px] h-3.5 bg-accent/10 text-accent border-0 gap-0.5"><Star className="h-2 w-2" />{s.relevance}%</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground">{s.headline}</div>
                <div className="flex items-center gap-3 mt-0.5 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" /> {s.location}</span>
                  <span className="flex items-center gap-0.5"><Building2 className="h-2.5 w-2.5" /> {s.industry}</span>
                  <span><Users className="h-2.5 w-2.5 inline" /> {s.mutual} mutual</span>
                </div>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground mt-2 bg-muted/30 rounded-lg px-2 py-1">
              <Sparkles className="h-2.5 w-2.5 inline mr-0.5 text-accent" /> {s.reason}
            </p>
            <div className="flex items-center gap-1 mt-2">
              {s.skills.map(sk => <Badge key={sk} variant="outline" className="text-[7px] h-3.5 px-1.5">{sk}</Badge>)}
            </div>
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/30">
              <Button size="sm" className="h-7 text-[9px] gap-1 flex-1 rounded-xl"><UserPlus className="h-3 w-3" /> Connect</Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><Eye className="h-3 w-3" /></Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><X className="h-3 w-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </NetworkShell>
  );
}
