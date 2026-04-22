import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { AdvancedFilterPanel, EXPLORE_GIGS_FILTERS, FilterValues } from '@/components/shell/AdvancedFilterPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingBag, Search, Star, DollarSign, Clock, Eye, Heart } from 'lucide-react';

const GIGS = [
  { title: 'Custom Logo Design — 3 Concepts + Revisions', seller: 'Sarah C.', price: 'From $75', rating: 4.9, reviews: 248, delivery: '3 days', category: 'Logo Design', level: 'Top Rated' },
  { title: 'Professional Video Editing', seller: 'Marcus J.', price: 'From $50', rating: 4.8, reviews: 142, delivery: '2 days', category: 'Video Editing', level: 'Level 2' },
  { title: 'SEO Audit & Strategy Report', seller: 'Priya S.', price: 'From $120', rating: 5.0, reviews: 86, delivery: '5 days', category: 'SEO', level: 'Top Rated' },
  { title: 'Social Media Content Pack', seller: 'Lena M.', price: 'From $40', rating: 4.7, reviews: 64, delivery: '1 day', category: 'Social Media', level: 'Level 1' },
  { title: 'WordPress Website Development', seller: 'Tom W.', price: 'From $200', rating: 4.9, reviews: 180, delivery: '7 days', category: 'Web Dev', level: 'Top Rated' },
];

export default function GigsSearchPage() {
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  return (
    <DashboardLayout
      topStrip={<><ShoppingBag className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Gigs Search</span><div className="flex-1" /></>}
      rightRail={
        <div className="space-y-3">
          <AdvancedFilterPanel filters={EXPLORE_GIGS_FILTERS} values={filterValues} onChange={setFilterValues} compact />
        </div>
      }
      rightRailWidth="w-52"
    >
      <SectionBackNav homeRoute="/explore" homeLabel="Explore" currentLabel="Gigs" icon={<ShoppingBag className="h-3 w-3" />} />

      <div className="flex gap-2 mb-3"><div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search gigs..." className="pl-8 h-8 text-xs rounded-xl" /></div></div>

      <AdvancedFilterPanel filters={EXPLORE_GIGS_FILTERS} values={filterValues} onChange={setFilterValues} inline className="mb-3" />

      <KPIBand className="mb-3">
        <KPICard label="Results" value="3,240" className="!rounded-2xl" />
        <KPICard label="Top Rated" value="860" className="!rounded-2xl" />
        <KPICard label="Under $50" value="1,420" className="!rounded-2xl" />
        <KPICard label="Same-Day" value="480" className="!rounded-2xl" />
      </KPIBand>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {GIGS.map((g, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="h-20 rounded-xl bg-muted/30 flex items-center justify-center mb-2"><ShoppingBag className="h-6 w-6 text-muted-foreground/30" /></div>
            <div className="flex items-center gap-2 mb-0.5"><span className="text-[10px] font-bold truncate">{g.title}</span></div>
            <div className="text-[8px] text-muted-foreground mb-1">by {g.seller} · <Badge className="text-[6px] bg-accent/10 text-accent border-0 rounded-md">{g.level}</Badge></div>
            <div className="flex items-center gap-2 text-[8px] text-muted-foreground mb-1.5">
              <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{g.rating} ({g.reviews})</span>
              <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{g.delivery}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold">{g.price}</span>
              <div className="flex gap-1"><Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg"><Heart className="h-2.5 w-2.5" /></Button><Button size="sm" className="h-6 text-[8px] rounded-lg"><Eye className="h-2.5 w-2.5 mr-0.5" />View</Button></div>
            </div>
          </SectionCard>
        ))}
      </div>

      {/* Cross-link: Related Services */}
      <SectionCard className="!rounded-2xl mt-4" title="Looking for Full Services?" action={<Link to="/services" className="text-[8px] text-accent hover:underline">Browse Services →</Link>}>
        <p className="text-[8px] text-muted-foreground mb-2">Need something more comprehensive than a gig? Explore professional services with consultations, custom quotes, and ongoing support.</p>
        <div className="flex gap-2">
          {[
            { title: 'Brand Identity Design', provider: 'Sarah C.', price: 'From $500' },
            { title: 'Full-Stack Web Development', provider: 'DevCraft Studio', price: 'From $2,000' },
          ].map(s => (
            <Link key={s.title} to="/services" className="flex-1">
              <div className="p-2.5 rounded-xl border border-border/30 hover:border-accent/30 transition-all">
                <div className="flex items-center gap-1 mb-0.5"><Badge className="text-[6px] bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))] border-0">Service</Badge><span className="text-[9px] font-semibold truncate">{s.title}</span></div>
                <div className="text-[8px] text-muted-foreground">{s.provider} · {s.price}</div>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
