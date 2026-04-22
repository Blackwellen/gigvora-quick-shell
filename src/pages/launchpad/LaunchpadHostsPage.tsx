import React from 'react';
import { LaunchpadShell } from '@/components/launchpad/LaunchpadShell';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Building2, Users, Star, MapPin, Briefcase, ChevronRight,
  GraduationCap, Award, Globe, Calendar,
} from 'lucide-react';

const HOSTS = [
  { name: 'TechCorp', avatar: 'TC', industry: 'Technology', location: 'San Francisco, CA', pathways: 3, opportunities: 12, mentors: 8, rating: 4.9, completions: 240, programs: ['Graduate', 'Career Changer'] },
  { name: 'DesignFlow', avatar: 'DF', industry: 'Design', location: 'New York, NY', pathways: 2, opportunities: 8, mentors: 5, rating: 4.8, completions: 180, programs: ['Portfolio Challenge', 'Apprenticeship'] },
  { name: 'GrowthLab', avatar: 'GL', industry: 'Marketing', location: 'Remote', pathways: 2, opportunities: 6, mentors: 4, rating: 4.7, completions: 120, programs: ['Trainee', 'School Leaver'] },
  { name: 'DataSphere', avatar: 'DS', industry: 'Data Science', location: 'Remote', pathways: 1, opportunities: 4, mentors: 3, rating: 4.6, completions: 90, programs: ['Bootcamp', 'Career Changer'] },
  { name: 'CloudScale', avatar: 'CS', industry: 'Cloud/DevOps', location: 'Austin, TX', pathways: 2, opportunities: 5, mentors: 6, rating: 4.8, completions: 150, programs: ['Returnship', 'Apprenticeship'] },
];

export default function LaunchpadHostsPage() {
  return (
    <LaunchpadShell>
      <div className="mb-4">
        <h1 className="text-lg font-bold">Launchpad Hosts</h1>
        <p className="text-[11px] text-muted-foreground">Companies and organizations offering launchpad experiences</p>
      </div>

      <KPIBand className="mb-4">
        <KPICard label="Active Hosts" value={String(HOSTS.length)} className="!rounded-2xl" />
        <KPICard label="Total Pathways" value={String(HOSTS.reduce((s, h) => s + h.pathways, 0))} className="!rounded-2xl" />
        <KPICard label="Total Opportunities" value={String(HOSTS.reduce((s, h) => s + h.opportunities, 0))} className="!rounded-2xl" />
        <KPICard label="Total Mentors" value={String(HOSTS.reduce((s, h) => s + h.mentors, 0))} className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-3">
        {HOSTS.map(h => (
          <div key={h.name} className="rounded-2xl border bg-card p-5 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 rounded-2xl shrink-0"><AvatarFallback className="rounded-2xl bg-gradient-to-br from-accent/20 to-[hsl(var(--gigvora-purple))]/10 text-accent text-sm font-bold">{h.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[14px] font-bold group-hover:text-accent transition-colors">{h.name}</span>
                  <Badge variant="outline" className="text-[7px] rounded-lg">{h.industry}</Badge>
                  <span className="flex items-center gap-0.5 text-[8px] text-muted-foreground"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{h.rating}</span>
                </div>
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground mb-2">
                  <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{h.location}</span>
                  <span className="flex items-center gap-0.5"><Briefcase className="h-2.5 w-2.5" />{h.opportunities} opportunities</span>
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{h.mentors} mentors</span>
                  <span className="flex items-center gap-0.5"><Award className="h-2.5 w-2.5" />{h.completions} completions</span>
                </div>
                <div className="flex gap-1 flex-wrap">{h.programs.map(p => <Badge key={p} className="text-[7px] bg-accent/5 text-accent border-accent/20 rounded-lg">{p}</Badge>)}</div>
              </div>
              <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1 shrink-0">View Host <ChevronRight className="h-3 w-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </LaunchpadShell>
  );
}
