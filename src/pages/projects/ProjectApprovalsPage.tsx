import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckSquare, Clock, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';

const APPROVALS = [
  { id: 'APR-01', title: 'Homepage Design v3', type: 'Design', submitter: 'Lisa P.', submitted: 'Apr 13, 2026', status: 'pending' as const, reviewers: ['Sarah K.', 'Client'] },
  { id: 'APR-02', title: 'API Architecture Doc', type: 'Document', submitter: 'Mike L.', submitted: 'Apr 12, 2026', status: 'approved' as const, reviewers: ['Sarah K.'] },
  { id: 'APR-03', title: 'Brand Colors Update', type: 'Design', submitter: 'Lisa P.', submitted: 'Apr 10, 2026', status: 'changes-requested' as const, reviewers: ['Client'] },
  { id: 'APR-04', title: 'Sprint 3 Deliverables', type: 'Milestone', submitter: 'Sarah K.', submitted: 'Apr 8, 2026', status: 'approved' as const, reviewers: ['Client', 'PM'] },
];

const statusMap = { pending: 'caution', approved: 'healthy', 'changes-requested': 'blocked' } as const;

export default function ProjectApprovalsPage() {
  const [tab, setTab] = useState('all');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <CheckSquare className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Approvals</h1>
          <KPICard label="Pending" value="1" />
          <KPICard label="Approved" value="2" />
          <KPICard label="Changes Req." value="1" />
        </div>
      }
    >
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-8">
          <TabsTrigger value="all" className="text-[10px] px-3">All</TabsTrigger>
          <TabsTrigger value="pending" className="text-[10px] px-3">Pending</TabsTrigger>
          <TabsTrigger value="approved" className="text-[10px] px-3">Approved</TabsTrigger>
          <TabsTrigger value="changes-requested" className="text-[10px] px-3">Changes Requested</TabsTrigger>
        </TabsList>
      </Tabs>

      <SectionCard>
        {(tab === 'all' ? APPROVALS : APPROVALS.filter(a => a.status === tab)).map(a => (
          <div key={a.id} className="p-4 rounded-xl border border-border/40 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[8px] h-3.5 font-mono">{a.id}</Badge>
              <span className="text-[11px] font-semibold">{a.title}</span>
              <StatusBadge status={statusMap[a.status]} label={a.status} />
              <Badge variant="outline" className="text-[8px] h-3.5">{a.type}</Badge>
            </div>
            <div className="flex items-center gap-3 text-[9px] text-muted-foreground mb-3">
              <span>By: {a.submitter}</span>
              <span><Clock className="h-2.5 w-2.5 inline" /> {a.submitted}</span>
              <span>Reviewers: {a.reviewers.join(', ')}</span>
            </div>
            {a.status === 'pending' && (
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-[10px] gap-1"><CheckCircle2 className="h-3 w-3" /> Approve</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><XCircle className="h-3 w-3" /> Request Changes</Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1"><MessageSquare className="h-3 w-3" /> Comment</Button>
              </div>
            )}
          </div>
        ))}
      </SectionCard>
    </DashboardLayout>
  );
}
