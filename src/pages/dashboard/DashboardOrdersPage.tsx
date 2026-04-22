import React, { useState } from 'react';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  ShoppingBag, Clock, ChevronRight, Eye, Download,
  AlertTriangle, CheckCircle2, Package, Truck, RefreshCw,
  CreditCard, FileText, MessageSquare,
} from 'lucide-react';

type OrderStatus = 'active' | 'delivered' | 'completed' | 'disputed' | 'refunded' | 'cancelled';
type OrderTab = 'all' | OrderStatus;

interface Order {
  id: string; title: string; seller: string; amount: string; status: OrderStatus;
  date: string; orderId: string; type: string;
}

const ORDERS: Order[] = [
  { id: '1', title: 'Brand Strategy Workshop', seller: 'StudioLab', amount: '$450', status: 'active', date: 'Apr 12', orderId: 'GV-4521', type: 'Service' },
  { id: '2', title: 'Logo & Visual Identity Package', seller: 'DesignCraft', amount: '$180', status: 'active', date: 'Apr 10', orderId: 'GV-4518', type: 'Service' },
  { id: '3', title: 'React Performance Audit', seller: 'CodePro', amount: '$320', status: 'delivered', date: 'Apr 5', orderId: 'GV-4502', type: 'Service' },
  { id: '4', title: 'SEO Content Pack (10 articles)', seller: 'ContentFlow', amount: '$890', status: 'completed', date: 'Mar 28', orderId: 'GV-4489', type: 'Service' },
  { id: '5', title: 'Advanced React Patterns — Webinar', seller: 'TechEd', amount: '$49', status: 'completed', date: 'Mar 20', orderId: 'GV-4475', type: 'Media' },
  { id: '6', title: 'Data Pipeline Setup', seller: 'DataOps Inc', amount: '$1,200', status: 'disputed', date: 'Mar 15', orderId: 'GV-4460', type: 'Service' },
  { id: '7', title: 'UX Research Report', seller: 'InsightLab', amount: '$560', status: 'refunded', date: 'Mar 8', orderId: 'GV-4442', type: 'Service' },
];

const STATUS_MAP: Record<OrderStatus, { badge: 'healthy' | 'caution' | 'blocked' | 'review' | 'pending' | 'live'; label: string }> = {
  active: { badge: 'live', label: 'Active' },
  delivered: { badge: 'review', label: 'Delivered' },
  completed: { badge: 'healthy', label: 'Completed' },
  disputed: { badge: 'blocked', label: 'Disputed' },
  refunded: { badge: 'caution', label: 'Refunded' },
  cancelled: { badge: 'pending', label: 'Cancelled' },
};

const DashboardOrdersPage: React.FC = () => {
  const [tab, setTab] = useState<OrderTab>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = tab === 'all' ? ORDERS : ORDERS.filter(o => o.status === tab);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-accent" /> Orders & Purchases</h1>
        <p className="text-[11px] text-muted-foreground">Track and manage all your purchases, services, and media orders</p>
      </div>

      <KPIBand>
        <KPICard label="Active Orders" value="2" />
        <KPICard label="Delivered" value="1" change="Awaiting review" trend="up" />
        <KPICard label="Total Spent" value="$3,649" change="This quarter" />
        <KPICard label="Disputed" value="1" change="Action needed" trend="down" />
      </KPIBand>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['all', 'active', 'delivered', 'completed', 'disputed', 'refunded', 'cancelled'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all capitalize',
            tab === t ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>{t}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(order => {
          const sm = STATUS_MAP[order.status];
          return (
            <div key={order.id} onClick={() => setSelectedOrder(order)} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer group">
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                <Package className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold truncate group-hover:text-accent transition-colors">{order.title}</span>
                  <StatusBadge status={sm.badge} label={sm.label} />
                </div>
                <div className="text-[9px] text-muted-foreground">{order.seller} · #{order.orderId} · {order.date}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] font-bold">{order.amount}</div>
                <Badge variant="outline" className="text-[7px] rounded-lg">{order.type}</Badge>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed p-12 text-center">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <div className="text-xs font-semibold text-muted-foreground">No orders found</div>
          </div>
        )}
      </div>

      {/* Order detail drawer */}
      <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <SheetContent className="w-[420px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Order Detail</SheetTitle></SheetHeader>
          {selectedOrder && (
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-[12px] font-bold">{selectedOrder.title}</h3>
                <div className="text-[10px] text-muted-foreground mt-0.5">{selectedOrder.seller}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Order ID</div><div className="text-[10px] font-semibold">#{selectedOrder.orderId}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Amount</div><div className="text-[10px] font-semibold">{selectedOrder.amount}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Date</div><div className="text-[10px] font-semibold">{selectedOrder.date}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Status</div><StatusBadge status={STATUS_MAP[selectedOrder.status].badge} label={STATUS_MAP[selectedOrder.status].label} /></div>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="h-8 text-[9px] flex-1 rounded-xl gap-1"><Eye className="h-3 w-3" />View Details</Button>
                <Button variant="outline" size="sm" className="h-8 text-[9px] flex-1 rounded-xl gap-1"><MessageSquare className="h-3 w-3" />Message Seller</Button>
              </div>
              {selectedOrder.status === 'delivered' && (
                <Button size="sm" className="w-full h-8 text-[9px] rounded-xl gap-1"><CheckCircle2 className="h-3 w-3" />Accept & Complete</Button>
              )}
              {selectedOrder.status === 'disputed' && (
                <div className="rounded-xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3 flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))] shrink-0 mt-0.5" />
                  <div className="text-[9px] text-muted-foreground">This order is under dispute. Our support team is reviewing the case.</div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DashboardOrdersPage;
