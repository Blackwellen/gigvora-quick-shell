import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink } from './_shared';

const channels = [
  { name: '#admin-ops', last: 'Pinned: weekly admin standup Thursdays 11:00', unread: 2 },
  { name: '#site-control', last: 'r.kahan: deploying CMS v3.2 at 14:00', unread: 0 },
  { name: '#admin-incidents', last: 'No active incidents', unread: 0 },
  { name: '#admin-handover', last: 'a.fenton: weekend cover assigned to s.osei', unread: 1 },
];

export default function OpsInternalChatPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Internal" title="Internal Chat" subtitle="Admin-only channels for ops coordination, incident response, and handover." />
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
          <div className="border-b px-4 py-3 text-[13px] font-medium">#admin-ops</div>
          <div className="flex-1 px-4 py-3 space-y-3 text-[13px]">
            <div><span className="text-muted-foreground">a.fenton · 11:01 ·</span> Standup — finance reconciliation green, 3 ops tickets open.</div>
            <div><span className="text-muted-foreground">r.kahan · 11:02 ·</span> CMS v3.2 deploying at 14:00 — heads-up.</div>
            <div><span className="text-muted-foreground">s.osei · 11:03 ·</span> I'll cover incidents tonight.</div>
          </div>
          <div className="border-t px-4 py-3 flex items-center gap-2">
            <input className="flex-1 bg-muted/30 rounded-lg px-3 py-2 text-[13px] focus:outline-none" placeholder="Message #admin-ops" />
            <button className="rounded-lg bg-primary text-primary-foreground text-[12px] font-medium px-3 py-2">Send</button>
          </div>
        </div>
      </div>
    </OpsPageShell>
  );
}
