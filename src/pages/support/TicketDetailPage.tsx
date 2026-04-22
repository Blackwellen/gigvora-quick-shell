import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Ticket, Clock, ArrowUpRight, CheckCircle2, MessageSquare, Paperclip, AlertCircle, ChevronRight } from 'lucide-react';

const MESSAGES = [
  { sender: 'You', initials: 'YO', time: 'Apr 12, 2:15 PM', text: "I've been trying to withdraw my earnings for 3 days but the button says 'processing' and nothing happens. My balance shows $1,200.", isAgent: false },
  { sender: 'Support Agent — Maya R.', initials: 'MR', time: 'Apr 12, 3:40 PM', text: "Hi! Thanks for reaching out. I can see your withdrawal request WTH-88421 is in a pending state. Let me investigate this with our payments team. Could you confirm the payment method you're using?", isAgent: true },
  { sender: 'You', initials: 'YO', time: 'Apr 12, 4:05 PM', text: "I'm using bank transfer to Chase ending in 4521. It's the same account I've used for all my previous withdrawals.", isAgent: false },
  { sender: 'Support Agent — Maya R.', initials: 'MR', time: 'Apr 12, 5:20 PM', text: "Thank you! I've identified the issue — there was a temporary hold due to a routine security review on your account. I've cleared the hold and re-initiated the withdrawal. You should see the funds within 2-3 business days. I apologize for the inconvenience!", isAgent: true },
];

export default function TicketDetailPage() {
  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-2 w-full">
          <Ticket className="h-4 w-4 text-accent" />
          <span className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">My Tickets</span>
          <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
          <Badge variant="outline" className="text-[8px] font-mono rounded-lg">TKT-5201</Badge>
          <StatusBadge status="review" label="In Progress" />
          <Badge variant="destructive" className="text-[7px] h-3.5">High</Badge>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><ArrowUpRight className="h-3 w-3" />Escalate</Button>
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><CheckCircle2 className="h-3 w-3" />Close</Button>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Ticket Details">
            <div className="space-y-1.5 text-[8px]">
              <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono font-medium">TKT-5201</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-medium">Payments</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><Badge variant="destructive" className="text-[6px] h-3">High</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>Apr 12, 2026</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">SLA</span><span className="font-medium text-[hsl(var(--state-healthy))]">On Track</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Agent</span><span>Maya R.</span></div>
            </div>
          </SectionCard>
          <SectionCard title="Related">
            <div className="space-y-1 text-[8px]">
              <div className="text-muted-foreground cursor-pointer hover:text-accent">WTH-88421 (Withdrawal)</div>
              <div className="text-muted-foreground cursor-pointer hover:text-accent">Order #ORD-2281</div>
            </div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-44"
    >
      <SectionCard className="!rounded-2xl mb-3">
        <h2 className="text-xs font-bold mb-1">Cannot withdraw funds — stuck on processing</h2>
        <p className="text-[8px] text-muted-foreground">Submitted Apr 12, 2026 · Payments & Billing · 4 messages</p>
      </SectionCard>

      <div className="space-y-2.5 mb-3">
        {MESSAGES.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.isAgent ? '' : 'flex-row-reverse'}`}>
            <Avatar className="h-7 w-7 shrink-0"><AvatarFallback className={`text-[7px] font-bold ${m.isAgent ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>{m.initials}</AvatarFallback></Avatar>
            <div className={`max-w-[70%] p-3 rounded-2xl ${m.isAgent ? 'bg-muted/30 border border-border/30' : 'bg-accent/10 border border-accent/20'}`}>
              <div className="flex items-center gap-2 mb-1"><span className="text-[9px] font-semibold">{m.sender}</span><span className="text-[7px] text-muted-foreground">{m.time}</span></div>
              <p className="text-[9px] text-muted-foreground leading-relaxed">{m.text}</p>
            </div>
          </div>
        ))}
      </div>

      <SectionCard className="!rounded-2xl">
        <Textarea placeholder="Type your reply..." className="min-h-[80px] text-xs mb-2" />
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Paperclip className="h-3 w-3" />Attach</Button>
          <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><MessageSquare className="h-3 w-3" />Send Reply</Button>
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
