import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, ArrowRight, CheckCircle2, CreditCard,
  Clock, Package, Lock, Loader2, Calendar, MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

const STEPS = ['Review', 'Details', 'Payment', 'Confirmed'];

export default function ServiceCheckoutPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const total = 1200;

  const handlePay = () => { setProcessing(true); setTimeout(() => { setProcessing(false); setStep(3); }, 1500); };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 ${i <= step ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${i < step ? 'bg-primary text-primary-foreground border-primary' : i === step ? 'border-primary' : 'border-muted-foreground/30'}`}>
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className="text-[10px] font-medium hidden sm:inline">{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-primary' : 'bg-border'}`} />}
          </React.Fragment>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4"><Link to={`/services/${serviceId || 'demo'}`}><ArrowLeft className="h-4 w-4 text-muted-foreground" /></Link><h1 className="text-lg font-bold">Review Service Order</h1></div>
          <SectionCard title="Service Details" className="!rounded-2xl">
            <div className="flex justify-between mb-3">
              <div><Badge variant="secondary" className="text-[9px] mb-1">Professional</Badge><div className="text-sm font-bold">Brand Identity Design</div><div className="text-[10px] text-muted-foreground">by DesignCraft Studio · ★ 4.9</div></div>
              <div className="text-right"><div className="text-lg font-bold">${total}</div><div className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />7 day delivery</div></div>
            </div>
            <div className="space-y-1">{['Logo + brand guide', '4 concepts', '3 revisions', 'Source files', 'Social kit'].map(f => <div key={f} className="text-[10px] flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-primary" />{f}</div>)}</div>
          </SectionCard>
          <Button onClick={() => setStep(1)} className="w-full h-11 rounded-xl font-semibold gap-1">Continue <ArrowRight className="h-4 w-4" /></Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4"><button onClick={() => setStep(0)}><ArrowLeft className="h-4 w-4 text-muted-foreground" /></button><h1 className="text-lg font-bold">Your Details</h1></div>
          <SectionCard title="Contact Information" className="!rounded-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs font-medium mb-1.5 block">Full Name</label><Input className="h-10 rounded-xl" placeholder="Your name" /></div>
              <div><label className="text-xs font-medium mb-1.5 block">Email</label><Input className="h-10 rounded-xl" placeholder="you@example.com" /></div>
            </div>
          </SectionCard>
          <SectionCard title="Project Brief" className="!rounded-2xl">
            <textarea className="w-full min-h-[100px] rounded-xl border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y" placeholder="Describe what you need..." />
          </SectionCard>
          <SectionCard title="Preferred Schedule" className="!rounded-2xl">
            <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /><Input type="date" className="h-10 rounded-xl flex-1" /><span className="text-[10px] text-muted-foreground">Optional preferred start date</span></div>
          </SectionCard>
          <Button onClick={() => setStep(2)} className="w-full h-11 rounded-xl font-semibold gap-1">Continue to Payment <ArrowRight className="h-4 w-4" /></Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4"><button onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4 text-muted-foreground" /></button><h1 className="text-lg font-bold">Payment</h1></div>
          <SectionCard title="Payment Method" icon={<CreditCard className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <div className="space-y-3">
              <div><label className="text-xs font-medium mb-1.5 block">Card Number</label><Input placeholder="1234 5678 9012 3456" className="h-10 rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium mb-1.5 block">Expiry</label><Input placeholder="MM/YY" className="h-10 rounded-xl" /></div>
                <div><label className="text-xs font-medium mb-1.5 block">CVC</label><Input placeholder="123" className="h-10 rounded-xl" /></div>
              </div>
            </div>
          </SectionCard>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><Lock className="h-3.5 w-3.5" /><span>256-bit SSL encrypted payment</span></div>
          <Button onClick={handlePay} disabled={processing} className="w-full h-11 rounded-xl font-semibold">
            {processing ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : <>Pay ${total}</>}
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="text-center py-12">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="h-8 w-8 text-primary" /></div>
          <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
          <p className="text-sm text-muted-foreground mb-6">Your service order has been confirmed. The provider will reach out shortly.</p>
          <div className="bg-muted/30 rounded-2xl p-4 max-w-sm mx-auto mb-6 text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-mono font-bold">#SVC-2026-8734</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold">${total}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-bold">7 days</span></div>
          </div>
          <div className="flex gap-3 justify-center">
            <Link to="/orders"><Button className="h-10 rounded-xl gap-1"><Package className="h-4 w-4" />View Orders</Button></Link>
            <Link to="/services"><Button variant="outline" className="h-10 rounded-xl">Browse Services</Button></Link>
          </div>
        </div>
      )}
    </div>
  );
}
