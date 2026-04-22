/**
 * IdVerifyConnectorsCard — admin-toggleable list of ID verification providers.
 *
 * Shows one row per provider (Onfido, Veriff, Persona, Stripe Identity,
 * Manual). Admin flips the switch to enable/disable. Disabled providers are
 * skipped by the backend's IDVerify routing layer; if all are disabled the
 * NestJS bridge falls back to the deterministic structural-check path so
 * verification never silently breaks.
 */
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { useIdVerifyConnectors, useToggleIdVerifyConnector } from '@/hooks/useMlPipeline';

const LABEL: Record<string, string> = {
  onfido: 'Onfido',
  veriff: 'Veriff',
  persona: 'Persona',
  stripe_identity: 'Stripe Identity',
  manual: 'Manual review',
};

export function IdVerifyConnectorsCard() {
  const { data: rows = [], isLoading } = useIdVerifyConnectors();
  const toggle = useToggleIdVerifyConnector();
  const noneEnabled = rows.length > 0 && !rows.some((r) => r.enabled);

  return (
    <div className="rounded-2xl border bg-card p-3">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="h-3.5 w-3.5 text-accent" />
        <div className="text-[10px] font-semibold">ID Verifier connectors</div>
      </div>
      {noneEnabled && (
        <div className="flex items-center gap-1.5 text-[9px] text-amber-600 mb-2">
          <AlertTriangle className="h-3 w-3" />
          All providers disabled — IDVerify falls back to deterministic checks only.
        </div>
      )}
      <div className="space-y-1.5">
        {isLoading && <div className="text-[9px] text-muted-foreground">Loading…</div>}
        {rows.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl border border-border/40 px-2.5 py-1.5">
            <div className="flex items-center gap-2">
              <div className="text-[10px] font-medium">{LABEL[c.provider] ?? c.provider}</div>
              <Badge variant="outline" className="text-[8px] h-4 px-1.5 rounded-full">priority {c.priority}</Badge>
              {c.enabled && <Badge className="text-[8px] h-4 px-1.5 rounded-full bg-emerald-600">enabled</Badge>}
            </div>
            <Switch
              checked={c.enabled}
              disabled={toggle.isPending}
              onCheckedChange={(v) => toggle.mutate({ id: c.id, enabled: v })}
              aria-label={`Toggle ${LABEL[c.provider] ?? c.provider}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
