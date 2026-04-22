import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Send, StickyNote, GitBranch, CheckCircle2, RotateCcw, AlertTriangle, User, Clock, Mail, Tag,
} from 'lucide-react';
import { CsBackLink, CsPageShell } from './_shared';

const CsTicketDetailPage: React.FC = () => {
  const { ticketId = 'CS-9201' } = useParams();
  const [reply, setReply] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [tab, setTab] = useState<'reply'|'note'>('reply');

  const handleSend = () => {
    if (!reply.trim()) return;
    toast.success(`Reply posted to ${ticketId}`);
    setReply('');
  };
  const handleNote = () => {
    if (!internalNote.trim()) return;
    toast.success('Internal note added');
    setInternalNote('');
  };

  const messages = [
    { from: 'Sara Lin', kind: 'customer' as const, body: 'Hi — I cancelled gig ORD-32108 yesterday and was charged anyway. Need a refund.', time: 'Today 09:14' },
    { from: 'Operator Park', kind: 'agent' as const, body: 'Hi Sara — checking now. I can see the cancel timestamp at 14:02 yesterday. Will process the refund.', time: 'Today 09:32' },
    { from: 'System', kind: 'system' as const, body: 'Refund of $148.00 initiated to card ending 4421.', time: 'Today 09:33' },
  ];

  return (
    <CsPageShell>
      <CsBackLink />
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-muted-foreground">{ticketId}</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Refund request for cancelled gig</h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border-0">High priority</Badge>
            <Badge variant="secondary" className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0">Active</Badge>
            <Badge variant="outline" className="text-[10px]">Billing queue</Badge>
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock className="h-3 w-3" /> SLA 12m</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs"><GitBranch className="h-3.5 w-3.5 mr-1" /> Escalate</Button>
          <Button size="sm" variant="outline" className="h-8 text-xs"><RotateCcw className="h-3.5 w-3.5 mr-1" /> Reassign</Button>
          <Button size="sm" className="h-8 text-xs"><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resolve</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div>
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4 border-b bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Conversation</div>
            <div className="divide-y">
              {messages.map((m, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-medium">{m.from}</span>
                    <Badge variant="outline" className="text-[9px] capitalize">{m.kind}</Badge>
                    <span className="text-[10px] text-muted-foreground ml-auto">{m.time}</span>
                  </div>
                  <div className="text-sm leading-relaxed">{m.body}</div>
                </div>
              ))}
            </div>
            <div className="border-t bg-muted/20 p-3">
              <div className="flex gap-1 mb-2">
                <Button size="sm" variant={tab === 'reply' ? 'default' : 'ghost'} className="h-7 text-xs" onClick={() => setTab('reply')}>
                  <Send className="h-3 w-3 mr-1" /> Reply to customer
                </Button>
                <Button size="sm" variant={tab === 'note' ? 'default' : 'ghost'} className="h-7 text-xs" onClick={() => setTab('note')}>
                  <StickyNote className="h-3 w-3 mr-1" /> Internal note
                </Button>
              </div>
              {tab === 'reply' ? (
                <div className="space-y-2">
                  <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to Sara…" className="min-h-[90px] text-sm" />
                  <div className="flex justify-end"><Button size="sm" onClick={handleSend} className="h-7 text-xs">Send reply</Button></div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} placeholder="Internal note (visible to operators only)…" className="min-h-[90px] text-sm bg-amber-500/5" />
                  <div className="flex justify-end"><Button size="sm" variant="secondary" onClick={handleNote} className="h-7 text-xs">Add note</Button></div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Requester</div>
            <div className="flex items-center gap-2.5 mb-2"><User className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Sara Lin</span></div>
            <div className="flex items-center gap-2.5 mb-2 text-xs text-muted-foreground"><Mail className="h-3 w-3" /> sara.lin@example.com</div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground"><Tag className="h-3 w-3" /> Pro plan · since Mar 2024</div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Linked entities</div>
            <ul className="space-y-1.5 text-xs">
              <li>Order <span className="font-mono">ORD-32108</span></li>
              <li>Gig <span className="font-mono">GIG-1184</span></li>
              <li>Refund <span className="font-mono">RF-0091</span></li>
            </ul>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Audit</div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>09:14 · ticket created</li>
              <li>09:32 · assigned → Park</li>
              <li>09:33 · refund initiated</li>
            </ul>
          </div>
        </div>
      </div>
    </CsPageShell>
  );
};

export default CsTicketDetailPage;
