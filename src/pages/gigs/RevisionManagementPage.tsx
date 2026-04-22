import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCcw, MessageSquare, Upload, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const REVISIONS = [
  { orderId: 'GIG-2002', buyer: 'Tom H.', gig: 'Logo Design Package', round: 2, status: 'pending' as const, requested: 'Apr 14, 2026', notes: 'Please adjust the color palette to be warmer and increase font weight on the tagline.' },
  { orderId: 'GIG-2010', buyer: 'Anna K.', gig: 'Brand Identity Kit', round: 1, status: 'in-progress' as const, requested: 'Apr 13, 2026', notes: 'Would like a version with a dark background option.' },
  { orderId: 'GIG-2008', buyer: 'Mike P.', gig: 'Logo Design Package', round: 1, status: 'completed' as const, requested: 'Apr 10, 2026', notes: 'Minor spacing adjustment on the icon.' },
];

const statusMap = { pending: 'caution', 'in-progress': 'review', completed: 'healthy' } as const;

export default function RevisionManagementPage() {
  const [tab, setTab] = useState('all');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <RotateCcw className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Revision Management</h1>
          <KPICard label="Pending" value="1" />
          <KPICard label="In Progress" value="1" />
          <KPICard label="Avg Revisions" value="1.4" />
          <KPICard label="Revision Rate" value="28%" />
        </div>
      }
    >
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-8">
          <TabsTrigger value="all" className="text-[10px] px-3">All</TabsTrigger>
          <TabsTrigger value="pending" className="text-[10px] px-3">Pending</TabsTrigger>
          <TabsTrigger value="in-progress" className="text-[10px] px-3">In Progress</TabsTrigger>
          <TabsTrigger value="completed" className="text-[10px] px-3">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <SectionCard>
        {REVISIONS.map((r, i) => (
          <div key={i} className="p-4 rounded-xl border border-border/40 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[8px] h-3.5 font-mono">{r.orderId}</Badge>
              <span className="text-[11px] font-semibold">{r.gig}</span>
              <StatusBadge status={statusMap[r.status]} label={r.status} />
              <Badge variant="secondary" className="text-[8px] h-3.5">Round {r.round}</Badge>
            </div>
            <div className="text-[9px] text-muted-foreground mb-2">
              <span>Buyer: {r.buyer}</span> · <Clock className="h-2.5 w-2.5 inline" /> {r.requested}
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 text-[10px] text-muted-foreground mb-3">
              "{r.notes}"
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><MessageSquare className="h-3 w-3" /> Reply</Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Upload className="h-3 w-3" /> Upload Revision</Button>
              {r.status === 'pending' && <Button size="sm" className="h-7 text-[10px]">Start Working</Button>}
            </div>
          </div>
        ))}
      </SectionCard>
    </DashboardLayout>
  );
}
