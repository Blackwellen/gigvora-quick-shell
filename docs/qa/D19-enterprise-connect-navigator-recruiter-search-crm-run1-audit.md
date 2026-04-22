# D19 — Enterprise Connect, Navigator, Recruiter Search Intelligence & CRM Connectivity — Run 1 Audit

Date: 2026-04-18 · Group: G5 (D19/4) · Status: Run 1 (Audit) complete.

## Inventory — largest D-series domain so far (62 pages, 14,652 LOC)

### Frontend pages
- **Enterprise (18 pages, ~3.2k LOC)** — Top: EnterpriseHiringWorkspacePage **638**, EnterpriseDashboardPage **555**, EnterpriseConnectPage **480**. Plus: ConnectHomePage, ConnectSettingsPage, AnalyticsPage, ActivitySignalsPage, DirectoryPage, EventsPage, IntrosPage, MatchmakingPage, PartnerDiscoveryPage, ProcurementPage, ProfilePage, RoomsPage, SavedListsPage, StartupDetailPage, StartupShowcasePage.
- **Recruiter (22 pages, ~6.0k LOC)** — Top: RecruiterJobsPage **938**, RecruiterTalentSearchPage **794**, RecruiterInterviewsPage **698**, RecruiterManagementPage **672**, RecruiterPipelinePage **617**, RecruiterOffersPage **561**, RecruiterProPage **459**. Plus: AnalyticsPage, BillingPage, CandidateNotesPage, CandidateSearchPage, HiringTeamPage, JobWorkspacePage, MatchCenterPage, OutreachPage, OutreachTemplatesPage, ProHomePage, ScorecardsPage, SeatsPage, SettingsPage, TalentPoolsPage.
- **Hire (6 pages)** — HireCommandCenter 205, HireJobCreatePage **498**, HireScorecardsPage 309, HireSettingsPage 185, HireTalentPoolsPage 151, HireTeamPage 188. (Per `mem://features/recruitment-unification`, /hire is the unified namespace — overlap with /recruiter needs reconciliation.)
- **Sales Navigator (18 pages, ~3.2k LOC)** — Top: NavigatorTalentPage **478**, NavigatorCompanyIntelPage 314, SalesNavigatorPage 201. Plus: AccountsPage, AnalyticsPage, EngagementSignalsPage, GeoPage, GraphPage, HiringSignalsPage, LeadsPage, OutreachPage, OutreachTemplatesPage, SavedListsPage, SavedTalentListsPage, SeatsPage, SettingsPage, SignalsPage, SmartListsPage.
- **Other**: dashboard/RecruiterDashboardPage, dashboard/enterprise/EntEnterpriseConnectPage, ai/AIRecruiterAssistantPage, networking/ConnectionsHubPage, launchpad/LaunchpadEnterprisePage.

### Mock / router debt — biggest in G-series so far
- **24 of 62 pages** still on `react-router-dom`/MOCK_, including the **9 largest** (RecruiterJobsPage 938, RecruiterTalentSearchPage 794, RecruiterInterviewsPage 698, RecruiterManagementPage 672, EnterpriseHiringWorkspacePage 638, RecruiterPipelinePage 617, RecruiterOffersPage 561, EnterpriseDashboardPage 555, HireJobCreatePage 498) = **~5,971 LOC of mock/router-dom debt**.

### Backend (7 NestJS modules)
- ✅ `enterprise-connect`, `enterprise-dashboard`, `enterprise-hiring-workspace`, `recruiter-dashboard`, `recruiter-job-management`, `sales-navigator`, `search` (cross-cutting OpenSearch facade).
- ❌ Missing: `recruiter-talent-search` / `recruiter-pipeline` / `recruiter-offers` / `recruiter-outreach` / `recruiter-interviews` (RecruiterPro surfaces are 938/698/617/561 LOC each but no dedicated module — currently lumped under `recruiter-job-management`).
- ❌ Missing: `enterprise-procurement`, `enterprise-matchmaking`, `enterprise-rooms`, `enterprise-events`, `enterprise-intros`, `enterprise-partner-discovery`.
- ❌ Missing: `crm-sync` (no module to push/pull leads/contacts/deals to HubSpot/Salesforce).

