import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CreditCard, DollarSign, Heart, Download, Clock, CheckCircle, Gift, TrendingUp } from 'lucide-react';

const TRANSACTIONS = [
  { mentor: 'Sarah Chen', type: 'Session', description: '60 min Deep Dive — Portfolio Review', amount: '$40.00', date: 'Apr 18, 2026', status: 'completed' as const },
  { mentor: 'Sarah Chen', type: 'Package', description: '4-Session Pack', amount: '$120.00', date: 'Apr 12, 2026', status: 'completed' as const },
  { mentor: 'James Wilson', type: 'Session', description: '60 min — System Design', amount: '$40.00', date: 'Apr 14, 2026', status: 'completed' as const },
  { mentor: 'Priya Sharma', type: 'Donation', description: 'Thank you tip', amount: '$15.00', date: 'Apr 10, 2026', status: 'completed' as const },
  { mentor: 'Sarah Chen', type: 'Session', description: '30 min Intro', amount: 'Free', date: 'Apr 5, 2026', status: 'completed' as const },
  { mentor: 'Marcus Johnson', type: 'Session', description: '60 min — ML Fundamentals', amount: '$40.00', date: 'Apr 22, 2026', status: 'pending' as const },
];

const PAYMENT_METHODS = [
  { type: 'Visa', last4: '4242', expiry: '12/27', default: true },
  { type: 'PayPal', last4: 'alex@email.com', expiry: '', default: false },
];

export default function MentorPaymentsPage() {
  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Payment Methods" className="!rounded-2xl">
        <div className="space-y-2">
          {PAYMENT_METHODS.map((pm, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border p-2">
              <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-bold">{pm.type} {pm.last4.includes('@') ? '' : `····${pm.last4}`}</div>
                {pm.expiry && <div className="text-[7px] text-muted-foreground">Expires {pm.expiry}</div>}
              </div>
              {pm.default && <Badge className="text-[6px] bg-accent/10 text-accent border-0 rounded-md">Default</Badge>}
            </div>
          ))}
          <Button variant="outline" className="w-full h-7 text-[9px] rounded-xl">Add Method</Button>
        </div>
      </SectionCard>
      <SectionCard title="Send a Donation" className="!rounded-2xl">
        <p className="text-[8px] text-muted-foreground mb-2">Show appreciation to mentors who've helped you grow.</p>
        <div className="flex gap-1 mb-2">
          {['$5', '$10', '$25', '$50'].map(amt => (
            <Button key={amt} variant="outline" size="sm" className="h-7 flex-1 text-[9px] rounded-xl">{amt}</Button>
          ))}
        </div>
        <Button className="w-full h-7 text-[9px] rounded-xl gap-1"><Heart className="h-3 w-3" />Send Tip</Button>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={<><DollarSign className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Mentor Payments & Donations</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button></>} rightRail={rightRail} rightRailWidth="w-52">
      <KPIBand className="mb-3">
        <KPICard label="Total Spent" value="$255" className="!rounded-2xl" />
        <KPICard label="Sessions Paid" value="5" className="!rounded-2xl" />
        <KPICard label="Donations Sent" value="$15" className="!rounded-2xl" />
        <KPICard label="Credits Balance" value="2 sessions" className="!rounded-2xl" />
      </KPIBand>

      <SectionCard title="Transaction History" className="!rounded-2xl">
        <div className="space-y-1.5">
          <div className="grid grid-cols-6 gap-2 text-[8px] font-medium text-muted-foreground border-b pb-1">
            <span>Mentor</span><span>Type</span><span className="col-span-2">Description</span><span>Amount</span><span>Status</span>
          </div>
          {TRANSACTIONS.map((t, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 text-[9px] py-2 border-b border-border/20 last:border-0 items-center">
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5 rounded-md"><AvatarFallback className="rounded-md bg-accent/10 text-accent text-[6px] font-bold">{t.mentor.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                <span className="font-medium truncate">{t.mentor.split(' ')[0]}</span>
              </div>
              <Badge variant="outline" className="text-[6px] rounded-md w-fit">{t.type === 'Donation' ? <><Heart className="h-2 w-2 mr-0.5" />{t.type}</> : t.type}</Badge>
              <span className="col-span-2 text-muted-foreground truncate">{t.description}</span>
              <span className="font-bold">{t.amount}</span>
              <StatusBadge status={t.status === 'completed' ? 'healthy' : 'pending'} label={t.status} />
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
