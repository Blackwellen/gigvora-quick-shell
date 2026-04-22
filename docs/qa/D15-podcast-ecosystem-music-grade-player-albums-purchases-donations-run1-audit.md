# D15 — Podcast Ecosystem, Music-Grade Player, Albums, Purchases & Donations — Run 1 Audit

Date: 2026-04-18 · Group: G4 · Status: Run 1 (Audit) complete.

## Scope coverage

### Frontend pages (16 surfaces in `src/pages/podcasts/`)
- Discovery + listing: `PodcastsPage.tsx` (**860 LOC** monolith), `PodcastDiscoveryPage.tsx` (214).
- Show / episode / host: `PodcastShowDetailPage.tsx` (152), `PodcastEpisodeDetailPage.tsx` (90), `PodcastHostProfilePage.tsx` (105), `PodcastSeriesPage.tsx` (53).
- Player + queue + library: `PodcastPlayerPage.tsx` (160), `PodcastQueuePage.tsx` (66), `PodcastLibraryPage.tsx` (154).
- Creator: `PodcastCreatorStudioPage.tsx` (191), `PodcastRecorderPage.tsx` (114), `PodcastAnalyticsPage.tsx` (101), `PodcastCommentsPage.tsx` (124).
- Commerce: `PodcastPurchasesPage.tsx` (48), `PodcastSubscriptionsPage.tsx` (52), `PodcastDonationsPage.tsx` (60).

### Components
- ✅ `src/components/voice/VoiceNoteRecorder.tsx` (could back recorder).
- ❌ **Missing**: `<PodcastPlayer>` (mini + full + lock-screen-style), `<EpisodeCard>`, `<WaveformScrubber>`, `<ChapterList>`, `<TranscriptPanel>`, `<QueuePanel>`, `<DownloadManager>`, `<SubscribeButton>`, `<TipJar>`, `<PodcastRecorder>` (multi-track + noise-gate + chapter markers). No `src/components/podcasts/` directory.

### Backend
- ✅ `apps/api-nest/src/modules/podcasts/` — full module: controller, service, repository, dto, analytics, ml service.

### Migrations
- ✅ `0028_podcasts.sql` — `podcast_shows`, `podcast_episodes` (+ likely listens / subscribers / chapters; head shows shows+episodes confirmed).
- ❌ Need to verify presence of: `podcast_purchases`, `podcast_subscriptions`, `podcast_donations`, `podcast_queue`, `podcast_library` (saves), `podcast_listens` (resume position), `podcast_chapters`, `podcast_transcripts`, `podcast_comments`, `podcast_recordings` (multi-track sessions). Likely all missing — only `shows`+`episodes` shipped.

### ML
- ✅ `apps/ml-python/app/podcasts.py` — `/podcasts/rank-discovery` exists (deterministic).
- ❌ Missing: `/podcasts/recommend` (personalised "for you"), `/podcasts/similar`, `/podcasts/transcribe` (Whisper), `/podcasts/chapter-detect`, `/podcasts/auto-tag`, `/podcasts/show-affinity`.

### SDK
- ❌ **Zero** — no `packages/sdk/src/podcasts.ts`. Pages cannot be SDK-bound.

### Hooks
- ✅ `src/hooks/usePodcastsData.ts` exists.

### Mobile
- ✅ `apps/mobile-flutter/lib/features/podcasts/` exists.

### Tests
- ✅ `tests/playwright/podcasts.spec.ts` exists (probe).

### Mock / router debt
- 1 of 16 pages (`PodcastDiscoveryPage.tsx`) still imports `react-router-dom` / MOCK_. **Better than D14**, but `PodcastsPage.tsx` (860 LOC) needs split.

## Gaps (22 total — 6 P0 / 8 P1 / 6 P2 / 2 P3)

### P0
1. **No `packages/sdk/src/podcasts.ts`** — backend module + hook exist but no typed SDK contract; hook likely fetches directly. Blocks D08-style cross-app usage.
2. **No music-grade player component** — 16 pages exist but no shared `<PodcastPlayer>` with: persistent mini-player, lock-screen Media Session API, A/B loop, variable speed (0.5–3x), sleep timer, skip-silence, smart-speed, chapter jump, waveform scrub, transcript-sync, download-for-offline. The `mem://features/media-ecosystem` "music-grade player" rule is unmet.
3. **`PodcastsPage.tsx` (860 LOC)** monolith — must split into per-tab routes (discovery / library / queue / subscriptions).
4. **Recorder is single-component (`VoiceNoteRecorder` 1 file)** — no multi-track DAW-lite (host + co-host + intro music + ad-insert), no noise-gate, no chapter markers, no auto-leveler, no remote-guest WebRTC capture. `PodcastRecorderPage` (114) is too thin to back a real podcast.
5. **No commerce wiring** — `PodcastPurchasesPage`/`SubscriptionsPage`/`DonationsPage` exist as stubs but no Stripe checkout, no `podcast_purchases`/`podcast_subscriptions`/`podcast_donations` migrations confirmed, no webhook handler, no subscriber-only episode gating.
6. **Transcoding stub (D13/14 carry-over)** — audio uploads need ffmpeg → opus/mp3 ladder + chapter embedding + loudness normalisation (-16 LUFS for podcasts) + waveform.json generation; pipeline only HEAD-checks.

