import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Users, Plus, Search, Eye, Copy, Trash2, MoreHorizontal, Clock,
  Target, AlertTriangle, TrendingUp, RefreshCw, Filter, Layers,
} from 'lucide-react';

interface SavedAudience {
  id: string; name: string; type: 'custom' | 'lookalike' | 'retargeting';
  size: number; reach: number; overlap: number;
  status: 'ready' | 'building' | 'expired'; updated: string;
  criteria: string[]; campaigns: number;
}

const AUDIENCES: SavedAudience[] = [
  { id: 'A1', name: 'Engineering Decision Makers', type: 'custom', size: 124000, reach: 89000, overlap: 12, status: 'ready', updated: '2h ago', criteria: ['Title: VP/Director/CTO', 'Industry: Tech', 'Company Size: 50-500'], campaigns: 3 },
  { id: 'A2', name: 'Lookalike — Top Converters Q1', type: 'lookalike', size: 340000, reach: 245000, overlap: 8, status: 'ready', updated: '1d ago', criteria: ['Source: Q1 converters', 'Similarity: 1%', 'Region: US'], campaigns: 2 },
  { id: 'A3', name: 'Website Visitors — 30 Days', type: 'retargeting', size: 18500, reach: 15200, overlap: 34, status: 'ready', updated: '6h ago', criteria: ['Pixel: Main site', 'Window: 30 days', 'Exclude: Converted'], campaigns: 4 },
  { id: 'A4', name: 'Job Poster Retargeting', type: 'retargeting', size: 8900, reach: 7100, overlap: 22, status: 'building', updated: '3h ago', criteria: ['Action: Posted job', 'Window: 14 days'], campaigns: 0 },
  { id: 'A5', name: 'Expired — Q4 Event Attendees', type: 'custom', size: 5600, reach: 0, overlap: 0, status: 'expired', updated: '45d ago', criteria: ['Event: Q4 Summit', 'RSVP: Confirmed'], campaigns: 0 },
];

const TYPE_COLORS: Record<string, string> = {
  custom: 'bg-accent/10 text-accent',
  lookalike: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]',
  retargeting: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
};

const AdsSavedAudiencesPage: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'custom' | 'lookalike' | 'retargeting'>('all');
  const filtered = AUDIENCES.filter(a => typeFilter === 'all' || a.type === typeFilter);

  const topStrip = (
    <>
      <Users className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Ads — Saved Audiences & Retargeting</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['all', 'custom', 'lookalike', 'retargeting'] as const).map(f => (
          <button key={f} onClick={() => setTypeFilter(f)} className={cn('px-2.5 py-1 rounded-lg text-[9px] font-medium transition-colors capitalize', typeFilter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{f}</button>
        ))}
      </div>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />New Audience</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Overlap Warnings" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {AUDIENCES.filter(a => a.overlap > 20).map(a => (
            <div key={a.id} className="flex items-center gap-1.5 text-[hsl(var(--state-caution))]">
              <AlertTriangle className="h-3 w-3" />
              <span className="truncate">{a.name}</span>
              <span className="font-semibold">{a.overlap}%</span>
            </div>
          ))}
          {AUDIENCES.filter(a => a.overlap > 20).length === 0 && <span className="text-muted-foreground">No overlap issues</span>}
        </div>
      </SectionCard>
      <SectionCard title="By Type" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {(['custom', 'lookalike', 'retargeting'] as const).map(t => (
            <div key={t} className="flex items-center gap-2">
              <Badge className={cn('text-[7px] border-0 capitalize w-16 justify-center rounded-lg', TYPE_COLORS[t])}>{t}</Badge>
              <span className="font-semibold">{AUDIENCES.filter(a => a.type === t).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Saved Audiences" value={String(AUDIENCES.length)} change={`${AUDIENCES.filter(a => a.status === 'ready').length} ready`} className="!rounded-2xl" />
        <KPICard label="Total Reach" value={fmt(AUDIENCES.reduce((s, a) => s + a.reach, 0))} change="Combined" className="!rounded-2xl" />
        <KPICard label="Active Campaigns" value={String(AUDIENCES.reduce((s, a) => s + a.campaigns, 0))} change="Using audiences" className="!rounded-2xl" />
        <KPICard label="Retargeting Pools" value={String(AUDIENCES.filter(a => a.type === 'retargeting').length)} change="Active" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {filtered.map(aud => (
          <div key={aud.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3 mb-2.5">
              <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', TYPE_COLORS[aud.type])}>
                {aud.type === 'retargeting' ? <RefreshCw className="h-4 w-4" /> : aud.type === 'lookalike' ? <Layers className="h-4 w-4" /> : <Target className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold truncate">{aud.name}</span>
                  <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', TYPE_COLORS[aud.type])}>{aud.type}</Badge>
                  <StatusBadge status={aud.status === 'ready' ? 'healthy' : aud.status === 'building' ? 'pending' : 'blocked'} label={aud.status} />
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{aud.updated}</span>
                  <span>·</span>
                  <span>{aud.campaigns} campaigns</span>
                  {aud.overlap > 15 && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 text-[hsl(var(--state-caution))]"><AlertTriangle className="h-2.5 w-2.5" />{aud.overlap}% overlap</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Eye className="h-3 w-3" />View</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Copy className="h-3 w-3" />Clone</Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              {aud.criteria.map(c => (
                <Badge key={c} variant="outline" className="text-[8px] h-4 rounded-lg">{c}</Badge>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-muted/30 p-2.5">
                <div className="text-[9px] text-muted-foreground mb-0.5">Audience Size</div>
                <div className="text-[11px] font-bold">{fmt(aud.size)}</div>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5">
                <div className="text-[9px] text-muted-foreground mb-0.5">Est. Reach</div>
                <div className="text-[11px] font-bold">{fmt(aud.reach)}</div>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5">
                <div className="text-[9px] text-muted-foreground mb-0.5">Overlap</div>
                <div className={cn('text-[11px] font-bold', aud.overlap > 20 ? 'text-[hsl(var(--state-caution))]' : '')}>{aud.overlap}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdsSavedAudiencesPage;
