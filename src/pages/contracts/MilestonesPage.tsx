import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  CheckCircle2, Clock, DollarSign, AlertTriangle, Shield,
  Upload, FileText, X, Send, Eye, MessageSquare,
  ChevronRight, BarChart3, History, Lock, Pen,
  CircleDot, Package, RotateCcw, ThumbsUp, ThumbsDown,
  Briefcase, Calendar, ExternalLink, Flag, Plus,
  Download, Filter, Layers, Target, Archive,
  RefreshCw, Milestone as MilestoneIcon, Search,
  ArrowRight, Settings, Zap, GitBranch, Users,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──
type MilestoneStatus = 'pending' | 'in-progress' | 'submitted' | 'revision-requested' | 'approved' | 'paid' | 'disputed';
type FundingStatus = 'funded' | 'unfunded' | 'partial';

interface Deliverable {
  id: string; name: string; type: 'file' | 'link' | 'text';
  value: string; size?: string; submittedAt: string; version: number;
  milestoneId: string; milestoneName: string;
}

interface RevisionEntry {
  id: string; actor: string; actorAvatar: string; action: string;
  note: string; timestamp: string;
}

interface MilestoneData {
  id: string; number: number; title: string; amount: string; amountNum: number;
  status: MilestoneStatus; funding: FundingStatus;
  dueDate: string; startDate: string;
  deliverables: Deliverable[]; revisions: RevisionEntry[];
  description: string;
}

// ── Mock Data ──
const CONTRACT = {
  id: 'c1', title: 'SaaS Platform Development Contract',
  clientName: 'TechVentures Inc.', clientAvatar: 'TV',
  freelancerName: 'Alex Morgan', freelancerAvatar: 'AM',
  totalValue: 28000, paidAmount: 8000,
};

const MILESTONES: MilestoneData[] = [
  {
    id: 'm1', number: 1, title: 'Architecture & Auth System', amount: '$8,000', amountNum: 8000,
    status: 'paid', funding: 'funded', dueDate: 'Feb 1, 2026', startDate: 'Jan 15, 2026',
    description: 'Set up project architecture, authentication system with RBAC, and CI/CD pipeline.',
    deliverables: [
      { id: 'd1', name: 'Architecture_Docs.pdf', type: 'file', value: 'architecture.pdf', size: '2.4 MB', submittedAt: 'Jan 28', version: 2, milestoneId: 'm1', milestoneName: 'Architecture & Auth' },
      { id: 'd2', name: 'Auth Module Source Code', type: 'link', value: 'https://github.com/repo/pr/42', submittedAt: 'Jan 30', version: 1, milestoneId: 'm1', milestoneName: 'Architecture & Auth' },
      { id: 'd3', name: 'CI/CD Pipeline Config', type: 'file', value: 'pipeline.yml', size: '18 KB', submittedAt: 'Jan 30', version: 1, milestoneId: 'm1', milestoneName: 'Architecture & Auth' },
    ],
    revisions: [
      { id: 'r1', actor: 'TechVentures Inc.', actorAvatar: 'TV', action: 'Approved', note: 'Excellent architecture. Approved and released payment.', timestamp: 'Feb 1, 10:30 AM' },
      { id: 'r2', actor: 'Alex Morgan', actorAvatar: 'AM', action: 'Submitted v2', note: 'Updated architecture docs per feedback.', timestamp: 'Jan 30, 3:15 PM' },
      { id: 'r3', actor: 'TechVentures Inc.', actorAvatar: 'TV', action: 'Revision requested', note: 'Please add database schema diagrams to architecture docs.', timestamp: 'Jan 29, 11:00 AM' },
      { id: 'r4', actor: 'Alex Morgan', actorAvatar: 'AM', action: 'Submitted v1', note: 'Initial deliverables submitted for review.', timestamp: 'Jan 28, 5:00 PM' },
    ],
  },
  {
    id: 'm2', number: 2, title: 'Billing & Core Features', amount: '$12,000', amountNum: 12000,
    status: 'submitted', funding: 'funded', dueDate: 'Mar 8, 2026', startDate: 'Feb 2, 2026',
    description: 'Implement Stripe billing integration, subscription management, and core SaaS features.',
    deliverables: [
      { id: 'd4', name: 'Billing_Integration.zip', type: 'file', value: 'billing.zip', size: '12.8 MB', submittedAt: 'Mar 5', version: 1, milestoneId: 'm2', milestoneName: 'Billing & Core' },
      { id: 'd5', name: 'Subscription API Docs', type: 'link', value: 'https://docs.example.com/billing', submittedAt: 'Mar 5', version: 1, milestoneId: 'm2', milestoneName: 'Billing & Core' },
      { id: 'd6', name: 'Test Coverage Report', type: 'file', value: 'coverage.html', size: '340 KB', submittedAt: 'Mar 5', version: 1, milestoneId: 'm2', milestoneName: 'Billing & Core' },
    ],
    revisions: [
      { id: 'r5', actor: 'Alex Morgan', actorAvatar: 'AM', action: 'Submitted', note: 'All billing features implemented. Test coverage at 84%.', timestamp: 'Mar 5, 4:30 PM' },
    ],
  },
  {
    id: 'm3', number: 3, title: 'Dashboard & Polish', amount: '$5,000', amountNum: 5000,
    status: 'in-progress', funding: 'funded', dueDate: 'Mar 25, 2026', startDate: 'Mar 6, 2026',
    description: 'Build analytics dashboard with customizable widgets, polish UI, and fix UX issues.',
    deliverables: [],
    revisions: [
      { id: 'r6', actor: 'Alex Morgan', actorAvatar: 'AM', action: 'Started', note: 'Beginning dashboard component development.', timestamp: 'Mar 6, 9:00 AM' },
    ],
  },
  {
    id: 'm4', number: 4, title: 'Testing & Launch', amount: '$3,000', amountNum: 3000,
    status: 'pending', funding: 'unfunded', dueDate: 'Apr 15, 2026', startDate: '—',
    description: 'End-to-end testing, performance optimization, documentation, and production deployment.',
    deliverables: [],
    revisions: [],
  },
];

