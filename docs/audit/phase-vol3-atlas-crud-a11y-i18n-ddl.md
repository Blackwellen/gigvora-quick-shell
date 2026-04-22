# Vol 3 — Section Atlas, CRUD Scoring, WCAG, i18n/RTL, Observability, DDL Preview

> Companion to `Gigvora-Master-Audit-Vol3.docx`. Verified counts on 2026-04-22.

## Verified metrics

| Metric | Value |
|---|---|
| Total routes | 630 |
| Distinct top-level sections | 123 |
| Parameterised routes | 97 |
| Wildcard routes | 28 |
| Deep routes (3+ segments) | 102 |
| `aria-label` calls (whole repo) | 28 |
| Icon-only buttons missing `aria-label` | 171 |
| `t(...)` calls (no provider configured) | 1,798 |

## Top duplicate sections to consolidate

- `/recruiter` + `/recruiter-pro` + `/hire` → **`/hire`**
- `/enterprise-connect` + `/enterprise` → **`/enterprise`**
- `/internal/*` + `/admin/*` → **`/admin`**
- `/launchpad` (26 pages) → consolidate to ~6
- `/dashboard` (36 pages) → role-aware tabs, target ~18

## CRUD coverage today: ~all entities at 0/0/0/0 (UI only). Target = full coverage by Session 22.

## a11y — quick wins for Session 23

- Add `aria-label` to all 171 icon-only buttons
- Mark decorative SVGs `aria-hidden="true"`
- Add `:focus-visible` ring globally
- Add `<main>` + skip-link in each shell
- Add axe-core in dev only

## i18n — Phase 6 work after Sessions 1–22

- `i18next` + lazy JSON
- 10 initial locales incl. Arabic (RTL)
- Tailwind logical properties (`ms-`, `me-`, `ps-`, `pe-`)
- Per-locale email/notification templates

## Observability stack

Sentry (FE+edge) · Web Vitals · pg_stat_statements · audit_log table · synthetic /healthz cron · trace via `x-request-id`

## See DOCX for

- §1 atlas of all 123 sections
- §2 39-entity CRUD scoring table
- §3 WCAG 2.2 AA criterion-by-criterion matrix
- §4 i18n + RTL plan
- §5 observability layers
- §6 SQL DDL preview for Sessions 1, 7, 12–14, 16–17, 15+
- §7 audit exit criteria
