import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Heart, DollarSign, CreditCard, CheckCircle2, Star, Gift, ArrowRight,
  Shield, Lock, MessageSquare, Repeat, Calendar, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AMOUNTS = [5, 10, 25, 50, 100];

const RECENT_SUPPORTERS = [
  { name: 'Alex M.', amount: '$25', date: '2 hours ago', message: 'Thanks for the amazing content!' },
  { name: 'Jordan K.', amount: '$10', date: '5 hours ago', message: 'Learned so much from your podcast' },
  { name: 'Taylor R.', amount: '$50', date: '1 day ago', message: 'Keep up the great work!' },
];

export default function DonationFlowPage() {
  const [amount, setAmount] = useState<number | null>(25);
  const [customAmount, setCustomAmount] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'amount' | 'payment' | 'success'>('amount');

  const finalAmount = customAmount ? Number(customAmount) : amount;

  return (
    <DashboardLayout topStrip={
      <>
        <Heart className="h-4 w-4 text-destructive" />
        <span className="text-xs font-semibold">Support & Donate</span>
        <div className="flex-1" />
        <Badge variant="outline" className="text-[9px] rounded-lg gap-1"><Shield className="h-3 w-3" /> Secure</Badge>
      </>
    }>
      <div className="max-w-2xl mx-auto">
        {step === 'amount' && (
          <>
            {/* Creator Card */}
            <SectionCard className="mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 rounded-2xl">
                  <AvatarFallback className="rounded-2xl bg-accent/10 text-accent text-lg font-bold">SC</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-[13px] font-bold">Sarah Chen</div>
                  <div className="text-[10px] text-muted-foreground">Senior Product Manager · Mentor · Content Creator</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[7px] h-3.5 gap-0.5"><Star className="h-2 w-2 fill-[hsl(var(--gigvora-amber))] text-[hsl(var(--gigvora-amber))]" /> 4.9</Badge>
                    <Badge variant="outline" className="text-[7px] h-3.5"><Users className="h-2 w-2" /> 2.4K supporters</Badge>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Amount Selection */}
            <SectionCard title="Choose Amount">
              <div className="grid grid-cols-5 gap-2 mb-3">
                {AMOUNTS.map(a => (
                  <button key={a} onClick={() => { setAmount(a); setCustomAmount(''); }} className={cn(
                    'py-3 rounded-xl text-center text-sm font-bold border transition-all',
                    amount === a && !customAmount ? 'border-accent bg-accent/10 text-accent ring-1 ring-accent/20' : 'border-border/30 hover:border-accent/30'
                  )}>
                    ${a}
                  </button>
                ))}
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Custom amount" value={customAmount} onChange={e => { setCustomAmount(e.target.value); setAmount(null); }} className="pl-8 h-10 text-sm" />
              </div>

              {/* Recurring Toggle */}
              <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-muted/20">
                <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                <div className="flex-1">
                  <div className="text-[10px] font-semibold flex items-center gap-1"><Repeat className="h-3 w-3" /> Make this monthly</div>
                  <div className="text-[8px] text-muted-foreground">Support consistently. Cancel anytime.</div>
                </div>
                {isRecurring && <Badge className="text-[7px] bg-accent/10 text-accent border-0">Monthly</Badge>}
              </div>

              {/* Message */}
              <div className="mt-3">
                <label className="text-[9px] font-semibold text-muted-foreground">Add a message (optional)</label>
                <Textarea placeholder="Say something nice..." value={message} onChange={e => setMessage(e.target.value)} className="min-h-[60px] text-xs mt-1" />
              </div>

              <Button onClick={() => setStep('payment')} disabled={!finalAmount || finalAmount <= 0} className="w-full h-10 rounded-xl gap-1 mt-4">
                <Heart className="h-4 w-4" /> Continue — ${finalAmount || 0}{isRecurring ? '/mo' : ''}
              </Button>
            </SectionCard>

            {/* Recent Supporters */}
            <SectionCard title="Recent Supporters" className="mt-3">
              <div className="space-y-2">
                {RECENT_SUPPORTERS.map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/10">
                    <Avatar className="h-7 w-7 rounded-lg"><AvatarFallback className="rounded-lg bg-accent/10 text-accent text-[8px] font-bold">{s.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold">{s.name}</span>
                        <span className="text-[10px] font-bold text-accent">{s.amount}</span>
                        <span className="text-[8px] text-muted-foreground ml-auto">{s.date}</span>
                      </div>
                      {s.message && <p className="text-[9px] text-muted-foreground mt-0.5">{s.message}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {step === 'payment' && (
          <SectionCard title="Payment Details" icon={<CreditCard className="h-3.5 w-3.5 text-accent" />}>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-accent/5 border border-accent/10 flex items-center justify-between">
                <span className="text-[10px]"><Heart className="h-3 w-3 inline mr-1 text-destructive" /> Donation to Sarah Chen</span>
                <span className="text-sm font-bold text-accent">${finalAmount}{isRecurring ? '/mo' : ''}</span>
              </div>
              {[{ label: 'Card Number', placeholder: '4242 4242 4242 4242' }, { label: 'Expiry', placeholder: 'MM/YY' }, { label: 'CVC', placeholder: '123' }].map(f => (
                <div key={f.label}>
                  <label className="text-[9px] font-semibold text-muted-foreground">{f.label}</label>
                  <Input placeholder={f.placeholder} className="h-9 text-xs mt-1" />
                </div>
              ))}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('amount')} className="flex-1 h-9 text-[10px] rounded-xl">Back</Button>
                <Button onClick={() => setStep('success')} className="flex-1 h-9 text-[10px] rounded-xl gap-1"><Lock className="h-3 w-3" /> Donate ${finalAmount}</Button>
              </div>
              <p className="text-[8px] text-muted-foreground text-center flex items-center gap-1 justify-center"><Shield className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" /> SSL encrypted · Secure payment processing</p>
            </div>
          </SectionCard>
        )}

        {step === 'success' && (
          <SectionCard>
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-2xl bg-[hsl(var(--state-healthy))]/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-destructive fill-destructive" />
              </div>
              <h3 className="text-[16px] font-bold mb-1">Thank You! 🎉</h3>
              <p className="text-[11px] text-muted-foreground mb-1">Your ${finalAmount} donation to Sarah Chen has been processed</p>
              {isRecurring && <Badge className="text-[8px] bg-accent/10 text-accent border-0 mb-2"><Repeat className="h-2.5 w-2.5 mr-0.5" /> Monthly recurring</Badge>}
              {message && (
                <div className="inline-block rounded-xl bg-muted/20 p-3 mt-2 mb-4 max-w-xs text-left">
                  <p className="text-[9px] text-muted-foreground flex items-start gap-1"><MessageSquare className="h-3 w-3 shrink-0 mt-0.5" /> "{message}"</p>
                </div>
              )}
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl">View Receipt</Button>
                <Link to="/calendar/bookings"><Button size="sm" className="h-8 text-[10px] rounded-xl">My Bookings</Button></Link>
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </DashboardLayout>
  );
}