const STATUS_CFG: Record<MilestoneStatus, { badge: 'healthy' | 'caution' | 'blocked' | 'pending' | 'live' | 'review' | 'premium'; label: string; icon: React.ElementType }> = {
  pending: { badge: 'pending', label: 'Pending', icon: CircleDot },
  'in-progress': { badge: 'live', label: 'In Progress', icon: Zap },
  submitted: { badge: 'review', label: 'Awaiting Approval', icon: Eye },
  'revision-requested': { badge: 'caution', label: 'Revision Requested', icon: RotateCcw },
  approved: { badge: 'healthy', label: 'Approved', icon: CheckCircle2 },
  paid: { badge: 'healthy', label: 'Paid', icon: CheckCircle2 },
  disputed: { badge: 'blocked', label: 'Disputed', icon: Flag },
};

const FUNDING_CFG: Record<FundingStatus, { color: string; label: string }> = {
  funded: { color: 'text-[hsl(var(--state-healthy))]', label: 'Funded' },
  unfunded: { color: 'text-[hsl(var(--state-blocked))]', label: 'Unfunded' },
  partial: { color: 'text-[hsl(var(--state-caution))]', label: 'Partial' },
};

// ── Submit Deliverable Modal ──
const SubmitDeliverableModal: React.FC<{ open: boolean; onClose: () => void; milestone: MilestoneData }> = ({ open, onClose, milestone }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative flex justify-center items-start pt-[6vh] px-4" onClick={e => e.stopPropagation()}>
        <div className="w-full max-w-md bg-card rounded-2xl border shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <h2 className="font-semibold text-sm">Submit Deliverable</h2>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="p-5 space-y-3">
            <div className="rounded-xl bg-muted/30 p-3">
              <div className="text-[10px] font-medium">Milestone {milestone.number}: {milestone.title}</div>
              <div className="text-[8px] text-muted-foreground">{milestone.amount} · Due {milestone.dueDate}</div>
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block">Files</label>
              <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-accent/50 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <div className="text-[9px] text-muted-foreground">Click to upload · Any file up to 100MB</div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block">Links (optional)</label>
              <input className="w-full h-7 rounded-xl border bg-background px-3 text-[10px]" placeholder="https://github.com/..." />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block">Notes</label>
              <textarea className="w-full h-16 rounded-xl border bg-background px-3 py-2 text-[10px] resize-none" placeholder="Describe what's included..." />
            </div>
            {milestone.funding === 'unfunded' && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-2.5 flex items-center gap-2 text-[9px] text-destructive">
                <Lock className="h-3.5 w-3.5 shrink-0" />Escrow not funded. Payment held until funded.
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 px-5 py-3 border-t">
            <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl" onClick={onClose}>Cancel</Button>
            <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => { toast.success('Deliverable submitted'); onClose(); }}><Send className="h-3 w-3" />Submit</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Milestone Card ──
const MilestoneCard: React.FC<{ m: MilestoneData; onSelect: (m: MilestoneData) => void; onSubmit: (m: MilestoneData) => void }> = ({ m, onSelect, onSubmit }) => {
  const cfg = STATUS_CFG[m.status];
  const fcfg = FUNDING_CFG[m.funding];
  const isActionable = m.status === 'submitted' || m.status === 'in-progress' || m.status === 'pending' || m.status === 'revision-requested';

  return (
    <div className={cn(
      'rounded-2xl border bg-card transition-all hover:shadow-md',
      m.status === 'submitted' && 'border-accent/40 shadow-sm',
      m.status === 'disputed' && 'border-destructive/30',
    )}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/10 transition-colors" onClick={() => onSelect(m)}>
        <div className="h-8 w-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xs font-bold shrink-0">{m.number}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold">{m.title}</div>
          <div className="text-[8px] text-muted-foreground flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{m.dueDate}</span>
            <span className="flex items-center gap-0.5"><Package className="h-2.5 w-2.5" />{m.deliverables.length} deliverables</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] font-bold">{m.amount}</div>
          <div className={cn('text-[7px] font-medium', fcfg.color)}>{fcfg.label}</div>
        </div>
        <StatusBadge status={cfg.badge} label={cfg.label} />
      </div>

      {m.deliverables.length > 0 && (
        <div className="px-4 pb-2 border-t">
          <div className="flex items-center gap-1.5 flex-wrap pt-2">
            {m.deliverables.slice(0, 3).map(d => (
              <div key={d.id} className="flex items-center gap-1 px-2 py-0.5 rounded-lg border bg-muted/20 text-[8px]">
                <FileText className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="truncate max-w-[100px]">{d.name}</span>
                {d.version > 1 && <Badge variant="secondary" className="text-[5px] px-0.5 h-3">v{d.version}</Badge>}
              </div>
            ))}
            {m.deliverables.length > 3 && <span className="text-[7px] text-muted-foreground">+{m.deliverables.length - 3} more</span>}
          </div>
        </div>
      )}

      {isActionable && (
        <div className="flex items-center gap-1.5 px-4 py-2 border-t bg-muted/5">
          {(m.status === 'in-progress' || m.status === 'revision-requested') && (
            <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={(e) => { e.stopPropagation(); onSubmit(m); }}><Upload className="h-3 w-3" />Submit Deliverable</Button>
          )}
          {m.status === 'submitted' && (
            <>
              <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={(e) => { e.stopPropagation(); toast.success('Approved! Payment released.'); }}><ThumbsUp className="h-3 w-3" />Approve</Button>
              <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={(e) => { e.stopPropagation(); toast.info('Revision requested'); }}><RotateCcw className="h-3 w-3" />Request Revision</Button>
              <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1 rounded-xl text-destructive" onClick={(e) => { e.stopPropagation(); toast.warning('Dispute opened'); }}><Flag className="h-3 w-3" />Dispute</Button>
            </>
          )}
          {m.status === 'pending' && m.funding === 'unfunded' && (
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={(e) => { e.stopPropagation(); toast.success('Escrow funded'); }}><DollarSign className="h-3 w-3" />Fund Escrow</Button>
          )}
          {m.status === 'pending' && m.funding === 'funded' && (
            <div className="text-[8px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Waiting for freelancer</div>
          )}
        </div>
      )}

      {m.status === 'submitted' && (
        <div className="mx-4 mb-3 rounded-xl border border-accent/30 bg-accent/5 p-2.5 flex items-center gap-2 text-[9px]">
          <Eye className="h-3.5 w-3.5 text-accent shrink-0" />
          <span><span className="font-medium">Deliverables submitted for review. </span><span className="text-muted-foreground">Approve to release {m.amount} from escrow.</span></span>
        </div>
      )}
      {m.status === 'revision-requested' && (
        <div className="mx-4 mb-3 rounded-xl border border-[hsl(var(--state-caution))]/30 bg-[hsl(var(--state-caution))]/5 p-2.5 flex items-center gap-2 text-[9px]">
          <RotateCcw className="h-3.5 w-3.5 text-[hsl(var(--state-caution))] shrink-0" />Revision requested. Please review feedback and resubmit.
        </div>
      )}
      {m.status === 'disputed' && (
        <div className="mx-4 mb-3 rounded-xl border border-destructive/30 bg-destructive/5 p-2.5 flex items-center gap-2 text-[9px]">
          <Flag className="h-3.5 w-3.5 text-destructive shrink-0" />Under dispute. Escrow held pending resolution.
        </div>
      )}
    </div>
  );
};

