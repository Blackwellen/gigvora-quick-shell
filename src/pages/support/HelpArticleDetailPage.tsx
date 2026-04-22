import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { FileText, ThumbsUp, ThumbsDown, Clock, Eye, ChevronRight, MessageSquare, Share2, Bookmark, Printer } from 'lucide-react';

const RELATED = [
  'How to set up direct deposit',
  'Understanding escrow timelines',
  'What happens if a withdrawal fails',
  'Tax information for freelancers',
];

const BREADCRUMB = ['Help Center', 'Payments & Billing', 'How to withdraw earnings'];

export default function HelpArticleDetailPage() {
  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-2 w-full">
          <FileText className="h-4 w-4 text-accent" />
          {BREADCRUMB.map((b, i) => (
            <span key={i} className="flex items-center gap-1 text-[10px]">
              {i > 0 && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />}
              <span className={i === BREADCRUMB.length - 1 ? 'font-semibold' : 'text-muted-foreground cursor-pointer hover:text-foreground'}>{b}</span>
            </span>
          ))}
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Share2 className="h-2.5 w-2.5" />Share</Button>
          <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Bookmark className="h-2.5 w-2.5" />Save</Button>
          <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Printer className="h-2.5 w-2.5" />Print</Button>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Related Articles">
            {RELATED.map((r, i) => (
              <div key={i} className="py-1.5 border-b border-border/20 last:border-0 cursor-pointer hover:text-accent">
                <span className="text-[9px]">{r}</span>
              </div>
            ))}
          </SectionCard>
          <SectionCard title="Need More Help?">
            <Button size="sm" className="w-full h-7 text-[9px] rounded-xl mb-1">Submit a Ticket</Button>
            <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl">Live Chat</Button>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-48"
    >
      <SectionCard className="!rounded-2xl mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-[7px] rounded-md">Payments & Billing</Badge>
          <div className="flex items-center gap-1 text-[8px] text-muted-foreground"><Clock className="h-2.5 w-2.5" />Updated 2 days ago</div>
          <div className="flex items-center gap-1 text-[8px] text-muted-foreground"><Eye className="h-2.5 w-2.5" />4,200 views</div>
        </div>
        <h1 className="text-base font-bold mb-3">How to Withdraw Your Earnings</h1>
        <div className="prose prose-sm max-w-none text-[10px] text-muted-foreground space-y-3">
          <p>Withdrawing your earnings on Gigvora is straightforward. This guide walks you through the complete process, from setting up your payment method to tracking your withdrawal status.</p>
          <h3 className="text-[11px] font-bold text-foreground">Prerequisites</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>Verified account with completed identity verification</li>
            <li>At least one active payment method (bank account or PayPal)</li>
            <li>Minimum balance of $25.00 available for withdrawal</li>
          </ul>
          <h3 className="text-[11px] font-bold text-foreground">Step 1: Navigate to Finance Hub</h3>
          <p>Go to your Finance Hub from the main navigation. Click on "Wallet" to view your current balance and available funds.</p>
          <h3 className="text-[11px] font-bold text-foreground">Step 2: Select Withdrawal Method</h3>
          <p>Choose your preferred withdrawal method. Bank transfers typically take 3-5 business days, while PayPal transfers are usually processed within 24 hours.</p>
          <h3 className="text-[11px] font-bold text-foreground">Step 3: Enter Amount and Confirm</h3>
          <p>Enter the amount you wish to withdraw. Review the fees (if any) and confirm the transaction. You'll receive a confirmation email with tracking details.</p>
          <div className="bg-muted/30 p-3 rounded-xl border border-border/30">
            <span className="font-semibold text-foreground">💡 Pro Tip:</span> Set up scheduled withdrawals to automatically transfer funds every week or month.
          </div>
          <h3 className="text-[11px] font-bold text-foreground">Common Issues</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Withdrawal stuck on "Processing":</strong> Allow 24-48 hours. If still pending, contact support.</li>
            <li><strong>Minimum not met:</strong> Complete more orders or wait for pending funds to clear.</li>
            <li><strong>Payment method rejected:</strong> Verify your bank details are correct and the account is active.</li>
          </ul>
        </div>
      </SectionCard>

      <SectionCard className="!rounded-2xl mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold">Was this article helpful?</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><ThumbsUp className="h-3 w-3" />Yes (186)</Button>
            <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><ThumbsDown className="h-3 w-3" />No (8)</Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Comments (12)" className="!rounded-2xl">
        {[
          { user: 'Alex M.', time: '3 days ago', text: 'This guide was exactly what I needed. Withdrawal went through in 2 days!' },
          { user: 'Sarah K.', time: '1 week ago', text: 'Step 2 could mention the PayPal email verification step — tripped me up the first time.' },
        ].map((c, i) => (
          <div key={i} className="flex gap-2 py-2.5 border-b border-border/20 last:border-0">
            <Avatar className="h-6 w-6 shrink-0"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{c.user.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
            <div>
              <div className="flex items-center gap-2 mb-0.5"><span className="text-[9px] font-semibold">{c.user}</span><span className="text-[7px] text-muted-foreground">{c.time}</span></div>
              <p className="text-[9px] text-muted-foreground">{c.text}</p>
            </div>
          </div>
        ))}
        <Textarea placeholder="Add a comment..." className="mt-2 min-h-[60px] text-xs" />
        <Button size="sm" className="mt-2 h-7 text-[9px] rounded-xl gap-1"><MessageSquare className="h-3 w-3" />Post Comment</Button>
      </SectionCard>
    </DashboardLayout>
  );
}
