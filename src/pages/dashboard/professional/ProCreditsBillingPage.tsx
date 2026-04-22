import React from 'react';
import { KPIBand, KPICard, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CreditCard, DollarSign, Zap, Download, Plus, Settings,
  AlertTriangle, FileText, Receipt, Wallet,
} from 'lucide-react';

const INVOICES = [
  { id: 'INV-P3201', desc: 'Pro Subscription', amount: '$49.00', date: 'Apr 1', status: 'paid' as const },
  { id: 'INV-P3198', desc: 'AI Credits Top-up (500)', amount: '$25.00', date: 'Apr 8', status: 'paid' as const },
  { id: 'INV-P3195', desc: 'Promoted Listing — Logo Design', amount: '$15.00', date: 'Apr 5', status: 'paid' as const },
  { id: 'INV-P3180', desc: 'Pro Subscription', amount: '$49.00', date: 'Mar 1', status: 'paid' as const },
];

export default function ProCreditsBillingPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><CreditCard className="h-5 w-5 text-accent" /> Credits & Billing</h1>
        <p className="text-[11px] text-muted-foreground">Subscription, credits, and payment management</p>
      </div>

      <KPIBand>
        <KPICard label="Plan" value="Pro" />
        <KPICard label="Credits" value="142" change="of 500" />
        <KPICard label="This Month" value="$89" />
        <KPICard label="Next Billing" value="May 1" />
      </KPIBand>

      {/* Subscription */}
      <SectionCard title="Subscription" icon={<Zap className="h-3.5 w-3.5 text-accent" />} action={<Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Settings className="h-2.5 w-2.5" />Manage</Button>} className="!rounded-2xl">
        <div className="flex items-center gap-3 py-2">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center"><Zap className="h-5 w-5 text-accent" /></div>
          <div className="flex-1">
            <div className="text-[11px] font-bold">Professional Pro Plan</div>
            <div className="text-[9px] text-muted-foreground">$49/month · Renews May 1, 2026 · Includes 500 AI credits</div>
          </div>
          <StatusBadge status="healthy" label="Active" />
        </div>
      </SectionCard>

      {/* Credits */}
      <SectionCard title="Credits Balance" icon={<Wallet className="h-3.5 w-3.5 text-muted-foreground" />} action={<Button size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Plus className="h-2.5 w-2.5" />Top Up</Button>} className="!rounded-2xl">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[9px] mb-1"><span>358 / 500 used</span><span className="font-bold">142 remaining</span></div>
            <Progress value={72} className="h-2 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-muted/30 p-2.5 text-center"><div className="text-[8px] text-muted-foreground">AI Chat</div><div className="text-[10px] font-bold">120</div></div>
            <div className="rounded-xl bg-muted/30 p-2.5 text-center"><div className="text-[8px] text-muted-foreground">AI Writer</div><div className="text-[10px] font-bold">85</div></div>
            <div className="rounded-xl bg-muted/30 p-2.5 text-center"><div className="text-[8px] text-muted-foreground">Image Gen</div><div className="text-[10px] font-bold">153</div></div>
          </div>
        </div>
      </SectionCard>

      {/* Payment Methods */}
      <SectionCard title="Payment Methods" icon={<CreditCard className="h-3.5 w-3.5 text-muted-foreground" />} action={<Button size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Plus className="h-2.5 w-2.5" />Add</Button>} className="!rounded-2xl">
        <div className="space-y-2">
          {[
            { type: 'Visa', last4: '4242', expiry: '08/27', isDefault: true },
            { type: 'PayPal', last4: 'pro@email.com', expiry: '', isDefault: false },
          ].map((pm, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
              <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center"><CreditCard className="h-4 w-4 text-muted-foreground" /></div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold">{pm.type} {!pm.last4.includes('@') && `····${pm.last4}`}</div>
                {pm.expiry && <div className="text-[8px] text-muted-foreground">Expires {pm.expiry}</div>}
                {pm.last4.includes('@') && <div className="text-[8px] text-muted-foreground">{pm.last4}</div>}
              </div>
              {pm.isDefault && <Badge className="text-[7px] bg-accent/10 text-accent border-0 rounded-lg">Default</Badge>}
              <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg">Edit</Button>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Invoices */}
      <SectionCard title="Recent Invoices" icon={<Receipt className="h-3.5 w-3.5 text-muted-foreground" />} action={<Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Download className="h-2.5 w-2.5" />Export</Button>} className="!rounded-2xl">
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
    </div>
  );
}
