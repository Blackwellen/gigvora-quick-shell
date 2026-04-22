import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Hash, Search, Plus, TrendingUp, TrendingDown, DollarSign,
  Ban, Target, Star, Download, Filter, Eye,
} from 'lucide-react';

type MatchType = 'exact' | 'phrase' | 'broad';
interface Keyword {
  id: string; keyword: string; matchType: MatchType; impressions: string;
  clicks: string; ctr: string; cpc: string; conversions: string;
  spend: string; quality: number; trend: 'up' | 'down' | 'flat';
  negative: boolean;
}

const MATCH_COLORS: Record<MatchType, string> = {
  exact: 'bg-accent/10 text-accent', phrase: 'bg-primary/10 text-primary', broad: 'bg-muted text-muted-foreground',
};

const KEYWORDS: Keyword[] = [
  { id: 'K-001', keyword: 'hiring platform', matchType: 'exact', impressions: '12K', clicks: '340', ctr: '2.8%', cpc: '$1.20', conversions: '18', spend: '$408', quality: 9, trend: 'up', negative: false },
  { id: 'K-002', keyword: 'freelance marketplace', matchType: 'phrase', impressions: '8.5K', clicks: '210', ctr: '2.5%', cpc: '$0.95', conversions: '12', spend: '$200', quality: 8, trend: 'up', negative: false },
  { id: 'K-003', keyword: 'gig economy software', matchType: 'broad', impressions: '15K', clicks: '180', ctr: '1.2%', cpc: '$1.80', conversions: '6', spend: '$324', quality: 6, trend: 'flat', negative: false },
  { id: 'K-004', keyword: 'remote work tools', matchType: 'exact', impressions: '22K', clicks: '890', ctr: '4.0%', cpc: '$0.65', conversions: '45', spend: '$579', quality: 9, trend: 'up', negative: false },
  { id: 'K-005', keyword: 'recruiter software', matchType: 'phrase', impressions: '6.2K', clicks: '155', ctr: '2.5%', cpc: '$2.10', conversions: '8', spend: '$326', quality: 7, trend: 'down', negative: false },
  { id: 'K-006', keyword: 'free job posting', matchType: 'exact', impressions: '—', clicks: '—', ctr: '—', cpc: '—', conversions: '—', spend: '—', quality: 0, trend: 'flat', negative: true },
  { id: 'K-007', keyword: 'cheap freelancers', matchType: 'phrase', impressions: '—', clicks: '—', ctr: '—', cpc: '—', conversions: '—', spend: '—', quality: 0, trend: 'flat', negative: true },
];

const AdsKeywordBuilderPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showNeg, setShowNeg] = useState(false);

  const filtered = KEYWORDS.filter(k => {
    const ms = !search || k.keyword.toLowerCase().includes(search.toLowerCase());
    const mn = showNeg ? k.negative : !k.negative;
    return ms && mn;
  });

  const topStrip = (
    <>
      <Hash className="h-4 w-4 text-primary" />
      <span className="text-xs font-semibold">Ads — Keyword Builder</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search keywords..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[10px] w-44 focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>
      <Button variant={showNeg ? 'default' : 'outline'} size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setShowNeg(!showNeg)}><Ban className="h-3 w-3" />Negatives</Button>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />Add Keyword</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Keyword Suggestions" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {['talent marketplace', 'contract work platform', 'enterprise hiring', 'project staffing'].map(s => (
            <div key={s} className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-muted/30 cursor-pointer">
              <Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />
              <span className="flex-1">{s}</span>
              <Plus className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Match Types" className="!rounded-2xl">
        <div className="space-y-1 text-[9px] text-muted-foreground">
          <div><Badge className="bg-accent/10 text-accent text-[7px] border-0">Exact</Badge> [keyword] — exact match only</div>
          <div><Badge className="bg-primary/10 text-primary text-[7px] border-0">Phrase</Badge> "keyword" — phrase contains</div>
          <div><Badge className="bg-muted text-muted-foreground text-[7px] border-0">Broad</Badge> keyword — broad relevance</div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Active Keywords" value={String(KEYWORDS.filter(k => !k.negative).length)} className="!rounded-2xl" />
        <KPICard label="Negative Keywords" value={String(KEYWORDS.filter(k => k.negative).length)} className="!rounded-2xl" />
        <KPICard label="Avg Quality" value="7.8" change="/10" className="!rounded-2xl" />
        <KPICard label="Total Spend" value="$1,837" change="Keywords" className="!rounded-2xl" />
      </KPIBand>

      <div className="rounded-2xl border overflow-hidden">
        <table className="w-full text-[9px]">
          <thead className="bg-muted/50">
            <tr>{['Keyword', 'Match', 'Impr', 'Clicks', 'CTR', 'CPC', 'Conv', 'Spend', 'Quality', 'Trend'].map(h => (
              <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.map(k => (
              <tr key={k.id} className="border-t hover:bg-muted/20 cursor-pointer transition-colors">
                <td className="px-3 py-2.5 font-medium flex items-center gap-1">{k.negative && <Ban className="h-3 w-3 text-destructive" />}{k.keyword}</td>
                <td className="px-3 py-2.5"><Badge className={cn('text-[7px] border-0 capitalize', MATCH_COLORS[k.matchType])}>{k.matchType}</Badge></td>
                <td className="px-3 py-2.5">{k.impressions}</td>
                <td className="px-3 py-2.5">{k.clicks}</td>
                <td className="px-3 py-2.5">{k.ctr}</td>
                <td className="px-3 py-2.5">{k.cpc}</td>
                <td className="px-3 py-2.5">{k.conversions}</td>
                <td className="px-3 py-2.5">{k.spend}</td>
                <td className="px-3 py-2.5">{k.quality > 0 ? <span className={cn('font-bold', k.quality >= 8 ? 'text-[hsl(var(--state-healthy))]' : k.quality >= 6 ? 'text-[hsl(var(--gigvora-amber))]' : 'text-destructive')}>{k.quality}</span> : '—'}</td>
                <td className="px-3 py-2.5">{k.trend === 'up' ? <TrendingUp className="h-3 w-3 text-[hsl(var(--state-healthy))]" /> : k.trend === 'down' ? <TrendingDown className="h-3 w-3 text-destructive" /> : <span className="text-muted-foreground">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default AdsKeywordBuilderPage;
