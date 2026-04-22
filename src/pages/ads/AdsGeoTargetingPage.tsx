import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Globe, MapPin, Search, Filter, Plus, DollarSign, Eye, Target,
  Ban, TrendingUp, ChevronRight,
} from 'lucide-react';

interface GeoTarget {
  id: string; region: string; type: 'include' | 'exclude'; impressions: string;
  clicks: string; ctr: string; spend: string; conversions: number; cpa: string; pct: number;
}

const GEO_TARGETS: GeoTarget[] = [
  { id: 'G-1', region: 'United States', type: 'include', impressions: '89K', clicks: '2.4K', ctr: '2.7%', spend: '$1,420', conversions: 28, cpa: '$50.71', pct: 45 },
  { id: 'G-2', region: 'United Kingdom', type: 'include', impressions: '34K', clicks: '920', ctr: '2.7%', spend: '$560', conversions: 12, cpa: '$46.67', pct: 18 },
  { id: 'G-3', region: 'Canada', type: 'include', impressions: '22K', clicks: '610', ctr: '2.8%', spend: '$340', conversions: 8, cpa: '$42.50', pct: 11 },
  { id: 'G-4', region: 'Germany', type: 'include', impressions: '18K', clicks: '480', ctr: '2.7%', spend: '$290', conversions: 6, cpa: '$48.33', pct: 9 },
  { id: 'G-5', region: 'Australia', type: 'include', impressions: '15K', clicks: '410', ctr: '2.7%', spend: '$240', conversions: 5, cpa: '$48.00', pct: 8 },
  { id: 'G-6', region: 'India', type: 'include', impressions: '12K', clicks: '380', ctr: '3.2%', spend: '$120', conversions: 4, cpa: '$30.00', pct: 4 },
  { id: 'G-7', region: 'Russia', type: 'exclude', impressions: '—', clicks: '—', ctr: '—', spend: '—', conversions: 0, cpa: '—', pct: 0 },
  { id: 'G-8', region: 'Belarus', type: 'exclude', impressions: '—', clicks: '—', ctr: '—', spend: '—', conversions: 0, cpa: '—', pct: 0 },
];

const AdsGeoTargetingPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const topStrip = (
    <>
      <Globe className="h-4 w-4 text-[hsl(var(--gigvora-blue))]" />
      <span className="text-xs font-semibold">Ads — Geo Targeting Map</span>
      <div className="flex-1" />
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />Add Region</Button>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Ban className="h-3 w-3" />Add Exclusion</Button>
    </>
  );

  const selected = GEO_TARGETS.find(g => g.id === selectedId);
  const rightRail = (
    <div className="space-y-3">
      {selected && selected.type === 'include' ? (
        <SectionCard title={selected.region} className="!rounded-2xl">
          <div className="space-y-1 text-[9px]">
            {[
              { l: 'Impressions', v: selected.impressions },
              { l: 'Clicks', v: selected.clicks },
              { l: 'CTR', v: selected.ctr },
              { l: 'Spend', v: selected.spend },
              { l: 'Conversions', v: String(selected.conversions) },
              { l: 'CPA', v: selected.cpa },
            ].map(m => (
              <div key={m.l} className="flex justify-between py-1 border-b last:border-0">
                <span className="text-muted-foreground">{m.l}</span><span className="font-semibold">{m.v}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="Select a Region" className="!rounded-2xl">
          <p className="text-[9px] text-muted-foreground">Click a region to see detailed geo performance.</p>
        </SectionCard>
      )}
      <SectionCard title="Spend Distribution" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {GEO_TARGETS.filter(g => g.type === 'include').slice(0, 4).map(g => (
            <div key={g.id}>
              <div className="flex justify-between mb-0.5"><span className="text-muted-foreground truncate">{g.region}</span><span className="font-semibold">{g.pct}%</span></div>
              <div className="h-1 rounded-full bg-muted overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${g.pct}%` }} /></div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52">
      <KPIBand className="mb-3">
        <KPICard label="Included Regions" value={String(GEO_TARGETS.filter(g => g.type === 'include').length)} className="!rounded-2xl" />
        <KPICard label="Excluded" value={String(GEO_TARGETS.filter(g => g.type === 'exclude').length)} className="!rounded-2xl" />
        <KPICard label="Total Spend" value="$2,970" change="Geo total" className="!rounded-2xl" />
        <KPICard label="Avg CPA" value="$44" className="!rounded-2xl" />
      </KPIBand>

      {/* Map placeholder */}
      <div className="rounded-2xl border bg-gradient-to-br from-[hsl(var(--gigvora-blue))]/5 to-accent/5 p-8 mb-4 flex flex-col items-center justify-center min-h-[200px]">
        <Globe className="h-14 w-14 text-[hsl(var(--gigvora-blue))]/20 mb-3" />
        <div className="text-[12px] font-bold text-muted-foreground">Interactive Geo Targeting Map</div>
        <div className="text-[10px] text-muted-foreground mt-1">Included regions, exclusion zones, spend density, and conversion heat</div>
      </div>

      <div className="space-y-2">
        {GEO_TARGETS.map(g => (
          <div key={g.id} onClick={() => setSelectedId(g.id)} className={cn('rounded-2xl border bg-card p-3.5 hover:shadow-sm cursor-pointer transition-all', selectedId === g.id && 'ring-2 ring-accent/30', g.type === 'exclude' && 'border-destructive/20')}>
            <div className="flex items-center gap-3">
              <MapPin className={cn('h-4 w-4 shrink-0', g.type === 'include' ? 'text-accent' : 'text-destructive')} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold">{g.region}</span>
                  <Badge className={cn('text-[7px] border-0', g.type === 'include' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : 'bg-destructive/10 text-destructive')}>{g.type}</Badge>
                </div>
              </div>
              {g.type === 'include' && (
                <div className="flex gap-3 text-center text-[9px] shrink-0">
                  <div><div className="font-bold">{g.impressions}</div><div className="text-[7px] text-muted-foreground">Impr</div></div>
                  <div><div className="font-bold">{g.spend}</div><div className="text-[7px] text-muted-foreground">Spend</div></div>
                  <div><div className="font-bold">{g.conversions}</div><div className="text-[7px] text-muted-foreground">Conv</div></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdsGeoTargetingPage;
