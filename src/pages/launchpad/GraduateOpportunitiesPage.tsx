import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, MapPin, Building2, Calendar, ChevronRight, Filter, DollarSign } from 'lucide-react';

const GRAD_ROLES = [
  { title: 'Graduate Software Engineer', company: 'Meta', location: 'London', salary: '£45K-55K', start: 'Sep 2026', scheme: 'Graduate Scheme', applications: 1240 },
  { title: 'Graduate Product Manager', company: 'Google', location: 'Dublin', salary: '€52K-60K', start: 'Oct 2026', scheme: 'Rotation Program', applications: 890 },
  { title: 'Graduate Consultant', company: 'McKinsey', location: 'New York', salary: '$85K-95K', start: 'Aug 2026', scheme: 'Analyst Program', applications: 2100 },
  { title: 'Graduate Data Scientist', company: 'Amazon', location: 'Remote', salary: '$75K-90K', start: 'Sep 2026', scheme: 'Graduate Scheme', applications: 760 },
];

export default function GraduateOpportunitiesPage() {
  return (
    <DashboardLayout topStrip={<><GraduationCap className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Graduate Opportunities</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Filter className="h-3 w-3" />Filters</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Open Positions" value="142" className="!rounded-2xl" />
        <KPICard label="Companies Hiring" value="38" className="!rounded-2xl" />
        <KPICard label="Your Applications" value="4" className="!rounded-2xl" />
        <KPICard label="Avg Salary" value="$72K" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {GRAD_ROLES.map((r, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12px] font-bold">{r.title}</span>
                  <Badge variant="outline" className="text-[7px] rounded-md">{r.scheme}</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground flex items-center gap-3 mb-1">
                  <span className="flex items-center gap-0.5 font-medium text-foreground"><Building2 className="h-2.5 w-2.5" />{r.company}</span>
                  <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{r.location}</span>
                  <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{r.salary}</span>
                  <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{r.start}</span>
                </div>
                <div className="text-[8px] text-muted-foreground">{r.applications.toLocaleString()} applicants</div>
              </div>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl">Save</Button>
                <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><ChevronRight className="h-3 w-3" />Apply</Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
