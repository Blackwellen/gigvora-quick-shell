import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Plus, Search, FileText, Clock, CheckCircle2, AlertTriangle,
  Archive, Users, DollarSign, Eye, ChevronRight, Layers,
  Star, Calendar, Briefcase, BarChart3, Pen, Shield,
} from 'lucide-react';
import { toast } from 'sonner';

type ProjectStatus = 'active' | 'draft' | 'invited' | 'completed' | 'disputed' | 'archived';

interface MyProject {
  id: string; title: string; status: ProjectStatus;
  budget: string; proposals: number; milestones: { done: number; total: number };
  client: string; deadline: string; lastActivity: string;
  role: 'owner' | 'collaborator' | 'invited';
}

const PROJECTS: MyProject[] = [
  { id: 'P-001', title: 'E-commerce Platform Rebuild', status: 'active', budget: '$15,000', proposals: 12, milestones: { done: 3, total: 8 }, client: 'TechFlow Inc.', deadline: 'Jun 30, 2026', lastActivity: '2h ago', role: 'owner' },
  { id: 'P-002', title: 'Mobile App UI Redesign', status: 'active', budget: '$8,500', proposals: 7, milestones: { done: 1, total: 5 }, client: 'DesignCraft', deadline: 'May 15, 2026', lastActivity: '1d ago', role: 'collaborator' },
  { id: 'P-003', title: 'Brand Identity Package', status: 'draft', budget: '$3,200', proposals: 0, milestones: { done: 0, total: 4 }, client: '—', deadline: '—', lastActivity: '3d ago', role: 'owner' },
  { id: 'P-004', title: 'Data Pipeline Architecture', status: 'invited', budget: '$22,000', proposals: 5, milestones: { done: 0, total: 6 }, client: 'DataSphere', deadline: 'Jul 20, 2026', lastActivity: '5h ago', role: 'invited' },
  { id: 'P-005', title: 'Marketing Automation Setup', status: 'completed', budget: '$6,800', proposals: 9, milestones: { done: 6, total: 6 }, client: 'GrowthLab', deadline: 'Mar 10, 2026', lastActivity: '2w ago', role: 'owner' },
  { id: 'P-006', title: 'API Integration Suite', status: 'disputed', budget: '$11,000', proposals: 4, milestones: { done: 4, total: 7 }, client: 'ConnectPro', deadline: 'Apr 30, 2026', lastActivity: '6h ago', role: 'owner' },
  { id: 'P-007', title: 'Content Management System', status: 'archived', budget: '$9,500', proposals: 11, milestones: { done: 5, total: 5 }, client: 'MediaHub', deadline: 'Jan 15, 2026', lastActivity: '1m ago', role: 'collaborator' },
];

const STATUS_STYLES: Record<ProjectStatus, { bg: string; text: string; icon: React.ElementType }> = {
  active: { bg: 'bg-[hsl(var(--state-healthy))]/10', text: 'text-[hsl(var(--state-healthy))]', icon: CheckCircle2 },
  draft: { bg: 'bg-muted', text: 'text-muted-foreground', icon: Pen },
  invited: { bg: 'bg-primary/10', text: 'text-primary', icon: Users },
  completed: { bg: 'bg-accent/10', text: 'text-accent', icon: Star },
  disputed: { bg: 'bg-destructive/10', text: 'text-destructive', icon: AlertTriangle },
  archived: { bg: 'bg-muted', text: 'text-muted-foreground', icon: Archive },
};

