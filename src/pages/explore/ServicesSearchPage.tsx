import React from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wrench, Search, Star, DollarSign, Clock, MapPin, Eye, SlidersHorizontal, Heart, ShoppingBag } from 'lucide-react';

const SERVICES = [
  { title: 'Brand Identity Design', provider: 'Sarah Chen Design', price: 'From $500', rating: 4.9, reviews: 28, delivery: '5-7 days', location: 'Remote', category: 'Design' },
  { title: 'Full-Stack Web Development', provider: 'DevCraft Studio', price: 'From $2,000', rating: 4.8, reviews: 42, delivery: '2-4 weeks', location: 'Remote', category: 'Development' },
  { title: 'Content Strategy & Writing', provider: 'ContentPro Agency', price: 'From $800', rating: 5.0, reviews: 18, delivery: '1-2 weeks', location: 'New York', category: 'Marketing' },
  { title: 'Business Consulting', provider: 'Strategy Partners', price: '$200/hr', rating: 4.7, reviews: 14, delivery: 'Ongoing', location: 'London', category: 'Consulting' },
];

export default function ServicesSearchPage() {
  return (
    <DashboardLayout topStrip={<><Wrench className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Services Search</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><SlidersHorizontal className="h-3 w-3" />Filters</Button></>}>
      <div className="flex gap-2 mb-3"><div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search services..." className="pl-8 h-8 text-xs rounded-xl" /></div></div>
      <div className="flex flex-wrap gap-1 mb-3">{['Category', 'Price', 'Location', 'Rating', 'Delivery'].map(f => <Button key={f} variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">{f}</Button>)}</div>
      <KPIBand className="mb-3">
        <KPICard label="Results" value="1,860" className="!rounded-2xl" />
        <KPICard label="Top Rated" value="420" className="!rounded-2xl" />
        <KPICard label="Remote" value="1,240" className="!rounded-2xl" />
        <KPICard label="Available Now" value="680" className="!rounded-2xl" />
      </KPIBand>
      <div className="space-y-2.5">
        {SERVICES.map((s, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5"><span className="text-[11px] font-bold">{s.title}</span><Badge variant="outline" className="text-[7px] rounded-md">{s.category}</Badge></div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span>{s.provider}</span><span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{s.price}</span><span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{s.rating} ({s.reviews})</span><span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{s.delivery}</span><span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{s.location}</span>
                </div>
              </div>
              <div className="flex gap-1"><Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl"><Heart className="h-3 w-3" /></Button><Button size="sm" className="h-7 text-[9px] rounded-xl"><Eye className="h-3 w-3 mr-0.5" />View</Button></div>
            </div>
          </SectionCard>
        ))}
      </div>

      {/* Cross-link: Related Gigs */}
      <SectionCard className="!rounded-2xl mt-4" title="Quick Gigs for Faster Turnaround" action={<Link to="/gigs" className="text-[8px] text-accent hover:underline">Browse Gigs →</Link>}>
        <p className="text-[8px] text-muted-foreground mb-2">Need something smaller and faster? Explore productized gig packages with fixed pricing and quick delivery.</p>
        <div className="flex gap-2">
          {[
            { title: 'Custom Logo Design — 3 Concepts', seller: 'Sarah C.', price: 'From $75', delivery: '3 days' },
            { title: 'SEO Audit & Strategy Report', seller: 'Priya S.', price: 'From $120', delivery: '5 days' },
          ].map(g => (
            <Link key={g.title} to="/gigs" className="flex-1">
              <div className="p-2.5 rounded-xl border border-border/30 hover:border-accent/30 transition-all">
                <div className="flex items-center gap-1 mb-0.5"><Badge className="text-[6px] bg-accent/10 text-accent border-0">Gig</Badge><span className="text-[9px] font-semibold truncate">{g.title}</span></div>
                <div className="text-[8px] text-muted-foreground">{g.seller} · {g.price} · <Clock className="h-2 w-2 inline" /> {g.delivery}</div>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
