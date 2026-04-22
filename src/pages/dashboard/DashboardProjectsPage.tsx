import React, { useState } from 'react';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  FolderKanban, Clock, ChevronRight, Eye, MessageSquare,
  CheckCircle2, AlertTriangle, Calendar, DollarSign, Users,
  FileText, Milestone,
} from 'lucide-react';

type ProjectStatus = 'active' | 'draft' | 'completed' | 'archived' | 'disputed';

interface Project {
  id: string; title: string; status: ProjectStatus; budget: string; progress: number;
  proposals: number; milestones: string; dueDate: string; freelancer?: string;
}

const PROJECTS: Project[] = [
  { id: '1', title: 'Dashboard Redesign', status: 'active', budget: '$8,000', progress: 65, proposals: 12, milestones: '3/5', dueDate: 'Apr 28', freelancer: 'Elena Rodriguez' },
  { id: '2', title: 'Mobile App MVP', status: 'active', budget: '$15,000', progress: 30, proposals: 8, milestones: '1/4', dueDate: 'May 15', freelancer: 'Marcus Johnson' },
  { id: '3', title: 'SEO Optimization Campaign', status: 'draft', budget: '$3,500', progress: 0, proposals: 0, milestones: '0/3', dueDate: 'TBD' },
  { id: '4', title: 'Brand Identity Refresh', status: 'completed', budget: '$5,200', progress: 100, proposals: 15, milestones: '4/4', dueDate: 'Mar 10', freelancer: 'StudioLab' },
  { id: '5', title: 'API Integration Project', status: 'archived', budget: '$2,800', progress: 100, proposals: 6, milestones: '3/3', dueDate: 'Feb 20', freelancer: 'CodePro' },
  { id: '6', title: 'Data Pipeline Migration', status: 'disputed', budget: '$12,000', progress: 45, proposals: 4, milestones: '2/6', dueDate: 'Apr 30', freelancer: 'DataOps Inc' },
];

const STATUS_MAP: Record<ProjectStatus, { badge: 'healthy' | 'caution' | 'blocked' | 'review' | 'pending' | 'live'; label: string }> = {
  active: { badge: 'live', label: 'Active' },
  draft: { badge: 'pending', label: 'Draft' },
  completed: { badge: 'healthy', label: 'Completed' },
  archived: { badge: 'pending', label: 'Archived' },
  disputed: { badge: 'blocked', label: 'Disputed' },
};

const DashboardProjectsPage: React.FC = () => {
  const [tab, setTab] = useState<'all' | ProjectStatus>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filtered = tab === 'all' ? PROJECTS : PROJECTS.filter(p => p.status === tab);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><FolderKanban className="h-5 w-5 text-accent" /> Projects</h1>
        <p className="text-[11px] text-muted-foreground">Monitor and manage projects you've posted or participated in</p>
      </div>

      <KPIBand>
        <KPICard label="Active" value="2" />
        <KPICard label="Drafts" value="1" />
        <KPICard label="Completed" value="1" />
        <KPICard label="Total Budget" value="$46,500" />
      </KPIBand>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['all', 'active', 'draft', 'completed', 'archived', 'disputed'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all capitalize',
            tab === t ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>{t}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(project => {
          const sm = STATUS_MAP[project.status];
          return (
            <div key={project.id} onClick={() => setSelectedProject(project)} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all cursor-pointer group">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-semibold truncate group-hover:text-accent transition-colors">{project.title}</span>
                    <StatusBadge status={sm.badge} label={sm.label} />
                  </div>
                  <div className="text-[9px] text-muted-foreground flex items-center gap-3">
                    <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{project.budget}</span>
                    <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />Due: {project.dueDate}</span>
                    {project.freelancer && <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{project.freelancer}</span>}
                    <span className="flex items-center gap-0.5"><FileText className="h-2.5 w-2.5" />{project.proposals} proposals</span>
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
              </div>
              {project.status !== 'draft' && (
                <div className="flex items-center gap-2">
                  <Progress value={project.progress} className="h-1.5 flex-1" />
                  <span className="text-[8px] font-medium w-8 text-right">{project.progress}%</span>
                  <Badge variant="outline" className="text-[7px] rounded-lg">{project.milestones} milestones</Badge>
                </div>
              )}
              {project.status === 'disputed' && (
                <div className="mt-2 rounded-lg bg-[hsl(var(--state-blocked)/0.05)] p-2 flex items-center gap-1.5 text-[8px] text-[hsl(var(--state-blocked))]">
                  <AlertTriangle className="h-3 w-3" />Under dispute — support team reviewing
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Sheet open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <SheetContent className="w-[420px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Project Detail</SheetTitle></SheetHeader>
          {selectedProject && (
            <div className="p-4 space-y-4">
              <h3 className="text-[12px] font-bold">{selectedProject.title}</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Budget</div><div className="text-[10px] font-semibold">{selectedProject.budget}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Due</div><div className="text-[10px] font-semibold">{selectedProject.dueDate}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Milestones</div><div className="text-[10px] font-semibold">{selectedProject.milestones}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Progress</div><div className="text-[10px] font-semibold">{selectedProject.progress}%</div></div>
              </div>
              {selectedProject.freelancer && (
                <div className="rounded-xl border p-3 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center"><Users className="h-4 w-4 text-accent" /></div>
                  <div><div className="text-[10px] font-semibold">{selectedProject.freelancer}</div><div className="text-[8px] text-muted-foreground">Assigned Professional</div></div>
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="h-8 text-[9px] flex-1 rounded-xl gap-1"><Eye className="h-3 w-3" />Full View</Button>
                <Button variant="outline" size="sm" className="h-8 text-[9px] flex-1 rounded-xl gap-1"><MessageSquare className="h-3 w-3" />Messages</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DashboardProjectsPage;
