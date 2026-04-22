import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, CheckCircle2, AlertCircle, ChevronRight, Shield, ArrowRight, Clock } from 'lucide-react';

const MILESTONES = [
  { id: 'MS-001', name: 'Discovery & Research', amount: 2500, status: 'funded' as const, deliverables: 3, approved: 3 },
  { id: 'MS-002', name: 'Design Phase', amount: 4000, status: 'funded' as const, deliverables: 5, approved: 4 },
  { id: 'MS-003', name: 'Development Sprint 1', amount: 6000, status: 'funded' as const, deliverables: 8, approved: 8 },
  { id: 'MS-004', name: 'Development Sprint 2', amount: 6000, status: 'pending' as const, deliverables: 6, approved: 0 },
];

const statusMap = { funded: 'healthy', pending: 'pending', released: 'review' } as const;

export default function ReleaseFundsPage() {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>(['MS-003']);

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <DollarSign className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold">Release Funds</span>
          <div className="flex-1" />
          <div className="flex gap-1">{[1, 2, 3].map(s => <div key={s} className={`h-1.5 w-8 rounded-full ${s <= step ? 'bg-accent' : 'bg-muted'}`} />)}</div>
          <span className="text-[8px] text-muted-foreground">Step {step} of 3</span>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Release Summary">
            <div className="space-y-1.5 text-[8px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Selected</span><span className="font-medium">{selected.length} milestones</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Amount</span><span className="font-bold text-accent">${(selected.reduce((a, id) => a + (MILESTONES.find(m => m.id === id)?.amount || 0), 0)).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee</span><span>5%</span></div>
              <div className="flex justify-between border-t pt-1"><span className="text-muted-foreground">Net to Seller</span><span className="font-bold">${(selected.reduce((a, id) => a + (MILESTONES.find(m => m.id === id)?.amount || 0), 0) * 0.95).toLocaleString()}</span></div>
            </div>
          </SectionCard>
          <SectionCard title="Protection">
            <div className="flex gap-1.5 text-[8px] text-muted-foreground"><Shield className="h-3 w-3 text-accent shrink-0 mt-0.5" /><span>Funds are released to the seller's wallet within 24h of confirmation.</span></div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-48"
    >
      {step === 1 && (
        <SectionCard title="Select Milestones to Release" className="!rounded-2xl">
          <p className="text-[9px] text-muted-foreground mb-3">Select completed milestones to release funds from escrow to the seller.</p>
          <div className="space-y-2">
            {MILESTONES.map(m => (
              <div key={m.id} onClick={() => m.status === 'funded' && m.approved === m.deliverables && setSelected(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${selected.includes(m.id) ? 'border-accent bg-accent/5' : 'border-border/40'} ${m.status === 'funded' && m.approved === m.deliverables ? 'cursor-pointer hover:border-accent/30' : 'opacity-50 cursor-not-allowed'}`}>
                <div className={`h-4 w-4 rounded-md border-2 flex items-center justify-center ${selected.includes(m.id) ? 'border-accent bg-accent' : 'border-border'}`}>{selected.includes(m.id) && <CheckCircle2 className="h-3 w-3 text-white" />}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5"><Badge variant="outline" className="text-[7px] font-mono rounded-md">{m.id}</Badge><span className="text-[10px] font-semibold">{m.name}</span><StatusBadge status={statusMap[m.status]} label={m.status} /></div>
                  <div className="flex items-center gap-3 text-[8px] text-muted-foreground"><span className="font-semibold text-foreground">${m.amount.toLocaleString()}</span><span>{m.approved}/{m.deliverables} deliverables approved</span></div>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={() => setStep(2)} disabled={selected.length === 0} className="mt-3 h-7 text-[9px] rounded-xl gap-1">Continue <ArrowRight className="h-3 w-3" /></Button>
        </SectionCard>
      )}

      {step === 2 && (
        <SectionCard title="Review & Confirm" className="!rounded-2xl">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-muted/20 space-y-2 text-[9px]">
              {selected.map(id => { const m = MILESTONES.find(ms => ms.id === id)!; return (
                <div key={id} className="flex justify-between"><span>{m.name}</span><span className="font-bold">${m.amount.toLocaleString()}</span></div>
              ); })}
              <div className="border-t pt-1.5 flex justify-between font-bold"><span>Total Release</span><span className="text-accent">${selected.reduce((a, id) => a + (MILESTONES.find(m => m.id === id)?.amount || 0), 0).toLocaleString()}</span></div>
            </div>
            <div><label className="text-[9px] font-medium mb-1 block">Note to Seller (optional)</label><Textarea placeholder="Add a note for the seller..." className="min-h-[60px] text-xs" /></div>
            <div className="p-2.5 rounded-xl bg-[hsl(var(--gigvora-amber)/0.08)] border border-[hsl(var(--gigvora-amber)/0.2)] flex gap-2"><AlertCircle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0 mt-0.5" /><p className="text-[8px] text-[hsl(var(--gigvora-amber))]">This action is irreversible. Funds will be transferred to the seller's wallet.</p></div>
            <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setStep(1)} className="h-7 text-[9px] rounded-xl">Back</Button><Button size="sm" onClick={() => setStep(3)} className="h-7 text-[9px] rounded-xl gap-1"><CheckCircle2 className="h-3 w-3" />Confirm Release</Button></div>
          </div>
        </SectionCard>
      )}

      {step === 3 && (
        <SectionCard className="!rounded-2xl text-center py-8">
          <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center mx-auto mb-3"><CheckCircle2 className="h-6 w-6 text-[hsl(var(--state-healthy))]" /></div>
          <h2 className="text-sm font-bold mb-1">Funds Released Successfully</h2>
          <p className="text-[9px] text-muted-foreground mb-3">$6,000.00 has been released to the seller's wallet. Processing within 24 hours.</p>
          <div className="flex justify-center gap-2"><Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl">View Transaction</Button><Button size="sm" className="h-7 text-[9px] rounded-xl">Back to Escrow</Button></div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
