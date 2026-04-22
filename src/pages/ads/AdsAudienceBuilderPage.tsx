import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Users, Search, Plus, Target, Eye, Settings, Layers, Globe,
  UserMinus, UserPlus, BarChart3, ChevronRight, Lock,
} from 'lucide-react';

type AudienceType = 'custom' | 'lookalike' | 'retargeting' | 'behavioral' | 'exclusion';
interface Audience {
  id: string; name: string; type: AudienceType; size: string;
  overlap: string; campaigns: number; description: string; lastUpdated: string;
}

const TYPE_COLORS: Record<AudienceType, string> = {
  custom: 'bg-accent/10 text-accent', lookalike: 'bg-primary/10 text-primary',
  retargeting: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  behavioral: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]',
  exclusion: 'bg-destructive/10 text-destructive',
};

const AUDIENCES: Audience[] = [
  { id: 'AUD-001', name: 'Tech Decision Makers', type: 'custom', size: '1.2M', overlap: '—', campaigns: 3, description: 'CTOs, VP Eng, Tech Leads at 50+ employee companies', lastUpdated: '1d ago' },
  { id: 'AUD-002', name: 'Lookalike — Top Converters', type: 'lookalike', size: '2.4M', overlap: '12%', campaigns: 2, description: '1% lookalike based on top 500 converters', lastUpdated: '3d ago' },
  { id: 'AUD-003', name: 'Site Visitors (30d)', type: 'retargeting', size: '45K', overlap: '8%', campaigns: 2, description: 'All website visitors in the past 30 days', lastUpdated: '1h ago' },
  { id: 'AUD-004', name: 'High-Intent Browsers', type: 'behavioral', size: '180K', overlap: '15%', campaigns: 1, description: 'Users who viewed pricing or signed up for trial', lastUpdated: '6h ago' },
  { id: 'AUD-005', name: 'Existing Customers', type: 'exclusion', size: '12K', overlap: '—', campaigns: 4, description: 'Current paying customers — excluded from acquisition', lastUpdated: '2d ago' },
  { id: 'AUD-006', name: 'HR & Recruiting Pros', type: 'custom', size: '890K', overlap: '—', campaigns: 2, description: 'HR Directors, Recruiters, Talent Partners', lastUpdated: '5d ago' },
  { id: 'AUD-007', name: 'Competitor Site Visitors', type: 'retargeting', size: '78K', overlap: '22%', campaigns: 1, description: 'Users who visited competitor domains via pixel', lastUpdated: '12h ago' },
];

const AdsAudienceBuilderPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const topStrip = (
    <>
      <Users className="h-4 w-4 text-[hsl(var(--gigvora-blue))]" />
      <span className="text-xs font-semibold">Ads — Audience Builder</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search audiences..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[10px] w-44 focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />New Audience</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Audience Tools" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {[
            { l: 'Custom Audience', desc: 'Upload list or define rules' },
            { l: 'Lookalike Builder', desc: 'Find similar users' },
            { l: 'Retargeting Pixel', desc: 'Website visitor tracking' },
            { l: 'Exclusion Rules', desc: 'Prevent overlap spend' },
            { l: 'Overlap Analysis', desc: 'Check audience intersection' },
          ].map(t => (
            <button key={t.l} className="flex items-center gap-1.5 p-1.5 rounded-lg w-full text-left hover:bg-muted/30 transition-colors">
              <div><div className="font-medium">{t.l}</div><div className="text-[8px] text-muted-foreground">{t.desc}</div></div>
              <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Total Audiences" value={String(AUDIENCES.length)} className="!rounded-2xl" />
        <KPICard label="Total Reach" value="4.8M" className="!rounded-2xl" />
        <KPICard label="Exclusions" value={String(AUDIENCES.filter(a => a.type === 'exclusion').length)} className="!rounded-2xl" />
        <KPICard label="Active in Campaigns" value={String(AUDIENCES.filter(a => a.campaigns > 0).length)} className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2">
        {AUDIENCES.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase())).map(a => (
          <div key={a.id} className="rounded-2xl border bg-card p-4 hover:shadow-md cursor-pointer transition-all group">
            <div className="flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', TYPE_COLORS[a.type])}>
                {a.type === 'exclusion' ? <UserMinus className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[12px] font-bold group-hover:text-accent transition-colors">{a.name}</span>
                  <Badge className={cn('text-[7px] border-0 capitalize', TYPE_COLORS[a.type])}>{a.type}</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground">{a.description}</div>
                <div className="flex items-center gap-3 mt-1 text-[8px] text-muted-foreground">
                  <span>Size: {a.size}</span>
                  {a.overlap !== '—' && <span>Overlap: {a.overlap}</span>}
                  <span>{a.campaigns} campaigns</span>
                  <span>Updated {a.lastUpdated}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Eye className="h-2.5 w-2.5" />View</Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdsAudienceBuilderPage;
