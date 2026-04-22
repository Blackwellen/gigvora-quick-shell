import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  Zap, Clock, ChevronRight, MessageSquare, CheckCircle2,
  AlertTriangle, Package, Calendar, FileText, Briefcase,
  Eye, Send, Bell, BellOff, RefreshCw,
} from 'lucide-react';

type QueueFilter = 'all' | 'urgent' | 'today' | 'orders' | 'projects' | 'proposals' | 'bookings' | 'content';

interface QueueItem {
  id: string; title: string; subtitle: string; type: string; urgency: 'high' | 'medium' | 'low';
  due: string; action: string; icon: React.ElementType;
}

const QUEUE: QueueItem[] = [
  { id: 'q1', title: 'Order awaiting response', subtitle: 'Logo Design · Client: TechPulse', type: 'orders', urgency: 'high', due: '30m ago', action: 'Respond', icon: Package },
  { id: 'q2', title: 'Revision requested', subtitle: 'Brand Package · Client: GreenTech', type: 'orders', urgency: 'high', due: '2h ago', action: 'Review', icon: RefreshCw },
  { id: 'q3', title: 'Milestone due tomorrow', subtitle: 'E-commerce Redesign · Acme Corp', type: 'projects', urgency: 'high', due: 'Tomorrow', action: 'Update', icon: Briefcase },
  { id: 'q4', title: 'Booking request pending', subtitle: 'Consultation · New Client', type: 'bookings', urgency: 'medium', due: '4h ago', action: 'Confirm', icon: Calendar },
  { id: 'q5', title: 'Proposal deadline approaching', subtitle: 'Mobile App MVP · Budget: $15k', type: 'proposals', urgency: 'medium', due: '2 days', action: 'Complete', icon: FileText },
  { id: 'q6', title: 'Client message unread', subtitle: 'StartupXYZ · Re: prototype feedback', type: 'orders', urgency: 'medium', due: '6h ago', action: 'Reply', icon: MessageSquare },
  { id: 'q7', title: 'Delivery due today', subtitle: 'API Integration · DataFlow Inc', type: 'orders', urgency: 'high', due: 'Today', action: 'Deliver', icon: Send },
  { id: 'q8', title: 'Draft gig incomplete', subtitle: 'UX Audit Service · 60% complete', type: 'content', urgency: 'low', due: '—', action: 'Continue', icon: FileText },
  { id: 'q9', title: 'Payout issue', subtitle: 'Payment method needs update', type: 'orders', urgency: 'medium', due: '—', action: 'Fix', icon: AlertTriangle },
];

const FILTERS: { value: QueueFilter; label: string }[] = [
  { value: 'all', label: 'All' }, { value: 'urgent', label: 'Urgent' }, { value: 'today', label: 'Today' },
  { value: 'orders', label: 'Orders' }, { value: 'projects', label: 'Projects' }, { value: 'proposals', label: 'Proposals' },
  { value: 'bookings', label: 'Bookings' }, { value: 'content', label: 'Content' },
];

export default function ProWorkQueuePage() {
  const [filter, setFilter] = useState<QueueFilter>('all');
  const [selected, setSelected] = useState<QueueItem | null>(null);

  const filtered = QUEUE.filter(q => {
    if (filter === 'all') return true;
    if (filter === 'urgent') return q.urgency === 'high';
    if (filter === 'today') return q.due === 'Today' || q.due.includes('ago');
    return q.type === filter;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><Zap className="h-5 w-5 text-accent" /> Work Queue</h1>
        <p className="text-[11px] text-muted-foreground">Your high-priority action list — items needing your attention right now</p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="font-bold text-[hsl(var(--state-blocked))]">{QUEUE.filter(q => q.urgency === 'high').length}</span>
          <span className="text-muted-foreground">urgent</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="font-bold">{QUEUE.length}</span>
          <span className="text-muted-foreground">total items</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="font-bold text-[hsl(var(--state-caution))]">{QUEUE.filter(q => q.due === 'Today').length}</span>
          <span className="text-muted-foreground">due today</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all',
            filter === f.value ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>{f.label}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(item => (
          <div key={item.id} onClick={() => setSelected(item)} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer group">
            <div className={cn('h-2 w-2 rounded-full shrink-0', item.urgency === 'high' ? 'bg-[hsl(var(--state-blocked))]' : item.urgency === 'medium' ? 'bg-[hsl(var(--state-caution))]' : 'bg-muted-foreground/30')} />
            <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
              <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold group-hover:text-accent transition-colors">{item.title}</div>
              <div className="text-[9px] text-muted-foreground mt-0.5">{item.subtitle}</div>
            </div>
            {item.due !== '—' && <span className="text-[8px] text-muted-foreground flex items-center gap-0.5 shrink-0"><Clock className="h-2.5 w-2.5" />{item.due}</span>}
            <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl shrink-0" onClick={e => { e.stopPropagation(); }}>{item.action}</Button>
            <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed p-12 text-center">
            <CheckCircle2 className="h-8 w-8 text-[hsl(var(--state-healthy))]/20 mx-auto mb-2" />
            <div className="text-xs font-semibold text-muted-foreground">All clear!</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">No items matching this filter</div>
          </div>
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[420px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Queue Item Detail</SheetTitle></SheetHeader>
          {selected && (
            <div className="p-4 space-y-4">
              <h3 className="text-[12px] font-bold">{selected.title}</h3>
              <div className="text-[10px] text-muted-foreground">{selected.subtitle}</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Due</div><div className="text-[10px] font-semibold">{selected.due}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Urgency</div><div className="text-[10px] font-semibold capitalize">{selected.urgency}</div></div>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button size="sm" className="h-8 text-[9px] flex-1 rounded-xl">{selected.action}</Button>
                <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><BellOff className="h-3 w-3" />Snooze</Button>
                <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><MessageSquare className="h-3 w-3" />Message</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