### SDK
- ✅ `enterprise-connect.ts`, `recruiter-job-management.ts`, `sales-navigator.ts`.
- ❌ Missing: `enterprise-dashboard.ts`, `enterprise-hiring-workspace.ts`, `recruiter-dashboard.ts`, `search.ts` (hooks exist for some but no typed contracts).

### Hooks
- ✅ `useEnterpriseConnect`, `useEnterpriseDashboard`, `useRecruiterDashboard`, `useRecruiterJobManagement`, `useSalesNavigator`. ❌ No `useSearch`, no `useRecruiterTalentSearch`, no `useRecruiterPipeline`.

### Migrations
- ✅ 0020 enterprise-hiring-workspace · 0049 recruiter-job-management · 0051 recruiter-dashboard · 0053 enterprise-dashboard · 0070 enterprise-connect · 0072 sales-navigator.
- ⚠️ Likely-missing durable tables: `talent_pools` + `pool_members`, `boolean_search_queries` (saved query DSL), `talent_alerts` (saved-search → realtime alert), `recruiter_seats` + `seat_permissions`, `enterprise_intros` (warm-intro requests), `enterprise_rooms` (private executive rooms), `procurement_rfps` + `rfp_responses`, `partner_directory`, `crm_sync_log` + `crm_field_mappings` + `crm_sync_conflicts`, `engagement_signals` (page-views/email-opens/calls), `intent_signals` (third-party intent data e.g. Bombora/G2), `account_scores` (ICP fit + intent), `outreach_sequences` + `sequence_steps` + `sequence_enrollments`, `email_opens` + `email_clicks` + `email_replies`, `talent_personas`.

### ML / Python
- ✅ `enterprise_connect.py`, `enterprise_dashboard.py`, `recruiter_dashboard.py`, `recruiter_jobs.py`, `sales_navigator.py`, `search.py` (largest set of any G5 domain).
- ❌ Missing: `boolean_search_parser.py` (Boolean → OpenSearch DSL), `talent_match_score.py` (per-candidate fit score), `account_icp_score.py` (ICP fit), `intent_score.py`, `lookalike_companies.py`, `outreach_send_time.py` (best-time-to-send), `email_reply_classifier.py` (positive/negative/oof), `relationship_strength.py` (warm intro graph).

### Search / OpenSearch
- ✅ `apps/search-indexer/src/index.ts` — bullmq worker + 10 indexes (users, jobs, projects, gigs, services, companies, startups, media, groups, events). Mappings are minimal (`title`, `body`, `tags`, `createdAt` only).
- ❌ Missing index mappings for talent search depth: `skills`, `years_experience`, `seniority`, `current_company`, `current_title`, `location` (geo_point), `salary_band`, `availability`, `visa_status`, `languages`, `education`, `industries`, `tenure_history`, `embeddings` (k-NN dense_vector for semantic search).
- ❌ No saved-search → alert pipeline (cron diffing index → notify).
- ❌ No Boolean search DSL parser (`(java OR kotlin) AND NOT recruiter AND "san francisco"`).
- ❌ No semantic / vector search (k-NN plugin not configured).
- ❌ No relevance tuning / function_score / personalised re-ranking.

### CRM / connector posture
- ✅ `apps/integrations/src/domain-adapter-map.ts` declares `crm: optIn ['hubspot', 'salesforce']` and `ats: optIn ['hubspot', 'ashby', 'greenhouse']` for relevant domains.
- ✅ HubSpot connector available via Lovable connectors (per knowledge); Ashby connector available.
- ❌ **No actual CRM sync code** — adapters declared but no `apps/integrations/src/crm/` directory, no sync workers, no field-mapping UI, no conflict resolution, no two-way sync.
- ❌ No Salesforce, Pipedrive, Zoho, Close, Outreach.io, Salesloft, Apollo, Lusha, ZoomInfo connectors.
- ❌ No LinkedIn Sales Navigator API (note: gated; needs partner approval) — current `/sales/navigator*` is platform-native only.
- ❌ No data-enrichment provider (Clearbit, Apollo, ZoomInfo, RocketReach) for email/phone/firmographics.

