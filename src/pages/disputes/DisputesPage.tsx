import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import {
  Scale, Search, Plus, FileText, Upload, ChevronRight, History,
  AlertTriangle, Clock, CheckCircle2, XCircle, Shield, Eye,
  MessageSquare, Users, Gavel, DollarSign, Paperclip, Ban,
  CircleDot, AlertCircle, RefreshCw, ArrowUpRight, Lock,
  MoreHorizontal, Send, Flag, Bookmark, TrendingUp,
  Timer, FileImage, ExternalLink, Banknote, X,
  Zap, Target, Layers, GitBranch, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

// ── Types ──
type DisputeStatus = 'raised' | 'formal' | 'open' | 'mediation' | 'arbitration' | 'resolved' | 'closed' | 'timed_out';
type DisputePriority = 'low' | 'medium' | 'high' | 'critical';
type EvidenceType = 'document' | 'screenshot' | 'message_log' | 'invoice' | 'contract' | 'video';

interface Dispute {
  id: string; title: string; status: DisputeStatus; priority: DisputePriority;
  category: string; amount: number; currency: string;
  claimant: string; claimantAvatar: string;
  respondent: string; respondentAvatar: string;
  contract?: string; created: string; updated: string; deadline?: string;
  evidenceCount: number; responseCount: number; holdActive: boolean;
  slaRisk?: boolean;
}

interface Evidence {
  id: string; disputeId: string; type: EvidenceType; name: string;
  submittedBy: string; time: string; size: string; verified: boolean;
}

interface TimelineEvent {
  id: string; disputeId: string; action: string; actor: string;
  time: string; detail: string; type: 'system' | 'claimant' | 'respondent' | 'mediator' | 'arbitrator';
}

// ── Mock Data ──
const DISPUTES: Dispute[] = [
  { id: 'DSP-1042', title: 'Milestone deliverables not matching specifications', status: 'mediation', priority: 'high', category: 'Delivery', amount: 4500, currency: 'USD', claimant: 'Sarah Chen', claimantAvatar: 'SC', respondent: 'DevCraft Agency', respondentAvatar: 'DC', contract: 'CTR-2281', created: '5d ago', updated: '2h ago', deadline: '3 days', evidenceCount: 7, responseCount: 4, holdActive: true, slaRisk: true },
  { id: 'DSP-1039', title: 'Payment withheld after project completion', status: 'arbitration', priority: 'critical', category: 'Payment', amount: 12000, currency: 'USD', claimant: 'Marcus Thompson', claimantAvatar: 'MT', respondent: 'TechVentures Inc.', respondentAvatar: 'TV', contract: 'CTR-2190', created: '2w ago', updated: '6h ago', deadline: '5 days', evidenceCount: 12, responseCount: 8, holdActive: true },
  { id: 'DSP-1035', title: 'Scope creep without contract amendment', status: 'open', priority: 'medium', category: 'Contract', amount: 2800, currency: 'USD', claimant: 'Priya Gupta', claimantAvatar: 'PG', respondent: 'James O\'Brien', respondentAvatar: 'JO', contract: 'CTR-2145', created: '1w ago', updated: '1d ago', deadline: '7 days', evidenceCount: 3, responseCount: 1, holdActive: false },
  { id: 'DSP-1030', title: 'Unauthorized use of delivered assets', status: 'raised', priority: 'high', category: 'IP Rights', amount: 8500, currency: 'USD', claimant: 'Lina Park', claimantAvatar: 'LP', respondent: 'MediaFlow Co.', respondentAvatar: 'MF', created: '3d ago', updated: '3d ago', evidenceCount: 2, responseCount: 0, holdActive: false, slaRisk: true },
  { id: 'DSP-1025', title: 'Late delivery penalty dispute', status: 'resolved', priority: 'low', category: 'Delivery', amount: 1200, currency: 'USD', claimant: 'Alex Rivera', claimantAvatar: 'AR', respondent: 'QuickCode LLC', respondentAvatar: 'QC', contract: 'CTR-2098', created: '1m ago', updated: '2w ago', evidenceCount: 5, responseCount: 3, holdActive: false },
  { id: 'DSP-1018', title: 'Quality of work below agreed standards', status: 'closed', priority: 'medium', category: 'Quality', amount: 3200, currency: 'USD', claimant: 'Nina Volkov', claimantAvatar: 'NV', respondent: 'PixelPerfect Studio', respondentAvatar: 'PP', contract: 'CTR-2050', created: '2m ago', updated: '1m ago', evidenceCount: 9, responseCount: 6, holdActive: false },
  { id: 'DSP-1010', title: 'Refund request for cancelled project', status: 'timed_out', priority: 'low', category: 'Refund', amount: 600, currency: 'USD', claimant: 'Tom Harley', claimantAvatar: 'TH', respondent: 'Freelance Joe', respondentAvatar: 'FJ', created: '3m ago', updated: '2m ago', evidenceCount: 1, responseCount: 0, holdActive: false },
];

const EVIDENCE_ITEMS: Evidence[] = [
  { id: 'EV-1', disputeId: 'DSP-1042', type: 'contract', name: 'Original Contract CTR-2281.pdf', submittedBy: 'Sarah Chen', time: '5d ago', size: '2.4 MB', verified: true },
  { id: 'EV-2', disputeId: 'DSP-1042', type: 'screenshot', name: 'Deliverable comparison screenshots.zip', submittedBy: 'Sarah Chen', time: '4d ago', size: '18.7 MB', verified: true },
  { id: 'EV-3', disputeId: 'DSP-1042', type: 'message_log', name: 'Chat log — specification discussions', submittedBy: 'System', time: '4d ago', size: '340 KB', verified: true },
  { id: 'EV-4', disputeId: 'DSP-1042', type: 'document', name: 'Revised scope document.docx', submittedBy: 'DevCraft Agency', time: '3d ago', size: '1.1 MB', verified: false },
  { id: 'EV-5', disputeId: 'DSP-1042', type: 'invoice', name: 'Invoice INV-4421.pdf', submittedBy: 'DevCraft Agency', time: '3d ago', size: '890 KB', verified: true },
  { id: 'EV-6', disputeId: 'DSP-1039', type: 'contract', name: 'Master Agreement CTR-2190.pdf', submittedBy: 'Marcus Thompson', time: '2w ago', size: '3.1 MB', verified: true },
  { id: 'EV-7', disputeId: 'DSP-1039', type: 'screenshot', name: 'Completion confirmation email.png', submittedBy: 'Marcus Thompson', time: '2w ago', size: '1.2 MB', verified: true },
];

const TIMELINE_EVENTS: TimelineEvent[] = [
  { id: 'T-1', disputeId: 'DSP-1042', action: 'Dispute raised', actor: 'Sarah Chen', time: '5d ago', detail: 'Filed dispute citing deliverable mismatch with contracted specifications.', type: 'claimant' },
  { id: 'T-2', disputeId: 'DSP-1042', action: 'Evidence submitted', actor: 'Sarah Chen', time: '4d ago', detail: 'Uploaded contract and comparison screenshots as supporting evidence.', type: 'claimant' },
  { id: 'T-3', disputeId: 'DSP-1042', action: 'Escrow hold activated', actor: 'System', time: '4d ago', detail: '$4,500 placed on hold pending dispute resolution.', type: 'system' },
  { id: 'T-4', disputeId: 'DSP-1042', action: 'Response filed', actor: 'DevCraft Agency', time: '3d ago', detail: 'Submitted revised scope document and invoice as counter-evidence.', type: 'respondent' },
  { id: 'T-5', disputeId: 'DSP-1042', action: 'Mediation initiated', actor: 'System', time: '2d ago', detail: 'Case assigned to mediator. Both parties notified of 72h mediation window.', type: 'system' },
  { id: 'T-6', disputeId: 'DSP-1042', action: 'Mediator note', actor: 'Mediator Kim', time: '2h ago', detail: 'Reviewed evidence from both parties. Scheduling joint session for resolution.', type: 'mediator' },
  { id: 'T-7', disputeId: 'DSP-1039', action: 'Dispute raised', actor: 'Marcus Thompson', time: '2w ago', detail: 'Filed dispute for payment withholding after confirmed project completion.', type: 'claimant' },
  { id: 'T-8', disputeId: 'DSP-1039', action: 'Escalated to arbitration', actor: 'System', time: '1w ago', detail: 'Mediation unsuccessful. Case elevated to formal arbitration.', type: 'system' },
  { id: 'T-9', disputeId: 'DSP-1039', action: 'Arbitrator assigned', actor: 'System', time: '5d ago', detail: 'Senior arbitrator Dr. Elena Torres assigned. Hearing scheduled.', type: 'arbitrator' },
];

const STATUS_CFG: Record<DisputeStatus, { badge: 'healthy' | 'caution' | 'blocked' | 'pending' | 'live' | 'review' | 'premium'; label: string; icon: React.ElementType }> = {
  raised: { badge: 'caution', label: 'Raised', icon: Flag },
  formal: { badge: 'review', label: 'Formal', icon: FileText },
  open: { badge: 'live', label: 'Open', icon: CircleDot },
  mediation: { badge: 'review', label: 'Mediation', icon: Users },
  arbitration: { badge: 'blocked', label: 'Arbitration', icon: Gavel },
  resolved: { badge: 'healthy', label: 'Resolved', icon: CheckCircle2 },
  closed: { badge: 'pending', label: 'Closed', icon: XCircle },
  timed_out: { badge: 'pending', label: 'Timed Out', icon: Timer },
};

const PRIORITY_COLORS: Record<DisputePriority, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-primary/10 text-primary',
  high: 'bg-[hsl(var(--state-caution))]/10 text-[hsl(var(--state-caution))]',
  critical: 'bg-destructive/10 text-destructive',
};

