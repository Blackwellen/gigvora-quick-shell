import React, { useState } from 'react';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  FileText, Clock, ChevronRight, Eye, Building2,
  CheckCircle2, XCircle, Calendar, Briefcase, MessageSquare,
  AlertTriangle, Send, Archive,
} from 'lucide-react';

type AppStatus = 'submitted' | 'reviewing' | 'interview' | 'offered' | 'accepted' | 'rejected' | 'withdrawn';

interface Application {
  id: string; title: string; company: string; status: AppStatus;
  applied: string; stage: string; type: string; location: string;
}

const APPLICATIONS: Application[] = [
  { id: '1', title: 'Senior Frontend Developer', company: 'Stripe', status: 'interview', applied: 'Apr 10', stage: 'Technical Interview', type: 'Full-time', location: 'Remote' },
  { id: '2', title: 'Product Designer', company: 'Notion', status: 'reviewing', applied: 'Apr 8', stage: 'Under Review', type: 'Full-time', location: 'Hybrid' },
  { id: '3', title: 'Engineering Manager', company: 'Linear', status: 'submitted', applied: 'Apr 5', stage: 'Application Received', type: 'Full-time', location: 'Remote' },
  { id: '4', title: 'UX Researcher', company: 'Figma', status: 'offered', applied: 'Mar 20', stage: 'Offer Extended', type: 'Contract', location: 'Remote' },
  { id: '5', title: 'Full Stack Developer', company: 'Vercel', status: 'rejected', applied: 'Mar 15', stage: 'Not Selected', type: 'Full-time', location: 'Remote' },
  { id: '6', title: 'Design Lead', company: 'Canva', status: 'withdrawn', applied: 'Mar 10', stage: 'Withdrawn by You', type: 'Full-time', location: 'On-site' },
  { id: '7', title: 'Staff Engineer', company: 'GitHub', status: 'accepted', applied: 'Feb 28', stage: 'Accepted', type: 'Full-time', location: 'Remote' },
];

const STATUS_MAP: Record<AppStatus, { badge: 'healthy' | 'caution' | 'blocked' | 'review' | 'pending' | 'live' | 'premium'; label: string }> = {
  submitted: { badge: 'pending', label: 'Submitted' },
  reviewing: { badge: 'review', label: 'Reviewing' },
  interview: { badge: 'live', label: 'Interview' },
  offered: { badge: 'premium', label: 'Offered' },
  accepted: { badge: 'healthy', label: 'Accepted' },
  rejected: { badge: 'blocked', label: 'Rejected' },
  withdrawn: { badge: 'caution', label: 'Withdrawn' },
};

const DashboardApplicationsPage: React.FC = () => {
  const [tab, setTab] = useState<'all' | AppStatus>('all');
  const [selected, setSelected] = useState<Application | null>(null);

  const filtered = tab === 'all' ? APPLICATIONS : APPLICATIONS.filter(a => a.status === tab);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><FileText className="h-5 w-5 text-accent" /> Applications</h1>
        <p className="text-[11px] text-muted-foreground">Track all your job and opportunity applications</p>
      </div>

      <KPIBand>
        <KPICard label="Active" value="3" change="In pipeline" trend="up" />
        <KPICard label="Interviews" value="1" change="Scheduled" trend="up" />
        <KPICard label="Offers" value="1" />
        <KPICard label="Total Applied" value={String(APPLICATIONS.length)} />
      </KPIBand>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['all', 'submitted', 'reviewing', 'interview', 'offered', 'accepted', 'rejected', 'withdrawn'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all capitalize',
            tab === t ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>{t}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(app => {
          const sm = STATUS_MAP[app.status];
          return (
            <div key={app.id} onClick={() => setSelected(app)} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer group">
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold truncate group-hover:text-accent transition-colors">{app.title}</span>
                  <StatusBadge status={sm.badge} label={sm.label} />
                </div>
                <div className="text-[9px] text-muted-foreground flex items-center gap-3">
                  <span>{app.company}</span>
                  <span>{app.type}</span>
                  <span>{app.location}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{app.applied}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[9px] text-muted-foreground">{app.stage}</div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed p-12 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <div className="text-xs font-semibold text-muted-foreground">No applications found</div>
          </div>
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[420px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Application Detail</SheetTitle></SheetHeader>
          {selected && (
            <div className="p-4 space-y-4">
              <h3 className="text-[12px] font-bold">{selected.title}</h3>
              <div className="text-[10px] text-muted-foreground">{selected.company} · {selected.type} · {selected.location}</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Applied</div><div className="text-[10px] font-semibold">{selected.applied}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Stage</div><div className="text-[10px] font-semibold">{selected.stage}</div></div>
              </div>
              <StatusBadge status={STATUS_MAP[selected.status].badge} label={STATUS_MAP[selected.status].label} />
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="h-8 text-[9px] flex-1 rounded-xl gap-1"><Eye className="h-3 w-3" />View Job</Button>
                {(selected.status === 'submitted' || selected.status === 'reviewing') && (
                  <Button variant="outline" size="sm" className="h-8 text-[9px] flex-1 rounded-xl gap-1 text-destructive"><XCircle className="h-3 w-3" />Withdraw</Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DashboardApplicationsPage;
