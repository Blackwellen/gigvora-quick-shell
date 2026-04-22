import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Calendar, Clock, Video, CreditCard, CheckCircle2, ChevronLeft, ChevronRight,
  Users, Star, MapPin, Phone, ArrowRight, Shield, Tag, Globe, FileText, Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'type', label: 'Session Type' },
  { id: 'slot', label: 'Date & Time' },
  { id: 'details', label: 'Your Details' },
  { id: 'payment', label: 'Payment' },
  { id: 'confirm', label: 'Confirmation' },
];

const SESSION_TYPES = [
  { id: 'intro', label: '30 min Intro', price: 'Free', desc: 'Quick career chat or Q&A', icon: '💬' },
  { id: 'deep', label: '60 min Deep Dive', price: '$40', desc: 'Portfolio review, interview prep, or career planning', icon: '🎯' },
  { id: 'pack', label: '4-Session Pack', price: '$120', desc: 'Structured mentorship over 4 weeks (save $40)', icon: '📦' },
  { id: 'consult', label: '90 min Consultation', price: '$80', desc: 'In-depth strategy or technical consultation', icon: '🧠' },
];

const AVAILABLE_DAYS = [
  { date: 'Mon, Apr 20', slots: ['9:00 AM', '10:00 AM', '2:00 PM', '3:00 PM'] },
  { date: 'Tue, Apr 21', slots: ['9:00 AM', '11:00 AM', '2:00 PM'] },
  { date: 'Wed, Apr 22', slots: ['10:00 AM', '11:00 AM', '3:00 PM', '4:00 PM'] },
  { date: 'Thu, Apr 23', slots: ['9:00 AM', '2:00 PM', '4:00 PM'] },
  { date: 'Fri, Apr 24', slots: ['10:00 AM', '11:00 AM', '3:00 PM'] },
];

