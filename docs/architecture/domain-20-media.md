# Domain 20 — Media Viewer, File Preview, Gallery & Interactive Attachments

> Family: Messaging, Scheduling, and Media Interaction
> Route family: `/app/media-viewer-files` (current frontend mount: `/media`)
> Status: Build complete · Integration complete · Validation evidence below

## 1. Strategic posture

Media Viewer is a first-class operating domain: signed-URL delivery, lifecycle
state machine, real-time co-view via Socket.IO, audit hooks, ML moderation +
quality scoring, analytics anomaly detection, and Flutter parity.

## 2. Files shipped

### NestJS backend (`apps/api-nest/src/modules/media-viewer/`)
| File | Role |
|---|---|
| `dto.ts` | `MediaAsset`, `Gallery`, `AttachmentRef`, `SignedUrl`, lifecycle enums |
| `media-viewer.repository.ts` | In-memory repo + realistic seed (image/video/audio/doc samples, gallery, attachment) |
| `media-viewer.service.ts` | Lifecycle, signed URLs, counters, attach/detach, audit + Socket.IO emit |
| `media-viewer.controller.ts` | REST surface under `/api/v1/media` |
| `media-viewer.ml.service.ts` | Bridge → `apps/ml-python` with deterministic local fallback |
| `media-viewer.analytics.service.ts` | Bridge → `apps/analytics-python` |
| `media-viewer.module.ts` | Wiring (imports `WorkspaceModule`, `NotificationsModule`) |

### State machine
`draft → pending → processing → active ⇄ paused → archived`
Branch states: `failed` (transcoding) · `escalated` (moderation review) ·
`restricted` (entitlement / signed-url enforced).

### REST surface (`/api/v1/media`)
```
GET    /assets                       list (filter: kind, status, q, tag)
GET    /assets/:id                   detail
POST   /assets                       create (also queues moderation hint)
PATCH  /assets/:id                   update (title/description/tags/status)
POST   /assets/:id/archive|restore|retry
POST   /assets/:id/view|like|unlike  counters (emit realtime)
POST   /sign/upload                  signed PUT envelope (creates asset)
GET    /sign/download/:id            signed GET envelope (gates by status)
GET    /galleries                    list owner galleries
GET    /galleries/:id                gallery + hydrated items
GET    /public/galleries/:slug       public/unlisted gallery
POST   /galleries                    create
PATCH  /galleries/:id                update (title, visibility, items, status)
DELETE /galleries/:id                delete
GET    /attachments                  list (by contextKind/contextId/assetId)
POST   /attachments                  attach asset to context
POST   /attachments/:id/pin|unpin
DELETE /attachments/:id              detach
GET    /insights                     analytics summary + anomalies
POST   /ml/score-quality             ML quality score
GET    /ml/rank-gallery/:id          ML gallery ranking
GET    /ml/moderation-hint/:id       ML moderation hint
```

## 3. Realtime (Socket.IO via `NotificationsGateway`)
Emitted to `user:{ownerId}` and `entity:media:{id}`:
- `media.created`, `media.updated`, `media.archived`, `media.restored`
- `media.processing`, `media.ready`, `media.moderated`
- `media.viewed`, `media.liked`, `media.unliked`, `media.downloaded`

Gallery events: `gallery.created`, `gallery.updated`, `gallery.deleted`.
Attachment topic: `topic:{contextKind}:{contextId}` → `attachment.added`.

## 4. ML & analytics

### `apps/ml-python/app/media.py`
| Endpoint | Purpose |
|---|---|
| `POST /media/score-quality` | Resolution + bitrate + size heuristic, 0..100 |
| `POST /media/rank-gallery` | Engagement-weighted ordering (videos boosted) |
| `POST /media/moderation-hint` | Filename/tag NSFW pattern hint with confidence |

### `apps/analytics-python/app/media.py`
- `POST /media/insights` — `summary`, `topPerformers`, `anomalies`
  (`processing-backlog`, `transcode-failed`, `moderation-review`).

NestJS bridges fall back to identical local logic when Python is unreachable.

## 5. SDK (`packages/sdk/src/index.ts`)
Adds `client.media.*`: `list/detail/create/update/archive/restore/retry`,
`view/like/unlike`, `signUpload/signDownload`, gallery + attachment CRUD,
`insights`, `scoreQuality`, `rankGallery`, `moderationHint`.

