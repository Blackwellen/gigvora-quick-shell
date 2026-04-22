import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TicketPlus, Upload, Paperclip, AlertCircle, Info, Send, ChevronRight } from 'lucide-react';

const CATEGORIES = ['Payments & Billing', 'Account & Security', 'Gigs & Services', 'Projects & Contracts', 'Jobs & Recruiting', 'Disputes', 'Technical Issue', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export default function TicketSubmissionPage() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('Medium');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <TicketPlus className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold">Submit a Ticket</span>
          <div className="flex-1" />
          <div className="flex gap-1">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 w-8 rounded-full ${s <= step ? 'bg-accent' : 'bg-muted'}`} />
            ))}
          </div>
          <span className="text-[8px] text-muted-foreground">Step {step} of 3</span>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Tips">
            <div className="space-y-2 text-[8px] text-muted-foreground">
              <div className="flex gap-1.5"><Info className="h-3 w-3 text-accent shrink-0 mt-0.5" /><span>Include order or transaction IDs when relevant.</span></div>
              <div className="flex gap-1.5"><Info className="h-3 w-3 text-accent shrink-0 mt-0.5" /><span>Attach screenshots to help us understand the issue faster.</span></div>
              <div className="flex gap-1.5"><Info className="h-3 w-3 text-accent shrink-0 mt-0.5" /><span>Check our FAQ before submitting — your answer may already exist.</span></div>
            </div>
          </SectionCard>
          <SectionCard title="SLA">
            <div className="space-y-1 text-[8px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Low</span><span className="font-medium">48h</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Medium</span><span className="font-medium">24h</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">High</span><span className="font-medium">8h</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Urgent</span><span className="font-medium">2h</span></div>
            </div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-44"
    >
      {step === 1 && (
        <SectionCard title="Select Category" className="!rounded-2xl">
          <p className="text-[9px] text-muted-foreground mb-3">Choose the category that best matches your issue.</p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => { setCategory(c); setStep(2); }} className={`p-3 rounded-xl border text-left transition-all hover:border-accent/40 ${category === c ? 'border-accent bg-accent/5' : 'border-border/40'}`}>
                <span className="text-[10px] font-semibold">{c}</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground float-right mt-0.5" />
              </button>
            ))}
          </div>
        </SectionCard>
      )}

      {step === 2 && (
        <SectionCard title="Describe Your Issue" className="!rounded-2xl">
          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-medium mb-1 block">Category</label>
              <Badge variant="outline" className="text-[8px] rounded-lg">{category}</Badge>
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Subject *</label>
              <Input placeholder="Brief summary of your issue" className="h-8 text-xs rounded-xl" />
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Description *</label>
              <Textarea placeholder="Please describe your issue in detail. Include any relevant order IDs, transaction numbers, or links..." className="min-h-[120px] text-xs" />
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Priority</label>
              <div className="flex gap-1.5">
                {PRIORITIES.map(p => (
                  <button key={p} onClick={() => setPriority(p)} className={`px-3 py-1.5 rounded-lg text-[8px] font-medium transition-all ${priority === p ? 'bg-accent text-white' : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'}`}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Attachments</label>
              <div className="border-2 border-dashed border-border/40 rounded-xl p-4 text-center cursor-pointer hover:border-accent/30 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground/40 mx-auto mb-1" />
                <p className="text-[9px] text-muted-foreground">Drag and drop files or click to upload</p>
                <p className="text-[7px] text-muted-foreground">PNG, JPG, PDF up to 10MB each</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} className="h-7 text-[9px] rounded-xl">Back</Button>
              <Button size="sm" onClick={() => setStep(3)} className="h-7 text-[9px] rounded-xl">Preview & Submit</Button>
            </div>
          </div>
        </SectionCard>
      )}

      {step === 3 && (
        <SectionCard title="Review & Submit" className="!rounded-2xl">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-muted/20 space-y-2 text-[9px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-medium">{category}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><Badge variant="outline" className="text-[7px] rounded-md">{priority}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Subject</span><span className="font-medium">Cannot withdraw funds</span></div>
              <div><span className="text-muted-foreground block mb-1">Description</span><p className="text-[8px]">I've been trying to withdraw my earnings for 3 days but the button says 'processing'...</p></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Attachments</span><span className="font-medium flex items-center gap-0.5"><Paperclip className="h-2.5 w-2.5" />2 files</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Expected Response</span><span className="font-medium">Within 24 hours</span></div>
            </div>
            <div className="p-2.5 rounded-xl bg-[hsl(var(--gigvora-amber)/0.08)] border border-[hsl(var(--gigvora-amber)/0.2)] flex gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0 mt-0.5" />
              <p className="text-[8px] text-[hsl(var(--gigvora-amber))]">By submitting, you agree to share relevant account information with our support team to help resolve your issue.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep(2)} className="h-7 text-[9px] rounded-xl">Edit</Button>
              <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Send className="h-3 w-3" />Submit Ticket</Button>
            </div>
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
