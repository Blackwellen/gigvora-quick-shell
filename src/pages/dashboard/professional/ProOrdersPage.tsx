import React, { useState } from 'react';
import { KPIBand, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  ShoppingBag, Clock, ChevronRight, Eye, MessageSquare,
  CheckCircle2, AlertTriangle, Package, DollarSign, Send,
  RefreshCw, User,
} from 'lucide-react';

type OrderStatus = 'active' | 'awaiting' | 'delivered' | 'completed' | 'disputed' | 'revision';
type OrderTab = 'all' | OrderStatus;

interface Order {
  id: string; title: string; client: string; amount: string; status: OrderStatus;
  due: string; orderId: string; payout: 'pending' | 'released' | 'held';
}

const ORDERS: Order[] = [
  { id: '1', title: 'Logo Design — TechPulse', client: 'TechPulse Inc', amount: '$200', status: 'awaiting', due: 'Today', orderId: 'GV-5201', payout: 'pending' },
  { id: '2', title: 'Brand Identity Kit — GreenTech', client: 'GreenTech', amount: '$600', status: 'revision', due: 'Apr 16', orderId: 'GV-5198', payout: 'pending' },
  { id: '3', title: 'E-commerce Redesign — Acme', client: 'Acme Corp', amount: '$2,500', status: 'active', due: 'Apr 22', orderId: 'GV-5190', payout: 'pending' },
  { id: '4', title: 'Social Media Pack — Pulse', client: 'Pulse Media', amount: '$150', status: 'active', due: 'Apr 20', orderId: 'GV-5185', payout: 'pending' },
  { id: '5', title: 'API Integration — DataFlow', client: 'DataFlow Inc', amount: '$1,500', status: 'delivered', due: 'Apr 10', orderId: 'GV-5170', payout: 'pending' },
  { id: '6', title: 'Landing Page — StartupXYZ', client: 'StartupXYZ', amount: '$900', status: 'completed', due: 'Apr 5', orderId: 'GV-5155', payout: 'released' },
  { id: '7', title: 'Mobile Prototype — FinApp', client: 'FinApp', amount: '$1,800', status: 'completed', due: 'Mar 28', orderId: 'GV-5140', payout: 'released' },
  { id: '8', title: 'Data Pipeline Setup', client: 'DataOps Inc', amount: '$1,200', status: 'disputed', due: 'Mar 20', orderId: 'GV-5120', payout: 'held' },
];

const STATUS_MAP: Record<OrderStatus, { badge: 'live' | 'caution' | 'healthy' | 'blocked' | 'review' | 'pending'; label: string }> = {
  active: { badge: 'live', label: 'Active' },
  awaiting: { badge: 'caution', label: 'Awaiting Response' },
  delivered: { badge: 'review', label: 'Delivered' },
  completed: { badge: 'healthy', label: 'Completed' },
  disputed: { badge: 'blocked', label: 'Disputed' },
  revision: { badge: 'caution', label: 'Revision Requested' },
};

export default function ProOrdersPage() {
  const [tab, setTab] = useState<OrderTab>('all');
  const [selected, setSelected] = useState<Order | null>(null);

  const filtered = tab === 'all' ? ORDERS : ORDERS.filter(o => o.status === tab);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-accent" /> Orders</h1>
        <p className="text-[11px] text-muted-foreground">Manage client orders, deliveries, and revisions</p>
      </div>

      <KPIBand>
        <KPICard label="Active" value="2" />
        <KPICard label="Awaiting Action" value="2" change="Urgent" trend="down" />
        <KPICard label="Completed (MTD)" value="2" change="$2,700" />
        <KPICard label="Avg Order Value" value="$1,118" change="+15%" trend="up" />
      </KPIBand>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['all', 'awaiting', 'revision', 'active', 'delivered', 'completed', 'disputed'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all capitalize',
            tab === t ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>{t === 'awaiting' ? 'Awaiting' : t === 'revision' ? 'Revisions' : t}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(order => {
          const sm = STATUS_MAP[order.status];
          return (
            <div key={order.id} onClick={() => setSelected(order)} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer group">
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                <Package className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold truncate group-hover:text-accent transition-colors">{order.title}</span>
                  <StatusBadge status={sm.badge} label={sm.label} />
                </div>
                <div className="text-[9px] text-muted-foreground flex items-center gap-3">
                  <span className="flex items-center gap-0.5"><User className="h-2.5 w-2.5" />{order.client}</span>
                  <span>#{order.orderId}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />Due: {order.due}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] font-bold">{order.amount}</div>
                <Badge variant="outline" className={cn('text-[7px] rounded-lg', order.payout === 'held' && 'border-[hsl(var(--state-blocked)/0.3)] text-[hsl(var(--state-blocked))]')}>{order.payout}</Badge>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
            </div>
          );
        })}
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[420px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Order Detail</SheetTitle></SheetHeader>
          {selected && (
            <div className="p-4 space-y-4">
              <h3 className="text-[12px] font-bold">{selected.title}</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Client</div><div className="text-[10px] font-semibold">{selected.client}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Amount</div><div className="text-[10px] font-semibold">{selected.amount}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Due</div><div className="text-[10px] font-semibold">{selected.due}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Payout</div><div className="text-[10px] font-semibold capitalize">{selected.payout}</div></div>
              </div>
              {selected.status === 'disputed' && (
                <div className="rounded-xl border border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.05)] p-3 flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-blocked))] shrink-0 mt-0.5" />
                  <div className="text-[9px] text-muted-foreground">This order is under dispute. Payout is held pending resolution.</div>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {selected.status === 'awaiting' && <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Send className="h-3 w-3" />Respond</Button>}
                {selected.status === 'revision' && <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1"><RefreshCw className="h-3 w-3" />Submit Revision</Button>}
                <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Eye className="h-3 w-3" />View Full Order</Button>
                <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><MessageSquare className="h-3 w-3" />Message Client</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
