import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  UserPlus, Search, Plus, CheckCircle2, Clock, XCircle,
  ArrowRight, MessageSquare, Building2, Shield, Eye,
  ChevronRight, Users, Zap,
} from 'lucide-react';

type IntroStatus = 'pending' | 'approved' | 'routing' | 'connected' | 'declined' | 'expired';
interface IntroRequest {
  id: string; from: { name: string; org: string; avatar: string };
  to: { name: string; org: string; avatar: string };
  reason: string; status: IntroStatus; requestedAt: string;
  routedVia: string | null; message: string;
}

const STATUS_COLORS: Record<IntroStatus, string> = {
  pending: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  approved: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  routing: 'bg-primary/10 text-primary',
  connected: 'bg-accent/10 text-accent',
  declined: 'bg-destructive/10 text-destructive',
  expired: 'bg-muted text-muted-foreground',
};

const INTROS: IntroRequest[] = [
  { id: 'IR-1', from: { name: 'You', org: 'Acme Corp', avatar: 'AC' }, to: { name: 'Sarah Chen', org: 'TechVentures', avatar: 'SC' }, reason: 'Partnership discussion', status: 'pending', requestedAt: '2h ago', routedVia: null, message: 'Would love to discuss potential cloud partnership opportunities.' },
  { id: 'IR-2', from: { name: 'Marcus Williams', org: 'CloudScale', avatar: 'MW' }, to: { name: 'You', org: 'Acme Corp', avatar: 'AC' }, reason: 'Integration proposal', status: 'approved', requestedAt: '1d ago', routedVia: 'Elena Rodriguez', message: 'Interested in exploring Kubernetes integration for your platform.' },
  { id: 'IR-3', from: { name: 'You', org: 'Acme Corp', avatar: 'AC' }, to: { name: 'James Park', org: 'FinanceFirst', avatar: 'JP' }, reason: 'Procurement inquiry', status: 'routing', requestedAt: '3d ago', routedVia: 'VP Partnerships', message: 'Regarding your analytics platform RFP.' },
  { id: 'IR-4', from: { name: 'Lisa Wang', org: 'DataFlow', avatar: 'LW' }, to: { name: 'You', org: 'Acme Corp', avatar: 'AC' }, reason: 'Vendor qualification', status: 'connected', requestedAt: '5d ago', routedVia: 'Head of Procurement', message: 'Request to qualify as analytics vendor for Q2 projects.' },
  { id: 'IR-5', from: { name: 'You', org: 'Acme Corp', avatar: 'AC' }, to: { name: 'Tom Harris', org: 'SecureOps', avatar: 'TH' }, reason: 'Security audit', status: 'declined', requestedAt: '1w ago', routedVia: null, message: 'Interested in your security assessment services.' },
];

const EnterpriseIntrosPage: React.FC = () => {
  const topStrip = (
    <>
      <UserPlus className="h-4 w-4 text-[hsl(var(--gigvora-amber))]" />
      <span className="text-xs font-semibold">Enterprise Intros</span>
      <div className="flex-1" />
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />Request Intro</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Routing Rules" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[
            { l: 'Partnership requests', v: 'VP Partnerships' },
            { l: 'Procurement inquiries', v: 'Head of Procurement' },
            { l: 'Technical intros', v: 'CTO' },
            { l: 'General inquiries', v: 'Admin' },
          ].map(r => (
            <div key={r.l} className="flex justify-between py-1 border-b last:border-0">
              <span className="text-muted-foreground">{r.l}</span>
              <span className="font-semibold text-[8px]">{r.v}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Stats" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Avg Response Time</span><span className="font-semibold">4.2h</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Acceptance Rate</span><span className="font-semibold text-[hsl(var(--state-healthy))]">78%</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Conversion Rate</span><span className="font-semibold">45%</span></div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Pending" value={String(INTROS.filter(i => i.status === 'pending').length)} className="!rounded-2xl" />
        <KPICard label="Connected" value={String(INTROS.filter(i => i.status === 'connected').length)} className="!rounded-2xl" />
        <KPICard label="Success Rate" value="78%" change="+5%" trend="up" className="!rounded-2xl" />
        <KPICard label="Avg Response" value="4.2h" className="!rounded-2xl" />
      </KPIBand>

      <Tabs defaultValue="all">
        <TabsList className="mb-3 h-auto gap-0.5">
          <TabsTrigger value="all" className="text-[10px] h-7 px-2.5 rounded-xl">All ({INTROS.length})</TabsTrigger>
          <TabsTrigger value="incoming" className="text-[10px] h-7 px-2.5 rounded-xl">Incoming</TabsTrigger>
          <TabsTrigger value="outgoing" className="text-[10px] h-7 px-2.5 rounded-xl">Outgoing</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-2">
            {INTROS.map(ir => (
              <div key={ir.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-7 w-7 rounded-lg"><AvatarFallback className="rounded-lg bg-accent/10 text-accent text-[8px]">{ir.from.avatar}</AvatarFallback></Avatar>
                    <div className="text-[9px]"><div className="font-semibold">{ir.from.name}</div><div className="text-[8px] text-muted-foreground">{ir.from.org}</div></div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-7 w-7 rounded-lg"><AvatarFallback className="rounded-lg bg-primary/10 text-primary text-[8px]">{ir.to.avatar}</AvatarFallback></Avatar>
                    <div className="text-[9px]"><div className="font-semibold">{ir.to.name}</div><div className="text-[8px] text-muted-foreground">{ir.to.org}</div></div>
                  </div>
                  <div className="flex-1" />
                  <Badge className={cn('text-[7px] border-0 capitalize', STATUS_COLORS[ir.status])}>{ir.status}</Badge>
                  <span className="text-[8px] text-muted-foreground">{ir.requestedAt}</span>
                </div>
                <div className="text-[9px] text-muted-foreground pl-1 mb-1.5">{ir.message}</div>
                <div className="flex items-center gap-2 text-[8px] text-muted-foreground">
                  <Badge variant="secondary" className="text-[7px]">{ir.reason}</Badge>
                  {ir.routedVia && <span className="flex items-center gap-0.5"><Shield className="h-2.5 w-2.5" />Routed via {ir.routedVia}</span>}
                </div>
                {(ir.status === 'pending' || ir.status === 'approved') && (
                  <div className="flex gap-1.5 mt-2 pt-2 border-t">
                    <Button size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" />Accept</Button>
                    <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><MessageSquare className="h-2.5 w-2.5" />Message</Button>
                    <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5 text-destructive"><XCircle className="h-2.5 w-2.5" />Decline</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="incoming"><p className="text-[9px] text-muted-foreground p-3">Incoming intro requests filtered view.</p></TabsContent>
        <TabsContent value="outgoing"><p className="text-[9px] text-muted-foreground p-3">Outgoing intro requests filtered view.</p></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default EnterpriseIntrosPage;
