import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import {
  MapPin, Search, Clock, Download, TrendingUp, Globe, Filter, ChevronRight,
  AlertTriangle, Layers, Target, Crosshair, Circle, Square, Maximize2,
  Eye, Megaphone, DollarSign, BarChart3, Activity, Users, Zap, History,
  Navigation, Compass, Map, Radio, Radius, MousePointerClick, ExternalLink,
  RefreshCw, Smartphone, Plus, Minus, Move, Settings, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

type GTab = 'map' | 'heatmap' | 'markers' | 'radius' | 'report' | 'compare' | 'handoff' | 'mobile';

interface MarkerData {
  id: string; label: string; lat: string; lng: string; type: 'campaign' | 'event' | 'service' | 'opportunity';
  impressions: string; clicks: string; ctr: string; spend: string; status: 'active' | 'paused' | 'draft';
  region: string; radius?: string;
}

interface HeatZone {
  region: string; density: number; impressions: string; clicks: string; ctr: string;
  spend: string; conversions: number; cpa: string; trend: 'up' | 'down' | 'flat';
}

interface RadiusTarget {
  id: string; center: string; radius: string; population: string; impressions: string;
  budget: string; status: 'active' | 'draft' | 'review'; campaigns: number;
}

const MARKERS: MarkerData[] = [
  { id: 'MK-01', label: 'NYC Metro Campaign', lat: '40.7128', lng: '-74.0060', type: 'campaign', impressions: '245K', clicks: '8.2K', ctr: '3.35%', spend: '$3,420', status: 'active', region: 'New York, US' },
  { id: 'MK-02', label: 'London Tech Hub', lat: '51.5074', lng: '-0.1278', type: 'campaign', impressions: '145K', clicks: '4.8K', ctr: '3.31%', spend: '$1,280', status: 'active', region: 'London, UK' },
  { id: 'MK-03', label: 'SF Bay Talent Event', lat: '37.7749', lng: '-122.4194', type: 'event', impressions: '89K', clicks: '3.1K', ctr: '3.48%', spend: '$920', status: 'active', region: 'San Francisco, US' },
  { id: 'MK-04', label: 'Berlin Gig Promo', lat: '52.5200', lng: '13.4050', type: 'service', impressions: '72K', clicks: '2.2K', ctr: '3.06%', spend: '$620', status: 'paused', region: 'Berlin, DE' },
  { id: 'MK-05', label: 'Toronto Opportunity Zone', lat: '43.6532', lng: '-79.3832', type: 'opportunity', impressions: '56K', clicks: '1.8K', ctr: '3.21%', spend: '$480', status: 'draft', region: 'Toronto, CA' },
  { id: 'MK-06', label: 'Sydney Growth Sprint', lat: '-33.8688', lng: '151.2093', type: 'campaign', impressions: '42K', clicks: '1.5K', ctr: '3.57%', spend: '$380', status: 'active', region: 'Sydney, AU' },
  { id: 'MK-07', label: 'Mumbai Dev Hub', lat: '19.0760', lng: '72.8777', type: 'service', impressions: '98K', clicks: '2.8K', ctr: '2.86%', spend: '$290', status: 'active', region: 'Mumbai, IN' },
];

const HEAT_ZONES: HeatZone[] = [
  { region: 'North America', density: 92, impressions: '520K', clicks: '18.2K', ctr: '3.5%', spend: '$4,820', conversions: 198, cpa: '$24.34', trend: 'up' },
  { region: 'Western Europe', density: 75, impressions: '289K', clicks: '9.2K', ctr: '3.18%', spend: '$2,520', conversions: 91, cpa: '$27.69', trend: 'up' },
  { region: 'South Asia', density: 68, impressions: '187K', clicks: '5.2K', ctr: '2.78%', spend: '$610', conversions: 56, cpa: '$10.89', trend: 'up' },
  { region: 'East Asia', density: 55, impressions: '134K', clicks: '3.8K', ctr: '2.84%', spend: '$890', conversions: 38, cpa: '$23.42', trend: 'flat' },
  { region: 'Oceania', density: 42, impressions: '98K', clicks: '3.3K', ctr: '3.37%', spend: '$860', conversions: 33, cpa: '$26.06', trend: 'flat' },
  { region: 'South America', density: 28, impressions: '45K', clicks: '1.1K', ctr: '2.44%', spend: '$220', conversions: 12, cpa: '$18.33', trend: 'down' },
];

const RADIUS_TARGETS: RadiusTarget[] = [
  { id: 'RT-01', center: 'New York, NY', radius: '25 mi', population: '8.3M', impressions: '245K', budget: '$3,420', status: 'active', campaigns: 3 },
  { id: 'RT-02', center: 'London, UK', radius: '15 mi', population: '9.0M', impressions: '145K', budget: '$1,280', status: 'active', campaigns: 2 },
  { id: 'RT-03', center: 'San Francisco, CA', radius: '20 mi', population: '4.7M', impressions: '89K', budget: '$920', status: 'active', campaigns: 1 },
  { id: 'RT-04', center: 'Toronto, ON', radius: '30 mi', population: '6.2M', impressions: '56K', budget: '$480', status: 'draft', campaigns: 0 },
  { id: 'RT-05', center: 'Berlin, DE', radius: '10 mi', population: '3.6M', impressions: '72K', budget: '$620', status: 'review', campaigns: 1 },
];

const TYPE_COLORS: Record<string, string> = { campaign: 'bg-accent', event: 'bg-primary', service: 'bg-[hsl(var(--state-healthy))]', opportunity: 'bg-[hsl(var(--gigvora-amber))]' };
const STATUS_MAP: Record<string, 'healthy' | 'caution' | 'degraded'> = { active: 'healthy', paused: 'caution', draft: 'degraded' };
const RT_STATUS: Record<string, 'healthy' | 'caution' | 'review'> = { active: 'healthy', draft: 'caution', review: 'review' };

/* ── Marker Drawer ── */
const MarkerDrawer: React.FC<{ marker: MarkerData | null; open: boolean; onClose: () => void }> = ({ marker, open, onClose }) => {
  if (!marker) return null;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[440px] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" />{marker.id}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="h-24 rounded-2xl bg-muted/30 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-accent to-primary" />
            <div className="text-center relative z-10"><MapPin className="h-6 w-6 mx-auto mb-1 text-accent" /><div className="text-[9px] font-semibold">{marker.label}</div><div className="text-[7px] text-muted-foreground">{marker.region}</div></div>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <StatusBadge status={STATUS_MAP[marker.status]} label={marker.status} />
            <Badge variant="secondary" className="text-[7px] capitalize">{marker.type}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[{ l: 'Impressions', v: marker.impressions }, { l: 'Clicks', v: marker.clicks }, { l: 'CTR', v: marker.ctr }, { l: 'Spend', v: marker.spend }, { l: 'Lat', v: marker.lat }, { l: 'Lng', v: marker.lng }].map(m => (
              <div key={m.l} className="rounded-xl border p-2"><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-[9px] font-semibold">{m.v}</div></div>
            ))}
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-[10px] font-semibold mb-2">7-Day Performance</div>
            <div className="h-14 flex items-end gap-1">{[35, 48, 62, 55, 70, 78, 72].map((v, i) => (<div key={i} className="flex-1 rounded-t bg-accent/50 hover:bg-accent/80 transition-colors" style={{ height: `${v}%` }} />))}</div>
          </div>
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            <Link to="/ads"><Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Megaphone className="h-2.5 w-2.5" />Ads Manager</Button></Link>
            <Link to="/ads/analytics"><Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><BarChart3 className="h-2.5 w-2.5" />Analytics</Button></Link>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Exporting')}><Download className="h-2.5 w-2.5" />Export</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ── Main Page ── */
const MapGeoIntelPage: React.FC = () => {
  const { activeRole } = useRole();
  const [tab, setTab] = useState<GTab>('map');
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [mapMode, setMapMode] = useState<'pins' | 'clusters' | 'heatmap'>('pins');
  const [search, setSearch] = useState('');
  const [compareItems, setCompareItems] = useState<string[]>([]);
  const [zoom, setZoom] = useState(5);

  const topStrip = (
    <>
      <Globe className="h-3.5 w-3.5 text-accent" />
      <span className="text-[11px] font-semibold">Geo Intelligence · Map Views · Location Targeting · Places</span>
      <Badge variant="secondary" className="text-[7px] capitalize">{activeRole}</Badge>
      <div className="flex-1" />
      <div className="flex items-center gap-1 rounded-xl border p-0.5">
        {(['pins', 'clusters', 'heatmap'] as const).map(m => (
          <button key={m} onClick={() => setMapMode(m)} className={cn('px-2 py-0.5 rounded-lg text-[8px] font-medium transition-colors capitalize', mapMode === m ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/30')}>{m}</button>
        ))}
      </div>
      <div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search locations..." className="h-6 w-36 rounded-xl border bg-background pl-7 pr-2 text-[8px]" /></div>
      <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Exporting')}><Download className="h-3 w-3" />Export</Button>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />~5m</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Geo Summary" icon={<Globe className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="text-lg font-bold">{MARKERS.length} Locations</div>
        <div className="text-[8px] text-muted-foreground">{MARKERS.filter(m => m.status === 'active').length} active · {MARKERS.filter(m => m.status === 'draft').length} draft</div>
        <div className="mt-1.5 space-y-0.5 text-[8px]">
          {[{ l: 'Total Spend', v: '$7,390' }, { l: 'Avg CTR', v: '3.12%' }, { l: 'Top Region', v: 'North America' }, { l: 'Coverage', v: '7 regions' }].map(m => (
            <div key={m.l} className="flex justify-between"><span className="text-muted-foreground">{m.l}</span><span className="font-medium">{m.v}</span></div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Alerts" icon={<AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />} className="!rounded-2xl">
        <div className="space-y-1">
          {[
            { label: 'Berlin paused — budget limit', severity: 'caution' as const },
            { label: 'Toronto draft needs review', severity: 'review' as const },
            { label: 'S. America CTR declining', severity: 'blocked' as const },
          ].map(a => (
            <div key={a.label} className="flex items-center gap-1.5 p-1.5 rounded-lg border text-[8px]">
              <StatusBadge status={a.severity} label={a.severity === 'caution' ? 'Warning' : a.severity === 'review' ? 'Review' : 'Alert'} />
              <span className="flex-1">{a.label}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Quick Links" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { label: 'Ads Manager', icon: Megaphone, to: '/ads' },
            { label: 'Ads Analytics', icon: BarChart3, to: '/ads/analytics' },
            { label: 'Billing', icon: DollarSign, to: '/finance/billing' },
          ].map(a => (
            <Link key={a.label} to={a.to}><button className="flex items-center gap-2 p-1.5 rounded-lg w-full text-left hover:bg-muted/30 transition-colors text-[8px]"><a.icon className="h-3 w-3 text-muted-foreground" /><span>{a.label}</span><ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" /></button></Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Geo Activity</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[
          { action: 'NYC Metro targeting updated — radius 25mi', time: '2h ago', type: 'update' },
          { action: 'London Hub reached 145K impressions', time: '6h ago', type: 'milestone' },
          { action: 'Berlin campaign paused — budget cap', time: '1d ago', type: 'alert' },
          { action: 'Toronto zone created as draft', time: '2d ago', type: 'create' },
          { action: 'Sydney radius expanded to 30mi', time: '3d ago', type: 'update' },
        ].map((a, i) => (
          <div key={i} className="shrink-0 rounded-2xl border bg-card px-3 py-2 min-w-[210px] hover:shadow-sm transition-all">
            <Badge variant="secondary" className="text-[6px] capitalize mb-1">{a.type}</Badge>
            <p className="text-[8px] text-muted-foreground line-clamp-2">{a.action}</p>
            <div className="text-[7px] text-muted-foreground mt-0.5">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      {/* Tab Nav */}
      <div className="flex items-center gap-1 mb-3 border-b pb-2 overflow-x-auto">
        {([
          { key: 'map' as const, label: 'Map Shell', icon: Map },
          { key: 'heatmap' as const, label: 'Heatmap', icon: Layers },
          { key: 'markers' as const, label: 'Markers & Pins', icon: MapPin },
          { key: 'radius' as const, label: 'Radius Targeting', icon: Target },
          { key: 'report' as const, label: 'Geo Report', icon: BarChart3 },
          { key: 'compare' as const, label: 'Location Compare', icon: Layers },
          { key: 'handoff' as const, label: 'Ads / Events / Services', icon: ExternalLink },
          { key: 'mobile' as const, label: 'Mobile Map', icon: Smartphone },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] transition-colors whitespace-nowrap shrink-0', tab === t.key ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30')}><t.icon className="h-3 w-3" />{t.label}</button>
        ))}
      </div>

      {/* ═══ MAP SHELL ═══ */}
      {tab === 'map' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Locations" value={String(MARKERS.filter(m => m.status === 'active').length)} />
            <KPICard label="Total Reach" value="747K" change="+12%" trend="up" />
            <KPICard label="Geo Spend" value="$7,390" change="+9%" trend="up" />
            <KPICard label="Avg CTR" value="3.12%" change="+0.2%" trend="up" />
          </KPIBand>

          {/* Map Canvas */}
          <div className="rounded-2xl border bg-muted/10 relative overflow-hidden" style={{ height: '380px' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5" />
            {/* Map controls */}
            <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-xl bg-card shadow-sm" onClick={() => setZoom(Math.min(zoom + 1, 15))}><Plus className="h-3 w-3" /></Button>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-xl bg-card shadow-sm" onClick={() => setZoom(Math.max(zoom - 1, 1))}><Minus className="h-3 w-3" /></Button>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-xl bg-card shadow-sm"><Move className="h-3 w-3" /></Button>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-xl bg-card shadow-sm"><Crosshair className="h-3 w-3" /></Button>
            </div>
            <div className="absolute top-3 right-3 z-10 text-[8px] bg-card/80 backdrop-blur rounded-xl border px-2 py-1">Zoom: {zoom}x · {mapMode}</div>

            {/* Simulated pin markers */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                {MARKERS.filter(m => !search || m.label.toLowerCase().includes(search.toLowerCase()) || m.region.toLowerCase().includes(search.toLowerCase())).map((marker, i) => {
                  const positions = [
                    { top: '25%', left: '28%' }, { top: '22%', left: '48%' }, { top: '30%', left: '18%' },
                    { top: '24%', left: '50%' }, { top: '28%', left: '32%' }, { top: '60%', left: '82%' },
                    { top: '45%', left: '70%' },
                  ];
                  const pos = positions[i] || { top: '50%', left: '50%' };
                  return (
                    <button key={marker.id} onClick={() => setSelectedMarker(marker)}
                      className="absolute group transition-transform hover:scale-125 z-10"
                      style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}>
                      <div className={cn('h-4 w-4 rounded-full border-2 border-card shadow-lg', TYPE_COLORS[marker.type], marker.status === 'paused' && 'opacity-50')} />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-card border rounded-lg shadow-md px-2 py-1 whitespace-nowrap z-20">
                        <div className="text-[8px] font-semibold">{marker.label}</div>
                        <div className="text-[7px] text-muted-foreground">{marker.region} · {marker.impressions} impr.</div>
                      </div>
                    </button>
                  );
                })}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Globe className="h-32 w-32 text-muted-foreground/10" />
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 justify-center text-[8px]">
            {[{ l: 'Campaign', c: 'bg-accent' }, { l: 'Event', c: 'bg-primary' }, { l: 'Service', c: 'bg-[hsl(var(--state-healthy))]' }, { l: 'Opportunity', c: 'bg-[hsl(var(--gigvora-amber))]' }].map(i => (
              <span key={i.l} className="flex items-center gap-1"><span className={cn('w-2.5 h-2.5 rounded-full', i.c)} />{i.l}</span>
            ))}
          </div>
        </div>
      )}

      {/* ═══ HEATMAP ═══ */}
      {tab === 'heatmap' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Zones" value={String(HEAT_ZONES.length)} />
            <KPICard label="Hottest Region" value="N. America" />
            <KPICard label="Best CPA" value="S. Asia — $10.89" />
            <KPICard label="Total Conversions" value="428" />
          </KPIBand>

          {/* Visual heatmap */}
          <div className="rounded-2xl border bg-muted/10 p-4" style={{ height: '280px' }}>
            <div className="h-full flex items-center justify-center">
              <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
                {HEAT_ZONES.map(z => (
                  <div key={z.region} className="rounded-2xl border p-3 text-center transition-all hover:shadow-md cursor-pointer relative overflow-hidden" onClick={() => toast.info(`Drilling into ${z.region}`)}>
                    <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, hsl(var(--accent) / ${z.density / 100}), transparent)` }} />
                    <div className="relative z-10">
                      <div className="text-lg font-bold">{z.density}</div>
                      <div className="text-[8px] font-medium">{z.region}</div>
                      <div className="text-[7px] text-muted-foreground">{z.impressions} impr.</div>
                      <div className="flex items-center justify-center gap-0.5 mt-0.5">
                        {z.trend === 'up' && <ArrowUpRight className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" />}
                        {z.trend === 'down' && <ArrowDownRight className="h-2.5 w-2.5 text-destructive" />}
                        <span className="text-[7px] text-muted-foreground">{z.trend}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SectionCard title="Zone Performance" icon={<Activity className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/30"><tr className="text-[8px] text-muted-foreground font-medium"><th className="text-left px-3 py-1.5">Region</th><th className="text-right px-3 py-1.5">Density</th><th className="text-right px-3 py-1.5">Impr.</th><th className="text-right px-3 py-1.5">CTR</th><th className="text-right px-3 py-1.5">Spend</th><th className="text-right px-3 py-1.5">Conv.</th><th className="text-right px-3 py-1.5">CPA</th></tr></thead>
                <tbody>
                  {HEAT_ZONES.map(z => (
                    <tr key={z.region} className="border-t text-[8px] hover:bg-muted/20 transition-colors cursor-pointer">
                      <td className="px-3 py-1.5 font-medium">{z.region}</td>
                      <td className="px-3 py-1.5 text-right"><div className="flex items-center justify-end gap-1"><Progress value={z.density} className="h-1.5 w-10" /><span className="text-[7px]">{z.density}</span></div></td>
                      <td className="px-3 py-1.5 text-right">{z.impressions}</td>
                      <td className="px-3 py-1.5 text-right">{z.ctr}</td>
                      <td className="px-3 py-1.5 text-right">{z.spend}</td>
                      <td className="px-3 py-1.5 text-right font-semibold">{z.conversions}</td>
                      <td className="px-3 py-1.5 text-right">{z.cpa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ MARKERS & PINS ═══ */}
      {tab === 'markers' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Markers" value={String(MARKERS.length)} />
            <KPICard label="Active" value={String(MARKERS.filter(m => m.status === 'active').length)} />
            <KPICard label="Top CTR" value="3.57% (Sydney)" />
            <KPICard label="Total Clicks" value="24.4K" />
          </KPIBand>

          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30"><tr className="text-[8px] text-muted-foreground font-medium"><th className="text-left px-3 py-2">Location</th><th className="text-center px-3 py-2">Type</th><th className="text-center px-3 py-2">Status</th><th className="text-right px-3 py-2">Impr.</th><th className="text-right px-3 py-2">Clicks</th><th className="text-right px-3 py-2">CTR</th><th className="text-right px-3 py-2">Spend</th><th className="text-center px-3 py-2">Actions</th></tr></thead>
              <tbody>
                {MARKERS.filter(m => !search || m.label.toLowerCase().includes(search.toLowerCase())).map(marker => (
                  <tr key={marker.id} className="border-t text-[8px] hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedMarker(marker)}>
                    <td className="px-3 py-2"><div className="font-medium">{marker.label}</div><div className="text-[7px] text-muted-foreground">{marker.region} · {marker.id}</div></td>
                    <td className="px-3 py-2 text-center"><Badge variant="secondary" className="text-[6px] capitalize">{marker.type}</Badge></td>
                    <td className="px-3 py-2 text-center"><StatusBadge status={STATUS_MAP[marker.status]} label={marker.status} /></td>
                    <td className="px-3 py-2 text-right">{marker.impressions}</td>
                    <td className="px-3 py-2 text-right">{marker.clicks}</td>
                    <td className="px-3 py-2 text-right font-semibold">{marker.ctr}</td>
                    <td className="px-3 py-2 text-right">{marker.spend}</td>
                    <td className="px-3 py-2 text-center"><Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg"><Eye className="h-2.5 w-2.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ RADIUS TARGETING ═══ */}
      {tab === 'radius' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Targets" value={String(RADIUS_TARGETS.filter(r => r.status === 'active').length)} />
            <KPICard label="Total Population" value="31.8M" />
            <KPICard label="Total Budget" value="$6,720" />
            <KPICard label="Campaigns" value="7" />
          </KPIBand>

          <SectionCard title="Radius Targets" icon={<Target className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl"
            action={<Button size="sm" className="h-6 text-[8px] rounded-xl gap-1" onClick={() => toast.info('Create target')}><Plus className="h-3 w-3" />New Target</Button>}>
            <div className="space-y-2">
              {RADIUS_TARGETS.map(rt => (
                <div key={rt.id} className="rounded-2xl border p-3 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center"><Target className="h-4 w-4 text-accent" /></div>
                      <div><div className="text-[10px] font-semibold">{rt.center}</div><div className="text-[7px] text-muted-foreground">{rt.id} · {rt.radius} radius · Pop. {rt.population}</div></div>
                    </div>
                    <StatusBadge status={RT_STATUS[rt.status]} label={rt.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[8px]">
                    <div><span className="text-muted-foreground">Impressions</span><div className="font-semibold">{rt.impressions}</div></div>
                    <div><span className="text-muted-foreground">Budget</span><div className="font-semibold">{rt.budget}</div></div>
                    <div><span className="text-muted-foreground">Campaigns</span><div className="font-semibold">{rt.campaigns}</div></div>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg" onClick={() => toast.info('Editing radius')}><Settings className="h-2.5 w-2.5 mr-0.5" />Edit</Button>
                    {rt.status === 'draft' && <Button size="sm" className="h-5 text-[7px] rounded-lg">Activate</Button>}
                    {rt.status === 'review' && <Button size="sm" className="h-5 text-[7px] rounded-lg bg-[hsl(var(--gigvora-amber))]">Submit Review</Button>}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ GEO REPORT ═══ */}
      {tab === 'report' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Spend" value="$9,920" />
            <KPICard label="Total Conversions" value="428" />
            <KPICard label="Best CPA Region" value="S. Asia" />
            <KPICard label="Coverage" value="6 regions" />
          </KPIBand>

          <SectionCard title="Regional Performance Report" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl"
            action={<Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg gap-1"><Download className="h-2.5 w-2.5" />PDF</Button>}>
            <div className="space-y-3">
              {HEAT_ZONES.map(z => (
                <div key={z.region} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-[10px] font-semibold">{z.region}</div>
                    <div className="flex items-center gap-1">
                      {z.trend === 'up' && <ArrowUpRight className="h-3 w-3 text-[hsl(var(--state-healthy))]" />}
                      {z.trend === 'down' && <ArrowDownRight className="h-3 w-3 text-destructive" />}
                      <Badge variant="secondary" className="text-[6px]">Density: {z.density}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-[8px]">
                    <div><span className="text-muted-foreground">Impressions</span><div className="font-semibold">{z.impressions}</div></div>
                    <div><span className="text-muted-foreground">Clicks</span><div className="font-semibold">{z.clicks}</div></div>
                    <div><span className="text-muted-foreground">CTR</span><div className="font-semibold">{z.ctr}</div></div>
                    <div><span className="text-muted-foreground">Conversions</span><div className="font-semibold">{z.conversions}</div></div>
                    <div><span className="text-muted-foreground">CPA</span><div className="font-semibold">{z.cpa}</div></div>
                  </div>
                  <Progress value={z.density} className="h-1 mt-2" />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ LOCATION COMPARE ═══ */}
      {tab === 'compare' && (
        <div className="space-y-3">
          <div className="text-[10px] text-muted-foreground mb-1">Select 2-3 locations to compare side-by-side.</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {MARKERS.map(m => {
              const selected = compareItems.includes(m.id);
              return (
                <button key={m.id} onClick={() => setCompareItems(prev => prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id].slice(0, 3))}
                  className={cn('rounded-2xl border p-3 text-left transition-all hover:shadow-sm', selected && 'border-accent ring-1 ring-accent/30')}>
                  <div className="flex items-center gap-1.5 mb-1"><div className={cn('h-3 w-3 rounded-full', TYPE_COLORS[m.type])} /><span className="text-[9px] font-semibold truncate">{m.label}</span></div>
                  <div className="text-[7px] text-muted-foreground">{m.region}</div>
                  <div className="grid grid-cols-2 gap-1 mt-1 text-[7px]">
                    <div><span className="text-muted-foreground">CTR</span><div className="font-semibold">{m.ctr}</div></div>
                    <div><span className="text-muted-foreground">Spend</span><div className="font-semibold">{m.spend}</div></div>
                  </div>
                </button>
              );
            })}
          </div>
          {compareItems.length >= 2 && (
            <SectionCard title="Comparison" icon={<Layers className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/30"><tr className="text-[8px] text-muted-foreground font-medium"><th className="text-left px-3 py-1.5">Metric</th>{compareItems.map(id => { const m = MARKERS.find(x => x.id === id); return <th key={id} className="text-right px-3 py-1.5">{m?.label?.split(' ').slice(0, 2).join(' ')}</th>; })}</tr></thead>
                  <tbody>
                    {['impressions', 'clicks', 'ctr', 'spend', 'region', 'status'].map(metric => (
                      <tr key={metric} className="border-t text-[8px]">
                        <td className="px-3 py-1.5 font-medium capitalize">{metric}</td>
                        {compareItems.map(id => { const m = MARKERS.find(x => x.id === id); return <td key={id} className="px-3 py-1.5 text-right">{m ? (m as any)[metric] : '-'}</td>; })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {/* ═══ HANDOFF ═══ */}
      {tab === 'handoff' && (
        <div className="space-y-3">
          <SectionCard title="Route Into Adjacent Domains" icon={<ExternalLink className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { label: 'Ads Manager', desc: 'Manage campaigns with geo targets', icon: Megaphone, to: '/ads' },
                { label: 'Ads Analytics', desc: 'Geo performance breakdowns', icon: BarChart3, to: '/ads/analytics' },
                { label: 'Services Marketplace', desc: 'Location-based services', icon: Globe, to: '/services' },
                { label: 'Jobs Discovery', desc: 'Location-aware job postings', icon: Users, to: '/jobs' },
                { label: 'Events', desc: 'Local events and meetups', icon: Activity, to: '/community' },
                { label: 'Billing', desc: 'Geo spend breakdown', icon: DollarSign, to: '/finance/billing' },
              ].map(h => (
                <Link key={h.label} to={h.to}>
                  <div className="rounded-2xl border p-3 hover:shadow-sm transition-all cursor-pointer hover:border-accent/30">
                    <div className="flex items-center gap-2 mb-1"><h.icon className="h-4 w-4 text-accent" /><span className="text-[10px] font-semibold">{h.label}</span></div>
                    <div className="text-[8px] text-muted-foreground">{h.desc}</div>
                    <div className="flex items-center gap-0.5 mt-1 text-[7px] text-accent"><span>Open</span><ChevronRight className="h-2.5 w-2.5" /></div>
                  </div>
                </Link>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Geo-Linked Records" icon={<MapPin className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1">
              {[
                { label: 'NYC Metro — 3 active campaigns', link: '/ads' },
                { label: 'London Hub — 2 services listed', link: '/services' },
                { label: 'SF Bay — 1 upcoming event', link: '/community' },
                { label: 'Mumbai Dev Hub — 5 job postings', link: '/jobs' },
              ].map(r => (
                <Link key={r.label} to={r.link}>
                  <div className="flex items-center gap-2 p-2 rounded-xl border hover:bg-muted/20 transition-colors text-[8px]">
                    <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="flex-1">{r.label}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ MOBILE MAP ═══ */}
      {tab === 'mobile' && (
        <div className="space-y-3">
          <div className="rounded-3xl bg-gradient-to-br from-accent/10 to-primary/10 border p-4">
            <div className="flex items-center gap-2 mb-2"><Globe className="h-5 w-5 text-accent" /><div><div className="text-sm font-bold">Geo Intelligence</div><div className="text-[8px] text-muted-foreground">Mobile summary view</div></div></div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {[{ l: 'Locations', v: '7' }, { l: 'Reach', v: '747K' }, { l: 'Spend', v: '$7,390' }, { l: 'Avg CTR', v: '3.12%' }].map(m => (
                <div key={m.l} className="rounded-2xl bg-card border p-2 text-center"><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-sm font-bold">{m.v}</div></div>
              ))}
            </div>
          </div>

          <SectionCard title="Top Locations" className="!rounded-2xl">
            <div className="space-y-1.5">
              {MARKERS.filter(m => m.status === 'active').slice(0, 4).map(m => (
                <div key={m.id} className="flex items-center gap-2 p-2 rounded-xl border hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedMarker(m)}>
                  <div className={cn('h-3 w-3 rounded-full shrink-0', TYPE_COLORS[m.type])} />
                  <div className="flex-1 min-w-0"><div className="text-[9px] font-medium truncate">{m.label}</div><div className="text-[7px] text-muted-foreground">{m.region}</div></div>
                  <div className="text-right shrink-0"><div className="text-[8px] font-semibold">{m.ctr}</div><div className="text-[7px] text-muted-foreground">{m.spend}</div></div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex gap-2">
            <Button className="flex-1 h-10 text-[10px] rounded-xl gap-1"><Map className="h-3.5 w-3.5" />Open Full Map</Button>
            <Button variant="outline" className="flex-1 h-10 text-[10px] rounded-xl gap-1"><Download className="h-3.5 w-3.5" />Export</Button>
          </div>
        </div>
      )}

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        <div className="flex-1"><span className="text-[10px] font-semibold">7 Locations</span><div className="text-[8px] text-muted-foreground">$7,390 spend · 3.12% CTR</div></div>
        <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-4"><Map className="h-3.5 w-3.5" />Map</Button>
      </div>

      <MarkerDrawer marker={selectedMarker} open={!!selectedMarker} onClose={() => setSelectedMarker(null)} />
    </DashboardLayout>
  );
};

export default MapGeoIntelPage;
