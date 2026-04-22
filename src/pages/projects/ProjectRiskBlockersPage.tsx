import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, ShieldAlert, Plus, Clock, User, MessageSquare } from 'lucide-react';

const ITEMS = [
  { id: 'R-01', title: 'Third-party API rate limits may delay integration', type: 'risk' as const, severity: 'high', owner: 'Mike L.', created: 'Apr 10', status: 'active' as const, mitigation: 'Implement caching layer and request queuing' },
  { id: 'B-01', title: 'Client approval pending for homepage design', type: 'blocker' as const, severity: 'blocked', owner: 'Lisa P.', created: 'Apr 12', status: 'active' as const, mitigation: 'Escalate to PM, set 48h deadline' },
  { id: 'R-02', title: 'Team capacity risk for Sprint 4', type: 'risk' as const, severity: 'medium', owner: 'Sarah K.', created: 'Apr 8', status: 'mitigated' as const, mitigation: 'Brought on additional contractor' },
  { id: 'B-02', title: 'Database migration blocked by schema review', type: 'blocker' as const, severity: 'high', owner: 'Mike L.', created: 'Apr 11', status: 'resolved' as const, mitigation: 'Schema approved, migration scheduled' },
];

const sevColors = { critical: 'destructive', high: 'secondary', medium: 'outline' } as const;
const statusMap = { active: 'blocked', mitigated: 'caution', resolved: 'healthy' } as const;

export default function ProjectRiskBlockersPage() {
  const [tab, setTab] = useState('all');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--destructive))]" />
          <h1 className="text-sm font-bold mr-4">Risks & Blockers</h1>
          <KPICard label="Active Risks" value="1" />
          <KPICard label="Active Blockers" value="1" change="!" trend="down" />
          <KPICard label="Mitigated" value="1" />
          <KPICard label="Resolved" value="1" />
          <div className="flex-1" />
          <Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" /> Log Risk</Button>
        </div>
      }
    >
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-8">
          <TabsTrigger value="all" className="text-[10px] px-3">All</TabsTrigger>
          <TabsTrigger value="risk" className="text-[10px] px-3">Risks</TabsTrigger>
          <TabsTrigger value="blocker" className="text-[10px] px-3">Blockers</TabsTrigger>
          <TabsTrigger value="active" className="text-[10px] px-3">Active</TabsTrigger>
        </TabsList>
      </Tabs>

      <SectionCard>
        {(tab === 'all' ? ITEMS : ITEMS.filter(it => tab === 'active' ? it.status === 'active' : it.type === tab)).map(it => (
          <div key={it.id} className="p-4 rounded-xl border border-border/40 mb-3">
            <div className="flex items-center gap-2 mb-2">
              {it.type === 'blocker' ? <ShieldAlert className="h-3.5 w-3.5 text-[hsl(var(--destructive))]" /> : <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />}
              <Badge variant="outline" className="text-[8px] h-3.5 font-mono">{it.id}</Badge>
              <span className="text-[11px] font-semibold">{it.title}</span>
              <StatusBadge status={statusMap[it.status]} label={it.status} />
              <Badge variant={sevColors[it.severity as keyof typeof sevColors]} className="text-[8px] h-3.5 capitalize">{it.severity}</Badge>
            </div>
            <div className="flex items-center gap-3 text-[9px] text-muted-foreground mb-2">
              <span><User className="h-2.5 w-2.5 inline" /> {it.owner}</span>
              <span><Clock className="h-2.5 w-2.5 inline" /> {it.created}</span>
              <Badge variant="outline" className="text-[7px] h-3 capitalize">{it.type}</Badge>
            </div>
            <div className="p-2 rounded-lg bg-muted/20 text-[9px] text-muted-foreground">
              <span className="font-medium">Mitigation:</span> {it.mitigation}
            </div>
          </div>
        ))}
      </SectionCard>
    </DashboardLayout>
  );
}
