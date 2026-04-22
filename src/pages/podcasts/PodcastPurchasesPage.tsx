import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShoppingBag, Download, Eye, Clock, CreditCard } from 'lucide-react';

const PURCHASES = [
  { title: 'AI Deep Dives Premium', type: 'Series Pass', price: '$24.99', date: 'May 10, 2026', expires: 'Jun 10, 2026', status: 'active' as const },
  { title: 'Freelance Masterclass Audio', type: 'Audiobook', price: '$14.99', date: 'Apr 22, 2026', expires: 'N/A', status: 'active' as const },
  { title: 'Design Leadership Series', type: 'Series Pass', price: '$19.99', date: 'Mar 5, 2026', expires: 'Apr 5, 2026', status: 'expired' as const },
];

const STATUS_STYLES = { active: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]', expired: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]' };

export default function PodcastPurchasesPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const filtered = PURCHASES.filter(p => filter === 'all' || p.status === filter);

  return (
    <DashboardLayout topStrip={<><ShoppingBag className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Podcast Purchases</span><div className="flex-1" /><div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">{(['all', 'active', 'expired'] as const).map(f => (<button key={f} onClick={() => setFilter(f)} className={cn('px-2 py-1 rounded-lg text-[8px] font-medium capitalize transition-colors', filter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground')}>{f}</button>))}</div></>}>
      <KPIBand className="mb-3">
        <KPICard label="Total Spent" value="$59.97" className="!rounded-2xl" />
        <KPICard label="Active" value={String(PURCHASES.filter(p => p.status === 'active').length)} className="!rounded-2xl" />
        <KPICard label="Purchases" value={String(PURCHASES.length)} className="!rounded-2xl" />
      </KPIBand>
      <div className="space-y-2.5">
        {filtered.map((p, i) => (
          <div key={i} className="rounded-2xl border bg-card p-3.5 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5"><span className="text-[11px] font-bold">{p.title}</span><Badge className={cn('text-[7px] border-0 capitalize rounded-lg', STATUS_STYLES[p.status])}>{p.status}</Badge></div>
                <div className="text-[9px] text-muted-foreground">{p.type} · {p.price}</div>
                <div className="flex items-center gap-3 mt-1 text-[8px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><CreditCard className="h-2.5 w-2.5" />{p.date}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />Expires {p.expires}</span>
                </div>
              </div>
              {p.status === 'active' && <div className="flex gap-1"><Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Eye className="h-2.5 w-2.5" />Listen</Button><Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Download className="h-2.5 w-2.5" />Download</Button></div>}
              {p.status === 'expired' && <Button size="sm" className="h-6 text-[8px] rounded-lg">Renew</Button>}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
