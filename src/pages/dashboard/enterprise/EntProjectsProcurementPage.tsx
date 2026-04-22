import React, { useState } from 'react';
import { KPIBand, KPICard, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  FolderKanban, ChevronRight, Clock, Eye, Users, DollarSign,
  AlertTriangle, Target, Calendar, FileText, Package, Building2,
} from 'lucide-react';

type ItemStatus = 'active' | 'at-risk' | 'pending-review' | 'completed' | 'blocked';
type Tab = 'projects' | 'procurement';

interface ProjectItem {
  id: string; title: string; vendor: string; budget: string; progress: number;
  milestones: string; due: string; status: ItemStatus; dept: string;
}

const ITEMS: ProjectItem[] = [
  { id: '1', title: 'Platform Redesign', vendor: 'Studio Alpha', budget: '$85,000', progress: 65, milestones: '4/7', due: 'May 15', status: 'active', dept: 'Product' },
  { id: '2', title: 'Data Migration', vendor: 'DataOps Inc', budget: '$42,000', progress: 30, milestones: '1/5', due: 'Jun 1', status: 'at-risk', dept: 'Engineering' },
  { id: '3', title: 'Brand Refresh', vendor: 'Creative Co', budget: '$28,000', progress: 90, milestones: '6/7', due: 'Apr 20', status: 'active', dept: 'Marketing' },
  { id: '4', title: 'Security Audit', vendor: 'SecureNet', budget: '$15,000', progress: 0, milestones: '0/3', due: 'May 30', status: 'pending-review', dept: 'IT' },
  { id: '5', title: 'CRM Integration', vendor: '—', budget: '$35,000', progress: 0, milestones: '0/4', due: 'Jun 15', status: 'pending-review', dept: 'Sales' },
];

const STATUS_MAP: Record<ItemStatus, { badge: 'live' | 'caution' | 'healthy' | 'pending' | 'blocked'; label: string }> = {
  active: { badge: 'live', label: 'Active' }, 'at-risk': { badge: 'caution', label: 'At Risk' },
  'pending-review': { badge: 'pending', label: 'Pending Review' }, completed: { badge: 'healthy', label: 'Completed' },
  blocked: { badge: 'blocked', label: 'Blocked' },
};

export default function EntProjectsProcurementPage() {
  const [tab, setTab] = useState<Tab>('projects');
  const [selected, setSelected] = useState<ProjectItem | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><FolderKanban className="h-5 w-5 text-accent" /> Projects & Procurement</h1>
        <p className="text-[11px] text-muted-foreground">Monitor projects, procurement activity, milestones, and vendor delivery</p>
      </div>

      <KPIBand>
        <KPICard label="Active Projects" value="3" />
        <KPICard label="Pending Review" value="2" change="Action needed" trend="down" />
        <KPICard label="Total Budget" value="$205K" />
        <KPICard label="At Risk" value="1" change="Overdue milestone" trend="down" />
      </KPIBand>

      <div className="flex items-center gap-1.5 pb-1">
        {(['projects', 'procurement'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all capitalize',
            tab === t ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>{t}</button>
        ))}
      </div>

      <div className="space-y-2">
        {ITEMS.map(item => {
          const sm = STATUS_MAP[item.status];
          return (
            <div key={item.id} onClick={() => setSelected(item)} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all cursor-pointer group">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-semibold group-hover:text-accent transition-colors">{item.title}</span>
                    <StatusBadge status={sm.badge} label={sm.label} />
                  </div>
                  <div className="text-[9px] text-muted-foreground flex items-center gap-3">
                    <span className="flex items-center gap-0.5"><Building2 className="h-2.5 w-2.5" />{item.dept}</span>
                    <span className="flex items-center gap-0.5"><Package className="h-2.5 w-2.5" />{item.vendor}</span>
                    <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{item.budget}</span>
                    <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />Due: {item.due}</span>
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
              </div>
              {item.progress > 0 && (
                <div className="flex items-center gap-2">
                  <Progress value={item.progress} className="h-1.5 flex-1" />
                  <span className="text-[8px] font-medium w-8 text-right">{item.progress}%</span>
                  <Badge variant="outline" className="text-[7px] rounded-lg">{item.milestones} milestones</Badge>
                </div>
              )}
              {item.status === 'at-risk' && (
                <div className="mt-2 rounded-lg bg-[hsl(var(--state-caution)/0.05)] p-2 flex items-center gap-1.5 text-[8px] text-[hsl(var(--state-caution))]">
                  <AlertTriangle className="h-3 w-3" />Milestone overdue — vendor update required
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[420px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Project Detail</SheetTitle></SheetHeader>
          {selected && (
            <div className="p-4 space-y-4">
              <h3 className="text-[12px] font-bold">{selected.title}</h3>
              <div className="grid grid-cols-2 gap-2">
                {[{ l: 'Department', v: selected.dept }, { l: 'Vendor', v: selected.vendor }, { l: 'Budget', v: selected.budget }, { l: 'Due', v: selected.due }].map(d => (
                  <div key={d.l} className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">{d.l}</div><div className="text-[10px] font-semibold">{d.v}</div></div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Eye className="h-3 w-3" />View Project</Button>
                <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><FileText className="h-3 w-3" />Proposals</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
