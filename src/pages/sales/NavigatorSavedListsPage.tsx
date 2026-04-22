import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Bookmark, Search, Plus, Users, Eye, MoreHorizontal, Clock, Share2,
  Download, Trash2, Edit, Lock, Globe, ChevronRight, Star,
} from 'lucide-react';
import { toast } from 'sonner';

interface SavedList {
  id: string; name: string; count: number; updated: string; owner: string;
  shared: boolean; type: 'leads' | 'talent' | 'accounts' | 'mixed';
  description: string; collaborators: string[];
}

const LISTS: SavedList[] = [
  { id: 'SL-1', name: 'Q2 Target CTOs', count: 24, updated: '2h ago', owner: 'You', shared: false, type: 'leads', description: 'C-level targets at Series B+ companies', collaborators: [] },
  { id: 'SL-2', name: 'FinTech Hiring Signals', count: 18, updated: '1d ago', owner: 'You', shared: true, type: 'leads', description: 'Companies actively hiring in FinTech vertical', collaborators: ['Sarah K.', 'Mike R.'] },
  { id: 'SL-3', name: 'Enterprise Prospects', count: 42, updated: '3d ago', owner: 'Team', shared: true, type: 'accounts', description: 'Enterprise accounts in qualification stage', collaborators: ['Alex K.', 'Lisa W.', 'Tom R.'] },
  { id: 'SL-4', name: 'Warm Intros Pipeline', count: 11, updated: '5d ago', owner: 'You', shared: false, type: 'leads', description: 'Prospects with 1st/2nd degree connections', collaborators: [] },
  { id: 'SL-5', name: 'Senior Engineers Q2', count: 18, updated: '2h ago', owner: 'You', shared: true, type: 'talent', description: 'Staff+ engineers open to new opportunities', collaborators: ['Sarah K.'] },
  { id: 'SL-6', name: 'ML/AI Candidates', count: 12, updated: '1d ago', owner: 'You', shared: false, type: 'talent', description: 'Machine learning talent for open roles', collaborators: [] },
];

const TYPE_COLORS: Record<string, string> = {
  leads: 'bg-accent/10 text-accent',
  talent: 'bg-primary/10 text-primary',
  accounts: 'bg-[hsl(var(--gigvora-blue))]/10 text-[hsl(var(--gigvora-blue))]',
  mixed: 'bg-muted text-muted-foreground',
};

const NavigatorSavedListsPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const topStrip = (
    <>
      <Bookmark className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Navigator — Saved Lists</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search lists..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[10px] w-44 focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />New List</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="List Summary" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {[
            { l: 'Total Lists', v: String(LISTS.length) },
            { l: 'Total Items', v: String(LISTS.reduce((s, l) => s + l.count, 0)) },
            { l: 'Shared Lists', v: String(LISTS.filter(l => l.shared).length) },
            { l: 'Private Lists', v: String(LISTS.filter(l => !l.shared).length) },
          ].map(s => (
            <div key={s.l} className="flex justify-between py-1 border-b last:border-0">
              <span className="text-muted-foreground">{s.l}</span>
              <span className="font-semibold">{s.v}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Total Lists" value={String(LISTS.length)} className="!rounded-2xl" />
        <KPICard label="Total Items" value={String(LISTS.reduce((s, l) => s + l.count, 0))} className="!rounded-2xl" />
        <KPICard label="Shared" value={String(LISTS.filter(l => l.shared).length)} className="!rounded-2xl" />
        <KPICard label="Last Updated" value="2h ago" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2">
        {LISTS.filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase())).map(l => (
          <div key={l.id} className="rounded-2xl border bg-card p-4 hover:shadow-md cursor-pointer transition-all group">
            <div className="flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', TYPE_COLORS[l.type])}>
                <Bookmark className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold group-hover:text-accent transition-colors">{l.name}</span>
                  {l.shared ? <Globe className="h-3 w-3 text-muted-foreground" /> : <Lock className="h-3 w-3 text-muted-foreground" />}
                  <Badge className={cn('text-[7px] border-0 capitalize', TYPE_COLORS[l.type])}>{l.type}</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{l.description}</div>
                <div className="flex items-center gap-2 mt-1 text-[8px] text-muted-foreground">
                  <span>{l.count} items</span>
                  <span>·</span>
                  <span>Updated {l.updated}</span>
                  <span>·</span>
                  <span>Owner: {l.owner}</span>
                  {l.collaborators.length > 0 && <span>· {l.collaborators.length} collaborator{l.collaborators.length > 1 ? 's' : ''}</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Eye className="h-2.5 w-2.5" />View</Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Share2 className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><MoreHorizontal className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default NavigatorSavedListsPage;
