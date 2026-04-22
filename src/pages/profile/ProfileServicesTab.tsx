import React from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench, Star, Eye, Clock, DollarSign, MapPin, ArrowRight, Layers } from 'lucide-react';

const SERVICES = [
  { title: 'Brand Identity Design', category: 'Design', price: 'From $500', rating: 4.9, reviews: 28, delivery: '5-7 days', status: 'active' as const, orders: 42 },
  { title: 'UX Audit & Recommendations', category: 'UX Research', price: 'From $300', rating: 4.8, reviews: 16, delivery: '3-5 days', status: 'active' as const, orders: 24 },
  { title: 'Website Redesign', category: 'Web Development', price: 'From $1,200', rating: 5.0, reviews: 8, delivery: '14-21 days', status: 'active' as const, orders: 12 },
  { title: 'Product Strategy Workshop', category: 'Consulting', price: '$200/hr', rating: 4.7, reviews: 6, delivery: '2-3 hours', status: 'paused' as const, orders: 8 },
];

export default function ProfileServicesTab() {
  return (
    <DashboardLayout topStrip={<><Wrench className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Services</span><div className="flex-1" /><Button size="sm" className="h-7 text-[10px] rounded-xl">Add Service</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Active Services" value="3" className="!rounded-2xl" />
        <KPICard label="Total Orders" value="86" className="!rounded-2xl" />
        <KPICard label="Avg Rating" value="4.85" className="!rounded-2xl" />
        <KPICard label="Revenue" value="$24.8K" className="!rounded-2xl" />
      </KPIBand>
      <div className="space-y-2.5">
        {SERVICES.map((s, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{s.title}</span>
                  <StatusBadge status={s.status === 'active' ? 'healthy' : 'caution'} label={s.status} />
                  <Badge variant="outline" className="text-[7px] rounded-md">{s.category}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{s.price}</span>
                  <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{s.rating} ({s.reviews})</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{s.delivery}</span>
                  <span>{s.orders} orders</span>
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
      {/* Cross-link to Gigs */}
      <div className="mt-3 p-3 rounded-2xl border border-border/30 bg-accent/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-accent" />
            <div>
              <div className="text-[10px] font-semibold">Also offer productized gigs?</div>
              <div className="text-[8px] text-muted-foreground">Create quick-order packages with fixed pricing and fast delivery to complement your services.</div>
            </div>
          </div>
          <Link to="/gigs/mine"><Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1">My Gigs <ArrowRight className="h-3 w-3" /></Button></Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
