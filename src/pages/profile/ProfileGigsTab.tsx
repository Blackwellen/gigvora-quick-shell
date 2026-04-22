import React from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Star, Eye, Clock, DollarSign, ArrowRight, Store } from 'lucide-react';

const GIGS = [
  { title: 'Custom Logo Design — 3 Concepts', category: 'Logo Design', price: 'From $75', rating: 4.9, reviews: 64, delivery: '3 days', status: 'active' as const, queue: 4 },
  { title: 'Social Media Kit — 10 Templates', category: 'Social Media', price: 'From $50', rating: 4.8, reviews: 38, delivery: '2 days', status: 'active' as const, queue: 2 },
  { title: 'Business Card Design', category: 'Print Design', price: 'From $25', rating: 5.0, reviews: 22, delivery: '1 day', status: 'active' as const, queue: 1 },
  { title: 'App UI/UX Design', category: 'App Design', price: 'From $200', rating: 4.7, reviews: 12, delivery: '7 days', status: 'paused' as const, queue: 0 },
];

export default function ProfileGigsTab() {
  return (
    <DashboardLayout topStrip={<><ShoppingBag className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Gigs</span><div className="flex-1" /><Button size="sm" className="h-7 text-[10px] rounded-xl">Create Gig</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Active Gigs" value="3" className="!rounded-2xl" />
        <KPICard label="In Queue" value="7" className="!rounded-2xl" />
        <KPICard label="Avg Rating" value="4.85" className="!rounded-2xl" />
        <KPICard label="Total Earned" value="$8.4K" className="!rounded-2xl" />
      </KPIBand>
      <div className="space-y-2.5">
        {GIGS.map((g, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{g.title}</span>
                  <StatusBadge status={g.status === 'active' ? 'healthy' : 'caution'} label={g.status} />
                  <Badge variant="outline" className="text-[7px] rounded-md">{g.category}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{g.price}</span>
                  <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{g.rating} ({g.reviews})</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{g.delivery}</span>
                  <span>{g.queue} in queue</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg"><Eye className="h-2.5 w-2.5 mr-0.5" />View</Button>
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">Edit</Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
      {/* Cross-link to Services */}
      <div className="mt-3 p-3 rounded-2xl border border-border/30 bg-[hsl(var(--gigvora-purple))]/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-[hsl(var(--gigvora-purple))]" />
            <div>
              <div className="text-[10px] font-semibold">Also offer full services?</div>
              <div className="text-[8px] text-muted-foreground">List consultations, retainers, and custom-quoted work alongside your gigs.</div>
            </div>
          </div>
          <Link to="/services/mine"><Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1">My Services <ArrowRight className="h-3 w-3" /></Button></Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
