import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building2, Users, Award, Eye, Star, ChevronRight, Filter, Download, Briefcase } from 'lucide-react';

const CANDIDATES = [
  { name: 'Emma Davis', pathway: 'Frontend Dev', readiness: 92, badges: 5, projects: 4, rating: 4.9, available: true },
  { name: 'Alex Kim', pathway: 'Data Science', readiness: 85, badges: 3, projects: 3, rating: 4.7, available: true },
  { name: 'Maria Santos', pathway: 'UX Design', readiness: 88, badges: 4, projects: 5, rating: 4.8, available: false },
  { name: 'Tom Wright', pathway: 'Marketing', readiness: 78, badges: 2, projects: 2, rating: 4.5, available: true },
];

export default function EmployerPartnerPage() {
  return (
    <DashboardLayout topStrip={<><Building2 className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Employer & Partner View</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Filter className="h-3 w-3" />Filters</Button><Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Download className="h-3 w-3" />Export Talent</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Verified Candidates" value="86" className="!rounded-2xl" />
        <KPICard label="Avg Readiness" value="84%" className="!rounded-2xl" />
        <KPICard label="Available Now" value="52" className="!rounded-2xl" />
        <KPICard label="Hired via Launchpad" value="24" change="This quarter" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {CANDIDATES.map((c, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 rounded-xl shrink-0"><AvatarFallback className="rounded-xl bg-accent/10 text-accent text-[10px] font-bold">{c.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{c.name}</span>
                  <Badge className="text-[7px] bg-accent/10 text-accent border-0 rounded-lg">{c.readiness}% ready</Badge>
                  {c.available ? <Badge className="text-[7px] bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0 rounded-lg">Available</Badge> : <Badge className="text-[7px] bg-muted text-muted-foreground border-0 rounded-lg">Unavailable</Badge>}
                </div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Briefcase className="h-2.5 w-2.5" />{c.pathway}</span>
                  <span className="flex items-center gap-0.5"><Award className="h-2.5 w-2.5" />{c.badges} badges</span>
                  <span>{c.projects} projects</span>
                  <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{c.rating}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Eye className="h-3 w-3" />Profile</Button>
                <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><ChevronRight className="h-3 w-3" />Contact</Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
