import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Headphones, MessageSquare, Clock, User, ArrowUpRight, CheckCircle2, AlertCircle, Tag, BarChart3 } from 'lucide-react';

const TICKETS = [
  { id: 'TKT-4001', subject: 'Cannot withdraw funds', user: 'Mike P.', priority: 'high' as const, status: 'open' as const, created: '2h ago', sla: '4h left', category: 'Finance' },
  { id: 'TKT-4002', subject: 'Account verification stuck', user: 'Ana R.', priority: 'medium' as const, status: 'in-progress' as const, created: '5h ago', sla: '19h left', category: 'Verification' },
  { id: 'TKT-4003', subject: 'Order delivery late', user: 'James K.', priority: 'low' as const, status: 'waiting' as const, created: '1d ago', sla: 'On track', category: 'Orders' },
  { id: 'TKT-4004', subject: 'Dispute resolution question', user: 'Lisa P.', priority: 'medium' as const, status: 'escalated' as const, created: '3h ago', sla: '2h left', category: 'Disputes' },
];

const prioColors = { high: 'destructive', medium: 'secondary', low: 'outline' } as const;
const statusMap = { open: 'caution', 'in-progress': 'review', waiting: 'pending', escalated: 'blocked', resolved: 'healthy' } as const;

export default function AdvisorConsolePage() {
  const [tab, setTab] = useState('queue');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Headphones className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Advisor Console</h1>
          <KPICard label="My Queue" value="4" />
          <KPICard label="Avg Response" value="18m" />
          <KPICard label="Resolved Today" value="12" />
          <KPICard label="CSAT" value="4.7" />
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Quick Replies">
            <div className="space-y-1">
              {[
                'Thank you for contacting us...',
                'I understand your concern...',
                'Let me escalate this to...',
                'Your issue has been resolved...',
              ].map((r, i) => (
                <Button key={i} variant="ghost" size="sm" className="w-full justify-start h-auto py-1.5 text-[9px] text-left">{r}</Button>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Knowledge Base">
            <div className="space-y-1">
              {['Withdrawal process', 'Verification steps', 'Dispute guidelines', 'Refund policy'].map((a, i) => (
                <Button key={i} variant="outline" size="sm" className="w-full justify-start h-6 text-[9px] gap-1"><Tag className="h-2.5 w-2.5" />{a}</Button>
              ))}
            </div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-48"
    >
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-8">
          <TabsTrigger value="queue" className="text-[10px] px-3">My Queue ({TICKETS.length})</TabsTrigger>
          <TabsTrigger value="active" className="text-[10px] px-3">Active Ticket</TabsTrigger>
          <TabsTrigger value="history" className="text-[10px] px-3">History</TabsTrigger>
          <TabsTrigger value="metrics" className="text-[10px] px-3">Metrics</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'queue' && (
        <SectionCard>
          {TICKETS.map(t => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:border-accent/30 transition-all cursor-pointer mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge variant="outline" className="text-[8px] h-3.5 font-mono">{t.id}</Badge>
                  <span className="text-[11px] font-semibold">{t.subject}</span>
                  <StatusBadge status={statusMap[t.status]} label={t.status} />
                  <Badge variant={prioColors[t.priority]} className="text-[8px] h-3.5 capitalize">{t.priority}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                  <span><User className="h-2.5 w-2.5 inline" /> {t.user}</span>
                  <span><Clock className="h-2.5 w-2.5 inline" /> {t.created}</span>
                  <span>SLA: {t.sla}</span>
                  <Badge variant="outline" className="text-[7px] h-3">{t.category}</Badge>
                </div>
              </div>
              <Button size="sm" className="h-6 text-[9px]">Open</Button>
            </div>
          ))}
        </SectionCard>
      )}

      {tab === 'active' && (
        <div className="space-y-4">
          <SectionCard title="TKT-4001 — Cannot withdraw funds">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="h-5 w-5"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">MP</AvatarFallback></Avatar>
                  <span className="text-[10px] font-medium">Mike P.</span>
                  <span className="text-[8px] text-muted-foreground">2h ago</span>
                </div>
                <p className="text-[10px] text-muted-foreground">"I've been trying to withdraw my earnings for 3 days but the button says 'processing' and nothing happens. My balance shows $1,200."</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-[9px] font-medium mb-1">System Info</div>
                <div className="space-y-0.5 text-[9px] text-muted-foreground">
                  <div>Account: mike.p@email.com • Verified ✓ • Member since Jan 2025</div>
                  <div>Balance: $1,200.00 • Last withdrawal: Mar 28 ($800)</div>
                  <div>Payment method: Bank transfer (Chase ****4521)</div>
                </div>
              </div>
              <Textarea placeholder="Type your response..." className="min-h-[80px] text-xs" />
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-[10px] gap-1"><MessageSquare className="h-3 w-3" /> Reply</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><ArrowUpRight className="h-3 w-3" /> Escalate</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><CheckCircle2 className="h-3 w-3" /> Resolve</Button>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'history' && (
        <SectionCard title="Resolved Tickets">
          {[
            { id: 'TKT-3998', subject: 'Password reset help', resolved: '4h ago', csat: 5 },
            { id: 'TKT-3995', subject: 'Invoice download issue', resolved: '8h ago', csat: 4 },
            { id: 'TKT-3990', subject: 'Gig visibility question', resolved: '1d ago', csat: 5 },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0 text-[10px]">
              <Badge variant="outline" className="text-[8px] h-3.5 font-mono">{t.id}</Badge>
              <span className="flex-1 font-medium">{t.subject}</span>
              <span className="text-muted-foreground">{t.resolved}</span>
              <span>⭐ {t.csat}</span>
            </div>
          ))}
        </SectionCard>
      )}

      {tab === 'metrics' && (
        <div className="grid grid-cols-2 gap-4">
          <SectionCard title="Response Times"><div className="h-36 bg-muted/30 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">[Chart: Response time distribution]</div></SectionCard>
          <SectionCard title="Resolution Rate"><div className="h-36 bg-muted/30 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">[Chart: Daily resolution rate]</div></SectionCard>
          <SectionCard title="Category Distribution"><div className="h-36 bg-muted/30 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">[Chart: Ticket categories]</div></SectionCard>
          <SectionCard title="CSAT Trend"><div className="h-36 bg-muted/30 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">[Chart: CSAT over time]</div></SectionCard>
        </div>
      )}
    </DashboardLayout>
  );
}
