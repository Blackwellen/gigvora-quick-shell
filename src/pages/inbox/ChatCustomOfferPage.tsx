import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Gift, ChevronRight, ArrowRight, CheckCircle2, DollarSign, Clock, Plus, Trash2, Send } from 'lucide-react';

export default function ChatCustomOfferPage() {
  const [step, setStep] = useState(1);
  const [items, setItems] = useState([{ name: 'Homepage Design', price: 800 }, { name: 'Inner Pages (5)', price: 1200 }]);

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-2 w-full">
          <span className="text-[10px] text-muted-foreground">Chat with Alex M.</span>
          <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
          <Gift className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold">Custom Offer</span>
          <div className="flex-1" />
          <div className="flex gap-1">{[1, 2, 3].map(s => <div key={s} className={`h-1.5 w-8 rounded-full ${s <= step ? 'bg-accent' : 'bg-muted'}`} />)}</div>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Sending To">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7"><AvatarFallback className="text-[7px] bg-muted text-muted-foreground">AM</AvatarFallback></Avatar>
              <div><div className="text-[9px] font-bold">Alex M.</div><div className="text-[7px] text-muted-foreground">Client · E-commerce Project</div></div>
            </div>
          </SectionCard>
          <SectionCard title="Offer Summary">
            <div className="space-y-1 text-[8px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span>{items.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${items.reduce((a, i) => a + i.price, 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee</span><span>5%</span></div>
              <div className="flex justify-between border-t pt-1 font-bold"><span>Total</span><span className="text-accent">${items.reduce((a, i) => a + i.price, 0).toLocaleString()}</span></div>
            </div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-44"
    >
      {step === 1 && (
        <SectionCard title="Build Your Offer" className="!rounded-2xl">
          <div className="space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Offer Title</label><Input defaultValue="E-commerce Website Design Package" className="h-8 text-xs rounded-xl" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Description</label><Textarea defaultValue="Complete website design including homepage, 5 inner pages, mobile responsive design, and brand-aligned visuals." className="min-h-[60px] text-xs" /></div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Line Items</label>
              <div className="space-y-1.5">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={item.name} onChange={e => { const n = [...items]; n[i].name = e.target.value; setItems(n); }} className="h-7 text-xs rounded-lg flex-1" />
                    <div className="relative w-24"><DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><Input type="number" value={item.price} onChange={e => { const n = [...items]; n[i].price = Number(e.target.value); setItems(n); }} className="h-7 text-xs rounded-lg pl-6" /></div>
                    <Button variant="outline" size="sm" onClick={() => setItems(items.filter((_, j) => j !== i))} className="h-7 w-7 p-0 rounded-lg text-[hsl(var(--state-critical))]"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setItems([...items, { name: '', price: 0 }])} className="h-7 text-[9px] rounded-xl gap-0.5 w-full"><Plus className="h-3 w-3" />Add Item</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[9px] font-medium mb-1 block">Delivery Time</label><Input defaultValue="14 days" className="h-8 text-xs rounded-xl" /></div>
              <div><label className="text-[9px] font-medium mb-1 block">Revisions</label><Input type="number" defaultValue="3" className="h-8 text-xs rounded-xl" /></div>
            </div>
            <div><label className="text-[9px] font-medium mb-1 block">Expiration</label><Input type="date" className="h-8 text-xs rounded-xl" /></div>
            <Button onClick={() => setStep(2)} className="h-7 text-[9px] rounded-xl gap-1">Preview Offer <ArrowRight className="h-3 w-3" /></Button>
          </div>
        </SectionCard>
      )}

      {step === 2 && (
        <SectionCard title="Review & Send" className="!rounded-2xl">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
              <h3 className="text-[11px] font-bold mb-1">E-commerce Website Design Package</h3>
              <p className="text-[8px] text-muted-foreground mb-2">Complete website design including homepage, 5 inner pages, mobile responsive design, and brand-aligned visuals.</p>
              <div className="space-y-1 mb-2">
                {items.map((item, i) => <div key={i} className="flex justify-between text-[9px]"><span>{item.name}</span><span className="font-medium">${item.price.toLocaleString()}</span></div>)}
                <div className="border-t pt-1 flex justify-between text-[10px] font-bold"><span>Total</span><span className="text-accent">${items.reduce((a, i) => a + i.price, 0).toLocaleString()}</span></div>
              </div>
              <div className="flex gap-3 text-[8px] text-muted-foreground"><span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />14 days</span><span>3 revisions</span><span>Expires in 7 days</span></div>
            </div>
            <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setStep(1)} className="h-7 text-[9px] rounded-xl">Edit</Button><Button size="sm" onClick={() => setStep(3)} className="h-7 text-[9px] rounded-xl gap-1"><Send className="h-3 w-3" />Send Offer</Button></div>
          </div>
        </SectionCard>
      )}

      {step === 3 && (
        <SectionCard className="!rounded-2xl text-center py-8">
          <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center mx-auto mb-3"><CheckCircle2 className="h-6 w-6 text-[hsl(var(--state-healthy))]" /></div>
          <h2 className="text-sm font-bold mb-1">Offer Sent!</h2>
          <p className="text-[9px] text-muted-foreground mb-3">Your custom offer for $2,000 has been sent to Alex M. They'll be notified in the chat.</p>
          <div className="flex justify-center gap-2"><Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl">View Offer</Button><Button size="sm" className="h-7 text-[9px] rounded-xl">Back to Chat</Button></div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
