import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Mail, Search, Send, ArrowRight, Plus, Eye, Clock, Star,
  BarChart3, Users, Zap, TrendingUp, CheckCircle2, XCircle, AlertCircle,
  FileText, Copy, Edit, Trash2, Play, Pause, MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

const SEQUENCES = [
  { id: 'sq1', name: 'Enterprise Outreach Q2', steps: 5, active: 45, delivered: 42, opened: 28, replied: 12, meetings: 4, status: 'active' as const },
  { id: 'sq2', name: 'Warm Lead Follow-up', steps: 3, active: 23, delivered: 21, opened: 15, replied: 8, meetings: 3, status: 'active' as const },
  { id: 'sq3', name: 'Event Follow-up Campaign', steps: 4, active: 67, delivered: 65, opened: 41, replied: 21, meetings: 7, status: 'active' as const },
  { id: 'sq4', name: 'Cold Outreach — CTOs', steps: 6, active: 0, delivered: 120, opened: 54, replied: 18, meetings: 5, status: 'completed' as const },
];

const TEMPLATES = [
  { id: 't1', name: 'Initial Introduction', type: 'email', opens: '45%', replies: '12%', used: 234 },
  { id: 't2', name: 'Follow-up Nudge', type: 'email', opens: '38%', replies: '8%', used: 189 },
  { id: 't3', name: 'Meeting Request', type: 'inmail', opens: '52%', replies: '18%', used: 67 },
  { id: 't4', name: 'Value Proposition', type: 'email', opens: '41%', replies: '14%', used: 145 },
  { id: 't5', name: 'Social Proof + CTA', type: 'email', opens: '48%', replies: '16%', used: 98 },
];

const INBOX = [
  { id: 'i1', name: 'Sarah Chen', subject: 'Re: Partnership opportunity', time: '2h ago', status: 'replied', company: 'TechCorp' },
  { id: 'i2', name: 'Marcus Johnson', subject: 'Re: Quick question about hiring', time: '5h ago', status: 'replied', company: 'ScaleUp' },
  { id: 'i3', name: 'Elena Rodriguez', subject: 'Re: CloudScale + Gigvora synergy', time: '1d ago', status: 'opened', company: 'CloudScale' },
  { id: 'i4', name: 'David Park', subject: 'Initial outreach — operations consulting', time: '2d ago', status: 'delivered', company: 'GrowthEngine' },
  { id: 'i5', name: 'Priya Sharma', subject: 'Meeting request for next week', time: '3d ago', status: 'bounced', company: 'NexaFlow' },
];

const STATUS_COLORS: Record<string, string> = {
  replied: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  opened: 'bg-accent/10 text-accent',
  delivered: 'bg-muted text-muted-foreground',
  bounced: 'bg-destructive/10 text-destructive',
};

