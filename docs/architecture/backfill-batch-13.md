# Backfill batch 13 — 8K VideoViewer, Billing & Invoices, Tax & Compliance, File Storage

## VideoViewer SDK upgrade (`src/components/media/VideoViewer.tsx`)
Same component, drop-in compatible. New capabilities:
- **Device + codec + bandwidth detection** (`src/lib/media/deviceCapabilities.ts`): probes H.264/H.265/VP9/AV1, deviceMemory, hardwareConcurrency, Network Information API (`downlink`, `saveData`, `effectiveType`), HDR (`dynamic-range`/`color-gamut`), DPR + screen size. Picks max sustainable rung from 480p → 8K.
- **HLS / LL-HLS** via `hls.js` (lazy) with `lowLatencyMode` for `kind="live"`; native HLS on Safari/iOS.
- **DASH** via `dashjs` (new dep) with adaptive bitrate + manual quality override.
- **Full controls**: play/pause, ±10s seek, scrub w/ buffered bar, volume slider, mute, speed picker (0.5×–2×), quality picker (Auto + every rendition), captions, Picture-in-Picture, fullscreen.
- **Live mode**: red `LIVE` badge + "Go live" button when behind the edge.
- **Keyboard**: Space/K play, ←/→ seek 10s, M mute, F fullscreen, P PiP.
- **Capability badge** (opt-in via `showCapabilityBadge`) — useful for QA/device matrix.

## Schemas (Drizzle)
- `billing-invoices.ts` — `invoices`, `invoice_line_items`, `invoice_payments`, `recurring_subscriptions`, `credit_notes`
- `tax-compliance.ts` — `tax_registrations`, `tax_rates`, `tax_exemption_certificates`, `tax_forms_w9`, `tax_1099_forms`, `tax_calculations`
- `file-storage.ts` — `storage_buckets`, `storage_objects`, `storage_multipart_uploads`, `storage_signed_urls`, `storage_quotas`

## Migrations
`packages/db/migrations/0065_billing_invoices.sql`, `0066_tax_compliance.sql`, `0067_file_storage.sql`. All status enums constrained via CHECK; FK CASCADE on child rows; unique indexes on natural keys (invoice number, credit-note number, W-9 / 1099 dedupe key, bucket+object key); arithmetic invariants (`amount_paid_cents <= total_cents`, `completed_parts <= total_parts`).

## Flutter wiring
`apps/mobile-flutter/lib/features/backfill_batch_13/backfill_batch_13_screens.dart` — 3 screens, registered in `apps/mobile-flutter/lib/app/router.dart`:
`/billing/invoices`, `/tax/compliance`, `/storage/files`. Batch 12 routes also added in this turn (`/notifications/v2`, `/calendar/v2`, `/scheduling-links`).

## Open follow-ups
- Wire NestJS modules + repositories for batches 11–13.
- Replace any remaining VideoViewer call-sites that pass legacy props (compatible — old usage still works).
- Build the BYOK CDN signing flow on top of `storage_signed_urls`.
