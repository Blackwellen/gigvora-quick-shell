import React, { useState } from 'react';
import { FinPageShell, FinPageHeader, FinBackLink } from './_shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

const THREADS = [
  { id: 't1', customer: 'Sarah Chen', last: 'Has my refund been processed?', time: '2m ago', unread: true },
  { id: 't2', customer: 'James Patel', last: 'Where is my payout for July?', time: '14m ago', unread: true },
  { id: 't3', customer: 'Mira Singh', last: 'Can you adjust the VAT?', time: '1h ago', unread: false },
];

const FinCustomerChatPage: React.FC = () => {
  const [active, setActive] = useState('t1');
  const [draft, setDraft] = useState('');
  const thread = THREADS.find((t) => t.id === active)!;
  return (
    <FinPageShell>
      <FinBackLink />
      <FinPageHeader eyebrow="Customer Chat" title="Customer payment threads" subtitle="Direct messaging on payment, refund, and payout issues." />
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 h-[600px]">
        <div className="rounded-xl border bg-card overflow-y-auto divide-y">
          {THREADS.map((t) => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={`w-full text-left p-3 hover:bg-muted/50 ${active === t.id ? 'bg-muted/40' : ''}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{t.customer}</span>
                {t.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <div className="text-xs text-muted-foreground truncate mt-0.5">{t.last}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{t.time}</div>
            </button>
          ))}
        </div>
        <div className="rounded-xl border bg-card flex flex-col">
          <div className="border-b px-4 py-3 text-sm font-medium">{thread.customer}</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-sm bg-muted/40 rounded-lg p-3 max-w-[75%]">{thread.last}</div>
            <div className="text-sm bg-primary/10 rounded-lg p-3 max-w-[75%] ml-auto">Looking into it now — will update within 30 minutes.</div>
          </div>
          <div className="border-t p-3 flex gap-2">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Reply to customer…" className="h-9" />
            <Button size="sm"><Send className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </div>
    </FinPageShell>
  );
};
export default FinCustomerChatPage;
