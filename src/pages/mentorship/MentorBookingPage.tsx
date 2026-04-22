import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Calendar, Clock, Video, CreditCard, CheckCircle, ChevronRight, Users } from 'lucide-react';

const SLOTS = [
  { date: 'Mon, Apr 20', times: ['2:00 PM', '3:00 PM', '4:00 PM'] },
  { date: 'Wed, Apr 22', times: ['10:00 AM', '11:00 AM', '12:00 PM'] },
  { date: 'Fri, Apr 24', times: ['3:00 PM', '4:00 PM', '5:00 PM'] },
];

const PACKAGES = [
  { id: '30min', label: '30 min Intro', price: 'Free', description: 'Quick career chat or Q&A session' },
  { id: '60min', label: '60 min Deep Dive', price: '$40', description: 'Portfolio review, interview prep, or career planning' },
  { id: '4pack', label: '4-Session Pack', price: '$120', description: 'Structured mentorship over 4 weeks (save $40)' },
];

export default function MentorBookingPage() {
  const [selectedPackage, setSelectedPackage] = useState('60min');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  return (
    <DashboardLayout topStrip={<><Calendar className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Book a Mentor Session</span><div className="flex-1" /><Badge variant="outline" className="text-[9px] rounded-lg">with Sarah Chen</Badge></>}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Step 1: Package */}
        <SectionCard title="1. Choose Package" className="!rounded-2xl">
          <div className="space-y-2">
            {PACKAGES.map(p => (
              <button key={p.id} onClick={() => setSelectedPackage(p.id)} className={cn('w-full text-left rounded-xl border p-3 transition-colors', selectedPackage === p.id ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/30')}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-bold">{p.label}</span>
                  <span className="text-[10px] font-bold text-accent">{p.price}</span>
                </div>
                <p className="text-[8px] text-muted-foreground">{p.description}</p>
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Step 2: Time */}
        <SectionCard title="2. Select Time" className="!rounded-2xl">
          <div className="space-y-3">
            {SLOTS.map(day => (
              <div key={day.date}>
                <div className="text-[9px] font-bold mb-1.5 flex items-center gap-1"><Calendar className="h-3 w-3 text-muted-foreground" />{day.date}</div>
                <div className="flex flex-wrap gap-1.5">
                  {day.times.map(t => {
                    const key = `${day.date}-${t}`;
                    return (
                      <button key={key} onClick={() => setSelectedSlot(key)} className={cn('px-2.5 py-1 rounded-lg text-[8px] font-medium border transition-colors', selectedSlot === key ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:border-accent/30')}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Step 3: Confirm */}
        <SectionCard title="3. Confirm & Pay" className="!rounded-2xl">
          <div className="space-y-3">
            <div className="rounded-xl bg-muted/30 p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 rounded-lg"><AvatarFallback className="rounded-lg bg-accent/10 text-accent text-[9px] font-bold">SC</AvatarFallback></Avatar>
                <div><div className="text-[10px] font-bold">Sarah Chen</div><div className="text-[8px] text-muted-foreground">Senior Product Manager</div></div>
              </div>
              <div className="border-t border-border/30 pt-1.5 space-y-1 text-[8px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span className="font-semibold">{PACKAGES.find(p => p.id === selectedPackage)?.label}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-semibold">{selectedSlot ? selectedSlot.replace('-', ' at ') : 'Not selected'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Format</span><span className="font-semibold flex items-center gap-0.5"><Video className="h-2.5 w-2.5" />Video Call</span></div>
              </div>
              <div className="border-t border-border/30 pt-1.5 flex justify-between text-[10px]">
                <span className="font-bold">Total</span>
                <span className="font-bold text-accent">{PACKAGES.find(p => p.id === selectedPackage)?.price}</span>
              </div>
            </div>
            <Button className="w-full h-8 text-[10px] rounded-xl gap-1" disabled={!selectedSlot}>
              {selectedPackage === '30min' ? <><CheckCircle className="h-3 w-3" />Confirm Booking</> : <><CreditCard className="h-3 w-3" />Pay & Book</>}
            </Button>
            <p className="text-[7px] text-muted-foreground text-center">Free cancellation up to 24h before the session</p>
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
