import React from 'react';
import { ModPageShell, ModPageHeader, ModBackLink, ModBadge } from './_shared';

const feed = [
  { id: 'p_8821', who: '@sarah_io', body: 'Excited to share our new product launch! 🚀', signals: 0, tone: 'neutral' as const },
  { id: 'p_8820', who: '@mark.k', body: '$$$ Buy followers cheap link in bio $$$', signals: 4, tone: 'danger' as const },
  { id: 'p_8819', who: '@designcraft', body: 'Hiring senior product designer — DM me', signals: 0, tone: 'neutral' as const },
  { id: 'p_8818', who: '@anon_99', body: '[masked: profanity-flagged content]', signals: 2, tone: 'warn' as const },
];

export default function ModLiveFeedPage() {
  return (
    <ModPageShell>
      <ModBackLink />
      <ModPageHeader eyebrow="Live" title="Live Feed Review" subtitle="Real-time public feed sampler with ML signal counts — pause, hold, or remove inline." right={<button className="rounded-lg border text-[12px] px-3 py-1.5">Pause stream</button>} />
      <div className="rounded-xl border bg-card divide-y">
        {feed.map((p) => (
          <div key={p.id} className="px-4 py-4 flex items-start gap-4">
            <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium">{p.who}</span>
                <span className="text-[11px] text-muted-foreground">{p.id}</span>
                {p.signals > 0 && <ModBadge tone={p.tone}>{p.signals} signal{p.signals === 1 ? '' : 's'}</ModBadge>}
              </div>
              <div className="text-[13px] mt-1">{p.body}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button className="text-[11px] rounded-md border px-2 py-1">Hold</button>
              <button className="text-[11px] rounded-md border px-2 py-1">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </ModPageShell>
  );
}
