import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Upload, Shield, CheckCircle2, ArrowRight, FileText } from 'lucide-react';

const CATEGORIES = ['Non-delivery', 'Quality issue', 'Scope disagreement', 'Payment dispute', 'Contract violation', 'Communication breakdown', 'Intellectual property', 'Other'];

export default function DisputeIntakePage() {
  const [step, setStep] = useState(1);

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--destructive))]" />
          <h1 className="text-sm font-bold">File a Dispute</h1>
          <div className="flex items-center gap-2 ml-auto">
            {[1, 2, 3].map(s => (
              <div key={s} className={`flex items-center gap-1 text-[9px] ${s <= step ? 'text-accent font-medium' : 'text-muted-foreground'}`}>
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] ${s < step ? 'bg-accent text-accent-foreground' : s === step ? 'border-2 border-accent' : 'bg-muted'}`}>
                  {s < step ? <CheckCircle2 className="h-3 w-3" /> : s}
                </div>
                <span>{s === 1 ? 'Details' : s === 2 ? 'Evidence' : 'Review'}</span>
                {s < 3 && <ArrowRight className="h-2.5 w-2.5 text-muted-foreground mx-1" />}
              </div>
            ))}
          </div>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Protection" icon={<Shield className="h-3 w-3 text-accent" />}>
            <div className="space-y-1.5 text-[9px]">
              {['Neutral mediation', '48h initial response', 'Evidence-based review', 'Escalation to arbitration', 'Escrow hold protection'].map(item => (
                <div key={item} className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-accent" /><span>{item}</span></div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Timeline">
            <div className="space-y-1 text-[9px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Initial review</span><span className="font-medium">24-48h</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mediation</span><span className="font-medium">3-7 days</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Arbitration</span><span className="font-medium">7-14 days</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Resolution</span><span className="font-medium">1-3 days</span></div>
            </div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-48"
    >
      {step === 1 && (
        <SectionCard title="Dispute Details">
          <div className="space-y-4">
            <div><label className="text-[10px] font-medium block mb-1">Related Order / Contract</label><Input placeholder="Search by ID or name..." className="h-9 text-sm" /></div>
            <div><label className="text-[10px] font-medium block mb-1">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(c => (
                  <label key={c} className="flex items-center gap-2 p-2 rounded-lg border border-border/40 cursor-pointer hover:bg-accent/5 text-[10px]">
                    <input type="radio" name="category" className="accent-accent" />{c}
                  </label>
                ))}
              </div>
            </div>
            <div><label className="text-[10px] font-medium block mb-1">Description</label><Textarea placeholder="Describe the issue in detail..." className="min-h-[120px] text-sm" /></div>
            <div><label className="text-[10px] font-medium block mb-1">Desired Resolution</label><Textarea placeholder="What outcome are you seeking?" className="min-h-[60px] text-sm" /></div>
            <div><label className="text-[10px] font-medium block mb-1">Disputed Amount</label><Input placeholder="$0.00" className="h-9 text-sm max-w-xs" /></div>
            <Button onClick={() => setStep(2)} className="h-9 text-xs gap-1">Continue <ArrowRight className="h-3 w-3" /></Button>
          </div>
        </SectionCard>
      )}

      {step === 2 && (
        <SectionCard title="Evidence & Documentation">
          <div className="space-y-4">
            <div className="p-6 rounded-xl border-2 border-dashed border-border/50 text-center cursor-pointer hover:bg-accent/5">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-[11px] font-medium">Upload evidence files</p>
              <p className="text-[9px] text-muted-foreground">Screenshots, documents, chat logs, contracts (max 10 files)</p>
            </div>
            <div><label className="text-[10px] font-medium block mb-1">Communication Timeline</label><Textarea placeholder="List key dates and communications..." className="min-h-[80px] text-sm" /></div>
            <div><label className="text-[10px] font-medium block mb-1">Previous Resolution Attempts</label><Textarea placeholder="Describe any attempts to resolve directly..." className="min-h-[60px] text-sm" /></div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="h-9 text-xs">Back</Button>
              <Button onClick={() => setStep(3)} className="h-9 text-xs gap-1">Review <ArrowRight className="h-3 w-3" /></Button>
            </div>
          </div>
        </SectionCard>
      )}

      {step === 3 && (
        <SectionCard title="Review & Submit">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/30 space-y-2 text-[10px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Order/Contract</span><span className="font-medium">GIG-2002</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-medium">Quality issue</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-medium">$200</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Evidence files</span><span className="font-medium">3 files</span></div>
            </div>
            <div className="p-3 rounded-lg bg-[hsl(var(--gigvora-amber))]/5 border border-[hsl(var(--gigvora-amber))]/20 text-[9px]">
              <p className="font-medium text-[hsl(var(--gigvora-amber))]">Important</p>
              <p className="text-muted-foreground mt-0.5">Submitting a dispute will place any related escrow funds on hold until resolution.</p>
            </div>
            <label className="flex items-start gap-2 text-[10px] cursor-pointer">
              <input type="checkbox" className="accent-accent mt-0.5" />
              <span>I confirm the information is accurate and I agree to the dispute resolution terms.</span>
            </label>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="h-9 text-xs">Back</Button>
              <Button className="h-9 text-xs gap-1"><FileText className="h-3 w-3" /> Submit Dispute</Button>
            </div>
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
