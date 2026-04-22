import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, Star, Users, Clock, Calendar, MessageSquare, Shield, CheckCircle2, Heart, Share2, Bookmark } from 'lucide-react';

const SERVICE = {
  title: 'Full-Stack Web Development',
  provider: 'Sarah Kim',
  avatar: 'SK',
  rating: 4.9,
  reviews: 128,
  completedJobs: 340,
  responseTime: '< 2 hours',
  description: 'Professional full-stack web development services using React, Node.js, and cloud infrastructure. From MVPs to enterprise applications, I deliver scalable, maintainable solutions with a focus on performance and user experience.',
  packages: [
    { name: 'Consultation', price: '$150', unit: '/hour', features: ['1-on-1 video call', 'Architecture review', 'Written recommendations'] },
    { name: 'MVP Build', price: '$5,000', unit: 'fixed', features: ['Full-stack app', 'Up to 10 pages', 'Auth & database', '2 revision rounds', '30-day support'] },
    { name: 'Enterprise', price: 'Custom', unit: 'quote', features: ['Dedicated team', 'Unlimited scope', 'CI/CD pipeline', 'Priority support', 'SLA guarantee'] },
  ],
  faqs: [
    { q: 'What technologies do you use?', a: 'React, Next.js, Node.js, PostgreSQL, AWS, and more depending on project needs.' },
    { q: 'What is your typical turnaround time?', a: 'MVPs take 2-4 weeks. Enterprise projects are scoped individually.' },
    { q: 'Do you offer maintenance after delivery?', a: 'Yes, all packages include post-delivery support. Extended maintenance plans available.' },
  ],
};

export default function ServiceDetailPage() {
  const [tab, setTab] = useState('overview');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <Briefcase className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold">{SERVICE.title}</h1>
          <StatusBadge status="healthy" label="Available" />
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Heart className="h-3 w-3" /> Save</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Share2 className="h-3 w-3" /> Share</Button>
          <Button size="sm" className="h-7 text-[10px]">Book Now</Button>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Provider">
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="h-10 w-10"><AvatarFallback className="text-xs bg-accent/10 text-accent">{SERVICE.avatar}</AvatarFallback></Avatar>
              <div>
                <div className="text-[11px] font-semibold">{SERVICE.provider}</div>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <Star className="h-2.5 w-2.5 fill-[hsl(var(--gigvora-amber))] text-[hsl(var(--gigvora-amber))]" /> {SERVICE.rating} ({SERVICE.reviews} reviews)
                </div>
              </div>
            </div>
            <div className="space-y-1.5 text-[9px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span className="font-medium">{SERVICE.completedJobs} jobs</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Response</span><span className="font-medium">{SERVICE.responseTime}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Member since</span><span className="font-medium">Jan 2024</span></div>
            </div>
            <Button variant="outline" size="sm" className="w-full h-7 text-[10px] mt-3 gap-1"><MessageSquare className="h-3 w-3" /> Message</Button>
          </SectionCard>
          <SectionCard title="Trust & Safety" icon={<Shield className="h-3 w-3 text-accent" />}>
            <div className="space-y-1.5 text-[9px]">
              {['Identity Verified', 'Background Checked', 'NDA Available', 'Escrow Protected'].map(item => (
                <div key={item} className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-accent" /><span>{item}</span></div>
              ))}
            </div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-56"
    >
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-8">
          <TabsTrigger value="overview" className="text-[10px] px-3">Overview</TabsTrigger>
          <TabsTrigger value="packages" className="text-[10px] px-3">Packages</TabsTrigger>
          <TabsTrigger value="reviews" className="text-[10px] px-3">Reviews ({SERVICE.reviews})</TabsTrigger>
          <TabsTrigger value="faq" className="text-[10px] px-3">FAQ</TabsTrigger>
          <TabsTrigger value="portfolio" className="text-[10px] px-3">Portfolio</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'overview' && (
        <SectionCard title="About This Service">
          <p className="text-[11px] text-muted-foreground leading-relaxed">{SERVICE.description}</p>
        </SectionCard>
      )}

      {tab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SERVICE.packages.map((pkg, i) => (
            <div key={i} className={`p-4 rounded-xl border ${i === 1 ? 'ring-2 ring-accent/30 border-accent/30' : 'border-border/40'}`}>
              {i === 1 && <Badge className="text-[7px] h-3.5 bg-accent/10 text-accent border-0 mb-2">Popular</Badge>}
              <div className="text-xs font-bold mb-1">{pkg.name}</div>
              <div className="text-lg font-bold">{pkg.price}<span className="text-[10px] text-muted-foreground font-normal"> {pkg.unit}</span></div>
              <ul className="mt-3 space-y-1.5">
                {pkg.features.map(f => (
                  <li key={f} className="flex items-center gap-1.5 text-[9px] text-muted-foreground"><CheckCircle2 className="h-2.5 w-2.5 text-accent shrink-0" />{f}</li>
                ))}
              </ul>
              <Button className="w-full h-8 text-[10px] mt-4">{pkg.unit === 'quote' ? 'Request Quote' : 'Book Now'}</Button>
            </div>
          ))}
        </div>
      )}

      {tab === 'reviews' && (
        <SectionCard title="Client Reviews">
          {[
            { user: 'James R.', rating: 5, text: 'Excellent work on our MVP. Delivered ahead of schedule with great communication.', date: '1w ago' },
            { user: 'Lisa P.', rating: 5, text: 'Sarah is the best developer we\'ve worked with. Clean code, great architecture.', date: '2w ago' },
            { user: 'David C.', rating: 4, text: 'Good work overall. Minor delays but quality was top-notch.', date: '1mo ago' },
          ].map((r, i) => (
            <div key={i} className="py-3 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-medium">{r.user}</span>
                <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`h-2.5 w-2.5 ${s <= r.rating ? 'fill-[hsl(var(--gigvora-amber))] text-[hsl(var(--gigvora-amber))]' : 'text-muted-foreground/30'}`} />)}</div>
                <span className="text-[8px] text-muted-foreground">{r.date}</span>
              </div>
              <p className="text-[9px] text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </SectionCard>
      )}

      {tab === 'faq' && (
        <SectionCard title="Frequently Asked Questions">
          {SERVICE.faqs.map((f, i) => (
            <div key={i} className="py-3 border-b border-border/30 last:border-0">
              <div className="text-[10px] font-semibold mb-1">{f.q}</div>
              <p className="text-[9px] text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </SectionCard>
      )}

      {tab === 'portfolio' && (
        <SectionCard title="Portfolio">
          <div className="grid grid-cols-2 gap-3">
            {['E-commerce Platform', 'SaaS Dashboard', 'Mobile App Backend', 'Data Pipeline'].map((p, i) => (
              <div key={i} className="p-4 rounded-xl border border-border/40 hover:border-accent/30 cursor-pointer">
                <div className="h-24 bg-muted rounded-lg mb-2" />
                <div className="text-[10px] font-medium">{p}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