const NavigatorOutreachPage: React.FC = () => {
  const topStrip = (
    <>
      <Mail className="h-4 w-4 text-primary" />
      <span className="text-xs font-semibold">Navigator — Outreach Workspace</span>
      <div className="flex-1" />
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />New Sequence</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Outreach Quota" className="!rounded-2xl">
        <div className="space-y-2 text-[9px]">
          <div><div className="flex justify-between mb-0.5"><span>InMails</span><span className="font-semibold">18/50</span></div><Progress value={36} className="h-1" /></div>
          <div><div className="flex justify-between mb-0.5"><span>Emails</span><span className="font-semibold">89/200</span></div><Progress value={44.5} className="h-1" /></div>
          <div className="text-[8px] text-muted-foreground">Resets in 18 days</div>
        </div>
      </SectionCard>
      <SectionCard title="Conversion Funnel" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {[
            { l: 'Sent', v: '248', pct: 100 },
            { l: 'Delivered', v: '241', pct: 97 },
            { l: 'Opened', v: '138', pct: 56 },
            { l: 'Replied', v: '59', pct: 24 },
            { l: 'Meetings', v: '19', pct: 8 },
          ].map(s => (
            <div key={s.l} className="flex items-center gap-2">
              <span className="w-16 text-muted-foreground">{s.l}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${s.pct}%` }} /></div>
              <span className="w-8 text-right font-semibold">{s.v}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52">
      <KPIBand className="mb-3">
        <KPICard label="Active Sequences" value="3" change="135 contacts" className="!rounded-2xl" />
        <KPICard label="Open Rate" value="56%" change="+8% vs avg" trend="up" className="!rounded-2xl" />
        <KPICard label="Reply Rate" value="24%" change="+5%" trend="up" className="!rounded-2xl" />
        <KPICard label="Meetings Booked" value="19" change="This month" className="!rounded-2xl" />
      </KPIBand>

      <Tabs defaultValue="sequences">
        <TabsList className="mb-3 flex-wrap h-auto gap-0.5">
          <TabsTrigger value="sequences" className="gap-1 text-[10px] h-7 px-2.5 rounded-xl"><Play className="h-3 w-3" />Sequences</TabsTrigger>
          <TabsTrigger value="templates" className="gap-1 text-[10px] h-7 px-2.5 rounded-xl"><FileText className="h-3 w-3" />Templates</TabsTrigger>
          <TabsTrigger value="inbox" className="gap-1 text-[10px] h-7 px-2.5 rounded-xl"><Mail className="h-3 w-3" />Inbox</TabsTrigger>
        </TabsList>

        <TabsContent value="sequences">
          <div className="space-y-2.5">
            {SEQUENCES.map(seq => (
              <div key={seq.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2.5 w-2.5 rounded-full', seq.status === 'active' ? 'bg-[hsl(var(--state-healthy))] animate-pulse' : 'bg-muted-foreground/30')} />
                    <span className="text-[12px] font-bold">{seq.name}</span>
                    <Badge variant="secondary" className="text-[7px] capitalize">{seq.status}</Badge>
                  </div>
                  <div className="flex gap-1">
                    {seq.status === 'active' && <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Pause className="h-2.5 w-2.5" />Pause</Button>}
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><MoreHorizontal className="h-3 w-3" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2 text-center text-[9px]">
                  {[
                    { l: 'Steps', v: seq.steps },
                    { l: 'Active', v: seq.active },
                    { l: 'Delivered', v: seq.delivered },
                    { l: 'Opened', v: seq.opened },
                    { l: 'Replied', v: seq.replied },
                    { l: 'Meetings', v: seq.meetings },
                  ].map(m => (
                    <div key={m.l} className="rounded-xl bg-muted/30 p-2">
                      <div className="text-sm font-bold">{m.v}</div>
                      <div className="text-[8px] text-muted-foreground">{m.l}</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t">
                  {Array.from({ length: seq.steps }).map((_, i) => (
                    <React.Fragment key={i}>
                      <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold', i < 3 ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground')}>{i + 1}</div>
                      {i < seq.steps - 1 && <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="space-y-2">
            {TEMPLATES.map(t => (
              <div key={t.id} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all group">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold group-hover:text-accent transition-colors">{t.name}</div>
                  <div className="text-[9px] text-muted-foreground">{t.type} · Used {t.used} times</div>
                </div>
                <div className="flex gap-3 text-center text-[9px] shrink-0">
                  <div><div className="font-bold">{t.opens}</div><div className="text-[7px] text-muted-foreground">Opens</div></div>
                  <div><div className="font-bold">{t.replies}</div><div className="text-[7px] text-muted-foreground">Replies</div></div>
                </div>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Copy className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Edit className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inbox">
          <div className="rounded-2xl border overflow-hidden">
            {INBOX.map((m, i) => (
              <div key={m.id} className={cn('flex items-center gap-3 p-3.5 hover:bg-muted/30 cursor-pointer transition-colors', i < INBOX.length - 1 && 'border-b')}>
                <Avatar className="h-8 w-8"><AvatarFallback className="text-[8px]">{m.name.split(' ').map(w => w[0]).join('')}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold">{m.name} <span className="text-muted-foreground font-normal">({m.company})</span></div>
                  <div className="text-[9px] text-muted-foreground truncate">{m.subject}</div>
                </div>
                <Badge className={cn('text-[7px] border-0 capitalize', STATUS_COLORS[m.status])}>{m.status}</Badge>
                <span className="text-[8px] text-muted-foreground">{m.time}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default NavigatorOutreachPage;
