/**
 * MlPipelineHealthCard — single source of truth for the "ML Pipeline Health"
 * widget shown on Trust & Safety and Moderator dashboards.
 *
 * Wired to usePipelineHealth() which reads ml_model_performance from Lovable
 * Cloud (admin-only RLS) and falls back to a deterministic snapshot so the
 * card never blanks for non-admin previews.
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { usePipelineHealth } from '@/hooks/useMlPipeline';

export function MlPipelineHealthCard({ compact = true }: { compact?: boolean }) {
  const { data = [], isLoading } = usePipelineHealth();
  return (
    <div>
      <div className="text-[9px] font-semibold mb-2">ML Pipeline Health</div>
      <div className="space-y-1">
        {isLoading && <div className="text-[8px] text-muted-foreground">Loading models…</div>}
        {data.map((m) => (
          <div key={m.model} className="flex items-center justify-between text-[8px]">
            <span className="font-medium">{m.model} v{m.version}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">{(m.uptime_pct * 100).toFixed(1)}% up</span>
              {!compact && (
                <span className="text-muted-foreground">
                  · P {(m.precision * 100).toFixed(0)}% / R {(m.recall * 100).toFixed(0)}%
                </span>
              )}
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  m.band === 'green' ? 'bg-emerald-500' : m.band === 'amber' ? 'bg-amber-500' : 'bg-red-500',
                )}
                aria-label={`band ${m.band}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
