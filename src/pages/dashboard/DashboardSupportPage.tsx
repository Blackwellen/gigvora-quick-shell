import React, { useState } from 'react';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  HelpCircle, Plus, Clock, ChevronRight, MessageSquare,
  CheckCircle2, AlertTriangle, Send, BookOpen, ExternalLink,
  Search, Headphones,
} from 'lucide-react';
import { toast } from 'sonner';

type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';

interface Ticket {
  id: string; subject: string; category: string; status: TicketStatus;
  created: string; lastUpdate: string; priority: 'low' | 'medium' | 'high';
}

const TICKETS: Ticket[] = [
  { id: 'T-1204', subject: 'Billing discrepancy — double charge on order GV-4521', category: 'Billing', status: 'open', created: 'Apr 12', lastUpdate: '2h ago', priority: 'high' },
  { id: 'T-1198', subject: 'Unable to reschedule booking', category: 'Bookings', status: 'pending', created: 'Apr 10', lastUpdate: '1d ago', priority: 'medium' },
  { id: 'T-1185', subject: 'How to export project files?', category: 'General', status: 'resolved', created: 'Apr 5', lastUpdate: '3d ago', priority: 'low' },
  { id: 'T-1170', subject: 'Account verification pending', category: 'Account', status: 'closed', created: 'Mar 28', lastUpdate: '1w ago', priority: 'medium' },
];

const STATUS_MAP: Record<TicketStatus, { badge: 'live' | 'caution' | 'healthy' | 'pending'; label: string }> = {
  open: { badge: 'live', label: 'Open' },
  pending: { badge: 'caution', label: 'Pending' },
  resolved: { badge: 'healthy', label: 'Resolved' },
  closed: { badge: 'pending', label: 'Closed' },
};

const HELP_ARTICLES = [
  { title: 'How to manage your bookings', category: 'Bookings' },
  { title: 'Understanding your invoice', category: 'Billing' },
  { title: 'Account security best practices', category: 'Account' },
  { title: 'Getting started with projects', category: 'Projects' },
];

const DashboardSupportPage: React.FC = () => {
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2"><HelpCircle className="h-5 w-5 text-accent" /> Support</h1>
          <p className="text-[11px] text-muted-foreground">Get help, track tickets, and find answers</p>
        </div>
        <Button size="sm" className="h-8 text-[10px] rounded-xl gap-1" onClick={() => setShowNewTicket(true)}>
          <Plus className="h-3.5 w-3.5" />New Ticket
        </Button>
      </div>

      <KPIBand>
        <KPICard label="Open Tickets" value="1" change="Action needed" trend="down" />
        <KPICard label="Pending" value="1" />
        <KPICard label="Resolved" value="1" change="This month" />
        <KPICard label="Avg Response" value="4h" />
      </KPIBand>

      {/* Ticket list */}
      <SectionCard title="Your Tickets" icon={<Headphones className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {TICKETS.map(t => {
            const sm = STATUS_MAP[t.status];
            return (
              <div key={t.id} onClick={() => setSelected(t)} className="flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0 hover:bg-muted/20 rounded-lg px-2 cursor-pointer group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-semibold truncate group-hover:text-accent transition-colors">{t.subject}</span>
                    <StatusBadge status={sm.badge} label={sm.label} />
                  </div>
                  <div className="text-[8px] text-muted-foreground flex items-center gap-2">
                    <span>#{t.id}</span>
                    <span>{t.category}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-2 w-2" />Updated {t.lastUpdate}</span>
                  </div>
                </div>
                <Badge variant="outline" className={cn('text-[7px] rounded-lg capitalize', t.priority === 'high' && 'border-[hsl(var(--state-blocked)/0.3)] text-[hsl(var(--state-blocked))]')}>{t.priority}</Badge>
                <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Help articles */}
      <SectionCard title="Help & FAQ" icon={<BookOpen className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {HELP_ARTICLES.map(a => (
            <div key={a.title} className="rounded-xl border p-3 hover:shadow-sm transition-all cursor-pointer group">
              <div className="text-[10px] font-semibold group-hover:text-accent transition-colors">{a.title}</div>
              <div className="text-[8px] text-muted-foreground mt-0.5 flex items-center gap-1"><Badge variant="outline" className="text-[7px] rounded-md">{a.category}</Badge><ExternalLink className="h-2.5 w-2.5 ml-auto text-muted-foreground/30 group-hover:text-accent transition-colors" /></div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* New ticket sheet */}
      <Sheet open={showNewTicket} onOpenChange={setShowNewTicket}>
        <SheetContent className="w-[420px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">New Support Ticket</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Category</label>
              <Select><SelectTrigger className="h-8 rounded-xl text-[10px]"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{['Billing', 'Bookings', 'Account', 'Orders', 'Projects', 'General'].map(c => <SelectItem key={c} value={c} className="text-[10px]">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-[9px] font-medium mb-1 block">Subject</label><Input placeholder="Brief summary..." className="h-8 rounded-xl text-[10px]" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Description</label><Textarea placeholder="Describe your issue..." className="rounded-xl text-[10px] min-h-24" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Priority</label>
              <Select><SelectTrigger className="h-8 rounded-xl text-[10px]"><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>{['Low', 'Medium', 'High'].map(p => <SelectItem key={p} value={p.toLowerCase()} className="text-[10px]">{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button className="w-full h-8 text-[10px] rounded-xl gap-1" onClick={() => { toast.success('Ticket submitted'); setShowNewTicket(false); }}><Send className="h-3 w-3" />Submit Ticket</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Ticket detail sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[420px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Ticket Detail</SheetTitle></SheetHeader>
          {selected && (
            <div className="p-4 space-y-4">
              <h3 className="text-[12px] font-bold">{selected.subject}</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Ticket</div><div className="text-[10px] font-semibold">#{selected.id}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Category</div><div className="text-[10px] font-semibold">{selected.category}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Created</div><div className="text-[10px] font-semibold">{selected.created}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Priority</div><div className="text-[10px] font-semibold capitalize">{selected.priority}</div></div>
              </div>
              <StatusBadge status={STATUS_MAP[selected.status].badge} label={STATUS_MAP[selected.status].label} />
              {selected.status === 'open' && (
                <div className="pt-2 border-t">
                  <Textarea placeholder="Add a reply..." className="rounded-xl text-[10px] min-h-20 mb-2" />
                  <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Send className="h-3 w-3" />Reply</Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DashboardSupportPage;
