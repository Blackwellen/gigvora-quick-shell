import React from 'react';
import { AlertCircle, Loader2, Search, WifiOff } from 'lucide-react';

export function SearchEmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-[var(--card-radius-lg)] border border-dashed bg-card px-4 py-6 text-center">
      <Search className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
      <p className="text-[11px] font-medium">{label}</p>
    </div>
  );
}

export function SearchLoadingState({ label = 'Loading search…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

export function SearchErrorState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-[10px] text-destructive flex items-center gap-2">
      <AlertCircle className="h-3.5 w-3.5" />
      <span>{label}</span>
    </div>
  );
}

export function SearchOfflineState() {
  return (
    <div className="rounded-xl border px-3 py-2 text-[10px] text-muted-foreground flex items-center gap-2 bg-card">
      <WifiOff className="h-3.5 w-3.5" />
      <span>Preview data only until the live API is configured.</span>
    </div>
  );
}