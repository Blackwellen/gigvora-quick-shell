import React from 'react';
import { ModPageShell, ModPageHeader, ModBackLink } from './_shared';

const channels = [
  { name: '#mod-triage', last: 'Pinned: Daily standup at 09:30', unread: 3 },
  { name: '#mod-escalations', last: 'r.kahan: legal please weigh in', unread: 1 },
  { name: '#trust-safety', last: 'a.fenton: new ML threshold deployed', unread: 0 },
  { name: '#weekend-cover', last: 's.osei: covering 22:00–02:00', unread: 0 },
];

export default function ModInternalChatPage() {
  return (
    <ModPageShell>
      <ModBackLink />
      <ModPageHeader eyebrow="Internal" title="Internal Chat" subtitle="Moderator-only channels for triage, escalation, handover, and weekend cover." />
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
        <div className="rounded-xl border bg-card divide-y">
          {channels.map((c) => (
            <button key={c.name} className="w-full text-left px-4 py-3 hover:bg-muted/30 flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium">{c.name}</div>
                <div className="text-[11px] text-muted-foreground line-clamp-1">{c.last}</div>
              </div>
              {c.unread > 0 && <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">{c.unread}</span>}
            </button>
          ))}
        </div>
        <div className="rounded-xl border bg-card flex flex-col h-[520px]">
          <div className="border-b px-4 py-3 text-[13px] font-medium">#mod-triage</div>
          <div className="flex-1 px-4 py-3 space-y-3 text-[13px]">
            <div><span className="text-muted-foreground">a.fenton · 09:31 ·</span> Morning team — 6 SLA breached, 2 high-risk in queue.</div>
            <div><span className="text-muted-foreground">r.kahan · 09:33 ·</span> Picking up MOD-9270, IP complaint.</div>
            <div><span className="text-muted-foreground">s.osei · 09:34 ·</span> I'll cover comments + reels.</div>
          </div>
          <div className="border-t px-4 py-3 flex items-center gap-2">
            <input className="flex-1 bg-muted/30 rounded-lg px-3 py-2 text-[13px] focus:outline-none" placeholder="Message #mod-triage" />
            <button className="rounded-lg bg-primary text-primary-foreground text-[12px] font-medium px-3 py-2">Send</button>
          </div>
        </div>
      </div>
    </ModPageShell>
  );
}
