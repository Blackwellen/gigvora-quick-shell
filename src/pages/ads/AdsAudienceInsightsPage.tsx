import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  PieChart, Users, TrendingUp, MapPin, Briefcase, Building2,
  GraduationCap, Clock, Filter, Download,
} from 'lucide-react';

interface DemoBucket { label: string; pct: number; count: number }

const SENIORITY: DemoBucket[] = [
  { label: 'C-Suite', pct: 8, count: 12400 },
  { label: 'VP / Director', pct: 22, count: 34100 },
  { label: 'Manager', pct: 31, count: 48050 },
  { label: 'Senior IC', pct: 25, count: 38750 },
  { label: 'Mid / Junior', pct: 14, count: 21700 },
];

const INDUSTRIES: DemoBucket[] = [
  { label: 'Technology', pct: 38, count: 58900 },
  { label: 'Finance', pct: 18, count: 27900 },
  { label: 'Healthcare', pct: 14, count: 21700 },
  { label: 'Manufacturing', pct: 12, count: 18600 },
  { label: 'Other', pct: 18, count: 27900 },
];

const REGIONS: DemoBucket[] = [
  { label: 'North America', pct: 45, count: 69750 },
  { label: 'Europe', pct: 28, count: 43400 },
  { label: 'Asia Pacific', pct: 18, count: 27900 },
  { label: 'LATAM', pct: 6, count: 9300 },
  { label: 'MEA', pct: 3, count: 4650 },
];

const COMPANY_SIZE: DemoBucket[] = [
  { label: '1-50', pct: 15, count: 23250 },
  { label: '51-200', pct: 22, count: 34100 },
  { label: '201-1000', pct: 28, count: 43400 },
  { label: '1001-5000', pct: 20, count: 31000 },
  { label: '5000+', pct: 15, count: 23250 },
];

const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

const BucketChart: React.FC<{ data: DemoBucket[]; accent?: string }> = ({ data, accent }) => (
  <div className="space-y-2">
    {data.map(b => (
      <div key={b.label}>
        <div className="flex justify-between text-[9px] mb-0.5">
          <span className="text-muted-foreground">{b.label}</span>
          <span className="font-semibold">{b.pct}% <span className="text-muted-foreground font-normal">({fmt(b.count)})</span></span>
        </div>
        <Progress value={b.pct} className="h-1.5" />
      </div>
    ))}
  </div>
);

const AdsAudienceInsightsPage: React.FC = () => {
  const topStrip = (
    <>
      <PieChart className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Ads — Audience Insights</span>
      <div className="flex-1" />
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Filter className="h-3 w-3" />Filter Audience</Button>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Key Insight" className="!rounded-2xl">
        <div className="text-[9px] space-y-1.5">
          <div className="rounded-lg bg-accent/10 p-2 text-accent">
            <div className="font-semibold">High-Value Segment</div>
            <div className="text-[8px] mt-0.5">VP/Director in Tech companies with 201-1000 employees convert 3.2× better than average</div>
          </div>
          <div className="rounded-lg bg-[hsl(var(--state-caution)/0.1)] p-2 text-[hsl(var(--state-caution))]">
            <div className="font-semibold">Saturation Warning</div>
            <div className="text-[8px] mt-0.5">North America Tech segment showing frequency fatigue — consider EMEA expansion</div>
          </div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52">
      <KPIBand className="mb-4">
        <KPICard label="Total Audience" value="155K" change="Addressable" className="!rounded-2xl" />
        <KPICard label="Avg. Engagement" value="2.4%" change="↑ 0.3% vs last month" className="!rounded-2xl" />
        <KPICard label="Top Converting" value="VP/Dir" change="Seniority level" className="!rounded-2xl" />
        <KPICard label="Best Region" value="NA" change="45% of reach" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-2 gap-3">
        <SectionCard title="Seniority Level" icon={<Briefcase className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <BucketChart data={SENIORITY} />
        </SectionCard>
        <SectionCard title="Industry" icon={<Building2 className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <BucketChart data={INDUSTRIES} />
        </SectionCard>
        <SectionCard title="Region" icon={<MapPin className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <BucketChart data={REGIONS} />
        </SectionCard>
        <SectionCard title="Company Size" icon={<Users className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <BucketChart data={COMPANY_SIZE} />
        </SectionCard>
      </div>
    </DashboardLayout>
  );
};

export default AdsAudienceInsightsPage;