### Mobile + Tests
- ✅ Mobile features for all 6 modules + recruiter_pro. ✅ 6 Playwright specs (probe-level) including `enterprise-matrix.spec.ts`.

### Tier gating (mem://features/access-gating)
- ❌ No `EntitlementGate` references in 24 mock-debt pages — Recruiter Pro vs Free, Sales Navigator vs Free, Enterprise vs Team tier checks not enforced server-side.

## Gaps (32 total — 9 P0 / 11 P1 / 9 P2 / 3 P3)

### P0
1. **9 largest pages on `react-router-dom`/MOCK_** = 5,971 LOC (RecruiterJobsPage 938, RecruiterTalentSearchPage 794, RecruiterInterviewsPage 698, RecruiterManagementPage 672, EnterpriseHiringWorkspacePage 638, RecruiterPipelinePage 617, RecruiterOffersPage 561, EnterpriseDashboardPage 555, HireJobCreatePage 498). Largest debt block in any G-series domain.
2. **Talent search has no rich OpenSearch mappings** — current mapping is `title/body/tags/createdAt` only. Cannot filter by skills, seniority, location, availability, salary, visa, languages. The whole Recruiter Pro / Talent Search value prop fails without this.
3. **No semantic/vector search** — k-NN/dense_vector not configured. "Find me people similar to this hire" / natural-language talent queries impossible.
4. **No Boolean search parser** — recruiter-grade `(java OR kotlin) AND NOT recruiter AND ("san francisco" OR remote)` not supported.
5. **No saved-search → alert pipeline** — `talent_alerts` + diffing worker absent. Recruiters can't be notified when matching candidates surface.
6. **No CRM sync code** — adapters declared in `domain-adapter-map.ts` but no sync engine, field-mapping, conflict resolution, or two-way sync. CRM Connectivity scope unfulfilled.
7. **No data-enrichment provider** — Sales Navigator without Clearbit/Apollo/ZoomInfo can't populate email/phone/firmographics; severely degrades Lead/Account pages.
8. **Recruiter Pro surfaces lack dedicated NestJS modules** — TalentSearch/Pipeline/Offers/Outreach/Interviews each >500 LOC but lumped under `recruiter-job-management` — needs split for ownership + scaling.
9. **No EntitlementGate on Recruiter Pro / Sales Navigator pages** — paid features accessible without tier check (revenue leakage + violates `mem://features/access-gating`).

### P1
10. **/recruiter vs /hire route duplication** — per `mem://features/recruitment-unification`, /hire is the unified namespace; 22 /recruiter pages overlap with 6 /hire pages. Needs consolidation plan.
11. **No outreach sequencing engine** — `outreach_sequences` + `sequence_steps` + `sequence_enrollments` + scheduler absent (Outreach.io / Lemlist parity).
12. **No engagement/intent signals** — `engagement_signals`, `intent_signals` (Bombora/G2), `account_scores` absent. NavigatorEngagementSignalsPage + EnterpriseActivitySignalsPage are dead UI.
13. **No relationship-strength graph** — warm-intro requests (EnterpriseIntrosPage) need first/second-degree relationship inference; not modelled.
14. **No procurement RFP engine** — EnterpriseProcurementPage exists but `procurement_rfps` + `rfp_responses` tables absent.
15. **No private executive rooms** — EnterpriseRoomsPage exists but no end-to-end-encrypted room model.
16. **7 missing ML modules** (boolean parser, talent match, ICP score, intent, lookalike, send-time, reply classifier) — without these the AI value prop is shallow.
17. **No email tracking** — opens/clicks/replies for outreach not captured.
18. **No talent personas** — RecruiterMatchCenter has no persona model to match against.
19. **Missing 4 SDK files** (`enterprise-dashboard.ts`, `enterprise-hiring-workspace.ts`, `recruiter-dashboard.ts`, `search.ts`).
20. **6 missing enterprise NestJS modules** (procurement, matchmaking, rooms, events, intros, partner-discovery).

