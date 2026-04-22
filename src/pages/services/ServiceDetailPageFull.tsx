import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, Shield, Clock, MapPin, Calendar, MessageSquare, Heart, Share2, ChevronRight, CheckCircle, Users } from 'lucide-react';

const PACKAGES = [
  { name: 'Starter', price: '$500', delivery: '5 days', features: ['Logo design', '2 concepts', '1 revision', 'Source files'] },
  { name: 'Professional', price: '$1,200', delivery: '7 days', features: ['Logo + brand guide', '4 concepts', '3 revisions', 'Source files', 'Social kit'], popular: true },
  { name: 'Enterprise', price: '$3,000', delivery: '14 days', features: ['Full brand identity', '6 concepts', 'Unlimited revisions', 'Source files', 'Social kit', 'Stationery', 'Brand book'] },
];

const REVIEWS = [
  { author: 'Sarah K.', rating: 5, text: 'Exceptional work. The brand guide was thorough and the design exceeded expectations.', date: '2 weeks ago' },
  { author: 'James M.', rating: 5, text: 'Very professional and responsive. Delivered ahead of schedule with great attention to detail.', date: '1 month ago' },
  { author: 'Priya R.', rating: 4, text: 'Good quality work overall. Minor delays but the final result was solid.', date: '2 months ago' },
];

export default function ServiceDetailPage() {
  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Provider" className="!rounded-2xl">
        <div className="flex items-center gap-2.5 mb-2">
          <Avatar className="h-10 w-10 rounded-xl"><AvatarFallback className="rounded-xl bg-accent/10 text-accent text-[10px] font-bold">DC</AvatarFallback></Avatar>
          <div>
            <div className="text-[10px] font-bold">DesignCraft Studio</div>
            <div className="text-[8px] text-muted-foreground flex items-center gap-1"><Shield className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" />Verified Provider</div>
          </div>
        </div>
        <div className="space-y-1 text-[8px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Response time</span><span className="font-semibold">~2 hours</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Completion rate</span><span className="font-semibold">98%</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Repeat clients</span><span className="font-semibold">72%</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Member since</span><span className="font-semibold">2023</span></div>
        </div>
        <Button variant="outline" className="w-full h-7 text-[9px] rounded-xl mt-2 gap-0.5"><MessageSquare className="h-3 w-3" />Contact</Button>
      </SectionCard>
      <SectionCard title="Trust Signals" className="!rounded-2xl">
        {['Identity Verified', 'Portfolio Reviewed', 'Background Check', 'Escrow Protected', 'Dispute Resolution'].map(s => (
          <div key={s} className="flex items-center gap-1.5 py-1 text-[8px]"><CheckCircle className="h-3 w-3 text-[hsl(var(--state-healthy))]" />{s}</div>
        ))}
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={<><span className="text-xs font-semibold">Brand Identity Design</span><div className="flex-1" /><Button variant="ghost" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Heart className="h-3 w-3" />Save</Button><Button variant="ghost" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Share2 className="h-3 w-3" />Share</Button></>} rightRail={rightRail} rightRailWidth="w-52">
      <KPIBand className="mb-3">
        <KPICard label="Rating" value="4.9" className="!rounded-2xl" />
        <KPICard label="Reviews" value="342" className="!rounded-2xl" />
        <KPICard label="Orders" value="520" className="!rounded-2xl" />
        <KPICard label="Repeat Rate" value="72%" className="!rounded-2xl" />
      </KPIBand>

      <SectionCard title="Packages" className="!rounded-2xl mb-3">
        <div className="grid grid-cols-3 gap-3">
          {PACKAGES.map(p => (
            <div key={p.name} className={`rounded-2xl border p-3.5 ${p.popular ? 'border-accent ring-1 ring-accent/20' : ''}`}>
              {p.popular && <Badge className="text-[7px] bg-accent/10 text-accent border-0 rounded-lg mb-2">Most Popular</Badge>}
              <div className="text-[10px] font-bold mb-0.5">{p.name}</div>
              <div className="text-[18px] font-black text-accent mb-1">{p.price}</div>
              <div className="text-[8px] text-muted-foreground mb-2 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{p.delivery}</div>
              <div className="space-y-1 mb-3">{p.features.map(f => <div key={f} className="text-[8px] flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" />{f}</div>)}</div>
              <Button className="w-full h-7 text-[9px] rounded-xl">Select</Button>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Add-Ons" className="!rounded-2xl mb-3">
        <div className="space-y-1.5">
          {[{ label: 'Rush delivery (48h)', price: '+$200' }, { label: 'Extra revision round', price: '+$100' }, { label: 'Animated logo', price: '+$350' }, { label: 'Business card design', price: '+$150' }].map(a => (
            <div key={a.label} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
              <span className="text-[9px]">{a.label}</span>
              <div className="flex items-center gap-2"><span className="text-[9px] font-semibold">{a.price}</span><Button variant="outline" size="sm" className="h-5 text-[7px] rounded-md px-2">Add</Button></div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={`Reviews (${REVIEWS.length})`} className="!rounded-2xl">
        {REVIEWS.map((r, i) => (
          <div key={i} className="py-2.5 border-b border-border/20 last:border-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2"><span className="text-[10px] font-bold">{r.author}</span><div className="flex">{Array.from({ length: r.rating }).map((_, j) => <Star key={j} className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))] fill-[hsl(var(--gigvora-amber))]" />)}</div></div>
              <span className="text-[8px] text-muted-foreground">{r.date}</span>
            </div>
            <div className="text-[9px] text-muted-foreground">{r.text}</div>
          </div>
        ))}
      </SectionCard>
    </DashboardLayout>
  );
}
