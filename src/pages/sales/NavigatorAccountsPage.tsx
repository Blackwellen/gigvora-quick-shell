import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { AdvancedFilterPanel, NAVIGATOR_ACCOUNTS_FILTERS, FilterValues } from '@/components/shell/AdvancedFilterPanel';
import { cn } from '@/lib/utils';
import {
  Building2, Search, MapPin, Users, Zap, TrendingUp, Globe, Eye,
  Bookmark, BookmarkCheck, MoreHorizontal, ArrowUpRight, Filter,
  ChevronRight, Download, Plus, Clock, Target, Mail, Briefcase, DollarSign,
  BarChart3, Network, Star, Layers, Hash, Flag, Store, Shuffle,
} from 'lucide-react';
import { toast } from 'sonner';

type Signal = 'hiring' | 'funding' | 'expanding' | 'new_role' | 'active';

interface Account {
  id: string; name: string; avatar: string; industry: string; size: string;
  employees: string; location: string; signals: Signal[]; leadsFound: number;
  savedLeads: number; score: number; revenue: string; founded: string;
  website: string; stage: string; lastActivity: string; contacts: number;
  // Deepened
  countriesOperating: number; subsidiaries: number; retailOutlets: number;
  recentLeadershipChanges: number;
}

const SIGNAL_COLORS: Record<Signal, string> = {
  hiring: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  funding: 'bg-accent/10 text-accent',
  expanding: 'bg-primary/10 text-primary',
  new_role: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  active: 'bg-[hsl(var(--state-live))]/10 text-[hsl(var(--state-live))]',
};

const ACCOUNTS: Account[] = [
  { id: 'A-001', name: 'TechCorp', avatar: 'TC', industry: 'SaaS', size: 'mid', employees: '500-1K', location: 'San Francisco', signals: ['hiring', 'expanding'], leadsFound: 12, savedLeads: 3, score: 91, revenue: '$50-100M', founded: '2015', website: 'techcorp.io', stage: 'opportunity', lastActivity: '2h ago', contacts: 24, countriesOperating: 5, subsidiaries: 2, retailOutlets: 0, recentLeadershipChanges: 2 },
  { id: 'A-002', name: 'ScaleUp Inc', avatar: 'SI', industry: 'FinTech', size: 'smb', employees: '100-250', location: 'New York', signals: ['hiring', 'funding'], leadsFound: 8, savedLeads: 1, score: 85, revenue: '$10-50M', founded: '2018', website: 'scaleup.io', stage: 'qualified', lastActivity: '1d ago', contacts: 15, countriesOperating: 3, subsidiaries: 1, retailOutlets: 0, recentLeadershipChanges: 0 },
  { id: 'A-003', name: 'CloudScale', avatar: 'CS', industry: 'Cloud Infrastructure', size: 'mid', employees: '250-500', location: 'Austin', signals: ['funding', 'hiring'], leadsFound: 15, savedLeads: 4, score: 94, revenue: '$100-250M', founded: '2012', website: 'cloudscale.com', stage: 'opportunity', lastActivity: '4h ago', contacts: 31, countriesOperating: 7, subsidiaries: 3, retailOutlets: 0, recentLeadershipChanges: 1 },
  { id: 'A-004', name: 'NexaFlow', avatar: 'NF', industry: 'AI/ML', size: 'startup', employees: '10-50', location: 'London', signals: ['funding'], leadsFound: 5, savedLeads: 0, score: 78, revenue: '<$10M', founded: '2022', website: 'nexaflow.ai', stage: 'prospecting', lastActivity: '12h ago', contacts: 8, countriesOperating: 2, subsidiaries: 0, retailOutlets: 0, recentLeadershipChanges: 0 },
  { id: 'A-005', name: 'DataFlow', avatar: 'DF', industry: 'Data Analytics', size: 'enterprise', employees: '1K-5K', location: 'Seattle', signals: ['expanding', 'active'], leadsFound: 22, savedLeads: 6, score: 82, revenue: '$250M+', founded: '2008', website: 'dataflow.com', stage: 'qualified', lastActivity: '5d ago', contacts: 56, countriesOperating: 10, subsidiaries: 3, retailOutlets: 12, recentLeadershipChanges: 2 },
  { id: 'A-006', name: 'AppWorks', avatar: 'AW', industry: 'SaaS', size: 'mid', employees: '200-500', location: 'Boston', signals: ['hiring', 'new_role'], leadsFound: 9, savedLeads: 2, score: 87, revenue: '$25-50M', founded: '2016', website: 'appworks.dev', stage: 'prospecting', lastActivity: '6h ago', contacts: 18, countriesOperating: 4, subsidiaries: 1, retailOutlets: 0, recentLeadershipChanges: 1 },
];