const MyProjectsPage: React.FC = () => {
  const [tab, setTab] = useState<'all' | ProjectStatus>('all');
  const [search, setSearch] = useState('');

  const filtered = PROJECTS.filter(p => {
    if (tab !== 'all' && p.status !== tab) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: PROJECTS.length,
    active: PROJECTS.filter(p => p.status === 'active').length,
    draft: PROJECTS.filter(p => p.status === 'draft').length,
    invited: PROJECTS.filter(p => p.status === 'invited').length,
    completed: PROJECTS.filter(p => p.status === 'completed').length,
    disputed: PROJECTS.filter(p => p.status === 'disputed').length,
    archived: PROJECTS.filter(p => p.status === 'archived').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold">My Projects</h1>
            <p className="text-xs text-muted-foreground">Manage all your project workspaces, proposals, and invitations</p>
          </div>
          <Link to="/projects/create">
            <Button size="sm" className="gap-1 rounded-xl"><Plus className="h-3.5 w-3.5" />Post Project</Button>
          </Link>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
          {[
            { label: 'Active', value: counts.active, icon: Layers, color: 'text-[hsl(var(--state-healthy))]' },
            { label: 'Drafts', value: counts.draft, icon: Pen, color: 'text-muted-foreground' },
            { label: 'Invitations', value: counts.invited, icon: Users, color: 'text-primary' },
            { label: 'Completed', value: counts.completed, icon: CheckCircle2, color: 'text-accent' },
            { label: 'Disputed', value: counts.disputed, icon: AlertTriangle, color: 'text-destructive' },
          ].map(k => (
            <div key={k.label} className="rounded-xl border bg-card p-3 flex items-center gap-2">
              <k.icon className={cn("h-4 w-4", k.color)} />
              <div><div className="text-lg font-bold">{k.value}</div><div className="text-[8px] text-muted-foreground">{k.label}</div></div>
            </div>
          ))}
        </div>

        {/* Search + tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." className="pl-8 h-8 text-xs rounded-xl" />
          </div>
        </div>

        <Tabs value={tab} onValueChange={v => setTab(v as any)}>
          <TabsList className="mb-4 flex-wrap h-auto gap-0.5">
            {(['all', 'active', 'draft', 'invited', 'completed', 'disputed', 'archived'] as const).map(t => (
              <TabsTrigger key={t} value={t} className="text-[9px] h-7 px-2 gap-1 capitalize">
                {t} <Badge variant="secondary" className="text-[6px] ml-0.5 px-1">{counts[t]}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={tab} className="space-y-2">
            {filtered.length === 0 ? (
              <div className="rounded-xl border bg-card p-8 text-center text-xs text-muted-foreground">
                No projects found.{' '}
                <Link to="/projects/create" className="text-accent underline">Create one</Link>
              </div>
            ) : (
              filtered.map(p => {
                const s = STATUS_STYLES[p.status];
                return (
                  <Link key={p.id} to={`/projects/${p.id}/workspace`}>
                    <div className="rounded-xl border bg-card p-3.5 hover:border-ring/50 hover:shadow-sm transition-all cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <Badge variant="secondary" className="text-[6px] font-mono">{p.id}</Badge>
                            <Badge className={cn("text-[6px] border-0 gap-0.5", s.bg, s.text)}>
                              <s.icon className="h-2 w-2" />{p.status}
                            </Badge>
                            {p.role !== 'owner' && <Badge variant="secondary" className="text-[6px] capitalize">{p.role}</Badge>}
                          </div>
                          <div className="text-sm font-semibold mb-0.5">{p.title}</div>
                          <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                            <span className="flex items-center gap-0.5"><Briefcase className="h-2.5 w-2.5" />{p.client}</span>
                            <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{p.budget}</span>
                            <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{p.deadline}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <div className="text-[8px] text-muted-foreground mb-1">Milestones</div>
                          <div className="text-xs font-semibold">{p.milestones.done}/{p.milestones.total}</div>
                          <div className="w-16 h-1 rounded-full bg-muted mt-1 overflow-hidden">
                            <div className="h-full bg-accent rounded-full" style={{ width: `${p.milestones.total > 0 ? (p.milestones.done / p.milestones.total) * 100 : 0}%` }} />
                          </div>
                          <div className="text-[7px] text-muted-foreground mt-1">{p.lastActivity}</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyProjectsPage;
