import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Plus, Clock, DollarSign, Send, Eye, Archive } from 'lucide-react';

const OFFERS = [
  { id: 'CO-101', buyer: 'James R.', title: 'Custom Brand Package', amount: '$350', status: 'sent' as const, expires: 'Apr 20, 2026', created: 'Apr 12, 2026' },
  { id: 'CO-102', buyer: 'Lisa P.', title: 'Extended Logo Variants', amount: '$150', status: 'accepted' as const, expires: 'Apr 18, 2026', created: 'Apr 10, 2026' },
  { id: 'CO-103', buyer: 'David C.', title: 'Rush Delivery Add-on', amount: '$75', status: 'expired' as const, expires: 'Apr 8, 2026', created: 'Apr 5, 2026' },
];

const statusMap = { sent: 'caution', accepted: 'healthy', expired: 'blocked', declined: 'blocked', draft: 'pending' } as const;

export default function CustomOffersPage() {
  const [tab, setTab] = useState('all');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Gift className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Custom Offers</h1>
          <KPICard label="Sent" value="1" />
          <KPICard label="Accepted" value="1" />
          <KPICard label="Conversion" value="50%" />
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SectionCard title="Offers" action={<Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" /> New Offer</Button>}>
            {OFFERS.map(o => (
              <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className="text-[8px] h-3.5 font-mono">{o.id}</Badge>
                    <span className="text-[11px] font-semibold">{o.title}</span>
                    <StatusBadge status={statusMap[o.status]} label={o.status} />
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                    <span>To: {o.buyer}</span>
                    <span><DollarSign className="h-2.5 w-2.5 inline" /> {o.amount}</span>
                    <span><Clock className="h-2.5 w-2.5 inline" /> Expires: {o.expires}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-6 text-[9px]"><Eye className="h-2.5 w-2.5" /></Button>
              </div>
            ))}
          </SectionCard>
        </div>
        <div>
          <SectionCard title="Create Offer">
            <div className="space-y-3">
              <div><label className="text-[10px] font-medium block mb-1">Buyer</label><Input placeholder="Search buyer..." className="h-8 text-xs" /></div>
              <div><label className="text-[10px] font-medium block mb-1">Title</label><Input placeholder="Offer title..." className="h-8 text-xs" /></div>
              <div><label className="text-[10px] font-medium block mb-1">Description</label><Textarea placeholder="Describe what's included..." className="min-h-[80px] text-xs" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] font-medium block mb-1">Amount</label><Input placeholder="$0.00" className="h-8 text-xs" /></div>
                <div><label className="text-[10px] font-medium block mb-1">Delivery</label><Input placeholder="days" className="h-8 text-xs" /></div>
              </div>
              <div><label className="text-[10px] font-medium block mb-1">Expires in</label><Input defaultValue="7 days" className="h-8 text-xs" /></div>
              <Button className="w-full h-8 text-[10px] gap-1"><Send className="h-3 w-3" /> Send Offer</Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
