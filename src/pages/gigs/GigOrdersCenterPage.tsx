import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Clock, MessageSquare, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';

const ORDERS = [
  { id: 'GIG-2001', buyer: 'Emma W.', gig: 'Logo Design Package', pkg: 'Standard', amount: '$100', status: 'active' as const, due: 'Apr 18, 2026', revision: 0 },
  { id: 'GIG-2002', buyer: 'Tom H.', gig: 'Logo Design Package', pkg: 'Premium', amount: '$200', status: 'revision' as const, due: 'Apr 20, 2026', revision: 2 },
  { id: 'GIG-2003', buyer: 'Sara L.', gig: 'Brand Identity Kit', pkg: 'Basic', amount: '$300', status: 'delivered' as const, due: 'Apr 14, 2026', revision: 0 },
  { id: 'GIG-2004', buyer: 'Mike P.', gig: 'Logo Design Package', pkg: 'Basic', amount: '$50', status: 'completed' as const, due: 'Apr 10, 2026', revision: 1 },
  { id: 'GIG-2005', buyer: 'Ana R.', gig: 'Brand Identity Kit', pkg: 'Premium', amount: '$600', status: 'late' as const, due: 'Apr 12, 2026', revision: 0 },
];

const statusMap = { active: 'caution', revision: 'review', delivered: 'pending', completed: 'healthy', late: 'blocked' } as const;

export default function GigOrdersCenterPage() {
  const [tab, setTab] = useState('all');
  const filtered = tab === 'all' ? ORDERS : ORDERS.filter(o => o.status === tab);

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <ShoppingCart className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Gig Orders</h1>
          <KPICard label="Active" value="2" />
          <KPICard label="In Revision" value="1" />
          <KPICard label="Late" value="1" change="!" trend="down" />
          <KPICard label="Completed" value="1" />
        </div>
      }
    >
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-8">
          <TabsTrigger value="all" className="text-[10px] px-3">All ({ORDERS.length})</TabsTrigger>
          <TabsTrigger value="active" className="text-[10px] px-3">Active</TabsTrigger>
          <TabsTrigger value="revision" className="text-[10px] px-3">Revision</TabsTrigger>
          <TabsTrigger value="delivered" className="text-[10px] px-3">Delivered</TabsTrigger>
          <TabsTrigger value="late" className="text-[10px] px-3">Late</TabsTrigger>
          <TabsTrigger value="completed" className="text-[10px] px-3">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <SectionCard>
        {filtered.map(o => (
          <div key={o.id} className="flex items-center gap-4 p-3 rounded-xl border border-border/40 hover:border-accent/30 transition-all cursor-pointer mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge variant="outline" className="text-[8px] h-3.5 font-mono">{o.id}</Badge>
                <span className="text-[11px] font-semibold">{o.gig}</span>
                <StatusBadge status={statusMap[o.status]} label={o.status} />
              </div>
              <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                <span>Buyer: {o.buyer}</span>
                <span>Pkg: {o.pkg}</span>
                <span><Clock className="h-2.5 w-2.5 inline" /> {o.due}</span>
                {o.revision > 0 && <span className="text-accent">Rev #{o.revision}</span>}
              </div>
            </div>
            <div className="text-[11px] font-bold shrink-0">{o.amount}</div>
            <div className="flex gap-1 shrink-0">
              <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><Package className="h-2.5 w-2.5" /> Deliver</Button>
              <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1"><MessageSquare className="h-2.5 w-2.5" /></Button>
            </div>
          </div>
        ))}
      </SectionCard>
    </DashboardLayout>
  );
}
