import { useEffect, useMemo, useRef, useState } from 'react';
import { sdk, sdkReady } from '@/lib/gigvora-sdk';
import type { CtaExperiment, CtaVariant } from '@gigvora/sdk';

const VISITOR_KEY = 'gigvora.visitor.id';

function visitorId(): string {
  if (typeof window === 'undefined') return 'ssr';
  try {
    let v = localStorage.getItem(VISITOR_KEY);
    if (!v) { v = crypto.randomUUID(); localStorage.setItem(VISITOR_KEY, v); }
    return v;
  } catch { return 'anon'; }
}

function pickVariant(exp: CtaExperiment, vid: string): CtaVariant | null {
  if (!exp.variants?.length) return null;
  // sticky bucketing by hash(visitor + experiment)
  let h = 0;
  for (const c of `${vid}:${exp.key}`) h = ((h << 5) - h) + c.charCodeAt(0);
  const buckets = exp.variants.flatMap(v => Array(Math.max(1, v.weight)).fill(v));
  return buckets[Math.abs(h) % buckets.length] ?? exp.variants[0];
}

/**
 * useCtaExperiment — fetches an experiment, picks a variant deterministically,
 * records an impression, and returns helpers for click/convert.
 *
 * Falls back to a provided default variant when SDK isn't ready or fetch fails,
 * so the UI never blocks on telemetry.
 */
export function useCtaExperiment(key: string, fallback: { label: string; href: string }, page?: string) {
  const [variant, setVariant] = useState<CtaVariant | null>(null);
  const [experiment, setExperiment] = useState<CtaExperiment | null>(null);
  const impressionLogged = useRef(false);
  const vid = useMemo(visitorId, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!sdkReady()) return;
      try {
        const exp = await sdk.marketing.getExperiment(key);
        if (cancelled) return;
        setExperiment(exp);
        setVariant(pickVariant(exp, vid));
      } catch {
        /* leave fallback in place */
      }
    })();
    return () => { cancelled = true; };
  }, [key, vid]);

  const effective = variant
    ? { label: String(variant.payload.label ?? fallback.label), href: String(variant.payload.href ?? fallback.href) }
    : fallback;

  useEffect(() => {
    if (!experiment || !variant || impressionLogged.current || !sdkReady()) return;
    impressionLogged.current = true;
    sdk.marketing.recordCta({
      experimentKey: key, variantLabel: variant.label, eventType: 'impression',
      visitorId: vid, page: page ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
    }).catch(() => { /* ignore telemetry failure */ });
  }, [experiment, variant, key, page, vid]);

  const fire = (eventType: 'click' | 'convert') => {
    if (!experiment || !variant || !sdkReady()) return;
    sdk.marketing.recordCta({
      experimentKey: key, variantLabel: variant.label, eventType,
      visitorId: vid, page: page ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
    }).catch(() => { /* ignore */ });
  };

  return { ...effective, onClick: () => fire('click'), markConverted: () => fire('convert'), variantLabel: variant?.label ?? 'fallback' };
}
