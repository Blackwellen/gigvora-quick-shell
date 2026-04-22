import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Search, Star, Users, MapPin, Eye, SlidersHorizontal, Globe } from 'lucide-react';

const PAGES = [
  { name: 'TechFlow Inc.', type: 'Company', industry: 'SaaS', location: 'San Francisco', employees: '50-200', followers: '8.4K', rating: 4.8, verified: true },
  { name: 'DesignCraft Studio', type: 'Agency', industry: 'Design', location: 'London', employees: '10-50', followers: '3.2K', rating: 4.9, verified: true },
  { name: 'DataVault Analytics', type: 'Company', industry: 'Data & AI', location: 'Remote', employees: '200-500', followers: '12K', rating: 4.7, verified: true },
  { name: 'GreenLeaf Co.', type: 'Company', industry: 'E-commerce', location: 'New York', employees: '50-200', followers: '5.6K', rating: 4.6, verified: false },
  { name: 'Pixel Perfect Agency', type: 'Agency', industry: 'Marketing', location: 'Berlin', employees: '10-50', followers: '2.8K', rating: 4.8, verified: true },
];

export default function PagesSearchPage() {
  return (
    <DashboardLayout topStrip={<><Building2 className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Pages Search</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><SlidersHorizontal className="h-3 w-3" />Filters</Button></>}>
      <div className="flex gap-2 mb-3"><div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search companies, agencies, and pages..." className="pl-8 h-8 text-xs rounded-xl" /></div></div>
      <KPIBand className="mb-3">
        <KPICard label="Total Pages" value="2,840" className="!rounded-2xl" />
        <KPICard label="Companies" value="2,100" className="!rounded-2xl" />
        <KPICard label="Agencies" value="740" className="!rounded-2xl" />
        <KPICard label="Verified" value="1,680" className="!rounded-2xl" />
      </KPIBand>
      <div className="space-y-2.5">
        {PAGES.map((p, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">{p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{p.name}</span>
                  {p.verified && <Badge className="text-[6px] bg-accent/10 text-accent border-0 rounded-md">✓ Verified</Badge>}
                  <Badge variant="outline" className="text-[7px] rounded-md">{p.type}</Badge>
                  <Badge variant="outline" className="text-[7px] rounded-md">{p.industry}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{p.location}</span>
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{p.employees}</span>
                  <span className="flex items-center gap-0.5"><Globe className="h-2.5 w-2.5" />{p.followers} followers</span>
                  <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{p.rating}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0"><Button size="sm" className="h-7 text-[9px] rounded-xl">Follow</Button><Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl"><Eye className="h-3 w-3" /></Button></div>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
