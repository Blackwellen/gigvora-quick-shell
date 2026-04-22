import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Send, Hash } from 'lucide-react';
import { CsBackLink, CsPageHeader, CsPageShell } from './_shared';
import { toast } from 'sonner';

const CHANNELS = [
  { id: 'cs-shift', name: 'cs-shift', unread: 3 },
  { id: 'cs-billing', name: 'cs-billing', unread: 0 },
  { id: 'cs-trust', name: 'cs-trust-safety', unread: 1 },
  { id: 'cs-leads', name: 'cs-leads', unread: 0 },
  { id: 'cs-vip', name: 'cs-vip', unread: 4 },
];

const SEED_MESSAGES: Record<string, Array<{ from: string; body: string; time: string }>> = {
  'cs-shift': [
    { from: 'Park', body: 'Morning all — picking up the urgent queue. 4 escalations open.', time: '09:02' },
    { from: 'Lin', body: 'I have the EU billing thread, ping me before refunding > $500.', time: '09:04' },
    { from: 'Rivera', body: 'CS-9200 needs T&S eyes — bank rejection looks suspicious.', time: '09:11' },
  ],
  'cs-billing': [{ from: 'Lin', body: 'Stripe webhook backlog cleared.', time: '08:50' }],
  'cs-trust': [{ from: 'Park', body: 'Reviewing CS-9176 reinstatement. Need ID re-verify.', time: '09:08' }],
  'cs-leads': [{ from: 'Chen', body: 'Daily standup at 14:00.', time: '08:45' }],
  'cs-vip': [{ from: 'Rivera', body: 'AceCorp ticket waiting > 1h — escalating.', time: '09:00' }],
};

const CsInternalChatPage: React.FC = () => {
  const [active, setActive] = useState('cs-shift');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState(SEED_MESSAGES);

  const send = () => {
    if (!draft.trim()) return;
    setMessages({ ...messages, [active]: [...(messages[active] || []), { from: 'You', body: draft, time: 'now' }] });
    setDraft('');
    toast.success('Message sent');
  };

  return (
    <CsPageShell>
      <CsBackLink />
      <CsPageHeader eyebrow="Internal Chat" title="Team chat" subtitle="Channel-based chat for shift handover, escalation collaboration, and case discussion." />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 h-[600px]">
        <div className="rounded-xl border bg-card overflow-hidden flex flex-col">
          <div className="p-3 border-b text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Channels</div>
          <div className="flex-1 overflow-y-auto">
            {CHANNELS.map((c) => (
              <button key={c.id} onClick={() => setActive(c.id)}
                className={cn('w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-muted/40 transition-colors',
                  active === c.id && 'bg-muted/60')}>
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm flex-1">{c.name}</span>
                {c.unread > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-medium">{c.unread}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b inline-flex items-center gap-2">
            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold">{active}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {(messages[active] || []).map((m, i) => (
              <div key={i}>
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-semibold">{m.from}</span>
                  <span className="text-[10px] text-muted-foreground">{m.time}</span>
                </div>
                <div className="text-sm">{m.body}</div>
              </div>
            ))}
          </div>
          <div className="border-t p-3 flex gap-2">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={`Message #${active}…`} className="h-8 text-xs" />
            <Button size="sm" onClick={send} className="h-8 text-xs"><Send className="h-3 w-3" /></Button>
          </div>
        </div>
      </div>
    </CsPageShell>
  );
};

export default CsInternalChatPage;
