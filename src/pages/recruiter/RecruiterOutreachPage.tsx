import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Plus, Clock, Send, Reply, Shield, ChevronRight, FileText } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const MOCK_SEQUENCES = [
  { id: '1', name: 'Senior Frontend — Cold Outreach', status: 'active' as const, contacts: 42, sent: 38, replied: 12, replyRate: 31, steps: 3 },
  { id: '2', name: 'ML Engineers — Warm Intro', status: 'active' as const, contacts: 18, sent: 18, replied: 8, replyRate: 44, steps: 2 },
  { id: '3', name: 'Engineering Managers — Follow-up', status: 'paused' as const, contacts: 25, sent: 20, replied: 5, replyRate: 25, steps: 4 },
];

const MOCK_OUTREACH = [
  { id: '1', name: 'Ana Torres', avatar: 'AT', sequence: 'Senior Frontend', step: 2, status: 'replied' as const, lastAction: '2h ago' },
  { id: '2', name: 'James Chen', avatar: 'JC', sequence: 'Senior Frontend', step: 1, status: 'sent' as const, lastAction: '4h ago' },
  { id: '3', name: 'Priya Patel', avatar: 'PP', sequence: 'ML Engineers', step: 2, status: 'opened' as const, lastAction: '1h ago' },
  { id: '4', name: 'David Kim', avatar: 'DK', sequence: 'Eng Managers', step: 3, status: 'no-reply' as const, lastAction: '2d ago' },
];

export default function RecruiterOutreachPage() {
  const [tab, setTab] = useState('sequences');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Mail className="h-4 w-4 text-[hsl(var(--gigvora-blue))]" />
          <h1 className="text-sm font-bold mr-4">Outreach Workspace</h1>
          <KPICard label="Active Sequences" value="2" />
          <KPICard label="Messages Sent" value="76" change="this week" trend="up" />
          <KPICard label="Reply Rate" value="34%" change="+6%" trend="up" />
          <KPICard label="Avg Response" value="4.2h" />
        </div>
      }
    >
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-8">
          <TabsTrigger value="sequences" className="text-[10px] px-3">Sequences</TabsTrigger>
          <TabsTrigger value="activity" className="text-[10px] px-3">Activity Feed</TabsTrigger>
          <TabsTrigger value="templates" className="text-[10px] px-3">Templates</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'sequences' && (
        <SectionCard title="Outreach Sequences" icon={<Shield className="h-3 w-3 text-muted-foreground" />}
          action={<Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" /> New Sequence</Button>}
        >
          <div className="space-y-3">
            {MOCK_SEQUENCES.map(seq => (
              <div key={seq.id} className="p-3.5 rounded-xl border border-border/40 hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{seq.name}</span>
                      <StatusBadge status={seq.status === 'active' ? 'healthy' : 'caution'} label={seq.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground">
                      <span>{seq.contacts} contacts</span>
                      <span>{seq.sent} sent</span>
                      <span>{seq.replied} replied</span>
                      <span>{seq.steps} steps</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-sm font-bold text-[hsl(var(--state-healthy))]">{seq.replyRate}%</div>
                      <div className="text-[8px] text-muted-foreground">reply rate</div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-accent" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'activity' && (
        <SectionCard title="Outreach Activity">
          <div className="space-y-2">
            {MOCK_OUTREACH.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:bg-accent/5 transition-all">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-[10px] bg-muted">{item.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-medium">{item.name}</span>
                  <div className="text-[9px] text-muted-foreground">{item.sequence} · Step {item.step}</div>
                </div>
                <StatusBadge status={item.status === 'replied' ? 'healthy' : item.status === 'opened' ? 'live' : item.status === 'sent' ? 'pending' : 'caution'} label={item.status} />
                <span className="text-[9px] text-muted-foreground">{item.lastAction}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'templates' && (
        <SectionCard title="Message Templates" action={<Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" /> New Template</Button>}>
          {['Cold Outreach — Engineer', 'Warm Intro — Referral', 'Follow-up — No Reply', 'Interview Invite', 'Offer Discussion'].map((t, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0 cursor-pointer hover:bg-accent/5 rounded-lg px-2 -mx-2">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-medium flex-1">{t}</span>
              <Button variant="ghost" size="sm" className="h-6 text-[9px]">Edit</Button>
            </div>
          ))}
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
