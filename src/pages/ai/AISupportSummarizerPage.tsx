import React, { useState } from 'react';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Headphones, Sparkles, Copy, Bookmark, MessageSquare, Clock,
  CheckCircle, Zap, AlertTriangle, TrendingUp, ArrowRight,
  Download, Mail, Shield, Users, ThumbsUp, ThumbsDown
} from 'lucide-react';

const THREADS = [
  { title: 'Payment processing issue — Order #4521', messages: 14, status: 'resolved', summary: 'Customer experienced a double charge due to payment gateway timeout. Refund of $89.99 processed within 24h. Root cause identified as race condition in checkout flow. Engineering ticket created for permanent fix.', sentiment: 'resolved', urgency: 'high', category: 'Billing' },
  { title: 'Account access recovery — User #8834', messages: 8, status: 'open', summary: 'User unable to reset password via email. Verified email deliverability issue with SendGrid. Password reset link sent via alternative method. Monitoring for resolution confirmation.', sentiment: 'neutral', urgency: 'medium', category: 'Access' },
  { title: 'Feature request — Bulk export for analytics', messages: 22, status: 'resolved', summary: 'Multiple users requesting CSV export for analytics dashboards. Feature added to Q3 roadmap. Interim workaround provided using API endpoints. 12 upvotes from other users.', sentiment: 'positive', urgency: 'low', category: 'Feature Request' },
  { title: 'Performance degradation — Dashboard loading', messages: 6, status: 'escalated', summary: 'Reports of 8-12s load times on analytics dashboard during peak hours (10am-2pm EST). Likely related to unoptimized database queries on the metrics aggregation endpoint.', sentiment: 'negative', urgency: 'critical', category: 'Performance' },
];

export default function AISupportSummarizerPage() {
  const [summarizing, setSummarizing] = useState(false);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { label: 'Summarized', value: '156', icon: CheckCircle },
          { label: 'Time Saved', value: '12h', icon: Clock, sub: 'This week' },
          { label: 'Avg Speed', value: '2.3s', icon: TrendingUp },
          { label: 'Accuracy', value: '96%', icon: Shield },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border bg-card p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <k.icon className="h-3 w-3 text-muted-foreground" />
              <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-medium">{k.label}</span>
            </div>
            <div className="text-lg font-bold">{k.value}</div>
            {k.sub && <span className="text-[8px] text-muted-foreground">{k.sub}</span>}
          </div>
        ))}
      </div>

      {/* Input */}
      <SectionCard title="Paste or Upload Thread" icon={<MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-3">
          <textarea className="w-full h-28 rounded-xl border bg-background px-3 py-2.5 text-[11px] resize-none focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Paste a support conversation, ticket thread, email chain, or chat log..." />
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={() => setSummarizing(true)} className="h-9 text-[11px] rounded-xl gap-1.5 px-5"><Sparkles className="h-3.5 w-3.5" />Summarize</Button>
            <Button variant="outline" className="h-9 text-[11px] rounded-xl gap-1.5"><Mail className="h-3.5 w-3.5" />Draft Response</Button>
            <div className="flex gap-1">
              {['Executive', 'Detailed', 'Internal Note', 'Customer-Safe'].map(s => (
                <Badge key={s} variant="outline" className="text-[8px] cursor-pointer hover:bg-accent/10 rounded-lg">{s}</Badge>
              ))}
            </div>
            <div className="flex-1" />
            <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />~3 credits</span>
          </div>
        </div>
      </SectionCard>

      {/* Summaries */}
      <div>
        <h2 className="text-[13px] font-bold mb-3">Recent Summaries</h2>
        <div className="space-y-3">
          {THREADS.map((t, i) => (
            <SectionCard key={i} className="!rounded-2xl hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] font-bold">{t.title}</span>
                  <Badge className={cn('text-[7px] border-0 rounded-lg',
                    t.status === 'resolved' ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' :
                    t.status === 'escalated' ? 'bg-[hsl(var(--state-critical)/0.1)] text-[hsl(var(--state-critical))]' :
                    'bg-accent/10 text-accent'
                  )}>{t.status}</Badge>
                  <Badge variant="outline" className="text-[7px] rounded-md">{t.category}</Badge>
                  <Badge className={cn('text-[7px] border-0 rounded-lg',
                    t.urgency === 'critical' ? 'bg-[hsl(var(--state-critical)/0.1)] text-[hsl(var(--state-critical))]' :
                    t.urgency === 'high' ? 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]' :
                    'bg-muted text-muted-foreground'
                  )}>{t.urgency} priority</Badge>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><Copy className="h-2.5 w-2.5" />Copy</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><Bookmark className="h-2.5 w-2.5" />Save</Button>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground leading-relaxed mb-2.5">{t.summary}</div>
              <div className="flex items-center gap-3 pt-2 border-t border-border/20 flex-wrap">
                <span className="text-[8px] text-muted-foreground flex items-center gap-1"><MessageSquare className="h-2.5 w-2.5" />{t.messages} messages</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-5 text-[7px] gap-0.5 rounded-lg"><ThumbsUp className="h-2.5 w-2.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-5 text-[7px] gap-0.5 rounded-lg"><ThumbsDown className="h-2.5 w-2.5" /></Button>
                </div>
                <div className="flex-1" />
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><ArrowRight className="h-2.5 w-2.5" />Escalate</Button>
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Mail className="h-2.5 w-2.5" />Draft Reply</Button>
              </div>
            </SectionCard>
          ))}
        </div>
      </div>
    </div>
  );
}
