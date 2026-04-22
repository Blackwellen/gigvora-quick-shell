import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Gavel, ArrowUp, Clock, CheckCircle2, MessageSquare, Send,
  Users, DollarSign, FileText, Shield, AlertTriangle, Scale,
  ChevronRight, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type EscLevel = 'level-1' | 'level-2' | 'level-3' | 'arbitration';
type DStatus = 'open' | 'investigating' | 'awaiting-response' | 'mediation' | 'resolved' | 'escalated';

interface Dispute {
  id: string; title: string; claimant: string; respondent: string;
  amount: string; status: DStatus; escalation: EscLevel;
  created: string; updated: string; type: string;
}

const ESC_COLORS: Record<EscLevel, string> = {
  'level-1': 'bg-accent/10 text-accent',
  'level-2': 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  'level-3': 'bg-[hsl(var(--state-live))]/10 text-[hsl(var(--state-live))]',
  arbitration: 'bg-destructive/10 text-destructive',
};

const DISPUTES: Dispute[] = [
  { id: 'DSP-0334', title: 'Escrow hold — milestone rejected by client', claimant: 'RetailPlus Co', respondent: 'Sarah Chen', amount: '$4,200', status: 'investigating', escalation: 'level-2', created: '2 hours ago', updated: '30 min ago', type: 'Milestone' },
  { id: 'DSP-0330', title: 'Incomplete delivery — missing 3 of 5 deliverables', claimant: 'Alex Morgan', respondent: 'DevCraft Studio', amount: '$1,800', status: 'mediation', escalation: 'level-3', created: '1 day ago', updated: '2 hours ago', type: 'Delivery' },
  { id: 'DSP-0328', title: 'Quality dispute — work does not match description', claimant: 'Jordan K.', respondent: 'DesignPro', amount: '$250', status: 'open', escalation: 'level-1', created: '3 hours ago', updated: '3 hours ago', type: 'Quality' },
  { id: 'DSP-0325', title: 'Refund request — service not rendered', claimant: 'Casey D.', respondent: 'Growth Hackers', amount: '$1,200', status: 'escalated', escalation: 'arbitration', created: '3 days ago', updated: '1 day ago', type: 'Refund' },
  { id: 'DSP-0320', title: 'Timeline dispute — 2 weeks overdue', claimant: 'Morgan L.', respondent: 'Agency X', amount: '$8,500', status: 'resolved', escalation: 'level-2', created: '1 week ago', updated: '2 days ago', type: 'Timeline' },
];

const THREAD = [
  { author: 'RetailPlus Co', role: 'claimant', time: '2h ago', text: 'The milestone delivery does not match the agreed scope. Three key features are missing from the prototype.' },
  { author: 'Sarah Chen', role: 'respondent', time: '1h ago', text: 'The features were descoped in our last call. I have the meeting notes and Slack messages as evidence.' },
  { author: 'R. Patel', role: 'mediator', time: '30m ago', text: 'I have reviewed the contract and meeting notes. The descoping was discussed but not formally documented in the contract amendment. Recommending partial release of funds.' },
];

export default function AdminDisputeManagementPage() {
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState<Dispute | null>(DISPUTES[0]);
  const [reply, setReply] = useState('');

  const filtered = DISPUTES.filter(d => tab === 'all' || d.status === tab);

  return (
    <DashboardLayout topStrip={
      <>
        <Gavel className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Dispute Management</span>
        <div className="flex-1" />
        <Badge variant="outline" className="text-[9px]">{DISPUTES.filter(d => d.status !== 'resolved').length} Active</Badge>
      </>
    } rightRail={selected ? (
      <div className="space-y-3">
        <SectionCard title="Dispute Info">
          <div className="space-y-1.5 text-[9px]">
            <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono font-semibold">{selected.id}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{selected.type}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold text-accent">{selected.amount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Claimant</span><span>{selected.claimant}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Respondent</span><span>{selected.respondent}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Escalation</span><Badge className={cn('text-[6px] h-3 border-0', ESC_COLORS[selected.escalation])}>{selected.escalation}</Badge></div>
          </div>
        </SectionCard>
        <SectionCard title="Escalation Actions">
          <div className="space-y-1.5">
            <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl justify-start gap-1"><ArrowUp className="h-3 w-3" /> Escalate to Next Level</Button>
            <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl justify-start gap-1"><Scale className="h-3 w-3" /> Send to Arbitration</Button>
            <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl justify-start gap-1"><DollarSign className="h-3 w-3" /> Partial Refund</Button>
            <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl justify-start gap-1"><CheckCircle2 className="h-3 w-3" /> Resolve & Close</Button>
          </div>
        </SectionCard>
        <SectionCard title="Evidence">
          <div className="space-y-1 text-[8px] text-muted-foreground">
            <p className="flex items-center gap-1"><FileText className="h-2.5 w-2.5" /> Contract_v2.pdf</p>
            <p className="flex items-center gap-1"><FileText className="h-2.5 w-2.5" /> Meeting_notes_mar12.pdf</p>
            <p className="flex items-center gap-1"><FileText className="h-2.5 w-2.5" /> Slack_export.zip</p>
          </div>
        </SectionCard>
      </div>
    ) : undefined} rightRailWidth="w-52">
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <KPICard label="Active" value={String(DISPUTES.filter(d => d.status !== 'resolved').length)} />
        <KPICard label="Arbitration" value={String(DISPUTES.filter(d => d.escalation === 'arbitration').length)} />
        <KPICard label="Total Value" value="$15.9K" />
        <KPICard label="Avg Resolution" value="3.2d" />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-3">
        <TabsList className="h-7">
          {['all', 'open', 'investigating', 'mediation', 'escalated', 'resolved'].map(t => (
            <TabsTrigger key={t} value={t} className="text-[9px] h-5 px-2 capitalize">{t}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          {filtered.map(d => (
            <button key={d.id} onClick={() => setSelected(d)} className={cn(
              'w-full p-3 rounded-xl border text-left transition-all',
              selected?.id === d.id ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : 'border-border/30 hover:border-accent/30'
            )}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-mono text-muted-foreground">{d.id}</span>
                <Badge className={cn('text-[6px] h-3 border-0', ESC_COLORS[d.escalation])}>{d.escalation}</Badge>
                <span className="text-[10px] font-bold text-accent ml-auto">{d.amount}</span>
              </div>
              <div className="text-[10px] font-semibold truncate">{d.title}</div>
              <div className="text-[8px] text-muted-foreground">{d.claimant} vs {d.respondent} · {d.updated}</div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b">
              <h3 className="text-[11px] font-bold flex-1">{selected.title}</h3>
              <Badge className={cn('text-[7px] h-3.5 border-0', ESC_COLORS[selected.escalation])}>{selected.escalation}</Badge>
            </div>
            <div className="space-y-3 mb-4">
              {THREAD.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <Avatar className="h-6 w-6 rounded-lg shrink-0">
                    <AvatarFallback className={cn('rounded-lg text-[7px] font-bold',
                      m.role === 'mediator' ? 'bg-accent/10 text-accent' : m.role === 'claimant' ? 'bg-primary/10 text-primary' : 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]'
                    )}>{m.author.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-semibold">{m.author}</span>
                      <Badge variant="outline" className="text-[6px] h-3 capitalize">{m.role}</Badge>
                      <span className="text-[7px] text-muted-foreground ml-auto">{m.time}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-3">
              <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Add mediator note or reply..." className="min-h-[80px] text-xs mb-2" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl">Internal Note</Button>
                <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Send className="h-3 w-3" /> Reply to Both Parties</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
