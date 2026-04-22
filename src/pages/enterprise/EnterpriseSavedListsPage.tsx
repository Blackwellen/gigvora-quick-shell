import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Bookmark, Search, Plus, Eye, Building2, Star, Clock,
  Users, Bell, Trash2, Edit, Share2,
} from 'lucide-react';

interface SavedList {
  id: string; name: string; type: 'watch' | 'saved' | 'prospect' | 'partner';
  count: number; lastUpdated: string; shared: boolean; notifications: boolean;
  description: string;
}

const TYPE_COLORS: Record<string, string> = {
  watch: 'bg-[hsl(var(--state-live))]/10 text-[hsl(var(--state-live))]',
  saved: 'bg-accent/10 text-accent',
  prospect: 'bg-primary/10 text-primary',
  partner: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]',
};

const LISTS: SavedList[] = [
  { id: 'SL-1', name: 'Key Accounts — Q2', type: 'watch', count: 18, lastUpdated: '2h ago', shared: true, notifications: true, description: 'Top priority accounts for Q2 partnership push' },
  { id: 'SL-2', name: 'Cloud Infrastructure Partners', type: 'partner', count: 12, lastUpdated: '1d ago', shared: true, notifications: true, description: 'Potential cloud infrastructure partnership candidates' },
  { id: 'SL-3', name: 'Healthcare Procurement Targets', type: 'prospect', count: 24, lastUpdated: '3d ago', shared: false, notifications: false, description: 'Healthcare orgs with active procurement needs' },
  { id: 'SL-4', name: 'Competitor Watch List', type: 'watch', count: 8, lastUpdated: '6h ago', shared: false, notifications: true, description: 'Monitoring competitor enterprise activities' },
  { id: 'SL-5', name: 'Event Connections — Summit 2026', type: 'saved', count: 34, lastUpdated: '5d ago', shared: true, notifications: false, description: 'Contacts made at Enterprise Connect Summit' },
  { id: 'SL-6', name: 'Fintech Buyers', type: 'prospect', count: 15, lastUpdated: '2d ago', shared: false, notifications: true, description: 'Financial services organizations showing buyer intent' },
];

const EnterpriseSavedListsPage: React.FC = () => {
  const topStrip = (
    <>
      <Bookmark className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Saved Enterprise Lists</span>
      <div className="flex-1" />
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />New List</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="List Types" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {(['watch', 'saved', 'prospect', 'partner'] as const).map(t => (
            <div key={t} className="flex justify-between">
              <Badge className={cn('text-[7px] border-0 capitalize', TYPE_COLORS[t])}>{t}</Badge>
              <span className="font-semibold">{LISTS.filter(l => l.type === t).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-44">
      <KPIBand className="mb-3">
        <KPICard label="Total Lists" value={String(LISTS.length)} className="!rounded-2xl" />
        <KPICard label="Total Saved" value={String(LISTS.reduce((s, l) => s + l.count, 0))} className="!rounded-2xl" />
        <KPICard label="Shared" value={String(LISTS.filter(l => l.shared).length)} className="!rounded-2xl" />
        <KPICard label="With Alerts" value={String(LISTS.filter(l => l.notifications).length)} className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2">
        {LISTS.map(l => (
          <div key={l.id} className="rounded-2xl border bg-card p-4 hover:shadow-md cursor-pointer transition-all group">
            <div className="flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', TYPE_COLORS[l.type])}>
                <Bookmark className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[12px] font-bold group-hover:text-accent transition-colors">{l.name}</span>
                  <Badge className={cn('text-[7px] border-0 capitalize', TYPE_COLORS[l.type])}>{l.type}</Badge>
                  {l.shared && <Share2 className="h-2.5 w-2.5 text-muted-foreground" />}
                  {l.notifications && <Bell className="h-2.5 w-2.5 text-accent" />}
                </div>
                <div className="text-[9px] text-muted-foreground">{l.description}</div>
                <div className="flex items-center gap-2 mt-1 text-[8px] text-muted-foreground">
                  <span><Building2 className="h-2.5 w-2.5 inline" /> {l.count} enterprises</span>
                  <span><Clock className="h-2.5 w-2.5 inline" /> Updated {l.lastUpdated}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg"><Eye className="h-2.5 w-2.5" /></Button>
                <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg"><Edit className="h-2.5 w-2.5" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default EnterpriseSavedListsPage;
