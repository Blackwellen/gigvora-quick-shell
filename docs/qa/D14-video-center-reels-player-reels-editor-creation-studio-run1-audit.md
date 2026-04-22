# D14 — Video Center, Reels Player, Reels Editor & Creation Studio — Run 1 Audit

Date: 2026-04-18 · Group: G4 · Status: Run 1 (Audit) complete.

## Scope coverage

### Frontend pages (18 surfaces)
- **Video Center**: `src/pages/media/VideoDiscoveryPage.tsx` (178), `VideoPlayerDetailPage.tsx` (221), `VideoStudioPage.tsx` (170), `VideoUploadStudioPage.tsx` (278), `MediaHomePage.tsx`, `MediaLibraryPage.tsx`, `MediaAnalyticsPage.tsx`, `CreatorDiscoveryPage.tsx`, `MediaViewerPage.tsx` (657 — D13 overlap).
- **Reels**: `ReelsDiscoveryPage.tsx` (161), `ReelsEditingStudioPage.tsx` (233), `ReelsOverlayPage.tsx` (214).
- **Creation Studio**: `src/pages/creation-studio/` — `ReelBuilderPage.tsx` (326), `AssetLibraryPage.tsx`, `PublishReviewPage.tsx`, `ScheduledContentPage.tsx`, `StudioDraftsPage.tsx` (160), `StudioAnalyticsPage.tsx` (174).
- **Community Creation Studio monolith**: `src/pages/community/CreationStudioPage.tsx` (**984 LOC** — largest D14 surface).
- **AI studios (adjacent)**: `AIVideoStudioPage.tsx` (165), `AIImageStudioPage.tsx` (141).

### Shared media components
- `src/components/media/VideoViewer.tsx` (489) — only player, per `mem://tech/video-viewer-sdk` rule.
- `src/components/media/VideoThumbnailPicker.tsx` (102).
- ❌ **Missing**: `<ReelsFeed>` (vertical scroll/snap), `<ReelsPlayer>` (single-reel TikTok-style), `<ReelsEditor>` canvas (trim/cut/captions/stickers/music), `<VideoTimeline>` editor primitive, `<CreatorStudioShell>`, `<UploadProgressBar>`, `<PublishWizard>`. No `src/components/reels/` directory exists.

### Backend (NestJS)
- ✅ `apps/api-nest/src/modules/creation-studio/`, `job-posting-studio/`, `live-streaming/` (D58 schema), `media-viewer/` (D26).
- ❌ **No `videos` module**, **no `reels` module**, **no `creator-publishing` module**, **no `feed-ranking` module**. Video/reel discovery/upload/feed/likes/comments/saves/views have nowhere to call.

### Migrations
- ✅ `0058_live_streaming.sql` (RTMP/SRT ingest), `0026_media_viewer.sql` (playback analytics), `0067_file_storage.sql` (objects).
- ❌ No `videos`, `reels`, `reel_drafts`, `reel_clips`, `creator_publish_jobs`, `video_engagements` (likes/saves/shares), `feed_ranking` tables. `0073_launchpad_studio_tasks_team.sql` is unrelated.

### ML
- ❌ **Zero D14 ML services** in `apps/ml-python/app/`. No `reels.py`, `videos.py`, `feed.py` for ranking/recommendation/trending. No `media_moderation.py` for NSFW/copyright/audio fingerprint.

### SDK
- ✅ `packages/sdk/src/job-posting-studio.ts`.
- ❌ **No SDK** for any D14 surface — no `videos.ts`, `reels.ts`, `creation-studio.ts`, `creator-publishing.ts`. All 18 pages have nothing typed to call.

### Hooks
- ✅ `useJobPostingStudio.ts`.
- ❌ No `useVideos`, `useReels`, `useReelsFeed`, `useCreatorStudio`, `usePublishJob`, `useReelDraft`, `useStudioAnalytics`.

