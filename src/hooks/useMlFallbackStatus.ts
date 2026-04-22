/**
 * FD-12 — Frontend fallback indicator.
 *
 * Polls the NestJS `/internal/ml-metrics` endpoint (already exposed by
 * MlMetricsController) and surfaces a boolean + per-endpoint breakdown so the
 * MlFallbackBanner can warn operators when any ML bridge is on its
 * deterministic path.
 */
import { useEffect, useState } from "react";

export interface MlEndpointStatus {
  endpoint: string;
  total: number;
  fallback: number;
  fallbackRate: number;
  circuit: "closed" | "open" | "half_open";
}

export interface MlFallbackStatus {
  loading: boolean;
  anyFallback: boolean;
  anyOpen: boolean;
  endpoints: MlEndpointStatus[];
  fetchedAt: number | null;
  error: string | null;
}

const ENDPOINT = "/internal/ml-metrics";

export function useMlFallbackStatus(pollMs = 30_000): MlFallbackStatus {
  const [state, setState] = useState<MlFallbackStatus>({
    loading: true,
    anyFallback: false,
    anyOpen: false,
    endpoints: [],
    fetchedAt: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const res = await fetch(ENDPOINT, {
          headers: { accept: "application/json" },
          credentials: "include",
        });
        if (!res.ok) throw new Error(`ml-metrics ${res.status}`);
        const json = (await res.json()) as {
          endpoints?: Array<{
            endpoint: string;
            total?: number;
            fallback?: number;
            circuit?: "closed" | "open" | "half_open";
          }>;
        };
        const endpoints: MlEndpointStatus[] = (json.endpoints ?? []).map((e) => {
          const total = e.total ?? 0;
          const fallback = e.fallback ?? 0;
          return {
            endpoint: e.endpoint,
            total,
            fallback,
            fallbackRate: total > 0 ? fallback / total : 0,
            circuit: e.circuit ?? "closed",
          };
        });
        if (cancelled) return;
        setState({
          loading: false,
          anyFallback: endpoints.some((e) => e.fallbackRate > 0.05 && e.total >= 5),
          anyOpen: endpoints.some((e) => e.circuit === "open"),
          endpoints,
          fetchedAt: Date.now(),
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setState((s) => ({ ...s, loading: false, error: (err as Error).message }));
      } finally {
        if (!cancelled) timer = setTimeout(tick, pollMs);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [pollMs]);

  return state;
}