// ── Funding Table Tab ──
const FundingTable: React.FC = () => (
  <div className="rounded-2xl border overflow-hidden">
    <table className="w-full">
      <thead className="bg-muted/50">
        <tr className="text-[9px] text-muted-foreground font-medium">
          <th className="text-left px-3 py-2">#</th>
          <th className="text-left px-3 py-2">Milestone</th>
          <th className="text-left px-3 py-2">Amount</th>
          <th className="text-left px-3 py-2">Escrow</th>
          <th className="text-left px-3 py-2">Status</th>
          <th className="text-left px-3 py-2">Due</th>
          <th className="text-left px-3 py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {MILESTONES.map(m => {
          const cfg = STATUS_CFG[m.status];
          const fcfg = FUNDING_CFG[m.funding];
          return (
            <tr key={m.id} className="border-t hover:bg-muted/20 transition-colors text-[9px]">
              <td className="px-3 py-2 font-bold text-accent">{m.number}</td>
              <td className="px-3 py-2 font-medium">{m.title}</td>
              <td className="px-3 py-2 font-bold">{m.amount}</td>
              <td className="px-3 py-2"><Badge className={cn('text-[7px] rounded-lg', fcfg.color === 'text-[hsl(var(--state-healthy))]' ? 'bg-[hsl(var(--state-healthy))]/10' : fcfg.color === 'text-[hsl(var(--state-blocked))]' ? 'bg-destructive/10' : 'bg-[hsl(var(--state-caution))]/10', fcfg.color)}>{fcfg.label}</Badge></td>
              <td className="px-3 py-2"><StatusBadge status={cfg.badge} label={cfg.label} /></td>
              <td className="px-3 py-2 text-muted-foreground">{m.dueDate}</td>
              <td className="px-3 py-2">
                {m.funding === 'unfunded' && <Button size="sm" variant="outline" className="h-5 text-[7px] gap-0.5 rounded-lg" onClick={() => toast.success('Funded')}><DollarSign className="h-2.5 w-2.5" />Fund</Button>}
                {m.status === 'paid' && <span className="text-[hsl(var(--state-healthy))] flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" />Released</span>}
                {m.status === 'submitted' && <span className="text-accent flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />Review</span>}
                {m.status === 'in-progress' && <span className="text-muted-foreground">In escrow</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="border-t bg-muted/30 text-[9px] font-bold">
          <td className="px-3 py-2" colSpan={2}>Total</td>
          <td className="px-3 py-2">${(CONTRACT.totalValue / 1000).toFixed(0)}K</td>
          <td className="px-3 py-2" colSpan={4}>
            <span className="text-[hsl(var(--state-healthy))]">${(MILESTONES.filter(m => m.funding === 'funded').reduce((s, m) => s + m.amountNum, 0) / 1000).toFixed(0)}K funded</span>
            <span className="text-muted-foreground ml-2">${(MILESTONES.filter(m => m.funding === 'unfunded').reduce((s, m) => s + m.amountNum, 0) / 1000).toFixed(0)}K unfunded</span>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
);

// ── Deliverables Gallery Tab ──
const DeliverablesGallery: React.FC = () => {
  const allDeliverables = MILESTONES.flatMap(m => m.deliverables);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent" />
          <h3 className="text-[11px] font-semibold">All Deliverables</h3>
          <Badge variant="secondary" className="text-[7px]">{allDeliverables.length} files</Badge>
        </div>
        <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Download className="h-3 w-3" />Download All</Button>
      </div>
      {allDeliverables.length === 0 ? (
        <div className="rounded-2xl border p-8 text-center">
          <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <div className="text-[10px] font-medium">No deliverables yet</div>
          <div className="text-[8px] text-muted-foreground">Deliverables will appear here as freelancers submit work.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {allDeliverables.map(d => (
            <div key={d.id} className="rounded-2xl border p-3 hover:shadow-sm transition-all hover:-translate-y-px">
              <div className="flex items-start gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold truncate">{d.name}</div>
                  <div className="text-[8px] text-muted-foreground">{d.type === 'file' ? d.size : 'Link'} · {d.submittedAt}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="secondary" className="text-[6px] rounded-lg">{d.milestoneName}</Badge>
                    {d.version > 1 && <Badge variant="secondary" className="text-[6px] rounded-lg">v{d.version}</Badge>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-5 text-[8px] rounded-lg shrink-0" onClick={() => toast.info('Opening...')}><Eye className="h-2.5 w-2.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Approval/Revision Tab ──
const ApprovalRevisionView: React.FC<{ onSelect: (m: MilestoneData) => void }> = ({ onSelect }) => {
  const awaitingApproval = MILESTONES.filter(m => m.status === 'submitted');
  const revisionRequested = MILESTONES.filter(m => m.status === 'revision-requested');
  const recentlyApproved = MILESTONES.filter(m => m.status === 'approved' || m.status === 'paid');

  return (
    <div className="space-y-4">
      {awaitingApproval.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-accent" />
            <h3 className="text-[11px] font-semibold">Awaiting Approval</h3>
            <Badge className="text-[7px] bg-accent/10 text-accent">{awaitingApproval.length}</Badge>
          </div>
          {awaitingApproval.map(m => (
            <div key={m.id} className="rounded-2xl border border-accent/30 bg-accent/5 p-4 mb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">{m.number}</div>
                  <div>
                    <div className="text-[10px] font-semibold">{m.title}</div>
                    <div className="text-[8px] text-muted-foreground">{m.amount} · {m.deliverables.length} deliverables</div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.success('Approved! Payment released.')}><ThumbsUp className="h-3 w-3" />Approve</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Revision requested')}><RotateCcw className="h-3 w-3" />Revise</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => onSelect(m)}><Eye className="h-3 w-3" />Detail</Button>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {m.deliverables.map(d => (
                  <div key={d.id} className="flex items-center gap-1 px-2 py-1 rounded-lg border bg-card text-[8px]">
                    <FileText className="h-2.5 w-2.5 text-muted-foreground" />{d.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {revisionRequested.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <RotateCcw className="h-4 w-4 text-[hsl(var(--state-caution))]" />
            <h3 className="text-[11px] font-semibold">Revision Requested</h3>
          </div>
          {revisionRequested.map(m => (
            <div key={m.id} className="rounded-2xl border border-[hsl(var(--state-caution))]/30 bg-[hsl(var(--state-caution))]/5 p-3 mb-2">
              <div className="text-[10px] font-semibold">{m.title}</div>
              <div className="text-[8px] text-muted-foreground mt-0.5">Awaiting updated deliverables from freelancer</div>
            </div>
          ))}
        </div>
      )}

      {awaitingApproval.length === 0 && revisionRequested.length === 0 && (
        <div className="rounded-2xl border p-8 text-center">
          <CheckCircle2 className="h-8 w-8 text-[hsl(var(--state-healthy))] mx-auto mb-2" />
          <div className="text-[10px] font-medium">All caught up</div>
          <div className="text-[8px] text-muted-foreground">No milestones currently need approval or revision.</div>
        </div>
      )}

      {recentlyApproved.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-[hsl(var(--state-healthy))]" />
            <h3 className="text-[11px] font-semibold">Recently Approved</h3>
          </div>
          <div className="space-y-1">
            {recentlyApproved.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl border hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => onSelect(m)}>
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--state-healthy))]" />
                <span className="text-[10px] font-medium flex-1">{m.title}</span>
                <span className="text-[9px] font-bold text-[hsl(var(--state-healthy))]">{m.amount}</span>
                <Badge variant="secondary" className="text-[7px]">{m.status === 'paid' ? 'Paid' : 'Approved'}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── History Tab ──
const HistoryTimeline: React.FC = () => {
  const allRevisions = MILESTONES.flatMap(m => m.revisions.map(r => ({ ...r, milestone: m.title, milestoneNum: m.number })))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-accent" />
        <h3 className="text-[11px] font-semibold">Full History</h3>
        <Badge variant="secondary" className="text-[7px]">{allRevisions.length} events</Badge>
      </div>
      <div className="space-y-0">
        {allRevisions.map((r, i) => (
          <div key={r.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <Avatar className="h-6 w-6 shrink-0"><AvatarFallback className="text-[6px] bg-accent/10 text-accent">{r.actorAvatar}</AvatarFallback></Avatar>
              {i < allRevisions.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
            </div>
            <div className="flex-1 pb-3">
              <div className="text-[10px]">
                <span className="font-medium">{r.actor}</span>
                <span className="text-muted-foreground"> {r.action.toLowerCase()}</span>
              </div>
              <div className="text-[8px] text-muted-foreground mt-0.5">{r.note}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-[6px] rounded-lg">M{r.milestoneNum}</Badge>
                <span className="text-[7px] text-muted-foreground">{r.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Dispute Entry Tab ──
const DisputeEntryView: React.FC = () => {
  const disputed = MILESTONES.filter(m => m.status === 'disputed');
  const disputable = MILESTONES.filter(m => m.status === 'submitted' || m.status === 'revision-requested');

  return (
    <div className="space-y-4">
      {disputed.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Flag className="h-4 w-4 text-destructive" />
            <h3 className="text-[11px] font-semibold">Active Disputes</h3>
            <Badge className="text-[7px] bg-destructive/10 text-destructive">{disputed.length}</Badge>
          </div>
          {disputed.map(m => (
            <div key={m.id} className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 mb-2">
              <div className="text-[10px] font-semibold">{m.title}</div>
              <div className="text-[8px] text-muted-foreground mt-0.5">Escrow held · Pending resolution</div>
              <div className="flex gap-1.5 mt-2">
                <Button size="sm" variant="outline" className="h-6 text-[9px] gap-1 rounded-xl" asChild><Link to="/disputes"><ExternalLink className="h-3 w-3" />View Case</Link></Button>
                <Button size="sm" variant="outline" className="h-6 text-[9px] gap-1 rounded-xl"><MessageSquare className="h-3 w-3" />Message</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {disputed.length === 0 && (
        <div className="rounded-2xl border p-6 text-center">
          <Shield className="h-8 w-8 text-[hsl(var(--state-healthy))] mx-auto mb-2" />
          <div className="text-[10px] font-medium">No Active Disputes</div>
          <div className="text-[8px] text-muted-foreground">All milestones are proceeding normally.</div>
        </div>
      )}

      {disputable.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold mb-2">Open a Dispute</div>
          <div className="rounded-2xl border p-4 space-y-3">
            <div>
              <label className="text-[9px] font-medium mb-1 block">Milestone</label>
              <select className="w-full h-7 rounded-xl border bg-background px-3 text-[9px]">
                {disputable.map(m => <option key={m.id} value={m.id}>M{m.number}: {m.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Reason</label>
              <select className="w-full h-7 rounded-xl border bg-background px-3 text-[9px]">
                <option>Quality not as described</option>
                <option>Late delivery</option>
                <option>Missing deliverables</option>
                <option>Payment dispute</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Details</label>
              <textarea className="w-full h-16 rounded-xl border bg-background px-3 py-2 text-[9px] resize-none" placeholder="Describe the issue..." />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl flex-1">Cancel</Button>
              <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl flex-1 bg-destructive hover:bg-destructive/90" onClick={() => toast.warning('Dispute filed')}><Flag className="h-3 w-3" />File Dispute</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Milestone Detail Drawer ──
const MilestoneDetailDrawer: React.FC<{ milestone: MilestoneData | null; open: boolean; onClose: () => void; onSubmit: (m: MilestoneData) => void }> = ({ milestone, open, onClose, onSubmit }) => {
  if (!milestone) return null;
  const m = milestone;
  const cfg = STATUS_CFG[m.status];
  const fcfg = FUNDING_CFG[m.funding];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[460px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b">
          <SheetTitle className="text-sm flex items-center gap-2">
            <div className="h-6 w-6 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold shrink-0">{m.number}</div>
            {m.title}
          </SheetTitle>
        </SheetHeader>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={cfg.badge} label={cfg.label} />
            <Badge className={cn('text-[8px] rounded-lg', fcfg.color === 'text-[hsl(var(--state-healthy))]' ? 'bg-[hsl(var(--state-healthy))]/10' : 'bg-destructive/10', fcfg.color)}>Escrow: {fcfg.label}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { l: 'Amount', v: m.amount },
              { l: 'Due Date', v: m.dueDate },
              { l: 'Start Date', v: m.startDate },
              { l: 'Deliverables', v: `${m.deliverables.length} files` },
            ].map(r => (
              <div key={r.l} className="rounded-xl border p-2">
                <div className="text-[7px] text-muted-foreground">{r.l}</div>
                <div className="text-[9px] font-medium">{r.v}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border p-3">
            <h4 className="text-[9px] font-semibold mb-1">Description</h4>
            <p className="text-[9px] text-muted-foreground">{m.description}</p>
          </div>

          {/* Deliverables */}
          <div>
            <h4 className="text-[10px] font-semibold mb-2 flex items-center gap-1"><FileText className="h-3 w-3 text-accent" />Deliverables</h4>
            {m.deliverables.length === 0 ? (
              <div className="rounded-xl border p-4 text-center text-[9px] text-muted-foreground"><Package className="h-5 w-5 mx-auto mb-1" />None yet</div>
            ) : (
              <div className="space-y-1.5">
                {m.deliverables.map(d => (
                  <div key={d.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-muted/20 transition-colors">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-medium truncate">{d.name}</div>
                      <div className="text-[7px] text-muted-foreground">{d.type === 'file' ? d.size : 'Link'} · {d.submittedAt}</div>
                    </div>
                    {d.version > 1 && <Badge variant="secondary" className="text-[6px]">v{d.version}</Badge>}
                    <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg"><Eye className="h-2.5 w-2.5" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          <div>
            <h4 className="text-[10px] font-semibold mb-2 flex items-center gap-1"><History className="h-3 w-3 text-accent" />History</h4>
            <div className="space-y-2">
              {m.revisions.map((r, i) => (
                <div key={r.id} className="flex gap-2">
                  <div className="flex flex-col items-center">
                    <Avatar className="h-5 w-5"><AvatarFallback className="text-[5px]">{r.actorAvatar}</AvatarFallback></Avatar>
                    {i < m.revisions.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="text-[9px]"><span className="font-medium">{r.actor}</span> <span className="text-muted-foreground">{r.action.toLowerCase()}</span></div>
                    <div className="text-[8px] text-muted-foreground">{r.note}</div>
                    <div className="text-[7px] text-muted-foreground mt-0.5">{r.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-1.5 pt-3 border-t">
            {m.status === 'submitted' && (
              <>
                <Button size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl" onClick={() => { toast.success('Approved'); onClose(); }}><ThumbsUp className="h-3 w-3" />Approve</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl" onClick={() => { toast.info('Revision requested'); onClose(); }}><RotateCcw className="h-3 w-3" />Revise</Button>
              </>
            )}
            {(m.status === 'in-progress' || m.status === 'revision-requested') && (
              <Button size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl" onClick={() => { onSubmit(m); onClose(); }}><Upload className="h-3 w-3" />Submit</Button>
            )}
            {m.status === 'pending' && m.funding === 'unfunded' && (
              <Button size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl" onClick={() => toast.success('Funded')}><DollarSign className="h-3 w-3" />Fund Escrow</Button>
            )}
            <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl" asChild><Link to="/contracts/sow"><Shield className="h-3 w-3" />Contract</Link></Button>
            <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><MessageSquare className="h-3 w-3" />Message</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Main Page ──
const MilestonesPage: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneData | null>(null);
  const [submitModal, setSubmitModal] = useState<MilestoneData | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredMilestones = useMemo(() => {
    if (statusFilter === 'all') return MILESTONES;
    return MILESTONES.filter(m => m.status === statusFilter);
  }, [statusFilter]);

  const totalPaid = MILESTONES.filter(m => m.status === 'paid').reduce((s, m) => s + m.amountNum, 0);
  const totalFunded = MILESTONES.filter(m => m.funding === 'funded').reduce((s, m) => s + m.amountNum, 0);
  const progressPercent = Math.round((totalPaid / CONTRACT.totalValue) * 100);

  const topStrip = (
    <>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><MilestoneIcon className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Milestones & Deliverables</span>
        <StatusBadge status="live" label="Active" />
      </div>
      <div className="flex-1" />
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-6 rounded-xl border bg-background px-1.5 text-[8px]">
        <option value="all">All statuses</option>
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="submitted">Awaiting Approval</option>
        <option value="paid">Paid</option>
        <option value="disputed">Disputed</option>
      </select>
      <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" asChild><Link to="/contracts"><ExternalLink className="h-3 w-3" />Contract</Link></Button>
      <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><MessageSquare className="h-3 w-3" />Message</Button>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Progress" className="!rounded-2xl">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-muted-foreground">Completed</span>
            <span className="font-bold">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="grid grid-cols-2 gap-1.5 text-[8px]">
            <div className="rounded-xl border p-1.5 text-center">
              <div className="font-bold text-[11px]">${(totalPaid / 1000).toFixed(0)}K</div>
              <div className="text-muted-foreground">Paid</div>
            </div>
            <div className="rounded-xl border p-1.5 text-center">
              <div className="font-bold text-[11px]">${(CONTRACT.totalValue / 1000).toFixed(0)}K</div>
              <div className="text-muted-foreground">Total</div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Escrow" icon={<Shield className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Funded</span><span className="font-medium text-[hsl(var(--state-healthy))]">${(totalFunded / 1000).toFixed(0)}K</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Unfunded</span><span className="font-medium text-destructive">${((CONTRACT.totalValue - totalFunded) / 1000).toFixed(0)}K</span></div>
          <Progress value={(totalFunded / CONTRACT.totalValue) * 100} className="h-1.5" />
        </div>
      </SectionCard>

      <SectionCard title="Parties" className="!rounded-2xl">
        <div className="space-y-2">
          {[
            { label: 'Client', name: CONTRACT.clientName, avatar: CONTRACT.clientAvatar },
            { label: 'Freelancer', name: CONTRACT.freelancerName, avatar: CONTRACT.freelancerAvatar },
          ].map(p => (
            <div key={p.label} className="flex items-center gap-2">
              <Avatar className="h-6 w-6 ring-2 ring-accent/20"><AvatarFallback className="text-[6px] bg-accent/10 text-accent">{p.avatar}</AvatarFallback></Avatar>
              <div>
                <div className="text-[9px] font-medium">{p.name}</div>
                <div className="text-[7px] text-muted-foreground">{p.label}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Quick Links" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { l: 'Workspace', icon: Layers, href: `/projects/p1/workspace` },
            { l: 'Task Board', icon: Target, href: `/projects/p1/board` },
            { l: 'Contracts', icon: Shield, href: '/contracts/sow' },
            { l: 'Disputes', icon: Flag, href: '/disputes' },
          ].map(a => (
            <Link key={a.l} to={a.href} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent/5 transition-colors text-[8px] font-medium">
              <a.icon className="h-3 w-3 text-accent" />{a.l}
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Recent Activity</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {MILESTONES.flatMap(m => m.revisions.map(r => ({ ...r, milestone: m.title, milestoneNum: m.number })))
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
          .slice(0, 6)
          .map(r => (
            <div key={r.id} className="shrink-0 rounded-xl border bg-card px-3 py-2 min-w-[200px] hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Avatar className="h-4 w-4"><AvatarFallback className="text-[5px]">{r.actorAvatar}</AvatarFallback></Avatar>
                <span className="text-[8px] font-medium">{r.actor}</span>
                <Badge variant="secondary" className="text-[5px]">M{r.milestoneNum}</Badge>
              </div>
              <p className="text-[7px] text-muted-foreground line-clamp-2">{r.action} — {r.note}</p>
              <div className="text-[6px] text-muted-foreground mt-0.5">{r.timestamp}</div>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52" bottomSection={bottomSection}>
      <KPIBand className="mb-3">
        <KPICard label="Paid" value={`$${(totalPaid / 1000).toFixed(0)}K`} change={`${progressPercent}%`} trend="up" />
        <KPICard label="Awaiting Review" value={MILESTONES.filter(m => m.status === 'submitted').length} />
        <KPICard label="In Progress" value={MILESTONES.filter(m => m.status === 'in-progress').length} />
        <KPICard label="Unfunded" value={MILESTONES.filter(m => m.funding === 'unfunded').length} change={MILESTONES.some(m => m.funding === 'unfunded') ? 'Action needed' : 'None'} trend={MILESTONES.some(m => m.funding === 'unfunded') ? 'down' : 'up'} />
      </KPIBand>

      <Tabs defaultValue="milestones">
        <TabsList className="mb-3 flex-wrap h-auto gap-0.5">
          <TabsTrigger value="milestones" className="gap-1 text-[10px] h-6 px-2"><MilestoneIcon className="h-3 w-3" />Milestones</TabsTrigger>
          <TabsTrigger value="funding" className="gap-1 text-[10px] h-6 px-2"><DollarSign className="h-3 w-3" />Funding</TabsTrigger>
          <TabsTrigger value="deliverables" className="gap-1 text-[10px] h-6 px-2"><FileText className="h-3 w-3" />Deliverables</TabsTrigger>
          <TabsTrigger value="approval" className="gap-1 text-[10px] h-6 px-2"><ThumbsUp className="h-3 w-3" />Approval</TabsTrigger>
          <TabsTrigger value="history" className="gap-1 text-[10px] h-6 px-2"><History className="h-3 w-3" />History</TabsTrigger>
          <TabsTrigger value="disputes" className="gap-1 text-[10px] h-6 px-2"><Flag className="h-3 w-3" />Disputes</TabsTrigger>
        </TabsList>

        <TabsContent value="milestones">
          <div className="space-y-2">
            {filteredMilestones.map(m => (
              <MilestoneCard key={m.id} m={m} onSelect={setSelectedMilestone} onSubmit={setSubmitModal} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="funding"><FundingTable /></TabsContent>
        <TabsContent value="deliverables"><DeliverablesGallery /></TabsContent>
        <TabsContent value="approval"><ApprovalRevisionView onSelect={setSelectedMilestone} /></TabsContent>
        <TabsContent value="history"><HistoryTimeline /></TabsContent>
        <TabsContent value="disputes"><DisputeEntryView /></TabsContent>
      </Tabs>

      <MilestoneDetailDrawer milestone={selectedMilestone} open={!!selectedMilestone} onClose={() => setSelectedMilestone(null)} onSubmit={setSubmitModal} />
      {submitModal && <SubmitDeliverableModal open={!!submitModal} onClose={() => setSubmitModal(null)} milestone={submitModal} />}
    </DashboardLayout>
  );
};

export default MilestonesPage;
