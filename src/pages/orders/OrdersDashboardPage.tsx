import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  ShoppingCart, Clock, CheckCircle2, XCircle, Upload,
  MessageSquare, RefreshCw, Eye, AlertTriangle, Shield,
  Package, Star, Calendar, FileText, Download,
  ArrowRight, Flag, ExternalLink, Timer, Search,
  ArrowLeft, ChevronRight, Scale, BarChart3, Activity,
  Plus, Send, Layers, Info, Filter, Save, Zap, Target,
  RotateCcw, Truck, CreditCard, Users,
} from 'lucide-react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Data
   ═══════════════════════════════════════════════════════════ */
type OrderStatus = 'active' | 'awaiting_action' | 'delivered' | 'completed' | 'disputed' | 'cancelled';
type ViewTab = 'all' | OrderStatus;
type WorkbenchTab = 'orders' | 'fulfilment' | 'analytics';

interface TimelineEvent { label: string; date: string; done: boolean; }

interface Order {
  id: string; title: string; status: OrderStatus; total: number;
  buyer: { name: string; avatar: string };
  seller: { name: string; avatar: string; verified: boolean };
  package: string; delivery: string; dueDate: string; revisions: number; revisionsUsed: number;
  created: string; lastActivity: string;
  timeline: TimelineEvent[];
  deliveryFiles?: { name: string; size: string }[];
  issueNote?: string;
  linkedGig?: string; linkedOffer?: string;
  escrowHeld?: number;
}

const S: Record<OrderStatus, { badge: 'healthy' | 'live' | 'caution' | 'blocked' | 'review' | 'degraded'; label: string }> = {
  active: { badge: 'live', label: 'Active' },
  awaiting_action: { badge: 'caution', label: 'Awaiting Action' },
  delivered: { badge: 'review', label: 'Delivered' },
  completed: { badge: 'healthy', label: 'Completed' },
  disputed: { badge: 'blocked', label: 'Disputed' },
  cancelled: { badge: 'degraded', label: 'Cancelled' },
};

