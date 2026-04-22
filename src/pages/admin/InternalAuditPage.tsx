import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import {
  Activity, Search, Clock, Filter, Download, Eye, ChevronRight,
  Shield, AlertTriangle, Users, Settings, FileText, RefreshCw,
  Gavel, Terminal, History, Globe, Key, Database, Radio,
  Flag, Lock, Ban, CheckCircle2, XCircle, Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AuditEntry {
  id: string; actor: string; actorRole: string; action: string; target: string;
  scope: string; timestamp: string; severity: 'info' | 'warning' | 'critical';
  env: string; ip: string; sessionId: string; details: string;
}

interface ReviewItem {
  id: string; type: 'policy-change' | 'role-escalation' | 'data-export' | 'killswitch' | 'override';
  title: string; requestedBy: string; status: 'pending' | 'approved' | 'rejected' | 'expired';
  priority: string; created: string; approvers: string[]; description: string;
}

const AUDIT_ENTRIES: AuditEntry[] = [
  { id: 'AUD-001', actor: 'S.Admin', actorRole: 'Super Admin', action: 'Feature flag toggled', target: 'ai_matching_v2 → rollout 45%', scope: 'Platform', timestamp: '2h ago', severity: 'warning', env: 'production', ip: '192.168.1.42', sessionId: 'sess_8821', details: 'Coverage changed from 30% to 45% on production environment' },
  { id: 'AUD-002', actor: 'System', actorRole: 'Automated', action: 'Auto-scaling triggered', target: 'Worker pool expanded 4→8', scope: 'Infrastructure', timestamp: '3h ago', severity: 'info', env: 'production', ip: 'internal', sessionId: 'sys_auto', details: 'CPU threshold exceeded 80% for 5 minutes, scaling policy triggered' },
  { id: 'AUD-003', actor: 'R.Patel', actorRole: 'Trust & Safety', action: 'User suspended', target: 'USR-2210 — Trust violation', scope: 'Users', timestamp: '4h ago', severity: 'critical', env: 'production', ip: '10.0.1.15', sessionId: 'sess_9012', details: 'Multi-account fraud detected. 3 linked payment methods. All accounts suspended pending review.' },
  { id: 'AUD-004', actor: 'K.Wong', actorRole: 'Customer Service', action: 'User impersonation', target: 'USR-4821 for ticket TKT-992', scope: 'Support', timestamp: '5h ago', severity: 'critical', env: 'production', ip: '10.0.1.22', sessionId: 'sess_7734', details: 'Impersonation session started for troubleshooting withdrawal issue. Duration: 12 minutes.' },
  { id: 'AUD-005', actor: 'M.Chen', actorRole: 'Moderator', action: 'Content removed', target: 'Post #45821 — Hate speech', scope: 'Moderation', timestamp: '6h ago', severity: 'warning', env: 'production', ip: '10.0.1.8', sessionId: 'sess_6601', details: 'Post violated Community Guidelines Section 4.2. User warned (strike 2 of 3).' },
  { id: 'AUD-006', actor: 'A.Chen', actorRole: 'Finance Admin', action: 'Killswitch activated', target: 'SMS notifications disabled', scope: 'Communications', timestamp: '1d ago', severity: 'critical', env: 'production', ip: '10.0.1.33', sessionId: 'sess_5520', details: 'SMS provider outage detected. All SMS notifications paused to prevent delivery failures.' },
  { id: 'AUD-007', actor: 'System', actorRole: 'Automated', action: 'Certificate renewed', target: 'SSL cert for *.gigvora.com', scope: 'Infrastructure', timestamp: '2d ago', severity: 'info', env: 'production', ip: 'internal', sessionId: 'sys_cert', details: 'Automatic renewal via ACME protocol. New expiry: 2027-04-14.' },
  { id: 'AUD-008', actor: 'S.Admin', actorRole: 'Super Admin', action: 'Role assignment changed', target: 'K.Wong promoted to Senior Agent', scope: 'IAM', timestamp: '3d ago', severity: 'warning', env: 'production', ip: '192.168.1.42', sessionId: 'sess_4410', details: 'Customer Service Agent promoted to Senior Agent. Permissions expanded to include escalation management.' },
];

const REVIEW_ITEMS: ReviewItem[] = [
  { id: 'REV-001', type: 'policy-change', title: 'Update refund policy — extend grace period to 30 days', requestedBy: 'Finance Team', status: 'pending', priority: 'high', created: '2h ago', approvers: ['S.Admin', 'Legal'], description: 'Extend the auto-refund grace period from 14 to 30 days for enterprise accounts.' },
  { id: 'REV-002', type: 'role-escalation', title: 'Temporary Super Admin access for M.Chen', requestedBy: 'R.Patel', status: 'pending', priority: 'critical', created: '1h ago', approvers: ['S.Admin'], description: 'Emergency access for investigating multi-account fraud ring. Duration: 4 hours.' },
  { id: 'REV-003', type: 'data-export', title: 'Export user transaction data — compliance audit', requestedBy: 'Compliance', status: 'approved', priority: 'medium', created: '1d ago', approvers: ['S.Admin', 'Legal'], description: 'GDPR data export for regulatory compliance audit. Scope: all EU users, last 12 months.' },
  { id: 'REV-004', type: 'killswitch', title: 'Activate read-only mode for DB migration', requestedBy: 'Engineering', status: 'pending', priority: 'high', created: '4h ago', approvers: ['S.Admin', 'Platform Lead'], description: 'Platform-wide read-only mode for 2-hour maintenance window. Scheduled: tonight 02:00 UTC.' },
  { id: 'REV-005', type: 'override', title: 'Rate limit override for enterprise migration', requestedBy: 'Enterprise Team', status: 'approved', priority: 'medium', created: '2d ago', approvers: ['S.Admin'], description: 'Temporary 5x rate limit for TechVentures during data migration. Expires in 24h.' },
];

const sevColor = (s: string) => s === 'critical' ? 'bg-destructive/10 text-destructive' : s === 'warning' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : 'bg-muted text-muted-foreground';
const reviewTypeIcon: Record<string, React.ElementType> = {
  'policy-change': FileText, 'role-escalation': Shield, 'data-export': Database, 'killswitch': Lock, 'override': Flag,
};
const reviewStatusColor = (s: string) => s === 'pending' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : s === 'approved' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : s === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground';

const InternalAuditPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState<'all' | 'info' | 'warning' | 'critical'>('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [activeTab, setActiveTab] = useState('audit');

  const filteredEntries = AUDIT_ENTRIES.filter(e => {
    if (sevFilter !== 'all' && e.severity !== sevFilter) return false;
    if (search && !e.action.toLowerCase().includes(search.toLowerCase()) && !e.target.toLowerCase().includes(search.toLowerCase()) && !e.actor.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pendingReviews = REVIEW_ITEMS.filter(r => r.status === 'pending').length;

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-4">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-lg font-bold flex items-center gap-2"><Activity className="h-5 w-5 text-accent" />Audit & Review Center</h1>
        <Badge className="text-[7px] bg-accent/10 text-accent border-0">{AUDIT_ENTRIES.length} entries</Badge>
        {pendingReviews > 0 && <Badge className="text-[7px] bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))] border-0">{pendingReviews} pending reviews</Badge>}
        <div className="flex-1" />
        <Button size="sm" variant="outline" className="h-7 text-[8px] rounded-lg gap-1" onClick={() => toast.success('Audit log exported')}>
          <Download className="h-3 w-3" />Export
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="audit" className="text-[9px] gap-1"><History className="h-3 w-3" />Audit Log</TabsTrigger>
          <TabsTrigger value="reviews" className="text-[9px] gap-1"><Eye className="h-3 w-3" />Pending Reviews ({pendingReviews})</TabsTrigger>
          <TabsTrigger value="sessions" className="text-[9px] gap-1"><Users className="h-3 w-3" />Active Sessions</TabsTrigger>
        </TabsList>

        {/* ═══ AUDIT LOG ═══ */}
        <TabsContent value="audit">
          {/* Filters */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search actions, targets, actors..." className="pl-8 h-7 text-[9px] rounded-lg" />
            </div>
            {(['all', 'critical', 'warning', 'info'] as const).map(s => (
              <button key={s} onClick={() => setSevFilter(s)} className={cn('px-2 py-1 rounded-lg text-[8px] font-semibold transition-all capitalize', sevFilter === s ? 'bg-accent/10 text-accent' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50')}>
                {s === 'all' ? `All (${AUDIT_ENTRIES.length})` : `${s} (${AUDIT_ENTRIES.filter(e => e.severity === s).length})`}
              </button>
            ))}
          </div>

          {/* Entries */}
          <div className="space-y-1">
            {filteredEntries.map(entry => (
              <div
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className="rounded-xl border bg-card p-3 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0', sevColor(entry.severity))}>
                    {entry.severity === 'critical' ? <AlertTriangle className="h-3.5 w-3.5" /> :
                     entry.severity === 'warning' ? <Flag className="h-3.5 w-3.5" /> :
                     <Activity className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-semibold">{entry.action}</span>
                      <Badge className={cn('text-[6px] border-0 capitalize', sevColor(entry.severity))}>{entry.severity}</Badge>
                      <Badge variant="outline" className="text-[6px]">{entry.env}</Badge>
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">{entry.target}</div>
                    <div className="flex items-center gap-2 mt-1 text-[7px] text-muted-foreground">
                      <span className="font-medium text-foreground/70">{entry.actor}</span>
                      <span>·</span>
                      <span>{entry.actorRole}</span>
                      <span>·</span>
                      <span>{entry.scope}</span>
                      <span>·</span>
                      <Clock className="h-2 w-2" /><span>{entry.timestamp}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ═══ REVIEWS ═══ */}
        <TabsContent value="reviews">
          <div className="space-y-2">
            {REVIEW_ITEMS.map(item => {
              const TypeIcon = reviewTypeIcon[item.type] || FileText;
              return (
                <div key={item.id} className="rounded-xl border bg-card p-3">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-semibold">{item.title}</span>
                        <Badge className={cn('text-[6px] border-0 capitalize', reviewStatusColor(item.status))}>{item.status}</Badge>
                        <Badge variant="outline" className="text-[6px] capitalize">{item.type.replace('-', ' ')}</Badge>
                      </div>
                      <div className="text-[8px] text-muted-foreground mt-0.5">{item.description}</div>
                      <div className="flex items-center gap-2 mt-1.5 text-[7px] text-muted-foreground">
                        <span>By: <span className="font-medium text-foreground/70">{item.requestedBy}</span></span>
                        <span>·</span>
                        <span>Approvers: {item.approvers.join(', ')}</span>
                        <span>·</span>
                        <Clock className="h-2 w-2" /><span>{item.created}</span>
                      </div>
                      {item.status === 'pending' && (
                        <div className="flex gap-1.5 mt-2">
                          <Button size="sm" className="h-6 text-[8px] rounded-lg gap-1" onClick={() => toast.success(`Approved: ${item.id}`)}>
                            <CheckCircle2 className="h-2.5 w-2.5" />Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 text-[8px] rounded-lg gap-1" onClick={() => toast.info(`Rejected: ${item.id}`)}>
                            <XCircle className="h-2.5 w-2.5" />Reject
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 text-[8px] rounded-lg gap-1">
                            <Eye className="h-2.5 w-2.5" />Details
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ═══ ACTIVE SESSIONS ═══ */}
        <TabsContent value="sessions">
          <div className="space-y-1.5">
            {[
              { user: 'S.Admin', role: 'Super Admin', ip: '192.168.1.42', device: 'MacBook Pro · Chrome', started: '4h ago', expires: '28m', env: 'production' },
              { user: 'R.Patel', role: 'Trust & Safety', ip: '10.0.1.15', device: 'Windows · Edge', started: '2h ago', expires: '2h', env: 'production' },
              { user: 'K.Wong', role: 'Customer Service', ip: '10.0.1.22', device: 'MacBook Air · Safari', started: '1h ago', expires: '3h', env: 'production' },
              { user: 'M.Chen', role: 'Moderator', ip: '10.0.1.8', device: 'Linux · Firefox', started: '45m ago', expires: '3h 15m', env: 'production' },
              { user: 'A.Lopez', role: 'Finance Admin', ip: '10.0.1.33', device: 'Windows · Chrome', started: '30m ago', expires: '3h 30m', env: 'staging' },
            ].map((session, i) => (
              <div key={i} className="rounded-xl border bg-card p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Users className="h-3.5 w-3.5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold">{session.user}</div>
                  <div className="text-[8px] text-muted-foreground">{session.role} · {session.device}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[8px] font-medium">IP: {session.ip}</div>
                  <div className="text-[7px] text-muted-foreground">Expires: {session.expires}</div>
                </div>
                <Badge variant="outline" className="text-[6px] shrink-0">{session.env}</Badge>
                <Button size="sm" variant="ghost" className="h-6 text-[7px] rounded-lg text-destructive hover:text-destructive hover:bg-destructive/5" onClick={() => toast.success(`Session terminated: ${session.user}`)}>
                  Terminate
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══ Audit Detail Drawer ═══ */}
      <Sheet open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <SheetContent className="w-[400px] p-0">
          {selectedEntry && (
            <>
              <SheetHeader className="px-4 pt-4 pb-3 border-b">
                <SheetTitle className="text-sm flex items-center gap-2">
                  <Badge className={cn('text-[7px] border-0 capitalize', sevColor(selectedEntry.severity))}>{selectedEntry.severity}</Badge>
                  {selectedEntry.id}
                </SheetTitle>
              </SheetHeader>
              <div className="p-4 space-y-3">
                <div className="rounded-xl border bg-muted/20 p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-[8px]">
                    <div><span className="text-muted-foreground">Action:</span> <span className="font-medium">{selectedEntry.action}</span></div>
                    <div><span className="text-muted-foreground">Actor:</span> <span className="font-medium">{selectedEntry.actor}</span></div>
                    <div><span className="text-muted-foreground">Role:</span> <span className="font-medium">{selectedEntry.actorRole}</span></div>
                    <div><span className="text-muted-foreground">Scope:</span> <span className="font-medium">{selectedEntry.scope}</span></div>
                    <div><span className="text-muted-foreground">IP:</span> <span className="font-mono">{selectedEntry.ip}</span></div>
                    <div><span className="text-muted-foreground">Session:</span> <span className="font-mono">{selectedEntry.sessionId}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Target:</span> <span className="font-medium">{selectedEntry.target}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Time:</span> <span className="font-medium">{selectedEntry.timestamp}</span></div>
                  </div>
                </div>
                <div>
                  <div className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Details</div>
                  <div className="rounded-xl border p-3 text-[9px] leading-relaxed">{selectedEntry.details}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-[8px] rounded-lg gap-1"><Eye className="h-3 w-3" />View Full Context</Button>
                  <Button size="sm" variant="outline" className="h-7 text-[8px] rounded-lg gap-1"><Download className="h-3 w-3" />Export</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default InternalAuditPage;
