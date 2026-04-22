import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import {
  Shield, Search, ChevronRight, History, AlertTriangle, Clock,
  CheckCircle2, XCircle, Eye, MessageSquare, Users, Flag,
  MoreHorizontal, Send, Ban, UserX, Lock, RefreshCw,
  CircleDot, AlertCircle, Gavel, FileText, Zap, TrendingUp,
  ArrowUpRight, ExternalLink, Mail, Timer, Inbox,
  ShieldAlert, ShieldCheck, Activity, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';

// ── Types ──
type QueueType = 'ticket' | 'moderation' | 'trust' | 'escalation';
type CaseStatus = 'new' | 'assigned' | 'in_progress' | 'pending_review' | 'escalated' | 'resolved' | 'closed' | 'locked';
type CasePriority = 'low' | 'medium' | 'high' | 'critical';
type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

interface QueueCase {
  id: string; type: QueueType; subject: string; status: CaseStatus;
  priority: CasePriority; risk: RiskLevel;
  reporter: string; reporterAvatar: string;
  target?: string; targetAvatar?: string;
  assignee?: string; category: string;
  created: string; updated: string; slaDeadline?: string; slaBreach: boolean;
  actions: number; notes: number;
}

interface AuditEntry {
  id: string; caseId: string; actor: string; action: string;
  time: string; detail: string; scope: string;
}

// ── Mock Data ──
const CASES: QueueCase[] = [
  { id: 'CS-8901', type: 'ticket', subject: 'User cannot withdraw funds — account flagged', status: 'in_progress', priority: 'high', risk: 'medium', reporter: 'Alex Rivera', reporterAvatar: 'AR', assignee: 'Agent Kim', category: 'Finance', created: '2h ago', updated: '30m ago', slaDeadline: '1h 30m', slaBreach: false, actions: 4, notes: 3 },
  { id: 'CS-8899', type: 'moderation', subject: 'Reported profile with fraudulent credentials', status: 'new', priority: 'critical', risk: 'high', reporter: 'System', reporterAvatar: 'SY', target: 'John Fake', targetAvatar: 'JF', category: 'Fraud', created: '45m ago', updated: '45m ago', slaDeadline: '15m', slaBreach: true, actions: 0, notes: 0 },
  { id: 'CS-8897', type: 'trust', subject: 'IP mismatch detected on enterprise account', status: 'assigned', priority: 'high', risk: 'high', reporter: 'System', reporterAvatar: 'SY', target: 'TechVentures Inc.', targetAvatar: 'TV', assignee: 'Trust Ops', category: 'Security', created: '1h ago', updated: '20m ago', slaDeadline: '2h', slaBreach: false, actions: 2, notes: 1 },
  { id: 'CS-8895', type: 'ticket', subject: 'Billing dispute — double charge on subscription', status: 'pending_review', priority: 'medium', risk: 'low', reporter: 'Priya Gupta', reporterAvatar: 'PG', assignee: 'Agent Lee', category: 'Billing', created: '4h ago', updated: '1h ago', slaDeadline: '4h', slaBreach: false, actions: 3, notes: 2 },
  { id: 'CS-8892', type: 'moderation', subject: 'Hate speech reported in community group', status: 'escalated', priority: 'critical', risk: 'critical', reporter: 'Sarah Chen', reporterAvatar: 'SC', target: 'User_X99', targetAvatar: 'UX', assignee: 'Sr. Moderator', category: 'Content', created: '3h ago', updated: '45m ago', actions: 6, notes: 4, slaBreach: true },
  { id: 'CS-8890', type: 'trust', subject: 'Multiple accounts linked to single payment method', status: 'in_progress', priority: 'high', risk: 'high', reporter: 'System', reporterAvatar: 'SY', target: 'Suspect Cluster', targetAvatar: 'SC', assignee: 'Trust Lead', category: 'Multi-account', created: '6h ago', updated: '2h ago', slaDeadline: '6h', slaBreach: false, actions: 5, notes: 3 },
  { id: 'CS-8885', type: 'escalation', subject: 'Arbitration appeal — DSP-1039 outcome contested', status: 'assigned', priority: 'critical', risk: 'medium', reporter: 'Marcus Thompson', reporterAvatar: 'MT', assignee: 'Legal Review', category: 'Disputes', created: '1d ago', updated: '4h ago', slaDeadline: '2d', slaBreach: false, actions: 8, notes: 6 },
  { id: 'CS-8880', type: 'ticket', subject: 'Feature request — bulk export of contracts', status: 'resolved', priority: 'low', risk: 'none', reporter: 'Lina Park', reporterAvatar: 'LP', assignee: 'Agent Kim', category: 'Feature', created: '2d ago', updated: '1d ago', actions: 2, notes: 1, slaBreach: false },
  { id: 'CS-8875', type: 'moderation', subject: 'Spam listings flagged by automated scan', status: 'closed', priority: 'medium', risk: 'low', reporter: 'System', reporterAvatar: 'SY', target: 'Bulk Poster', targetAvatar: 'BP', assignee: 'Auto-Mod', category: 'Spam', created: '3d ago', updated: '2d ago', actions: 3, notes: 1, slaBreach: false },
  { id: 'CS-8870', type: 'trust', subject: 'Seller verification documents expired', status: 'locked', priority: 'medium', risk: 'medium', reporter: 'System', reporterAvatar: 'SY', target: 'DevCraft Agency', targetAvatar: 'DC', category: 'Verification', created: '5d ago', updated: '3d ago', actions: 1, notes: 0, slaBreach: false },
];

const AUDIT_LOG: AuditEntry[] = [
  { id: 'AU-1', caseId: 'CS-8899', actor: 'System', action: 'Auto-flagged profile', time: '45m ago', detail: 'Credential verification failed — document mismatch detected.', scope: 'moderation' },
  { id: 'AU-2', caseId: 'CS-8901', actor: 'Agent Kim', action: 'Updated case status', time: '30m ago', detail: 'Changed from assigned to in_progress. Contacting finance team.', scope: 'ticket' },
  { id: 'AU-3', caseId: 'CS-8892', actor: 'Sr. Moderator', action: 'Escalated case', time: '45m ago', detail: 'Content violates platform policy §4.2. Escalated for account review.', scope: 'moderation' },
  { id: 'AU-4', caseId: 'CS-8897', actor: 'Trust Ops', action: 'Risk assessment updated', time: '20m ago', detail: 'IP geolocation mismatch confirmed. Session invalidation pending approval.', scope: 'trust' },
  { id: 'AU-5', caseId: 'CS-8890', actor: 'Trust Lead', action: 'Evidence linked', time: '2h ago', detail: 'Linked 3 accounts to shared payment fingerprint. Investigation ongoing.', scope: 'trust' },
];

const STATUS_COLORS: Record<CaseStatus, string> = {
  new: 'bg-primary/10 text-primary',
  assigned: 'bg-accent/10 text-accent',
  in_progress: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  pending_review: 'bg-accent/10 text-accent',
  escalated: 'bg-destructive/10 text-destructive',
  resolved: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  closed: 'bg-muted text-muted-foreground',
  locked: 'bg-destructive/10 text-destructive',
};
const STATUS_ICONS: Record<CaseStatus, React.ElementType> = {
  new: CircleDot, assigned: Users, in_progress: RefreshCw, pending_review: Eye,
  escalated: AlertCircle, resolved: CheckCircle2, closed: XCircle, locked: Lock,
};
const PRIORITY_COLORS: Record<CasePriority, string> = {
  low: 'bg-muted text-muted-foreground', medium: 'bg-primary/10 text-primary',
  high: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]', critical: 'bg-destructive/10 text-destructive',
};
const RISK_COLORS: Record<RiskLevel, string> = {
  none: 'bg-muted text-muted-foreground', low: 'bg-muted text-muted-foreground',
  medium: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  high: 'bg-destructive/10 text-destructive', critical: 'bg-destructive/15 text-destructive',
};
const TYPE_COLORS: Record<QueueType, string> = {
  ticket: 'bg-primary/10 text-primary', moderation: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  trust: 'bg-destructive/10 text-destructive', escalation: 'bg-accent/10 text-accent',
};

