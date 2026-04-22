import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquareReply, ChevronRight, FileText, Upload, Paperclip, Clock, AlertCircle, Send, Eye } from 'lucide-react';

const CLAIM_POINTS = [
  { point: 'Work was not delivered as specified in the contract', evidence: 'contract_agreement.pdf' },
  { point: 'Seller stopped responding after milestone 2 payment', evidence: 'chat_screenshot_01.png' },
  { point: 'Delivered files were incomplete — missing 3 of 8 pages', evidence: 'deliverable_v1.zip' },
];

export default function CounterResponsePage() {
  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-2 w-full">
          <MessageSquareReply className="h-4 w-4 text-accent" />
          <span className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">Dispute DSP-1001</span>
          <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
          <span className="text-xs font-semibold">Counter-Response</span>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 text-[8px] text-[hsl(var(--gigvora-amber))]"><Clock className="h-3 w-3" /><span className="font-medium">68h remaining to respond</span></div>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Dispute Info">
            <div className="space-y-1.5 text-[8px]">
              <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono">DSP-1001</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status="caution" label="Awaiting Response" /></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold">$4,000</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Filed by</span><span>Client (Alex M.)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Deadline</span><span className="text-[hsl(var(--gigvora-amber))]">Apr 17, 2026</span></div>
            </div>
          </SectionCard>
          <SectionCard title="Your Evidence">
            <div className="space-y-1 text-[8px]">
              <div className="text-muted-foreground">0 files uploaded</div>
              <Button variant="outline" size="sm" className="w-full h-6 text-[8px] rounded-lg gap-0.5"><Upload className="h-2.5 w-2.5" />Upload Evidence</Button>
            </div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-44"
    >
      <SectionCard title="Claimant's Case" className="!rounded-2xl mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-6 w-6"><AvatarFallback className="text-[7px] bg-muted text-muted-foreground">AM</AvatarFallback></Avatar>
          <span className="text-[10px] font-semibold">Alex M. (Client)</span>
          <span className="text-[8px] text-muted-foreground">Filed Apr 14, 2026</span>
        </div>
        <div className="space-y-2 mb-3">
          {CLAIM_POINTS.map((cp, i) => (
            <div key={i} className="flex gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/20">
              <span className="text-[9px] font-bold text-muted-foreground shrink-0">{i + 1}.</span>
              <div className="flex-1">
                <p className="text-[9px] mb-1">{cp.point}</p>
                <Badge variant="outline" className="text-[7px] rounded-md gap-0.5 cursor-pointer hover:text-accent"><FileText className="h-2 w-2" />{cp.evidence}</Badge>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Your Counter-Response" className="!rounded-2xl mb-3">
        <div className="space-y-3">
          <div className="p-2.5 rounded-xl bg-accent/5 border border-accent/20 flex gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
            <p className="text-[8px] text-accent">Address each claim point specifically. Provide evidence for your counter-arguments.</p>
          </div>

          {CLAIM_POINTS.map((cp, i) => (
            <div key={i}>
              <label className="text-[9px] font-medium mb-1 block">Response to Point {i + 1}: "{cp.point.substring(0, 40)}..."</label>
              <Textarea placeholder={`Your response to this claim...`} className="min-h-[60px] text-xs mb-1" />
              <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Paperclip className="h-2.5 w-2.5" />Attach Evidence</Button>
            </div>
          ))}

          <div>
            <label className="text-[9px] font-medium mb-1 block">Additional Statement (optional)</label>
            <Textarea placeholder="Any additional context or information..." className="min-h-[60px] text-xs" />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Eye className="h-3 w-3" />Preview</Button>
            <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Send className="h-3 w-3" />Submit Counter-Response</Button>
          </div>
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
