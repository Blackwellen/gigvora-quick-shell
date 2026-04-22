import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const THREADS = [
  { id: 't1', subject: 'Spring promo creative review', from: 'Lin Park', preview: 'Posted the v3 banner — can you eyeball the CTA contrast?', unread: 2, time: '4m' },
  { id: 't2', subject: 'Q2 paid acquisition planning', from: 'Marcus Rivera', preview: 'Pulled the YoY conversion data — moving budget to LinkedIn.', unread: 0, time: '1h' },
  { id: 't3', subject: 'CR-2900 escalation — GrowthLab', from: 'Operator Kim', preview: 'Need TS review on guaranteed-returns claim before we push back.', unread: 1, time: '2h' },
  { id: 't4', subject: 'New SEO landing page brief', from: 'Maya Chen', preview: 'Drafted the brief for the "hire designers UK" cluster.', unread: 0, time: '5h' },
  { id: 't5', subject: 'Bot traffic spike from AS14061', from: 'System', preview: 'Auto-flagged 3 IPs. Your call on full block.', unread: 1, time: '6h' },
];

const MESSAGES = [
  { from: 'Lin Park', body: 'Posted the v3 banner — can you eyeball the CTA contrast?', time: '11:42' },
  { from: 'You', body: 'Looks better. The orange against navy passes WCAG AA. Approve when ready.', time: '11:48' },
  { from: 'Lin Park', body: 'Cool — pushing to ads moderation now.', time: '11:50' },
];

const MarketingInboxPage: React.FC = () => {
  const [active, setActive] = useState(THREADS[0].id);
  const [draft, setDraft] = useState('');
  const activeThread = THREADS.find((t) => t.id === active)!;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-8 py-8">
      <Link to="/admin/marketing" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketing
      </Link>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"><MessageSquare className="h-3.5 w-3.5" /> Marketing · Internal Inbox</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Internal comms</h1>
        <p className="mt-1 text-sm text-muted-foreground">Internal chat with the marketing team — one thread per campaign, escalation, or topic.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[640px]">
        <div className="rounded-xl border bg-card overflow-hidden flex flex-col">
          <div className="p-3 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inbox · 5 threads</div>
          <div className="flex-1 overflow-y-auto divide-y">
            {THREADS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={cn(
                  'w-full text-left p-3.5 hover:bg-muted/40 transition-colors',
                  active === t.id && 'bg-muted/60',
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium">{t.from}</span>
                  <span className="text-[10px] text-muted-foreground">{t.time}</span>
                </div>
                <div className="text-sm font-medium truncate">{t.subject}</div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">{t.preview}</div>
                {t.unread > 0 && (
                  <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-medium">{t.unread} unread</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card flex flex-col">
          <div className="p-4 border-b">
            <div className="text-sm font-semibold">{activeThread.subject}</div>
            <div className="text-xs text-muted-foreground mt-0.5">with {activeThread.from}</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {MESSAGES.map((m, i) => (
              <div key={i} className={cn('flex flex-col gap-1 max-w-[75%]', m.from === 'You' ? 'ml-auto items-end' : '')}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{m.from}</span> · <span>{m.time}</span>
                </div>
                <div className={cn(
                  'rounded-2xl px-4 py-2.5 text-sm',
                  m.from === 'You' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md',
                )}>{m.body}</div>
              </div>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (!draft.trim()) return; toast.success('Message sent'); setDraft(''); }} className="p-3 border-t flex items-center gap-2">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Reply…" className="flex-1" />
            <Button type="submit" size="sm"><Send className="h-3.5 w-3.5" /></Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MarketingInboxPage;
