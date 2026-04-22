import React, { useState } from 'react';
import { KPIBand, KPICard, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  DollarSign, ChevronRight, CheckCircle2, XCircle, Clock,
  AlertTriangle, MessageSquare, Eye, FileText, TrendingUp,
  Users, Building2,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SPEND_DATA = [
  { week: 'W1', spend: 12000 }, { week: 'W2', spend: 18000 }, { week: 'W3', spend: 15000 },
  { week: 'W4', spend: 22000 },
];

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated';

interface Approval {
  id: string; title: string; requester: string; dept: string; amount: string;
  status: ApprovalStatus; submitted: string; type: string; urgency: 'high' | 'medium' | 'low';
}

const APPROVALS: Approval[] = [
  { id: 'a1', title: 'DataOps Vendor Contract Renewal', requester: 'Mike T.', dept: 'Engineering', amount: '$42,000', status: 'pending', submitted: '2h ago', type: 'Procurement', urgency: 'high' },
  { id: 'a2', title: 'Q2 Marketing Campaign Budget', requester: 'Lisa M.', dept: 'Marketing', amount: '$25,000', status: 'pending', submitted: '4h ago', type: 'Budget', urgency: 'high' },
  { id: 'a3', title: 'Security Audit Engagement', requester: 'Sarah K.', dept: 'IT', amount: '$15,000', status: 'pending', submitted: 'Yesterday', type: 'Procurement', urgency: 'medium' },
  { id: 'a4', title: 'Team Offsite Budget', requester: 'Dave R.', dept: 'People', amount: '$8,500', status: 'pending', submitted: 'Yesterday', type: 'Expense', urgency: 'low' },
  { id: 'a5', title: 'New Tool License (Figma Seats)', requester: 'Alex T.', dept: 'Design', amount: '$3,200', status: 'pending', submitted: '2d ago', type: 'License', urgency: 'medium' },
  { id: 'a6', title: 'Brand Refresh Final Payment', requester: 'Lisa M.', dept: 'Marketing', amount: '$14,000', status: 'approved', submitted: '3d ago', type: 'Invoice', urgency: 'low' },
  { id: 'a7', title: 'Contractor Overage — Legacy System', requester: 'Mike T.', dept: 'Engineering', amount: '$6,200', status: 'escalated', submitted: '5d ago', type: 'Overage', urgency: 'high' },
  { id: 'a8', title: 'Training Platform Annual', requester: 'HR', dept: 'People', amount: '$4,800', status: 'rejected', submitted: '1w ago', type: 'License', urgency: 'low' },
];

const STATUS_MAP: Record<ApprovalStatus, { badge: 'caution' | 'healthy' | 'blocked' | 'live'; label: string }> = {
  pending: { badge: 'caution', label: 'Pending' }, approved: { badge: 'healthy', label: 'Approved' },
  rejected: { badge: 'blocked', label: 'Rejected' }, escalated: { badge: 'live', label: 'Escalated' },
};

export default function EntSpendApprovalsPage() {
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState<Approval | null>(null);

  const filtered = filter === 'all' ? APPROVALS : APPROVALS.filter(a => a.status === filter);
  const pendingTotal = APPROVALS.filter(a => a.status === 'pending').reduce((s, a) => s + parseFloat(a.amount.replace(/[$,]/g, '')), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><DollarSign className="h-5 w-5 text-accent" /> Spend & Approvals</h1>
        <p className="text-[11px] text-muted-foreground">Review pending approvals, track spend, and manage budget requests</p>
      </div>

      <KPIBand className="grid-cols-2 md:grid-cols-5">
        <KPICard label="Pending Approvals" value="5" change="Action needed" trend="down" />
        <KPICard label="Pending Amount" value={`$${(pendingTotal / 1000).toFixed(0)}K`} />
        <KPICard label="Monthly Spend" value="$67K" change="+8% vs last" trend="up" />
        <KPICard label="Approved (MTD)" value="$14K" />
        <KPICard label="Escalated" value="1" change="Needs review" trend="down" />
      </KPIBand>

      <SectionCard title="Spend Trend" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={SPEND_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Spend']} contentStyle={{ fontSize: 10, borderRadius: 12 }} />
              <Area type="monotone" dataKey="spend" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {['pending', 'all', 'approved', 'rejected', 'escalated'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all capitalize',
            filter === f ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>{f}{f === 'pending' ? ` (${APPROVALS.filter(a => a.status === 'pending').length})` : ''}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(a => {
          const sm = STATUS_MAP[a.status];
          return (
            <div key={a.id} onClick={() => setSelected(a)} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer group">
              <div className={cn('h-2 w-2 rounded-full shrink-0', a.urgency === 'high' ? 'bg-[hsl(var(--state-blocked))]' : a.urgency === 'medium' ? 'bg-[hsl(var(--state-caution))]' : 'bg-muted-foreground/30')} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold group-hover:text-accent transition-colors">{a.title}</span>
                  <StatusBadge status={sm.badge} label={sm.label} />
                  <Badge variant="outline" className="text-[7px] rounded-lg">{a.type}</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground flex items-center gap-3">
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{a.requester}</span>
                  <span className="flex items-center gap-0.5"><Building2 className="h-2.5 w-2.5" />{a.dept}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{a.submitted}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] font-bold">{a.amount}</div>
              </div>
              {a.status === 'pending' && (
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" className="h-7 text-[8px] rounded-xl gap-0.5" onClick={e => e.stopPropagation()}><CheckCircle2 className="h-2.5 w-2.5" />Approve</Button>
                  <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-0.5 text-destructive" onClick={e => e.stopPropagation()}><XCircle className="h-2.5 w-2.5" />Reject</Button>
                </div>
              )}
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
            </div>
          );
        })}
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[420px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Approval Detail</SheetTitle></SheetHeader>
          {selected && (
            <div className="p-4 space-y-4">
              <h3 className="text-[12px] font-bold">{selected.title}</h3>
              <div className="grid grid-cols-2 gap-2">
                {[{ l: 'Requester', v: selected.requester }, { l: 'Department', v: selected.dept }, { l: 'Amount', v: selected.amount }, { l: 'Type', v: selected.type }, { l: 'Submitted', v: selected.submitted }, { l: 'Urgency', v: selected.urgency }].map(d => (
                  <div key={d.l} className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">{d.l}</div><div className="text-[10px] font-semibold capitalize">{d.v}</div></div>
                ))}
              </div>
              {selected.status === 'escalated' && (
                <div className="rounded-xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3 flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))] shrink-0 mt-0.5" />
                  <div className="text-[9px] text-muted-foreground">This request has been escalated for executive review.</div>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {selected.status === 'pending' && (
                  <>
                    <Button size="sm" className="h-8 text-[9px] flex-1 rounded-xl gap-1"><CheckCircle2 className="h-3 w-3" />Approve</Button>
                    <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1 text-destructive"><XCircle className="h-3 w-3" />Reject</Button>
                  </>
                )}
                <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><MessageSquare className="h-3 w-3" />Request Info</Button>
                <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Eye className="h-3 w-3" />View Details</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