const EVIDENCE_ICONS: Record<EvidenceType, React.ElementType> = {
  document: FileText, screenshot: FileImage, message_log: MessageSquare,
  invoice: Banknote, contract: FileText, video: Eye,
};

const TL_COLORS: Record<string, string> = {
  system: 'border-muted-foreground/30', claimant: 'border-primary/50',
  respondent: 'border-[hsl(var(--state-caution))]/50', mediator: 'border-accent/50',
  arbitrator: 'border-destructive/50',
};

// ── Intake Form Modal ──
const IntakeModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative flex justify-center items-start pt-[6vh] px-4" onClick={e => e.stopPropagation()}>
        <div className="w-full max-w-lg bg-card rounded-2xl border shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <h2 className="font-semibold text-sm flex items-center gap-2"><Flag className="h-4 w-4 text-destructive" />File a Dispute</h2>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold mb-1 block">Category</label>
                <select className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]">
                  <option>Delivery Issue</option><option>Payment Dispute</option><option>Contract Breach</option>
                  <option>Quality Concern</option><option>IP Rights</option><option>Refund Request</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold mb-1 block">Priority</label>
                <select className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]">
                  <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block">Related Contract (optional)</label>
              <input className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]" placeholder="CTR-XXXX" />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block">Title</label>
              <input className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]" placeholder="Brief description of the dispute..." />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block">Disputed Amount</label>
              <input type="number" className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]" placeholder="0.00" />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block">Description</label>
              <textarea className="w-full h-20 rounded-xl border bg-background px-3 py-2 text-[10px] resize-none" placeholder="Provide full details of the issue..." />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block">Evidence</label>
              <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-accent/50 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <div className="text-[9px] text-muted-foreground">Click to upload · PDF, images, ZIP up to 50MB</div>
              </div>
            </div>
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-2.5 text-[9px] flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <span>Filing a dispute may trigger an escrow hold on related funds. Both parties will be notified and given 7 days to respond.</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-5 py-3 border-t">
            <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl" onClick={onClose}>Cancel</Button>
            <Button size="sm" className="h-8 text-[10px] gap-1 rounded-xl bg-destructive hover:bg-destructive/90" onClick={() => { toast.warning('Dispute filed'); onClose(); }}><Flag className="h-3 w-3" />File Dispute</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Dispute Detail Drawer ──
