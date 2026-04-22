# D13 — Files, Galleries, Media Viewer, Attachments & In-Context Preview — Run 1 Audit

Date: 2026-04-18 · Group: G4 · Status: Run 1 (Audit) complete.

## Scope coverage
- **Frontend pages/components**:
  - `src/pages/media/MediaViewerPage.tsx` (657 LOC) — primary viewer surface.
  - `src/components/overlays/RichMediaViewer.tsx` (391) — modal/lightbox viewer used across Feed/Profiles/Inbox.
  - `src/components/overlays/QuickPreviewDrawer.tsx` (189) — entity quick-preview overlay (`mem://tech/overlay-system`).
  - `src/components/media/`: `VideoThumbnailPicker.tsx`, `VideoViewer.tsx` (others belong to D14 reels/video).
  - **Missing surfaces**: dedicated `FilesPage`/Drive, generic `GalleryGrid`, `AttachmentList`, `FilePreviewCard`, `UploadZone` (referenced by `mem://features/creation-studio` Block Editor but no shared component found).
- **Backend (1 NestJS module)** — `media-viewer` only (sessions + segments analytics). ❌ no `files` / `attachments` / `gallery` / `storage` module despite migration `0067_file_storage.sql` having full DDL (storage_buckets, storage_objects, storage_multipart_uploads).
- **Migrations** ✅ `0026_media_viewer.sql`, `0067_file_storage.sql` (excellent: buckets, objects with virus-scan + multipart). ❌ no `attachments` join table for messages/projects/profiles/posts.
- **ML** ✅ `media.py` (playback metrics). No previewer/transcode service in Python (delegated to `apps/media-pipeline`).
- **SDK** ❌ **zero D13 SDK modules** — no `media-viewer.ts`, no `files.ts`, no `attachments.ts`. `packages/sdk/src/` shows none in this domain.
- **Hooks** ✅ `useMediaData.ts`. ❌ no `useFiles`, `useAttachments`, `useFileUpload`, `useSignedUrl`.
- **Media pipeline** ✅ `apps/media-pipeline/src/index.ts` — S3 sign upload/download (15-min TTL), BullMQ `media` worker. ⚠️ **transcoding/thumbnail/sharp is a STUB** ("delegated to an external worker host"); only HEAD-checks the asset.
- **Playwright** ✅ `media.spec.ts` (probe).

## Gaps (22 total — 6 P0 / 8 P1 / 6 P2 / 2 P3)

### P0 — blockers
1. **No `files` / `attachments` / `storage` NestJS module** despite full DDL in `0067_file_storage.sql`. Sign-URL, multipart-init/complete, list-by-owner, attach-to-entity, delete, virus-scan webhook → all missing controllers. Frontend `UploadZone` flows have nowhere to call.
2. **No SDK** for any D13 surface — `media-viewer`, `files`, `attachments` all missing in `packages/sdk/src/`. Components calling `apps/media-pipeline` directly is wrong layering.
3. **Transcoding pipeline is a stub** — `apps/media-pipeline/src/index.ts` admits the worker only HEAD-checks the asset; no ffmpeg/sharp execution, no variant generation (thumbnails, mp4 720/480, hls, audio waveform, pdf preview pages, image webp/avif). All `variants` jsonb arrays in `storage_objects` will stay empty.
4. **No virus-scan integration** — `storage_objects.scan_status` defaults to `pending` and there's no ClamAV / Lambda virus-scan / S3 EventBridge wiring; uploads can never reach `clean` status, blocking any flow that gates on it.
5. **No attachments join table** — `0067_file_storage` covers raw objects but there's no polymorphic `attachments` (entity_type, entity_id, object_id, position) bridging files to messages/projects/posts/profiles/proposals/deliverables. Every D11 `ProjectFilesPage`, D08 inbox attachment, D06 profile gallery, D11 deliverable submission needs this.
6. **`MediaViewerPage` (657 LOC)** is mock-driven without an SDK to bind to — no `sdk.mediaViewer.*` for sessions, segments, share links, comments, captions/transcripts, hotspots/annotations.

