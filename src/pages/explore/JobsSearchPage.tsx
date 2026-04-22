import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { AdvancedFilterPanel, EXPLORE_JOBS_FILTERS, FilterValues } from '@/components/shell/AdvancedFilterPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Briefcase, Search, MapPin, DollarSign, Clock, Building2, Eye } from 'lucide-react';

const JOBS = [
  { title: 'Senior React Developer', company: 'TechFlow Inc.', location: 'Remote', salary: '$140K-$180K', type: 'Full-time', posted: '2h ago', applicants: 24, match: 92 },
  { title: 'Product Designer', company: 'Figma', location: 'San Francisco', salary: '$130K-$160K', type: 'Full-time', posted: '1d ago', applicants: 48, match: 85 },
  { title: 'Data Engineer', company: 'Netflix', location: 'Remote', salary: '$150K-$190K', type: 'Full-time', posted: '3h ago', applicants: 18, match: 78 },
  { title: 'Marketing Manager', company: 'Stripe', location: 'New York', salary: '$110K-$140K', type: 'Full-time', posted: '5h ago', applicants: 32, match: 71 },
  { title: 'Frontend Engineer (Contract)', company: 'Vercel', location: 'Remote', salary: '$90/hr', type: 'Contract', posted: '12h ago', applicants: 12, match: 88 },
];

export default function JobsSearchPage() {
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  return (
    <DashboardLayout
      topStrip={<><Briefcase className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Jobs Search</span><div className="flex-1" /></>}
      rightRail={
        <div className="space-y-3">
          <AdvancedFilterPanel filters={EXPLORE_JOBS_FILTERS} values={filterValues} onChange={setFilterValues} compact />
        </div>
      }
      rightRailWidth="w-52"
    >
      <SectionBackNav homeRoute="/explore" homeLabel="Explore" currentLabel="Jobs" icon={<Briefcase className="h-3 w-3" />} />

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search jobs by title, skill, or company..." className="pl-8 h-8 text-xs rounded-xl" /></div>
      </div>

      <AdvancedFilterPanel filters={EXPLORE_JOBS_FILTERS} values={filterValues} onChange={setFilterValues} inline className="mb-3" />

      <KPIBand className="mb-3">
        <KPICard label="Results" value="1,240" className="!rounded-2xl" />
        <KPICard label="New Today" value="86" className="!rounded-2xl" />
        <KPICard label="Remote" value="640" className="!rounded-2xl" />
        <KPICard label="Avg Match" value="82%" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {JOBS.map((j, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{j.title}</span>
                  <div className={`px-1.5 py-0.5 rounded-md text-[7px] font-bold ${j.match >= 85 ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]'}`}>{j.match}% match</div>
                  <Badge variant="outline" className="text-[7px] rounded-md">{j.type}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Building2 className="h-2.5 w-2.5" />{j.company}</span>
                  <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{j.location}</span>
                  <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{j.salary}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{j.posted}</span>
                  <span>{j.applicants} applicants</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" className="h-7 text-[9px] rounded-xl">Apply</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl"><Eye className="h-3 w-3" /></Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
