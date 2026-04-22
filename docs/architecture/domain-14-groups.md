# Domain 14 — Groups, Community Hubs & Member Conversations
Backend: `apps/api-nest/src/modules/groups/`
Schema: `packages/db/src/schema/groups.ts` + migration `packages/db/migrations/0014_groups.sql`
Web hooks: `src/hooks/useGroups.ts` (envelope overlay; pages keep fixtures when API unset)
Mobile: `apps/mobile-flutter/lib/features/groups/{groups_api,groups_providers,groups_screens}.dart`
Tests: `tests/playwright/groups.spec.ts`

Lifecycle: draft → active → paused → archived (restorable). Membership states: active|pending|invited|banned|left. Posting policies: anyone|members|mods_only. Join policies: open|request|invite_only.
