import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GitCompare, Eye, Star, DollarSign, Clock, MapPin, X, Plus, CheckCircle } from 'lucide-react';

const COMPARE_ITEMS = [
  { name: 'Sarah Chen Design', type: 'Service', price: 'From $500', rating: 4.9, reviews: 28, delivery: '5-7 days', location: 'Remote', highlights: ['Brand Identity', 'UX Design', 'Portfolio Review'] },
  { name: 'DesignCraft Studio', type: 'Agency', price: 'From $800', rating: 4.8, reviews: 42, delivery: '7-10 days', location: 'London', highlights: ['Full Branding', 'Web Design', 'Print'] },
  { name: 'Pixel Perfect Agency', type: 'Agency', price: 'From $650', rating: 4.7, reviews: 18, delivery: '5-8 days', location: 'Berlin', highlights: ['Logo Design', 'Brand Strategy', 'Social Media'] },
];

const CRITERIA = ['Price', 'Rating', 'Delivery Time', 'Reviews', 'Location', 'Expertise Range'];

export default function SearchComparePreviewPage() {
  const [viewMode, setViewMode] = useState<'compare' | 'preview'>('compare');

  return (
    <DashboardLayout topStrip={<><GitCompare className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Compare & Preview</span><div className="flex-1" /><div className="flex gap-1 bg-muted/40 rounded-xl p-0.5"><button onClick={() => setViewMode('compare')} className={cn('px-2 py-1 rounded-lg text-[8px] font-medium', viewMode === 'compare' ? 'bg-card shadow-sm' : 'text-muted-foreground')}>Compare</button><button onClick={() => setViewMode('preview')} className={cn('px-2 py-1 rounded-lg text-[8px] font-medium', viewMode === 'preview' ? 'bg-card shadow-sm' : 'text-muted-foreground')}>Preview</button></div></>}>
      {viewMode === 'compare' ? (
        <>
          <div className="flex items-center gap-2 mb-3"><Badge variant="outline" className="text-[9px] rounded-lg">{COMPARE_ITEMS.length} items selected</Badge><Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Plus className="h-2.5 w-2.5" />Add</Button></div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {COMPARE_ITEMS.map((item, i) => (
              <SectionCard key={i} className="!rounded-2xl relative">
                <button className="absolute top-2 right-2 h-4 w-4 rounded-full bg-muted/50 flex items-center justify-center"><X className="h-2.5 w-2.5 text-muted-foreground" /></button>
                <div className="text-center mb-2"><div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-1 text-[11px] font-bold text-accent">{item.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div><div className="text-[10px] font-bold">{item.name}</div><Badge variant="outline" className="text-[6px] rounded-md">{item.type}</Badge></div>
                <div className="space-y-1.5 text-[8px]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="font-semibold">{item.price}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Rating</span><span className="font-semibold flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{item.rating}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Reviews</span><span className="font-semibold">{item.reviews}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-semibold">{item.delivery}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-semibold">{item.location}</span></div>
                </div>
                <div className="mt-2 flex flex-wrap gap-0.5">{item.highlights.map(h => <Badge key={h} variant="outline" className="text-[6px] rounded-md">{h}</Badge>)}</div>
                <Button className="w-full h-7 text-[9px] rounded-xl mt-2">Select</Button>
              </SectionCard>
            ))}
          </div>
          <SectionCard title="Criteria Comparison" className="!rounded-2xl">
            <div className="space-y-1.5">
              <div className="grid grid-cols-4 gap-2 text-[8px] font-medium text-muted-foreground border-b pb-1"><span>Criteria</span>{COMPARE_ITEMS.map(item => <span key={item.name}>{item.name.split(' ')[0]}</span>)}</div>
              {CRITERIA.map(c => (
                <div key={c} className="grid grid-cols-4 gap-2 text-[8px] py-1 border-b border-border/20 last:border-0">
                  <span className="font-medium">{c}</span>
                  {COMPARE_ITEMS.map(item => <span key={item.name}><CheckCircle className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))] inline mr-0.5" />Good</span>)}
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      ) : (
        <div className="space-y-3">
          {COMPARE_ITEMS.map((item, i) => (
            <SectionCard key={i} className="!rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center text-lg font-bold text-accent shrink-0">{item.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1"><span className="text-sm font-bold">{item.name}</span><Badge variant="outline" className="text-[7px] rounded-md">{item.type}</Badge></div>
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground mb-2">
                    <span className="flex items-center gap-0.5"><DollarSign className="h-3 w-3" />{item.price}</span>
                    <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" />{item.rating} ({item.reviews})</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{item.delivery}</span>
                    <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{item.location}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">{item.highlights.map(h => <Badge key={h} variant="outline" className="text-[7px] rounded-md">{h}</Badge>)}</div>
                  <div className="flex gap-2"><Button size="sm" className="h-7 text-[9px] rounded-xl">Contact</Button><Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl"><Eye className="h-3 w-3 mr-0.5" />Full Profile</Button></div>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
