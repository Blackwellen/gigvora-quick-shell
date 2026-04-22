import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Heart, DollarSign, Gift, Clock } from 'lucide-react';

const DONATIONS = [
  { show: 'AI Frontiers', amount: '$5.00', date: 'Apr 10, 2026', recurring: true, message: 'Love the deep dives!' },
  { show: 'Code Review Radio', amount: '$10.00', date: 'Mar 22, 2026', recurring: false, message: '' },
  { show: 'The Freelance Hour', amount: '$15.00', date: 'Mar 15, 2026', recurring: true, message: 'Keep it up!' },
];

const TIERS = [
  { name: 'Supporter', amount: '$5', perks: ['Name in credits'] },
  { name: 'Patron', amount: '$25', perks: ['Name in credits', 'Bonus content', 'Early access'] },
  { name: 'Champion', amount: '$100', perks: ['All Patron perks', '1:1 Q&A', 'Exclusive episodes'] },
];

export default function PodcastDonationsPage() {
  return (
    <DashboardLayout topStrip={<><Heart className="h-4 w-4 text-destructive" /><span className="text-xs font-semibold">Podcast Donations</span><div className="flex-1" /><Badge variant="outline" className="text-[9px] rounded-lg gap-1"><DollarSign className="h-3 w-3" />$30.00 total</Badge></>}>
      <KPIBand className="mb-3">
        <KPICard label="Total Given" value="$30" className="!rounded-2xl" />
        <KPICard label="Shows Supported" value="3" className="!rounded-2xl" />
        <KPICard label="Recurring" value={String(DONATIONS.filter(d => d.recurring).length)} className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <SectionCard title="Donation Tiers" icon={<Gift className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2">
            {TIERS.map(t => (
              <div key={t.name} className="rounded-2xl border p-3">
                <div className="flex items-center justify-between mb-1"><span className="text-[11px] font-bold">{t.name}</span><span className="text-[13px] font-bold">{t.amount}</span></div>
                <div className="flex flex-wrap gap-1">{t.perks.map(p => <Badge key={p} variant="outline" className="text-[7px] h-3.5 rounded-md">{p}</Badge>)}</div>
                <Button size="sm" className="w-full h-7 text-[9px] rounded-xl mt-2">Donate {t.amount}</Button>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Your Donations" icon={<Heart className="h-3.5 w-3.5 text-destructive" />} className="!rounded-2xl">
          <div className="space-y-2">
            {DONATIONS.map((d, i) => (
              <div key={i} className="flex items-start gap-2 text-[9px] p-2 rounded-xl bg-muted/30">
                <Heart className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between"><span className="font-semibold">{d.show}</span><span className="font-bold text-[hsl(var(--state-healthy))]">{d.amount}</span></div>
                  {d.message && <div className="text-muted-foreground mt-0.5">"{d.message}"</div>}
                  <div className="text-[8px] text-muted-foreground mt-0.5 flex items-center gap-1"><Clock className="h-2 w-2" />{d.date}{d.recurring && <Badge variant="secondary" className="text-[7px] h-3.5 ml-1">Monthly</Badge>}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
