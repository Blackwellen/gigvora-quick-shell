import React, { useState } from 'react';
import { KPIBand, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  Layers, Eye, ShoppingCart, Star, DollarSign, ChevronRight,
  Pause, Play, Copy, Archive, Settings, TrendingUp, Plus,
  ExternalLink, BarChart3,
} from 'lucide-react';

type ListingTab = 'all' | 'live' | 'draft' | 'paused' | 'archived';
type ListingType = 'gig' | 'service';

interface Listing {
  id: string; title: string; type: ListingType; status: 'live' | 'draft' | 'paused' | 'archived';
  orders: number; revenue: string; rating: number; views: string; price: string;
}

const LISTINGS: Listing[] = [
  { id: '1', title: 'Logo Design Package', type: 'gig', status: 'live', orders: 24, revenue: '$4,800', rating: 4.9, views: '1.2K', price: '$200' },
  { id: '2', title: 'Brand Identity Kit', type: 'service', status: 'live', orders: 12, revenue: '$7,200', rating: 4.8, views: '890', price: '$600' },
  { id: '3', title: 'UI/UX Audit', type: 'service', status: 'paused', orders: 8, revenue: '$2,400', rating: 4.7, views: '340', price: '$300' },
  { id: '4', title: 'Social Media Graphics Pack', type: 'gig', status: 'live', orders: 18, revenue: '$2,700', rating: 4.6, views: '560', price: '$150' },
  { id: '5', title: 'Website Redesign Consultation', type: 'service', status: 'draft', orders: 0, revenue: '$0', rating: 0, views: '0', price: '$450' },
  { id: '6', title: 'Motion Graphics Intro', type: 'gig', status: 'archived', orders: 5, revenue: '$750', rating: 4.5, views: '120', price: '$150' },
];

const STATUS_MAP: Record<string, { badge: 'live' | 'pending' | 'caution' | 'healthy'; label: string }> = {
  live: { badge: 'live', label: 'Live' },
  draft: { badge: 'pending', label: 'Draft' },
  paused: { badge: 'caution', label: 'Paused' },
  archived: { badge: 'pending', label: 'Archived' },
};

export default function ProGigsServicesPage() {
  const [tab, setTab] = useState<ListingTab>('all');
  const [selected, setSelected] = useState<Listing | null>(null);

  const filtered = tab === 'all' ? LISTINGS : LISTINGS.filter(l => l.status === tab);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2"><Layers className="h-5 w-5 text-accent" /> Gigs & Services</h1>
          <p className="text-[11px] text-muted-foreground">Manage your commercial listings and monitor performance</p>
        </div>
        <Button size="sm" className="h-8 text-[10px] rounded-xl gap-1"><Plus className="h-3.5 w-3.5" />New Listing</Button>
      </div>

      <KPIBand>
        <KPICard label="Live Listings" value="3" change="+1 this week" trend="up" />
        <KPICard label="Total Orders" value="62" change="+8 MTD" trend="up" />
        <KPICard label="Total Revenue" value="$17,850" change="+22%" trend="up" />
        <KPICard label="Avg Rating" value="4.7" />
      </KPIBand>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['all', 'live', 'draft', 'paused', 'archived'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all capitalize',
            tab === t ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>{t}{t !== 'all' && ` (${LISTINGS.filter(l => l.status === t).length})`}</button>
        ))}
      </div>

      {/* Top Performer */}
      {tab === 'all' && (
        <div className="rounded-2xl border bg-gradient-to-r from-accent/5 to-[hsl(var(--gigvora-purple)/0.05)] p-4 flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-accent shrink-0" />
          <div className="flex-1">
            <div className="text-[10px] font-bold">Top Performer: Logo Design Package</div>
            <div className="text-[9px] text-muted-foreground">24 orders · $4,800 revenue · 4.9★ · 1.2K views this month</div>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-1"><BarChart3 className="h-3 w-3" />Analytics</Button>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(listing => {
          const sm = STATUS_MAP[listing.status];
          return (
            <div key={listing.id} onClick={() => setSelected(listing)} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer group">
              <div className="h-11 w-11 rounded-xl bg-muted/50 flex items-center justify-center text-lg shrink-0">🎨</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold truncate group-hover:text-accent transition-colors">{listing.title}</span>
                  <StatusBadge status={sm.badge} label={sm.label} />
                  <Badge variant="outline" className="text-[7px] rounded-lg capitalize">{listing.type}</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground flex items-center gap-3">
                  <span className="flex items-center gap-0.5"><ShoppingCart className="h-2.5 w-2.5" />{listing.orders} orders</span>
                  <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{listing.revenue}</span>
                  {listing.rating > 0 && <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5" />{listing.rating}</span>}
                  <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{listing.views} views</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] font-bold">{listing.price}</div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
            </div>
          );
        })}
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[420px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Listing Detail</SheetTitle></SheetHeader>
          {selected && (
            <div className="p-4 space-y-4">
              <h3 className="text-[12px] font-bold">{selected.title}</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Price</div><div className="text-[10px] font-semibold">{selected.price}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Revenue</div><div className="text-[10px] font-semibold">{selected.revenue}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Orders</div><div className="text-[10px] font-semibold">{selected.orders}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Rating</div><div className="text-[10px] font-semibold">{selected.rating || 'N/A'}</div></div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-1"><Eye className="h-3 w-3" />View</Button>
                <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-1"><Settings className="h-3 w-3" />Edit</Button>
                {selected.status === 'live' && <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-1"><Pause className="h-3 w-3" />Pause</Button>}
                {selected.status === 'paused' && <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-1"><Play className="h-3 w-3" />Resume</Button>}
                <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-1"><Copy className="h-3 w-3" />Duplicate</Button>
                <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-1"><Archive className="h-3 w-3" />Archive</Button>
                <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-1"><ExternalLink className="h-3 w-3" />Full Builder</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
