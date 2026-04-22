import { Module } from '@nestjs/common';
import { InterviewPlanningController } from './interview-planning.controller';
import { InterviewPlanningService } from './interview-planning.service';
import { InterviewPlanningRepository } from './interview-planning.repository';
import { InterviewPlanningMlService } from './interview-planning.ml.service';
import { InterviewPlanningAnalyticsService } from './interview-planning.analytics.service';

/**
 * Domain 29 — Interview Planning, Scheduling, Scorecards & Internal Panels.
 *
 * Single-sweep pack: panels + interviews + scorecards + calibrations
 * with optimistic concurrency, idempotent reschedule + submit, conflict
 * detection, deterministic scorecard summaries, and Socket.IO emits on
 * every state transition.
 */
@Module({
  controllers: [InterviewPlanningController],
  providers: [
    InterviewPlanningService,
    InterviewPlanningRepository,
    InterviewPlanningMlService,
    InterviewPlanningAnalyticsService,
  ],
  exports: [InterviewPlanningService],
})
export class InterviewPlanningModule {}
