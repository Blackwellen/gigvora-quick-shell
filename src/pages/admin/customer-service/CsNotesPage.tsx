import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Pin, Plus, StickyNote } from 'lucide-react';
import { CsBackLink, CsPageHeader, CsPageShell } from './_shared';
import { toast } from 'sonner';

const NOTES = [
  { id: 'n1', title: 'EU payments — known delay', body: 'Stripe is reporting elevated decline rates from BNP cards. Ship Notice NT-0019 and apologize when surfaced.', author: 'Lead · Park', time: '12m', pinned: true, tag: 'runbook' },
  { id: 'n2', title: 'VIP account — AceCorp', body: 'Always escalate to Enterprise CS. Refund cap removed. CC: finance-vip@.', author: 'Chen', time: '1h', pinned: true, tag: 'vip' },
  { id: 'n3', title: 'Watchlist — fraudster pattern', body: 'IP cluster from AS14061 + same shipping address + multiple new accounts. Auto-flag for T&S.', author: 'Trust & Safety', time: '3h', pinned: false, tag: 't&s' },
  { id: 'n4', title: 'Reopen >3 → escalate', body: 'If a ticket has been reopened 3+ times, escalate to Lead automatically; do not resolve unilaterally.', author: 'Lead · Rivera', time: '1d', pinned: false, tag: 'policy' },
];

const CsNotesPage: React.FC = () => {
  const [notes, setNotes] = useState(NOTES);
  return (
    <CsPageShell>
      <CsBackLink />
      <CsPageHeader
        eyebrow="Internal Notes" title="Notes & runbooks"
        subtitle="Cross-ticket internal notes, pinned advisories, and standing runbooks for shift operators."
        right={<Button size="sm" className="h-8 text-xs" onClick={() => toast.info('Compose drawer wired in next pass')}><Plus className="h-3.5 w-3.5 mr-1" /> New note</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {notes.map((n) => (
          <div key={n.id} className={cn('rounded-xl border bg-card p-4', n.pinned && 'border-amber-500/40 bg-amber-500/5')}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {n.pinned && <Pin className="h-3.5 w-3.5 text-amber-600" />}
                <h3 className="text-sm font-semibold">{n.title}</h3>
              </div>
              <Badge variant="outline" className="text-[10px] capitalize">{n.tag}</Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{n.body}</p>
            <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{n.author} · {n.time} ago</span>
              <button onClick={() => setNotes(notes.map(x => x.id === n.id ? { ...x, pinned: !x.pinned } : x))}
                className="hover:text-foreground inline-flex items-center gap-1">
                <Pin className="h-3 w-3" /> {n.pinned ? 'Unpin' : 'Pin'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </CsPageShell>
  );
};

export default CsNotesPage;
