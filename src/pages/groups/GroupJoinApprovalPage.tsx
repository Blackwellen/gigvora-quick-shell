import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  UserPlus, CheckCircle, XCircle, Clock, Shield,
  Eye, MessageSquare, Users, Settings, Filter,
} from 'lucide-react';

type RequestStatus = 'pending' | 'approved' | 'rejected';

interface JoinRequest {
  id: string; name: string; initials: string; headline: string;
  reason: string; mutualConnections: number; submittedAt: string;
  status: RequestStatus; answers: string[];
}

const REQUESTS: JoinRequest[] = [
  { id: '1', name: 'Emma Davis', initials: 'ED', headline: 'Frontend Dev @ Shopify', reason: 'Looking to connect with React devs and learn best practices', mutualConnections: 5, submittedAt: '2h ago', status: 'pending', answers: ['3 years React experience', 'Building e-commerce UIs'] },
  { id: '2', name: 'Ryan Mitchell', initials: 'RM', headline: 'Junior Dev @ Startup', reason: 'Want to learn from experienced developers', mutualConnections: 2, submittedAt: '4h ago', status: 'pending', answers: ['1 year React experience', 'Learning server components'] },
  { id: '3', name: 'Olivia Chen', initials: 'OC', headline: 'Staff Engineer @ Netflix', reason: 'Interested in contributing to discussions on large-scale React apps', mutualConnections: 12, submittedAt: '6h ago', status: 'pending', answers: ['8 years React experience', 'Scaling React at Netflix'] },
  { id: '4', name: 'David Park', initials: 'DP', headline: 'Designer @ Canva', reason: 'Want to understand dev workflows for better designer-dev collaboration', mutualConnections: 3, submittedAt: '1d ago', status: 'approved', answers: ['Design systems background', 'Component library work'] },
  { id: '5', name: 'Unknown Account', initials: 'UA', headline: 'No headline', reason: 'Join pls', mutualConnections: 0, submittedAt: '2d ago', status: 'rejected', answers: ['N/A', 'N/A'] },
];

const STATUS_STYLES: Record<RequestStatus, string> = {
  pending: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  approved: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  rejected: 'bg-destructive/10 text-destructive',
};

export default function GroupJoinApprovalPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');
  const filtered = REQUESTS.filter(r => statusFilter === 'all' || r.status === statusFilter);

  const topStrip = (
    <>
      <UserPlus className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Join Approval Workflow</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} className={cn('px-2 py-1 rounded-lg text-[8px] font-medium transition-colors capitalize', statusFilter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{f}</button>
        ))}
      </div>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Join Settings" className="!rounded-2xl">
        <div className="space-y-2">
          {[
            { label: 'Require Approval', desc: 'Manual review for new members', on: true },
            { label: 'Screening Questions', desc: 'Ask questions before joining', on: true },
            { label: 'Auto-Approve Referred', desc: 'Skip review for referrals', on: false },
            { label: 'Invite Only', desc: 'Disable public join requests', on: false },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between">
              <div><div className="text-[9px] font-medium">{s.label}</div><div className="text-[7px] text-muted-foreground">{s.desc}</div></div>
              <Switch defaultChecked={s.on} className="scale-75" />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Pending" value={String(REQUESTS.filter(r => r.status === 'pending').length)} className="!rounded-2xl" />
        <KPICard label="Approved (30d)" value="28" className="!rounded-2xl" />
        <KPICard label="Rejected (30d)" value="4" className="!rounded-2xl" />
        <KPICard label="Approval Rate" value="87%" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {filtered.map(req => (
          <div key={req.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
            <div className="flex items-start gap-3">
              <Avatar className="h-9 w-9 rounded-2xl"><AvatarFallback className="rounded-2xl text-[9px] font-bold bg-accent/10 text-accent">{req.initials}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[11px] font-bold">{req.name}</span>
                  <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', STATUS_STYLES[req.status])}>{req.status}</Badge>
                  {req.mutualConnections > 0 && <Badge variant="outline" className="text-[7px] h-3.5 rounded-lg gap-0.5"><Users className="h-2 w-2" />{req.mutualConnections} mutual</Badge>}
                </div>
                <div className="text-[9px] text-muted-foreground">{req.headline}</div>
                <div className="text-[9px] mt-1.5 p-2 rounded-xl bg-muted/30">&ldquo;{req.reason}&rdquo;</div>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {req.answers.map((a, i) => <Badge key={i} variant="outline" className="text-[7px] h-3.5 rounded-md">{a}</Badge>)}
                </div>
                <div className="text-[8px] text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-2.5 w-2.5" />Submitted {req.submittedAt}</div>
                {req.status === 'pending' && (
                  <div className="flex gap-1.5 mt-2">
                    <Button size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><CheckCircle className="h-2.5 w-2.5" />Approve</Button>
                    <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><XCircle className="h-2.5 w-2.5" />Reject</Button>
                    <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Eye className="h-2.5 w-2.5" />View Profile</Button>
                    <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><MessageSquare className="h-2.5 w-2.5" />Message</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
