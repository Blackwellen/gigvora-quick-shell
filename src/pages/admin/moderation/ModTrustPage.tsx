import React from 'react';
import { ModPageShell, ModPageHeader, ModBackLink, ModKpiCard } from './_shared';
import { ShieldCheck, Star, AlertTriangle, TrendingUp } from 'lucide-react';

export default function ModTrustPage() {
  return (
    <ModPageShell>
      <ModBackLink />
      <ModPageHeader eyebrow="Trust" title="Trust Analytics" subtitle="Trust review integration — ratings, references, verifications, and dispute tonality across the platform." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <ModKpiCard label="Trust score (avg)" value="78" delta="+1.4" positive icon={ShieldCheck} />
        <ModKpiCard label="Verified profiles" value="62%" delta="+3pp" positive icon={Star} />
        <ModKpiCard label="Disputed reviews 30d" value="48" delta="-12" positive icon={AlertTriangle} />
        <ModKpiCard label="Reference completion" value="71%" delta="+2pp" positive icon={TrendingUp} />
      </div>
      <div className="rounded-xl border bg-card p-6">
        <div className="text-[13px] font-medium mb-2">Trust dimensions (last 30d)</div>
        <div className="space-y-3">
          {[
            ['Identity', 84],
            ['Delivery', 79],
            ['Communication', 81],
            ['Quality', 76],
            ['Compliance', 89],
          ].map(([k, v]) => (
            <div key={k as string}>
              <div className="flex justify-between text-[12px] mb-1"><span className="text-muted-foreground">{k}</span><span className="tabular-nums">{v}</span></div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${v as number}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </ModPageShell>
  );
}
