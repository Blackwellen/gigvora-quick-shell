import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShoppingBag, Eye, MessageSquare, Clock, CheckCircle, AlertTriangle, XCircle, ChevronRight, Filter } from 'lucide-react';

const ORDERS = [
  { id: 'SVC-4521', service: 'Brand Identity Design', client: 'Sarah Kim', package: 'Professional', amount: '$1,200', status: 'in-progress' as const, deadline: 'Apr 22', progress: 65 },
  { id: 'SVC-4518', service: 'SEO Audit & Strategy', client: 'James Wilson', package: 'Starter', amount: '$800', status: 'review' as const, deadline: 'Apr 18', progress: 100 },
  { id: 'SVC-4515', service: 'Brand Identity Design', client: 'Priya Patel', package: 'Enterprise', amount: '$3,000', status: 'completed' as const, deadline: 'Apr 10', progress: 100 },
  { id: 'SVC-4510', service: 'Video Production', client: 'Tom Wright', package: 'Professional', amount: '$2,400', status: 'revision' as const, deadline: 'Apr 20', progress: 80 },
  { id: 'SVC-4505', service: 'Web Development', client: 'Maria Santos', package: 'Starter', amount: '$2,000', status: 'cancelled' as const, deadline: '-', progress: 0 },
];

const STATUS_CONFIG = {
  'in-progress': { label: 'In Progress', class: 'bg-accent/10 text-accent' },
  'review': { label: 'Under Review', class: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]' },
  'completed': { label: 'Completed', class: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' },
  'revision': { label: 'Revision', class: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]' },
  'cancelled': { label: 'Cancelled', class: 'bg-[hsl(var(--state-critical)/0.1)] text-[hsl(var(--state-critical))]' },
};

export default function ServiceOrdersCenterPage() {
  const [filter, setFilter] = useState('all');

  return (
    <DashboardLayout topStrip={<><ShoppingBag className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Service Orders Center</span><div className="flex-1" /><div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">{['all', 'active', 'review', 'completed'].map(f => (<button key={f} onClick={() => setFilter(f)} className={cn('px-2 py-1 rounded-lg text-[8px] font-medium capitalize transition-colors', filter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground')}>{f}</button>))}</div></>}>
      <KPIBand className="mb-3">
        <KPICard label="Active Orders" value="2" className="!rounded-2xl" />
        <KPICard label="Pending Review" value="1" className="!rounded-2xl" />
        <KPICard label="Completed" value="1" className="!rounded-2xl" />
        <KPICard label="Total Revenue" value="$9,400" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {ORDERS.map(o => (
          <SectionCard key={o.id} className="!rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[8px] text-muted-foreground font-mono">{o.id}</span>
                  <span className="text-[11px] font-bold">{o.service}</span>
                  <Badge className={cn('text-[7px] border-0 rounded-lg', STATUS_CONFIG[o.status].class)}>{STATUS_CONFIG[o.status].label}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span>Client: <span className="font-medium text-foreground">{o.client}</span></span>
                  <span>{o.package}</span>
                  <span className="font-semibold text-foreground">{o.amount}</span>
                  {o.deadline !== '-' && <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />Due {o.deadline}</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><MessageSquare className="h-3 w-3" />Chat</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Eye className="h-3 w-3" />Details</Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
