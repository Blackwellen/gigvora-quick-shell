import React from 'react';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  CreditCard, DollarSign, Download, Plus, AlertTriangle,
  CheckCircle2, Clock, FileText, Shield, Zap, ChevronRight,
  Settings, RefreshCw, Receipt,
} from 'lucide-react';

const INVOICES = [
  { id: 'INV-3201', desc: 'Pro Subscription', amount: '$29.00', date: 'Apr 1', status: 'paid' as const },
  { id: 'INV-3198', desc: 'Brand Strategy Workshop', amount: '$450.00', date: 'Apr 12', status: 'paid' as const },
  { id: 'INV-3195', desc: 'Logo Package', amount: '$180.00', date: 'Apr 10', status: 'paid' as const },
  { id: 'INV-3180', desc: 'Pro Subscription', amount: '$29.00', date: 'Mar 1', status: 'paid' as const },
  { id: 'INV-3165', desc: 'SEO Content Pack', amount: '$890.00', date: 'Mar 28', status: 'paid' as const },
];

const PAYMENT_METHODS = [
  { type: 'Visa', last4: '4242', expiry: '08/27', default: true },
  { type: 'PayPal', last4: 'user@email.com', expiry: '', default: false },
];

const DashboardBillingPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><CreditCard className="h-5 w-5 text-accent" /> Billing</h1>
        <p className="text-[11px] text-muted-foreground">Payment methods, invoices, and subscription management</p>
      </div>

      <KPIBand>
        <KPICard label="Current Plan" value="Pro" />
        <KPICard label="This Month" value="$659" change="+$450 services" />
        <KPICard label="Next Billing" value="May 1" />
        <KPICard label="Credits" value="1,850" change="of 3,000" />
      </KPIBand>

      {/* Subscription */}
      <SectionCard title="Subscription" icon={<Zap className="h-3.5 w-3.5 text-accent" />} action={<Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Settings className="h-2.5 w-2.5" />Manage</Button>} className="!rounded-2xl">
        <div className="flex items-center gap-3 py-2">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center"><Zap className="h-5 w-5 text-accent" /></div>
          <div className="flex-1">
            <div className="text-[11px] font-bold">Pro Plan</div>
            <div className="text-[9px] text-muted-foreground">$29/month · Renews May 1, 2026</div>
          </div>
          <StatusBadge status="healthy" label="Active" />
        </div>
        <div className="mt-2">
          <div className="flex justify-between text-[9px] mb-1"><span>Credits: 1,150 / 3,000 used</span><span className="font-bold">38%</span></div>
          <Progress value={38} className="h-2 rounded-full" />
        </div>
      </SectionCard>

      {/* Payment Methods */}
      <SectionCard title="Payment Methods" icon={<CreditCard className="h-3.5 w-3.5 text-muted-foreground" />} action={<Button size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Plus className="h-2.5 w-2.5" />Add</Button>} className="!rounded-2xl">
        <div className="space-y-2">
          {PAYMENT_METHODS.map((pm, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
              <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center"><CreditCard className="h-4 w-4 text-muted-foreground" /></div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold">{pm.type} {pm.last4.startsWith('u') ? '' : `····${pm.last4}`}</div>
                {pm.expiry && <div className="text-[8px] text-muted-foreground">Expires {pm.expiry}</div>}
                {pm.last4.startsWith('u') && <div className="text-[8px] text-muted-foreground">{pm.last4}</div>}
              </div>
              {pm.default && <Badge className="text-[7px] bg-accent/10 text-accent border-0 rounded-lg">Default</Badge>}
              <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg">Edit</Button>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Invoices */}
      <SectionCard title="Recent Invoices" icon={<Receipt className="h-3.5 w-3.5 text-muted-foreground" />} action={<Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Download className="h-2.5 w-2.5" />Export All</Button>} className="!rounded-2xl">
        <div className="space-y-1.5">
          {INVOICES.map(inv => (
            <div key={inv.id} className="flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0 hover:bg-muted/20 rounded-lg px-1 cursor-pointer group">
              <div className="h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center"><FileText className="h-3.5 w-3.5 text-muted-foreground" /></div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold">{inv.desc}</div>
                <div className="text-[8px] text-muted-foreground">#{inv.id} · {inv.date}</div>
              </div>
              <div className="text-[10px] font-bold">{inv.amount}</div>
              <StatusBadge status="healthy" label="Paid" />
              <Download className="h-3 w-3 text-muted-foreground/30 group-hover:text-accent transition-colors" />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Payment warning */}
      <div className="rounded-2xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-4 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-[hsl(var(--state-caution))] shrink-0 mt-0.5" />
        <div>
          <div className="text-[11px] font-bold">Payment method expiring soon</div>
          <div className="text-[9px] text-muted-foreground mt-0.5">Your Visa ending in 4242 expires in August 2027. Update your payment method to avoid service interruption.</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardBillingPage;