### P1
7. **No transcription** — Whisper STT not wired; transcripts/captions/searchable-text absent. No `podcast_transcripts` table.
8. **No chapter-detection ML** — auto-chapter from silence + transcript topic shifts.
9. **No realtime gateway** for live "now-playing" counters, new comment push, donation rail (during live recording).
10. **No download-for-offline** in web (no Service Worker cache) or guidance for mobile.
11. **No RSS ingest/import** — `podcast_shows.rss_url` exists but no worker pulls external podcasts (would let users import their existing show).
12. **No RSS publish** — generated public RSS feed (`/podcasts/{slug}/feed.xml`) for Apple/Spotify/Overcast distribution missing; this is industry baseline.
13. **No OpenSearch index** for show/episode/transcript text search.
14. **No moderation** — comment moderation, copyright music detection on ad-insert, age-gate for explicit episodes.

### P2
15. **Entitlement gating** missing — Free/Pro caps on episode count/length/storage (`mem://features/access-gating`).
16. **Analytics depth** — no completion-rate, drop-off heatmap, geo, retention curve, ad-impression counters.
17. **Donation tiers/recurring** — `PodcastDonationsPage` shows tiers visually (Supporter/Patron/Champion) but no Stripe Subscription wiring per tier.
18. **Resume across devices** — no `podcast_listens.position_sec` synced cross-device.
19. **Show artwork pipeline** — no 3000×3000 validation (Apple), no thumbnail cascade.
20. **Captions/transcripts a11y** — no WCAG transcript download, no chapter list ARIA.

### P3
21. **Playwright** — `podcasts.spec.ts` is probe-only; need play→pause→speed→chapter-jump→subscribe→tip flows.
22. **GDPR** — listen-history export/erase pathway not wired.

## Domain completion matrix (Run 1)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.

## Evidence
- 16 pages in `src/pages/podcasts/` listed above (top monolith: `PodcastsPage.tsx` 860).
- Backend: `apps/api-nest/src/modules/podcasts/` (controller/service/repo/dto/analytics/ml).
- Migration: `packages/db/migrations/0028_podcasts.sql` (shows + episodes confirmed; commerce/queue/library tables to be added).
- ML: `apps/ml-python/app/podcasts.py` (`/podcasts/rank-discovery`).
- Hook: `src/hooks/usePodcastsData.ts`.
- Mobile: `apps/mobile-flutter/lib/features/podcasts/`.
- Tests: `tests/playwright/podcasts.spec.ts`.

## Recommended Run 2 (Build) priorities
1. Add `packages/sdk/src/podcasts.ts` typed client; refactor `usePodcastsData` to consume SDK.
2. Build `<PodcastPlayer>` (persistent mini + full) + `<WaveformScrubber>` + `<ChapterList>` + `<TranscriptPanel>` + `<QueuePanel>` under `src/components/podcasts/`. Wire Media Session API, variable speed, sleep timer, smart-speed, A/B loop.
3. Split `PodcastsPage.tsx` (860) into per-tab routes.
4. Add migration `0081_podcast_commerce_player.sql`: `podcast_purchases`, `podcast_subscriptions`, `podcast_donations`, `podcast_queue`, `podcast_library_saves`, `podcast_listens`, `podcast_chapters`, `podcast_transcripts`, `podcast_comments`, `podcast_recordings`.
5. Wire Stripe checkout (one-time purchase, recurring subscription tiers, one-tap donation + recurring tip) + webhook → `podcast_subscriptions` activation; gate subscriber-only episodes.
6. Replace media-pipeline stub for audio: ffmpeg opus/mp3 ladder, -16 LUFS normalisation, waveform.json, chapter ID3 embed.
7. Add Whisper transcription worker + `/podcasts/transcribe`; add `/podcasts/recommend` + `/podcasts/similar`.
8. Build multi-track recorder (`<PodcastRecorder>`) with WebRTC remote guest capture, noise-gate, chapter markers, ad-insert.
9. Add RSS publish route (`/podcasts/{slug}/feed.xml`) and RSS ingest worker for `rss_url`.
10. Add WS gateway for live counters/comments/donations.
11. Add OpenSearch ingest for shows/episodes/transcripts.
12. Expand Playwright `podcasts.spec.ts` to cover play→speed→chapter→subscribe→tip→download-offline.
