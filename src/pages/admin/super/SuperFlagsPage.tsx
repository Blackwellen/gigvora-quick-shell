import React from 'react';
import { SuperPageShell, SuperPageHeader, SuperBackLink, SuperOnlyGate, SuperTable, SuperBadge, SuperCard } from './_shared';
import { Plus } from 'lucide-react';

const rows = [
  ['ff_signups_open', 'Signups Open', 'global', '100%', <SuperBadge tone="success">Active</SuperBadge>, 'a.fenton'],
  ['ff_new_messaging', 'New messaging UX', 'beta-cohort', '15%', <SuperBadge tone="info">Rolling out</SuperBadge>, 'r.kahan'],
  ['ff_recruiter_pro_v3', 'Recruiter Pro v3', 'enterprise', '40%', <SuperBadge tone="info">Rolling out</SuperBadge>, 's.osei'],
  ['ff_credits_v2', 'Credits ledger v2', 'global', '100%', <SuperBadge tone="success">Active</SuperBadge>, 'l.park'],
  ['ff_ai_writing', 'AI writing assistant', 'pro+', '60%', <SuperBadge tone="info">Rolling out</SuperBadge>, 'a.fenton'],
  ['ff_legacy_inbox', 'Legacy inbox', 'global', '0%', <SuperBadge tone="warn">Paused</SuperBadge>, 'r.kahan'],
  ['ff_emergency_chat_off', 'KILL: live chat', 'global', '0%', <SuperBadge tone="danger">Kill switch</SuperBadge>, 'super-admin'],
];

export default function SuperFlagsPage() {
  return (
    <SuperOnlyGate>
      <SuperPageShell>
        <SuperBackLink />
        <SuperPageHeader
          eyebrow="Feature Flags"
          title="Feature Flags & Rollout Controls"
          subtitle="Define, target, and gradually roll out features. Kill switches take effect within 60 seconds across all clients."
          right={<button className="rounded-lg bg-primary text-primary-foreground text-[12px] font-medium px-3 py-1.5 inline-flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> New flag</button>}
        />
        <SuperCard title="All flags" description="Status and rollout percentage. Edit target audience, percentage, or pause a flag.">
          <SuperTable headers={['Key', 'Name', 'Audience', 'Rollout', 'Status', 'Owner']} rows={rows} />
        </SuperCard>
      </SuperPageShell>
    </SuperOnlyGate>
  );
}
