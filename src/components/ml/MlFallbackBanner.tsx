/**
 * FD-12 — Sitewide fallback indicator.
 *
 * Renders a slim, dismissible banner whenever one or more ML bridges are
 * serving deterministic fallbacks (Python ML service down, circuit open, or
 * sustained schema/timeout errors). Operators see at a glance which surfaces
 * are degraded.
 */
import { useMemo, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useMlFallbackStatus } from "@/hooks/useMlFallbackStatus";

interface MlFallbackBannerProps {
  /** Hide entirely below this fallback rate. Default 5%. */
  threshold?: number;
  /** Only render for users with the operator/admin role. */
  visibleToRole?: "admin" | "operator" | "any";
  className?: string;
}

export function MlFallbackBanner({ threshold = 0.05, className = "" }: MlFallbackBannerProps) {
  const status = useMlFallbackStatus();
  const [dismissed, setDismissed] = useState(false);

  const degraded = useMemo(
    () =>
      status.endpoints
        .filter((e) => e.total >= 5 && (e.fallbackRate >= threshold || e.circuit === "open"))
        .sort((a, b) => b.fallbackRate - a.fallbackRate)
        .slice(0, 6),
    [status.endpoints, threshold],
  );

  if (status.loading || dismissed || degraded.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="ml-fallback-banner"
      className={`flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-100 ${className}`}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          ML running on deterministic fallback ({degraded.length} surface{degraded.length === 1 ? "" : "s"})
        </p>
        <p className="mt-0.5 text-xs opacity-80">
          Results remain explainable, but learned ranking/scoring is offline. Engineers have been notified.
        </p>
        <ul className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
          {degraded.map((e) => (
            <li
              key={e.endpoint}
              className="rounded-full bg-amber-200/70 px-2 py-0.5 font-mono dark:bg-amber-800/60"
              title={`${Math.round(e.fallbackRate * 100)}% fallback over last ${e.total} calls`}
            >
              {e.endpoint}
              {e.circuit === "open" ? " · ⚡" : ""}
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
        className="rounded-md p-1 text-amber-900/70 transition hover:bg-amber-200/60 hover:text-amber-900 dark:text-amber-100/70 dark:hover:bg-amber-800/60"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

export default MlFallbackBanner;
