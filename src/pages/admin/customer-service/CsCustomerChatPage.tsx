import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Send, MessageSquare, ArrowRightCircle } from 'lucide-react';
import { CsBackLink, CsPageHeader, CsPageShell } from './_shared';
import { toast } from 'sonner';

const SESSIONS = [
  { id: 's1', name: 'Sara Lin', lastMessage: 'Did the refund go through yet?', unread: 1, status: 'live', wait: '2m' },
  { id: 's2', name: 'Mike R.', lastMessage: 'Bank still says verification failed.', unread: 3, status: 'live', wait: '6m' },
  { id: 's3', name: 'Eva Z.', lastMessage: 'Got it, thanks!', unread: 0, status: 'live', wait: '—' },
  { id: 's4', name: 'Kai N.', lastMessage: 'Can you escalate this please?', unread: 2, status: 'live', wait: '11m' },
];

const CHAT: Record<string, Array<{ from: 'customer'|'you'|'bot'; body: string; time: string }>> = {
  s1: [
    { from: 'customer', body: 'Hi — I was charged for a cancelled gig.', time: '09:14' },
    { from: 'bot', body: 'Connecting you to an operator…', time: '09:14' },
    { from: 'you', body: 'Hi Sara — I see the cancel timestamp. Refunding $148 now.', time: '09:32' },
    { from: 'customer', body: 'Did the refund go through yet?', time: '09:42' },
  ],
};

const CsCustomerChatPage: React.FC = () => {
  const [active, setActive] = useState('s1');
  const [draft, setDraft] = useState('');

  const send = () => {
    if (!draft.trim()) return;
    toast.success('Message sent to customer');
    setDraft('');
  };

  return (
    <CsPageShell>
      <CsBackLink />
      <CsPageHeader eyebrow="Customer Chat" title="Live customer conversations" subtitle="Real-time chat with customers. Convert to ticket, escalate, or resolve inline." />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 h-[640px]">
        <div className="rounded-xl border bg-card overflow-hidden flex flex-col">
          <div className="p-3 border-b text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Live · {SESSIONS.length} active</div>
          <div className="flex-1 overflow-y-auto divide-y">
            {SESSIONS.map((s) => (
              <button key={s.id} onClick={() => setActive(s.id)}
                className={cn('w-full text-left p-3 hover:bg-muted/40 transition-colors', active === s.id && 'bg-muted/60')}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="text-[10px] text-muted-foreground">{s.wait}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">{s.lastMessage}</div>
                {s.unread > 0 && <Badge className="mt-1.5 text-[9px] bg-primary text-primary-foreground border-0">{s.unread} new</Badge>}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-semibold">{SESSIONS.find(s => s.id === active)?.name}</span>
              <Badge variant="secondary" className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0">Live</Badge>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs"><ArrowRightCircle className="h-3 w-3 mr-1" /> Convert to ticket</Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {(CHAT[active] || [{ from: 'customer' as const, body: 'Hi — chat just started.', time: 'now' }]).map((m, i) => (
              <div key={i} className={cn('max-w-[70%]', m.from === 'you' ? 'ml-auto' : '')}>
                <div className={cn('text-xs text-muted-foreground mb-0.5', m.from === 'you' && 'text-right')}>
                  {m.from === 'you' ? 'You' : m.from === 'bot' ? 'Bot' : SESSIONS.find(s => s.id === active)?.name} · {m.time}
                </div>
                <div className={cn('rounded-xl px-3.5 py-2 text-sm',
                  m.from === 'you' ? 'bg-primary text-primary-foreground' :
                  m.from === 'bot' ? 'bg-muted/60 italic text-muted-foreground' : 'bg-muted')}>
                  {m.body}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t p-3 flex gap-2">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Type to customer…" className="h-8 text-xs" />
            <Button size="sm" onClick={send} className="h-8 text-xs"><Send className="h-3 w-3" /></Button>
          </div>
        </div>
      </div>
    </CsPageShell>
  );
};

export default CsCustomerChatPage;