### Workers / pipeline
- ⚠️ `apps/media-pipeline/src/index.ts` is a stubbed transcoder (D13 finding) — no HLS variant ladder, no thumbnail extraction, no audio waveform, no aspect-ratio detection (9:16 vs 16:9 routing reels vs videos).

### Realtime / Mobile / Tests
- ❌ No reels/video WS gateway (live like counts, view counts, new-comment push).
- ❌ No `apps/mobile-flutter/lib/features/reels/` or `videos/` feature folder; only D58 live exists.
- ❌ No Playwright `reels.spec.ts` / `video-center.spec.ts` / `creation-studio.spec.ts`.

## Gaps (24 total — 8 P0 / 8 P1 / 6 P2 / 2 P3)

### P0 — blockers
1. **All 17 D14 frontend pages use `react-router-dom` and MOCK_ data** (verified by grep). Zero are SDK-bound. Includes the 984 LOC `CreationStudioPage` monolith.
2. **No `videos` NestJS module** — discovery, detail, upload-finalize, view-tracking, like/save/share, comments, watch-history all missing.
3. **No `reels` NestJS module** — vertical feed page, single-reel fetch, like/comment, follow-during-watch, hashtag/sound rails all missing.
4. **No `creator-publishing` module** — publish jobs (draft → moderated → encoded → scheduled → published), schedule queue, multi-platform fan-out (web/reel/short/feed), all absent.
5. **Missing core components**: `<ReelsFeed>` (snap-scroll, viewport autoplay, prefetch ±1, swipe-to-next), `<ReelsPlayer>` (single muted-tap-to-unmute, double-tap like, captions overlay, share/save sidebar), `<ReelsEditor>` (multi-clip trim, transitions, music picker, captions/stickers, voice-over). The `mem://features/media-ecosystem` "TikTok-level reels behavior" rule is unmet.
6. **No SDK** for any D14 surface (`videos`, `reels`, `creation-studio`, `creator-publishing`).
7. **No ML feed-ranking** — reels/videos discovery is not personalised; no `apps/ml-python/app/{reels,videos,feed}.py`. No trending/sound-rail/hashtag-rail compute.
8. **Transcoding is a stub** (D13 carry-over). Without real ffmpeg/HLS ladder + 9:16 detection + thumbnail extraction, reels can't render at multiple bitrates and uploads finish in an unplayable state.

### P1
9. **No `videos`/`reels` migrations** — engagement (likes/saves/shares/comments) and aggregate counters absent. View dedup window not modelled.
10. **No moderation pipeline** — NSFW/violence classifier, audio copyright fingerprint (e.g., AcoustID/audible-magic stub), text/caption profanity not wired pre-publish.
11. **No realtime gateway** for live like-count, view-count, new-comment push on hot reels/videos.
12. **No saved-search / hashtag / sound page** — discovery rails (`#hashtag`, sound usage feed) absent.
13. **No `creator_publish_jobs` queue worker** — schedule-for-later / cross-post / retry-on-fail not implemented.
14. **No CDN signing for reels manifests** — every reel re-signs HLS playlist on every viewer; no edge caching guidance.
15. **No drafts autosave** in `ReelBuilderPage` (326) — closing tab loses edits; no `reel_drafts` table.
16. **No mobile parity** — Flutter `reels`/`videos` features missing; this is the highest-stakes mobile surface (`mem://tech/mobile-optimization-strategy`).

### P2
17. **No analytics events** for reel watch-through %, swipe-away time, sound-tap, save, share-target.
18. **No entitlement gating** — Free/Pro/Team tiers should cap upload size/length/concurrent encodes (`mem://features/access-gating`).
19. **No OpenSearch index** for video/reel title/caption/hashtag/transcript.
20. **No captions/transcripts pipeline** — Whisper STT not wired; required for accessibility + searchability.
21. **No watch-history table** for resume + "continue watching".
22. **CreationStudioPage (984 LOC)** monolith — must split into per-tab routes (drafts, scheduled, analytics, assets, publish, reel builder, video upload).

