import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CreditCard, Shield, Lock, ArrowRight, CheckCircle, Tag } from 'lucide-react';

export default function WebinarCheckoutPage() {
  const [step, setStep] = useState<'select' | 'payment' | 'confirmed'>('select');

  const topStrip = (
    <>
      <CreditCard className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Webinar Checkout</span>
      <div className="flex-1" />
      <Badge variant="outline" className="text-[9px] gap-1 rounded-lg"><Lock className="h-3 w-3" />Secure Checkout</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Order Summary" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="font-semibold text-[10px]">Scaling React at Enterprise</div>
          <div className="flex justify-between"><span className="text-muted-foreground">Ticket</span><span className="font-semibold">Professional</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="font-semibold">$49.00</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="font-semibold text-[hsl(var(--state-healthy))]">-$10.00</span></div>
          <div className="border-t pt-1.5 flex justify-between font-bold"><span>Total</span><span>$39.00</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Guarantee" className="!rounded-2xl">
        <div className="text-[9px] text-muted-foreground space-y-1">
          <p className="flex items-center gap-1"><Shield className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" />30-day money-back guarantee</p>
          <p className="flex items-center gap-1"><Lock className="h-2.5 w-2.5" />SSL encrypted payment</p>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      {step === 'select' && (
        <SectionCard title="Select Ticket" className="!rounded-2xl">
          <div className="space-y-2.5">
            {[
              { name: 'Free', price: '$0', perks: ['Live stream only', 'No replay'] },
              { name: 'Professional', price: '$49', perks: ['Live stream + Q&A', '30-day replay', 'Slide deck', 'Certificate'] },
              { name: 'Team (5 seats)', price: '$199', perks: ['All Professional perks', '5 team seats', 'Private breakout room'] },
            ].map((t, i) => (
              <button key={t.name} className={cn('w-full rounded-2xl border p-3.5 text-left transition-all hover:shadow-sm', i === 1 ? 'border-accent bg-accent/5' : '')}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold">{t.name}</span>
                  <span className="text-[13px] font-bold">{t.price}</span>
                </div>
                <div className="flex flex-wrap gap-1">{t.perks.map(p => <Badge key={p} variant="outline" className="text-[7px] h-4 rounded-lg">{p}</Badge>)}</div>
              </button>
            ))}
            <div className="flex items-center gap-2 mt-2">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <input placeholder="Promo code" className="flex-1 h-8 rounded-xl border px-3 text-xs" />
              <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl">Apply</Button>
            </div>
            <Button onClick={() => setStep('payment')} className="w-full h-8 text-[10px] rounded-xl gap-1">Proceed to Payment <ArrowRight className="h-3 w-3" /></Button>
          </div>
        </SectionCard>
      )}

      {step === 'payment' && (
        <SectionCard title="Payment Details" icon={<CreditCard className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-3">
            {[{ label: 'Card Number', placeholder: '4242 4242 4242 4242' }, { label: 'Expiry', placeholder: 'MM/YY' }, { label: 'CVC', placeholder: '123' }].map(f => (
              <div key={f.label}>
                <div className="text-[9px] font-medium mb-1">{f.label}</div>
                <input placeholder={f.placeholder} className="w-full h-9 rounded-xl border px-3 text-xs" />
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('select')} className="flex-1 h-8 text-[10px] rounded-xl">Back</Button>
              <Button onClick={() => setStep('confirmed')} className="flex-1 h-8 text-[10px] rounded-xl gap-1"><Lock className="h-3 w-3" />Pay $39.00</Button>
            </div>
          </div>
        </SectionCard>
      )}

      {step === 'confirmed' && (
        <SectionCard className="!rounded-2xl">
          <div className="text-center py-6">
            <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-7 w-7 text-[hsl(var(--state-healthy))]" />
            </div>
            <div className="text-[14px] font-bold mb-1">Payment Confirmed!</div>
            <div className="text-[10px] text-muted-foreground mb-1">Order #WBN-2026-0042</div>
            <div className="text-[10px] text-muted-foreground mb-4">Receipt sent to john@company.com</div>
            <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl">Go to Webinar</Button>
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