const ORDERS: Order[] = [
  {
    id: 'ORD-001', title: 'Logo & Brand Identity — SaaS Launch', status: 'active', total: 500,
    buyer: { name: 'Jordan Kim', avatar: 'JK' }, seller: { name: 'Sarah Chen', avatar: 'SC', verified: true },
    package: 'Premium', delivery: '10 days', dueDate: 'Apr 18, 2026', revisions: 5, revisionsUsed: 0,
    created: 'Apr 8, 2026', lastActivity: '1 hour ago', linkedGig: 'Professional Logo Design', escrowHeld: 500,
    timeline: [
      { label: 'Order placed', date: 'Apr 8', done: true },
      { label: 'Requirements submitted', date: 'Apr 9', done: true },
      { label: 'Work in progress', date: 'Apr 10', done: true },
      { label: 'First draft delivery', date: 'Apr 14', done: false },
      { label: 'Revisions & final', date: 'Apr 17', done: false },
      { label: 'Order complete', date: 'Apr 18', done: false },
    ],
  },
  {
    id: 'ORD-002', title: 'Full-Stack Dashboard — Enterprise Rebuild', status: 'awaiting_action', total: 2100,
    buyer: { name: 'Marcus Lane', avatar: 'ML' }, seller: { name: 'Alex Morgan', avatar: 'AM', verified: true },
    package: 'Custom', delivery: '21 days', dueDate: 'Apr 26, 2026', revisions: 4, revisionsUsed: 1,
    created: 'Apr 5, 2026', lastActivity: '3 hours ago', linkedOffer: 'Custom Full-Stack Offer', escrowHeld: 2100,
    timeline: [
      { label: 'Order placed', date: 'Apr 5', done: true },
      { label: 'Requirements submitted', date: 'Apr 6', done: true },
      { label: 'Milestone 1 delivered', date: 'Apr 12', done: true },
      { label: 'Revision requested', date: 'Apr 12', done: true },
      { label: 'Revision delivered', date: 'Apr 13', done: false },
      { label: 'Final delivery', date: 'Apr 25', done: false },
    ],
    issueNote: 'Buyer requested changes to the auth flow — awaiting revised milestone.',
  },
  {
    id: 'ORD-003', title: 'SEO Audit + Content Calendar', status: 'delivered', total: 700,
    buyer: { name: 'Priya Mehta', avatar: 'PM' }, seller: { name: 'Marcus Chen', avatar: 'MC', verified: true },
    package: 'Standard', delivery: '14 days', dueDate: 'Apr 16, 2026', revisions: 3, revisionsUsed: 0,
    created: 'Apr 2, 2026', lastActivity: '6 hours ago', linkedGig: 'SEO & Content Strategy', escrowHeld: 700,
    timeline: [
      { label: 'Order placed', date: 'Apr 2', done: true },
      { label: 'Requirements submitted', date: 'Apr 3', done: true },
      { label: 'Work in progress', date: 'Apr 4', done: true },
      { label: 'Delivery submitted', date: 'Apr 11', done: true },
      { label: 'Buyer review', date: 'Pending', done: false },
    ],
    deliveryFiles: [
      { name: 'SEO_Audit_Report.pdf', size: '2.4 MB' },
      { name: 'Content_Calendar_Q2.xlsx', size: '890 KB' },
      { name: 'Keyword_Research_200.csv', size: '156 KB' },
    ],
  },
  {
    id: 'ORD-004', title: 'Explainer Video — Product Demo', status: 'completed', total: 600,
    buyer: { name: 'Emma Wilson', avatar: 'EW' }, seller: { name: 'Jordan Blake', avatar: 'JB', verified: true },
    package: 'Standard', delivery: '7 days', dueDate: 'Apr 5, 2026', revisions: 4, revisionsUsed: 2,
    created: 'Mar 29, 2026', lastActivity: '5 days ago', escrowHeld: 0,
    timeline: [
      { label: 'Order placed', date: 'Mar 29', done: true },
      { label: 'Requirements submitted', date: 'Mar 30', done: true },
      { label: 'First draft', date: 'Apr 2', done: true },
      { label: 'Revision 1', date: 'Apr 3', done: true },
      { label: 'Revision 2', date: 'Apr 4', done: true },
      { label: 'Order completed', date: 'Apr 5', done: true },
    ],
    deliveryFiles: [
      { name: 'Explainer_Final_1080p.mp4', size: '48.2 MB' },
      { name: 'Explainer_4K.mp4', size: '142 MB' },
      { name: 'Subtitles_EN.srt', size: '4 KB' },
    ],
  },
  {
    id: 'ORD-005', title: 'AI Chatbot Integration', status: 'disputed', total: 2100,
    buyer: { name: 'Takeshi Yamamoto', avatar: 'TY' }, seller: { name: 'Liam Foster', avatar: 'LF', verified: true },
    package: 'Pro', delivery: '21 days', dueDate: 'Apr 10, 2026', revisions: 4, revisionsUsed: 3,
    created: 'Mar 20, 2026', lastActivity: '2 days ago', escrowHeld: 2100,
    timeline: [
      { label: 'Order placed', date: 'Mar 20', done: true },
      { label: 'Work started', date: 'Mar 22', done: true },
      { label: 'Delivery submitted', date: 'Apr 8', done: true },
      { label: 'Revision 1–3', date: 'Apr 8–10', done: true },
      { label: 'Dispute opened', date: 'Apr 10', done: true },
    ],
    issueNote: 'Buyer reports chatbot accuracy below agreed 90% threshold. Dispute under mediation.',
  },
  {
    id: 'ORD-006', title: 'Business Plan — Series A Prep', status: 'cancelled', total: 400,
    buyer: { name: 'Carlos Diaz', avatar: 'CD' }, seller: { name: 'Natasha Volkov', avatar: 'NV', verified: false },
    package: 'Standard', delivery: '10 days', dueDate: 'Apr 8, 2026', revisions: 4, revisionsUsed: 0,
    created: 'Mar 28, 2026', lastActivity: '1 week ago', escrowHeld: 0,
    timeline: [
      { label: 'Order placed', date: 'Mar 28', done: true },
      { label: 'Requirements pending', date: 'Mar 29', done: true },
      { label: 'Order cancelled', date: 'Apr 1', done: true },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const OrdersDashboard: React.FC = () => {
  const [workbench, setWorkbench] = useState<WorkbenchTab>('orders');
  const [tab, setTab] = useState<ViewTab>('all');
  const [selected, setSelected] = useState<Order | null>(null);
  const [deliverDrawer, setDeliverDrawer] = useState(false);
  const [issueDrawer, setIssueDrawer] = useState(false);
  const [detailInspector, setDetailInspector] = useState(false);
  const [compareDrawer, setCompareDrawer] = useState(false);
  const [acceptConfirm, setAcceptConfirm] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  const filtered = ORDERS.filter(o => {
    if (tab !== 'all' && o.status !== tab) return false;
    if (searchQ && !o.title.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  const counts: Record<string, number> = { all: ORDERS.length };
  for (const o of ORDERS) counts[o.status] = (counts[o.status] || 0) + 1;

  const compareOrders = ORDERS.filter(o => compareIds.has(o.id));
  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else if (next.size < 4) next.add(id);
      return next;
    });
  };

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <Link to="/gigs" className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" />Gigs
      </Link>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <ShoppingCart className="h-3.5 w-3.5 text-accent" />
      <span className="text-[11px] font-semibold">Orders & Fulfilment</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input className="h-7 w-44 rounded-xl border bg-background pl-7 pr-3 text-[10px] focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Search orders..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
      </div>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
      {compareIds.size > 0 && (
        <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setCompareDrawer(true)}>
          <Scale className="h-3 w-3" />Compare ({compareIds.size})
        </Button>
      )}
    </>
  );

  /* ── Right Rail ── */
  const rightRail = selected ? (
    <div className="space-y-3">
      <SectionCard title="Order Details" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[
            { l: 'Status', v: <StatusBadge status={S[selected.status].badge} label={S[selected.status].label} /> },
            { l: 'Order ID', v: selected.id },
            { l: 'Total', v: `$${selected.total.toLocaleString()}` },
            { l: 'Package', v: selected.package },
            { l: 'Due', v: selected.dueDate },
            { l: 'Revisions', v: `${selected.revisionsUsed}/${selected.revisions} used` },
            { l: 'Created', v: selected.created },
          ].map(r => (
            <div key={r.l} className="flex justify-between items-center"><span className="text-muted-foreground">{r.l}</span><span className="font-medium">{r.v}</span></div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Parties" className="!rounded-2xl">
        <div className="space-y-2">
          {[{ ...selected.buyer, role: 'Buyer', accent: false }, { ...selected.seller, role: 'Seller', accent: true }].map(p => (
            <div key={p.role} className="flex items-center gap-2">
              <Avatar className="h-6 w-6"><AvatarFallback className={cn('text-[7px]', p.accent && 'bg-accent/10 text-accent')}>{p.avatar}</AvatarFallback></Avatar>
              <div><div className="text-[9px] font-medium">{p.name}</div><div className="text-[7px] text-muted-foreground">{p.role}</div></div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Escrow */}
      {selected.escrowHeld !== undefined && selected.escrowHeld > 0 && (
        <SectionCard title="Escrow" icon={<CreditCard className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-1 text-[9px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Held</span><span className="font-bold text-[hsl(var(--state-healthy))]">${selected.escrowHeld}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Release</span><span>On completion</span></div>
          </div>
        </SectionCard>
      )}

      {/* Timeline */}
      <SectionCard title="Timeline" icon={<Timer className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-0">
          {selected.timeline.map((t, i) => (
            <div key={i} className="flex gap-2">
              <div className="flex flex-col items-center">
                <div className={cn('h-3 w-3 rounded-full border-2 shrink-0', t.done ? 'bg-[hsl(var(--state-healthy))] border-[hsl(var(--state-healthy))]' : 'border-muted-foreground/30')} />
                {i < selected.timeline.length - 1 && <div className={cn('w-0.5 flex-1 min-h-[12px]', t.done ? 'bg-[hsl(var(--state-healthy))]' : 'bg-muted-foreground/15')} />}
              </div>
              <div className="pb-2">
                <div className={cn('text-[9px]', t.done ? 'font-medium' : 'text-muted-foreground')}>{t.label}</div>
                <div className="text-[7px] text-muted-foreground">{t.date}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Issue Banner */}
      {selected.issueNote && (
        <div className="rounded-2xl border border-[hsl(var(--state-caution))]/30 bg-[hsl(var(--state-caution))]/5 p-2.5">
          <div className="flex items-center gap-1 text-[9px] font-medium text-[hsl(var(--state-caution))] mb-0.5"><AlertTriangle className="h-3 w-3" />Issue</div>
          <p className="text-[8px] text-muted-foreground">{selected.issueNote}</p>
        </div>
      )}

      {/* Linked */}
      {selected.linkedGig && (
        <SectionCard title="Linked Gig" icon={<Package className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="text-[9px] text-muted-foreground">{selected.linkedGig}</div>
          <Link to="/gigs"><Button variant="ghost" size="sm" className="h-5 text-[8px] mt-1 gap-0.5 p-0"><ExternalLink className="h-2.5 w-2.5" />View Gig</Button></Link>
        </SectionCard>
      )}
      {selected.linkedOffer && (
        <SectionCard title="Linked Offer" icon={<FileText className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="text-[9px] text-muted-foreground">{selected.linkedOffer}</div>
          <Link to="/offers"><Button variant="ghost" size="sm" className="h-5 text-[8px] mt-1 gap-0.5 p-0"><ExternalLink className="h-2.5 w-2.5" />View Offer</Button></Link>
        </SectionCard>
      )}

      {/* Actions */}
      <SectionCard title="Actions" className="!rounded-2xl">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => setDetailInspector(true)}><Eye className="h-3 w-3" />Full Inspection</Button>
          {selected.status === 'active' && (
            <>
              <Button size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => setDeliverDrawer(true)}><Upload className="h-3 w-3" />Submit Delivery</Button>
              <Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1"><MessageSquare className="h-3 w-3" />Message Buyer</Button>
            </>
          )}
          {selected.status === 'awaiting_action' && (
            <>
              <Button size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => setDeliverDrawer(true)}><Upload className="h-3 w-3" />Submit Revision</Button>
              <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => setIssueDrawer(true)}><Flag className="h-3 w-3" />Raise Issue</Button>
            </>
          )}
          {selected.status === 'delivered' && (
            <>
              <Button size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => setAcceptConfirm(true)}><CheckCircle2 className="h-3 w-3" />Approve & Complete</Button>
              <Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => toast.info('Revision requested')}><RefreshCw className="h-3 w-3" />Request Revision</Button>
              <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 text-destructive" onClick={() => setIssueDrawer(true)}><Flag className="h-3 w-3" />Raise Issue</Button>
            </>
          )}
          {selected.status === 'completed' && (
            <>
              <Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1"><Star className="h-3 w-3" />Leave Review</Button>
              <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1"><ArrowRight className="h-3 w-3" />Reorder</Button>
            </>
          )}
          {selected.status === 'disputed' && (
            <Link to="/disputes"><Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1"><ExternalLink className="h-3 w-3" />View Dispute</Button></Link>
          )}
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => toggleCompare(selected.id)}>
            <Scale className="h-3 w-3" />{compareIds.has(selected.id) ? 'Remove from Compare' : 'Add to Compare'}
          </Button>
        </div>
      </SectionCard>
    </div>
  ) : (
    <div className="space-y-3">
      <SectionCard title="Summary" icon={<Shield className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Active</span><span className="font-medium">{counts.active || 0}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Awaiting action</span><span className="font-medium text-[hsl(var(--state-caution))]">{counts.awaiting_action || 0}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Delivered</span><span className="font-medium">{counts.delivered || 0}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span className="font-medium text-[hsl(var(--state-healthy))]">{counts.completed || 0}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Disputed</span><span className="font-medium text-destructive">{counts.disputed || 0}</span></div>
          <div className="border-t pt-1 flex justify-between font-semibold"><span>Total value</span><span>${ORDERS.reduce((s, o) => s + o.total, 0).toLocaleString()}</span></div>
        </div>
      </SectionCard>

      {/* Urgency Alerts */}
      {ORDERS.filter(o => o.status === 'awaiting_action' || o.status === 'delivered').length > 0 && (
        <SectionCard title="Needs Attention" icon={<AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]" />} className="!rounded-2xl">
          <div className="space-y-1.5">
            {ORDERS.filter(o => o.status === 'awaiting_action' || o.status === 'delivered').map(o => (
              <div key={o.id} className="flex items-center gap-2 text-[8px] cursor-pointer hover:text-accent" onClick={() => { setSelected(o); setTab('all'); }}>
                <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', o.status === 'delivered' ? 'bg-accent' : 'bg-[hsl(var(--state-caution))]')} />
                <span className="flex-1 truncate">{o.title}</span>
                <StatusBadge status={S[o.status].badge} label={S[o.status].label} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Escrow Summary */}
      <SectionCard title="Escrow Held" icon={<CreditCard className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="text-center py-1">
          <div className="text-lg font-bold">${ORDERS.reduce((s, o) => s + (o.escrowHeld || 0), 0).toLocaleString()}</div>
          <div className="text-[8px] text-muted-foreground">Across {ORDERS.filter(o => (o.escrowHeld || 0) > 0).length} orders</div>
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom Section ── */
  const bottomSection = selected?.deliveryFiles ? (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><FileText className="h-3.5 w-3.5 text-accent" />Delivery Files</div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {selected.deliveryFiles.map(f => (
          <div key={f.name} className="shrink-0 rounded-2xl border bg-card px-3 py-2 flex items-center gap-2 min-w-[200px]">
            <Download className="h-4 w-4 text-accent shrink-0" />
            <div className="min-w-0"><div className="text-[9px] font-medium truncate">{f.name}</div><div className="text-[7px] text-muted-foreground">{f.size}</div></div>
            <Button variant="ghost" size="sm" className="h-5 text-[8px] px-1.5 ml-auto shrink-0 rounded-xl" onClick={() => toast.info('Download started')}>Get</Button>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      {/* Workbench Tabs */}
      <div className="flex items-center gap-1 mb-3 border-b pb-2">
        {([
          { key: 'orders' as const, label: 'Orders', icon: ShoppingCart },
          { key: 'fulfilment' as const, label: 'Fulfilment', icon: Truck },
          { key: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
        ]).map(w => (
          <button key={w.key} onClick={() => setWorkbench(w.key)} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] transition-colors',
            workbench === w.key ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
          )}>
            <w.icon className="h-3 w-3" />{w.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: ORDERS ═══ */}
      {workbench === 'orders' && (
        <Tabs value={tab} onValueChange={v => { setTab(v as ViewTab); setSelected(null); }}>
          <TabsList className="h-8 mb-3 flex-wrap">
            {([['all', 'All'], ['active', 'Active'], ['awaiting_action', 'Awaiting'], ['delivered', 'Delivered'], ['completed', 'Completed'], ['disputed', 'Disputed'], ['cancelled', 'Cancelled']] as const).map(([k, l]) => (
              <TabsTrigger key={k} value={k} className="text-[10px] h-6 px-2.5 gap-1 rounded-xl">
                {l}{(counts[k] || 0) > 0 && <Badge variant="secondary" className="text-[7px] px-1 ml-0.5 rounded-lg">{counts[k]}</Badge>}
              </TabsTrigger>
            ))}
          </TabsList>

          {['all', 'active', 'awaiting_action', 'delivered', 'completed', 'disputed', 'cancelled'].map(t => (
            <TabsContent key={t} value={t}>
              <KPIBand className="mb-3">
                <KPICard label="Orders" value={filtered.length} />
                <KPICard label="Value" value={`$${filtered.reduce((s, o) => s + o.total, 0).toLocaleString()}`} />
                <KPICard label="Avg Order" value={filtered.length ? `$${Math.round(filtered.reduce((s, o) => s + o.total, 0) / filtered.length)}` : '—'} />
                <KPICard label="On-time" value="92%" trend="up" />
                <KPICard label="Escrow Held" value={`$${filtered.reduce((s, o) => s + (o.escrowHeld || 0), 0).toLocaleString()}`} />
              </KPIBand>

              {filtered.length === 0 ? (
                <div className="rounded-2xl border bg-card p-8 text-center">
                  <ShoppingCart className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <div className="text-[11px] font-semibold">No orders found</div>
                  <div className="text-[9px] text-muted-foreground">Adjust filters or search</div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filtered.map(o => {
                    const sc = S[o.status];
                    const isSel = selected?.id === o.id;
                    const inCompare = compareIds.has(o.id);
                    const doneSteps = o.timeline.filter(t => t.done).length;
                    const totalSteps = o.timeline.length;
                    return (
                      <div key={o.id} onClick={() => setSelected(o)} className={cn(
                        'rounded-2xl border bg-card px-4 py-3 cursor-pointer transition-all hover:shadow-sm',
                        isSel && 'ring-1 ring-accent border-accent/30',
                        inCompare && !isSel && 'border-accent/20',
                      )}>
                        <div className="flex items-center gap-3">
                          <button className={cn('shrink-0 h-4 w-4 rounded border transition-colors', inCompare ? 'bg-accent border-accent' : 'border-muted-foreground/30 hover:border-accent/50')} onClick={e => { e.stopPropagation(); toggleCompare(o.id); }}>
                            {inCompare && <CheckCircle2 className="h-3 w-3 text-accent-foreground mx-auto" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[11px] font-semibold truncate">{o.title}</span>
                              <StatusBadge status={sc.badge} label={sc.label} />
                              {o.issueNote && <AlertTriangle className="h-3 w-3 text-[hsl(var(--state-caution))]" />}
                            </div>
                            <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                              <span className="flex items-center gap-1"><Avatar className="h-3.5 w-3.5"><AvatarFallback className="text-[5px]">{o.buyer.avatar}</AvatarFallback></Avatar>{o.buyer.name}</span>
                              <span>↔</span>
                              <span className="flex items-center gap-1"><Avatar className="h-3.5 w-3.5"><AvatarFallback className="text-[5px] bg-accent/10 text-accent">{o.seller.avatar}</AvatarFallback></Avatar>{o.seller.name}</span>
                              <span>·</span>
                              <span>{o.package}</span>
                              <span>·</span>
                              <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{o.lastActivity}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0 space-y-1">
                            <div className="text-[12px] font-bold">${o.total.toLocaleString()}</div>
                            <div className="flex items-center gap-1">
                              <Progress value={(doneSteps / totalSteps) * 100} className="h-1 w-16" />
                              <span className="text-[7px] text-muted-foreground">{doneSteps}/{totalSteps}</span>
                            </div>
                          </div>
                        </div>

                        {/* Expanded delivery files */}
                        {isSel && o.deliveryFiles && (
                          <div className="mt-2 pt-2 border-t flex gap-2 flex-wrap">
                            {o.deliveryFiles.map(f => (
                              <div key={f.name} className="flex items-center gap-1.5 rounded-xl border px-2 py-1 text-[8px]">
                                <Download className="h-3 w-3 text-accent" />
                                <span className="truncate max-w-[120px]">{f.name}</span>
                                <span className="text-muted-foreground">{f.size}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* ═══ TAB: FULFILMENT ═══ */}
      {workbench === 'fulfilment' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="In Progress" value={counts.active || 0} />
            <KPICard label="Awaiting Action" value={counts.awaiting_action || 0} />
            <KPICard label="Ready for Review" value={counts.delivered || 0} />
            <KPICard label="Completion Rate" value="92%" trend="up" />
          </KPIBand>

          {/* Active work queue */}
          <SectionCard title="Active Work Queue" icon={<Truck className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {ORDERS.filter(o => ['active', 'awaiting_action'].includes(o.status)).map(o => {
                const doneSteps = o.timeline.filter(t => t.done).length;
                const totalSteps = o.timeline.length;
                const pct = Math.round((doneSteps / totalSteps) * 100);
                return (
                  <div key={o.id} className="rounded-2xl border p-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => { setSelected(o); setWorkbench('orders'); }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Avatar className="h-6 w-6"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{o.seller.avatar}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-semibold truncate">{o.title}</div>
                        <div className="text-[8px] text-muted-foreground">Due: {o.dueDate} · {o.package}</div>
                      </div>
                      <StatusBadge status={S[o.status].badge} label={S[o.status].label} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-1.5 flex-1" />
                      <span className="text-[8px] font-medium">{pct}%</span>
                    </div>
                    {o.issueNote && (
                      <div className="mt-1.5 flex items-center gap-1 text-[8px] text-[hsl(var(--state-caution))]">
                        <AlertTriangle className="h-2.5 w-2.5" /><span className="truncate">{o.issueNote}</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {ORDERS.filter(o => ['active', 'awaiting_action'].includes(o.status)).length === 0 && (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-5 w-5 text-[hsl(var(--state-healthy))] mx-auto mb-1" />
                  <div className="text-[10px] font-semibold">All clear!</div>
                  <div className="text-[8px] text-muted-foreground">No active orders need attention</div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Pending Review */}
          <SectionCard title="Pending Buyer Review" icon={<Eye className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {ORDERS.filter(o => o.status === 'delivered').map(o => (
                <div key={o.id} className="rounded-2xl border p-3 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-accent" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold truncate">{o.title}</div>
                      <div className="text-[8px] text-muted-foreground">{o.deliveryFiles?.length || 0} files · Delivered {o.lastActivity}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-[8px] gap-0.5 rounded-xl" onClick={() => { setSelected(o); setAcceptConfirm(true); }}><CheckCircle2 className="h-2.5 w-2.5" />Approve</Button>
                      <Button variant="outline" size="sm" className="h-6 text-[8px] gap-0.5 rounded-xl" onClick={() => toast.info('Revision requested')}><RefreshCw className="h-2.5 w-2.5" />Revise</Button>
                    </div>
                  </div>
                </div>
              ))}
              {ORDERS.filter(o => o.status === 'delivered').length === 0 && (
                <div className="text-[9px] text-muted-foreground text-center py-3">No deliveries awaiting review</div>
              )}
            </div>
          </SectionCard>

          {/* Recent Completions */}
          <SectionCard title="Recent Completions" icon={<CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {ORDERS.filter(o => o.status === 'completed').slice(0, 3).map(o => (
                <div key={o.id} className="flex items-center gap-2 text-[9px]">
                  <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))] shrink-0" />
                  <span className="flex-1 truncate">{o.title}</span>
                  <span className="font-bold shrink-0">${o.total}</span>
                  <Button variant="ghost" size="sm" className="h-5 text-[7px] gap-0.5 shrink-0"><Star className="h-2.5 w-2.5" />Review</Button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ TAB: ANALYTICS ═══ */}
      {workbench === 'analytics' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Orders" value={ORDERS.length} />
            <KPICard label="Total Revenue" value={`$${ORDERS.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0).toLocaleString()}`} />
            <KPICard label="Completion Rate" value={`${Math.round((counts.completed || 0) / ORDERS.length * 100)}%`} trend="up" />
            <KPICard label="Avg Order Value" value={`$${Math.round(ORDERS.reduce((s, o) => s + o.total, 0) / ORDERS.length)}`} />
            <KPICard label="Dispute Rate" value={`${Math.round((counts.disputed || 0) / ORDERS.length * 100)}%`} />
          </KPIBand>

          <div className="grid md:grid-cols-2 gap-3">
            <SectionCard title="Order Status Distribution" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-1.5">
                {(['active', 'awaiting_action', 'delivered', 'completed', 'disputed', 'cancelled'] as OrderStatus[]).map(s => {
                  const count = counts[s] || 0;
                  const pct = ORDERS.length ? Math.round((count / ORDERS.length) * 100) : 0;
                  return (
                    <div key={s}>
                      <div className="flex justify-between text-[9px] mb-0.5">
                        <StatusBadge status={S[s].badge} label={S[s].label} />
                        <span className="font-medium">{count} ({pct}%)</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Fulfilment Health" icon={<Activity className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-2">
                {[
                  { label: 'On-time delivery rate', value: '92%', target: '> 90%', ok: true },
                  { label: 'Avg. delivery time', value: '6.3 days', target: '< 7 days', ok: true },
                  { label: 'Revision rate', value: '33%', target: '< 40%', ok: true },
                  { label: 'Dispute rate', value: '16%', target: '< 10%', ok: false },
                  { label: 'Auto-complete rate', value: '8%', target: '< 15%', ok: true },
                  { label: 'Buyer satisfaction', value: '4.8/5', target: '> 4.5', ok: true },
                ].map(m => (
                  <div key={m.label} className="flex items-center gap-2 text-[9px]">
                    {m.ok ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))] shrink-0" /> : <AlertTriangle className="h-3 w-3 text-[hsl(var(--state-caution))] shrink-0" />}
                    <span className="flex-1">{m.label}</span>
                    <span className="font-bold">{m.value}</span>
                    <span className="text-[7px] text-muted-foreground">{m.target}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Recent Activity" icon={<Activity className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {[
                { time: '1 hour ago', action: 'Sarah Chen started work on Logo & Brand Identity', type: 'active' },
                { time: '3 hours ago', action: 'Marcus Lane requested revision on Dashboard build', type: 'revision' },
                { time: '6 hours ago', action: 'Marcus Chen submitted SEO Audit delivery', type: 'delivery' },
                { time: '2 days ago', action: 'Dispute opened for AI Chatbot Integration', type: 'dispute' },
                { time: '5 days ago', action: 'Explainer Video order completed successfully', type: 'complete' },
                { time: '1 week ago', action: 'Business Plan order cancelled by buyer', type: 'cancel' },
              ].map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-[8px]">
                  <div className={cn('h-1.5 w-1.5 rounded-full shrink-0',
                    e.type === 'complete' ? 'bg-[hsl(var(--state-healthy))]' :
                    e.type === 'dispute' || e.type === 'cancel' ? 'bg-[hsl(var(--state-blocked))]' :
                    e.type === 'revision' ? 'bg-[hsl(var(--state-caution))]' : 'bg-accent'
                  )} />
                  <span className="text-muted-foreground w-16 shrink-0">{e.time}</span>
                  <span className="flex-1">{e.action}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── Mobile Sticky CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        {selected ? (
          <>
            <div className="flex-1 min-w-0">
              <div className="text-[8px] text-muted-foreground truncate">{selected.title}</div>
              <div className="text-[11px] font-bold">${selected.total.toLocaleString()}</div>
            </div>
            {selected.status === 'active' && (
              <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-5" onClick={() => setDeliverDrawer(true)}><Upload className="h-3.5 w-3.5" />Deliver</Button>
            )}
            {selected.status === 'delivered' && (
              <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-5" onClick={() => setAcceptConfirm(true)}><CheckCircle2 className="h-3.5 w-3.5" />Approve</Button>
            )}
            {selected.status === 'awaiting_action' && (
              <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-5" onClick={() => setDeliverDrawer(true)}><Upload className="h-3.5 w-3.5" />Submit</Button>
            )}
          </>
        ) : (
          <>
            <div className="flex-1"><span className="text-[10px] font-semibold">{ORDERS.length} Orders</span></div>
            <Badge variant="secondary" className="text-[8px] rounded-xl">${ORDERS.reduce((s, o) => s + o.total, 0).toLocaleString()} total</Badge>
          </>
        )}
      </div>

      {/* ── Submit Delivery Drawer ── */}
      <Sheet open={deliverDrawer} onOpenChange={setDeliverDrawer}>
        <SheetContent className="w-[480px] sm:w-[520px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Submit Delivery</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            {selected && (
              <div className="rounded-2xl border p-2.5">
                <div className="text-[10px] font-semibold mb-0.5">{selected.title}</div>
                <div className="text-[9px] text-muted-foreground">{selected.package} · ${selected.total} · Due: {selected.dueDate}</div>
              </div>
            )}
            <div>
              <label className="text-[9px] font-medium mb-1 block">Delivery Message</label>
              <textarea className="w-full h-24 rounded-xl border bg-background px-3 py-2 text-[9px] resize-none focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Describe what you're delivering and any notes for the buyer..." />
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Attach Files</label>
              <div className="rounded-2xl border-2 border-dashed p-6 text-center">
                <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <div className="text-[9px] text-muted-foreground">Drop files or click to upload</div>
                <div className="text-[7px] text-muted-foreground mt-0.5">Max 500MB total · ZIP, PDF, PNG, MP4, etc.</div>
              </div>
            </div>
            <div className="rounded-2xl border p-2.5 bg-muted/20">
              <div className="flex items-center gap-1.5 text-[9px]"><Shield className="h-3 w-3 text-accent" /><span className="font-medium">Delivery terms</span></div>
              <ul className="text-[8px] text-muted-foreground mt-1 space-y-0.5">
                <li>• Buyer has 3 days to review and approve</li>
                <li>• Auto-completes if no action after review period</li>
                <li>• Funds released from escrow upon completion</li>
              </ul>
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-8 text-[10px] flex-1 rounded-xl" onClick={() => setDeliverDrawer(false)}>Cancel</Button>
              <Button size="sm" className="h-8 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setDeliverDrawer(false); toast.success('Delivery submitted!'); }}><Upload className="h-3 w-3" />Submit</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Raise Issue Drawer ── */}
      <Sheet open={issueDrawer} onOpenChange={setIssueDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Raise Issue</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-[9px] font-medium mb-1 block">Issue Type</label>
              <select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]">
                <option>Quality not as described</option>
                <option>Late delivery</option>
                <option>Missing deliverables</option>
                <option>Communication issue</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Description</label>
              <textarea className="w-full h-24 rounded-xl border bg-background px-3 py-2 text-[9px] resize-none focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Describe the issue in detail..." />
            </div>
            <div className="rounded-2xl border border-[hsl(var(--state-caution))]/20 bg-[hsl(var(--state-caution))]/5 p-2.5">
              <div className="flex items-center gap-1.5 text-[9px]"><AlertTriangle className="h-3 w-3 text-[hsl(var(--state-caution))]" /><span className="font-medium">Before opening a dispute</span></div>
              <p className="text-[8px] text-muted-foreground mt-0.5">Try resolving the issue directly with the seller first. If unresolved after 48 hours, you can escalate to a formal dispute with mediation support.</p>
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-8 text-[10px] flex-1 rounded-xl" onClick={() => setIssueDrawer(false)}>Cancel</Button>
              <Button size="sm" className="h-8 text-[10px] flex-1 gap-1 rounded-xl" variant="destructive" onClick={() => { setIssueDrawer(false); toast.info('Issue raised — seller notified'); }}><Flag className="h-3 w-3" />Submit Issue</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Detail Inspector ── */}
      <Sheet open={detailInspector} onOpenChange={setDetailInspector}>
        <SheetContent className="w-[520px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Order Inspection</SheetTitle></SheetHeader>
          {selected && (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={S[selected.status].badge} label={S[selected.status].label} />
                <Badge variant="outline" className="text-[7px] rounded-lg">{selected.id}</Badge>
              </div>
              <h3 className="text-[12px] font-bold">{selected.title}</h3>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl border p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-6 w-6"><AvatarFallback className="text-[7px]">{selected.buyer.avatar}</AvatarFallback></Avatar>
                    <div><div className="text-[9px] font-medium">{selected.buyer.name}</div><div className="text-[7px] text-muted-foreground">Buyer</div></div>
                  </div>
                </div>
                <div className="rounded-2xl border p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-6 w-6"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{selected.seller.avatar}</AvatarFallback></Avatar>
                    <div><div className="text-[9px] font-medium flex items-center gap-0.5">{selected.seller.name}{selected.seller.verified && <CheckCircle2 className="h-2.5 w-2.5 text-accent" />}</div><div className="text-[7px] text-muted-foreground">Seller</div></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { l: 'Total', v: `$${selected.total}` },
                  { l: 'Package', v: selected.package },
                  { l: 'Due', v: selected.dueDate },
                  { l: 'Revisions', v: `${selected.revisionsUsed}/${selected.revisions}` },
                ].map(d => (
                  <div key={d.l} className="rounded-2xl border p-2 text-center"><div className="text-[7px] text-muted-foreground">{d.l}</div><div className="text-[10px] font-bold">{d.v}</div></div>
                ))}
              </div>

              {/* Timeline */}
              <div>
                <div className="text-[10px] font-semibold mb-1.5">Fulfilment Timeline</div>
                <div className="space-y-0">
                  {selected.timeline.map((t, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="flex flex-col items-center">
                        <div className={cn('h-4 w-4 rounded-full flex items-center justify-center text-[7px]', t.done ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : 'bg-muted text-muted-foreground')}>
                          {t.done ? <CheckCircle2 className="h-2.5 w-2.5" /> : <span>{i + 1}</span>}
                        </div>
                        {i < selected.timeline.length - 1 && <div className={cn('w-px flex-1 min-h-[16px]', t.done ? 'bg-[hsl(var(--state-healthy))]/30' : 'bg-border')} />}
                      </div>
                      <div className="pb-3">
                        <div className={cn('text-[9px]', t.done ? 'font-medium' : 'text-muted-foreground')}>{t.label}</div>
                        <div className="text-[7px] text-muted-foreground">{t.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Files */}
              {selected.deliveryFiles && (
                <div>
                  <div className="text-[10px] font-semibold mb-1.5">Delivery Files</div>
                  <div className="space-y-1">
                    {selected.deliveryFiles.map(f => (
                      <div key={f.name} className="flex items-center gap-2 rounded-2xl border p-2">
                        <Download className="h-3.5 w-3.5 text-accent shrink-0" />
                        <div className="flex-1 min-w-0"><div className="text-[9px] font-medium truncate">{f.name}</div><div className="text-[7px] text-muted-foreground">{f.size}</div></div>
                        <Button variant="ghost" size="sm" className="h-5 text-[8px] rounded-xl" onClick={() => toast.info('Download started')}>Download</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.issueNote && (
                <div className="rounded-2xl border border-[hsl(var(--state-caution))]/30 bg-[hsl(var(--state-caution))]/5 p-2.5">
                  <div className="flex items-center gap-1 text-[9px] font-medium text-[hsl(var(--state-caution))] mb-0.5"><AlertTriangle className="h-3 w-3" />Active Issue</div>
                  <p className="text-[8px] text-muted-foreground">{selected.issueNote}</p>
                </div>
              )}

              {selected.escrowHeld !== undefined && selected.escrowHeld > 0 && (
                <div className="rounded-2xl border border-accent/20 bg-accent/5 p-2.5">
                  <div className="flex items-center gap-1.5 text-[9px]"><CreditCard className="h-3 w-3 text-accent" /><span className="font-medium">Escrow: ${selected.escrowHeld} held</span></div>
                  <p className="text-[8px] text-muted-foreground mt-0.5">Funds will be released to the seller upon order completion or resolution.</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Compare Drawer ── */}
      <Sheet open={compareDrawer} onOpenChange={setCompareDrawer}>
        <SheetContent className="w-[600px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Scale className="h-4 w-4 text-accent" />Compare Orders ({compareOrders.length})</SheetTitle></SheetHeader>
          <div className="p-4">
            {compareOrders.length === 0 ? (
              <div className="text-center py-8">
                <Scale className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <div className="text-[11px] font-semibold">No orders selected</div>
                <div className="text-[9px] text-muted-foreground">Use the checkboxes to add orders for comparison</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[9px]">
                  <thead><tr className="border-b"><th className="text-left py-2 pr-2 text-muted-foreground font-medium">Attribute</th>{compareOrders.map(o => <th key={o.id} className="py-2 px-2 text-center font-medium min-w-[120px]">{o.title.slice(0, 25)}...</th>)}</tr></thead>
                  <tbody>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Status</td>{compareOrders.map(o => <td key={o.id} className="py-1.5 px-2 text-center"><StatusBadge status={S[o.status].badge} label={S[o.status].label} /></td>)}</tr>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Total</td>{compareOrders.map(o => <td key={o.id} className="py-1.5 px-2 text-center font-bold">${o.total.toLocaleString()}</td>)}</tr>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Package</td>{compareOrders.map(o => <td key={o.id} className="py-1.5 px-2 text-center">{o.package}</td>)}</tr>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Due Date</td>{compareOrders.map(o => <td key={o.id} className="py-1.5 px-2 text-center">{o.dueDate}</td>)}</tr>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Revisions</td>{compareOrders.map(o => <td key={o.id} className="py-1.5 px-2 text-center">{o.revisionsUsed}/{o.revisions}</td>)}</tr>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Progress</td>{compareOrders.map(o => { const d = o.timeline.filter(t => t.done).length; return <td key={o.id} className="py-1.5 px-2 text-center">{d}/{o.timeline.length}</td>; })}</tr>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Seller</td>{compareOrders.map(o => <td key={o.id} className="py-1.5 px-2 text-center">{o.seller.name}</td>)}</tr>
                    <tr><td className="py-1.5 pr-2 text-muted-foreground">Escrow</td>{compareOrders.map(o => <td key={o.id} className="py-1.5 px-2 text-center">{o.escrowHeld ? `$${o.escrowHeld}` : '—'}</td>)}</tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Accept Confirmation ── */}
      {acceptConfirm && selected && (
        <div className="fixed inset-0 z-[100]" onClick={() => setAcceptConfirm(false)}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div className="relative flex justify-center items-start pt-[15vh] px-4" onClick={e => e.stopPropagation()}>
            <div className="w-full max-w-sm bg-card rounded-3xl border shadow-2xl overflow-hidden p-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--state-healthy))]/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6 text-[hsl(var(--state-healthy))]" />
              </div>
              <h2 className="text-sm font-bold mb-1">Approve & Complete Order?</h2>
              <p className="text-[10px] text-muted-foreground mb-3">This will release <strong>${selected.total}</strong> from escrow to <strong>{selected.seller.name}</strong>.</p>
              <div className="rounded-2xl bg-muted/20 p-3 mb-4 text-left space-y-1 text-[9px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Order</span><span className="font-bold">{selected.id}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold">${selected.total.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Files</span><span className="font-medium">{selected.deliveryFiles?.length || 0} delivered</span></div>
              </div>
              <div className="rounded-2xl border border-accent/20 bg-accent/5 p-2 mb-4">
                <div className="flex items-center gap-1.5 text-[9px]"><Shield className="h-3 w-3 text-accent" /><span className="font-medium">This action is final. Funds will be released immediately.</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[10px] flex-1 rounded-xl" onClick={() => setAcceptConfirm(false)}>Cancel</Button>
                <Button size="sm" className="h-8 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setAcceptConfirm(false); toast.success('Order completed! Funds released.'); }}>
                  <CheckCircle2 className="h-3 w-3" />Approve & Release
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default OrdersDashboard;
