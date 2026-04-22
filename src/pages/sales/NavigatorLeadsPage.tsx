import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { AdvancedFilterPanel, NAVIGATOR_LEADS_FILTERS, FilterValues } from '@/components/shell/AdvancedFilterPanel';
import {
  Compass, Search, Clock, ChevronRight, MoreHorizontal, History,
  Plus, Eye, Download, Bookmark, BookmarkCheck, Star, Building2,
  Users, Zap, TrendingUp, Globe, MapPin, Briefcase, Mail,
  Phone, ExternalLink, Filter, ListPlus, UserPlus, MessageSquare,
  AlertTriangle, Lock, Hash, Target, ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

type ConnectionDegree = '1st' | '2nd' | '3rd' | 'none';
type Signal = 'hiring' | 'funding' | 'expanding' | 'new_role' | 'active' | 'engaged';
type CompanySize = 'startup' | 'smb' | 'mid' | 'enterprise';

interface Lead {
  id: string; name: string; avatar: string; title: string; company: string;
  companyAvatar: string; location: string; connection: ConnectionDegree;
  signals: Signal[]; score: number; saved: boolean; lastActive: string;
  industry: string; companySize: CompanySize; email?: string;
}

const LEADS: Lead[] = [
  { id: 'L-001', name: 'Sarah Chen', avatar: 'SC', title: 'VP Engineering', company: 'TechCorp', companyAvatar: 'TC', location: 'San Francisco, CA', connection: '2nd', signals: ['hiring', 'active'], score: 92, saved: true, lastActive: '2h ago', industry: 'SaaS', companySize: 'mid' },
  { id: 'L-002', name: 'Marcus Johnson', avatar: 'MJ', title: 'Head of Talent', company: 'ScaleUp Inc', companyAvatar: 'SI', location: 'New York, NY', connection: '1st', signals: ['hiring', 'expanding'], score: 88, saved: false, lastActive: '1d ago', industry: 'FinTech', companySize: 'smb', email: 'marcus@scaleup.io' },
  { id: 'L-003', name: 'Elena Rodriguez', avatar: 'ER', title: 'CTO', company: 'CloudScale', companyAvatar: 'CS', location: 'Austin, TX', connection: '3rd', signals: ['funding', 'hiring'], score: 95, saved: true, lastActive: '4h ago', industry: 'Cloud Infrastructure', companySize: 'mid' },
  { id: 'L-004', name: 'David Park', avatar: 'DP', title: 'Director of Operations', company: 'GrowthEngine', companyAvatar: 'GE', location: 'Chicago, IL', connection: '2nd', signals: ['new_role', 'active'], score: 76, saved: false, lastActive: '3d ago', industry: 'MarTech', companySize: 'smb' },
  { id: 'L-005', name: 'Priya Sharma', avatar: 'PS', title: 'CEO', company: 'NexaFlow', companyAvatar: 'NF', location: 'London, UK', connection: 'none', signals: ['funding', 'expanding'], score: 84, saved: false, lastActive: '12h ago', industry: 'AI/ML', companySize: 'startup' },
  { id: 'L-006', name: 'Tom Richards', avatar: 'TR', title: 'SVP Product', company: 'DataFlow', companyAvatar: 'DF', location: 'Seattle, WA', connection: '1st', signals: ['engaged'], score: 71, saved: true, lastActive: '5d ago', industry: 'Data Analytics', companySize: 'enterprise' },
  { id: 'L-007', name: 'Lisa Wang', avatar: 'LW', title: 'VP People', company: 'AppWorks', companyAvatar: 'AW', location: 'Boston, MA', connection: '2nd', signals: ['hiring', 'active', 'new_role'], score: 90, saved: false, lastActive: '6h ago', industry: 'SaaS', companySize: 'mid' },
];

const SIGNAL_COLORS: Record<Signal, string> = {
  hiring: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  funding: 'bg-accent/10 text-accent',
  expanding: 'bg-primary/10 text-primary',
  new_role: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  active: 'bg-[hsl(var(--state-live))]/10 text-[hsl(var(--state-live))]',
  engaged: 'bg-muted text-muted-foreground',
};

const CONN_COLORS: Record<ConnectionDegree, string> = {
  '1st': 'text-[hsl(var(--state-healthy))]', '2nd': 'text-accent', '3rd': 'text-muted-foreground', 'none': 'text-muted-foreground/50',
};

const NavigatorLeadsPage: React.FC = () => {
  const { activeRole } = useRole();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const filtered = LEADS.filter(l => {
    const ms = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.company.toLowerCase().includes(search.toLowerCase()) || l.title.toLowerCase().includes(search.toLowerCase());
    return ms;
  });

  const topStrip = (
    <>
      <Compass className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Navigator — Leads</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads, companies..." className="h-6 rounded-md border bg-background pl-7 pr-2 text-[8px] w-44 focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Download className="h-3 w-3" />Export</Button>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <AdvancedFilterPanel filters={NAVIGATOR_LEADS_FILTERS} values={filterValues} onChange={setFilterValues} compact />
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56">
      <SectionBackNav homeRoute="/navigator" homeLabel="Sales Navigator" currentLabel="Lead Search" icon={<Compass className="h-3 w-3" />} />

      <KPIBand className="mb-3">
        <KPICard label="Leads Found" value="7" change="This session" />
        <KPICard label="Saved Leads" value="95" change="Across lists" trend="up" />
        <KPICard label="Active Signals" value="11" change="This week" trend="up" />
        <KPICard label="Avg Score" value="85" change="/100" />
      </KPIBand>

      {/* Active filters inline */}
      <AdvancedFilterPanel filters={NAVIGATOR_LEADS_FILTERS} values={filterValues} onChange={setFilterValues} inline className="mb-3" />

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr className="text-[9px] text-muted-foreground font-medium">
              <th className="text-left px-3 py-2">Lead</th>
              <th className="text-left px-3 py-2">Company</th>
              <th className="text-center px-3 py-2">Conn.</th>
              <th className="text-left px-3 py-2">Signals</th>
              <th className="text-center px-3 py-2">Score</th>
              <th className="text-left px-3 py-2">Active</th>
              <th className="text-left px-3 py-2 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.id} onClick={() => setSelectedLead(l)} className={cn('border-t hover:bg-muted/30 cursor-pointer text-[9px] transition-colors', selectedLead?.id === l.id && 'bg-accent/5')}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-6 w-6"><AvatarFallback className="text-[7px]">{l.avatar}</AvatarFallback></Avatar>
                    <div>
                      <div className="font-medium">{l.name}</div>
                      <div className="text-[8px] text-muted-foreground">{l.title}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{l.company}</td>
                <td className="px-3 py-2 text-center"><Badge variant="secondary" className={cn('text-[7px]', CONN_COLORS[l.connection])}>{l.connection}</Badge></td>
                <td className="px-3 py-2">
                  <div className="flex gap-0.5 flex-wrap">
                    {l.signals.map(s => <Badge key={s} className={cn('text-[6px] border-0 capitalize', SIGNAL_COLORS[s])}>{s.replace('_', ' ')}</Badge>)}
                  </div>
                </td>
                <td className="px-3 py-2 text-center font-bold">{l.score}</td>
                <td className="px-3 py-2 text-muted-foreground">{l.lastActive}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0"><Eye className="h-2.5 w-2.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0"><Bookmark className="h-2.5 w-2.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lead Detail Drawer */}
      <Sheet open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        {selectedLead && (
          <SheetContent className="w-[480px] overflow-y-auto">
            <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Compass className="h-4 w-4 text-accent" />Lead Profile</SheetTitle></SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b">
                <Avatar className="h-12 w-12"><AvatarFallback className="text-sm">{selectedLead.avatar}</AvatarFallback></Avatar>
                <div>
                  <div className="text-sm font-bold">{selectedLead.name}</div>
                  <div className="text-[10px] text-muted-foreground">{selectedLead.title}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Building2 className="h-2.5 w-2.5" />{selectedLead.company}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-lg font-bold">{selectedLead.score}</div>
                  <div className="text-[7px] text-muted-foreground">Lead Score</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: 'Location', v: selectedLead.location, icon: MapPin },
                  { l: 'Connection', v: selectedLead.connection, icon: Users },
                  { l: 'Industry', v: selectedLead.industry, icon: Briefcase },
                  { l: 'Company Size', v: selectedLead.companySize, icon: Building2 },
                  { l: 'Last Active', v: selectedLead.lastActive, icon: Clock },
                  ...(selectedLead.email ? [{ l: 'Email', v: selectedLead.email, icon: Mail }] : []),
                ].map(m => (
                  <div key={m.l} className="rounded-md border p-2 flex items-start gap-1.5">
                    <m.icon className="h-3 w-3 text-muted-foreground mt-0.5" />
                    <div><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-[9px] font-medium">{m.v}</div></div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 border-t pt-3">
                <Button size="sm" className="h-6 text-[9px] gap-1"><MessageSquare className="h-2.5 w-2.5" />Message</Button>
                <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><ListPlus className="h-2.5 w-2.5" />Add to List</Button>
                <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><ExternalLink className="h-2.5 w-2.5" />Full Profile</Button>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </DashboardLayout>
  );
};

export default NavigatorLeadsPage;