const DisputeDrawer: React.FC<{ dispute: Dispute | null; open: boolean; onClose: () => void }> = ({ dispute, open, onClose }) => {
  if (!dispute) return null;
  const cfg = STATUS_CFG[dispute.status];
  const evidence = EVIDENCE_ITEMS.filter(e => e.disputeId === dispute.id);
  const timeline = TIMELINE_EVENTS.filter(t => t.disputeId === dispute.id);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b">
          <SheetTitle className="text-sm flex items-center gap-2"><Scale className="h-4 w-4 text-accent" />Case Detail</SheetTitle>
        </SheetHeader>
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="pb-3 border-b">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <Badge variant="secondary" className="text-[7px] font-mono">{dispute.id}</Badge>
              <StatusBadge status={cfg.badge} label={cfg.label} />
              <Badge className={cn('text-[6px] border-0 capitalize', PRIORITY_COLORS[dispute.priority])}>{dispute.priority}</Badge>
              {dispute.holdActive && <Badge className="text-[6px] border-0 bg-destructive/10 text-destructive gap-0.5"><Lock className="h-2 w-2" />Hold</Badge>}
              {dispute.slaRisk && <Badge className="text-[6px] border-0 bg-destructive/10 text-destructive gap-0.5"><Timer className="h-2 w-2" />SLA Risk</Badge>}
            </div>
            <div className="text-[12px] font-semibold mt-1">{dispute.title}</div>
            <div className="text-[8px] text-muted-foreground mt-0.5">{dispute.category} · Created {dispute.created}{dispute.contract && ` · ${dispute.contract}`}</div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Claimant', name: dispute.claimant, avatar: dispute.claimantAvatar },
              { label: 'Respondent', name: dispute.respondent, avatar: dispute.respondentAvatar },
            ].map(p => (
              <div key={p.label} className="rounded-2xl border p-2.5">
                <div className="text-[7px] text-muted-foreground mb-1">{p.label}</div>
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-6 w-6 ring-2 ring-accent/20"><AvatarFallback className="text-[5px] bg-accent/10 text-accent">{p.avatar}</AvatarFallback></Avatar>
                  <span className="text-[9px] font-medium">{p.name}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: 'Amount', v: `$${dispute.amount.toLocaleString()}`, icon: DollarSign },
              { l: 'Evidence', v: String(dispute.evidenceCount), icon: Paperclip },
              { l: 'Deadline', v: dispute.deadline || '—', icon: Timer },
            ].map(m => (
              <div key={m.l} className="rounded-xl border p-2 flex items-start gap-1.5">
                <m.icon className="h-3 w-3 text-muted-foreground mt-0.5" />
                <div><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-[9px] font-semibold">{m.v}</div></div>
              </div>
            ))}
          </div>

          {/* Hold Banner */}
          {dispute.holdActive && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-2.5 flex items-start gap-2">
              <Lock className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <div className="text-[8px]"><span className="font-semibold">Escrow Hold Active.</span> ${dispute.amount.toLocaleString()} held pending resolution.</div>
            </div>
          )}

          {dispute.slaRisk && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-2.5 flex items-start gap-2">
              <Timer className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <div className="text-[8px]"><span className="font-semibold">SLA Breach Risk.</span> Response deadline approaching. Action required within {dispute.deadline}.</div>
            </div>
          )}

          {/* Evidence */}
          {evidence.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold mb-1.5 flex items-center gap-1"><Paperclip className="h-3 w-3 text-accent" />Evidence ({evidence.length})</div>
              <div className="space-y-1">
                {evidence.map(e => {
                  const EIcon = EVIDENCE_ICONS[e.type];
                  return (
                    <div key={e.id} className="p-2 rounded-xl border text-[8px] flex items-center gap-2 hover:bg-muted/20 transition-colors">
                      <EIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{e.name}</div>
                        <div className="text-[6px] text-muted-foreground">{e.submittedBy} · {e.time} · {e.size}</div>
                      </div>
                      {e.verified ? <Badge className="text-[5px] border-0 bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]">Verified</Badge> : <Badge className="text-[5px] border-0 bg-[hsl(var(--state-caution))]/10 text-[hsl(var(--state-caution))]">Pending</Badge>}
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0"><Eye className="h-2.5 w-2.5" /></Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold mb-1.5 flex items-center gap-1"><History className="h-3 w-3 text-accent" />Timeline</div>
              <div className="space-y-0">
                {timeline.map((t, i) => (
                  <div key={t.id} className={cn('pl-3 pb-2 text-[8px]', i < timeline.length - 1 && 'border-l-2', TL_COLORS[t.type] || 'border-muted')}>
                    <div className="relative">
                      <div className="absolute -left-[17px] top-0.5 h-2 w-2 rounded-full bg-background border-2 border-current" />
                      <div className="font-semibold">{t.action}</div>
                      <div className="text-[6px] text-muted-foreground">{t.actor} · {t.time}</div>
                      <p className="text-muted-foreground mt-0.5">{t.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dispute.status === 'timed_out' && (
            <div className="rounded-2xl border border-[hsl(var(--state-caution))]/30 bg-[hsl(var(--state-caution))]/5 p-2.5 flex items-start gap-2">
              <Timer className="h-3.5 w-3.5 text-[hsl(var(--state-caution))] shrink-0 mt-0.5" />
              <div className="text-[8px]"><span className="font-semibold">Case Timed Out.</span> No response received. You may reopen or escalate.</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            {['raised', 'open', 'formal'].includes(dispute.status) && (
              <>
                <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><Upload className="h-3 w-3" />Upload Evidence</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><Send className="h-3 w-3" />Respond</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><Users className="h-3 w-3" />Request Mediation</Button>
              </>
            )}
            {dispute.status === 'mediation' && (
              <>
                <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><Gavel className="h-3 w-3" />Request Arbitration</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><CheckCircle2 className="h-3 w-3" />Accept Resolution</Button>
              </>
            )}
            {dispute.status === 'arbitration' && (
              <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><Eye className="h-3 w-3" />View Hearing</Button>
            )}
            {dispute.status === 'timed_out' && <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><RefreshCw className="h-3 w-3" />Reopen</Button>}
            {dispute.status === 'resolved' && <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><Flag className="h-3 w-3" />Appeal</Button>}
            <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><MessageSquare className="h-3 w-3" />Message</Button>
            {dispute.contract && <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl" asChild><Link to="/contracts"><FileText className="h-3 w-3" />Contract</Link></Button>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Cases Table ──
const CasesTable: React.FC<{ disputes: Dispute[]; onSelect: (d: Dispute) => void }> = ({ disputes, onSelect }) => (
  <div className="rounded-2xl border overflow-hidden">
    <table className="w-full">
      <thead className="bg-muted/50">
        <tr className="text-[9px] text-muted-foreground font-medium">
          <th className="text-left px-3 py-2">Case</th>
          <th className="text-center px-3 py-2">Status</th>
          <th className="text-center px-3 py-2">Priority</th>
          <th className="text-right px-3 py-2">Amount</th>
          <th className="text-left px-3 py-2">Deadline</th>
          <th className="text-center px-3 py-2">Evidence</th>
          <th className="text-left px-3 py-2 w-10"></th>
        </tr>
      </thead>
      <tbody>
        {disputes.map(d => {
          const cfg = STATUS_CFG[d.status];
          return (
            <tr key={d.id} onClick={() => onSelect(d)} className="border-t text-[9px] hover:bg-muted/20 cursor-pointer transition-colors">
              <td className="px-3 py-2.5">
                <div className="font-medium flex items-center gap-1">
                  {d.title}
                  {d.holdActive && <Lock className="h-2.5 w-2.5 text-destructive" />}
                  {d.slaRisk && <Timer className="h-2.5 w-2.5 text-destructive" />}
                </div>
                <div className="text-[7px] text-muted-foreground">{d.id} · {d.category} · {d.claimant} vs {d.respondent}</div>
              </td>
              <td className="px-3 py-2 text-center"><StatusBadge status={cfg.badge} label={cfg.label} /></td>
              <td className="px-3 py-2 text-center"><Badge className={cn('text-[6px] border-0 capitalize', PRIORITY_COLORS[d.priority])}>{d.priority}</Badge></td>
              <td className="px-3 py-2 text-right font-semibold">${d.amount.toLocaleString()}</td>
              <td className="px-3 py-2 text-muted-foreground">{d.deadline || '—'}</td>
              <td className="px-3 py-2 text-center"><Badge variant="secondary" className="text-[6px]">{d.evidenceCount}</Badge></td>
              <td className="px-3 py-2"><Button variant="ghost" size="sm" className="h-5 text-[7px]"><MoreHorizontal className="h-3 w-3" /></Button></td>
            </tr>
          );
        })}
      </tbody>
    </table>
    {disputes.length === 0 && (
      <div className="p-8 text-center">
        <Scale className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
        <div className="text-[10px] font-semibold">No Disputes Found</div>
        <div className="text-[8px] text-muted-foreground">Adjust filters or open a new dispute.</div>
      </div>
    )}
  </div>
);

// ── Evidence Tab ──
const EvidenceTab: React.FC = () => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-accent" />
        <h3 className="text-[11px] font-semibold">All Evidence</h3>
        <Badge variant="secondary" className="text-[7px]">{EVIDENCE_ITEMS.length} items</Badge>
      </div>
      <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl"><Upload className="h-3 w-3" />Upload</Button>
    </div>
    <div className="space-y-1.5">
      {EVIDENCE_ITEMS.map(e => {
        const EIcon = EVIDENCE_ICONS[e.type];
        return (
          <div key={e.id} className="rounded-2xl border bg-card p-3 flex items-center gap-3 hover:shadow-sm transition-all hover:-translate-y-px">
            <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0"><EIcon className="h-4 w-4 text-accent" /></div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold">{e.name}</div>
              <div className="text-[7px] text-muted-foreground">{e.submittedBy} · {e.time} · {e.size} · Case {e.disputeId}</div>
            </div>
            {e.verified ? <Badge className="text-[6px] border-0 bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]">Verified</Badge> : <Badge className="text-[6px] border-0 bg-[hsl(var(--state-caution))]/10 text-[hsl(var(--state-caution))]">Pending</Badge>}
            <Button variant="outline" size="sm" className="h-6 text-[8px] gap-0.5 rounded-xl"><Eye className="h-2.5 w-2.5" />View</Button>
          </div>
        );
      })}
    </div>
  </div>
);

// ── Mediation Tab ──
const MediationTab: React.FC<{ onSelect: (d: Dispute) => void }> = ({ onSelect }) => {
  const mediationCases = DISPUTES.filter(d => d.status === 'mediation');
  const eligibleCases = DISPUTES.filter(d => ['raised', 'open', 'formal'].includes(d.status));

  return (
    <div className="space-y-4">
      {mediationCases.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-accent" />
            <h3 className="text-[11px] font-semibold">Active Mediation</h3>
            <Badge className="text-[7px] bg-accent/10 text-accent">{mediationCases.length}</Badge>
          </div>
          {mediationCases.map(d => (
            <div key={d.id} className="rounded-2xl border border-accent/30 bg-accent/5 p-4 mb-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-[10px] font-semibold flex items-center gap-1">{d.title}<Badge variant="secondary" className="text-[6px] font-mono">{d.id}</Badge></div>
                  <div className="text-[8px] text-muted-foreground">{d.claimant} vs {d.respondent} · ${d.amount.toLocaleString()} · Deadline: {d.deadline}</div>
                </div>
              </div>
              <div className="rounded-xl bg-card border p-3 mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="h-5 w-5"><AvatarFallback className="text-[5px] bg-accent/10 text-accent">MK</AvatarFallback></Avatar>
                  <div>
                    <div className="text-[9px] font-medium">Mediator Kim</div>
                    <div className="text-[7px] text-muted-foreground">Assigned 2d ago · Session scheduled</div>
                  </div>
                </div>
                <p className="text-[8px] text-muted-foreground">Reviewed evidence from both parties. Scheduling joint session for resolution attempt.</p>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><MessageSquare className="h-3 w-3" />Join Session</Button>
                <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Upload className="h-3 w-3" />Add Evidence</Button>
                <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Escalation requested')}><Gavel className="h-3 w-3" />Escalate</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => onSelect(d)}><Eye className="h-3 w-3" />Detail</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {eligibleCases.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold mb-2">Eligible for Mediation</div>
          <div className="space-y-1">
            {eligibleCases.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl border hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => onSelect(d)}>
                <StatusBadge status={STATUS_CFG[d.status].badge} label={STATUS_CFG[d.status].label} />
                <span className="text-[9px] font-medium flex-1">{d.title}</span>
                <span className="text-[9px] font-bold">${d.amount.toLocaleString()}</span>
                <Button size="sm" variant="outline" className="h-5 text-[7px] gap-0.5 rounded-lg" onClick={e => { e.stopPropagation(); toast.info('Mediation requested'); }}><Users className="h-2.5 w-2.5" />Request</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {mediationCases.length === 0 && eligibleCases.length === 0 && (
        <div className="rounded-2xl border p-8 text-center">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <div className="text-[10px] font-medium">No Mediation Cases</div>
          <div className="text-[8px] text-muted-foreground">No cases are currently in mediation.</div>
        </div>
      )}
    </div>
  );
};

// ── Arbitration Tab ──
const ArbitrationTab: React.FC<{ onSelect: (d: Dispute) => void }> = ({ onSelect }) => {
  const arbCases = DISPUTES.filter(d => d.status === 'arbitration');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Gavel className="h-4 w-4 text-destructive" />
        <h3 className="text-[11px] font-semibold">Arbitration Cases</h3>
        <Badge className="text-[7px] bg-destructive/10 text-destructive">{arbCases.length}</Badge>
      </div>

      {arbCases.length > 0 ? arbCases.map(d => (
        <div key={d.id} className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-[10px] font-semibold flex items-center gap-1">{d.title}<Badge variant="secondary" className="text-[6px] font-mono">{d.id}</Badge></div>
              <div className="text-[8px] text-muted-foreground">{d.claimant} vs {d.respondent} · ${d.amount.toLocaleString()}</div>
            </div>
            <StatusBadge status="blocked" label="Arbitration" />
          </div>
          <div className="rounded-xl bg-card border p-3 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <Avatar className="h-5 w-5"><AvatarFallback className="text-[5px] bg-destructive/10 text-destructive">ET</AvatarFallback></Avatar>
              <div>
                <div className="text-[9px] font-medium">Dr. Elena Torres</div>
                <div className="text-[7px] text-muted-foreground">Senior Arbitrator · Assigned 5d ago</div>
              </div>
            </div>
            <p className="text-[8px] text-muted-foreground">Hearing scheduled. Both parties must submit final evidence within 48 hours.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[
              { l: 'Evidence', v: `${d.evidenceCount} items` },
              { l: 'Responses', v: `${d.responseCount}` },
              { l: 'Deadline', v: d.deadline || '—' },
            ].map(m => (
              <div key={m.l} className="rounded-xl border bg-card p-2 text-center">
                <div className="text-[7px] text-muted-foreground">{m.l}</div>
                <div className="text-[9px] font-bold">{m.v}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Upload className="h-3 w-3" />Submit Evidence</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Eye className="h-3 w-3" />View Hearing</Button>
            <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => onSelect(d)}><ArrowRight className="h-3 w-3" />Full Detail</Button>
          </div>
        </div>
      )) : (
        <div className="rounded-2xl border p-8 text-center">
          <Gavel className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <div className="text-[10px] font-medium">No Arbitration Cases</div>
          <div className="text-[8px] text-muted-foreground">Cases escalate to arbitration when mediation is unsuccessful.</div>
        </div>
      )}
    </div>
  );
};

// ── Finance Hold Tab ──
const FinanceHoldTab: React.FC<{ onSelect: (d: Dispute) => void }> = ({ onSelect }) => {
  const holdCases = DISPUTES.filter(d => d.holdActive);
  const totalHeld = holdCases.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-destructive" />
          <h3 className="text-[11px] font-semibold">Escrow Holds</h3>
          <Badge className="text-[7px] bg-destructive/10 text-destructive">${totalHeld.toLocaleString()} held</Badge>
        </div>
      </div>

      {holdCases.length > 0 ? (
        <div className="rounded-2xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-[9px] text-muted-foreground font-medium">
                <th className="text-left px-3 py-2">Case</th>
                <th className="text-left px-3 py-2">Parties</th>
                <th className="text-right px-3 py-2">Amount</th>
                <th className="text-center px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {holdCases.map(d => (
                <tr key={d.id} className="border-t hover:bg-muted/20 transition-colors text-[9px] cursor-pointer" onClick={() => onSelect(d)}>
                  <td className="px-3 py-2">
                    <div className="font-medium">{d.id}</div>
                    <div className="text-[7px] text-muted-foreground truncate max-w-[200px]">{d.title}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <Avatar className="h-4 w-4"><AvatarFallback className="text-[4px]">{d.claimantAvatar}</AvatarFallback></Avatar>
                      <span className="text-muted-foreground">vs</span>
                      <Avatar className="h-4 w-4"><AvatarFallback className="text-[4px]">{d.respondentAvatar}</AvatarFallback></Avatar>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-destructive">${d.amount.toLocaleString()}</td>
                  <td className="px-3 py-2 text-center"><StatusBadge status={STATUS_CFG[d.status].badge} label={STATUS_CFG[d.status].label} /></td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-5 text-[7px] gap-0.5 rounded-lg" onClick={e => { e.stopPropagation(); toast.success('Hold released'); }}><DollarSign className="h-2.5 w-2.5" />Release</Button>
                      <Button size="sm" variant="outline" className="h-5 text-[7px] gap-0.5 rounded-lg" onClick={e => { e.stopPropagation(); toast.info('Refund initiated'); }}><RefreshCw className="h-2.5 w-2.5" />Refund</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/30 text-[9px] font-bold">
                <td className="px-3 py-2" colSpan={2}>Total Held</td>
                <td className="px-3 py-2 text-right text-destructive">${totalHeld.toLocaleString()}</td>
                <td className="px-3 py-2" colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border p-8 text-center">
          <Shield className="h-8 w-8 text-[hsl(var(--state-healthy))] mx-auto mb-2" />
          <div className="text-[10px] font-medium">No Active Holds</div>
          <div className="text-[8px] text-muted-foreground">All funds are currently released.</div>
        </div>
      )}
    </div>
  );
};

// ── Timeline Tab ──
const TimelineTab: React.FC = () => {
  const allEvents = [...TIMELINE_EVENTS].sort((a, b) => b.id.localeCompare(a.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-accent" />
        <h3 className="text-[11px] font-semibold">Full Timeline</h3>
        <Badge variant="secondary" className="text-[7px]">{allEvents.length} events</Badge>
      </div>
      <div className="space-y-0">
        {allEvents.map((t, i) => (
          <div key={t.id} className={cn('pl-3 pb-2.5 text-[8px]', i < allEvents.length - 1 && 'border-l-2', TL_COLORS[t.type] || 'border-muted')}>
            <div className="relative">
              <div className="absolute -left-[17px] top-0.5 h-2.5 w-2.5 rounded-full bg-background border-2 border-accent" />
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">{t.action}</span>
                <Badge variant="secondary" className="text-[5px] font-mono">{t.disputeId}</Badge>
                <Badge variant="secondary" className="text-[5px] capitalize">{t.type}</Badge>
              </div>
              <div className="text-[6px] text-muted-foreground">{t.actor} · {t.time}</div>
              <p className="text-muted-foreground mt-0.5">{t.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Outcomes Tab ──
const OutcomesTab: React.FC<{ onSelect: (d: Dispute) => void }> = ({ onSelect }) => {
  const closedCases = DISPUTES.filter(d => ['resolved', 'closed', 'timed_out'].includes(d.status));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-[hsl(var(--state-healthy))]" />
        <h3 className="text-[11px] font-semibold">Outcomes & Archive</h3>
        <Badge variant="secondary" className="text-[7px]">{closedCases.length} cases</Badge>
      </div>
      {closedCases.map(d => {
        const cfg = STATUS_CFG[d.status];
        return (
          <div key={d.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all hover:-translate-y-px">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-[11px] font-semibold flex items-center gap-1.5">{d.title}<StatusBadge status={cfg.badge} label={cfg.label} /></div>
                <div className="text-[7px] text-muted-foreground">{d.id} · {d.claimant} vs {d.respondent} · ${d.amount.toLocaleString()}</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[
                { l: 'Outcome', v: d.status === 'resolved' ? 'Partial refund' : d.status === 'timed_out' ? 'Timed out' : 'Dismissed' },
                { l: 'Evidence', v: `${d.evidenceCount} items` },
                { l: 'Duration', v: d.status === 'resolved' ? '18 days' : d.status === 'timed_out' ? '14 days' : '35 days' },
                { l: 'Responses', v: `${d.responseCount}` },
              ].map(m => (
                <div key={m.l} className="rounded-xl border p-2 text-[8px]">
                  <div className="text-[6px] text-muted-foreground">{m.l}</div>
                  <div className="font-medium">{m.v}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 mt-2">
              <Button variant="outline" size="sm" className="h-6 text-[8px] gap-0.5 rounded-xl" onClick={() => onSelect(d)}><Eye className="h-2.5 w-2.5" />View Detail</Button>
              {d.status === 'resolved' && <Button variant="outline" size="sm" className="h-6 text-[8px] gap-0.5 rounded-xl" onClick={() => toast.info('Appeal filed')}><Flag className="h-2.5 w-2.5" />Appeal</Button>}
              {d.status === 'timed_out' && <Button variant="outline" size="sm" className="h-6 text-[8px] gap-0.5 rounded-xl" onClick={() => toast.info('Case reopened')}><RefreshCw className="h-2.5 w-2.5" />Reopen</Button>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Main Page ──
const DisputesPage: React.FC = () => {
  const { activeRole } = useRole();
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [intakeOpen, setIntakeOpen] = useState(false);

  const filtered = useMemo(() => DISPUTES.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase()) && !d.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [statusFilter, search]);

  const activeHolds = DISPUTES.filter(d => d.holdActive);
  const totalHeld = activeHolds.reduce((s, d) => s + d.amount, 0);
  const activeCases = DISPUTES.filter(d => !['resolved', 'closed', 'timed_out'].includes(d.status)).length;
  const slaRiskCount = DISPUTES.filter(d => d.slaRisk).length;

  const topStrip = (
    <>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-xl bg-destructive/10 flex items-center justify-center"><Scale className="h-3.5 w-3.5 text-destructive" /></div>
        <span className="text-xs font-bold">Disputes & Arbitration</span>
        {slaRiskCount > 0 && <Badge className="text-[7px] bg-destructive/10 text-destructive gap-0.5"><AlertTriangle className="h-2.5 w-2.5" />{slaRiskCount} SLA Risk</Badge>}
      </div>
      <div className="flex-1" />
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-6 rounded-xl border bg-background px-1.5 text-[8px]">
        <option value="all">All Statuses</option>
        <option value="raised">Raised</option>
        <option value="open">Open</option>
        <option value="mediation">Mediation</option>
        <option value="arbitration">Arbitration</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
        <option value="timed_out">Timed Out</option>
      </select>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cases..." className="h-6 rounded-xl border bg-background pl-7 pr-2 text-[8px] w-40 focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl bg-destructive hover:bg-destructive/90" onClick={() => setIntakeOpen(true)}><Plus className="h-3 w-3" />Open Dispute</Button>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Escrow Holds" icon={<Lock className="h-3.5 w-3.5 text-destructive" />} className="!rounded-2xl">
        <div className="text-center py-1">
          <div className="text-lg font-bold text-destructive">${totalHeld.toLocaleString()}</div>
          <div className="text-[7px] text-muted-foreground">{activeHolds.length} active holds</div>
        </div>
        <div className="space-y-1 mt-1">
          {activeHolds.map(d => (
            <button key={d.id} onClick={() => setSelected(d)} className="flex items-center justify-between p-1.5 rounded-xl w-full text-left hover:bg-muted/20 transition-colors text-[8px]">
              <div className="min-w-0"><div className="font-medium truncate">{d.id}</div><div className="text-[6px] text-muted-foreground">{d.claimant}</div></div>
              <span className="font-semibold text-destructive">${d.amount.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Resolution Stats" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[8px]">
          {[
            { l: 'Avg Resolution', v: '6.2 days' },
            { l: 'Mediation Success', v: '78%' },
            { l: 'Escalation Rate', v: '14%' },
            { l: 'Appeal Rate', v: '8%' },
          ].map(s => (
            <div key={s.l} className="flex justify-between"><span className="text-muted-foreground">{s.l}</span><span className="font-semibold">{s.v}</span></div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Quick Links" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { label: 'Contracts', icon: FileText, href: '/contracts' },
            { label: 'Finance Hub', icon: DollarSign, href: '/finance' },
            { label: 'Trust & Safety', icon: Shield, href: '/trust' },
            { label: 'Support Center', icon: MessageSquare, href: '/help' },
          ].map(a => (
            <Link key={a.label} to={a.href} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent/5 transition-colors text-[8px] font-medium">
              <a.icon className="h-3 w-3 text-accent" />{a.label}
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Audit Trail</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[
          { action: 'DSP-1042 entered mediation — mediator assigned', time: '2d ago', type: 'mediation' },
          { action: 'Evidence verified for DSP-1039 — 12 items confirmed', time: '3d ago', type: 'evidence' },
          { action: 'DSP-1025 resolved — partial refund of $800 issued', time: '2w ago', type: 'resolved' },
          { action: 'Escrow hold of $12,000 activated for DSP-1039', time: '2w ago', type: 'hold' },
          { action: 'DSP-1010 timed out — no respondent action within 14 days', time: '2m ago', type: 'timeout' },
        ].map((a, i) => (
          <div key={i} className="shrink-0 rounded-xl border bg-card px-3 py-2 min-w-[220px] hover:shadow-sm transition-shadow">
            <Badge variant="secondary" className="text-[6px] capitalize mb-1">{a.type}</Badge>
            <p className="text-[8px] text-muted-foreground line-clamp-2">{a.action}</p>
            <div className="text-[7px] text-muted-foreground mt-0.5">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52" bottomSection={bottomSection}>
      <KPIBand className="mb-3">
        <KPICard label="Active Cases" value={String(activeCases)} change="In progress" />
        <KPICard label="Held Funds" value={`$${totalHeld.toLocaleString()}`} change="Escrow" trend="down" />
        <KPICard label="SLA Risk" value={String(slaRiskCount)} change={slaRiskCount > 0 ? 'Action needed' : 'None'} trend={slaRiskCount > 0 ? 'down' : 'up'} />
        <KPICard label="Resolved" value={String(DISPUTES.filter(d => d.status === 'resolved').length)} change="This quarter" trend="up" />
        <KPICard label="Avg Time" value="6.2d" change="To resolution" trend="up" />
      </KPIBand>

      <Tabs defaultValue="cases">
        <TabsList className="mb-3 flex-wrap h-auto gap-0.5">
          <TabsTrigger value="cases" className="gap-1 text-[10px] h-6 px-2"><Scale className="h-3 w-3" />Cases</TabsTrigger>
          <TabsTrigger value="evidence" className="gap-1 text-[10px] h-6 px-2"><Paperclip className="h-3 w-3" />Evidence</TabsTrigger>
          <TabsTrigger value="mediation" className="gap-1 text-[10px] h-6 px-2"><Users className="h-3 w-3" />Mediation</TabsTrigger>
          <TabsTrigger value="arbitration" className="gap-1 text-[10px] h-6 px-2"><Gavel className="h-3 w-3" />Arbitration</TabsTrigger>
          <TabsTrigger value="holds" className="gap-1 text-[10px] h-6 px-2"><Lock className="h-3 w-3" />Finance Holds</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1 text-[10px] h-6 px-2"><History className="h-3 w-3" />Timeline</TabsTrigger>
          <TabsTrigger value="outcomes" className="gap-1 text-[10px] h-6 px-2"><CheckCircle2 className="h-3 w-3" />Outcomes</TabsTrigger>
        </TabsList>

        <TabsContent value="cases"><CasesTable disputes={filtered} onSelect={setSelected} /></TabsContent>
        <TabsContent value="evidence"><EvidenceTab /></TabsContent>
        <TabsContent value="mediation"><MediationTab onSelect={setSelected} /></TabsContent>
        <TabsContent value="arbitration"><ArbitrationTab onSelect={setSelected} /></TabsContent>
        <TabsContent value="holds"><FinanceHoldTab onSelect={setSelected} /></TabsContent>
        <TabsContent value="timeline"><TimelineTab /></TabsContent>
        <TabsContent value="outcomes"><OutcomesTab onSelect={setSelected} /></TabsContent>
      </Tabs>

      <DisputeDrawer dispute={selected} open={!!selected} onClose={() => setSelected(null)} />
      <IntakeModal open={intakeOpen} onClose={() => setIntakeOpen(false)} />
    </DashboardLayout>
  );
};

export default DisputesPage;
