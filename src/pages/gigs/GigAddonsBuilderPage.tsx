import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Puzzle, Plus, Save, GripVertical, Trash2, DollarSign, Clock, ToggleLeft } from 'lucide-react';

const ADDONS = [
  { name: 'Extra-fast delivery (24h)', price: '$50', delivery: '-2 days', active: true, orders: 42 },
  { name: 'Additional revision round', price: '$25', delivery: '+0', active: true, orders: 78 },
  { name: 'Source file package', price: '$30', delivery: '+0', active: true, orders: 56 },
  { name: 'Social media kit (5 sizes)', price: '$40', delivery: '+1 day', active: true, orders: 31 },
  { name: 'Print-ready files (CMYK)', price: '$20', delivery: '+1 day', active: false, orders: 12 },
  { name: 'Brand guidelines doc', price: '$75', delivery: '+2 days', active: false, orders: 8 },
];

export default function GigAddonsBuilderPage() {
  return (
    <DashboardLayout topStrip={<><Puzzle className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Add-Ons Builder</span><div className="flex-1" /><Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Save className="h-3 w-3" />Save All</Button></>}>
      <SectionCard title="Gig Add-Ons" action={<Button size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Plus className="h-2.5 w-2.5" />New Add-On</Button>} className="!rounded-2xl mb-3">
        <div className="space-y-2.5">
          {ADDONS.map((a, i) => (
            <div key={i} className="rounded-2xl border bg-card p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 cursor-grab" />
                <input className="text-[11px] font-bold border-0 bg-transparent p-0 focus:outline-none flex-1" defaultValue={a.name} />
                <Badge className={`text-[7px] border-0 rounded-lg ${a.active ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : 'bg-muted text-muted-foreground'}`}>{a.active ? 'Active' : 'Draft'}</Badge>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive"><Trash2 className="h-3 w-3" /></Button>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div><div className="text-[8px] text-muted-foreground mb-0.5 flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />Price</div><input className="w-full h-7 rounded-lg border px-2 text-[10px]" defaultValue={a.price} /></div>
                <div><div className="text-[8px] text-muted-foreground mb-0.5 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />Delivery Impact</div><input className="w-full h-7 rounded-lg border px-2 text-[10px]" defaultValue={a.delivery} /></div>
                <div><div className="text-[8px] text-muted-foreground mb-0.5">Orders (30d)</div><div className="h-7 rounded-lg border px-2 flex items-center text-[10px] font-semibold bg-muted/20">{a.orders}</div></div>
              </div>
              <div>
                <div className="text-[8px] text-muted-foreground mb-0.5">Description</div>
                <textarea className="w-full h-12 rounded-lg border px-2 py-1.5 text-[9px] resize-none" placeholder="Describe what the buyer gets with this add-on..." />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Add-On Tips" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px] text-muted-foreground">
          <div className="flex items-start gap-2"><span className="text-accent font-bold">•</span>Add-ons with clear deliverables convert 40% better than vague upgrades.</div>
          <div className="flex items-start gap-2"><span className="text-accent font-bold">•</span>Price add-ons at 15–30% of your base package for optimal uptake.</div>
          <div className="flex items-start gap-2"><span className="text-accent font-bold">•</span>Source file and rush delivery add-ons are the most popular across the platform.</div>
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
