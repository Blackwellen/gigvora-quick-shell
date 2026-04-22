import { Module } from '@nestjs/common';
import { PodcastsController } from './podcasts.controller';
import { PodcastsService } from './podcasts.service';
import { PodcastsRepository } from './podcasts.repository';
import { PodcastsMlService } from './podcasts.ml.service';
import { PodcastsAnalyticsService } from './podcasts.analytics.service';
import { WorkspaceModule } from '../workspace/workspace.module';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Domain 21 — Podcast Discovery, Player, Recorder, Library, Albums & Purchases.
 *
 * 3rd-party / connector surface (see docs/architecture/domain-21-podcasts.md):
 *   - Storage/CDN     : S3-compatible (apps/integrations/src/storage/s3.ts) for raw + transcoded audio
 *   - Transcoding     : apps/media-pipeline (BullMQ ffmpeg worker) — produces HLS + waveform
 *   - Payments        : Lovable Payments → Stripe / Paddle (apps/integrations/src/payments/stripe.ts);
 *                       multi-step checkout (cart → details → review → confirm → success/failure)
 *   - Donations       : same payment provider, kind='donation'
 *   - RSS/Distribution: optional outbound feed at /api/v1/podcasts/shows/:id/rss (future)
 *   - Realtime        : Socket.IO via NotificationsGateway (events: podcast.show.*, podcast.episode.*,
 *                       podcast.album.*, podcast.queue.*, podcast.recording.*, podcast.purchase.*)
 *   - ML              : apps/ml-python /podcasts/* (rank-discovery, recommend-next, score-recording)
 *   - Analytics       : apps/analytics-python /podcasts/insights
 *   - Audit           : WorkspaceModule.AuditService
 */
@Module({
  imports: [WorkspaceModule, NotificationsModule],
  controllers: [PodcastsController],
  providers: [PodcastsService, PodcastsRepository, PodcastsMlService, PodcastsAnalyticsService],
  exports: [PodcastsService],
})
export class PodcastsModule {}
