import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CalendarDays, Clock, ChevronRight, ArrowRight, CheckCircle2, Video, MapPin, DollarSign } from 'lucide-react';

const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
const SERVICES = [
  { name: '1-Hour Strategy Session', price: 150, duration: '60 min' },
  { name: '30-Min Quick Consult', price: 75, duration: '30 min' },
  { name: 'Portfolio Review', price: 100, duration: '45 min' },
];

export default function ChatBookingPage() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState('');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-2 w-full">
          <span className="text-[10px] text-muted-foreground">Chat with Sarah Chen</span>
          <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
          <CalendarDays className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold">Book a Session</span>
          <div className="flex-1" />
          <div className="flex gap-1">{[1, 2, 3].map(s => <div key={s} className={`h-1.5 w-8 rounded-full ${s <= step ? 'bg-accent' : 'bg-muted'}`} />)}</div>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Booking With">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-8 w-8"><AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">SC</AvatarFallback></Avatar>
              <div><div className="text-[9px] font-bold">Sarah Chen</div><div className="text-[7px] text-muted-foreground">Senior Designer</div></div>
            </div>
            <div className="space-y-1 text-[8px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Timezone</span><span>PST (UTC-8)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Response</span><span>~2h avg</span></div>
            </div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-44"
    >
      {step === 1 && (
        <SectionCard title="Select Service" className="!rounded-2xl">
          <div className="space-y-2 mb-3">
            {SERVICES.map((s, i) => (
              <button key={i} onClick={() => setSelectedService(i)} className={`w-full p-3 rounded-xl border text-left transition-all ${selectedService === i ? 'border-accent bg-accent/5' : 'border-border/40 hover:border-accent/20'}`}>
                <div className="flex items-center justify-between mb-0.5"><span className="text-[10px] font-bold">{s.name}</span><span className="text-[10px] font-bold text-accent">${s.price}</span></div>
                <div className="flex items-center gap-2 text-[8px] text-muted-foreground"><Clock className="h-2.5 w-2.5" />{s.duration}<Video className="h-2.5 w-2.5 ml-1" />Video Call</div>
              </button>
            ))}
          </div>
          <Button onClick={() => setStep(2)} className="h-7 text-[9px] rounded-xl gap-1">Choose Time <ArrowRight className="h-3 w-3" /></Button>
        </SectionCard>
      )}

      {step === 2 && (
        <SectionCard title="Select Date & Time" className="!rounded-2xl">
          <div className="mb-3">
            <label className="text-[9px] font-medium mb-1 block">Date</label>
            <div className="flex gap-1.5">
              {['Apr 16', 'Apr 17', 'Apr 18', 'Apr 21', 'Apr 22'].map(d => (
                <button key={d} className="px-3 py-2 rounded-xl border border-border/40 text-[9px] hover:border-accent/30 transition-all">{d}</button>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <label className="text-[9px] font-medium mb-1 block">Available Slots</label>
            <div className="grid grid-cols-4 gap-1.5">
              {TIME_SLOTS.map(t => (
                <button key={t} onClick={() => setSelectedSlot(t)} className={`px-2 py-1.5 rounded-lg text-[9px] transition-all ${selectedSlot === t ? 'bg-accent text-white' : 'bg-muted/30 hover:bg-muted/50'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="mb-3"><label className="text-[9px] font-medium mb-1 block">Note (optional)</label><Textarea placeholder="What would you like to discuss?" className="min-h-[60px] text-xs" /></div>
          <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setStep(1)} className="h-7 text-[9px] rounded-xl">Back</Button><Button size="sm" onClick={() => setStep(3)} disabled={!selectedSlot} className="h-7 text-[9px] rounded-xl gap-1">Confirm <ArrowRight className="h-3 w-3" /></Button></div>
        </SectionCard>
      )}

      {step === 3 && (
        <SectionCard className="!rounded-2xl text-center py-8">
          <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center mx-auto mb-3"><CheckCircle2 className="h-6 w-6 text-[hsl(var(--state-healthy))]" /></div>
          <h2 className="text-sm font-bold mb-1">Session Booked!</h2>
          <p className="text-[9px] text-muted-foreground mb-3">{SERVICES[selectedService].name} with Sarah Chen</p>
          <div className="inline-flex flex-col gap-1 text-[9px] text-muted-foreground mb-4">
            <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />Apr 16, 2026 at {selectedSlot || '10:00 AM'}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{SERVICES[selectedService].duration}</span>
            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${SERVICES[selectedService].price}</span>
          </div>
          <div className="flex justify-center gap-2"><Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl">Add to Calendar</Button><Button size="sm" className="h-7 text-[9px] rounded-xl">Back to Chat</Button></div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