const NavigatorAccountsPage: React.FC = () => {
  const [selected, setSelected] = useState<Account | null>(null);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const filtered = ACCOUNTS.filter(a => {
    const ms = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.industry.toLowerCase().includes(search.toLowerCase());
    return ms;
  });

  const topStrip = (
    <>
      <Building2 className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Navigator — Account Search</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[10px] w-48 focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <AdvancedFilterPanel filters={NAVIGATOR_ACCOUNTS_FILTERS} values={filterValues} onChange={setFilterValues} compact />
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56">
      <SectionBackNav homeRoute="/navigator" homeLabel="Sales Navigator" currentLabel="Account Search" icon={<Building2 className="h-3 w-3" />} />

      <KPIBand className="mb-3">
        <KPICard label="Total Accounts" value={String(ACCOUNTS.length)} change="Tracked" className="!rounded-2xl" />
        <KPICard label="Active Signals" value="11" change="This week" trend="up" className="!rounded-2xl" />
        <KPICard label="Leads Mapped" value="71" change="Across accounts" className="!rounded-2xl" />
        <KPICard label="Avg Score" value="86" change="/100" className="!rounded-2xl" />
      </KPIBand>

      <AdvancedFilterPanel filters={NAVIGATOR_ACCOUNTS_FILTERS} values={filterValues} onChange={setFilterValues} inline className="mb-3" />

      <div className="space-y-2">
        {filtered.map(a => (
          <div key={a.id} onClick={() => setSelected(a)} className={cn('rounded-2xl border bg-card p-4 hover:shadow-md cursor-pointer transition-all group', selected?.id === a.id && 'ring-2 ring-accent/30')}>
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 rounded-xl"><AvatarFallback className="rounded-xl bg-accent/10 text-accent text-sm font-bold">{a.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold group-hover:text-accent transition-colors">{a.name}</div>
                <div className="text-[10px] text-muted-foreground">{a.industry} · {a.employees} employees · <MapPin className="h-2.5 w-2.5 inline" /> {a.location}</div>
                <div className="flex gap-1 mt-1">
                  {a.signals.map(s => (
                    <Badge key={s} className={cn('text-[7px] border-0 capitalize', SIGNAL_COLORS[s])}>{s.replace('_', ' ')}</Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[8px] text-muted-foreground">
                  <span><Flag className="h-2.5 w-2.5 inline" /> {a.countriesOperating} countries</span>
                  {a.subsidiaries > 0 && <span>{a.subsidiaries} subsidiaries</span>}
                  {a.retailOutlets > 0 && <span><Store className="h-2.5 w-2.5 inline" /> {a.retailOutlets} outlets</span>}
                  {a.recentLeadershipChanges > 0 && (
                    <Badge className="text-[7px] bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))] border-0 h-3.5">
                      <Shuffle className="h-2 w-2 mr-0.5" />{a.recentLeadershipChanges} changes
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-center shrink-0">
                <div className="text-lg font-bold">{a.score}</div>
                <div className="text-[8px] text-muted-foreground">Score</div>
              </div>
              <div className="flex flex-col items-end gap-1 text-[9px] text-muted-foreground shrink-0">
                <span>{a.leadsFound} leads</span>
                <span>{a.contacts} contacts</span>
                <Badge variant="secondary" className="text-[7px] capitalize">{a.stage}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Account Detail Drawer */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        {selected && (
          <SheetContent className="w-[480px] overflow-y-auto p-0">
            <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4 text-accent" />Account Profile</SheetTitle></SheetHeader>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 rounded-xl"><AvatarFallback className="rounded-xl bg-accent/10 text-accent text-lg font-bold">{selected.avatar}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <div className="text-sm font-bold">{selected.name}</div>
                  <div className="text-[10px] text-muted-foreground">{selected.industry} · {selected.employees} employees</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">{selected.score}</div>
                  <div className="text-[8px] text-muted-foreground">Score</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { l: 'Revenue', v: selected.revenue },
                  { l: 'Founded', v: selected.founded },
                  { l: 'Stage', v: selected.stage },
                  { l: 'Contacts', v: String(selected.contacts) },
                  { l: 'Countries', v: String(selected.countriesOperating) },
                  { l: 'Subsidiaries', v: String(selected.subsidiaries) },
                ].map(m => (
                  <div key={m.l} className="rounded-xl border p-2 text-center">
                    <div className="text-[8px] text-muted-foreground">{m.l}</div>
                    <div className="text-[10px] font-bold capitalize">{m.v}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 border-t pt-3">
                <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Eye className="h-3 w-3" />Full Profile</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Users className="h-3 w-3" />View Leads</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Mail className="h-3 w-3" />Outreach</Button>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </DashboardLayout>
  );
};

export default NavigatorAccountsPage;
