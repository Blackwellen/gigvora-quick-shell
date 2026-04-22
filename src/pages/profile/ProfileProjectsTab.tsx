import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderKanban, Star, Eye, Clock, Users, DollarSign } from 'lucide-react';

const PROJECTS = [
  { title: 'Acme Corp — Brand Overhaul', client: 'Acme Corp', role: 'Lead Designer', status: 'active' as const, budget: '$12,000', progress: 65, team: 3, deadline: 'May 15, 2026' },
  { title: 'TechFlow — Mobile App Design', client: 'TechFlow Inc.', role: 'UX Designer', status: 'active' as const, budget: '$8,500', progress: 40, team: 4, deadline: 'Jun 1, 2026' },
  { title: 'StartupXYZ — Landing Page', client: 'StartupXYZ', role: 'Full-Stack', status: 'completed' as const, budget: '$3,200', progress: 100, team: 1, deadline: 'Mar 20, 2026' },
  { title: 'GreenLeaf — E-commerce Platform', client: 'GreenLeaf Co.', role: 'Frontend Dev', status: 'completed' as const, budget: '$15,000', progress: 100, team: 5, deadline: 'Feb 28, 2026' },
];

export default function ProfileProjectsTab() {
  return (
    <DashboardLayout topStrip={<><FolderKanban className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Projects</span><div className="flex-1" /><Button size="sm" className="h-7 text-[10px] rounded-xl">New Project</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Active" value="2" className="!rounded-2xl" />
        <KPICard label="Completed" value="2" className="!rounded-2xl" />
        <KPICard label="Total Value" value="$38.7K" className="!rounded-2xl" />
        <KPICard label="On-Time Rate" value="95%" className="!rounded-2xl" />
      </KPIBand>
      <div className="space-y-2.5">
        {PROJECTS.map((p, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{p.title}</span>
                  <StatusBadge status={p.status === 'active' ? 'healthy' : 'review'} label={p.status} />
                  <Badge variant="outline" className="text-[7px] rounded-md">{p.role}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span>Client: {p.client}</span>
                  <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{p.budget}</span>
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{p.team} team</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{p.deadline}</span>
                  <span>{p.progress}% complete</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg"><Eye className="h-2.5 w-2.5 mr-0.5" />View</Button>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
