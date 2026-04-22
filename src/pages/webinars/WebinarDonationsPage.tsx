import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Heart, DollarSign, Users, TrendingUp, Gift, Clock, CheckCircle } from 'lucide-react';

const DONATIONS = [
  { donor: 'Anonymous', amount: '$50.00', time: '5m ago', message: 'Great content!' },
  { donor: 'Sarah C.', amount: '$25.00', time: '12m ago', message: 'Keep it up 🔥' },
  { donor: 'Marcus J.', amount: '$100.00', time: '30m ago', message: 'This saved our team hours' },
  { donor: 'Priya P.', amount: '$10.00', time: '1h ago', message: '' },
  { donor: 'Tom W.', amount: '$75.00', time: '2h ago', message: 'Excellent deep dive' },
];

const TIERS = [
  { name: 'Supporter', amount: '$5', perks: ['Name in credits'], color: 'bg-muted' },
  { name: 'Patron', amount: '$25', perks: ['Name in credits', 'Early access to replays'], color: 'bg-accent/10' },
  { name: 'Champion', amount: '$100', perks: ['All Patron perks', '1:1 Q&A time', 'Exclusive resources'], color: 'bg-[hsl(var(--gigvora-amber)/0.1)]' },
];

export default function WebinarDonationsPage() {
  const topStrip = (
    <>
      <Heart className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Webinar Donations</span>
      <div className="flex-1" />
      <Badge variant="outline" className="text-[9px] rounded-lg gap-1"><DollarSign className="h-3 w-3" />$260.00 raised</Badge>
    </>
  );

  return (
    <DashboardLayout topStrip={topStrip}>
      <KPIBand className="mb-3">
        <KPICard label="Total Raised" value="$260" className="!rounded-2xl" />
        <KPICard label="Donors" value="5" className="!rounded-2xl" />
        <KPICard label="Avg Donation" value="$52" className="!rounded-2xl" />
        <KPICard label="Goal Progress" value="52%" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <SectionCard title="Donation Tiers" icon={<Gift className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2">
            {TIERS.map(t => (
              <div key={t.name} className={cn('rounded-2xl border p-3', t.color)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold">{t.name}</span>
                  <span className="text-[13px] font-bold">{t.amount}</span>
                </div>
                <div className="flex flex-wrap gap-1">{t.perks.map(p => <Badge key={p} variant="outline" className="text-[7px] h-3.5 rounded-md">{p}</Badge>)}</div>
                <Button size="sm" className="w-full h-7 text-[9px] rounded-xl mt-2">Donate {t.amount}</Button>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Recent Donations" icon={<Heart className="h-3.5 w-3.5 text-destructive" />} className="!rounded-2xl">
          <div className="space-y-2">
            {DONATIONS.map((d, i) => (
              <div key={i} className="flex items-start gap-2 text-[9px] p-2 rounded-xl bg-muted/30">
                <Heart className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{d.donor}</span>
                    <span className="font-bold text-[hsl(var(--state-healthy))]">{d.amount}</span>
                  </div>
                  {d.message && <div className="text-muted-foreground mt-0.5">"{d.message}"</div>}
                  <div className="text-[8px] text-muted-foreground mt-0.5 flex items-center gap-0.5"><Clock className="h-2 w-2" />{d.time}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