export default function BookingWizardPage() {
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState('deep');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');

  const currentType = SESSION_TYPES.find(t => t.id === selectedType);

  return (
    <DashboardLayout topStrip={
      <>
        <Calendar className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Book a Session</span>
        <div className="flex-1" />
        <Badge variant="outline" className="text-[9px] rounded-lg gap-1"><Users className="h-3 w-3" /> with Sarah Chen</Badge>
      </>
    }>
      {/* Stepper */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            {i > 0 && <div className={cn('h-px w-6 shrink-0', i <= step ? 'bg-accent' : 'bg-border')} />}
            <button onClick={() => i <= step && setStep(i)} className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-xl text-[9px] font-medium whitespace-nowrap transition-all shrink-0',
              i === step ? 'bg-accent/10 text-accent ring-1 ring-accent/30' :
              i < step ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' :
              'text-muted-foreground'
            )}>
              {i < step ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-current flex items-center justify-center text-[7px]">{i + 1}</span>}
              {s.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          {/* Step 1: Session Type */}
          {step === 0 && (
            <SectionCard title="Choose Session Type">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SESSION_TYPES.map(t => (
                  <button key={t.id} onClick={() => setSelectedType(t.id)} className={cn(
                    'text-left rounded-2xl border p-4 transition-all hover:shadow-sm',
                    selectedType === t.id ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : 'border-border/30 hover:border-accent/30'
                  )}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-lg">{t.icon}</span>
                      <span className="text-[12px] font-bold text-accent">{t.price}</span>
                    </div>
                    <div className="text-[11px] font-bold mb-0.5">{t.label}</div>
                    <p className="text-[9px] text-muted-foreground">{t.desc}</p>
                  </button>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Step 2: Date & Time */}
          {step === 1 && (
            <SectionCard title="Select Date & Time" icon={<Clock className="h-3.5 w-3.5 text-accent" />}>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[9px] text-muted-foreground mb-2">
                  <Globe className="h-3 w-3" /> Showing times in Eastern Time (EST)
                </div>
                {AVAILABLE_DAYS.map(day => (
                  <div key={day.date}>
                    <div className="text-[10px] font-bold mb-2 flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-muted-foreground" />{day.date}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {day.slots.map(slot => {
                        const key = `${day.date}-${slot}`;
                        return (
                          <button key={key} onClick={() => setSelectedSlot(key)} className={cn(
                            'px-3 py-2 rounded-xl text-[9px] font-medium border transition-all',
                            selectedSlot === key ? 'border-accent bg-accent/10 text-accent ring-1 ring-accent/20' : 'border-border/30 text-muted-foreground hover:border-accent/30'
                          )}>
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Step 3: Details */}
          {step === 2 && (
            <SectionCard title="Your Details" icon={<FileText className="h-3.5 w-3.5 text-accent" />}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-semibold text-muted-foreground">Full Name</label>
                    <Input placeholder="Your name" className="h-8 text-xs mt-1" />
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-muted-foreground">Email</label>
                    <Input placeholder="you@example.com" className="h-8 text-xs mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-muted-foreground">What would you like to discuss?</label>
                  <Textarea placeholder="Share context so the mentor can prepare..." className="min-h-[100px] text-xs mt-1" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-muted-foreground">Attach Files (optional)</label>
                  <div className="mt-1 p-4 rounded-xl border-2 border-dashed border-border/40 text-center hover:border-accent/30 transition-all cursor-pointer">
                    <p className="text-[9px] text-muted-foreground">Drop files here or click to browse · PDF, DOC, images</p>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Step 4: Payment */}
          {step === 3 && (
            <SectionCard title="Payment" icon={<CreditCard className="h-3.5 w-3.5 text-accent" />}>
              {currentType?.price === 'Free' ? (
                <div className="p-6 rounded-xl bg-[hsl(var(--state-healthy))]/5 text-center">
                  <CheckCircle2 className="h-8 w-8 text-[hsl(var(--state-healthy))] mx-auto mb-2" />
                  <p className="text-xs font-bold">No payment required</p>
                  <p className="text-[9px] text-muted-foreground mt-1">This is a free introductory session</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[{ label: 'Card Number', placeholder: '4242 4242 4242 4242' }, { label: 'Expiry', placeholder: 'MM/YY' }, { label: 'CVC', placeholder: '123' }].map(f => (
                    <div key={f.label}>
                      <label className="text-[9px] font-semibold text-muted-foreground">{f.label}</label>
                      <Input placeholder={f.placeholder} className="h-8 text-xs mt-1" />
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <Input placeholder="Promo code" value={promoCode} onChange={e => setPromoCode(e.target.value)} className="h-7 text-[10px] flex-1" />
                    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl">Apply</Button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground">
                    <Shield className="h-3 w-3 text-[hsl(var(--state-healthy))]" /> SSL encrypted · 30-day refund guarantee
                  </div>
                </div>
              )}
            </SectionCard>
          )}

          {/* Step 5: Confirmation */}
          {step === 4 && (
            <SectionCard>
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-2xl bg-[hsl(var(--state-healthy))]/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-[hsl(var(--state-healthy))]" />
                </div>
                <h3 className="text-[16px] font-bold mb-1">Booking Confirmed!</h3>
                <p className="text-[11px] text-muted-foreground mb-1">Your session has been booked successfully</p>
                <p className="text-[10px] text-muted-foreground mb-4">Confirmation sent to your email</p>
                <div className="inline-block rounded-xl bg-muted/30 p-4 text-left mb-4">
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex justify-between gap-8"><span className="text-muted-foreground">Session</span><span className="font-semibold">{currentType?.label}</span></div>
                    <div className="flex justify-between gap-8"><span className="text-muted-foreground">With</span><span className="font-semibold">Sarah Chen</span></div>
                    <div className="flex justify-between gap-8"><span className="text-muted-foreground">Date</span><span className="font-semibold">{selectedSlot?.split('-')[0] || 'TBD'}</span></div>
                    <div className="flex justify-between gap-8"><span className="text-muted-foreground">Time</span><span className="font-semibold">{selectedSlot?.split('-')[1] || 'TBD'}</span></div>
                    <div className="flex justify-between gap-8"><span className="text-muted-foreground">Format</span><span className="font-semibold flex items-center gap-0.5"><Video className="h-2.5 w-2.5" /> Video Call</span></div>
                  </div>
                </div>
                <div className="flex gap-2 justify-center">
                  <Link to="/calendar"><Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl gap-1"><Calendar className="h-3 w-3" /> View Calendar</Button></Link>
                  <Link to="/calendar/bookings"><Button size="sm" className="h-8 text-[10px] rounded-xl gap-1">My Bookings</Button></Link>
                </div>
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right Rail — Summary */}
        <div>
          <SectionCard title="Booking Summary">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-10 w-10 rounded-xl"><AvatarFallback className="rounded-xl bg-accent/10 text-accent text-[10px] font-bold">SC</AvatarFallback></Avatar>
                <div>
                  <div className="text-[11px] font-bold">Sarah Chen</div>
                  <div className="text-[8px] text-muted-foreground">Senior Product Manager</div>
                  <div className="flex items-center gap-1 text-[8px] text-[hsl(var(--gigvora-amber))]"><Star className="h-2.5 w-2.5 fill-current" /> 4.9 (128 reviews)</div>
                </div>
              </div>
              <div className="border-t border-border/30 pt-2.5 space-y-1.5 text-[9px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Session</span><span className="font-semibold">{currentType?.label || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-semibold">{currentType?.id === 'pack' ? '4×60 min' : currentType?.id === 'consult' ? '90 min' : currentType?.id === 'intro' ? '30 min' : '60 min'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-semibold">{selectedSlot ? selectedSlot.split('-')[0] : 'Not selected'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-semibold">{selectedSlot ? selectedSlot.split('-')[1] : 'Not selected'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Format</span><span className="font-semibold flex items-center gap-0.5"><Video className="h-2.5 w-2.5" /> Video</span></div>
              </div>
              <div className="border-t border-border/30 pt-2.5 flex justify-between text-[11px]">
                <span className="font-bold">Total</span>
                <span className="font-bold text-accent">{currentType?.price}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Cancellation Policy" className="mt-3">
            <p className="text-[9px] text-muted-foreground">Free cancellation up to 24 hours before the session. Late cancellations may be charged at 50% of the session price.</p>
          </SectionCard>
        </div>
      </div>

      {/* Bottom Nav */}
      {step < 4 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <Button variant="outline" size="sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="gap-1 text-[10px] rounded-xl">
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </Button>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-1 w-20" />
          <Button size="sm" onClick={() => setStep(step + 1)} disabled={step === 1 && !selectedSlot} className="gap-1 text-[10px] rounded-xl">
            {step === 3 ? (currentType?.price === 'Free' ? 'Confirm' : 'Pay & Book') : 'Next'} <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}