### P2
21. **No LinkedIn / GitHub / StackOverflow profile enrichment** for candidates.
22. **No diversity hiring metrics / EEO-1 reporting**.
23. **No interview scorecard analytics / inter-rater reliability**.
24. **No GDPR right-to-be-forgotten on candidate data** — required for EU sourcing.
25. **No 2-way calendar sync** beyond what booking module covers.
26. **No deal-stage forecasting** for Sales Navigator pipeline.
27. **No multi-tenant org isolation** verification on enterprise tables.
28. **No bulk-action audit** (mass message/tag/move) — risk of misuse without audit trail.
29. **No A11y review** of large data tables (RecruiterJobsPage 938 LOC).

### P3
30. **Playwright specs probe-only** — need full search → save → alert → outreach → reply → schedule flow.
31. **Mobile parity** — verify Recruiter Pro talent-search filters work on Flutter.
32. **No dark-mode / brand theming** for Enterprise white-label rooms.

## Recommended Run 2 (Build) priorities
1. Migrate the 9 largest pages off `react-router-dom`+MOCK_; split each (>500 LOC) into per-tab routes + add EntitlementGate.
2. Rebuild OpenSearch mappings for `users` index with full talent fields (skills, seniority, location geo_point, salary, visa, languages, embeddings dense_vector for k-NN).
3. Add `boolean_search_parser.py` + Boolean DSL → OpenSearch query converter.
4. Add semantic search: embed candidate profiles + jobs (Lovable AI gemini-embedding) → k-NN retrieval.
5. Add migration `0085_talent_intelligence.sql`: `talent_pools` + `pool_members`, `boolean_search_queries`, `talent_alerts`, `recruiter_seats`, `outreach_sequences` + `sequence_steps` + `sequence_enrollments`, `email_opens` + `email_clicks` + `email_replies`, `engagement_signals`, `intent_signals`, `account_scores`, `relationship_edges`, `talent_personas`.
6. Add migration `0086_enterprise_connect_depth.sql`: `enterprise_intros`, `enterprise_rooms`, `procurement_rfps` + `rfp_responses`, `partner_directory`, `crm_sync_log` + `crm_field_mappings` + `crm_sync_conflicts`.
7. Build `crm-sync` NestJS module + `apps/integrations/src/crm/{hubspot,salesforce}.ts` adapters + field-mapping UI + two-way sync worker + conflict resolution.
8. Connect HubSpot via Lovable connector (already supported); plan Salesforce custom OAuth.
9. Add data-enrichment adapter (Clearbit / Apollo / Lusha — BYOK) for Sales Navigator.
10. Split `recruiter-job-management` into `recruiter-talent-search`, `recruiter-pipeline`, `recruiter-offers`, `recruiter-outreach`, `recruiter-interviews` modules.
11. Add 6 enterprise modules (procurement, matchmaking, rooms, events, intros, partner-discovery).
12. Add 4 missing SDKs (`enterprise-dashboard.ts`, `enterprise-hiring-workspace.ts`, `recruiter-dashboard.ts`, `search.ts`).
13. Add 7 missing ML modules (boolean parser, talent match, ICP, intent, lookalike, send-time, reply classifier) + `relationship_strength.py`.
14. Add saved-search → alert worker (cron diffing index, push to in-app + email + Slack).
15. Add outreach sequencer (cron-driven email send + reply detection + auto-pause on reply).
16. Reconcile /hire vs /recruiter per `mem://features/recruitment-unification`.
17. Expand Playwright with full talent search → save → alert → sequence → reply → schedule lifecycle.

## Domain completion matrix (Run 1)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.
