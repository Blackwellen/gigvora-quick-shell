/**
 * Group 2 + FD-12 — Global ML bridge module.
 *
 * Exposes:
 *   • MlClient            — HTTP client with timeout/retry/circuit/Zod/metrics
 *   • MlMetricsService    — Prometheus snapshot store (read by /internal/ml-metrics)
 *   • ModerationClient    — write-path guard used by feed/comment/profile/etc.
 *   • MlRegistrySyncService — keeps `ml_models` in sync with the Python /registry
 */
import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MlClient } from './ml-client';
import { MlMetricsService } from './ml-metrics.service';
import { MlMetricsController } from './ml-metrics.controller';
import { ModerationClient } from './moderation-client';
import { MlRegistrySyncService } from './ml-registry-sync.service';

@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [MlClient, MlMetricsService, ModerationClient, MlRegistrySyncService],
  controllers: [MlMetricsController],
  exports: [MlClient, MlMetricsService, ModerationClient, MlRegistrySyncService],
})
export class MlBridgeModule {}
