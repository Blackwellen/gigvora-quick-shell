import React, { useState } from 'react';
import { KPIBand, KPICard, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, ChevronRight, Clock, Eye, MessageSquare,
  Shield, AlertCircle, CheckCircle2, XCircle, ExternalLink,
  DollarSign, Users,
} from 'lucide-react';

type TicketSeverity = 'critical' | 'high' | 'medium' | 'low';
type TicketStatus = 'open' | 'in-progress' | 'escalated' | 'resolved';
type TicketType = 'support' | 'dispute' | 'billing' | 'compliance' | 'trust';

interface Ticket {
  id: string; title: string; type: TicketType; severity: TicketSeverity;
  status: TicketStatus; owner: string; sla: string; updated: string;
}

const TICKETS: Ticket[] = [
  { id: 'TK-4201', title: 'Vendor delivery dispute — DataOps contract', type: 'dispute', severity: 'critical', status: 'escalated', owner: 'Legal', sla: 'Breached', updated: '1h ago' },
  { id: 'TK-4198', title: 'Billing discrepancy — Q1 invoice overcharge', type: 'billing', severity: 'high', status: 'open', owner: 'Finance', sla: '4h left', updated: '3h ago' },
  { id: 'TK-4195', title: 'Access issue — SSO integration failure', type: 'support', severity: 'high', status: 'in-progress', owner: 'IT', sla: '12h left', updated: '6h ago' },
  { id: 'TK-4190', title: 'Compliance review — GDPR data handling', type: 'compliance', severity: 'medium', status: 'open', owner: 'Legal', sla: '3d left', updated: 'Yesterday' },
  { id: 'TK-4185', title: 'Trust report — suspicious freelancer activity', type: 'trust', severity: 'medium', status: 'in-progress', owner: 'Trust & Safety', sla: '2d left', updated: 'Yesterday' },
  { id: 'TK-4180', title: 'Payment hold — vendor payout blocked', type: 'billing', severity: 'low', status: 'resolved', owner: 'Finance', sla: 'Met', updated: '3d ago' },
];

const SEV_COLORS: Record<TicketSeverity, string> = {
  critical: 'bg-[hsl(var(--state-blocked))]', high: 'bg-[hsl(var(--state-caution))]',
  medium: 'bg-[hsl(var(--gigvora-amber))]', low: 'bg-muted-foreground/30',
};

const STATUS_MAP: Record<TicketStatus, { badge: 'blocked' | 'caution' | 'live' | 'healthy'; label: string }> = {
  open: { badge: 'caution', label: 'Open' }, 'in-progress': { badge: 'live', label: 'In Progress' },
  escalated: { badge: 'blocked', label: 'Escalated' }, resolved: { badge: 'healthy', label: 'Resolved' },
};

export default function EntSupportRiskPage() {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Ticket | null>(null);

  const filtered = filter === 'all' ? TICKETS : filter === 'critical' ? TICKETS.filter(t => t.severity === 'critical' || t.severity === 'high') : TICKETS.filter(t => t.type === filter || t.status === filter);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-accent" /> Support & Risk</h1>
        <p className="text-[11px] text-muted-foreground">Monitor support tickets, disputes, compliance, and risk signals</p>
      </div>

      <KPIBand>
        <KPICard label="Open Tickets" value="4" change="2 urgent" trend="down" />
        <KPICard label="Escalated" value="1" change="Critical" trend="down" />
        <KPICard label="SLA Breached" value="1" change="Action needed" trend="down" />
        <KPICard label="Resolved (MTD)" value="1" />
      </KPIBand>

      {/* Critical Banner */}
      {TICKETS.some(t => t.status === 'escalated') && (
        <div className="rounded-2xl border border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.05)] p-3.5 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-[hsl(var(--state-blocked))] shrink-0" />
          <div className="flex-1">
            <div className="text-[10px] font-bold text-[hsl(var(--state-blocked))]">Critical Escalation Active</div>
            <div className="text-[9px] text-muted-foreground">Vendor delivery dispute requires immediate legal review — SLA breached</div>
          </div>
          <Button size="sm" className="h-7 text-[8px] rounded-xl">View Now</Button>
        </div>
      )}

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {['all', 'critical', 'support', 'dispute', 'billing', 'compliance', 'trust', 'resolved'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all capitalize',
            filter === f ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>{f === 'critical' ? 'Urgent' : f}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(t => {
          const sm = STATUS_MAP[t.status];
          return (
            <div key={t.id} onClick={() => setSelected(t)} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer group">
              <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', SEV_COLORS[t.severity])} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold group-hover:text-accent transition-colors">{t.title}</span>
                  <StatusBadge status={sm.badge} label={sm.label} />
                  <Badge variant="outline" className="text-[7px] rounded-lg capitalize">{t.type}</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground flex items-center gap-3">
                  <span>#{t.id}</span>
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{t.owner}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />SLA: {t.sla}</span>
                  <span>{t.updated}</span>
                </div>
              </div>
              <Badge variant="outline" className={cn('text-[7px] rounded-lg capitalize', t.severity === 'critical' && 'border-[hsl(var(--state-blocked)/0.3)] text-[hsl(var(--state-blocked))]')}>{t.severity}</Badge>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
            </div>
          );
        })}
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[420px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Ticket Detail</SheetTitle></SheetHeader>
          {selected && (
            <div className="p-4 space-y-4">
              <h3 className="text-[12px] font-bold">{selected.title}</h3>
              <div className="grid grid-cols-2 gap-2">
                {[{ l: 'ID', v: `#${selected.id}` }, { l: 'Type', v: selected.type }, { l: 'Severity', v: selected.severity }, { l: 'Owner', v: selected.owner }, { l: 'SLA', v: selected.sla }, { l: 'Updated', v: selected.updated }].map(d => (
                  <div key={d.l} className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">{d.l}</div><div className="text-[10px] font-semibold capitalize">{d.v}</div></div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Eye className="h-3 w-3" />View Full Case</Button>
                <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><MessageSquare className="h-3 w-3" />Comment</Button>
                {selected.status !== 'escalated' && <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1 text-destructive"><AlertCircle className="h-3 w-3" />Escalate</Button>}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
