import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { AdvancedFilterPanel, NAVIGATOR_COMPANY_INTEL_FILTERS, FilterValues } from '@/components/shell/AdvancedFilterPanel';
import { cn } from '@/lib/utils';
import {
  Brain, Search, Building2, Users, TrendingUp, Globe, MapPin, Eye,
  Bookmark, Star, Zap, BarChart3, DollarSign, Briefcase, Network,
  ArrowUpRight, ChevronRight, Clock, Hash, Layers, Target,
  Factory, Flag, UserCheck, Shuffle, Building, Store,
} from 'lucide-react';
import { toast } from 'sonner';

interface CompanyData {
  id: string; name: string; industry: string; employees: string; revenue: string;
  location: string; founded: string; growth: string; funding: string;
  techStack: string[]; recentNews: string; score: number;
  // Deepened fields
  positionsHeld: { role: string; person: string; since: string }[];
  countriesOperating: string[];
  subsidiaries: { name: string; location: string }[];
  retailOutlets: number;
  positionChanges: { role: string; from: string; to: string; date: string }[];
  staffBreakdown: { dept: string; count: number }[];
  complianceCerts: string[];
  boardMembers: string[];
}

const COMPANIES: CompanyData[] = [
  {
    id: 'C1', name: 'TechCorp', industry: 'SaaS', employees: '500-1K', revenue: '$50-100M',
    location: 'San Francisco', founded: '2015', growth: '+32%', funding: '$45M',
    techStack: ['React', 'AWS', 'Python'], recentNews: 'Expanded to APAC market', score: 91,
    positionsHeld: [
      { role: 'CEO', person: 'Sarah Chen', since: '2015' },
      { role: 'CTO', person: 'James Park', since: '2018' },
      { role: 'VP Engineering', person: 'Maria Lopez', since: '2021' },
      { role: 'CFO', person: 'David Kim', since: '2020' },
    ],
    countriesOperating: ['United States', 'United Kingdom', 'Germany', 'Singapore', 'Australia'],
    subsidiaries: [{ name: 'TechCorp EU', location: 'London' }, { name: 'TechCorp APAC', location: 'Singapore' }],
    retailOutlets: 0,
    positionChanges: [
      { role: 'VP Sales', from: 'Tom Richards', to: 'Ana Garcia', date: 'Mar 2026' },
      { role: 'Head of Product', from: 'n/a', to: 'Lisa Wang', date: 'Jan 2026' },
    ],
    staffBreakdown: [{ dept: 'Engineering', count: 280 }, { dept: 'Sales', count: 120 }, { dept: 'Product', count: 45 }, { dept: 'Operations', count: 35 }, { dept: 'Marketing', count: 30 }],
    complianceCerts: ['SOC 2', 'ISO 27001', 'GDPR'],
    boardMembers: ['Sarah Chen', 'Michael Brooks (Sequoia)', 'Karen Yeh (a16z)'],
  },
  {
    id: 'C2', name: 'CloudScale', industry: 'Cloud Infrastructure', employees: '250-500', revenue: '$100-250M',
    location: 'Austin', founded: '2012', growth: '+28%', funding: '$120M',
    techStack: ['Go', 'Kubernetes', 'GCP'], recentNews: 'Series C at $120M valuation', score: 94,
    positionsHeld: [
      { role: 'CEO', person: 'Elena Rodriguez', since: '2012' },
      { role: 'CTO', person: 'Raj Patel', since: '2014' },
      { role: 'VP Sales', person: 'Marcus Johnson', since: '2022' },
    ],
    countriesOperating: ['United States', 'Canada', 'United Kingdom', 'Germany', 'India', 'Japan', 'Brazil'],
    subsidiaries: [{ name: 'CloudScale Europe', location: 'Frankfurt' }, { name: 'CloudScale India', location: 'Bangalore' }, { name: 'CloudScale Japan', location: 'Tokyo' }],
    retailOutlets: 0,
    positionChanges: [
      { role: 'CRO', from: 'n/a', to: 'Patricia Nguyen', date: 'Feb 2026' },
    ],
    staffBreakdown: [{ dept: 'Engineering', count: 180 }, { dept: 'Sales', count: 80 }, { dept: 'Support', count: 45 }, { dept: 'Product', count: 30 }],
    complianceCerts: ['SOC 2', 'ISO 27001', 'GDPR', 'HIPAA', 'PCI DSS'],
    boardMembers: ['Elena Rodriguez', 'Tom Henderson (Accel)', 'Yuki Tanaka (SoftBank)'],
  },
  {
    id: 'C3', name: 'NexaFlow', industry: 'AI/ML', employees: '10-50', revenue: '<$10M',
    location: 'London', founded: '2022', growth: '+180%', funding: '$12M',
    techStack: ['Python', 'PyTorch', 'AWS'], recentNews: 'Series A raised ($12M)', score: 78,
    positionsHeld: [
      { role: 'CEO & Founder', person: 'Priya Sharma', since: '2022' },
      { role: 'CTO', person: 'Alex Turner', since: '2022' },
    ],
    countriesOperating: ['United Kingdom', 'United States'],
    subsidiaries: [],
    retailOutlets: 0,
    positionChanges: [],
    staffBreakdown: [{ dept: 'Engineering', count: 22 }, { dept: 'Research', count: 12 }, { dept: 'Business', count: 6 }],
    complianceCerts: ['GDPR'],
    boardMembers: ['Priya Sharma', 'Mark Wilson (Index Ventures)'],
  },
  {
    id: 'C4', name: 'DataFlow', industry: 'Data Analytics', employees: '1K-5K', revenue: '$250M+',
    location: 'Seattle', founded: '2008', growth: '+15%', funding: '$320M',
    techStack: ['Java', 'Spark', 'Azure'], recentNews: 'Acquired DataViz startup for $18M', score: 82,
    positionsHeld: [
      { role: 'CEO', person: 'Robert Chang', since: '2008' },
      { role: 'CTO', person: 'Anna Petrov', since: '2016' },
      { role: 'CFO', person: 'William Scott', since: '2019' },
      { role: 'CISO', person: 'Kenji Nakamura', since: '2021' },
    ],
    countriesOperating: ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'India', 'Australia', 'Japan', 'Singapore', 'Brazil'],
    subsidiaries: [{ name: 'DataFlow EU', location: 'Amsterdam' }, { name: 'DataFlow India', location: 'Mumbai' }, { name: 'DataViz (acquired)', location: 'Tel Aviv' }],
    retailOutlets: 12,
    positionChanges: [
      { role: 'VP Engineering', from: 'Sandra Lee', to: 'Open', date: 'Apr 2026' },
      { role: 'Head of APAC', from: 'n/a', to: 'Yuki Sato', date: 'Mar 2026' },
    ],
    staffBreakdown: [{ dept: 'Engineering', count: 1200 }, { dept: 'Sales', count: 450 }, { dept: 'Support', count: 380 }, { dept: 'Product', count: 120 }, { dept: 'Marketing', count: 95 }, { dept: 'HR', count: 60 }],
    complianceCerts: ['SOC 2', 'ISO 27001', 'GDPR', 'HIPAA', 'FedRAMP'],
    boardMembers: ['Robert Chang', 'Helen Wu (Tiger Global)', 'James Ford (Board Observer)', 'Linda Chen (Independent)'],
  },
];

const NavigatorCompanyIntelPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const selected = COMPANIES.find(c => c.id === selectedId);

  const topStrip = (
    <>
      <Brain className="h-4 w-4 text-[hsl(var(--gigvora-purple))]" />
      <span className="text-xs font-semibold">Navigator — Company Intel</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[10px] w-48 focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>
    </>
  );

  const rightRail = selectedId && selected ? (
    <div className="space-y-3">
      <SectionCard title="Company Overview" className="!rounded-2xl">
        <div className="text-center mb-3">
          <Avatar className="h-14 w-14 mx-auto rounded-xl"><AvatarFallback className="rounded-xl bg-accent/10 text-accent text-lg font-bold">{selected.name[0]}{selected.name[1]}</AvatarFallback></Avatar>
          <div className="text-[12px] font-bold mt-2">{selected.name}</div>
          <div className="text-[9px] text-muted-foreground">{selected.industry}</div>
        </div>
        <div className="space-y-1 text-[9px]">
          {[
            { l: 'Employees', v: selected.employees },
            { l: 'Revenue', v: selected.revenue },
            { l: 'Growth', v: selected.growth },
            { l: 'Founded', v: selected.founded },
            { l: 'Total Funding', v: selected.funding },
            { l: 'Location', v: selected.location },
            { l: 'Retail Outlets', v: selected.retailOutlets > 0 ? String(selected.retailOutlets) : 'N/A' },
            { l: 'Countries', v: String(selected.countriesOperating.length) },
            { l: 'Subsidiaries', v: String(selected.subsidiaries.length) },
          ].map(m => (
            <div key={m.l} className="flex justify-between py-1 border-b last:border-0">
              <span className="text-muted-foreground">{m.l}</span>
              <span className="font-semibold">{m.v}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Key Positions */}
      <SectionCard title="Key Positions" className="!rounded-2xl">
        <div className="space-y-1.5">
          {selected.positionsHeld.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-[9px]">
              <UserCheck className="h-3 w-3 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{p.person}</div>
                <div className="text-[8px] text-muted-foreground">{p.role} · Since {p.since}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Position Changes */}
      {selected.positionChanges.length > 0 && (
        <SectionCard title="Recent Changes" className="!rounded-2xl">
          <div className="space-y-1.5">
            {selected.positionChanges.map((pc, i) => (
              <div key={i} className="text-[9px] p-1.5 rounded-lg bg-muted/20">
                <div className="flex items-center gap-1">
                  <Shuffle className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />
                  <span className="font-medium">{pc.role}</span>
                </div>
                <div className="text-[8px] text-muted-foreground mt-0.5">{pc.from} → {pc.to} · {pc.date}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Countries Operating */}
      <SectionCard title="Countries Operating" className="!rounded-2xl">
        <div className="flex flex-wrap gap-1">
          {selected.countriesOperating.map(c => (
            <Badge key={c} variant="secondary" className="text-[7px] rounded-md"><Flag className="h-2 w-2 mr-0.5" />{c}</Badge>
          ))}
        </div>
      </SectionCard>

      {/* Staff Breakdown */}
      <SectionCard title="Staff Breakdown" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {selected.staffBreakdown.map(s => (
            <div key={s.dept} className="flex justify-between py-0.5">
              <span className="text-muted-foreground">{s.dept}</span>
              <span className="font-semibold">{s.count}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Subsidiaries */}
      {selected.subsidiaries.length > 0 && (
        <SectionCard title="Subsidiaries" className="!rounded-2xl">
          <div className="space-y-1">
            {selected.subsidiaries.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[9px]">
                <Building className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="font-medium">{s.name}</span>
                <span className="text-[8px] text-muted-foreground">· {s.location}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Tech Stack" className="!rounded-2xl">
        <div className="flex flex-wrap gap-1">
          {selected.techStack.map(t => (
            <Badge key={t} variant="secondary" className="text-[8px] rounded-lg">{t}</Badge>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Compliance" className="!rounded-2xl">
        <div className="flex flex-wrap gap-1">
          {selected.complianceCerts.map(c => (
            <Badge key={c} variant="outline" className="text-[7px] rounded-md">{c}</Badge>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Board Members" className="!rounded-2xl">
        <div className="space-y-0.5 text-[9px]">
          {selected.boardMembers.map(b => (
            <div key={b} className="py-0.5 text-muted-foreground">{b}</div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Recent News" className="!rounded-2xl">
        <p className="text-[9px] text-muted-foreground">{selected.recentNews}</p>
      </SectionCard>
    </div>
  ) : (
    <div className="space-y-3">
      <AdvancedFilterPanel filters={NAVIGATOR_COMPANY_INTEL_FILTERS} values={filterValues} onChange={setFilterValues} compact />
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-60">
      <SectionBackNav homeRoute="/navigator" homeLabel="Sales Navigator" currentLabel="Company Intel" icon={<Brain className="h-3 w-3" />} />
      
      <KPIBand className="mb-3">
        <KPICard label="Companies Tracked" value={String(COMPANIES.length)} change="Active" className="!rounded-2xl" />
        <KPICard label="Signals Detected" value="18" change="This week" trend="up" className="!rounded-2xl" />
        <KPICard label="Avg Growth" value="+64%" change="Tracked companies" className="!rounded-2xl" />
        <KPICard label="New Intel" value="7" change="Last 7 days" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2">
        {COMPANIES.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase())).map(c => (
          <div key={c.id} onClick={() => setSelectedId(c.id)} className={cn('rounded-2xl border bg-card p-4 hover:shadow-md cursor-pointer transition-all group', selectedId === c.id && 'ring-2 ring-accent/30')}>
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 rounded-xl"><AvatarFallback className="rounded-xl bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))] text-sm font-bold">{c.name[0]}{c.name[1]}</AvatarFallback></Avatar>
              <div className="flex-1">
                <div className="text-[12px] font-bold group-hover:text-accent transition-colors">{c.name}</div>
                <div className="text-[10px] text-muted-foreground">{c.industry} · {c.employees} · {c.location}</div>
                <div className="flex items-center gap-2 mt-1 text-[9px]">
                  <span className="text-[hsl(var(--state-healthy))] font-semibold">{c.growth} growth</span>
                  <span className="text-muted-foreground">Revenue: {c.revenue}</span>
                  <span className="text-muted-foreground">Funding: {c.funding}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[8px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Flag className="h-2.5 w-2.5" />{c.countriesOperating.length} countries</span>
                  <span className="flex items-center gap-0.5"><Building className="h-2.5 w-2.5" />{c.subsidiaries.length} subsidiaries</span>
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{c.positionsHeld.length} key positions</span>
                  {c.positionChanges.length > 0 && (
                    <Badge className="text-[7px] bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))] border-0 h-3.5">
                      <Shuffle className="h-2 w-2 mr-0.5" />{c.positionChanges.length} changes
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-center shrink-0">
                <div className="text-lg font-bold">{c.score}</div>
                <div className="text-[8px] text-muted-foreground">Score</div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t">
              <div className="flex items-center gap-1.5 text-[9px]">
                <Zap className="h-3 w-3 text-accent" />
                <span className="text-muted-foreground">{c.recentNews}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default NavigatorCompanyIntelPage;
