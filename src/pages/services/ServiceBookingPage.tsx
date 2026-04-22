import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CalendarCheck, Clock, Shield, CreditCard, CheckCircle, ChevronRight, ArrowRight } from 'lucide-react';

const STEPS = ['Select Package', 'Schedule', 'Requirements', 'Payment', 'Confirm'];

export default function ServiceBookingPage() {
  const [step, setStep] = useState(0);

  return (
    <DashboardLayout topStrip={<><CalendarCheck className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Book Service</span><div className="flex-1" /><Badge variant="outline" className="text-[9px] rounded-lg">Step {step + 1} of {STEPS.length}</Badge></>}>
      <div className="flex items-center gap-1 mb-4">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <button onClick={() => setStep(i)} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[8px] font-medium transition-colors ${i <= step ? 'text-accent' : 'text-muted-foreground/50'}`}>
              {i < step ? <CheckCircle className="h-3 w-3" /> : <span className="h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center text-[6px] font-bold">{i + 1}</span>}
              {s}
            </button>
            {i < STEPS.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/30" />}
          </React.Fragment>
        ))}
      </div>

      {step === 0 && (
        <SectionCard title="Choose a Package" className="!rounded-2xl">
          <div className="grid grid-cols-3 gap-3">
            {[{ name: 'Starter', price: '$500', delivery: '5 days' }, { name: 'Professional', price: '$1,200', delivery: '7 days', popular: true }, { name: 'Enterprise', price: '$3,000', delivery: '14 days' }].map(p => (
              <div key={p.name} className={`rounded-2xl border p-3.5 cursor-pointer hover:shadow-sm transition-all ${p.popular ? 'border-accent ring-1 ring-accent/20' : ''}`} onClick={() => setStep(1)}>
                {p.popular && <Badge className="text-[7px] bg-accent/10 text-accent border-0 rounded-lg mb-1">Popular</Badge>}
                <div className="text-[10px] font-bold">{p.name}</div>
                <div className="text-[16px] font-black text-accent">{p.price}</div>
                <div className="text-[8px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{p.delivery}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {step === 1 && (
        <SectionCard title="Select Date & Time" className="!rounded-2xl">
          <div className="grid grid-cols-5 gap-2 mb-3">
            {['Apr 18', 'Apr 19', 'Apr 21', 'Apr 22', 'Apr 23'].map(d => (
              <div key={d} className="rounded-xl border p-2.5 text-center cursor-pointer hover:border-accent transition-colors">
                <div className="text-[10px] font-bold">{d}</div>
                <div className="text-[8px] text-muted-foreground">3 slots</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-3">
            {['9:00 AM', '11:00 AM', '2:00 PM'].map(t => <Badge key={t} variant="outline" className="text-[9px] cursor-pointer hover:bg-accent/10 rounded-lg py-1 px-3">{t}</Badge>)}
          </div>
          <Button onClick={() => setStep(2)} className="h-8 text-[10px] rounded-xl gap-1">Continue <ChevronRight className="h-3 w-3" /></Button>
        </SectionCard>
      )}

      {step === 2 && (
        <SectionCard title="Project Requirements" className="!rounded-2xl">
          <div className="space-y-2.5">
            <div><div className="text-[9px] font-medium mb-0.5">Project brief</div><textarea className="w-full h-20 rounded-xl border px-3 py-2 text-[10px] resize-none" placeholder="Describe your project needs..." /></div>
            <div><div className="text-[9px] font-medium mb-0.5">Reference files</div><div className="h-16 rounded-xl border-2 border-dashed flex items-center justify-center text-[9px] text-muted-foreground">Drag & drop or click to upload</div></div>
            <Button onClick={() => setStep(3)} className="h-8 text-[10px] rounded-xl gap-1">Continue <ChevronRight className="h-3 w-3" /></Button>
          </div>
        </SectionCard>
      )}

      {step === 3 && (
        <SectionCard title="Payment" className="!rounded-2xl">
          <div className="space-y-2.5 mb-3">
            <div className="flex justify-between text-[10px]"><span>Professional Package</span><span className="font-bold">$1,200</span></div>
            <div className="flex justify-between text-[10px]"><span>Rush delivery add-on</span><span className="font-bold">$200</span></div>
            <div className="border-t pt-2 flex justify-between text-[11px] font-bold"><span>Total</span><span className="text-accent">$1,400</span></div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/30 mb-3">
            <Shield className="h-4 w-4 text-[hsl(var(--state-healthy))]" />
            <div className="text-[8px]"><span className="font-semibold">Escrow Protected</span> — funds held securely until delivery is approved</div>
          </div>
          <Button onClick={() => setStep(4)} className="h-8 text-[10px] rounded-xl gap-1 w-full"><CreditCard className="h-3.5 w-3.5" />Pay $1,400</Button>
        </SectionCard>
      )}

      {step === 4 && (
        <SectionCard className="!rounded-2xl text-center py-8">
          <CheckCircle className="h-12 w-12 text-[hsl(var(--state-healthy))] mx-auto mb-3" />
          <div className="text-[16px] font-black mb-1">Booking Confirmed!</div>
          <div className="text-[10px] text-muted-foreground mb-4">Your service has been booked. The provider will be in touch shortly.</div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" className="h-8 text-[10px] rounded-xl">View Order</Button>
            <Button className="h-8 text-[10px] rounded-xl">Message Provider</Button>
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
