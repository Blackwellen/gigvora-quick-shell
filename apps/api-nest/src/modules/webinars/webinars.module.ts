import { Module } from '@nestjs/common';
import { WebinarsController } from './webinars.controller';
import { WebinarsService } from './webinars.service';
import { WebinarsRepository } from './webinars.repository';
import { WebinarsMlService } from './webinars.ml.service';
import { WebinarsAnalyticsService } from './webinars.analytics.service';

/**
 * Domain 22 — Webinars (Discovery, Live Rooms, Replays, Donations, Sales).
 * Live rooms use Jitsi (free meet.jit.si by default; tenant-overridable).
 * Replays use the local-first storage adapter; promotable to R2/S3 later.
 */
@Module({
  controllers: [WebinarsController],
  providers: [WebinarsService, WebinarsRepository, WebinarsMlService, WebinarsAnalyticsService],
  exports: [WebinarsService],
})
export class WebinarsModule {}
