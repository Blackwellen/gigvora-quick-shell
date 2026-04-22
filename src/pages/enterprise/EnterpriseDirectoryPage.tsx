import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
// Filter panel available via ENTERPRISE_DIRECTORY_FILTERS
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Building2, Search, Filter, Globe, MapPin, Shield, Star,
  Users, TrendingUp, Eye, Bookmark, UserPlus, ChevronRight,
  CheckCircle2, Target,
} from 'lucide-react';

type TrustTier = 'platinum' | 'gold' | 'silver' | 'verified' | 'new';
interface Enterprise {
  id: string; name: string; avatar: string; sector: string; region: string;
  size: string; trustTier: TrustTier; trustScore: number; partnerships: number;
  connections: number; services: string[]; buyerReady: boolean; verified: boolean;
  founded: string;
}

const TRUST_COLORS: Record<TrustTier, string> = {
  platinum: 'bg-[hsl(var(--gigvora-blue))]/10 text-[hsl(var(--gigvora-blue))]',
  gold: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  silver: 'bg-muted text-muted-foreground',
  verified: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  new: 'bg-accent/10 text-accent',
};

const ENTERPRISES: Enterprise[] = [
  { id: 'E-1', name: 'Acme Corporation', avatar: 'AC', sector: 'Technology', region: 'North America', size: '1,000-5,000', trustTier: 'platinum', trustScore: 98, partnerships: 24, connections: 156, services: ['Cloud Infrastructure', 'AI/ML', 'DevOps'], buyerReady: true, verified: true, founded: '2008' },
  { id: 'E-2', name: 'TechVentures Ltd', avatar: 'TV', sector: 'Technology', region: 'Europe', size: '500-1,000', trustTier: 'gold', trustScore: 92, partnerships: 15, connections: 89, services: ['SaaS', 'Consulting', 'Integration'], buyerReady: true, verified: true, founded: '2012' },
  { id: 'E-3', name: 'GlobalHealth Inc', avatar: 'GH', sector: 'Healthcare', region: 'North America', size: '5,000-10,000', trustTier: 'platinum', trustScore: 96, partnerships: 31, connections: 234, services: ['Health Tech', 'Data Analytics', 'Compliance'], buyerReady: false, verified: true, founded: '2005' },
  { id: 'E-4', name: 'CloudScale Systems', avatar: 'CS', sector: 'Cloud', region: 'Asia Pacific', size: '200-500', trustTier: 'gold', trustScore: 88, partnerships: 8, connections: 45, services: ['Cloud Migration', 'Kubernetes', 'Monitoring'], buyerReady: true, verified: true, founded: '2016' },
  { id: 'E-5', name: 'FinanceFirst Group', avatar: 'FF', sector: 'Finance', region: 'Europe', size: '2,000-5,000', trustTier: 'silver', trustScore: 82, partnerships: 11, connections: 67, services: ['Banking API', 'Compliance', 'Risk'], buyerReady: false, verified: true, founded: '2010' },
  { id: 'E-6', name: 'GreenEnergy Solutions', avatar: 'GE', sector: 'Energy', region: 'North America', size: '100-200', trustTier: 'verified', trustScore: 75, partnerships: 3, connections: 22, services: ['Solar', 'IoT', 'Energy Management'], buyerReady: true, verified: true, founded: '2019' },
  { id: 'E-7', name: 'DataFlow Analytics', avatar: 'DA', sector: 'Data', region: 'North America', size: '50-100', trustTier: 'new', trustScore: 68, partnerships: 1, connections: 12, services: ['Business Intelligence', 'ETL', 'Dashboards'], buyerReady: false, verified: false, founded: '2023' },
];

const EnterpriseDirectoryPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  const filtered = ENTERPRISES.filter(e => {
    const ms = !search || e.name.toLowerCase().includes(search.toLowerCase());
    const mse = sectorFilter === 'all' || e.sector === sectorFilter;
    const mr = regionFilter === 'all' || e.region === regionFilter;
    return ms && mse && mr;
  });

  const topStrip = (
    <>
      <Building2 className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Enterprise Directory</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search enterprises..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[10px] w-48 focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>
      <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px]">
        <option value="all">All Sectors</option>
        {['Technology', 'Healthcare', 'Cloud', 'Finance', 'Energy', 'Data'].map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px]">
        <option value="all">All Regions</option>
        {['North America', 'Europe', 'Asia Pacific'].map(r => <option key={r} value={r}>{r}</option>)}
      </select>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Trust Tiers" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {(['platinum', 'gold', 'silver', 'verified', 'new'] as TrustTier[]).map(t => (
            <div key={t} className="flex justify-between items-center">
              <Badge className={cn('text-[7px] border-0 capitalize', TRUST_COLORS[t])}>{t}</Badge>
              <span className="font-semibold">{ENTERPRISES.filter(e => e.trustTier === t).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Filters" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {['Buyer Ready', 'Verified Only', 'Partnership Open', 'Recently Active'].map(f => (
            <label key={f} className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-muted/30 cursor-pointer">
              <input type="checkbox" className="rounded border-muted-foreground/30 h-3 w-3" />
              <span>{f}</span>
            </label>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <SectionBackNav homeRoute="/enterprise-connect" homeLabel="Enterprise Connect" currentLabel="Directory" icon={<Building2 className="h-3 w-3" />} />
      <KPIBand className="mb-3">
        <KPICard label="Total Enterprises" value={String(ENTERPRISES.length)} className="!rounded-2xl" />
        <KPICard label="Buyer Ready" value={String(ENTERPRISES.filter(e => e.buyerReady).length)} className="!rounded-2xl" />
        <KPICard label="Verified" value={String(ENTERPRISES.filter(e => e.verified).length)} className="!rounded-2xl" />
        <KPICard label="Avg Trust Score" value="86" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2">
        {filtered.map(e => (
          <div key={e.id} className="rounded-2xl border bg-card p-4 hover:shadow-md cursor-pointer transition-all group">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 rounded-xl">
                <AvatarFallback className="rounded-xl bg-accent/10 text-accent text-[10px] font-bold">{e.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[12px] font-bold group-hover:text-accent transition-colors">{e.name}</span>
                  {e.verified && <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" />}
                  <Badge className={cn('text-[7px] border-0 capitalize', TRUST_COLORS[e.trustTier])}>{e.trustTier}</Badge>
                  {e.buyerReady && <Badge className="bg-[hsl(var(--state-live))]/10 text-[hsl(var(--state-live))] text-[7px] border-0">Buyer Ready</Badge>}
                </div>
                <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                  <span>{e.sector}</span>
                  <span>·</span>
                  <span><MapPin className="h-2.5 w-2.5 inline" /> {e.region}</span>
                  <span>·</span>
                  <span>{e.size} employees</span>
                  <span>·</span>
                  <span>Est. {e.founded}</span>
                </div>
                <div className="flex gap-1 mt-1.5">
                  {e.services.slice(0, 3).map(s => <Badge key={s} variant="secondary" className="text-[7px]">{s}</Badge>)}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[9px] shrink-0">
                <div><div className="font-bold text-accent">{e.trustScore}</div><div className="text-[7px] text-muted-foreground">Trust</div></div>
                <div><div className="font-bold">{e.partnerships}</div><div className="text-[7px] text-muted-foreground">Partners</div></div>
                <div><div className="font-bold">{e.connections}</div><div className="text-[7px] text-muted-foreground">Conn</div></div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Eye className="h-2.5 w-2.5" />View</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Bookmark className="h-2.5 w-2.5" />Save</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default EnterpriseDirectoryPage;
