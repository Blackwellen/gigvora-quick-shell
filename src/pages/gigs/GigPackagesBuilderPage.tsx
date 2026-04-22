import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Trash2, GripVertical, CheckCircle2, Eye } from 'lucide-react';

const PACKAGES = [
  { name: 'Basic', price: '$50', delivery: '3 days', revisions: '1', features: ['1 concept', 'Source file', 'Commercial use'] },
  { name: 'Standard', price: '$100', delivery: '5 days', revisions: '3', features: ['3 concepts', 'Source files', 'Commercial use', 'Mockups', 'Brand guide'] },
  { name: 'Premium', price: '$200', delivery: '7 days', revisions: 'Unlimited', features: ['5 concepts', 'All files', 'Commercial use', 'Mockups', 'Brand guide', 'Social kit', 'Priority'] },
];

export default function GigPackagesBuilderPage() {
  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <Package className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold">Package Builder</h1>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Eye className="h-3 w-3" /> Preview</Button>
          <Button size="sm" className="h-7 text-[10px]">Save</Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PACKAGES.map((pkg, i) => (
          <SectionCard key={i} title={pkg.name} action={i === 1 ? <Badge className="text-[7px] h-3.5 bg-accent/10 text-accent border-0">Recommended</Badge> : undefined}>
            <div className="space-y-3">
              <div><label className="text-[10px] font-medium block mb-1">Package Name</label><Input defaultValue={pkg.name} className="h-8 text-xs" /></div>
              <div><label className="text-[10px] font-medium block mb-1">Price</label><Input defaultValue={pkg.price} className="h-8 text-xs" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] font-medium block mb-1">Delivery</label><Input defaultValue={pkg.delivery} className="h-8 text-xs" /></div>
                <div><label className="text-[10px] font-medium block mb-1">Revisions</label><Input defaultValue={pkg.revisions} className="h-8 text-xs" /></div>
              </div>
              <div>
                <label className="text-[10px] font-medium block mb-1">Features</label>
                {pkg.features.map((f, fi) => (
                  <div key={fi} className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-3 w-3 text-accent shrink-0" />
                    <Input defaultValue={f} className="h-7 text-[10px] flex-1" />
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Trash2 className="h-2.5 w-2.5 text-muted-foreground" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 w-full mt-1"><Plus className="h-2.5 w-2.5" /> Add Feature</Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
