import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Mail, Send, ArrowLeft } from 'lucide-react';
import { CsBackLink, CsPageHeader, CsPageShell } from './_shared';
import { toast } from 'sonner';

const EMAILS = [
  { id: 'e1', subject: 'Refund processed — order ORD-32108', to: 'sara.lin@…', kind: 'transactional', status: 'delivered', time: '12m' },
  { id: 'e2', subject: 'We need additional ID verification', to: 'mike.r@…', kind: 'reply', status: 'sent', time: '34m' },
  { id: 'e3', subject: 'Your enterprise quote — AceCorp', to: 'finance@acecorp', kind: 'reply', status: 'delivered', time: '1h' },
  { id: 'e4', subject: 'Account reinstatement decision', to: 'leo@…', kind: 'reply', status: 'queued', time: '2h' },
  { id: 'e5', subject: 'Subscription change confirmation', to: 'eva@…', kind: 'transactional', status: 'delivered', time: '3h' },
];

const STATUS_TONE: Record<string, string> = {
  delivered: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  sent: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  queued: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
};

const CsEmailsPage: React.FC = () => {
  const [composeOpen, setComposeOpen] = useState(false);
  const [to, setTo] = useState(''); const [subject, setSubject] = useState(''); const [body, setBody] = useState('');

  const send = () => {
    if (!to || !subject) return toast.error('To and subject required');
    toast.success(`Email queued to ${to}`);
    setTo(''); setSubject(''); setBody(''); setComposeOpen(false);
  };

  return (
    <CsPageShell>
      <CsBackLink />
      <CsPageHeader
        eyebrow="Email Console" title="Outbound emails"
        subtitle="Transactional + customer-reply email log. Compose, track delivery, retry."
        right={!composeOpen && <Button size="sm" className="h-8 text-xs" onClick={() => setComposeOpen(true)}><Mail className="h-3.5 w-3.5 mr-1" /> Compose</Button>}
      />

      {composeOpen && (
        <div className="rounded-xl border bg-card p-4 mb-4">
          <button onClick={() => setComposeOpen(false)} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3">
            <ArrowLeft className="h-3 w-3" /> Cancel
          </button>
          <div className="space-y-2">
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="To" className="h-8 text-xs" />
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="h-8 text-xs" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body…"
              className="w-full min-h-[140px] rounded-md border bg-background p-2.5 text-sm" />
            <div className="flex justify-end"><Button size="sm" onClick={send} className="h-8 text-xs"><Send className="h-3 w-3 mr-1" /> Send</Button></div>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_180px_100px_100px_60px] gap-3 px-4 py-2.5 border-b bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <div>Subject</div><div>To</div><div>Kind</div><div>Status</div><div>Sent</div>
        </div>
        {EMAILS.map((e) => (
          <div key={e.id} className="grid grid-cols-[1fr_180px_100px_100px_60px] gap-3 px-4 py-3 border-b last:border-0 items-center hover:bg-muted/30 transition-colors">
            <div className="text-sm font-medium truncate">{e.subject}</div>
            <div className="text-xs text-muted-foreground truncate">{e.to}</div>
            <div><Badge variant="outline" className="text-[10px] capitalize">{e.kind}</Badge></div>
            <div><Badge variant="secondary" className={cn('text-[10px] capitalize border-0', STATUS_TONE[e.status])}>{e.status}</Badge></div>
            <div className="text-xs text-muted-foreground tabular-nums">{e.time}</div>
          </div>
        ))}
      </div>
    </CsPageShell>
  );
};

export default CsEmailsPage;
