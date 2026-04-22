import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RotateCcw, AlertCircle, ArrowRight, CheckCircle2, DollarSign, Shield, Upload } from 'lucide-react';

const REASONS = ['Work not delivered', 'Quality below expectations', 'Scope disagreement', 'Communication breakdown', 'Seller unresponsive', 'Other'];

export default function RefundRequestPage() {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('');
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <RotateCcw className="h-4 w-4 text-[hsl(var(--gigvora-amber))]" />
          <span className="text-xs font-semibold">Request Refund</span>
          <div className="flex-1" />
          <div className="flex gap-1">{[1, 2, 3].map(s => <div key={s} className={`h-1.5 w-8 rounded-full ${s <= step ? 'bg-accent' : 'bg-muted'}`} />)}</div>
          <span className="text-[8px] text-muted-foreground">Step {step} of 3</span>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Order Info">
            <div className="space-y-1.5 text-[8px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Order</span><span className="font-mono">ORD-2281</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold">$4,000</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Seller</span><span>DesignCraft</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Escrow Status</span><span className="text-[hsl(var(--state-healthy))]">Funded</span></div>
            </div>
          </SectionCard>
          <SectionCard title="Policy">
            <div className="flex gap-1.5 text-[8px] text-muted-foreground"><Shield className="h-3 w-3 text-accent shrink-0 mt-0.5" /><span>Refund requests are reviewed within 48h. Both parties may submit evidence.</span></div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-44"
    >
      {step === 1 && (
        <SectionCard title="Refund Details" className="!rounded-2xl">
          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-medium mb-1.5 block">Refund Type</label>
              <div className="flex gap-2">
                {(['full', 'partial'] as const).map(t => (
                  <button key={t} onClick={() => setRefundType(t)} className={`flex-1 p-3 rounded-xl border text-center transition-all ${refundType === t ? 'border-accent bg-accent/5' : 'border-border/40 hover:border-accent/30'}`}>
                    <DollarSign className={`h-4 w-4 mx-auto mb-1 ${refundType === t ? 'text-accent' : 'text-muted-foreground'}`} />
                    <span className="text-[10px] font-semibold capitalize block">{t} Refund</span>
                    <span className="text-[8px] text-muted-foreground">{t === 'full' ? '$4,000.00' : 'Enter amount'}</span>
                  </button>
                ))}
              </div>
            </div>
            {refundType === 'partial' && <div><label className="text-[9px] font-medium mb-1 block">Amount</label><Input type="number" placeholder="Enter refund amount" className="h-8 text-xs rounded-xl" /></div>}
            <div>
              <label className="text-[9px] font-medium mb-1.5 block">Reason</label>
              <div className="grid grid-cols-2 gap-1.5">
                {REASONS.map(r => (
                  <button key={r} onClick={() => setReason(r)} className={`px-3 py-2 rounded-lg text-[9px] text-left transition-all ${reason === r ? 'bg-accent/10 border-accent text-accent border' : 'bg-muted/30 border border-border/30 hover:border-accent/20'}`}>{r}</button>
                ))}
              </div>
            </div>
            <div><label className="text-[9px] font-medium mb-1 block">Description</label><Textarea placeholder="Explain why you're requesting a refund..." className="min-h-[80px] text-xs" /></div>
            <Button onClick={() => setStep(2)} disabled={!reason} className="h-7 text-[9px] rounded-xl gap-1">Continue <ArrowRight className="h-3 w-3" /></Button>
          </div>
        </SectionCard>
      )}

      {step === 2 && (
        <SectionCard title="Supporting Evidence" className="!rounded-2xl">
          <div className="space-y-3">
            <p className="text-[9px] text-muted-foreground">Upload screenshots, files, or communications that support your refund request.</p>
            <div className="border-2 border-dashed border-border/40 rounded-xl p-6 text-center cursor-pointer hover:border-accent/30 transition-colors">
              <Upload className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1.5" />
              <p className="text-[9px] text-muted-foreground">Drag and drop or click to upload</p>
              <p className="text-[7px] text-muted-foreground">PNG, JPG, PDF, up to 10MB each — max 10 files</p>
            </div>
            <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setStep(1)} className="h-7 text-[9px] rounded-xl">Back</Button><Button size="sm" onClick={() => setStep(3)} className="h-7 text-[9px] rounded-xl gap-1">Review Request <ArrowRight className="h-3 w-3" /></Button></div>
          </div>
        </SectionCard>
      )}

      {step === 3 && (
        <SectionCard title="Review & Submit" className="!rounded-2xl">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-muted/20 space-y-2 text-[9px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium capitalize">{refundType} Refund</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold text-accent">${refundType === 'full' ? '4,000.00' : 'Custom'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Reason</span><span className="font-medium">{reason}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Evidence</span><span>2 files attached</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Expected Resolution</span><span className="font-medium">Within 48 hours</span></div>
            </div>
            <div className="p-2.5 rounded-xl bg-[hsl(var(--gigvora-amber)/0.08)] border border-[hsl(var(--gigvora-amber)/0.2)] flex gap-2"><AlertCircle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0 mt-0.5" /><p className="text-[8px] text-[hsl(var(--gigvora-amber))]">The seller will be notified and given 72 hours to respond. If unresolved, mediation will be offered.</p></div>
            <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setStep(2)} className="h-7 text-[9px] rounded-xl">Back</Button><Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><CheckCircle2 className="h-3 w-3" />Submit Request</Button></div>
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
