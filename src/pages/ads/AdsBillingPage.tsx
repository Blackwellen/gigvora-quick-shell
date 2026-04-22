import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  CreditCard, DollarSign, FileText, Download, AlertTriangle,
  CheckCircle2, Clock, Settings, ChevronRight, TrendingUp,
} from 'lucide-react';

const INVOICES = [
  { id: 'INV-2024-003', period: 'March 2026', amount: '$4,560', status: 'paid', dueDate: 'Apr 1', paidDate: 'Mar 28' },
  { id: 'INV-2024-002', period: 'February 2026', amount: '$3,890', status: 'paid', dueDate: 'Mar 1', paidDate: 'Feb 27' },
  { id: 'INV-2024-001', period: 'January 2026', amount: '$2,940', status: 'paid', dueDate: 'Feb 1', paidDate: 'Jan 30' },
];

const PAYMENT_METHODS = [
  { type: 'Visa', last4: '4242', expiry: '08/27', default: true },
  { type: 'Mastercard', last4: '5555', expiry: '12/26', default: false },
];

const AdsBillingPage: React.FC = () => {
  const topStrip = (
    <>
      <CreditCard className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Ads — Billing & Spend Center</span>
      <div className="flex-1" />
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Settings className="h-3 w-3" />Settings</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Payment Methods" className="!rounded-2xl">
        <div className="space-y-1.5">
          {PAYMENT_METHODS.map(p => (
            <div key={p.last4} className="flex items-center gap-2 p-2 rounded-xl border text-[9px]">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">{p.type} ···· {p.last4}</div>
                <div className="text-[8px] text-muted-foreground">Exp {p.expiry}</div>
              </div>
              {p.default && <Badge className="bg-accent/10 text-accent text-[6px] border-0">Default</Badge>}
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full h-6 text-[8px] rounded-lg">Add Payment Method</Button>
        </div>
      </SectionCard>
      <SectionCard title="Billing Threshold" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Threshold</span><span className="font-semibold">$5,000</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Current Accrued</span><span className="font-semibold">$2,340</span></div>
          <Progress value={47} className="h-1 mt-1" />
          <div className="text-[8px] text-muted-foreground">Auto-charge at threshold or month-end</div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52">
      <KPIBand className="mb-3">
        <KPICard label="Current Balance" value="$2,340" change="Accrued" className="!rounded-2xl" />
        <KPICard label="MTD Spend" value="$18,460" className="!rounded-2xl" />
        <KPICard label="Last Invoice" value="$4,560" change="Paid" className="!rounded-2xl" />
        <KPICard label="Total Lifetime" value="$29,850" className="!rounded-2xl" />
      </KPIBand>

      <Tabs defaultValue="invoices">
        <TabsList className="mb-3 h-auto gap-0.5">
          <TabsTrigger value="invoices" className="text-[10px] h-7 px-2.5 rounded-xl"><FileText className="h-3 w-3 mr-1" />Invoices</TabsTrigger>
          <TabsTrigger value="spend" className="text-[10px] h-7 px-2.5 rounded-xl"><TrendingUp className="h-3 w-3 mr-1" />Spend History</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-[9px]">
              <thead className="bg-muted/50"><tr>
                {['Invoice', 'Period', 'Amount', 'Status', 'Due Date', 'Paid Date', ''].map(h => <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground">{h}</th>)}
              </tr></thead>
              <tbody>
                {INVOICES.map(inv => (
                  <tr key={inv.id} className="border-t hover:bg-muted/20">
                    <td className="px-3 py-2.5 font-medium">{inv.id}</td>
                    <td className="px-3 py-2.5">{inv.period}</td>
                    <td className="px-3 py-2.5 font-bold">{inv.amount}</td>
                    <td className="px-3 py-2.5"><Badge className="bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] text-[7px] border-0">{inv.status}</Badge></td>
                    <td className="px-3 py-2.5 text-muted-foreground">{inv.dueDate}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{inv.paidDate}</td>
                    <td className="px-3 py-2.5"><Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg"><Download className="h-2.5 w-2.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="spend">
          <SectionCard title="Monthly Spend Trend" className="!rounded-2xl">
            <div className="space-y-2">
              {[
                { month: 'April 2026', spent: '$18,460', pct: 100 },
                { month: 'March 2026', spent: '$4,560', pct: 25 },
                { month: 'February 2026', spent: '$3,890', pct: 21 },
                { month: 'January 2026', spent: '$2,940', pct: 16 },
              ].map(m => (
                <div key={m.month}>
                  <div className="flex justify-between text-[9px] mb-0.5"><span className="text-muted-foreground">{m.month}</span><span className="font-bold">{m.spent}</span></div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${m.pct}%` }} /></div>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AdsBillingPage;
