# Domain 67 — Customer Service Dashboard, Ticket Queues, Resolution Operations

## Surfaces
- Internal: `/internal/customer-service` (CustomerServiceDashboardPage), `/help/advisor`.
- Customer: `/help/submit`, `/help/tickets`, `/help/escalations`.

## Persistence
Migration `packages/db/migrations/0075_customer_service.sql` creates
`cs_tickets`, `cs_ticket_messages`, `cs_ticket_events` (append-only via trigger),
and `cs_macros` with seeded reference data.

## State machine — tickets
`draft → pending → active → (waiting_customer | escalated | resolved | closed | refunded)`
`resolved → reopened → active`. Customers may only `reopen` their own tickets.
Customer reply on `waiting_customer` auto-flips to `active`.

## Backend
NestJS module `apps/api-nest/src/modules/customer-service/` exposes
`/api/v1/customer-service/*` (JWT-guarded). Role ladder
`customer < agent < lead < trust_safety < super_admin`. Customers scoped to
own tickets; operators see all. Append-only audit on every write.

## ML + Analytics
- ML `apps/ml-python/app/customer_service.py` — `POST /customer-service/suggest-priority`
  deterministic priority scoring (urgency/finance/safety keywords). Service
  bridges to Nest with in-process fallback.
- Analytics `apps/analytics-python/app/customer_service.py` — `POST /insights`
  with locked envelope (sla_breach, urgent_open, pending_backlog, csat_low).

## SDK + Web hook
- `packages/sdk/src/customer-service.ts` typed envelopes.
- `src/hooks/useCustomerService.ts` — `useCsOverview`, `useCsTickets`,
  `useCsTicket`, `useCsMacros`, `useCsCreateTicket`, `useCsUpdateTicket`,
  `useCsTransitionTicket`, `useCsPostMessage`, `useCsSuggestPriority` —
  all with UI-preserving fixture fallback.

## Mobile
`apps/mobile-flutter/lib/features/customer_service/*` — KPI strip, insight
cards, recent tickets, FAB new-ticket action.

## Tests
Playwright `tests/playwright/customer-service.spec.ts` — 6 surface mounts.
