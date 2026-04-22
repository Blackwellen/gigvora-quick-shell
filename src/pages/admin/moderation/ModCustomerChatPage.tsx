import React from 'react';
import { ModPageShell, ModPageHeader, ModBackLink, ModBadge } from './_shared';

export default function ModCustomerChatPage() {
  return (
    <ModPageShell>
      <ModBackLink />
      <ModPageHeader eyebrow="Customer" title="Customer Chat" subtitle="Direct moderator-to-user conversations where policy permits — appeals, clarifications, and reinstatement reviews." right={<ModBadge tone="info">Policy-gated</ModBadge>} />
      <div className="rounded-xl border bg-card p-6">
        <div className="text-[13px] text-muted-foreground mb-4">Open conversations: 4 · Awaiting reply: 1</div>
        <ul className="divide-y">
          {[
            ['User #u_1182', 'Appeal on suspended account', '2m ago', 'awaiting'],
            ['User #u_4910', 'Clarification on copyright takedown', '34m ago', 'open'],
            ['User #u_2218', 'Reinstatement after KYC', '1h ago', 'open'],
            ['User #u_7733', 'Question about flagged ad', '3h ago', 'open'],
          ].map(([who, subj, when, st]) => (
            <li key={who as string} className="py-3 flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium">{who}</div>
                <div className="text-[12px] text-muted-foreground">{subj} · {when}</div>
              </div>
              <ModBadge tone={st === 'awaiting' ? 'warn' : 'neutral'}>{st as string}</ModBadge>
            </li>
          ))}
        </ul>
      </div>
    </ModPageShell>
  );
}
