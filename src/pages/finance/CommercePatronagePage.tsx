import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import {
  Heart, DollarSign, ShoppingCart, Users, Clock, Download, TrendingUp, Filter,
  ChevronRight, AlertTriangle, CreditCard, Gift, Repeat, Receipt, Eye, Star,
  ArrowUpRight, ArrowDownRight, History, RefreshCw, Smartphone, ExternalLink,
  CheckCircle2, XCircle, Plus, Search, BarChart3, Wallet, FileText, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

type CTab = 'overview' | 'donations' | 'checkout' | 'patrons' | 'creator' | 'recurring' | 'receipts' | 'mobile';

interface Donation {
  id: string; donor: string; creator: string; amount: string; date: string;
  type: 'one-time' | 'recurring' | 'tip'; status: 'completed' | 'pending' | 'refunded' | 'failed';
  method: string; message?: string;
}

interface Purchase {
  id: string; buyer: string; item: string; amount: string; date: string;
  type: 'digital' | 'service' | 'subscription' | 'package';
  status: 'completed' | 'processing' | 'refunded' | 'disputed';
}

interface Patron {
  id: string; name: string; avatar: string; tier: string; monthlyAmount: string;
  since: string; totalGiven: string; status: 'active' | 'paused' | 'cancelled';
  streak: number;
}

interface RecurringSetup {
  id: string; creator: string; tier: string; amount: string; frequency: 'monthly' | 'yearly';
  nextCharge: string; status: 'active' | 'paused' | 'cancelled' | 'past_due';
  method: string;
}

const DONATIONS: Donation[] = [
  { id: 'DON-001', donor: 'Sarah M.', creator: 'DevStudio Pro', amount: '$50.00', date: '2h ago', type: 'one-time', status: 'completed', method: 'Visa ••4242', message: 'Love your content!' },
  { id: 'DON-002', donor: 'Alex K.', creator: 'DesignLab', amount: '$25.00', date: '5h ago', type: 'recurring', status: 'completed', method: 'PayPal' },
  { id: 'DON-003', donor: 'Jordan R.', creator: 'TechTalks', amount: '$10.00', date: '1d ago', type: 'tip', status: 'completed', method: 'Apple Pay' },
  { id: 'DON-004', donor: 'Morgan T.', creator: 'CodeCraft', amount: '$100.00', date: '1d ago', type: 'one-time', status: 'pending', method: 'Bank Transfer' },
  { id: 'DON-005', donor: 'Casey L.', creator: 'DevStudio Pro', amount: '$15.00', date: '2d ago', type: 'recurring', status: 'refunded', method: 'Mastercard ••8821' },
  { id: 'DON-006', donor: 'Riley P.', creator: 'DesignLab', amount: '$5.00', date: '3d ago', type: 'tip', status: 'failed', method: 'Visa ••1234' },
];

const PURCHASES: Purchase[] = [
  { id: 'PUR-001', buyer: 'Team Alpha', item: 'Pro Template Pack', amount: '$149.00', date: '3h ago', type: 'digital', status: 'completed' },
  { id: 'PUR-002', buyer: 'Sarah M.', item: 'Consulting Hour', amount: '$200.00', date: '6h ago', type: 'service', status: 'processing' },
  { id: 'PUR-003', buyer: 'DevCorp', item: 'Enterprise License', amount: '$499.00', date: '1d ago', type: 'subscription', status: 'completed' },
  { id: 'PUR-004', buyer: 'Jordan R.', item: 'Starter Bundle', amount: '$29.00', date: '2d ago', type: 'package', status: 'refunded' },
];

const PATRONS: Patron[] = [
  { id: 'PAT-01', name: 'Sarah Mitchell', avatar: 'SM', tier: 'Gold', monthlyAmount: '$50', since: 'Jan 2025', totalGiven: '$600', status: 'active', streak: 12 },
  { id: 'PAT-02', name: 'Alex Kim', avatar: 'AK', tier: 'Silver', monthlyAmount: '$25', since: 'Mar 2025', totalGiven: '$250', status: 'active', streak: 10 },
  { id: 'PAT-03', name: 'Jordan Reed', avatar: 'JR', tier: 'Bronze', monthlyAmount: '$10', since: 'Jun 2025', totalGiven: '$70', status: 'active', streak: 7 },
  { id: 'PAT-04', name: 'Morgan Torres', avatar: 'MT', tier: 'Gold', monthlyAmount: '$50', since: 'Feb 2025', totalGiven: '$550', status: 'paused', streak: 0 },
  { id: 'PAT-05', name: 'Casey Lane', avatar: 'CL', tier: 'Silver', monthlyAmount: '$25', since: 'Apr 2025', totalGiven: '$200', status: 'cancelled', streak: 0 },
];

const RECURRING: RecurringSetup[] = [
  { id: 'REC-01', creator: 'DevStudio Pro', tier: 'Gold Patron', amount: '$50/mo', frequency: 'monthly', nextCharge: 'Apr 15', status: 'active', method: 'Visa ••4242' },
  { id: 'REC-02', creator: 'DesignLab', tier: 'Silver Patron', amount: '$25/mo', frequency: 'monthly', nextCharge: 'Apr 20', status: 'active', method: 'PayPal' },
  { id: 'REC-03', creator: 'TechTalks', tier: 'Annual Pro', amount: '$99/yr', frequency: 'yearly', nextCharge: 'Dec 1', status: 'active', method: 'Mastercard ••8821' },
  { id: 'REC-04', creator: 'CodeCraft', tier: 'Bronze Patron', amount: '$10/mo', frequency: 'monthly', nextCharge: 'Apr 18', status: 'past_due', method: 'Visa ••1234' },
];

const STATUS_MAP: Record<string, 'healthy' | 'caution' | 'degraded' | 'blocked'> = {
  completed: 'healthy', active: 'healthy', processing: 'caution', pending: 'caution',
  paused: 'caution', past_due: 'blocked', refunded: 'degraded', failed: 'blocked',
  disputed: 'blocked', cancelled: 'degraded',
};

/* ── Detail Drawer ── */
const DonationDrawer: React.FC<{ item: Donation | null; open: boolean; onClose: () => void }> = ({ item, open, onClose }) => {
  if (!item) return null;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[440px] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Heart className="h-4 w-4 text-accent" />{item.id}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="h-20 rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center">
            <div className="text-center"><div className="text-2xl font-bold">{item.amount}</div><div className="text-[8px] text-muted-foreground">{item.type} · {item.date}</div></div>
          </div>
          <div className="flex justify-center"><StatusBadge status={STATUS_MAP[item.status]} label={item.status} /></div>
          <div className="grid grid-cols-2 gap-2">
            {[{ l: 'Donor', v: item.donor }, { l: 'Creator', v: item.creator }, { l: 'Method', v: item.method }, { l: 'Type', v: item.type }].map(m => (
              <div key={m.l} className="rounded-xl border p-2"><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-[9px] font-semibold">{m.v}</div></div>
            ))}
          </div>
          {item.message && (
            <div className="rounded-xl border p-2 bg-muted/10"><div className="text-[7px] text-muted-foreground mb-0.5">Message</div><div className="text-[9px] italic">"{item.message}"</div></div>
          )}
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Downloading receipt')}><Receipt className="h-2.5 w-2.5" />Receipt</Button>
            {item.status === 'completed' && <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Refund flow')}><RefreshCw className="h-2.5 w-2.5" />Refund</Button>}
            <Link to="/finance"><Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Wallet className="h-2.5 w-2.5" />Finance Hub</Button></Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ── Main Page ── */
const CommercePatronagePage: React.FC = () => {
  const { activeRole } = useRole();
  const [tab, setTab] = useState<CTab>('overview');
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [search, setSearch] = useState('');
  const [donationAmount, setDonationAmount] = useState('25');

  const topStrip = (
    <>
      <Heart className="h-3.5 w-3.5 text-accent" />
      <span className="text-[11px] font-semibold">Donations · Purchases · Creator Commerce · Patronage</span>
      <Badge variant="secondary" className="text-[7px] capitalize">{activeRole}</Badge>
      <div className="flex-1" />
      <div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..." className="h-6 w-36 rounded-xl border bg-background pl-7 pr-2 text-[8px]" /></div>
      <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Exporting')}><Download className="h-3 w-3" />Export</Button>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Financial Summary" icon={<DollarSign className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="text-lg font-bold">$4,280</div>
        <div className="text-[8px] text-muted-foreground">Total this month</div>
        <div className="mt-1.5 space-y-0.5 text-[8px]">
          {[{ l: 'Donations', v: '$1,205' }, { l: 'Purchases', v: '$877' }, { l: 'Patronage', v: '$2,198' }, { l: 'Pending', v: '$100' }].map(m => (
            <div key={m.l} className="flex justify-between"><span className="text-muted-foreground">{m.l}</span><span className="font-medium">{m.v}</span></div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Alerts" icon={<AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />} className="!rounded-2xl">
        <div className="space-y-1">
          {[
            { label: 'Past-due recurring: CodeCraft', severity: 'blocked' as const },
            { label: 'Refund request pending review', severity: 'caution' as const },
            { label: 'Failed payment: Riley P.', severity: 'blocked' as const },
          ].map(a => (
            <div key={a.label} className="flex items-center gap-1.5 p-1.5 rounded-lg border text-[8px]">
              <StatusBadge status={a.severity} label={a.severity === 'blocked' ? 'Alert' : 'Warning'} />
              <span className="flex-1">{a.label}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Quick Links" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { label: 'Wallet', icon: Wallet, to: '/finance/wallet' },
            { label: 'Billing', icon: CreditCard, to: '/finance/billing' },
            { label: 'Invoices', icon: FileText, to: '/finance/invoices' },
            { label: 'Payouts', icon: DollarSign, to: '/finance/payouts' },
          ].map(a => (
            <Link key={a.label} to={a.to}><button className="flex items-center gap-2 p-1.5 rounded-lg w-full text-left hover:bg-muted/30 transition-colors text-[8px]"><a.icon className="h-3 w-3 text-muted-foreground" /><span>{a.label}</span><ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" /></button></Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Recent Activity</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[
          { action: 'Sarah M. donated $50 to DevStudio Pro', time: '2h ago', type: 'donation' },
          { action: 'Team Alpha purchased Pro Template Pack', time: '3h ago', type: 'purchase' },
          { action: 'Alex K. renewed Silver patronage', time: '5h ago', type: 'patronage' },
          { action: 'Refund processed for Casey L.', time: '2d ago', type: 'refund' },
          { action: 'CodeCraft recurring payment failed', time: '3d ago', type: 'alert' },
        ].map((a, i) => (
          <div key={i} className="shrink-0 rounded-2xl border bg-card px-3 py-2 min-w-[210px] hover:shadow-sm transition-all">
            <Badge variant="secondary" className="text-[6px] capitalize mb-1">{a.type}</Badge>
            <p className="text-[8px] text-muted-foreground line-clamp-2">{a.action}</p>
            <div className="text-[7px] text-muted-foreground mt-0.5">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      {/* Tab Nav */}
      <div className="flex items-center gap-1 mb-3 border-b pb-2 overflow-x-auto">
        {([
          { key: 'overview' as const, label: 'Overview', icon: BarChart3 },
          { key: 'donations' as const, label: 'Donations', icon: Heart },
          { key: 'checkout' as const, label: 'Checkout / Purchases', icon: ShoppingCart },
          { key: 'patrons' as const, label: 'Patron History', icon: Users },
          { key: 'creator' as const, label: 'Creator Summary', icon: Star },
          { key: 'recurring' as const, label: 'Recurring Setup', icon: Repeat },
          { key: 'receipts' as const, label: 'Receipts', icon: Receipt },
          { key: 'mobile' as const, label: 'Mobile Donor', icon: Smartphone },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] transition-colors whitespace-nowrap shrink-0', tab === t.key ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30')}><t.icon className="h-3 w-3" />{t.label}</button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {tab === 'overview' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Revenue" value="$4,280" change="+18%" trend="up" />
            <KPICard label="Donations" value="$1,205" change="+22%" trend="up" />
            <KPICard label="Active Patrons" value="3" />
            <KPICard label="Recurring MRR" value="$85" change="+5%" trend="up" />
          </KPIBand>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SectionCard title="Revenue by Type" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-2">
                {[{ l: 'Patronage', v: 2198, pct: 51 }, { l: 'Donations', v: 1205, pct: 28 }, { l: 'Purchases', v: 877, pct: 21 }].map(r => (
                  <div key={r.l}>
                    <div className="flex justify-between text-[8px] mb-0.5"><span>{r.l}</span><span className="font-semibold">${r.v} ({r.pct}%)</span></div>
                    <Progress value={r.pct} className="h-1.5" />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Top Creators" icon={<Star className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-1.5">
                {[{ n: 'DevStudio Pro', v: '$1,850', p: 3 }, { n: 'DesignLab', v: '$1,230', p: 2 }, { n: 'TechTalks', v: '$780', p: 1 }].map(c => (
                  <div key={c.n} className="flex items-center gap-2 p-1.5 rounded-xl border hover:bg-muted/20 transition-colors text-[8px]">
                    <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center text-[7px] font-bold text-accent">{c.n[0]}</div>
                    <div className="flex-1"><div className="font-medium">{c.n}</div><div className="text-[7px] text-muted-foreground">{c.p} patrons</div></div>
                    <span className="font-semibold">{c.v}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Health" icon={<Shield className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-1.5">
                {[
                  { l: 'Payment Success', v: '94%', s: 'healthy' as const },
                  { l: 'Churn Rate', v: '8%', s: 'caution' as const },
                  { l: 'Disputes', v: '1 open', s: 'blocked' as const },
                  { l: 'Avg Donation', v: '$34.17', s: 'healthy' as const },
                ].map(h => (
                  <div key={h.l} className="flex items-center justify-between p-1.5 rounded-lg border text-[8px]">
                    <span>{h.l}</span>
                    <div className="flex items-center gap-1"><StatusBadge status={h.s} label={h.v} /></div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Recent transactions */}
          <SectionCard title="Recent Transactions" icon={<History className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/30"><tr className="text-[8px] text-muted-foreground font-medium"><th className="text-left px-3 py-1.5">Transaction</th><th className="text-center px-3 py-1.5">Type</th><th className="text-center px-3 py-1.5">Status</th><th className="text-right px-3 py-1.5">Amount</th><th className="text-right px-3 py-1.5">Date</th></tr></thead>
                <tbody>
                  {[...DONATIONS.slice(0, 3), ...PURCHASES.slice(0, 2)].map((t: any) => (
                    <tr key={t.id} className="border-t text-[8px] hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => t.donor && setSelectedDonation(t)}>
                      <td className="px-3 py-1.5"><div className="font-medium">{t.donor || t.buyer}</div><div className="text-[7px] text-muted-foreground">{t.id}</div></td>
                      <td className="px-3 py-1.5 text-center"><Badge variant="secondary" className="text-[6px] capitalize">{t.type}</Badge></td>
                      <td className="px-3 py-1.5 text-center"><StatusBadge status={STATUS_MAP[t.status]} label={t.status} /></td>
                      <td className="px-3 py-1.5 text-right font-semibold">{t.amount}</td>
                      <td className="px-3 py-1.5 text-right text-muted-foreground">{t.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ DONATIONS ═══ */}
      {tab === 'donations' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Donations" value="$1,205" change="+22%" trend="up" />
            <KPICard label="Donors" value="6" />
            <KPICard label="Avg Amount" value="$34.17" />
            <KPICard label="Recurring %" value="33%" />
          </KPIBand>

          {/* Donation form */}
          <SectionCard title="Quick Donate" icon={<Gift className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="flex items-end gap-3">
              <div className="flex gap-1.5">
                {['10', '25', '50', '100'].map(a => (
                  <button key={a} onClick={() => setDonationAmount(a)} className={cn('px-3 py-1.5 rounded-xl text-[9px] font-medium border transition-colors', donationAmount === a ? 'bg-accent text-accent-foreground border-accent' : 'hover:bg-muted/30')}>${a}</button>
                ))}
              </div>
              <div className="flex-1"><input value={donationAmount} onChange={e => setDonationAmount(e.target.value)} className="h-8 w-full rounded-xl border bg-background px-3 text-[10px]" placeholder="Custom amount" /></div>
              <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.success(`Donation of $${donationAmount} initiated`)}><Heart className="h-3 w-3" />Donate</Button>
            </div>
          </SectionCard>

          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30"><tr className="text-[8px] text-muted-foreground font-medium"><th className="text-left px-3 py-2">Donor → Creator</th><th className="text-center px-3 py-2">Type</th><th className="text-center px-3 py-2">Status</th><th className="text-center px-3 py-2">Method</th><th className="text-right px-3 py-2">Amount</th><th className="text-right px-3 py-2">Date</th><th className="text-center px-3 py-2">Action</th></tr></thead>
              <tbody>
                {DONATIONS.filter(d => !search || d.donor.toLowerCase().includes(search.toLowerCase()) || d.creator.toLowerCase().includes(search.toLowerCase())).map(d => (
                  <tr key={d.id} className="border-t text-[8px] hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedDonation(d)}>
                    <td className="px-3 py-2"><div className="font-medium">{d.donor}</div><div className="text-[7px] text-muted-foreground">→ {d.creator} · {d.id}</div></td>
                    <td className="px-3 py-2 text-center"><Badge variant="secondary" className="text-[6px] capitalize">{d.type}</Badge></td>
                    <td className="px-3 py-2 text-center"><StatusBadge status={STATUS_MAP[d.status]} label={d.status} /></td>
                    <td className="px-3 py-2 text-center text-[7px] text-muted-foreground">{d.method}</td>
                    <td className="px-3 py-2 text-right font-semibold">{d.amount}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{d.date}</td>
                    <td className="px-3 py-2 text-center"><Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg"><Eye className="h-2.5 w-2.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ CHECKOUT / PURCHASES ═══ */}
      {tab === 'checkout' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Purchase Revenue" value="$877" />
            <KPICard label="Orders" value="4" />
            <KPICard label="Avg Order" value="$219.25" />
            <KPICard label="Refund Rate" value="25%" change="-5%" trend="down" />
          </KPIBand>

          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30"><tr className="text-[8px] text-muted-foreground font-medium"><th className="text-left px-3 py-2">Buyer</th><th className="text-left px-3 py-2">Item</th><th className="text-center px-3 py-2">Type</th><th className="text-center px-3 py-2">Status</th><th className="text-right px-3 py-2">Amount</th><th className="text-right px-3 py-2">Date</th></tr></thead>
              <tbody>
                {PURCHASES.map(p => (
                  <tr key={p.id} className="border-t text-[8px] hover:bg-muted/20 transition-colors cursor-pointer">
                    <td className="px-3 py-2"><div className="font-medium">{p.buyer}</div><div className="text-[7px] text-muted-foreground">{p.id}</div></td>
                    <td className="px-3 py-2">{p.item}</td>
                    <td className="px-3 py-2 text-center"><Badge variant="secondary" className="text-[6px] capitalize">{p.type}</Badge></td>
                    <td className="px-3 py-2 text-center"><StatusBadge status={STATUS_MAP[p.status]} label={p.status} /></td>
                    <td className="px-3 py-2 text-right font-semibold">{p.amount}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Checkout simulation */}
          <SectionCard title="Quick Checkout" icon={<ShoppingCart className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl"
            action={<Button size="sm" className="h-6 text-[8px] rounded-xl gap-1" onClick={() => toast.success('Checkout initiated')}><CreditCard className="h-3 w-3" />Pay Now</Button>}>
            <div className="grid grid-cols-3 gap-2">
              {[{ item: 'Pro Template', price: '$149' }, { item: 'Consulting Hour', price: '$200' }, { item: 'Starter Bundle', price: '$29' }].map(p => (
                <div key={p.item} className="rounded-2xl border p-3 text-center hover:shadow-sm transition-all cursor-pointer hover:border-accent/30">
                  <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-accent" />
                  <div className="text-[9px] font-semibold">{p.item}</div>
                  <div className="text-sm font-bold mt-0.5">{p.price}</div>
                  <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg mt-1.5 w-full">Add to Cart</Button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ PATRON HISTORY ═══ */}
      {tab === 'patrons' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Patrons" value="3" />
            <KPICard label="Monthly MRR" value="$85" />
            <KPICard label="Lifetime Value" value="$1,670" />
            <KPICard label="Avg Streak" value="9.7 mo" />
          </KPIBand>

          <div className="space-y-2">
            {PATRONS.map(p => (
              <div key={p.id} className="rounded-2xl border p-3 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-[9px] font-bold text-accent">{p.avatar}</div>
                    <div><div className="text-[10px] font-semibold">{p.name}</div><div className="text-[7px] text-muted-foreground">{p.id} · {p.tier} · Since {p.since}</div></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={STATUS_MAP[p.status]} label={p.status} />
                    {p.streak > 0 && <Badge variant="secondary" className="text-[7px] gap-0.5">🔥 {p.streak}mo</Badge>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[8px]">
                  <div><span className="text-muted-foreground">Monthly</span><div className="font-semibold">{p.monthlyAmount}</div></div>
                  <div><span className="text-muted-foreground">Total Given</span><div className="font-semibold">{p.totalGiven}</div></div>
                  <div><span className="text-muted-foreground">Tier</span><div className="font-semibold">{p.tier}</div></div>
                </div>
                <div className="flex gap-1.5 mt-2">
                  <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg"><Eye className="h-2.5 w-2.5 mr-0.5" />Profile</Button>
                  {p.status === 'paused' && <Button size="sm" className="h-5 text-[7px] rounded-lg">Resume</Button>}
                  {p.status === 'active' && <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg">Message</Button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ CREATOR SUMMARY ═══ */}
      {tab === 'creator' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Earnings" value="$3,860" change="+15%" trend="up" />
            <KPICard label="Patrons" value="5" />
            <KPICard label="Products Sold" value="12" />
            <KPICard label="Avg Rating" value="4.8★" />
          </KPIBand>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SectionCard title="Earnings Breakdown" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-2">
                {[{ l: 'Patronage', v: '$2,198', pct: 57 }, { l: 'Product Sales', v: '$877', pct: 23 }, { l: 'Tips & Donations', v: '$785', pct: 20 }].map(r => (
                  <div key={r.l}>
                    <div className="flex justify-between text-[8px] mb-0.5"><span>{r.l}</span><span className="font-semibold">{r.v} ({r.pct}%)</span></div>
                    <Progress value={r.pct} className="h-1.5" />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Payout Status" icon={<DollarSign className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-1.5">
                {[
                  { l: 'Available Balance', v: '$2,140', s: 'healthy' as const },
                  { l: 'Pending Clearance', v: '$420', s: 'caution' as const },
                  { l: 'On Hold', v: '$100', s: 'blocked' as const },
                  { l: 'Next Payout', v: 'Apr 15', s: 'healthy' as const },
                ].map(p => (
                  <div key={p.l} className="flex items-center justify-between p-1.5 rounded-lg border text-[8px]">
                    <span>{p.l}</span><StatusBadge status={p.s} label={p.v} />
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl w-full mt-2 gap-1" onClick={() => toast.info('Payout requested')}>
                <DollarSign className="h-3 w-3" />Request Payout
              </Button>
            </SectionCard>
          </div>

          <SectionCard title="7-Day Revenue Trend" className="!rounded-2xl">
            <div className="h-20 flex items-end gap-1">
              {[320, 480, 410, 550, 620, 580, 680].map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full rounded-t bg-accent/50 hover:bg-accent/80 transition-colors" style={{ height: `${(v / 700) * 100}%` }} />
                  <span className="text-[6px] text-muted-foreground">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ RECURRING SETUP ═══ */}
      {tab === 'recurring' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Recurring" value={String(RECURRING.filter(r => r.status === 'active').length)} />
            <KPICard label="Monthly Commitment" value="$85" />
            <KPICard label="Past Due" value="1" />
            <KPICard label="Next Charge" value="Apr 15" />
          </KPIBand>

          <SectionCard title="Recurring Subscriptions" icon={<Repeat className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl"
            action={<Button size="sm" className="h-6 text-[8px] rounded-xl gap-1" onClick={() => toast.info('New recurring setup')}><Plus className="h-3 w-3" />New</Button>}>
            <div className="space-y-2">
              {RECURRING.map(r => (
                <div key={r.id} className="rounded-2xl border p-3 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center"><Repeat className="h-4 w-4 text-accent" /></div>
                      <div><div className="text-[10px] font-semibold">{r.creator}</div><div className="text-[7px] text-muted-foreground">{r.tier} · {r.id}</div></div>
                    </div>
                    <StatusBadge status={STATUS_MAP[r.status]} label={r.status} />
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[8px]">
                    <div><span className="text-muted-foreground">Amount</span><div className="font-semibold">{r.amount}</div></div>
                    <div><span className="text-muted-foreground">Next Charge</span><div className="font-semibold">{r.nextCharge}</div></div>
                    <div><span className="text-muted-foreground">Method</span><div className="font-semibold">{r.method}</div></div>
                    <div><span className="text-muted-foreground">Frequency</span><div className="font-semibold capitalize">{r.frequency}</div></div>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {r.status === 'active' && <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg">Pause</Button>}
                    {r.status === 'past_due' && <Button size="sm" className="h-5 text-[7px] rounded-lg bg-destructive text-destructive-foreground">Retry Payment</Button>}
                    <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg">Update Method</Button>
                    <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg text-destructive">Cancel</Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ RECEIPTS ═══ */}
      {tab === 'receipts' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Receipts" value="10" />
            <KPICard label="This Month" value="6" />
            <KPICard label="Total Amount" value="$4,280" />
            <KPICard label="Downloadable" value="8" />
          </KPIBand>

          <SectionCard title="Receipt History" icon={<Receipt className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl"
            action={<Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg gap-1"><Download className="h-2.5 w-2.5" />Export All</Button>}>
            <div className="space-y-1.5">
              {[...DONATIONS, ...PURCHASES].filter(t => (t as any).status === 'completed').map((t: any) => (
                <div key={t.id} className="flex items-center gap-2 p-2 rounded-xl border hover:bg-muted/20 transition-colors text-[8px]">
                  <Receipt className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{t.donor || t.buyer} — {t.item || t.creator}</div>
                    <div className="text-[7px] text-muted-foreground">{t.id} · {t.date}</div>
                  </div>
                  <span className="font-semibold shrink-0">{t.amount}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" />
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 rounded-lg" onClick={() => toast.info('Downloading receipt')}><Download className="h-2.5 w-2.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ MOBILE DONOR ═══ */}
      {tab === 'mobile' && (
        <div className="space-y-3">
          <div className="rounded-3xl bg-gradient-to-br from-accent/10 to-primary/10 border p-4">
            <div className="flex items-center gap-2 mb-2"><Heart className="h-5 w-5 text-accent" /><div><div className="text-sm font-bold">Support a Creator</div><div className="text-[8px] text-muted-foreground">One-tap donations & patronage</div></div></div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {[{ l: 'Given', v: '$1,205' }, { l: 'Patrons', v: '3 active' }, { l: 'Recurring', v: '$85/mo' }, { l: 'Receipts', v: '8' }].map(m => (
                <div key={m.l} className="rounded-2xl bg-card border p-2 text-center"><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-sm font-bold">{m.v}</div></div>
              ))}
            </div>
          </div>

          <SectionCard title="Quick Donate" className="!rounded-2xl">
            <div className="space-y-2">
              {['DevStudio Pro', 'DesignLab', 'TechTalks'].map(c => (
                <div key={c} className="flex items-center gap-2 p-2 rounded-xl border hover:bg-muted/20 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-[9px] font-bold text-accent">{c[0]}</div>
                  <div className="flex-1"><div className="text-[9px] font-medium">{c}</div><div className="text-[7px] text-muted-foreground">Creator</div></div>
                  <Button size="sm" className="h-7 text-[8px] rounded-xl gap-1"><Heart className="h-3 w-3" />$25</Button>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex gap-2">
            <Button className="flex-1 h-10 text-[10px] rounded-xl gap-1"><Heart className="h-3.5 w-3.5" />Donate Now</Button>
            <Button variant="outline" className="flex-1 h-10 text-[10px] rounded-xl gap-1"><Receipt className="h-3.5 w-3.5" />Receipts</Button>
          </div>
        </div>
      )}

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        <div className="flex-1"><span className="text-[10px] font-semibold">$4,280 this month</span><div className="text-[8px] text-muted-foreground">3 active patrons · 6 donations</div></div>
        <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-4"><Heart className="h-3.5 w-3.5" />Donate</Button>
      </div>

      <DonationDrawer item={selectedDonation} open={!!selectedDonation} onClose={() => setSelectedDonation(null)} />
    </DashboardLayout>
  );
};

export default CommercePatronagePage;
