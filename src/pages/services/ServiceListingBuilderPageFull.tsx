import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Plus, Sparkles, Save, Eye, Image, FileText, DollarSign, Clock } from 'lucide-react';

export default function ServiceListingBuilderPage() {
  const [tab, setTab] = useState('details');

  return (
    <DashboardLayout topStrip={<><Package className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Service Listing Builder</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Eye className="h-3 w-3" />Preview</Button><Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Save className="h-3 w-3" />Publish</Button></>}>
      <Tabs value={tab} onValueChange={setTab} className="mb-3">
        <TabsList className="h-8 rounded-xl">
          <TabsTrigger value="details" className="text-[10px] px-3 rounded-lg gap-1"><FileText className="h-3 w-3" />Details</TabsTrigger>
          <TabsTrigger value="media" className="text-[10px] px-3 rounded-lg gap-1"><Image className="h-3 w-3" />Media</TabsTrigger>
          <TabsTrigger value="pricing" className="text-[10px] px-3 rounded-lg gap-1"><DollarSign className="h-3 w-3" />Pricing</TabsTrigger>
          <TabsTrigger value="availability" className="text-[10px] px-3 rounded-lg gap-1"><Clock className="h-3 w-3" />Availability</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'details' && (
        <div className="space-y-3">
          <SectionCard title="Service Information" className="!rounded-2xl">
            <div className="space-y-2.5">
              {[{ label: 'Service Title', placeholder: 'e.g. Brand Identity Design' }, { label: 'Category', placeholder: 'e.g. Design > Branding' }, { label: 'Subcategory', placeholder: 'e.g. Logo & Brand Identity' }].map(f => (
                <div key={f.label}><div className="text-[9px] font-medium mb-0.5">{f.label}</div><input className="w-full h-8 rounded-xl border px-3 text-[10px]" placeholder={f.placeholder} /></div>
              ))}
              <div><div className="text-[9px] font-medium mb-0.5">Description</div><textarea className="w-full h-24 rounded-xl border px-3 py-2 text-[10px] resize-none" placeholder="Describe your service in detail..." /></div>
              <div><div className="text-[9px] font-medium mb-0.5">Key Deliverables</div><textarea className="w-full h-16 rounded-xl border px-3 py-2 text-[10px] resize-none" placeholder="List what clients receive..." /></div>
            </div>
          </SectionCard>
          <SectionCard title="Tags & Skills" className="!rounded-2xl">
            <div className="flex flex-wrap gap-1 mb-2">
              {['Branding', 'Logo Design', 'Brand Guidelines', 'Visual Identity'].map(t => <Badge key={t} variant="outline" className="text-[8px] rounded-lg">{t} ×</Badge>)}
            </div>
            <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Plus className="h-2.5 w-2.5" />Add Tag</Button>
          </SectionCard>
          <SectionCard title="Trust & Verification" className="!rounded-2xl">
            <div className="space-y-1.5 text-[9px]">
              {[{ label: 'Portfolio samples', value: '4 uploaded' }, { label: 'Certifications', value: '2 verified' }, { label: 'Insurance', value: 'Not provided' }].map(f => (
                <div key={f.label} className="flex justify-between"><span className="text-muted-foreground">{f.label}</span><span className="font-semibold">{f.value}</span></div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'media' && (
        <SectionCard title="Gallery & Portfolio" className="!rounded-2xl">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-video rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center">
                <div className="text-center"><Image className="h-5 w-5 text-muted-foreground/30 mx-auto mb-1" /><div className="text-[8px] text-muted-foreground">Upload image</div></div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="h-8 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />Add Media</Button>
        </SectionCard>
      )}

      {tab === 'pricing' && (
        <SectionCard title="Pricing Model" className="!rounded-2xl">
          <div className="space-y-2.5">
            <div className="flex gap-2">
              {['Fixed Price', 'Hourly Rate', 'Package Tiers', 'Custom Quote'].map(m => <Badge key={m} variant="outline" className="text-[9px] cursor-pointer hover:bg-accent/10 rounded-lg py-1 px-2.5">{m}</Badge>)}
            </div>
            <div><div className="text-[9px] font-medium mb-0.5">Base Price</div><input className="w-full h-8 rounded-xl border px-3 text-[10px]" placeholder="$0.00" /></div>
            <Button variant="outline" className="h-8 text-[9px] rounded-xl gap-1"><Sparkles className="h-3 w-3" />AI Price Suggestion</Button>
          </div>
        </SectionCard>
      )}

      {tab === 'availability' && (
        <SectionCard title="Availability & Capacity" className="!rounded-2xl">
          <div className="space-y-2.5">
            {[{ label: 'Max concurrent orders', placeholder: '3' }, { label: 'Minimum lead time', placeholder: '2 days' }, { label: 'Blackout dates', placeholder: 'Select dates...' }].map(f => (
              <div key={f.label}><div className="text-[9px] font-medium mb-0.5">{f.label}</div><input className="w-full h-8 rounded-xl border px-3 text-[10px]" placeholder={f.placeholder} /></div>
            ))}
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