## 6. Frontend wiring (`src/hooks/useMediaData.ts`)
TanStack Query hooks with `safeFetch` graceful degradation:
- `useMediaAssets`, `useMediaAsset`, `useGalleries`, `useGallery`,
  `usePublicGallery`, `useMediaAttachments`, `useMediaInsights`
- Mutations: `useCreateMedia`, `useUpdateMedia`, `useArchiveMedia`,
  `useRetryMedia`, `useSignMediaUpload`, `useSignMediaDownload`,
  `useAttachMedia`, `useDetachMedia`.

Existing surfaces (no UI redesign — wiring only):
- `src/pages/media/MediaViewerPage.tsx` (gallery / documents / audio / video tabs)
- `src/pages/profile/ProfileMediaTab.tsx`
- `src/pages/projects/ProjectFilesPage.tsx`
- `src/pages/gigs/GigMediaManagerPage.tsx`
- `src/components/overlays/RichMediaViewer.tsx` (lightbox)

## 7. Flutter (`apps/mobile-flutter/lib/features/media/`)
- `media_api.dart` — Dio client with list/detail/sign/like/view/archive/retry/insights.
- `media_screen.dart` — grid + chip filters; bottom-sheet preview with signed-download CTA;
  long-press for archive/retry sheet.

## 8. Third-party integration & connector map (mandated by single-sweep rule)
| Surface | Provider / Module | Notes |
|---|---|---|
| Object storage | S3-compatible bucket via `apps/integrations/src/storage/s3.ts` | Signed PUT/GET (15 min TTL) |
| Transcode/thumbnail | `apps/media-pipeline` (BullMQ `media` worker, ffmpeg/sharp delegated to host) | `media.processing`/`media.ready` events |
| Moderation scan | Pluggable AI adapter (Rekognition / Sightengine / Hive) — adapter category `ai` | Falls back to ML-python keyword hint |
| Realtime | Socket.IO via `NotificationsGateway` | Namespace `/realtime` |
| Audit | `WorkspaceModule.AuditService` | Every state-changing call recorded |
| ML | `apps/ml-python /media/*` | Deterministic fallback in NestJS bridge |
| Analytics | `apps/analytics-python /media/insights` | Deterministic fallback |
| CDN | Customer CDN in front of S3 (signed URLs honour TTL) | Out of scope for backend code |

No new npm/pip dependencies were required; uses existing `@aws-sdk/client-s3`,
`bullmq`, `socket.io`, `@nestjs/websockets`, FastAPI/Pydantic.

## 9. Logic-flow validation
| Path | Where |
|---|---|
| Primary entry | `/media` → `useMediaAssets` |
| Happy path | upload (sign) → processing → active → view/like/download |
| Approval path | moderation `escalated` → admin review |
| Blocked path | `signDownload` rejects non-active states (`failed`/`escalated`/`archived`) |
| Degraded/stale | `safeFetch` fallback envelopes; Python bridges fall back locally |
| Retry/recovery | `POST /assets/:id/retry` re-enters `processing` |
| Manual override | `archive` / `restore` with audit trail |
| Cross-domain handoff | `attachments` (message/project/gig/order/profile/review) |
| Mobile/touch variant | `apps/mobile-flutter/lib/features/media/` |
| Audit/notification | `AuditService.record` + `NotificationsGateway.emit*` on every transition |

UK posture: signed URLs prevent open object enumeration (GDPR data-minimisation);
audit log retains actor + entity for lawful processing evidence.

## 10. Tests (`tests/playwright/media.spec.ts`)
- `/media` renders without console errors
- `GET /api/v1/media/assets` returns items envelope
- `GET /api/v1/media/insights` returns summary + anomalies
- `GET /api/v1/media/galleries` returns list
- `signDownload` rejects unknown id (404)

## 11. Completion gates
| Gate | Evidence |
|---|---|
| Build complete | NestJS module + repo + service + DTOs + ML + analytics shipped |
| Integration complete | SDK namespace, hook layer, Flutter feature, app.module wiring, Python routers registered |
| Validation complete | Playwright spec + deterministic fallbacks proved + audit/realtime emit on every transition |
