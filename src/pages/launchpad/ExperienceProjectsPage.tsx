import React from 'react';
import { LaunchpadShell } from '@/components/launchpad/LaunchpadShell';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Clock, Users, Star, Award, Play } from 'lucide-react';

const PROJECTS = [
  { title: 'Build a Portfolio Website', type: 'Simulated', difficulty: 'Beginner', duration: '2 weeks', skills: ['HTML/CSS', 'JavaScript', 'Design'], participants: 340, rating: 4.8, badge: 'Web Builder' },
  { title: 'Market Research Report', type: 'Real Client', difficulty: 'Intermediate', duration: '3 weeks', skills: ['Research', 'Analysis', 'Presentation'], participants: 180, rating: 4.6, badge: 'Market Analyst' },
  { title: 'Data Dashboard Project', type: 'Simulated', difficulty: 'Intermediate', duration: '4 weeks', skills: ['Python', 'SQL', 'Visualization'], participants: 220, rating: 4.7, badge: 'Data Explorer' },
  { title: 'Social Media Campaign', type: 'Real Client', difficulty: 'Beginner', duration: '2 weeks', skills: ['Content', 'Strategy', 'Analytics'], participants: 410, rating: 4.5, badge: 'Campaign Creator' },
];

export default function ExperienceProjectsPage() {
  return (
    <LaunchpadShell>
      <div className="mb-4">
        <h1 className="text-lg font-bold">Experience Projects</h1>
        <p className="text-[11px] text-muted-foreground">Simulated and real-client projects to build your portfolio</p>
      </div>
      <KPIBand className="mb-3">
        <KPICard label="Available Projects" value={String(PROJECTS.length)} className="!rounded-2xl" />
        <KPICard label="In Progress" value="1" className="!rounded-2xl" />
        <KPICard label="Completed" value="3" className="!rounded-2xl" />
        <KPICard label="Badges Earned" value="3" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {PROJECTS.map((p, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12px] font-bold">{p.title}</span>
                  <Badge className={`text-[7px] border-0 rounded-lg ${p.type === 'Real Client' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : 'bg-accent/10 text-accent'}`}>{p.type}</Badge>
                  <Badge variant="outline" className="text-[7px] rounded-md">{p.difficulty}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground mb-1.5">
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{p.duration}</span>
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{p.participants} participants</span>
                  <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{p.rating}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-wrap gap-1">{p.skills.map(s => <Badge key={s} variant="outline" className="text-[7px] h-3.5 rounded-md">{s}</Badge>)}</div>
                  <div className="flex items-center gap-0.5 text-[8px]"><Award className="h-3 w-3 text-accent" /><span className="font-medium">{p.badge}</span></div>
                </div>
              </div>
              <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Play className="h-3 w-3" />Start</Button>
            </div>
          </SectionCard>
        ))}
      </div>
    </LaunchpadShell>
  );
}
