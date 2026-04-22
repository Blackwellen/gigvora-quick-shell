import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Megaphone, Search, Filter, Plus, Play, Pause, Eye, BarChart3,
  DollarSign, TrendingUp, Clock, MoreHorizontal, ChevronRight,
  Target, MousePointer, ArrowRight,
} from 'lucide-react';

type CStatus = 'active' | 'paused' | 'draft' | 'completed' | 'review';
interface Campaign {
  id: string; name: string; status: CStatus; objective: string;
  budget: string; spent: string; impressions: string; clicks: string;
  ctr: string; conversions: number; roas: string; pacing: number;
  startDate: string; endDate: string;
}

const STATUS_COLORS: Record<CStatus, string> = {
  active: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  paused: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  draft: 'bg-muted text-muted-foreground',
  completed: 'bg-accent/10 text-accent',
  review: 'bg-primary/10 text-primary',
};

const CAMPAIGNS: Campaign[] = [
  { id: 'CMP-001', name: 'Q2 Brand Awareness', status: 'active', objective: 'Awareness', budget: '$5,000', spent: '$2,340', impressions: '145K', clicks: '3.2K', ctr: '2.2%', conversions: 45, roas: '3.4x', pacing: 47, startDate: 'Mar 15', endDate: 'May 15' },
  { id: 'CMP-002', name: 'Recruiter Pro Launch', status: 'active', objective: 'Conversion', budget: '$8,000', spent: '$4,120', impressions: '89K', clicks: '4.5K', ctr: '5.1%', conversions: 123, roas: '5.2x', pacing: 52, startDate: 'Apr 1', endDate: 'Jun 1' },
  { id: 'CMP-003', name: 'Freelancer Retargeting', status: 'paused', objective: 'Consideration', budget: '$3,000', spent: '$1,800', impressions: '67K', clicks: '1.8K', ctr: '2.7%', conversions: 34, roas: '2.8x', pacing: 60, startDate: 'Feb 20', endDate: 'Apr 20' },
  { id: 'CMP-004', name: 'Enterprise ABM Campaign', status: 'active', objective: 'Conversion', budget: '$12,000', spent: '$3,600', impressions: '34K', clicks: '890', ctr: '2.6%', conversions: 18, roas: '4.8x', pacing: 30, startDate: 'Apr 5', endDate: 'Jul 5' },
  { id: 'CMP-005', name: 'Summer Gig Promo', status: 'draft', objective: 'Awareness', budget: '$4,000', spent: '$0', impressions: '0', clicks: '0', ctr: '—', conversions: 0, roas: '—', pacing: 0, startDate: 'May 1', endDate: 'Jul 31' },
  { id: 'CMP-006', name: 'Webinar Series Ads', status: 'completed', objective: 'Engagement', budget: '$2,500', spent: '$2,480', impressions: '112K', clicks: '5.1K', ctr: '4.6%', conversions: 89, roas: '6.1x', pacing: 99, startDate: 'Jan 15', endDate: 'Mar 15' },
];

const AdsCampaignListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = CAMPAIGNS.filter(c => {
    const ms = !search || c.name.toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === 'all' || c.status === statusFilter;
    return ms && mf;
  });

  const topStrip = (
    <>
      <Megaphone className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Ads — Campaign List</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[10px] w-48 focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px]">
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="draft">Draft</option>
        <option value="completed">Completed</option>
      </select>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />New Campaign</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Status Summary" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {(['active', 'paused', 'draft', 'completed'] as CStatus[]).map(s => (
            <div key={s} className="flex justify-between">
              <Badge className={cn('text-[7px] border-0 capitalize', STATUS_COLORS[s])}>{s}</Badge>
              <span className="font-semibold">{CAMPAIGNS.filter(c => c.status === s).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <SectionBackNav homeRoute="/ads" homeLabel="Ads Manager" currentLabel="Campaigns" icon={<Megaphone className="h-3 w-3" />} />
      <KPIBand className="mb-3">
        <KPICard label="Total Campaigns" value={String(CAMPAIGNS.length)} className="!rounded-2xl" />
        <KPICard label="Active" value={String(CAMPAIGNS.filter(c => c.status === 'active').length)} className="!rounded-2xl" />
        <KPICard label="Total Spend" value="$14.3K" change="MTD" className="!rounded-2xl" />
        <KPICard label="Avg ROAS" value="4.5x" change="+0.6x" trend="up" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="rounded-2xl border bg-card p-4 hover:shadow-md cursor-pointer transition-all group">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[12px] font-bold group-hover:text-accent transition-colors">{c.name}</span>
                  <Badge className={cn('text-[7px] border-0 capitalize', STATUS_COLORS[c.status])}>{c.status}</Badge>
                  <Badge variant="secondary" className="text-[7px]">{c.objective}</Badge>
                </div>
                <div className="flex items-center gap-4 text-[9px] text-muted-foreground">
                  <span><DollarSign className="h-2.5 w-2.5 inline" /> Budget: {c.budget}</span>
                  <span>Spent: {c.spent}</span>
                  <span>{c.startDate} — {c.endDate}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center text-[9px] shrink-0">
                <div><div className="text-sm font-bold">{c.impressions}</div><div className="text-[7px] text-muted-foreground">Impr</div></div>
                <div><div className="text-sm font-bold">{c.clicks}</div><div className="text-[7px] text-muted-foreground">Clicks</div></div>
                <div><div className="text-sm font-bold">{c.ctr}</div><div className="text-[7px] text-muted-foreground">CTR</div></div>
                <div><div className="text-sm font-bold text-accent">{c.roas}</div><div className="text-[7px] text-muted-foreground">ROAS</div></div>
              </div>
            </div>
            {c.pacing > 0 && (
              <div className="mt-2 pt-2 border-t">
                <div className="flex justify-between text-[8px] mb-0.5"><span className="text-muted-foreground">Budget Pacing</span><span className="font-semibold">{c.pacing}%</span></div>
                <Progress value={c.pacing} className="h-1" />
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdsCampaignListPage;