### P1
7. **No CORS guidance / bucket policy** wired — per `aws_s3` knowledge, bucket needs CORS for browser PUTs to work; not documented in repo.
8. **No multipart-upload UI** — `storage_multipart_uploads` DDL exists for ≥10k parts but no client-side chunked uploader; large videos/zips will fail.
9. **No PDF / Office / Figma preview** — `RichMediaViewer` (391) likely covers image/video/audio only. Office docs (docx/xlsx/pptx) and PDFs need previewer (e.g., `pdf.js` + libreoffice→pdf in pipeline).
10. **No CDN signing rotation / hotlink protection** — signed URLs are 15min, but no CDN (CloudFront/R2 public) layer for public profile media → every avatar/thumb signs on demand.
11. **No image safety / NSFW classifier** — uploads to feed/profile/reels need moderation pre-publish; no `media_moderation.py` in `apps/ml-python/app/`.
12. **No EXIF strip / privacy** — uploads should strip GPS EXIF for GDPR; not visible in pipeline.
13. **No realtime upload progress** — `storage_objects.upload_status` flips pending→complete server-side but no WS gateway pushes progress to UI; large uploads look frozen.
14. **No cross-domain preview wiring** — D08 inbox attachments, D11 project files, D06 profile gallery, D14 reels thumbnails, D15 podcast cover art, D16 webinar slides all should funnel through one `<AttachmentPreview>` + `RichMediaViewer` pair; today each surface likely re-implements.

### P2
15. **Mobile parity** — no Flutter `files`/`media_viewer` feature folder; only video/reels work via D14.
16. **Audit trail** — file downloads of sensitive docs (contracts, deliverables, payslips) should log to admin audit; not wired.
17. **Entitlements** — storage quotas per Free/Pro/Team/Enterprise (`mem://features/access-gating`) — no quota enforcement in `media-pipeline` or `storage_objects`.
18. **OpenSearch** — file search by filename/owner/mime not indexed; `apps/search-indexer/src/index.ts` has no `storage_objects` ingest.
19. **Retention/lifecycle** — `storage_buckets.retention_days` exists but no worker enforces deletion.
20. **Captions/transcripts** — A8 player completion requires WebVTT track ingestion + AI transcription (Whisper); not present.

### P3
21. **`MediaViewerPage` (657)** monolith — extract per-mime sub-renderer (image, video, audio, pdf, doc, code, 3d).
22. **Playwright `media.spec.ts`** is probe-only; need upload→scan→preview→download→delete + multipart resume scenarios.

## Domain completion matrix (Run 1 status)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.

## Evidence
- `src/pages/media/MediaViewerPage.tsx` (657), `src/components/overlays/{RichMediaViewer.tsx (391), QuickPreviewDrawer.tsx (189)}`, `src/components/media/{VideoThumbnailPicker,VideoViewer}.tsx`.
- `apps/api-nest/src/modules/media-viewer/`, `packages/db/migrations/{0026_media_viewer,0067_file_storage}.sql`, `apps/media-pipeline/src/index.ts` (transcoding stub), `apps/ml-python/app/media.py`, `src/hooks/useMediaData.ts`, `tests/playwright/media.spec.ts`.

## Recommended Run 2 (build) priorities
1. **Create `apps/api-nest/src/modules/files/`** (controller + service) wrapping `storage_buckets` + `storage_objects` + `storage_multipart_uploads` + sign-upload/download + multipart init/complete + list-by-owner + delete + scan-callback.
2. **Add `attachments` migration** — polymorphic join `(entity_type, entity_id, object_id, position, role)` with indexes by entity and by object.
3. **Add SDK** `packages/sdk/src/{files,media-viewer,attachments}.ts` and export from index.
4. **Replace `media-pipeline` stub** with real ffmpeg (mp4/hls/thumbnail/waveform) + sharp (image variants webp/avif/thumb) + libreoffice-headless (doc→pdf) + pdf.js page render. Run on a separate worker host (not the Edge Worker) given `child_process` ban in TanStack server runtime.
5. **Wire virus-scan**: S3 EventBridge → ClamAV Lambda or Cloudflare R2 → `scan-callback` endpoint; set `scan_status` and reject on `infected`.
6. **Build shared `<AttachmentList>`, `<UploadZone>` (multipart-aware), `<FilePreviewCard>` components** wired to the new `files` SDK; consume in D08 inbox, D11 project files/deliverables, D06 profile gallery.
7. **Realtime upload progress gateway** (`files.gateway.ts`) so chunked uploads stream pct.
8. **Add `media_moderation.py`** (NSFW + PII detection) gating `upload_status: complete → published`.
9. **Strip EXIF** in pipeline; add `media_safety` worker.
10. **Office/PDF preview** — libreoffice + pdf.js viewer; expand `RichMediaViewer` with mime-router.
11. **Quota enforcement** per entitlement tier; add `storage_quota` table + check in sign-upload.
12. **Expand Playwright** — full upload→scan→variant→preview→download→delete and multipart resume; PDF + DOCX preview render assertions.
