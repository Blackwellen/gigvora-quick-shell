import React from 'react';
import { ModPageShell, ModPageHeader, ModBackLink, ModKpiCard } from './_shared';
import { Inbox, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ModAnalyticsPage() {
  return (
    <ModPageShell>
      <ModBackLink />
      <ModPageHeader eyebrow="Analytics" title="Stats & Analytics" subtitle="Throughput, SLA, action mix, and reviewer performance across the moderation desk." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <ModKpiCard label="Items reviewed 24h" value="1,612" delta="+9%" positive icon={Inbox} />
        <ModKpiCard label="Median triage time" value="3m 14s" delta="-22s" positive icon={Clock} />
        <ModKpiCard label="Auto-resolved" value="71%" delta="+2pp" positive icon={CheckCircle2} />
        <ModKpiCard label="Escalation rate" value="4.8%" delta="-0.6pp" positive icon={AlertTriangle} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="text-[13px] font-medium mb-3">Action mix (7d)</div>
          {[['Warned', 38], ['Hidden', 26], ['Removed', 19], ['Suspended', 11], ['Banned', 4], ['No action', 2]].map(([k, v]) => (
            <div key={k as string} className="mb-2">
              <div className="flex justify-between text-[12px] mb-1"><span className="text-muted-foreground">{k}</span><span className="tabular-nums">{v}%</span></div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${v as number}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="text-[13px] font-medium mb-3">Top reviewers</div>
          <ul className="divide-y text-[13px]">
            {[['a.fenton', 312, '99.1% accuracy'], ['r.kahan', 248, '98.4% accuracy'], ['s.osei', 196, '99.6% accuracy'], ['l.park', 142, '97.8% accuracy']].map(([who, n, acc]) => (
              <li key={who as string} className="py-2 flex items-center justify-between">
                <span>{who}</span>
                <span className="text-muted-foreground tabular-nums">{n} · {acc}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ModPageShell>
  );
}
