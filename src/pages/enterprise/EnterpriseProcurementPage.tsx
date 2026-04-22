import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  ShoppingCart, Search, Plus, DollarSign, Clock,
  FileText, Building2, Globe,
} from 'lucide-react';

type RFPStatus = 'open' | 'evaluating' | 'awarded' | 'closed';
interface RFP {
  id: string; title: string; org: string; category: string; budget: string;
  deadline: string; status: RFPStatus; responses: number; region: string;
  requirements: string[];
}

const STATUS_COLORS: Record<RFPStatus, string> = {
  open: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  evaluating: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  awarded: 'bg-accent/10 text-accent',
  closed: 'bg-muted text-muted-foreground',
};

const RFPS: RFP[] = [
  { id: 'RFP-001', title: 'Cloud Infrastructure Modernization', org: 'GlobalHealth Inc', category: 'Technology', budget: '$500K - $1M', deadline: 'May 15, 2026', status: 'open', responses: 12, region: 'North America', requirements: ['AWS/GCP', 'Kubernetes', 'HIPAA Compliance'] },
  { id: 'RFP-002', title: 'Enterprise Data Analytics Platform', org: 'FinanceFirst Group', category: 'Data', budget: '$200K - $500K', deadline: 'Apr 30, 2026', status: 'evaluating', responses: 8, region: 'Europe', requirements: ['Real-time Analytics', 'SOC 2', 'API Integration'] },
  { id: 'RFP-003', title: 'DevOps Automation Suite', org: 'TechVentures Ltd', category: 'DevOps', budget: '$100K - $200K', deadline: 'Jun 1, 2026', status: 'open', responses: 5, region: 'Europe', requirements: ['CI/CD', 'Infrastructure as Code', 'Monitoring'] },
  { id: 'RFP-004', title: 'Cybersecurity Assessment & Implementation', org: 'Acme Corporation', category: 'Security', budget: '$150K - $300K', deadline: 'May 20, 2026', status: 'open', responses: 15, region: 'North America', requirements: ['Pen Testing', 'Zero Trust', 'Compliance'] },
  { id: 'RFP-005', title: 'Mobile App Development', org: 'GreenEnergy Solutions', category: 'Development', budget: '$80K - $150K', deadline: 'Apr 20, 2026', status: 'awarded', responses: 22, region: 'North America', requirements: ['React Native', 'IoT Integration', 'Offline Mode'] },
];

const EnterpriseProcurementPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = RFPS.filter(r => {
    const ms = !search || r.title.toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === 'all' || r.status === statusFilter;
    return ms && mf;
  });

  const topStrip = (
    <>
      <ShoppingCart className="h-4 w-4 text-[hsl(var(--gigvora-blue))]" />
      <span className="text-xs font-semibold">Procurement Discovery</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search RFPs..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[10px] w-48 focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px]">
        <option value="all">All Status</option>
        <option value="open">Open</option>
        <option value="evaluating">Evaluating</option>
        <option value="awarded">Awarded</option>
        <option value="closed">Closed</option>
      </select>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />Post RFP</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Your Bids" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Submitted</span><span className="font-semibold">8</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Shortlisted</span><span className="font-semibold text-accent">3</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Won</span><span className="font-semibold text-[hsl(var(--state-healthy))]">2</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Win Rate</span><span className="font-semibold">25%</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Categories" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {['Technology', 'Data', 'DevOps', 'Security', 'Development'].map(c => (
            <div key={c} className="flex justify-between">
              <span className="text-muted-foreground">{c}</span>
              <span className="font-semibold">{RFPS.filter(r => r.category === c).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Open RFPs" value={String(RFPS.filter(r => r.status === 'open').length)} className="!rounded-2xl" />
        <KPICard label="Total Pipeline" value="$1.03M" change="Active" className="!rounded-2xl" />
        <KPICard label="Avg Responses" value="12.4" className="!rounded-2xl" />
        <KPICard label="Awarded" value={String(RFPS.filter(r => r.status === 'awarded').length)} className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2">
        {filtered.map(r => {
          const orgSlug = r.org.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const orgInitials = r.org.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
          return (
            <div key={r.id} className="rounded-2xl border bg-card p-4 hover:shadow-md transition-all group">
              <div className="flex items-start gap-3">
                <Link
                  to={`/enterprise-connect/directory/${orgSlug}`}
                  aria-label={`View ${r.org} profile`}
                  className="shrink-0 rounded-xl ring-offset-2 hover:ring-2 hover:ring-accent/40 transition"
                >
                  <Avatar className="h-11 w-11 rounded-xl">
                    <AvatarFallback className="rounded-xl bg-accent/10 text-accent text-[10px] font-bold">{orgInitials}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[12px] font-bold group-hover:text-accent transition-colors">{r.title}</span>
                    <Badge className={cn('text-[7px] border-0 capitalize', STATUS_COLORS[r.status])}>{r.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground mb-1.5">
                    <Link to={`/enterprise-connect/directory/${orgSlug}`} className="hover:text-accent hover:underline inline-flex items-center gap-1">
                      <Building2 className="h-2.5 w-2.5" /> {r.org}
                    </Link>
                    <span>·</span>
                    <span>{r.category}</span>
                    <span>·</span>
                    <span><Globe className="h-2.5 w-2.5 inline" /> {r.region}</span>
                  </div>
                  <div className="flex gap-1 mb-1.5 flex-wrap">
                    {r.requirements.map(req => <Badge key={req} variant="secondary" className="text-[7px]">{req}</Badge>)}
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                    <span><DollarSign className="h-2.5 w-2.5 inline" /> {r.budget}</span>
                    <span><Clock className="h-2.5 w-2.5 inline" /> Due: {r.deadline}</span>
                    <span>{r.responses} responses</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1 shrink-0"><FileText className="h-3 w-3" />View & Bid</Button>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default EnterpriseProcurementPage;
