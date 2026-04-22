import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layers, Plus, Save, GripVertical, Trash2, CheckCircle, DollarSign, Clock } from 'lucide-react';

const PACKAGES = [
  { name: 'Starter', price: '$500', delivery: '5 days', features: ['Logo design', '2 concepts', '1 revision', 'Source files'], active: true },
  { name: 'Professional', price: '$1,200', delivery: '7 days', features: ['Logo + brand guide', '4 concepts', '3 revisions', 'Source files', 'Social kit'], active: true },
  { name: 'Enterprise', price: '$3,000', delivery: '14 days', features: ['Full brand identity', '6 concepts', 'Unlimited revisions', 'Source files', 'Social kit', 'Stationery'], active: true },
];

const ADDONS = [
  { name: 'Rush delivery (48h)', price: '$200', active: true },
  { name: 'Extra revision round', price: '$100', active: true },
  { name: 'Animated logo', price: '$350', active: true },
  { name: 'Business card design', price: '$150', active: false },
];

export default function ServicePackagesBuilderPage() {
  return (
    <DashboardLayout topStrip={<><Layers className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Packages & Add-Ons Builder</span><div className="flex-1" /><Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Save className="h-3 w-3" />Save All</Button></>}>
      <SectionCard title="Service Packages" action={<Button size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Plus className="h-2.5 w-2.5" />Add Package</Button>} className="!rounded-2xl mb-3">
        <div className="space-y-3">
          {PACKAGES.map((p, i) => (
            <div key={i} className="rounded-2xl border bg-card p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 cursor-grab" />
                <input className="text-[11px] font-bold border-0 bg-transparent p-0 focus:outline-none flex-1" defaultValue={p.name} />
                <Badge className={`text-[7px] border-0 rounded-lg ${p.active ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : 'bg-muted text-muted-foreground'}`}>{p.active ? 'Active' : 'Draft'}</Badge>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive"><Trash2 className="h-3 w-3" /></Button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div><div className="text-[8px] text-muted-foreground mb-0.5 flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />Price</div><input className="w-full h-7 rounded-lg border px-2 text-[10px]" defaultValue={p.price} /></div>
                <div><div className="text-[8px] text-muted-foreground mb-0.5 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />Delivery</div><input className="w-full h-7 rounded-lg border px-2 text-[10px]" defaultValue={p.delivery} /></div>
              </div>
              <div className="space-y-1">
                {p.features.map((f, j) => (
                  <div key={j} className="flex items-center gap-1.5 text-[9px]">
                    <CheckCircle className="h-3 w-3 text-[hsl(var(--state-healthy))] shrink-0" />
                    <input className="flex-1 border-0 bg-transparent p-0 text-[9px] focus:outline-none" defaultValue={f} />
                    <button className="text-muted-foreground/40 hover:text-destructive"><Trash2 className="h-2.5 w-2.5" /></button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="h-5 text-[7px] gap-0.5 -ml-1"><Plus className="h-2.5 w-2.5" />Add feature</Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Add-Ons" action={<Button size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Plus className="h-2.5 w-2.5" />Add</Button>} className="!rounded-2xl">
        <div className="space-y-1.5">
          {ADDONS.map((a, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/20 last:border-0">
              <GripVertical className="h-3 w-3 text-muted-foreground/40 cursor-grab" />
              <input className="flex-1 text-[9px] border-0 bg-transparent p-0 focus:outline-none" defaultValue={a.name} />
              <input className="w-16 h-6 rounded-lg border px-2 text-[9px] text-right" defaultValue={a.price} />
              <Badge className={`text-[6px] border-0 rounded-md cursor-pointer ${a.active ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : 'bg-muted text-muted-foreground'}`}>{a.active ? 'On' : 'Off'}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
