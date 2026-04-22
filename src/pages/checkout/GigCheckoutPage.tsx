import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import {
  ArrowLeft, ArrowRight, CheckCircle2, CreditCard, Shield,
  Clock, Package, Plus, Minus, Lock, ShoppingCart, Star, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const STEPS = ['Review Order', 'Add-ons', 'Requirements', 'Payment', 'Confirmation'];

const PACKAGE = { tier: 'Professional', price: 1200, delivery: '7 days', revisions: 3, features: ['Logo + brand guide', '4 concepts', '3 revisions', 'Source files', 'Social kit'] };
const ADDONS = [
  { id: '1', name: 'Express Delivery (3 days)', price: 300, selected: false },
  { id: '2', name: 'Extra Revision', price: 50, selected: false },
  { id: '3', name: 'Source Files (AI, PSD)', price: 100, selected: true },
  { id: '4', name: 'Social Media Kit', price: 150, selected: false },
];

export default function GigCheckoutPage() {
  const { gigId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [addons, setAddons] = useState(ADDONS);
  const [requirements, setRequirements] = useState('');
  const [processing, setProcessing] = useState(false);

  const total = PACKAGE.price + addons.filter(a => a.selected).reduce((s, a) => s + a.price, 0);

  const toggleAddon = (id: string) => setAddons(prev => prev.map(a => a.id === id ? { ...a, selected: !a.selected } : a));

  const handleComplete = () => {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setStep(4); }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Progress */}
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 ${i <= step ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${i < step ? 'bg-primary text-primary-foreground border-primary' : i === step ? 'border-primary text-primary' : 'border-muted-foreground/30'}`}>
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
          <div className="flex items-center gap-2 mb-4"><Link to={`/gigs/${gigId || 'demo'}`}><ArrowLeft className="h-4 w-4 text-muted-foreground hover:text-foreground" /></Link><h1 className="text-lg font-bold">Review Your Order</h1></div>
          <SectionCard title="Order Summary" className="!rounded-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <Badge variant="secondary" className="text-[9px] mb-1">{PACKAGE.tier}</Badge>
                <div className="text-sm font-bold">Brand Identity Design</div>
                <div className="text-[10px] text-muted-foreground">by DesignCraft Studio</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">${PACKAGE.price}</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{PACKAGE.delivery}</div>
              </div>
            </div>
            <div className="space-y-1">{PACKAGE.features.map(f => <div key={f} className="text-[10px] flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-primary" />{f}</div>)}</div>
          </SectionCard>
          <Button onClick={() => setStep(1)} className="w-full h-11 rounded-xl font-semibold gap-1">Continue to Add-ons <ArrowRight className="h-4 w-4" /></Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4"><button onClick={() => setStep(0)}><ArrowLeft className="h-4 w-4 text-muted-foreground hover:text-foreground" /></button><h1 className="text-lg font-bold">Customize Your Order</h1></div>
          <SectionCard title="Available Add-ons" className="!rounded-2xl">
            <div className="space-y-2">
              {addons.map(a => (
                <div key={a.id} className={`flex items-center justify-between py-3 px-3 rounded-xl border transition-colors cursor-pointer ${a.selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`} onClick={() => toggleAddon(a.id)}>
                  <div className="flex items-center gap-2.5">
                    <div className={`h-5 w-5 rounded-lg border-2 flex items-center justify-center ${a.selected ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                      {a.selected && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                    </div>
                    <span className="text-xs font-medium">{a.name}</span>
                  </div>
                  <span className="text-xs font-bold">+${a.price}</span>
                </div>
              ))}
            </div>
          </SectionCard>
          <div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-xl">
            <span className="text-xs font-medium">Order Total</span>
            <span className="text-lg font-bold">${total}</span>
          </div>
          <Button onClick={() => setStep(2)} className="w-full h-11 rounded-xl font-semibold gap-1">Continue to Requirements <ArrowRight className="h-4 w-4" /></Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4"><button onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4 text-muted-foreground hover:text-foreground" /></button><h1 className="text-lg font-bold">Project Requirements</h1></div>
          <SectionCard title="Tell the seller what you need" className="!rounded-2xl">
            <div className="space-y-4">
              <div><label className="text-xs font-medium mb-1.5 block">Project Description *</label><textarea className="w-full min-h-[120px] rounded-xl border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y" placeholder="Describe your project, target audience, preferences..." value={requirements} onChange={e => setRequirements(e.target.value)} /></div>
              <div><label className="text-xs font-medium mb-1.5 block">Reference Files</label>
                <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"><Plus className="h-6 w-6 mx-auto text-muted-foreground mb-1" /><p className="text-[10px] text-muted-foreground">Drop files here or click to upload</p></div>
              </div>
              <div><label className="text-xs font-medium mb-1.5 block">Brand Colors</label><Input placeholder="e.g. Blue #3B82F6, White #FFFFFF" className="h-10 rounded-xl" /></div>
            </div>
          </SectionCard>
          <Button onClick={() => setStep(3)} className="w-full h-11 rounded-xl font-semibold gap-1">Continue to Payment <ArrowRight className="h-4 w-4" /></Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4"><button onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4 text-muted-foreground hover:text-foreground" /></button><h1 className="text-lg font-bold">Payment</h1></div>
          <SectionCard title="Payment Method" icon={<CreditCard className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <div className="space-y-3">
              <div><label className="text-xs font-medium mb-1.5 block">Card Number</label><Input placeholder="1234 5678 9012 3456" className="h-10 rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium mb-1.5 block">Expiry Date</label><Input placeholder="MM/YY" className="h-10 rounded-xl" /></div>
                <div><label className="text-xs font-medium mb-1.5 block">CVC</label><Input placeholder="123" className="h-10 rounded-xl" /></div>
              </div>
              <div><label className="text-xs font-medium mb-1.5 block">Billing Name</label><Input placeholder="Name on card" className="h-10 rounded-xl" /></div>
            </div>
          </SectionCard>
          <SectionCard title="Order Summary" className="!rounded-2xl">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">{PACKAGE.tier} Package</span><span>${PACKAGE.price}</span></div>
              {addons.filter(a => a.selected).map(a => <div key={a.id} className="flex justify-between"><span className="text-muted-foreground">{a.name}</span><span>${a.price}</span></div>)}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-sm"><span>Total</span><span>${total}</span></div>
            </div>
          </SectionCard>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><Lock className="h-3.5 w-3.5" /><span>Your payment is secured with 256-bit SSL encryption</span></div>
          <Button onClick={handleComplete} disabled={processing} className="w-full h-11 rounded-xl font-semibold gap-1">
            {processing ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : <>Complete Purchase · ${total}</>}
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="text-center py-12">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="h-8 w-8 text-primary" /></div>
          <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-sm text-muted-foreground mb-6">Your order has been placed successfully. The seller will be notified immediately.</p>
          <div className="bg-muted/30 rounded-2xl p-4 max-w-sm mx-auto mb-6 text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-mono font-bold">#GIG-2026-4521</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Amount Paid</span><span className="font-bold">${total}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Est. Delivery</span><span className="font-bold">{PACKAGE.delivery}</span></div>
          </div>
          <div className="flex gap-3 justify-center">
            <Link to="/orders"><Button className="h-10 rounded-xl gap-1"><Package className="h-4 w-4" />View Orders</Button></Link>
            <Link to="/gigs"><Button variant="outline" className="h-10 rounded-xl">Browse More Gigs</Button></Link>
          </div>
        </div>
      )}
    </div>
  );
}
