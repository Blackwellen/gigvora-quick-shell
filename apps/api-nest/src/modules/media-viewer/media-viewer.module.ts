import { Module } from '@nestjs/common';
import { MediaViewerController } from './media-viewer.controller';
import { MediaViewerService } from './media-viewer.service';
import { MediaViewerRepository } from './media-viewer.repository';
import { MediaViewerMlService } from './media-viewer.ml.service';
import { MediaViewerAnalyticsService } from './media-viewer.analytics.service';
import { WorkspaceModule } from '../workspace/workspace.module';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Domain 20 — Media Viewer, File Preview, Gallery & Interactive Attachments.
 *
 * 3rd-party / connector surface (see docs/architecture/domain-20-media.md):
 *   - Storage/CDN  : S3-compatible (apps/integrations/src/storage/s3.ts) +
 *                    apps/media-pipeline (signed PUT/GET, BullMQ transcode worker)
 *   - Transcoding  : ffmpeg/sharp via media-pipeline worker host
 *   - Moderation   : pluggable (AWS Rekognition / Hive / Sightengine) — adapter category 'ai'
 *   - Realtime     : Socket.IO via NotificationsGateway (events: media.created/updated/
 *                    moderated/archived/restored/processing/ready/viewed/liked/downloaded,
 *                    gallery.created/updated/deleted, attachment.added)
 *   - Audit        : WorkspaceModule.AuditService
 *   - ML           : apps/ml-python /media/* (score-quality, rank-gallery, moderation-hint)
 *   - Analytics    : apps/analytics-python /media/insights
 */
@Module({
  imports: [WorkspaceModule, NotificationsModule],
  controllers: [MediaViewerController],
  providers: [MediaViewerService, MediaViewerRepository, MediaViewerMlService, MediaViewerAnalyticsService],
  exports: [MediaViewerService],
})
export class MediaViewerModule {}
