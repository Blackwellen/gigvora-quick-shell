import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsBadge } from './_shared';

export default function OpsCustomerChatPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Customer" title="Customer Chat" subtitle="Direct admin-to-customer conversations for executive escalations and partnership matters." right={<OpsBadge tone="info">Policy-gated</OpsBadge>} />
      <div className="rounded-xl border bg-card p-6">
        <div className="text-[13px] text-muted-foreground mb-4">Open conversations: 2 · Awaiting reply: 0</div>
        <ul className="divide-y">
          {[
            ['Acme Co. (Enterprise)', 'Question about contract addendum', '12m ago', 'open'],
            ['Lyra Labs (Pro)', 'Custom invoice request', '1h ago', 'open'],
          ].map(([who, subj, when, st]) => (
            <li key={who as string} className="py-3 flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium">{who}</div>
                <div className="text-[12px] text-muted-foreground">{subj} · {when}</div>
              </div>
              <OpsBadge tone="neutral">{st as string}</OpsBadge>
            </li>
          ))}
        </ul>
      </div>
    </OpsPageShell>
  );
}
