import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Archive, Eye, Copy, RotateCcw, Star, Calendar, Users, Search, Download, Trash2 } from 'lucide-react';

const ARCHIVED_JOBS = [
  { id: 'JOB-421', title: 'Senior React Developer', dept: 'Engineering', status: 'filled' as const, posted: 'Feb 2026', closed: 'Mar 2026', applicants: 62, hired: 1, timeToHire: '24d' },
  { id: 'JOB-398', title: 'Product Designer', dept: 'Design', status: 'filled' as const, posted: 'Jan 2026', closed: 'Feb 2026', applicants: 48, hired: 2, timeToHire: '18d' },
  { id: 'JOB-375', title: 'DevOps Engineer', dept: 'Infrastructure', status: 'cancelled' as const, posted: 'Dec 2025', closed: 'Jan 2026', applicants: 31, hired: 0, timeToHire: '—' },
  { id: 'JOB-350', title: 'Marketing Manager', dept: 'Marketing', status: 'filled' as const, posted: 'Nov 2025', closed: 'Dec 2025', applicants: 55, hired: 1, timeToHire: '21d' },
  { id: 'JOB-332', title: 'Data Scientist', dept: 'Analytics', status: 'expired' as const, posted: 'Oct 2025', closed: 'Dec 2025', applicants: 74, hired: 0, timeToHire: '—' },
];

export default function JobArchivePage() {
  const [search, setSearch] = useState('');

  return (
    <DashboardLayout topStrip={<><Archive className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Job Archive & Duplicate Tools</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button></>}>
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search archived jobs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs rounded-xl" />
        </div>
      </div>

      <KPIBand className="mb-3">
        <KPICard label="Archived Jobs" value={String(ARCHIVED_JOBS.length)} className="!rounded-2xl" />
        <KPICard label="Filled" value="3" className="!rounded-2xl" />
        <KPICard label="Cancelled/Expired" value="2" className="!rounded-2xl" />
        <KPICard label="Avg Time to Hire" value="21d" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {ARCHIVED_JOBS.map(j => (
          <SectionCard key={j.id} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[8px] text-muted-foreground font-mono">{j.id}</span>
                  <span className="text-[11px] font-bold">{j.title}</span>
                  <StatusBadge status={j.status === 'filled' ? 'healthy' : j.status === 'cancelled' ? 'blocked' : 'caution'} label={j.status} />
                  <Badge variant="outline" className="text-[7px] rounded-md">{j.dept}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{j.posted} — {j.closed}</span>
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{j.applicants} applicants</span>
                  <span>Hired: {j.hired}</span>
                  <span>Time to hire: {j.timeToHire}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Eye className="h-3 w-3" />View</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Copy className="h-3 w-3" />Duplicate</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><RotateCcw className="h-3 w-3" />Repost</Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
