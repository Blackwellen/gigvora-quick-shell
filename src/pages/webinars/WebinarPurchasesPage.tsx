import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShoppingBag, Download, Eye, Clock, CreditCard, Filter, CheckCircle } from 'lucide-react';

type PurchaseStatus = 'active' | 'expired' | 'refunded';

const PURCHASES = [
  { id: '1', title: 'React Mastery Series', type: 'Series Pass', price: '$149', purchasedAt: 'May 10, 2026', expiresAt: 'Jun 10, 2026', status: 'active' as const, accessType: 'full' },
  { id: '2', title: 'Scaling React at Enterprise', type: 'Single Replay', price: '$29', purchasedAt: 'May 8, 2026', expiresAt: 'Jun 8, 2026', status: 'active' as const, accessType: 'replay' },
  { id: '3', title: 'Design Systems Workshop', type: 'Workshop + Materials', price: '$79', purchasedAt: 'Apr 15, 2026', expiresAt: 'May 15, 2026', status: 'expired' as const, accessType: 'full' },
  { id: '4', title: 'Cloud Architecture Deep Dive', type: 'Single Replay', price: '$29', purchasedAt: 'Mar 20, 2026', expiresAt: 'N/A', status: 'refunded' as const, accessType: 'replay' },
];

const STATUS_STYLES: Record<PurchaseStatus, string> = {
  active: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  expired: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  refunded: 'bg-muted text-muted-foreground',
};

export default function WebinarPurchasesPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | PurchaseStatus>('all');
  const filtered = PURCHASES.filter(p => statusFilter === 'all' || p.status === statusFilter);

  const topStrip = (
    <>
      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">My Webinar Purchases</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['all', 'active', 'expired', 'refunded'] as const).map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} className={cn('px-2 py-1 rounded-lg text-[8px] font-medium transition-colors capitalize', statusFilter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{f}</button>
        ))}
      </div>
    </>
  );

  return (
    <DashboardLayout topStrip={topStrip}>
      <KPIBand className="mb-3">
        <KPICard label="Total Spent" value="$286" className="!rounded-2xl" />
        <KPICard label="Active Access" value={String(PURCHASES.filter(p => p.status === 'active').length)} className="!rounded-2xl" />
        <KPICard label="Purchases" value={String(PURCHASES.length)} className="!rounded-2xl" />
        <KPICard label="Saved" value="$60" change="vs individual" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {filtered.map(p => (
          <div key={p.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12px] font-bold">{p.title}</span>
                  <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', STATUS_STYLES[p.status])}>{p.status}</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground">{p.type} · {p.price}</div>
                <div className="flex items-center gap-3 mt-1.5 text-[8px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><CreditCard className="h-2.5 w-2.5" />Purchased {p.purchasedAt}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />Expires {p.expiresAt}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {p.status === 'active' && (
                  <>
                    <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Eye className="h-2.5 w-2.5" />Watch</Button>
                    <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Download className="h-2.5 w-2.5" />Materials</Button>
                  </>
                )}
                {p.status === 'expired' && <Button size="sm" className="h-6 text-[8px] rounded-lg">Renew</Button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