### P3
23. **No Playwright** — needs `reels.spec.ts` (swipe + autoplay + like + comment), `video-center.spec.ts` (browse → play → save), `creation-studio.spec.ts` (upload → trim → publish → appears in feed).
24. **GDPR**: viewer history retention/export-erase pathway not wired for reels/videos.

## Domain completion matrix (Run 1)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.

## Evidence
- Pages: `src/pages/media/{Reels{Discovery,EditingStudio,Overlay}Page,Video{Discovery,PlayerDetail,Studio,UploadStudio}Page,Media{Home,Library,Analytics,Viewer}Page,CreatorDiscoveryPage}.tsx`, `src/pages/creation-studio/{ReelBuilder,AssetLibrary,PublishReview,ScheduledContent,StudioDrafts,StudioAnalytics}Page.tsx`, `src/pages/community/CreationStudioPage.tsx` (984).
- Components: `src/components/media/{VideoViewer (489), VideoThumbnailPicker (102)}.tsx`. **Missing**: `src/components/reels/*`, `src/components/studio/*`.
- Backend present: `apps/api-nest/src/modules/{creation-studio,job-posting-studio,live-streaming,media-viewer}/`. **Missing**: `videos/`, `reels/`, `creator-publishing/`, `feed-ranking/`.
- ML present: none for D14. **Missing**: `apps/ml-python/app/{reels,videos,feed,media_moderation}.py`.
- SDK: only `packages/sdk/src/job-posting-studio.ts`. **Missing**: `videos.ts`, `reels.ts`, `creation-studio.ts`, `creator-publishing.ts`.
- Migrations: `0058_live_streaming`, `0026_media_viewer`, `0067_file_storage`. **Missing**: videos / reels / engagements / drafts / publish jobs.
- All 17 D14 frontend pages confirmed using `react-router-dom` + MOCK_ via grep.

## Recommended Run 2 (Build) priorities
1. Create `apps/api-nest/src/modules/{videos, reels, creator-publishing}/` with controllers + services + DTOs.
2. Add migration `0080_videos_reels_engagement.sql`: `videos`, `reels`, `reel_drafts`, `reel_clips`, `video_engagements (kind ∈ like|save|share|view)`, `video_comments`, `creator_publish_jobs`, `watch_history`.
3. Add SDK `packages/sdk/src/{videos,reels,creation-studio,creator-publishing}.ts` with full types.
4. Build `<ReelsFeed>` (snap-scroll + viewport IO + ±1 prefetch), `<ReelsPlayer>` (tap-mute, double-tap-like, side rail, captions), `<ReelsEditor>` (multi-clip timeline, trim, music, captions, stickers, voice-over) under `src/components/reels/`. Wire `mem://tech/video-viewer-sdk` hover rule.
5. Replace `react-router-dom` in all 17 pages with `@tanstack/react-router`; bind to new SDK; delete MOCK_.
6. Split `CreationStudioPage` (984) into per-tab routes; add `reel_drafts` autosave.
7. Add ML services: `reels.py` (rank + trending sounds + hashtag rails), `videos.py` (recommend), `feed.py` (personalised home), `media_moderation.py` (NSFW + audio fingerprint stub).
8. Replace media-pipeline stub with real ffmpeg HLS ladder (240/480/720/1080) + 9:16 detection + thumbnail at 4 timestamps + Whisper captions.
9. Add WS gateway for live counters + new comments; add `creator_publish_jobs` worker for scheduled publish + retry.
10. Add Flutter `apps/mobile-flutter/lib/features/{reels,videos,creation_studio}/` mirroring web SDK.
11. Add OpenSearch index for video/reel/caption/transcript/hashtag.
12. Add Playwright `reels.spec.ts`, `video-center.spec.ts`, `creation-studio.spec.ts`.