// ── Inspector Drawer ──
const CaseDrawer: React.FC<{ c: QueueCase | null; open: boolean; onClose: () => void }> = ({ c, open, onClose }) => {
  if (!c) return null;
  const SIcon = STATUS_ICONS[c.status];
  const caseAudit = AUDIT_LOG.filter(a => a.caseId === c.id);
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[500px] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-accent" />Case Inspector</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="pb-3 border-b">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <Badge variant="secondary" className="text-[7px] font-mono">{c.id}</Badge>
              <Badge className={cn('text-[6px] border-0 capitalize', TYPE_COLORS[c.type])}>{c.type}</Badge>
              <Badge className={cn('text-[6px] border-0 capitalize gap-0.5', STATUS_COLORS[c.status])}><SIcon className="h-2 w-2" />{c.status.replace('_', ' ')}</Badge>
              {c.slaBreach && <Badge className="text-[6px] border-0 bg-destructive/10 text-destructive gap-0.5"><Timer className="h-2 w-2" />SLA Breach</Badge>}
            </div>
            <div className="text-[12px] font-semibold">{c.subject}</div>
            <div className="text-[8px] text-muted-foreground mt-0.5">{c.category} · Created {c.created} · Updated {c.updated}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border p-2">
              <div className="text-[7px] text-muted-foreground mb-1">Reporter</div>
              <div className="flex items-center gap-1.5"><Avatar className="h-5 w-5"><AvatarFallback className="text-[5px]">{c.reporterAvatar}</AvatarFallback></Avatar><span className="text-[9px] font-medium">{c.reporter}</span></div>
            </div>
            {c.target && (
              <div className="rounded-md border p-2">
                <div className="text-[7px] text-muted-foreground mb-1">Target</div>
                <div className="flex items-center gap-1.5"><Avatar className="h-5 w-5"><AvatarFallback className="text-[5px]">{c.targetAvatar}</AvatarFallback></Avatar><span className="text-[9px] font-medium">{c.target}</span></div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { l: 'Priority', v: c.priority, icon: AlertTriangle },
              { l: 'Risk', v: c.risk, icon: ShieldAlert },
              { l: 'SLA', v: c.slaDeadline || '—', icon: Timer },
              { l: 'Assignee', v: c.assignee || 'Unassigned', icon: Users },
              { l: 'Actions', v: String(c.actions), icon: Zap },
              { l: 'Notes', v: String(c.notes), icon: FileText },
            ].map(m => (
              <div key={m.l} className="rounded-md border p-2 flex items-start gap-1.5">
                <m.icon className="h-3 w-3 text-muted-foreground mt-0.5" />
                <div><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-[9px] font-medium capitalize">{m.v}</div></div>
              </div>
            ))}
          </div>

          {c.slaBreach && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 flex items-start gap-2">
              <Timer className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <div className="text-[8px]"><span className="font-semibold">SLA Breached.</span> This case has exceeded its response deadline. Immediate action required.</div>
            </div>
          )}

          {c.status === 'locked' && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 flex items-start gap-2">
              <Lock className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <div className="text-[8px]"><span className="font-semibold">Case Locked.</span> This case requires elevated permissions to modify. Contact a supervisor.</div>
            </div>
          )}

          {caseAudit.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold mb-1.5 flex items-center gap-1"><History className="h-3 w-3 text-accent" />Audit Trail</div>
              <div className="space-y-1">
                {caseAudit.map(a => (
                  <div key={a.id} className="p-1.5 rounded-md border text-[8px]">
                    <div className="flex items-center justify-between"><span className="font-semibold">{a.action}</span><Badge variant="secondary" className="text-[5px]">{a.scope}</Badge></div>
                    <div className="text-[6px] text-muted-foreground">{a.actor} · {a.time}</div>
                    <p className="text-muted-foreground mt-0.5">{a.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            {!['resolved', 'closed', 'locked'].includes(c.status) && (
              <>
                {!c.assignee && <Button size="sm" className="h-6 text-[9px] gap-1"><Users className="h-2.5 w-2.5" />Assign</Button>}
                <Button size="sm" className="h-6 text-[9px] gap-1"><Send className="h-2.5 w-2.5" />Respond</Button>
                <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><AlertCircle className="h-2.5 w-2.5" />Escalate</Button>
                {c.type === 'moderation' && <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 text-destructive"><UserX className="h-2.5 w-2.5" />Warn User</Button>}
                {c.type === 'trust' && <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 text-destructive"><Ban className="h-2.5 w-2.5" />Suspend</Button>}
              </>
            )}
            {c.status !== 'closed' && <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><CheckCircle2 className="h-2.5 w-2.5" />Resolve</Button>}
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><XCircle className="h-2.5 w-2.5" />Close</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── SLA Strip ──
const SLAStrip: React.FC = () => {
  const breached = CASES.filter(c => c.slaBreach).length;
  const atRisk = CASES.filter(c => !c.slaBreach && c.slaDeadline && parseInt(c.slaDeadline) <= 2).length;
  const healthy = CASES.filter(c => !['resolved','closed'].includes(c.status) && !c.slaBreach).length;
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-1.5 mb-3">
      <div className="text-[9px] font-semibold flex items-center gap-1"><Activity className="h-3.5 w-3.5 text-accent" />SLA</div>
      <div className="flex items-center gap-1 text-[8px]"><div className="h-2 w-2 rounded-full bg-destructive" /><span className="font-medium">{breached} breached</span></div>
      <div className="flex items-center gap-1 text-[8px]"><div className="h-2 w-2 rounded-full bg-[hsl(var(--gigvora-amber))]" /><span className="font-medium">{atRisk} at risk</span></div>
      <div className="flex items-center gap-1 text-[8px]"><div className="h-2 w-2 rounded-full bg-[hsl(var(--state-healthy))]" /><span className="font-medium">{healthy} healthy</span></div>
      <div className="flex-1" />
      <Progress value={Math.round((1 - breached / Math.max(CASES.length, 1)) * 100)} className="w-24 h-1.5" />
      <span className="text-[7px] text-muted-foreground">{Math.round((1 - breached / Math.max(CASES.length, 1)) * 100)}% on-track</span>
    </div>
  );
};

// ── Main Page ──
const AdminOpsPage: React.FC = () => {
  const { activeRole } = useRole();
  const [selected, setSelected] = useState<QueueCase | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = CASES.filter(c => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.subject.toLowerCase().includes(search.toLowerCase()) && !c.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const topStrip = (
    <>
      <Shield className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Ops & Trust Centre</span>
      <div className="flex-1" />
      <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-6 rounded-md border bg-background px-1.5 text-[8px]">
        <option value="all">All Types</option>
        <option value="ticket">Tickets</option>
        <option value="moderation">Moderation</option>
        <option value="trust">Trust</option>
        <option value="escalation">Escalations</option>
      </select>
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-6 rounded-md border bg-background px-1.5 text-[8px]">
        <option value="all">All Statuses</option>
        <option value="new">New</option>
        <option value="assigned">Assigned</option>
        <option value="in_progress">In Progress</option>
        <option value="escalated">Escalated</option>
        <option value="pending_review">Pending Review</option>
        <option value="resolved">Resolved</option>
        <option value="locked">Locked</option>
      </select>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cases..." className="h-6 rounded-md border bg-background pl-7 pr-2 text-[8px] w-36 focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Queue Summary" icon={<Inbox className="h-3.5 w-3.5 text-accent" />}>
        <div className="space-y-1 text-[8px]">
          {[
            { l: 'Tickets', v: CASES.filter(c => c.type === 'ticket').length, color: 'text-primary' },
            { l: 'Moderation', v: CASES.filter(c => c.type === 'moderation').length, color: 'text-[hsl(var(--gigvora-amber))]' },
            { l: 'Trust', v: CASES.filter(c => c.type === 'trust').length, color: 'text-destructive' },
            { l: 'Escalations', v: CASES.filter(c => c.type === 'escalation').length, color: 'text-accent' },
          ].map(q => (
            <div key={q.l} className="flex justify-between"><span className="text-muted-foreground">{q.l}</span><span className={cn('font-semibold', q.color)}>{q.v}</span></div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Risk Flags" icon={<ShieldAlert className="h-3.5 w-3.5 text-destructive" />}>
        <div className="space-y-1">
          {CASES.filter(c => c.risk === 'high' || c.risk === 'critical').slice(0, 4).map(c => (
            <button key={c.id} onClick={() => setSelected(c)} className="flex items-center gap-1.5 p-1.5 rounded-md w-full text-left hover:bg-muted/30 transition-colors text-[8px]">
              <ShieldAlert className={cn('h-3 w-3 shrink-0', c.risk === 'critical' ? 'text-destructive' : 'text-[hsl(var(--gigvora-amber))]')} />
              <div className="flex-1 min-w-0"><div className="font-medium truncate">{c.id}</div><div className="text-[6px] text-muted-foreground truncate">{c.subject}</div></div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Agent Stats" icon={<BarChart3 className="h-3.5 w-3.5 text-primary" />}>
        <div className="space-y-1 text-[8px]">
          {[
            { agent: 'Agent Kim', open: 2, resolved: 14 },
            { agent: 'Agent Lee', open: 1, resolved: 11 },
            { agent: 'Trust Ops', open: 2, resolved: 8 },
            { agent: 'Sr. Moderator', open: 1, resolved: 19 },
          ].map(a => (
            <div key={a.agent} className="flex items-center justify-between">
              <span className="text-muted-foreground">{a.agent}</span>
              <div className="flex gap-1">
                <Badge variant="secondary" className="text-[5px]">{a.open} open</Badge>
                <Badge className="text-[5px] border-0 bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]">{a.resolved}</Badge>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions">
        <div className="space-y-0.5">
          {[
            { label: 'View All Queues', icon: Inbox },
            { label: 'Knowledge Gaps', icon: FileText },
            { label: 'Bulk Actions', icon: Zap },
            { label: 'Export Report', icon: ArrowUpRight },
          ].map(a => (
            <button key={a.label} className="flex items-center gap-2 p-1.5 rounded-md w-full text-left hover:bg-muted/30 transition-colors text-[8px]">
              <a.icon className="h-3 w-3 text-muted-foreground" /><span>{a.label}</span>
              <ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Audit Log</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {AUDIT_LOG.map(a => (
          <div key={a.id} className="shrink-0 rounded-lg border bg-card px-3 py-2 min-w-[220px]">
            <div className="flex items-center gap-1 mb-0.5"><Badge variant="secondary" className="text-[6px] capitalize">{a.scope}</Badge><span className="text-[6px] text-muted-foreground">{a.caseId}</span></div>
            <div className="text-[8px] font-medium">{a.action}</div>
            <p className="text-[7px] text-muted-foreground line-clamp-2 mt-0.5">{a.detail}</p>
            <div className="text-[6px] text-muted-foreground mt-0.5">{a.actor} · {a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {topStrip && (
        <div className="flex items-center gap-2 flex-wrap rounded-lg border bg-card px-4 py-2.5">
          {topStrip}
        </div>
      )}
      <div className="flex gap-4">
        <div className="flex-1 min-w-0 space-y-4">
      <KPIBand className="mb-2">
        <KPICard label="Open Cases" value={String(CASES.filter(c => !['resolved','closed'].includes(c.status)).length)} change="Active queue" />
        <KPICard label="SLA Breaches" value={String(CASES.filter(c => c.slaBreach).length)} change="Needs action" />
        <KPICard label="Critical Risk" value={String(CASES.filter(c => c.risk === 'critical').length)} change="Flags" />
        <KPICard label="Resolved Today" value="7" change="+12% vs avg" trend="up" />
      </KPIBand>

      <SLAStrip />

      <Tabs defaultValue="queue">
        <TabsList className="mb-3 flex-wrap h-auto gap-0.5">
          <TabsTrigger value="queue" className="gap-1 text-[10px] h-6 px-2"><Inbox className="h-3 w-3" />Queue</TabsTrigger>
          <TabsTrigger value="moderation" className="gap-1 text-[10px] h-6 px-2"><Flag className="h-3 w-3" />Moderation</TabsTrigger>
          <TabsTrigger value="trust" className="gap-1 text-[10px] h-6 px-2"><ShieldAlert className="h-3 w-3" />Trust & Safety</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1 text-[10px] h-6 px-2"><History className="h-3 w-3" />Audit</TabsTrigger>
        </TabsList>

        {/* Queue */}
        <TabsContent value="queue">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-[8px] text-muted-foreground font-medium">
                  <th className="text-left px-2 py-1.5">Case</th>
                  <th className="text-center px-2 py-1.5">Type</th>
                  <th className="text-center px-2 py-1.5">Status</th>
                  <th className="text-center px-2 py-1.5">Priority</th>
                  <th className="text-center px-2 py-1.5">Risk</th>
                  <th className="text-left px-2 py-1.5">Assignee</th>
                  <th className="text-left px-2 py-1.5">SLA</th>
                  <th className="text-left px-2 py-1.5 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const SIcon = STATUS_ICONS[c.status];
                  return (
                    <tr key={c.id} onClick={() => setSelected(c)} className={cn('border-t text-[8px] hover:bg-muted/30 cursor-pointer', c.slaBreach && 'bg-destructive/[0.02]')}>
                      <td className="px-2 py-1.5">
                        <div className="font-medium flex items-center gap-1">{c.subject}{c.slaBreach && <Timer className="h-2.5 w-2.5 text-destructive" />}</div>
                        <div className="text-[6px] text-muted-foreground">{c.id} · {c.category} · {c.reporter}{c.target ? ` → ${c.target}` : ''}</div>
                      </td>
                      <td className="px-2 py-1.5 text-center"><Badge className={cn('text-[5px] border-0 capitalize', TYPE_COLORS[c.type])}>{c.type}</Badge></td>
                      <td className="px-2 py-1.5 text-center"><Badge className={cn('text-[5px] border-0 capitalize gap-0.5', STATUS_COLORS[c.status])}><SIcon className="h-2 w-2" />{c.status.replace('_', ' ')}</Badge></td>
                      <td className="px-2 py-1.5 text-center"><Badge className={cn('text-[5px] border-0 capitalize', PRIORITY_COLORS[c.priority])}>{c.priority}</Badge></td>
                      <td className="px-2 py-1.5 text-center"><Badge className={cn('text-[5px] border-0 capitalize', RISK_COLORS[c.risk])}>{c.risk}</Badge></td>
                      <td className="px-2 py-1.5 text-muted-foreground">{c.assignee || '—'}</td>
                      <td className="px-2 py-1.5"><span className={cn('text-[7px] font-medium', c.slaBreach ? 'text-destructive' : 'text-muted-foreground')}>{c.slaDeadline || '—'}</span></td>
                      <td className="px-2 py-1.5"><Button variant="ghost" size="sm" className="h-4 w-4 p-0"><MoreHorizontal className="h-3 w-3" /></Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Moderation */}
        <TabsContent value="moderation">
          <div className="space-y-1.5">
            {CASES.filter(c => c.type === 'moderation').map(c => {
              const SIcon = STATUS_ICONS[c.status];
              return (
                <div key={c.id} onClick={() => setSelected(c)} className={cn('rounded-lg border bg-card p-3 cursor-pointer hover:border-ring/50 transition-colors', c.slaBreach && 'border-destructive/30')}>
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="secondary" className="text-[7px] font-mono">{c.id}</Badge>
                      <Badge className={cn('text-[6px] border-0 capitalize gap-0.5', STATUS_COLORS[c.status])}><SIcon className="h-2 w-2" />{c.status.replace('_', ' ')}</Badge>
                      <Badge className={cn('text-[6px] border-0 capitalize', RISK_COLORS[c.risk])}>Risk: {c.risk}</Badge>
                      {c.slaBreach && <Badge className="text-[6px] border-0 bg-destructive/10 text-destructive gap-0.5"><Timer className="h-2 w-2" />SLA Breach</Badge>}
                    </div>
                  </div>
                  <div className="text-[11px] font-semibold">{c.subject}</div>
                  <div className="text-[7px] text-muted-foreground mt-0.5">{c.category} · Reporter: {c.reporter} · Target: {c.target || '—'}</div>
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" className="h-5 text-[7px] gap-0.5"><Eye className="h-2 w-2" />Review</Button>
                    <Button variant="outline" size="sm" className="h-5 text-[7px] gap-0.5 text-destructive"><UserX className="h-2 w-2" />Warn</Button>
                    <Button variant="outline" size="sm" className="h-5 text-[7px] gap-0.5 text-destructive"><Ban className="h-2 w-2" />Suspend</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Trust & Safety */}
        <TabsContent value="trust">
          <div className="space-y-1.5">
            {CASES.filter(c => c.type === 'trust').map(c => {
              const SIcon = STATUS_ICONS[c.status];
              return (
                <div key={c.id} onClick={() => setSelected(c)} className="rounded-lg border bg-card p-3 cursor-pointer hover:border-ring/50 transition-colors">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="secondary" className="text-[7px] font-mono">{c.id}</Badge>
                      <Badge className={cn('text-[6px] border-0 capitalize gap-0.5', STATUS_COLORS[c.status])}><SIcon className="h-2 w-2" />{c.status.replace('_', ' ')}</Badge>
                      <Badge className={cn('text-[6px] border-0 capitalize', RISK_COLORS[c.risk])}>Risk: {c.risk}</Badge>
                    </div>
                  </div>
                  <div className="text-[11px] font-semibold">{c.subject}</div>
                  <div className="text-[7px] text-muted-foreground mt-0.5">{c.category} · Target: {c.target || '—'} · Assigned: {c.assignee || 'Unassigned'}</div>
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" className="h-5 text-[7px] gap-0.5"><ShieldCheck className="h-2 w-2" />Investigate</Button>
                    <Button variant="outline" size="sm" className="h-5 text-[7px] gap-0.5"><Lock className="h-2 w-2" />Lock Account</Button>
                    <Button variant="outline" size="sm" className="h-5 text-[7px] gap-0.5"><AlertCircle className="h-2 w-2" />Escalate</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Audit */}
        <TabsContent value="audit">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-[8px] text-muted-foreground font-medium">
                  <th className="text-left px-3 py-2">Action</th>
                  <th className="text-left px-3 py-2">Case</th>
                  <th className="text-left px-3 py-2">Actor</th>
                  <th className="text-left px-3 py-2">Scope</th>
                  <th className="text-left px-3 py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {AUDIT_LOG.map(a => (
                  <tr key={a.id} className="border-t text-[8px] hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <div className="font-medium">{a.action}</div>
                      <div className="text-[6px] text-muted-foreground line-clamp-1">{a.detail}</div>
                    </td>
                    <td className="px-3 py-2 font-mono text-muted-foreground">{a.caseId}</td>
                    <td className="px-3 py-2">{a.actor}</td>
                    <td className="px-3 py-2"><Badge variant="secondary" className="text-[5px] capitalize">{a.scope}</Badge></td>
                    <td className="px-3 py-2 text-muted-foreground">{a.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <CaseDrawer c={selected} open={!!selected} onClose={() => setSelected(null)} />
        </div>
        {rightRail && (
          <aside className="hidden lg:block shrink-0 w-52">
            <div className="sticky top-4 space-y-3">{rightRail}</div>
          </aside>
        )}
      </div>
      {bottomSection && (
        <div className="rounded-lg border bg-card overflow-hidden">{bottomSection}</div>
      )}
    </div>
  );
};

export default AdminOpsPage;
