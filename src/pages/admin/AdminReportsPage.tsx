import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle, Flag, Clock, Eye, CheckCircle2, ChevronRight,
  MessageSquare, Users, FileText, ShieldAlert, Layers, Store,
  Video, Calendar, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type RStatus = 'new' | 'triaging' | 'investigating' | 'resolved' | 'dismissed';

interface Report {
  id: string; type: string; subject: string; reporter: string;
  target: string; category: string; status: RStatus;
  created: string; priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

const STATUS_CLS: Record<RStatus, string> = {
  new: 'bg-destructive/10 text-destructive',
  triaging: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  investigating: 'bg-accent/10 text-accent',
  resolved: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  dismissed: 'bg-muted text-muted-foreground',
};

const CAT_ICON: Record<string, React.ElementType> = {
  Content: FileText, User: Users, Gig: Layers, Service: Store, Media: Video, Event: Calendar,
};

const REPORTS: Report[] = [
  { id: 'RPT-2201', type: 'Complaint', subject: 'Offensive content in community group', reporter: 'Alex M.', target: 'Design Guild group post', category: 'Content', status: 'new', created: '8 min ago', priority: 'high', description: 'Post contains discriminatory language targeting specific ethnic groups.' },
  { id: 'RPT-2199', type: 'Complaint', subject: 'Gig delivery quality does not match description', reporter: 'Jordan K.', target: 'QuickDesign Pro gig', category: 'Gig', status: 'triaging', created: '1 hour ago', priority: 'medium', description: 'Delivered work is significantly lower quality than samples shown.' },
  { id: 'RPT-2196', type: 'Alert', subject: 'Suspicious account activity — bulk messaging', reporter: 'System (AI)', target: 'NewUser2026', category: 'User', status: 'investigating', created: '2 hours ago', priority: 'high', description: 'AI detected 200+ identical messages sent in 30 minutes.' },
  { id: 'RPT-2193', type: 'Complaint', subject: 'Copyright violation in uploaded media', reporter: 'ContentCreator', target: 'Video: "Marketing Tips"', category: 'Media', status: 'new', created: '3 hours ago', priority: 'medium', description: 'Video uses copyrighted music without permission.' },
  { id: 'RPT-2190', type: 'Alert', subject: 'Service listing with fake reviews suspected', reporter: 'System (AI)', target: 'SuperGrowth Services', category: 'Service', status: 'triaging', created: '5 hours ago', priority: 'critical', description: 'AI detected review pattern anomalies: 15 5-star reviews in 2 hours from new accounts.' },
  { id: 'RPT-2185', type: 'Complaint', subject: 'Event organizer not responding to attendees', reporter: 'Multiple (4 reports)', target: 'AI Summit 2026', category: 'Event', status: 'resolved', created: '1 day ago', priority: 'medium', description: 'Organizer has not communicated for 2 weeks. Event scheduled in 3 days.' },
];

export default function AdminReportsPage() {
  const [tab, setTab] = useState('all');

  const filtered = REPORTS.filter(r => {
    if (tab === 'all') return true;
    if (tab === 'action') return ['new', 'triaging'].includes(r.status);
    return r.status === tab;
  });

  return (
    <DashboardLayout topStrip={
      <>
        <Flag className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Reports & Complaints</span>
        <div className="flex-1" />
        <Badge className="text-[9px] bg-destructive/10 text-destructive border-0 gap-1"><AlertTriangle className="h-3 w-3" /> {REPORTS.filter(r => r.status === 'new').length} New</Badge>
      </>
    } rightRail={
      <div className="space-y-3">
        <SectionCard title="Report Sources">
          <div className="space-y-1.5 text-[9px]">
            <div className="flex justify-between"><span className="text-muted-foreground">User Reports</span><span className="font-bold">24</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">AI Alerts</span><span className="font-bold">12</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">System Triggers</span><span className="font-bold">6</span></div>
          </div>
        </SectionCard>
        <SectionCard title="Category Breakdown">
          <div className="space-y-1.5 text-[9px]">
            {[{ cat: 'Content', count: 14 }, { cat: 'User', count: 8 }, { cat: 'Gig', count: 6 }, { cat: 'Service', count: 5 }, { cat: 'Media', count: 4 }, { cat: 'Event', count: 3 }].map(c => (
              <div key={c.cat} className="flex items-center justify-between">
                <span className="text-muted-foreground">{c.cat}</span>
                <span className="font-semibold">{c.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    } rightRailWidth="w-48">
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <KPICard label="New" value={String(REPORTS.filter(r => r.status === 'new').length)} />
        <KPICard label="Active" value={String(REPORTS.filter(r => ['triaging', 'investigating'].includes(r.status)).length)} />
        <KPICard label="Resolved (7d)" value="32" />
        <KPICard label="Avg Response" value="45m" />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-3">
        <TabsList className="h-7">
          {['all', 'action', 'new', 'triaging', 'investigating', 'resolved', 'dismissed'].map(t => (
            <TabsTrigger key={t} value={t} className="text-[9px] h-5 px-2 capitalize">{t === 'action' ? 'Action Needed' : t}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {filtered.map(r => {
          const CatIcon = CAT_ICON[r.category] || FileText;
          return (
            <div key={r.id} className="p-4 rounded-2xl border border-border/30 bg-card hover:border-accent/30 transition-all">
              <div className="flex items-center gap-3">
                <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', STATUS_CLS[r.status])}>
                  <CatIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-bold truncate">{r.subject}</span>
                    <Badge className={cn('text-[7px] h-3.5 border-0 capitalize', STATUS_CLS[r.status])}>{r.status}</Badge>
                    <Badge variant="outline" className="text-[7px] h-3.5">{r.type}</Badge>
                    <Badge variant="outline" className={cn('text-[7px] h-3.5', r.priority === 'critical' ? 'text-destructive' : r.priority === 'high' ? 'text-[hsl(var(--state-live))]' : '')}>{r.priority}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                    <span className="font-mono">{r.id}</span>
                    <span>by {r.reporter}</span>
                    <span>→ {r.target}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{r.created}</span>
                  </div>
                  <p className="text-[8px] text-muted-foreground mt-1 line-clamp-1">{r.description}</p>
                </div>
                {r.status !== 'resolved' && r.status !== 'dismissed' && (
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Eye className="h-3 w-3" /> View</Button>
                    <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><CheckCircle2 className="h-3 w-3" /> Resolve</Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
