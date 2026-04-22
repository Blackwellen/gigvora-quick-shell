import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Globe, MapPin, Search, Users, Building2, Target, TrendingUp,
  ChevronRight, Eye, Filter, Layers,
} from 'lucide-react';

interface Region {
  id: string; name: string; leads: number; accounts: number; pipeline: string;
  growth: string; topIndustry: string; signals: number;
}

const REGIONS: Region[] = [
  { id: 'r1', name: 'San Francisco Bay Area', leads: 45, accounts: 12, pipeline: '$89K', growth: '+24%', topIndustry: 'SaaS', signals: 8 },
  { id: 'r2', name: 'New York Metro', leads: 38, accounts: 9, pipeline: '$67K', growth: '+18%', topIndustry: 'FinTech', signals: 5 },
  { id: 'r3', name: 'Austin, TX', leads: 22, accounts: 6, pipeline: '$45K', growth: '+32%', topIndustry: 'Cloud', signals: 6 },
  { id: 'r4', name: 'London, UK', leads: 18, accounts: 5, pipeline: '$34K', growth: '+15%', topIndustry: 'AI/ML', signals: 3 },
  { id: 'r5', name: 'Seattle, WA', leads: 15, accounts: 4, pipeline: '$28K', growth: '+12%', topIndustry: 'Analytics', signals: 2 },
  { id: 'r6', name: 'Berlin, DE', leads: 11, accounts: 3, pipeline: '$19K', growth: '+45%', topIndustry: 'E-Commerce', signals: 4 },
  { id: 'r7', name: 'Boston, MA', leads: 9, accounts: 3, pipeline: '$22K', growth: '+21%', topIndustry: 'SaaS', signals: 2 },
  { id: 'r8', name: 'Chicago, IL', leads: 7, accounts: 2, pipeline: '$15K', growth: '+9%', topIndustry: 'MarTech', signals: 1 },
];

const NavigatorGeoPage: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const topStrip = (
    <>
      <Globe className="h-4 w-4 text-[hsl(var(--gigvora-blue))]" />
      <span className="text-xs font-semibold">Navigator — Region / Geo View</span>
      <div className="flex-1" />
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Filter className="h-3 w-3" />Filters</Button>
    </>
  );

  const selected = REGIONS.find(r => r.id === selectedRegion);
  const rightRail = (
    <div className="space-y-3">
      {selected ? (
        <SectionCard title={selected.name} className="!rounded-2xl">
          <div className="space-y-1.5 text-[9px]">
            {[
              { l: 'Leads', v: String(selected.leads) },
              { l: 'Accounts', v: String(selected.accounts) },
              { l: 'Pipeline', v: selected.pipeline },
              { l: 'Growth', v: selected.growth },
              { l: 'Top Industry', v: selected.topIndustry },
              { l: 'Active Signals', v: String(selected.signals) },
            ].map(m => (
              <div key={m.l} className="flex justify-between py-1 border-b last:border-0">
                <span className="text-muted-foreground">{m.l}</span>
                <span className="font-semibold">{m.v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 mt-2.5">
            <Button size="sm" className="flex-1 h-7 text-[8px] rounded-xl gap-0.5"><Users className="h-2.5 w-2.5" />Leads</Button>
            <Button variant="outline" size="sm" className="flex-1 h-7 text-[8px] rounded-xl gap-0.5"><Building2 className="h-2.5 w-2.5" />Accounts</Button>
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="Select a Region" className="!rounded-2xl">
          <p className="text-[9px] text-muted-foreground">Click a region to view details.</p>
        </SectionCard>
      )}
      <SectionCard title="Concentration" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {REGIONS.slice(0, 4).map(r => (
            <div key={r.id} className="flex items-center gap-1.5">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${(r.leads / 45) * 100}%` }} /></div>
              <span className="text-[8px] text-muted-foreground w-20 text-right truncate">{r.name.split(',')[0]}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52">
      <KPIBand className="mb-3">
        <KPICard label="Regions Active" value={String(REGIONS.length)} change="Worldwide" className="!rounded-2xl" />
        <KPICard label="Total Leads" value="165" change="Across regions" className="!rounded-2xl" />
        <KPICard label="Top Region" value="SF Bay" change="45 leads" className="!rounded-2xl" />
        <KPICard label="Pipeline" value="$319K" change="All regions" className="!rounded-2xl" />
      </KPIBand>

      {/* Map placeholder */}
      <div className="rounded-2xl border bg-gradient-to-br from-[hsl(var(--gigvora-blue))]/5 to-accent/5 p-8 mb-4 flex flex-col items-center justify-center min-h-[220px]">
        <Globe className="h-14 w-14 text-[hsl(var(--gigvora-blue))]/20 mb-3" />
        <div className="text-[12px] font-bold text-muted-foreground">Interactive Geo Map</div>
        <div className="text-[10px] text-muted-foreground mt-1">Prospect clusters, account concentration, and pipeline density by region</div>
      </div>

      {/* Region cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {REGIONS.map(r => (
          <div key={r.id} onClick={() => setSelectedRegion(r.id)} className={cn('rounded-2xl border bg-card p-3.5 hover:shadow-md cursor-pointer transition-all group', selectedRegion === r.id && 'ring-2 ring-accent/30')}>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-accent shrink-0" />
              <div className="text-[11px] font-bold group-hover:text-accent transition-colors truncate">{r.name}</div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center text-[9px]">
              <div className="rounded-lg bg-muted/30 p-1.5"><div className="text-sm font-bold">{r.leads}</div><div className="text-[7px] text-muted-foreground">Leads</div></div>
              <div className="rounded-lg bg-muted/30 p-1.5"><div className="text-sm font-bold">{r.accounts}</div><div className="text-[7px] text-muted-foreground">Accts</div></div>
              <div className="rounded-lg bg-muted/30 p-1.5"><div className="text-sm font-bold text-accent">{r.pipeline}</div><div className="text-[7px] text-muted-foreground">Pipeline</div></div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-1.5 border-t text-[8px]">
              <Badge variant="secondary" className="text-[7px]">{r.topIndustry}</Badge>
              <span className="text-[hsl(var(--state-healthy))] font-semibold">{r.growth}</span>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default NavigatorGeoPage;
