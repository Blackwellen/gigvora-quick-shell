import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Clock, CheckCircle2, AlertCircle, DollarSign, MessageSquare } from 'lucide-react';

const ORDERS = [
  { id: 'SVC-1001', client: 'James R.', service: 'MVP Build', package: 'Standard', amount: '$5,000', status: 'in-progress' as const, started: 'Apr 8, 2026', due: 'Apr 28, 2026', progress: 45 },
  { id: 'SVC-1002', client: 'Lisa P.', service: 'Consultation', package: 'Hourly', amount: '$450', status: 'completed' as const, started: 'Apr 5, 2026', due: 'Apr 5, 2026', progress: 100 },
  { id: 'SVC-1003', client: 'David C.', service: 'Enterprise Setup', package: 'Custom', amount: '$12,000', status: 'review' as const, started: 'Mar 20, 2026', due: 'Apr 15, 2026', progress: 90 },
  { id: 'SVC-1004', client: 'Ana R.', service: 'MVP Build', package: 'Standard', amount: '$5,000', status: 'pending' as const, started: '-', due: 'TBD', progress: 0 },
];

export default function ServiceOrdersPage() {
  const [tab, setTab] = useState('all');
  const filtered = tab === 'all' ? ORDERS : ORDERS.filter(o => o.status === tab);

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <ShoppingCart className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Service Orders</h1>
          <KPICard label="Active" value="2" />
          <KPICard label="Pending" value="1" />
          <KPICard label="Revenue (MTD)" value="$17,450" change="+24%" trend="up" />
          <KPICard label="Completed" value="8" />
        </div>
      }
    >
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-8">
          <TabsTrigger value="all" className="text-[10px] px-3">All</TabsTrigger>
          <TabsTrigger value="pending" className="text-[10px] px-3">Pending</TabsTrigger>
          <TabsTrigger value="in-progress" className="text-[10px] px-3">In Progress</TabsTrigger>
          <TabsTrigger value="review" className="text-[10px] px-3">In Review</TabsTrigger>
          <TabsTrigger value="completed" className="text-[10px] px-3">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <SectionCard>
        <div className="space-y-2">
          {filtered.map(o => (
            <div key={o.id} className="flex items-center gap-4 p-3 rounded-xl border border-border/40 hover:border-accent/30 transition-all cursor-pointer">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge variant="outline" className="text-[8px] h-3.5 font-mono">{o.id}</Badge>
                  <span className="text-[11px] font-semibold">{o.service}</span>
                  <StatusBadge status={o.status === 'in-progress' ? 'caution' : o.status === 'completed' ? 'healthy' : o.status === 'review' ? 'review' : 'pending'} label={o.status} />
                </div>
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                  <span>Client: {o.client}</span>
                  <span>Package: {o.package}</span>
                  <span><Clock className="h-2.5 w-2.5 inline" /> Due: {o.due}</span>
                </div>
              </div>
              <div className="w-20">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${o.progress}%` }} /></div>
                <div className="text-[8px] text-muted-foreground text-center mt-0.5">{o.progress}%</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] font-bold">{o.amount}</div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-[9px] gap-1"><MessageSquare className="h-2.5 w-2.5" /> Chat</Button>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
