import React, { useState } from 'react';
import { FinPageShell, FinPageHeader, FinBackLink } from './_shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Hash } from 'lucide-react';

const CHANNELS = [
  { id: 'fin-general', name: 'fin-general', unread: 3 },
  { id: 'refunds', name: 'refunds', unread: 2 },
  { id: 'payouts', name: 'payouts', unread: 0 },
  { id: 'kyc', name: 'kyc', unread: 0 },
  { id: 'reconciliation', name: 'reconciliation', unread: 0 },
];

const MESSAGES = [
  { author: 'A. Reyes', time: '10:42', body: 'PO-9181 still on hold pending KYC docs — flagged @M. Khan.' },
  { author: 'M. Khan', time: '10:44', body: 'On it. Customer responded with passport last night.' },
  { author: 'L. Smith', time: '10:48', body: 'FYI Q3 commission rate review meeting moved to Friday 3pm.' },
  { author: 'A. Park', time: '11:02', body: 'Found the EUR FX mismatch — Stripe rate vs our cached rate is 0.4% off.' },
];

const FinInternalChatPage: React.FC = () => {
  const [active, setActive] = useState('fin-general');
  const [draft, setDraft] = useState('');
  return (
    <FinPageShell>
      <FinBackLink />
      <FinPageHeader eyebrow="Internal Chat" title="Finance team chat" subtitle="Channel-based collaboration for finance ops." />
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 h-[600px]">
        <div className="rounded-xl border bg-card p-2 overflow-y-auto">
          {CHANNELS.map((c) => (
            <button key={c.id} onClick={() => setActive(c.id)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm ${active === c.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'}`}>
              <span className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" />{c.name}</span>
              {c.unread > 0 && <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">{c.unread}</span>}
            </button>
          ))}
        </div>
        <div className="rounded-xl border bg-card flex flex-col">
          <div className="border-b px-4 py-3 text-sm font-medium flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" />{active}</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {MESSAGES.map((m, i) => (
              <div key={i} className="text-sm">
                <div className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{m.author}</span> · {m.time}</div>
                <div className="mt-0.5">{m.body}</div>
              </div>
            ))}
          </div>
          <div className="border-t p-3 flex gap-2">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message #${active}`} className="h-9" />
            <Button size="sm"><Send className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </div>
    </FinPageShell>
  );
};
export default FinInternalChatPage;
