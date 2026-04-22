import React, { useState } from 'react';
import { NetworkShell } from '@/components/shell/NetworkShell';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Globe, Sparkles, Users, Briefcase, MapPin, MessageSquare,
  Code, Palette, BarChart3, Lightbulb, Handshake, Star,
  ChevronRight, Eye, UserPlus, Zap,
} from 'lucide-react';

type CollabType = 'project' | 'mentorship' | 'co-create' | 'partnership' | 'learning';

interface CollabSuggestion {
  id: string; name: string; avatar: string; headline: string; location: string;
  type: CollabType; matchScore: number; reason: string;
  skills: string[]; sharedInterests: string[];
  mutual: number; openTo: string[];
}

const TYPE_CONFIG: Record<CollabType, { label: string; icon: React.FC<{className?:string}>; color: string }> = {
  project: { label: 'Project', icon: Code, color: 'bg-accent/10 text-accent' },
  mentorship: { label: 'Mentorship', icon: Lightbulb, color: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' },
  'co-create': { label: 'Co-Create', icon: Palette, color: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]' },
  partnership: { label: 'Partnership', icon: Handshake, color: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' },
  learning: { label: 'Learning', icon: BarChart3, color: 'bg-[hsl(var(--state-review))]/10 text-[hsl(var(--state-review))]' },
};

const SUGGESTIONS: CollabSuggestion[] = [
  { id: '1', name: 'Maya Chen', avatar: 'MC', headline: 'Product Lead @ Stripe', location: 'San Francisco', type: 'project', matchScore: 96, reason: 'Both interested in open-source fintech tools. Complementary skills in product + engineering.', skills: ['Product Strategy', 'Growth', 'Payments'], sharedInterests: ['Open Source', 'Fintech'], mutual: 12, openTo: ['Projects', 'Advisory'] },
  { id: '2', name: 'James Rivera', avatar: 'JR', headline: 'Staff Engineer @ Vercel', location: 'New York', type: 'co-create', matchScore: 91, reason: 'Shared passion for developer tools. Could collaborate on educational content.', skills: ['Next.js', 'Edge Computing', 'DevOps'], sharedInterests: ['Dev Tools', 'Education'], mutual: 8, openTo: ['Co-creation', 'Talks'] },
  { id: '3', name: 'Aisha Patel', avatar: 'AP', headline: 'Design Director @ Figma', location: 'London', type: 'mentorship', matchScore: 88, reason: 'Strong design leadership experience. Open to mentoring engineers on design thinking.', skills: ['Design Systems', 'UX Strategy', 'Team Building'], sharedInterests: ['Design Systems'], mutual: 15, openTo: ['Mentorship', 'Workshops'] },
  { id: '4', name: 'Leo Tanaka', avatar: 'LT', headline: 'VP Eng @ Datadog', location: 'Remote', type: 'partnership', matchScore: 84, reason: 'Complementary expertise in observability + infrastructure. Partnership potential.', skills: ['Observability', 'SRE', 'Scale'], sharedInterests: ['Infrastructure', 'SRE'], mutual: 6, openTo: ['Partnerships', 'Consulting'] },
  { id: '5', name: 'Sophie Larsson', avatar: 'SL', headline: 'Head of Design @ Canva', location: 'Sydney', type: 'learning', matchScore: 79, reason: 'Runs monthly design critique sessions. Great learning opportunity.', skills: ['Brand Design', 'Creative Direction', 'Workshops'], sharedInterests: ['Creative Tools'], mutual: 11, openTo: ['Learning Groups', 'Critiques'] },
];

export default function CollaborationSuggestionsPage() {
  const [tab, setTab] = useState<'all' | CollabType>('all');
  const filtered = SUGGESTIONS.filter(s => tab === 'all' || s.type === tab);

  return (
    <NetworkShell backLabel="Collaboration" backRoute="/networking">
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <Globe className="h-4 w-4 text-accent" />
        <h1 className="text-sm font-bold mr-2">Collaboration Suggestions</h1>
        <KPICard label="Matches" value={String(SUGGESTIONS.length)} />
        <KPICard label="Avg Score" value={`${Math.round(SUGGESTIONS.reduce((a, s) => a + s.matchScore, 0) / SUGGESTIONS.length)}%`} />
        <Badge variant="secondary" className="text-[9px] h-5 gap-0.5"><Sparkles className="h-2.5 w-2.5" /> AI-Powered</Badge>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Tabs value={tab} onValueChange={v => setTab(v as any)}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
            {(Object.keys(TYPE_CONFIG) as CollabType[]).map(t => (
              <TabsTrigger key={t} value={t} className="text-[10px] h-5 px-2">{TYPE_CONFIG[t].label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-3">
        {filtered.map(s => {
          const tc = TYPE_CONFIG[s.type];
          const Icon = tc.icon;
          return (
            <div key={s.id} className="p-4 rounded-2xl border border-border/40 hover:border-accent/30 hover:bg-accent/5 transition-all">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-accent/10">
                  <AvatarFallback className="text-sm bg-accent/10 text-accent">{s.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold">{s.name}</span>
                    <Badge className={`text-[7px] h-3.5 border-0 ${tc.color}`}><Icon className="h-2 w-2 mr-0.5" />{tc.label}</Badge>
                    <div className="ml-auto flex items-center gap-1">
                      <Star className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" />
                      <span className="text-sm font-bold text-accent">{s.matchScore}%</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{s.headline}</div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{s.location}</span>
                    <span><Users className="h-2.5 w-2.5 inline" /> {s.mutual} mutual</span>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl px-3 py-2 mt-3 mb-2">
                <p className="text-[9px] text-muted-foreground"><Sparkles className="h-2.5 w-2.5 inline mr-1 text-accent" />{s.reason}</p>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1">
                  <div className="text-[8px] text-muted-foreground mb-0.5">Skills</div>
                  <div className="flex flex-wrap gap-1">{s.skills.map(sk => <Badge key={sk} variant="outline" className="text-[7px] h-3.5 px-1.5">{sk}</Badge>)}</div>
                </div>
                <div>
                  <div className="text-[8px] text-muted-foreground mb-0.5">Open to</div>
                  <div className="flex flex-wrap gap-1">{s.openTo.map(o => <Badge key={o} className="text-[7px] h-3.5 px-1.5 bg-accent/10 text-accent border-0">{o}</Badge>)}</div>
                </div>
              </div>

              <div className="flex gap-1.5 pt-2 border-t border-border/30">
                <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5 flex-1"><MessageSquare className="h-3 w-3" /> Reach Out</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><UserPlus className="h-3 w-3" /> Connect</Button>
                <Button variant="ghost" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Eye className="h-3 w-3" /> Profile</Button>
              </div>
            </div>
          );
        })}
      </div>
    </NetworkShell>
  );
}
