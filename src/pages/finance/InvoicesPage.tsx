import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import {
  Receipt, DollarSign, Download, Search, CheckCircle2, Clock, Building2,
  BarChart3, Eye, RefreshCw, AlertTriangle, AlertCircle, ChevronRight,
  MoreHorizontal, Shield, History, FileText, ExternalLink, Plus, Package,
  Printer, Copy, Send, Calculator, Globe, Landmark, Users, Filter,
  ArrowUpRight, ArrowDownRight, X, Edit, Trash2, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

// ── Types ──
type InvStatus = 'paid' | 'pending' | 'overdue' | 'draft' | 'void' | 'refunded' | 'partial';
type OrderStatus = 'completed' | 'processing' | 'disputed' | 'refunded' | 'canceled';

interface Invoice {
  id: string; client: string; clientAvatar: string; amount: string; subtotal: string;
  tax: string; taxRate: string; status: InvStatus; date: string; due: string;
  items: number; project?: string; currency: string; ref?: string;
}

interface Order {
  id: string; title: string; buyer: string; seller: string; amount: string;
  status: OrderStatus; date: string; type: string; ref?: string;
}

interface TaxEntry {
  jurisdiction: string; rate: string; collected: string; remitted: string;
  status: 'current' | 'due' | 'overdue'; period: string;
}

// ── Mock Data ──
const INVOICES: Invoice[] = [
  { id: 'INV-001', client: 'TechCorp', clientAvatar: 'TC', amount: '$5,250.00', subtotal: '$5,000.00', tax: '$250.00', taxRate: '5%', status: 'paid', date: 'Apr 6', due: 'Apr 6', items: 3, project: 'SaaS Platform', currency: 'USD', ref: 'PRJ-201' },
  { id: 'INV-002', client: 'DesignHub', clientAvatar: 'DH', amount: '$2,520.00', subtotal: '$2,400.00', tax: '$120.00', taxRate: '5%', status: 'pending', date: 'Apr 2', due: 'Apr 16', items: 2, currency: 'USD' },
  { id: 'INV-003', client: 'CloudScale', clientAvatar: 'CS', amount: '$8,925.00', subtotal: '$8,500.00', tax: '$425.00', taxRate: '5%', status: 'overdue', date: 'Mar 15', due: 'Mar 29', items: 5, project: 'E-Commerce Migration', currency: 'USD', ref: 'PRJ-198' },
  { id: 'INV-004', client: 'AppWorks', clientAvatar: 'AW', amount: '$1,260.00', subtotal: '$1,200.00', tax: '$60.00', taxRate: '5%', status: 'draft', date: 'Apr 8', due: '', items: 1, currency: 'USD' },
  { id: 'INV-005', client: 'GrowthEngine', clientAvatar: 'GE', amount: '$3,937.50', subtotal: '$3,750.00', tax: '$187.50', taxRate: '5%', status: 'paid', date: 'Apr 7', due: 'Apr 21', items: 4, project: 'SEO Campaign', currency: 'USD' },
  { id: 'INV-006', client: 'Nexus Ltd', clientAvatar: 'NL', amount: '$750.00', subtotal: '$750.00', tax: '$0.00', taxRate: '0%', status: 'refunded', date: 'Mar 20', due: 'Mar 20', items: 1, currency: 'USD', ref: 'REF-044' },
  { id: 'INV-007', client: 'DataFlow', clientAvatar: 'DF', amount: '$4,200.00', subtotal: '$4,000.00', tax: '$200.00', taxRate: '5%', status: 'partial', date: 'Mar 10', due: 'Mar 24', items: 3, project: 'API Integration', currency: 'USD' },
];

const ORDERS: Order[] = [
  { id: 'ORD-445', title: 'Logo Design — Premium', buyer: 'Alex K.', seller: 'Sarah C.', amount: '$500.00', status: 'completed', date: 'Apr 8', type: 'Gig', ref: 'GIG-892' },
  { id: 'ORD-444', title: 'SEO Audit — Standard', buyer: 'GrowthEngine', seller: 'Elena R.', amount: '$150.00', status: 'completed', date: 'Apr 5', type: 'Gig' },
  { id: 'ORD-443', title: 'Mobile App Redesign — Phase 1', buyer: 'TechCorp', seller: 'Team Alpha', amount: '$12,000.00', status: 'processing', date: 'Apr 3', type: 'Project', ref: 'PRJ-205' },
  { id: 'ORD-442', title: 'Brand Identity Package', buyer: 'Lisa W.', seller: 'Tom R.', amount: '$1,800.00', status: 'disputed', date: 'Mar 28', type: 'Gig', ref: 'DSP-001' },
  { id: 'ORD-441', title: 'Content Writing — Blog', buyer: 'AppWorks', seller: 'Priya P.', amount: '$320.00', status: 'refunded', date: 'Mar 25', type: 'Gig', ref: 'REF-043' },
  { id: 'ORD-440', title: 'Consulting — 2hr Session', buyer: 'DataFlow', seller: 'Alex K.', amount: '$400.00', status: 'completed', date: 'Mar 22', type: 'Service' },
];

const TAX_ENTRIES: TaxEntry[] = [
  { jurisdiction: 'United States — Federal', rate: '0%', collected: '$0.00', remitted: '$0.00', status: 'current', period: 'Q1 2025' },
  { jurisdiction: 'California — State', rate: '7.25%', collected: '$1,242.50', remitted: '$1,242.50', status: 'current', period: 'Q1 2025' },
  { jurisdiction: 'New York — State', rate: '8%', collected: '$680.00', remitted: '$680.00', status: 'current', period: 'Q1 2025' },
  { jurisdiction: 'EU — VAT', rate: '20%', collected: '$2,100.00', remitted: '$0.00', status: 'due', period: 'Q1 2025' },
  { jurisdiction: 'UK — VAT', rate: '20%', collected: '$840.00', remitted: '$840.00', status: 'current', period: 'Q4 2024' },
];

const ACTIVITY = [
  { actor: 'System', action: 'Invoice INV-001 marked as paid — $5,250', time: '4d ago', type: 'payment' },
  { actor: 'Alex K.', action: 'Created draft invoice INV-004 for AppWorks', time: '2d ago', type: 'create' },
  { actor: 'System', action: 'Invoice INV-003 is overdue — $8,925', time: '12d ago', type: 'alert' },
  { actor: 'System', action: 'Order ORD-445 completed — $500', time: '2d ago', type: 'order' },
  { actor: 'Elena R.', action: 'Refund processed for INV-006 — $750', time: '3w ago', type: 'refund' },
];

const INV_STATUS_MAP: Record<InvStatus, 'healthy' | 'pending' | 'blocked' | 'caution' | 'degraded' | 'review'> = {
  paid: 'healthy', pending: 'pending', overdue: 'blocked', draft: 'degraded', void: 'degraded', refunded: 'caution', partial: 'review',
};
const ORD_STATUS_MAP: Record<OrderStatus, 'healthy' | 'pending' | 'blocked' | 'caution' | 'degraded'> = {
  completed: 'healthy', processing: 'pending', disputed: 'blocked', refunded: 'caution', canceled: 'degraded',
};
const TAX_STATUS_MAP: Record<string, 'healthy' | 'pending' | 'blocked'> = { current: 'healthy', due: 'pending', overdue: 'blocked' };

// ── Invoice Detail Drawer ──
const InvoiceDetailDrawer: React.FC<{ inv: Invoice | null; open: boolean; onClose: () => void }> = ({ inv, open, onClose }) => {
  if (!inv) return null;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Receipt className="h-4 w-4 text-accent" />{inv.id}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="text-center py-3 border-b">
            <div className="text-2xl font-bold">{inv.amount}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{inv.client}{inv.project && ` · ${inv.project}`}</div>
            <StatusBadge status={INV_STATUS_MAP[inv.status]} label={inv.status} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Client', value: inv.client },
              { label: 'Date', value: inv.date },
              { label: 'Due', value: inv.due || '—' },
              { label: 'Currency', value: inv.currency },
              { label: 'Items', value: String(inv.items) },
              ...(inv.ref ? [{ label: 'Reference', value: inv.ref }] : []),
            ].map(m => (
              <div key={m.label} className="rounded-md border p-2">
                <div className="text-[7px] text-muted-foreground mb-0.5">{m.label}</div>
                <div className="text-[9px] font-medium">{m.value}</div>
              </div>
            ))}
          </div>
          {/* Line Items */}
          <div className="border-t pt-3">
            <div className="text-[10px] font-semibold mb-2">Line Items</div>
            <div className="space-y-1 text-[9px]">
              {Array.from({ length: inv.items }).map((_, i) => (
                <div key={i} className="flex justify-between py-1 border-b last:border-0">
                  <span>Service item {i + 1}</span>
                  <span className="font-medium">{inv.subtotal}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 text-muted-foreground">
                <span>Subtotal</span><span>{inv.subtotal}</span>
              </div>
              <div className="flex justify-between py-1 text-muted-foreground">
                <span>Tax ({inv.taxRate})</span><span>{inv.tax}</span>
              </div>
              <div className="flex justify-between py-1 font-semibold border-t">
                <span>Total</span><span>{inv.amount}</span>
              </div>
            </div>
          </div>
          {/* State warnings */}
          {inv.status === 'overdue' && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-center gap-1.5 text-destructive text-[10px] font-semibold mb-1"><AlertCircle className="h-3 w-3" />Overdue</div>
              <p className="text-[8px] text-muted-foreground">This invoice is past due. Send a reminder or escalate to collections.</p>
              <div className="flex gap-1.5 mt-2">
                <Button size="sm" className="h-6 text-[9px] gap-1"><Send className="h-2.5 w-2.5" />Send Reminder</Button>
                <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1">Escalate</Button>
              </div>
            </div>
          )}
          {inv.status === 'draft' && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
              <div className="flex items-center gap-1.5 text-accent text-[10px] font-semibold mb-1"><Edit className="h-3 w-3" />Draft</div>
              <p className="text-[8px] text-muted-foreground">This invoice has not been sent. Finalize and send to the client.</p>
              <div className="flex gap-1.5 mt-2">
                <Button size="sm" className="h-6 text-[9px] gap-1"><Send className="h-2.5 w-2.5" />Send</Button>
                <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><Edit className="h-2.5 w-2.5" />Edit</Button>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><Download className="h-2.5 w-2.5" />PDF</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><Printer className="h-2.5 w-2.5" />Print</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><Copy className="h-2.5 w-2.5" />Duplicate</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><Send className="h-2.5 w-2.5" />Resend</Button>
            {inv.status !== 'void' && inv.status !== 'refunded' && (
              <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 text-destructive"><X className="h-2.5 w-2.5" />Void</Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Create Invoice Drawer ──
const CreateInvoiceDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Sheet open={open} onOpenChange={onClose}>
    <SheetContent className="w-[480px] overflow-y-auto">
      <SheetHeader><SheetTitle className="text-sm">Create Invoice</SheetTitle></SheetHeader>
      <div className="mt-4 space-y-3">
        <div>
          <label className="text-[9px] font-medium mb-1 block">Client</label>
          <input className="w-full h-7 rounded-md border bg-background px-2 text-[9px]" placeholder="Search client..." />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] font-medium mb-1 block">Currency</label>
            <select className="w-full h-7 rounded-md border bg-background px-2 text-[9px]">
              <option>USD</option><option>EUR</option><option>GBP</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] font-medium mb-1 block">Due Date</label>
            <input type="date" className="w-full h-7 rounded-md border bg-background px-2 text-[9px]" />
          </div>
        </div>
        <div>
          <label className="text-[9px] font-medium mb-1 block">Line Items</label>
          <div className="rounded-lg border p-2 space-y-1.5">
            <div className="grid grid-cols-[1fr_80px_60px] gap-1.5 text-[8px]">
              <input className="h-6 rounded border bg-background px-1.5" placeholder="Description" />
              <input className="h-6 rounded border bg-background px-1.5" placeholder="Amount" />
              <Button variant="ghost" size="sm" className="h-6 text-[7px] text-destructive"><Trash2 className="h-2.5 w-2.5" /></Button>
            </div>
            <Button variant="outline" size="sm" className="h-5 text-[7px] w-full gap-0.5"><Plus className="h-2 w-2" />Add Item</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] font-medium mb-1 block">Tax Rate</label>
            <select className="w-full h-7 rounded-md border bg-background px-2 text-[9px]">
              <option>0%</option><option>5%</option><option>7.25%</option><option>8%</option><option>20%</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] font-medium mb-1 block">Link to Project</label>
            <input className="w-full h-7 rounded-md border bg-background px-2 text-[9px]" placeholder="Search..." />
          </div>
        </div>
        <div>
          <label className="text-[9px] font-medium mb-1 block">Notes</label>
          <textarea className="w-full h-14 rounded-md border bg-background px-2 py-1 text-[9px] resize-none" placeholder="Payment terms, additional notes..." />
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1" onClick={() => { onClose(); toast.success('Draft saved'); }}>Save Draft</Button>
          <Button size="sm" className="h-7 text-[10px] flex-1 gap-1" onClick={() => { onClose(); toast.success('Invoice sent'); }}><Send className="h-3 w-3" />Send</Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
);

