# On-Call Runbook

Rota source of truth: PagerDuty `gigvora-prod`.

## Severities

| Sev | Definition | Response |
|-----|------------|----------|
| sev1 | Full outage / data loss | 5 min ack, page incident commander |
| sev2 | Major feature down | 15 min ack |
| sev3 | Degraded perf / partial outage | 1 hr ack |
| sev4 | Cosmetic / non-blocking | next business day |

## Common runbooks

- **Admin terminal not loading** — check `/admin/login` redirects, then `AdminGuard` role decode. Most leaks come from a user-shell widget mounting inside `/admin/*`; the `AdminIsolationGuard` will log to console.
- **Notification stream silent** — confirm WSS `/admin/notifications/stream?role=…` is returning 101. Polling fallback fires every 30s automatically.
- **Checkout stuck in `confirming`** — inspect the last `PAYMENT_*` event from the FSM log; if Stripe webhook missed, replay via `/admin/finance/transactions/:id/replay`.
- **Reels publishing slow** — server-side encode queue depth visible at `/admin/ops` Cross-team Triage.

## Incident lifecycle

1. Page received → ack within sev SLA.
2. Open incident in `/admin/super/incidents`.
3. Mitigate (flag flip, kill-switch, rollback) — record action in incident notes.
4. Resolve when impact is gone.
5. Post-mortem within 5 business days for sev1/sev2.
