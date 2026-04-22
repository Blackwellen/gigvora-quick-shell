import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, Plus, Search, Users, Clock, MapPin, DollarSign, ChevronRight, Shield, Target } from 'lucide-react';

const MOCK_JOBS = [
  { id: '1', title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Remote', salary: '$160-200k', status: 'active' as const, candidates: 47, newApplicants: 5, daysOpen: 12, hiringManager: 'Sarah K.' },
  { id: '2', title: 'Engineering Manager', department: 'Engineering', location: 'San Francisco', salary: '$200-250k', status: 'active' as const, candidates: 23, newApplicants: 2, daysOpen: 8, hiringManager: 'Mike L.' },
  { id: '3', title: 'ML Engineer', department: 'AI/ML', location: 'Remote', salary: '$180-230k', status: 'active' as const, candidates: 34, newApplicants: 8, daysOpen: 5, hiringManager: 'Ana R.' },
  { id: '4', title: 'Product Designer', department: 'Design', location: 'New York', salary: '$130-170k', status: 'paused' as const, candidates: 15, newApplicants: 0, daysOpen: 30, hiringManager: 'David C.' },
  { id: '5', title: 'DevOps Engineer', department: 'Infrastructure', location: 'Remote', salary: '$150-190k', status: 'draft' as const, candidates: 0, newApplicants: 0, daysOpen: 0, hiringManager: 'Lisa W.' },
];

export default function RecruiterJobWorkspacePage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const filtered = MOCK_JOBS.filter(j => j.title.toLowerCase().includes(search.toLowerCase()) && (tab === 'all' || j.status === tab));

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <div className="flex items-center gap-2 mr-4">
            <Briefcase className="h-4 w-4 text-[hsl(var(--state-healthy))]" />
            <h1 className="text-sm font-bold">Job Workspace</h1>
          </div>
          <KPICard label="Active Jobs" value="3" />
          <KPICard label="Total Candidates" value="119" />
          <KPICard label="New Applicants" value="15" change="today" trend="up" />
          <KPICard label="Avg Days Open" value="11d" />
        </div>
      }
    >
      <SectionCard title="Jobs" icon={<Shield className="h-3 w-3 text-muted-foreground" />}
        action={<Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" /> Create Job</Button>}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-7">
              <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
              <TabsTrigger value="active" className="text-[10px] h-5 px-2">Active</TabsTrigger>
              <TabsTrigger value="paused" className="text-[10px] h-5 px-2">Paused</TabsTrigger>
              <TabsTrigger value="draft" className="text-[10px] h-5 px-2">Drafts</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="space-y-2">
          {filtered.map(job => (
            <div key={job.id} className="flex items-center gap-4 p-3 rounded-xl border border-border/40 hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{job.title}</span>
                  <StatusBadge status={job.status === 'active' ? 'healthy' : job.status === 'paused' ? 'caution' : 'pending'} label={job.status} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" /> {job.department}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {job.location}</span>
                  <span className="flex items-center gap-1"><DollarSign className="h-2.5 w-2.5" /> {job.salary}</span>
                  <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {job.daysOpen}d open</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <div className="text-center">
                  <div className="text-xs font-semibold text-foreground">{job.candidates}</div>
                  <div>candidates</div>
                </div>
                {job.newApplicants > 0 && (
                  <Badge className="text-[8px] h-4 bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0">+{job.newApplicants} new</Badge>
                )}
                <span>{job.hiringManager}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-accent" />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