// ── Main Page ──
const InvoicesPage: React.FC = () => {
  const { activeRole } = useRole();
  const [selectedInv, setSelectedInv] = useState<Invoice | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = INVOICES.filter(inv => {
    const ms = !search || inv.id.toLowerCase().includes(search.toLowerCase()) || inv.client.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === 'all' || inv.status === statusFilter;
    return ms && mst;
  });

  const totalRevenue = '$26,842.50';
  const outstanding = '$11,445.00';
  const overdueAmt = '$8,925.00';
  const taxCollected = '$4,862.50';

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <Receipt className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Invoices & Orders</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="h-6 rounded-md border bg-background pl-7 pr-2 text-[8px] w-36 focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-6 rounded-md border bg-background px-1.5 text-[8px]">
        <option value="all">All status</option>
        <option value="paid">Paid</option>
        <option value="pending">Pending</option>
        <option value="overdue">Overdue</option>
        <option value="draft">Draft</option>
        <option value="refunded">Refunded</option>
      </select>
      <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Download className="h-3 w-3" />Export</Button>
      <Button size="sm" className="h-7 text-[10px] gap-1" onClick={() => setCreateOpen(true)}><Plus className="h-3 w-3" />New Invoice</Button>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Revenue Summary" icon={<DollarSign className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />}>
        <div className="text-lg font-bold">{totalRevenue}</div>
        <div className="text-[8px] text-muted-foreground">YTD collected</div>
        <div className="mt-2 space-y-1 text-[8px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Outstanding</span><span className="font-medium">{outstanding}</span></div>
          <div className="flex justify-between"><span className="text-destructive">Overdue</span><span className="font-semibold text-destructive">{overdueAmt}</span></div>
        </div>
      </SectionCard>

      <SectionCard title="Tax Summary" icon={<Calculator className="h-3.5 w-3.5 text-accent" />}>
        <div className="text-lg font-bold">{taxCollected}</div>
        <div className="text-[8px] text-muted-foreground">Total collected</div>
        <div className="mt-1.5 space-y-0.5">
          {TAX_ENTRIES.slice(0, 3).map(t => (
            <div key={t.jurisdiction} className="flex items-center justify-between text-[7px]">
              <span className="text-muted-foreground truncate max-w-[100px]">{t.jurisdiction}</span>
              <StatusBadge status={TAX_STATUS_MAP[t.status]} label={t.status} />
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="h-4 text-[7px] mt-1 w-full">View All</Button>
      </SectionCard>

      {INVOICES.some(i => i.status === 'overdue') && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2">
          <div className="flex items-center gap-1 text-destructive text-[8px] font-semibold"><AlertCircle className="h-2.5 w-2.5" />Overdue Invoices</div>
          <p className="text-[7px] text-muted-foreground mt-0.5">{INVOICES.filter(i => i.status === 'overdue').length} invoice(s) past due</p>
          <Button variant="outline" size="sm" className="h-4 text-[6px] mt-1.5">Send Reminders</Button>
        </div>
      )}

      <SectionCard title="Quick Actions">
        <div className="space-y-0.5">
          {[
            { label: 'Create Invoice', icon: Plus },
            { label: 'Export Accounting', icon: Download },
            { label: 'Tax Settings', icon: Calculator },
            { label: 'Payment Methods', icon: Landmark },
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

  /* ── Bottom ── */
  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Financial Activity</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {ACTIVITY.map((a, i) => (
          <div key={i} className="shrink-0 rounded-lg border bg-card px-3 py-2 min-w-[220px]">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Avatar className="h-4 w-4"><AvatarFallback className="text-[5px]">{a.actor[0]}</AvatarFallback></Avatar>
              <span className="text-[9px] font-medium">{a.actor}</span>
              <Badge variant="secondary" className="text-[6px] capitalize">{a.type}</Badge>
            </div>
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
        <KPICard label="Total Revenue" value={totalRevenue} change="YTD" trend="up" />
        <KPICard label="Outstanding" value={outstanding} change="3 invoices" trend="neutral" />
        <KPICard label="Overdue" value={overdueAmt} change="1 invoice" trend="down" />
        <KPICard label="Tax Collected" value={taxCollected} change="Q1 2025" />
      </KPIBand>

      <Tabs defaultValue="invoices">
        <TabsList className="mb-3 flex-wrap h-auto gap-0.5">
          <TabsTrigger value="invoices" className="gap-1 text-[10px] h-6 px-2"><Receipt className="h-3 w-3" />Invoices</TabsTrigger>
          <TabsTrigger value="orders" className="gap-1 text-[10px] h-6 px-2"><Package className="h-3 w-3" />Orders</TabsTrigger>
          <TabsTrigger value="taxes" className="gap-1 text-[10px] h-6 px-2"><Calculator className="h-3 w-3" />Taxes</TabsTrigger>
          <TabsTrigger value="accounting" className="gap-1 text-[10px] h-6 px-2"><BarChart3 className="h-3 w-3" />Accounting</TabsTrigger>
        </TabsList>

        {/* Invoices */}
        <TabsContent value="invoices">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-[9px] text-muted-foreground font-medium">
                  <th className="text-left px-3 py-2">Invoice</th>
                  <th className="text-left px-3 py-2">Client</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-right px-3 py-2">Amount</th>
                  <th className="text-left px-3 py-2">Date</th>
                  <th className="text-left px-3 py-2">Due</th>
                  <th className="text-left px-3 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id} onClick={() => setSelectedInv(inv)} className={cn('border-t hover:bg-muted/30 cursor-pointer text-[9px] transition-colors', selectedInv?.id === inv.id && 'bg-accent/5')}>
                    <td className="px-3 py-2">
                      <div className="font-medium">{inv.id}</div>
                      {inv.project && <div className="text-[7px] text-muted-foreground">{inv.project}</div>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5"><AvatarFallback className="text-[6px]">{inv.clientAvatar}</AvatarFallback></Avatar>
                        <span>{inv.client}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2"><StatusBadge status={INV_STATUS_MAP[inv.status]} label={inv.status} /></td>
                    <td className="px-3 py-2 text-right font-semibold">{inv.amount}</td>
                    <td className="px-3 py-2 text-muted-foreground">{inv.date}</td>
                    <td className="px-3 py-2 text-muted-foreground">{inv.due || '—'}</td>
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-5 w-5"><Download className="h-2.5 w-2.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5"><MoreHorizontal className="h-2.5 w-2.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Orders */}
        <TabsContent value="orders">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-[9px] text-muted-foreground font-medium">
                  <th className="text-left px-3 py-2">Order</th>
                  <th className="text-left px-3 py-2">Title</th>
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-right px-3 py-2">Amount</th>
                  <th className="text-left px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {ORDERS.map(o => (
                  <tr key={o.id} className="border-t hover:bg-muted/30 cursor-pointer text-[9px] transition-colors">
                    <td className="px-3 py-2 font-medium">{o.id}</td>
                    <td className="px-3 py-2">
                      <div>{o.title}</div>
                      <div className="text-[7px] text-muted-foreground">{o.buyer} → {o.seller}</div>
                    </td>
                    <td className="px-3 py-2"><Badge variant="secondary" className="text-[7px]">{o.type}</Badge></td>
                    <td className="px-3 py-2"><StatusBadge status={ORD_STATUS_MAP[o.status]} label={o.status} /></td>
                    <td className="px-3 py-2 text-right font-semibold">{o.amount}</td>
                    <td className="px-3 py-2 text-muted-foreground">{o.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Taxes */}
        <TabsContent value="taxes">
          <div className="space-y-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-[11px] font-semibold mb-3 flex items-center gap-1"><Globe className="h-3.5 w-3.5 text-accent" />Tax Obligations by Jurisdiction</div>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-[9px] text-muted-foreground font-medium">
                      <th className="text-left px-3 py-2">Jurisdiction</th>
                      <th className="text-left px-3 py-2">Rate</th>
                      <th className="text-right px-3 py-2">Collected</th>
                      <th className="text-right px-3 py-2">Remitted</th>
                      <th className="text-left px-3 py-2">Status</th>
                      <th className="text-left px-3 py-2">Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TAX_ENTRIES.map(t => (
                      <tr key={t.jurisdiction} className="border-t text-[9px]">
                        <td className="px-3 py-2 font-medium">{t.jurisdiction}</td>
                        <td className="px-3 py-2 text-muted-foreground">{t.rate}</td>
                        <td className="px-3 py-2 text-right">{t.collected}</td>
                        <td className="px-3 py-2 text-right">{t.remitted}</td>
                        <td className="px-3 py-2"><StatusBadge status={TAX_STATUS_MAP[t.status]} label={t.status} /></td>
                        <td className="px-3 py-2 text-muted-foreground">{t.period}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {TAX_ENTRIES.some(t => t.status === 'due') && (
              <div className="rounded-lg border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 p-3">
                <div className="flex items-center gap-1.5 text-[hsl(var(--gigvora-amber))] text-[10px] font-semibold mb-1"><AlertTriangle className="h-3 w-3" />Tax Remittance Due</div>
                <p className="text-[8px] text-muted-foreground">EU VAT for Q1 2025 ($2,100) is due for remittance. File before the deadline to avoid penalties.</p>
                <div className="flex gap-1.5 mt-2">
                  <Button size="sm" className="h-6 text-[9px] gap-1">File Now</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[9px]">View Details</Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Accounting */}
        <TabsContent value="accounting">
          <div className="space-y-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-[11px] font-semibold mb-3 flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5 text-accent" />Revenue vs Expenses — 2025</div>
              <div className="h-36 flex items-end gap-2 px-2">
                {[
                  { m: 'Jan', rev: 60, exp: 35 }, { m: 'Feb', rev: 72, exp: 40 },
                  { m: 'Mar', rev: 85, exp: 45 }, { m: 'Apr', rev: 55, exp: 30 },
                ].map(d => (
                  <div key={d.m} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex gap-0.5 items-end justify-center" style={{ height: '120px' }}>
                      <div className="w-3 rounded-t bg-accent/70" style={{ height: `${d.rev}%` }} />
                      <div className="w-3 rounded-t bg-destructive/40" style={{ height: `${d.exp}%` }} />
                    </div>
                    <span className="text-[7px] text-muted-foreground">{d.m}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-2 justify-center text-[8px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-accent/70" />Revenue</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-destructive/40" />Expenses</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-card p-4">
                <div className="text-[10px] font-semibold mb-2 flex items-center gap-1"><ArrowDownRight className="h-3 w-3 text-[hsl(var(--state-healthy))]" />Income</div>
                <div className="space-y-1 text-[8px]">
                  {[{ l: 'Gig Orders', v: '$8,450' }, { l: 'Project Milestones', v: '$14,250' }, { l: 'Consulting', v: '$2,400' }, { l: 'Other', v: '$1,742.50' }].map(r => (
                    <div key={r.l} className="flex justify-between py-0.5 border-b last:border-0">
                      <span className="text-muted-foreground">{r.l}</span><span className="font-medium">{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-[10px] font-semibold mb-2 flex items-center gap-1"><ArrowUpRight className="h-3 w-3 text-destructive" />Expenses</div>
                <div className="space-y-1 text-[8px]">
                  {[{ l: 'Platform Fees', v: '$1,342' }, { l: 'Subscriptions', v: '$297' }, { l: 'Tax Remitted', v: '$2,762.50' }, { l: 'Refunds', v: '$750' }].map(r => (
                    <div key={r.l} className="flex justify-between py-0.5 border-b last:border-0">
                      <span className="text-muted-foreground">{r.l}</span><span className="font-medium">{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Download className="h-3 w-3" />Export CSV</Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><FileText className="h-3 w-3" />Generate Report</Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><ExternalLink className="h-3 w-3" />Connect Accounting Software</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <InvoiceDetailDrawer inv={selectedInv} open={!!selectedInv} onClose={() => setSelectedInv(null)} />
      <CreateInvoiceDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </DashboardLayout>
  );
};

export default InvoicesPage;
