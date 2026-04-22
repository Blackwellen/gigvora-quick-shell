import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Layers, Search, Plus, Settings, Target, Users, DollarSign,
  Globe, Clock, Eye, Play, Pause, MoreHorizontal, Edit, Copy,
} from 'lucide-react';

interface AdSet {
  id: string; name: string; campaign: string; status: 'active' | 'paused' | 'draft';
  budget: string; spent: string; audience: string; reach: string;
  impressions: string; clicks: string; ctr: string; placements: string[];
}

const AD_SETS: AdSet[] = [
  { id: 'AS-001', name: 'Tech Decision Makers', campaign: 'Q2 Brand Awareness', status: 'active', budget: '$2,000', spent: '$940', audience: 'CTOs, VP Eng · 25-54', reach: '1.2M', impressions: '62K', clicks: '1.4K', ctr: '2.3%', placements: ['Feed', 'Sidebar'] },
  { id: 'AS-002', name: 'Startup Founders', campaign: 'Q2 Brand Awareness', status: 'active', budget: '$1,500', spent: '$720', audience: 'Founders, CEOs · 28-45', reach: '890K', impressions: '48K', clicks: '1.1K', ctr: '2.3%', placements: ['Feed', 'Stories'] },
  { id: 'AS-003', name: 'Enterprise HR', campaign: 'Recruiter Pro Launch', status: 'active', budget: '$3,000', spent: '$1,560', audience: 'HR Directors, VP People · 30-55', reach: '560K', impressions: '34K', clicks: '1.8K', ctr: '5.3%', placements: ['Feed', 'Sidebar', 'Stories'] },
  { id: 'AS-004', name: 'SMB Recruiters', campaign: 'Recruiter Pro Launch', status: 'paused', budget: '$2,000', spent: '$890', audience: 'Recruiters · 25-45', reach: '1.5M', impressions: '22K', clicks: '980', ctr: '4.5%', placements: ['Feed'] },
  { id: 'AS-005', name: 'Freelancer Retarget', campaign: 'Freelancer Retargeting', status: 'paused', budget: '$1,500', spent: '$900', audience: 'Site visitors · Past 30d', reach: '45K', impressions: '34K', clicks: '920', ctr: '2.7%', placements: ['Feed', 'Stories'] },
];

const AdsAdSetBuilderPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const topStrip = (
    <>
      <Layers className="h-4 w-4 text-primary" />
      <span className="text-xs font-semibold">Ads — Ad Set Builder</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ad sets..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[10px] w-44 focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />New Ad Set</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Ad Set Config" className="!rounded-2xl">
        <p className="text-[9px] text-muted-foreground">Select an ad set to configure targeting, placements, budget, and schedule.</p>
        <div className="mt-2 space-y-1 text-[9px]">
          {['Targeting Rules', 'Placement Selection', 'Budget & Schedule', 'Bid Strategy', 'Optimization Goal'].map(s => (
            <div key={s} className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-muted/30 cursor-pointer">
              <Settings className="h-3 w-3 text-muted-foreground" /><span>{s}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Total Ad Sets" value={String(AD_SETS.length)} className="!rounded-2xl" />
        <KPICard label="Active" value={String(AD_SETS.filter(a => a.status === 'active').length)} className="!rounded-2xl" />
        <KPICard label="Avg CTR" value="3.4%" change="+0.5%" trend="up" className="!rounded-2xl" />
        <KPICard label="Total Budget" value="$10K" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2">
        {AD_SETS.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase())).map(a => (
          <div key={a.id} className="rounded-2xl border bg-card p-4 hover:shadow-md cursor-pointer transition-all group">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[12px] font-bold group-hover:text-accent transition-colors">{a.name}</span>
                  <Badge className={cn('text-[7px] border-0 capitalize', a.status === 'active' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]')}>{a.status}</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground">Campaign: {a.campaign}</div>
                <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground">
                  <span><Users className="h-2.5 w-2.5 inline" /> {a.audience}</span>
                  <span>· Reach: {a.reach}</span>
                </div>
                <div className="flex gap-1 mt-1">{a.placements.map(p => <Badge key={p} variant="secondary" className="text-[7px]">{p}</Badge>)}</div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-[9px] shrink-0">
                <div><div className="font-bold">{a.impressions}</div><div className="text-[7px] text-muted-foreground">Impr</div></div>
                <div><div className="font-bold">{a.clicks}</div><div className="text-[7px] text-muted-foreground">Clicks</div></div>
                <div><div className="font-bold">{a.ctr}</div><div className="text-[7px] text-muted-foreground">CTR</div></div>
              </div>
              <div className="text-right text-[9px] shrink-0">
                <div className="font-bold">{a.spent}</div>
                <div className="text-[7px] text-muted-foreground">of {a.budget}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdsAdSetBuilderPage;
